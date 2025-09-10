#!/usr/bin/env node

/**
 * DATABASE HEALTH MONITOR
 * Comprehensive database connectivity and field mapping validation
 * Addresses core alignment issues identified in the system
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

class DatabaseHealthMonitor {
  constructor() {
    this.client = null;
    this.testResults = {
      connectivity: null,
      fieldMapping: null,
      dataQuality: null,
      performance: null,
      overall: null
    };
    
    this.initializeClient();
  }

  initializeClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Database configuration missing');
      console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: {
        headers: { 'X-Client-Info': 'database-health-monitor' }
      }
    });

    console.log('✅ Database client initialized');
  }

  async testConnectivity() {
    console.log('\\n🔍 TESTING DATABASE CONNECTIVITY...');
    
    if (!this.client) {
      this.testResults.connectivity = {
        success: false,
        error: 'Client not initialized',
        latency: 0
      };
      console.log('❌ Database client not initialized');
      return false;
    }

    const startTime = performance.now();
    
    try {
      // Test 1: Basic connection
      const { data: pingData, error: pingError } = await this.client
        .from('hs_master_rebuild')
        .select('count(*)', { count: 'exact', head: true });
      
      const latency = performance.now() - startTime;

      if (pingError) {
        this.testResults.connectivity = {
          success: false,
          error: pingError.message,
          latency,
          details: pingError
        };
        console.log(`❌ Connection failed: ${pingError.message}`);
        return false;
      }

      // Test 2: Record count validation
      const recordCount = pingData?.length || 0;
      const hasExpectedData = recordCount > 30000; // Expect 34,476 records

      this.testResults.connectivity = {
        success: true,
        latency: Math.round(latency),
        recordCount,
        hasExpectedData,
        dataSourceStatus: hasExpectedData ? 'EXCELLENT' : recordCount > 1000 ? 'MODERATE' : 'POOR'
      };

      console.log(`✅ Connection successful - ${Math.round(latency)}ms latency`);
      console.log(`✅ Record count: ${recordCount} (${hasExpectedData ? 'EXCELLENT' : 'NEEDS ATTENTION'})`);
      
      return true;

    } catch (error) {
      this.testResults.connectivity = {
        success: false,
        error: error.message,
        latency: performance.now() - startTime
      };
      console.log(`❌ Connection error: ${error.message}`);
      return false;
    }
  }

  async testFieldMapping() {
    console.log('\\n🔍 TESTING FIELD MAPPING...');
    
    try {
      // Test query that mimics API usage
      const { data: testData, error: testError } = await this.client
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate, country_source, chapter')
        .ilike('description', '%leather%')
        .limit(3);

      if (testError) {
        this.testResults.fieldMapping = {
          success: false,
          error: testError.message
        };
        console.log(`❌ Field mapping test failed: ${testError.message}`);
        return false;
      }

      if (!testData || testData.length === 0) {
        this.testResults.fieldMapping = {
          success: false,
          error: 'No test data returned'
        };
        console.log('❌ No test data returned');
        return false;
      }

      // Validate field presence and types
      const sample = testData[0];
      const requiredFields = ['hs_code', 'description', 'mfn_rate', 'usmca_rate'];
      const fieldAnalysis = {};

      requiredFields.forEach(field => {
        const value = sample[field];
        fieldAnalysis[field] = {
          present: value !== undefined && value !== null,
          type: typeof value,
          hasValue: value !== undefined && value !== null && value !== '',
          sampleValue: value
        };
      });

      const allFieldsPresent = requiredFields.every(field => fieldAnalysis[field].present);
      const criticalFieldsMissing = requiredFields.filter(field => !fieldAnalysis[field].present);

      this.testResults.fieldMapping = {
        success: allFieldsPresent,
        fieldAnalysis,
        criticalFieldsMissing,
        sampleRecord: sample,
        recordsTestable: testData.length
      };

      if (allFieldsPresent) {
        console.log('✅ All required fields present and accessible');
        console.log(`   Sample HS Code: ${sample.hs_code}`);
        console.log(`   MFN Rate: ${sample.mfn_rate}, USMCA Rate: ${sample.usmca_rate}`);
      } else {
        console.log(`❌ Missing critical fields: ${criticalFieldsMissing.join(', ')}`);
        console.log(`   Available fields: ${Object.keys(sample).join(', ')}`);
      }

      return allFieldsPresent;

    } catch (error) {
      this.testResults.fieldMapping = {
        success: false,
        error: error.message
      };
      console.log(`❌ Field mapping test error: ${error.message}`);
      return false;
    }
  }

  async testDataQuality() {
    console.log('\\n🔍 TESTING DATA QUALITY...');
    
    try {
      // Test data completeness and quality
      const { data: qualityData, error: qualityError } = await this.client
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate, country_source')
        .not('description', 'is', null)
        .limit(100);

      if (qualityError) {
        this.testResults.dataQuality = {
          success: false,
          error: qualityError.message
        };
        console.log(`❌ Data quality test failed: ${qualityError.message}`);
        return false;
      }

      // Analyze data quality metrics
      const qualityMetrics = {
        totalRecords: qualityData.length,
        hasDescription: qualityData.filter(r => r.description && r.description.length > 10).length,
        hasMfnRate: qualityData.filter(r => r.mfn_rate !== null && r.mfn_rate !== undefined).length,
        hasUsmcaRate: qualityData.filter(r => r.usmca_rate !== null && r.usmca_rate !== undefined).length,
        hasCountrySource: qualityData.filter(r => r.country_source).length,
        validHsCodes: qualityData.filter(r => r.hs_code && r.hs_code.length >= 6).length
      };

      // Calculate quality percentages
      const qualityPercentages = {};
      Object.keys(qualityMetrics).forEach(metric => {
        if (metric !== 'totalRecords') {
          qualityPercentages[metric] = Math.round((qualityMetrics[metric] / qualityMetrics.totalRecords) * 100);
        }
      });

      const overallDataQuality = Object.values(qualityPercentages).reduce((acc, val) => acc + val, 0) / Object.keys(qualityPercentages).length;

      this.testResults.dataQuality = {
        success: overallDataQuality >= 80, // 80% threshold for good data quality
        metrics: qualityMetrics,
        percentages: qualityPercentages,
        overallQuality: Math.round(overallDataQuality),
        qualityLevel: overallDataQuality >= 90 ? 'EXCELLENT' : overallDataQuality >= 80 ? 'GOOD' : overallDataQuality >= 60 ? 'MODERATE' : 'POOR'
      };

      console.log(`✅ Data quality analysis complete - ${Math.round(overallDataQuality)}% overall quality`);
      console.log(`   Descriptions: ${qualityPercentages.hasDescription}%`);
      console.log(`   MFN Rates: ${qualityPercentages.hasMfnRate}%`);
      console.log(`   USMCA Rates: ${qualityPercentages.hasUsmcaRate}%`);
      console.log(`   Country Sources: ${qualityPercentages.hasCountrySource}%`);

      return overallDataQuality >= 80;

    } catch (error) {
      this.testResults.dataQuality = {
        success: false,
        error: error.message
      };
      console.log(`❌ Data quality test error: ${error.message}`);
      return false;
    }
  }

  async testPerformance() {
    console.log('\\n🔍 TESTING DATABASE PERFORMANCE...');
    
    const performanceTests = [
      { name: 'Simple Select', query: () => this.client.from('hs_master_rebuild').select('hs_code').limit(1) },
      { name: 'Text Search', query: () => this.client.from('hs_master_rebuild').select('*').ilike('description', '%leather%').limit(5) },
      { name: 'Chapter Filter', query: () => this.client.from('hs_master_rebuild').select('*').eq('chapter', 42).limit(5) }
    ];

    const results = {};
    
    for (const test of performanceTests) {
      const startTime = performance.now();
      
      try {
        const { data, error } = await test.query();
        const duration = performance.now() - startTime;
        
        results[test.name] = {
          success: !error,
          duration: Math.round(duration),
          recordCount: data?.length || 0,
          error: error?.message
        };

        if (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`✅ ${test.name}: ${Math.round(duration)}ms (${data?.length || 0} records)`);
        }

      } catch (err) {
        results[test.name] = {
          success: false,
          duration: performance.now() - startTime,
          error: err.message
        };
        console.log(`❌ ${test.name}: ${err.message}`);
      }
    }

    const avgDuration = Object.values(results).reduce((acc, r) => acc + (r.duration || 0), 0) / performanceTests.length;
    const allSuccessful = Object.values(results).every(r => r.success);

    this.testResults.performance = {
      success: allSuccessful && avgDuration < 500, // Success if all queries work and average < 500ms
      averageDuration: Math.round(avgDuration),
      results,
      performanceLevel: avgDuration < 200 ? 'EXCELLENT' : avgDuration < 500 ? 'GOOD' : avgDuration < 1000 ? 'MODERATE' : 'POOR'
    };

    return this.testResults.performance.success;
  }

  generateHealthReport() {
    console.log('\\n📊 DATABASE HEALTH REPORT');
    console.log('===============================');
    
    const tests = [
      { name: 'Connectivity', result: this.testResults.connectivity },
      { name: 'Field Mapping', result: this.testResults.fieldMapping },
      { name: 'Data Quality', result: this.testResults.dataQuality },
      { name: 'Performance', result: this.testResults.performance }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    tests.forEach(test => {
      const status = test.result?.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}`);
      
      if (test.result?.success) {
        passedTests++;
      } else if (test.result?.error) {
        console.log(`      Error: ${test.result.error}`);
      }
    });

    const overallHealth = Math.round((passedTests / totalTests) * 100);
    
    this.testResults.overall = {
      healthScore: overallHealth,
      passedTests,
      totalTests,
      healthLevel: overallHealth >= 90 ? 'EXCELLENT' : overallHealth >= 75 ? 'GOOD' : overallHealth >= 50 ? 'MODERATE' : 'POOR',
      recommendations: this.generateRecommendations()
    };

    console.log(`\\n🎯 OVERALL HEALTH SCORE: ${overallHealth}% (${this.testResults.overall.healthLevel})`);
    
    if (this.testResults.overall.recommendations.length > 0) {
      console.log('\\n📋 RECOMMENDATIONS:');
      this.testResults.overall.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    return this.testResults;
  }

  generateRecommendations() {
    const recommendations = [];

    if (!this.testResults.connectivity?.success) {
      recommendations.push('Fix database connectivity - check Supabase URL and service key');
    }

    if (!this.testResults.fieldMapping?.success) {
      recommendations.push('Resolve field mapping issues - ensure hs_master_rebuild table has required columns');
    }

    if (this.testResults.dataQuality?.overallQuality < 80) {
      recommendations.push('Improve data quality - missing values in critical fields');
    }

    if (this.testResults.performance?.averageDuration > 500) {
      recommendations.push('Optimize database performance - queries taking too long');
    }

    if (this.testResults.connectivity?.recordCount < 30000) {
      recommendations.push('Verify data completeness - expected 34,476+ records in hs_master_rebuild');
    }

    return recommendations;
  }

  async runFullHealthCheck() {
    console.log('🚀 DATABASE HEALTH MONITOR STARTING\\n');
    
    const connectivityOk = await this.testConnectivity();
    
    if (connectivityOk) {
      await this.testFieldMapping();
      await this.testDataQuality();
      await this.testPerformance();
    }
    
    const report = this.generateHealthReport();
    
    console.log('\\n🎯 DATABASE HEALTH CHECK COMPLETE');
    
    return report;
  }
}

// Run health check if called directly
if (require.main === module) {
  new DatabaseHealthMonitor().runFullHealthCheck()
    .then((report) => {
      const exitCode = report.overall.healthScore >= 75 ? 0 : 1;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\\n💥 Database health check failed:', error.message);
      process.exit(2);
    });
}

module.exports = { DatabaseHealthMonitor };