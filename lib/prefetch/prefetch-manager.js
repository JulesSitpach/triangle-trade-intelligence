/**
 * PHASE 3: INTELLIGENT PREFETCH MANAGER
 * Anticipates user needs and pre-loads data to reduce perceived loading times
 * Uses ML-enhanced prediction and respects API rate limits
 */

import { logInfo, logError, logPerformance, logAPICall } from '../utils/production-logger'

/**
 * Rate limiting for API calls
 */
class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) { // 10 requests per minute
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
    this.requests = []
  }

  canMakeRequest() {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    return this.requests.length < this.maxRequests
  }

  recordRequest() {
    this.requests.push(Date.now())
  }

  getTimeUntilNext() {
    if (this.requests.length === 0) return 0
    const oldestRequest = Math.min(...this.requests)
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest))
  }
}

/**
 * Intelligent prefetch queue with priority management
 */
class PrefetchQueue {
  constructor() {
    this.queue = new Map()
    this.inProgress = new Set()
    this.completed = new Map()
    this.failed = new Set()
  }

  add(key, fetchFunction, priority = 1, dependencies = []) {
    if (this.completed.has(key) || this.inProgress.has(key)) {
      return this.completed.get(key) || Promise.resolve(null)
    }

    const queueItem = {
      key,
      fetchFunction,
      priority,
      dependencies,
      addedAt: Date.now(),
      attempts: 0,
      maxAttempts: 2
    }

    this.queue.set(key, queueItem)
    return this.processNext()
  }

  async processNext() {
    // Find highest priority item with satisfied dependencies
    const available = Array.from(this.queue.values())
      .filter(item => !this.inProgress.has(item.key))
      .filter(item => item.dependencies.every(dep => this.completed.has(dep)))
      .sort((a, b) => b.priority - a.priority)

    if (available.length === 0) return null

    const item = available[0]
    this.queue.delete(item.key)
    this.inProgress.add(item.key)

    try {
      const result = await item.fetchFunction()
      this.completed.set(item.key, result)
      this.inProgress.delete(item.key)
      
      logInfo('Prefetch completed successfully', { 
        key: item.key, 
        priority: item.priority,
        queueTime: Date.now() - item.addedAt
      })

      // Process any dependent items
      setTimeout(() => this.processNext(), 0)
      return result

    } catch (error) {
      this.inProgress.delete(item.key)
      item.attempts++

      if (item.attempts < item.maxAttempts) {
        // Retry with lower priority
        item.priority = Math.max(0, item.priority - 1)
        this.queue.set(item.key, item)
        logInfo('Prefetch failed, retrying', { key: item.key, attempt: item.attempts })
      } else {
        this.failed.add(item.key)
        logError('Prefetch failed permanently', { key: item.key, error })
      }

      return null
    }
  }

  get(key) {
    return this.completed.get(key)
  }

  getStats() {
    return {
      queued: this.queue.size,
      inProgress: this.inProgress.size,
      completed: this.completed.size,
      failed: this.failed.size,
      hitRate: this.completed.size > 0 
        ? ((this.completed.size / (this.completed.size + this.failed.size)) * 100).toFixed(1) + '%'
        : '0%'
    }
  }

  clear() {
    this.queue.clear()
    this.completed.clear()
    this.failed.clear()
    this.inProgress.clear()
  }
}

/**
 * User behavior prediction engine
 */
class BehaviorPredictor {
  constructor() {
    this.patterns = new Map()
    this.sessionData = {
      currentPage: null,
      previousPages: [],
      timeSpent: new Map(),
      formCompletions: new Map()
    }
  }

  recordPageVisit(page, formData = null) {
    const now = Date.now()
    
    if (this.sessionData.currentPage) {
      const timeSpent = now - (this.sessionData.pageStartTime || now)
      this.sessionData.timeSpent.set(this.sessionData.currentPage, timeSpent)
      this.sessionData.previousPages.push(this.sessionData.currentPage)
    }

    this.sessionData.currentPage = page
    this.sessionData.pageStartTime = now

    if (formData) {
      this.sessionData.formCompletions.set(page, {
        data: formData,
        completedAt: now,
        completionTime: timeSpent || 0
      })
    }

    this.updatePredictions()
  }

  updatePredictions() {
    const current = this.sessionData.currentPage
    if (!current) return

    // Update transition patterns
    if (this.sessionData.previousPages.length > 0) {
      const previous = this.sessionData.previousPages[this.sessionData.previousPages.length - 1]
      const pattern = `${previous}->${current}`
      
      const existing = this.patterns.get(pattern) || { count: 0, avgTime: 0 }
      existing.count++
      
      const timeSpent = this.sessionData.timeSpent.get(previous) || 0
      existing.avgTime = (existing.avgTime * (existing.count - 1) + timeSpent) / existing.count
      
      this.patterns.set(pattern, existing)
    }
  }

