const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exploreDatabase() {
  console.log('🔍 EXPLORING TRIANGLE INTELLIGENCE DATABASE');
  console.log('==========================================\n');
  
  const coreTables = [
    'trade_flows', 
    'comtrade_reference',
    'workflow_sessions',
    'hindsight_pattern_library',
    'marcus_consultations',
    'usmca_tariff_rates',
    'us_ports',
    'countries',
    'translations',
    'current_market_alerts',
    'api_cache'
  ];
  
  let totalRecords = 0;
  const results = {};
  
  for (const table of coreTables) {
    try {
      const {count, error} = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (!error && count !== null) {
        totalRecords += count;
        results[table] = { count, status: 'ACTIVE' };
        console.log(`✅ ${table.padEnd(25)}: ${count.toLocaleString()} records`);
        
        if (count > 0) {
          const {data: sample} = await supabase
            .from(table)
            .select('*')
            .limit(1);
            
          if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);
            results[table].columns = columns;
            results[table].sampleData = sample[0];
            console.log(`   📋 Columns (${columns.length}): ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
          }
        }
      } else {
        results[table] = { count: 0, status: 'ERROR', error: error?.message };
        console.log(`❌ ${table.padEnd(25)}: ${error?.message || 'Not found'}`);
      }
    } catch (err) {
      results[table] = { count: 0, status: 'EXCEPTION', error: err.message };
      console.log(`💥 ${table.padEnd(25)}: ${err.message}`);
    }
  }
  
  console.log(`\n📊 TOTAL RECORDS: ${totalRecords.toLocaleString()}`);
  console.log(`📈 ACTIVE TABLES: ${Object.values(results).filter(r => r.status === 'ACTIVE').length}/${coreTables.length}`);
  
  return results;
}

async function analyzeMassiveTable() {
  console.log('\n🎯 ANALYZING LARGEST TABLES FOR INTELLIGENCE\n');
  
  // Check trade_flows (should be 597K+ records)
  const {count: tradeFlowCount, error: tradeError} = await supabase
    .from('trade_flows')
    .select('*', { count: 'exact', head: true });
    
  if (!tradeError && tradeFlowCount > 0) {
    console.log(`🚀 TRADE_FLOWS: ${tradeFlowCount.toLocaleString()} records - MASSIVE DATASET!`);
    
    // Sample data to understand structure
    const {data: tradeSample} = await supabase
      .from('trade_flows')
      .select('*')
      .limit(3);
      
    if (tradeSample && tradeSample.length > 0) {
      console.log('📋 Trade Flow Structure:');
      Object.keys(tradeSample[0]).forEach(key => {
        console.log(`   ${key}: ${tradeSample[0][key]}`);
      });
      
      // Check for triangle routing opportunities
      const {data: triangleData} = await supabase
        .from('trade_flows')
        .select('reporter_country, partner_country, trade_value')
        .in('reporter_country', ['CN', 'IN', 'VN', 'TH'])
        .eq('partner_country', 'US')
        .not('trade_value', 'is', null)
        .order('trade_value', { ascending: false })
        .limit(5);
        
      if (triangleData && triangleData.length > 0) {
        console.log('🎯 TOP TRIANGLE ROUTING OPPORTUNITIES:');
        triangleData.forEach((flow, i) => {
          const value = flow.trade_value ? `$${(flow.trade_value / 1000000).toFixed(1)}M` : 'N/A';
          console.log(`   ${i+1}. ${flow.reporter_country} → US: ${value}`);
        });
      }
    }
  }
  
  // Check comtrade_reference
  const {count: comtradeCount} = await supabase
    .from('comtrade_reference')
    .select('*', { count: 'exact', head: true });
    
  if (comtradeCount > 0) {
    console.log(`\n📚 COMTRADE_REFERENCE: ${comtradeCount.toLocaleString()} HS code classifications`);
    
    // Sample HS codes
    const {data: hsSample} = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description')
      .like('hs_code', '87%') // Automotive
      .limit(3);
      
    if (hsSample && hsSample.length > 0) {
      console.log('🚗 Sample Automotive HS Codes:');
      hsSample.forEach(hs => {
        console.log(`   ${hs.hs_code}: ${hs.product_description?.substring(0, 50)}...`);
      });
    }
  }
}

async function checkIntelligenceTables() {
  console.log('\n🧠 CHECKING INTELLIGENCE & LEARNING TABLES\n');
  
  const intelligenceTables = [
    'workflow_sessions',
    'hindsight_pattern_library', 
    'marcus_consultations',
    'user_pattern_matches',
    'stage_analytics',
    'network_intelligence_events'
  ];
  
  for (const table of intelligenceTables) {
    try {
      const {count} = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (count > 0) {
        console.log(`🧠 ${table}: ${count} records`);
        
        // Get sample to understand intelligence structure
        const {data: sample} = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (sample && sample.length > 0) {
          console.log(`   Structure: ${Object.keys(sample[0]).join(', ')}`);
        }
      } else {
        console.log(`⚪ ${table}: Empty (0 records)`);
      }
    } catch (err) {
      console.log(`❓ ${table}: Table may not exist`);
    }
  }
}

async function main() {
  try {
    const results = await exploreDatabase();
    await analyzeMassiveTable();
    await checkIntelligenceTables();
    
    console.log('\n🎯 DATABASE INTELLIGENCE SUMMARY:');
    console.log('================================');
    
    const activeCount = Object.values(results).filter(r => r.status === 'ACTIVE').length;
    console.log(`✅ Active Tables: ${activeCount}`);
    console.log(`📊 Total Records: ${Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0).toLocaleString()}`);
    
    const hasMassiveData = results.trade_flows?.count > 100000;
    const hasIntelligence = results.workflow_sessions?.count > 0;
    
    console.log(`🚀 Massive Dataset: ${hasMassiveData ? 'YES' : 'NO'}`);
    console.log(`🧠 Intelligence Active: ${hasIntelligence ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Database exploration failed:', error.message);
  }
}

main();