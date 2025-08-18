/**
 * SIMPLIFIED I18N CONFIGURATION
 * Basic file-based translations that work with our JSON structure
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'

// Simple configuration that loads our JSON files
i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en', // Force English to prevent hydration mismatches
    debug: false, // Disable debug to reduce noise
    
    // Only load 'common' namespace since all our translations are in common.json
    defaultNS: 'common',
    ns: ['common'],
    
    backend: {
      loadPath: (lng, ns) => `/locales/${lng}/${ns}.json`,
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    react: {
      useSuspense: false, // Important for SSR
    },
    
    // Don't save missing keys since we're using static files
    saveMissing: false,
  })

export default i18n