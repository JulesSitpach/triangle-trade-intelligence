/**
 * RSS Trigger Test Endpoint
 * Manual testing endpoint for RSS-driven Comtrade API system
 * Usage: GET /api/rss-trigger-test
 */

import RSSTrigger from '../../lib/background-services/rss-comtrade-trigger.js'
import { logInfo } from '../../lib/utils/production-logger.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    logInfo('RSS_TEST: Manual RSS trigger test initiated')
    
    // Test RSS feed processing
    const result = await RSSTrigger.processAlerts()
    
    // Test health check
    const healthStatus = await RSSTrigger.healthCheck()
    
    return res.status(200).json({
      success: true,
      test: 'manual_rss_trigger',
      timestamp: new Date().toISOString(),
      
      // RSS processing results
      processing: {
        alertsProcessed: result.alertsProcessed,
        apiCallsTriggered: result.apiCallsTriggered,
        triggeredUpdates: result.triggeredUpdates,
        processingTime: result.processingTime,
        message: result.message
      },
      
      // System health
      health: healthStatus,
      
      // Implementation status
      implementation: {
        rssTriggerClass: 'Active',
        volatileDataManager: 'Enhanced with event-driven logic',
        cronEndpoint: 'Created at /api/cron/rss-monitor',
        cacheStrategy: 'Event-driven TTL (30min urgent, 1hr moderate, 4hr standard)',
        apiOptimization: 'Only calls Comtrade API when RSS alerts justify it'
      },
      
      // Next steps
      nextSteps: [
        'Add CRON_SECRET to environment variables',
        'Deploy to Vercel with cron configuration',
        'Monitor RSS feeds every 15 minutes automatically',
        'API calls will only trigger on relevant trade policy changes'
      ]
    })
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      test: 'manual_rss_trigger',
      timestamp: new Date().toISOString()
    })
  }
}