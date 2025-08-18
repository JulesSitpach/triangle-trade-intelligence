/**
 * EMERGENCY I18N FIX - HARDCODED TRANSLATIONS
 * Bypasses all async loading to prevent hydration mismatches
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Hardcoded English translations to prevent hydration issues
const englishTranslations = {
  "metrics": {
    "tradeRecords": "Trade Records",
    "tradeValue": "Trade Value", 
    "successRate": "Success Rate",
    "liveIntelligence": "Live Intelligence"
  },
  "nav": {
    "dashboard": "Dashboard",
    "businessFoundation": "Business Foundation",
    "productClassification": "Product Classification",
    "triangleRouting": "Triangle Routing"
  },
  "foundation": {
    "title": "Business Intelligence Foundation",
    "subtitle": "Complete your profile to unlock $100K-$300K+ savings optimization",
    "businessProfile": "Business Intelligence Profile",
    "companyName": "Company Name",
    "industry": "Industry Classification",
    "continue": "Continue"
  },
  "common": {
    "next": "Next",
    "back": "Back",
    "loading": "Loading...",
    "save": "Save"
  },
  "chat": {
    "introMessageGlobal": "Hi! I'm Marcus Sterling, your Triangle Intelligence assistant.",
    "floating": {
      "tooltip": "Marcus Sterling - Triangle Intelligence"
    }
  }
}

// Initialize with hardcoded resources
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: englishTranslations
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    debug: false,
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })

export default i18n