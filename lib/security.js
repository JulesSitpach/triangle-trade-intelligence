/**
 * Security Utilities and Input Validation
 * Production-ready security implementation
 */

import { logSecurity, logError } from './production-logger.js'
import { createAlert } from './monitoring.js'

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
   * Rate limiting check
   */
  static checkRateLimit(identifier, maxRequests = 100, timeWindow = 3600000) {
    // This would integrate with Redis in production
    // For now, using memory-based rate limiting
    
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map()
    }
    
    const now = Date.now()
    const windowStart = now - timeWindow
    
    // Clean old entries
    for (const [key, timestamps] of this.rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart)
      if (validTimestamps.length === 0) {
        this.rateLimitStore.delete(key)
      } else {
        this.rateLimitStore.set(key, validTimestamps)
      }
    }
    
    // Check current identifier
    const timestamps = this.rateLimitStore.get(identifier) || []
    const recentRequests = timestamps.filter(t => t > windowStart)
    
    if (recentRequests.length >= maxRequests) {
      logSecurity('rate_limit_exceeded', {
        identifier,
        requests: recentRequests.length,
        timeWindow: timeWindow / 1000
      })
      return false
    }
    
    // Add current request
    recentRequests.push(now)
    this.rateLimitStore.set(identifier, recentRequests)
    
    return true
  }
}

/**
 * API Security Middleware
 */
export function createSecurityMiddleware(options = {}) {
  const {
    maxRequests = 100,
    timeWindow = 3600000, // 1 hour
    requiredFields = [],
    validateInput = true
  } = options

  return async (req, res, next) => {
    const startTime = Date.now()
    
    try {
      // Get client identifier for rate limiting
      const clientIP = SecurityValidator.getClientIP(req)
      const userAgent = req.headers['user-agent'] || 'unknown'
      const identifier = `${clientIP}_${userAgent.substring(0, 50)}`
      
      // Rate limiting
      if (!SecurityValidator.checkRateLimit(identifier, maxRequests, timeWindow)) {
        logSecurity('rate_limit_violation', { identifier, ip: clientIP })
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.'
        })
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