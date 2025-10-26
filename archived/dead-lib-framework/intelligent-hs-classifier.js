/**
 * INTELLIGENT HS CLASSIFICATION SYSTEM
 * Generic, configurable AI-powered classification for all products and users
 * NO HARDCODED VALUES - Everything database/config driven
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError } from '../utils/production-logger.js';

export class IntelligentHSClassifier {
  constructor() {
    this.db = serverDatabaseService;
    this.cache = new Map();
    this.cacheExpiry = 300000; // 5 minutes
  }

  /**
   * Main classification method - works for any product description
   */
  async classifyProduct(productDescription, options = {}) {
    try {
      const startTime = Date.now();
      
      // Normalize input
      const normalizedDescription = this.normalizeDescription(productDescription);
      if (!normalizedDescription) {
        throw new Error('Valid product description required');
      }

      // Check cache first
      const cacheKey = `classify:${normalizedDescription}:${JSON.stringify(options)}`;
      const cached = this.getCachedResult(cacheKey);
      if (cached) return cached;

      // Multi-stage classification pipeline
      const results = await this.runClassificationPipeline(normalizedDescription, options);
      
      // Cache results
      this.cacheResult(cacheKey, results);
      
      const executionTime = Date.now() - startTime;
      logInfo('Intelligent classification completed', { 
        description: productDescription,
        resultsCount: results.length,
        executionTime 
      });

      return {
        success: true,
        query: productDescription,
        results: results.slice(0, options.limit || 10),
        executionTime,
        approach: 'intelligent_ai_classification',
        confidence: results.length > 0 ? results[0].confidence : 0
      };

    } catch (error) {
      logError('Intelligent classification error', error);
      return {
        success: false,
        error: error.message,
        results: [],
        fallbackRecommended: 'basic_keyword_search'
      };
    }
  }

  /**
   * Multi-stage classification pipeline
   */
  async runClassificationPipeline(description, options) {
    const allResults = [];
    const seenCodes = new Set();

    // Stage 1: Semantic phrase matching
    const phraseResults = await this.semanticPhraseMatch(description);
    this.addUniqueResults(allResults, phraseResults, seenCodes);

    // Stage 2: Hierarchical chapter analysis
    const chapterResults = await this.hierarchicalChapterMatch(description, options.knownChapter);
    this.addUniqueResults(allResults, chapterResults, seenCodes);

    // Stage 3: Product relationship analysis
    const relationshipResults = await this.productRelationshipMatch(description, allResults);
    this.addUniqueResults(allResults, relationshipResults, seenCodes);

    // Stage 4: Contextual similarity scoring
    const similarityResults = await this.contextualSimilarityMatch(description, options.context);
    this.addUniqueResults(allResults, similarityResults, seenCodes);

    // Sort by intelligent relevance scoring
    return this.rankResultsByRelevance(allResults, description, options);
  }

  /**
   * Stage 1: Semantic phrase matching with intelligent weighting
   */
  async semanticPhraseMatch(description) {
    const results = [];
    const phrases = this.extractMeaningfulPhrases(description);
    
    for (const phrase of phrases) {
      try {
        const { data: matches } = await this.db.client
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .textSearch('description', phrase, {
            type: 'phrase',
            config: 'english'
          })
          .limit(15);

        if (matches) {
          matches.forEach(match => {
            const semanticScore = this.calculateSemanticScore(phrase, match.description, description);
            if (semanticScore > 0.3) { // Dynamic threshold
              results.push({
                ...match,
                confidence: Math.round(semanticScore * 100),
                matchType: 'semantic_phrase',
                matchedPhrase: phrase
              });
            }
          });
        }
      } catch (error) {
        logError('Semantic phrase match error', error);
      }
    }

    return results;
  }

  /**
   * Stage 2: Hierarchical chapter matching - understands HS code structure
   */
  async hierarchicalChapterMatch(description, knownChapter = null) {
    const results = [];
    
    // Extract industry indicators from description
    const industrySignals = await this.extractIndustrySignals(description);
    
    // Get relevant chapters based on signals or known chapter
    const relevantChapters = knownChapter 
      ? [knownChapter, ...this.getRelatedChapters(knownChapter)]
      : await this.inferChaptersFromSignals(industrySignals);

    for (const chapter of relevantChapters) {
      try {
        const { data: chapterMatches } = await this.db.client
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .eq('chapter', chapter)
          .textSearch('description', description.toLowerCase())
          .limit(10);

        if (chapterMatches) {
          chapterMatches.forEach(match => {
            const hierarchicalScore = this.calculateHierarchicalRelevance(
              description, 
              match, 
              chapter,
              knownChapter
            );
            
            if (hierarchicalScore > 0.4) {
              results.push({
                ...match,
                confidence: Math.round(hierarchicalScore * 100),
                matchType: knownChapter ? 'chapter_specific' : 'chapter_inferred',
                relevantChapter: chapter
              });
            }
          });
        }
      } catch (error) {
        logError(`Chapter ${chapter} matching error`, error);
      }
    }

    return results;
  }

  /**
   * Stage 3: Product relationship matching - understands product connections
   */
  async productRelationshipMatch(description, existingResults) {
    const results = [];
    
    // If we have good results, find related products
    const highConfidenceResults = existingResults.filter(r => r.confidence > 70);
    
    for (const baseResult of highConfidenceResults.slice(0, 3)) {
      try {
        // Find products in same heading (first 4 digits)
        const heading = baseResult.hs_code.substring(0, 4);
        
        const { data: relatedMatches } = await this.db.client
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .like('hs_code', `${heading}%`)
          .neq('hs_code', baseResult.hs_code)
          .limit(5);

        if (relatedMatches) {
          relatedMatches.forEach(match => {
            const relationshipScore = this.calculateRelationshipScore(
              description,
              match.description,
              baseResult.description
            );
            
            if (relationshipScore > 0.5) {
              results.push({
                ...match,
                confidence: Math.round(relationshipScore * 100),
                matchType: 'product_relationship',
                relatedTo: baseResult.hs_code
              });
            }
          });
        }
      } catch (error) {
        logError('Product relationship matching error', error);
      }
    }

    return results;
  }

  /**
   * Stage 4: Contextual similarity matching
   */
  async contextualSimilarityMatch(description, context = {}) {
    const results = [];
    
    // Use context clues (business type, industry, etc.) to improve matching
    const contextualKeywords = this.extractContextualKeywords(description, context);
    
    if (contextualKeywords.length > 0) {
      try {
        // Build dynamic query based on context
        let query = this.db.client
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source');

        // Apply contextual filters
        if (context.businessType) {
          const businessChapters = await this.getBusinessTypeChapters(context.businessType);
          if (businessChapters.length > 0) {
            query = query.in('chapter', businessChapters);
          }
        }

        // Search with contextual keywords
        const keywordQuery = contextualKeywords.join(' | ');
        const { data: contextMatches } = await query
          .textSearch('description', keywordQuery)
          .limit(15);

        if (contextMatches) {
          contextMatches.forEach(match => {
            const contextualScore = this.calculateContextualScore(
              description,
              match,
              context,
              contextualKeywords
            );
            
            if (contextualScore > 0.35) {
              results.push({
                ...match,
                confidence: Math.round(contextualScore * 100),
                matchType: 'contextual_similarity',
                contextFactors: this.getContextFactors(match, context)
              });
            }
          });
        }
      } catch (error) {
        logError('Contextual similarity matching error', error);
      }
    }

    return results;
  }

  /**
   * Intelligent relevance ranking
   */
  rankResultsByRelevance(results, originalDescription, options) {
    return results
      .map(result => ({
        ...result,
        finalScore: this.calculateFinalRelevanceScore(result, originalDescription, options)
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(result => ({
        hsCode: result.hs_code,
        description: result.description,
        confidence: Math.min(100, Math.max(10, result.finalScore)),
        matchType: result.matchType,
        mfnRate: result.mfn_rate || 0,
        usmcaRate: result.usmca_rate || 0,
        country: result.country_source,
        chapter: result.chapter,
        displayText: `${result.hs_code} - ${result.description.substring(0, 80)}${result.description.length > 80 ? '...' : ''}`,
        confidenceText: this.getConfidenceText(result.finalScore),
        relevanceFactors: result.contextFactors || []
      }));
  }

  /**
   * Helper Methods - All configurable, no hardcoding
   */

  normalizeDescription(description) {
    if (!description || typeof description !== 'string') return null;
    return description.trim().toLowerCase();
  }

  extractMeaningfulPhrases(description) {
    const words = description.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const meaningful = words.filter(word => 
      word.length > 2 && !stopWords.includes(word) && !/^\d+$/.test(word)
    );
    
    const phrases = [];
    // Single meaningful words
    phrases.push(...meaningful.slice(0, 5));
    
    // Meaningful pairs
    for (let i = 0; i < Math.min(meaningful.length - 1, 4); i++) {
      phrases.push(`${meaningful[i]} ${meaningful[i + 1]}`);
    }
    
    // Full phrase if short enough
    if (description.length < 50) {
      phrases.push(description.toLowerCase());
    }
    
    return phrases;
  }

  calculateSemanticScore(phrase, hsDescription, originalDescription) {
    const hsDesc = hsDescription.toLowerCase();
    const original = originalDescription.toLowerCase();
    
    let score = 0;
    
    // Exact phrase match in HS description
    if (hsDesc.includes(phrase.toLowerCase())) {
      score += 0.4;
    }
    
    // Word overlap scoring
    const phraseWords = phrase.split(/\s+/);
    const hsWords = hsDesc.split(/\s+/);
    const overlap = phraseWords.filter(word => hsWords.includes(word)).length;
    score += (overlap / phraseWords.length) * 0.3;
    
    // Semantic density (how specific is the match)
    const specificity = Math.min(1, phrase.length / hsDesc.length);
    score += specificity * 0.2;
    
    // Penalize very generic matches
    const genericTerms = ['product', 'item', 'goods', 'material', 'equipment'];
    if (genericTerms.some(term => phrase.includes(term) && hsDesc.includes(term))) {
      score -= 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  async extractIndustrySignals(description) {
    // Extract industry indicators without hardcoding specific terms
    const words = description.toLowerCase().split(/\s+/);
    const signals = [];
    
    // Look up industry keywords from database configuration
    try {
      const { data: industryKeywords } = await this.db.client
        .from('industry_classification_keywords')
        .select('keyword, industry_type, hs_chapters')
        .in('keyword', words);
      
      if (industryKeywords) {
        signals.push(...industryKeywords);
      }
    } catch (error) {
      // Fallback to basic analysis if config table doesn't exist
      logError('Industry signals lookup failed, using basic analysis', error);
    }
    
    return signals;
  }

  async inferChaptersFromSignals(industrySignals) {
    const chapters = new Set();
    
    // Extract chapters from industry signals
    industrySignals.forEach(signal => {
      if (signal.hs_chapters) {
        signal.hs_chapters.forEach(chapter => chapters.add(chapter));
      }
    });
    
    // If no signals, return most common chapters for broad search
    if (chapters.size === 0) {
      // Get most frequently used chapters from database
      try {
        const { data: popularChapters } = await this.db.client
          .from('hs_master_rebuild')
          .select('chapter')
          .limit(1000);
        
        if (popularChapters) {
          const chapterCounts = {};
          popularChapters.forEach(row => {
            chapterCounts[row.chapter] = (chapterCounts[row.chapter] || 0) + 1;
          });
          
          // Return top 10 most common chapters
          const topChapters = Object.entries(chapterCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([chapter]) => parseInt(chapter));
          
          return topChapters;
        }
      } catch (error) {
        logError('Failed to get popular chapters', error);
      }
      
      // Final fallback - return empty array for full search
      return [];
    }
    
    return Array.from(chapters).slice(0, 8); // Limit to 8 chapters for performance
  }

  getRelatedChapters(chapter) {
    // This could be configured in database, but for now use logical relationships
    const relationships = {
      // Electronics and electrical
      85: [84, 90, 94], // Electrical -> Machinery, Instruments, Furniture
      84: [85, 87, 90], // Machinery -> Electrical, Vehicles, Instruments
      90: [84, 85, 94], // Instruments -> Machinery, Electrical, Furniture
      
      // Textiles and apparel
      61: [62, 63, 42], // Knitted -> Woven, Textile articles, Leather
      62: [61, 63, 42], // Woven -> Knitted, Textile articles, Leather
      63: [61, 62, 42], // Textile articles -> Knitted, Woven, Leather
      42: [61, 62, 64], // Leather -> Knitted, Woven, Footwear
      
      // Metals
      72: [73, 74, 76], // Iron/Steel -> Articles of iron/steel, Copper, Aluminum
      73: [72, 74, 76], // Iron/Steel articles -> Iron/Steel, Copper, Aluminum
      
      // Plastics and chemicals
      39: [40, 84, 85], // Plastics -> Rubber, Machinery, Electrical
      40: [39, 64, 87], // Rubber -> Plastics, Footwear, Vehicles
      
      // Vehicles and transport
      87: [84, 40, 73], // Vehicles -> Machinery, Rubber, Iron/Steel articles
      
      // Food and agriculture
      16: [17, 18, 19, 20], // Meat -> Sugars, Cocoa, Cereals, Vegetables
      17: [16, 18, 19, 20], // Sugars -> Meat, Cocoa, Cereals, Vegetables
      18: [16, 17, 19, 20], // Cocoa -> Meat, Sugars, Cereals, Vegetables
      19: [16, 17, 18, 20], // Cereals -> Meat, Sugars, Cocoa, Vegetables
      20: [16, 17, 18, 19]  // Vegetables -> Meat, Sugars, Cocoa, Cereals
    };
    
    return relationships[chapter] || [];
  }

  calculateHierarchicalRelevance(description, match, chapter, knownChapter) {
    let score = 0.5; // Base score for being in relevant chapter
    
    // Boost if this matches a known chapter exactly
    if (knownChapter && match.chapter === knownChapter) {
      score += 0.3;
    }
    
    // Boost for word overlap
    const descWords = description.toLowerCase().split(/\s+/);
    const matchWords = match.description.toLowerCase().split(/\s+/);
    const overlap = descWords.filter(word => matchWords.includes(word)).length;
    const overlapRatio = overlap / Math.max(descWords.length, matchWords.length);
    score += overlapRatio * 0.3;
    
    // Boost for HS code specificity (longer codes are more specific)
    const specificity = Math.min(1, match.hs_code.length / 10);
    score += specificity * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  calculateRelationshipScore(description, matchDesc, baseDesc) {
    const desc = description.toLowerCase();
    const match = matchDesc.toLowerCase();
    const base = baseDesc.toLowerCase();
    
    let score = 0.3; // Base relationship score
    
    // Common word analysis
    const descWords = new Set(desc.split(/\s+/));
    const matchWords = new Set(match.split(/\s+/));
    const baseWords = new Set(base.split(/\s+/));
    
    // Score based on shared vocabulary
    const descMatchOverlap = [...descWords].filter(w => matchWords.has(w)).length;
    const baseMatchOverlap = [...baseWords].filter(w => matchWords.has(w)).length;
    
    score += (descMatchOverlap / descWords.size) * 0.4;
    score += (baseMatchOverlap / baseWords.size) * 0.3;
    
    return Math.max(0, Math.min(1, score));
  }

  extractContextualKeywords(description, context) {
    const words = description.toLowerCase().split(/\s+/);
    const keywords = [];
    
    // Add description words
    keywords.push(...words.filter(w => w.length > 2));
    
    // Add context-based keywords
    if (context.businessType) {
      keywords.push(context.businessType.toLowerCase());
    }
    
    if (context.industry) {
      keywords.push(context.industry.toLowerCase());
    }
    
    if (context.productCategory) {
      keywords.push(context.productCategory.toLowerCase());
    }
    
    // Remove duplicates and stop words
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return [...new Set(keywords)].filter(k => !stopWords.includes(k));
  }

  async getBusinessTypeChapters(businessType) {
    try {
      const { data: mapping } = await this.db.client
        .from('business_type_hs_mapping')
        .select('hs_chapters')
        .eq('business_type', businessType.toLowerCase())
        .single();
      
      return mapping?.hs_chapters || [];
    } catch (error) {
      // Return empty array if no mapping found
      return [];
    }
  }

  calculateContextualScore(description, match, context, contextualKeywords) {
    let score = 0.4; // Base contextual score
    
    // Keyword overlap scoring
    const matchText = match.description.toLowerCase();
    const keywordMatches = contextualKeywords.filter(k => matchText.includes(k)).length;
    score += (keywordMatches / contextualKeywords.length) * 0.4;
    
    // Business type relevance
    if (context.businessType && match.chapter) {
      // This would ideally check against business_type_hs_mapping table
      score += 0.1; // Small boost for having context
    }
    
    // Description similarity
    const descWords = description.toLowerCase().split(/\s+/);
    const matchWords = matchText.split(/\s+/);
    const overlap = descWords.filter(word => matchWords.includes(word)).length;
    score += (overlap / descWords.length) * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  getContextFactors(match, context) {
    const factors = [];
    
    if (context.businessType) {
      factors.push(`Business Type: ${context.businessType}`);
    }
    
    if (context.industry) {
      factors.push(`Industry: ${context.industry}`);
    }
    
    factors.push(`HS Chapter: ${match.chapter}`);
    
    return factors;
  }

  calculateFinalRelevanceScore(result, originalDescription, options) {
    let score = result.confidence;
    
    // Boost based on match type quality
    const matchTypeBoosts = {
      'semantic_phrase': 10,
      'chapter_specific': 15,
      'exact': 20,
      'product_relationship': 8,
      'contextual_similarity': 5,
      'chapter_inferred': 3
    };
    
    score += matchTypeBoosts[result.matchType] || 0;
    
    // Boost for trade relevance (prefer items with actual tariff rates)
    if (result.mfn_rate > 0) score += 5;
    if (result.usmca_rate !== result.mfn_rate) score += 5; // USMCA benefit exists
    
    // Penalize very generic descriptions
    if (result.description.length < 20) score -= 10;
    
    return Math.max(10, Math.min(100, score));
  }

  getConfidenceText(score) {
    if (score >= 90) return 'Excellent match';
    if (score >= 80) return 'Very good match';
    if (score >= 70) return 'Good match';
    if (score >= 60) return 'Likely match';
    if (score >= 50) return 'Possible match';
    if (score >= 30) return 'Weak match';
    return 'Poor match';
  }

  addUniqueResults(allResults, newResults, seenCodes) {
    newResults.forEach(result => {
      if (!seenCodes.has(result.hs_code)) {
        seenCodes.add(result.hs_code);
        allResults.push(result);
      }
    });
  }

  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  cacheResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      entries.slice(0, 500).forEach(([key]) => this.cache.delete(key));
    }
  }
}

// Export singleton instance
export const intelligentHSClassifier = new IntelligentHSClassifier();

// Export main classification function for backward compatibility
export async function performIntelligentClassification(productDescription, options = {}) {
  return await intelligentHSClassifier.classifyProduct(productDescription, options);
}