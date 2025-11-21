/**
 * Section 232 Research Agent
 *
 * Researches current Section 232 tariff rates (steel/aluminum tariffs)
 * Updates policy_tariffs_cache with verified rates
 *
 * DATA SOURCE: Presidential Proclamations 9704, 10895, 10896
 * Federal Register: https://www.federalregister.gov/documents/2025/03/05/2025-03598
 *
 * CURRENT RATES (as of June 4, 2025):
 * - Steel & Aluminum: 50% on ALL countries (increased from 25% on March 12, 2025)
 * - UK Exception: 25% (extended until at least July 9, 2025)
 * - NO USMCA exemption: Canada and Mexico pay 50% Section 232
 *
 * ONLY EXEMPTION:
 * - US-smelted aluminum (smelted and cast in USA) → 0% Section 232
 * - US-melted steel (melted and poured in USA) → 0% Section 232
 *
 * CRITICAL: Section 232 applies to ALL countries
 * - China: Pays Section 301 (25%) + Section 232 (50%) = 75% policy tariffs
 * - Mexico/Canada: Pay Section 232 (50%) even with USMCA qualification
 * - UK: Pays Section 232 (25%) - temporary exception
 * - All others: Pay Section 232 (50%)
 *
 * COVERAGE:
 * - Primary steel/aluminum: Chapters 72, 73, 76
 * - 407 derivatives added August 2025: Chapters 73, 76, 83, 84, 85, 87, 94
 * - Specific HTS codes in headings 9903.81.87, 9903.81.89-91
 */

import { BaseAgent } from './base-agent.js';

/**
 * ❌ HARDCODED SECTION 232 RATES REMOVED (Nov 21, 2025)
 *
 * ALL Section 232 tariff rates now use AI research instead of static constants.
 *
 * Why removed: Presidential Proclamations update Section 232 rates frequently:
 * - Header says 50% (as of March 12, 2025)
 * - Deleted constants said 25% steel / 10% aluminum (Nov 20, 2025 "fix")
 * - This conflict proves hardcoded values become stale
 *
 * New approach: Query policy_tariffs_cache → If miss: AI research → Verify against Federal Register
 */

/**
 * Steel/Aluminum Chapters
 * These HTS chapters are subject to Section 232
 */
const STEEL_ALUMINUM_CHAPTERS = {
  // Primary products
  '72': { type: 'steel', description: 'Iron and steel' },
  '73': { type: 'steel', description: 'Articles of iron or steel' },
  '76': { type: 'aluminum', description: 'Aluminum and articles thereof' },

  // Derivatives (added August 2025)
  '83': { type: 'mixed', description: 'Miscellaneous articles of base metal (steel/aluminum components)' },
  '84': { type: 'mixed', description: 'Machinery with steel/aluminum parts' },
  '85': { type: 'mixed', description: 'Electrical machinery with steel/aluminum parts' },
  '87': { type: 'mixed', description: 'Vehicles with steel/aluminum components' },
  '94': { type: 'mixed', description: 'Furniture with steel/aluminum parts' }
};

/**
 * Country code normalization
 */
const COUNTRY_CODE_MAP = {
  'CA': 'CA',
  'Canada': 'CA',
  'CANADA': 'CA',
  'MX': 'MX',
  'Mexico': 'MX',
  'MEXICO': 'MX',
  'US': 'US',
  'USA': 'US',
  'United States': 'US',
  'UNITED STATES': 'US',
  'CN': 'CN',
  'China': 'CN',
  'CHINA': 'CN',
  'GB': 'GB',
  'UK': 'GB',
  'United Kingdom': 'GB',
  'UNITED KINGDOM': 'GB'
};

export class Section232ResearchAgent extends BaseAgent {
  constructor() {
    super('section-232-research');
  }

  /**
   * Research Section 232 rate for specific HTS code + origin country
   *
   * Strategy:
   * 1. Check if chapter is steel/aluminum (72, 73, 76, 83, 84, 85, 87, 94)
   * 2. Check if country is UK (temporary 25% exception)
   * 3. Check if aluminum_source is US-smelted (exemption)
   * 4. Otherwise apply 50% to ALL countries (no USMCA exemption)
   */
  async researchRate(htsCode, options = {}) {
    const { originCountry, aluminumSource = 'unknown', forceAI = false } = options;

    if (!originCountry) {
      throw new Error('Section 232 requires originCountry parameter');
    }

    // Normalize HTS code (remove periods, take first 2 digits for chapter)
    const normalized = htsCode.replace(/\./g, '').replace(/\s/g, '');
    const chapter = normalized.substring(0, 2);

    // Normalize country code
    const countryCode = this._normalizeCountryCode(originCountry);

    // Check if this chapter has Section 232 tariffs
    const chapterInfo = STEEL_ALUMINUM_CHAPTERS[chapter];

    if (!chapterInfo) {
      // Not a steel/aluminum chapter - no Section 232 applies
      return {
        section_232: 0,
        confidence: 'high',
        data_source: 'Section 232 - Not applicable (non-steel/aluminum product)',
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: null, // No expiration - not applicable
        is_stale: false,
        aluminum_source: null,
        exemption_notes: 'Section 232 only applies to steel/aluminum and derivatives'
      };
    }

    // Check for US-smelted exemption (only applies if explicitly verified)
    if (aluminumSource === 'us_smelted') {
      return {
        section_232: 0,
        confidence: 'high',
        data_source: 'Section 232 - EXEMPT (US-smelted/melted aluminum/steel)',
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: null, // No expiration - permanent exemption
        is_stale: false,
        aluminum_source: 'us_smelted',
        exemption_notes: 'Made from aluminum exclusively smelted and cast in the United States, or steel exclusively melted and poured in the United States'
      };
    }

    // ✅ USE AI RESEARCH for current Section 232 rates (Nov 21, 2025)
    return await this._aiResearch(normalized, chapterInfo, aluminumSource);
  }

