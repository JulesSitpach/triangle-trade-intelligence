/**
 * COUNTRY CLASSIFICATIONS
 * Centralized country groupings for flexible market expansion
 *
 * Benefits:
 * - Add new markets without code changes
 * - Easy to update trade policies
 * - Flexible risk assessment
 * - Business logic stays in config
 *
 * Updated: October 15, 2025
 */

/**
 * USMCA Member Countries
 * Free trade agreement members
 */
export const USMCA_COUNTRIES = ['US', 'CA', 'MX'];

/**
 * High Tariff Risk Countries
 * Countries with elevated tariff exposure
 */
export const HIGH_TARIFF_RISK_COUNTRIES = [
  'CN',  // China
  'RU',  // Russia
  'BY',  // Belarus
  'KP',  // North Korea
  'IR',  // Iran
  'SY',  // Syria
  'VE'   // Venezuela
];

/**
 * Nearshoring Target Countries
 * Priority markets for supply chain diversification
 */
export const NEARSHORING_TARGETS = [
  'MX',  // Mexico (primary)
  'CO',  // Colombia
  'CR',  // Costa Rica
  'DO',  // Dominican Republic
  'GT',  // Guatemala
  'HN',  // Honduras
  'SV',  // El Salvador
  'NI',  // Nicaragua
  'PA',  // Panama
  'PE',  // Peru
  'CL'   // Chile
];

/**
 * Strategic Manufacturing Hubs
 * Countries with strong manufacturing infrastructure
 */
export const MANUFACTURING_HUBS = [
  'CN',  // China
  'MX',  // Mexico
  'VN',  // Vietnam
  'IN',  // India
  'TH',  // Thailand
  'MY',  // Malaysia
  'ID',  // Indonesia
  'PH',  // Philippines
  'BD',  // Bangladesh
  'PK',  // Pakistan
  'TR',  // Turkey
  'PL',  // Poland
  'RO',  // Romania
  'CZ'   // Czech Republic
];

/**
 * Advanced Manufacturing Centers
 * Countries with high-tech manufacturing capabilities
 */
export const ADVANCED_MANUFACTURING = [
  'US',  // United States
  'DE',  // Germany
  'JP',  // Japan
  'KR',  // South Korea
  'TW',  // Taiwan
  'IL',  // Israel
  'CH',  // Switzerland
  'SE',  // Sweden
  'SG'   // Singapore
];

/**
 * COUNTRY CODE TO FULL NAME MAPPING
 * For official USMCA certificates and legal documentation
 */
export const COUNTRY_NAMES = {
  // USMCA Countries
  'US': 'United States',
  'CA': 'Canada',
  'MX': 'Mexico',

  // High-volume manufacturing countries
  'CN': 'China',
  'VN': 'Vietnam',
  'IN': 'India',
  'TH': 'Thailand',
  'MY': 'Malaysia',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'BD': 'Bangladesh',
  'PK': 'Pakistan',
  'TR': 'Turkey',
  'PL': 'Poland',
  'RO': 'Romania',
  'CZ': 'Czech Republic',

  // Nearshoring countries
  'CO': 'Colombia',
  'CR': 'Costa Rica',
  'DO': 'Dominican Republic',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'SV': 'El Salvador',
  'NI': 'Nicaragua',
  'PA': 'Panama',
  'PE': 'Peru',
  'CL': 'Chile',

  // Advanced manufacturing
  'DE': 'Germany',
  'JP': 'Japan',
  'KR': 'South Korea',
  'TW': 'Taiwan',
  'IL': 'Israel',
  'CH': 'Switzerland',
  'SE': 'Sweden',
  'SG': 'Singapore',

  // High tariff risk
  'RU': 'Russia',
  'BY': 'Belarus',
  'KP': 'North Korea',
  'IR': 'Iran',
  'SY': 'Syria',
  'VE': 'Venezuela'
};

/**
 * Convert ISO country code to full name for official documents
 * @param {string} countryCode - 2-letter ISO code (e.g., 'MX', 'US', 'CA')
 * @returns {string} Full country name (e.g., 'Mexico', 'United States', 'Canada')
 */
export function getCountryFullName(countryCode) {
  if (!countryCode) return '';
  const code = countryCode.toUpperCase();
  return COUNTRY_NAMES[code] || countryCode; // Return code if mapping not found
}

/**
 * Helper function to check if country is USMCA member
 */
export function isUSMCACountry(countryCode) {
  return USMCA_COUNTRIES.includes(countryCode);
}

/**
 * Helper function to check if country has high tariff risk
 */
export function isHighTariffRisk(countryCode) {
  return HIGH_TARIFF_RISK_COUNTRIES.includes(countryCode);
}

/**
 * Helper function to check if country is nearshoring target
 */
export function isNearshoringTarget(countryCode) {
  return NEARSHORING_TARGETS.includes(countryCode);
}

/**
 * Helper function to check if country is manufacturing hub
 */
export function isManufacturingHub(countryCode) {
  return MANUFACTURING_HUBS.includes(countryCode);
}

/**
 * Helper function to get country risk profile
 */
export function getCountryRiskProfile(countryCode) {
  if (isUSMCACountry(countryCode)) {
    return {
      level: 'LOW',
      category: 'USMCA Member',
      color: 'text-green',
      recommendation: 'Preferential tariff treatment available'
    };
  }

  if (isHighTariffRisk(countryCode)) {
    return {
      level: 'HIGH',
      category: 'Elevated Tariff Risk',
      color: 'text-red',
      recommendation: 'Consider nearshoring alternatives'
    };
  }

  if (isNearshoringTarget(countryCode)) {
    return {
      level: 'LOW',
      category: 'Nearshoring Opportunity',
      color: 'text-blue',
      recommendation: 'Strategic diversification market'
    };
  }

  return {
    level: 'MODERATE',
    category: 'Standard Market',
    color: 'text-amber',
    recommendation: 'Standard tariff rates apply'
  };
}

/**
 * Helper function to get alternative sourcing suggestions
 */
export function getAlternativeSourcingCountries(currentCountry) {
  // If high risk, suggest nearshoring
  if (isHighTariffRisk(currentCountry)) {
    return NEARSHORING_TARGETS;
  }

  // If non-USMCA, suggest Mexico first
  if (!isUSMCACountry(currentCountry)) {
    return ['MX', ...NEARSHORING_TARGETS.filter(c => c !== 'MX')];
  }

  // If already optimal, return other USMCA countries
  return USMCA_COUNTRIES.filter(c => c !== currentCountry);
}

export default {
  USMCA_COUNTRIES,
  HIGH_TARIFF_RISK_COUNTRIES,
  NEARSHORING_TARGETS,
  MANUFACTURING_HUBS,
  ADVANCED_MANUFACTURING,
  COUNTRY_NAMES,
  isUSMCACountry,
  isHighTariffRisk,
  isNearshoringTarget,
  isManufacturingHub,
  getCountryRiskProfile,
  getAlternativeSourcingCountries,
  getCountryFullName
};
