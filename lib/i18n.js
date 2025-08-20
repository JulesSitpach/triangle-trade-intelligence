/**
 * FILE-BASED I18N CONFIGURATION
 * Professional translation system with NESTED JSON structure
 * Supports caching, language detection, and professional translation management
 * Uses nested keys with dot notation AND flat keys for maximum flexibility
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { logInfo, logError, logDebug } from './production-logger'

// Import translation resources directly for SSR support
import enTranslations from '../public/locales/en/common.json'
import esTranslations from '../public/locales/es/common.json'  
import frTranslations from '../public/locales/fr/common.json'

// Initialize i18n with preloaded resources for SSR
// Only initialize if not already initialized to prevent conflicts
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
    // Fallback language
    fallbackLng: 'en',
    
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    
    // Supported languages
    supportedLngs: ['en', 'es', 'fr'],
    
    // Default namespace
    defaultNS: 'common',
    
    // Namespaces to load - using 'common' only since all translations are in common.json
    ns: ['common'],
    
    // Preloaded resources for SSR support
    resources: {
      en: {
        common: enTranslations
      },
      es: {
        common: esTranslations
      },
      fr: {
        common: frTranslations
      }
    },

    // Language detection configuration
    detection: {
      // Detection order
      order: [
        'localStorage',           // Check localStorage first
        'navigator',             // Then browser language
        'htmlTag',               // Then HTML lang attribute
        'querystring',           // Then URL query string
        'cookie'                 // Finally cookies
      ],
      
      // Storage options
      lookupLocalStorage: 'triangleIntelligence_language',
      lookupCookie: 'triangle_lang',
      lookupQuerystring: 'lng',
      
      // Cache in localStorage
      caches: ['localStorage'],
      
      // Don't cache if in iframe
      excludeCacheFor: ['cimode'],
      
      // Cookie settings
      cookieMinutes: 10080, // 7 days
      cookieDomain: 'localhost',
    },

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes by default
      formatSeparator: ',',
      format: (value, format, lng) => {
        // Updated format function (new i18next approach)
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'USD'
          }).format(value)
        }
        
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value)
        }
        
        return value
      }
    },

    // React specific settings
    react: {
      // Bind i18n instance to React
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
      useSuspense: false, // Disable suspense for SSR compatibility
    },

    // Advanced options
    saveMissing: false, // Don't save missing translations (we're using files now)
    saveMissingTo: 'all', // Save to all languages
    missingKeyHandler: function(lng, ns, key, fallbackValue) {
      // Log missing translations for professional translation
      logDebug('Missing translation', { key: `${lng}.${ns}.${key}` })
      
      // Optionally send to analytics or translation management system
      if (typeof gtag !== 'undefined') {
        gtag('event', 'missing_translation', {
          language: lng,
          namespace: ns,
          key: key,
          fallback: fallbackValue
        })
      }
    },

    // Post-processor for dynamic content
    postProcess: ['interval'],
    
    // Support for nested JSON structure (mixed with flat keys)
    returnObjects: false,  // CRITICAL: Disable to fix translation resolution
    pluralSeparator: '_',
    contextSeparator: '_',
    nsSeparator: false,   // Keep namespace separator disabled
    keySeparator: '.',    // CRITICAL: Enable key separator for nested keys
    
    // JSON structure handling - CRITICAL SETTING
    ignoreJSONStructure: false,  // CRITICAL: Must be false for nested keys to work
    
    // Force re-initialization to override any cached settings
    initImmediate: false,
    load: 'languageOnly'
  })
}

// Add event listeners for real-time updates
i18n.on('languageChanged', (lng) => {
  logInfo('Language changed', { language: lng })
  
  // Update HTML lang attribute (client-side only)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
  }
  
  // Analytics tracking
  if (typeof gtag !== 'undefined') {
    gtag('event', 'language_change', {
      new_language: lng,
      platform: 'triangle_intelligence'
    })
  }
})

i18n.on('loaded', (loaded) => {
  logInfo('Translations loaded', { namespaces: Object.keys(loaded) })
})

i18n.on('failedLoading', (lng, ns, msg) => {
  logError('Failed loading translation', { language: lng, namespace: ns, message: msg })
})

// Add method to refresh translations from database
i18n.refreshFromDatabase = async () => {
  try {
    logInfo('Refreshing translations from database')
    
    // Reload all resources
    await i18n.reloadResources()
    
    logInfo('Translations refreshed successfully')
    return true
  } catch (error) {
    logError('Failed to refresh translations', { error: error.message })
    return false
  }
}

export default i18n