/**
 * UNIFIED STATUS & HEALTH API ENDPOINT
 * Consolidates: status.js + health.js
 * Provides comprehensive system health and configuration status
 * Supports both detailed status and lightweight health checks
 */

import { applySecurityHeaders, SecurityValidator } from '../../lib/security.js'
import { trackAPICall, getHealthMetrics } from '../../lib/monitoring.js'
import { logInfo, logError } from '../../lib/production-logger.js'
import { testSupabaseConnection } from '../../lib/supabase-client.js'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  try {
    // Apply security headers
    applySecurityHeaders(res)
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      const duration = Date.now() - startTime
      trackAPICall(req.method, '/api/status', duration, 405)
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only GET requests are supported'
      })
    }
    
    // Check for lightweight health mode (from health.js functionality)
    const isSimpleHealthCheck = req.query.simple === 'true' || req.query.health === 'true'
    
    if (isSimpleHealthCheck) {
      logInfo('Simple health check initiated')
      
      // Basic application health
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'unknown'
      }

      // Test database connectivity
      let databaseStatus = 'disconnected'
      try {
        const dbConnected = await testSupabaseConnection()
        databaseStatus = dbConnected ? 'connected' : 'disconnected'
        
        if (!dbConnected) {
          health.status = 'unhealthy'
          health.issues = ['database_disconnected']
        }
      } catch (error) {
        health.status = 'unhealthy'
        health.issues = ['database_error']
        logError('Database health check failed', { error: error.message })
      }

      // Add basic resource usage
      const memUsage = process.memoryUsage()
      health.database = databaseStatus
      health.memory_mb = Math.round(memUsage.rss / 1024 / 1024)
      health.response_time_ms = Date.now() - startTime

      const duration = Date.now() - startTime
      trackAPICall(req.method, '/api/status?simple=true', duration, 200)
      
      return res.status(200).json(health)
    }

    // logInfo('API Status check initiated', {
    //   ip: SecurityValidator.getClientIP(req),
    //   userAgent: req.headers['user-agent']?.substring(0, 50)
    // })

    // Get system health metrics
    const healthMetrics = getHealthMetrics()
    
    // Test database connectivity
    let databaseStatus = 'unknown'
    try {
      const dbConnected = await testSupabaseConnection()
      databaseStatus = dbConnected ? 'connected' : 'disconnected'
    } catch (error) {
      databaseStatus = 'error'
      console.error('Database status check failed:', error.message)
    }

    // Check API configuration (without exposing keys)
    const apiStatus = {
      comtrade: {
        configured: !!process.env.COMTRADE_API_KEY,
        status: process.env.COMTRADE_API_KEY ? 'ready' : 'not_configured'
      },
      shippo: {
        configured: !!process.env.SHIPPO_API_KEY,
        status: process.env.SHIPPO_API_KEY ? 'ready' : 'not_configured'
      },
      anthropic: {
        configured: !!process.env.ANTHROPIC_API_KEY,
        status: process.env.ANTHROPIC_API_KEY ? 'ready' : 'not_configured'
      },
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        status: process.env.STRIPE_SECRET_KEY ? 'ready' : 'not_configured'
      }
    }

    // Build status response
    const status = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      uptime: healthMetrics.uptime,
      system: {
        database: databaseStatus,
        memory: healthMetrics.memory,
        requests: healthMetrics.requests,
        alerts: healthMetrics.activeAlerts
      },
      apis: apiStatus,
      features: {
        monitoring: 'enabled',
        security: 'enabled',
        caching: 'enabled',
        logging: 'enabled'
      }
    }

    // Determine overall status
    const hasErrors = databaseStatus === 'error' || 
                     healthMetrics.requests.errorRate > 10 ||
                     !process.env.ANTHROPIC_API_KEY ||
                     !process.env.COMTRADE_API_KEY

    if (hasErrors) {
      status.status = 'degraded'
    }

    const duration = Date.now() - startTime
    const statusCode = hasErrors ? 200 : 200 // Always return 200 for status endpoint
    
    trackAPICall('GET', '/api/status', duration, statusCode)
    
    // logInfo('API Status check completed', {
    //   status: status.status,
    //   responseTime: `${duration}ms`,
    //   database: databaseStatus
    // })

    res.status(statusCode).json(status)

  } catch (error) {
    const duration = Date.now() - startTime
    
    logError('API Status endpoint error', {
      error: error.message,
      stack: error.stack,
      responseTime: `${duration}ms`,
      ip: SecurityValidator.getClientIP(req)
    })

    trackAPICall('GET', '/api/status', duration, 500, error)

    // Don't expose internal error details
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Unable to retrieve system status'
    })
  }
}