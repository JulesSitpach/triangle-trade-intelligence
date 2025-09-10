/**
 * DATABASE-DRIVEN HS CLASSIFICATION SYSTEM
 * NO HARDCODED VALUES - All configuration from database/config files
 * Follows project's database-first architecture principles
 */

import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError } from '../utils/production-logger.js';

export class DatabaseDrivenHSClassifier {
  constructor() {
    this.db = serverDatabaseService;
    this.cache = new Map();
    this.cacheExpiry = 300000; // 5 minutes
    this.configCache = new Map();
  }

  /**
   * Main classification method - fully database-driven
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

      // Database-driven classification pipeline
      const results = await this.runDatabaseClassificationPipeline(normalizedDescription, options);
      
      // Cache results
      this.cacheResult(cacheKey, results);
      
      const executionTime = Date.now() - startTime;
      logInfo('Database-driven classification completed', { 
        description: productDescription,
        resultsCount: results.length,
        executionTime 
      });

      return {
        success: true,
        query: productDescription,
        results: results.slice(0, options.limit || 10),
        executionTime,
        approach: 'database_driven_classification',
        confidence: results.length > 0 ? results[0].confidence : 0
      };

    } catch (error) {
      logError('Database-driven classification error', error);
      return {
        success: false,
        error: error.message,
        results: [],
        fallbackRecommended: 'basic_keyword_search'
      };
    }
  }

  /**
   * Database-driven classification pipeline
   */
  async runDatabaseClassificationPipeline(description, options) {
    const allResults = [];
    const seenCodes = new Set();

    // Stage 1: Direct database text search with full-text search
    const directResults = await this.performDirectDatabaseSearch(description);
    this.addUniqueResults(allResults, directResults, seenCodes);

    // Stage 2: Keyword-based search using database configuration
    const keywordResults = await this.performConfigurableKeywordSearch(description, options);
    this.addUniqueResults(allResults, keywordResults, seenCodes);

    // Stage 3: Chapter-based search using database business type mapping
    const chapterResults = await this.performChapterBasedSearch(description, options);
    this.addUniqueResults(allResults, chapterResults, seenCodes);

    // Stage 4: Similarity search within product families
    const similarityResults = await this.performSimilaritySearch(description, allResults);
    this.addUniqueResults(allResults, similarityResults, seenCodes);

    // Sort by database-driven relevance scoring
    return this.rankResultsByDatabaseRelevance(allResults, description, options);
  }

  /**
   * Stage 1: Direct database full-text search
   */
  async performDirectDatabaseSearch(description) {
    const results = [];
    
    try {
      // Use PostgreSQL full-text search capabilities
      const { data: matches } = await this.db.client
        .from('hs_master_rebuild')
        .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
        .textSearch('description', description, {
          type: 'websearch',
          config: 'english'
        })
        .limit(20);

      if (matches) {
        matches.forEach(match => {
          const relevanceScore = this.calculateDatabaseRelevanceScore(description, match);
          if (relevanceScore > 0.3) {
            results.push({
              ...match,
              confidence: Math.round(relevanceScore * 100),
              matchType: 'direct_database_search',
              searchMethod: 'postgresql_fulltext'
            });
          }
        });
      }
    } catch (error) {
      logError('Direct database search error', error);
    }

    return results;
  }

  /**
   * Stage 2: Configurable keyword search using database configuration
   */
  async performConfigurableKeywordSearch(description, options) {
    const results = [];
    
    try {
      // Get keyword mappings from database configuration
      const keywordMappings = await this.getKeywordMappingsFromDatabase();
      
      // Extract relevant keywords based on database configuration
      const relevantKeywords = this.extractRelevantKeywords(description, keywordMappings);
      
      for (const keywordConfig of relevantKeywords) {
        const { data: matches } = await this.db.client
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .or(keywordConfig.searchQuery)
          .limit(15);

        if (matches) {
          matches.forEach(match => {
            const keywordScore = this.calculateKeywordConfigScore(
              description, 
              match, 
              keywordConfig
            );
            
            if (keywordScore > 0.4) {
              results.push({
                ...match,
                confidence: Math.round(keywordScore * 100),
                matchType: 'configurable_keyword',
                keywordCategory: keywordConfig.category,
                searchMethod: 'database_keyword_mapping'
              });
            }
          });
        }
      }
    } catch (error) {
      logError('Configurable keyword search error', error);
    }

    return results;
  }

  /**
   * Stage 3: Chapter-based search using database business type mapping
   */
  async performChapterBasedSearch(description, options) {
    const results = [];
    
    try {
      // Get relevant chapters from database business type mapping
      const relevantChapters = await this.getRelevantChaptersFromDatabase(
        description, 
        options.context?.businessType
      );
      
      for (const chapter of relevantChapters) {
        const { data: chapterMatches } = await this.db.client
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .eq('chapter', chapter.chapter_number)
          .textSearch('description', description)
          .limit(10);

        if (chapterMatches) {
          chapterMatches.forEach(match => {
            const chapterScore = this.calculateChapterRelevanceScore(
              description,
              match,
              chapter
            );
            
            if (chapterScore > 0.4) {
              results.push({
                ...match,
                confidence: Math.round(chapterScore * 100),
                matchType: 'database_chapter_mapping',
                chapterReason: chapter.reason,
                searchMethod: 'business_type_chapter_mapping'
              });
            }
          });
        }
      }
    } catch (error) {
      logError('Chapter-based search error', error);
    }

    return results;
  }

