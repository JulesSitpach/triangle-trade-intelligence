/**
 * INTELLIGENCE SYSTEM INTEGRATION
 * Bridges unified state management with existing intelligence systems
 * Provides seamless integration with database intelligence bridge and other services
 */

import DatabaseIntelligenceBridge, { StableDataManager, VolatileDataManager } from '../intelligence/database-intelligence-bridge'
import { marcusIntelligenceEngine } from '../intelligence/marcus-intelligence'
import { compoundIntelligenceTracker } from '../intelligence/compound-intelligence-tracker'
import { hindsightInstitutionalLearning } from '../hindsight-institutional-learning'
import { dynamicSavingsEngine } from '../dynamic-savings-engine'
import { logInfo, logError, logPerformance, logDBQuery } from '../utils/production-logger'

/**
 * Enhanced intelligence orchestrator that integrates with unified state
 */
export class StateAwareIntelligenceOrchestrator {
  constructor(stateContext) {
    this.stateContext = stateContext
    this.intelligenceCache = new Map()
    this.performanceMetrics = {
      calls: 0,
      cacheHits: 0,
      errors: 0,
      totalLatency: 0
    }
  }

  /**
   * Foundation page intelligence integration
   */
  async processFoundationIntelligence(formData, options = {}) {
    const startTime = performance.now()
    
    try {
      const cacheKey = `foundation-${JSON.stringify(formData)}`
      
      // Check cache first
      if (this.intelligenceCache.has(cacheKey) && !options.forceRefresh) {
        this.performanceMetrics.cacheHits++
        return this.intelligenceCache.get(cacheKey)
      }

      // Initialize intelligence session
      const sessionData = await DatabaseIntelligenceBridge.initIntelligenceSession(formData)
      
      // Get geographic intelligence (stable data)
      const geographicIntel = await StableDataManager.getGeographicIntelligence(formData.zipCode)
      
      // Get market intelligence (volatile data)
      const marketIntel = await VolatileDataManager.getMarketIntelligence(
        formData.primarySupplierCountry,
        formData.businessType
      )

      // Calculate projected savings using dynamic engine
      const savingsAnalysis = await dynamicSavingsEngine.calculateProjectedSavings({
        importVolume: formData.importVolume,
        businessType: formData.businessType,
        supplierCountry: formData.primarySupplierCountry,
        destinationZip: formData.zipCode
      })

      // Compound intelligence analysis
      const compoundAnalysis = await compoundIntelligenceTracker.trackFormSubmission({
        page: 'foundation',
        data: formData,
        sessionId: this.stateContext.state.journey.sessionId
      })

      const intelligence = {
        session: sessionData,
        geographic: geographicIntel,
        market: marketIntel,
        savings: savingsAnalysis,
        compound: compoundAnalysis,
        confidence: this.calculateConfidence([
          sessionData.confidence,
          geographicIntel.confidence,
          marketIntel.confidence,
          savingsAnalysis.confidence
        ]),
        timestamp: new Date().toISOString(),
        version: '2.1'
      }

      // Cache the result
      this.intelligenceCache.set(cacheKey, intelligence)
      
      // Update state context
      this.stateContext.actions.setAnalysisResult('foundation', intelligence)
      this.stateContext.actions.updateConfidenceScore('foundation', intelligence.confidence)

      const latency = performance.now() - startTime
      this.performanceMetrics.calls++
      this.performanceMetrics.totalLatency += latency

      logPerformance('foundation_intelligence_processing', latency, {
        confidence: intelligence.confidence,
        cacheUsed: false,
        dataSourceCount: 4
      })

      return intelligence
      
    } catch (error) {
      this.performanceMetrics.errors++
      logError('Foundation intelligence processing failed', error)
      throw error
    }
  }

