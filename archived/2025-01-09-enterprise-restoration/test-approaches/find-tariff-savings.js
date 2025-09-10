/**
 * Find HS codes with actual tariff savings for testing
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findCodesWithSavings() {
  console.log('🔍 Searching for HS codes with actual tariff savings...');
  
  // Look for industrial/electronics products with tariff savings
  const { data, error } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate')
    .gt('mfn_rate', 3)
    .lt('mfn_rate', 50)
    .like('hs_code', '85%') // Electronics chapter 85
    .order('mfn_rate', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📊 HS Codes with actual tariff savings:');
  data.forEach(item => {
    const mfnRate = parseFloat(item.mfn_rate || 0);
    const usmcaRate = parseFloat(item.usmca_rate || 0);
    const savings = mfnRate - usmcaRate;
    
    console.log(`  ${item.hs_code}: ${item.description.substring(0,60)}`);
    console.log(`    MFN: ${mfnRate}%, USMCA: ${usmcaRate}%, Savings: ${savings.toFixed(1)}%`);
    console.log('');
  });
  
  // Find a good test product
  const bestForTesting = data.find(item => 
    parseFloat(item.mfn_rate) > 3 && 
    parseFloat(item.usmca_rate || 0) === 0
  );
  
  if (bestForTesting) {
    console.log('🎯 RECOMMENDED FOR TESTING:');
    console.log(`   HS Code: ${bestForTesting.hs_code}`);
    console.log(`   Description: ${bestForTesting.description}`);
    console.log(`   MFN Rate: ${bestForTesting.mfn_rate}% → USMCA Rate: ${bestForTesting.usmca_rate || 0}%`);
    console.log(`   Potential Savings: ${parseFloat(bestForTesting.mfn_rate).toFixed(1)}%`);
  }
}

findCodesWithSavings().catch(console.error);