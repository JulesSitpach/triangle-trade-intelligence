/**
 * SECTION 301 AGENT
 * Dynamic Section 301 tariff rate lookup based on HS code and current USTR lists
 *
 * REPLACES: Hardcoded 0.25 (25%) assumption in enrichment-router.js
 *
 * Section 301 rates vary by HS code and USTR list assignment:
 * - List 1: 25%
 * - List 2: 25%
 * - List 3: 25% or 7.5% (depending on product)
 * - List 4A: 7.5% or 15% or 25%
 * - List 4B: Exclusions (0%)
 * - Unlisted: 0%
 *
 * Rate changes require 30-day notice but can be modified retroactively
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

    // Build AI prompt for current Section 301 status
    const prompt = this.buildSection301Prompt(hs_code, date);

    // Execute with 2-tier fallback (OpenRouter → Anthropic)
    const result = await this.execute(prompt, { temperature: 0 });

    if (!result.success) {
      console.error('[Section301Agent] AI lookup failed:', result.error);

      // Fallback: Use database cache if available
      // NOTE: Database cache should be updated daily for Section 301 volatility
      return this.getDatabaseFallback(hs_code);
    }

    return result;
  }

  /**
   * Build Section 301 research prompt
   */
  buildSection301Prompt(hsCode, date) {
    const today = new Date().toISOString().split('T')[0];
    const dateContext = date === 'current' ? today : date;

    return `Research current US Section 301 tariff rate for Chinese imports.

===== PRODUCT DETAILS =====
HS Code: ${hsCode}
Origin: China (CN)
Destination: United States
Date: ${dateContext}

===== YOUR TASK =====
Determine the CURRENT Section 301 additional tariff rate for this HS code.

USTR Section 301 List Structure:
- List 1: 25% (first wave, early 2018)
- List 2: 25% (second wave, mid-2018)
- List 3: 25% or 7.5% (third wave, late 2018, rates vary)
- List 4A: 7.5% baseline, increased to 15% or 25% (2019+)
- List 4B: Initially excluded, some later added
- Unlisted: 0% (not covered by Section 301)

Recent Changes (2024-2025):
- Some List 3 rates increased (check USTR for specific HS codes)
- Some List 4A rates increased (check USTR for specific HS codes)
- New products added to lists (check Federal Register)
- Some exclusions granted (check Federal Register for specific HS codes)

===== RESPONSE FORMAT =====
Return ONLY valid JSON:
{
  "rate": 0.25,
  "rate_percentage": 25,
  "list": "List 4A",
  "applicable": true,
  "confidence": "high",
  "effective_date": "${dateContext}",
  "last_changed": "2024-09-01",
  "source": "USTR Section 301 Federal Register Notice",
  "notes": "Brief explanation of list assignment and rate"
}

If HS code is NOT subject to Section 301:
{
  "rate": 0,
  "rate_percentage": 0,
  "list": null,
  "applicable": false,
  "confidence": "high",
  "effective_date": "${dateContext}",
  "source": "USTR Section 301 - Not Listed",
  "notes": "HS code not on any Section 301 list"
}

CRITICAL: Return actual rate for THIS specific HS code, not a generic 25%.`;
  }

  /**
   * Database fallback when AI unavailable
   * Queries section_301_cache table (should be populated daily)
   */
  async getDatabaseFallback(hsCode) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase
        .from('section_301_cache')
        .select('*')
        .eq('hs_code', hsCode)
        .order('cached_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // No cached data available
        return {
          success: false,
          error: 'No Section 301 data available (AI and database both unavailable)',
          fallback_rate: 0,
          fallback_warning: '⚠️ Unable to determine Section 301 rate - assuming 0% but Chinese goods typically incur Section 301 tariffs (check USTR for specific HS code)'
        };
      }

      // Check cache age (warn if > 7 days old)
      const cacheAge = Date.now() - new Date(data.cached_at).getTime();
      const daysOld = Math.floor(cacheAge / (24 * 60 * 60 * 1000));

      return {
        success: true,
        data: {
          rate: parseFloat(data.rate),
          rate_percentage: parseFloat(data.rate) * 100,
          list: data.list_assignment,
          applicable: data.rate > 0,
          confidence: daysOld > 7 ? 'medium' : 'high',
          effective_date: data.effective_date,
          last_changed: data.last_changed,
          source: 'Database cache (AI unavailable)',
          notes: daysOld > 7
            ? `⚠️ Cache is ${daysOld} days old - rate may have changed`
            : 'Recent cache data',
          cache_age_days: daysOld
        },
        metadata: {
          source: 'database_fallback',
          cache_hit: true
        }
      };

    } catch (error) {
      console.error('[Section301Agent] Database fallback failed:', error);

      return {
        success: false,
        error: 'Both AI and database failed for Section 301 lookup',
        fallback_rate: 0,
        fallback_warning: '⚠️ CRITICAL: Unable to determine Section 301 rate - system unavailable'
      };
    }
  }

  /**
   * Override base parseResponse to handle Section 301 specific format
   */
  parseResponse(response) {
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
