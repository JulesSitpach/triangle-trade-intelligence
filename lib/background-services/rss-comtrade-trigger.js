/**
 * RSS-Driven Comtrade API Trigger
 * Only calls Comtrade API when RSS feeds detect relevant trade policy changes
 * Non-disruptive enhancement to existing VolatileDataManager
 */

import tradeMonitor from '../trade-alert-monitor.js'
import { VolatileDataManager } from '../intelligence/database-intelligence-bridge.js'
import { logInfo, logError, logAPICall } from '../utils/production-logger.js'

export class RSSTrigger {
  
  /**
   * Main processing function - checks RSS feeds and triggers API calls when needed
   */
  static async processAlerts() {
    const startTime = Date.now()
    logInfo('RSS_TRIGGER: Starting event-driven monitoring')
    
    try {
      // Use existing trade monitor to check all government RSS feeds
      const alerts = await tradeMonitor.checkAllFeeds()
      
      if (alerts.length === 0) {
        logInfo('RSS_TRIGGER: No relevant alerts detected, no API calls needed')
        return {
          success: true,
          alertsProcessed: 0,
          apiCallsTriggered: 0,
          message: 'No actionable trade policy changes detected'
        }
      }
      
      logInfo(`RSS_TRIGGER: Found ${alerts.length} relevant alerts, analyzing for API triggers`)
      
      let apiCallsTriggered = 0
      const triggeredUpdates = []
      
      // Process each alert and determine if Comtrade API call is justified
      for (const alert of alerts) {
        const shouldTriggerAPI = this.shouldTriggerComtradeAPI(alert)
        
        if (shouldTriggerAPI.trigger) {
          logInfo(`RSS_TRIGGER: Triggering API call for alert: ${alert.title}`, {
            reason: shouldTriggerAPI.reason,
            countries: alert.detected.countries,
            urgencyScore: alert.urgencyScore
          })
          
          const updateResult = await this.triggerComtradeUpdate(alert)
          if (updateResult.success) {
            apiCallsTriggered++
            triggeredUpdates.push({
              alertTitle: alert.title.substring(0, 100),
              countries: alert.detected.countries,
              reason: shouldTriggerAPI.reason,
              dataUpdated: updateResult.dataUpdated
            })
          }
        } else {
          logInfo(`RSS_TRIGGER: Skipping API call for alert: ${alert.title}`, {
            reason: shouldTriggerAPI.reason,
            relevanceScore: alert.relevanceScore
          })
        }
      }
      
      const duration = Date.now() - startTime
      logAPICall('BACKGROUND', 'RSS_MONITORING', duration, 'success')
      
      return {
        success: true,
        alertsProcessed: alerts.length,
        apiCallsTriggered,
        triggeredUpdates,
        processingTime: `${duration}ms`,
        message: `Processed ${alerts.length} alerts, triggered ${apiCallsTriggered} API calls`
      }
      
    } catch (error) {
      logError('RSS_TRIGGER: Processing failed', { error: error.message })
      throw error
    }
  }
  
  /**
   * Determine if an RSS alert justifies a Comtrade API call
   */
  static shouldTriggerComtradeAPI(alert) {
    // High relevance threshold - only trigger for significant trade policy changes
    if (alert.relevanceScore < 40) {
      return { 
        trigger: false, 
        reason: `Low relevance score: ${alert.relevanceScore} < 40` 
      }
    }
    
    // Must mention specific countries we track
    const trackedCountries = ['China', 'India', 'Vietnam', 'Mexico', 'Canada']
    const mentionedTrackedCountries = alert.detected.countries.filter(country => 
      trackedCountries.some(tracked => 
        tracked.toLowerCase() === country.toLowerCase()
      )
    )
    
    if (mentionedTrackedCountries.length === 0) {
      return { 
        trigger: false, 
        reason: 'No tracked countries mentioned' 
      }
    }
    
    // High urgency or tariff rate changes always trigger
    if (alert.urgencyScore > 30) {
      return { 
        trigger: true, 
        reason: `High urgency: ${alert.urgencyScore} > 30` 
      }
    }
    
    // Tariff rate changes (percentages detected) always trigger
    if (alert.detected.tariffRates && alert.detected.tariffRates.length > 0) {
      return { 
        trigger: true, 
        reason: `Tariff rates detected: ${alert.detected.tariffRates.join(', ')}` 
      }
    }
    
    // HS code mentions with moderate relevance trigger
    if (alert.detected.hsCodes && alert.detected.hsCodes.length > 0 && alert.relevanceScore > 50) {
      return { 
        trigger: true, 
        reason: `HS codes + high relevance: ${alert.detected.hsCodes.join(', ')}` 
      }
    }
    
    // White House or USTR sources with moderate relevance trigger (official announcements)
    if ((alert.sourceName.includes('White House') || alert.sourceName.includes('Trade Representative')) 
        && alert.relevanceScore > 35) {
      return { 
        trigger: true, 
        reason: 'Official government source with trade relevance' 
      }
    }
    
    return { 
      trigger: false, 
      reason: 'Does not meet API trigger criteria' 
    }
  }
  
