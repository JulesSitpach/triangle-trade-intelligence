/**
 * UNIFIED STATE MANAGEMENT - MAIN EXPORTS
 * Central export point for all state management components
 * Phase 1 implementation of the Triangle Intelligence state architecture
 */

// Core Context and Provider
export { 
  TriangleStateProvider, 
  useTriangleState,
  usePageData,
  useJourney,
  useIntelligence,
  useRealTimeData
} from './TriangleStateContext'

// Page-specific hooks
export {
  useFoundationState,
  useProductState,
  useRoutingState,
  usePartnershipState,
  useHindsightState,
  useAlertsState,
  useJourneyCompletion
} from './pageStateHooks'

// State persistence
export {
  persistPageData,
  retrievePageData,
  persistMultiplePages,
  retrieveMultiplePages,
  getStateHealth,
  cleanupState,
  resetAllState,
  getPerformanceMetrics
} from './statePersistence'

// Intelligence integration
export {
  StateAwareIntelligenceOrchestrator,
  createIntelligenceOrchestrator,
  useIntelligenceOrchestrator
} from './intelligenceIntegration'

// Action types for external reference
export const STATE_ACTION_TYPES = {
  SET_PAGE_DATA: 'SET_PAGE_DATA',
  UPDATE_PAGE_DATA: 'UPDATE_PAGE_DATA',
  CLEAR_PAGE_DATA: 'CLEAR_PAGE_DATA',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  MARK_PAGE_COMPLETED: 'MARK_PAGE_COMPLETED',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  INITIALIZE_SESSION: 'INITIALIZE_SESSION',
  SET_ANALYSIS_RESULT: 'SET_ANALYSIS_RESULT',
  UPDATE_CONFIDENCE_SCORE: 'UPDATE_CONFIDENCE_SCORE',
  ADD_PATTERN_MATCH: 'ADD_PATTERN_MATCH',
  UPDATE_REAL_TIME_STATS: 'UPDATE_REAL_TIME_STATS',
  ADD_ALERT: 'ADD_ALERT',
  CLEAR_ALERTS: 'CLEAR_ALERTS',
  SET_LOADING: 'SET_LOADING',
  ADD_ERROR: 'ADD_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  SET_LANGUAGE: 'SET_LANGUAGE',
  RECORD_PAGE_LOAD: 'RECORD_PAGE_LOAD',
  RECORD_API_CALL: 'RECORD_API_CALL',
  SYNC_PERFORMANCE: 'SYNC_PERFORMANCE',
  HYDRATE_STATE: 'HYDRATE_STATE',
  PERSIST_STATE: 'PERSIST_STATE',
  RESET_STATE: 'RESET_STATE'
}

// State validation schemas for external use
export const PAGE_SCHEMAS = {
  foundation: {
    required: ['companyName', 'businessType', 'zipCode', 'primarySupplierCountry', 'importVolume'],
    optional: ['timelinePriority', 'secondarySupplierCountries', 'seasonalPatterns', 'currentShippingPorts', 'specialRequirements', 'derivedIntelligence']
  },
  product: {
    required: ['products'],
    optional: ['classification', 'analysisResults', 'timestamp']
  },
  routing: {
    required: ['selectedRoute'],
    optional: ['routes', 'analysisData', 'recommendations', 'timestamp']
  },
  partnership: {
    required: ['selectedStrategy'],
    optional: ['partnershipAnalysis', 'partnerMatches', 'timestamp']
  },
  hindsight: {
    required: ['patterns'],
    optional: ['report', 'learnings', 'timestamp']
  },
  alerts: {
    required: ['alertPreferences'],
    optional: ['monitoring', 'subscriptions', 'timestamp']
  }
}

// Migration utilities
export const migrationUtils = {
  /**
   * Migrate from old localStorage pattern to unified state
   */
  migrateFromLegacyStorage: async () => {
    try {
      const legacyKeys = [
        'triangle-foundation',
        'triangle-product',
        'triangle-routing',
        'triangle-partnership',
        'triangle-hindsight',
        'triangle-alerts'
      ]
      
      const migratedData = {}
      let migrationCount = 0
      
      for (const key of legacyKeys) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const parsedData = JSON.parse(data)
            const pageName = key.replace('triangle-', '')
            migratedData[pageName] = parsedData
            migrationCount++
          }
        } catch (error) {
          console.warn(`Failed to migrate ${key}:`, error)
        }
      }
      
      console.log(`✅ Migrated ${migrationCount} legacy storage items`)
      return migratedData
      
    } catch (error) {
      console.error('Migration failed:', error)
      return {}
    }
  },
  
  /**
   * Clean up legacy storage after successful migration
   */
  cleanupLegacyStorage: () => {
    const legacyKeys = [
      'triangle-foundation',
      'triangle-product',
      'triangle-routing',
      'triangle-partnership',
      'triangle-hindsight',
      'triangle-alerts'
    ]
    
    let cleanedCount = 0
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        cleanedCount++
      }
    })
    
    console.log(`🧹 Cleaned ${cleanedCount} legacy storage items`)
  }
}

// Development utilities
export const devUtils = {
  /**
   * Get complete state snapshot for debugging
   */
  getStateSnapshot: (state) => ({
    timestamp: new Date().toISOString(),
    journey: state.journey,
    pages: {
      foundation: !!state.foundation,
      product: !!state.product,
      routing: !!state.routing,
      partnership: !!state.partnership,
      hindsight: !!state.hindsight,
      alerts: !!state.alerts
    },
    intelligence: {
      analysisCount: Object.keys(state.intelligence.analysisResults).length,
      confidenceScores: Object.keys(state.intelligence.confidenceScores).length,
      patternMatches: state.intelligence.patternMatches.length
    },
    realTime: {
      hasStats: !!state.realTime.stats,
      alertCount: state.realTime.alerts.length,
      hasMarketData: !!state.realTime.marketData
    },
    ui: state.ui,
    performance: state.performance
  }),
  
  /**
   * Validate state structure
   */
  validateState: (state) => {
    const errors = []
    
    // Check required journey properties
    if (!state.journey?.sessionId) errors.push('Missing sessionId')
    if (!state.journey?.startTime) errors.push('Missing startTime')
    
    // Check UI state
    if (typeof state.ui?.isLoading !== 'boolean') errors.push('Invalid isLoading state')
    if (!Array.isArray(state.ui?.errors)) errors.push('Invalid errors array')
    
    // Check intelligence state
    if (typeof state.intelligence?.analysisResults !== 'object') errors.push('Invalid analysisResults')
    if (typeof state.intelligence?.confidenceScores !== 'object') errors.push('Invalid confidenceScores')
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Configuration constants
export const STATE_CONFIG = {
  VERSION: '2.1',
  PAGES: ['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts'],
  PERSISTENCE_INTERVAL: 1000, // 1 second debounce
  MAX_ERROR_HISTORY: 10,
  MAX_ALERT_HISTORY: 50,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  PERFORMANCE_METRICS_LIMIT: 100
}

// Default export for convenience
export default {
  TriangleStateProvider,
  useTriangleState,
  usePageData,
  useJourney,
  useIntelligence,
  useRealTimeData,
  useFoundationState,
  useProductState,
  useRoutingState,
  usePartnershipState,
  useHindsightState,
  useAlertsState,
  useJourneyCompletion,
  useIntelligenceOrchestrator,
  STATE_ACTION_TYPES,
  PAGE_SCHEMAS,
  migrationUtils,
  devUtils,
  STATE_CONFIG
}