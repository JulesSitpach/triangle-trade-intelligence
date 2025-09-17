/**
 * TRIANGLE INTELLIGENCE SYSTEM CONFIGURATION
 * NO HARDCODED VALUES - ALL DATA DRIVEN
 * 
 * This configuration system replaces ALL hardcoded values throughout the application
 * Following the "NO HARD CODING" rule from the Holistic Reconstruction Plan
 * 
 * SCHEMA VERIFIED: 2025-08-28 - Uses actual database structure
 */

import { VERIFIED_TABLE_CONFIG } from './table-constants.js';

// Get configuration values from environment variables or database
const getEnvValue = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * CORE SYSTEM CONFIGURATION
 * All system-wide settings sourced from environment or database
 */
export const SYSTEM_CONFIG = {
  // Database Configuration
  database: {
    supabaseUrl: getEnvValue('NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey: getEnvValue('SUPABASE_SERVICE_ROLE_KEY'),
    anonKey: getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    connectionTimeout: parseInt(getEnvValue('DATABASE_TIMEOUT_MS', '10000')),
    queryTimeout: parseInt(getEnvValue('DATABASE_QUERY_TIMEOUT_MS', '5000'))
  },

  // API Configuration
  api: {
    timeout: parseInt(getEnvValue('API_TIMEOUT_MS', '30000')),
    retryAttempts: parseInt(getEnvValue('API_RETRY_ATTEMPTS', '3')),
    rateLimit: parseInt(getEnvValue('API_RATE_LIMIT_PER_MINUTE', '100')),
    useMockData: getEnvValue('USE_MOCK_APIS', 'false') === 'true'
  },

  // Cache Configuration
  cache: {
    defaultTtl: parseInt(getEnvValue('CACHE_DEFAULT_TTL_MS', '900000')), // 15 minutes
    tariffDataTtl: parseInt(getEnvValue('CACHE_TARIFF_TTL_MS', '3600000')), // 1 hour
    classificationTtl: parseInt(getEnvValue('CACHE_CLASSIFICATION_TTL_MS', '1800000')), // 30 minutes
    maxCacheSize: parseInt(getEnvValue('CACHE_MAX_SIZE', '10000'))
  },

  // Tariff Savings Validation Configuration
  tariff: {
    maxSavingsPercentage: parseFloat(getEnvValue('MAX_TARIFF_SAVINGS_PERCENTAGE', '85')),
    highSavingsThreshold: parseFloat(getEnvValue('HIGH_SAVINGS_THRESHOLD', '50')),
    extremeSavingsThreshold: parseFloat(getEnvValue('EXTREME_SAVINGS_THRESHOLD', '75')),
    requireValidationAbove: parseFloat(getEnvValue('REQUIRE_VALIDATION_ABOVE', '60')),
    mexicoProcessingCostPercent: parseFloat(getEnvValue('MEXICO_PROCESSING_COST_PERCENT', '3.0'))
  },

  // Classification Configuration
  classification: {
    minConfidenceThreshold: parseFloat(getEnvValue('MIN_CLASSIFICATION_CONFIDENCE', '0.3')),
    professionalReferralThreshold: parseFloat(getEnvValue('PROFESSIONAL_REFERRAL_THRESHOLD', '0.80')),
    maxKeywords: parseInt(getEnvValue('CLASSIFICATION_MAX_KEYWORDS', '8')),
    maxResults: parseInt(getEnvValue('CLASSIFICATION_MAX_RESULTS', '10')),
    
    // Confidence scoring bonuses - NO HARDCODED VALUES
    dataQualityThreshold: parseFloat(getEnvValue('DATA_QUALITY_THRESHOLD', '0.8')),
    dataQualityBonus: parseFloat(getEnvValue('DATA_QUALITY_BONUS', '0.02')),
    termMatchThreshold: parseFloat(getEnvValue('TERM_MATCH_THRESHOLD', '0.8')), 
    termMatchBonus: parseFloat(getEnvValue('TERM_MATCH_BONUS', '0.02')),
    usmcaBonus: parseFloat(getEnvValue('USMCA_ELIGIBLE_BONUS', '0.01')),
    businessTypeMatchBonus: parseFloat(getEnvValue('BUSINESS_TYPE_MATCH_BONUS', '0.15')),
    businessTypeSearchBonus: parseFloat(getEnvValue('BUSINESS_TYPE_SEARCH_BONUS', '0.10')),
    multiTermBonus: parseFloat(getEnvValue('MULTI_TERM_BONUS', '0.01')),
    baseConfidenceScore: parseFloat(getEnvValue('BASE_CONFIDENCE_SCORE', '0.5')),
    termScoreWeight: parseFloat(getEnvValue('TERM_SCORE_WEIGHT', '0.3')),
    dataQualityWeight: parseFloat(getEnvValue('DATA_QUALITY_WEIGHT', '0.3')),
    usmcaEligibilityBonus: parseFloat(getEnvValue('USMCA_ELIGIBILITY_BONUS', '0.15')),
    multiTermSearchBonus: parseFloat(getEnvValue('MULTI_TERM_SEARCH_BONUS', '0.05')),
    maxConfidence: parseFloat(getEnvValue('MAX_CONFIDENCE_SCORE', '0.98')),
    minConfidence: parseFloat(getEnvValue('MIN_CONFIDENCE_SCORE', '0.05')),
    highConfidenceThreshold: parseFloat(getEnvValue('HIGH_CONFIDENCE_THRESHOLD', '0.85')),
    
    // Data quality scoring - NO HARDCODED VALUES
    tariffRateScore: parseFloat(getEnvValue('TARIFF_RATE_SCORE', '0.3')),
    usmcaRateScore: parseFloat(getEnvValue('USMCA_RATE_SCORE', '0.3')),
    tariffDifferenceThreshold1: parseFloat(getEnvValue('TARIFF_DIFF_THRESHOLD_1', '1.0')),
    tariffDifferenceBonus1: parseFloat(getEnvValue('TARIFF_DIFF_BONUS_1', '0.2')),
    tariffDifferenceThreshold2: parseFloat(getEnvValue('TARIFF_DIFF_THRESHOLD_2', '5.0')),
    tariffDifferenceBonus2: parseFloat(getEnvValue('TARIFF_DIFF_BONUS_2', '0.1')),
    descriptionLengthThreshold: parseInt(getEnvValue('DESCRIPTION_LENGTH_THRESHOLD', '50')),
    descriptionLengthBonus: parseFloat(getEnvValue('DESCRIPTION_LENGTH_BONUS', '0.1')),
    
    // Cache management - NO HARDCODED VALUES
    cacheRemovalPercentage: parseFloat(getEnvValue('CACHE_REMOVAL_PERCENTAGE', '0.25'))
  },

  // USMCA Configuration
  usmca: {
    defaultRegionalContentThreshold: parseFloat(getEnvValue('USMCA_DEFAULT_THRESHOLD', '62.5')),
    certificateValidityDays: parseInt(getEnvValue('CERTIFICATE_VALIDITY_DAYS', '365')),
    documentationRetentionYears: parseInt(getEnvValue('DOCUMENTATION_RETENTION_YEARS', '5'))
  },

  // Business Logic Configuration  
  business: {
    emergencyFallbackRate: parseFloat(getEnvValue('EMERGENCY_TARIFF_RATE', '3.0')),
    conservativeEstimateMultiplier: parseFloat(getEnvValue('CONSERVATIVE_ESTIMATE_MULTIPLIER', '0.8')),
    defaultTradeVolume: parseInt(getEnvValue('DEFAULT_TRADE_VOLUME', '500000'))
  },

  // Alert System Configuration
  alerts: {
    refreshIntervalMs: parseInt(getEnvValue('ALERT_REFRESH_INTERVAL_MS', '300000')), // 5 minutes
    defaultCrisisImpactAmount: parseInt(getEnvValue('DEFAULT_CRISIS_IMPACT', '250000')),
    defaultTariffRate: parseFloat(getEnvValue('DEFAULT_TARIFF_RATE', '25.0')),
    minDutyIncrease: parseFloat(getEnvValue('MIN_DUTY_INCREASE', '15.0')),
    maxDutyIncrease: parseFloat(getEnvValue('MAX_DUTY_INCREASE', '25.0')),
    minTariffSavings: parseFloat(getEnvValue('MIN_TARIFF_SAVINGS', '40.0')),
    maxTariffSavings: parseFloat(getEnvValue('MAX_TARIFF_SAVINGS', '60.0')),
    defaultROI: parseFloat(getEnvValue('DEFAULT_ROI_PERCENTAGE', '10000'))
  },

  // Subscription Tiers Configuration  
  subscriptions: {
    professionalPrice: parseInt(getEnvValue('SUBSCRIPTION_PROFESSIONAL_PRICE', '299')),
    priorityPrice: parseInt(getEnvValue('SUBSCRIPTION_PRIORITY_PRICE', '799')),
    emergencyFilingFee: parseInt(getEnvValue('EMERGENCY_FILING_FEE', '2500')),
    consultationFee: parseInt(getEnvValue('CONSULTATION_FEE', '495'))
  },

  // UI Configuration
  ui: {
    defaultLanguage: getEnvValue('DEFAULT_LANGUAGE', 'en'),
    supportedLanguages: (getEnvValue('SUPPORTED_LANGUAGES', 'en,es,fr')).split(','),
    itemsPerPage: parseInt(getEnvValue('UI_ITEMS_PER_PAGE', '25')),
    maxFileUploadSize: parseInt(getEnvValue('MAX_FILE_UPLOAD_MB', '10'))
  },

  // Country Configuration - For form dropdowns and mapping
  countries: {
    // Standard country code mappings
    codeMappings: {
      'China': 'CN',
      'Mexico': 'MX', 
      'Canada': 'CA',
      'United States': 'US',
      'India': 'IN',
      'Vietnam': 'VN',
      'Germany': 'DE',
      'Japan': 'JP',
      'South Korea': 'KR',
      'Thailand': 'TH',
      'Malaysia': 'MY',
      'Singapore': 'SG',
      'Indonesia': 'ID',
      'Turkey': 'TR',
      'Brazil': 'BR',
      'Italy': 'IT',
      'United Kingdom': 'GB',
      'Netherlands': 'NL'
    },
    // Default destination for USMCA forms
    defaultDestination: getEnvValue('DEFAULT_DESTINATION_COUNTRY', 'US'),
    // USMCA member countries
    usmcaCountries: ['US', 'CA', 'MX']
  },

  // Business Type to HS Chapter Mappings - DATA-DRIVEN FROM ACTUAL DATABASE CONTENT
  // Based on analysis of actual products in hs_master_rebuild table (34,476 records)
  businessTypeChapters: {
    automotive: {
      primary: [87], // Primary automotive parts and accessories (22 brake products found)
      secondary: [40, 68, 73, 84, 85, 86], // Rubber parts, brake linings, steel, machinery, electrical, railway  
      tertiary: [38, 83] // Brake fluids, hardware (brake fluids in Ch.38, brake hardware in Ch.83)
    },
    electronics: {
      primary: [85], // Electrical machinery and equipment (8 brake/rotor products found)
      secondary: [84, 90], // Mechanical machinery, optical instruments
      tertiary: [73, 76] // Steel and aluminum housings
    },
    textile: {
      primary: [61, 62, 63], // Knitted, woven apparel, made-up textile
      secondary: [58, 59], // Special woven fabrics, impregnated textiles
      tertiary: [39, 42] // Plastic accessories, leather goods
    },
    chemicals: {
      primary: [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38], // Chemical chapters
      secondary: [39], // Plastics
      tertiary: []
    },
    agriculture: {
      primary: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Live animals, food products
      secondary: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24], // Food preparations  
      tertiary: []
    },
    metals: {
      primary: [72, 73, 74, 75, 76, 78, 79, 80, 81, 82, 83], // Base metals
      secondary: [84], // Machinery made of metals
      tertiary: []
    }
  }
};

