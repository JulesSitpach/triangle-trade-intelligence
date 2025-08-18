// UN Comtrade API Integration for Triangle Intelligence
// Real-time HS code mapping with trade volume confidence scoring

class ComtradeAPI {
  constructor() {
    this.baseURL = 'https://comtradeapi.un.org/data/v1/get'
    this.rateLimit = 100 // requests per hour for free tier
    this.lastRequestTime = 0
    this.requestInterval = 36000 // 36 seconds between requests (100/hour)
    
    // Cache for reducing API calls
    this.cache = new Map()
    this.cacheTimeout = 24 * 60 * 60 * 1000 // 24 hours
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.requestInterval) {
      const waitTime = this.requestInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }

  // Clean and tokenize product description for search
  parseProductDescription(description) {
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .split(/\s+/)
      .filter(word => word.length > 2) // Remove short words
      .filter(word => !['and', 'the', 'for', 'with', 'from'].includes(word)) // Remove common words
  }

  // Search Comtrade for HS codes by commodity description
  async searchHSCodes(productDescription, reporterCode = '156') { // Default to China exports
    const cacheKey = `${productDescription}_${reporterCode}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      await this.waitForRateLimit()

      // Parse product description into search terms
      const searchTerms = this.parseProductDescription(productDescription)
      const results = []

      // Try different search strategies
      for (const strategy of this.getSearchStrategies(searchTerms)) {
        try {
          const hsResults = await this.queryComtrade(strategy, reporterCode)
          results.push(...hsResults)
          
          if (results.length >= 5) break // Enough results found
        } catch (error) {
          console.warn(`Comtrade search failed for strategy: ${strategy}`, error)
        }
      }

      // Process and rank results
      const rankedResults = this.rankHSResults(results, productDescription)
      
      // Cache results
      this.cache.set(cacheKey, {
        data: rankedResults,
        timestamp: Date.now()
      })

      return rankedResults

    } catch (error) {
      console.error('Comtrade API error:', error)
      // Smart fallback: Query our database instead of hardcoded mapping
      return this.getDatabaseFallback(productDescription, error)
    }
  }

  // Different search strategies for better coverage
  getSearchStrategies(searchTerms) {
    const strategies = []
    
    // Strategy 1: Full phrase
    strategies.push(searchTerms.join(' '))
    
    // Strategy 2: Primary keywords (first 2-3 terms)
    if (searchTerms.length > 2) {
      strategies.push(searchTerms.slice(0, 3).join(' '))
    }
    
    // Strategy 3: Individual significant terms
    for (const term of searchTerms) {
      if (term.length > 4) { // Only significant terms
        strategies.push(term)
      }
    }
    
    return strategies
  }

  // Query UN Comtrade API
  async queryComtrade(searchTerm, reporterCode) {
    const params = new URLSearchParams({
      typeCode: 'C', // Commodities
      freqCode: 'A', // Annual
      clCode: 'HS', // Harmonized System
      period: '2023', // Latest available year
      reporterCode: reporterCode,
      cmdCode: 'TOTAL', // All commodities
      flowCode: 'X', // Exports
      partnerCode: 'all',
      partner2Code: '',
      customsCode: '',
      motCode: '',
      maxRecords: 50,
      format: 'json',
      aggregateBy: 'none',
      breakdownMode: 'classic',
      includeDesc: true
    })

    const url = `${this.baseURL}?${params.toString()}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Comtrade API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Filter results by search term
    return this.filterComtradeResults(data.data || [], searchTerm)
  }

  // Filter Comtrade results by relevance to search term
  filterComtradeResults(results, searchTerm) {
    const searchWords = searchTerm.toLowerCase().split(' ')
    
    return results
      .filter(item => {
        const desc = (item.cmdDesc || '').toLowerCase()
        return searchWords.some(word => desc.includes(word))
      })
      .map(item => ({
        code: item.cmdCode,
        description: item.cmdDesc,
        tradeValue: item.primaryValue || 0,
        confidence: this.calculateConfidence(item.cmdDesc, searchTerm, item.primaryValue)
      }))
  }

