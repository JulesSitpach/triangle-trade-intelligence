/**
 * ENHANCED DATABASE TRANSLATION HOOK
 * Professional translation management with database integration
 * Supports real-time updates, caching, and missing translation tracking
 */

import { useTranslation as useI18nTranslation } from 'react-i18next'
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

export const useDatabaseTranslation = (namespace = 'common') => {
  const { t: i18nT, i18n, ready } = useI18nTranslation(namespace)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Supabase client for real-time operations
  const supabase = getSupabaseClient()

  // Enhanced translation function with fallback and logging
  const t = useCallback((key, options = {}) => {
    try {
      const translation = i18nT(key, options)
      
      // Check if translation is missing (returns the key)
      if (translation === key && !options.defaultValue) {
        console.warn(`🔍 Missing translation: ${i18n.language}.${namespace}.${key}`)
        
        // Track missing translations for professional translation
        trackMissingTranslation(key, namespace, i18n.language)
        
        // Return a user-friendly fallback
        return generateFallback(key)
      }
      
      return translation
    } catch (error) {
      console.error('Translation error:', error)
      return generateFallback(key)
    }
  }, [i18nT, i18n.language, namespace])

  // Generate user-friendly fallback for missing translations
  const generateFallback = (key) => {
    // Convert camelCase or dot notation to readable text
    return key
      .split('.')
      .pop() // Get last part after dots
      .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
  }

  // Track missing translations for professional management
  const trackMissingTranslation = async (key, namespace, language) => {
    try {
      // Don't spam - only track each missing translation once per session
      const sessionKey = `missing_${language}_${namespace}_${key}`
      if (typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem(sessionKey)) return
        sessionStorage.setItem(sessionKey, 'tracked')
      }
      
      // Log to analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'missing_translation', {
          event_category: 'translation_management',
          event_label: `${language}.${namespace}.${key}`,
          language,
          namespace,
          key
        })
      }
      
      // Optionally save to database for professional translation
      await supabase.from('translation_requests').insert({
        key: `${namespace}.${key}`,
        language,
        context: `Missing from ${namespace}`,
        priority: 'medium',
        created_at: new Date().toISOString()
      }).catch(err => {
        // Fail silently if table doesn't exist
        console.log('Translation request logging unavailable')
      })
      
    } catch (error) {
      // Fail silently for missing translation tracking
      console.log('Missing translation tracking failed:', error.message)
    }
  }

  // Refresh translations from database
  const refreshTranslations = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Refreshing translations from database...')
      
      // Use i18n's refresh method if available
      if (i18n.refreshFromDatabase) {
        await i18n.refreshFromDatabase()
      } else {
        // Fallback: reload resources
        await i18n.reloadResources()
      }
      
      setLastRefresh(new Date())
      console.log('✅ Translations refreshed successfully')
      
    } catch (error) {
      console.error('❌ Failed to refresh translations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [i18n])

  // Add translation to database (for real-time content management)
  const addTranslation = useCallback(async (key, value, language = i18n.language, context = '') => {
    try {
      const fullKey = namespace ? `${namespace}.${key}` : key
      
      const { error } = await supabase
        .from('translations')
        .upsert({
          key: fullKey,
          language,
          value,
          context: context || `Added via ${namespace}`,
          created_at: new Date().toISOString()
        }, { 
          onConflict: 'key,language'
        })

      if (error) throw error

      console.log(`✅ Translation added: ${language}.${fullKey}`)
      
      // Refresh to pick up new translation
      await refreshTranslations()
      
      return true
    } catch (error) {
      console.error('❌ Failed to add translation:', error)
      return false
    }
  }, [namespace, i18n.language, supabase, refreshTranslations])

  // Currency formatting with localization
  const formatCurrency = useCallback((amount, currency = 'USD') => {
    try {
      return new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    } catch (error) {
      return `$${amount.toLocaleString()}`
    }
  }, [i18n.language])

  // Number formatting with localization
  const formatNumber = useCallback((number, options = {}) => {
    try {
      return new Intl.NumberFormat(i18n.language, options).format(number)
    } catch (error) {
      return number.toLocaleString()
    }
  }, [i18n.language])

  // Date formatting with localization
  const formatDate = useCallback((date, options = {}) => {
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
      }).format(new Date(date))
    } catch (error) {
      return new Date(date).toLocaleDateString()
    }
  }, [i18n.language])

  return {
    // Core translation
    t,
    i18n,
    ready,
    
    // Language management
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
    
    // Database operations
    refreshTranslations,
    addTranslation,
    isLoading,
    lastRefresh,
    
    // Formatting utilities
    formatCurrency,
    formatNumber,
    formatDate,
    
    // Translation metadata
    namespace,
    isRTL: ['ar', 'he', 'fa'].includes(i18n.language),
    
    // Platform info
    supportedLanguages: ['en', 'es', 'fr'],
    defaultLanguage: 'en'
  }
}

// Export convenience hook for common usage
export const useT = (namespace) => {
  const { t } = useDatabaseTranslation(namespace)
  return t
}

export default useDatabaseTranslation