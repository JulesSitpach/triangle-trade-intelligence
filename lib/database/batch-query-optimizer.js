/**
 * Triangle Intelligence Platform - Batch Query Optimizer
 * Eliminates N+1 query patterns and optimizes database operations
 */

import { getSupabaseClient } from '../supabase-client.js'
import { logInfo, logError, logWarn, logPerformance, logDBQuery } from '../utils/production-logger.js'

export class BatchQueryOptimizer {
  
  // Environment-based configuration for performance optimization
  static config = {
    batchSize: parseInt(process.env.DB_QUERY_BATCH_SIZE) || 50,
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT_MS) || 5000,
    maxParallelQueries: parseInt(process.env.DB_CONNECTION_POOL_SIZE) || 10,
    cacheEnabled: process.env.NEXT_PUBLIC_USE_QUERY_CACHING === 'true',
    cacheTTL: parseInt(process.env.CACHE_TTL_STABLE_DATA) * 1000 || 86400000 // 24 hours
  }
  
  static queryCache = new Map()
  static lastCacheCleanup = 0
  
  /**
   * Batch multiple similar queries into a single optimized query - ENHANCED
   */
  static async batchQueries(queries, options = {}) {
    const startTime = Date.now()
    const { 
      batchSize = this.config.batchSize, 
      parallel = true,
      useCache = this.config.cacheEnabled,
      timeout = this.config.queryTimeout
    } = options
    
    if (!Array.isArray(queries) || queries.length === 0) {
      return []
    }
    
    try {
      const supabase = getSupabaseClient()
      let results = []
      
      if (parallel && queries.length <= Math.min(batchSize, this.config.maxParallelQueries)) {
        // Execute all queries in parallel (best for small batches)
        logInfo(`Executing ${queries.length} queries in parallel with timeout ${timeout}ms`)
        
        // Add timeout protection for all queries
        const queryPromises = queries.map(query => 
          Promise.race([
            this.executeQuery(query, useCache),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout)
            )
          ])
        )
        
        results = await Promise.allSettled(queryPromises)
        results = results.map(result => 
          result.status === 'fulfilled' ? result.value : { success: false, error: result.reason, data: null }
        )
      } else {
        // Execute in batches to avoid overwhelming the database
        logInfo(`Executing ${queries.length} queries in batches of ${batchSize}`)
        
        for (let i = 0; i < queries.length; i += batchSize) {
          const batch = queries.slice(i, i + batchSize)
          
          // Add timeout protection for batch queries
          const batchPromises = batch.map(query => 
            Promise.race([
              this.executeQuery(query, useCache),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Batch query timeout after ${timeout}ms`)), timeout)
              )
            ])
          )
          
          const batchResults = await Promise.allSettled(batchPromises)
          const processedResults = batchResults.map(result => 
            result.status === 'fulfilled' ? result.value : { success: false, error: result.reason, data: null }
          )
          
          results.push(...processedResults)
          
          // Small delay between batches to prevent overwhelming the database
          if (i + batchSize < queries.length) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        }
      }
      
      const duration = Date.now() - startTime
      logPerformance('batch_queries', duration, {
        queryCount: queries.length,
        batchSize,
        parallel,
        successCount: results.filter(r => r.success).length
      })
      
      return results
      
    } catch (error) {
      logError('Batch query execution failed', { error: error.message, queryCount: queries.length })
      throw error
    }
  }
  
  /**
   * Execute a single query with error handling and caching
   */
  static async executeQuery(query, useCache = true) {
    const startTime = Date.now()
    
    // Generate cache key if caching is enabled
    let cacheKey = null
    if (useCache && this.config.cacheEnabled) {
      cacheKey = this.generateQueryCacheKey(query)
      const cached = this.getFromQueryCache(cacheKey)
      if (cached) {
        logInfo('Query cache hit', { cacheKey })
        return cached
      }
    }
    
    try {
      const supabase = getSupabaseClient()
      const { data, error, count } = await query(supabase)
      
      if (error) {
        logError('Query execution failed', { error: error.message })
        return { success: false, error, data: null }
      }
      
      const duration = Date.now() - startTime
      logDBQuery('batch_query', 'SELECT', duration, Array.isArray(data) ? data.length : 1)
      
      const result = { success: true, data, count }
      
      // Cache successful results if caching is enabled
      if (useCache && this.config.cacheEnabled && cacheKey) {
        this.setQueryCache(cacheKey, result)
      }
      
      return result
      
    } catch (error) {
      logError('Query execution error', { error: error.message })
      return { success: false, error, data: null }
    }
  }
  
  /**
   * Optimize workflow session queries (common N+1 pattern)
   */
  static async getWorkflowSessionsByBusinessTypes(businessTypes) {
    const startTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      
      // Instead of N queries, use a single query with IN clause
      const { data, error } = await supabase
        .from('workflow_sessions')
        .select(`
          id,
          user_id,
          session_id,
          data,
          state,
          created_at
        `)
        .in('data->>stage_1->>input->>businessType', businessTypes)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Group results by business type for easy access
      const groupedResults = {}
      businessTypes.forEach(type => {
        groupedResults[type] = data.filter(session => 
          session.data?.stage_1?.input?.businessType === type
        )
      })
      
      const duration = Date.now() - startTime
      logPerformance('workflow_sessions_batch', duration, {
        businessTypes: businessTypes.length,
        sessionsFound: data.length
      })
      
      return groupedResults
      
    } catch (error) {
      logError('Workflow sessions batch query failed', { error: error.message, businessTypes })
      throw error
    }
  }
  
  /**
   * Optimize trade flows queries (critical for 500K+ records)
   */
  static async getTradeFlowsBatch(params) {
    const startTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      const { countries, hsCodes, limit = 1000 } = params
      
      let query = supabase
        .from('trade_flows')
        .select(`
          id,
          reporter_country,
          partner_country,
          hs_code,
          product_category,
          trade_value,
          trade_flow,
          period,
          confidence_level,
          savings_potential
        `)
        .limit(limit)
        .order('trade_value', { ascending: false })
      
      // Apply filters efficiently
      if (countries && countries.length > 0) {
        query = query.or(`reporter_country.in.(${countries.join(',')}),partner_country.in.(${countries.join(',')})`)
      }
      
      if (hsCodes && hsCodes.length > 0) {
        query = query.in('hs_code', hsCodes)
      }
      
      const { data, error } = await query
      
      if (error) {
        throw new Error(error.message)
      }
      
      const duration = Date.now() - startTime
      logPerformance('trade_flows_batch', duration, {
        countries: countries?.length || 0,
        hsCodes: hsCodes?.length || 0,
        recordsFound: data.length
      })
      
      return data
      
    } catch (error) {
      logError('Trade flows batch query failed', { error: error.message, params })
      throw error
    }
  }
  
  /**
   * Optimize comtrade reference lookups
   */
  static async getComtradeReferenceBatch(hsCodes) {
    const startTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      
      // Single query for multiple HS codes
      const { data, error } = await supabase
        .from('comtrade_reference')
        .select(`
          hs_code,
          product_description,
          product_category,
          usmca_eligible,
          usmca_tariff_rate,
          triangle_routing_success_rate,
          potential_annual_savings
        `)
        .in('hs_code', hsCodes)
        .order('triangle_routing_success_rate', { ascending: false, nullsFirst: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Create lookup map for O(1) access
      const lookupMap = {}
      data.forEach(item => {
        lookupMap[item.hs_code] = item
      })
      
      const duration = Date.now() - startTime
      logPerformance('comtrade_batch', duration, {
        hsCodesRequested: hsCodes.length,
        recordsFound: data.length
      })
      
      return { data, lookupMap }
      
    } catch (error) {
      logError('Comtrade reference batch query failed', { error: error.message, hsCodes })
      throw error
    }
  }
  
  /**
   * Optimize multiple table statistics in single operation
   */
  static async getTableStatsBatch(tables) {
    const startTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      
      // Execute all count queries in parallel
      const queries = tables.map(table => 
        supabase.from(table).select('*', { count: 'exact', head: true })
      )
      
      const results = await Promise.all(queries)
      
      const stats = {}
      tables.forEach((table, index) => {
        const result = results[index]
        stats[table] = {
          count: result.count,
          error: result.error?.message || null,
          status: result.error ? 'error' : 'success'
        }
      })
      
      const duration = Date.now() - startTime
      logPerformance('table_stats_batch', duration, {
        tables: tables.length,
        successfulQueries: Object.values(stats).filter(s => s.status === 'success').length
      })
      
      return stats
      
    } catch (error) {
      logError('Table stats batch query failed', { error: error.message, tables })
      throw error
    }
  }
  
  /**
   * Optimize similarity matching queries
   */
  static async getSimilarityMatchesBatch(businessProfiles) {
    const startTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      
      // Extract unique business types and volumes for efficient querying
      const businessTypes = [...new Set(businessProfiles.map(p => p.businessType))]
      const importVolumes = [...new Set(businessProfiles.map(p => p.importVolume))]
      
      // Single query to get all potentially similar sessions
      const { data, error } = await supabase
        .from('workflow_sessions')
        .select(`
          id,
          user_id,
          data,
          state,
          created_at
        `)
        .in('data->>stage_1->>input->>businessType', businessTypes)
        .not('state->>stage_completed', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500)
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Calculate similarity scores for each profile
      const matches = businessProfiles.map(profile => {
        const similarSessions = data.filter(session => {
          const sessionData = session.data?.stage_1?.input
          if (!sessionData) return false
          
          let similarityScore = 0
          
          // Business type match (highest weight)
          if (sessionData.businessType === profile.businessType) {
            similarityScore += 40
          }
          
          // Import volume match
          if (sessionData.importVolume === profile.importVolume) {
            similarityScore += 25
          }
          
          // Revenue bracket similarity
          if (sessionData.annualRevenue && profile.annualRevenue) {
            if (sessionData.annualRevenue === profile.annualRevenue) {
              similarityScore += 15
            }
          }
          
          // Geographic similarity
          if (sessionData.businessLocation && profile.businessLocation) {
            if (sessionData.businessLocation === profile.businessLocation) {
              similarityScore += 10
            }
          }
          
          // Experience level similarity
          if (sessionData.importExperience && profile.importExperience) {
            if (sessionData.importExperience === profile.importExperience) {
              similarityScore += 10
            }
          }
          
          return similarityScore >= 50 // Minimum 50% similarity
        })
        .map(session => ({
          ...session,
          similarityScore: this.calculateDetailedSimilarity(session.data?.stage_1?.input, profile)
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 10) // Top 10 matches
        
        return {
          profile,
          matches: similarSessions,
          matchCount: similarSessions.length,
          avgSimilarity: similarSessions.reduce((sum, s) => sum + s.similarityScore, 0) / (similarSessions.length || 1)
        }
      })
      
      const duration = Date.now() - startTime
      logPerformance('similarity_batch', duration, {
        profilesProcessed: businessProfiles.length,
        sessionsAnalyzed: data.length,
        totalMatches: matches.reduce((sum, m) => sum + m.matchCount, 0)
      })
      
      return matches
      
    } catch (error) {
      logError('Similarity matching batch query failed', { error: error.message })
      throw error
    }
  }
  
  /**
   * Calculate detailed similarity score between two business profiles
   */
  static calculateDetailedSimilarity(sessionProfile, targetProfile) {
    if (!sessionProfile) return 0
    
    let score = 0
    let maxScore = 0
    
    // Business type (critical match)
    maxScore += 40
    if (sessionProfile.businessType === targetProfile.businessType) {
      score += 40
    } else if (this.areRelatedBusinessTypes(sessionProfile.businessType, targetProfile.businessType)) {
      score += 20
    }
    
    // Import volume bracket
    maxScore += 25
    if (sessionProfile.importVolume === targetProfile.importVolume) {
      score += 25
    } else if (this.areAdjacentVolumeBrackets(sessionProfile.importVolume, targetProfile.importVolume)) {
      score += 15
    }
    
    // Annual revenue
    maxScore += 15
    if (sessionProfile.annualRevenue === targetProfile.annualRevenue) {
      score += 15
    } else if (this.areAdjacentRevenueBrackets(sessionProfile.annualRevenue, targetProfile.annualRevenue)) {
      score += 10
    }
    
    // Geographic region
    maxScore += 10
    if (sessionProfile.businessLocation === targetProfile.businessLocation) {
      score += 10
    } else if (this.areSameRegion(sessionProfile.businessLocation, targetProfile.businessLocation)) {
      score += 5
    }
    
    // Experience level
    maxScore += 10
    if (sessionProfile.importExperience === targetProfile.importExperience) {
      score += 10
    } else if (this.areAdjacentExperienceLevels(sessionProfile.importExperience, targetProfile.importExperience)) {
      score += 7
    }
    
    return Math.round((score / maxScore) * 100)
  }
  
  /**
   * CRITICAL OPTIMIZATION: Query cache management methods
   */
  static generateQueryCacheKey(query) {
    // Generate a simple hash of the query function for caching
    const queryStr = query.toString()
    let hash = 0
    for (let i = 0; i < queryStr.length; i++) {
      const char = queryStr.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `query_${Math.abs(hash).toString(36)}`
  }
  
  static getFromQueryCache(cacheKey) {
    this.cleanQueryCacheIfNeeded()
    const cached = this.queryCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
      return cached.data
    }
    if (cached) {
      this.queryCache.delete(cacheKey) // Remove expired cache
    }
    return null
  }
  
  static setQueryCache(cacheKey, data) {
    this.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    
    // Limit cache size to prevent memory issues
    if (this.queryCache.size > 200) {
      const oldestKey = Array.from(this.queryCache.keys())[0]
      this.queryCache.delete(oldestKey)
    }
  }
  
  static cleanQueryCacheIfNeeded() {
    const now = Date.now()
    if (now - this.lastCacheCleanup > 300000) { // Clean every 5 minutes
      let cleaned = 0
      for (const [key, value] of this.queryCache.entries()) {
        if (now - value.timestamp > this.config.cacheTTL) {
          this.queryCache.delete(key)
          cleaned++
        }
      }
      if (cleaned > 0) {
        logInfo('Query cache cleanup', { cleaned, remaining: this.queryCache.size })
      }
      this.lastCacheCleanup = now
    }
  }
  
  /**
   * Helper methods for similarity calculations
   */
  static areRelatedBusinessTypes(type1, type2) {
    const relatedGroups = [
      ['Electronics', 'Technology', 'Consumer Electronics'],
      ['Clothing', 'Textiles', 'Fashion', 'Apparel'],
      ['Food', 'Agriculture', 'Beverages'],
      ['Automotive', 'Machinery', 'Industrial Equipment']
    ]
    
    return relatedGroups.some(group => group.includes(type1) && group.includes(type2))
  }
  
  static areAdjacentVolumeBrackets(volume1, volume2) {
    const brackets = [
      'Under $100K annually',
      '$100K - $500K annually',
      '$500K - $1M annually',
      '$1M - $5M annually',
      '$5M - $10M annually',
      'Over $10M annually'
    ]
    
    const index1 = brackets.indexOf(volume1)
    const index2 = brackets.indexOf(volume2)
    
    return index1 !== -1 && index2 !== -1 && Math.abs(index1 - index2) <= 1
  }
  
  static areAdjacentRevenueBrackets(revenue1, revenue2) {
    const brackets = [
      'Under $1M',
      '$1M - $5M',
      '$5M - $10M',
      '$10M - $50M',
      'Over $50M'
    ]
    
    const index1 = brackets.indexOf(revenue1)
    const index2 = brackets.indexOf(revenue2)
    
    return index1 !== -1 && index2 !== -1 && Math.abs(index1 - index2) <= 1
  }
  
  static areSameRegion(location1, location2) {
    const regions = {
      'North America': ['Canada', 'United States', 'USA', 'US'],
      'Europe': ['Germany', 'France', 'UK', 'United Kingdom', 'Italy', 'Spain'],
      'Asia Pacific': ['China', 'Japan', 'South Korea', 'Australia', 'Singapore']
    }
    
    for (const [region, countries] of Object.entries(regions)) {
      if (countries.includes(location1) && countries.includes(location2)) {
        return true
      }
    }
    
    return false
  }
  
  static areAdjacentExperienceLevels(exp1, exp2) {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert']
    const index1 = levels.indexOf(exp1)
    const index2 = levels.indexOf(exp2)
    
    return index1 !== -1 && index2 !== -1 && Math.abs(index1 - index2) <= 1
  }
  
  /**
   * Create optimized query for dashboard data loading
   */
  static async getDashboardDataBatch(userProfile) {
    const startTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      
      // Execute all dashboard queries in parallel
      const [
        tradeFlowsResult,
        comtradeResult,
        workflowResult,
        hindsightResult,
        alertsResult
      ] = await Promise.all([
        supabase
          .from('trade_flows')
          .select('reporter_country, partner_country, trade_value, hs_code')
          .in('reporter_country', ['China', 'India', 'Vietnam', 'Mexico'])
          .limit(100)
          .order('trade_value', { ascending: false }),
        
        supabase
          .from('comtrade_reference')
          .select('hs_code, product_category, usmca_eligible')
          .eq('product_category', userProfile.businessType || 'Electronics')
          .limit(50),
        
        supabase
          .from('workflow_sessions')
          .select('id, data, state')
          .eq('data->>stage_1->>input->>businessType', userProfile.businessType || 'Electronics')
          .limit(20),
        
        supabase
          .from('hindsight_pattern_library')
          .select('*')
          .eq('business_type', userProfile.businessType || 'Electronics')
          .limit(10),
        
        supabase
          .from('current_market_alerts')
          .select('*')
          .order('alert_date', { ascending: false })
          .limit(5)
      ])
      
      const duration = Date.now() - startTime
      logPerformance('dashboard_data_batch', duration, {
        queriesExecuted: 5,
        tradeFlowsCount: tradeFlowsResult.data?.length || 0,
        comtradeCount: comtradeResult.data?.length || 0
      })
      
      return {
        tradeFlows: tradeFlowsResult.data || [],
        comtradeReference: comtradeResult.data || [],
        workflowSessions: workflowResult.data || [],
        hindsightPatterns: hindsightResult.data || [],
        marketAlerts: alertsResult.data || [],
        errors: [
          tradeFlowsResult.error,
          comtradeResult.error,
          workflowResult.error,
          hindsightResult.error,
          alertsResult.error
        ].filter(Boolean)
      }
      
    } catch (error) {
      logError('Dashboard data batch loading failed', { error: error.message })
      throw error
    }
  }
}

export default BatchQueryOptimizer