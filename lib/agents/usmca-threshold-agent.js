/**
 * USMCA Threshold Agent
 * Fetches current 2025 USMCA Regional Value Content (RVC) thresholds
 *
 * Purpose: Replace static database thresholds with AI-verified current policy
 * Data Sources: USMCA Annex 4-B, Chapter 4, USTR Federal Register
 *
 * Architecture:
 * 1. Query AI for current threshold based on HS code
 * 2. Cache result with timestamp in database
 * 3. Return cached value if <30 days old
 * 4. Fall back to static DB only if AI fails
 *
 * Created: November 6, 2025
 */

import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class USMCAThresholdAgent extends BaseAgent {
  constructor() {
    super({
      name: 'USMCAThreshold',
      model: 'anthropic/claude-haiku-4.5',  // Fast + cheap for policy lookups
      maxTokens: 1500  // Concise JSON responses
    });

    this.CACHE_EXPIRY_DAYS = 30;  // Mark cache stale after 30 days
  }

  /**
   * Get current USMCA RVC threshold for specific HS code
   *
   * @param {string} hsCode - 6-10 digit HS code (e.g., "8542.31.00")
   * @param {string} productCategory - Industry category (e.g., "Electronics")
   * @param {Object} options - Additional context
   * @returns {Promise<Object>} Threshold data with source and confidence
   */
  async getCurrentThreshold(hsCode, productCategory, options = {}) {
    const { userId, workflowId, companyName } = options;

    // Normalize HS code (remove periods, spaces)
    const normalizedHS = hsCode.replace(/[.\s]/g, '');
    const hsChapter = normalizedHS.substring(0, 2);  // First 2 digits = HS chapter

    console.log(`[USMCA-THRESHOLD] Fetching threshold for HS ${normalizedHS} (${productCategory})`);

    // STEP 1: Check cache first (database: usmca_threshold_cache)
    const cachedThreshold = await this.getCachedThreshold(normalizedHS, productCategory);

    if (cachedThreshold && !this.isCacheStale(cachedThreshold.cached_at)) {
      console.log(`[USMCA-THRESHOLD] ✓ Cache hit (${this.getCacheAge(cachedThreshold.cached_at)} days old)`);
      return cachedThreshold;
    }

    if (cachedThreshold && this.isCacheStale(cachedThreshold.cached_at)) {
      console.warn(`[USMCA-THRESHOLD] ⚠️ Cache stale (${this.getCacheAge(cachedThreshold.cached_at)} days old) - refreshing from AI`);
    }

    // STEP 2: Cache miss or stale - query AI for current threshold
    try {
      const aiThreshold = await this.fetchThresholdFromAI(normalizedHS, hsChapter, productCategory);

      // STEP 3: Cache the result
      await this.cacheThreshold(normalizedHS, productCategory, aiThreshold, userId, workflowId, companyName);

      console.log(`[USMCA-THRESHOLD] ✓ AI fetch successful - cached for 30 days`);
      return aiThreshold;

    } catch (aiError) {
      console.error(`[USMCA-THRESHOLD] ❌ AI fetch failed:`, aiError.message);

      // STEP 4: Fallback to static database (industry_thresholds)
      const staticThreshold = await this.getStaticThreshold(productCategory);

      if (staticThreshold) {
        console.warn(`[USMCA-THRESHOLD] ⚠️ Using static fallback for ${productCategory}`);

        // Log to dev_issues for monitoring
        await logDevIssue({
          type: 'ai_fallback',  // ✅ FIX (Nov 6): Add required type field
          component: 'usmca_threshold_agent',
          severity: 'medium',
          message: `AI threshold fetch failed, using static fallback for ${productCategory}`,
          data: { hsCode, productCategory, aiError: aiError.message }  // ✅ FIX: Use 'data' not 'context'
        });

        return {
          ...staticThreshold,
          source: 'database_fallback',
          confidence: 'low',
          warning: 'Using static Oct 2024 threshold - AI fetch failed'
        };
      }

      // STEP 5: Complete failure - throw error
      throw new Error(
        `Unable to determine USMCA threshold for ${productCategory} (HS ${normalizedHS}). ` +
        `AI fetch failed and no static fallback available.`
      );
    }
  }

  /**
   * Fetch threshold from AI (USMCA treaty analysis)
   *
   * @private
   */
  async fetchThresholdFromAI(hsCode, hsChapter, productCategory) {
    // ✅ FIX (Nov 8): Cleaned prompt from 49 lines to 24 lines - removed bloat
    const prompt = `Determine USMCA Regional Value Content (RVC) threshold.

HS Code: ${hsCode} (Chapter ${hsChapter})
Product Category: ${productCategory}

RESEARCH:
1. USMCA Annex 4-B (product-specific rules) - PRIMARY
2. USMCA Chapter 4 (general rules) - FALLBACK
3. Check 2025 USTR updates

Return JSON only:
{
  "hs_code": "${hsCode}",
  "rvc_threshold_percent": <researched value>,
  "preference_criterion": "A|B|C|D",
  "treaty_article": "exact article reference",
  "calculation_method": "Transaction Value|Net Cost",
  "labor_credit_percent": <if applicable, else 0>,
  "source": "USMCA Annex 4-B|Chapter 4",
  "last_updated": "YYYY-MM-DD",
  "confidence": "high|medium|low"
}

Confidence: high (exact rule), medium (chapter rule), low (general default)`;

    console.log(`[USMCA-THRESHOLD] Calling AI for HS ${hsCode}...`);

    const result = await this.execute(prompt);

    // ✅ FIX (Nov 6): BaseAgent.execute() returns { success, data, confidence, metadata }
    // The data is already parsed JSON, not a raw string
    if (!result.success || !result.data) {
      throw new Error('AI call failed or returned no data');
    }

    const thresholdData = result.data;

    // Validate required fields
    if (!thresholdData.rvc_threshold_percent || !thresholdData.treaty_article) {
      throw new Error('AI response missing required fields: rvc_threshold_percent or treaty_article');
    }

    // Normalize field names to match database schema
    return {
      rvc: parseFloat(thresholdData.rvc_threshold_percent),
      labor: parseFloat(thresholdData.labor_credit_percent || 0),
      article: thresholdData.treaty_article,
      method: thresholdData.calculation_method || 'Transaction Value',
      preference_criterion: thresholdData.preference_criterion || 'B',
      source: thresholdData.source || 'USMCA',
      confidence: thresholdData.confidence || 'medium',
      last_updated: thresholdData.last_updated || new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Get cached threshold from database
   *
   * @private
   */
  async getCachedThreshold(hsCode, productCategory) {
    try {
      const { data, error } = await supabase
        .from('usmca_threshold_cache')
        .select('*')
        .eq('hs_code', hsCode)
        .eq('product_category', productCategory)
        .order('cached_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows
        console.error('[USMCA-THRESHOLD] Cache query error:', error.message);
        return null;
      }

      return data ? {
        rvc: parseFloat(data.rvc_threshold_percent),
        labor: parseFloat(data.labor_credit_percent || 0),
        article: data.treaty_article,
        method: data.calculation_method,
        preference_criterion: data.preference_criterion,
        source: data.data_source || 'cache',
        confidence: data.confidence_level,
        last_updated: data.last_verified_date,
        cached_at: data.cached_at
      } : null;

    } catch (error) {
      console.error('[USMCA-THRESHOLD] Failed to query cache:', error.message);
      return null;
    }
  }

  /**
   * Cache threshold in database
   *
   * @private
   */
  async cacheThreshold(hsCode, productCategory, thresholdData, userId, workflowId, companyName) {
    try {
      const { error } = await supabase
        .from('usmca_threshold_cache')
        .insert({
          hs_code: hsCode,
          product_category: productCategory,
          rvc_threshold_percent: thresholdData.rvc,
          labor_credit_percent: thresholdData.labor || 0,
          treaty_article: thresholdData.article,
          calculation_method: thresholdData.method,
          preference_criterion: thresholdData.preference_criterion || 'B',
          data_source: thresholdData.source,
          confidence_level: thresholdData.confidence,
          last_verified_date: thresholdData.last_updated,
          cached_at: new Date().toISOString(),
          cached_by_user_id: userId || null,
          cached_by_workflow_id: workflowId || null,
          cached_by_company: companyName || null
        });

      if (error) {
        console.error('[USMCA-THRESHOLD] Failed to cache threshold:', error.message);
        // Don't throw - cache failure shouldn't block user workflow
      }
    } catch (error) {
      console.error('[USMCA-THRESHOLD] Cache insert error:', error.message);
    }
  }

  /**
   * Get static threshold from database (fallback)
   *
   * @private
   */
  async getStaticThreshold(productCategory) {
    try {
      // Map product category to industry key
      const industryKeyMap = {
        'Electronics': 'Electronics',
        'Automotive': 'Automotive',
        'Machinery': 'Machinery',
        'Textiles': 'Textiles/Apparel',
        'Agriculture': 'Agriculture',
        'Chemicals': 'Chemicals',
        'Metals': 'Base Metals',
        'Other': 'General'  // ✅ Fix for "Other" mapping issue
      };

      const industryKey = industryKeyMap[productCategory] || 'General';

      const { data, error } = await supabase
        .from('industry_thresholds')
        .select('rvc_percentage, labor_percentage, usmca_article, qualification_method')
        .eq('industry_key', industryKey)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        rvc: parseFloat(data.rvc_percentage),
        labor: parseFloat(data.labor_percentage || 0),
        article: data.usmca_article,
        method: data.qualification_method,
        source: 'database_static',
        confidence: 'low'
      };

    } catch (error) {
      console.error('[USMCA-THRESHOLD] Failed to query static thresholds:', error.message);
      return null;
    }
  }

  /**
   * Check if cached threshold is stale (>30 days old)
   *
   * @private
   */
  isCacheStale(cachedAt) {
    const cacheDate = new Date(cachedAt);
    const now = new Date();
    const ageInDays = (now - cacheDate) / (1000 * 60 * 60 * 24);
    return ageInDays > this.CACHE_EXPIRY_DAYS;
  }

  /**
   * Get cache age in days
   *
   * @private
   */
  getCacheAge(cachedAt) {
    const cacheDate = new Date(cachedAt);
    const now = new Date();
    const ageInDays = (now - cacheDate) / (1000 * 60 * 60 * 24);
    return Math.round(ageInDays);
  }
}

export default USMCAThresholdAgent;
