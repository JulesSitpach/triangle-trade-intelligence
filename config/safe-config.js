/**
 * SAFE HARDCODE REPLACEMENT CONFIG
 * Provides dynamic values while maintaining backward compatibility
 * Gradually replace hardcoded values without breaking existing functionality
 */

const getEnvValue = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * SAFE TABLE MAPPING
 * Maps logical names to actual table names
 * Can be changed via environment variables without code changes
 */
export const SAFE_TABLES = {
  // Primary data tables
  primaryHSTable: getEnvValue('PRIMARY_HS_TABLE', 'hs_master_rebuild'),
  comtradeRef: getEnvValue('COMTRADE_TABLE', 'comtrade_reference'),
  tariffRates: getEnvValue('TARIFF_TABLE', 'tariff_rates'),
  
  // USMCA tables  
  usmcaRules: getEnvValue('USMCA_RULES_TABLE', 'usmca_qualification_rules'),
  triangleRouting: getEnvValue('TRIANGLE_TABLE', 'triangle_routing_opportunities'),
  
  // System tables
  countries: getEnvValue('COUNTRIES_TABLE', 'countries'),
  tradeVolumes: getEnvValue('TRADE_VOLUMES_TABLE', 'trade_volume_mappings')
};

/**
 * SAFE COUNTRY CODES
 * Configurable USMCA country codes
 */
export const SAFE_COUNTRIES = {
  usmcaMembers: getEnvValue('USMCA_COUNTRIES', 'US,CA,MX').split(','),
  defaultDestination: getEnvValue('DEFAULT_DESTINATION', 'US'),
  defaultManufacturing: getEnvValue('DEFAULT_MANUFACTURING', 'MX'),
  
  // Individual codes (for backward compatibility)
  US: getEnvValue('US_CODE', 'US'),
  CA: getEnvValue('CA_CODE', 'CA'), 
  MX: getEnvValue('MX_CODE', 'MX')
};

/**
 * SAFE API ENDPOINTS
 * Configurable API paths
 */
export const SAFE_ENDPOINTS = {
  // Core APIs
  classification: getEnvValue('API_CLASSIFICATION', '/api/ai-classification'),
  compliance: getEnvValue('API_COMPLIANCE', '/api/database-driven-usmca-compliance'),
  dropdownOptions: getEnvValue('API_DROPDOWN', '/api/database-driven-dropdown-options'),
  
  // Trust APIs
  trustWorkflow: getEnvValue('API_TRUST_WORKFLOW', '/api/trust/complete-workflow'),
  trustProvenance: getEnvValue('API_TRUST_PROVENANCE', '/api/trust/data-provenance'),
  trustExpert: getEnvValue('API_TRUST_EXPERT', '/api/trust/expert-validation')
};

/**
 * SAFE BUSINESS RULES
 * Configurable thresholds and limits
 */
export const SAFE_BUSINESS = {
  // USMCA thresholds
  defaultRegionalContent: parseFloat(getEnvValue('USMCA_THRESHOLD', '62.5')),
  electronicsThreshold: parseFloat(getEnvValue('ELECTRONICS_THRESHOLD', '75.0')),
  automotiveThreshold: parseFloat(getEnvValue('AUTOMOTIVE_THRESHOLD', '75.0')),
  
  // Classification limits
  maxDescriptionLength: parseInt(getEnvValue('MAX_DESCRIPTION_LENGTH', '500')),
  minConfidenceThreshold: parseFloat(getEnvValue('MIN_CONFIDENCE', '0.3')),
  maxResults: parseInt(getEnvValue('MAX_CLASSIFICATION_RESULTS', '10')),
  
  // Timeouts
  apiTimeout: parseInt(getEnvValue('API_TIMEOUT_MS', '30000')),
  aiTimeout: parseInt(getEnvValue('AI_TIMEOUT_MS', '10000')),
  dbTimeout: parseInt(getEnvValue('DB_TIMEOUT_MS', '5000')),
  
  // Confidence thresholds (no hardcoded test values)
  excellentMatchThreshold: parseFloat(getEnvValue('EXCELLENT_MATCH_THRESHOLD', '95')),
  veryGoodMatchThreshold: parseFloat(getEnvValue('VERY_GOOD_MATCH_THRESHOLD', '85')),
  goodMatchThreshold: parseFloat(getEnvValue('GOOD_MATCH_THRESHOLD', '75')),
  fairMatchThreshold: parseFloat(getEnvValue('FAIR_MATCH_THRESHOLD', '65'))
};

/**
 * SAFE ERROR MESSAGES
 * Configurable user-facing messages
 */
export const SAFE_MESSAGES = {
  // Classification errors
  descriptionTooLong: getEnvValue('MSG_DESC_TOO_LONG', 'Product description too long. Maximum 500 characters.'),
  classificationFailed: getEnvValue('MSG_CLASSIFICATION_FAILED', 'Unable to classify product. Professional review recommended.'),
  noResults: getEnvValue('MSG_NO_RESULTS', 'No matching classifications found. Try a more specific description.'),
  
  // System errors
  apiTimeout: getEnvValue('MSG_API_TIMEOUT', 'Request timed out. Please try again.'),
  databaseError: getEnvValue('MSG_DB_ERROR', 'Database connection failed. Please contact support.'),
  initializationFailed: getEnvValue('MSG_INIT_FAILED', 'System initialization failed. Please contact support.'),
  
  // USMCA errors
  componentsRequired: getEnvValue('MSG_COMPONENTS_REQUIRED', 'Component origins are required for USMCA qualification'),
  invalidComponents: getEnvValue('MSG_INVALID_COMPONENTS', 'Component values must sum to more than zero'),
  tariffNotFound: getEnvValue('MSG_TARIFF_NOT_FOUND', 'Tariff rates not available for this product')
};

/**
 * HELPER FUNCTIONS
 * Safe replacement utilities
 */
export const safeReplace = {
  // Get table name safely
  table: (logicalName) => SAFE_TABLES[logicalName] || logicalName,
  
  // Get country code safely  
  country: (countryKey) => SAFE_COUNTRIES[countryKey] || countryKey,
  
  // Get endpoint safely
  endpoint: (endpointKey) => SAFE_ENDPOINTS[endpointKey] || endpointKey,
  
  // Get business rule safely
  business: (ruleKey) => SAFE_BUSINESS[ruleKey],
  
  // Get message safely
  message: (messageKey) => SAFE_MESSAGES[messageKey] || 'An error occurred'
};

export default {
  SAFE_TABLES,
  SAFE_COUNTRIES, 
  SAFE_ENDPOINTS,
  SAFE_BUSINESS,
  SAFE_MESSAGES,
  safeReplace
};