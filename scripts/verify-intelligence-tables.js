const { createClient } = require('@supabase/supabase-js');

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyIntelligenceTables() {
  console.log('🔍 Verifying Intelligence System Database Tables\n');
  
  const requiredTables = [
    'seasonal_import_patterns',
    'market_intelligence_cache', 
    'success_pattern_library',
    'user_pattern_matches',
    'similarity_matches',
    'workflow_sessions',
    'hindsight_pattern_library',
    'marcus_consultations',
    'compound_intelligence_events',
    'network_intelligence_events'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${table} - MISSING`);
          missingTables.push(table);
        } else {
          console.log(`⚠️  ${table} - ERROR: ${error.message}`);
          missingTables.push(table);
        }
      } else {
        console.log(`✅ ${table} - EXISTS`);
        existingTables.push(table);
      }
    } catch (err) {
      console.log(`❌ ${table} - EXCEPTION: ${err.message}`);
      missingTables.push(table);
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Existing tables: ${existingTables.length}/${requiredTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}/${requiredTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing tables:', missingTables.join(', '));
    console.log('\n💡 Note: Some missing tables may not be critical. The system can work with fallbacks.');
  }
  
  // Check core tables that definitely exist
  console.log('\n🔍 Checking core existing tables:');
  const coreTables = ['trade_flows', 'comtrade_reference', 'countries', 'usmca_tariff_rates'];
  
  for (const table of coreTables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`📊 ${table}: ${count || 0} records`);
  }
  
  return { existingTables, missingTables };
}

verifyIntelligenceTables()
  .then(result => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  });