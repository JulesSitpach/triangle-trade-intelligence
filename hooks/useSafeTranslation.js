/**
 * Safe Translation Hook
 * Provides fallback for missing translations and safe i18n integration
 */

import { useState, useEffect } from 'react'

// Fallback translations for critical UI elements
const fallbackTranslations = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      next: 'Next',
      back: 'Back',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      submit: 'Submit'
    }
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      next: 'Siguiente',
      back: 'Atrás',
      save: 'Guardar',
      cancel: 'Cancelar',
      close: 'Cerrar',
      submit: 'Enviar'
    }
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      next: 'Suivant',
      back: 'Précédent',
      save: 'Enregistrer',
      cancel: 'Annuler',
      close: 'Fermer',
      submit: 'Soumettre'
    }
  }
}

// Mock i18n object for when real i18n is not available
const mockI18n = {
  language: 'en',
  changeLanguage: (lng) => {
    mockI18n.language = lng
    if (typeof window !== 'undefined') {
      localStorage.setItem('triangleIntelligence_language', lng)
    }
  },
  t: (key, options) => {
    const currentLang = mockI18n.language || 'en'
    const keys = key.split('.')
    let value = fallbackTranslations[currentLang]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || fallbackTranslations.en?.[key] || key
  }
}

export function useSafeTranslation(namespace = 'common') {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [i18n, setI18n] = useState(mockI18n)

  useEffect(() => {
    // Try to initialize with saved language
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('triangleIntelligence_language') || 'en'
      setCurrentLanguage(savedLang)
      mockI18n.language = savedLang
    }

    // Try to connect to real i18next if available
    if (typeof window !== 'undefined' && window.i18next) {
      setI18n(window.i18next)
    }
  }, [])

  const t = (key, options) => {
    try {
      // Try real i18n first
      if (i18n && i18n.t && typeof i18n.t === 'function') {
        const result = i18n.t(key, options)
        if (result && result !== key) {
          return result
        }
      }

      // Fallback to our built-in translations
      const keys = key.split('.')
      let value = fallbackTranslations[currentLanguage]
      
      for (const k of keys) {
        value = value?.[k]
      }
      
      return value || fallbackTranslations.en?.[key] || key
    } catch (error) {
      console.warn('Translation error:', error)
      return key
    }
  }

  return {
    t,
    i18n: {
      ...i18n,
      language: currentLanguage,
      changeLanguage: (lng) => {
        setCurrentLanguage(lng)
        if (i18n && i18n.changeLanguage) {
          i18n.changeLanguage(lng)
        } else {
          mockI18n.changeLanguage(lng)
        }
      }
    },
    ready: true
  }
}

export default useSafeTranslation