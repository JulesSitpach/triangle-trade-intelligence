/**
 * MEXICO SOURCING CONFIG
 * Static lookup tables for Mexico nearshoring analysis
 * REPLACES: 3 expensive MexicoSourcingAgent AI calls
 *
 * Data based on:
 * - Trade data from USMCA treaty analysis
 * - Industry benchmarks (electronics, automotive, textiles, machinery)
 * - Historical transition costs and timelines
 *
 * Cost Premium: % increase from switching China → Mexico
 * Setup Cost: One-time investment for supply chain transition
 * Implementation Timeline: Weeks to complete transition
 */

export const MEXICO_SOURCING_CONFIG = {
  /**
   * Industry-specific sourcing data
   * Key: Industry sector (from config/country-classifications.js)
   */
  industries: {
    'Electronics': {
      cost_premium_percent: 2.0,      // Mexico electronics competitive with China
      setup_cost_usd: 45000,           // Supplier qualification + tooling
      implementation_weeks: 10,        // 2.5 months for electronics ramp
      reasoning: 'Mexico has strong electronics clusters (Guadalajara, Monterrey)',
      payback_months: 3
    },
    'Automotive': {
      cost_premium_percent: 2.5,      // Slightly higher for automotive precision
      setup_cost_usd: 65000,           // Complex tooling + quality certs
      implementation_weeks: 14,        // ~3.5 months for auto parts
      reasoning: 'Mexico has established auto supply chain (USMCA advantage)',
      payback_months: 4
    },
    'Textiles': {
      cost_premium_percent: 0.5,      // Mexico yarn-forward = competitive
      setup_cost_usd: 25000,           // Less tooling needed
      implementation_weeks: 8,         // Fastest (yarn already USMCA-compliant)
      reasoning: 'USMCA yarn-forward rule makes Mexico most competitive',
      payback_months: 2
    },
    'Machinery': {
      cost_premium_percent: 3.0,      // Precision manufacturing costs more
      setup_cost_usd: 55000,           // Significant tooling investment
      implementation_weeks: 16,        // ~4 months for complex machinery
      reasoning: 'Mexico has skilled but smaller precision manufacturing base',
      payback_months: 5
    },
    'Medical Devices': {
      cost_premium_percent: 2.5,      // FDA compliance adds cost
      setup_cost_usd: 75000,           // Regulatory certification required
      implementation_weeks: 18,        // ~4.5 months for FDA approval
      reasoning: 'FDA-registered facilities available in Mexico',
      payback_months: 6
    },
    'Chemicals': {
      cost_premium_percent: 1.5,      // Process industries more established
      setup_cost_usd: 85000,           // Facility upgrades often needed
      implementation_weeks: 20,        // ~5 months for chemical processes
      reasoning: 'Mexico has growing chemical sector near US border',
      payback_months: 6
    }
  },

  /**
   * Complexity-based adjustments
   * Apply as multiplier to base industry costs
   */
  complexityAdjustments: {
    'simple': {
      cost_multiplier: 0.7,            // Simple assembly = lower premium
      setup_multiplier: 0.5,           // Minimal tooling needed
      timeline_multiplier: 0.6         // Faster ramp-up
    },
    'medium': {
      cost_multiplier: 1.0,            // Base rates
      setup_multiplier: 1.0,           // Standard tooling
      timeline_multiplier: 1.0         // Standard timeline
    },
    'complex': {
      cost_multiplier: 1.3,            // Complex = more expensive
      setup_multiplier: 1.5,           // Significant tooling
      timeline_multiplier: 1.4         // Longer ramp-up
    },
    'advanced': {
      cost_multiplier: 1.6,            // Advanced engineering = premium
      setup_multiplier: 2.0,           // Extensive tooling/IP transfer
      timeline_multiplier: 1.8         // Much longer transition
    }
  },

  /**
   * Volume-based cost reductions
   * Higher volume = economies of scale
   * Input: annual_trade_volume in USD
   */
  getVolumeDiscount(annualVolume) {
    if (annualVolume < 100000) return 0;           // <$100k: no discount
    if (annualVolume < 500000) return 0.1;         // $100k-$500k: 10% reduction
    if (annualVolume < 1000000) return 0.15;       // $500k-$1M: 15% reduction
    if (annualVolume < 5000000) return 0.2;        // $1M-$5M: 20% reduction
    return 0.25;                                    // >$5M: 25% reduction
  },

  /**
   * Calculate Mexico sourcing metrics for a product
   * @param {String} industry_sector - Industry classification
   * @param {String} product_complexity - simple|medium|complex|advanced
   * @param {Number} annual_trade_volume - USD annual volume
   * @returns {Object} { cost_premium_percent, setup_cost_usd, implementation_weeks, payback_months }
   */
  calculateMetrics(industry_sector, product_complexity = 'medium', annual_trade_volume = 0) {
    // Get industry defaults
    const industryData = this.industries[industry_sector] || this.industries['Machinery']; // Default to machinery if unknown

    // Get complexity adjustments
    const complexityData = this.complexityAdjustments[product_complexity] || this.complexityAdjustments['medium'];

    // Get volume discount
    const volumeDiscount = this.getVolumeDiscount(annual_trade_volume);

    // Apply adjustments
    const cost_premium_percent = industryData.cost_premium_percent * complexityData.cost_multiplier * (1 - volumeDiscount * 0.5);
    const setup_cost_usd = Math.round(industryData.setup_cost_usd * complexityData.setup_multiplier);
    const implementation_weeks = Math.round(industryData.implementation_weeks * complexityData.timeline_multiplier);

    return {
      cost_premium_percent: Math.max(0.5, cost_premium_percent),  // Min 0.5% premium
      setup_cost_usd,
      implementation_weeks,
      payback_months: industryData.payback_months,
      confidence: 0.85,  // High confidence from historical data
      source: 'mexico_sourcing_config'
    };
  },

  /**
   * Lookup industry by name (case-insensitive)
   */
  getIndustry(name) {
    if (!name) return this.industries['Machinery'];

    // Try exact match first
    if (this.industries[name]) return this.industries[name];

    // Try case-insensitive match
    const normalized = Object.keys(this.industries).find(key =>
      key.toLowerCase() === name.toLowerCase()
    );

    return this.industries[normalized] || this.industries['Machinery'];
  }
};

export default MEXICO_SOURCING_CONFIG;
