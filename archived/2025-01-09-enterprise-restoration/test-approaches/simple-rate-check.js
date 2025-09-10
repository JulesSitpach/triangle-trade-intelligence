const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRates() {
  console.log('ANALYZING TARIFF RATES...\n');
  
  // Get sample records to understand the data
  const { data: sample } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate')
    .limit(15);
    
  if (sample) {
    console.log('SAMPLE TARIFF RATES:');
    sample.forEach(row => {
      console.log(`  ${row.hs_code}: MFN=${row.mfn_rate}, USMCA=${row.usmca_rate}`);
    });
    
    // Analysis
    const identicalCount = sample.filter(row => row.mfn_rate === row.usmca_rate).length;
    const nonZeroMFN = sample.filter(row => parseFloat(row.mfn_rate || 0) > 0).length;
    const nonZeroUSMCA = sample.filter(row => parseFloat(row.usmca_rate || 0) > 0).length;
    
    console.log(`\nANALYSIS OF ${sample.length} RECORDS:`);
    console.log(`- Identical MFN/USMCA rates: ${identicalCount}/${sample.length}`);
    console.log(`- Non-zero MFN rates: ${nonZeroMFN}/${sample.length}`);
    console.log(`- Non-zero USMCA rates: ${nonZeroUSMCA}/${sample.length}`);
    
    if (identicalCount === sample.length) {
      console.log('\n❌ CRITICAL ISSUE: ALL RATES ARE IDENTICAL!');
      console.log('This explains why UI shows 0% USMCA qualification.');
      console.log('Platform cannot show tariff savings if MFN = USMCA rates.');
    } else {
      console.log('\n✅ Rates vary - this should enable USMCA savings calculations.');
    }
  }
  
  // Check the specific codes from the UI screenshot
  console.log('\nCHECKING CODES FROM UI SCREENSHOT:');
  const uiCodes = ['8544200000', '8544300000', '8544700000', '8544208864', '8544208865'];
  
  for (const code of uiCodes) {
    const { data: codeData } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate')
      .eq('hs_code', code);
      
    if (codeData && codeData.length > 0) {
      const record = codeData[0];
      console.log(`  ${code}: MFN=${record.mfn_rate}%, USMCA=${record.usmca_rate}%`);
    } else {
      console.log(`  ${code}: NOT FOUND in database`);
    }
  }
}

checkRates().catch(console.error);