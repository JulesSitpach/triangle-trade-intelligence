/**
 * HS CODE NORMALIZATION UTILITY
 * Shared utility for consistent HS code handling across all APIs
 * NO HARDCODING - Configurable normalization rules
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError } from './production-logger.js';

/**
 * Normalize HS code to database format with validation
 * @param {string} hsCode - Input HS code in various formats
 * @returns {string|null} Normalized HS code without dots/spaces, null if invalid
 */
export function normalizeHSCode(hsCode) {
  if (!hsCode) return null;
  
  // Remove all non-digits (dots, spaces, dashes, etc.)
  const cleanCode = hsCode.replace(/[^0-9]/g, '');
  
  // Validate minimum length (at least 2 digits for chapter)
  if (cleanCode.length < 2) {
    logError('Invalid HS code - too short', { originalCode: hsCode, cleanCode });
    return null;
  }
  
  // Validate maximum length (10 digits is typical maximum)
  if (cleanCode.length > 10) {
    logInfo('HS code truncated to 10 digits', { originalCode: hsCode, cleanCode });
    return cleanCode.substring(0, 10);
  }
  
  // Pad with zeros for specific lengths if needed
  if (cleanCode.length === 2) return cleanCode.padEnd(6, '0'); // Chapter → 6-digit
  if (cleanCode.length === 4) return cleanCode.padEnd(6, '0'); // Heading → 6-digit
  
  return cleanCode;
}

/**
 * Generate fallback HS codes for hierarchical lookup
 * @param {string} normalizedHSCode - Already normalized HS code
 * @returns {Array<string>} Array of codes to try in descending specificity
 */
export function generateHSCodeFallbacks(normalizedHSCode) {
  if (!normalizedHSCode) return [];
  
  const fallbacks = [normalizedHSCode]; // Start with exact code
  
  // Add progressively shorter versions
  if (normalizedHSCode.length >= 10) {
    fallbacks.push(normalizedHSCode.substring(0, 8)); // 8-digit
    fallbacks.push(normalizedHSCode.substring(0, 6)); // 6-digit
  } else if (normalizedHSCode.length >= 8) {
    fallbacks.push(normalizedHSCode.substring(0, 6)); // 6-digit
  }
  
  if (normalizedHSCode.length >= 6) {
    fallbacks.push(normalizedHSCode.substring(0, 4)); // 4-digit heading
  }
  
  if (normalizedHSCode.length >= 4) {
    fallbacks.push(normalizedHSCode.substring(0, 2)); // 2-digit chapter
  }
  
  // Remove duplicates while preserving order
  return [...new Set(fallbacks)];
}

/**
 * Enhanced HS code database lookup with fallback hierarchy
 * @param {string} hsCode - Input HS code (will be normalized)
 * @param {Object} options - Lookup options
 * @returns {Promise<Object>} Lookup result with tariff rates and metadata
 */
