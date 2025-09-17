/**
 * PRODUCT CONTEXT SERVICE - Production Implementation
 * Manages lightweight context objects to eliminate redundant database calls
 * while maintaining clean API separation and optimal cache performance
 */

import { getTariffRates } from '../../pages/api/ai-classification.js';

class ProductContextService {
  static cache = new Map();
  static requestCache = new Map(); // Request-scoped cache for immediate reuse
  
  // Context lifecycle configuration based on data characteristics
  static CACHE_CONFIG = {
    // Tariff rates change infrequently (quarterly/annually)
    TARIFF_CONTEXT_TTL: 4 * 60 * 60 * 1000, // 4 hours
    
    // Request-scoped contexts for same-session API calls
    REQUEST_CONTEXT_TTL: 10 * 60 * 1000, // 10 minutes
    
    // Maximum cache size to prevent memory leaks
    MAX_CACHE_SIZE: 1000,
    
    // Cleanup interval for expired contexts
    CLEANUP_INTERVAL: 30 * 60 * 1000 // 30 minutes
  };
  
  /**
   * Create or retrieve product context
   * @param {string} hsCode - HS code for product
   * @param {string} businessType - Optional business context
   * @param {string} requestId - Optional request identifier for session grouping
   * @returns {Promise<Object>} Product context object
   */
  static async createContext(hsCode, businessType = null, requestId = null) {
    // Generate cache keys
    const contextKey = `${hsCode}_${businessType || 'generic'}`;
    const requestKey = requestId ? `req_${requestId}_${contextKey}` : null;
    
    // Priority 1: Check request-scoped cache (immediate reuse within same workflow)
    if (requestKey && this.requestCache.has(requestKey)) {
      const context = this.requestCache.get(requestKey);
      console.log(`🎯 REQUEST CACHE HIT: ${contextKey} (${requestId})`);
      return this.refreshMetadata(context, 'request_cache');
    }
    
    // Priority 2: Check long-term context cache
    if (this.cache.has(contextKey)) {
      const cachedContext = this.cache.get(contextKey);
      
      // Check if context is still fresh
      const now = Date.now();
      const contextAge = now - new Date(cachedContext.metadata.timestamp).getTime();
      
      if (contextAge < this.CACHE_CONFIG.TARIFF_CONTEXT_TTL) {
        console.log(`🎯 CONTEXT CACHE HIT: ${contextKey} (age: ${Math.round(contextAge/1000)}s)`);
        
        // Store in request cache for immediate reuse
        if (requestKey) {
          this.requestCache.set(requestKey, cachedContext);
          this.scheduleRequestCacheCleanup(requestKey);
        }
        
        return this.refreshMetadata(cachedContext, 'context_cache');
      } else {
        // Context expired, remove from cache
        console.log(`⏰ CONTEXT EXPIRED: ${contextKey} (age: ${Math.round(contextAge/1000)}s)`);
        this.cache.delete(contextKey);
      }
    }
    
    // Priority 3: Create new context (database lookup required)
    console.log(`🔗 CREATING NEW CONTEXT: ${contextKey}`);
    const context = await this.buildContext(hsCode, businessType, contextKey);
    
    // Store in both caches
    this.cache.set(contextKey, context);
    if (requestKey) {
      this.requestCache.set(requestKey, context);
      this.scheduleRequestCacheCleanup(requestKey);
    }
    
    // Prevent memory leaks
    this.enforceMaxCacheSize();
    
    return context;
  }
  
