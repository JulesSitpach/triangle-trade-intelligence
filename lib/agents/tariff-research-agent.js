/**
 * TARIFF RESEARCH AGENT - North American Trade Triangle
 *
 * ⚠️ UPDATED (Nov 6, 2025): No more AI "research" - all rates from database cache
 *
 * Architecture based on data sources:
 * - Canada/Mexico rates: STABLE → Pre-loaded knowledge base (hardcoded)
 * - US MFN rates: STABLE → policy_tariffs_cache (synced weekly from USITC)
 * - US Section 301: VOLATILE → policy_tariffs_cache (synced daily from Federal Register)
 * - US Section 232: VOLATILE → policy_tariffs_cache (synced daily from Presidential Proclamations)
 *
 * Tier 1: Static knowledge base (CA/MX - FREE, instant)
 * Tier 2: Database cache (US rates - populated by scheduled sync jobs)
 * Tier 3: REMOVED (AI research with stale training data - no longer used)
 */

import { getSupabaseServiceClient } from '../database/supabase-client.js';

// ✅ FIX: Use singleton service client to prevent multiple GoTrueClient instances
const supabase = getSupabaseServiceClient();

/**
 * STATIC KNOWLEDGE BASE
 * Canada and Mexico tariff rates - stable, pre-loaded
 * Source: Official tariff schedules (updated quarterly if needed)
 */
/**
 * ❌ REMOVED: STABLE_TARIFF_KNOWLEDGE hardcoded CA/MX rates (Nov 8, 2025)
 *
 * WHY REMOVED:
 * - Hardcoded rates prevent AI from researching current 2025 values
 * - Only covered 5 HS codes per country (tiny fraction of actual usage)
 * - Rates could be outdated if CBSA/TIGIE schedules updated
 * - Violates "no hardcoded fallbacks" policy
 *
 * REPLACEMENT:
 * - AI research with 90-day database caching
 * - tariff_rates_cache table stores researched rates
 * - Cache marked stale when policy updates detected
 *
 * DATABASE CACHE HANDLES:
 * - Canada CUSMA rates (stable, 90-day TTL)
 * - Mexico T-MEC rates (stable, 90-day TTL)
 * - AI research only on cache miss
 */

/**
 * AI Research Cache (US rates only - volatile)
 * TTL: 24 hours (Trump can change rates anytime)
 */
