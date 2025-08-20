/**
 * Infrastructure Test API - Production Readiness Check
 * Tests all critical infrastructure components for Triangle Intelligence Platform
 */

import { universalCache } from '../../lib/utils/memory-cache-fallback.js'
import { queryOptimizer } from '../../lib/database/query-optimizer.js'
import { getSupabaseClient } from '../../lib/supabase-client.js'
import { logger, logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  logInfo('Infrastructure test started', {
    method: req.method,
    timestamp: new Date().toISOString()
  })

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {},
    performance: {},
    recommendations: []
  }

  try {
    // 1. Test Database Connection
    logInfo('Testing database connection...')
    const dbStartTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      const { data: dbTest, error: dbError } = await supabase
        .from('countries')
        .select('*')
        .limit(1)

      const dbDuration = Date.now() - dbStartTime
      
      testResults.tests.database = {
        status: dbError ? 'FAILED' : 'PASS',
        duration: dbDuration,
        error: dbError?.message,
        recordsFound: dbTest?.length || 0
      }

      if (dbDuration > 1000) {
        testResults.recommendations.push('Database query >1s - consider connection optimization')
      }

    } catch (error) {
      testResults.tests.database = {
        status: 'FAILED',
        error: error.message,
        duration: Date.now() - dbStartTime
      }
    }

    // 2. Test Cache System (Universal Cache with Redis/Memory fallback)
    logInfo('Testing cache system...')
    const cacheStartTime = Date.now()
    
    try {
      const testKey = 'infrastructure_test_' + Date.now()
      const testValue = { test: true, timestamp: new Date().toISOString() }
      
      // Test SET
      await universalCache.set(testKey, testValue, 60)
      
      // Test GET
      const cachedValue = await universalCache.get(testKey)
      
      // Test DELETE
      await universalCache.del(testKey)
      
      const cacheDuration = Date.now() - cacheStartTime
      const cacheStats = universalCache.getStats()
      
      testResults.tests.cache = {
        status: (cachedValue && cachedValue.test) ? 'PASS' : 'FAILED',
        duration: cacheDuration,
        backend: cacheStats.usingFallback ? 'MEMORY_FALLBACK' : 'REDIS',
        stats: cacheStats
      }

      if (cacheStats.usingFallback) {
        testResults.recommendations.push('Using memory cache fallback - deploy Redis for production')
      }

    } catch (error) {
      testResults.tests.cache = {
        status: 'FAILED',
        error: error.message,
        duration: Date.now() - cacheStartTime
      }
    }

    // 3. Test Query Optimizer Performance
    logInfo('Testing query optimizer performance...')
    const queryStartTime = Date.now()
    
    try {
      const testParams = {
        origin: 'CN',
        destination: 'US', 
        hsCode: '8471',
        businessType: 'Electronics'
      }
      
      const queryResult = await queryOptimizer.getTriangleRoutingData(testParams)
      const queryDuration = Date.now() - queryStartTime
      
      testResults.tests.queryOptimizer = {
        status: queryResult ? 'PASS' : 'FAILED',
        duration: queryDuration,
        recordsAnalyzed: queryResult.totalRecords || 0,
        triangleRoutes: queryResult.triangleOptions?.length || 0,
        optimized: queryResult.efficiency?.optimized || false
      }

      if (queryDuration > 1000) {
        testResults.recommendations.push('Query optimizer >1s - check database indexes and caching')
      }

    } catch (error) {
      testResults.tests.queryOptimizer = {
        status: 'FAILED',
        error: error.message,
        duration: Date.now() - queryStartTime
      }
    }

    // 4. Test Memory Usage
    const memoryUsage = process.memoryUsage()
    testResults.tests.memory = {
      status: memoryUsage.heapUsed < (512 * 1024 * 1024) ? 'PASS' : 'WARNING', // 512MB threshold
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
    }

    if (memoryUsage.heapUsed > (256 * 1024 * 1024)) {
      testResults.recommendations.push('High memory usage detected - implement memory optimization')
    }

    // 5. Overall Performance Assessment
    const totalDuration = Date.now() - startTime
    testResults.performance = {
      totalTestDuration: totalDuration,
      status: totalDuration < 2000 ? 'EXCELLENT' : totalDuration < 5000 ? 'GOOD' : 'NEEDS_OPTIMIZATION',
      target: '<2000ms for all tests'
    }

    // 6. Production Readiness Score
    const passedTests = Object.values(testResults.tests).filter(test => test.status === 'PASS').length
    const totalTests = Object.keys(testResults.tests).length
    const readinessScore = Math.round((passedTests / totalTests) * 100)
    
    testResults.productionReadiness = {
      score: readinessScore,
      level: readinessScore >= 90 ? 'READY' : 
             readinessScore >= 70 ? 'ALMOST_READY' : 
             'NEEDS_WORK',
      passedTests,
      totalTests
    }

    // Add specific recommendations based on test results
    if (testResults.tests.cache?.backend === 'MEMORY_FALLBACK') {
      testResults.recommendations.push('PRIORITY: Deploy Redis for production-grade caching and rate limiting')
    }

    if (testResults.performance.status !== 'EXCELLENT') {
      testResults.recommendations.push('Optimize query performance and enable all caching layers')
    }

    // Log performance metrics
    logPerformance('infrastructure_test_complete', totalDuration, {
      readinessScore,
      level: testResults.productionReadiness.level,
      recommendationsCount: testResults.recommendations.length
    })

    res.status(200).json(testResults)

  } catch (error) {
    logError('Infrastructure test failed', { error: error.message })
    
    res.status(500).json({
      error: 'Infrastructure test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      recommendations: [
        'Check environment variables and database connectivity',
        'Verify all required services are running',
        'Review server logs for detailed error information'
      ]
    })
  }
}