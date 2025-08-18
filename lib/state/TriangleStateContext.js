/**
 * TRIANGLE INTELLIGENCE UNIFIED STATE MANAGEMENT
 * Context API-based state management for the 6-page intelligence journey
 * Integrates with existing localStorage validation and intelligence systems
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { 
  setTriangleData, 
  getTriangleData, 
  hasValidTriangleData,
  clearAllTriangleData,
  getDataHealthStatus 
} from '../utils/localStorage-validator'
import { logInfo, logError, logPerformance } from '../utils/production-logger'

// State structure for the 6-page journey
const INITIAL_STATE = {
  // Page data
  foundation: null,
  product: null,
  routing: null, 
  partnership: null,
  hindsight: null,
  alerts: null,

  // Journey metadata
  journey: {
    currentPage: null,
    completedPages: [],
    progress: 0,
    sessionId: null,
    startTime: null,
    lastActivity: null
  },

  // Intelligence data
  intelligence: {
    analysisResults: {},
    confidenceScores: {},
    optimizationData: {},
    patternMatches: []
  },

  // Real-time data
  realTime: {
    stats: null,
    alerts: [],
    marketData: null
  },

  // UI state
  ui: {
    isLoading: false,
    errors: [],
    notifications: [],
    language: 'en'
  },

  // Performance tracking
  performance: {
    pageLoadTimes: {},
    apiCallDurations: {},
    lastSync: null
  }
}

// Action types
const ACTION_TYPES = {
  // Data actions
  SET_PAGE_DATA: 'SET_PAGE_DATA',
  UPDATE_PAGE_DATA: 'UPDATE_PAGE_DATA',
  CLEAR_PAGE_DATA: 'CLEAR_PAGE_DATA',
  
  // Journey actions
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  MARK_PAGE_COMPLETED: 'MARK_PAGE_COMPLETED',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  INITIALIZE_SESSION: 'INITIALIZE_SESSION',
  
  // Intelligence actions
  SET_ANALYSIS_RESULT: 'SET_ANALYSIS_RESULT',
  UPDATE_CONFIDENCE_SCORE: 'UPDATE_CONFIDENCE_SCORE',
  ADD_PATTERN_MATCH: 'ADD_PATTERN_MATCH',
  
  // Real-time actions
  UPDATE_REAL_TIME_STATS: 'UPDATE_REAL_TIME_STATS',
  ADD_ALERT: 'ADD_ALERT',
  CLEAR_ALERTS: 'CLEAR_ALERTS',
  
  // UI actions
  SET_LOADING: 'SET_LOADING',
  ADD_ERROR: 'ADD_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  SET_LANGUAGE: 'SET_LANGUAGE',
  
  // Performance actions
  RECORD_PAGE_LOAD: 'RECORD_PAGE_LOAD',
  RECORD_API_CALL: 'RECORD_API_CALL',
  SYNC_PERFORMANCE: 'SYNC_PERFORMANCE',
  
  // State management
  HYDRATE_STATE: 'HYDRATE_STATE',
  PERSIST_STATE: 'PERSIST_STATE',
  RESET_STATE: 'RESET_STATE'
}

// Reducer function
function triangleStateReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_PAGE_DATA:
      return {
        ...state,
        [action.page]: action.data,
        journey: {
          ...state.journey,
          lastActivity: Date.now()
        }
      }

    case ACTION_TYPES.UPDATE_PAGE_DATA:
      return {
        ...state,
        [action.page]: {
          ...state[action.page],
          ...action.data
        },
        journey: {
          ...state.journey,
          lastActivity: Date.now()
        }
      }

    case ACTION_TYPES.SET_CURRENT_PAGE:
      return {
        ...state,
        journey: {
          ...state.journey,
          currentPage: action.page,
          lastActivity: Date.now()
        }
      }

    case ACTION_TYPES.MARK_PAGE_COMPLETED:
      const completedPages = [...state.journey.completedPages]
      if (!completedPages.includes(action.page)) {
        completedPages.push(action.page)
      }
      
      return {
        ...state,
        journey: {
          ...state.journey,
          completedPages,
          progress: Math.round((completedPages.length / 6) * 100),
          lastActivity: Date.now()
        }
      }

    case ACTION_TYPES.SET_ANALYSIS_RESULT:
      return {
        ...state,
        intelligence: {
          ...state.intelligence,
          analysisResults: {
            ...state.intelligence.analysisResults,
            [action.key]: action.result
          }
        }
      }

    case ACTION_TYPES.UPDATE_CONFIDENCE_SCORE:
      return {
        ...state,
        intelligence: {
          ...state.intelligence,
          confidenceScores: {
            ...state.intelligence.confidenceScores,
            [action.key]: action.score
          }
        }
      }

    case ACTION_TYPES.UPDATE_REAL_TIME_STATS:
      return {
        ...state,
        realTime: {
          ...state.realTime,
          stats: action.stats
        }
      }

    case ACTION_TYPES.ADD_ALERT:
      return {
        ...state,
        realTime: {
          ...state.realTime,
          alerts: [...state.realTime.alerts, action.alert]
        }
      }

    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.loading
        }
      }

    case ACTION_TYPES.ADD_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          errors: [...state.ui.errors, action.error]
        }
      }

    case ACTION_TYPES.CLEAR_ERRORS:
      return {
        ...state,
        ui: {
          ...state.ui,
          errors: []
        }
      }

    case ACTION_TYPES.SET_LANGUAGE:
      return {
        ...state,
        ui: {
          ...state.ui,
          language: action.language
        }
      }

    case ACTION_TYPES.RECORD_PAGE_LOAD:
      return {
        ...state,
        performance: {
          ...state.performance,
          pageLoadTimes: {
            ...state.performance.pageLoadTimes,
            [action.page]: action.duration
          }
        }
      }

    case ACTION_TYPES.RECORD_API_CALL:
      return {
        ...state,
        performance: {
          ...state.performance,
          apiCallDurations: {
            ...state.performance.apiCallDurations,
            [action.endpoint]: action.duration
          }
        }
      }

    case ACTION_TYPES.HYDRATE_STATE:
      return {
        ...state,
        ...action.data,
        journey: {
          ...state.journey,
          ...action.data.journey,
          lastActivity: Date.now()
        }
      }

    case ACTION_TYPES.RESET_STATE:
      return {
        ...INITIAL_STATE,
        journey: {
          ...INITIAL_STATE.journey,
          sessionId: generateSessionId()
        }
      }

    default:
      logError('Unknown action type in triangleStateReducer', { type: action.type })
      return state
  }
}

// Context creation
const TriangleStateContext = createContext()

// Session ID generation
function generateSessionId() {
  return `triangle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// State provider component
export function TriangleStateProvider({ children }) {
  const [state, dispatch] = useReducer(triangleStateReducer, {
    ...INITIAL_STATE,
    journey: {
      ...INITIAL_STATE.journey,
      sessionId: generateSessionId(),
      startTime: Date.now()
    }
  })

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const startTime = performance.now()
    
    try {
      // Load all page data
      const foundationData = getTriangleData('triangle-foundation')
      const productData = getTriangleData('triangle-product')
      const routingData = getTriangleData('triangle-routing')
      const partnershipData = getTriangleData('triangle-partnership')
      const hindsightData = getTriangleData('triangle-hindsight')
      const alertsData = getTriangleData('triangle-alerts')

      // Reconstruct state
      const hydratedState = {
        foundation: foundationData,
        product: productData,
        routing: routingData,
        partnership: partnershipData,
        hindsight: hindsightData,
        alerts: alertsData,
        journey: {
          ...state.journey,
          completedPages: [
            foundationData && 'foundation',
            productData && 'product',
            routingData && 'routing',
            partnershipData && 'partnership',
            hindsightData && 'hindsight',
            alertsData && 'alerts'
          ].filter(Boolean),
          lastActivity: Math.max(
            foundationData?.timestamp ? new Date(foundationData.timestamp).getTime() : 0,
            productData?.timestamp ? new Date(productData.timestamp).getTime() : 0,
            routingData?.timestamp ? new Date(routingData.timestamp).getTime() : 0,
            partnershipData?.timestamp ? new Date(partnershipData.timestamp).getTime() : 0,
            hindsightData?.timestamp ? new Date(hindsightData.timestamp).getTime() : 0,
            alertsData?.timestamp ? new Date(alertsData.timestamp).getTime() : 0
          )
        }
      }

      hydratedState.journey.progress = Math.round(
        (hydratedState.journey.completedPages.length / 6) * 100
      )

      dispatch({ type: ACTION_TYPES.HYDRATE_STATE, data: hydratedState })

      const loadTime = performance.now() - startTime
      logPerformance('state_hydration', loadTime, {
        pagesLoaded: hydratedState.journey.completedPages.length,
        sessionId: state.journey.sessionId
      })

    } catch (error) {
      logError('Failed to hydrate state from localStorage', error)
      dispatch({ type: ACTION_TYPES.ADD_ERROR, error: 'Failed to load previous session data' })
    }
  }, [])

  // Auto-persist state changes to localStorage
  useEffect(() => {
    const persistState = async () => {
      try {
        // Persist each page data independently
        if (state.foundation) {
          setTriangleData('triangle-foundation', state.foundation)
        }
        if (state.product) {
          setTriangleData('triangle-product', state.product)
        }
        if (state.routing) {
          setTriangleData('triangle-routing', state.routing)
        }
        if (state.partnership) {
          setTriangleData('triangle-partnership', state.partnership)
        }
        if (state.hindsight) {
          setTriangleData('triangle-hindsight', state.hindsight)
        }
        if (state.alerts) {
          setTriangleData('triangle-alerts', state.alerts)
        }

        // Update performance tracking
        dispatch({ 
          type: ACTION_TYPES.SYNC_PERFORMANCE, 
          timestamp: Date.now() 
        })

      } catch (error) {
        logError('Failed to persist state to localStorage', error)
        dispatch({ type: ACTION_TYPES.ADD_ERROR, error: 'Failed to save session data' })
      }
    }

    // Debounce persistence to avoid excessive writes
    const persistTimeout = setTimeout(persistState, 1000)
    return () => clearTimeout(persistTimeout)

  }, [state.foundation, state.product, state.routing, state.partnership, state.hindsight, state.alerts])

  // Action creators
  const actions = {
    // Page data management
    setPageData: useCallback((page, data) => {
      dispatch({ type: ACTION_TYPES.SET_PAGE_DATA, page, data })
      dispatch({ type: ACTION_TYPES.MARK_PAGE_COMPLETED, page })
    }, []),

    updatePageData: useCallback((page, data) => {
      dispatch({ type: ACTION_TYPES.UPDATE_PAGE_DATA, page, data })
    }, []),

    clearPageData: useCallback((page) => {
      dispatch({ type: ACTION_TYPES.CLEAR_PAGE_DATA, page })
    }, []),

    // Journey management
    setCurrentPage: useCallback((page) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_PAGE, page })
      
      // Record page load performance
      const loadTime = performance.now()
      dispatch({ type: ACTION_TYPES.RECORD_PAGE_LOAD, page, duration: loadTime })
    }, []),

    // Intelligence management
    setAnalysisResult: useCallback((key, result) => {
      dispatch({ type: ACTION_TYPES.SET_ANALYSIS_RESULT, key, result })
    }, []),

    updateConfidenceScore: useCallback((key, score) => {
      dispatch({ type: ACTION_TYPES.UPDATE_CONFIDENCE_SCORE, key, score })
    }, []),

    // Real-time data
    updateRealTimeStats: useCallback((stats) => {
      dispatch({ type: ACTION_TYPES.UPDATE_REAL_TIME_STATS, stats })
    }, []),

    addAlert: useCallback((alert) => {
      dispatch({ type: ACTION_TYPES.ADD_ALERT, alert })
    }, []),

    // UI management
    setLoading: useCallback((loading) => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, loading })
    }, []),

    addError: useCallback((error) => {
      dispatch({ type: ACTION_TYPES.ADD_ERROR, error })
      logError('UI Error', { error })
    }, []),

    clearErrors: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_ERRORS })
    }, []),

    setLanguage: useCallback((language) => {
      dispatch({ type: ACTION_TYPES.SET_LANGUAGE, language })
      logInfo('Language changed', { language })
    }, []),

    // Performance tracking
    recordApiCall: useCallback((endpoint, duration) => {
      dispatch({ type: ACTION_TYPES.RECORD_API_CALL, endpoint, duration })
    }, []),

    // State management
    resetState: useCallback(() => {
      clearAllTriangleData()
      dispatch({ type: ACTION_TYPES.RESET_STATE })
      logInfo('State reset completed')
    }, []),

    // Utility methods
    getDataHealth: useCallback(() => {
      return getDataHealthStatus()
    }, []),

    isPageCompleted: useCallback((page) => {
      return state.journey.completedPages.includes(page)
    }, [state.journey.completedPages]),

    getJourneyProgress: useCallback(() => {
      return {
        progress: state.journey.progress,
        currentPage: state.journey.currentPage,
        completedPages: state.journey.completedPages,
        nextPage: getNextPage(state.journey.currentPage, state.journey.completedPages)
      }
    }, [state.journey])
  }

  const contextValue = {
    state,
    actions,
    dispatch
  }

  return (
    <TriangleStateContext.Provider value={contextValue}>
      {children}
    </TriangleStateContext.Provider>
  )
}

// Helper function to determine next page in the journey
function getNextPage(currentPage, completedPages) {
  const pageOrder = ['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts']
  
  if (!currentPage) {
    return completedPages.length > 0 ? null : 'foundation'
  }

  const currentIndex = pageOrder.indexOf(currentPage)
  if (currentIndex === -1 || currentIndex >= pageOrder.length - 1) {
    return null
  }

  return pageOrder[currentIndex + 1]
}

// Custom hook to use the Triangle state
export function useTriangleState() {
  const context = useContext(TriangleStateContext)
  
  if (!context) {
    throw new Error('useTriangleState must be used within a TriangleStateProvider')
  }
  
  return context
}

// Custom hooks for specific functionality
export function usePageData(page) {
  const { state, actions } = useTriangleState()
  
  return {
    data: state[page],
    setData: (data) => actions.setPageData(page, data),
    updateData: (data) => actions.updatePageData(page, data),
    isCompleted: actions.isPageCompleted(page)
  }
}

export function useJourney() {
  const { state, actions } = useTriangleState()
  
  return {
    currentPage: state.journey.currentPage,
    progress: state.journey.progress,
    completedPages: state.journey.completedPages,
    setCurrentPage: actions.setCurrentPage,
    getProgress: actions.getJourneyProgress
  }
}

export function useIntelligence() {
  const { state, actions } = useTriangleState()
  
  return {
    analysisResults: state.intelligence.analysisResults,
    confidenceScores: state.intelligence.confidenceScores,
    setAnalysisResult: actions.setAnalysisResult,
    updateConfidenceScore: actions.updateConfidenceScore
  }
}

export function useRealTimeData() {
  const { state, actions } = useTriangleState()
  
  return {
    stats: state.realTime.stats,
    alerts: state.realTime.alerts,
    marketData: state.realTime.marketData,
    updateStats: actions.updateRealTimeStats,
    addAlert: actions.addAlert
  }
}

export default TriangleStateContext