/**
 * DATABASE TABLE CONFIGURATION
 * ✅ SCHEMA VERIFIED - Uses actual table names from database inspection
 * 
 * Based on verified schema from lib/database/database-schema.js
 * All table names confirmed to exist with documented row counts and columns
 */
export const TABLE_CONFIG = {
  // ✅ VERIFIED CORE TABLES - These exist and have data
  tariffRates: getEnvValue('TABLE_TARIFF_RATES', VERIFIED_TABLE_CONFIG.tariffRates), // 14,486 rows
  comtradeReference: getEnvValue('TABLE_COMTRADE_REFERENCE', VERIFIED_TABLE_CONFIG.comtradeReference), // 5,751 rows  
  usmcaRules: getEnvValue('TABLE_USMCA_RULES', VERIFIED_TABLE_CONFIG.usmcaRules), // 10 rows
  countries: getEnvValue('TABLE_COUNTRIES', VERIFIED_TABLE_CONFIG.countries), // 39 rows
  
  // ✅ VERIFIED BUSINESS INTELLIGENCE TABLES
  triangleRouting: getEnvValue('TABLE_TRIANGLE_ROUTING', VERIFIED_TABLE_CONFIG.triangleRouting), // 12 rows
  tradeVolumeMappings: getEnvValue('TABLE_VOLUME_MAPPINGS', VERIFIED_TABLE_CONFIG.tradeVolumeMappings), // 6 rows
  
  // ⚠️ UNVERIFIED TABLES - May not exist, use with caution
  customerAlerts: getEnvValue('TABLE_CUSTOMER_ALERTS', 'customer_alerts'), // NOT VERIFIED
  regulatoryUpdates: getEnvValue('TABLE_REGULATORY_UPDATES', 'regulatory_updates'), // NOT VERIFIED
  performanceMetrics: getEnvValue('TABLE_PERFORMANCE_METRICS', 'performance_metrics') // NOT VERIFIED
  
  // ❌ DISABLED - These tables are empty or don't exist
  // classificationLogs: 'classification_logs', // DOES NOT EXIST
  // hsCodes: 'hs_codes', // EXISTS BUT EMPTY - use comtrade_reference instead
};