const US_RATE_CACHE = new Map();
const US_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class TariffResearchAgent {
  constructor() {
    this.name = 'tariff-research';
    this.version = '2.0.0';
  }

  /**
   * Main entry point: Get tariff rates for destination country
   * ARCHITECTURE: Database FIRST (12K codes), AI overlay for volatile adjustments
   */
  async researchTariffRates(request) {
    const { hs_code, origin_country, destination_country = 'US', description } = request;

    if (!hs_code || !origin_country) {
      return this.formatError('Missing required fields: hs_code and origin_country');
    }

    console.log(`[TARIFF RESEARCH] ${hs_code} from ${origin_country} → ${destination_country}`);

    // STEP 1: Query database for MEXICO (stable rates)
    if (destination_country === 'MX') {
      // If origin is US, check for retaliatory tariffs via AI
      if (origin_country === 'US') {
        console.log(`🇺🇸→🇲🇽 US goods to Mexico - checking for retaliation...`);
        return this.getMexicoRateWithRetaliationCheck(hs_code, description);
      }

      // For other origins, use database (stable T-MEC)
      const dbResult = await this.queryDatabase(hs_code, 'MX');
      if (dbResult.found) {
        console.log(`✅ MEXICO DATABASE HIT: ${hs_code} (FREE, instant)`);
        return this.formatDatabaseResult(dbResult, 'MX');
      }
    }

    // US: FULL AI RESEARCH (everything changes - rules, fees, tariffs)
    if (destination_country === 'US') {
      console.log(`🇺🇸 US destination - FULL AI research (volatile, 24hr cache)...`);
      return this.getVolatileUSRate(hs_code, origin_country, description);
    }

    // CANADA: No rates in database, use AI with long-term cache (stable)
    if (destination_country === 'CA') {
      console.log(`🍁 Canadian rate via AI (stable, 90-day cache)...`);
      return await this.getCanadianRateViaAI(hs_code, origin_country, description);
    }

    return this.formatError(`Unsupported destination: ${destination_country}`);
  }

  /**
   * Query database for base tariff rates (US/Mexico coverage)
   */
  async queryDatabase(hsCode, destinationCountry) {
    try {
      const cleanHsCode = hsCode.replace(/\./g, ''); // Remove dots from HS code

      const { data, error } = await supabase
        .from('tariff_intelligence_master')
        .select('*')
        .eq('hts8', cleanHsCode)
        .single();

      if (error || !data) {
        return { found: false };
      }

      // Extract rates based on destination
      let result = {
        found: true,
        hs_code: data.hts8,
        description: data.brief_description
      };

      if (destinationCountry === 'US') {
        result.mfn_rate = parseFloat(data.mfn_ad_val_rate || 0);
        result.usmca_rate = parseFloat(data.usmca_ad_val_rate || 0);
      } else if (destinationCountry === 'MX') {
        result.mfn_rate = parseFloat(data.mexico_ad_val_rate || 0);
        result.usmca_rate = 0; // T-MEC preferential rate
      }

      return result;

    } catch (error) {
      console.error('[DATABASE QUERY ERROR]', error);
      return { found: false };
    }
  }

  /**
   * Add US Section 301 overlay (volatile Trump tariffs)
   */
  async addUSSection301Overlay(dbResult, originCountry, description) {
    const { hs_code, mfn_rate, usmca_rate } = dbResult;

    // For non-China origins, base rate is usually sufficient
    if (originCountry !== 'CN') {
      console.log(`✅ Non-China origin, using database base rate only`);
      return this.formatDatabaseResult(dbResult, 'US', 'database');
    }

    // China origin: Need AI to check current Section 301 tariffs
    console.log(`🇨🇳 China origin - checking Section 301 (volatile)...`);

    const cacheKey = `US-301-${hs_code}-CN`;
    const cached = this.checkUSCache(cacheKey);
    if (cached) {
      console.log('✅ Section 301 cache HIT (24hr)');
      return cached;
    }

    try {
      // Query Section 301 from cache (populated by Federal Register sync)
      const section301Data = await this.querySection301FromCache(hs_code);

      const result = {
        status: 'success',
        source: 'database + policy_tariffs_cache',
        destination_country: 'US',
        destination_country_name: 'United States',
        hs_code: hs_code,
        rates: {
            mfn_rate: mfn_rate,
            section_301: section301Data.section_301,
            total_rate: mfn_rate + section301Data.section_301,
            usmca_rate: usmca_rate,
            policy_adjustments: section301Data.applicable
              ? [`Section 301: +${(section301Data.section_301 * 100).toFixed(1)}%`]
              : ['No Section 301 tariffs']
          },
          metadata: {
            official_source: 'Database + policy_tariffs_cache (Federal Register sync)',
            base_rate_source: 'tariff_intelligence_master',
            section_301_source: section301Data.source,
            section_301_verified_date: section301Data.verified_date,
            section_301_cache_age_days: section301Data.cache_age_days,
            effective_date: new Date().toISOString().split('T')[0],
            confidence: section301Data.confidence,
            notes: `Base: ${mfn_rate}%, Section 301: ${(section301Data.section_301 * 100).toFixed(1)}% | ${section301Data.notes}`,
            stability: 'VOLATILE - Section 301 tariffs change frequently'
          },
          agent_version: this.version,
          timestamp: new Date().toISOString()
        };

        this.cacheUSRateAndReturn(cacheKey, result);
        return result;

    } catch (error) {
      console.error('[SECTION 301 CACHE QUERY ERROR]', error);
      console.log('⚠️ Section 301 cache query failed, using base rate only');
      return this.formatDatabaseResult(dbResult, 'US', 'database_no_section_301');
    }
  }

  /**
   * Query Section 301 rate with 4-tier fallback hierarchy
   *
   * TIER 1: Cache hit (<25 days old) → confidence: 'high'
   * TIER 2: Cache hit (25-60 days old) → confidence: 'low', warning flag
   * TIER 3: Real-time Federal Register fetch → confidence: 'medium', source: 'emergency_fetch'
   * TIER 4: Static fallback (tariff_intelligence_master) → confidence: 'critical_review_required'
   */
  async querySection301FromCache(hsCode) {
    try {
      // ========== TIER 1 & 2: Cache Query ==========
      const { data, error } = await supabase
        .from('policy_tariffs_cache')
        .select('section_301, verified_date, expires_at, data_source, is_stale')
        .eq('hs_code', hsCode)
        .single();

      // Calculate cache age if data exists
      let cacheAge = null;
      let daysOld = null;
      let isStale = false;

      if (data && data.verified_date) {
        cacheAge = Date.now() - new Date(data.verified_date).getTime();
        daysOld = Math.floor(cacheAge / (24 * 60 * 60 * 1000));
        isStale = data.is_stale || daysOld > 25;
      }

      // TIER 1: Cache hit, fresh data (<25 days)
      if (data && !isStale && daysOld !== null && daysOld <= 25) {
        return {
          section_301: parseFloat(data.section_301) || 0.0,
          applicable: parseFloat(data.section_301) > 0,
          confidence: daysOld > 14 ? 'medium' : 'high',
          verified_date: data.verified_date,
          source: data.data_source || 'Federal Register sync',
          cache_age_days: daysOld,
          tier: 1,
          notes: `Verified ${data.verified_date} (${daysOld} days ago)`
        };
      }

      // TIER 2: Cache hit, stale data (25-60 days)
      if (data && daysOld !== null && daysOld > 25 && daysOld <= 60) {
        console.warn(`⚠️ Stale cache (${daysOld} days old) for ${hsCode} - attempting emergency fetch`);

        // Try emergency fetch but return stale data if it fails
        try {
          const emergencyResult = await this.emergencyFederalRegisterFetch(hsCode);
          if (emergencyResult && emergencyResult.found) {
            return emergencyResult; // TIER 3 success
          }
        } catch (fetchError) {
          console.error('Emergency fetch failed, using stale cache:', fetchError);
        }

        // Emergency fetch failed, return stale data with warning
        return {
          section_301: parseFloat(data.section_301) || 0.0,
          applicable: parseFloat(data.section_301) > 0,
          confidence: 'low',
          verified_date: data.verified_date,
          source: `${data.data_source} (STALE - ${daysOld} days old)`,
          cache_age_days: daysOld,
          tier: 2,
          notes: `⚠️ STALE DATA: Rate verified ${daysOld} days ago. Reverify before shipment.`
        };
      }

      // Cache miss or very old (>60 days) - attempt emergency fetch
      console.log(`🚨 Cache miss or expired for ${hsCode} - attempting emergency Federal Register fetch`);

      // ========== TIER 3: Emergency Real-Time Fetch ==========
      try {
        const emergencyResult = await this.emergencyFederalRegisterFetch(hsCode);
        if (emergencyResult && emergencyResult.found) {
          return emergencyResult;
        }
      } catch (fetchError) {
        console.error('Emergency Federal Register fetch failed:', fetchError);
      }

      // ========== TIER 4: Static Fallback ==========
      console.warn(`⚠️ Emergency fetch failed for ${hsCode} - using static fallback`);
      const staticFallback = await this.getStaticSection301Fallback(hsCode);
      return staticFallback;

    } catch (error) {
      console.error('[TariffResearchAgent] Section 301 query failed:', error);

      // Complete failure - return safe default
      return {
        section_301: 0.0,
        applicable: false,
        confidence: 'error',
        source: 'ERROR - all tiers failed',
        tier: 'error',
        notes: `⚠️ CRITICAL: All data sources failed. Manual USTR verification required.`
      };
    }
  }

  /**
   * TIER 3: Emergency real-time Federal Register fetch
   * Uses federal-register-realtime-lookup.js with in-memory deduplication
   */
  async emergencyFederalRegisterFetch(hsCode) {
    try {
      // Dynamically import to avoid circular dependencies
      const { default: federalRegisterLookup } = await import('../services/federal-register-realtime-lookup.js');

      const result = await federalRegisterLookup.fetchSection301ForHSCode(hsCode);

      if (!result.found || result.section_301 === null) {
        return null; // Not found, proceed to Tier 4
      }

      return {
        section_301: result.section_301,
        applicable: result.section_301 > 0,
        confidence: result.confidence, // 'medium' from emergency fetch
        verified_date: result.verified_date,
        source: result.data_source,
        source_url: result.source_url,
        cache_age_days: 0, // Just fetched
        tier: 3,
        is_emergency_fetch: true,
        fetch_duration_ms: result.fetch_duration_ms,
        notes: result.notes || 'Emergency real-time fetch from Federal Register',
        found: true
      };

    } catch (error) {
      console.error('[TIER 3 FAILED] Emergency Federal Register fetch error:', error);
      return null; // Proceed to Tier 4
    }
  }

  /**
   * TIER 4: Static fallback from tariff_intelligence_master
   * Last resort when all other data sources fail
   */
  async getStaticSection301Fallback(hsCode) {
    try {
      const { data, error } = await supabase
        .from('tariff_intelligence_master')
        .select('section_301, last_updated')
        .eq('hs_code', hsCode)
        .single();

      if (error || !data) {
        // Complete miss - assume no Section 301 tariff
        return {
          section_301: 0.0,
          applicable: false,
          confidence: 'critical_review_required',
          source: 'Static fallback (not found)',
          tier: 4,
          notes: `⚠️ CRITICAL: HS ${hsCode} not in database. Manual USTR verification required before $300K+ decisions.`
        };
      }

      const lastUpdated = data.last_updated ? new Date(data.last_updated) : null;
      const daysOld = lastUpdated
        ? Math.floor((Date.now() - lastUpdated.getTime()) / (24 * 60 * 60 * 1000))
        : 365; // Assume 1 year old if no date

      return {
        section_301: parseFloat(data.section_301) || 0.0,
        applicable: parseFloat(data.section_301) > 0,
        confidence: 'critical_review_required',
        verified_date: data.last_updated,
        source: `Static fallback (tariff_intelligence_master, ${daysOld} days old)`,
        cache_age_days: daysOld,
        tier: 4,
        notes: `⚠️ CRITICAL: Using static fallback data (${daysOld} days old). MUST verify with USTR before shipment. This rate may be outdated.`
      };

    } catch (error) {
      console.error('[TIER 4 FAILED] Static fallback error:', error);

      // Absolute worst case - return zero with critical warning
      return {
        section_301: 0.0,
        applicable: false,
        confidence: 'critical_review_required',
        source: 'ERROR - static fallback failed',
        tier: 'error',
        notes: `⚠️ CRITICAL FAILURE: All data sources unavailable. DO NOT make $300K+ decisions without manual USTR verification.`
      };
    }
  }

  /**
   * Get Canadian rates via AI (stable, 90-day cache)
   */
  async getCanadianRateViaAI(hsCode, originCountry, description) {
    const cacheKey = `CA-${hsCode}`;
    const CANADA_CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days (stable treaty)

    // Check long-term cache
    const cached = US_RATE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CANADA_CACHE_TTL) {
      console.log('✅ Canadian rate cache HIT (90-day TTL)');
      return { ...cached.data, cache_hit: true };
    }

    console.log('🔍 Researching Canadian rate via AI...');

    const prompt = `Research Canadian tariff rates for import to Canada.

HS Code: ${hsCode}
Origin: ${this.getCountryName(originCountry)}
Product: ${description || 'Not specified'}

RESEARCH:
1. MFN rate (CBSA Customs Tariff 2025)
2. CUSMA/USMCA preferential rate
3. Retaliatory tariffs (if US origin - check recent policy)

Return JSON:
{
  "hs_code": "${hsCode}",
  "mfn_rate": "RESEARCH_CBSA",
  "cusma_rate": "RESEARCH_CUSMA",
  "retaliation_rate": "RESEARCH_IF_US",
  "total_rate": "SUM_ALL",
  "policy_adjustments": ["List each rate"],
  "effective_date": "2025-01-01",
  "source": "CBSA Customs Tariff 2025",
  "confidence": "high|medium|low",
  "notes": "Any retaliation notes"
}

Use actual numbers. Write 0.0 ONLY if confirmed duty-free.`;

    try {
      const aiResult = await this.tryOpenRouter(hsCode, originCountry, prompt);

      if (aiResult.success) {
        const result = {
          status: 'success',
          source: 'ai_research_canada',
          destination_country: 'CA',
          destination_country_name: 'Canada',
          hs_code: hsCode,
          rates: aiResult.data.rates,
          metadata: {
            ...aiResult.data.metadata,
            stability: 'STABLE - Canadian CUSMA rates rarely change (90-day cache)'
          },
          agent_version: this.version,
          timestamp: new Date().toISOString()
        };

        // Cache for 90 days
        US_RATE_CACHE.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      return this.formatError('Failed to research Canadian rate');

    } catch (error) {
      console.error('[CANADIAN RATE ERROR]', error);
      return this.formatError(error.message);
    }
  }

  /**
   * Get STABLE rates (Canada/Mexico) from pre-loaded knowledge
   */
  getStableRate(hsCode, originCountry, destinationCountry) {
    const knowledge = STABLE_TARIFF_KNOWLEDGE[destinationCountry];

    if (!knowledge) {
      return this.formatError(`No knowledge base for ${destinationCountry}`);
    }

    // Check if we have this HS code pre-loaded
    const rates = knowledge[hsCode];

    if (rates) {
      console.log(`✅ STABLE RATE HIT: ${destinationCountry} ${hsCode} (FREE, instant)`);

      return {
        status: 'success',
        source: 'stable_knowledge',
        destination_country: destinationCountry,
        destination_country_name: this.getCountryName(destinationCountry),
        hs_code: hsCode,
        rates: {
          mfn_rate: rates.mfn_rate || rates.igi_rate || 0,
          usmca_rate: rates.cusma_rate || rates.tmec_rate || 0,
          total_rate: rates.mfn_rate || rates.igi_rate || 0,
          policy_adjustments: []
        },
        metadata: {
          official_source: rates.source,
          effective_date: '2025-01-01',
          confidence: 'high',
          notes: rates.notes || 'Pre-loaded from official tariff schedule',
          stability: 'STABLE - Canada/Mexico rates change rarely'
        },
        agent_version: this.version,
        timestamp: new Date().toISOString()
      };
    }

    // HS code not in knowledge base - need to add it or research
    console.log(`⚠️ UNKNOWN HS CODE: ${hsCode} for ${destinationCountry}`);
    console.log('💡 RECOMMENDATION: Add this to STABLE_TARIFF_KNOWLEDGE');

    return {
      status: 'not_found',
      message: `HS code ${hsCode} not in ${destinationCountry} knowledge base`,
      recommendation: 'Add to STABLE_TARIFF_KNOWLEDGE or use AI research',
      destination_country: destinationCountry,
      hs_code: hsCode,
      agent_version: this.version
    };
  }

  /**
   * Get VOLATILE US rates via AI research (Trump chaos)
   */
  async getVolatileUSRate(hsCode, originCountry, description) {
    const cacheKey = `US-${hsCode}-${originCountry}`;

    // Check 24hr cache first
    const cached = this.checkUSCache(cacheKey);
    if (cached) {
      console.log('✅ US rate cache HIT (24hr TTL)');
      return cached;
    }

    console.log('🔍 US rate cache MISS - researching current policy...');

    try {
      // TIER 1: OpenRouter API (Primary)
      console.log('🎯 TIER 1: Trying OpenRouter for US rates...');
      const openRouterResult = await this.tryOpenRouter(hsCode, originCountry, description);
      if (openRouterResult.success) {
        console.log('✅ OpenRouter SUCCESS');
        return this.cacheUSRateAndReturn(cacheKey, openRouterResult.data);
      }
      console.log('❌ OpenRouter FAILED:', openRouterResult.error);

      // TIER 2: Anthropic Direct API
      console.log('🎯 TIER 2: Trying Anthropic Direct...');
      const anthropicResult = await this.tryAnthropicDirect(hsCode, originCountry, description);
      if (anthropicResult.success) {
        console.log('✅ Anthropic Direct SUCCESS');
        return this.cacheUSRateAndReturn(cacheKey, anthropicResult.data);
      }
      console.log('❌ Anthropic Direct FAILED:', anthropicResult.error);

      // TIER 3: Database fallback (stale Jan 2025)
      console.log('🎯 TIER 3: Falling back to database (STALE)...');
      const dbResult = await this.searchDatabase(hsCode);
      if (dbResult.found) {
        return this.formatDatabaseResult(dbResult, cacheKey);
      }

      return this.formatError('All US rate sources unavailable');

    } catch (error) {
      console.error('[TARIFF RESEARCH ERROR]', error);
      return this.formatError(error.message);
    }
  }

  /**
   * TIER 1: OpenRouter API for US rates
   */
  async tryOpenRouter(hsCode, originCountry, description) {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return { success: false, error: 'OPENROUTER_API_KEY not configured' };
      }

      const prompt = this.buildUSRatePrompt(hsCode, originCountry, description);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://triangle-trade-intelligence.vercel.app'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();
      const aiText = result.choices?.[0]?.message?.content;

      if (!aiText) {
        return { success: false, error: 'No AI response' };
      }

      const parsed = this.parseAIResponse(aiText);
      if (!parsed) {
        return { success: false, error: 'Failed to parse response' };
      }

      return { success: true, data: parsed };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * TIER 2: Anthropic Direct API
   */
  async tryAnthropicDirect(hsCode, originCountry, description) {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
      }

      const prompt = this.buildUSRatePrompt(hsCode, originCountry, description);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();
      const aiText = result.content?.[0]?.text;

      if (!aiText) {
        return { success: false, error: 'No AI response' };
      }

      const parsed = this.parseAIResponse(aiText);
      if (!parsed) {
        return { success: false, error: 'Failed to parse response' };
      }

      return { success: true, data: parsed };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build US rate research prompt (Trump chaos-aware)
   * FULL RESEARCH - Base rates, overlays, fees, rules - EVERYTHING changes
   */
  buildUSRatePrompt(hsCode, originCountry, description) {
    const today = new Date().toISOString().split('T')[0];
    const originName = this.getCountryName(originCountry);

    return `Research current US tariff rates for import (${today}).

IMPORT DETAILS:
HS Code: ${hsCode}
Origin: ${originName} (${originCountry})
Product: ${description || 'Not specified'}
Destination: United States

RESEARCH ALL RATE LAYERS:
1. Base MFN rate (USITC HTS)
2. Section 301 (if China: check List 1-4B, current rates 7.5%/25%/100%)
3. Section 232 (if steel/aluminum: 10%/25%)
4. IEEPA emergency tariffs (if any)
5. USMCA preferential rate (if CA/MX origin)

Return JSON (replace placeholders with researched values):
{
  "hs_code": "${hsCode}",
  "base_mfn_rate": "RESEARCH_USITC",
  "section_301": "RESEARCH_USTR",
  "section_232": "RESEARCH_IF_APPLICABLE",
  "ieepa": "RESEARCH_IF_APPLICABLE",
  "total_rate": "SUM_ALL_ABOVE",
  "usmca_rate": "RESEARCH_IF_USMCA",
  "policy_adjustments": ["List each rate layer"],
  "effective_date": "${today}",
  "source": "Official sources used",
  "confidence": "high|medium|low",
  "notes": "Brief status"
}

CRITICAL: Use actual numeric values. Write 0.0 ONLY if confirmed duty-free from official source.`;
  }

  /**
   * Parse AI response (handles full US rate breakdown)
   */
  parseAIResponse(aiText) {
    try {
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       aiText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error('No JSON in AI response');
        return null;
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      return {
        status: 'success',
        source: 'ai_research',
        destination_country: 'US',
        destination_country_name: 'United States',
        hs_code: parsed.hs_code,
        rates: {
          base_mfn_rate: parseFloat(parsed.base_mfn_rate || 0),
          section_301: parseFloat(parsed.section_301 || 0),
          section_232: parseFloat(parsed.section_232 || 0),
          ieepa: parseFloat(parsed.ieepa || 0),
          port_fees: parseFloat(parsed.port_fees || 0),
          total_rate: parseFloat(parsed.total_rate || 0),
          usmca_rate: parseFloat(parsed.usmca_rate || 0),
          policy_adjustments: parsed.policy_adjustments || []
        },
        metadata: {
          official_source: parsed.source,
          effective_date: parsed.effective_date,
          last_changed: parsed.last_changed,
          confidence: parsed.confidence || 'medium',
          notes: parsed.notes,
          stability: 'VOLATILE - US rates change frequently (24hr cache)'
        },
        agent_version: this.version,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error parsing AI response:', error);
      return null;
    }
  }

  /**
   * TIER 3: Database lookup (stale)
   */
  async searchDatabase(hsCode) {
    try {
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('*')
        .eq('hs_code', hsCode)
        .single();

      if (error || !data) {
        return { found: false };
      }

      return {
        found: true,
        hs_code: data.hs_code,
        description: data.description,
        mfn_rate: parseFloat(data.mfn_rate || 0),
        usmca_rate: parseFloat(data.usmca_rate || 0)
      };

    } catch (error) {
      console.error('[DB ERROR]', error);
      return { found: false };
    }
  }

  formatDatabaseResult(dbResult, destinationCountry, source = 'database') {
    let warning, stability, confidence;

    if (destinationCountry === 'MX') {
      // Mexico rates from database are current and stable
      warning = null;
      stability = 'STABLE - Mexico T-MEC rates rarely change';
      confidence = 'high';
    } else if (destinationCountry === 'US' && source === 'database') {
      // US base rate from database (without Section 301 check)
      warning = null;
      stability = 'Base rate stable, but Section 301 may apply';
      confidence = 'high';
    } else if (source === 'database_no_section_301') {
      // US rate when Section 301 AI lookup failed
      warning = '⚠️ Section 301 lookup unavailable - showing base rate only';
      stability = 'INCOMPLETE - May not include Section 301 tariffs';
      confidence = 'medium';
    } else {
      // Fallback for unknown cases
      warning = '⚠️ Database fallback used';
      stability = 'May not reflect current policy';
      confidence = 'medium';
    }

    return {
      status: 'success',
      source: source,
      warning: warning,
      destination_country: destinationCountry,
      destination_country_name: this.getCountryName(destinationCountry),
      hs_code: dbResult.hs_code,
      description: dbResult.description,
      rates: {
        mfn_rate: dbResult.mfn_rate,
        usmca_rate: dbResult.usmca_rate,
        total_rate: dbResult.mfn_rate,
        policy_adjustments: []
      },
      metadata: {
        official_source: 'tariff_intelligence_master (HTS 2025)',
        effective_date: '2025-01-01',
        confidence: confidence,
        notes: `${destinationCountry} tariff rate from database`,
        stability: stability
      },
      agent_version: this.version,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * US Rate Cache (24hr TTL)
   */
  checkUSCache(key) {
    const cached = US_RATE_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < US_CACHE_TTL) {
      return { ...cached.data, cache_hit: true };
    }
    return null;
  }

  cacheUSRateAndReturn(key, data) {
    US_RATE_CACHE.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  }

  /**
   * Helpers
   */
  getCountryName(code) {
    const names = {
      'US': 'United States',
      'CA': 'Canada',
      'MX': 'Mexico',
      'CN': 'China',
      'TW': 'Taiwan',
      'KR': 'South Korea',
      'JP': 'Japan',
      'VN': 'Vietnam',
      'TH': 'Thailand'
    };
    return names[code] || code;
  }

  formatError(message) {
    return {
      status: 'error',
      message,
      agent_version: this.version,
      timestamp: new Date().toISOString()
    };
  }
}

export default TariffResearchAgent;
