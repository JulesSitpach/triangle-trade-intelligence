/**
 * STATE PERSISTENCE LAYER
 * Handles serialization and deserialization of complex state objects
 * Integrates with existing localStorage validation system
 */

import { 
  setTriangleData, 
  getTriangleData, 
  hasValidTriangleData,
  removeTriangleData,
  clearAllTriangleData
} from '../utils/localStorage-validator'
import { logInfo, logError, logPerformance } from '../utils/production-logger'

// State persistence configuration
const PERSISTENCE_CONFIG = {
  // Compression thresholds (in bytes)
  compressionThreshold: 1024,
  
  // Sync intervals (in milliseconds)
  autoSyncInterval: 30000, // 30 seconds
  debounceInterval: 1000,  // 1 second
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  
  // Performance monitoring
  enableMetrics: true,
  maxMetricsHistory: 100
}

// Performance metrics storage
let persistenceMetrics = {
  operations: [],
  errors: [],
  totalOperations: 0,
  totalErrors: 0
}

/**
 * Compresses data using simple string compression
 * For production, consider using a proper compression library
 */
function compressData(data) {
  try {
    const jsonString = JSON.stringify(data)
    
    // Simple compression - in production, use LZ-string or similar
    if (jsonString.length > PERSISTENCE_CONFIG.compressionThreshold) {
      // For now, just return the original data
      // In production, implement actual compression
      return {
        compressed: false,
        data: jsonString,
        originalSize: jsonString.length,
        compressedSize: jsonString.length
      }
    }
    
    return {
      compressed: false,
      data: jsonString,
      originalSize: jsonString.length,
      compressedSize: jsonString.length
    }
  } catch (error) {
    logError('Data compression failed', error)
    throw new Error('Failed to compress state data')
  }
}

/**
 * Decompresses data
 */
function decompressData(compressedData) {
  try {
    if (compressedData.compressed) {
      // Implement decompression logic here
      return JSON.parse(compressedData.data)
    }
    
    return JSON.parse(compressedData.data)
  } catch (error) {
    logError('Data decompression failed', error)
    throw new Error('Failed to decompress state data')
  }
}

/**
 * Records performance metrics
 */
function recordMetrics(operation, duration, success, metadata = {}) {
  if (!PERSISTENCE_CONFIG.enableMetrics) return
  
  const metric = {
    operation,
    duration,
    success,
    timestamp: Date.now(),
    metadata
  }
  
  persistenceMetrics.operations.push(metric)
  persistenceMetrics.totalOperations++
  
  if (!success) {
    persistenceMetrics.errors.push(metric)
    persistenceMetrics.totalErrors++
  }
  
  // Keep metrics history manageable
  if (persistenceMetrics.operations.length > PERSISTENCE_CONFIG.maxMetricsHistory) {
    persistenceMetrics.operations = persistenceMetrics.operations.slice(-PERSISTENCE_CONFIG.maxMetricsHistory)
  }
  
  if (persistenceMetrics.errors.length > PERSISTENCE_CONFIG.maxMetricsHistory) {
    persistenceMetrics.errors = persistenceMetrics.errors.slice(-PERSISTENCE_CONFIG.maxMetricsHistory)
  }
}

/**
 * Persists page data with compression and error handling
 */