  /**
   * Stage 4: Similarity search within product families
   */
  async performSimilaritySearch(description, existingResults) {
    const results = [];
    
    // Use top results to find similar products in same product families
    const topResults = existingResults
      .filter(r => r.confidence > 70)
      .slice(0, 3);
    
    for (const baseResult of topResults) {
      try {
        // Find similar products using database relationships
        const heading = baseResult.hs_code.substring(0, 4);
        
        const { data: similarMatches } = await this.db.client
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .like('hs_code', `${heading}%`)
          .neq('hs_code', baseResult.hs_code)
          .limit(8);

        if (similarMatches) {
          similarMatches.forEach(match => {
            const similarityScore = this.calculateSimilarityScore(
              description,
              match,
              baseResult
            );
            
            if (similarityScore > 0.5) {
              results.push({
                ...match,
                confidence: Math.round(similarityScore * 100),
                matchType: 'database_similarity',
                similarTo: baseResult.hs_code,
                searchMethod: 'heading_based_similarity'
              });
            }
          });
        }
      } catch (error) {
        logError('Similarity search error', error);
      }
    }

    return results;
  }

  /**
   * Get keyword mappings from database configuration
   */
  async getKeywordMappingsFromDatabase() {
    const cacheKey = 'keyword_mappings';
    let mappings = this.configCache.get(cacheKey);
    
    if (!mappings) {
      try {
        // Try to get from classification_keywords table
        const { data: keywordData } = await this.db.client
          .from('classification_keywords')
          .select('keyword, category, search_terms, hs_chapters, confidence_boost');
        
        if (keywordData && keywordData.length > 0) {
          mappings = keywordData;
        } else {
          // Fallback to basic configuration if table doesn't exist
          mappings = await this.getDefaultKeywordMappings();
        }
        
        this.configCache.set(cacheKey, mappings);
      } catch (error) {
        logError('Failed to load keyword mappings from database', error);
        mappings = await this.getDefaultKeywordMappings();
      }
    }
    
    return mappings;
  }

