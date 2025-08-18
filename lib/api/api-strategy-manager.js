/**
 * API Strategy Manager
 * Implements Volatile vs Stable data strategy
 * Only fetches what changes, caches what's stable
 */

import { logger, logInfo, logWarn, logError, logDebug, logAPICall } from './production-logger.js'
import { getSupabaseClient } from './supabase-client.js'

const supabase = getSupabaseClient()

// DATABASE-DRIVEN STABLE DATA QUERIES
// Replace hardcoded data with database queries
export const STABLE_DATABASE_QUERIES = {
  // USMCA Treaty Rates - Query usmca_tariff_rates table
  async getUSMCARates() {
    try {
      const { data, error } = await supabase
        .from('usmca_tariff_rates')
        .select('*')
      
      if (error) throw error
      
      const rates = {}
      data.forEach(record => {
        rates[record.route] = {
          rate: record.tariff_rate || 0,
          status: 'TREATY_LOCKED',
          lastUpdated: record.last_updated,
          expires: 'NEVER'
        }
      })
      
      return rates
    } catch (error) {
      console.error('❌ Failed to get USMCA rates from database:', error)
      // Fallback to known treaty rates
      return {
        'MX-US': { rate: 0, status: 'TREATY_LOCKED', expires: 'NEVER' },
        'CA-US': { rate: 0, status: 'TREATY_LOCKED', expires: 'NEVER' },
        'MX-CA': { rate: 0, status: 'TREATY_LOCKED', expires: 'NEVER' }
      }
    }
  },
  
  // Infrastructure - Query us_ports and trade_routes tables
  async getInfrastructure() {
    try {
      const [portsResult, routesResult] = await Promise.all([
        supabase.from('us_ports').select('*'),
        supabase.from('trade_routes').select('*')
      ])
      
      if (portsResult.error) throw portsResult.error
      if (routesResult.error) throw routesResult.error
      
      return {
        ports: this.organizePorts(portsResult.data),
        routing: this.organizeRoutes(routesResult.data)
      }
    } catch (error) {
      console.error('❌ Failed to get infrastructure from database:', error)
      return {
        ports: { 'usa': ['Major US ports'] },
        routing: { 'westCoast': { preferred: 'Mexico', reason: 'Database-driven routing' }}
      }
    }
  },
  
  organizePorts(portsData) {
    const organized = { usa: [], mexico: [], canada: [] }
    portsData.forEach(port => {
      if (port.country) {
        const country = port.country.toLowerCase()
        if (organized[country]) {
          organized[country].push(port.port_name)
        }
      }
    })
    return organized
  },
  
  organizeRoutes(routesData) {
    const organized = {}
    routesData.forEach(route => {
      organized[route.route_id] = {
        preferred: route.preferred_intermediate,
        reason: route.reasoning
      }
    })
    return organized
  },
  
  // Business Patterns - Consistent year over year
  patterns: {
    seasonality: {
      electronics: { Q1: 0.7, Q2: 0.8, Q3: 0.9, Q4: 1.4 }, // Q4_HEAVY
      textiles: { Q1: 1.2, Q2: 1.0, Q3: 0.8, Q4: 0.9 },
      automotive: { Q1: 0.9, Q2: 1.1, Q3: 1.0, Q4: 1.0 }
    },
    requirements: {
      electronics: ['Static sensitive', 'Temperature control', 'Shock absorption'],
      medical: ['FDA compliance', 'Cold chain', 'Sterile environment'],
      automotive: ['JIT delivery', 'Quality certification', 'Parts tracking']
    },
    successRates: {
      manufacturing: 92,
      electronics: 89,
      textiles: 84,
      automotive: 87
    }
  },
  
  // HS Code Classifications - Annual updates max
  hsBasics: {
    '84': 'Machinery and mechanical appliances',
    '85': 'Electrical machinery and equipment',
    '87': 'Vehicles and parts',
    '61': 'Apparel, knitted or crocheted',
    '62': 'Apparel, not knitted or crocheted',
    lastUpdated: '2024-01-01',
    nextUpdate: '2025-01-01'
  }
}

// VOLATILE DATA - Track what needs API calls
export const VOLATILE_TRACKER = {
  tariffs: {
    needsUpdate: (country, timestamp) => {
      // Tariffs change daily/weekly - cache for 1 hour max
      const age = Date.now() - timestamp
      return age > 3600000 // 1 hour
    },
    apiEndpoint: 'comtrade',
    countries: ['CN', 'IN', 'VN', 'EU', 'UK', 'KR', 'JP']
  },
  
  shipping: {
    needsUpdate: (route, timestamp) => {
      // Shipping rates change daily - cache for 4 hours
      const age = Date.now() - timestamp
      return age > 14400000 // 4 hours
    },
    apiEndpoint: 'shippo',
    factors: ['fuel_surcharge', 'capacity', 'congestion', 'seasonal_demand']
  },
  
  countryRisk: {
    needsUpdate: (country, timestamp) => {
      // Risk scores change weekly - cache for 24 hours
      const age = Date.now() - timestamp
      return age > 86400000 // 24 hours
    },
    apiEndpoint: 'risk_assessment',
    factors: ['political', 'supply_chain', 'currency', 'regulatory']
  }
}

/**
 * Smart API Manager - Knows what to fetch vs cache
 */
export class SmartAPIManager {
  constructor() {
    this.volatileCache = new Map()
    this.apiCallCount = 0
    this.apiCallsSaved = 0
  }
  
