/**
 * Check HS code format in database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHSFormat() {
  console.log('🔍 Checking HS Code Format\n');
  console.log('=====================================\n');

  // Get sample HS codes from hs_master_rebuild
  console.log('📊 HS_MASTER_REBUILD - Sample HS Codes:');
  const { data: hsSamples } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description')
    .limit(10);
  
  hsSamples?.forEach(item => {
    console.log(`   ${item.hs_code} - ${item.description?.substring(0, 50)}...`);
  });

  // Check for electrical codes manually
  console.log('\n🔌 Looking for Electrical Codes (different patterns):');
  
  // Try different patterns
  const patterns = ['85%', '8544%', '8536%', '854%', '85__%'];
  
  for (const pattern of patterns) {
    const { data: electrical, count } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description', { count: 'exact' })
      .like('hs_code', pattern)
      .limit(3);
    
    console.log(`   Pattern "${pattern}": ${count || 0} matches`);
    if (electrical?.length > 0) {
      electrical.forEach(item => {
        console.log(`     - ${item.hs_code}: ${item.description?.substring(0, 40)}...`);
      });
    }
  }

  // Check for textile codes
  console.log('\n👔 Looking for Textile Codes:');
  
  const textilePatterns = ['61%', '62%', '63%', '6109%'];
  
  for (const pattern of textilePatterns) {
    const { data: textiles, count } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description', { count: 'exact' })
      .like('hs_code', pattern)
      .limit(3);
    
    console.log(`   Pattern "${pattern}": ${count || 0} matches`);
    if (textiles?.length > 0) {
      textiles.forEach(item => {
        console.log(`     - ${item.hs_code}: ${item.description?.substring(0, 40)}...`);
      });
    }
  }

  // Check tariff_rates table format
  console.log('\n📊 TARIFF_RATES - Sample HS Codes:');
  const { data: tariffSamples } = await supabase
    .from('tariff_rates')
    .select('hs_code, mfn_rate, usmca_rate')
    .limit(10);
  
  tariffSamples?.forEach(item => {
    console.log(`   ${item.hs_code} - MFN: ${item.mfn_rate}%, USMCA: ${item.usmca_rate}%`);
  });

  console.log('\n=====================================\n');
  console.log('✅ HS code format check complete!\n');
}

checkHSFormat().catch(console.error);