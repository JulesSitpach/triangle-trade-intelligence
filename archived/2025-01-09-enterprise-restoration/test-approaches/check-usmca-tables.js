require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Checking USMCA rate distribution across tables...\n');
    
    // Check hs_master_rebuild for USMCA rate patterns
    const { data: hsData, error: hsError } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, usmca_rate')
      .not('usmca_rate', 'is', null)
      .limit(10);
    
    if (hsError) {
      console.log('❌ hs_master_rebuild error:', hsError.message);
    } else {
      console.log('📊 hs_master_rebuild USMCA rates sample:');
      hsData?.forEach(row => console.log(`  ${row.hs_code}: ${row.usmca_rate}%`));
    }
    
    // Check separate tariff table
    const { data: tariffData, error: tariffError } = await supabase
      .from('usmca_tariff_rates')
      .select('hs_code, usmca_rate, mfn_rate')
      .limit(10);
    
    if (tariffError) {
      console.log('\n❌ usmca_tariff_rates error:', tariffError.message);
    } else {
      console.log('\n📊 usmca_tariff_rates sample:');
      tariffData?.forEach(row => console.log(`  ${row.hs_code}: USMCA ${row.usmca_rate}%, MFN ${row.mfn_rate}%`));
    }
    
    // Count zero vs non-zero rates in hs_master_rebuild
    const { count: zeroCount } = await supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .eq('usmca_rate', 0);
      
    const { count: nonZeroCount } = await supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .gt('usmca_rate', 0);
      
    console.log('\n📈 hs_master_rebuild USMCA rate distribution:');
    console.log(`  0% rates: ${zeroCount || 'unknown'}`);
    console.log(`  >0% rates: ${nonZeroCount || 'unknown'}`);
    
    if (zeroCount > 30000) {
      console.log('\n🚨 DIAGNOSIS: Most records have 0% USMCA rates - likely placeholder values!');
      console.log('   The qualification logic is incorrectly treating 0% as "qualified duty-free"');
      console.log('   when it should mean "no qualification data available"');
    }
    
  } catch (error) {
    console.error('🚨 Database error:', error.message);
  }
}

checkTables();