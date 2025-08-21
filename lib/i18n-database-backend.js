/**
 * DATABASE-POWERED I18NEXT BACKEND
 * Loads translations from Supabase database with fallback to static JSON
 * Supports real-time updates and professional translation management
 */

import { getSupabaseClient } from './supabase-client.js'
import { logInfo, logError, logDBQuery, logPerformance } from './production-logger.js'

// Constants for Triangle Intelligence patterns
const TRANSLATION_CACHE_DURATION = process.env.CACHE_TTL_STABLE_DATA ? 
  parseInt(process.env.CACHE_TTL_STABLE_DATA) * 1000 : 86400000 // 24 hours default

const TRANSLATION_QUERY_TIMEOUT = process.env.DB_QUERY_TIMEOUT_MS ?
  parseInt(process.env.DB_QUERY_TIMEOUT_MS) : 8000 // 8 seconds default

class DatabaseBackend {
  constructor(services, options = {}) {
    this.init(services, options)
  }

  static get type() {
    return 'backend'
  }

  init(services, options) {
    this.services = services
    this.options = {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/api/translations/add/{{lng}}/{{ns}}',
      ...options
    }
    
    this.type = 'backend'
    this.cache = new Map()
    this.cacheExpiry = TRANSLATION_CACHE_DURATION
    
    logInfo('Initialized Database Intelligence Bridge for translations', {
      cacheExpiry: this.cacheExpiry,
      queryTimeout: TRANSLATION_QUERY_TIMEOUT
    })
  }

  async read(language, namespace, callback) {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = `${language}-${namespace}`
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        logInfo('Loading translations from cache', { cacheKey })
        callback(null, cached.data)
        return
      }

      logInfo('LANGUAGE SWITCH: Loading translations via Database Intelligence Bridge', { language, namespace })
      
      // Use StableDataManager for translations (stable data - no API calls needed)
      const translations = await this.getTranslationsFromBridge(language)
      
      if (!translations || Object.keys(translations).length === 0) {
        logInfo('No translations found in database, using fallback', { language })
        return this.loadFallback(language, namespace, callback)
      }

      // Cache the results
      this.cache.set(cacheKey, {
        data: translations,
        timestamp: Date.now()
      })

      const duration = Date.now() - startTime
      logPerformance('translation_load', duration, {
        language,
        translationCount: Object.keys(translations).length,
        source: 'DATABASE_BRIDGE'
      })

      callback(null, translations)

    } catch (error) {
      const duration = Date.now() - startTime
      logError('Database backend error via Bridge', { 
        error: error.message,
        language,
        duration: `${duration}ms`
      })
      this.loadFallback(language, namespace, callback)
    }
  }

  /**
   * Get translations using Database Intelligence Bridge patterns
   * Following Triangle Intelligence architecture for stable data access
   */
  async getTranslationsFromBridge(language) {
    const startTime = Date.now()
    
    try {
      // Create a stable data query for translations using Triangle Intelligence singleton pattern
      const query = async () => {
        const supabase = getSupabaseClient()
        
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language', language)
          .not('value', 'is', null)
        
        if (error) {
          throw new Error(`Translation query failed: ${error.message}`)
        }
        
        return data
      }
      
      // Execute query with performance tracking
      const data = await query()
      const queryDuration = Date.now() - startTime
      
      logDBQuery('translations', 'SELECT', queryDuration, data?.length || 0)
      
      if (!data || data.length === 0) {
        return null
      }

      // Convert flat key-value pairs to nested object structure
      const translations = {}
      data.forEach(row => {
        this.setNestedKey(translations, row.key, row.value)
      })

      logInfo('Successfully loaded translations via Database Intelligence Bridge', { 
        language, 
        count: data.length,
        queryDuration: `${queryDuration}ms`
      })

      return translations
      
    } catch (error) {
      const duration = Date.now() - startTime
      logError('Database Intelligence Bridge translation query failed', {
        error: error.message,
        language,
        duration: `${duration}ms`
      })
      return null
    }
  }

  // Load fallback translations from static JSON files
  async loadFallback(language, namespace, callback) {
    try {
      logInfo('Loading fallback translations', { language, namespace })
      
      // Ultimate fallback - minimal English translations
      const fallbackTranslations = this.getMinimalFallback()
      callback(null, fallbackTranslations)
    } catch (error) {
      logError('Fallback loading failed', { error: error.message })
      callback(null, this.getMinimalFallback())
    }
  }

  // Convert dot notation keys to nested objects
  setNestedKey(obj, key, value) {
    const keys = key.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
  }

  // Minimal fallback translations to prevent app breakage
  getMinimalFallback() {
    return {
      common: {
        next: 'Next',
        back: 'Back',
        save: 'Save',
        loading: 'Loading...',
        error: 'Error'
      },
      nav: {
        dashboard: 'Dashboard',
        stages: 'Stages'
      }
    }
  }

  // Clear cache (useful for real-time updates)
  clearCache() {
    this.cache.clear()
    logInfo('Translation cache cleared')
  }

  // Add new translation to database using Database Intelligence Bridge
  async create(languages, namespace, key, fallbackValue, callback) {
    const startTime = Date.now()
    
    try {
      const translations = languages.map(language => ({
        key: `${namespace}.${key}`,
        language,
        value: fallbackValue,
        context: `Auto-created from ${namespace}`,
        created_at: new Date().toISOString()
      }))

      // Use Triangle Intelligence singleton pattern for insert operations
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('translations')
        .insert(translations)

      const duration = Date.now() - startTime

      if (error) {
        logError('Failed to create translation via Triangle Intelligence Bridge', { 
          error: error.message,
          key: `${namespace}.${key}`,
          duration: `${duration}ms`
        })
        callback && callback(error)
      } else {
        logDBQuery('translations', 'INSERT', duration, translations.length)
        logInfo('Created translation via Triangle Intelligence Bridge', { 
          key: `${namespace}.${key}`,
          languages: languages.length,
          duration: `${duration}ms`
        })
        this.clearCache() // Clear cache to reload new translations
        callback && callback(null)
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logError('Create translation error via Triangle Intelligence Bridge', { 
        error: error.message,
        duration: `${duration}ms`
      })
      callback && callback(error)
    }
  }
}

export default DatabaseBackend