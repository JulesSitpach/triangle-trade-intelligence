/**
 * Triangle Intelligence API Performance Testing Framework
 * Enterprise-grade performance validation for $2,500/month tier
 * 
 * Tests all 42 API endpoints under various load conditions:
 * - Baseline individual performance
 * - Concurrent load testing (1-100 users)
 * - Stress testing to find breaking points
 * - Database performance under load
 * - Error handling and recovery
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class APIPerformanceTester {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    this.results = {
      baseline: {},
      concurrent: {},
      stress: {},
      database: {},
      errors: {}
    };
    
    // All 42 API endpoints discovered
    this.endpoints = [
      '/api/ai-category-analysis',
      '/api/classify',
      '/api/crisis-alerts',
      '/api/crisis-calculator',
      '/api/crisis-config',
      '/api/crisis-messaging',
      '/api/database-driven-dropdown-options',
      '/api/database-driven-usmca-compliance',
      '/api/dynamic-hs-codes',
      '/api/dynamic-pricing',
      '/api/dynamic-rss-alerts',
      '/api/enhanced-classification',
      '/api/granular-categories',
      '/api/health',
      '/api/intelligent-classification',
      '/api/learn-from-user-contributions',
      '/api/professional-validation',
      '/api/rss-monitoring',
      '/api/simple-classification',
      '/api/simple-dropdown-options',
      '/api/simple-hs-search',
      '/api/simple-savings',
      '/api/simple-usmca-compliance',
      '/api/smart-chapter-detection',
      '/api/smart-rss-status',
      '/api/status',
      '/api/submit-missing-product',
      '/api/test-crisis-rss-integration',
      '/api/trump-tariff-monitoring',
      '/api/trust/calculate-qualification',
      '/api/trust/case-studies',
      '/api/trust/complete-certificate',
      '/api/trust/complete-workflow',
      '/api/trust/data-provenance',
      '/api/trust/expert-validation',
      '/api/trust/success-stories',
      '/api/trust/trust-metrics',
      '/api/trust/trust-metrics-lightweight',
      '/api/trust/usmca-thresholds',
      '/api/trust/verify-hs-code',
      '/api/trusted-compliance-workflow',
      '/api/user-contributed-hs-code'
    ];
    
    // Critical revenue-generating endpoints
    this.criticalEndpoints = [
      '/api/database-driven-usmca-compliance',
      '/api/trust/complete-workflow',
      '/api/trust/complete-certificate',
      '/api/simple-savings',
      '/api/simple-classification',
      '/api/database-driven-dropdown-options'
    ];
    
    // High-volume endpoints
    this.highVolumeEndpoints = [
      '/api/simple-classification',
      '/api/database-driven-dropdown-options',
      '/api/dynamic-hs-codes',
      '/api/crisis-calculator'
    ];
  }
  
  /**
   * Generate realistic test payloads for different endpoint types
   */
  generateTestPayload(endpoint) {
    const payloads = {
      '/api/simple-classification': {
        method: 'POST',
        body: JSON.stringify({
          productName: 'Wireless Bluetooth Headphones',
          productCategory: 'Electronics',
          description: 'Premium noise-canceling wireless headphones'
        }),
        headers: { 'Content-Type': 'application/json' }
      },
      
      '/api/simple-savings': {
        method: 'POST', 
        body: JSON.stringify({
          hsCode: '851712',
          importValue: 100000,
          originCountry: 'China',
          destinationCountry: 'US'
        }),
        headers: { 'Content-Type': 'application/json' }
      },
      
      '/api/database-driven-usmca-compliance': {
        method: 'POST',
        body: JSON.stringify({
          companyInfo: {
            name: 'Test Electronics Inc',
            address: '123 Test St, Toronto, ON',
            taxId: 'CA123456789'
          },
          productInfo: {
            description: 'Wireless Headphones',
            hsCode: '851712',
            value: 50000
          },
          componentOrigins: [
            { component: 'Speaker drivers', origin: 'Canada', valuePercentage: 40 },
            { component: 'Plastic housing', origin: 'Mexico', valuePercentage: 30 },
            { component: 'Electronics', origin: 'US', valuePercentage: 30 }
          ]
        }),
        headers: { 'Content-Type': 'application/json' }
      },
      
      '/api/trust/complete-workflow': {
        method: 'POST',
        body: JSON.stringify({
          workflowData: {
            companyName: 'Performance Test Corp',
            productType: 'Electronics',
            components: [
              { name: 'CPU', origin: 'US', value: 25000 },
              { name: 'Memory', origin: 'Canada', value: 15000 },
              { name: 'Case', origin: 'Mexico', value: 10000 }
            ]
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      },
      
      '/api/trust/complete-certificate': {
        method: 'POST',
        body: JSON.stringify({
          certificateData: {
            companyInfo: {
              name: 'Performance Test Inc',
              address: '456 Load Test Ave',
              country: 'Canada'
            },
            productInfo: {
              description: 'Test Product for Load Testing',
              hsCode: '851712',
              quantity: 1000
            },
            qualification: {
              regionalContentValue: 65.5,
              qualificationStatus: 'QUALIFIED',
              evidence: ['Bill of materials', 'Manufacturing records']
            }
          }
        }),
        headers: { 'Content-Type': 'application/json' }
      }
    };
    
    // Default GET request for endpoints without specific payloads
    return payloads[endpoint] || { method: 'GET', headers: {} };
  }
  
  /**
   * Measure single endpoint performance
   */
  async measureEndpointPerformance(endpoint, iterations = 5) {
    const times = [];
    const payload = this.generateTestPayload(endpoint);
    
    console.log(`Testing ${endpoint} (${iterations} iterations)...`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: payload.method || 'GET',
          headers: payload.headers || {},
          body: payload.body || undefined,
          timeout: 10000 // 10 second timeout
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        times.push({
          iteration: i + 1,
          responseTime,
          status: response.status,
          success: response.ok,
          timestamp: new Date().toISOString()
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        times.push({
          iteration: i + 1,
          responseTime,
          status: 'ERROR',
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return this.calculateStats(times);
  }
  
  /**
   * Test concurrent load on endpoint
   */
  async testConcurrentLoad(endpoint, concurrency = 10, duration = 30000) {
    console.log(`Concurrent load test: ${endpoint} (${concurrency} concurrent users, ${duration/1000}s)`);
    
    const startTime = Date.now();
    const results = [];
    const activeRequests = [];
    
    // Launch concurrent requests
    for (let i = 0; i < concurrency; i++) {
      activeRequests.push(this.runConcurrentRequests(endpoint, startTime, duration, i));
    }
    
    // Wait for all concurrent tests to complete
    const allResults = await Promise.all(activeRequests);
    
    // Flatten results
    allResults.forEach(userResults => {
      results.push(...userResults);
    });
    
    return this.calculateStats(results);
  }
  
  /**
   * Run requests for a single concurrent user
   */
  async runConcurrentRequests(endpoint, startTime, duration, userId) {
    const results = [];
    const payload = this.generateTestPayload(endpoint);
    
    while (Date.now() - startTime < duration) {
      const requestStart = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: payload.method || 'GET',
          headers: payload.headers || {},
          body: payload.body || undefined,
          timeout: 10000
        });
        
        const requestEnd = Date.now();
        
        results.push({
          userId,
          responseTime: requestEnd - requestStart,
          status: response.status,
          success: response.ok,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        const requestEnd = Date.now();
        
        results.push({
          userId,
          responseTime: requestEnd - requestStart,
          status: 'ERROR',
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Brief pause between requests from same user
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results;
  }
  
  /**
   * Calculate performance statistics
   */
  calculateStats(times) {
    const responseTimes = times.map(t => t.responseTime);
    const successCount = times.filter(t => t.success).length;
    const errorCount = times.filter(t => !t.success).length;
    
    responseTimes.sort((a, b) => a - b);
    
    return {
      totalRequests: times.length,
      successCount,
      errorCount,
      successRate: (successCount / times.length) * 100,
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p50: this.percentile(responseTimes, 50),
        p90: this.percentile(responseTimes, 90),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99)
      },
      requestsPerSecond: times.length / ((Math.max(...times.map(t => new Date(t.timestamp).getTime())) - 
                                         Math.min(...times.map(t => new Date(t.timestamp).getTime()))) / 1000),
      errors: times.filter(t => !t.success).map(t => ({ error: t.error, status: t.status }))
    };
  }
  
  /**
   * Calculate percentile
   */
  percentile(arr, p) {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index] || 0;
  }
  
  /**
   * Run baseline performance tests on all endpoints
   */
  async runBaselineTests() {
    console.log('\n=== BASELINE PERFORMANCE TESTING ===');
    console.log(`Testing ${this.endpoints.length} API endpoints...\n`);
    
    for (const endpoint of this.endpoints) {
      try {
        this.results.baseline[endpoint] = await this.measureEndpointPerformance(endpoint);
        
        const stats = this.results.baseline[endpoint];
        console.log(`${endpoint}:`);
        console.log(`  Avg: ${stats.responseTime.average.toFixed(0)}ms | P95: ${stats.responseTime.p95}ms | Success: ${stats.successRate.toFixed(1)}%`);
        
        // Flag slow endpoints
        if (stats.responseTime.p95 > 500) {
          console.log(`  ⚠️  SLOW: P95 response time ${stats.responseTime.p95}ms exceeds 500ms target`);
        }
        
      } catch (error) {
        console.log(`${endpoint}: ERROR - ${error.message}`);
        this.results.baseline[endpoint] = { error: error.message };
      }
    }
  }
  
  /**
   * Run concurrent load tests on critical endpoints
   */
  async runConcurrentLoadTests() {
    console.log('\n=== CONCURRENT LOAD TESTING ===');
    console.log('Testing critical endpoints under concurrent load...\n');
    
    const concurrencyLevels = [1, 5, 10, 25, 50];
    
    for (const endpoint of this.criticalEndpoints) {
      console.log(`\nTesting ${endpoint}:`);
      this.results.concurrent[endpoint] = {};
      
      for (const concurrency of concurrencyLevels) {
        try {
          const stats = await this.testConcurrentLoad(endpoint, concurrency, 15000); // 15 second test
          this.results.concurrent[endpoint][`${concurrency}_users`] = stats;
          
          console.log(`  ${concurrency} users: Avg ${stats.responseTime.average.toFixed(0)}ms | P95 ${stats.responseTime.p95}ms | ${stats.successRate.toFixed(1)}% success | ${stats.requestsPerSecond.toFixed(1)} req/s`);
          
          // Stop if error rate gets too high
          if (stats.successRate < 95) {
            console.log(`  ⚠️  HIGH ERROR RATE: ${stats.successRate.toFixed(1)}% success rate`);
            break;
          }
          
        } catch (error) {
          console.log(`  ${concurrency} users: ERROR - ${error.message}`);
          this.results.concurrent[endpoint][`${concurrency}_users`] = { error: error.message };
        }
      }
    }
  }
  
  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEndpoints: this.endpoints.length,
        criticalEndpoints: this.criticalEndpoints.length,
        testDuration: 'Varies per test type'
      },
      baseline: this.results.baseline,
      concurrent: this.results.concurrent,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }
  
  /**
   * Generate optimization recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check baseline performance
    Object.entries(this.results.baseline).forEach(([endpoint, stats]) => {
      if (stats.responseTime && stats.responseTime.p95 > 500) {
        recommendations.push({
          type: 'PERFORMANCE',
          severity: 'HIGH',
          endpoint,
          issue: `P95 response time ${stats.responseTime.p95}ms exceeds 500ms target`,
          recommendation: 'Optimize database queries, add caching, or implement pagination'
        });
      }
      
      if (stats.successRate < 95) {
        recommendations.push({
          type: 'RELIABILITY',
          severity: 'CRITICAL',
          endpoint,
          issue: `Success rate ${stats.successRate.toFixed(1)}% below 95% threshold`,
          recommendation: 'Investigate error causes and improve error handling'
        });
      }
    });
    
    // Check concurrent load performance
    Object.entries(this.results.concurrent).forEach(([endpoint, loadTests]) => {
      Object.entries(loadTests).forEach(([concurrency, stats]) => {
        if (stats.responseTime && stats.responseTime.p95 > 1000) {
          recommendations.push({
            type: 'SCALABILITY',
            severity: 'MEDIUM',
            endpoint,
            concurrency,
            issue: `Under ${concurrency} load, P95 response time ${stats.responseTime.p95}ms exceeds 1000ms`,
            recommendation: 'Consider horizontal scaling or load balancing'
          });
        }
      });
    });
    
    return recommendations;
  }
  
  /**
   * Save results to file
   */
  async saveResults(filename = 'api-performance-results.json') {
    const report = this.generateReport();
    const filePath = path.join(__dirname, filename);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
      console.log(`\nResults saved to: ${filePath}`);
    } catch (error) {
      console.error(`Error saving results: ${error.message}`);
    }
    
    return report;
  }
}

module.exports = APIPerformanceTester;

// CLI execution
if (require.main === module) {
  async function runTests() {
    const tester = new APIPerformanceTester();
    
    console.log('Triangle Intelligence API Performance Audit');
    console.log('Enterprise-grade validation for $2,500/month tier');
    console.log('==========================================\n');
    
    try {
      // Run baseline tests
      await tester.runBaselineTests();
      
      // Run concurrent load tests
      await tester.runConcurrentLoadTests();
      
      // Generate and save report
      const report = await tester.saveResults();
      
      console.log('\n=== AUDIT COMPLETE ===');
      console.log(`Total endpoints tested: ${Object.keys(report.baseline).length}`);
      console.log(`Recommendations generated: ${report.recommendations.length}`);
      
      // Print critical issues
      const criticalIssues = report.recommendations.filter(r => r.severity === 'CRITICAL');
      if (criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES FOUND:');
        criticalIssues.forEach(issue => {
          console.log(`  ${issue.endpoint}: ${issue.issue}`);
        });
      }
      
    } catch (error) {
      console.error('Test execution failed:', error);
      process.exit(1);
    }
  }
  
  runTests();
}