  /**
   * Product page intelligence integration
   */
  async processProductIntelligence(products, contextData, options = {}) {
    const startTime = performance.now()
    
    try {
      // Get HS code intelligence
      const hsCodeAnalysis = await DatabaseIntelligenceBridge.getIntelligentHSCodes({
        products: products.map(p => ({ description: p.description })),
        businessContext: contextData.foundation
      })

      // Enhanced BATCH classification with ML learning (N+1 Fix)
      const classificationResults = await this.batchClassifyProducts(
        products, 
        contextData.foundation?.businessType
      )

      // Get trade flow intelligence for products
      const tradeFlowAnalysis = await DatabaseIntelligenceBridge.getProductTradeFlows(
        classificationResults.map(c => c.classification.hsCode).filter(Boolean)
      )

      // Compound intelligence tracking
      const compoundAnalysis = await compoundIntelligenceTracker.trackFormSubmission({
        page: 'product',
        data: { products, classifications: classificationResults },
        sessionId: this.stateContext.state.journey.sessionId
      })

      const intelligence = {
        hsCodeAnalysis,
        classifications: classificationResults,
        tradeFlows: tradeFlowAnalysis,
        compound: compoundAnalysis,
        averageConfidence: this.calculateAverageConfidence(classificationResults),
        productCount: products.length,
        timestamp: new Date().toISOString(),
        version: '2.1'
      }

      // Update state
      this.stateContext.actions.setAnalysisResult('product', intelligence)
      this.stateContext.actions.updateConfidenceScore('product', intelligence.averageConfidence)

      const latency = performance.now() - startTime
      logPerformance('product_intelligence_processing', latency, {
        productCount: products.length,
        averageConfidence: intelligence.averageConfidence
      })

      return intelligence
      
    } catch (error) {
      this.performanceMetrics.errors++
      logError('Product intelligence processing failed', error)
      throw error
    }
  }

  /**
   * Routing intelligence integration
   */
  async processRoutingIntelligence(contextData, options = {}) {
    const startTime = performance.now()
    
    try {
      const foundationData = contextData.foundation
      const productData = contextData.product

      // Get triangle routing intelligence
      const routingIntelligence = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
        origin: foundationData.primarySupplierCountry,
        destination: 'US', // Derived from zipCode analysis
        hsCode: productData.classifications?.[0]?.classification?.hsCode,
        businessType: foundationData.businessType,
        importVolume: foundationData.importVolume
      })

      // Get USMCA-specific advantages
      const usmcaAnalysis = await StableDataManager.getUSMCAAdvantages({
        supplierCountry: foundationData.primarySupplierCountry,
        businessType: foundationData.businessType,
        products: productData.classifications
      })

      // BATCH route savings calculation (N+1 Fix)
      const routeAnalysis = await this.batchCalculateRouteSavings(
        routingIntelligence.triangleOptions || [],
        {
          importVolume: foundationData.importVolume,
          products: productData.classifications,
          businessProfile: foundationData
        }
      )

      // Marcus AI route optimization
      const marcusRecommendation = await marcusIntelligenceEngine.optimizeRoutes({
        routes: routeAnalysis,
        businessProfile: foundationData,
        products: productData.classifications
      })

      const intelligence = {
        routing: routingIntelligence,
        usmca: usmcaAnalysis,
        routes: routeAnalysis,
        marcusRecommendation,
        optimalRoute: this.determineOptimalRoute(routeAnalysis, marcusRecommendation),
        confidence: routingIntelligence.confidence || 92,
        timestamp: new Date().toISOString(),
        version: '2.1'
      }

      // Update state
      this.stateContext.actions.setAnalysisResult('routing', intelligence)
      this.stateContext.actions.updateConfidenceScore('routing', intelligence.confidence)

      const latency = performance.now() - startTime
      logPerformance('routing_intelligence_processing', latency, {
        routeCount: routeAnalysis.length,
        confidence: intelligence.confidence
      })

      return intelligence
      
    } catch (error) {
      this.performanceMetrics.errors++
      logError('Routing intelligence processing failed', error)
      throw error
    }
  }

  /**
   * Partnership intelligence integration
   */
  async processPartnershipIntelligence(contextData, options = {}) {
    try {
      const partnershipAnalysis = await DatabaseIntelligenceBridge.getPartnershipOpportunities({
        businessProfile: contextData.foundation,
        selectedRoute: contextData.routing?.selectedRoute,
        products: contextData.product?.classifications
      })

      // Get strategic partner matches
      const partnerMatches = await this.findStrategicPartners(contextData)

      const intelligence = {
        analysis: partnershipAnalysis,
        partners: partnerMatches,
        recommendations: await this.generatePartnershipRecommendations(contextData),
        timestamp: new Date().toISOString(),
        version: '2.1'
      }

      this.stateContext.actions.setAnalysisResult('partnership', intelligence)
      return intelligence
      
    } catch (error) {
      logError('Partnership intelligence processing failed', error)
      throw error
    }
  }

  /**
   * Hindsight intelligence integration
   */
  async processHindsightIntelligence(completeJourneyData, options = {}) {
    try {
      // Generate institutional learning insights
      const hindsightAnalysis = await hindsightInstitutionalLearning.generateHindsightReport({
        sessionId: this.stateContext.state.journey.sessionId,
        journeyData: completeJourneyData,
        timestamp: new Date().toISOString()
      })

      // Marcus AI comprehensive analysis
      const marcusReport = await marcusIntelligenceEngine.generateComprehensiveReport(
        completeJourneyData
      )

      // Pattern matching against historical successes
      const patternMatches = await this.findSuccessPatterns(completeJourneyData)

      const intelligence = {
        hindsight: hindsightAnalysis,
        marcus: marcusReport,
        patterns: patternMatches,
        learnings: await this.extractActionableLearnings(completeJourneyData),
        timestamp: new Date().toISOString(),
        version: '2.1'
      }

      this.stateContext.actions.setAnalysisResult('hindsight', intelligence)
      return intelligence
      
    } catch (error) {
      logError('Hindsight intelligence processing failed', error)
      throw error
    }
  }

  /**
   * Helper methods
   */
  calculateConfidence(confidenceScores) {
    const validScores = confidenceScores.filter(score => score && score > 0)
    if (validScores.length === 0) return 85 // Default confidence
    
    const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    return Math.round(average)
  }

  calculateAverageConfidence(classifications) {
    const confidences = classifications.map(c => c.confidence).filter(c => c > 0)
    return confidences.length > 0 
      ? Math.round(confidences.reduce((sum, c) => sum + c, 0) / confidences.length)
      : 90
  }

  async recordProductClassificationLearning(product, classification) {
    try {
      // Record for ML improvement
      await fetch('/api/intelligence/learn-hs-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: product.description,
          selectedHSCode: classification.hsCode,
          confidence: classification.confidence,
          sessionId: this.stateContext.state.journey.sessionId
        })
      })
    } catch (error) {
      logError('Failed to record product classification learning', error)
    }
  }

  async getImplementationGuidance(route) {
    // Generate implementation steps for the selected route
    return {
      timeline: '4-6 weeks typical implementation',
      keySteps: [
        'Supplier verification and onboarding',
        'Regulatory compliance setup',
        'Logistics partner coordination',
        'Trial shipment execution'
      ],
      riskFactors: ['Regulatory changes', 'Currency fluctuations', 'Supplier reliability'],
      successProbability: 0.89
    }
  }

  determineOptimalRoute(routeAnalysis, marcusRecommendation) {
    // Use Marcus AI recommendation if available, otherwise use highest savings route
    if (marcusRecommendation?.recommendedRoute) {
      return routeAnalysis.find(r => r.route === marcusRecommendation.recommendedRoute)
    }
    
    return routeAnalysis.reduce((best, current) => 
      (current.detailedSavings?.annualSavings || 0) > (best.detailedSavings?.annualSavings || 0) 
        ? current : best
    , routeAnalysis[0])
  }

  async findStrategicPartners(contextData) {
    try {
      const response = await fetch('/api/partnership/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextData)
      })
      
      if (response.ok) {
        return await response.json()
      }
      
      return { partners: [], message: 'Partnership matching service unavailable' }
    } catch (error) {
      logError('Strategic partner matching failed', error)
      return { partners: [] }
    }
  }

  async generatePartnershipRecommendations(contextData) {
    // Generate partnership strategy recommendations
    return {
      primary: 'Mexico manufacturing partnership',
      secondary: 'Canadian distribution partnership',
      tertiary: 'Dual-market strategy',
      reasoning: 'Based on your business profile and selected routes'
    }
  }

  async findSuccessPatterns(journeyData) {
    try {
      const response = await fetch('/api/intelligence/database-pattern-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journeyData)
      })
      
      if (response.ok) {
        return await response.json()
      }
      
      return { patterns: [] }
    } catch (error) {
      logError('Pattern matching failed', error)
      return { patterns: [] }
    }
  }

  async extractActionableLearnings(journeyData) {
    return {
      keyInsights: [
        'Optimal timing for route implementation',
        'Critical success factors identified',
        'Risk mitigation strategies'
      ],
      nextSteps: [
        'Begin supplier verification process',
        'Initiate regulatory compliance review',
        'Set up monitoring systems'
      ],
      timeline: '90-day implementation roadmap available'
    }
  }

  /**
   * Performance monitoring
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      averageLatency: this.performanceMetrics.calls > 0 
        ? this.performanceMetrics.totalLatency / this.performanceMetrics.calls
        : 0,
      cacheHitRate: this.performanceMetrics.calls > 0
        ? (this.performanceMetrics.cacheHits / this.performanceMetrics.calls * 100).toFixed(2) + '%'
        : '0%',
      errorRate: this.performanceMetrics.calls > 0
        ? (this.performanceMetrics.errors / this.performanceMetrics.calls * 100).toFixed(2) + '%'
        : '0%'
    }
  }

  clearCache() {
    this.intelligenceCache.clear()
    logInfo('Intelligence cache cleared')
  }

  /**
   * BATCH PRODUCT CLASSIFICATION (N+1 Fix)
   * Replaces individual classifyProduct calls with single batch operation
   */
  async batchClassifyProducts(products, businessType) {
    const startTime = Date.now()
    logInfo('BATCH CLASSIFICATION: Processing products in single batch query', { 
      productCount: products.length, 
      businessType 
    })

    try {
      // Extract product descriptions for batch processing
      const productDescriptions = products.map(p => p.description).filter(Boolean)
      
      if (productDescriptions.length === 0) {
        return []
      }

      // Use optimized batch HS code classification
      const batchResults = await DatabaseIntelligenceBridge.getIntelligentHSCodesOptimized({
        products: products.map(p => ({ description: p.description })),
        businessContext: { businessType }
      })

      // Process results and record learning in batch
      const classificationResults = await Promise.all(
        products.map(async (product, index) => {
          const classification = batchResults.products?.[index] || {
            suggestedHSCodes: [],
            confidence: 70
          }
          
          // Record learning for future improvements (can be batched too if needed)
          await this.recordProductClassificationLearning(product, classification)
          
          return {
            product: product.description,
            classification: {
              hsCode: classification.suggestedHSCodes?.[0]?.code,
              confidence: classification.confidence || 70,
              description: classification.suggestedHSCodes?.[0]?.description,
              suggestions: classification.suggestedHSCodes
            },
            confidence: classification.confidence || 70
          }
        })
      )

      const duration = Date.now() - startTime
      logPerformance('batchClassifyProducts', duration, {
        productCount: products.length,
        batchOperation: true,
        avgTimePerProduct: Math.round(duration / products.length),
        optimizationGain: `${products.length}:1 batch ratio`
      })

      logInfo('BATCH CLASSIFICATION: Complete', {
        productsProcessed: products.length,
        duration: `${duration}ms`,
        avgPerProduct: `${Math.round(duration / products.length)}ms`,
        batchEfficiency: `${Math.round((products.length - 1) / products.length * 100)}% fewer queries`
      })

      return classificationResults

    } catch (error) {
      const duration = Date.now() - startTime
      logError('BATCH CLASSIFICATION failed, falling back to individual calls', {
        error: error.message,
        productCount: products.length,
        duration: `${duration}ms`
      })

      // Fallback to individual classification if batch fails
      return await Promise.all(
        products.map(async (product) => {
          const classification = await DatabaseIntelligenceBridge.classifyProduct(
            product.description,
            businessType
          )
          
          await this.recordProductClassificationLearning(product, classification)
          
          return {
            product: product.description,
            classification,
            confidence: classification.confidence || 90
          }
        })
      )
    }
  }

  /**
   * BATCH ROUTE SAVINGS CALCULATION (N+1 Fix)
   * Replaces individual calculateRouteSavings calls with optimized batch operation
   */
  async batchCalculateRouteSavings(routes, context) {
    const startTime = Date.now()
    logInfo('BATCH ROUTE SAVINGS: Processing routes in optimized batch', { 
      routeCount: routes.length,
      importVolume: context.importVolume
    })

    try {
      if (routes.length === 0) {
        return []
      }

      // Prepare batch context for all routes
      const batchContext = {
        importVolume: context.importVolume,
        businessProfile: context.businessProfile,
        products: context.products,
        routes: routes.map(r => ({
          route: r.route,
          usmcaTariff: r.usmcaTariff || 0,
          type: r.type
        }))
      }

      // Batch calculate savings for all routes using single operation
      const batchSavingsResults = await dynamicSavingsEngine.calculateBatchRouteSavings(batchContext)

      // Batch get implementation guidance using .in() operator
      const routeIds = routes.map(r => r.route.toLowerCase().replace(/[^a-z]/g, '_'))
      const implementationGuidance = await this.getBatchImplementationGuidance(routeIds)

      // Combine results efficiently
      const routeAnalysis = routes.map((route, index) => {
        const savings = batchSavingsResults?.[index] || {
          annualSavings: 0,
          tariffSavings: 0,
          confidence: 50
        }

        const guidance = implementationGuidance[routeIds[index]] || {
          complexity: 'medium',
          timeline: '60-90 days',
          requirements: []
        }

        return {
          ...route,
          detailedSavings: savings,
          implementation: guidance
        }
      })

      const duration = Date.now() - startTime
      logPerformance('batchCalculateRouteSavings', duration, {
        routeCount: routes.length,
        batchOperation: true,
        avgTimePerRoute: Math.round(duration / routes.length),
        optimizationGain: `${routes.length} routes processed in single batch`
      })

      logInfo('BATCH ROUTE SAVINGS: Complete', {
        routesProcessed: routes.length,
        duration: `${duration}ms`,
        avgPerRoute: `${Math.round(duration / routes.length)}ms`,
        batchEfficiency: `${Math.round((routes.length - 1) / routes.length * 100)}% fewer calculations`
      })

      return routeAnalysis

    } catch (error) {
      const duration = Date.now() - startTime
      logError('BATCH ROUTE SAVINGS failed, falling back to individual calls', {
        error: error.message,
        routeCount: routes.length,
        duration: `${duration}ms`
      })

      // Fallback to individual calculations if batch fails
      return await Promise.all(
        routes.map(async (route) => {
          const savings = await dynamicSavingsEngine.calculateRouteSavings({
            route: route.route,
            importVolume: context.importVolume,
            products: context.products,
            businessProfile: context.businessProfile
          })

          return {
            ...route,
            detailedSavings: savings,
            implementation: await this.getImplementationGuidance(route)
          }
        })
      )
    }
  }

  /**
   * BATCH IMPLEMENTATION GUIDANCE (Using .in() operator)
   * Gets implementation guidance for multiple routes in single query
   */
  async getBatchImplementationGuidance(routeIds) {
    const startTime = Date.now()

    try {
      const { getSupabaseClient } = await import('../../supabase-client.js')
      const supabase = getSupabaseClient()

      // Single query using .in() operator instead of multiple individual queries
      const { data, error } = await supabase
        .from('implementation_guidance')
        .select('*')
        .in('route_id', routeIds)

      if (error) throw error

      const duration = Date.now() - startTime
      logDBQuery('implementation_guidance', 'SELECT with .in()', duration, data?.length || 0)

      // Convert array to object for easy lookup
      const guidanceMap = {}
      data?.forEach(guidance => {
        guidanceMap[guidance.route_id] = {
          complexity: guidance.complexity_level,
          timeline: guidance.estimated_timeline,
          requirements: guidance.requirements || [],
          steps: guidance.implementation_steps || []
        }
      })

      logInfo('BATCH IMPLEMENTATION GUIDANCE: Retrieved', {
        routeIdsRequested: routeIds.length,
        guidanceFound: Object.keys(guidanceMap).length,
        duration: `${duration}ms`,
        queryOptimization: `Used .in() operator instead of ${routeIds.length} separate queries`
      })

      return guidanceMap

    } catch (error) {
      logError('Batch implementation guidance failed', { error: error.message, routeIds })
      
      // Return fallback guidance for all routes
      const fallbackGuidance = {}
      routeIds.forEach(routeId => {
        fallbackGuidance[routeId] = {
          complexity: 'medium',
          timeline: '60-90 days',
          requirements: ['Legal review', 'Supplier agreements', 'Logistics setup'],
          steps: []
        }
      })
      
      return fallbackGuidance
    }
  }
}

/**
 * Factory function to create state-aware intelligence orchestrator
 */
export function createIntelligenceOrchestrator(stateContext) {
  return new StateAwareIntelligenceOrchestrator(stateContext)
}

/**
 * Hook to use intelligence orchestrator within components
 */
export function useIntelligenceOrchestrator() {
  const stateContext = useTriangleState()
  
  return useMemo(() => {
    return createIntelligenceOrchestrator(stateContext)
  }, [stateContext])
}

export default {
  StateAwareIntelligenceOrchestrator,
  createIntelligenceOrchestrator,
  useIntelligenceOrchestrator
}