export async function lookupHSCodeWithFallback(hsCode, options = {}) {
  const {
    country = 'US',
    returnAll = false, // Return all fallback matches or just first match
    includeDescription = true
  } = options;
  
  const normalizedCode = normalizeHSCode(hsCode);
  if (!normalizedCode) {
    return {
      success: false,
      error: 'Invalid HS code format',
      originalCode: hsCode,
      suggestion: 'Provide HS code with at least 2 digits'
    };
  }
  
  const fallbackCodes = generateHSCodeFallbacks(normalizedCode);
  const results = [];
  
  for (const [index, code] of fallbackCodes.entries()) {
    try {
      const selectFields = includeDescription 
        ? 'hs_code, mfn_rate, usmca_rate, country_source, description, chapter'
        : 'hs_code, mfn_rate, usmca_rate, country_source, chapter';
      
      const { data, error } = await serverDatabaseService.client
        .from('hs_master_rebuild')
        .select(selectFields)
        .eq('hs_code', code)
        .limit(5); // Get multiple matches for same code if available
      
      if (error) {
        logError(`Database error looking up HS code ${code}`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        for (const record of data) {
          const result = {
            success: true,
            hsCode: record.hs_code,
            normalizedInput: normalizedCode,
            originalInput: hsCode,
            mfnRate: record.mfn_rate || 0,
            usmcaRate: record.usmca_rate || 0,
            chapter: record.chapter,
            country: record.country_source,
            description: record.description,
            matchType: index === 0 ? 'exact' : 'fallback',
            fallbackLevel: index,
            searchedCode: code,
            confidence: calculateMatchConfidence(hsCode, record.hs_code, index)
          };
          
          results.push(result);
          
          // If not returning all matches, return first successful match
          if (!returnAll) {
            logInfo('HS code lookup successful', {
              originalCode: hsCode,
              matchedCode: record.hs_code,
              matchType: result.matchType,
              fallbackLevel: index
            });
            return result;
          }
        }
      }
    } catch (error) {
      logError(`Failed to lookup HS code ${code}`, error);
    }
  }
  
  if (results.length === 0) {
    logInfo('No HS code matches found', { 
      originalCode: hsCode, 
      normalizedCode, 
      fallbacksAttempted: fallbackCodes.length 
    });
    
    return {
      success: false,
      hsCode: normalizedCode,
      originalInput: hsCode,
      error: 'No matching HS code found in database',
      fallbacksAttempted: fallbackCodes,
      suggestion: 'Verify HS code classification or use intelligent classification API',
      mfnRate: null,
      usmcaRate: null
    };
  }
  
  return returnAll ? { success: true, results } : results[0];
}

/**
 * Calculate match confidence based on input vs found code and fallback level
 * @param {string} originalInput - Original user input
 * @param {string} foundCode - Code found in database
 * @param {number} fallbackLevel - How many fallbacks were needed (0 = exact)
 * @returns {number} Confidence score 0-100
 */
function calculateMatchConfidence(originalInput, foundCode, fallbackLevel) {
  let confidence = 100;
  
  // Reduce confidence for each fallback level
  confidence -= fallbackLevel * 15; // -15% per fallback level
  
  // Bonus for length match
  const normalizedInput = normalizeHSCode(originalInput);
  if (normalizedInput && normalizedInput.length === foundCode.length) {
    confidence += 10;
  }
  
  // Penalty for very generic fallbacks (chapter level)
  if (foundCode.length <= 2) {
    confidence -= 20;
  }
  
  return Math.max(10, Math.min(100, confidence));
}

/**
 * Intelligent HS code inference based on business context
 * @param {Object} context - Business context for inference
 * @returns {Promise<Array>} Suggested HS codes with confidence
 */
export async function inferHSCodeFromContext(context = {}) {
  const {
    businessType,
    productDescription,
    industry,
    productCategory
  } = context;
  
  if (!businessType && !productDescription && !industry) {
    return {
      success: false,
      error: 'Insufficient context for HS code inference',
      suggestion: 'Provide businessType, productDescription, or industry'
    };
  }
  
  try {
    // Get common HS codes for the business type
    let query = serverDatabaseService.client
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate, chapter')
      .limit(10);
    
    // Try to find codes based on context
    if (productDescription) {
      const searchTerms = productDescription.toLowerCase().split(/\s+/).slice(0, 3);
      const searchPattern = searchTerms.join(' | ');
      query = query.textSearch('description', searchPattern);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No HS codes found for provided context',
        context,
        suggestion: 'Try more specific product description or use classification API'
      };
    }
    
    return {
      success: true,
      suggestions: data.map((record, index) => ({
        hsCode: record.hs_code,
        description: record.description,
        confidence: Math.max(30, 70 - (index * 5)), // Decreasing confidence
        mfnRate: record.mfn_rate || 0,
        usmcaRate: record.usmca_rate || 0,
        chapter: record.chapter,
        reason: productDescription ? 'description_match' : 'business_context'
      })),
      context,
      recommendedAction: 'Review suggestions and select most appropriate HS code'
    };
    
  } catch (error) {
    logError('HS code inference failed', error);
    return {
      success: false,
      error: 'Unable to infer HS code from context',
      details: error.message,
      context
    };
  }
}

/**
 * Validate HS code format without database lookup
 * @param {string} hsCode - HS code to validate
 * @returns {Object} Validation result
 */
export function validateHSCodeFormat(hsCode) {
  if (!hsCode || typeof hsCode !== 'string') {
    return {
      valid: false,
      error: 'HS code must be a non-empty string',
      suggestion: 'Provide HS code as string (e.g., "8544.42.90" or "85444290")'
    };
  }
  
  const normalized = normalizeHSCode(hsCode);
  if (!normalized) {
    return {
      valid: false,
      error: 'Invalid HS code format',
      suggestion: 'HS code must contain at least 2 digits for chapter identification'
    };
  }
  
  // Check for valid chapter range (01-99)
  const chapter = parseInt(normalized.substring(0, 2));
  if (chapter < 1 || chapter > 99) {
    return {
      valid: false,
      error: 'Invalid HS chapter - must be between 01 and 99',
      chapter,
      suggestion: 'Check HS code chapter number'
    };
  }
  
  return {
    valid: true,
    normalized,
    original: hsCode,
    chapter,
    length: normalized.length,
    specificity: getSpecificityLevel(normalized.length)
  };
}

/**
 * Get specificity level description based on HS code length
 * @param {number} length - HS code length
 * @returns {string} Specificity description
 */
function getSpecificityLevel(length) {
  if (length === 2) return 'chapter';
  if (length === 4) return 'heading';
  if (length === 6) return 'subheading';
  if (length === 8) return 'tariff_line';
  if (length === 10) return 'statistical_suffix';
  return 'custom';
}

// Export constants for use by other modules
export const HS_CODE_CONSTANTS = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 10,
  STANDARD_LENGTH: 6,
  MIN_CHAPTER: 1,
  MAX_CHAPTER: 99,
  FALLBACK_CONFIDENCE_PENALTY: 15,
  CHAPTER_ONLY_PENALTY: 20
};

export default {
  normalizeHSCode,
  generateHSCodeFallbacks,
  lookupHSCodeWithFallback,
  inferHSCodeFromContext,
  validateHSCodeFormat,
  HS_CODE_CONSTANTS
};