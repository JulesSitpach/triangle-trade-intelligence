// Phase 1 Database Connectivity Test - ULTRATHINK Audit
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnectivity() {
  console.log('🔍 ULTRATHINK Phase 1: Database Connectivity Test');
  console.log('=' .repeat(60));
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const results = {
      timestamp: new Date().toISOString(),
      connectivity: {},
      record_counts: {},
      performance: {},
      issues: []
    };

    // Test each critical table
    const criticalTables = [
      'hs_master_rebuild',
      'user_profiles', 
      'workflow_completions',
      'rss_feeds',
      'usmca_qualification_rules'
    ];

    for (const table of criticalTables) {
      console.log(`\n📊 Testing table: ${table}`);
      
      const startTime = Date.now();
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        results.connectivity[table] = { status: 'ERROR', error: error.message };
        results.issues.push(`${table}: ${error.message}`);
      } else {
        console.log(`✅ Connected: ${count} records (${responseTime}ms)`);
        results.connectivity[table] = { 
          status: 'CONNECTED', 
          records: count,
          response_time_ms: responseTime
        };
        results.record_counts[table] = count;
        results.performance[table] = responseTime;
      }
    }

    // Calculate overall health
    const connectedTables = Object.values(results.connectivity).filter(t => t.status === 'CONNECTED').length;
    const healthScore = Math.round((connectedTables / criticalTables.length) * 100);
    
    results.summary = {
      tables_tested: criticalTables.length,
      tables_connected: connectedTables,
      health_score: healthScore,
      avg_response_time: Math.round(Object.values(results.performance).reduce((a, b) => a + b, 0) / Object.values(results.performance).length),
      total_records: Object.values(results.record_counts).reduce((a, b) => a + b, 0)
    };

    console.log('\n📋 DATABASE CONNECTIVITY SUMMARY');
    console.log('=' .repeat(40));
    console.log(`Health Score: ${results.summary.health_score}%`);
    console.log(`Tables Connected: ${results.summary.tables_connected}/${results.summary.tables_tested}`);
    console.log(`Average Response Time: ${results.summary.avg_response_time}ms`);
    console.log(`Total Records: ${results.summary.total_records.toLocaleString()}`);
    
    if (results.issues.length > 0) {
      console.log('\n⚠️  ISSUES DETECTED:');
      results.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    return results;

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    return {
      timestamp: new Date().toISOString(),
      status: 'CRITICAL_FAILURE',
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnectivity()
    .then(results => {
      console.log('\n💾 Test completed. Results available in return value.');
      process.exit(results.summary?.health_score === 100 ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnectivity };