/**
 * Classification Configuration - Database-driven HS code classification rules
 * Replaces hardcoded values with configurable settings
 */

export const CLASSIFICATION_CONFIG = {
  // Default settings
  defaults: {
    businessType: process.env.DEFAULT_BUSINESS_TYPE || 'Manufacturing',
    confidenceThreshold: 0.5,
    maxResults: 10,
    cacheTimeoutMs: 3600000 // 1 hour
  },

  // Confidence boost values - configurable scoring
  confidenceBoosts: {
    preciseMatch: parseFloat(process.env.PRECISE_MATCH_BOOST) || 0.30,
    specificMatch: parseFloat(process.env.SPECIFIC_MATCH_BOOST) || 0.20,
    generalMatch: parseFloat(process.env.GENERAL_MATCH_BOOST) || 0.15,
    contextMatch: parseFloat(process.env.CONTEXT_MATCH_BOOST) || 0.10,
    materialMatch: parseFloat(process.env.MATERIAL_MATCH_BOOST) || 0.05
  },

  // Search limits - configurable
  searchLimits: {
    precise: parseInt(process.env.PRECISE_SEARCH_LIMIT) || 10,
    general: parseInt(process.env.GENERAL_SEARCH_LIMIT) || 10,
    exact: parseInt(process.env.EXACT_SEARCH_LIMIT) || 5,
    material: parseInt(process.env.MATERIAL_SEARCH_LIMIT) || 6,
    supplement: parseInt(process.env.SUPPLEMENT_SEARCH_LIMIT) || 10,
    fallback: parseInt(process.env.FALLBACK_SEARCH_LIMIT) || 20
  },

  // Scoring weights - configurable
  scoring: {
    baseConfidenceStart: parseFloat(process.env.BASE_CONFIDENCE_START) || 0.9,
    baseConfidenceDecrement: parseFloat(process.env.BASE_CONFIDENCE_DECREMENT) || 0.05,
    termCoverageBoost: parseFloat(process.env.TERM_COVERAGE_BOOST) || 0.3,
    multiTermBonus: parseFloat(process.env.MULTI_TERM_BONUS) || 0.2,
    contextRelevanceBoost: parseFloat(process.env.CONTEXT_RELEVANCE_BOOST) || 0.4,
    contextMismatchPenalty: parseFloat(process.env.CONTEXT_MISMATCH_PENALTY) || 0.3,
    maxConfidence: parseFloat(process.env.MAX_CONFIDENCE) || 0.95,
    minConfidence: parseFloat(process.env.MIN_CONFIDENCE) || 0.1
  },

  // Search term processing
  termProcessing: {
    minTermLength: parseInt(process.env.MIN_TERM_LENGTH) || 3,
    maxTerms: parseInt(process.env.MAX_SEARCH_TERMS) || 6
  }
};

// Database table names - configurable
export const CLASSIFICATION_TABLES = {
  hsCodeMaster: process.env.HS_CODE_TABLE || 'hs_master_rebuild',
  chapterIndustryMappings: process.env.CHAPTER_INDUSTRY_TABLE || 'chapter_industry_mappings',
  materialChapterMappings: process.env.MATERIAL_CHAPTER_TABLE || 'material_chapter_mappings',
  keywordSynonyms: process.env.KEYWORD_SYNONYM_TABLE || 'keyword_synonym_mappings',
  businessContextRules: process.env.BUSINESS_CONTEXT_TABLE || 'business_context_rules'
};

// Industry categories - will be loaded from database
export const INDUSTRY_CATEGORIES = [
  'Manufacturing',
  'Electronics',
  'Automotive',
  'TextilesApparel',
  'MetalsAlloys',
  'ChemicalsPlastics',
  'MachineryEquipment',
  'MedicalDevices',
  'FoodBeverage'
];