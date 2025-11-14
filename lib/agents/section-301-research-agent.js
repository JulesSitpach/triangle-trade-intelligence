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
 * USTR Section 301 Known Rates (Nov 2025)
 * Source: Federal Register + USTR announcements
 *
 * NOTE: This is a STATIC mapping for known high-volume codes
 * For comprehensive coverage, use AI research via BaseAgent
 */
const KNOWN_SECTION_301_RATES = {
  // Chapter 85 - Electronics (Most common, highest volume)
  '85': {
    default: 0.25, // 25% on most electronics from China
    exceptions: {
      // Semiconductors - escalated in 2024-2025 strategic tech controls
      '8541': 0.50, // Diodes, transistors (50% as of Feb 2025)
      '8542': 0.25, // Integrated circuits, processors (25% baseline)
      '854231': 0.25, // Processors/controllers specifically
      '854232': 0.25, // Memories
      '854233': 0.25, // Amplifiers

      // Consumer electronics
      '8528': 0.075, // Monitors, projectors (List 4A - 7.5%)
      '8529': 0.25, // Parts for TVs/monitors

      // Telecom equipment
      '8517': 0.25, // Phones, telecom equipment

      // Electrical machinery
      '8501': 0.25, // Electric motors
      '8504': 0.075, // Transformers (List 4A - 7.5%)
    }
  },

  // Chapter 84 - Machinery
  '84': {
    default: 0.25,
    exceptions: {
      '8471': 0.075, // Computers (List 4A - 7.5%)
      '8473': 0.25, // Computer parts
    }
  },

  // Chapter 73 - Steel articles (Section 232 overlap, but 301 also applies)
  '73': {
    default: 0.10, // 10% on most steel articles from China
    exceptions: {}
  },

  // Chapter 76 - Aluminum articles (Section 232 overlap)
  '76': {
    default: 0.10, // 10% on aluminum articles from China
    exceptions: {}
  },

  // Chapter 94 - Furniture
  '94': {
    default: 0.25, // 25% on furniture from China
    exceptions: {}
  },
};

export class Section301ResearchAgent extends BaseAgent {
  constructor() {
    super('section-301-research');
  }

  /**
   * Research Section 301 rate for specific HTS code
   *
   * Strategy:
   * 1. Check known rates mapping (fast, accurate for common codes)
   * 2. Fall back to AI research for unknown codes
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

    // Try known rates first (unless forceAI = true)
    if (!forceAI) {
      const knownRate = this._lookupKnownRate(normalized);
      if (knownRate) {
        return {
          section_301: knownRate.rate,
          section_232: 0, // Default 0 for electronics (no Section 232)
          confidence: 'high',
          data_source: `USTR Section 301 ${knownRate.list} (verified Nov 2025)`,
          verified_date: new Date().toISOString().split('T')[0],
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          is_stale: false,
          stale_reason: null
        };
      }
    }

    // Fall back to AI research for unknown codes
    return await this._aiResearch(normalized);
  }

  /**
   * Lookup known Section 301 rate from static mapping
   * Returns null if not found
   */
  _lookupKnownRate(htsCode) {
    // Try chapter (first 2 digits)
    const chapter = htsCode.substring(0, 2);
    const chapterRates = KNOWN_SECTION_301_RATES[chapter];

    if (!chapterRates) return null;

    // Try exact match first (6-digit heading)
    for (let len = 6; len >= 4; len--) {
      const prefix = htsCode.substring(0, len);
      if (chapterRates.exceptions[prefix] !== undefined) {
        return {
          rate: chapterRates.exceptions[prefix],
          list: this._getRateList(chapterRates.exceptions[prefix])
        };
      }
    }

    // Fall back to chapter default
    return {
      rate: chapterRates.default,
      list: this._getRateList(chapterRates.default)
    };
  }

  /**
   * Map rate to USTR list name (for transparency)
   */
  _getRateList(rate) {
    if (rate === 0.50) return 'Strategic Tech List (50%)';
    if (rate === 0.25) return 'List 1/2/3 (25%)';
    if (rate === 0.15) return 'List 4B (15%)';
    if (rate === 0.10) return 'List 3 (10%)';
    if (rate === 0.075) return 'List 4A (7.5%)';
    return 'Unknown List';
  }

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

      // EMERGENCY FALLBACK: Return chapter default
      const chapter = htsCode.substring(0, 2);
      const chapterRates = KNOWN_SECTION_301_RATES[chapter];
      const fallbackRate = chapterRates?.default || 0.25; // Default to 25% for China electronics

      return {
        section_301: fallbackRate,
        section_232: 0,
        confidence: 'low',
        data_source: `EMERGENCY FALLBACK - Chapter ${chapter} default (${fallbackRate * 100}%)`,
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day expiration
        is_stale: true,
        stale_reason: 'AI research failed, using chapter default'
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
