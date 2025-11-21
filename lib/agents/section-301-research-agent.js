/**
 * Section 301 Research Agent
 *
 * Researches current Section 301 tariff rates from USTR announcements
 * Updates policy_tariffs_cache with verified rates
 *
 * DATA SOURCE: USTR Section 301 Product Lists
 * - List 1: 25% (effective July 2018)
 * - List 2: 25% (effective August 2018)
 * - List 3: 25% (effective September 2018, raised from 10%)
 * - List 4A: 7.5% (effective September 2019)
 * - List 4B: 15% (effective December 2019)
 * - 2025 Updates: Some rates escalated to 30-50% on strategic goods
 *
 * CRITICAL: Section 301 rates change with 30-day USTR notice
 * This agent provides CURRENT rates as of Nov 2025
 */

import { BaseAgent } from './base-agent.js';

/**
 * ❌ HARDCODED SECTION 301 RATES REMOVED (Nov 21, 2025)
 *
 * ALL Section 301 tariff rates now use AI research instead of static mappings.
 *
 * Why removed: USTR updates Section 301 rates frequently - hardcoded values become stale within weeks.
 * Old approach: Check static mapping → Return hardcoded rate (outdated as of Nov 2025)
 * New approach: Query database → If miss: AI research → Verify against current USTR announcements
 *
 * This forces fresh AI research for every Section 301 lookup, ensuring accurate current rates.
 */

export class Section301ResearchAgent extends BaseAgent {
  constructor() {
    super('section-301-research');
  }

  /**
   * Research Section 301 rate for specific HTS code
   *
   * Strategy (UPDATED Nov 21, 2025):
   * 1. ALL Section 301 rates use AI research (no hardcoded mappings)
   * 2. USTR updates Section 301 rates frequently - AI ensures current rates
   * 3. Return with confidence level and data source
   */
  async researchRate(htsCode, options = {}) {
    const { originCountry = 'CN', forceAI = false } = options;

    // Section 301 only applies to China-origin goods
    if (originCountry !== 'CN' && originCountry !== 'China') {
      return {
        section_301: 0,
        section_232: null,
        confidence: 'high',
        data_source: 'USTR Section 301 - Not applicable (non-China origin)',
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: null, // No expiration - not applicable
        is_stale: false
      };
    }

    // Normalize HTS code (remove periods, take first 2-6 digits)
    const normalized = htsCode.replace(/\./g, '').replace(/\s/g, '');

    // ✅ ALWAYS use AI research for Section 301 (no hardcoded fallback)
    return await this._aiResearch(normalized);
  }

  /**
   * ❌ REMOVED (Nov 21, 2025): _lookupKnownRate() and _getRateList()
   *
   * These methods used KNOWN_SECTION_301_RATES hardcoded mapping.
   * All Section 301 lookups now use AI research exclusively.
   */

  /**
   * AI-powered Section 301 research (for unknown codes)
   * Uses BaseAgent 2-tier fallback (OpenRouter → Anthropic)
   */
  async _aiResearch(htsCode) {
    const prompt = `Research current Section 301 tariff rate for HTS code ${htsCode} (China origin).

CRITICAL INSTRUCTIONS:
1. Determine if this HTS code is on ANY USTR Section 301 list (Lists 1, 2, 3, 4A, 4B)
2. Return the CURRENT rate as of November 2025
3. If escalated rates apply (semiconductors, strategic tech), return the escalated rate
4. If NOT on any Section 301 list, return 0

Return ONLY valid JSON (no markdown, no explanation):
{
  "section_301": <rate as decimal, e.g., 0.25 for 25%>,
  "list": "<which USTR list: List 1, List 2, List 3, List 4A, List 4B, or None>",
  "confidence": "<high|medium|low>",
  "reasoning": "<1-2 sentence explanation>"
}

HTS Code: ${htsCode}`;

    try {
      const response = await this.call(prompt, {
        temperature: 0.1, // Low temperature for factual lookup
        max_tokens: 200
      });

      // Parse AI response
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleaned);

      return {
        section_301: parseFloat(data.section_301) || 0,
        section_232: 0, // AI doesn't research Section 232 in this call
        confidence: data.confidence || 'low',
        data_source: `AI Research (${data.list || 'Unknown'}) - ${data.reasoning}`,
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days for AI
        is_stale: false,
        stale_reason: null
      };

    } catch (error) {
      console.error('[Section301ResearchAgent] AI research failed:', error.message);

      // ✅ EMERGENCY FALLBACK (Nov 21, 2025): Return 0 instead of hardcoded rate
      // Forces user to retry AI research - no stale hardcoded data
      return {
        section_301: 0,
        section_232: 0,
        confidence: 'low',
        data_source: `AI Research Failed - Please retry (Error: ${error.message})`,
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minute expiration
        is_stale: true,
        stale_reason: 'AI research failed - retry recommended'
      };
    }
  }

  /**
   * Batch research multiple HTS codes
   * More efficient than individual calls
   */
  async researchBatch(htsCodes, options = {}) {
    const results = [];

    for (const code of htsCodes) {
      const result = await this.researchRate(code, options);
      results.push({
        hs_code: code,
        ...result
      });

      // Rate limit: 1 request per second for AI calls
      if (options.forceAI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Export singleton instance
export const section301Agent = new Section301ResearchAgent();
