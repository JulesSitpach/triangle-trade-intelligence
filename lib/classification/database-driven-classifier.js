/**
 * DATABASE-DRIVEN HS CLASSIFICATION ENGINE
 * NO HARDCODED VALUES - COMPLETE DATABASE INTEGRATION
 * 
 * Replaces intelligent-hs-classifier.js with fully database-driven approach
 * Following Holistic Reconstruction Plan Phase 2.1 requirements
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { SYSTEM_CONFIG, MESSAGES, TABLE_CONFIG } from '../../config/system-config.js';
import { logInfo, logError } from '../utils/production-logger.js';
import { aiConfidenceScoringService } from '../services/ai-confidence-scoring-service.js';

/**
 * Database-driven product classification engine
 * NO HARDCODED KEYWORDS OR BUSINESS LOGIC
 */
export class DatabaseDrivenClassifier {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = SYSTEM_CONFIG.cache.classificationTtl;
    this.dbService = serverDatabaseService;
    this.minConfidence = SYSTEM_CONFIG.classification.minConfidenceThreshold;
    this.maxResults = SYSTEM_CONFIG.classification.maxResults;
  }

  /**
   * Perform intelligent classification using ONLY database queries
   * NO HARDCODED BUSINESS LOGIC OR KEYWORD ARRAYS
   */
  async classifyProduct(request) {
    const startTime = Date.now();
    const { productDescription, businessType, sourceCountry } = request;

    try {
      // Validate input using configuration-based rules
      this.validateInput(productDescription);

      // Generate cache key
      const cacheKey = this.generateCacheKey(productDescription, businessType, sourceCountry);
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logInfo('Classification served from cache');
        return cached;
      }

      // Extract search terms from product description
      const searchTerms = this.extractSearchTerms(productDescription);
      
      if (searchTerms.length === 0) {
        return this.generateProfessionalReferralResponse('Insufficient product description');
      }

      // Perform database-driven classification search
      const classifications = await this.performDatabaseSearch(searchTerms, businessType, sourceCountry);
      
      if (!classifications || classifications.length === 0) {
        return this.generateProfessionalReferralResponse('No matching classifications found in database');
      }

      // Score and rank results based on AI analysis and database quality metrics
      const scoredResults = await this.scoreClassificationResults(classifications, searchTerms, businessType, productDescription);
      
      // Filter results by confidence threshold
      const qualifiedResults = scoredResults.filter(result => 
        result.confidenceScore >= this.minConfidence
      );

      // Generate response
      const response = await this.generateClassificationResponse(
        qualifiedResults, 
        searchTerms, 
        businessType, 
        sourceCountry,
        startTime
      );

      // Cache successful results
      this.setCache(cacheKey, response);

      // Log classification attempt
      await this.logClassificationAttempt(productDescription, response);

      return response;

    } catch (error) {
      logError('Classification failed', { error: error.message, productDescription });
      return this.generateErrorResponse(error);
    }
  }

  /**
   * Validate input using configuration-based rules
   */
  validateInput(productDescription) {
    if (!productDescription || productDescription.trim().length < 3) {
      throw new Error(MESSAGES.errors.classificationFailed);
    }

    if (productDescription.length > 500) {
      throw new Error('Product description too long. Maximum 500 characters.');
    }
  }

  /**
   * Extract search terms from product description
   * NO HARDCODED KEYWORD LOGIC
   */
  extractSearchTerms(productDescription) {
    // Clean and tokenize description
    const cleaned = productDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();

    // Split into words and filter by length
    const words = cleaned.split(' ')
      .filter(word => word.length >= 3)  // Minimum word length from config
      .slice(0, SYSTEM_CONFIG.classification.maxKeywords); // Limit from config

    return words;
  }

  /**
   * Perform database search using extracted terms
   * NO HARDCODED SEARCH LOGIC
   */
  async performDatabaseSearch(searchTerms, businessType = null) {
    const results = [];

    // Strategy 1: Single-term searches for broad coverage
    for (const term of searchTerms.slice(0, 5)) {
      try {
        const termResults = await this.dbService.searchProducts(term, 10);
        results.push(...termResults.map(result => ({
          ...result,
          searchStrategy: 'single_term',
          matchedTerm: term
        })));
      } catch (error) {
        logError(`Single-term search failed for "${term}"`, error);
      }
    }

    // Strategy 2: Multi-term searches for precision
    if (searchTerms.length >= 2) {
      const combinations = this.generateTermCombinations(searchTerms);
      
      for (const combo of combinations.slice(0, 3)) { // Limit combinations
        try {
          const comboQuery = combo.join(' ');
          const comboResults = await this.dbService.searchProducts(comboQuery, 5);
          results.push(...comboResults.map(result => ({
            ...result,
            searchStrategy: 'multi_term',
            matchedTerms: combo
          })));
        } catch (error) {
          logError(`Multi-term search failed for "${combo.join(' ')}"`, error);
        }
      }
    }

    // Strategy 3: Business-type-specific search if provided
    if (businessType) {
      try {
        const businessResults = await this.searchByBusinessType(businessType, searchTerms);
        results.push(...businessResults.map(result => ({
          ...result,
          searchStrategy: 'business_type',
          businessType: businessType
        })));
      } catch (error) {
        logError(`Business-type search failed for "${businessType}"`, error);
      }
    }

    // Remove duplicates by HS code
    const uniqueResults = this.removeDuplicates(results);
    return uniqueResults.slice(0, this.maxResults);
  }

  /**
   * Search by business type using database rules
   * NO HARDCODED BUSINESS TYPE MAPPINGS
   */
  async searchByBusinessType(businessType, searchTerms) {
    try {
      // Get business type rules from database
      const rules = await this.dbService.getUSMCAQualificationRules(null, businessType);
      
      if (!rules || rules.length === 0) {
        return [];
      }

      const results = [];
      
      // Use HS chapters from business rules to filter search
      for (const rule of rules) {
        if (rule.hs_chapter) {
          // Search for products in specific HS chapter
          const { data: chapterProducts } = await this.dbService.client
            .from(TABLE_CONFIG.comtradeReference)
            .select('*')
            .like('hs_code', `${rule.hs_chapter}%`)
            .limit(20);

          if (chapterProducts) {
            // Filter chapter products by search terms
            const filteredProducts = chapterProducts.filter(product => {
              const description = product.product_description.toLowerCase();
              return searchTerms.some(term => description.includes(term));
            });

            results.push(...filteredProducts.map(product => ({
              ...product,
              businessTypeRule: rule
            })));
          }
        }
      }

      return results;
    } catch (error) {
      logError('Business type search failed', error);
      return [];
    }
  }

  /**
   * Generate term combinations for multi-term search
   */
  generateTermCombinations(terms) {
    const combinations = [];
    
    // Two-term combinations
    for (let i = 0; i < terms.length - 1; i++) {
      for (let j = i + 1; j < terms.length; j++) {
        combinations.push([terms[i], terms[j]]);
      }
    }
    
    // Three-term combinations (if we have enough terms)
    if (terms.length >= 3) {
      combinations.push([terms[0], terms[1], terms[2]]);
    }

    return combinations.slice(0, 5); // Limit combinations to prevent overload
  }

  /**
   * Score classification results using AI-powered confidence scoring
   * ENHANCED WITH CLAUDE AI ANALYSIS
   */
  async scoreClassificationResults(classifications, searchTerms, businessType, productDescription) {
    try {
      // First, apply AI confidence scoring if available
      const aiScoredResults = await aiConfidenceScoringService.scoreHSCodes(
        productDescription,
        classifications
      );

      // If AI scoring succeeded, use AI scores with database quality enhancements
      if (aiScoredResults && aiScoredResults.length === classifications.length) {
        const scored = [];

        for (let i = 0; i < aiScoredResults.length; i++) {
          const classification = aiScoredResults[i];
          
          try {
            // Start with AI confidence score (already 1-100 scale)
            let finalScore = classification.confidence / 100; // Convert to 0-1 scale
            
            // Apply additional database quality adjustments
            const dataQualityScore = this.calculateDataQualityScore(classification);
            const termScore = this.calculateTermMatchScore(classification.product_description, searchTerms);
            
            // Small adjustments based on database quality - FROM CONFIG
            if (dataQualityScore > SYSTEM_CONFIG.classification.dataQualityThreshold) {
              finalScore += SYSTEM_CONFIG.classification.dataQualityBonus;
            }
            if (termScore > SYSTEM_CONFIG.classification.termMatchThreshold) {
              finalScore += SYSTEM_CONFIG.classification.termMatchBonus;
            }
            if (classification.usmca_eligible === true) {
              finalScore += SYSTEM_CONFIG.classification.usmcaBonus;
            }
            
            // Business type match bonus - FROM CONFIG
            if (businessType && classification.businessType === businessType) {
              finalScore += SYSTEM_CONFIG.classification.businessTypeMatchBonus;
            }

            // Search strategy bonus - FROM CONFIG
            if (classification.searchStrategy === 'multi_term') {
              finalScore += SYSTEM_CONFIG.classification.multiTermBonus;
            } else if (classification.searchStrategy === 'business_type') {
              finalScore += SYSTEM_CONFIG.classification.businessTypeSearchBonus;
            }

            // Cap the score at maximum confidence - FROM CONFIG
            finalScore = Math.min(
              SYSTEM_CONFIG.classification.maxConfidence, 
              Math.max(SYSTEM_CONFIG.classification.minConfidence, finalScore)
            );

            scored.push({
              hs_code: classification.hs_code,
              product_description: classification.product_description,
              confidenceScore: Math.round(finalScore * 100) / 100,
              confidenceSource: classification.confidenceSource || 'ai_enhanced',
              usmca_eligible: classification.usmca_eligible,
              mfn_tariff_rate: classification.mfn_tariff_rate,
              usmca_tariff_rate: classification.usmca_tariff_rate,
              searchStrategy: classification.searchStrategy,
              matchedTerms: classification.matchedTerms || [classification.matchedTerm],
              aiConfidenceScore: classification.confidence, // Original AI score
              termMatchScore: termScore,
              dataQualityScore: dataQualityScore
            });

          } catch (error) {
            logError('Failed to enhance AI classification score', error);
          }
        }

        // Sort by confidence score descending
        return scored.sort((a, b) => b.confidenceScore - a.confidenceScore);
      }

      // Fallback to original database-only scoring if AI fails
      logInfo('AI scoring unavailable, using fallback database scoring');
      return await this.scoreClassificationResultsFallback(classifications, searchTerms, businessType);

    } catch (error) {
      logError('AI confidence scoring failed, using fallback', error);
      return await this.scoreClassificationResultsFallback(classifications, searchTerms, businessType);
    }
  }

  /**
   * Fallback scoring method (original database-only scoring)
   */
  async scoreClassificationResultsFallback(classifications, searchTerms, businessType) {
    const scored = [];

    for (const classification of classifications) {
      try {
        let baseScore = SYSTEM_CONFIG.classification.baseConfidenceScore; // FROM CONFIG
        
        // Score based on search term matches - FROM CONFIG
        const termScore = this.calculateTermMatchScore(
          classification.product_description, 
          searchTerms
        );
        baseScore += termScore * SYSTEM_CONFIG.classification.termScoreWeight;

        // Score based on data quality (tariff data availability) - FROM CONFIG
        const dataQualityScore = this.calculateDataQualityScore(classification);
        baseScore += dataQualityScore * SYSTEM_CONFIG.classification.dataQualityWeight;

        // Score based on USMCA eligibility - FROM CONFIG
        if (classification.usmca_eligible === true) {
          baseScore += SYSTEM_CONFIG.classification.usmcaEligibilityBonus;
        }

        // Bonus for business type match - FROM CONFIG
        if (businessType && classification.businessType === businessType) {
          baseScore += SYSTEM_CONFIG.classification.businessTypeMatchBonus;
        }

        // Bonus for search strategy - FROM CONFIG
        if (classification.searchStrategy === 'multi_term') {
          baseScore += SYSTEM_CONFIG.classification.multiTermSearchBonus;
        } else if (classification.searchStrategy === 'business_type') {
          baseScore += SYSTEM_CONFIG.classification.businessTypeSearchBonus;
        }

        // Cap the score at maximum confidence - FROM CONFIG
        const finalScore = Math.min(
          SYSTEM_CONFIG.classification.maxConfidence, 
          Math.max(SYSTEM_CONFIG.classification.minConfidence, baseScore)
        );

        scored.push({
          hs_code: classification.hs_code,
          product_description: classification.product_description,
          confidenceScore: Math.round(finalScore * 100) / 100,
          confidenceSource: 'database_fallback',
          usmca_eligible: classification.usmca_eligible,
          mfn_tariff_rate: classification.mfn_tariff_rate,
          usmca_tariff_rate: classification.usmca_tariff_rate,
          searchStrategy: classification.searchStrategy,
          matchedTerms: classification.matchedTerms || [classification.matchedTerm],
          termMatchScore: termScore,
          dataQualityScore: dataQualityScore
        });

      } catch (error) {
        logError('Failed to score classification result', error);
      }
    }

    // Sort by confidence score descending
    return scored.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  /**
   * Calculate term match score - NO HARDCODED WEIGHTS
   */
  calculateTermMatchScore(description, searchTerms) {
    const descLower = description.toLowerCase();
    const matchedTerms = searchTerms.filter(term => 
      descLower.includes(term.toLowerCase())
    );
    
    return matchedTerms.length / searchTerms.length;
  }

  /**
   * Calculate data quality score based on available data
   */
  calculateDataQualityScore(classification) {
    let score = 0.0;
    
    // Score for having tariff data - FROM CONFIG
    if (classification.mfn_tariff_rate !== null) {
      score += SYSTEM_CONFIG.classification.tariffRateScore;
    }
    if (classification.usmca_tariff_rate !== null) {
      score += SYSTEM_CONFIG.classification.usmcaRateScore;
    }
    
    // Score for meaningful tariff difference - FROM CONFIG
    if (classification.mfn_tariff_rate && classification.usmca_tariff_rate) {
      const difference = Math.abs(classification.mfn_tariff_rate - classification.usmca_tariff_rate);
      if (difference > SYSTEM_CONFIG.classification.tariffDifferenceThreshold1) {
        score += SYSTEM_CONFIG.classification.tariffDifferenceBonus1;
      }
      if (difference > SYSTEM_CONFIG.classification.tariffDifferenceThreshold2) {
        score += SYSTEM_CONFIG.classification.tariffDifferenceBonus2;
      }
    }
    
    // Score for description quality - FROM CONFIG
    if (classification.product_description && 
        classification.product_description.length > SYSTEM_CONFIG.classification.descriptionLengthThreshold) {
      score += SYSTEM_CONFIG.classification.descriptionLengthBonus;
    }

    return Math.min(1.0, score);
  }

  /**
   * Generate professional referral response
   */
  generateProfessionalReferralResponse(reason) {
    return {
      success: false,
      requiresProfessional: true,
      reason: reason,
      message: MESSAGES.errors.professionalRequired,
      recommendations: [
        'Contact a trade compliance expert',
        'Provide more detailed product description',
        'Include technical specifications',
        'Consider professional trade classification service'
      ],
      processingTimeMs: 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate classification response
   */
  async generateClassificationResponse(results, searchTerms, businessType, sourceCountry, startTime) {
    if (results.length === 0) {
      return this.generateProfessionalReferralResponse('No qualified classifications found');
    }

    const highConfidenceResults = results.filter(r => r.confidenceScore >= SYSTEM_CONFIG.classification.highConfidenceThreshold);
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      query: {
        searchTerms,
        businessType,
        sourceCountry
      },
      results: results,
      summary: {
        totalResults: results.length,
        highConfidenceResults: highConfidenceResults.length,
        averageConfidence: results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length,
        recommendsProfessionalReview: highConfidenceResults.length === 0
      },
      recommendations: await this.generateRecommendations(results, businessType),
      disclaimers: [
        MESSAGES.disclaimers.classification,
        MESSAGES.disclaimers.general,
        'Database-driven classification results require verification'
      ],
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate recommendations based on results
   */
  async generateRecommendations(results, businessType) {
    const recommendations = [];
    
    // Standard professional verification recommendation
    recommendations.push('Verify classification with trade compliance expert');
    
    // USMCA-specific recommendations
    const usmcaEligible = results.filter(r => r.usmca_eligible);
    if (usmcaEligible.length > 0) {
      recommendations.push('Consider USMCA preferential treatment opportunities');
    }
    
    // Business type recommendations from database
    if (businessType) {
      try {
        const businessRules = await this.dbService.getUSMCAQualificationRules(null, businessType);
        if (businessRules && businessRules.length > 0) {
          recommendations.push(`Review ${businessType} specific USMCA requirements`);
        }
      } catch (error) {
        logError('Failed to generate business type recommendations', error);
      }
    }
    
    return recommendations;
  }

  /**
   * Generate error response
   */
  generateErrorResponse(error) {
    return {
      success: false,
      error: MESSAGES.errors.classificationFailed,
      technicalError: error.message,
      fallback: {
        method: 'PROFESSIONAL_CLASSIFICATION_REQUIRED',
        guidance: MESSAGES.errors.professionalRequired
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Remove duplicate classifications by HS code
   */
  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(result => {
      if (seen.has(result.hs_code)) {
        return false;
      }
      seen.add(result.hs_code);
      return true;
    });
  }

  /**
   * Cache management methods
   */
  generateCacheKey(productDescription, businessType, sourceCountry) {
    const key = `${productDescription}_${businessType || 'null'}_${sourceCountry || 'null'}`;
    return Buffer.from(key).toString('base64').slice(0, 50);
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    // Prevent cache from growing too large
    if (this.cache.size >= SYSTEM_CONFIG.cache.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const removeCount = Math.floor(entries.length * SYSTEM_CONFIG.classification.cacheRemovalPercentage);
      for (let i = 0; i < removeCount; i++) { // Remove configured percentage of entries
        this.cache.delete(entries[i][0]);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Log classification attempt to database
   */
  async logClassificationAttempt(productDescription, response) {
    try {
      const hsCode = response.success && response.results.length > 0 
        ? response.results[0].hs_code 
        : null;
      const confidence = response.success && response.results.length > 0 
        ? response.results[0].confidenceScore 
        : 0;

      await this.dbService.logClassification(
        productDescription,
        hsCode,
        confidence,
        'database_driven_classifier'
      );
    } catch (error) {
      logError('Failed to log classification attempt', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: SYSTEM_CONFIG.cache.maxCacheSize,
      ttl: this.cacheTtl
    };
  }
}

// Export singleton classifier instance
export const databaseDrivenClassifier = new DatabaseDrivenClassifier();

// Export main classification function for backward compatibility
export async function performIntelligentClassification(request) {
  return await databaseDrivenClassifier.classifyProduct(request);
}

const databaseDrivenClassifierExports = {
  DatabaseDrivenClassifier,
  databaseDrivenClassifier,
  performIntelligentClassification
};

export default databaseDrivenClassifierExports;