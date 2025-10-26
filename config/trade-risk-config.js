/**
 * TRADE RISK CONFIGURATION
 * Centralized configuration for trade risk analysis parameters
 * All values configurable via environment variables
 */

// Environment-driven configuration - NO FALLBACKS (must be set in .env or fetched from AI/database)
const TRADE_RISK_CONFIG = {
  // Tariff rates (MUST come from AI or database at runtime)
  // These values should NEVER be used directly - they exist only for type checking
  tariffRates: {
    section301: parseFloat(process.env.SECTION_301_TARIFF_RATE), // NO FALLBACK - must query AI
    defaultTariff: parseFloat(process.env.DEFAULT_TARIFF_RATE), // NO FALLBACK - must query AI
    electronics: parseFloat(process.env.ELECTRONICS_TARIFF_RATE), // NO FALLBACK - must query AI by HS code
    automotive: parseFloat(process.env.AUTOMOTIVE_TARIFF_RATE), // NO FALLBACK - must query AI by HS code
    textiles: parseFloat(process.env.TEXTILES_TARIFF_RATE) // NO FALLBACK - must query AI by HS code
  },

  // Risk probabilities (configurable)
  probabilities: {
    section301: process.env.SECTION_301_PROBABILITY || "high",
    electronics: process.env.ELECTRONICS_RISK_PROBABILITY || "elevated",
    usmcaChanges: process.env.USMCA_CHANGES_PROBABILITY || "moderate",
    supplyChainDisruption: process.env.SUPPLY_CHAIN_RISK_PROBABILITY || "elevated"
  },

  // Risk reduction strategies effectiveness (NO FALLBACKS - must be set explicitly)
  riskReduction: {
    alternativeManufacturing: parseFloat(process.env.ALT_MANUFACTURING_REDUCTION), // NO FALLBACK
    diversifiedNetwork: parseFloat(process.env.DIVERSIFIED_NETWORK_REDUCTION), // NO FALLBACK
    multiRouteLogistics: parseFloat(process.env.MULTI_ROUTE_REDUCTION), // NO FALLBACK
    triangleRouting: parseFloat(process.env.TRIANGLE_ROUTING_REDUCTION), // NO FALLBACK
    complianceOptimization: parseFloat(process.env.COMPLIANCE_OPTIMIZATION_REDUCTION) // NO FALLBACK
  },

  // Business thresholds (NO FALLBACKS - must be explicitly configured)
  thresholds: {
    highVolumeTrader: parseInt(process.env.HIGH_VOLUME_THRESHOLD), // NO FALLBACK
    minimumImpact: parseInt(process.env.MINIMUM_IMPACT_THRESHOLD), // NO FALLBACK
    urgentResponse: parseInt(process.env.URGENT_RESPONSE_THRESHOLD), // NO FALLBACK
    enterpriseClient: parseInt(process.env.ENTERPRISE_CLIENT_THRESHOLD) // NO FALLBACK
  },

  // Geographic regions (configurable)
  regions: {
    primary: process.env.PRIMARY_REGION || 'North America',
    alternative: process.env.ALTERNATIVE_REGION || 'Latin America',
    riskRegion: process.env.HIGH_RISK_REGION || 'Asia',
    lowRiskRegion: process.env.LOW_RISK_REGION || 'Mexico'
  },

  // Alert severity levels (NO FALLBACKS)
  severityLevels: {
    critical: {
      label: 'CRITICAL',
      threshold: parseFloat(process.env.CRITICAL_THRESHOLD), // NO FALLBACK
      color: 'danger'
    },
    high: {
      label: 'HIGH',
      threshold: parseFloat(process.env.HIGH_THRESHOLD), // NO FALLBACK
      color: 'warning'
    },
    medium: {
      label: 'MEDIUM',
      threshold: parseFloat(process.env.MEDIUM_THRESHOLD), // NO FALLBACK
      color: 'info'
    },
    low: {
      label: 'LOW',
      threshold: parseFloat(process.env.LOW_THRESHOLD), // NO FALLBACK
      color: 'success'
    }
  },

  // Industry-specific risk multipliers (NO FALLBACKS)
  industryRiskMultipliers: {
    electronics: parseFloat(process.env.ELECTRONICS_RISK_MULTIPLIER), // NO FALLBACK
    automotive: parseFloat(process.env.AUTOMOTIVE_RISK_MULTIPLIER), // NO FALLBACK
    textiles: parseFloat(process.env.TEXTILES_RISK_MULTIPLIER), // NO FALLBACK
    machinery: parseFloat(process.env.MACHINERY_RISK_MULTIPLIER), // NO FALLBACK
    chemicals: parseFloat(process.env.CHEMICALS_RISK_MULTIPLIER), // NO FALLBACK
    default: parseFloat(process.env.DEFAULT_RISK_MULTIPLIER) // NO FALLBACK
  },

  // Implementation timelines (configurable)
  timelines: {
    mexico: process.env.MEXICO_IMPLEMENTATION_TIMELINE || "3-6 months",
    latinAmerica: process.env.LATIN_AMERICA_TIMELINE || "4-8 months",
    logistics: process.env.LOGISTICS_TIMELINE || "2-4 months",
    canada: process.env.CANADA_ROUTING_TIMELINE || "2-3 months"
  }
};

// Helper functions for risk calculations
export const calculateRiskImpact = (tradeVolume, tariffRate, probability = 1.0) => {
  return tradeVolume * tariffRate * probability;
};

export const getSeverityLevel = (impactAmount) => {
  const config = TRADE_RISK_CONFIG;

  if (impactAmount >= config.thresholds.enterpriseClient * config.severityLevels.critical.threshold) {
    return config.severityLevels.critical;
  } else if (impactAmount >= config.thresholds.highVolumeTrader * config.severityLevels.high.threshold) {
    return config.severityLevels.high;
  } else if (impactAmount >= config.thresholds.minimumImpact * config.severityLevels.medium.threshold) {
    return config.severityLevels.medium;
  } else {
    return config.severityLevels.low;
  }
};

export const getIndustryRiskMultiplier = (industry) => {
  const industryKey = industry?.toLowerCase() || 'default';
  return TRADE_RISK_CONFIG.industryRiskMultipliers[industryKey] ||
         TRADE_RISK_CONFIG.industryRiskMultipliers.default;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (decimal) => {
  return `${Math.round(decimal * 100)}%`;
};

export default TRADE_RISK_CONFIG;