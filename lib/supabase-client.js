/**
 * SHARED SUPABASE CLIENT WITH SERVER/CLIENT SEPARATION
 * Ensures service keys are NEVER exposed client-side
 * Single instance pattern to avoid conflicts
 */

import { createClient } from '@supabase/supabase-js'
import { logInfo, logError } from './production-logger.js'
import { getMemoryOptimizer } from './memory-optimizer.js'

let supabaseInstance = null
let supabaseServerInstance = null
let connectionPool = {
  activeConnections: 0,
  maxConnections: 50, // Scaled for production concurrent users
  connectionQueue: [],
  lastCleanup: Date.now(),
  peakConnections: 0,
  totalQueries: 0
}

/**
 * Get Supabase client appropriate for the environment
 * Client-side: Uses anonymous key (safe for browser)
 * Server-side: Uses service role key (never exposed to browser)
 */
export const getSupabaseClient = () => {
  // Check if we're on the server or client
  const isServer = typeof window === 'undefined'
  
  if (isServer) {
    // SERVER-SIDE: Use service role key for full access
    if (!supabaseServerInstance) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceKey) {
        logError('SUPABASE_SERVICE_ROLE_KEY not found in server environment')
        throw new Error('Server configuration error: Missing service key')
      }
      
      supabaseServerInstance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'User-Agent': 'Triangle-Intelligence-Platform/1.0'
            }
          }
        }
      )
      
      // Register cleanup with memory optimizer
      const memoryOptimizer = getMemoryOptimizer()
      memoryOptimizer.registerCleanup('supabase-server-client', () => {
        if (supabaseServerInstance) {
          logInfo('Cleaning up Supabase server connections')
          supabaseServerInstance = null
        }
      })
      
      logInfo('Created server-side Supabase client with service role and memory optimization')
    }
    return supabaseServerInstance
  } else {
    // CLIENT-SIDE: Use anonymous key only
    if (!supabaseInstance) {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!anonKey) {
        logError('NEXT_PUBLIC_SUPABASE_ANON_KEY not found')
        throw new Error('Client configuration error: Missing anonymous key')
      }
      
      supabaseInstance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey
      )
      logInfo('Created client-side Supabase client with anonymous key')
    }
    return supabaseInstance
  }
}

/**
 * Get server-only Supabase client with service role
 * CRITICAL: Only use in API routes, never in components
 */
export const getServerSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: Attempted to use server client on client-side')
  }
  
  if (!supabaseServerInstance) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
    }
    
    supabaseServerInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    logInfo('Created dedicated server Supabase client')
  }
  return supabaseServerInstance
}

// Test database connection
export const testSupabaseConnection = async () => {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client.from('translations').select('*').limit(1)
    
    if (error) {
      logError('Supabase connection test failed', { error: error.message })
      return false
    }
    
    logInfo('Supabase connection test successful')
    return true
  } catch (error) {
    logError('Supabase connection test error', { error: error.message })
    return false
  }
}

/**
 * Memory-optimized database query wrapper
 */
export const executeOptimizedQuery = async (queryFn, queryName = 'unknown') => {
  const startTime = Date.now()
  connectionPool.activeConnections++
  connectionPool.totalQueries++
  
  // Track peak connections for monitoring
  if (connectionPool.activeConnections > connectionPool.peakConnections) {
    connectionPool.peakConnections = connectionPool.activeConnections
  }
  
  try {
    // Check if we need cleanup
    if (Date.now() - connectionPool.lastCleanup > 300000) { // 5 minutes
      cleanupConnections()
    }
    
    const result = await queryFn()
    const duration = Date.now() - startTime
    
    logInfo(`Optimized query executed: ${queryName}`, { 
      duration: `${duration}ms`,
      activeConnections: connectionPool.activeConnections,
      peakConnections: connectionPool.peakConnections
    })
    
    return result
  } catch (error) {
    logError(`Optimized query failed: ${queryName}`, { 
      error: error.message,
      duration: `${Date.now() - startTime}ms`
    })
    throw error
  } finally {
    connectionPool.activeConnections--
  }
}

/**
 * Clean up connection pool
 */
const cleanupConnections = () => {
  logInfo('Cleaning up Supabase connection pool', {
    activeConnections: connectionPool.activeConnections,
    queueSize: connectionPool.connectionQueue.length
  })
  
  // Reset connection tracking
  connectionPool.activeConnections = Math.max(0, connectionPool.activeConnections)
  connectionPool.connectionQueue = connectionPool.connectionQueue.filter(
    conn => Date.now() - conn.created < 300000 // 5 minutes
  )
  connectionPool.lastCleanup = Date.now()
}

/**
 * Get connection pool statistics
 */
export const getConnectionStats = () => {
  return {
    activeConnections: connectionPool.activeConnections,
    maxConnections: connectionPool.maxConnections,
    peakConnections: connectionPool.peakConnections,
    totalQueries: connectionPool.totalQueries,
    queueSize: connectionPool.connectionQueue.length,
    lastCleanup: new Date(connectionPool.lastCleanup).toISOString(),
    utilizationPercent: Math.round((connectionPool.activeConnections / connectionPool.maxConnections) * 100),
    status: connectionPool.activeConnections < connectionPool.maxConnections * 0.8 ? 'healthy' : 'high_load'
  }
}

/**
 * Graceful shutdown - cleanup all connections
 */
export const shutdownConnections = () => {
  logInfo('Shutting down all Supabase connections')
  
  supabaseInstance = null
  supabaseServerInstance = null
  connectionPool.activeConnections = 0
  connectionPool.connectionQueue = []
  
  logInfo('All Supabase connections shut down successfully')
}

// Register shutdown handler
const memoryOptimizer = getMemoryOptimizer()
memoryOptimizer.registerCleanup('supabase-connections', shutdownConnections)

export default getSupabaseClient