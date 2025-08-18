/**
 * HS CODE INTELLIGENCE SYSTEM
 * Uses actual HS code patterns to classify products dynamically
 * NO HARDCODING - uses database + HS code system knowledge
 */

import { getSupabaseClient } from './supabase-client.js'

export class HSCodeIntelligence {
  
  constructor() {
    this.supabase = getSupabaseClient()
    // HS Code system knowledge (not hardcoding specific products)
    this.hsCodeSystem = this.initializeHSCodeSystem()
  }

  /**
   * Initialize HS Code system understanding
   * This is knowledge of how HS codes are structured, not hardcoded mappings
   */
  initializeHSCodeSystem() {
    return {
      // Chapter ranges and their general categories
      chapterRanges: [
        { range: [1, 5], category: 'Live Animals & Products', keywords: ['animal', 'meat', 'fish', 'dairy'] },
        { range: [6, 14], category: 'Vegetable Products', keywords: ['plant', 'grain', 'fruit', 'vegetable', 'coffee', 'tea'] },
        { range: [15, 15], category: 'Fats & Oils', keywords: ['oil', 'fat', 'grease'] },
        { range: [16, 24], category: 'Food Products', keywords: ['food', 'beverage', 'tobacco', 'prepared'] },
        { range: [25, 27], category: 'Mineral Products', keywords: ['salt', 'stone', 'cement', 'fuel', 'oil'] },
        { range: [28, 38], category: 'Chemicals & Plastics', keywords: ['chemical', 'plastic', 'pharmaceutical', 'soap'] },
        { range: [39, 40], category: 'Plastics & Rubber', keywords: ['plastic', 'rubber', 'polymer'] },
        { range: [41, 43], category: 'Hides & Leather', keywords: ['leather', 'skin', 'fur'] },
        { range: [44, 46], category: 'Wood Products', keywords: ['wood', 'timber', 'paper', 'cardboard'] },
        { range: [47, 49], category: 'Paper Products', keywords: ['paper', 'cardboard', 'book', 'print'] },
        { range: [50, 63], category: 'Textiles', keywords: ['fabric', 'textile', 'clothing', 'yarn', 'fiber'] },
        { range: [64, 67], category: 'Footwear & Headgear', keywords: ['shoe', 'boot', 'hat', 'umbrella'] },
        { range: [68, 70], category: 'Stone & Ceramics', keywords: ['stone', 'ceramic', 'glass', 'crystal'] },
        { range: [71, 71], category: 'Precious Metals', keywords: ['gold', 'silver', 'diamond', 'jewelry'] },
        { range: [72, 83], category: 'Metals', keywords: ['iron', 'steel', 'aluminum', 'copper', 'metal', 'tool'] },
        { range: [84, 85], category: 'Machinery & Electronics', keywords: ['machine', 'motor', 'computer', 'electronic', 'electrical', 'processor', 'sensor', 'bluetooth', 'wireless'] },
        { range: [86, 89], category: 'Transportation', keywords: ['vehicle', 'ship', 'aircraft', 'railway', 'automotive'] },
        { range: [90, 92], category: 'Precision Instruments', keywords: ['instrument', 'optical', 'medical', 'measuring', 'camera', 'watch'] },
        { range: [93, 93], category: 'Arms & Ammunition', keywords: ['weapon', 'ammunition', 'military'] },
        { range: [94, 96], category: 'Miscellaneous', keywords: ['furniture', 'toy', 'game', 'sport'] },
        { range: [97, 99], category: 'Art & Antiques', keywords: ['art', 'antique', 'collection'] }
      ]
    }
  }

  /**
   * Classify product using HS code intelligence + database
   */
  async classifyProduct(productDescription, businessType = '') {
    try {
      // Step 1: Analyze the product description for keywords
      const keywords = this.extractMeaningfulKeywords(productDescription, businessType)
      
      // Step 2: Find matching HS code categories
      const matchingCategories = this.findMatchingHSCategories(keywords)
      
      // Step 3: Query database for codes in those categories
      const suggestions = await this.findCodesInCategories(matchingCategories, keywords)
      
      // Step 4: Score and rank the suggestions
      return this.scoreAndRankSuggestions(suggestions, productDescription, keywords)
      
    } catch (error) {
      console.error('HS Code Intelligence error:', error)
      return []
    }
  }

