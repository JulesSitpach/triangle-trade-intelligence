/**
 * Triangle Intelligence Database Performance Testing
 * Tests Supabase PostgreSQL performance under enterprise load
 * 
 * Focus Areas:
 * - hs_master_rebuild table (34,476 records)
 * - Complex USMCA qualification queries
 * - Connection pooling and timeout handling
 * - Concurrent query performance
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env.local' });

class DatabasePerformanceTester {
  constructor() {
    console.log('Initializing database connection...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.results = {
      connectionTests: {},
      queryPerformance: {},
      concurrentQueries: {},
      complexOperations: {}
    };
    
    // Test queries that mirror real application usage
    this.testQueries = {
      // Basic HS code lookup (most common operation)
      hsCodeLookup: {
        name: 'HS Code Lookup',
        query: () => this.supabase
          .from('hs_master_rebuild')
          .select('*')
          .eq('hs_code', '851712')
          .single(),
        expectedTime: 50 // Target <50ms
      },
      
      // Chapter-based search (common for classification)
      chapterSearch: {
        name: 'Chapter Search',
        query: () => this.supabase
          .from('hs_master_rebuild')
          .select('hs_code, description, mfn_rate, usmca_rate')
          .eq('chapter', 85)
          .limit(100),
        expectedTime: 200 // Target <200ms
      },
      
      // Text search in descriptions (AI classification support)
      descriptionSearch: {
        name: 'Description Text Search',
        query: () => this.supabase
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter')
          .textSearch('description', 'wireless bluetooth headphones')
          .limit(50),
        expectedTime: 300 // Target <300ms
      },
      
      // Rate comparison (tariff savings calculations)
      rateComparison: {
        name: 'Tariff Rate Comparison',
        query: () => this.supabase
          .from('hs_master_rebuild')
          .select('hs_code, description, mfn_rate, usmca_rate')
          .not('usmca_rate', 'is', null)
          .gte('mfn_rate', 0.01) // Has meaningful MFN rate
          .order('mfn_rate', { ascending: false })
          .limit(100),
        expectedTime: 250 // Target <250ms
      },
      
      // Complex USMCA qualification query
      usmcaQualification: {
        name: 'USMCA Qualification Rules',
        query: () => this.supabase
          .from('usmca_qualification_rules')
          .select('*')
          .eq('hs_chapter', '85')
          .order('regional_content_threshold', { ascending: false }),
        expectedTime: 100 // Target <100ms
      },
      
      // Full table count (health check)
      tableCount: {
        name: 'Table Record Count',
        query: () => this.supabase
          .from('hs_master_rebuild')
          .select('*', { count: 'exact', head: true }),
        expectedTime: 500 // Target <500ms for count
      },
      
      // Multi-country rate lookup (triangle routing)
      multiCountryRates: {
        name: 'Multi-Country Rate Lookup',
        query: () => this.supabase
          .from('hs_master_rebuild')
          .select('hs_code, description, mfn_rate, usmca_rate, country_source')
          .in('country_source', ['US', 'CA', 'MX'])
          .eq('chapter', 85)
          .not('usmca_rate', 'is', null)
          .limit(200),
        expectedTime: 400 // Target <400ms
      }
    };
  }
  
  /**
   * Test database connection and basic functionality
   */
  async testDatabaseConnection() {
    console.log('\n=== DATABASE CONNECTION TESTING ===');
    
    try {
      const startTime = Date.now();
      const { data, error } = await this.supabase
        .from('hs_master_rebuild')
        .select('count')
        .limit(1);
        
      const responseTime = Date.now() - startTime;
      
      if (error) {
        throw error;
      }
      
      this.results.connectionTests.basic = {
        success: true,
        responseTime,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Database connection successful (${responseTime}ms)`);
      
    } catch (error) {
      this.results.connectionTests.basic = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      console.log(`❌ Database connection failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Test individual query performance
   */
  async testQueryPerformance() {
    console.log('\n=== QUERY PERFORMANCE TESTING ===');
    
    for (const [key, testCase] of Object.entries(this.testQueries)) {
      console.log(`Testing ${testCase.name}...`);
      
      const times = [];
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          const { data, error, count } = await testCase.query();
          const responseTime = Date.now() - startTime;
          
          if (error) {
            throw error;
          }
          
          times.push({
            iteration: i + 1,
            responseTime,
            recordCount: data ? data.length : count || 0,
            success: true
          });
          
          // Small delay between iterations
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          const responseTime = Date.now() - startTime;
          times.push({
            iteration: i + 1,
            responseTime,
            success: false,
            error: error.message
          });
        }
      }
      
      const stats = this.calculateQueryStats(times);
      this.results.queryPerformance[key] = {
        ...stats,
        expectedTime: testCase.expectedTime,
        meetsTarget: stats.averageTime <= testCase.expectedTime
      };
      
      console.log(`  Avg: ${stats.averageTime.toFixed(0)}ms | P95: ${stats.p95Time}ms | Target: ${testCase.expectedTime}ms | ${stats.meetsTarget ? '✅' : '❌'}`);
      
      if (stats.errorCount > 0) {
        console.log(`  ⚠️  ${stats.errorCount} errors out of ${iterations} attempts`);
      }
    }
  }
  
  /**
   * Test concurrent query performance
   */
  async testConcurrentQueries() {
    console.log('\n=== CONCURRENT QUERY TESTING ===');
    
    const concurrencyLevels = [1, 5, 10, 25, 50];
    const criticalQueries = ['hsCodeLookup', 'chapterSearch', 'rateComparison'];
    
    for (const queryKey of criticalQueries) {
      const testCase = this.testQueries[queryKey];
      console.log(`\nTesting ${testCase.name} under concurrent load:`);
      
      this.results.concurrentQueries[queryKey] = {};
      
      for (const concurrency of concurrencyLevels) {
        try {
          const stats = await this.runConcurrentQueryTest(testCase, concurrency, 10000); // 10 second test
          this.results.concurrentQueries[queryKey][`${concurrency}_concurrent`] = stats;
          
          console.log(`  ${concurrency} concurrent: Avg ${stats.averageTime.toFixed(0)}ms | P95 ${stats.p95Time}ms | ${stats.successRate.toFixed(1)}% success`);
          
          // Stop if performance degrades significantly
          if (stats.successRate < 95 || stats.p95Time > testCase.expectedTime * 3) {
            console.log(`  ⚠️  Performance degradation detected, stopping concurrency test`);
            break;
          }
          
        } catch (error) {
          console.log(`  ${concurrency} concurrent: ERROR - ${error.message}`);
          this.results.concurrentQueries[queryKey][`${concurrency}_concurrent`] = { error: error.message };
        }
      }
    }
  }
  
  /**
   * Run concurrent query test
   */
  async runConcurrentQueryTest(testCase, concurrency, duration) {
    const startTime = Date.now();
    const results = [];
    const activeQueries = [];
    
    // Launch concurrent queries
    for (let i = 0; i < concurrency; i++) {
      activeQueries.push(this.runContinuousQueries(testCase, startTime, duration, i));
    }
    
    // Wait for all concurrent tests to complete
    const allResults = await Promise.all(activeQueries);
    
    // Flatten results
    allResults.forEach(queryResults => {
      results.push(...queryResults);
    });
    
    return this.calculateQueryStats(results);
  }
  
  /**
   * Run continuous queries for a single concurrent thread
   */
  async runContinuousQueries(testCase, startTime, duration, threadId) {
    const results = [];
    
    while (Date.now() - startTime < duration) {
      const queryStart = Date.now();
      
      try {
        const { data, error, count } = await testCase.query();
        const queryEnd = Date.now();
        
        if (error) {
          throw error;
        }
        
        results.push({
          threadId,
          responseTime: queryEnd - queryStart,
          recordCount: data ? data.length : count || 0,
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        const queryEnd = Date.now();
        
        results.push({
          threadId,
          responseTime: queryEnd - queryStart,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Brief pause between queries from same thread
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return results;
  }
  
  /**
   * Test complex operations that simulate real workflows
   */
  async testComplexOperations() {
    console.log('\n=== COMPLEX OPERATION TESTING ===');
    
    // Test 1: Complete USMCA workflow simulation
    console.log('Testing complete USMCA workflow simulation...');
    const workflowStart = Date.now();
    
    try {
      // Step 1: Product classification
      const { data: hsData } = await this.supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, chapter, mfn_rate, usmca_rate')
        .textSearch('description', 'electronic device')
        .limit(10);
      
      // Step 2: Get qualification rules for found chapters
      const chapters = [...new Set(hsData.map(item => item.chapter.toString()))];
      const { data: qualificationData } = await this.supabase
        .from('usmca_qualification_rules')
        .select('*')
        .in('hs_chapter', chapters);
      
      // Step 3: Calculate potential savings for multiple products
      const savingsCalculations = [];
      for (const product of hsData.slice(0, 5)) {
        if (product.mfn_rate && product.usmca_rate) {
          const importValue = 100000; // $100k import
          const mfnDuty = importValue * (product.mfn_rate / 100);
          const usmcaDuty = importValue * (product.usmca_rate / 100);
          const savings = mfnDuty - usmcaDuty;
          
          savingsCalculations.push({
            hsCode: product.hs_code,
            importValue,
            mfnDuty,
            usmcaDuty,
            savings
          });
        }
      }
      
      const workflowTime = Date.now() - workflowStart;
      
      this.results.complexOperations.usmcaWorkflow = {
        success: true,
        responseTime: workflowTime,
        productsProcessed: hsData.length,
        rulesFound: qualificationData.length,
        savingsCalculated: savingsCalculations.length,
        totalSavingsPotential: savingsCalculations.reduce((sum, calc) => sum + calc.savings, 0)
      };
      
      console.log(`  ✅ Complete workflow: ${workflowTime}ms (${hsData.length} products, ${qualificationData.length} rules)`);
      
    } catch (error) {
      this.results.complexOperations.usmcaWorkflow = {
        success: false,
        error: error.message,
        responseTime: Date.now() - workflowStart
      };
      
      console.log(`  ❌ Workflow failed: ${error.message}`);
    }
    
    // Test 2: Bulk rate lookup for tariff calculator
    console.log('Testing bulk tariff rate lookup...');
    const bulkStart = Date.now();
    
    try {
      const testHsCodes = ['851712', '847330', '620342', '940360', '732393'];
      
      const { data: bulkData } = await this.supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate, country_source')
        .in('hs_code', testHsCodes);
      
      const bulkTime = Date.now() - bulkStart;
      
      this.results.complexOperations.bulkRateLookup = {
        success: true,
        responseTime: bulkTime,
        codesRequested: testHsCodes.length,
        codesFound: bulkData.length,
        averageTimePerCode: bulkTime / testHsCodes.length
      };
      
      console.log(`  ✅ Bulk lookup: ${bulkTime}ms (${bulkData.length}/${testHsCodes.length} codes found, ${(bulkTime/testHsCodes.length).toFixed(1)}ms per code)`);
      
    } catch (error) {
      this.results.complexOperations.bulkRateLookup = {
        success: false,
        error: error.message,
        responseTime: Date.now() - bulkStart
      };
      
      console.log(`  ❌ Bulk lookup failed: ${error.message}`);
    }
  }
  
  /**
   * Calculate query statistics
   */
  calculateQueryStats(results) {
    const successfulResults = results.filter(r => r.success);
    const responseTimes = successfulResults.map(r => r.responseTime);
    
    if (responseTimes.length === 0) {
      return {
        totalQueries: results.length,
        successfulQueries: 0,
        errorCount: results.length,
        successRate: 0,
        averageTime: 0,
        p95Time: 0
      };
    }
    
    responseTimes.sort((a, b) => a - b);
    
    return {
      totalQueries: results.length,
      successfulQueries: successfulResults.length,
      errorCount: results.length - successfulResults.length,
      successRate: (successfulResults.length / results.length) * 100,
      averageTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minTime: Math.min(...responseTimes),
      maxTime: Math.max(...responseTimes),
      p95Time: this.percentile(responseTimes, 95),
      queriesPerSecond: results.length / ((Math.max(...results.map(r => new Date(r.timestamp || Date.now()).getTime())) - 
                                          Math.min(...results.map(r => new Date(r.timestamp || Date.now()).getTime()))) / 1000)
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
   * Run all database performance tests
   */
  async runAllTests() {
    console.log('Triangle Intelligence Database Performance Testing');
    console.log('Testing Supabase PostgreSQL under enterprise load');
    console.log('================================================\n');
    
    try {
      // Test basic connection
      await this.testDatabaseConnection();
      
      // Test individual query performance
      await this.testQueryPerformance();
      
      // Test concurrent query performance
      await this.testConcurrentQueries();
      
      // Test complex operations
      await this.testComplexOperations();
      
      return this.generateDatabaseReport();
      
    } catch (error) {
      console.error('Database testing failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate database performance report
   */
  generateDatabaseReport() {
    const report = {
      timestamp: new Date().toISOString(),
      databaseInfo: {
        provider: 'Supabase PostgreSQL',
        primaryTable: 'hs_master_rebuild',
        estimatedRecords: '34,476+'
      },
      connectionTests: this.results.connectionTests,
      queryPerformance: this.results.queryPerformance,
      concurrentQueries: this.results.concurrentQueries,
      complexOperations: this.results.complexOperations,
      recommendations: this.generateDatabaseRecommendations()
    };
    
    return report;
  }
  
  /**
   * Generate database optimization recommendations
   */
  generateDatabaseRecommendations() {
    const recommendations = [];
    
    // Check query performance
    Object.entries(this.results.queryPerformance).forEach(([queryKey, stats]) => {
      if (!stats.meetsTarget) {
        recommendations.push({
          type: 'QUERY_OPTIMIZATION',
          severity: 'MEDIUM',
          query: queryKey,
          issue: `Average response time ${stats.averageTime.toFixed(0)}ms exceeds target ${stats.expectedTime}ms`,
          recommendation: 'Consider adding database indexes, optimizing query structure, or implementing caching'
        });
      }
    });
    
    // Check concurrent performance
    Object.entries(this.results.concurrentQueries).forEach(([queryKey, concurrentTests]) => {
      Object.entries(concurrentTests).forEach(([concurrency, stats]) => {
        if (stats.successRate < 99) {
          recommendations.push({
            type: 'CONCURRENCY',
            severity: 'HIGH',
            query: queryKey,
            concurrency,
            issue: `Success rate ${stats.successRate.toFixed(1)}% under concurrent load`,
            recommendation: 'Investigate connection pooling, timeout settings, or database scaling'
          });
        }
      });
    });
    
    return recommendations;
  }
}

module.exports = DatabasePerformanceTester;

// CLI execution
if (require.main === module) {
  async function runDatabaseTests() {
    const tester = new DatabasePerformanceTester();
    
    try {
      const report = await tester.runAllTests();
      
      console.log('\n=== DATABASE PERFORMANCE AUDIT COMPLETE ===');
      console.log(`Recommendations: ${report.recommendations.length}`);
      
      // Save results
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'database-performance-results.json');
      fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
      console.log(`Results saved to: ${filePath}`);
      
    } catch (error) {
      console.error('Database testing failed:', error);
      process.exit(1);
    }
  }
  
  runDatabaseTests();
}