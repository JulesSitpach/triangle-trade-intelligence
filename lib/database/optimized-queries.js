/**
 * OPTIMIZED QUERIES - PHASE 2 IMPLEMENTATION
 * High-performance database queries with RPC functions and intelligent caching
 * Reduces 597K+ trade flows query bottlenecks through batch operations
 */

import { getSupabaseClient } from '../supabase-client'
import { logInfo, logError, logPerformance, logDBQuery } from '../utils/production-logger'

const supabase = getSupabaseClient()

/**
 * Performance monitoring for query optimization
 */
class QueryPerformanceTracker {
  constructor() {
    this.metrics = new Map()
    this.slowQueries = new Set()
    this.cache = new Map()
    this.cacheHits = 0
    this.cacheMisses = 0
  }

  recordQuery(queryName, duration, recordCount) {
    const existing = this.metrics.get(queryName) || { 
      count: 0, 
      totalDuration: 0, 
      totalRecords: 0,
      maxDuration: 0,
      minDuration: Infinity
    }
    
    existing.count++
    existing.totalDuration += duration
    existing.totalRecords += recordCount
    existing.maxDuration = Math.max(existing.maxDuration, duration)
    existing.minDuration = Math.min(existing.minDuration, duration)
    existing.averageDuration = existing.totalDuration / existing.count
    
    this.metrics.set(queryName, existing)
    
    // Track slow queries (>2 seconds)
    if (duration > 2000) {
      this.slowQueries.add(`${queryName} (${duration}ms)`)
    }
    
    logDBQuery(queryName, 'SELECT', duration, recordCount)
  }

  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? ((this.cacheHits / total) * 100).toFixed(2) + '%' : '0%'
    }
  }

  getPerformanceReport() {
    return {
      queriesExecuted: Array.from(this.metrics.entries()).map(([name, stats]) => ({
        query: name,
        ...stats
      })),
      slowQueries: Array.from(this.slowQueries),
      cacheStats: this.getCacheStats(),
      totalQueries: Array.from(this.metrics.values()).reduce((sum, stats) => sum + stats.count, 0)
    }
  }
}

const performanceTracker = new QueryPerformanceTracker()

/**
 * Intelligent query cache with TTL and memory management
 */
class OptimizedCache {
  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  set(key, value, ttl = this.defaultTTL) {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    })
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      performanceTracker.cacheMisses++
      return null
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      performanceTracker.cacheMisses++
      return null
    }

    performanceTracker.cacheHits++
    return entry.value
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    const now = Date.now()
    const valid = Array.from(this.cache.values()).filter(entry => now <= entry.expires).length
    return {
      totalEntries: this.cache.size,
      validEntries: valid,
      expiredEntries: this.cache.size - valid,
      memoryUsage: `${(this.cache.size / this.maxSize * 100).toFixed(1)}%`
    }
  }
}

const queryCache = new OptimizedCache()

/**
 * Main optimized queries class
 */
export class OptimizedQueries {
  /**
   * Get complete intelligence using RPC function (replaces multiple API calls)
   */
  static async getCompleteIntelligence(businessType, hsCodes = [], options = {}) {
    const startTime = performance.now()
    
    try {
      const cacheKey = `complete-intelligence-${businessType}-${hsCodes.join(',')}`
      
      // Check cache first
      const cached = queryCache.get(cacheKey)
      if (cached && !options.forceRefresh) {
        logInfo('Complete intelligence served from cache', { businessType, hsCodes: hsCodes.length })
        return cached
      }

      // Execute optimized RPC call
      const { data, error } = await supabase.rpc('get_complete_intelligence', {
        business_type: businessType,
        hs_codes: hsCodes,
        include_patterns: options.includePatterns !== false
      })

      if (error) {
        logError('Complete intelligence RPC failed', error)
        throw error
      }

      const result = {
        tradeFlows: data.trade_flows || [],
        comtradeData: data.comtrade || [],
        patterns: data.patterns || [],
        metadata: {
          businessType,
          hsCodes: hsCodes.length,
          recordCount: (data.trade_flows?.length || 0) + (data.comtrade?.length || 0),
          timestamp: new Date().toISOString()
        }
      }

      // Cache the result
      queryCache.set(cacheKey, result, options.cacheTTL)

      const duration = performance.now() - startTime
      performanceTracker.recordQuery('get_complete_intelligence', duration, result.metadata.recordCount)

      logPerformance('optimized_complete_intelligence', duration, {
        businessType,
        hsCodes: hsCodes.length,
        recordCount: result.metadata.recordCount
      })

      return result

    } catch (error) {
      const duration = performance.now() - startTime
      performanceTracker.recordQuery('get_complete_intelligence_error', duration, 0)
      
      logError('Complete intelligence query failed', { error, businessType, duration })
      throw error
    }
  }

