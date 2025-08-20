/**
 * Redis Rate Limiting Test API
 * Tests and monitors the Redis-based rate limiting system
 */

import { checkRedisHealth } from '../../lib/redis-client.js'
import { getRateLimitStatus } from '../../lib/middleware/redis-rate-limiter.js'
import { logInfo, logPerformance } from '../../lib/utils/production-logger.js'
import { withTestRateLimit } from '../../lib/utils/with-rate-limit.js'

async function handler(req, res) {
  const startTime = Date.now()

  try {
    // Get client information for testing
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.connection?.remoteAddress ||
                     'test-client'

    const identifier = `${clientIP}:${req.url}:test`

    // Test different aspects of Redis rate limiting
    const results = {
      timestamp: new Date().toISOString(),
      client: {
        ip: clientIP,
        identifier: identifier.substring(0, 50) + '...',
        userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
      },
      tests: {}
    }

    // Test 1: Redis Health Check
    try {
      const redisHealth = await checkRedisHealth()
      results.tests.redisHealth = {
        status: redisHealth.status,
        connected: redisHealth.connected,
        response: redisHealth.response || redisHealth.error
      }
    } catch (error) {
      results.tests.redisHealth = {
        status: 'error',
        error: error.message
      }
    }

    // Test 2: Rate Limit Status Check
    try {
      const rateLimitConfig = {
        windowMs: 900000, // 15 minutes
        maxRequests: 10, // Low limit for testing
        description: 'Test rate limiting'
      }

      const rateLimitStatus = await getRateLimitStatus(identifier, rateLimitConfig)
      results.tests.rateLimitStatus = {
        mode: rateLimitStatus.mode,
        status: rateLimitStatus.status,
        currentCount: rateLimitStatus.currentCount,
        limit: rateLimitStatus.limit,
        remaining: rateLimitStatus.remaining,
        note: rateLimitStatus.note || rateLimitStatus.error
      }
    } catch (error) {
      results.tests.rateLimitStatus = {
        status: 'error',
        error: error.message
      }
    }

    // Test 3: Rate Limit Headers Check
    results.tests.rateLimitHeaders = {
      limit: req.headers['x-ratelimit-limit'] || 'Not present',
      remaining: req.headers['x-ratelimit-remaining'] || 'Not present',
      reset: req.headers['x-ratelimit-reset'] || 'Not present',
      retryAfter: req.headers['x-ratelimit-retryafter'] || 'Not present',
      policy: req.headers['x-ratelimit-policy'] || 'Not present',
      mode: req.headers['x-ratelimit-mode'] || 'Not present'
    }

    // Test 4: Environment Configuration
    results.tests.environmentConfig = {
      nodeEnv: process.env.NODE_ENV,
      redisHost: process.env.REDIS_HOST || 'default (localhost)',
      redisPort: process.env.REDIS_PORT || 'default (6379)',
      skipRateLimit: process.env.SKIP_RATE_LIMIT,
      hasRedisPassword: !!process.env.REDIS_PASSWORD
    }

    // Test 5: Performance Metrics
    const duration = Date.now() - startTime
    results.tests.performance = {
      totalResponseTime: duration + 'ms',
      classification: duration < 100 ? 'excellent' : duration < 500 ? 'good' : 'needs_attention'
    }

    // Overall system status
    const allTestsPassed = Object.values(results.tests).every(test => 
      !test.error && (test.status === 'healthy' || test.status === 'operational' || !test.status)
    )

    results.overallStatus = allTestsPassed ? 'OPERATIONAL' : 'DEGRADED'
    results.summary = {
      redisAvailable: results.tests.redisHealth?.status === 'healthy',
      rateLimitActive: results.tests.rateLimitStatus?.status === 'operational',
      headersPresent: results.tests.rateLimitHeaders?.limit !== 'Not present',
      performanceGood: results.tests.performance?.classification !== 'needs_attention'
    }

    // Log the test results
    logInfo('Redis rate limit test completed', {
      status: results.overallStatus,
      duration: duration,
      clientIP: clientIP
    })

    logPerformance('redisRateLimitTest', duration, {
      overallStatus: results.overallStatus,
      redisAvailable: results.summary.redisAvailable
    })

    // Return appropriate HTTP status
    const httpStatus = results.overallStatus === 'OPERATIONAL' ? 200 : 503

    res.status(httpStatus).json(results)

  } catch (error) {
    const duration = Date.now() - startTime
    logInfo('Redis rate limit test error', { error: error.message, duration })

    res.status(500).json({
      error: 'Rate limit test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      overallStatus: 'ERROR'
    })
  }
}

// Export the handler with rate limiting applied
export default withTestRateLimit(handler)