  // Calculate confidence score based on description match and trade volume
  calculateConfidence(hsDescription, searchTerm, tradeValue = 0) {
    const searchWords = searchTerm.toLowerCase().split(' ')
    const hsDesc = hsDescription.toLowerCase()
    
    // Text matching score (0-70)
    let textScore = 0
    let matchedWords = 0
    
    for (const word of searchWords) {
      if (hsDesc.includes(word)) {
        matchedWords++
        // Bonus for exact word matches
        if (hsDesc.includes(` ${word} `) || hsDesc.startsWith(word) || hsDesc.endsWith(word)) {
          textScore += 15
        } else {
          textScore += 10
        }
      }
    }
    
    // Penalize if few words matched
    if (searchWords.length > 0) {
      textScore *= (matchedWords / searchWords.length)
    }
    
    // Trade volume bonus (0-30)
    let volumeScore = 0
    if (tradeValue > 1000000000) volumeScore = 30      // >$1B
    else if (tradeValue > 100000000) volumeScore = 25  // >$100M
    else if (tradeValue > 10000000) volumeScore = 20   // >$10M
    else if (tradeValue > 1000000) volumeScore = 15    // >$1M
    else if (tradeValue > 0) volumeScore = 10          // Has trade data
    
    return Math.min(100, Math.round(textScore + volumeScore))
  }

  // Rank and deduplicate HS results
  rankHSResults(results, originalQuery) {
    // Remove duplicates by HS code
    const unique = new Map()
    
    for (const result of results) {
      const existing = unique.get(result.code)
      if (!existing || result.confidence > existing.confidence) {
        unique.set(result.code, result)
      }
    }
    
    // Sort by confidence and return top results
    return Array.from(unique.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
  }

  // Smart database fallback when API fails
  async getDatabaseFallback(productDescription, apiError) {
    try {
      // Use the dynamic product classifier to query real database
      const { UnifiedHSClassifier } = await import('./unified-hs-classifier.js')
      const productClassifier = new UnifiedHSClassifier()
      const databaseResult = await productClassifier.classifyProduct(productDescription, 'Manufacturing')
      
      if (databaseResult.suggestions && databaseResult.suggestions.length > 0) {
        return databaseResult.suggestions.map(suggestion => ({
          ...suggestion,
          confidence: Math.max(60, suggestion.confidence - 5), // Slightly reduce confidence for fallback
          source: 'database_fallback',
          note: 'API unavailable, using database intelligence'
        }))
      }
    } catch (dbError) {
      console.error('Database fallback failed:', dbError)
    }
    
    // Final fallback: Return service unavailable message
    return [{
      code: 'SERVICE_UNAVAILABLE',
      description: 'HS code service temporarily unavailable',
      confidence: 0,
      source: 'service_error',
      userAlert: 'Both API and database services are offline. Please try again later.',
      originalError: apiError?.message || 'Unknown API error'
    }]
  }

  // 🚀 DYNAMIC FALLBACK - Zero hardcoding, uses truly dynamic classifier
  getFallbackResults(productDescription) {
    // Import dynamic classifier
    const { UnifiedHSClassifier } = require('./unified-hs-classifier.js')
    const trulyDynamicClassifier = new UnifiedHSClassifier()
    
    // Use dynamic classification instead of hardcoded mappings
    const classifications = trulyDynamicClassifier.classifyProduct(productDescription || 'general product')
    
    return classifications.map(classification => ({
      code: classification.code,
      description: classification.description,
      confidence: Math.max(50, classification.confidence - 15), // Reduce confidence for fallback
      source: 'dynamic_fallback'
    }))
  }

  // Get business type specific suggestions
  getBusinessTypeSuggestions(businessType, productDescription) {
    const suggestions = {
      'Electronics': async () => await this.searchHSCodes(productDescription + ' electronic'),
      'Textiles': async () => await this.searchHSCodes(productDescription + ' textile fabric'),
      'Automotive': async () => await this.searchHSCodes(productDescription + ' motor vehicle'),
      'Manufacturing': async () => await this.searchHSCodes(productDescription + ' industrial')
    }
    
    return suggestions[businessType] ? suggestions[businessType]() : this.searchHSCodes(productDescription)
  }
}

// Export singleton instance
const comtradeAPI = new ComtradeAPI()
export default comtradeAPI

// Helper functions for component use
export async function searchProductHSCodes(productDescription, businessType = null) {
  try {
    if (businessType) {
      return await comtradeAPI.getBusinessTypeSuggestions(businessType, productDescription)
    }
    return await comtradeAPI.searchHSCodes(productDescription)
  } catch (error) {
    console.error('HS code search failed:', error)
    return comtradeAPI.getFallbackResults(productDescription)
  }
}

export function clearComtradeCache() {
  comtradeAPI.cache.clear()
}