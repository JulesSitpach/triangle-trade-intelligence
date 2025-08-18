// hooks/useSafeTranslation.js
// Safe translation hook that prevents hydration mismatches

import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

export default function useSafeTranslation(namespaces = 'common') {
  const { t, i18n, ready } = useTranslation(namespaces)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Return safe wrapper that shows fallback during SSR
  const safeT = (key, fallback) => {
    if (!isHydrated || !ready) {
      // During SSR or before i18n is ready, show fallback
      return fallback || key.split('.').pop()
    }
    return t(key) || fallback || key
  }

  return {
    t: safeT,
    i18n,
    ready,
    isHydrated
  }
}