/**
 * Redis-Based Rate Limiter Middleware
 * Scalable, distributed rate limiting with intelligent fallback
 */

import { getRedisClient, shouldUseFallbackMode } from '../redis-client.js'
import { logInfo, logError, logWarn, logDebug } from '../utils/production-logger.js'
import { SecurityValidator } from '../security.js'

/**
 * Rate limiting configurations for different endpoint types
 */
const RATE_LIMIT_CONFIGS = {
  // API endpoints by category
  'api_general': {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    description: 'General API endpoints'
  },
  
  'api_intelligence': {
    windowMs: 900000, // 15 minutes
    maxRequests: 50,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    description: 'Intelligence APIs (more expensive)'
  },
  
  'api_volatile': {
    windowMs: 3600000, // 1 hour
    maxRequests: 25,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    description: 'Volatile data APIs (external API calls)'
  },
  
  'api_auth': {
    windowMs: 900000, // 15 minutes
    maxRequests: 20,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    description: 'Authentication endpoints'
  },
  
  // Page requests
  'page_requests': {
    windowMs: 300000, // 5 minutes
    maxRequests: 200,
    skipSuccessfulRequests: true,
    skipFailedRequests: true,
    description: 'Page requests'
  },
  
  // Default fallback
  'default': {
    windowMs: 900000, // 15 minutes
    maxRequests: 75,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    description: 'Default rate limiting'
  }
}

/**
 * Memory-based fallback for when Redis is unavailable
 */
class MemoryFallbackLimiter {
  constructor() {
    this.store = new Map()
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000) // 5 minutes
  }

  async checkRateLimit(identifier, config) {
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    if (!this.store.has(identifier)) {
      this.store.set(identifier, [])
    }
    
    const requests = this.store.get(identifier)
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    
    if (validRequests.length >= config.maxRequests) {
      return {
        allowed: false,
        totalHits: validRequests.length,
        remainingPoints: 0,
        msBeforeNext: config.windowMs - (now - Math.min(...validRequests)),
        fallbackMode: true
      }
    }
    
    // Add current request
    validRequests.push(now)
    this.store.set(identifier, validRequests)
    
    return {
      allowed: true,
      totalHits: validRequests.length,
      remainingPoints: config.maxRequests - validRequests.length,
      msBeforeNext: config.windowMs,
      fallbackMode: true
    }
  }
  
  cleanup() {
    const now = Date.now()
    for (const [identifier, requests] of this.store.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > now - 3600000) // Keep 1 hour
      if (validRequests.length === 0) {
        this.store.delete(identifier)
      } else {
        this.store.set(identifier, validRequests)
      }
    }
    logDebug('Memory fallback rate limiter cleanup completed', { 
      identifiers: this.store.size 
    })
  }
  
  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

const memoryFallback = new MemoryFallbackLimiter()

/**
 * Redis-based rate limiter implementation
 */
class RedisRateLimiter {
  