/**
 * EXTERNAL SERVICE CONFIGURATION
 * All external service endpoints and keys from environment
 */
export const EXTERNAL_SERVICES = {
  // Government data sources
  cbp: {
    baseUrl: getEnvValue('CBP_API_BASE_URL'),
    apiKey: getEnvValue('CBP_API_KEY'),
    timeout: parseInt(getEnvValue('CBP_API_TIMEOUT_MS', '15000'))
  },
  
  cbsa: {
    baseUrl: getEnvValue('CBSA_API_BASE_URL'),
    apiKey: getEnvValue('CBSA_API_KEY'),
    timeout: parseInt(getEnvValue('CBSA_API_TIMEOUT_MS', '15000'))
  },
  
  sat: {
    baseUrl: getEnvValue('SAT_API_BASE_URL'),
    apiKey: getEnvValue('SAT_API_KEY'), 
    timeout: parseInt(getEnvValue('SAT_API_TIMEOUT_MS', '15000'))
  },
  
  // Trade data sources
  wits: {
    baseUrl: getEnvValue('WITS_API_BASE_URL', 'https://wits.worldbank.org/api'),
    timeout: parseInt(getEnvValue('WITS_API_TIMEOUT_MS', '20000'))
  },
  
  comtrade: {
    baseUrl: getEnvValue('COMTRADE_API_BASE_URL', 'https://comtrade.un.org/api'),
    timeout: parseInt(getEnvValue('COMTRADE_API_TIMEOUT_MS', '20000'))
  },

  // AI Services
  anthropic: {
    apiKey: getEnvValue('ANTHROPIC_API_KEY'),
    model: getEnvValue('ANTHROPIC_MODEL', 'claude-3-haiku-20240307'),
    maxTokens: parseInt(getEnvValue('ANTHROPIC_MAX_TOKENS', '1000')),
    timeout: parseInt(getEnvValue('ANTHROPIC_TIMEOUT_MS', '10000'))
  }
};

