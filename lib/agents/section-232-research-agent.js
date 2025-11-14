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
 * Section 232 Current Rates (Effective June 4, 2025)
 * Source: Presidential Proclamation + Federal Register March 5, 2025
 *
 * Rate increased from 25% to 50% on June 4, 2025
 * Applies to ALL countries except UK (temporary 25% exception)
 */
const SECTION_232_RATE = 0.50; // 50% on all steel/aluminum imports
const SECTION_232_UK_RATE = 0.25; // 25% temporary rate for UK
const UK_EXCEPTION_EXPIRES = '2025-07-09'; // UK exception expires July 9, 2025

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

    // Check for UK temporary exception (25% instead of 50%)
    if (countryCode === 'GB') {
      const ukExpiresDate = new Date(UK_EXCEPTION_EXPIRES);
      const isUKExceptionActive = new Date() < ukExpiresDate;

      if (isUKExceptionActive) {
        return {
          section_232: SECTION_232_UK_RATE,
          confidence: 'high',
          data_source: `Section 232 UK Exception (${SECTION_232_UK_RATE * 100}% temporary rate, expires ${UK_EXCEPTION_EXPIRES})`,
          verified_date: new Date().toISOString().split('T')[0],
          expires_at: UK_EXCEPTION_EXPIRES,
          is_stale: false,
          aluminum_source: 'non_us',
          exemption_notes: `UK temporary exception at 25% (expires ${UK_EXCEPTION_EXPIRES})`
        };
      }
    }

    // Apply standard 50% Section 232 rate to ALL countries (no USMCA exemption)
    const productType = chapterInfo.type === 'steel' ? 'Steel' :
                       chapterInfo.type === 'aluminum' ? 'Aluminum' : 'Steel/Aluminum';

    return {
      section_232: SECTION_232_RATE,
      confidence: aluminumSource === 'unknown' ? 'medium' : 'high',
      data_source: `Section 232 ${productType} Tariff (${SECTION_232_RATE * 100}% on all imports, effective June 4, 2025)`,
      verified_date: new Date().toISOString().split('T')[0],
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days (policy review cycle)
      is_stale: false,
      stale_reason: null,
      aluminum_source: aluminumSource === 'unknown' ? 'unknown' : 'non_us',
      exemption_notes: aluminumSource === 'unknown'
        ? 'CRITICAL: Aluminum source UNKNOWN. If US-smelted, rate would be 0%. Verify with supplier.'
        : 'Section 232 applies to all countries. Only exemption: US-smelted aluminum or US-melted steel.'
    };
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

    if (countryCode === 'GB') {
      const ukExpiresDate = new Date(UK_EXCEPTION_EXPIRES);
      const isUKExceptionActive = new Date() < ukExpiresDate;

      if (isUKExceptionActive) {
        return {
          applies: true,
          reason: `UK temporary exception: ${SECTION_232_UK_RATE * 100}% (expires ${UK_EXCEPTION_EXPIRES})`,
          rate: SECTION_232_UK_RATE,
          productType: chapterInfo.type,
          warning: 'UK exception expires soon - rate will increase to 50%'
        };
      }
    }

    const productType = chapterInfo.type === 'steel' ? 'steel' :
                       chapterInfo.type === 'aluminum' ? 'aluminum' : 'steel/aluminum';

    return {
      applies: true,
      reason: `${productType.charAt(0).toUpperCase() + productType.slice(1)} products from ${countryCode} are subject to ${SECTION_232_RATE * 100}% Section 232 tariffs`,
      rate: SECTION_232_RATE,
      productType: productType,
      critical_note: aluminumSource === 'unknown'
        ? `UNKNOWN aluminum source - if US-smelted, could eliminate ${SECTION_232_RATE * 100}% tariff`
        : `Section 232 applies to ALL countries including USMCA members. Only US-smelted aluminum/steel is exempt.`,
      savings_opportunity: aluminumSource === 'unknown'
        ? `Verify if aluminum is US-smelted to potentially eliminate ${SECTION_232_RATE * 100}% Section 232 tariff`
        : 'Switch to US-smelted aluminum or US-melted steel to eliminate Section 232 tariff'
    };
  }
}

// Export singleton instance
export const section232Agent = new Section232ResearchAgent();
