/**
 * Enhanced HS Code Validation System
 * Improved validation with better error handling and fallbacks
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError } from '../utils/production-logger.js';

export class EnhancedHSValidator {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Validate HS code with multiple fallback strategies
   */
  async validateHSCode(hsCode, productDescription = '') {
    if (!hsCode) {
      return { valid: false, error: 'HS code is required' };
    }

    // Normalize HS code format
    const normalizedCode = this.normalizeHSCode(hsCode);
    
    try {
      // Check cache first
      const cacheKey = `hs_${normalizedCode}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTtl) {
          return cached.result;
        }
        this.cache.delete(cacheKey);
      }

      // Strategy 1: Direct database lookup
      const directResult = await this.lookupDirect(normalizedCode);
      if (directResult.valid) {
        this.cacheResult(cacheKey, directResult);
        return directResult;
      }

      // Strategy 2: Partial match (chapter level)
      const chapterResult = await this.lookupByChapter(normalizedCode);
      if (chapterResult.valid) {
        this.cacheResult(cacheKey, chapterResult);
        return chapterResult;
      }

      // Strategy 3: Fuzzy matching if description provided
      if (productDescription) {
        const fuzzyResult = await this.fuzzyMatch(normalizedCode, productDescription);
        if (fuzzyResult.valid) {
          this.cacheResult(cacheKey, fuzzyResult);
          return fuzzyResult;
        }
      }

      // All strategies failed
      return {
        valid: false,
        error: 'HS code not found in database',
        suggestion: 'Consider manual classification or contact customs broker',
        normalized_code: normalizedCode
      };

    } catch (error) {
      logError('HS Code validation error', { hsCode, error: error.message });
      
      return {
        valid: false,
        error: 'Database error during HS code validation',
        fallback: 'Contact professional customs broker for verification',
        normalized_code: normalizedCode
      };
    }
  }

  /**
   * Normalize HS code format (remove dots, ensure proper length)
   */
  normalizeHSCode(hsCode) {
    return hsCode.toString()
      .replace(/[.\s-]/g, '')
      .padEnd(6, '0')
      .substring(0, 10); // Max 10 digits for detailed codes
  }

  /**
   * Direct database lookup
   */
  async lookupDirect(hsCode) {
    const { data, error } = await serverDatabaseService
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
      .eq('hs_code', hsCode)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const record = data[0];
      return {
        valid: true,
        hs_code: record.hs_code,
        description: record.description,
        chapter: record.chapter,
        rates: {
          mfn: record.mfn_rate,
          usmca: record.usmca_rate
        },
        source: `${record.country_source}_official`,
        validation_method: 'direct_lookup'
      };
    }

    return { valid: false };
  }

  /**
   * Lookup by chapter (first 2-4 digits)
   */
  async lookupByChapter(hsCode) {
    const chapter = hsCode.substring(0, 2);
    
    const { data, error } = await serverDatabaseService
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
      .eq('chapter', parseInt(chapter))
      .ilike('hs_code', `${hsCode.substring(0, 4)}%`)
      .limit(5);

    if (error) throw error;

    if (data && data.length > 0) {
      // Return the closest match
      const bestMatch = data.find(d => d.hs_code.startsWith(hsCode.substring(0, 6))) || data[0];
      
      return {
        valid: true,
        hs_code: bestMatch.hs_code,
        description: bestMatch.description,
        chapter: bestMatch.chapter,
        rates: {
          mfn: bestMatch.mfn_rate,
          usmca: bestMatch.usmca_rate
        },
        source: `${bestMatch.country_source}_chapter_match`,
        validation_method: 'chapter_lookup',
        exact_match: false,
        alternatives: data.slice(0, 3).map(d => ({
          hs_code: d.hs_code,
          description: d.description
        }))
      };
    }

    return { valid: false };
  }

  /**
   * Fuzzy matching using product description
   */
  async fuzzyMatch(hsCode, productDescription) {
    const keywords = productDescription.toLowerCase().split(' ').filter(w => w.length > 3);
    
    if (keywords.length === 0) return { valid: false };

    // Search descriptions containing key terms
    let query = serverDatabaseService
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source');

    // Apply keyword filters
    keywords.forEach(keyword => {
      query = query.ilike('description', `%${keyword}%`);
    });

    const { data, error } = await query.limit(10);

    if (error) throw error;

    if (data && data.length > 0) {
      const bestMatch = data[0]; // Simple scoring could be added here
      
      return {
        valid: true,
        hs_code: bestMatch.hs_code,
        description: bestMatch.description,
        chapter: bestMatch.chapter,
        rates: {
          mfn: bestMatch.mfn_rate,
          usmca: bestMatch.usmca_rate
        },
        source: `${bestMatch.country_source}_fuzzy_match`,
        validation_method: 'fuzzy_description_match',
        confidence: 0.7,
        exact_match: false,
        suggested_code: bestMatch.hs_code,
        alternatives: data.slice(1, 4).map(d => ({
          hs_code: d.hs_code,
          description: d.description
        }))
      };
    }

    return { valid: false };
  }

  /**
   * Cache validation result
   */
  cacheResult(key, result) {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });

    // Cleanup old cache entries (basic LRU)
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const enhancedHSValidator = new EnhancedHSValidator();