/**
 * RSS Monitor Cron Job - Background Trade Alert Processing
 * 
 * This endpoint runs in the background (via Vercel Cron Jobs) to:
 * 1. Monitor government RSS feeds for trade policy changes
 * 2. Trigger Comtrade API calls only when relevant alerts are detected
 * 3. Update market alerts and cache with fresh data
 * 
 * Schedule: Every 15 minutes for high-priority feeds
 * URL: GET /api/cron/rss-monitor
 * Auth: Requires CRON_SECRET header for security
 */

import { logInfo, logError, logAPICall } from '../../../lib/utils/production-logger.js'
import { RSSTrigger } from '../../../lib/background-services/rss-comtrade-trigger.js'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  // Security: Verify this is a legitimate cron job call
  const authHeader = req.headers.authorization
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  
  if (!authHeader || authHeader !== expectedAuth) {
    logError('RSS_CRON: Unauthorized access attempt', {
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    })
    
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid CRON_SECRET required'
    })
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET']
    })
  }
  
  try {
    logInfo('RSS_CRON: Starting background RSS monitoring job')
    
    // Use actual RSS processing
    const result = await RSSTrigger.processAlerts()
    
    if (!result) {
      throw new Error('RSS processing returned null result')
    }
    
    const duration = Date.now() - startTime
    logAPICall('CRON', 'RSS_MONITOR', duration, 'success')
    
    // Log successful execution
    logInfo('RSS_CRON: Job completed successfully', {
      alertsProcessed: result.alertsProcessed,
      apiCallsTriggered: result.apiCallsTriggered,
      processingTime: result.processingTime,
      duration: `${duration}ms`
    })
    
    // Return success response for cron job monitoring
    return res.status(200).json({
      success: result.success || true,
      jobType: 'RSS_MONITOR',
      timestamp: new Date().toISOString(),
      execution: {
        duration: `${duration}ms`,
        alertsProcessed: result.alertsProcessed || 0,
        apiCallsTriggered: result.apiCallsTriggered || 0,
        triggeredUpdates: result.triggeredUpdates || [],
        processingTime: result.processingTime || `${duration}ms`
      },
      message: result.message || 'RSS monitoring completed',
      nextRun: 'In 15 minutes',
      health: await RSSTrigger.healthCheck()
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    logError('RSS_CRON: Job execution failed', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    })
    
    logAPICall('CRON', 'RSS_MONITOR', duration, 'error')
    
    // Return error but with 200 status to prevent cron retry loops
    // (Vercel cron will retry 500 errors automatically)
    return res.status(200).json({
      success: false,
      jobType: 'RSS_MONITOR',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: 'EXECUTION_ERROR',
        duration: `${duration}ms`
      },
      execution: {
        alertsProcessed: 0,
        apiCallsTriggered: 0,
        triggeredUpdates: []
      },
      recovery: 'Will retry on next scheduled run'
    })
  }
}

/**
 * Configuration for Vercel Cron Jobs
 * 
 * Add to vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/rss-monitor",
 *       "schedule": "every 15 minutes"
 *     }
 *   ]
 * }
 * 
 * Required Environment Variables:
 * - CRON_SECRET: Secret token to authenticate cron calls
 * - COMTRADE_API_KEY: UN Comtrade API key for data fetching
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */