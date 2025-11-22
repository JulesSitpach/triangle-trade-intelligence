/**
 * CANADA SOURCING CONFIG
 * Static lookup tables for Canada nearshoring analysis
 *
 * Data based on:
 * - USMCA treaty analysis and Canadian trade advantages
 * - Industry benchmarks (aerospace, critical minerals, advanced manufacturing)
 * - Canadian geographic and technological advantages
 *
 * Cost Premium: % increase from switching China → Canada
 * Setup Cost: One-time investment for supply chain transition
 * Implementation Timeline: Weeks to complete transition
 */

export const CANADA_SOURCING_CONFIG = {
  /**
   * Industry-specific sourcing data
   * Key: Industry sector (from config/country-classifications.js)
   */
  industries: {
    'Electronics': {
      cost_premium_percent: 5.0,      // Canada higher labor costs than Mexico
      setup_cost_usd: 55000,           // Supplier qualification + tooling
      implementation_weeks: 12,        // 3 months for electronics ramp
      reasoning: 'Canada excels in precision electronics (Toronto, Vancouver tech hubs)',
      payback_months: 5,
      strengths: ['High-tech components', 'IoT devices', 'Clean energy electronics']
    },
    'Automotive': {
      cost_premium_percent: 4.0,      // Canadian auto sector competitive
      setup_cost_usd: 70000,           // Complex tooling + quality certs
      implementation_weeks: 16,        // ~4 months for auto parts
      reasoning: 'Ontario auto corridor (Windsor-Toronto) well-established',
      payback_months: 5,
      strengths: ['EV batteries', 'Critical minerals', 'Precision machining']
    },
    'Textiles': {
      cost_premium_percent: 8.0,      // Canada NOT competitive for textiles
      setup_cost_usd: 35000,           // Less established supply chain
      implementation_weeks: 14,        // Longer ramp (smaller textile base)
      reasoning: 'Limited textile manufacturing - Mexico better option',
      payback_months: 8,
      strengths: ['Technical fabrics', 'Protective gear', 'Cold-weather apparel']
    },
    'Machinery': {
      cost_premium_percent: 3.5,      // Canada strong in precision manufacturing
      setup_cost_usd: 65000,           // Advanced tooling investment
      implementation_weeks: 14,        // ~3.5 months for complex machinery
      reasoning: 'Strong precision manufacturing base (Montreal, Toronto)',
      payback_months: 4,
      strengths: ['Aerospace components', 'Precision machining', 'Robotics']
    },
    'Medical Devices': {
      cost_premium_percent: 3.0,      // Canada competitive for medical
      setup_cost_usd: 80000,           // Regulatory certification required
      implementation_weeks: 16,        // ~4 months for Health Canada approval
      reasoning: 'Strong pharma/medical R&D sector (Montreal, Toronto)',
      payback_months: 5,
      strengths: ['Diagnostics', 'Surgical instruments', 'Biomedical devices']
    },
    'Chemicals': {
      cost_premium_percent: 4.5,      // Canadian chemical sector competitive
      setup_cost_usd: 90000,           // Facility upgrades for regulations
      implementation_weeks: 18,        // ~4.5 months for chemical processes
      reasoning: 'Established chemical sector (Alberta, Ontario)',
      payback_months: 6,
      strengths: ['Specialty chemicals', 'Clean tech materials', 'Pharmaceuticals']
    },
    'Critical Minerals': {
      cost_premium_percent: 2.0,      // Canada dominates critical minerals
      setup_cost_usd: 75000,           // Mining/processing partnerships
      implementation_weeks: 20,        // ~5 months for supply agreements
      reasoning: 'Canada is global leader in lithium, cobalt, nickel, rare earths',
      payback_months: 3,
      strengths: ['Battery materials', 'EV components', 'Clean energy storage']
    },
    'Aerospace': {
      cost_premium_percent: 3.0,      // Canada aerospace globally competitive
      setup_cost_usd: 95000,           // Aerospace certification complex
      implementation_weeks: 22,        // ~5.5 months for aerospace quals
      reasoning: 'Montreal aerospace cluster (Bombardier, Pratt & Whitney)',
      payback_months: 4,
      strengths: ['Aircraft components', 'Precision parts', 'Composite materials']
    }
  },

  /**
   * Complexity-based adjustments
   * Apply as multiplier to base industry costs
   */
  complexityAdjustments: {
    'simple': {
      cost_multiplier: 0.8,            // Simple assembly = lower premium
      setup_multiplier: 0.6,           // Minimal tooling needed
      timeline_multiplier: 0.7         // Faster ramp-up
    },
    'medium': {
      cost_multiplier: 1.0,            // Base rates
      setup_multiplier: 1.0,           // Standard tooling
      timeline_multiplier: 1.0         // Standard timeline
    },
    'complex': {
      cost_multiplier: 1.2,            // Complex = more expensive (Canada good at this)
      setup_multiplier: 1.4,           // Significant tooling
      timeline_multiplier: 1.3         // Longer ramp-up
    },
    'advanced': {
      cost_multiplier: 1.4,            // Advanced engineering = Canada specialty
      setup_multiplier: 1.8,           // Extensive tooling/IP transfer
      timeline_multiplier: 1.5         // Canada efficient for advanced tech
    }
  },

  /**
   * Volume-based cost reductions
   * Higher volume = economies of scale
   * Input: annual_trade_volume in USD
   */
  getVolumeDiscount(annualVolume) {
    if (annualVolume < 100000) return 0;           // <$100k: no discount
    if (annualVolume < 500000) return 0.08;        // $100k-$500k: 8% reduction
    if (annualVolume < 1000000) return 0.12;       // $500k-$1M: 12% reduction
    if (annualVolume < 5000000) return 0.18;       // $1M-$5M: 18% reduction
    return 0.22;                                    // >$5M: 22% reduction
  },

  /**
   * Calculate Canada sourcing metrics for a product
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
      cost_premium_percent: Math.max(1.0, cost_premium_percent),  // Min 1.0% premium (Canada higher costs)
      setup_cost_usd,
      implementation_weeks,
      payback_months: industryData.payback_months,
      strengths: industryData.strengths || [],
      confidence: 0.85,  // High confidence from historical data
      source: 'canada_sourcing_config'
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
  },

  /**
   * Canadian Geographic Advantages
   * Match user's location with best Canadian sourcing region
   */
  geographicAdvantages: {
    'Eastern US': {
      regions: ['Ontario (Toronto, Windsor)', 'Quebec (Montreal)'],
      shipping_advantage: 'Shorter distance than Mexico for NY, PA, MI, OH',
      time_savings_days: 2
    },
    'Midwest US': {
      regions: ['Ontario (Windsor, London)', 'Manitoba (Winnipeg)'],
      shipping_advantage: 'Direct highway access via Detroit-Windsor corridor',
      time_savings_days: 1
    },
    'Western US': {
      regions: ['British Columbia (Vancouver)', 'Alberta (Calgary, Edmonton)'],
      shipping_advantage: 'Pacific Northwest access, energy sector proximity',
      time_savings_days: 1
    }
  }
};

export default CANADA_SOURCING_CONFIG;
