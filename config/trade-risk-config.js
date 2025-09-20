/**
 * TRADE RISK CONFIGURATION
 * Centralized configuration for trade risk analysis parameters
 * All values configurable via environment variables
 */

// Environment-driven configuration with fallbacks
const TRADE_RISK_CONFIG = {
  // Tariff rates (configurable via env)
  tariffRates: {
    section301: parseFloat(process.env.SECTION_301_TARIFF_RATE || '0.25'),
    defaultTariff: parseFloat(process.env.DEFAULT_TARIFF_RATE || '0.10'),
    electronics: parseFloat(process.env.ELECTRONICS_TARIFF_RATE || '0.25'),
    automotive: parseFloat(process.env.AUTOMOTIVE_TARIFF_RATE || '0.275'),
    textiles: parseFloat(process.env.TEXTILES_TARIFF_RATE || '0.15')
  },

  // Risk probabilities (configurable)
  probabilities: {
    section301: process.env.SECTION_301_PROBABILITY || "high",
    electronics: process.env.ELECTRONICS_RISK_PROBABILITY || "elevated",
    usmcaChanges: process.env.USMCA_CHANGES_PROBABILITY || "moderate",
    supplyChainDisruption: process.env.SUPPLY_CHAIN_RISK_PROBABILITY || "elevated"
  },

  // Risk reduction strategies effectiveness
  riskReduction: {
    alternativeManufacturing: parseFloat(process.env.ALT_MANUFACTURING_REDUCTION || '0.75'),
    diversifiedNetwork: parseFloat(process.env.DIVERSIFIED_NETWORK_REDUCTION || '0.60'),
    multiRouteLogistics: parseFloat(process.env.MULTI_ROUTE_REDUCTION || '0.45'),
    triangleRouting: parseFloat(process.env.TRIANGLE_ROUTING_REDUCTION || '0.50'),
    complianceOptimization: parseFloat(process.env.COMPLIANCE_OPTIMIZATION_REDUCTION || '0.35')
  },

  // Business thresholds
  thresholds: {
    highVolumeTrader: parseInt(process.env.HIGH_VOLUME_THRESHOLD || '500000'),
    minimumImpact: parseInt(process.env.MINIMUM_IMPACT_THRESHOLD || '50000'),
    urgentResponse: parseInt(process.env.URGENT_RESPONSE_THRESHOLD || '100000'),
    enterpriseClient: parseInt(process.env.ENTERPRISE_CLIENT_THRESHOLD || '1000000')
  },

  // Geographic regions (configurable)
  regions: {
    primary: process.env.PRIMARY_REGION || 'North America',
    alternative: process.env.ALTERNATIVE_REGION || 'Latin America',
    riskRegion: process.env.HIGH_RISK_REGION || 'Asia',
    lowRiskRegion: process.env.LOW_RISK_REGION || 'Mexico'
  },

  // Alert severity levels
  severityLevels: {
    critical: {
      label: 'CRITICAL',
      threshold: parseFloat(process.env.CRITICAL_THRESHOLD || '0.20'),
      color: 'danger'
    },
    high: {
      label: 'HIGH',
      threshold: parseFloat(process.env.HIGH_THRESHOLD || '0.15'),
      color: 'warning'
    },
    medium: {
      label: 'MEDIUM',
      threshold: parseFloat(process.env.MEDIUM_THRESHOLD || '0.10'),
      color: 'info'
    },
    low: {
      label: 'LOW',
      threshold: parseFloat(process.env.LOW_THRESHOLD || '0.05'),
      color: 'success'
    }
  },

  // Industry-specific risk multipliers
  industryRiskMultipliers: {
    electronics: parseFloat(process.env.ELECTRONICS_RISK_MULTIPLIER || '1.5'),
    automotive: parseFloat(process.env.AUTOMOTIVE_RISK_MULTIPLIER || '1.3'),
    textiles: parseFloat(process.env.TEXTILES_RISK_MULTIPLIER || '1.2'),
    machinery: parseFloat(process.env.MACHINERY_RISK_MULTIPLIER || '1.4'),
    chemicals: parseFloat(process.env.CHEMICALS_RISK_MULTIPLIER || '1.1'),
    default: parseFloat(process.env.DEFAULT_RISK_MULTIPLIER || '1.0')
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