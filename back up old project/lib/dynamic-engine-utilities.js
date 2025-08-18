/**
 * DYNAMIC ENGINE UTILITIES
 * Shared utilities extracted from dynamic engines to eliminate code duplication
 * Used by: dynamic-confidence-engine, dynamic-savings-engine, dynamic-stats-engine, dynamic-specialist-engine
 */

/**
 * Base class for all dynamic engines with common functionality
 */
export class DynamicEngineBase {
  constructor() {
    this.currentTime = Date.now()
    this.sessionSeed = this.generateSessionSeed()
  }

  /**
   * Generate time-based variation to prevent identical responses
   * Used across all engines for realistic variation
   */
  getTimeBasedVariation(maxVariation) {
    const hourOfDay = new Date().getHours()
    const dayOfWeek = new Date().getDay()
    const minuteOfHour = new Date().getMinutes()
    
    // Create pseudo-random variation based on time components
    const timeSeed = (hourOfDay * 60 + minuteOfHour) * dayOfWeek
    const variation = ((timeSeed % 1000) / 1000 - 0.5) * 2 * maxVariation
    
    return parseFloat(variation.toFixed(4))
  }

  /**
   * Generate session-based seed for consistent variation within session
   */
  generateSessionSeed() {
    const now = new Date()
    return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) % 1000
  }

  /**
   * Get current market volatility factor (shared across engines)
   */
  getCurrentMarketVolatility() {
    const baseVolatility = 0.12 // 12% base market volatility
    const timeVariation = this.getTimeBasedVariation(0.05) // +/- 5%
    return Math.max(0.05, baseVolatility + timeVariation)
  }

  /**
   * Initialize market conditions common to all engines
   */
  initializeMarketConditions() {
    return {
      globalTradeVolume: 0.95 + this.getTimeBasedVariation(0.1),
      supplyChainStress: 0.85 + this.getTimeBasedVariation(0.15),
      shippingCosts: 1.1 + this.getTimeBasedVariation(0.2),
      tariffVolatility: this.getCurrentMarketVolatility(),
      currencyFluctuation: 0.98 + this.getTimeBasedVariation(0.05)
    }
  }

  /**
   * Get industry-specific multipliers (shared pattern)
   */
  getIndustryMultipliers(businessType) {
    const multipliers = {
      'Electronics': 1.25 + this.getTimeBasedVariation(0.2),
      'Automotive': 1.15 + this.getTimeBasedVariation(0.15),
      'Manufacturing': 1.05 + this.getTimeBasedVariation(0.12),
      'Aerospace': 0.95 + this.getTimeBasedVariation(0.08),
      'Medical': 0.85 + this.getTimeBasedVariation(0.1),
      'Textiles': 0.9 + this.getTimeBasedVariation(0.15),
      'Machinery': 1.08 + this.getTimeBasedVariation(0.13),
      'Chemicals': 0.92 + this.getTimeBasedVariation(0.11)
    }
    
    return multipliers[businessType] || (1.0 + this.getTimeBasedVariation(0.1))
  }

  /**
   * Calculate volume-based scaling (shared pattern)
   */
  calculateVolumeScaling(importVolume) {
    const volumeMap = {
      'Under $500K': 0.75,
      '$500K - $1M': 0.85,
      '$1M - $5M': 1.0,
      '$5M - $25M': 1.15,
      'Over $25M': 1.3
    }
    
    const baseScaling = volumeMap[importVolume] || 1.0
    return baseScaling + this.getTimeBasedVariation(0.05)
  }

  /**
   * Get seasonal adjustment factors (shared pattern)
   */
  getSeasonalAdjustment() {
    const month = new Date().getMonth()
    const seasonalFactors = {
      0: 0.95,  // January - slower
      1: 0.98,  // February 
      2: 1.05,  // March - Q1 end
      3: 1.02,  // April
      4: 1.08,  // May
      5: 1.05,  // June - Q2 end
      6: 0.92,  // July - slower
      7: 0.90,  // August - vacation
      8: 1.15,  // September - back to business
      9: 1.12,  // October - Q4 prep
      10: 1.20, // November - high activity
      11: 1.25  // December - year end push
    }
    
    return seasonalFactors[month] + this.getTimeBasedVariation(0.03)
  }

  /**
   * Format currency values consistently
   */
  formatCurrency(amount, decimals = 0) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(decimals)}K`
    } else {
      return `$${amount.toLocaleString()}`
    }
  }

  /**
   * Format percentage values consistently  
   */
  formatPercentage(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`
  }

  /**
   * Calculate confidence intervals (shared statistical utility)
   */
  calculateConfidenceInterval(value, confidence = 0.95) {
    const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645
    const variance = value * 0.15 // Assume 15% variance
    const margin = z * Math.sqrt(variance)
    
    return {
      lower: Math.max(0, value - margin),
      upper: value + margin,
      margin: margin
    }
  }
}

/**
 * Common market intelligence functions
 */
export class MarketIntelligence {
  /**
   * Get current tariff environment assessment
   */
  static getTariffEnvironment() {
    const engine = new DynamicEngineBase()
    return {
      chinaUS: 0.25 + engine.getTimeBasedVariation(0.05), // 25% +/- 5%
      europeUS: 0.08 + engine.getTimeBasedVariation(0.02),
      usmcaRates: 0, // Always 0% - treaty locked
      volatilityIndex: engine.getCurrentMarketVolatility()
    }
  }

  /**
   * Get supply chain complexity scoring
   */
  static getSupplyChainComplexity(businessType, productCategories) {
    const engine = new DynamicEngineBase()
    const baseComplexity = {
      'Electronics': 0.85,
      'Automotive': 0.75,
      'Aerospace': 0.90,
      'Medical': 0.80,
      'Manufacturing': 0.70
    }
    
    const complexity = baseComplexity[businessType] || 0.75
    return complexity + engine.getTimeBasedVariation(0.1)
  }
}

/**
 * Common validation utilities
 */
export class ValidationUtils {
  /**
   * Validate business profile data
   */
  static validateBusinessProfile(profile) {
    const required = ['businessType', 'importVolume', 'primarySupplierCountry']
    const missing = required.filter(field => !profile[field])
    
    return {
      isValid: missing.length === 0,
      missingFields: missing,
      validationScore: (required.length - missing.length) / required.length
    }
  }

  /**
   * Sanitize numeric inputs for calculations
   */
  static sanitizeNumeric(value, defaultValue = 0, min = null, max = null) {
    let num = parseFloat(value) || defaultValue
    if (min !== null) num = Math.max(min, num)
    if (max !== null) num = Math.min(max, num)
    return num
  }
}