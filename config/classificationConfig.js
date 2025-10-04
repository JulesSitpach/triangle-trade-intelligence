/**
 * Classification Configuration
 * All hardcoded values, thresholds, and settings for product classification
 * Eliminates all hardcoded values from components per CLAUDE.md requirements
 */

// API Configuration - Updated for Microservices Architecture
export const API_CONFIG = {
  endpoints: {
    // AI-powered endpoints
    productCategories: '/api/database-driven-dropdown-options?category=product_categories',
    productClassification: '/api/ai-usmca-complete-analysis',
    aiCategoryAnalysis: '/api/ai-usmca-complete-analysis',
    userContributedHSCode: '/api/ai-usmca-complete-analysis',
    dynamicHSCodes: '/api/ai-usmca-complete-analysis',

    // Trust Microservice Endpoints
    trustCompleteWorkflow: '/api/ai-usmca-complete-analysis',
    trustDataProvenance: '/api/trust/data-provenance',
    trustExpertValidation: '/api/trust/expert-validation',
    trustMetrics: '/api/trust/trust-metrics',
    trustSuccessStories: '/api/trust/success-stories',
    trustCaseStudies: '/api/trust/case-studies',

    // Backward compatibility
    trustedComplianceWorkflow: '/api/ai-usmca-complete-analysis'
  },
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
  retryAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || '1000')
};

// Debouncing Configuration
export const DEBOUNCE_CONFIG = {
  userInput: parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_USER_INPUT || '500'),
  aiAnalysis: parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_AI_ANALYSIS || '800'),
  categorySelection: parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_CATEGORY || '300')
};

// Input Quality Thresholds
export const QUALITY_THRESHOLDS = {
  minLength: parseInt(process.env.NEXT_PUBLIC_MIN_INPUT_LENGTH || '4'),
  basicQuality: parseInt(process.env.NEXT_PUBLIC_BASIC_QUALITY_WORDS || '4'),
  goodQuality: parseInt(process.env.NEXT_PUBLIC_GOOD_QUALITY_WORDS || '6'),
  excellentQuality: parseInt(process.env.NEXT_PUBLIC_EXCELLENT_QUALITY_WORDS || '8'),
  aiTriggerLength: parseInt(process.env.NEXT_PUBLIC_AI_TRIGGER_LENGTH || '8'),
  categoryAnalysisLength: parseInt(process.env.NEXT_PUBLIC_CATEGORY_ANALYSIS_LENGTH || '10'),
  hsCodeMinLength: parseInt(process.env.NEXT_PUBLIC_HS_CODE_MIN_LENGTH || '4')
};

// Display Configuration
export const DISPLAY_CONFIG = {
  maxHSCodeResults: parseInt(process.env.NEXT_PUBLIC_MAX_HS_CODE_RESULTS || '8'),
  maxClarifyingOptions: parseInt(process.env.NEXT_PUBLIC_MAX_CLARIFYING_OPTIONS || '5'),
  maxSuggestionDisplay: parseInt(process.env.NEXT_PUBLIC_MAX_SUGGESTION_DISPLAY || '3'),
  textAreaRows: parseInt(process.env.NEXT_PUBLIC_TEXTAREA_ROWS || '3')
};

// Confidence Score Configuration
export const CONFIDENCE_CONFIG = {
  highConfidence: parseInt(process.env.NEXT_PUBLIC_HIGH_CONFIDENCE_THRESHOLD || '90'),
  mediumConfidence: parseInt(process.env.NEXT_PUBLIC_MEDIUM_CONFIDENCE_THRESHOLD || '80'),
  lowConfidence: parseInt(process.env.NEXT_PUBLIC_LOW_CONFIDENCE_THRESHOLD || '70'),
  minViableConfidence: parseInt(process.env.NEXT_PUBLIC_MIN_VIABLE_CONFIDENCE || '60'),
  userProvidedConfidence: parseInt(process.env.NEXT_PUBLIC_USER_PROVIDED_CONFIDENCE || '100')
};

