/**
 * Monitoring and Error Tracking System
 * Production-ready monitoring infrastructure
 */

import { logger } from './production-logger.js'
import { isProduction, isDevelopment } from './environment-validation.js'

class MonitoringSystem {
  constructor() {
    this.metrics = new Map()
    this.alerts = new Map()
    this.startTime = Date.now()
    this.errorCount = 0
    this.requestCount = 0
    
    // Initialize performance tracking
    this.initializePerformanceTracking()
  }

  /**
   * Initialize performance monitoring
   */
  initializePerformanceTracking() {
    if (typeof window !== 'undefined' && window.performance) {
      // Client-side performance monitoring
      this.trackWebVitals()
    }
    
    // Server-side process monitoring
    process.on('uncaughtException', (error) => {
      this.trackError('uncaught_exception', error)
      process.exit(1)
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      this.trackError('unhandled_rejection', reason)
    })
  }

  /**
   * Track Web Vitals for client performance
   */
  trackWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint (LCP)
    this.observePerformance('largest-contentful-paint', (entry) => {
      this.trackMetric('web_vitals.lcp', entry.value, {
        url: window.location.pathname,
        timestamp: Date.now()
      })
    })

    // First Input Delay (FID)
    this.observePerformance('first-input', (entry) => {
      this.trackMetric('web_vitals.fid', entry.processingStart - entry.startTime, {
        url: window.location.pathname,
        timestamp: Date.now()
      })
    })