  /**
   * Build new context from database lookup
   */
  static async buildContext(hsCode, businessType, contextKey) {
    const startTime = Date.now();
    
    try {
      // Use existing proven 4-strategy lookup
      const tariffData = await getTariffRates(hsCode);
      const lookupTime = Date.now() - startTime;
      
      const context = {
        hsCode,
        businessType,
        tariffData: {
          mfnRate: tariffData.mfnRate,
          usmcaRate: tariffData.usmcaRate, 
          savingsPercent: tariffData.savingsPercent,
          source: tariffData.source,
          country: tariffData.country
        },
        metadata: {
          contextKey,
          lookupStrategy: '4-strategy-intelligent',
          confidence: this.calculateContextConfidence(tariffData),
          lookupTimeMs: lookupTime,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      console.log(`✅ CONTEXT CREATED: ${contextKey} (${lookupTime}ms, confidence: ${context.metadata.confidence}%)`);
      return context;
      
    } catch (error) {
      console.error(`❌ CONTEXT CREATION FAILED: ${contextKey}`, error.message);
      
      // Return minimal fallback context to prevent cascade failures
      return {
        hsCode,
        businessType, 
        tariffData: {
          mfnRate: 0,
          usmcaRate: 0,
          savingsPercent: 0,
          source: 'context_creation_failed',
          country: 'US'
        },
        metadata: {
          contextKey,
          lookupStrategy: 'fallback',
          confidence: 0,
          lookupTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          version: '1.0',
          error: error.message
        }
      };
    }
  }
  
  /**
   * Calculate context confidence based on tariff data quality
   */
  static calculateContextConfidence(tariffData) {
    let confidence = 50; // Base confidence
    
    // High confidence for direct database matches
    if (tariffData.source === 'direct_hs_record') confidence = 95;
    else if (tariffData.source === 'usmca_table') confidence = 90;
    else if (tariffData.source.includes('progressive_hs')) confidence = 75;
    else if (tariffData.source.includes('chapter_')) confidence = 60;
    
    // Boost confidence for non-zero rates
    if (tariffData.mfnRate > 0) confidence += 10;
    
    // Cap at reasonable maximum
    return Math.min(confidence, 98);
  }
  
  /**
   * Refresh metadata for cache hits
   */
  static refreshMetadata(context, cacheSource) {
    return {
      ...context,
      metadata: {
        ...context.metadata,
        lastAccessed: new Date().toISOString(),
        cacheSource
      }
    };
  }
  
  /**
   * Schedule cleanup of request-scoped cache entries
   */
  static scheduleRequestCacheCleanup(requestKey) {
    setTimeout(() => {
      if (this.requestCache.has(requestKey)) {
        this.requestCache.delete(requestKey);
        console.log(`🧹 REQUEST CACHE CLEANUP: ${requestKey}`);
      }
    }, this.CACHE_CONFIG.REQUEST_CONTEXT_TTL);
  }
  
  /**
   * Enforce maximum cache size to prevent memory leaks
   */
  static enforceMaxCacheSize() {
    if (this.cache.size > this.CACHE_CONFIG.MAX_CACHE_SIZE) {
      // Remove oldest entries (simple LRU approximation)
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => {
        const timeA = new Date(a[1].metadata.timestamp).getTime();
        const timeB = new Date(b[1].metadata.timestamp).getTime();
        return timeA - timeB;
      });
      
      // Remove oldest 10%
      const removeCount = Math.floor(this.CACHE_CONFIG.MAX_CACHE_SIZE * 0.1);
      for (let i = 0; i < removeCount; i++) {
        this.cache.delete(entries[i][0]);
      }
      
      console.log(`🧹 CACHE SIZE ENFORCEMENT: Removed ${removeCount} oldest entries`);
    }
  }
  
  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return {
      contextCacheSize: this.cache.size,
      requestCacheSize: this.requestCache.size,
      maxCacheSize: this.CACHE_CONFIG.MAX_CACHE_SIZE,
      ttlHours: this.CACHE_CONFIG.TARIFF_CONTEXT_TTL / (60 * 60 * 1000),
      
      // Sample some cache entries for debugging
      sampleContexts: Array.from(this.cache.entries()).slice(0, 3).map(([key, context]) => ({
        key,
        age: Math.round((Date.now() - new Date(context.metadata.timestamp).getTime()) / 1000),
        confidence: context.metadata.confidence,
        source: context.tariffData.source
      }))
    };
  }
  
  /**
   * Clear all caches (for testing/debugging)
   */
  static clearCaches() {
    this.cache.clear();
    this.requestCache.clear();
    console.log('🧹 ALL CACHES CLEARED');
  }
}

// Initialize periodic cache cleanup
setInterval(() => {
  const stats = ProductContextService.getCacheStats();
  console.log('📊 CONTEXT SERVICE STATUS:', stats);
}, ProductContextService.CACHE_CONFIG.CLEANUP_INTERVAL);

export default ProductContextService;