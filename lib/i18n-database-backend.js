/**
 * DATABASE-POWERED I18NEXT BACKEND
 * Loads translations from Supabase database with fallback to static JSON
 * Supports real-time updates and professional translation management
 */

import { getSupabaseClient } from './supabase-client'
import { logInfo, logError, logDebug } from './production-logger'

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
    this.cacheExpiry = 5 * 60 * 1000
    
    this.supabase = getSupabaseClient()
    
    logInfo('Using shared Supabase client for translations')
  }

  async read(language, namespace, callback) {
    try {
      // Check cache first
      const cacheKey = `${language}-${namespace}`
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        logInfo('Loading translations from cache', { cacheKey })
        callback(null, cached.data)
        return
      }

      logInfo('LANGUAGE SWITCH: Loading translations', { language, namespace })
      
      // Query database for translations
      logInfo('Querying database for language', { language })
      const { data, error } = await this.supabase
        .from('translations')
        .select('key, value')
        .eq('language', language)
        .not('value', 'is', null)

      if (error) {
        logError('Database translation error', { error: error.message })
        return this.loadFallback(language, namespace, callback)
      }
      
      logInfo('Database query result', { language, translationCount: data?.length || 0 })
      
      // Log some sample translations for debugging
      if (data && data.length > 0) {
        logInfo('Sample translations', { language, samples: data.slice(0, 3).map(t => `${t.key}: ${t.value}`) })
      }

      if (!data || data.length === 0) {
        logInfo('No translations found', { language })
        return this.loadFallback(language, namespace, callback)
      }

      // Convert flat key-value pairs to nested object structure
      const translations = {}
      data.forEach(row => {
        this.setNestedKey(translations, row.key, row.value)
      })

      // Cache the results
      this.cache.set(cacheKey, {
        data: translations,
        timestamp: Date.now()
      })

      logInfo('Loaded translations', { count: data.length, language })
      callback(null, translations)

    } catch (error) {
      logError('Database backend error', { error: error.message })
      this.loadFallback(language, namespace, callback)
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

  // Add new translation to database
  async create(languages, namespace, key, fallbackValue, callback) {
    try {
      const translations = languages.map(language => ({
        key: `${namespace}.${key}`,
        language,
        value: fallbackValue,
        context: `Auto-created from ${namespace}`,
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabase
        .from('translations')
        .insert(translations)

      if (error) {
        logError('Failed to create translation', { error: error.message })
        callback && callback(error)
      } else {
        logInfo('Created translation', { key: `${namespace}.${key}` })
        this.clearCache() // Clear cache to reload new translations
        callback && callback(null)
      }
    } catch (error) {
      logError('Create translation error', { error: error.message })
      callback && callback(error)
    }
  }
}

export default DatabaseBackend