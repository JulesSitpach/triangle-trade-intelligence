/**
 * Triangle Intelligence Platform - Concurrent User Load Testing
 * Tests system performance under various concurrent user loads
 * Run with: node scripts/load-test-concurrent-users.js [concurrent_users]
 */

import { logInfo, logError, logPerformance } from '../lib/utils/production-logger.js'

class ConcurrentUserLoadTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3006'
    this.defaultConcurrency = options.concurrency || 10
    this.testDuration = options.duration || 30000 // 30 seconds
    this.rampUpTime = options.rampUpTime || 5000   // 5 seconds
    this.results = []
    this.errors = []
  }

  /**
   * Simulate a realistic user journey through the platform
   */
  async simulateUserJourney(userId) {
    const userStartTime = Date.now()
    const journey = []
    
    try {
      // Step 1: Check system status (health check)
      const statusStart = Date.now()
      const statusResponse = await this.makeRequest('/api/status')
      journey.push({
        step: 'status_check',
        duration: Date.now() - statusStart,
        status: statusResponse.ok ? 'success' : 'failed',
        statusCode: statusResponse.status
      })
      
      // Step 2: Get database structure info
      const dbStart = Date.now()
      const dbResponse = await this.makeRequest('/api/database-structure-test')
      journey.push({
        step: 'database_structure',
        duration: Date.now() - dbStart,
        status: dbResponse.ok ? 'success' : 'failed',
        statusCode: dbResponse.status
      })
      
      // Step 3: Test intelligence API (core functionality)
      const intelStart = Date.now()
      const intelResponse = await this.makeRequest('/api/dashboard-hub-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardView: 'executive',
          mockUserProfile: {
            businessType: 'Electronics',
            primarySupplierCountry: 'China',
            importVolume: '$1M - $5M'
          }
        })
      })
      journey.push({
        step: 'intelligence_api',
        duration: Date.now() - intelStart,
        status: intelResponse.ok ? 'success' : 'failed',
        statusCode: intelResponse.status
      })
      
      // Step 4: Test batch query optimization
      const batchStart = Date.now()
      const batchResponse = await this.makeRequest('/api/batch-query-test')
      journey.push({
        step: 'batch_queries',
        duration: Date.now() - batchStart,
        status: batchResponse.ok ? 'success' : 'failed',
        statusCode: batchResponse.status
      })
      
      const totalJourneyTime = Date.now() - userStartTime
      
      return {
        userId,
        totalTime: totalJourneyTime,
        steps: journey.length,
        successfulSteps: journey.filter(step => step.status === 'success').length,
        journey,
        overallStatus: journey.every(step => step.status === 'success') ? 'success' : 'partial_failure'
      }
      
    } catch (error) {
      this.errors.push({
        userId,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      return {
        userId,
        totalTime: Date.now() - userStartTime,
        steps: journey.length,
        successfulSteps: journey.filter(step => step.status === 'success').length,
        journey,
        overallStatus: 'failed',
        error: error.message
      }
    }
  }
  
  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(endpoint, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
      
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
  
  /**
   * Run concurrent user load test
   */
  async runLoadTest(concurrentUsers = this.defaultConcurrency) {
    const testStartTime = Date.now()
    
    logInfo(`Starting load test with ${concurrentUsers} concurrent users`)
    logInfo(`Test duration: ${this.testDuration}ms, Ramp-up: ${this.rampUpTime}ms`)
    
    const users = []
    const results = []
    
    // Ramp up users gradually
    const userInterval = this.rampUpTime / concurrentUsers
    
    for (let i = 0; i < concurrentUsers; i++) {
      // Stagger user start times to simulate realistic load
      setTimeout(async () => {
        const userResult = await this.simulateUserJourney(`user_${i + 1}`)
        results.push(userResult)
      }, i * userInterval)
    }
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, this.testDuration))
    
    // Wait a bit longer for any remaining requests
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const testEndTime = Date.now()
    const totalTestTime = testEndTime - testStartTime
    
    return this.analyzeResults(results, totalTestTime, concurrentUsers)
  }
  
  /**
   * Analyze load test results and generate report
   */
  analyzeResults(results, totalTestTime, concurrentUsers) {
    if (results.length === 0) {
      return {
        status: 'failed',
        message: 'No results collected - test may have failed',
        concurrentUsers,
        totalTestTime
      }
    }
    
    // Calculate performance metrics
    const successfulJourneys = results.filter(r => r.overallStatus === 'success')
    const partialFailures = results.filter(r => r.overallStatus === 'partial_failure')
    const failures = results.filter(r => r.overallStatus === 'failed')
    
    const journeyTimes = results.map(r => r.totalTime)
    const avgJourneyTime = journeyTimes.reduce((sum, time) => sum + time, 0) / journeyTimes.length
    const minJourneyTime = Math.min(...journeyTimes)
    const maxJourneyTime = Math.max(...journeyTimes)
    
    // Calculate percentiles
    const sortedTimes = journeyTimes.sort((a, b) => a - b)
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)]
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)]
    
    // Analyze step performance
    const stepAnalysis = {}
    results.forEach(result => {
      result.journey.forEach(step => {
        if (!stepAnalysis[step.step]) {
          stepAnalysis[step.step] = {
            totalRequests: 0,
            successfulRequests: 0,
            totalDuration: 0,
            minDuration: Infinity,
            maxDuration: 0
          }
        }
        
        const analysis = stepAnalysis[step.step]
        analysis.totalRequests++
        if (step.status === 'success') analysis.successfulRequests++
        analysis.totalDuration += step.duration
        analysis.minDuration = Math.min(analysis.minDuration, step.duration)
        analysis.maxDuration = Math.max(analysis.maxDuration, step.duration)
      })
    })
    
    // Calculate success rates and averages for each step
    Object.keys(stepAnalysis).forEach(stepName => {
      const step = stepAnalysis[stepName]
      step.successRate = (step.successfulRequests / step.totalRequests) * 100
      step.avgDuration = step.totalDuration / step.totalRequests
      step.avgDuration = Math.round(step.avgDuration)
      step.minDuration = step.minDuration === Infinity ? 0 : step.minDuration
    })
    
    // Determine overall system performance
    const overallSuccessRate = (successfulJourneys.length / results.length) * 100
    let performanceRating = 'poor'
    
    if (overallSuccessRate >= 95 && avgJourneyTime < 3000) {
      performanceRating = 'excellent'
    } else if (overallSuccessRate >= 90 && avgJourneyTime < 5000) {
      performanceRating = 'good'
    } else if (overallSuccessRate >= 80 && avgJourneyTime < 8000) {
      performanceRating = 'acceptable'
    } else if (overallSuccessRate >= 60) {
      performanceRating = 'degraded'
    }
    
    // Generate recommendations
    const recommendations = this.generateLoadTestRecommendations({
      overallSuccessRate,
      avgJourneyTime,
      maxJourneyTime,
      p95,
      stepAnalysis,
      concurrentUsers
    })
    
    const report = {
      status: 'completed',
      timestamp: new Date().toISOString(),
      testConfiguration: {
        concurrentUsers,
        testDuration: this.testDuration,
        rampUpTime: this.rampUpTime,
        totalTestTime
      },
      results: {
        totalJourneys: results.length,
        successfulJourneys: successfulJourneys.length,
        partialFailures: partialFailures.length,
        failures: failures.length,
        overallSuccessRate: Math.round(overallSuccessRate * 100) / 100
      },
      performance: {
        rating: performanceRating,
        avgJourneyTime: Math.round(avgJourneyTime),
        minJourneyTime,
        maxJourneyTime,
        percentiles: {
          p50: Math.round(p50),
          p95: Math.round(p95),
          p99: Math.round(p99)
        }
      },
      stepAnalysis,
      recommendations,
      errors: this.errors.slice(0, 10), // Include first 10 errors
      readiness: {
        canHandle10Users: overallSuccessRate >= 95,
        canHandle50Users: overallSuccessRate >= 95 && avgJourneyTime < 3000,
        canHandle100Users: overallSuccessRate >= 95 && avgJourneyTime < 2000,
        productionReady: overallSuccessRate >= 90 && avgJourneyTime < 5000
      }
    }
    
    logPerformance('concurrent_user_load_test', totalTestTime, {
      concurrentUsers,
      successRate: overallSuccessRate,
      avgResponseTime: avgJourneyTime,
      performanceRating
    })
    
    return report
  }
  
  /**
   * Generate recommendations based on load test results
   */
  generateLoadTestRecommendations(metrics) {
    const recommendations = []
    
    if (metrics.overallSuccessRate < 90) {
      recommendations.push({
        priority: 'critical',
        category: 'reliability',
        issue: `Success rate below 90% (${metrics.overallSuccessRate}%)`,
        recommendation: 'Investigate and fix API failures before production',
        impact: 'Critical for production readiness'
      })
    }
    
    if (metrics.avgJourneyTime > 5000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        issue: `Average response time too high (${metrics.avgJourneyTime}ms)`,
        recommendation: 'Optimize database queries and implement caching',
        impact: 'Poor user experience'
      })
    }
    
    if (metrics.p95 > 8000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        issue: `95th percentile response time excessive (${metrics.p95}ms)`,
        recommendation: 'Investigate slowest queries and optimize',
        impact: '5% of users experiencing poor performance'
      })
    }
    
    // Step-specific recommendations
    Object.entries(metrics.stepAnalysis).forEach(([stepName, analysis]) => {
      if (analysis.successRate < 95) {
        recommendations.push({
          priority: 'high',
          category: 'reliability',
          issue: `${stepName} has ${analysis.successRate}% success rate`,
          recommendation: `Investigate and fix ${stepName} endpoint`,
          impact: 'Specific functionality failing'
        })
      }
      
      if (analysis.avgDuration > 3000) {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          issue: `${stepName} average response time: ${analysis.avgDuration}ms`,
          recommendation: `Optimize ${stepName} endpoint performance`,
          impact: 'Slow response times affecting user experience'
        })
      }
    })
    
    // Scaling recommendations
    if (metrics.concurrentUsers >= 50 && metrics.overallSuccessRate >= 90) {
      recommendations.push({
        priority: 'optimization',
        category: 'scaling',
        issue: 'System handling high concurrent load well',
        recommendation: 'Consider implementing Redis and database indexes for further optimization',
        impact: 'Enable support for 100+ concurrent users'
      })
    }
    
    return recommendations
  }
}

