const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateTariffRates() {
  console.log('🔍 CRITICAL BUSINESS INVESTIGATION: USMCA Tariff Rate Data\n');
  console.log('Customer Impact: Sarah, Mike, Lisa need accurate rates for $150K-$625K decisions\n');
  
  // Check for any non-zero MFN rates
  console.log('1. SEARCHING FOR NON-ZERO MFN RATES:');
  const mfnResult = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate')
    .gt('mfn_rate', 0)
    .limit(5);
    
  console.log(`   Found ${mfnResult.data?.length || 0} records with non-zero MFN rates`);
  if (mfnResult.data?.length > 0) {
    mfnResult.data.forEach(record => {
      console.log(`   ${record.hs_code}: MFN=${record.mfn_rate}%, USMCA=${record.usmca_rate}%`);
      console.log(`      ${record.description?.substring(0, 60)}`);
    });
  } else {
    console.log('   ❌ ALL MFN RATES ARE 0% - This is a critical data issue!');
  }
  
  console.log('\n2. CHECKING ELECTRONICS HS CODES (Should have 4-6% tariffs):');
  const electronicsHS = [
    { code: '8517620000', name: 'Smartphones' },
    { code: '8518220000', name: 'Speakers' }, 
    { code: '8544420000', name: 'Coaxial cable' },
    { code: '8471300000', name: 'Computers' }
  ];
  
  for (const item of electronicsHS) {
    const result = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate')
      .eq('hs_code', item.code)
      .single();
      
    if (result.data) {
      console.log(`   ${item.code} (${item.name}): MFN=${result.data.mfn_rate}%, USMCA=${result.data.usmca_rate}%`);
    } else {
      console.log(`   ${item.code} (${item.name}): NOT FOUND IN DATABASE`);
    }
  }
  
  console.log('\n3. CHECKING AUTOMOTIVE HS CODES (Should have 2-4% tariffs):');
  const automotiveHS = [
    { code: '8708801000', name: 'Brake parts' },
    { code: '8708309500', name: 'Brake systems' }
  ];
  
  for (const item of automotiveHS) {
    const result = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate')
      .eq('hs_code', item.code)
      .single();
      
    if (result.data) {
      console.log(`   ${item.code} (${item.name}): MFN=${result.data.mfn_rate}%, USMCA=${result.data.usmca_rate}%`);
    } else {
      console.log(`   ${item.code} (${item.name}): NOT FOUND IN DATABASE`);
    }
  }
  
  console.log('\n4. DATABASE STATISTICS:');
  const stats = await supabase
    .from('hs_master_rebuild')
    .select('mfn_rate, usmca_rate', { count: 'exact' });
  
  console.log(`   Total records: ${stats.count}`);
  
  // Check average rates
  if (stats.data && stats.data.length > 0) {
    const avgMfn = stats.data.reduce((sum, r) => sum + (r.mfn_rate || 0), 0) / stats.data.length;
    const avgUsmca = stats.data.reduce((sum, r) => sum + (r.usmca_rate || 0), 0) / stats.data.length;
    console.log(`   Average MFN rate: ${avgMfn.toFixed(3)}%`);
    console.log(`   Average USMCA rate: ${avgUsmca.toFixed(3)}%`);
  }
  
  console.log('\n🚨 BUSINESS IMPACT ASSESSMENT:');
  if (!mfnResult.data || mfnResult.data.length === 0) {
    console.log('❌ CRITICAL: All tariff rates are 0% - customers see no USMCA value!');
    console.log('📊 Customer Impact:');
    console.log('   • Sarah: Cannot show customs savings to justify USMCA filings');
    console.log('   • Mike: No cost difference between China vs Mexico sourcing');
    console.log('   • Lisa: Cannot forecast duty savings for financial planning');
    console.log('💰 Revenue Impact: $0 customer value = 0% trial conversion');
  } else {
    console.log('⚠️  Some tariff data exists - need to investigate classification API integration');
  }
}

investigateTariffRates().catch(console.error);