  /**
   * AI-powered Section 232 research for current rates
   * Uses BaseAgent 2-tier fallback (OpenRouter → Anthropic)
   */
  async _aiResearch(htsCode, chapterInfo, aluminumSource) {
    const productType = chapterInfo.type === 'aluminum' ? 'aluminum' :
                       chapterInfo.type === 'steel' ? 'steel' : 'steel/aluminum';

    const prompt = `Research current Section 232 tariff rate for ${productType} products (HTS code ${htsCode}).

CRITICAL INSTRUCTIONS:
1. Determine the CURRENT Section 232 rate as of November 2025
2. Check Federal Register for latest Presidential Proclamations (9704, 10895, 10896, or newer)
3. Section 232 applies to ALL countries (no USMCA exemption)
4. Only exemption: US-smelted aluminum or US-melted steel

Return ONLY valid JSON (no markdown, no explanation):
{
  "section_232": <rate as decimal, e.g., 0.50 for 50%>,
  "confidence": "<high|medium|low>",
  "data_source": "<Presidential Proclamation number and date>",
  "reasoning": "<1-2 sentence explanation of current rate>"
}

Product Type: ${productType}
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
        section_232: parseFloat(data.section_232) || 0,
        confidence: data.confidence || 'low',
        data_source: `AI Research - ${data.data_source}`,
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_stale: false,
        aluminum_source: aluminumSource === 'unknown' ? 'unknown' : 'non_us',
        exemption_notes: aluminumSource === 'unknown'
          ? `CRITICAL: Aluminum source UNKNOWN. If US-smelted, rate would be 0%. Verify with supplier.`
          : `Section 232 applies to all countries. Only exemption: US-smelted aluminum or US-melted steel.`,
        ai_reasoning: data.reasoning
      };

    } catch (error) {
      console.error('[Section232ResearchAgent] AI research failed:', error.message);

      // ✅ EMERGENCY FALLBACK: Return 0 instead of hardcoded rate
      return {
        section_232: 0,
        confidence: 'low',
        data_source: `AI Research Failed - Please retry (Error: ${error.message})`,
        verified_date: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minute
        is_stale: true,
        stale_reason: 'AI research failed - retry recommended',
        aluminum_source: aluminumSource
      };
    }
  }

  /**
   * Normalize country code to standard format
   */
  _normalizeCountryCode(country) {
    if (!country) return 'UNKNOWN';

    const normalized = country.trim().toUpperCase();
    return COUNTRY_CODE_MAP[country] || COUNTRY_CODE_MAP[normalized] || normalized;
  }

  /**
   * Batch research multiple HTS codes (with same origin country and aluminum source)
   * More efficient than individual calls
   */
  async researchBatch(htsCodes, options = {}) {
    const results = [];

    for (const code of htsCodes) {
      const result = await this.researchRate(code, options);
      results.push({
        hs_code: code,
        origin_country: options.originCountry,
        ...result
      });
    }

    return results;
  }

  /**
   * Get summary of Section 232 applicability
   * Useful for UI display and user guidance
   */
  getSummary(htsCode, originCountry, aluminumSource = 'unknown') {
    const normalized = htsCode.replace(/\./g, '').replace(/\s/g, '');
    const chapter = normalized.substring(0, 2);
    const countryCode = this._normalizeCountryCode(originCountry);
    const chapterInfo = STEEL_ALUMINUM_CHAPTERS[chapter];

    if (!chapterInfo) {
      return {
        applies: false,
        reason: 'Section 232 only applies to steel/aluminum products and derivatives',
        rate: 0
      };
    }

    if (aluminumSource === 'us_smelted') {
      return {
        applies: false,
        reason: 'Exempt: Made from US-smelted aluminum or US-melted steel',
        rate: 0,
        exemption: 'us_smelted'
      };
    }

    // ✅ UPDATED (Nov 21, 2025): Use AI research instead of hardcoded rates
    // For checkApplicability, we don't want to make an AI call - just indicate it applies
    const productType = chapterInfo.type === 'steel' ? 'steel' :
                       chapterInfo.type === 'aluminum' ? 'aluminum' : 'steel/aluminum';

    return {
      applies: true,
      reason: `${productType.charAt(0).toUpperCase() + productType.slice(1)} products from ${countryCode} are subject to Section 232 tariffs (current rate varies - use researchRate() for exact percentage)`,
      rate: null, // ✅ Don't return hardcoded rate - use researchRate() method instead
      productType: productType,
      critical_note: aluminumSource === 'unknown'
        ? `UNKNOWN aluminum source - if US-smelted, Section 232 tariff could be eliminated`
        : `Section 232 applies to ALL countries including USMCA members. Only US-smelted aluminum/steel is exempt.`,
      savings_opportunity: aluminumSource === 'unknown'
        ? `Verify if aluminum is US-smelted to potentially eliminate Section 232 tariff`
        : 'Switch to US-smelted aluminum or US-melted steel to eliminate Section 232 tariff',
      note: 'Call researchRate() to get current Section 232 percentage (rates change via Presidential Proclamation)'
    };
  }
}

// Export singleton instance
export const section232Agent = new Section232ResearchAgent();
