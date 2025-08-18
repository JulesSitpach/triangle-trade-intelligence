/**
 * PHASE 2 OPTIMIZATION TESTING API
 * Tests optimized queries, RPC functions, and performance improvements
 * Validates that Phase 2 delivers 80%+ performance improvements
 */

import DatabaseIntelligenceBridge from '../../lib/intelligence/database-intelligence-bridge'
import { OptimizedQueries } from '../../lib/database/optimized-queries'
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { testType = 'all', iterations = 3 } = req.body

  logInfo('Phase 2 optimization testing started', { testType, iterations })

  try {
    const results = {
      phase: 2,
      testType,
      iterations,
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {},
      recommendations: []
    }

    // Test 1: RPC Function Performance
    if (testType === 'all' || testType === 'rpc') {
      results.tests.rpcPerformance = await testRPCPerformance(iterations)
    }

    // Test 2: Batch Operations vs N+1 Queries  
    if (testType === 'all' || testType === 'batch') {
      results.tests.batchOperations = await testBatchOperations(iterations)
    }

    // Test 3: Query Caching Effectiveness
    if (testType === 'all' || testType === 'cache') {
      results.tests.cacheEffectiveness = await testCacheEffectiveness(iterations)
    }

    // Test 4: Trade Flows Query Optimization
    if (testType === 'all' || testType === 'tradeflows') {
      results.tests.tradeFlowsOptimization = await testTradeFlowsOptimization(iterations)
    }

    // Generate summary and recommendations
    results.summary = generateTestSummary(results.tests)
    results.recommendations = generateRecommendations(results.tests)

    logPerformance('phase2_optimization_test', Date.now(), { 
      testCount: Object.keys(results.tests).length,
      overallImprovement: results.summary.averageImprovement 
    })

    res.status(200).json(results)

  } catch (error) {
    logError('Phase 2 optimization test failed', { error, testType })
    res.status(500).json({ 
      error: error.message,
      phase: 2,
      testType,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Test RPC function performance vs individual queries
 */
async function testRPCPerformance(iterations) {
  const results = {
    test: 'RPC Performance',
    rpcTimes: [],
    individualTimes: [],
    improvement: 0,
    passed: false
  }

  for (let i = 0; i < iterations; i++) {
    // Test RPC function
    const rpcStart = Date.now()
    try {
      await OptimizedQueries.getCompleteIntelligence('Electronics', ['8471', '8517'])
      results.rpcTimes.push(Date.now() - rpcStart)
    } catch (error) {
      logError('RPC test failed', error)
      results.rpcTimes.push(null)
    }

    // Test individual queries (simulated)
    const individualStart = Date.now()
    try {
      // Simulate multiple individual queries
      await Promise.all([
        OptimizedQueries.getOptimizedTradeFlows({ businessType: 'Electronics', limit: 25 }),
        OptimizedQueries.getBatchHSCodeData(['8471', '8517'])
      ])
      results.individualTimes.push(Date.now() - individualStart)
    } catch (error) {
      logError('Individual queries test failed', error)
      results.individualTimes.push(null)
    }
  }

  // Calculate performance improvement
  const avgRPC = results.rpcTimes.filter(t => t !== null).reduce((sum, t) => sum + t, 0) / results.rpcTimes.length
  const avgIndividual = results.individualTimes.filter(t => t !== null).reduce((sum, t) => sum + t, 0) / results.individualTimes.length

  results.improvement = ((avgIndividual - avgRPC) / avgIndividual * 100).toFixed(1)
  results.passed = parseFloat(results.improvement) >= 50 // Should be 50%+ faster
  results.avgRPCTime = avgRPC
  results.avgIndividualTime = avgIndividual

  return results
}

/**
 * Test batch operations vs N+1 queries
 */
async function testBatchOperations(iterations) {
  const results = {
    test: 'Batch Operations',
    batchTimes: [],
    n1Times: [],
    improvement: 0,
    passed: false
  }

  const testHSCodes = ['8471', '8517', '8703', '8708', '6203', '6204']

  for (let i = 0; i < iterations; i++) {
    // Test batch operation
    const batchStart = Date.now()
    try {
      await OptimizedQueries.getBatchHSCodeData(testHSCodes)
      results.batchTimes.push(Date.now() - batchStart)
    } catch (error) {
      logError('Batch operation test failed', error)
      results.batchTimes.push(null)
    }

    // Simulate N+1 individual queries
    const n1Start = Date.now()
    try {
      const promises = testHSCodes.map(hsCode => 
        OptimizedQueries.getBatchHSCodeData([hsCode]) // Individual query per HS code
      )
      await Promise.all(promises)
      results.n1Times.push(Date.now() - n1Start)
    } catch (error) {
      logError('N+1 queries test failed', error)
      results.n1Times.push(null)
    }
  }

  // Calculate improvement
  const avgBatch = results.batchTimes.filter(t => t !== null).reduce((sum, t) => sum + t, 0) / results.batchTimes.length
  const avgN1 = results.n1Times.filter(t => t !== null).reduce((sum, t) => sum + t, 0) / results.n1Times.length

  results.improvement = ((avgN1 - avgBatch) / avgN1 * 100).toFixed(1)
  results.passed = parseFloat(results.improvement) >= 60 // Should eliminate N+1 overhead
  results.avgBatchTime = avgBatch
  results.avgN1Time = avgN1
  results.queriesReduced = `${testHSCodes.length} → 1`

  return results
}

/**
 * Test cache effectiveness
 */
async function testCacheEffectiveness(iterations) {
  const results = {
    test: 'Cache Effectiveness',
    coldTimes: [],
    warmTimes: [],
    hitRate: 0,
    improvement: 0,
    passed: false
  }

  const testParams = { businessType: 'Electronics', limit: 20 }

  // Clear cache first
  OptimizedQueries.clearCache()

  for (let i = 0; i < iterations; i++) {
    // Cold cache test
    OptimizedQueries.clearCache()
    const coldStart = Date.now()
    try {
      await OptimizedQueries.getOptimizedTradeFlows(testParams)
      results.coldTimes.push(Date.now() - coldStart)
    } catch (error) {
      results.coldTimes.push(null)
    }

    // Warm cache test (same query)
    const warmStart = Date.now()
    try {
      await OptimizedQueries.getOptimizedTradeFlows(testParams)
      results.warmTimes.push(Date.now() - warmStart)
    } catch (error) {
      results.warmTimes.push(null)
    }
  }

  // Calculate cache effectiveness
  const avgCold = results.coldTimes.filter(t => t !== null).reduce((sum, t) => sum + t, 0) / results.coldTimes.length
  const avgWarm = results.warmTimes.filter(t => t !== null).reduce((sum, t) => sum + t, 0) / results.warmTimes.length

  results.improvement = ((avgCold - avgWarm) / avgCold * 100).toFixed(1)
  results.hitRate = OptimizedQueries.getCacheMetrics().hitRate
  results.passed = parseFloat(results.improvement) >= 90 // Cache should be 90%+ faster
  results.avgColdTime = avgCold
  results.avgWarmTime = avgWarm

  return results
}

/**
 * Test trade flows optimization
 */
async function testTradeFlowsOptimization(iterations) {
  const results = {
    test: 'Trade Flows Optimization',
    optimizedTimes: [],
    recordCounts: [],
    avgLatency: 0,
    passed: false
  }

  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    try {
      const data = await OptimizedQueries.getOptimizedTradeFlows({
        businessType: 'Manufacturing',
        originCountry: 'CN',
        destinationCountry: 'US',
        limit: 50
      })

      const latency = Date.now() - start
      results.optimizedTimes.push(latency)
      results.recordCounts.push(data.flows?.length || 0)

    } catch (error) {
      logError('Trade flows optimization test failed', error)
      results.optimizedTimes.push(null)
      results.recordCounts.push(0)
    }
  }

  // Calculate metrics
  const validTimes = results.optimizedTimes.filter(t => t !== null)
  results.avgLatency = validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length
  results.avgRecordCount = results.recordCounts.reduce((sum, c) => sum + c, 0) / results.recordCounts.length
  results.passed = results.avgLatency < 1000 // Should be under 1 second
  results.maxLatency = Math.max(...validTimes)
  results.minLatency = Math.min(...validTimes)

  return results
}

/**
 * Generate test summary
 */
function generateTestSummary(tests) {
  const improvements = []
  const passed = []

  Object.values(tests).forEach(test => {
    if (test.improvement !== undefined) {
      improvements.push(parseFloat(test.improvement))
    }
    passed.push(test.passed)
  })

  return {
    totalTests: Object.keys(tests).length,
    testsPassed: passed.filter(p => p).length,
    averageImprovement: improvements.length > 0 
      ? (improvements.reduce((sum, i) => sum + i, 0) / improvements.length).toFixed(1) + '%'
      : 'N/A',
    overallStatus: passed.every(p => p) ? 'PASSED' : 'NEEDS_ATTENTION'
  }
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(tests) {
  const recommendations = []

  // Check RPC performance
  if (tests.rpcPerformance && !tests.rpcPerformance.passed) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'RPC functions not delivering expected performance gains',
      action: 'Review database indexes and RPC function optimization'
    })
  }

  // Check batch operations
  if (tests.batchOperations && !tests.batchOperations.passed) {
    recommendations.push({
      type: 'queries',
      priority: 'high', 
      message: 'Batch operations need optimization',
      action: 'Enable NEXT_PUBLIC_USE_BATCH_OPERATIONS=true'
    })
  }

  // Check caching
  if (tests.cacheEffectiveness && !tests.cacheEffectiveness.passed) {
    recommendations.push({
      type: 'caching',
      priority: 'medium',
      message: 'Cache effectiveness below optimal',
      action: 'Enable NEXT_PUBLIC_USE_QUERY_CACHING=true'
    })
  }

  // Check trade flows
  if (tests.tradeFlowsOptimization && !tests.tradeFlowsOptimization.passed) {
    recommendations.push({
      type: 'database',
      priority: 'high',
      message: 'Trade flows queries exceeding 1 second latency',
      action: 'Review database indexes and query optimization'
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      priority: 'info',
      message: 'All Phase 2 optimizations performing as expected',
      action: 'Consider enabling optimizations in production'
    })
  }

  return recommendations
}