  /**
   * Optimized trade flows query with pagination and filters
   */
  static async getOptimizedTradeFlows(params = {}) {
    const startTime = performance.now()
    
    try {
      const {
        businessType,
        originCountry,
        destinationCountry,
        hsCodePrefix,
        minTradeValue = 0,
        limit = 50,
        offset = 0
      } = params

      const cacheKey = `trade-flows-${JSON.stringify(params)}`
      const cached = queryCache.get(cacheKey)
      if (cached) return cached

      // Use intelligent query optimization
      let query = supabase
        .from('trade_flows')
        .select('*')
        .limit(limit)
        .range(offset, offset + limit - 1)

      // Apply filters conditionally
      if (businessType) {
        query = query.ilike('product_category', `%${businessType}%`)
      }

      if (originCountry) {
        query = query.eq('reporter_country', originCountry)
      }

      if (destinationCountry) {
        query = query.eq('partner_country', destinationCountry)
      }

      if (hsCodePrefix) {
        query = query.like('hs_code', `${hsCodePrefix}%`)
      }

      if (minTradeValue > 0) {
        query = query.gte('trade_value', minTradeValue)
      }

      // Order by most relevant
      query = query.order('trade_value', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      const result = {
        flows: data || [],
        totalCount: count,
        pagination: {
          limit,
          offset,
          hasMore: data?.length === limit
        },
        filters: params
      }

      queryCache.set(cacheKey, result)

      const duration = performance.now() - startTime
      performanceTracker.recordQuery('optimized_trade_flows', duration, data?.length || 0)

      return result

    } catch (error) {
      logError('Optimized trade flows query failed', error)
      throw error
    }
  }

  /**
   * Batch HS code lookup (replaces N+1 queries)
   */
  static async getBatchHSCodeData(hsCodes, options = {}) {
    const startTime = performance.now()
    
    try {
      if (!hsCodes?.length) return []

      const cacheKey = `batch-hs-${hsCodes.sort().join(',')}`
      const cached = queryCache.get(cacheKey)
      if (cached) return cached

      // Single batch query instead of N individual queries
      const { data, error } = await supabase
        .from('comtrade_reference')
        .select('*')
        .in('hs_code', hsCodes)
        .order('hs_code')

      if (error) throw error

      // Also get trade flow statistics for these codes
      const { data: tradeStats } = await supabase
        .from('trade_flows')
        .select('hs_code, trade_value, quantity')
        .in('hs_code', hsCodes)
        .not('trade_value', 'is', null)
        .order('trade_value', { ascending: false })
        .limit(100)

      const result = (data || []).map(hsCode => ({
        ...hsCode,
        tradeStats: (tradeStats || []).filter(stat => stat.hs_code === hsCode.hs_code)
      }))

      queryCache.set(cacheKey, result)

      const duration = performance.now() - startTime
      performanceTracker.recordQuery('batch_hs_code_lookup', duration, result.length)

      return result

    } catch (error) {
      logError('Batch HS code lookup failed', error)
      throw error
    }
  }

  /**
   * Optimized routing intelligence with pre-computed routes
   */
  static async getOptimizedRoutingIntelligence(params) {
    const startTime = performance.now()
    
    try {
      const { origin, destination, businessType, hsCodes, importVolume } = params
      
      const cacheKey = `routing-${origin}-${destination}-${businessType}`
      const cached = queryCache.get(cacheKey)
      if (cached) return cached

      // Execute batch operations in parallel
      const [tradeFlows, usmcaRates, triangleRoutes] = await Promise.all([
        this.getOptimizedTradeFlows({
          businessType,
          originCountry: origin,
          destinationCountry: destination,
          limit: 10
        }),
        
        supabase
          .from('usmca_tariff_rates')
          .select('*')
          .or(`origin_country.eq.${origin},destination_country.eq.${destination}`)
          .limit(10),
          
        supabase
          .from('trade_routes')
          .select('*')
          .or(`origin.eq.${origin},destination.eq.${destination}`)
          .limit(5)
      ])

      const result = {
        tradeFlows: tradeFlows.flows || [],
        usmcaRates: usmcaRates.data || [],
        triangleRoutes: triangleRoutes.data || [],
        analysis: {
          routeCount: triangleRoutes.data?.length || 0,
          avgSavings: this.calculateAverageSavings(usmcaRates.data),
          confidence: this.calculateRoutingConfidence(tradeFlows.flows, usmcaRates.data)
        },
        metadata: {
          origin,
          destination,
          businessType,
          timestamp: new Date().toISOString()
        }
      }

      queryCache.set(cacheKey, result)

      const duration = performance.now() - startTime
      performanceTracker.recordQuery('optimized_routing_intelligence', duration, 
        result.tradeFlows.length + result.usmcaRates.length + result.triangleRoutes.length)

      return result

    } catch (error) {
      logError('Optimized routing intelligence failed', error)
      throw error
    }
  }

  /**
   * Performance and monitoring utilities
   */
  static getPerformanceMetrics() {
    return performanceTracker.getPerformanceReport()
  }

  static getCacheMetrics() {
    return {
      ...queryCache.getStats(),
      ...performanceTracker.getCacheStats()
    }
  }

  static clearCache() {
    queryCache.clear()
    logInfo('Optimized query cache cleared')
  }

  /**
   * Helper calculation methods
   */
  static calculateAverageSavings(usmcaRates) {
    if (!usmcaRates?.length) return 0
    const totalSavings = usmcaRates.reduce((sum, rate) => sum + (rate.traditional_rate - rate.usmca_rate), 0)
    return totalSavings / usmcaRates.length
  }

  static calculateRoutingConfidence(tradeFlows, usmcaRates) {
    const flowsConfidence = Math.min(95, 60 + (tradeFlows?.length || 0) * 5)
    const ratesConfidence = usmcaRates?.length > 0 ? 95 : 70
    return Math.round((flowsConfidence + ratesConfidence) / 2)
  }

  /**
   * Health check for optimized queries
   */
  static async healthCheck() {
    const startTime = performance.now()
    
    try {
      // Test basic connectivity and performance
      const { data, error } = await supabase
        .from('trade_flows')
        .select('count')
        .limit(1)

      const duration = performance.now() - startTime
      
      return {
        status: error ? 'error' : 'healthy',
        latency: duration,
        error: error?.message,
        timestamp: new Date().toISOString(),
        cacheStats: this.getCacheMetrics()
      }
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        latency: performance.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }
  }
}

export default OptimizedQueries