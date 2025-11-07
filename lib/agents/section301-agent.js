/**
 * SECTION 301 AGENT
 * Query policy_tariffs_cache for CURRENT Section 301 rates (populated by Federal Register sync)
 *
 * ⚠️ CRITICAL ARCHITECTURE (Nov 6, 2025):
 * - Cache populated by: lib/services/federal-register-section301-sync.js (daily cron)
 * - Data source: Federal Register API (official USTR notices)
 * - Cache TTL: 30 days (Section 301 changes have 30-day notice minimum)
 * - Emergency fallback: Hardcoded stale rates ONLY if Federal Register sync fails >7 days
 *
 * This agent does NOT use AI to "research" rates - it queries the database cache
 * which is kept current by automated Federal Register monitoring.
 *
 * AI is NOT used because:
 * - AI training data is stale (Jan 2025 cutoff)
 * - AI cannot access real-time Federal Register
 * - Section 301 rates change with 30-day notice, AI would always be behind
 */

import { BaseAgent } from './base-agent.js';

export class Section301Agent extends BaseAgent {
  constructor() {
    super({
      name: 'Section301Agent',
      model: 'anthropic/claude-haiku-4.5',
      maxTokens: 1500
    });
  }

  /**
   * Get current Section 301 rate for specific HS code
   * Queries policy_tariffs_cache (populated by Federal Register sync)
   *
   * @param {Object} params - { hs_code, origin_country, destination_country, date }
   * @returns {Promise<Object>} { rate, list, confidence, effective_date }
   */
  async getSection301Rate(params) {
    const { hs_code, origin_country, destination_country, date = 'current' } = params;

    // Section 301 only applies to China → USA
    if (origin_country !== 'China' && origin_country !== 'CN') {
      return {
        success: true,
        data: {
          rate: 0,
          list: null,
          applicable: false,
          reason: 'Section 301 only applies to Chinese-origin goods'
        }
      };
    }

    if (destination_country !== 'US') {
      return {
        success: true,
        data: {
          rate: 0,
          list: null,
          applicable: false,
          reason: 'Section 301 only applies to imports entering the USA'
        }
      };
    }

    // Query database cache (populated by Federal Register sync)
    // NO AI CALLS - cache is source of truth
    return this.getDatabaseCache(hs_code);
  }

  /**
   * Query database cache for Section 301 rate
   * Cache is populated by Federal Register sync (daily cron job)
   *
   * This is NOT a "fallback" - database cache IS the primary source of truth
   * Federal Register sync keeps it current (runs daily at 06:00 UTC)
   */
  async getDatabaseCache(hsCode) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase
        .from('policy_tariffs_cache')
        .select('*')
        .eq('hs_code', hsCode)
        .order('verified_date', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No cached data available - Federal Register hasn't indexed this HS code yet
        return {
          success: false,
          error: 'No Section 301 data in cache (HS code not yet indexed by Federal Register sync)',
          fallback_rate: 0,
          fallback_warning: '⚠️ HS code not found in policy_tariffs_cache - Federal Register may not have published Section 301 status for this product yet. Assuming 0% but verify manually at USTR.gov before shipment.'
        };
      }

      // Check cache age (warn if > 25 days old - approaching 30-day expiry)
      const cacheAge = Date.now() - new Date(data.verified_date).getTime();
      const daysOld = Math.floor(cacheAge / (24 * 60 * 60 * 1000));
      const isStale = data.is_stale || daysOld > 25;

      return {
        success: true,
        data: {
          rate: parseFloat(data.section_301) || 0,
          rate_percentage: (parseFloat(data.section_301) || 0) * 100,
          list: null, // Federal Register sync doesn't extract list assignment (varies by notice)
          applicable: parseFloat(data.section_301) > 0,
          confidence: isStale ? 'low' : (daysOld > 14 ? 'medium' : 'high'),
          effective_date: data.verified_date,
          last_changed: data.verified_date,
          source: data.data_source || 'Federal Register automated sync',
          source_url: data.source_url || null,
          notes: isStale
            ? `⚠️ Rate verified ${daysOld} days ago (${data.verified_date}) - approaching expiry, reverify before shipment`
            : `Verified ${data.verified_date} from ${data.data_source}`,
          cache_age_days: daysOld,
          expires_at: data.expires_at,
          is_stale: isStale
        },
        metadata: {
          source: 'policy_tariffs_cache',
          cache_hit: true,
          sync_type: 'federal_register_automated'
        }
      };

    } catch (error) {
      console.error('[Section301Agent] Database cache query failed:', error);

      return {
        success: false,
        error: 'Database cache query failed for Section 301 lookup',
        fallback_rate: 0,
        fallback_warning: '⚠️ CRITICAL: Unable to query policy_tariffs_cache - database connection failed. Verify Supabase credentials and table structure.'
      };
    }
  }

  /**
   * ⚠️ DEPRECATED - No longer used
   * Section 301 rates now come from policy_tariffs_cache (populated by Federal Register sync)
   * AI parsing is NOT used for rate lookup - only for extracting data from Federal Register notices
   */
  parseResponse(response) {
    console.warn('[Section301Agent] parseResponse called but is deprecated - rates come from database cache, not AI');

    try {
      const parsed = super.parseResponse(response);

      // Validate required fields
      if (!parsed || typeof parsed.rate === 'undefined') {
        throw new Error('Missing required field: rate');
      }

      // Ensure rate is numeric
      parsed.rate = parseFloat(parsed.rate);
      parsed.rate_percentage = parsed.rate * 100;

      // Validate rate is within expected range (0-100%)
      if (parsed.rate < 0 || parsed.rate > 1.0) {
        console.warn(`[Section301Agent] Unusual rate: ${parsed.rate} (${parsed.rate_percentage}%)`);
      }

      return parsed;

    } catch (error) {
      console.error('[Section301Agent] Parse error:', error.message);
      throw error;
    }
  }
}

export default Section301Agent;