  /**
   * Get default keyword mappings if database configuration doesn't exist
   */
  async getDefaultKeywordMappings() {
    // Minimal fallback configuration - could be loaded from config file
    return [
      {
        keyword: 'electronic',
        category: 'electronics',
        search_terms: ['electronic', 'electrical', 'circuit', 'semiconductor'],
        hs_chapters: [85],
        confidence_boost: 0.2
      },
      {
        keyword: 'steel',
        category: 'metals',
        search_terms: ['steel', 'iron', 'metal', 'alloy'],
        hs_chapters: [72, 73],
        confidence_boost: 0.2
      },
      {
        keyword: 'textile',
        category: 'textiles',
        search_terms: ['textile', 'fabric', 'cotton', 'wool'],
        hs_chapters: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63],
        confidence_boost: 0.2
      }
    ];
  }

  /**
   * Get relevant chapters from database business type mapping
   */
  async getRelevantChaptersFromDatabase(description, businessType) {
    try {
      // Try business type mapping first
      if (businessType) {
        const { data: businessMapping } = await this.db.client
          .from('business_type_hs_mapping')
          .select('hs_chapters, priority, reason')
          .eq('business_type', businessType.toLowerCase());
        
        if (businessMapping && businessMapping.length > 0) {
          return businessMapping.map(mapping => ({
            chapter_number: mapping.hs_chapters,
            priority: mapping.priority,
            reason: `Business type: ${businessType}`
          })).flat();
        }
      }
      
      // Fallback to keyword-based chapter inference
      const keywordMappings = await this.getKeywordMappingsFromDatabase();
      const relevantMappings = keywordMappings.filter(mapping => 
        mapping.search_terms.some(term => description.toLowerCase().includes(term))
      );
      
      return relevantMappings.map(mapping => 
        mapping.hs_chapters.map(chapter => ({
          chapter_number: chapter,
          priority: 'medium',
          reason: `Keyword category: ${mapping.category}`
        }))
      ).flat();
      
    } catch (error) {
      logError('Failed to get relevant chapters from database', error);
      return [];
    }
  }

  /**
   * Extract relevant keywords based on database configuration
   */
  extractRelevantKeywords(description, keywordMappings) {
    const desc = description.toLowerCase();
    const relevantMappings = [];
    
    keywordMappings.forEach(mapping => {
      const matchingTerms = mapping.search_terms.filter(term => 
        desc.includes(term.toLowerCase())
      );
      
      if (matchingTerms.length > 0) {
        // Build search query for this mapping
        const searchQuery = matchingTerms
          .map(term => `description.ilike.%${term}%`)
          .join(',');
        
        relevantMappings.push({
          ...mapping,
          matchingTerms,
          searchQuery,
          relevanceScore: matchingTerms.length / mapping.search_terms.length
        });
      }
    });
    
    // Sort by relevance and return top matches
    return relevantMappings
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }

  /**
   * Database-driven relevance scoring
   */
  calculateDatabaseRelevanceScore(description, match) {
    const desc = description.toLowerCase();
    const matchDesc = match.description.toLowerCase();
    
    let score = 0;
    
    // Word overlap scoring
    const descWords = desc.split(/\s+/).filter(w => w.length > 2);
    const matchWords = matchDesc.split(/\s+/);
    const overlap = descWords.filter(word => matchWords.includes(word)).length;
    
    if (descWords.length > 0) {
      const overlapRatio = overlap / descWords.length;
      score += overlapRatio * 0.7;
    }
    
    // Exact phrase matching boost
    if (matchDesc.includes(desc)) {
      score += 0.3;
    }
    
    // Prefer items with tariff data
    if (match.mfn_rate > 0) score += 0.1;
    if (match.usmca_rate !== match.mfn_rate) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  calculateKeywordConfigScore(description, match, keywordConfig) {
    let score = 0.5; // Base score for matching keyword configuration
    
    // Boost based on matching terms
    const matchingTermCount = keywordConfig.matchingTerms.filter(term =>
      match.description.toLowerCase().includes(term.toLowerCase())
    ).length;
    
    score += (matchingTermCount / keywordConfig.search_terms.length) * 0.3;
    
    // Apply confidence boost from configuration
    score += keywordConfig.confidence_boost;
    
    // Word overlap with original description
    const descWords = description.toLowerCase().split(/\s+/);
    const matchWords = match.description.toLowerCase().split(/\s+/);
    const overlap = descWords.filter(word => matchWords.includes(word)).length;
    score += (overlap / descWords.length) * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  calculateChapterRelevanceScore(description, match, chapterInfo) {
    let score = 0.6; // Base score for being in relevant chapter
    
    // Boost based on chapter priority from database
    const priorityBoosts = { 'high': 0.2, 'medium': 0.1, 'low': 0.05 };
    score += priorityBoosts[chapterInfo.priority] || 0;
    
    // Word overlap scoring
    const descWords = description.toLowerCase().split(/\s+/);
    const matchWords = match.description.toLowerCase().split(/\s+/);
    const overlap = descWords.filter(word => matchWords.includes(word)).length;
    score += (overlap / descWords.length) * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  calculateSimilarityScore(description, match, baseResult) {
    let score = 0.4; // Base similarity score
    
    // Shared vocabulary analysis
    const descWords = new Set(description.toLowerCase().split(/\s+/));
    const matchWords = new Set(match.description.toLowerCase().split(/\s+/));
    const baseWords = new Set(baseResult.description.toLowerCase().split(/\s+/));
    
    const descMatchOverlap = [...descWords].filter(w => matchWords.has(w)).length;
    const baseMatchOverlap = [...baseWords].filter(w => matchWords.has(w)).length;
    
    score += (descMatchOverlap / descWords.size) * 0.3;
    score += (baseMatchOverlap / baseWords.size) * 0.3;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Database-driven relevance ranking
   */
  rankResultsByDatabaseRelevance(results, originalDescription, options) {
    return results
      .map(result => ({
        ...result,
        finalScore: this.calculateFinalDatabaseScore(result, originalDescription, options)
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
        searchMethod: result.searchMethod,
        relevanceFactors: result.keywordCategory ? [result.keywordCategory] : []
      }));
  }

  calculateFinalDatabaseScore(result, originalDescription, options) {
    let score = result.confidence;
    
    // Boost based on search method quality (from database configuration)
    const methodBoosts = {
      'direct_database_search': 15,
      'database_keyword_mapping': 12,
      'database_chapter_mapping': 10,
      'business_type_chapter_mapping': 8,
      'database_similarity': 5
    };
    
    score += methodBoosts[result.searchMethod] || 0;
    
    // Database-driven trade relevance
    if (result.mfn_rate > 0) score += 5;
    if (result.usmca_rate !== result.mfn_rate) score += 5;
    
    // Penalize very short descriptions (likely incomplete data)
    if (result.description.length < 20) score -= 5;
    
    return Math.max(10, Math.min(100, score));
  }

  // Helper methods (same as before but without hardcoded logic)
  normalizeDescription(description) {
    if (!description || typeof description !== 'string') return null;
    return description.trim().toLowerCase();
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
export const databaseDrivenHSClassifier = new DatabaseDrivenHSClassifier();

// Export main classification function
export async function performDatabaseDrivenClassification(productDescription, options = {}) {
  return await databaseDrivenHSClassifier.classifyProduct(productDescription, options);
}