    // Cumulative Layout Shift (CLS)
    this.observePerformance('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.trackMetric('web_vitals.cls', entry.value, {
          url: window.location.pathname,
          timestamp: Date.now()
        })
      }
    })
  }

  /**
   * Observe performance entries
   */
  observePerformance(entryType, callback) {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback)
      })
      observer.observe({ entryTypes: [entryType] })
    }
  }

  /**
   * Track custom metrics
   */
  trackMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    }

    this.metrics.set(`${name}_${Date.now()}`, metric)
    
    logger.info(`Metric: ${name}`, { value, metadata })

    // Send to external monitoring service in production
    if (isProduction()) {
      this.sendToMonitoringService('metric', metric)
    }
  }

  /**
   * Track errors with context
   */
  trackError(type, error, context = {}) {
    this.errorCount++
    
    const errorData = {
      type,
      message: error.message || error,
      stack: error.stack,
      timestamp: Date.now(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : context.url || 'Unknown'
    }

    logger.error(`Error tracked: ${type}`, errorData)

    // Send to error tracking service
    if (isProduction()) {
      this.sendToErrorTracking(errorData)
    }

    // Create alert for critical errors
    if (this.isCriticalError(error)) {
      this.createAlert('critical_error', `Critical error: ${error.message}`, errorData)
    }
  }

  /**
   * Track API performance
   */
  trackAPICall(method, endpoint, duration, statusCode, error = null) {
    this.requestCount++
    
    const apiMetric = {
      method,
      endpoint,
      duration,
      statusCode,
      timestamp: Date.now(),
      success: !error && statusCode < 400,
      error: error ? error.message : null
    }

    this.trackMetric('api.request', duration, apiMetric)

    if (error) {
      this.trackError('api_error', error, apiMetric)
    }

    // Alert on high latency
    if (duration > 5000) {
      this.createAlert('high_latency', `Slow API call: ${method} ${endpoint}`, apiMetric)
    }

    // Alert on high error rate
    this.checkErrorRate()
  }

  /**
   * Track database operations
   */
  trackDatabaseOperation(table, operation, duration, recordCount = null, error = null) {
    const dbMetric = {
      table,
      operation,
      duration,
      recordCount,
      timestamp: Date.now(),
      success: !error
    }

    this.trackMetric('db.query', duration, dbMetric)

    if (error) {
      this.trackError('database_error', error, dbMetric)
    }

    // Alert on slow queries
    if (duration > 1000) {
      this.createAlert('slow_query', `Slow database query: ${operation} on ${table}`, dbMetric)
    }
  }

  /**
   * Track business events
   */
  trackBusinessEvent(event, data = {}) {
    const businessEvent = {
      event,
      data,
      timestamp: Date.now(),
      session: this.getSessionId()
    }

    logger.business(event, businessEvent)

    if (isProduction()) {
      this.sendToAnalytics(businessEvent)
    }
  }

  /**
   * Create monitoring alerts
   */
  createAlert(type, message, data = {}) {
    const alert = {
      type,
      message,
      data,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type),
      acknowledged: false
    }

    this.alerts.set(`${type}_${Date.now()}`, alert)
    
    logger.warn(`Alert created: ${type}`, alert)

    // Send to alerting system
    if (isProduction()) {
      this.sendAlert(alert)
    }
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics() {
    const uptime = Date.now() - this.startTime
    const memoryUsage = process.memoryUsage()
    
    return {
      uptime: Math.floor(uptime / 1000), // seconds
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      activeAlerts: Array.from(this.alerts.values()).filter(alert => !alert.acknowledged).length,
      metricsCollected: this.metrics.size
    }
  }

  /**
   * Check error rate and create alerts
   */
  checkErrorRate() {
    if (this.requestCount > 100) { // Only check after minimum requests
      const errorRate = (this.errorCount / this.requestCount) * 100
      
      if (errorRate > 5) { // 5% error rate threshold
        this.createAlert('high_error_rate', `Error rate is ${errorRate.toFixed(2)}%`, {
          errorRate,
          totalRequests: this.requestCount,
          totalErrors: this.errorCount
        })
      }
    }
  }

  /**
   * Determine if error is critical
   */
  isCriticalError(error) {
    const criticalPatterns = [
      /database.*connection/i,
      /payment.*failed/i,
      /authentication.*failed/i,
      /security.*violation/i,
      /server.*error/i
    ]

    const errorMessage = error.message || error.toString()
    return criticalPatterns.some(pattern => pattern.test(errorMessage))
  }

  /**
   * Get alert severity level
   */
  getAlertSeverity(type) {
    const severityMap = {
      critical_error: 'critical',
      high_error_rate: 'high',
      high_latency: 'medium',
      slow_query: 'medium',
      security_violation: 'critical',
      payment_failure: 'critical'
    }

    return severityMap[type] || 'low'
  }

  /**
   * Get session identifier
   */
  getSessionId() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = window.sessionStorage.getItem('monitoring_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        window.sessionStorage.setItem('monitoring_session_id', sessionId)
      }
      return sessionId
    }
    return `server_${Date.now()}`
  }

  /**
   * Send data to external monitoring service
   */
  async sendToMonitoringService(type, data) {
    try {
      // Example integration with monitoring service
      if (process.env.MONITORING_ENDPOINT) {
        await fetch(process.env.MONITORING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
          },
          body: JSON.stringify({ type, data, source: 'triangle-intelligence' })
        })
      }
    } catch (error) {
      logger.error('Failed to send monitoring data', { error: error.message, type, data })
    }
  }

  /**
   * Send error to tracking service
   */
  async sendToErrorTracking(errorData) {
    try {
      // Example Sentry integration
      if (process.env.SENTRY_DSN) {
        // Sentry.captureException would go here
        logger.debug('Would send to Sentry', { error: errorData })
      }
    } catch (error) {
      logger.error('Failed to send error tracking data', { error: error.message, errorData })
    }
  }

  /**
   * Send business event to analytics
   */
  async sendToAnalytics(event) {
    try {
      // Example analytics integration
      if (process.env.ANALYTICS_ENDPOINT) {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
          },
          body: JSON.stringify(event)
        })
      }
    } catch (error) {
      logger.error('Failed to send analytics data', { error: error.message, event })
    }
  }

  /**
   * Send alert notification
   */
  async sendAlert(alert) {
    try {
      // Example alert notification (Slack, PagerDuty, etc.)
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Triangle Intelligence Alert: ${alert.message}`,
            severity: alert.severity,
            timestamp: new Date(alert.timestamp).toISOString(),
            data: alert.data
          })
        })
      }
    } catch (error) {
      logger.error('Failed to send alert', { error: error.message, alert })
    }
  }
}

// Create singleton monitoring instance
export const monitoring = new MonitoringSystem()

// Convenience functions
export const trackMetric = (name, value, metadata) => monitoring.trackMetric(name, value, metadata)
export const trackError = (type, error, context) => monitoring.trackError(type, error, context)
export const trackAPICall = (method, endpoint, duration, statusCode, error) => 
  monitoring.trackAPICall(method, endpoint, duration, statusCode, error)
export const trackDatabaseOperation = (table, operation, duration, recordCount, error) =>
  monitoring.trackDatabaseOperation(table, operation, duration, recordCount, error)
export const trackBusinessEvent = (event, data) => monitoring.trackBusinessEvent(event, data)
export const createAlert = (type, message, data) => monitoring.createAlert(type, message, data)
export const getHealthMetrics = () => monitoring.getHealthMetrics()

export default monitoring