  /**
   * Get data - either from stable cache or API
   */
  async getData(type, params) {
    // Check if it's stable data first
    const stableData = this.getStableData(type, params)
    if (stableData) {
      this.apiCallsSaved++
      logInfo(`API call saved - using stable cache`, { type, source: 'stable_cache' })
      return stableData
    }
    
    // Check volatile cache
    const cachedData = this.getVolatileCache(type, params)
    if (cachedData && !this.needsRefresh(type, cachedData.timestamp)) {
      this.apiCallsSaved++
      logDebug(`Cache hit - using volatile cache`, { type, source: 'volatile_cache' })
      return cachedData.data
    }
    
    // Need fresh data - make API call
    logInfo(`API call required - fetching fresh data`, { type, source: 'api_call' })
    return await this.fetchFreshData(type, params)
  }
  
  /**
   * Get stable data that never needs API calls
   */
  getStableData(type, params) {
    switch(type) {
      case 'usmca_rate':
        return STABLE_CACHE.usmca[params.route] || null
        
      case 'port_info':
        return STABLE_CACHE.infrastructure.ports[params.country] || null
        
      case 'seasonality':
        return STABLE_CACHE.patterns.seasonality[params.industry] || null
        
      case 'requirements':
        return STABLE_CACHE.patterns.requirements[params.industry] || null
        
      case 'success_rate':
        return STABLE_CACHE.patterns.successRates[params.industry] || null
        
      case 'hs_basic':
        return STABLE_CACHE.hsBasics[params.chapter] || null
        
      default:
        return null
    }
  }
  
  /**
   * Check volatile cache
   */
  getVolatileCache(type, params) {
    const key = `${type}_${JSON.stringify(params)}`
    return this.volatileCache.get(key)
  }
  
  /**
   * Check if volatile data needs refresh
   */
  needsRefresh(type, timestamp) {
    const tracker = VOLATILE_TRACKER[type]
    if (!tracker) return false
    return tracker.needsUpdate(null, timestamp)
  }
  
  /**
   * Fetch fresh data from API
   */
  async fetchFreshData(type, params) {
    this.apiCallCount++
    
    try {
      let data = null
      
      switch(type) {
        case 'tariff':
          data = await this.fetchTariffData(params)
          break
          
        case 'shipping':
          data = await this.fetchShippingData(params)
          break
          
        case 'country_risk':
          data = await this.fetchCountryRisk(params)
          break
          
        default:
          throw new Error(`Unknown volatile data type: ${type}`)
      }
      
      // Cache the volatile data
      const key = `${type}_${JSON.stringify(params)}`
      this.volatileCache.set(key, {
        data,
        timestamp: Date.now(),
        params
      })
      
      return data
      
    } catch (error) {
      logError(`API call failed`, { type, error: error.message })
      // Return last known data if available
      const cached = this.getVolatileCache(type, params)
      return cached ? cached.data : null
    }
  }
  
  /**
   * Fetch current tariff rates (VOLATILE)
   */
  async fetchTariffData(params) {
    const { country, product } = params
    
    // Only call API for volatile countries
    if (!VOLATILE_TRACKER.tariffs.countries.includes(country)) {
      return { rate: 0, note: 'Stable country - no API needed' }
    }
    
    logAPICall('POST', `/api/intelligence/tariffs`, 0, 'REQUEST')
    logInfo(`Fetching tariff data`, { country, api: 'comtrade' })
    
    // Simulate API call (replace with real Comtrade API)
    const response = await fetch('/api/intelligence/tariffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, product })
    })
    
    return await response.json()
  }
  
  /**
   * Fetch current shipping rates (VOLATILE)
   */
  async fetchShippingData(params) {
    const { origin, destination, weight } = params
    
    logAPICall('POST', `/api/intelligence/shipping`, 0, 'REQUEST')
    logInfo(`Fetching shipping rates`, { origin, destination, api: 'shippo' })
    
    // Make real Shippo API call
    const response = await fetch('/api/intelligence/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, weight })
    })
    
    return await response.json()
  }
  
  /**
   * Fetch country risk scores (VOLATILE)
   */
  async fetchCountryRisk(params) {
    const { country } = params
    
    logInfo(`Fetching country risk score`, { country, api: 'risk_assessment' })
    
    // Simulate risk API (replace with real service)
    return {
      political: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      supply_chain: Math.random() > 0.3 ? 'MODERATE' : 'LOW',
      currency: 'STABLE',
      overall: 'MEDIUM'
    }
  }
  
  /**
   * Get API usage stats
   */
  getStats() {
    return {
      apiCallsMade: this.apiCallCount,
      apiCallsSaved: this.apiCallsSaved,
      efficiency: this.apiCallsSaved / (this.apiCallCount + this.apiCallsSaved),
      volatileCacheSize: this.volatileCache.size,
      savings: `$${(this.apiCallsSaved * 0.01).toFixed(2)}` // Assume $0.01 per API call
    }
  }
}

// Export singleton instance
export const apiManager = new SmartAPIManager()

/**
 * Helper function for stages to use
 */
export async function getIntelligentData(type, params) {
  return await apiManager.getData(type, params)
}

/**
 * Get API efficiency report
 */
export function getAPIEfficiency() {
  const stats = apiManager.getStats()
  return {
    ...stats,
    recommendation: stats.efficiency > 0.8 ? 
      'Excellent API efficiency - caching working well' :
      'Consider caching more stable data',
    stableDataTypes: Object.keys(STABLE_CACHE).length,
    volatileDataTypes: Object.keys(VOLATILE_TRACKER).length
  }
}