/**
 * Main execution function
 */
async function runLoadTest() {
  const concurrentUsers = parseInt(process.argv[2]) || 10
  
  console.log('🚀 Triangle Intelligence Platform - Concurrent User Load Test')
  console.log('=' .repeat(65))
  
  const tester = new ConcurrentUserLoadTester({
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006'
  })
  
  try {
    const report = await tester.runLoadTest(concurrentUsers)
    
    console.log('\n📊 Load Test Report')
    console.log('=' .repeat(40))
    console.log(`Concurrent Users: ${report.testConfiguration.concurrentUsers}`)
    console.log(`Test Duration: ${report.testConfiguration.testDuration}ms`)
    console.log(`Success Rate: ${report.results.overallSuccessRate}%`)
    console.log(`Average Journey Time: ${report.performance.avgJourneyTime}ms`)
    console.log(`Performance Rating: ${report.performance.rating}`)
    console.log(`95th Percentile: ${report.performance.percentiles.p95}ms`)
    
    console.log('\n🎯 Production Readiness:')
    console.log(`✅ Can handle 10 users: ${report.readiness.canHandle10Users}`)
    console.log(`✅ Can handle 50 users: ${report.readiness.canHandle50Users}`)
    console.log(`✅ Can handle 100 users: ${report.readiness.canHandle100Users}`)
    console.log(`✅ Production ready: ${report.readiness.productionReady}`)
    
    console.log('\n📈 Step Performance:')
    Object.entries(report.stepAnalysis).forEach(([step, analysis]) => {
      console.log(`   ${step}: ${analysis.avgDuration}ms (${analysis.successRate}% success)`)
    })
    
    if (report.recommendations.length > 0) {
      console.log('\n🔧 Recommendations:')
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`)
      })
    }
    
    if (report.errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      report.errors.forEach(error => {
        console.log(`   User ${error.userId}: ${error.error}`)
      })
    }
    
    console.log('\n✅ Load test completed successfully')
    
  } catch (error) {
    console.error('❌ Load test failed:', error.message)
    process.exit(1)
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLoadTest()
}

export { ConcurrentUserLoadTester }