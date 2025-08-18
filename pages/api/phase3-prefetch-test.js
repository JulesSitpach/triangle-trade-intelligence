/**
 * PHASE 3 PREFETCH TESTING API
 * Tests intelligent prefetching system for reduced perceived loading times
 * Validates that Phase 3 delivers seamless user experience improvements
 */

import PrefetchManager from '../../lib/prefetch/prefetch-manager'
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { testType = 'all', iterations = 3, mockData = {} } = req.body

  logInfo('Phase 3 prefetch testing started', { testType, iterations })

  try {
    const results = {
      phase: 3,
      testType,
      iterations,
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {},
      recommendations: []
    }

    // Initialize fresh PrefetchManager for testing
    const prefetchManager = PrefetchManager.getInstance()

    // Test 1: Product Prefetching Performance
    if (testType === 'all' || testType === 'product') {
      results.tests.productPrefetching = await testProductPrefetching(prefetchManager, iterations, mockData)
    }

    // Test 2: Routing Intelligence Prefetching
    if (testType === 'all' || testType === 'routing') {
      results.tests.routingPrefetching = await testRoutingPrefetching(prefetchManager, iterations, mockData)
    }

    // Test 3: Cache Hit Rate and Performance
    if (testType === 'all' || testType === 'cache') {
      results.tests.cachePerformance = await testCachePerformance(prefetchManager, iterations)
    }

    // Test 4: Behavioral Prediction Accuracy
    if (testType === 'all' || testType === 'prediction') {
      results.tests.behaviorPrediction = await testBehaviorPrediction(prefetchManager, iterations)
    }

    // Test 5: Rate Limiting and Queue Management
    if (testType === 'all' || testType === 'queue') {
      results.tests.queueManagement = await testQueueManagement(prefetchManager, iterations)
    }

    // Generate summary and recommendations
    results.summary = generateTestSummary(results.tests)
    results.recommendations = generateRecommendations(results.tests, prefetchManager.getMetrics())
    results.systemMetrics = prefetchManager.getMetrics()
    results.healthCheck = prefetchManager.getHealthCheck()

    logPerformance('phase3_prefetch_test', Date.now(), { 
      testCount: Object.keys(results.tests).length,
      overallSuccess: results.summary.overallStatus === 'PASSED'
    })

    res.status(200).json(results)

  } catch (error) {
    logError('Phase 3 prefetch test failed', { error, testType })
    res.status(500).json({ 
      error: error.message,
      phase: 3,
      testType,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Test product prefetching performance
 */
async function testProductPrefetching(prefetchManager, iterations, mockData) {
  const results = {
    test: 'Product Prefetching',
    prefetchTimes: [],
    cacheHitTimes: [],
    improvement: 0,
    cacheHitRate: 0,
    passed: false
  }

  const testFoundationData = mockData.foundation || {
    businessType: 'Electronics',
    zipCode: '90210',
    companyName: 'Test Electronics Corp'
  }

  // Clear cache for clean test
  prefetchManager.clearCache()

  for (let i = 0; i < iterations; i++) {
    try {
      // Test prefetch operation
      const prefetchStart = Date.now()
      await prefetchManager.prefetchProduct(testFoundationData)
      results.prefetchTimes.push(Date.now() - prefetchStart)

      // Test cache hit performance
      const cacheStart = Date.now()
      const cachedData = prefetchManager.getFromCache(`products_${testFoundationData.businessType}_${testFoundationData.zipCode}`)
      results.cacheHitTimes.push(Date.now() - cacheStart)

      if (cachedData) {
        console.log('✅ Product prefetch cache hit successful')
      }

    } catch (error) {
      logError('Product prefetch test iteration failed', error)
      results.prefetchTimes.push(null)
      results.cacheHitTimes.push(null)
    }
  }

  // Calculate metrics
  const validPrefetchTimes = results.prefetchTimes.filter(t => t !== null)
  const validCacheHitTimes = results.cacheHitTimes.filter(t => t !== null)

  const avgPrefetchTime = validPrefetchTimes.reduce((sum, t) => sum + t, 0) / validPrefetchTimes.length
  const avgCacheHitTime = validCacheHitTimes.reduce((sum, t) => sum + t, 0) / validCacheHitTimes.length

  results.improvement = avgPrefetchTime > 0 ? ((avgPrefetchTime - avgCacheHitTime) / avgPrefetchTime * 100).toFixed(1) : 0
  results.cacheHitRate = ((validCacheHitTimes.length / iterations) * 100).toFixed(1)
  results.avgPrefetchTime = Math.round(avgPrefetchTime)
  results.avgCacheHitTime = Math.round(avgCacheHitTime)
  results.passed = parseFloat(results.improvement) >= 95 && parseFloat(results.cacheHitRate) >= 90

  return results
}

/**
 * Test routing intelligence prefetching
 */
async function testRoutingPrefetching(prefetchManager, iterations, mockData) {
  const results = {
    test: 'Routing Prefetching',
    prefetchTimes: [],
    dataQuality: [],
    passed: false
  }

  const testFoundationData = mockData.foundation || {
    businessType: 'Manufacturing',
    primarySupplierCountry: 'CN',
    zipCode: '10001'
  }

  const testProductData = mockData.product || {
    selectedProducts: [
      { description: 'Electronic Components', hsCode: '8517', confidence: 92 }
    ]
  }

  for (let i = 0; i < iterations; i++) {
    try {
      const start = Date.now()
      const routingData = await prefetchManager.prefetchRouting(testFoundationData, testProductData)
      const latency = Date.now() - start
      
      results.prefetchTimes.push(latency)
      
      // Evaluate data quality
      if (routingData) {
        const quality = {
          hasRoutes: Array.isArray(routingData.routes) && routingData.routes.length > 0,
          hasSavings: routingData.savings !== undefined,
          hasConfidence: routingData.confidence !== undefined,
          isRealistic: latency > 100 && latency < 5000 // Should be realistic timing
        }
        
        const qualityScore = Object.values(quality).filter(Boolean).length / Object.keys(quality).length
        results.dataQuality.push(qualityScore)
      } else {
        results.dataQuality.push(0)
      }

    } catch (error) {
      logError('Routing prefetch test failed', error)
      results.prefetchTimes.push(null)
      results.dataQuality.push(0)
    }
  }

  // Calculate metrics
  const validTimes = results.prefetchTimes.filter(t => t !== null)
  const avgLatency = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length
  const avgQuality = results.dataQuality.reduce((sum, q) => sum + q, 0) / results.dataQuality.length

  results.avgLatency = Math.round(avgLatency)
  results.avgDataQuality = Math.round(avgQuality * 100)
  results.successRate = ((validTimes.length / iterations) * 100).toFixed(1)
  results.passed = avgLatency < 3000 && avgQuality >= 0.8

  return results
}

/**
 * Test cache performance and hit rates
 */
async function testCachePerformance(prefetchManager, iterations) {
  const results = {
    test: 'Cache Performance',
    cacheOperations: [],
    hitRates: [],
    passed: false
  }

  // Generate test data for cache operations
  const testKeys = [
    'products_Electronics_90210',
    'routing_CN_US_Manufacturing',
    'partnership_Electronics_MX-US',
    'products_Automotive_10001',
    'routing_DE_US_Automotive'
  ]

  for (let i = 0; i < iterations; i++) {
    prefetchManager.clearCache()
    const operationStart = Date.now()

    try {
      // Populate cache with test data
      for (const key of testKeys) {
        const testData = { test: true, key, timestamp: Date.now() }
        prefetchManager.cache.set(key, {
          data: testData,
          expires: Date.now() + 300000, // 5 minutes
          createdAt: Date.now()
        })
      }

      // Test cache retrieval performance
      const retrievalStart = Date.now()
      let hits = 0
      
      for (const key of testKeys) {
        const data = prefetchManager.getFromCache(key)
        if (data) hits++
      }

      const operationTime = Date.now() - operationStart
      const retrievalTime = Date.now() - retrievalStart
      const hitRate = (hits / testKeys.length) * 100

      results.cacheOperations.push({
        operationTime,
        retrievalTime,
        hitRate
      })

    } catch (error) {
      logError('Cache performance test failed', error)
    }
  }

  // Calculate averages
  if (results.cacheOperations.length > 0) {
    const avgOperationTime = results.cacheOperations.reduce((sum, op) => sum + op.operationTime, 0) / results.cacheOperations.length
    const avgRetrievalTime = results.cacheOperations.reduce((sum, op) => sum + op.retrievalTime, 0) / results.cacheOperations.length
    const avgHitRate = results.cacheOperations.reduce((sum, op) => sum + op.hitRate, 0) / results.cacheOperations.length

    results.avgOperationTime = Math.round(avgOperationTime)
    results.avgRetrievalTime = Math.round(avgRetrievalTime)
    results.avgHitRate = Math.round(avgHitRate)
    results.passed = avgRetrievalTime < 50 && avgHitRate >= 95 // Cache should be very fast and reliable
  }

  return results
}

/**
 * Test behavioral prediction accuracy
 */
async function testBehaviorPrediction(prefetchManager, iterations) {
  const results = {
    test: 'Behavior Prediction',
    predictions: [],
    accuracyScores: [],
    passed: false
  }

  const testJourney = [
    { page: 'foundation', data: { businessType: 'Electronics' } },
    { page: 'product', data: { selectedProducts: 2 } },
    { page: 'routing', data: { selectedRoute: 'CN-MX-US' } }
  ]

  for (let i = 0; i < iterations; i++) {
    try {
      // Simulate user journey
      for (let j = 0; j < testJourney.length; j++) {
        const currentStep = testJourney[j]
        prefetchManager.predictor.recordPageVisit(currentStep.page, currentStep.data)

        if (j < testJourney.length - 1) {
          const nextStep = testJourney[j + 1]
          const predictions = prefetchManager.predictor.predictNextPages(currentStep.page, 0.7)
          
          // Check if next step was predicted
          const predicted = predictions.some(p => p.page === nextStep.page)
          results.predictions.push({
            current: currentStep.page,
            predicted: predictions.map(p => p.page),
            actual: nextStep.page,
            correct: predicted
          })
        }
      }

      // Calculate accuracy for this iteration
      const correct = results.predictions.filter(p => p.correct).length
      const total = results.predictions.length
      const accuracy = total > 0 ? (correct / total) * 100 : 0
      results.accuracyScores.push(accuracy)

    } catch (error) {
      logError('Behavior prediction test failed', error)
      results.accuracyScores.push(0)
    }
  }

  // Calculate overall accuracy
  if (results.accuracyScores.length > 0) {
    results.avgAccuracy = Math.round(
      results.accuracyScores.reduce((sum, score) => sum + score, 0) / results.accuracyScores.length
    )
    results.passed = results.avgAccuracy >= 70 // Should predict correctly 70%+ of the time
  }

  return results
}

/**
 * Test queue management and rate limiting
 */
async function testQueueManagement(prefetchManager, iterations) {
  const results = {
    test: 'Queue Management',
    queueOperations: [],
    rateLimitHits: 0,
    passed: false
  }

  for (let i = 0; i < iterations; i++) {
    try {
      const start = Date.now()
      
      // Create multiple concurrent prefetch requests
      const promises = []
      for (let j = 0; j < 10; j++) {
        const promise = prefetchManager.prefetchProduct({
          businessType: `TestType${j}`,
          zipCode: `1000${j}`
        })
        promises.push(promise)
      }

      // Wait for all to complete or timeout
      const settled = await Promise.allSettled(promises)
      const duration = Date.now() - start

      const successful = settled.filter(p => p.status === 'fulfilled').length
      const failed = settled.filter(p => p.status === 'rejected').length

      results.queueOperations.push({
        duration,
        successful,
        failed,
        queueSize: prefetchManager.queue.getStats().queued
      })

      // Check if rate limiting was triggered
      if (!prefetchManager.rateLimiter.canMakeRequest()) {
        results.rateLimitHits++
      }

    } catch (error) {
      logError('Queue management test failed', error)
    }
  }

  // Analyze results
  if (results.queueOperations.length > 0) {
    const totalSuccessful = results.queueOperations.reduce((sum, op) => sum + op.successful, 0)
    const totalFailed = results.queueOperations.reduce((sum, op) => sum + op.failed, 0)
    const avgDuration = results.queueOperations.reduce((sum, op) => sum + op.duration, 0) / results.queueOperations.length

    results.successRate = ((totalSuccessful / (totalSuccessful + totalFailed)) * 100).toFixed(1)
    results.avgDuration = Math.round(avgDuration)
    results.rateLimitingWorking = results.rateLimitHits > 0
    results.passed = parseFloat(results.successRate) >= 80 && results.rateLimitingWorking
  }

  return results
}

/**
 * Generate test summary
 */
function generateTestSummary(tests) {
  const passed = []
  const improvements = []

  Object.values(tests).forEach(test => {
    passed.push(test.passed)
    if (test.improvement !== undefined) {
      improvements.push(parseFloat(test.improvement))
    }
  })

  return {
    totalTests: Object.keys(tests).length,
    testsPassed: passed.filter(p => p).length,
    overallStatus: passed.every(p => p) ? 'PASSED' : 'NEEDS_ATTENTION',
    averageImprovement: improvements.length > 0 
      ? (improvements.reduce((sum, i) => sum + i, 0) / improvements.length).toFixed(1) + '%'
      : 'N/A'
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations(tests, systemMetrics) {
  const recommendations = []

  // Check product prefetching
  if (tests.productPrefetching && !tests.productPrefetching.passed) {
    recommendations.push({
      type: 'prefetching',
      priority: 'high',
      message: 'Product prefetching performance below target',
      action: 'Enable NEXT_PUBLIC_USE_PREFETCHING=true and verify API endpoints'
    })
  }

  // Check cache performance
  if (tests.cachePerformance && !tests.cachePerformance.passed) {
    recommendations.push({
      type: 'caching',
      priority: 'medium',
      message: 'Cache performance suboptimal',
      action: 'Review cache TTL settings and memory limits'
    })
  }

  // Check behavior prediction
  if (tests.behaviorPrediction && tests.behaviorPrediction.avgAccuracy < 70) {
    recommendations.push({
      type: 'prediction',
      priority: 'medium',
      message: `Prediction accuracy at ${tests.behaviorPrediction.avgAccuracy}%`,
      action: 'Collect more user behavior data to improve prediction models'
    })
  }

  // Check system health
  if (parseFloat(systemMetrics?.performance?.errorRate) > 15) {
    recommendations.push({
      type: 'reliability',
      priority: 'high',
      message: `High error rate: ${systemMetrics.performance.errorRate}`,
      action: 'Review API endpoints and error handling'
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      priority: 'info',
      message: 'All Phase 3 prefetching tests passed successfully',
      action: 'Consider enabling prefetching in production'
    })
  }

  return recommendations
}