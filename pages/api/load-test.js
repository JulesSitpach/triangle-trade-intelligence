/**
 * Triangle Intelligence Platform - Load Testing API Endpoint
 * Simplified load testing via API for dashboard integration
 */

import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    })
  }
  
  try {
    const { concurrentUsers = 5, testType = 'quick' } = req.body
    
    logInfo(`Starting ${testType} load test with ${concurrentUsers} concurrent users`)
    
    // Validate input
    if (concurrentUsers > 20) {
      return res.status(400).json({
        error: 'Maximum 20 concurrent users allowed for API testing',
        maxAllowed: 20,
        requested: concurrentUsers
      })
    }
    
    const results = await runSimplifiedLoadTest(concurrentUsers, testType)
    
    const totalDuration = Date.now() - startTime
    logPerformance('api_load_test', totalDuration, results.summary)
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      testConfiguration: {
        concurrentUsers,
        testType,
        duration: totalDuration
      },
      results,
      message: `Load test completed: ${results.summary.successRate}% success rate`
    })
    
  } catch (error) {
    logError('Load test API failed', { error: error.message })
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Run simplified load test suitable for API calls
 */
async function runSimplifiedLoadTest(concurrentUsers, testType) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const testEndpoints = [
    '/api/status',
    '/api/database-structure-test',
    '/api/infrastructure-health'
  ]
  
  const startTime = Date.now()
  const requests = []
  
  // Create concurrent requests
  for (let i = 0; i < concurrentUsers; i++) {
    const userRequests = testEndpoints.map(async (endpoint, endpointIndex) => {
      const requestStart = Date.now()
      
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': `LoadTest-User-${i + 1}` }
        })
        
        const duration = Date.now() - requestStart
        
        return {
          userId: i + 1,
          endpoint,
          duration,
          status: response.ok ? 'success' : 'failed',
          statusCode: response.status,
          success: response.ok
        }
        
      } catch (error) {
        return {
          userId: i + 1,
          endpoint,
          duration: Date.now() - requestStart,
          status: 'error',
          error: error.message,
          success: false
        }
      }
    })
    
    requests.push(...userRequests)
  }
  
  // Execute all requests concurrently
  const results = await Promise.all(requests)
  const totalDuration = Date.now() - startTime
  
  // Analyze results
  const successfulRequests = results.filter(r => r.success)
  const failedRequests = results.filter(r => !r.success)
  const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length
  
  // Group by endpoint
  const endpointAnalysis = {}
  results.forEach(result => {
    if (!endpointAnalysis[result.endpoint]) {
      endpointAnalysis[result.endpoint] = {
        totalRequests: 0,
        successfulRequests: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        durations: []
      }
    }
    
    const analysis = endpointAnalysis[result.endpoint]
    analysis.totalRequests++
    if (result.success) analysis.successfulRequests++
    analysis.durations.push(result.duration)
    analysis.minDuration = Math.min(analysis.minDuration, result.duration)
    analysis.maxDuration = Math.max(analysis.maxDuration, result.duration)
  })
  
  // Calculate averages and percentiles for each endpoint
  Object.keys(endpointAnalysis).forEach(endpoint => {
    const analysis = endpointAnalysis[endpoint]
    analysis.avgDuration = Math.round(
      analysis.durations.reduce((sum, d) => sum + d, 0) / analysis.durations.length
    )
    analysis.successRate = Math.round(
      (analysis.successfulRequests / analysis.totalRequests) * 100 * 100
    ) / 100
    
    // Calculate 95th percentile
    const sortedDurations = analysis.durations.sort((a, b) => a - b)
    analysis.p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0
    
    delete analysis.durations // Clean up raw data
  })
  
  const successRate = Math.round((successfulRequests.length / results.length) * 100 * 100) / 100
  
  // Determine performance rating
  let rating = 'poor'
  if (successRate >= 95 && avgResponseTime < 1000) {
    rating = 'excellent'
  } else if (successRate >= 90 && avgResponseTime < 2000) {
    rating = 'good'
  } else if (successRate >= 80 && avgResponseTime < 3000) {
    rating = 'acceptable'
  } else if (successRate >= 60) {
    rating = 'degraded'
  }
  
  return {
    summary: {
      totalRequests: results.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate,
      avgResponseTime: Math.round(avgResponseTime),
      totalDuration,
      rating
    },
    endpointAnalysis,
    concurrentUsersHandled: concurrentUsers,
    recommendation: generateSimpleRecommendation(successRate, avgResponseTime, concurrentUsers),
    readiness: {
      productionReady: successRate >= 90 && avgResponseTime < 2000,
      canScale: successRate >= 95 && avgResponseTime < 1000,
      needsOptimization: successRate < 80 || avgResponseTime > 3000
    }
  }
}

/**
 * Generate simple recommendations based on load test results
 */
function generateSimpleRecommendation(successRate, avgResponseTime, concurrentUsers) {
  if (successRate >= 95 && avgResponseTime < 1000) {
    return {
      status: 'excellent',
      message: `System performing excellently with ${concurrentUsers} concurrent users`,
      nextStep: 'Ready for production deployment'
    }
  }
  
  if (successRate >= 90 && avgResponseTime < 2000) {
    return {
      status: 'good',
      message: `System performing well with ${concurrentUsers} concurrent users`,
      nextStep: 'Consider database optimizations for better performance'
    }
  }
  
  if (successRate >= 80) {
    return {
      status: 'acceptable',
      message: `System handling load but with some performance issues`,
      nextStep: 'Optimize slow endpoints and implement caching'
    }
  }
  
  return {
    status: 'needs_work',
    message: `System struggling with ${concurrentUsers} concurrent users`,
    nextStep: 'Critical optimization needed before production'
  }
}