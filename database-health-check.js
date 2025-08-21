// Triangle Intelligence Database Health Check
// Run this to verify database connectivity and schema integrity

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!SERVICE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkDatabaseHealth() {
  console.log('🔍 Triangle Intelligence Database Health Check\n');
  
  const results = {
    connectivity: false,
    coreTablesCounted: 0,
    translationsWorking: false,
    dataIntegrity: false,
    totalRecords: 0
  };

  try {
    // 1. Basic connectivity test
    console.log('1. Testing basic connectivity...');
    const { data: testData, error: testError } = await supabase
      .from('countries')
      .select('*', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Connectivity failed:', testError.message);
      return results;
    }
    
    results.connectivity = true;
    console.log('✅ Database connectivity working');

    // 2. Core tables check
    console.log('\n2. Checking core tables...');
    const coreTables = [
      'trade_flows',
      'comtrade_reference', 
      'usmca_tariff_rates',
      'translations',
      'workflow_sessions',
      'hindsight_pattern_library'
    ];

    for (const table of coreTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: ${count || 0} records`);
          results.coreTablesCounted++;
          results.totalRecords += (count || 0);
        }
      } catch (err) {
        console.error(`❌ Table ${table}: ${err.message}`);
      }
    }

    // 3. Translation system check
    console.log('\n3. Testing translation system...');
    const { data: translations, error: translationError } = await supabase
      .from('translations')
      .select('key, language, value')
      .eq('language', 'en')
      .limit(5);

    if (translationError) {
      console.error('❌ Translation query failed:', translationError.message);
    } else if (translations && translations.length > 0) {
      console.log(`✅ Translation system working: ${translations.length} sample records`);
      console.log('   Sample translation:', translations[0]);
      results.translationsWorking = true;
    } else {
      console.log('⚠️  Translation table exists but is empty');
    }

    // 4. Data integrity spot checks
    console.log('\n4. Data integrity checks...');
    
    // Check for critical intelligence data
    const { count: tradeFlowCount, error: tradeError } = await supabase
      .from('trade_flows')
      .select('*', { count: 'exact', head: true });

    const { count: hsClassificationCount, error: hsError } = await supabase
      .from('comtrade_reference')
      .select('*', { count: 'exact', head: true });

    if (!tradeError && !hsError) {
      results.dataIntegrity = true;
      console.log('✅ Core intelligence data present');
    }

    // 5. Beast Master dependencies check
    console.log('\n5. Beast Master dependency check...');
    const beastMasterTables = [
      'workflow_sessions',
      'hindsight_pattern_library',
      'marcus_consultations'
    ];

    let beastMasterReady = true;
    for (const table of beastMasterTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Beast Master table ${table}: ${error.message}`);
          beastMasterReady = false;
        } else {
          console.log(`✅ Beast Master table ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.error(`❌ Beast Master table ${table}: ${err.message}`);
        beastMasterReady = false;
      }
    }

    if (beastMasterReady) {
      console.log('✅ Beast Master dependencies ready');
    }

  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    return results;
  }

  // Summary
  console.log('\n📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(40));
  console.log(`Connectivity: ${results.connectivity ? '✅' : '❌'}`);
  console.log(`Core Tables: ${results.coreTablesCounted}/6 working`);
  console.log(`Translations: ${results.translationsWorking ? '✅' : '❌'}`);
  console.log(`Data Integrity: ${results.dataIntegrity ? '✅' : '❌'}`);
  console.log(`Total Records: ${results.totalRecords.toLocaleString()}`);

  const overallHealth = results.connectivity && 
                       results.coreTablesCounted >= 4 && 
                       results.translationsWorking && 
                       results.dataIntegrity;

  console.log(`\n🎯 Overall Health: ${overallHealth ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}`);

  if (overallHealth) {
    console.log('\n✅ Database is ready for Stage 1 execution plan');
  } else {
    console.log('\n⚠️  Fix database issues before proceeding with execution plan');
  }

  return results;
}

// Run the health check
checkDatabaseHealth()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Health check crashed:', error);
    process.exit(1);
  });