export async function persistPageData(page, data, options = {}) {
  const startTime = performance.now()
  const { skipValidation = false, retry = 0 } = options
  
  try {
    // Validate page name
    const validPages = ['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts']
    if (!validPages.includes(page)) {
      throw new Error(`Invalid page name: ${page}`)
    }
    
    // Prepare data for persistence
    const persistData = {
      ...data,
      _metadata: {
        page,
        version: '2.1',
        persistedAt: new Date().toISOString(),
        sessionId: data.sessionId || 'unknown'
      }
    }
    
    // Compress if needed
    const compressed = compressData(persistData)
    
    // Store using existing validation system
    const storageKey = `triangle-${page}`
    const success = setTriangleData(storageKey, persistData)
    
    if (!success) {
      throw new Error('Failed to store data - validation failed')
    }
    
    const duration = performance.now() - startTime
    recordMetrics('persist', duration, true, {
      page,
      dataSize: compressed.originalSize,
      compressed: compressed.compressed
    })
    
    logInfo(`State persisted successfully`, { page, size: compressed.originalSize })
    return { success: true, size: compressed.originalSize }
    
  } catch (error) {
    const duration = performance.now() - startTime
    recordMetrics('persist', duration, false, { page, error: error.message })
    
    // Retry logic
    if (retry < PERSISTENCE_CONFIG.maxRetries) {
      logError(`Persistence failed for ${page}, retrying ${retry + 1}/${PERSISTENCE_CONFIG.maxRetries}`, error)
      
      await new Promise(resolve => setTimeout(resolve, PERSISTENCE_CONFIG.retryDelay))
      return persistPageData(page, data, { ...options, retry: retry + 1 })
    }
    
    logError(`Failed to persist ${page} data after ${PERSISTENCE_CONFIG.maxRetries} retries`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Retrieves page data with decompression and error handling
 */
export async function retrievePageData(page, options = {}) {
  const startTime = performance.now()
  const { allowExpired = false, returnMeta = false } = options
  
  try {
    // Validate page name
    const validPages = ['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts']
    if (!validPages.includes(page)) {
      throw new Error(`Invalid page name: ${page}`)
    }
    
    const storageKey = `triangle-${page}`
    const rawData = getTriangleData(storageKey, { allowExpired, returnErrors: true })
    
    if (!rawData.data) {
      const duration = performance.now() - startTime
      recordMetrics('retrieve', duration, true, { page, found: false })
      return returnMeta ? { data: null, meta: { found: false, errors: rawData.errors } } : null
    }
    
    // Extract metadata
    const { _metadata, ...pageData } = rawData.data
    
    const duration = performance.now() - startTime
    recordMetrics('retrieve', duration, true, {
      page,
      found: true,
      age: _metadata?.persistedAt ? Date.now() - new Date(_metadata.persistedAt).getTime() : 0
    })
    
    logInfo(`State retrieved successfully`, { page, age: _metadata?.persistedAt })
    
    if (returnMeta) {
      return {
        data: pageData,
        meta: {
          found: true,
          metadata: _metadata,
          errors: rawData.errors,
          age: _metadata?.persistedAt ? Date.now() - new Date(_metadata.persistedAt).getTime() : 0
        }
      }
    }
    
    return pageData
    
  } catch (error) {
    const duration = performance.now() - startTime
    recordMetrics('retrieve', duration, false, { page, error: error.message })
    
    logError(`Failed to retrieve ${page} data`, error)
    return returnMeta ? { data: null, meta: { found: false, error: error.message } } : null
  }
}

/**
 * Bulk persistence for multiple pages
 */
export async function persistMultiplePages(pageDataMap, options = {}) {
  const startTime = performance.now()
  const results = {}
  
  try {
    const persistPromises = Object.entries(pageDataMap).map(async ([page, data]) => {
      const result = await persistPageData(page, data, options)
      results[page] = result
      return result
    })
    
    await Promise.all(persistPromises)
    
    const duration = performance.now() - startTime
    const successCount = Object.values(results).filter(r => r.success).length
    
    recordMetrics('bulk_persist', duration, successCount === Object.keys(pageDataMap).length, {
      totalPages: Object.keys(pageDataMap).length,
      successCount
    })
    
    logPerformance('bulk_state_persistence', duration, { 
      pages: Object.keys(pageDataMap), 
      successCount 
    })
    
    return results
    
  } catch (error) {
    const duration = performance.now() - startTime
    recordMetrics('bulk_persist', duration, false, { error: error.message })
    
    logError('Bulk persistence failed', error)
    return results
  }
}

/**
 * Bulk retrieval for multiple pages
 */
export async function retrieveMultiplePages(pages, options = {}) {
  const startTime = performance.now()
  const results = {}
  
  try {
    const retrievePromises = pages.map(async (page) => {
      const data = await retrievePageData(page, options)
      results[page] = data
      return data
    })
    
    await Promise.all(retrievePromises)
    
    const duration = performance.now() - startTime
    const foundCount = Object.values(results).filter(r => r !== null).length
    
    recordMetrics('bulk_retrieve', duration, true, {
      totalPages: pages.length,
      foundCount
    })
    
    logPerformance('bulk_state_retrieval', duration, { 
      pages, 
      foundCount 
    })
    
    return results
    
  } catch (error) {
    const duration = performance.now() - startTime
    recordMetrics('bulk_retrieve', duration, false, { error: error.message })
    
    logError('Bulk retrieval failed', error)
    return results
  }
}

/**
 * State health check
 */
export function getStateHealth() {
  try {
    const pages = ['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts']
    const health = {
      overall: 'healthy',
      pages: {},
      metrics: {
        totalOperations: persistenceMetrics.totalOperations,
        totalErrors: persistenceMetrics.totalErrors,
        errorRate: persistenceMetrics.totalOperations > 0 
          ? (persistenceMetrics.totalErrors / persistenceMetrics.totalOperations * 100).toFixed(2) + '%'
          : '0%',
        recentOperations: persistenceMetrics.operations.slice(-10)
      }
    }
    
    pages.forEach(page => {
      const storageKey = `triangle-${page}`
      const exists = hasValidTriangleData(storageKey)
      const data = getTriangleData(storageKey, { returnErrors: true, allowExpired: true })
      
      health.pages[page] = {
        exists,
        valid: data.data !== null,
        errors: data.errors || [],
        lastModified: data.data?._metadata?.persistedAt || null,
        age: data.data?._metadata?.persistedAt 
          ? Date.now() - new Date(data.data._metadata.persistedAt).getTime()
          : null
      }
    })
    
    // Determine overall health
    const healthyPages = Object.values(health.pages).filter(p => p.valid).length
    const totalPages = pages.length
    
    if (healthyPages === 0) {
      health.overall = 'critical'
    } else if (healthyPages < totalPages * 0.5) {
      health.overall = 'poor'
    } else if (healthyPages < totalPages * 0.8) {
      health.overall = 'fair'
    } else {
      health.overall = 'healthy'
    }
    
    return health
    
  } catch (error) {
    logError('State health check failed', error)
    return {
      overall: 'error',
      error: error.message,
      pages: {},
      metrics: persistenceMetrics
    }
  }
}

/**
 * Clean up old or corrupted state data
 */
export function cleanupState(options = {}) {
  const { 
    maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days
    removeCorrupted = true,
    removeExpired = true
  } = options
  
  try {
    const pages = ['foundation', 'product', 'routing', 'partnership', 'hindsight', 'alerts']
    const results = {
      cleaned: [],
      skipped: [],
      errors: []
    }
    
    pages.forEach(page => {
      try {
        const storageKey = `triangle-${page}`
        const data = getTriangleData(storageKey, { returnErrors: true, allowExpired: true })
        
        if (!data.data) {
          results.skipped.push(page)
          return
        }
        
        const age = data.data._metadata?.persistedAt 
          ? Date.now() - new Date(data.data._metadata.persistedAt).getTime()
          : maxAge + 1
        
        // Remove if corrupted
        if (removeCorrupted && data.errors.length > 0) {
          removeTriangleData(storageKey)
          results.cleaned.push({ page, reason: 'corrupted', errors: data.errors })
          return
        }
        
        // Remove if too old
        if (removeExpired && age > maxAge) {
          removeTriangleData(storageKey)
          results.cleaned.push({ page, reason: 'expired', age })
          return
        }
        
        results.skipped.push(page)
        
      } catch (error) {
        results.errors.push({ page, error: error.message })
      }
    })
    
    logInfo('State cleanup completed', results)
    return results
    
  } catch (error) {
    logError('State cleanup failed', error)
    return { error: error.message }
  }
}

/**
 * Reset all state data
 */
export function resetAllState() {
  try {
    clearAllTriangleData()
    persistenceMetrics = {
      operations: [],
      errors: [],
      totalOperations: 0,
      totalErrors: 0
    }
    
    logInfo('All state data reset')
    return { success: true }
    
  } catch (error) {
    logError('Failed to reset state', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get persistence performance metrics
 */
export function getPerformanceMetrics() {
  return {
    ...persistenceMetrics,
    averageLatency: persistenceMetrics.operations.length > 0
      ? persistenceMetrics.operations.reduce((sum, op) => sum + op.duration, 0) / persistenceMetrics.operations.length
      : 0,
    recentErrorRate: persistenceMetrics.operations.length > 0
      ? (persistenceMetrics.errors.filter(e => Date.now() - e.timestamp < 60000).length / persistenceMetrics.operations.length * 100).toFixed(2) + '%'
      : '0%'
  }
}

export default {
  persistPageData,
  retrievePageData,
  persistMultiplePages,
  retrieveMultiplePages,
  getStateHealth,
  cleanupState,
  resetAllState,
  getPerformanceMetrics
}