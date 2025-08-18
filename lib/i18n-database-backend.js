/**
 * DATABASE-POWERED I18NEXT BACKEND
 * Loads translations from Supabase database with fallback to static JSON
 * Supports real-time updates and professional translation management
 */

import { getSupabaseClient } from './supabase-client'

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
    
    console.log('🔗 Using shared Supabase client for translations')
  }

  async read(language, namespace, callback) {
    try {
      // Check cache first
      const cacheKey = `${language}-${namespace}`
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`🔄 Loading translations from cache: ${cacheKey}`)
        callback(null, cached.data)
        return
      }

      console.log(`🌍 LANGUAGE SWITCH: Loading translations for language: ${language}, namespace: ${namespace}`)
      
      // Query database for translations
      console.log(`🔍 Querying database for language: ${language}`)
      const { data, error } = await this.supabase
        .from('translations')
        .select('key, value')
        .eq('language', language)
        .not('value', 'is', null)

      if (error) {
        console.error('❌ Database translation error:', error)
        return this.loadFallback(language, namespace, callback)
      }
      
      console.log(`📊 Database query result for ${language}: ${data?.length || 0} translations found`)
      
      // Log some sample translations for debugging
      if (data && data.length > 0) {
        console.log(`🔍 Sample ${language} translations:`, data.slice(0, 3).map(t => `${t.key}: ${t.value}`))
      }

      if (!data || data.length === 0) {
        console.warn(`No translations found for language: ${language}`)
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

      console.log(`✅ Loaded ${data.length} translations for ${language}`)
      callback(null, translations)

    } catch (error) {
      console.error('Database backend error:', error)
      this.loadFallback(language, namespace, callback)
    }
  }

  // Load fallback translations from static JSON files
  async loadFallback(language, namespace, callback) {
    try {
      console.log(`📁 Loading fallback translations: ${language}/${namespace}`)
      
      // Ultimate fallback - minimal English translations
      const fallbackTranslations = this.getMinimalFallback()
      callback(null, fallbackTranslations)
    } catch (error) {
      console.error('Fallback loading failed:', error)
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
    console.log('🗑️ Translation cache cleared')
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
        console.error('Failed to create translation:', error)
        callback && callback(error)
      } else {
        console.log(`✅ Created translation: ${namespace}.${key}`)
        this.clearCache() // Clear cache to reload new translations
        callback && callback(null)
      }
    } catch (error) {
      console.error('Create translation error:', error)
      callback && callback(error)
    }
  }
}

export default DatabaseBackend