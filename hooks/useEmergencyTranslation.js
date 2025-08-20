/**
 * EMERGENCY TRANSLATION SYSTEM
 * Pure JavaScript translation hook that works during SSR without react-i18next
 * Temporary solution to get manual testing working while we fix the core issue
 */

import { useState, useEffect } from 'react'

// Import translations directly
import enTranslations from '../public/locales/en/common.json'
import esTranslations from '../public/locales/es/common.json'
import frTranslations from '../public/locales/fr/common.json'

const EMERGENCY_TRANSLATIONS = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations
}

// Pure function to get translation
function getTranslation(key, language = 'en', fallback = null) {
  try {
    const translations = EMERGENCY_TRANSLATIONS[language] || EMERGENCY_TRANSLATIONS.en
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined || value === null) break
    }
    
    return value || fallback || key.split('.').pop()
  } catch (error) {
    console.warn(`🔧 Emergency translation error for key: ${key}`, error)
    return fallback || key.split('.').pop()
  }
}

export function useEmergencyTranslation(namespace = 'common') {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    // Get language from localStorage on client
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('triangleIntelligence_language') || 'en'
      setCurrentLanguage(savedLang)
    }
  }, [])

  // Emergency translation function
  const t = (key, fallback) => {
    return getTranslation(key, currentLanguage, fallback)
  }

  // Language change function
  const changeLanguage = async (lng) => {
    try {
      setCurrentLanguage(lng)
      
      // Save to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('triangleIntelligence_language', lng)
      }
      
      return true
    } catch (error) {
      console.warn(`🔧 Language change error for: ${lng}`, error)
      return false
    }
  }

  return {
    t,
    i18n: { language: currentLanguage },
    ready: true,
    isClient,
    changeLanguage,
    currentLanguage
  }
}

export default useEmergencyTranslation