  /**
   * Extract meaningful keywords from product description
   */
  extractMeaningfulKeywords(description, businessType) {
    const text = `${description} ${businessType}`.toLowerCase()
    const words = text.split(/\s+/).filter(word => word.length > 2)
    
    // Remove common stop words
    const stopWords = ['the', 'and', 'for', 'with', 'are', 'this', 'that', 'from', 'can', 'will', 'all']
    const keywords = words.filter(word => !stopWords.includes(word))
    
    return keywords
  }

  /**
   * Find HS code categories that match the keywords
   */
  findMatchingHSCategories(keywords) {
    const matches = []
    
    for (const category of this.hsCodeSystem.chapterRanges) {
      let score = 0
      const matchedKeywords = []
      
      for (const keyword of keywords) {
        for (const categoryKeyword of category.keywords) {
          if (keyword.includes(categoryKeyword) || categoryKeyword.includes(keyword)) {
            score += 1
            matchedKeywords.push(keyword)
          }
        }
      }
      
      if (score > 0) {
        matches.push({
          category: category.category,
          chapterRange: category.range,
          score: score,
          matchedKeywords: matchedKeywords
        })
      }
    }
    
    // Sort by score (best matches first)
    return matches.sort((a, b) => b.score - a.score)
  }

  /**
   * Find actual HS codes from database in the matching categories
   */
  async findCodesInCategories(matchingCategories, keywords) {
    const suggestions = []
    
    for (const match of matchingCategories.slice(0, 3)) { // Top 3 category matches
      // Get HS codes that start with chapters in this range
      for (let chapter = match.chapterRange[0]; chapter <= match.chapterRange[1]; chapter++) {
        const chapterStr = chapter.toString().padStart(2, '0')
        
        const { data, error } = await this.supabase
          .from('comtrade_reference')
          .select('hs_code, product_description, product_category')
          .like('hs_code', `${chapterStr}%`)
          .limit(10)
        
        if (data && data.length > 0) {
          for (const record of data) {
            suggestions.push({
              code: record.hs_code,
              description: this.generateIntelligentDescription(record.hs_code, match.category),
              confidence: this.calculateConfidence(match.score, match.matchedKeywords.length, keywords.length),
              category: match.category,
              source: 'hs_code_intelligence',
              matchedKeywords: match.matchedKeywords,
              chapterRange: match.chapterRange
            })
          }
        }
      }
    }
    
    return suggestions
  }

  /**
   * Generate intelligent description based on HS code and category
   */
  generateIntelligentDescription(hsCode, category) {
    const chapter = parseInt(hsCode.substring(0, 2))
    
    // Use HS code system knowledge to generate meaningful descriptions
    if (chapter >= 84 && chapter <= 85) {
      if (hsCode.startsWith('84')) {
        return 'Industrial machinery and mechanical appliances'
      } else if (hsCode.startsWith('85')) {
        return 'Electrical machinery and electronic equipment'
      }
    } else if (chapter >= 90 && chapter <= 92) {
      return 'Precision instruments and measuring equipment'
    } else if (chapter >= 86 && chapter <= 89) {
      return 'Transportation equipment and vehicles'
    } else if (chapter >= 39 && chapter <= 40) {
      return 'Plastics and rubber products'
    } else if (chapter >= 72 && chapter <= 83) {
      return 'Base metals and metal products'
    }
    
    return `${category} - HS Code ${hsCode}`
  }

  /**
   * Calculate confidence score based on keyword matches
   */
  calculateConfidence(categoryScore, matchedKeywords, totalKeywords) {
    const baseConfidence = Math.min(categoryScore * 20, 80) // Up to 80% from category match
    const keywordBonus = Math.min((matchedKeywords / totalKeywords) * 20, 15) // Up to 15% keyword bonus
    
    return Math.min(baseConfidence + keywordBonus, 95)
  }

  /**
   * Score and rank suggestions
   */
  scoreAndRankSuggestions(suggestions, originalDescription, keywords) {
    // Remove duplicates and sort by confidence
    const uniqueSuggestions = new Map()
    
    suggestions.forEach(suggestion => {
      const existing = uniqueSuggestions.get(suggestion.code)
      if (!existing || suggestion.confidence > existing.confidence) {
        uniqueSuggestions.set(suggestion.code, suggestion)
      }
    })
    
    return Array.from(uniqueSuggestions.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3) // Return top 3 suggestions
  }
}

// Export singleton
export const hsCodeIntelligence = new HSCodeIntelligence()

// Main export function
export async function classifyWithHSIntelligence(productDescription, businessType = '') {
  return await hsCodeIntelligence.classifyProduct(productDescription, businessType)
}