/**
 * Higher-order function to add Redis-based rate limiting to API routes
 * Usage: export default withRateLimit(handler, options)
 */

import { rateLimitMiddleware } from '../middleware/redis-rate-limiter.js'
import { logError } from './production-logger.js'

/**
 * Apply rate limiting to an API route handler
 * @param {Function} handler - The API route handler function
 * @param {Object} options - Rate limiting configuration options
 * @returns {Function} - The wrapped handler with rate limiting
 */
export function withRateLimit(handler, options = {}) {
  return async (req, res) => {
    try {
      // Apply rate limiting middleware
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

      // Rate limit passed, continue with the original handler
      return await handler(req, res)

    } catch (error) {
      logError('Rate limiting wrapper error', {
        error: error.message,
        path: req.url,
        method: req.method
      })

      // On error, allow the request but log the issue
      return await handler(req, res)
    }
  }
}

/**
 * Apply rate limiting with custom configuration
 * @param {Function} handler - The API route handler function
 * @param {Object} rateLimitConfig - Custom rate limit configuration
 * @returns {Function} - The wrapped handler with custom rate limiting
 */
export function withCustomRateLimit(handler, rateLimitConfig) {
  return async (req, res) => {
    try {
      // Create custom rate limiter with specific config
      const { createRateLimiter } = await import('../middleware/redis-rate-limiter.js')
      const customRateLimiter = createRateLimiter(rateLimitConfig)

      // Apply custom rate limiting
      await new Promise((resolve, reject) => {
        customRateLimiter(req, res, (error) => {
          if (error) {
            reject(error)
          } else {
            if (res.headersSent) {
              return
            }
            resolve()
          }
        })
      })

      if (res.headersSent) {
        return
      }

      return await handler(req, res)

    } catch (error) {
      logError('Custom rate limiting wrapper error', {
        error: error.message,
        path: req.url,
        method: req.method
      })

      return await handler(req, res)
    }
  }
}

/**
 * Predefined rate limiting configurations for different API types
 */
export const rateLimitConfigs = {
  // High-cost intelligence APIs
  intelligence: {
    windowMs: 900000, // 15 minutes
    maxRequests: 25,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    description: 'Intelligence API rate limiting'
  },

  // Volatile data APIs that make external calls
  volatile: {
    windowMs: 3600000, // 1 hour
    maxRequests: 15,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    description: 'Volatile data API rate limiting'
  },

  // General API endpoints
  general: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    description: 'General API rate limiting'
  },

  // Authentication endpoints
  auth: {
    windowMs: 900000, // 15 minutes
    maxRequests: 10,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    description: 'Authentication rate limiting'
  },

  // Testing endpoints
  test: {
    windowMs: 300000, // 5 minutes
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    description: 'Testing endpoint rate limiting'
  }
}

/**
 * Convenience functions for common rate limiting scenarios
 */
export const withIntelligenceRateLimit = (handler) => 
  withCustomRateLimit(handler, rateLimitConfigs.intelligence)

export const withVolatileRateLimit = (handler) => 
  withCustomRateLimit(handler, rateLimitConfigs.volatile)

export const withGeneralRateLimit = (handler) => 
  withCustomRateLimit(handler, rateLimitConfigs.general)

export const withAuthRateLimit = (handler) => 
  withCustomRateLimit(handler, rateLimitConfigs.auth)

export const withTestRateLimit = (handler) => 
  withCustomRateLimit(handler, rateLimitConfigs.test)