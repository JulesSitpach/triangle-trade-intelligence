const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditDatabase() {
  console.log('🔍 TRIANGLE INTELLIGENCE PLATFORM - DATABASE AUDIT');
  console.log('==================================================\n');
  
  const coreTables = [
    'trade_flows', 'comtrade_reference', 'workflow_sessions', 'hindsight_pattern_library',
    'marcus_consultations', 'usmca_tariff_rates', 'us_ports', 'countries', 'translations',
    'current_market_alerts', 'api_cache', 'country_risk_scores'
  ];
  
  let totalRecords = 0;
  let workingTables = [];
  let brokenTables = [];
  
  for (const table of coreTables) {
    try {
      const {count, error} = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (!error && count !== null) {
        totalRecords += count;
        workingTables.push({table, count});
        console.log(`✅ ${table.padEnd(25)}: ${count.toLocaleString()} records`);
      } else {
        brokenTables.push({table, error: error?.message || 'Unknown error'});
        console.log(`❌ ${table.padEnd(25)}: ${error?.message || 'Error'}`);
      }
    } catch (err) {
      brokenTables.push({table, error: err.message});
      console.log(`💥 ${table.padEnd(25)}: ${err.message}`);
    }
  }
  
  console.log('\n📊 DATABASE AUDIT RESULTS:');
  console.log(`Total Records: ${totalRecords.toLocaleString()}`);
  console.log(`Working Tables: ${workingTables.length}/${coreTables.length}`);
  console.log(`Broken Tables: ${brokenTables.length}`);
  
  if (brokenTables.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    brokenTables.forEach(({table, error}) => {
      console.log(`  - ${table}: ${error}`);
    });
  }
  
  // Test key intelligence data quality
  console.log('\n🧠 INTELLIGENCE DATA QUALITY:');
  
  try {
    // Trade flows sample
    const {data: tradeFlows} = await supabase
      .from('trade_flows')
      .select('*')
      .limit(3);
      
    if (tradeFlows && tradeFlows.length > 0) {
      console.log(`✅ Trade flows structure: ${Object.keys(tradeFlows[0]).length} columns`);
      console.log(`   Sample columns: ${Object.keys(tradeFlows[0]).slice(0, 5).join(', ')}...`);
    }
    
    // Test Beast Master data dependencies
    const {data: sessions} = await supabase
      .from('workflow_sessions')
      .select('*')
      .limit(1);
      
    if (sessions && sessions.length > 0) {
      console.log('✅ Workflow sessions active: Beast Master data available');
    } else {
      console.log('⚠️  Workflow sessions empty: Beast Master may be compromised');
    }
    
    // Test Marcus intelligence
    const {data: marcus} = await supabase
      .from('marcus_consultations')
      .select('*')
      .limit(1);
      
    if (marcus && marcus.length > 0) {
      console.log('✅ Marcus consultations active: AI intelligence available');
    } else {
      console.log('⚠️  Marcus consultations empty: AI features may be compromised');
    }
    
  } catch (error) {
    console.log(`❌ Intelligence data test failed: ${error.message}`);
  }
  
  console.log('\n🎯 CRITICAL BUSINESS IMPACT ASSESSMENT:');
  
  const criticalTables = workingTables.filter(({count}) => count > 1000);
  const businessCritical = ['trade_flows', 'comtrade_reference', 'workflow_sessions'];
  const missingCritical = businessCritical.filter(table => 
    !workingTables.find(wt => wt.table === table)
  );
  
  if (missingCritical.length > 0) {
    console.log(`🚨 BUSINESS CRITICAL TABLES MISSING: ${missingCritical.join(', ')}`);
    console.log('   IMPACT: $100K-$300K savings feature BROKEN');
  } else {
    console.log('✅ All business critical tables operational');
  }
  
  console.log(`📈 Large datasets: ${criticalTables.length} tables with 1000+ records`);
  console.log(`💎 Platform readiness: ${Math.round((workingTables.length / coreTables.length) * 100)}%`);
}

auditDatabase().catch(console.error);