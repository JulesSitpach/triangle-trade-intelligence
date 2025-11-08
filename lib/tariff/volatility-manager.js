/**
 * VOLATILITY MANAGER
 * Determines tariff rate volatility tier for HS code + origin country combinations
 * Forces AI research for volatile rates to prevent stale database lookups
 *
 * PROBLEM: Current system uses database cache for all lookups, but volatile
 * tariff rates (Section 301, reciprocal tariffs, IEEPA) change frequently.
 * Users make $100K+ decisions based on outdated rates.
 *
 * SOLUTION: 3-tier volatility system that bypasses cache for volatile combinations
 */

export class VolatilityManager {
  /**
   * Determine if HS code + origin + destination requires forced AI research
   * @param {String} hsCode - HS code (8 or 10 digits)
   * @param {String} originCountry - Where component is manufactured
   * @param {String} destinationCountry - Where component is imported to
   * @returns {Object} { tier, forceAI, cacheTTL, reason }
   */
  static getVolatilityTier(hsCode, originCountry, destinationCountry) {
    const origin = this.normalizeCountry(originCountry);
    const dest = this.normalizeCountry(destinationCountry);
    const hsChapter = hsCode ? hsCode.substring(0, 2) : null;

    // TIER 1: SUPER VOLATILE (Use database with short TTL, 24-hour cache max)
    // ✅ FIXED (Nov 8, 2025): Now using cron-synced policy_tariffs_cache instead of AI
    // Cron jobs sync Section 301/232 daily from Federal Register (more current than AI training)
    // These rates change weekly/monthly with policy announcements
    const superVolatile = this.checkSuperVolatile(hsCode, origin, dest);
    if (superVolatile) {
      return {
        tier: 1,
        volatility: 'super_volatile',
        forceAI: false,  // ✅ CHANGED: Use database (cron-synced is fresher than AI)
        cacheTTL: 24, // 24 hours
        bypassDatabase: false,  // ✅ CHANGED: Query policy_tariffs_cache (daily sync from Federal Register)
        reason: superVolatile.reason,
        warning: '⚠️ VOLATILE RATE: Using daily-synced database (Federal Register). Last updated: check cache_age_days.',
        policies: superVolatile.policies
      };
    }

    // TIER 2: VOLATILE (Force AI, 7-day cache)
    // These rates change with 30-90 day notice (Section 301, reciprocal tariffs)
    const volatile = this.checkVolatile(hsCode, origin, dest);
    if (volatile) {
      return {
        tier: 2,
        volatility: 'volatile',
        forceAI: true,
        cacheTTL: 168, // 7 days
        bypassDatabase: false, // Can check database first, but use short TTL
        reason: volatile.reason,
        warning: '⚠️ Policy-sensitive rate. Verifying current tariff.',
        policies: volatile.policies
      };
    }

    // TIER 3: STABLE (Database OK, 90-day cache)
    // Standard MFN rates, USMCA rates (rarely change)
    return {
      tier: 3,
      volatility: 'stable',
      forceAI: false,
      cacheTTL: 2160, // 90 days
      bypassDatabase: false,
      reason: 'Standard tariff rates (stable)',
      warning: null,
      policies: ['Standard MFN', 'USMCA']
    };
  }

  /**
   * TIER 1: Super Volatile Combinations
   * Always force AI research (database rates are guaranteed stale)
   */
  static checkSuperVolatile(hsCode, origin, dest) {
    const hsChapter = hsCode ? hsCode.substring(0, 2) : null;
    const hs4 = hsCode ? hsCode.substring(0, 4) : null;

    // 1. China → USA: Semiconductor/Electronics (HS 85)
    //    Section 301 rates change monthly, CHIPS Act restrictions
    if (origin === 'CN' && dest === 'US' && hsChapter === '85') {
      return {
        reason: 'China semiconductors/electronics to USA - Section 301 + CHIPS Act restrictions (rates change monthly)',
        policies: ['Section 301 (volatile)', 'CHIPS Act', 'Reciprocal Tariffs', 'IEEPA']
      };
    }

    // 2. China → USA: Strategic goods (semiconductors, batteries, solar, EVs)
    //    Executive orders and proclamations change rates with 0-30 day notice
    const strategicHS = ['8541', '8542', '8507', '8504', '8703', '8708', '8544'];
    if (origin === 'CN' && dest === 'US' && strategicHS.includes(hs4)) {
      return {
        reason: 'China strategic goods to USA - Multiple overlapping tariffs (Section 301 + reciprocal + IEEPA)',
        policies: ['Section 301', 'Reciprocal Tariffs', 'IEEPA', 'Strategic Trade Controls']
      };
    }

    // 3. Any → USA: Steel/Aluminum (HS 72, 73, 76)
    //    Section 232 adjustments, country-specific exemptions change frequently
    const metalChapters = ['72', '73', '76'];
    if (dest === 'US' && metalChapters.includes(hsChapter)) {
      return {
        reason: 'Steel/aluminum to USA - Section 232 rates and exemptions change by country/product',
        policies: ['Section 232', 'Country-specific exemptions', 'Reciprocal adjustments']
      };
    }

    // 4. China → USA: Any product under active trade war
    //    Reciprocal tariff announcements can change rates overnight
    if (origin === 'CN' && dest === 'US') {
      return {
        reason: 'China to USA - Active trade policy environment with frequent tariff changes',
        policies: ['Section 301 (baseline)', 'Reciprocal Tariffs', 'IEEPA emergency powers']
      };
    }

    return null; // Not super volatile
  }

  /**
   * TIER 2: Volatile Combinations
   * Should force AI research, but can check database first for recent cache
   */
  static checkVolatile(hsCode, origin, dest) {
    const hsChapter = hsCode ? hsCode.substring(0, 2) : null;

    // 1. China → Canada/Mexico: Section 301 circumvention monitoring
    //    Rates stable but enforcement changes frequently
    if (origin === 'CN' && (dest === 'CA' || dest === 'MX')) {
      return {
        reason: 'China to USMCA countries - Circumvention monitoring, rates may change',
        policies: ['Circumvention rules', 'Origin verification', 'Transshipment enforcement']
      };
    }

    // 2. Vietnam/Thailand/India → USA: Possible future reciprocal tariffs
    //    Not currently super volatile but could change with proclamation
    const emergingOrigins = ['VN', 'TH', 'IN', 'ID', 'MY'];
    if (emergingOrigins.includes(origin) && dest === 'US') {
      return {
        reason: 'Emerging Asia to USA - Potential reciprocal tariff targets',
        policies: ['Base MFN', 'Possible reciprocal tariffs', 'Trade monitoring']
      };
    }

    // 3. EU → USA: Pending negotiation items (aircraft, wine, digital services)
    //    Some products under discussion for tariff changes
    const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'GB'];
    if (euCountries.includes(origin) && dest === 'US') {
      const negotiationHS = ['88', '22', '04', '39']; // Aircraft, wine, dairy, plastics
      if (negotiationHS.includes(hsChapter)) {
        return {
          reason: 'EU to USA - Products under trade negotiation',
          policies: ['Base MFN', 'Pending trade agreements', 'Possible reciprocal measures']
        };
      }
    }

    // 4. Any → USA: Textiles/apparel (quota monitoring, safeguard investigations)
    const textileChapters = ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'];
    if (dest === 'US' && textileChapters.includes(hsChapter)) {
      return {
        reason: 'Textiles to USA - Quota monitoring and safeguard investigations',
        policies: ['Base MFN', 'Country quotas', 'Safeguard tariffs']
      };
    }

    return null; // Not volatile
  }

  /**
   * Get recommended cache TTL based on volatility
   * @param {String} hsCode
   * @param {String} origin
   * @param {String} dest
   * @returns {Number} Hours to cache
   */
  static getCacheTTL(hsCode, origin, dest) {
    const tier = this.getVolatilityTier(hsCode, origin, dest);
    return tier.cacheTTL;
  }

  /**
   * Check if database lookup should be bypassed entirely
   * @param {String} hsCode
   * @param {String} origin
   * @param {String} dest
   * @returns {Boolean} True if database is guaranteed stale
   */
  static shouldBypassDatabase(hsCode, origin, dest) {
    const tier = this.getVolatilityTier(hsCode, origin, dest);
    return tier.bypassDatabase;
  }

  /**
   * Get user-facing warning message for volatile rates
   * @param {String} hsCode
   * @param {String} origin
   * @param {String} dest
   * @returns {String|null} Warning message or null
   */
  static getVolatilityWarning(hsCode, origin, dest) {
    const tier = this.getVolatilityTier(hsCode, origin, dest);
    return tier.warning;
  }

  /**
   * Determine if fresh AI research is required (ignore cache)
   * @param {String} hsCode
   * @param {String} origin
   * @param {String} dest
   * @returns {Boolean} True if must call AI
   */
  static requiresFreshAIResearch(hsCode, origin, dest) {
    const tier = this.getVolatilityTier(hsCode, origin, dest);
    return tier.forceAI;
  }

  /**
   * Get list of applicable tariff policies for this combination
   * @param {String} hsCode
   * @param {String} origin
   * @param {String} dest
   * @returns {Array<String>} Policy names
   */
  static getApplicablePolicies(hsCode, origin, dest) {
    const tier = this.getVolatilityTier(hsCode, origin, dest);
    return tier.policies;
  }

  /**
   * Normalize country code to 2-letter format
   */
  static normalizeCountry(country) {
    if (!country) return null;

    const COUNTRY_MAP = {
      'China': 'CN',
      'United States': 'US',
      'USA': 'US',
      'Mexico': 'MX',
      'Canada': 'CA',
      'Vietnam': 'VN',
      'Thailand': 'TH',
      'India': 'IN',
      'Indonesia': 'ID',
      'Malaysia': 'MY',
      'Germany': 'DE',
      'France': 'FR',
      'Italy': 'IT',
      'Spain': 'ES',
      'Netherlands': 'NL',
      'Belgium': 'BE',
      'Poland': 'PL',
      'United Kingdom': 'GB',
      'GB': 'GB',
      'UK': 'GB'
    };

    return COUNTRY_MAP[country] || country.toUpperCase().substring(0, 2);
  }

  /**
   * Get detailed volatility report for logging/debugging
   * @param {String} hsCode
   * @param {String} origin
   * @param {String} dest
   * @returns {Object} Full volatility analysis
   */
  static getVolatilityReport(hsCode, origin, dest) {
    const tier = this.getVolatilityTier(hsCode, origin, dest);

    return {
      ...tier,
      hsCode,
      originCountry: origin,
      destinationCountry: dest,
      recommendation: tier.forceAI
        ? 'Use AI research for current rates'
        : 'Database lookup acceptable',
      cache_strategy: tier.bypassDatabase
        ? 'Bypass database, force AI'
        : `Check database first (${tier.cacheTTL}h TTL)`,
      user_impact: tier.tier === 1
        ? 'CRITICAL: Stale rate could cost user $50K-$500K in unexpected duties'
        : tier.tier === 2
        ? 'HIGH: Stale rate could cause compliance issues'
        : 'LOW: Standard rates, low volatility'
    };
  }
}

export default VolatilityManager;
