/**
 * PAGE-SPECIFIC STATE HOOKS
 * Custom hooks for each page in the 6-page journey
 * Integrates with unified state management and intelligence systems
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useTriangleState, usePageData, useJourney, useIntelligence } from './TriangleStateContext'
import { persistPageData, retrievePageData } from './statePersistence'
import { logInfo, logError, logPerformance } from '../utils/production-logger'

// Page validation schemas
const PAGE_VALIDATION_RULES = {
  foundation: {
    required: ['companyName', 'businessType', 'zipCode', 'primarySupplierCountry', 'importVolume'],
    validationFn: (data) => {
      const errors = []
      if (!data.companyName?.trim()) errors.push('Company name is required')
      if (!data.businessType?.trim()) errors.push('Business type is required')
      if (!data.zipCode?.trim()) errors.push('Business location is required')
      if (!data.primarySupplierCountry?.trim()) errors.push('Primary supplier country is required')
      if (!data.importVolume?.trim()) errors.push('Import volume is required')
      return errors
    }
  },
  product: {
    required: ['products'],
    validationFn: (data) => {
      const errors = []
      if (!data.products?.length) errors.push('At least one product is required')
      if (data.products?.some(p => !p.description?.trim())) {
        errors.push('All products must have descriptions')
      }
      return errors
    }
  },
  routing: {
    required: ['selectedRoute'],
    validationFn: (data) => {
      const errors = []
      if (!data.selectedRoute) errors.push('A route must be selected')
      return errors
    }
  },
  partnership: {
    required: ['selectedStrategy'],
    validationFn: (data) => {
      const errors = []
      if (!data.selectedStrategy?.trim()) errors.push('A partnership strategy must be selected')
      return errors
    }
  },
  hindsight: {
    required: ['patterns'],
    validationFn: (data) => {
      const errors = []
      if (!data.patterns?.length) errors.push('Pattern analysis must be completed')
      return errors
    }
  },
  alerts: {
    required: ['alertPreferences'],
    validationFn: (data) => {
      const errors = []
      if (!data.alertPreferences) errors.push('Alert preferences must be configured')
      return errors
    }
  }
}

/**
 * Foundation page state hook
 */
export function useFoundationState() {
  const { data, setData, updateData, isCompleted } = usePageData('foundation')
  const { setCurrentPage } = useJourney()
  const { setAnalysisResult, updateConfidenceScore } = useIntelligence()

  // Initialize page
  useEffect(() => {
    setCurrentPage('foundation')
  }, [setCurrentPage])

  // Validation
  const validate = useCallback((formData) => {
    const rules = PAGE_VALIDATION_RULES.foundation
    return rules.validationFn(formData)
  }, [])

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (!data) return 0
    
    const requiredFields = PAGE_VALIDATION_RULES.foundation.required
    const completedFields = requiredFields.filter(field => data[field]?.trim()).length
    return Math.round((completedFields / requiredFields.length) * 100)
  }, [data])

  // Intelligence derivation
  const deriveIntelligence = useCallback(async (formData) => {
    const startTime = performance.now()
    
    try {
      // Call existing intelligence derivation API
      const response = await fetch('/api/intelligence/foundation-derivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const intelligence = await response.json()
        
        // Store in unified state
        setAnalysisResult('foundation', intelligence)
        updateConfidenceScore('foundation', intelligence.confidence || 85)
        
        // Update page data with derived intelligence
        updateData({
          ...formData,
          derivedIntelligence: intelligence,
          lastAnalyzed: new Date().toISOString()
        })

        logPerformance('foundation_intelligence_derivation', performance.now() - startTime, {
          confidence: intelligence.confidence,
          dataPointsGenerated: intelligence.dataPointsGenerated
        })

        return intelligence
      }

      throw new Error(`API error: ${response.status}`)
      
    } catch (error) {
      logError('Foundation intelligence derivation failed', error)
      throw error
    }
  }, [setAnalysisResult, updateConfidenceScore, updateData])

  // Submit foundation data
  const submit = useCallback(async (formData) => {
    const startTime = performance.now()
    
    try {
      // Validate
      const errors = validate(formData)
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`)
      }

      // Derive intelligence
      const intelligence = await deriveIntelligence(formData)

      // Save complete data
      const completeData = {
        ...formData,
        derivedIntelligence: intelligence,
        completedAt: new Date().toISOString(),
        version: '2.1'
      }

      await setData(completeData)
      
      logPerformance('foundation_submission', performance.now() - startTime, {
        completionPercentage,
        hasIntelligence: !!intelligence
      })

      return { success: true, intelligence }
      
    } catch (error) {
      logError('Foundation submission failed', error)
      return { success: false, error: error.message }
    }
  }, [validate, deriveIntelligence, setData, completionPercentage])

  return {
    data,
    setData,
    updateData,
    isCompleted,
    validate,
    completionPercentage,
    deriveIntelligence,
    submit
  }
}

/**
 * Product page state hook
 */
export function useProductState() {
  const { data, setData, updateData, isCompleted } = usePageData('product')
  const { state } = useTriangleState()
  const { setCurrentPage } = useJourney()
  const { setAnalysisResult, updateConfidenceScore } = useIntelligence()

  useEffect(() => {
    setCurrentPage('product')
  }, [setCurrentPage])

  // Get foundation data for context
  const foundationData = useMemo(() => state.foundation, [state.foundation])

  // Validation
  const validate = useCallback((productData) => {
    const rules = PAGE_VALIDATION_RULES.product
    return rules.validationFn(productData)
  }, [])

  // Product classification
  const classifyProducts = useCallback(async (products) => {
    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/intelligence/hs-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: products.map(p => ({ description: p.description })),
          businessContext: foundationData
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        setAnalysisResult('product', result)
        updateConfidenceScore('product', result.averageConfidence || 90)

        logPerformance('product_classification', performance.now() - startTime, {
          productCount: products.length,
          averageConfidence: result.averageConfidence
        })

        return result
      }

      throw new Error(`Classification API error: ${response.status}`)
      
    } catch (error) {
      logError('Product classification failed', error)
      throw error
    }
  }, [foundationData, setAnalysisResult, updateConfidenceScore])

  // Submit product data
  const submit = useCallback(async (productData) => {
    try {
      const errors = validate(productData)
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`)
      }

      // Classify products
      const classification = await classifyProducts(productData.products)

      const completeData = {
        ...productData,
        classification,
        completedAt: new Date().toISOString(),
        version: '2.1'
      }

      await setData(completeData)
      return { success: true, classification }
      
    } catch (error) {
      logError('Product submission failed', error)
      return { success: false, error: error.message }
    }
  }, [validate, classifyProducts, setData])

  return {
    data,
    setData,
    updateData,
    isCompleted,
    foundationData,
    validate,
    classifyProducts,
    submit
  }
}

