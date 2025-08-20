/**
 * Security Utilities and Input Validation
 * Production-ready security implementation
 */

import { logSecurity, logError } from './utils/production-logger.js'
import { createAlert } from './monitoring.js'
import { rateLimitMiddleware, getRateLimitStatus } from './middleware/redis-rate-limiter.js'

/**
 * Input validation and sanitization utilities
 */
export class SecurityValidator {
  
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      return ''
    }
    
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
      .substring(0, maxLength)
  }

  /**
   * Validate email format
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return typeof email === 'string' && emailRegex.test(email) && email.length <= 254
  }

  /**
   * Validate business type
   */
  static validateBusinessType(businessType) {
    const validTypes = [
      'manufacturing',
      'electronics', 
      'textiles',
      'automotive',
      'medical',
      'consumer_goods',
      'industrial',
      'other'
    ]
    
    return validTypes.includes(businessType)
  }

  /**
   * Validate import volume
   */
  static validateImportVolume(volume) {
    const validVolumes = [
      'Under $500K',
      '$500K - $1M',
      '$1M - $5M', 
      '$5M - $25M',
      'Over $25M'
    ]
    
    return validVolumes.includes(volume)
  }

  /**
   * Validate HS code format
   */
  static validateHSCode(hsCode) {
    if (typeof hsCode !== 'string') return false
    
    // HS codes are typically 6-10 digits
    const hsCodeRegex = /^\d{6,10}$/
    return hsCodeRegex.test(hsCode)
  }

  /**
   * Validate company name
   */
  static validateCompanyName(name) {
    if (typeof name !== 'string') return false
    
    return name.trim().length >= 2 && 
           name.trim().length <= 100 &&
           !/<[^>]*>/g.test(name) // No HTML tags
  }

  /**
   * Validate geographic data
   */
  static validateGeography(location) {
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ]
    
    return validStates.includes(location?.state) &&
           typeof location?.city === 'string' &&
           location.city.length >= 1 &&
           location.city.length <= 50 &&
           typeof location?.zipCode === 'string' &&
           /^\d{5}(-\d{4})?$/.test(location.zipCode)
  }

  /**
   * Check for SQL injection attempts
   */
  static checkSQLInjection(input) {
    if (typeof input !== 'string') return false
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|\|\||&&)/,
      /(\bOR\b.*=.*\bOR\b|\bAND\b.*=.*\bAND\b)/i,
      /'[^']*'(\s*(=|!=|<>|<|>|\bLIKE\b)\s*'[^']*'|\s*\bIN\s*\([^)]*\))/i
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Validate API request structure
   */
  static validateAPIRequest(req, expectedFields = []) {
    const errors = []
    
    // Check required fields
    for (const field of expectedFields) {
      if (!(field in req.body)) {
        errors.push(`Missing required field: ${field}`)
      }
    }
    
    // Check for suspicious patterns in all string fields
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        if (this.checkSQLInjection(value)) {
          logSecurity('sql_injection_attempt', {
            field: key,
            value: value.substring(0, 100),
            ip: this.getClientIP(req),
            userAgent: req.headers['user-agent']
          })
          createAlert('security_violation', 'SQL injection attempt detected', { field: key })
          errors.push(`Invalid input in field: ${key}`)
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get client IP address
   */
  static getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown'
  }

  /**
   * Rate limiting check using Redis-based system
   * @deprecated - Use rateLimitMiddleware directly instead
   */
  static async checkRateLimit(identifier, maxRequests = 100, timeWindow = 3600000) {
    try {
      // Get current rate limit status using Redis system
      const config = {
        windowMs: timeWindow,
        maxRequests: maxRequests,
        description: 'Legacy API rate limit'
      }
      
      const status = await getRateLimitStatus(identifier, config)
      
      if (status.status === 'operational' && status.currentCount >= maxRequests) {
        logSecurity('rate_limit_exceeded', {
          identifier,
          requests: status.currentCount,
          timeWindow: timeWindow / 1000,
          mode: status.mode
        })
        return false
      }
      
      return true
    } catch (error) {
      logError('Rate limit check error, allowing request', { error: error.message })
      return true // Allow request on error
    }
  }
}

/**
 * API Security Middleware with Redis-based rate limiting
 */
export function createSecurityMiddleware(options = {}) {
  const {
    maxRequests = 100,
    timeWindow = 3600000, // 1 hour
    requiredFields = [],
    validateInput = true,
    useRedisRateLimit = true
  } = options

  return async (req, res, next) => {
    const startTime = Date.now()
    
    try {
      const clientIP = SecurityValidator.getClientIP(req)
      
      // Apply Redis-based rate limiting first if enabled
      if (useRedisRateLimit) {
        await new Promise((resolve, reject) => {
          rateLimitMiddleware(req, res, (error) => {
            if (error) {
              reject(error)
            } else {
              // Check if response was already sent (rate limit exceeded)
              if (res.headersSent) {
                return // Rate limit response already sent
              }
              resolve()
            }
          })
        })
        
        // If rate limit middleware sent a response, stop here
        if (res.headersSent) {
          return
        }
      }
      
      // Input validation
      if (validateInput && req.method !== 'GET') {
        const validation = SecurityValidator.validateAPIRequest(req, requiredFields)
        
        if (!validation.valid) {
          logSecurity('invalid_input', {
            errors: validation.errors,
            ip: clientIP,
            endpoint: req.url
          })
          
          return res.status(400).json({
            error: 'Invalid input',
            message: 'Request validation failed',
            details: validation.errors
          })
        }
      }
      
      // Log successful security check
      const duration = Date.now() - startTime
      logSecurity('request_validated', {
        method: req.method,
        endpoint: req.url,
        ip: clientIP,
        duration: `${duration}ms`
      })
      
      // Continue to next middleware
      if (next) {
        next()
      }
      
    } catch (error) {
      logError('Security middleware error', {
        error: error.message,
        stack: error.stack,
        ip: SecurityValidator.getClientIP(req),
        endpoint: req.url
      })
      
      return res.status(500).json({
        error: 'Internal security error',
        message: 'Request could not be validated'
      })
    }
  }
}

/**
 * Legacy security middleware (for backwards compatibility)
 */
export function createLegacySecurityMiddleware(options = {}) {
  return createSecurityMiddleware({ ...options, useRedisRateLimit: false })
}

/**
 * CORS configuration
 */
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://triangleintelligence.com', 'https://www.triangleintelligence.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}

/**
 * Security headers configuration
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ].join('; ')
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(res) {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    res.setHeader(header, value)
  })
}