// Default Values for Workflow
export const DEFAULT_WORKFLOW_VALUES = {
  companyName: process.env.NEXT_PUBLIC_DEFAULT_COMPANY_NAME || 'User Company',
  supplierCountry: process.env.NEXT_PUBLIC_DEFAULT_SUPPLIER_COUNTRY || 'CN',
  tradeVolume: parseInt(process.env.NEXT_PUBLIC_DEFAULT_TRADE_VOLUME || '1000000'),
  manufacturingLocation: process.env.NEXT_PUBLIC_DEFAULT_MANUFACTURING_LOCATION || 'MX',
  componentOrigins: [
    {
      origin_country: process.env.NEXT_PUBLIC_DEFAULT_ORIGIN_1 || 'CN',
      value_percentage: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PERCENTAGE_1 || '60')
    },
    {
      origin_country: process.env.NEXT_PUBLIC_DEFAULT_ORIGIN_2 || 'MX',
      value_percentage: parseInt(process.env.NEXT_PUBLIC_DEFAULT_PERCENTAGE_2 || '40')
    }
  ]
};

// Quality Indicators Configuration
export const QUALITY_INDICATORS = {
  excellent: {
    color: 'text-green-600',
    message: process.env.NEXT_PUBLIC_EXCELLENT_QUALITY_MESSAGE || 'Excellent detail - high classification confidence expected',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  good: {
    color: 'text-blue-600',
    message: process.env.NEXT_PUBLIC_GOOD_QUALITY_MESSAGE || 'Good detail - should classify well',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  basic: {
    color: 'text-yellow-600',
    message: process.env.NEXT_PUBLIC_BASIC_QUALITY_MESSAGE || 'Add materials or construction details for better results',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  needs_detail: {
    color: 'text-red-600',
    message: process.env.NEXT_PUBLIC_NEEDS_DETAIL_MESSAGE || 'More detail needed - add materials, construction, or use case',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

// Error Messages Configuration
export const ERROR_MESSAGES = {
  apiUnavailable: process.env.NEXT_PUBLIC_ERROR_API_UNAVAILABLE || 'AI classification service temporarily unavailable. Please try again or contact support.',
  networkError: process.env.NEXT_PUBLIC_ERROR_NETWORK || 'Network error. Please check your connection and try again.',
  invalidHSCode: process.env.NEXT_PUBLIC_ERROR_INVALID_HS_CODE || 'Please enter a valid HS code (at least 4 digits)',
  saveHSCodeError: process.env.NEXT_PUBLIC_ERROR_SAVE_HS_CODE || 'Sorry, there was an error saving your HS code. Please try again.',
  analysisError: process.env.NEXT_PUBLIC_ERROR_ANALYSIS || 'Error running complete analysis. Please check your connection.',
  workflowError: process.env.NEXT_PUBLIC_ERROR_WORKFLOW || 'Error running complete analysis. Please try again.',
  categoriesLoadError: process.env.NEXT_PUBLIC_ERROR_CATEGORIES_LOAD || 'Failed to load product categories. Please refresh the page.'
};

// Success Messages Configuration
export const SUCCESS_MESSAGES = {
  hsCodeSaved: process.env.NEXT_PUBLIC_SUCCESS_HS_CODE_SAVED || 'HS code saved! Now calculating your USMCA savings and qualification status...',
  analysisComplete: process.env.NEXT_PUBLIC_SUCCESS_ANALYSIS_COMPLETE || 'Complete Analysis Results',
  certificateReady: process.env.NEXT_PUBLIC_SUCCESS_CERTIFICATE_READY || 'Certificate ready for generation',
  routingIdentified: process.env.NEXT_PUBLIC_SUCCESS_ROUTING_IDENTIFIED || 'Triangle routing opportunities identified'
};

// UI Text Configuration
export const UI_TEXT = {
  placeholders: {
    hsCodeInput: process.env.NEXT_PUBLIC_PLACEHOLDER_HS_CODE || 'Enter HS Code (e.g., 080440 for avocados)',
    productDescription: process.env.NEXT_PUBLIC_PLACEHOLDER_PRODUCT_DESC || 'Describe your product (e.g., Fresh avocados, organically grown OR Men\'s cotton dress shirts)',
    categorySelect: process.env.NEXT_PUBLIC_PLACEHOLDER_CATEGORY_SELECT || 'Select a product category'
  },
  buttons: {
    getAnalysis: process.env.NEXT_PUBLIC_BUTTON_GET_ANALYSIS || 'Get USMCA Analysis',
    analyzing: process.env.NEXT_PUBLIC_BUTTON_ANALYZING || 'Analyzing...',
    useThisCode: process.env.NEXT_PUBLIC_BUTTON_USE_CODE || 'Use This Code',
    selectCategory: process.env.NEXT_PUBLIC_BUTTON_SELECT_CATEGORY || 'Select this category',
    generateCertificate: process.env.NEXT_PUBLIC_BUTTON_GENERATE_CERT || 'Generate Certificate',
    viewRoutes: process.env.NEXT_PUBLIC_BUTTON_VIEW_ROUTES || 'View Triangle Routes'
  },
  labels: {
    hsCodeSection: process.env.NEXT_PUBLIC_LABEL_HS_CODE_SECTION || 'Already Know Your HS Code?',
    productDescSection: process.env.NEXT_PUBLIC_LABEL_PRODUCT_DESC_SECTION || 'Need Help Classifying? Describe Your Product',
    categorySection: process.env.NEXT_PUBLIC_LABEL_CATEGORY_SECTION || 'Product Category Selection'
  }
};

// Styling Configuration
export const STYLE_CONFIG = {
  colors: {
    primary: 'blue',
    secondary: 'green',
    warning: 'yellow',
    error: 'red',
    success: 'green'
  },
  spacing: {
    componentGap: 'space-y-4',
    buttonGap: 'space-x-2',
    resultGap: 'space-y-3'
  },
  animations: {
    spinner: 'animate-spin',
    fadeIn: 'transition-colors',
    hover: 'hover:bg-blue-50 hover:border-blue-200'
  }
};

// Cache Configuration
export const CACHE_CONFIG = {
  categoriesTTL: parseInt(process.env.NEXT_PUBLIC_CATEGORIES_CACHE_TTL || '300000'), // 5 minutes
  hsCodesTTL: parseInt(process.env.NEXT_PUBLIC_HS_CODES_CACHE_TTL || '180000'), // 3 minutes
  aiAnalysisTTL: parseInt(process.env.NEXT_PUBLIC_AI_ANALYSIS_CACHE_TTL || '600000') // 10 minutes
};

// Accessibility Configuration
export const A11Y_CONFIG = {
  ariaLabels: {
    productInput: process.env.NEXT_PUBLIC_ARIA_PRODUCT_INPUT || 'Product description input',
    hsCodeInput: process.env.NEXT_PUBLIC_ARIA_HS_CODE_INPUT || 'HS code input field',
    categorySelect: process.env.NEXT_PUBLIC_ARIA_CATEGORY_SELECT || 'Product category selection',
    qualityIndicator: process.env.NEXT_PUBLIC_ARIA_QUALITY_INDICATOR || 'Input quality indicator',
    analysisResults: process.env.NEXT_PUBLIC_ARIA_ANALYSIS_RESULTS || 'AI analysis results',
    loadingSpinner: process.env.NEXT_PUBLIC_ARIA_LOADING_SPINNER || 'Loading analysis results'
  },
  keyboardShortcuts: {
    submitHSCode: process.env.NEXT_PUBLIC_SHORTCUT_SUBMIT_HS_CODE || 'Enter',
    selectSuggestion: process.env.NEXT_PUBLIC_SHORTCUT_SELECT_SUGGESTION || 'Enter'
  }
};

// Microservices Configuration
export const MICROSERVICES_CONFIG = {
  trust: {
    enableDataProvenance: process.env.NEXT_PUBLIC_ENABLE_DATA_PROVENANCE === 'true',
    enableExpertValidation: process.env.NEXT_PUBLIC_ENABLE_EXPERT_VALIDATION === 'true',
    enableTrustMetrics: process.env.NEXT_PUBLIC_ENABLE_TRUST_METRICS === 'true',
    enableSuccessStories: process.env.NEXT_PUBLIC_ENABLE_SUCCESS_STORIES === 'true',
    enableCaseStudies: process.env.NEXT_PUBLIC_ENABLE_CASE_STUDIES === 'true',
    
    // Performance settings for microservices
    timeout: parseInt(process.env.NEXT_PUBLIC_TRUST_API_TIMEOUT || '15000'), // Higher for complex workflows
    retryAttempts: parseInt(process.env.NEXT_PUBLIC_TRUST_API_RETRY || '2'),
    cacheTTL: parseInt(process.env.NEXT_PUBLIC_TRUST_CACHE_TTL || '300000') // 5 minutes
  },
  
  fallback: {
    enableLegacyFallback: process.env.NEXT_PUBLIC_ENABLE_LEGACY_FALLBACK === 'true',
    fallbackDelay: parseInt(process.env.NEXT_PUBLIC_FALLBACK_DELAY || '2000')
  }
};

// Trust Features Configuration
export const TRUST_CONFIG = {
  dataProvenance: {
    showSourceAttribution: process.env.NEXT_PUBLIC_SHOW_SOURCE_ATTRIBUTION !== 'false',
    showVerificationTimestamps: process.env.NEXT_PUBLIC_SHOW_VERIFICATION_TIMESTAMPS !== 'false',
    showAuditTrails: process.env.NEXT_PUBLIC_SHOW_AUDIT_TRAILS === 'true'
  },
  expertValidation: {
    lowConfidenceThreshold: parseInt(process.env.NEXT_PUBLIC_EXPERT_VALIDATION_THRESHOLD || '70'),
    autoRequestValidation: process.env.NEXT_PUBLIC_AUTO_REQUEST_VALIDATION === 'true',
    showExpertCredentials: process.env.NEXT_PUBLIC_SHOW_EXPERT_CREDENTIALS !== 'false'
  },
  trustMetrics: {
    showPublicMetrics: process.env.NEXT_PUBLIC_SHOW_PUBLIC_METRICS !== 'false',
    showAccuracyRates: process.env.NEXT_PUBLIC_SHOW_ACCURACY_RATES !== 'false',
    showResponseTimes: process.env.NEXT_PUBLIC_SHOW_RESPONSE_TIMES === 'true'
  }
};

// Validation Rules
export const VALIDATION_RULES = {
  hsCode: {
    minLength: parseInt(process.env.NEXT_PUBLIC_HS_CODE_MIN_LENGTH || '4'),
    maxLength: parseInt(process.env.NEXT_PUBLIC_HS_CODE_MAX_LENGTH || '12'),
    pattern: process.env.NEXT_PUBLIC_HS_CODE_PATTERN || '^[0-9]+$'
  },
  productDescription: {
    minLength: parseInt(process.env.NEXT_PUBLIC_PRODUCT_DESC_MIN_LENGTH || '4'),
    maxLength: parseInt(process.env.NEXT_PUBLIC_PRODUCT_DESC_MAX_LENGTH || '1000')
  }
};

export default {
  API_CONFIG,
  DEBOUNCE_CONFIG,
  QUALITY_THRESHOLDS,
  DISPLAY_CONFIG,
  CONFIDENCE_CONFIG,
  DEFAULT_WORKFLOW_VALUES,
  QUALITY_INDICATORS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  UI_TEXT,
  STYLE_CONFIG,
  CACHE_CONFIG,
  A11Y_CONFIG,
  VALIDATION_RULES,
  MICROSERVICES_CONFIG,
  TRUST_CONFIG
};