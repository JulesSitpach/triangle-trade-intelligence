/**
 * Triangle Intelligence Comprehensive API Performance Audit
 * Enterprise Readiness Validation for $2,500/month tier
 * 
 * Tests all critical endpoints under various load conditions
 * Identifies performance bottlenecks and scalability issues
 * Generates actionable optimization recommendations
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '../../.env.local' });

class ComprehensiveAPIAuditor {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      baseline: {},
      concurrent: {},
      stress: {},
      recommendations: []
    };
    
    // Comprehensive endpoint testing matrix
    this.endpointCategories = {
      
      // Core Revenue APIs - CRITICAL for enterprise tier
      coreRevenue: [
        {
          endpoint: '/api/database-driven-usmca-compliance',
          method: 'POST',
          body: {
            companyInfo: { name: 'Test Corp', country: 'Canada' },
            productInfo: { description: 'Electronic device', hsCode: '851712' },
            componentOrigins: [
              { component: 'Processor', origin: 'US', valuePercentage: 40 },
              { component: 'Memory', origin: 'Canada', valuePercentage: 35 },
              { component: 'Case', origin: 'Mexico', valuePercentage: 25 }
            ]
          },
          description: 'Complete USMCA compliance workflow',
          targetTime: 800,
          priority: 'CRITICAL'
        },
        {
          endpoint: '/api/trust/complete-certificate',
          method: 'POST',
          body: {
            certificateData: {
              companyInfo: { name: 'Performance Test Inc', address: '123 Test St', country: 'Canada' },
              productInfo: { description: 'Test Product', hsCode: '851712', quantity: 1000 },
              qualification: { regionalContentValue: 65.5, qualificationStatus: 'QUALIFIED' }
            }
          },
          description: 'PDF certificate generation',
          targetTime: 1200,
          priority: 'CRITICAL'
        },
        {
          endpoint: '/api/trust/complete-workflow',
          method: 'POST',
          body: {
            workflowData: {
              companyName: 'Performance Test Corp',
              productType: 'Electronics',
              components: [
                { name: 'CPU', origin: 'US', value: 25000 },
                { name: 'Memory', origin: 'Canada', value: 15000 }
              ]
            }
          },
          description: 'Complete trust workflow orchestration',
          targetTime: 600,
          priority: 'CRITICAL'
        }
      ],
      
      // High-Volume APIs - Used frequently by enterprise customers
      highVolume: [
        {
          endpoint: '/api/simple-classification',
          method: 'POST',
          body: { product_description: 'Wireless Bluetooth Headphones with active noise cancellation' },
          description: 'Product HS code classification',
          targetTime: 400,
          priority: 'HIGH'
        },
        {
          endpoint: '/api/simple-savings',
          method: 'POST',
          body: {
            hsCode: '851712',
            importVolume: 250000,
            supplierCountry: 'CN',
            destinationCountry: 'US',
            businessType: 'Manufacturing'
          },
          description: 'Tariff savings calculation',
          targetTime: 300,
          priority: 'HIGH'
        },
        {
          endpoint: '/api/database-driven-dropdown-options',
          method: 'GET',
          description: 'Dynamic UI dropdown options',
          targetTime: 200,
          priority: 'HIGH'
        },
        {
          endpoint: '/api/dynamic-hs-codes',
          method: 'GET',
          description: 'Real-time HS code lookup',
          targetTime: 250,
          priority: 'HIGH'
        }
      ],
      
      // Trust & Validation APIs - Enterprise features
      trustServices: [
        {
          endpoint: '/api/trust/trust-metrics',
          method: 'GET',
          description: 'Complete trust metrics dashboard',
          targetTime: 200,
          priority: 'MEDIUM'
        },
        {
          endpoint: '/api/trust/trust-metrics-lightweight',
          method: 'GET',
          description: 'Optimized trust metrics',
          targetTime: 100,
          priority: 'MEDIUM'
        },
        {
          endpoint: '/api/trust/verify-hs-code',
          method: 'POST',
          body: { hsCode: '851712', productDescription: 'Wireless headphones' },
          description: 'HS code validation service',
          targetTime: 150,
          priority: 'MEDIUM'
        },
        {
          endpoint: '/api/trust/calculate-qualification',
          method: 'POST',
          body: {
            components: [
              { origin: 'US', value: 40000 },
              { origin: 'Canada', value: 35000 },
              { origin: 'Mexico', value: 25000 }
            ]
          },
          description: 'USMCA qualification calculation',
          targetTime: 200,
          priority: 'MEDIUM'
        }
      ],
      
      // Monitoring & Alerts - Real-time features
      monitoring: [
        {
          endpoint: '/api/crisis-calculator',
          method: 'POST',
          body: { hsCode: '851712', importValue: 100000, scenario: 'trump_tariffs' },
          description: 'Crisis tariff impact calculator',
          targetTime: 300,
          priority: 'MEDIUM'
        },
        {
          endpoint: '/api/trump-tariff-monitoring',
          method: 'GET',
          description: 'Tariff monitoring alerts',
          targetTime: 400,
          priority: 'MEDIUM'
        }
      ],
      
      // System Health - Infrastructure
      system: [
        {
          endpoint: '/api/status',
          method: 'GET',
          description: 'System health check',
          targetTime: 50,
          priority: 'HIGH'
        },
        {
          endpoint: '/api/health',
          method: 'GET',
          description: 'Detailed health status',
          targetTime: 100,
          priority: 'HIGH'
        }
      ]
    };
    
    // Flatten all endpoints for easy iteration
    this.allEndpoints = [];
    Object.values(this.endpointCategories).forEach(category => {
      this.allEndpoints.push(...category);
    });
  }
  
  /**
   * Test individual endpoint performance with detailed metrics
   */
  async testEndpointPerformance(config, iterations = 5) {
    console.log(`Testing ${config.endpoint} (${config.description})...`);
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${config.endpoint}`, {
          method: config.method || 'GET',
          headers: config.body ? { 'Content-Type': 'application/json' } : {},
          body: config.body ? JSON.stringify(config.body) : undefined,
          timeout: 15000 // 15 second timeout for complex operations
        });
        
        const responseTime = Date.now() - startTime;
        
        // Parse response
        let responseData = null;
        let responseSize = 0;
        let isValidJSON = false;
        
        try {
          const text = await response.text();
          responseSize = text.length;
          responseData = JSON.parse(text);
          isValidJSON = true;
        } catch (e) {
          // Not JSON, that's okay for some endpoints
          isValidJSON = false;
        }
        
        results.push({
          iteration: i + 1,
          responseTime,
          status: response.status,
          success: response.ok && (isValidJSON || response.status === 200),
          responseSize,
          isJSON: isValidJSON,
          hasData: responseData && Object.keys(responseData).length > 0
        });
        
        // Brief pause between iterations
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          iteration: i + 1,
          responseTime,
          status: 'ERROR',
          success: false,
          error: error.message.substring(0, 100) // Truncate long errors
        });
      }
    }
    
    const stats = this.calculateDetailedStats(results, config);
    return stats;
  }
  
  /**
   * Test concurrent load with varying user counts
   */
  async testConcurrentLoad(config, userCounts = [1, 5, 10, 25], testDuration = 10000) {
    console.log(`  Concurrent load testing: ${config.endpoint}`);
    const concurrentResults = {};
    
    for (const userCount of userCounts) {
      try {
        console.log(`    Testing ${userCount} concurrent users...`);
        
        const stats = await this.runConcurrentTest(config, userCount, testDuration);
        concurrentResults[`${userCount}_users`] = stats;
        
        const successRate = stats.successRate.toFixed(1);
        const avgTime = stats.averageTime.toFixed(0);
        const p95Time = stats.p95Time.toFixed(0);
        
        console.log(`      ${userCount} users: ${avgTime}ms avg, ${p95Time}ms p95, ${successRate}% success, ${stats.requestsPerSecond.toFixed(1)} req/s`);
        
        // Stop testing if performance degrades significantly
        if (stats.successRate < 90 || stats.p95Time > config.targetTime * 3) {
          console.log(`      ⚠️  Performance degradation detected, stopping concurrent test`);
          break;
        }
        
      } catch (error) {
        console.log(`      ${userCount} users: ERROR - ${error.message}`);
        concurrentResults[`${userCount}_users`] = { error: error.message };
        break;
      }
    }
    
    return concurrentResults;
  }
  
  /**
   * Run concurrent test with specified parameters
   */
  async runConcurrentTest(config, userCount, duration) {
    const startTime = Date.now();
    const promises = [];
    
    // Launch concurrent users
    for (let i = 0; i < userCount; i++) {
      promises.push(this.simulateUser(config, startTime, duration, i));
    }
    
    // Wait for all users to complete
    const allResults = await Promise.all(promises);
    const flatResults = allResults.flat();
    
    return this.calculateDetailedStats(flatResults, config);
  }
  
  /**
   * Simulate a single user making continuous requests
   */
  async simulateUser(config, startTime, duration, userId) {
    const results = [];
    
    while (Date.now() - startTime < duration) {
      const requestStart = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${config.endpoint}`, {
          method: config.method || 'GET',
          headers: config.body ? { 'Content-Type': 'application/json' } : {},
          body: config.body ? JSON.stringify(config.body) : undefined,
          timeout: 8000 // Shorter timeout for concurrent tests
        });
        
        const responseTime = Date.now() - requestStart;
        
        results.push({
          userId,
          responseTime,
          success: response.ok,
          status: response.status,
          timestamp: Date.now()
        });
        
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        results.push({
          userId,
          responseTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
      
      // Random pause between requests (50-200ms)
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
    }
    
    return results;
  }
  
  /**
   * Calculate detailed performance statistics
   */
  calculateDetailedStats(results, config) {
    const successResults = results.filter(r => r.success);
    const errorResults = results.filter(r => !r.success);
    const responseTimes = successResults.map(r => r.responseTime);
    
    if (responseTimes.length === 0) {
      return {
        totalRequests: results.length,
        successCount: 0,
        errorCount: results.length,
        successRate: 0,
        averageTime: 0,
        p95Time: 0,
        requestsPerSecond: 0,
        meetsTarget: false,
        errors: errorResults.slice(0, 3) // First 3 errors for debugging
      };
    }
    
    responseTimes.sort((a, b) => a - b);
    
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95Time = responseTimes[Math.ceil(0.95 * responseTimes.length) - 1] || 0;
    
    // Calculate requests per second based on timestamp spread
    const timestamps = results.filter(r => r.timestamp).map(r => r.timestamp);
    const timeSpread = timestamps.length > 1 ? 
      (Math.max(...timestamps) - Math.min(...timestamps)) / 1000 : 1;
    
    return {
      endpoint: config.endpoint,
      description: config.description,
      priority: config.priority,
      targetTime: config.targetTime,
      totalRequests: results.length,
      successCount: successResults.length,
      errorCount: errorResults.length,
      successRate: (successResults.length / results.length) * 100,
      averageTime: avgTime,
      minTime: Math.min(...responseTimes),
      maxTime: Math.max(...responseTimes),
      p50Time: responseTimes[Math.ceil(0.5 * responseTimes.length) - 1] || 0,
      p95Time,
      p99Time: responseTimes[Math.ceil(0.99 * responseTimes.length) - 1] || 0,
      requestsPerSecond: results.length / timeSpread,
      meetsTarget: avgTime <= config.targetTime,
      performanceGrade: this.calculatePerformanceGrade(avgTime, config.targetTime, successResults.length / results.length),
      errors: errorResults.slice(0, 3).map(e => ({ error: e.error, status: e.status }))
    };
  }
  
  /**
   * Calculate performance grade (A-F) based on speed and reliability
   */
  calculatePerformanceGrade(avgTime, targetTime, successRate) {
    const speedScore = Math.max(0, 100 - ((avgTime / targetTime - 1) * 100));
    const reliabilityScore = successRate * 100;
    const overallScore = (speedScore + reliabilityScore) / 2;
    
    if (overallScore >= 90) return 'A';
    if (overallScore >= 80) return 'B';
    if (overallScore >= 70) return 'C';
    if (overallScore >= 60) return 'D';
    return 'F';
  }
  
  /**
   * Run comprehensive audit of all endpoints
   */
  async runComprehensiveAudit() {
    console.log('Triangle Intelligence - Comprehensive API Performance Audit');
    console.log('Enterprise Readiness Validation for $2,500/month tier');
    console.log('=========================================================\n');
    
    // Phase 1: Baseline Performance Testing
    console.log('PHASE 1: BASELINE PERFORMANCE TESTING');
    console.log('=====================================\n');
    
    for (const [category, endpoints] of Object.entries(this.endpointCategories)) {
      console.log(`\n--- ${category.toUpperCase()} ENDPOINTS ---`);
      
      for (const config of endpoints) {
        try {
          this.results.baseline[config.endpoint] = await this.testEndpointPerformance(config);
          const stats = this.results.baseline[config.endpoint];
          
          const status = stats.meetsTarget ? '✅' : '❌';
          const grade = stats.performanceGrade;
          
          console.log(`  ${status} Grade ${grade}: ${stats.averageTime.toFixed(0)}ms avg (target: ${config.targetTime}ms) | ${stats.successRate.toFixed(1)}% success`);
          
          if (stats.errorCount > 0) {
            console.log(`      ⚠️  ${stats.errorCount} errors detected`);
          }
          
        } catch (error) {
          console.log(`  ❌ ${config.endpoint}: FAILED - ${error.message}`);
          this.results.baseline[config.endpoint] = { error: error.message };
        }
      }
    }
    
    // Phase 2: Concurrent Load Testing (Critical endpoints only)
    console.log('\n\nPHASE 2: CONCURRENT LOAD TESTING');
    console.log('=================================\n');
    
    const criticalEndpoints = this.allEndpoints.filter(e => e.priority === 'CRITICAL' || e.priority === 'HIGH');
    
    for (const config of criticalEndpoints) {
      try {
        console.log(`\nTesting ${config.endpoint}:`);
        this.results.concurrent[config.endpoint] = await this.testConcurrentLoad(config);
        
      } catch (error) {
        console.log(`  ERROR: ${error.message}`);
        this.results.concurrent[config.endpoint] = { error: error.message };
      }
    }
    
    // Phase 3: Generate Analysis and Recommendations
    this.generateComprehensiveAnalysis();
    
    return this.results;
  }
  
  /**
   * Generate comprehensive analysis and recommendations
   */
  generateComprehensiveAnalysis() {
    console.log('\n\nPHASE 3: COMPREHENSIVE PERFORMANCE ANALYSIS');
    console.log('===========================================\n');
    
    // Analyze baseline performance
    const baselineStats = this.analyzeBaselinePerformance();
    
    // Analyze concurrent performance
    const concurrentStats = this.analyzeConcurrentPerformance();
    
    // Generate recommendations
    this.results.recommendations = this.generateOptimizationRecommendations(baselineStats, concurrentStats);
    
    // Print summary
    this.printExecutiveSummary(baselineStats, concurrentStats);
  }
  
  /**
   * Analyze baseline performance across all endpoints
   */
  analyzeBaselinePerformance() {
    const stats = {
      total: 0,
      passing: 0,
      slow: [],
      failing: [],
      byGrade: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      avgResponseTime: 0,
      totalSuccessRate: 0
    };
    
    let totalTime = 0;
    let totalSuccessRate = 0;
    
    Object.values(this.results.baseline).forEach(result => {
      if (result.error) {
        stats.failing.push(result);
        stats.byGrade.F++;
      } else {
        stats.total++;
        
        if (result.meetsTarget) {
          stats.passing++;
        } else {
          stats.slow.push(result);
        }
        
        stats.byGrade[result.performanceGrade]++;
        totalTime += result.averageTime;
        totalSuccessRate += result.successRate;
      }
    });
    
    if (stats.total > 0) {
      stats.avgResponseTime = totalTime / stats.total;
      stats.totalSuccessRate = totalSuccessRate / stats.total;
    }
    
    return stats;
  }
  
  /**
   * Analyze concurrent performance
   */
  analyzeConcurrentPerformance() {
    const stats = {
      totalTests: 0,
      successfulTests: 0,
      scalabilityIssues: [],
      bestPerforming: [],
      worstPerforming: []
    };
    
    Object.entries(this.results.concurrent).forEach(([endpoint, tests]) => {
      Object.entries(tests).forEach(([userCount, result]) => {
        if (!result.error) {
          stats.totalTests++;
          
          if (result.successRate >= 95) {
            stats.successfulTests++;
          }
          
          // Check for scalability issues
          if (result.successRate < 90 || result.p95Time > 2000) {
            stats.scalabilityIssues.push({
              endpoint,
              userCount,
              successRate: result.successRate,
              p95Time: result.p95Time
            });
          }
        }
      });
    });
    
    return stats;
  }
  
  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(baselineStats, concurrentStats) {
    const recommendations = [];
    
    // Analyze slow endpoints
    baselineStats.slow.forEach(result => {
      const severity = result.averageTime > result.targetTime * 2 ? 'CRITICAL' : 'HIGH';
      recommendations.push({
        type: 'PERFORMANCE_OPTIMIZATION',
        severity,
        endpoint: result.endpoint,
        issue: `Average response time ${result.averageTime.toFixed(0)}ms exceeds target ${result.targetTime}ms`,
        recommendation: this.getSpecificOptimizationRecommendation(result.endpoint, result.averageTime),
        expectedImprovement: `Target: ${result.targetTime}ms (${((result.averageTime - result.targetTime) / result.averageTime * 100).toFixed(0)}% reduction needed)`
      });
    });
    
    // Analyze failing endpoints
    baselineStats.failing.forEach(result => {
      recommendations.push({
        type: 'CRITICAL_ERROR',
        severity: 'CRITICAL',
        endpoint: result.endpoint,
        issue: `Endpoint completely failing: ${result.error}`,
        recommendation: 'Immediate investigation required - endpoint not functional',
        expectedImprovement: 'Restore functionality before performance optimization'
      });
    });
    
    // Analyze scalability issues
    concurrentStats.scalabilityIssues.forEach(issue => {
      recommendations.push({
        type: 'SCALABILITY',
        severity: 'HIGH',
        endpoint: issue.endpoint,
        issue: `Under ${issue.userCount} concurrent load: ${issue.successRate.toFixed(1)}% success rate, ${issue.p95Time}ms P95`,
        recommendation: 'Consider connection pooling optimization, horizontal scaling, or load balancing',
        expectedImprovement: 'Target: >95% success rate under 50 concurrent users'
      });
    });
    
    return recommendations;
  }
  
  /**
   * Get specific optimization recommendation based on endpoint pattern
   */
  getSpecificOptimizationRecommendation(endpoint, responseTime) {
    if (endpoint.includes('database-driven') || endpoint.includes('classification')) {
      return 'Optimize database queries with indexes, implement result caching, consider query pagination';
    }
    
    if (endpoint.includes('certificate') || endpoint.includes('pdf')) {
      return 'Implement PDF generation caching, consider background processing for large documents';
    }
    
    if (endpoint.includes('savings') || endpoint.includes('calculator')) {
      return 'Cache tariff rate lookups, optimize calculation algorithms, implement result memoization';
    }
    
    if (endpoint.includes('trust') || endpoint.includes('workflow')) {
      return 'Optimize trust calculation pipelines, implement intermediate result caching';
    }
    
    return 'General optimization: add caching layer, optimize database queries, review algorithm complexity';
  }
  
  /**
   * Print executive summary
   */
  printExecutiveSummary(baselineStats, concurrentStats) {
    console.log('EXECUTIVE SUMMARY');
    console.log('=================');
    
    console.log(`\nBASELINE PERFORMANCE:`);
    console.log(`  Total Endpoints Tested: ${baselineStats.total + baselineStats.failing.length}`);
    console.log(`  Passing Performance Targets: ${baselineStats.passing}/${baselineStats.total} (${((baselineStats.passing/baselineStats.total)*100).toFixed(1)}%)`);
    console.log(`  Average Response Time: ${baselineStats.avgResponseTime.toFixed(0)}ms`);
    console.log(`  Overall Success Rate: ${baselineStats.totalSuccessRate.toFixed(1)}%`);
    
    console.log(`\nPERFORMANCE GRADES:`);
    Object.entries(baselineStats.byGrade).forEach(([grade, count]) => {
      if (count > 0) {
        console.log(`  Grade ${grade}: ${count} endpoints`);
      }
    });
    
    console.log(`\nCONCURRENT LOAD TESTING:`);
    console.log(`  Concurrent Tests: ${concurrentStats.successfulTests}/${concurrentStats.totalTests} passed`);
    console.log(`  Scalability Issues: ${concurrentStats.scalabilityIssues.length}`);
    
    console.log(`\nOPTIMIZATION RECOMMENDATIONS:`);
    console.log(`  Total Recommendations: ${this.results.recommendations.length}`);
    
    const criticalIssues = this.results.recommendations.filter(r => r.severity === 'CRITICAL');
    const highIssues = this.results.recommendations.filter(r => r.severity === 'HIGH');
    
    console.log(`  Critical Issues: ${criticalIssues.length}`);
    console.log(`  High Priority Issues: ${highIssues.length}`);
    
    // Enterprise readiness assessment
    const healthScore = (baselineStats.passing / baselineStats.total) * 100;
    const concurrentScore = concurrentStats.totalTests > 0 ? (concurrentStats.successfulTests / concurrentStats.totalTests) * 100 : 0;
    const overallScore = (healthScore + concurrentScore) / 2;
    
    console.log(`\nENTERPRISE READINESS ASSESSMENT:`);
    console.log(`  Performance Health Score: ${healthScore.toFixed(1)}%`);
    console.log(`  Scalability Score: ${concurrentScore.toFixed(1)}%`);
    console.log(`  Overall Enterprise Readiness: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 85) {
      console.log(`  ✅ ENTERPRISE READY - Meets $2,500/month tier requirements`);
    } else if (overallScore >= 70) {
      console.log(`  ⚠️  OPTIMIZATION NEEDED - Performance improvements required`);
    } else {
      console.log(`  ❌ CRITICAL ISSUES - Significant performance problems must be resolved`);
    }
    
    // Print top recommendations
    if (criticalIssues.length > 0) {
      console.log(`\nTOP CRITICAL ISSUES:`);
      criticalIssues.slice(0, 3).forEach(issue => {
        console.log(`  • ${issue.endpoint}: ${issue.issue}`);
        console.log(`    → ${issue.recommendation}`);
      });
    }
  }
}

// CLI execution
async function main() {
  const auditor = new ComprehensiveAPIAuditor();
  
  try {
    const results = await auditor.runComprehensiveAudit();
    
    // Save results to file
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `comprehensive-api-audit-${timestamp}.json`;
    const filePath = path.join(__dirname, filename);
    
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    console.log(`\nDetailed results saved to: ${filePath}`);
    
  } catch (error) {
    console.error('Comprehensive audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ComprehensiveAPIAuditor;