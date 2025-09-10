/**
 * Check tariff data in database tables
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTariffData() {
  console.log('🔍 Checking Tariff Data in Database\n');
  console.log('=====================================\n');

  // 1. Check tariff_rates table
  console.log('📊 TARIFF_RATES TABLE:');
  const { data: tariffRates, error: tariffError } = await supabase
    .from('tariff_rates')
    .select('*')
    .limit(5);
  
  if (tariffError) {
    console.log('   ❌ Error accessing tariff_rates:', tariffError.message);
  } else {
    console.log(`   ✅ Found ${tariffRates?.length || 0} sample records`);
    if (tariffRates?.length > 0) {
      console.log('   Sample:', tariffRates[0]);
    }
  }

  // 2. Check usmca_tariff_rates table
  console.log('\n📊 USMCA_TARIFF_RATES TABLE:');
  const { data: usmcaRates, error: usmcaError } = await supabase
    .from('usmca_tariff_rates')
    .select('*')
    .limit(5);
  
  if (usmcaError) {
    console.log('   ❌ Error accessing usmca_tariff_rates:', usmcaError.message);
  } else {
    console.log(`   ✅ Found ${usmcaRates?.length || 0} sample records`);
    if (usmcaRates?.length > 0) {
      console.log('   Sample:', usmcaRates[0]);
    }
  }

  // 3. Check for electrical components (HS 85)
  console.log('\n🔌 ELECTRICAL COMPONENTS (HS Chapter 85):');
  
  // Check in hs_master_rebuild
  const { data: electrical1, count: count1 } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate', { count: 'exact' })
    .like('hs_code', '85%')
    .gt('mfn_rate', 0)
    .limit(3);
  
  console.log(`   hs_master_rebuild: ${count1 || 0} records with MFN rates > 0`);
  if (electrical1?.length > 0) {
    electrical1.forEach(item => {
      console.log(`     - ${item.hs_code}: MFN=${item.mfn_rate}%, USMCA=${item.usmca_rate}%`);
    });
  }

  // Check in usmca_tariff_rates
  const { data: electrical2, count: count2 } = await supabase
    .from('usmca_tariff_rates')
    .select('hs_code, mfn_rate, usmca_rate', { count: 'exact' })
    .like('hs_code', '85%')
    .limit(3);
  
  console.log(`   usmca_tariff_rates: ${count2 || 0} records`);
  if (electrical2?.length > 0) {
    electrical2.forEach(item => {
      console.log(`     - ${item.hs_code}: MFN=${item.mfn_rate}%, USMCA=${item.usmca_rate}%`);
    });
  }

  // 4. Check for textiles (HS 61-63) for comparison
  console.log('\n👔 TEXTILES (HS Chapters 61-63):');
  
  const { data: textiles1, count: tcount1 } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate', { count: 'exact' })
    .or('hs_code.like.61%,hs_code.like.62%,hs_code.like.63%')
    .gt('mfn_rate', 0)
    .limit(3);
  
  console.log(`   hs_master_rebuild: ${tcount1 || 0} records with MFN rates > 0`);
  if (textiles1?.length > 0) {
    textiles1.forEach(item => {
      console.log(`     - ${item.hs_code}: MFN=${item.mfn_rate}%, USMCA=${item.usmca_rate}%`);
    });
  }

  // 5. Check specific HS codes
  console.log('\n🔍 SPECIFIC HS CODE CHECKS:');
  
  // Check cotton t-shirt (6109)
  const { data: tshirt } = await supabase
    .from('usmca_tariff_rates')
    .select('*')
    .like('hs_code', '6109%')
    .limit(1)
    .single();
  
  console.log(`   Cotton T-shirt (6109): ${tshirt ? `MFN=${tshirt.mfn_rate}%, USMCA=${tshirt.usmca_rate}%` : 'NOT FOUND'}`);

  // Check electrical connectors (8536)
  const { data: connector } = await supabase
    .from('usmca_tariff_rates')
    .select('*')
    .like('hs_code', '8536%')
    .limit(1)
    .single();
  
  console.log(`   Electrical Connector (8536): ${connector ? `MFN=${connector.mfn_rate}%, USMCA=${connector.usmca_rate}%` : 'NOT FOUND'}`);

  // Check cables (8544)
  const { data: cable } = await supabase
    .from('usmca_tariff_rates')
    .select('*')
    .like('hs_code', '8544%')
    .limit(1)
    .single();
  
  console.log(`   Electrical Cable (8544): ${cable ? `MFN=${cable.mfn_rate}%, USMCA=${cable.usmca_rate}%` : 'NOT FOUND'}`);

  console.log('\n=====================================\n');
  console.log('✅ Tariff data check complete!\n');
}

checkTariffData().catch(console.error);