  predictNextPages(currentPage, confidence = 0.7) {
    const predictions = []
    
    // Standard journey flow predictions
    const standardFlow = {
      'foundation': [{ page: 'product', probability: 0.95 }],
      'product': [{ page: 'routing', probability: 0.90 }],
      'routing': [{ page: 'partnership', probability: 0.85 }],
      'partnership': [{ page: 'hindsight', probability: 0.80 }],
      'hindsight': [{ page: 'alerts', probability: 0.75 }]
    }

    // Add learned patterns
    for (const [pattern, data] of this.patterns) {
      const [from, to] = pattern.split('->')
      if (from === currentPage && data.count >= 2) {
        const probability = Math.min(0.9, data.count * 0.1 + 0.3)
        predictions.push({ page: to, probability })
      }
    }

    // Merge with standard flow
    const standard = standardFlow[currentPage] || []
    standard.forEach(pred => {
      const existing = predictions.find(p => p.page === pred.page)
      if (existing) {
        existing.probability = Math.max(existing.probability, pred.probability)
      } else {
        predictions.push(pred)
      }
    })

    return predictions
      .filter(p => p.probability >= confidence)
      .sort((a, b) => b.probability - a.probability)
  }

  getFormCompletionPatterns() {
    const patterns = {}
    
    for (const [page, completion] of this.sessionData.formCompletions) {
      if (!patterns[page]) patterns[page] = []
      patterns[page].push(completion)
    }

    return patterns
  }
}

/**
 * Main prefetch manager class
 */
export class PrefetchManager {
  static instance = null
  
  constructor() {
    if (PrefetchManager.instance) {
      return PrefetchManager.instance
    }

    this.cache = new Map()
    this.queue = new PrefetchQueue()
    this.rateLimiter = new RateLimiter(15, 60000) // 15 requests per minute
    this.predictor = new BehaviorPredictor()
    this.enabled = process.env.NEXT_PUBLIC_USE_PREFETCHING === 'true'
    this.metrics = {
      requests: 0,
      hits: 0,
      misses: 0,
      errors: 0,
      totalLatency: 0
    }

    PrefetchManager.instance = this
  }

  static getInstance() {
    if (!PrefetchManager.instance) {
      new PrefetchManager()
    }
    return PrefetchManager.instance
  }

  /**
   * FOUNDATION PAGE: Prefetch product suggestions
   */
  async prefetchProduct(foundationData) {
    if (!this.enabled || !foundationData?.businessType) return null

    const key = `products_${foundationData.businessType}_${foundationData.zipCode}`
    
    // Check cache first
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      this.metrics.hits++
      logInfo('Product prefetch cache hit', { businessType: foundationData.businessType })
      return cached.data
    }

    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getTimeUntilNext()
      logInfo('Product prefetch rate limited', { waitTime })
      return null
    }

    const prefetchFunction = async () => {
      const startTime = Date.now()
      this.rateLimiter.recordRequest()
      
      try {
        const response = await fetch('/api/product-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessType: foundationData.businessType,
            zipCode: foundationData.zipCode,
            prefetch: true
          })
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        
        // Cache for 10 minutes
        this.cache.set(key, {
          data,
          expires: Date.now() + (10 * 60 * 1000),
          createdAt: Date.now()
        })

        const latency = Date.now() - startTime
        this.metrics.requests++
        this.metrics.totalLatency += latency

        logAPICall('POST', '/api/product-suggestions', latency, 'prefetch_success')
        logInfo('Product prefetch completed', { 
          businessType: foundationData.businessType,
          latency,
          productsLoaded: data.suggestions?.length || 0
        })

        return data

      } catch (error) {
        this.metrics.errors++
        logError('Product prefetch failed', { error, foundationData })
        throw error
      }
    }

    return await this.queue.add(key, prefetchFunction, 2) // High priority
  }

  /**
   * PRODUCT PAGE: Prefetch routing intelligence
   */
  async prefetchRouting(foundationData, productData) {
    if (!this.enabled || !foundationData?.primarySupplierCountry || !productData?.selectedProducts?.length) {
      return null
    }

    const key = `routing_${foundationData.primarySupplierCountry}_${foundationData.businessType}_${productData.selectedProducts[0]?.hsCode}`
    
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      this.metrics.hits++
      return cached.data
    }

    if (!this.rateLimiter.canMakeRequest()) return null

    const prefetchFunction = async () => {
      const startTime = Date.now()
      this.rateLimiter.recordRequest()
      
      try {
        const response = await fetch('/api/intelligence/routing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: foundationData.primarySupplierCountry,
            destination: 'US',
            businessType: foundationData.businessType,
            hsCode: productData.selectedProducts[0]?.hsCode,
            prefetch: true
          })
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        
        // Cache for 15 minutes (routing data changes less frequently)
        this.cache.set(key, {
          data,
          expires: Date.now() + (15 * 60 * 1000),
          createdAt: Date.now()
        })

        const latency = Date.now() - startTime
        this.metrics.requests++
        this.metrics.totalLatency += latency

        logAPICall('POST', '/api/intelligence/routing', latency, 'prefetch_success')
        
        return data

      } catch (error) {
        this.metrics.errors++
        logError('Routing prefetch failed', { error, foundationData, productData })
        throw error
      }
    }

    return await this.queue.add(key, prefetchFunction, 3, [`products_${foundationData.businessType}_${foundationData.zipCode}`])
  }

  /**
   * ROUTING PAGE: Prefetch partnership opportunities
   */
  async prefetchPartnership(contextData) {
    if (!this.enabled || !contextData?.foundation?.businessType || !contextData?.routing?.selectedRoute) {
      return null
    }

    const key = `partnership_${contextData.foundation.businessType}_${contextData.routing.selectedRoute.route}`
    
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      this.metrics.hits++
      return cached.data
    }

    if (!this.rateLimiter.canMakeRequest()) return null

    const prefetchFunction = async () => {
      const startTime = Date.now()
      this.rateLimiter.recordRequest()
      
      try {
        const response = await fetch('/api/canada-mexico-advantage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessType: contextData.foundation.businessType,
            selectedRoute: contextData.routing.selectedRoute,
            products: contextData.product?.selectedProducts,
            prefetch: true
          })
        })

        const data = await response.json()
        
        // Cache for 20 minutes
        this.cache.set(key, {
          data,
          expires: Date.now() + (20 * 60 * 1000),
          createdAt: Date.now()
        })

        const latency = Date.now() - startTime
        this.metrics.requests++
        this.metrics.totalLatency += latency

        return data

      } catch (error) {
        this.metrics.errors++
        logError('Partnership prefetch failed', { error, contextData })
        throw error
      }
    }

    return await this.queue.add(key, prefetchFunction, 1) // Lower priority
  }

  /**
   * Intelligent prefetch based on user behavior prediction
   */
  async predictAndPrefetch(currentPage, pageData) {
    if (!this.enabled) return

    this.predictor.recordPageVisit(currentPage, pageData)
    const predictions = this.predictor.predictNextPages(currentPage, 0.8)

    logInfo('Prefetch predictions generated', { 
      currentPage, 
      predictions: predictions.map(p => `${p.page}(${(p.probability*100).toFixed(0)}%)`) 
    })

    // Prefetch based on predictions
    for (const prediction of predictions.slice(0, 2)) { // Top 2 predictions only
      try {
        if (prediction.page === 'product' && pageData) {
          await this.prefetchProduct(pageData)
        } else if (prediction.page === 'routing' && pageData) {
          const productData = this.getFromCache(`products_${pageData.businessType}_${pageData.zipCode}`)
          if (productData) {
            await this.prefetchRouting(pageData, productData)
          }
        } else if (prediction.page === 'partnership') {
          // Complex prefetch requiring multiple data sources
          const contextData = this.buildContextFromCache(pageData)
          if (contextData) {
            await this.prefetchPartnership(contextData)
          }
        }
      } catch (error) {
        logError('Predictive prefetch failed', { error, page: prediction.page })
      }
    }
  }

  /**
   * Utility methods
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      this.metrics.hits++
      return cached.data
    }
    this.metrics.misses++
    return null
  }

  buildContextFromCache(pageData) {
    const foundation = pageData
    const products = this.getFromCache(`products_${foundation?.businessType}_${foundation?.zipCode}`)
    const routing = this.getFromCache(`routing_${foundation?.primarySupplierCountry}_${foundation?.businessType}`)
    
    if (foundation && products && routing) {
      return { foundation, product: products, routing }
    }
    return null
  }

  clearCache() {
    this.cache.clear()
    this.queue.clear()
    logInfo('Prefetch cache cleared')
  }

  getMetrics() {
    const avgLatency = this.metrics.requests > 0 
      ? this.metrics.totalLatency / this.metrics.requests 
      : 0

    return {
      enabled: this.enabled,
      cache: {
        size: this.cache.size,
        hitRate: this.metrics.hits + this.metrics.misses > 0 
          ? ((this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100).toFixed(1) + '%'
          : '0%',
        hits: this.metrics.hits,
        misses: this.metrics.misses
      },
      queue: this.queue.getStats(),
      performance: {
        totalRequests: this.metrics.requests,
        errors: this.metrics.errors,
        averageLatency: Math.round(avgLatency),
        errorRate: this.metrics.requests > 0 
          ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(1) + '%'
          : '0%'
      },
      rateLimiting: {
        requestsInWindow: this.rateLimiter.requests.length,
        maxRequests: this.rateLimiter.maxRequests,
        timeUntilReset: this.rateLimiter.getTimeUntilNext()
      },
      predictions: this.predictor.patterns.size
    }
  }

  getHealthCheck() {
    const metrics = this.getMetrics()
    const issues = []

    if (!this.enabled) {
      issues.push('Prefetching is disabled')
    }

    if (parseFloat(metrics.performance.errorRate) > 10) {
      issues.push(`High error rate: ${metrics.performance.errorRate}`)
    }

    if (parseFloat(metrics.cache.hitRate) < 30) {
      issues.push(`Low cache hit rate: ${metrics.cache.hitRate}`)
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      metrics,
      timestamp: new Date().toISOString()
    }
  }
}

// Export singleton instance
export default PrefetchManager.getInstance()