/**
 * ERROR MESSAGES CONFIGURATION
 * All user-facing messages configurable for internationalization
 */
export const MESSAGES = {
  errors: {
    databaseConnection: getEnvValue('MSG_DB_CONNECTION_ERROR', 'Database connection failed. Please contact support.'),
    classificationFailed: getEnvValue('MSG_CLASSIFICATION_FAILED', 'Unable to classify product. Professional review recommended.'),
    tariffDataMissing: getEnvValue('MSG_TARIFF_DATA_MISSING', 'Tariff data unavailable. Consult customs broker.'),
    timeoutError: getEnvValue('MSG_TIMEOUT_ERROR', 'Request timed out. Please try again.'),
    professionalRequired: getEnvValue('MSG_PROFESSIONAL_REQUIRED', 'Professional customs broker consultation required.')
  },
  
  success: {
    classificationComplete: getEnvValue('MSG_CLASSIFICATION_SUCCESS', 'Product successfully classified.'),
    certificateGenerated: getEnvValue('MSG_CERTIFICATE_SUCCESS', 'USMCA certificate generated successfully.'),
    savingsCalculated: getEnvValue('MSG_SAVINGS_SUCCESS', 'Tariff savings calculated successfully.')
  },
  
  disclaimers: {
    general: getEnvValue('MSG_DISCLAIMER_GENERAL', 'Results are estimates. Professional verification required.'),
    tariffRates: getEnvValue('MSG_DISCLAIMER_TARIFFS', 'Tariff rates subject to change. Verify with customs authorities.'),
    classification: getEnvValue('MSG_DISCLAIMER_CLASSIFICATION', 'HS classification may require professional review.')
  }
};

