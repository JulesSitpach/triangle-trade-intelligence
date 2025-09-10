const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUSMCAData() {
  console.log('CHECKING USMCA QUALIFICATION DATA IN DATABASE...\n');
  
  // Check for records where MFN != USMCA rates (tariff savings opportunities)
  const { data: diffRates, error } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate')
    .neq('mfn_rate', 'usmca_rate')
    .limit(10);

  if (error) {
    console.error('DATABASE QUERY ERROR:', error);
    return;
  }

  console.log('RECORDS WHERE MFN != USMCA RATES:', diffRates?.length || 0);
  
  if (diffRates && diffRates.length > 0) {
    diffRates.forEach(row => {
      const savings = row.mfn_rate - row.usmca_rate;
      console.log(`  ${row.hs_code}: MFN=${row.mfn_rate}%, USMCA=${row.usmca_rate}% (Save ${savings}%) | ${row.description.substring(0, 50)}...`);
    });
  } else {
    console.log('WARNING: NO TARIFF SAVINGS OPPORTUNITIES FOUND!');
  }

  // Check specific electrical cable codes that showed in the UI
  console.log('\nELECTRICAL CABLE CODES (8544 series):');
  
  const { data: cableData, error: cableError } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate')
    .like('hs_code', '8544%')
    .limit(15);

  if (cableData && cableData.length > 0) {
    cableData.forEach(row => {
      const savings = row.mfn_rate - row.usmca_rate;
      const savingsIndicator = savings > 0 ? 'SAVINGS' : savings < 0 ? 'PENALTY' : 'SAME';
      console.log(`  ${row.hs_code}: MFN=${row.mfn_rate}%, USMCA=${row.usmca_rate}% [${savingsIndicator}] | ${row.description.substring(0, 40)}...`);
    });
  }
  
  // Check for actual USMCA savings opportunities
  console.log('\nUSMCA TARIFF SAVINGS ANALYSIS:');
  
  const { data: savingsData } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate, usmca_rate')
    .lt('usmca_rate', 'mfn_rate')
    .limit(10);
    
  if (savingsData && savingsData.length > 0) {
    console.log('TOP USMCA SAVINGS OPPORTUNITIES:');
    savingsData.forEach(row => {
      const savings = row.mfn_rate - row.usmca_rate;
      console.log(`  ${row.hs_code}: Save ${savings.toFixed(2)}% (MFN: ${row.mfn_rate}% -> USMCA: ${row.usmca_rate}%) | ${row.description.substring(0, 40)}...`);
    });
  } else {
    console.log('CRITICAL: NO USMCA SAVINGS OPPORTUNITIES FOUND!');
  }
  
  // Check total records and overall stats
  const { count } = await supabase
    .from('hs_master_rebuild')
    .select('*', { count: 'exact', head: true });
    
  console.log(`\nTOTAL HS CODE RECORDS: ${count || 'unknown'}`);
  
  // Check USMCA qualification rules table
  console.log('\nUSMCA QUALIFICATION RULES:');
  
  const { data: rulesData } = await supabase
    .from('usmca_qualification_rules')
    .select('*')
    .limit(5);
    
  if (rulesData && rulesData.length > 0) {
    console.log(`FOUND ${rulesData.length} USMCA qualification rules:`);
    rulesData.forEach((rule, index) => {
      console.log(`  Rule ${index + 1}: ${JSON.stringify(rule).substring(0, 100)}...`);
    });
  } else {
    console.log('WARNING: NO USMCA QUALIFICATION RULES FOUND!');
  }
  
  // Check if all rates are the same (which would explain the 0% issue)
  const { data: rateCheck } = await supabase
    .from('hs_master_rebuild')
    .select('mfn_rate, usmca_rate')
    .limit(100);
    
  if (rateCheck) {
    const allSameRates = rateCheck.every(row => row.mfn_rate === row.usmca_rate);
    console.log(`\nRATE ANALYSIS: ALL MFN = USMCA rates? ${allSameRates ? 'YES - THIS IS THE PROBLEM' : 'NO - Rates vary correctly'}`);
  }
}

checkUSMCAData().catch(console.error);