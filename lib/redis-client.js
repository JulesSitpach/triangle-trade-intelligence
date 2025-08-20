/**
 * Redis Client for Triangle Intelligence Platform
 * Handles caching, rate limiting, and session management
 */

import Redis from 'ioredis'
import { logInfo, logError, logDebug } from './utils/production-logger.js'

class RedisClient {
  constructor() {
    this.redis = null
    this.isConnected = false
    this.connectionAttempts = 0
    this.maxRetries = 5
    this.retryDelayMs = 2000
  }

  /**
   * Initialize Redis connection with retry logic
   */
  async connect() {
    if (this.isConnected && this.redis) {
      return this.redis
    }

    // Check if Redis should be enabled (can be disabled in development)
    if (process.env.ENABLE_REDIS_RATE_LIMITING === 'false') {
      logInfo('Redis rate limiting disabled via environment variable')
      throw new Error('Redis disabled - using memory fallback')
    }

    let redisConfig

    // Use Redis URL if provided (for managed services like Upstash, ElastiCache)
    if (process.env.REDIS_URL) {
      redisConfig = {
        connectionName: 'triangle-intelligence',
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      }
      this.redis = new Redis(process.env.REDIS_URL, redisConfig)
    } else {
      // Standard host/port configuration
      redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        connectionName: 'triangle-intelligence',
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      }
      this.redis = new Redis(redisConfig)
    }

    try {
      // Event handlers
      this.redis.on('connect', () => {
        logInfo('Redis client connected successfully', { 
          host: redisConfig.host, 
          port: redisConfig.port 
        })
        this.isConnected = true
        this.connectionAttempts = 0
      })

      this.redis.on('ready', () => {
        logInfo('Redis client ready for operations')
      })

      this.redis.on('error', (error) => {
        logError('Redis connection error', { 
          error: error.message,
          connectionAttempts: this.connectionAttempts 
        })
        this.isConnected = false
      })

      this.redis.on('close', () => {
        logInfo('Redis connection closed')
        this.isConnected = false
      })

      this.redis.on('reconnecting', (ms) => {
        logInfo('Redis reconnecting', { retryIn: ms })
      })

      // Test connection
      await this.redis.connect()
      await this.redis.ping()

      return this.redis

    } catch (error) {
      logError('Failed to initialize Redis client', { error: error.message })
      this.connectionAttempts++
      
      if (this.connectionAttempts < this.maxRetries) {
        logInfo(`Retrying Redis connection in ${this.retryDelayMs}ms`, {
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries
        })
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs))
        return this.connect()
      } else {
        throw new Error(`Failed to connect to Redis after ${this.maxRetries} attempts: ${error.message}`)
      }
    }
  }

  /**
   * Get Redis client (with automatic connection)
   */
  async getClient() {
    if (!this.isConnected || !this.redis) {
      await this.connect()
    }
    return this.redis
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.redis) {
      logInfo('Disconnecting Redis client')
      await this.redis.quit()
      this.redis = null
      this.isConnected = false
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const client = await this.getClient()
      const pong = await client.ping()
      return {
        status: 'healthy',
        response: pong,
        connected: this.isConnected
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      }
    }
  }

  /**
   * Check if fallback mode should be used
   */
  shouldUseFallback() {
    // Use fallback if Redis is not available or connection failed too many times
    return !this.isConnected || this.connectionAttempts >= this.maxRetries
  }
}

// Singleton instance
const redisClient = new RedisClient()

/**
 * Get Redis client instance (singleton)
 */
export async function getRedisClient() {
  try {
    return await redisClient.getClient()
  } catch (error) {
    logError('Failed to get Redis client', { error: error.message })
    throw error
  }
}

/**
 * Check Redis health
 */
export async function checkRedisHealth() {
  return await redisClient.healthCheck()
}

/**
 * Check if should use memory fallback
 */
export function shouldUseFallbackMode() {
  return redisClient.shouldUseFallback()
}

/**
 * Graceful shutdown helper
 */
export async function shutdownRedis() {
  await redisClient.disconnect()
}

// Export the class for testing
export { RedisClient }

// Handle process shutdown
process.on('SIGTERM', shutdownRedis)
process.on('SIGINT', shutdownRedis)