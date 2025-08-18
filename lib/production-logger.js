/**
 * Production-Safe Logging System
 * Handles logging with environment awareness and security
 */

import { isDevelopment, isProduction } from './environment-validation.js'

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
}

class ProductionLogger {
  constructor() {
    this.level = isProduction() ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG
    this.sensitivePatterns = [
      /sk-[a-zA-Z0-9_-]+/, // API keys starting with sk-
      /pk_[a-zA-Z0-9_-]+/, // Stripe public keys
      /eyJ[a-zA-Z0-9_-]+/, // JWT tokens
      /password/i,
      /secret/i,
      /token/i,
      /key.*=.*[a-zA-Z0-9_-]{20,}/ // Key-value pairs with long values
    ]
  }

  /**
   * Sanitize sensitive data from logs
   */
  sanitize(data) {
    if (typeof data === 'string') {
      let sanitized = data
      this.sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]')
      })
      return sanitized
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = Array.isArray(data) ? [] : {}
      
      for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase()
        
        if (keyLower.includes('password') || 
            keyLower.includes('secret') || 
            keyLower.includes('token') ||
            keyLower.includes('key')) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitize(value)
        }
      }
      
      return sanitized
    }

    return data
  }

  /**
   * Format log message
   */
  formatMessage(level, message, data, metadata) {
    const timestamp = new Date().toISOString()
    const sanitizedData = data ? this.sanitize(data) : null
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...(sanitizedData && { data: sanitizedData }),
      ...(metadata && { metadata })
    }

    return isProduction() ? JSON.stringify(logEntry) : logEntry
  }

  /**
   * Log error messages
   */
  error(message, data = null, metadata = null) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const formatted = this.formatMessage('ERROR', message, data, metadata)
      console.error(isProduction() ? formatted : '❌', isProduction() ? '' : message, isProduction() ? '' : this.sanitize(data))
    }
  }

  /**
   * Log warning messages
   */
  warn(message, data = null, metadata = null) {
    if (this.level >= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage('WARN', message, data, metadata)
      console.warn(isProduction() ? formatted : '⚠️', isProduction() ? '' : message, isProduction() ? '' : this.sanitize(data))
    }
  }

  /**
   * Log info messages
   */
  info(message, data = null, metadata = null) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage('INFO', message, data, metadata)
      console.log(isProduction() ? formatted : 'ℹ️', isProduction() ? '' : message, isProduction() ? '' : this.sanitize(data))
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message, data = null, metadata = null) {
    if (this.level >= LOG_LEVELS.DEBUG && isDevelopment()) {
      const formatted = this.formatMessage('DEBUG', message, data, metadata)
      console.log(isProduction() ? formatted : '🐛', isProduction() ? '' : message, isProduction() ? '' : this.sanitize(data))
    }
  }

  /**
   * Log trace messages (only in development)
   */
  trace(message, data = null, metadata = null) {
    if (this.level >= LOG_LEVELS.TRACE && isDevelopment()) {
      const formatted = this.formatMessage('TRACE', message, data, metadata)
      console.log(isProduction() ? formatted : '🔍', isProduction() ? '' : message, isProduction() ? '' : this.sanitize(data))
    }
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, metadata = null) {
    this.info(`Performance: ${operation}`, { duration: `${duration}ms` }, metadata)
  }

  /**
   * Log API calls
   */
  apiCall(method, endpoint, duration, status) {
    this.info(`API: ${method} ${endpoint}`, {
      duration: `${duration}ms`,
      status,
      type: 'api_call'
    })
  }

  /**
   * Log database queries
   */
  dbQuery(table, operation, duration, recordCount = null) {
    this.debug(`DB: ${operation} on ${table}`, {
      duration: `${duration}ms`,
      recordCount,
      type: 'db_query'
    })
  }

  /**
   * Log security events
   */
  security(event, details = null) {
    this.warn(`Security: ${event}`, details, { type: 'security_event' })
  }

  /**
   * Log business events
   */
  business(event, details = null) {
    this.info(`Business: ${event}`, details, { type: 'business_event' })
  }
}

// Create singleton instance
export const logger = new ProductionLogger()

// Convenience functions for common use cases
export const logError = (message, data, metadata) => logger.error(message, data, metadata)
export const logWarn = (message, data, metadata) => logger.warn(message, data, metadata)
export const logInfo = (message, data, metadata) => logger.info(message, data, metadata)
export const logDebug = (message, data, metadata) => logger.debug(message, data, metadata)
export const logPerformance = (operation, duration, metadata) => logger.performance(operation, duration, metadata)
export const logAPICall = (method, endpoint, duration, status) => logger.apiCall(method, endpoint, duration, status)
export const logDBQuery = (table, operation, duration, recordCount) => logger.dbQuery(table, operation, duration, recordCount)
export const logSecurity = (event, details) => logger.security(event, details)
export const logBusiness = (event, details) => logger.business(event, details)

export default logger