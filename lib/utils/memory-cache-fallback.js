/**
 * Memory Cache Fallback System for Triangle Intelligence Platform
 * Provides high-performance caching when Redis is not available
 * Critical for production readiness and performance optimization
 */

import { logInfo, logWarn, logError, logPerformance } from './production-logger.js'

class MemoryCacheFallback {
  constructor() {
    this.cache = new Map()
    this.keyTTL = new Map() // Track TTL for each key
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalRequests: 0
    }
    this.maxSize = 10000 // Maximum cache entries
    this.defaultTTL = 3600000 // 1 hour in milliseconds
    
    // Start cleanup interval
    this.startCleanupInterval()
    
    logInfo('Memory cache fallback initialized', {
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL / 1000 + 's',
      status: 'READY'
    })
  }

  /**
   * Get value from cache
   */
  async get(key) {
    this.stats.totalRequests++
    const startTime = Date.now()
    
    if (!this.cache.has(key)) {
      this.stats.misses++
      return null
    }

    // Check if expired
    const ttl = this.keyTTL.get(key)
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key)
      this.keyTTL.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    const value = this.cache.get(key)
    const duration = Date.now() - startTime
    
    logPerformance('memory_cache_get', duration, {
      key: key.substring(0, 50) + '...',
      hit: true,
      hitRate: (this.stats.hits / this.stats.totalRequests * 100).toFixed(1) + '%'
    })
    
    return value
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key, value, ttlSeconds = null) {
    const startTime = Date.now()
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const ttl = ttlSeconds 
      ? Date.now() + (ttlSeconds * 1000)
      : Date.now() + this.defaultTTL
    
    this.cache.set(key, value)
    this.keyTTL.set(key, ttl)
    this.stats.sets++
    
    const duration = Date.now() - startTime
    logPerformance('memory_cache_set', duration, {
      key: key.substring(0, 50) + '...',
      ttl: ttlSeconds || (this.defaultTTL / 1000) + 's',
      cacheSize: this.cache.size
    })
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    const deleted = this.cache.delete(key)
    this.keyTTL.delete(key)
    return deleted ? 1 : 0
  }

  /**
   * Check if key exists (and is not expired)
   */
  async exists(key) {
    if (!this.cache.has(key)) return false
    
    const ttl = this.keyTTL.get(key)
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key)
      this.keyTTL.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.stats.totalRequests > 0 
        ? (this.stats.hits / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      memoryUsage: process.memoryUsage()
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  evictOldest() {
    const oldestKeys = Array.from(this.cache.keys()).slice(0, Math.floor(this.maxSize * 0.1))
    
    for (const key of oldestKeys) {
      this.cache.delete(key)
      this.keyTTL.delete(key)
      this.stats.evictions++
    }
    
    logInfo('Memory cache eviction completed', {
      evictedKeys: oldestKeys.length,
      remainingSize: this.cache.size
    })
  }

  /**
   * Clean up expired entries periodically
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now()
      let expiredCount = 0
      
      for (const [key, ttl] of this.keyTTL.entries()) {
        if (ttl < now) {
          this.cache.delete(key)
          this.keyTTL.delete(key)
          expiredCount++
        }
      }
      
      if (expiredCount > 0) {
        logInfo('Memory cache cleanup completed', {
          expiredKeys: expiredCount,
          cacheSize: this.cache.size
        })
      }
    }, 60000) // Every minute
  }

  /**
   * Clear all cache
   */
  async flushall() {
    this.cache.clear()
    this.keyTTL.clear()
    this.stats.evictions += this.cache.size
    logInfo('Memory cache flushed completely')
  }

  /**
   * Get multiple keys at once
   */
  async mget(keys) {
    const results = []
    for (const key of keys) {
      results.push(await this.get(key))
    }
    return results
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs) {
    for (let i = 0; i < keyValuePairs.length; i += 2) {
      await this.set(keyValuePairs[i], keyValuePairs[i + 1])
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key) {
    const current = (await this.get(key)) || 0
    const newValue = parseInt(current) + 1
    await this.set(key, newValue)
    return newValue
  }

  /**
   * Set expiry for existing key
   */
  async expire(key, ttlSeconds) {
    if (this.cache.has(key)) {
      this.keyTTL.set(key, Date.now() + (ttlSeconds * 1000))
      return true
    }
    return false
  }
}

// Singleton instance
const memoryCacheFallback = new MemoryCacheFallback()

/**
 * Universal cache interface that works with both Redis and memory fallback
 */
class UniversalCache {
  constructor() {
    this.redis = null
    this.usingFallback = true
    this.initializeRedis()
  }

  async initializeRedis() {
    try {
      const { getRedisClient } = await import('../redis-client.js')
      this.redis = await getRedisClient()
      this.usingFallback = false
      logInfo('UniversalCache: Redis connected successfully')
    } catch (error) {
      logWarn('UniversalCache: Redis unavailable, using memory fallback', { 
        error: error.message 
      })
      this.usingFallback = true
    }
  }

  async get(key) {
    if (this.usingFallback || !this.redis) {
      return await memoryCacheFallback.get(key)
    }
    
    try {
      const result = await this.redis.get(key)
      return result ? JSON.parse(result) : null
    } catch (error) {
      logWarn('Redis get failed, falling back to memory', { key, error: error.message })
      return await memoryCacheFallback.get(key)
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (this.usingFallback || !this.redis) {
      return await memoryCacheFallback.set(key, value, ttlSeconds)
    }
    
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      logWarn('Redis set failed, falling back to memory', { key, error: error.message })
      await memoryCacheFallback.set(key, value, ttlSeconds)
    }
  }

  async del(key) {
    if (this.usingFallback || !this.redis) {
      return await memoryCacheFallback.del(key)
    }
    
    try {
      return await this.redis.del(key)
    } catch (error) {
      logWarn('Redis del failed, falling back to memory', { key, error: error.message })
      return await memoryCacheFallback.del(key)
    }
  }

  getStats() {
    return {
      usingFallback: this.usingFallback,
      redisConnected: !this.usingFallback && !!this.redis,
      fallbackStats: memoryCacheFallback.getStats()
    }
  }
}

// Export singleton instance
export const universalCache = new UniversalCache()
export { memoryCacheFallback }
export default universalCache