/**
 * Routing page state hook
 */
export function useRoutingState() {
  const { data, setData, updateData, isCompleted } = usePageData('routing')
  const { state } = useTriangleState()
  const { setCurrentPage } = useJourney()
  const { setAnalysisResult, updateConfidenceScore } = useIntelligence()

  useEffect(() => {
    setCurrentPage('routing')
  }, [setCurrentPage])

  // Get previous page data for context
  const foundationData = useMemo(() => state.foundation, [state.foundation])
  const productData = useMemo(() => state.product, [state.product])

  // Calculate triangle routes
  const calculateRoutes = useCallback(async () => {
    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/intelligence/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foundation: foundationData,
          products: productData?.products || []
        })
      })

      if (response.ok) {
        const routing = await response.json()
        
        setAnalysisResult('routing', routing)
        updateConfidenceScore('routing', routing.confidence || 92)

        updateData({
          routes: routing.routes,
          recommendations: routing.recommendations,
          calculatedAt: new Date().toISOString()
        })

        logPerformance('route_calculation', performance.now() - startTime, {
          routeCount: routing.routes?.length || 0,
          confidence: routing.confidence
        })

        return routing
      }

      throw new Error(`Routing API error: ${response.status}`)
      
    } catch (error) {
      logError('Route calculation failed', error)
      throw error
    }
  }, [foundationData, productData, setAnalysisResult, updateConfidenceScore, updateData])

  // Submit routing selection
  const submit = useCallback(async (routingData) => {
    try {
      const errors = PAGE_VALIDATION_RULES.routing.validationFn(routingData)
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`)
      }

      const completeData = {
        ...routingData,
        completedAt: new Date().toISOString(),
        version: '2.1'
      }

      await setData(completeData)
      return { success: true }
      
    } catch (error) {
      logError('Routing submission failed', error)
      return { success: false, error: error.message }
    }
  }, [setData])

  return {
    data,
    setData,
    updateData,
    isCompleted,
    foundationData,
    productData,
    calculateRoutes,
    submit
  }
}

/**
 * Partnership page state hook
 */
export function usePartnershipState() {
  const { data, setData, updateData, isCompleted } = usePageData('partnership')
  const { state } = useTriangleState()
  const { setCurrentPage } = useJourney()
  const { setAnalysisResult } = useIntelligence()

  useEffect(() => {
    setCurrentPage('partnership')
  }, [setCurrentPage])

  // Get context from previous pages
  const contextData = useMemo(() => ({
    foundation: state.foundation,
    product: state.product,
    routing: state.routing
  }), [state.foundation, state.product, state.routing])

  // Analyze partnership opportunities
  const analyzePartnerships = useCallback(async () => {
    try {
      const response = await fetch('/api/partnership-ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextData)
      })

      if (response.ok) {
        const analysis = await response.json()
        setAnalysisResult('partnership', analysis)
        return analysis
      }

      throw new Error(`Partnership API error: ${response.status}`)
      
    } catch (error) {
      logError('Partnership analysis failed', error)
      throw error
    }
  }, [contextData, setAnalysisResult])

  return {
    data,
    setData,
    updateData,
    isCompleted,
    contextData,
    analyzePartnerships,
    submit: async (partnershipData) => {
      try {
        const completeData = {
          ...partnershipData,
          completedAt: new Date().toISOString(),
          version: '2.1'
        }
        await setData(completeData)
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
  }
}

/**
 * Hindsight page state hook
 */
export function useHindsightState() {
  const { data, setData, updateData, isCompleted } = usePageData('hindsight')
  const { state } = useTriangleState()
  const { setCurrentPage } = useJourney()

  useEffect(() => {
    setCurrentPage('hindsight')
  }, [setCurrentPage])

  // Generate hindsight report
  const generateReport = useCallback(async () => {
    try {
      const response = await fetch('/api/marcus/hindsight-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foundation: state.foundation,
          product: state.product,
          routing: state.routing,
          partnership: state.partnership
        })
      })

      if (response.ok) {
        const report = await response.json()
        updateData({ report, generatedAt: new Date().toISOString() })
        return report
      }

      throw new Error(`Hindsight API error: ${response.status}`)
      
    } catch (error) {
      logError('Hindsight report generation failed', error)
      throw error
    }
  }, [state, updateData])

  return {
    data,
    setData,
    updateData,
    isCompleted,
    generateReport,
    submit: async (hindsightData) => {
      try {
        await setData({ ...hindsightData, completedAt: new Date().toISOString() })
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
  }
}

/**
 * Alerts page state hook
 */
export function useAlertsState() {
  const { data, setData, updateData, isCompleted } = usePageData('alerts')
  const { setCurrentPage } = useJourney()

  useEffect(() => {
    setCurrentPage('alerts')
  }, [setCurrentPage])

  // Setup monitoring
  const setupMonitoring = useCallback(async (alertPreferences) => {
    try {
      const response = await fetch('/api/personalized-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertPreferences)
      })

      if (response.ok) {
        const result = await response.json()
        updateData({ monitoring: result, setupAt: new Date().toISOString() })
        return result
      }

      throw new Error(`Alerts API error: ${response.status}`)
      
    } catch (error) {
      logError('Alert setup failed', error)
      throw error
    }
  }, [updateData])

  return {
    data,
    setData,
    updateData,
    isCompleted,
    setupMonitoring,
    submit: async (alertsData) => {
      try {
        await setData({ ...alertsData, completedAt: new Date().toISOString() })
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }
  }
}

/**
 * Journey completion hook
 */
export function useJourneyCompletion() {
  const { state } = useTriangleState()
  
  const completionStatus = useMemo(() => {
    const pages = ['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts']
    const completedPages = pages.filter(page => state[page]?.completedAt)
    
    return {
      totalPages: pages.length,
      completedPages: completedPages.length,
      percentage: Math.round((completedPages.length / pages.length) * 100),
      isComplete: completedPages.length === pages.length,
      nextPage: pages.find(page => !state[page]?.completedAt),
      completedPagesList: completedPages
    }
  }, [state])

  const generateFinalReport = useCallback(async () => {
    if (!completionStatus.isComplete) {
      throw new Error('Journey must be completed before generating final report')
    }

    try {
      const response = await fetch('/api/marcus/final-intelligence-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      })

      if (response.ok) {
        return await response.json()
      }

      throw new Error(`Final report API error: ${response.status}`)
      
    } catch (error) {
      logError('Final report generation failed', error)
      throw error
    }
  }, [completionStatus.isComplete, state])

  return {
    completionStatus,
    generateFinalReport
  }
}

export default {
  useFoundationState,
  useProductState,
  useRoutingState,
  usePartnershipState,
  useHindsightState,
  useAlertsState,
  useJourneyCompletion
}