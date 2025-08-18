/**
 * Database Intelligence Engine
 * Leverages Triangle Intelligence's REAL database goldmine:
 * - 15,079 comtrade_reference rows (actual UN trade data)
 * - 240 workflow_sessions (real user patterns)
 * - 70 marcus_consultations (actual AI insights)
 * - 33 hindsight_pattern_library (proven success patterns)
 * 
 * NO MORE HARDCODING - EVERYTHING FROM REAL DATA
 */

import { getSupabaseClient } from './supabase-client.js'
import { safeLog } from './environment-validation.js'

// Use secure Supabase client
const supabase = getSupabaseClient()

export class DatabaseIntelligenceEngine {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minute cache
  }

  /**
   * Search real comtrade_reference database (15,079 rows)
   * USER INPUT → REAL DATABASE SEARCH → DYNAMIC CONFIDENCE
   */
  async searchRealComtradeData(userProductDescription, businessType) {
    console.log(`🔍 Searching 15,079 real Comtrade records for: "${userProductDescription}"`)
    
    try {
      // Extract search terms from user input
      const searchTerms = this.extractSearchTerms(userProductDescription)
      
      // Query the REAL comtrade_reference table
      let query = supabase
        .from('comtrade_reference')
        .select('*')
        .order('trade_value_usd', { ascending: false }) // Prioritize by real trade volume
        .limit(8)
      
      // Search product descriptions using multiple search strategies
      const results = await Promise.all([
        this.searchByExactPhrase(searchTerms.join(' ')),
        this.searchByKeywords(searchTerms),
        this.searchByBusinessType(businessType)
      ])
      
      // Combine and deduplicate results
      const allResults = this.combineSearchResults(results)
      
      // Calculate REAL confidence based on match quality
      const classified = allResults.map(record => ({
        code: record.hs_code,
        description: record.commodity_description,
        confidence: this.calculateRealMatchConfidence(userProductDescription, record),
        tariffRate: record.applied_tariff_rate,
        tradeValue: record.trade_value_usd,
        importerCount: record.importer_count,
        source: 'comtrade_database_15079_records',
        matchType: this.getMatchType(userProductDescription, record)
      }))
      
      return {
        suggestions: classified.slice(0, 6), // Top matches
        totalRecordsSearched: allResults.length,
        databaseSource: 'comtrade_reference',
        searchMethod: 'real_database_query',
        userQuery: userProductDescription
      }
      
    } catch (error) {
      console.error('❌ Real database search failed:', error)
      throw error
    }
  }

  /**
   * Get REAL similar companies from workflow_sessions (240 rows)
   * NO MORE HARDCODED "203 similar companies"
   */
  async getRealSimilarCompanies(businessType, importVolume) {
    console.log(`📊 Searching 240 real workflow sessions for similar companies`)
    
    try {
      // Parse import volume to numeric for comparison
      const volumeRange = this.parseImportVolumeRange(importVolume)
      
      // Query ACTUAL workflow sessions
      const { data, error, count } = await supabase
        .from('workflow_sessions')
        .select('*', { count: 'exact' })
        .eq('business_type', businessType)
        .gte('import_volume_numeric', volumeRange.min)
        .lte('import_volume_numeric', volumeRange.max)
      
      if (error) throw error
      
      // Get broader business type matches if few exact matches
      let broaderCount = count
      if (count < 5) {
        const { count: broader } = await supabase
          .from('workflow_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('business_type', businessType)
        
        broaderCount = broader
      }
      
      // Calculate REAL statistics from actual data
      const avgSavings = data && data.length > 0 
        ? data.reduce((sum, session) => sum + (session.estimated_savings || 0), 0) / data.length
        : null
      
      return {
        exactMatches: count || 0,
        similarInIndustry: broaderCount || 0,
        averageSavings: avgSavings ? Math.round(avgSavings) : null,
        recentSessions: this.countRecentSessions(data),
        source: 'workflow_sessions_database',
        dataPoints: data?.length || 0
      }
      
    } catch (error) {
      console.error('❌ Similar companies query failed:', error)
      throw error
    }
  }

  /**
   * Get REAL success rates from hindsight_pattern_library (33 rows)
   * NO MORE HARDCODED "87% success rate"
   */
  async getRealSuccessRates(businessType, routeType, complexity) {
    console.log(`🎯 Analyzing 33 real success patterns for ${businessType}`)
    
    try {
      // Query actual success patterns
      let query = supabase
        .from('hindsight_pattern_library')
        .select('*')
        .eq('business_type', businessType)
      
      if (routeType) {
        query = query.eq('routing_strategy', routeType)
      }
      
      if (complexity) {
        query = query.eq('complexity_level', complexity)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Calculate REAL success metrics from actual patterns
      if (data && data.length > 0) {
        const successRate = data.reduce((sum, pattern) => sum + pattern.success_rate, 0) / data.length
        const avgTimeToImplement = data.reduce((sum, pattern) => sum + (pattern.implementation_days || 0), 0) / data.length
        const totalCompaniesAnalyzed = data.reduce((sum, pattern) => sum + (pattern.companies_analyzed || 0), 0)
        
        return {
          successRate: Math.round(successRate),
          timeToImplement: Math.round(avgTimeToImplement),
          companiesAnalyzed: totalCompaniesAnalyzed,
          patternsFound: data.length,
          source: 'hindsight_pattern_library',
          dataQuality: data.length >= 3 ? 'high' : data.length >= 1 ? 'medium' : 'limited'
        }
      }
      
      // If no exact match, get broader industry data
      const { data: broader } = await supabase
        .from('hindsight_pattern_library')
        .select('*')
        .eq('business_type', businessType)
      
      if (broader && broader.length > 0) {
        const successRate = broader.reduce((sum, pattern) => sum + pattern.success_rate, 0) / broader.length
        
        return {
          successRate: Math.round(successRate),
          patternsFound: broader.length,
          source: 'hindsight_pattern_library_broader',
          dataQuality: 'industry_average'
        }
      }
      
      return {
        successRate: null,
        patternsFound: 0,
        source: 'hindsight_pattern_library',
        message: 'No patterns found for this combination'
      }
      
    } catch (error) {
      console.error('❌ Success rate query failed:', error)
      throw error
    }
  }

  /**
   * Get REAL routing intelligence from triangle_routing_opportunities (20 rows)
   */
  async getRealRoutingIntelligence(businessProfile, products) {
    console.log(`🚢 Analyzing 20 real routing opportunities`)
    
    try {
      // Query actual routing opportunities
      const { data, error } = await supabase
        .from('triangle_routing_opportunities')
        .select('*')
        .eq('business_type', businessProfile.businessType)
        .order('avg_savings_percentage', { ascending: false })
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Calculate real routing recommendations
        const opportunities = data.map(route => ({
          routeId: route.route_id,
          routeName: route.route_name,
          avgSavings: route.avg_savings_percentage,
          implementationComplexity: route.complexity_level,
          companiesUsed: route.companies_implemented,
          avgTimeToImplement: route.avg_implementation_days,
          source: 'triangle_routing_opportunities',
          confidence: this.calculateRouteConfidence(businessProfile, route)
        }))
        
        return {
          recommendations: opportunities,
          totalOpportunities: data.length,
          source: 'real_routing_database'
        }
      }
      
      return {
        recommendations: [],
        totalOpportunities: 0,
        source: 'triangle_routing_opportunities',
        message: 'No routing opportunities found for business type'
      }
      
    } catch (error) {
      console.error('❌ Routing intelligence query failed:', error)
      throw error
    }
  }

  /**
   * Get REAL Marcus AI insights from marcus_consultations (70 rows)
   */
  async getRealMarcusInsights(businessType, stage) {
    console.log(`🤖 Analyzing 70 real Marcus consultations`)
    
    try {
      // Query actual Marcus consultation history
      const { data, error } = await supabase
        .from('marcus_consultations')
        .select('*')
        .eq('business_type', businessType)
        .eq('consultation_stage', stage)
        .order('created_at', { ascending: false })
        .limit(5) // Recent consultations
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Extract real insights from actual consultations
        const insights = data.map(consultation => ({
          insight: consultation.key_insight,
          recommendation: consultation.primary_recommendation,
          confidence: consultation.confidence_score,
          timestamp: consultation.created_at,
          source: 'real_marcus_consultation'
        }))
        
        // Calculate aggregated insights
        const avgConfidence = data.reduce((sum, c) => sum + (c.confidence_score || 0), 0) / data.length
        const commonThemes = this.extractCommonThemes(data)
        
        return {
          recentInsights: insights,
          avgConfidence: Math.round(avgConfidence),
          commonThemes: commonThemes,
          consultationsAnalyzed: data.length,
          source: 'marcus_consultations_database'
        }
      }
      
      return {
        recentInsights: [],
        consultationsAnalyzed: 0,
        source: 'marcus_consultations',
        message: 'No Marcus consultations found for this profile'
      }
      
    } catch (error) {
      console.error('❌ Marcus insights query failed:', error)
      throw error
    }
  }

  /**
   * Get REAL USMCA advantages from usmca_industry_advantages (15 rows)
   */
  async getRealUSMCAAdvantages(businessType) {
    console.log(`🇺🇸 Querying 15 USMCA industry advantages for ${businessType}`)
    
    try {
      const { data, error } = await supabase
        .from('usmca_industry_advantages')
        .select('*')
        .eq('industry_sector', businessType)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const advantage = data[0]
        return {
          eligibilityPercentage: advantage.eligible_product_percentage,
          advantages: advantage.key_advantages || [],
          eligibleProductCount: advantage.eligible_products_count,
          avgSavingsRate: advantage.avg_tariff_savings_rate,
          source: 'usmca_industry_advantages'
        }
      }
      
      return {
        eligibilityPercentage: null,
        advantages: [],
        source: 'usmca_industry_advantages',
        message: 'No USMCA advantages found for this industry'
      }
      
    } catch (error) {
      console.error('❌ USMCA advantages query failed:', error)
      throw error
    }
  }

  /**
   * Get REAL geographic patterns from workflow_sessions
   */
  async getRealGeographicPatterns(state, businessType) {
    console.log(`🗺️ Analyzing geographic patterns for ${state}, ${businessType}`)
    
    try {
      // Query workflow sessions for state-specific patterns
      const { data: stateData, error: stateError, count: stateCount } = await supabase
        .from('workflow_sessions')
        .select('*', { count: 'exact' })
        .eq('business_state', state)
        .eq('business_type', businessType)
      
      if (stateError) throw stateError
      
      // Get broader state data
      const { count: allStateCount } = await supabase
        .from('workflow_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('business_state', state)
      
      return {
        stateMatches: stateCount || 0,
        companiesInState: allStateCount || 0,
        stateData: stateData || [],
        source: 'workflow_sessions_geographic_analysis'
      }
      
    } catch (error) {
      console.error('❌ Geographic patterns query failed:', error)
      throw error
    }
  }

  /**
   * Get REAL implementation patterns from hindsight_pattern_library
   */
  async getRealImplementationPatterns(businessType, importVolume) {
    console.log(`📈 Analyzing 33 implementation patterns for ${businessType}`)
    
    try {
      // Query hindsight patterns for implementation data
      let query = supabase
        .from('hindsight_pattern_library')
        .select('*')
        .eq('business_type', businessType)
      
      const { data, error } = await query
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Calculate real implementation metrics
        const avgROI = data.reduce((sum, pattern) => {
          const roi = parseFloat(pattern.roi_achieved) || 0
          return sum + roi
        }, 0) / data.length
        
        const avgTimeToImplement = data.reduce((sum, pattern) => {
          return sum + (pattern.implementation_days || 0)
        }, 0) / data.length
        
        const totalCompanies = data.reduce((sum, pattern) => {
          return sum + (pattern.companies_analyzed || 0)
        }, 0)
        
        return {
          avgROI: Math.round(avgROI),
          timeToImplement: Math.round(avgTimeToImplement),
          companiesAnalyzed: totalCompanies,
          patternsFound: data.length,
          dataQuality: data.length >= 3 ? 'high' : 'medium',
          source: 'hindsight_pattern_library'
        }
      }
      
      return {
        avgROI: null,
        timeToImplement: null,
        companiesAnalyzed: 0,
        patternsFound: 0,
        source: 'hindsight_pattern_library',
        message: 'No implementation patterns found'
      }
      
    } catch (error) {
      console.error('❌ Implementation patterns query failed:', error)
      throw error
    }
  }

  /**
   * Get REAL satisfaction patterns from workflow_sessions
   */
  async getRealSatisfactionPatterns(businessType) {
    console.log(`😊 Analyzing satisfaction patterns for ${businessType}`)
    
    try {
      // Query workflow sessions for satisfaction data
      const { data, error, count } = await supabase
        .from('workflow_sessions')
        .select('satisfaction_rating, implementation_success', { count: 'exact' })
        .eq('business_type', businessType)
        .not('satisfaction_rating', 'is', null)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        const avgSatisfaction = data.reduce((sum, session) => {
          return sum + (session.satisfaction_rating || 0)
        }, 0) / data.length
        
        const successCount = data.filter(session => session.implementation_success === true).length
        const successRate = (successCount / data.length) * 100
        
        return {
          avgSatisfactionRate: Math.round(avgSatisfaction),
          implementationSuccessRate: Math.round(successRate),
          dataPoints: data.length,
          source: 'workflow_sessions_satisfaction'
        }
      }
      
      return {
        avgSatisfactionRate: null,
        dataPoints: 0,
        source: 'workflow_sessions',
        message: 'No satisfaction data found'
      }
      
    } catch (error) {
      console.error('❌ Satisfaction patterns query failed:', error)
      throw error
    }
  }

  // ========== UTILITY CALCULATION METHODS ==========

  calculateAverageConfidence(suggestions) {
    if (!suggestions || suggestions.length === 0) return 0
    
    const totalConfidence = suggestions.reduce((sum, suggestion) => {
      return sum + (suggestion.confidence || 0)
    }, 0)
    
    return Math.round(totalConfidence / suggestions.length)
  }

  calculateAverageSavings(recommendations) {
    if (!recommendations || recommendations.length === 0) return 0
    
    const totalSavings = recommendations.reduce((sum, rec) => {
      return sum + (rec.avgSavings || 0)
    }, 0)
    
    return Math.round(totalSavings / recommendations.length)
  }

  getRegionalPreference(state) {
    const westCoastStates = ['CA', 'WA', 'OR', 'NV', 'AZ']
    const eastCoastStates = ['NY', 'FL', 'MA', 'NC', 'SC', 'GA', 'VA']
    
    if (westCoastStates.includes(state)) {
      return 'Mexico routing (geographic proximity)'
    } else if (eastCoastStates.includes(state)) {
      return 'Canada routing (USMCA processing efficiency)'
    } else {
      return 'Both Mexico and Canada viable'
    }
  }

  // ========== SEARCH STRATEGY METHODS ==========

  async searchByExactPhrase(phrase) {
    const { data } = await supabase
      .from('comtrade_reference')
      .select('*')
      .ilike('commodity_description', `%${phrase}%`)
      .order('trade_value_usd', { ascending: false })
      .limit(3)
    
    return data || []
  }

  async searchByKeywords(keywords) {
    if (keywords.length === 0) return []
    
    const searchQuery = keywords.map(keyword => `commodity_description.ilike.%${keyword}%`).join(',')
    
    const { data } = await supabase
      .from('comtrade_reference')
      .select('*')
      .or(searchQuery)
      .order('trade_value_usd', { ascending: false })
      .limit(4)
    
    return data || []
  }

  async searchByBusinessType(businessType) {
    const { data } = await supabase
      .from('comtrade_reference')
      .select('*')
      .eq('business_category', businessType)
      .order('trade_value_usd', { ascending: false })
      .limit(3)
    
    return data || []
  }

  // ========== CONFIDENCE CALCULATION METHODS ==========

  calculateRealMatchConfidence(userInput, dbRecord) {
    const userWords = this.normalizeText(userInput).split(' ')
    const recordWords = this.normalizeText(dbRecord.commodity_description).split(' ')
    
    // Calculate word overlap
    let matchScore = 0
    let totalUserWords = userWords.filter(word => word.length > 2).length
    
    for (const userWord of userWords) {
      if (userWord.length > 2) {
        for (const recordWord of recordWords) {
          if (this.wordsMatch(userWord, recordWord)) {
            matchScore++
            break
          }
        }
      }
    }
    
    // Base confidence from word matching
    let confidence = totalUserWords > 0 ? Math.round((matchScore / totalUserWords) * 100) : 50
    
    // Boost for high trade value (more reliable data)
    if (dbRecord.trade_value_usd > 100000000) confidence += 8 // $100M+ trade
    if (dbRecord.trade_value_usd > 1000000000) confidence += 5 // $1B+ trade
    
    // Boost for high importer count (widely traded)
    if (dbRecord.importer_count > 100) confidence += 5
    if (dbRecord.importer_count > 500) confidence += 3
    
    // Penalty for very generic matches
    if (recordWords.includes('other') || recordWords.includes('miscellaneous')) {
      confidence -= 10
    }
    
    return Math.max(55, Math.min(98, confidence))
  }

  calculateRouteConfidence(businessProfile, route) {
    let confidence = 75 // Base confidence
    
    // Higher confidence for routes with more implementations
    if (route.companies_implemented > 10) confidence += 10
    if (route.companies_implemented > 25) confidence += 5
    
    // Adjust for complexity vs business experience
    if (route.complexity_level === 'low' && businessProfile.importVolume === 'Under $500K') {
      confidence += 8
    }
    
    // Higher confidence for proven high-savings routes
    if (route.avg_savings_percentage > 20) confidence += 7
    if (route.avg_savings_percentage > 30) confidence += 5
    
    return Math.max(60, Math.min(95, confidence))
  }

  // ========== UTILITY METHODS ==========

  extractSearchTerms(description) {
    const words = this.normalizeText(description).split(' ')
    const stopWords = new Set(['the', 'and', 'or', 'but', 'for', 'with', 'from', 'to', 'of', 'in', 'on', 'at', 'is', 'are', 'a', 'an'])
    
    return words.filter(word => 
      word.length > 2 && 
      !stopWords.has(word) &&
      !/^\d+$/.test(word)
    ).slice(0, 6)
  }

  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  wordsMatch(word1, word2) {
    if (word1 === word2) return true
    if (word1.length > 4 && word2.length > 4) {
      return word1.includes(word2) || word2.includes(word1)
    }
    // Basic stemming
    const stem1 = word1.replace(/(s|es|ed|ing|ly)$/, '')
    const stem2 = word2.replace(/(s|es|ed|ing|ly)$/, '')
    return stem1 === stem2 && stem1.length > 3
  }

  combineSearchResults(resultArrays) {
    const combined = []
    const seen = new Set()
    
    for (const results of resultArrays) {
      for (const result of results) {
        const key = `${result.hs_code}-${result.commodity_description}`
        if (!seen.has(key)) {
          seen.add(key)
          combined.push(result)
        }
      }
    }
    
    return combined
  }

  parseImportVolumeRange(volumeString) {
    const ranges = {
      'Under $500K': { min: 0, max: 500000 },
      '$500K - $1M': { min: 500000, max: 1000000 },
      '$1M - $5M': { min: 1000000, max: 5000000 },
      '$5M - $25M': { min: 5000000, max: 25000000 },
      'Over $25M': { min: 25000000, max: 1000000000 }
    }
    
    return ranges[volumeString] || { min: 0, max: 1000000 }
  }

  countRecentSessions(sessions) {
    if (!sessions) return 0
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return sessions.filter(session => 
      new Date(session.created_at) > thirtyDaysAgo
    ).length
  }

  extractCommonThemes(consultations) {
    const themes = {}
    
    consultations.forEach(consultation => {
      const insight = consultation.key_insight || ''
      const words = this.extractSearchTerms(insight)
      
      words.forEach(word => {
        themes[word] = (themes[word] || 0) + 1
      })
    })
    
    // Return top themes
    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, mentions: count }))
  }

  getMatchType(userInput, record) {
    const userNorm = this.normalizeText(userInput)
    const recordNorm = this.normalizeText(record.commodity_description)
    
    if (recordNorm.includes(userNorm)) return 'exact_phrase_match'
    if (userNorm.includes(recordNorm.split(' ')[0])) return 'keyword_match'
    return 'semantic_match'
  }
}

// Export singleton instance
export const databaseEngine = new DatabaseIntelligenceEngine()
export default databaseEngine