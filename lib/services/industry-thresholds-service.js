/**
 * Industry Thresholds Service
 * AI-first USMCA qualification thresholds with database cache + static fallback
 *
 * Priority: AI Agent → Database Cache → Static DB Fallback
 * Architecture:
 * 1. Query USMCAThresholdAgent for current 2025 threshold (cached for 30 days)
 * 2. Fallback to static database if AI fails
 * 3. Fail loudly if both fail
 *
 * Migration Status:
 * - Nov 6, 2025: Added USMCAThresholdAgent for AI-verified current thresholds
 * - Oct 24, 2025: Migrated to database-driven (static values)
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logWarning } from '../utils/production-logger.js';
import { USMCAThresholdAgent } from '../agents/usmca-threshold-agent.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Map dropdown/UI industry values to database industry_key
 * The dropdown shows detailed product categories (19 options)
 * But the database has simple industry keys (14 options)
 * This function maps between them
 */
function mapIndustryToKey(industryValue) {
  // Mapping from detailed product_category to simple industry_key
  const categoryToKeyMap = {
    // Electronics (3 detailed → 1 key)
    'Consumer Electronics (phones, laptops, chargers)': 'Electronics',
    'Electronic Components (semiconductors, circuits)': 'Electronics',
    'Industrial Electronics (control systems, sensors)': 'Electronics',

    // Apparel/Textiles
    'Apparel & Clothing': 'Textiles/Apparel',
    'Textile Goods & Fabrics': 'Textiles/Apparel',
    'Footwear & Leather Goods': 'Leather',

    // Automotive
    'Automotive Parts & Assemblies': 'Automotive',

    // Metals
    'Base Metals & Metal Products': 'Base Metals',

    // Chemicals
    'Chemicals & Raw Materials': 'Chemicals',

    // Machinery
    'Mechanical Machinery & Industrial Equipment': 'Machinery',

    // Energy
    'Energy Equipment & Renewable Technologies': 'Energy Equipment',

    // Agriculture
    'Agricultural & Food Processing Equipment': 'Agriculture',
    'Raw Agricultural Products': 'Agriculture',
    'Processed Food & Beverages': 'Agriculture',

    // Precision/Medical
    'Precision Instruments & Optical Equipment': 'Precision Instruments',
    'Medical Devices & Healthcare Equipment': 'Precision Instruments',

    // Construction/Building
    'Construction & Building Materials': 'General',

    // Plastics
    'Plastics & Rubber Products': 'Plastics & Rubber',

    // Wood/Paper
    'Wood, Paper & Raw Materials': 'Wood Products'
  };

  // If we have a mapping, use it. Otherwise, try to find a close match
  if (categoryToKeyMap[industryValue]) {
    return categoryToKeyMap[industryValue];
  }

  // ✅ FIX (Nov 6, 2025): Map "Other" to "General" for static DB lookups
  if (industryValue === 'Other') {
    return 'General';
  }

  // Fallback: try case-insensitive partial matching
  for (const [category, key] of Object.entries(categoryToKeyMap)) {
    if (industryValue.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(industryValue.toLowerCase())) {
      return key;
    }
  }

  // Last resort: return as-is (will likely fail, which is better than silent fallback)
  return industryValue;
}

/**
 * Get industry threshold with AI-first approach
 * Priority: AI Agent (current 2025) → Database Cache → Static DB Fallback
 *
 * @param {string} industryValue - What user selected (from dropdown)
 * @param {Object} context - Optional context (userId, workflowId, hsCode)
 * @returns {Promise<Object>} Threshold object with rvc, labor, article, method
 */
export async function getIndustryThreshold(industryValue, context = {}) {
  const { hsCode, userId, workflowId, companyName } = context;

  // ✅ NEW (Nov 6, 2025): If HS code provided, use AI agent for precise threshold
  if (hsCode) {
    console.log(`[THRESHOLD] AI-first lookup for HS ${hsCode} (${industryValue})`);

    try {
      const thresholdAgent = new USMCAThresholdAgent();
      const aiThreshold = await thresholdAgent.getCurrentThreshold(
        hsCode,
        industryValue,
        { userId, workflowId, companyName }
      );

      console.log(`✓ AI threshold for HS ${hsCode}:`, {
        rvc: aiThreshold.rvc,
        source: aiThreshold.source,
        confidence: aiThreshold.confidence
      });

      return aiThreshold;

    } catch (aiError) {
      console.warn(`[THRESHOLD] AI lookup failed for HS ${hsCode}, falling back to static DB:`, aiError.message);
      // Continue to static DB fallback below
    }
  }

  // ✅ FALLBACK: Static database lookup (industry-based, not HS-specific)
  const industryKey = mapIndustryToKey(industryValue);

  try {
    // Query database for active threshold (get most recent if multiple exist)
    const { data: thresholds, error } = await supabase
      .from('industry_thresholds')
      .select('rvc_percentage, labor_percentage, usmca_article, qualification_method')
      .eq('industry_key', industryKey)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // ✅ FIX: Use maybeSingle() instead of single() to handle multiple rows gracefully

    if (error) {
      console.error('Database query error:', error.message);
      throw error;
    }

    if (!thresholds) {
      throw new Error(`No active threshold found for industry_key: ${industryKey}`);
    }

    // SUCCESS: Database found active threshold
    console.log(`✓ Static threshold loaded for "${industryValue}" (${industryKey}):`, {
      rvc: thresholds.rvc_percentage,
      labor: thresholds.labor_percentage,
      source: 'database_static'
    });

    return {
      rvc: parseFloat(thresholds.rvc_percentage),
      labor: parseFloat(thresholds.labor_percentage),
      article: thresholds.usmca_article,
      method: thresholds.qualification_method,
      source: 'database_static',
      confidence: 'low',
      warning: hsCode ? 'Using static industry threshold - AI lookup failed' : 'Using static industry threshold - no HS code provided'
    };

  } catch (error) {
    // Fail loudly - this is critical data
    console.error('CRITICAL: Failed to load industry threshold', {
      requestedIndustry: industryValue,
      mappedKey: industryKey,
      hsCode,
      error: error.message
    });

    throw new Error(
      `Unable to load USMCA threshold for "${industryValue}". ` +
      `Database unavailable. User cannot proceed with analysis.`
    );
  }
}

/**
 * Get migration status report (informational only)
 * Shows that all industries are now database-driven
 */
export async function getMigrationStatus() {
  try {
    const { data: thresholds, error } = await supabase
      .from('industry_thresholds')
      .select('industry_key, is_active')
      .eq('is_active', true);

    if (error) throw error;

    return {
      summary: {
        totalThresholds: thresholds?.length || 0,
        allDatabaseDriven: true,
        hardcodedFallback: false,
        migrationComplete: true
      },
      activeIndustries: thresholds?.map(t => t.industry_key) || [],
      timestamp: new Date().toISOString(),
      message: 'All industry thresholds are database-driven. No hardcoded fallback.'
    };
  } catch (error) {
    console.error('Failed to get migration status:', error.message);
    return null;
  }
}

export default {
  getIndustryThreshold,
  getMigrationStatus
};