  /**
   * Trigger Comtrade API update for specific alert
   */
  static async triggerComtradeUpdate(alert) {
    try {
      const countries = alert.detected.countries
      const hsCodes = alert.detected.hsCodes || []
      const primaryCountry = countries[0]
      const primaryHSCode = hsCodes[0] || 'TOTAL'
      
      logInfo(`RSS_TRIGGER: Calling Comtrade API`, {
        country: primaryCountry,
        hsCode: primaryHSCode,
        alertSource: alert.sourceName
      })
      
      // Use existing VolatileDataManager with event-driven context
      const freshData = await VolatileDataManager.getOrFetchAPIData('comtrade', {
        country: primaryCountry,
        hsCode: primaryHSCode,
        trigger: 'RSS_ALERT',
        urgency: alert.urgencyScore,
        source: alert.sourceName,
        alertUrl: alert.link
      })
      
      // Create market alert entry for this update
      await VolatileDataManager.updateMarketAlerts({
        type: 'RSS_TRIGGERED_UPDATE',
        country: primaryCountry,
        rate: this.extractEffectiveRate(freshData.data),
        previousRate: null, // Could be enhanced to track previous rates
        change: 'RSS_DETECTED_CHANGE',
        message: `Trade policy change detected: ${alert.title.substring(0, 200)}`,
        source: alert.sourceName,
        alertUrl: alert.link,
        hsCode: primaryHSCode,
        urgencyScore: alert.urgencyScore
      })
      
      logInfo(`RSS_TRIGGER: Successfully updated data for ${primaryCountry}`, {
        apiCallMade: freshData.apiCallMade,
        cached: !freshData.apiCallMade
      })
      
      return {
        success: true,
        dataUpdated: true,
        country: primaryCountry,
        hsCode: primaryHSCode,
        apiCallMade: freshData.apiCallMade,
        effectiveRate: this.extractEffectiveRate(freshData.data)
      }
      
    } catch (error) {
      logError(`RSS_TRIGGER: Failed to update data for alert: ${alert.title}`, {
        error: error.message,
        countries: alert.detected.countries
      })
      
      return {
        success: false,
        error: error.message,
        dataUpdated: false
      }
    }
  }
  
  /**
   * Extract effective tariff rate from Comtrade API response
   */
  static extractEffectiveRate(comtradeData) {
    if (!comtradeData || !comtradeData.records) {
      return null
    }
    
    // Try to calculate weighted average tariff from trade data
    const records = comtradeData.records
    if (records.length === 0) {
      return null
    }
    
    const totalValue = records.reduce((sum, record) => sum + (record.tradeValue || 0), 0)
    if (totalValue === 0) {
      return null
    }
    
    // Simple average if we can't calculate weighted
    const avgTariff = records.reduce((sum, record) => {
      return sum + (record.estimatedTariffRate || record.standardRate || 15)
    }, 0) / records.length
    
    return Math.round(avgTariff * 100) / 100 // Round to 2 decimal places
  }
  
  /**
   * Health check for RSS monitoring system
   */
  static async healthCheck() {
    try {
      // Test RSS feed connectivity
      const testFeed = await tradeMonitor.fetchFeed('ustr')
      const rssHealthy = testFeed !== null
      
      // Test database connectivity (via VolatileDataManager)
      const dbHealthy = await this.testDatabaseConnection()
      
      return {
        status: rssHealthy && dbHealthy ? 'healthy' : 'degraded',
        rssFeeds: rssHealthy ? 'connected' : 'failed',
        database: dbHealthy ? 'connected' : 'failed',
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  /**
   * Test database connection
   */
  static async testDatabaseConnection() {
    try {
      // Try to read from api_cache table to test VolatileDataManager connectivity
      const testResult = await VolatileDataManager.getOrFetchAPIData('test_connection', {
        skipCache: true,
        test: true
      })
      return true
    } catch (error) {
      logError('RSS_TRIGGER: Database connection test failed', { error: error.message })
      return false
    }
  }
}

// Export for use in cron jobs and manual triggers
export default RSSTrigger