  /**
   * Check rate limit using Redis with sliding window algorithm
   */
  static async checkRateLimit(identifier, config) {
    try {
      const redis = await getRedisClient()
      const key = `rate_limit:${identifier}`
      const now = Date.now()
      const windowStart = now - config.windowMs
      
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline()
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart)
      
      // Count current entries
      pipeline.zcard(key)
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`)
      
      // Set expiration
      pipeline.expire(key, Math.ceil(config.windowMs / 1000))
      
      const results = await pipeline.exec()
      
      if (!results || results.some(([err]) => err)) {
        throw new Error('Redis pipeline execution failed')
      }
      
      const currentCount = results[1][1] // Count after removal, before adding new
      const allowed = currentCount < config.maxRequests
      
      if (!allowed) {
        // Remove the request we just added since it's not allowed
        await redis.zrem(key, `${now}-${Math.random()}`)
      }
      
      return {
        allowed,
        totalHits: allowed ? currentCount + 1 : currentCount,
        remainingPoints: Math.max(0, config.maxRequests - (allowed ? currentCount + 1 : currentCount)),
        msBeforeNext: allowed ? config.windowMs : await this.getTimeUntilNextAllowed(redis, key, config.windowMs),
        fallbackMode: false
      }
      
    } catch (error) {
      logWarn('Redis rate limiter failed, using memory fallback', { 
        error: error.message,
        identifier: identifier.substring(0, 20) + '...' 
      })
      
      // Fallback to memory-based rate limiting
      return await memoryFallback.checkRateLimit(identifier, config)
    }
  }
  
  /**
   * Calculate time until next request is allowed
   */
  static async getTimeUntilNextAllowed(redis, key, windowMs) {
    try {
      const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES')
      if (oldestEntry.length === 0) return 0
      
      const oldestTimestamp = parseInt(oldestEntry[1])
      const timeUntilExpiry = windowMs - (Date.now() - oldestTimestamp)
      
      return Math.max(0, timeUntilExpiry)
    } catch (error) {
      return windowMs // Conservative estimate
    }
  }
}

/**
 * Get rate limit configuration based on request path
 */
function getRateLimitConfig(req) {
  const path = req.url || req.nextUrl?.pathname || ''
  
  // API endpoints
  if (path.startsWith('/api/')) {
    if (path.includes('/intelligence/') || path.includes('/ai/')) {
      return RATE_LIMIT_CONFIGS.api_intelligence
    }
    if (path.includes('/volatile-data/') || path.includes('/external/')) {
      return RATE_LIMIT_CONFIGS.api_volatile
    }
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
      return RATE_LIMIT_CONFIGS.api_auth
    }
    return RATE_LIMIT_CONFIGS.api_general
  }
  
  // Page requests
  if (path.startsWith('/') && !path.startsWith('/api/')) {
    return RATE_LIMIT_CONFIGS.page_requests
  }
  
  return RATE_LIMIT_CONFIGS.default
}

/**
 * Generate rate limit identifier from request
 */
function getRateLimitIdentifier(req) {
  // Try multiple sources for client identification
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                  req.headers['x-real-ip'] ||
                  req.connection?.remoteAddress ||
                  req.socket?.remoteAddress ||
                  'unknown-client'
  
  const userAgent = req.headers['user-agent'] || 'unknown-agent'
  const path = req.url || req.nextUrl?.pathname || 'unknown-path'
  
  // Create composite identifier for better accuracy
  const sanitizedIP = SecurityValidator.sanitizeString(clientIP, 50)
  const sanitizedUA = SecurityValidator.sanitizeString(userAgent.substring(0, 50), 50)
  const sanitizedPath = SecurityValidator.sanitizeString(path.split('?')[0], 100) // Remove query params
  
  return `${sanitizedIP}:${sanitizedPath}:${Buffer.from(sanitizedUA).toString('base64').substring(0, 20)}`
}

/**
 * Main rate limiting middleware
 */
export async function rateLimitMiddleware(req, res, next) {
  const startTime = Date.now()
  
  try {
    // Skip rate limiting in development if desired
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
      logDebug('Rate limiting skipped for development')
      return next()
    }
    
    const config = getRateLimitConfig(req)
    const identifier = getRateLimitIdentifier(req)
    
    logDebug('Rate limiting check', {
      path: req.url,
      identifier: identifier.substring(0, 30) + '...',
      config: config.description,
      fallbackMode: shouldUseFallbackMode()
    })
    
    const result = shouldUseFallbackMode() 
      ? await memoryFallback.checkRateLimit(identifier, config)
      : await RedisRateLimiter.checkRateLimit(identifier, config)
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remainingPoints)
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toISOString())
    res.setHeader('X-RateLimit-RetryAfter', Math.ceil(result.msBeforeNext / 1000))
    res.setHeader('X-RateLimit-Policy', config.description)
    res.setHeader('X-RateLimit-Mode', result.fallbackMode ? 'memory' : 'redis')
    
    if (!result.allowed) {
      logWarn('Rate limit exceeded', {
        identifier: identifier.substring(0, 20) + '...',
        path: req.url,
        totalHits: result.totalHits,
        limit: config.maxRequests,
        retryAfter: Math.ceil(result.msBeforeNext / 1000),
        fallbackMode: result.fallbackMode
      })
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${config.maxRequests} per ${Math.round(config.windowMs / 60000)} minutes`,
        retryAfter: Math.ceil(result.msBeforeNext / 1000),
        limit: config.maxRequests,
        remaining: result.remainingPoints,
        resetTime: new Date(Date.now() + result.msBeforeNext).toISOString(),
        policy: config.description
      })
    }
    
    const duration = Date.now() - startTime
    logDebug('Rate limit check passed', {
      duration,
      remaining: result.remainingPoints,
      totalHits: result.totalHits,
      fallbackMode: result.fallbackMode
    })
    
    next()
    
  } catch (error) {
    const duration = Date.now() - startTime
    logError('Rate limiting middleware error', { 
      error: error.message,
      duration,
      fallback: 'allowing request'
    })
    
    // On error, allow the request but log the issue
    next()
  }
}

/**
 * Rate limiting middleware factory for custom configurations
 */
export function createRateLimiter(customConfig) {
  return async (req, res, next) => {
    const config = { ...RATE_LIMIT_CONFIGS.default, ...customConfig }
    const identifier = getRateLimitIdentifier(req)
    
    try {
      const result = shouldUseFallbackMode()
        ? await memoryFallback.checkRateLimit(identifier, config)
        : await RedisRateLimiter.checkRateLimit(identifier, config)
      
      res.setHeader('X-RateLimit-Limit', config.maxRequests)
      res.setHeader('X-RateLimit-Remaining', result.remainingPoints)
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toISOString())
      
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.msBeforeNext / 1000)
        })
      }
      
      next()
    } catch (error) {
      logError('Custom rate limiter error', { error: error.message })
      next() // Allow request on error
    }
  }
}

/**
 * Get rate limit status for monitoring
 */
export async function getRateLimitStatus(identifier, config = RATE_LIMIT_CONFIGS.default) {
  try {
    if (shouldUseFallbackMode()) {
      return {
        mode: 'memory',
        status: 'operational',
        note: 'Using memory fallback'
      }
    }
    
    const redis = await getRedisClient()
    const key = `rate_limit:${identifier}`
    const count = await redis.zcard(key)
    
    return {
      mode: 'redis',
      status: 'operational',
      currentCount: count,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count)
    }
  } catch (error) {
    return {
      mode: 'error',
      status: 'degraded',
      error: error.message
    }
  }
}

// Cleanup on shutdown
process.on('SIGTERM', () => memoryFallback.destroy())
process.on('SIGINT', () => memoryFallback.destroy())