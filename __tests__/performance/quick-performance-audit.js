/**
 * Quick Performance Audit for Triangle Intelligence API
 * Focused test of critical endpoints for enterprise readiness validation
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '../../.env.local' });

class QuickPerformanceAuditor {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {};
    
    // Focus on most critical revenue-generating endpoints
    this.criticalEndpoints = [
      {
        endpoint: '/api/status',
        method: 'GET',
        description: 'System health check',
        targetTime: 100
      },
      {
        endpoint: '/api/simple-classification',
        method: 'POST',
        body: {
          product_description: 'Wireless Bluetooth Headphones with noise cancellation'
        },
        description: 'Product classification',
        targetTime: 500
      },
      {
        endpoint: '/api/simple-savings',
        method: 'POST', 
        body: {
          hsCode: '851712',
          importVolume: 100000,
          supplierCountry: 'CN',
          destinationCountry: 'US',
          businessType: 'Manufacturing'
        },
        description: 'Tariff savings calculation',
        targetTime: 300
      },
      {
        endpoint: '/api/database-driven-dropdown-options',
        method: 'GET',
        description: 'UI dropdown data',
        targetTime: 200
      },
      {
        endpoint: '/api/trust/trust-metrics-lightweight',
        method: 'GET',
        description: 'Trust metrics for enterprise',
        targetTime: 150
      }
    ];
  }
  
  async testEndpoint(config, iterations = 3) {
    console.log(`Testing ${config.endpoint}...`);
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${config.endpoint}`, {
          method: config.method || 'GET',
          headers: config.body ? { 'Content-Type': 'application/json' } : {},
          body: config.body ? JSON.stringify(config.body) : undefined,
          timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        
        // Try to parse response to check if it's valid JSON
        let responseData = null;
        let isValidResponse = false;
        try {
          responseData = await response.json();
          isValidResponse = true;
        } catch (e) {
          // Response might not be JSON, that's okay
          isValidResponse = response.ok;
        }
        
        results.push({
          iteration: i + 1,
          responseTime,
          status: response.status,
          success: response.ok && isValidResponse,
          responseSize: response.headers.get('content-length') || 'unknown'
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          iteration: i + 1,
          responseTime,
          status: 'ERROR',
          success: false,
          error: error.message
        });
      }
    }
    
    const stats = this.calculateStats(results);
    stats.meetsTarget = stats.averageTime <= config.targetTime;
    stats.description = config.description;
    stats.targetTime = config.targetTime;
    
    console.log(`  ${config.description}: Avg ${stats.averageTime.toFixed(0)}ms | Success ${stats.successRate.toFixed(1)}% | Target ${config.targetTime}ms | ${stats.meetsTarget ? '✅' : '❌'}`);
    
    return stats;
  }
  
  async testConcurrentLoad(config, users = 5, duration = 5000) {
    console.log(`  Concurrent test (${users} users, ${duration/1000}s)...`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < users; i++) {
      promises.push(this.runContinuousRequests(config, startTime, duration, i));
    }
    
    const allResults = await Promise.all(promises);
    const flatResults = allResults.flat();
    
    const stats = this.calculateStats(flatResults);
    console.log(`    ${users} concurrent users: Avg ${stats.averageTime.toFixed(0)}ms | Success ${stats.successRate.toFixed(1)}% | ${stats.requestsPerSecond.toFixed(1)} req/s`);
    
    return stats;
  }
  
  async runContinuousRequests(config, startTime, duration, userId) {
    const results = [];
    
    while (Date.now() - startTime < duration) {
      const requestStart = Date.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${config.endpoint}`, {
          method: config.method || 'GET',
          headers: config.body ? { 'Content-Type': 'application/json' } : {},
          body: config.body ? JSON.stringify(config.body) : undefined,
          timeout: 5000
        });
        
        const responseTime = Date.now() - requestStart;
        
        results.push({
          userId,
          responseTime,
          success: response.ok,
          status: response.status
        });
        
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        results.push({
          userId,
          responseTime,
          success: false,
          error: error.message
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause
    }
    
    return results;
  }
  
  calculateStats(results) {
    const successResults = results.filter(r => r.success);
    const times = successResults.map(r => r.responseTime);
    
    if (times.length === 0) {
      return {
        totalRequests: results.length,
        successCount: 0,
        successRate: 0,
        averageTime: 0,
        requestsPerSecond: 0
      };
    }
    
    times.sort((a, b) => a - b);
    
    const totalDuration = results.length > 0 ? 
      (Math.max(...results.map(r => r.responseTime)) - Math.min(...results.map(r => r.responseTime))) / 1000 : 1;
    
    return {
      totalRequests: results.length,
      successCount: successResults.length,
      successRate: (successResults.length / results.length) * 100,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      p95Time: times[Math.ceil(0.95 * times.length) - 1] || 0,
      requestsPerSecond: results.length / (totalDuration || 1)
    };
  }
  
  async runQuickAudit() {
    console.log('Triangle Intelligence - Quick Performance Audit');
    console.log('Testing critical endpoints for enterprise readiness');
    console.log('=================================================\n');
    
    // Test individual endpoint performance
    console.log('INDIVIDUAL ENDPOINT TESTING:');
    for (const config of this.criticalEndpoints) {
      try {
        this.results[config.endpoint] = await this.testEndpoint(config);
      } catch (error) {
        console.log(`  ${config.endpoint}: FAILED - ${error.message}`);
        this.results[config.endpoint] = { error: error.message };
      }
    }
    
    console.log('\nCONCURRENT LOAD TESTING:');
    // Test concurrent load on top 3 endpoints
    const topEndpoints = this.criticalEndpoints.slice(0, 3);
    for (const config of topEndpoints) {
      try {
        console.log(`${config.endpoint}:`);
        this.results[`${config.endpoint}_concurrent`] = await this.testConcurrentLoad(config);
      } catch (error) {
        console.log(`  ${config.endpoint}: Concurrent test failed - ${error.message}`);
      }
    }
    
    this.generateSummary();
    return this.results;
  }
  
  generateSummary() {
    console.log('\n=== PERFORMANCE AUDIT SUMMARY ===');
    
    let totalEndpoints = 0;
    let passingEndpoints = 0;
    let slowEndpoints = [];
    let failingEndpoints = [];
    
    Object.entries(this.results).forEach(([endpoint, result]) => {
      if (endpoint.includes('_concurrent')) return; // Skip concurrent results
      
      totalEndpoints++;
      
      if (result.error) {
        failingEndpoints.push(endpoint);
      } else if (result.meetsTarget) {
        passingEndpoints++;
      } else {
        slowEndpoints.push({
          endpoint,
          averageTime: result.averageTime,
          targetTime: result.targetTime
        });
      }
    });
    
    console.log(`Total Critical Endpoints: ${totalEndpoints}`);
    console.log(`Passing Performance Target: ${passingEndpoints}/${totalEndpoints} (${((passingEndpoints/totalEndpoints)*100).toFixed(1)}%)`);
    
    if (slowEndpoints.length > 0) {
      console.log('\n⚠️  SLOW ENDPOINTS:');
      slowEndpoints.forEach(ep => {
        console.log(`  ${ep.endpoint}: ${ep.averageTime.toFixed(0)}ms (target: ${ep.targetTime}ms)`);
      });
    }
    
    if (failingEndpoints.length > 0) {
      console.log('\n❌ FAILING ENDPOINTS:');
      failingEndpoints.forEach(ep => console.log(`  ${ep}`));
    }
    
    // Overall assessment
    const healthScore = (passingEndpoints / totalEndpoints) * 100;
    console.log(`\nOVERALL HEALTH SCORE: ${healthScore.toFixed(1)}%`);
    
    if (healthScore >= 80) {
      console.log('✅ ENTERPRISE READY - Performance meets $2,500/month tier requirements');
    } else if (healthScore >= 60) {
      console.log('⚠️  NEEDS OPTIMIZATION - Some endpoints require tuning');
    } else {
      console.log('❌ CRITICAL ISSUES - Significant performance problems detected');
    }
  }
}

// Run the audit
async function main() {
  const auditor = new QuickPerformanceAuditor();
  
  try {
    await auditor.runQuickAudit();
  } catch (error) {
    console.error('Performance audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = QuickPerformanceAuditor;