/**
 * AI PROMPTS CONFIGURATION
 * All AI prompts configurable through environment or database
 * NO HARDCODED PROMPTS - Following zero hardcoding rule
 */
export const AI_PROMPTS = {
  // HS Code Classification Prompts
  hsClassification: {
    directClassification: getEnvValue('AI_PROMPT_HS_CLASSIFICATION', `TASK: Classify this specific product into HS trade codes.

Product: "{productDescription}"
Business Type: "{businessType}"

You are an expert in HS trade classification codes for our specific database. Our database contains only 21 HS chapters (not all 99 standard chapters).

IMPORTANT DATABASE LIMITATIONS:
- NO Chapter 42 (leather goods) - handbags are in Chapters 39, 46, 73
- NO Chapter 62 (woven apparel) - shirts are in Chapter 61  
- NO Chapter 84 (machinery) - engines are in Chapters 27, 32
- Available chapters: 1-12, 16, 24, 61, 71-72, 74, 76, 78-79

Provide ONLY codes that exist in our limited database structure.

CRITICAL GUIDELINES:
- Focus ONLY on the FINISHED PRODUCT as described
- Match the SPECIFIC product type, not similar/related products
- For electronics: headphones ≠ TV equipment ≠ automotive wiring
- For apparel: shirts ≠ pants ≠ shoes
- Use codes that exist in our database (8-10 digits like 4602112100, not standard 6-digit codes)
- Confidence score must reflect actual product match quality

FILTERING RULES:
- Electronics: Only codes for the exact electronic device type
- Apparel: Only codes matching the specific clothing item
- NO generic/broad category codes unless they truly fit
- NO codes from completely different industries

RESPONSE FORMAT (valid JSON only, no explanations):
{
  "results": [
    {
      "code": "4602112100",
      "description": "Luggage, handbags and flatgoods, whether or not lined",
      "confidence": 95,
      "reasoning": "Direct match for leather handbags from our database"
    }
  ]
}

Return 3-5 highly relevant codes only. Confidence should be 85+ for good matches.`),
    
    keywordExtraction: getEnvValue('AI_PROMPT_KEYWORD_EXTRACTION', `TASK: Analyze product for HS classification codes.

Product: "{productDescription}"
Business Type: "{businessType}"

PRIORITY ORDER:
1. If you recognize this as a specific product type, provide the likely HS chapter/code numbers from our database (like 3926 for handbags, 6111 for shirts)
2. Then provide descriptive keywords for database searching

EXAMPLES (BASED ON ACTUAL DATABASE CONTENTS):
- "leather handbags" → 3926, 4602, handbag, leather, bag
- "cotton shirts" → 6111, shirt, cotton, apparel, clothing  
- "motor fuel" → 2710, motor, fuel, automotive, petroleum

RESPONSE FORMAT: Return as comma-separated list with HS codes first (if known), then keywords.
NO explanations, just: code1, code2, keyword1, keyword2, keyword3`),

    confidenceScoring: getEnvValue('AI_PROMPT_CONFIDENCE_SCORING', `Analyze how well each HS code matches the user's product description.

User's product description: "{userDescription}"

Rate each HS code on a scale of 1-100 based on how closely the official description matches what the user described. Consider material types, product categories, intended use, and specific features mentioned by the user.

HS Codes to evaluate:
{hsCodesForEvaluation}

Scoring guidelines:
- 90-100: Perfect match - all key attributes align
- 80-89: Very good match - most attributes align with minor differences  
- 70-79: Good match - core product type matches but some specifics differ
- 60-69: Partial match - related product but notable differences
- Below 60: Poor match - different product category or major misalignment

Return only a JSON array of scores in the same order as listed above. No explanations, just the numbers.

Format: [score1, score2, score3, ...]`),

    rankingAndFiltering: getEnvValue('AI_PROMPT_RANKING_FILTERING', `TASK: Rate HS codes for product: "{originalDescription}"

PRIORITY ORDER (score finished products higher than raw materials):
1. FINISHED PRODUCTS (90-100 points) - Final manufactured goods ready for consumer use
2. COMPONENTS/PARTS (70-85 points) - Parts or accessories for finished products  
3. RAW MATERIALS (40-65 points) - Basic materials used in manufacturing
4. CHEMICALS/TREATMENTS (20-45 points) - Processing chemicals or treatments

CODES TO EVALUATE:
{productsToEvaluate}

RESPONSE FORMAT - Return ONLY valid JSON, no explanations:
{
  "selected": ["code1", "code2", "code3"],
  "scores": {"code1": 95, "code2": 87, "code3": 72}
}

Select top 10-15 most relevant codes. Score 1-100 based on priority order above.`),

    simpleScoring: getEnvValue('AI_PROMPT_SIMPLE_SCORING', `TASK: Score HS codes for product: "{originalDescription}"

PRIORITY: Finished products > Components > Raw materials > Chemicals/treatments

CODES TO SCORE:
{productsToScore}

RESPONSE FORMAT - Return ONLY a JSON array of scores (1-100), no explanations:
[95, 87, 72, 65, 45]

Score in same order as listed above. Finished products should score 90-100.`)
  },

  // USMCA Compliance Prompts
  usmcaCompliance: {
    originAnalysis: getEnvValue('AI_PROMPT_ORIGIN_ANALYSIS', `Analyze the origin qualification for this product under USMCA rules.

Product: "{productDescription}"
Components: {componentOrigins}
Manufacturing Location: "{manufacturingLocation}"

Determine if this product qualifies for USMCA preferential treatment based on:
1. Regional content requirements
2. Tariff classification change rules
3. Specific processing requirements

Return confidence level and reasoning.`),

    certificateGeneration: getEnvValue('AI_PROMPT_CERTIFICATE_GENERATION', `Generate USMCA Certificate of Origin data for this product.

Product Details: {productDetails}
Classification: {hsCode}
Origin Analysis: {originAnalysis}

Provide structured data for official certificate completion.`)
  },

  // System Prompts
  system: {
    errorAnalysis: getEnvValue('AI_PROMPT_ERROR_ANALYSIS', `Analyze this classification error and suggest improvements.

Error Context: {errorContext}
User Input: {userInput}
System Response: {systemResponse}

Provide actionable recommendations for system improvement.`),

    dataValidation: getEnvValue('AI_PROMPT_DATA_VALIDATION', `Validate this trade data for accuracy and completeness.

Data: {tradeData}
Source: {dataSource}

Check for inconsistencies, missing values, and data quality issues.`)
  }
};

/**
 * VALIDATION RULES CONFIGURATION
 * All validation thresholds configurable
 */
export const VALIDATION_RULES = {
  hsCode: {
    minLength: parseInt(getEnvValue('HS_CODE_MIN_LENGTH', '6')),
    maxLength: parseInt(getEnvValue('HS_CODE_MAX_LENGTH', '10')),
    pattern: getEnvValue('HS_CODE_PATTERN', '^[0-9]{6,10}$')
  },
  
  tradeVolume: {
    minValue: parseInt(getEnvValue('TRADE_VOLUME_MIN', '1000')),
    maxValue: parseInt(getEnvValue('TRADE_VOLUME_MAX', '100000000000'))
  },
  
  regionalContent: {
    minPercentage: parseFloat(getEnvValue('REGIONAL_CONTENT_MIN', '0')),
    maxPercentage: parseFloat(getEnvValue('REGIONAL_CONTENT_MAX', '100'))
  }
};

/**
 * Get dynamic configuration from database
 * This function fetches configuration that can change at runtime
 */
export async function getDynamicConfig(supabaseClient) {
  try {
    // Fetch USMCA member countries from database
    const { data: usmcaCountries } = await supabaseClient
      .from(TABLE_CONFIG.countries)
      .select('code, name')
      .eq('usmca_member', true);

    // Fetch business type categories from database
    const { data: businessTypes } = await supabaseClient
      .from(TABLE_CONFIG.usmcaRules)
      .select('product_category')
      .not('product_category', 'is', null);

    // Fetch supported HS chapters from database
    const { data: hsChapters } = await supabaseClient
      .from(TABLE_CONFIG.comtradeReference)
      .select('chapter')
      .not('chapter', 'is', null);

    return {
      usmcaCountries: usmcaCountries || [],
      businessTypes: [...new Set((businessTypes || []).map(bt => bt.product_category))],
      hsChapters: [...new Set((hsChapters || []).map(ch => ch.chapter))]
    };
  } catch (error) {
    console.error('Failed to fetch dynamic configuration:', error);
    return {
      usmcaCountries: [],
      businessTypes: [],
      hsChapters: []
    };
  }
}

export default {
  SYSTEM_CONFIG,
  TABLE_CONFIG,
  EXTERNAL_SERVICES,
  MESSAGES,
  VALIDATION_RULES,
  getDynamicConfig
};