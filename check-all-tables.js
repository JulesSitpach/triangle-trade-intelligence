/**
 * Check ALL tables for complete tariff data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllTables() {
  console.log('🔍 Checking ALL Tables for Tariff Data\n');
  console.log('=====================================\n');

  // Check all potential tariff tables - cleaned up to remove empty tables
  const tables = [
    'hs_master_rebuild',    // PRIMARY: 34,476 records with real tariff rates
    'usmca_tariff_rates',   // SECONDARY: 48 records (Limited but high-quality)
    'tariff_rates'          // FALLBACK: 14,486 records (Many 0% rates - use as last resort)
    // REMOVED EMPTY TABLES: hs_codes, hts_codes, hs_tariff_data, us_hts_codes (0 records each)
  ];

  for (const table of tables) {
    console.log(`\n📊 TABLE: ${table}`);
    console.log('─'.repeat(40));
    
    try {
      // Count total records
      const { count: totalCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`   Total records: ${totalCount || 0}`);
      
      if (totalCount > 0) {
        // Count records with MFN rates
        const { count: mfnCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .gt('mfn_rate', 0);
        
        console.log(`   Records with MFN > 0: ${mfnCount || 0}`);
        
        // Check electrical (85)
        const { count: electricalCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .or('hs_code.like.85%,hts_code.like.85%,code.like.85%');
        
        console.log(`   Electrical (85xx): ${electricalCount || 0} records`);
        
        // Check textiles (61-63)
        const { count: textileCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .or('hs_code.like.61%,hs_code.like.62%,hs_code.like.63%,hts_code.like.61%,hts_code.like.62%,hts_code.like.63%,code.like.61%,code.like.62%,code.like.63%');
        
        console.log(`   Textiles (61-63): ${textileCount || 0} records`);
        
        // Get sample record
        const { data: sample } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          .single();
        
        if (sample) {
          console.log(`   Columns: ${Object.keys(sample).join(', ')}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Table doesn't exist or error: ${error.message}`);
    }
  }
  
  console.log('\n=====================================\n');
  console.log('✅ Table analysis complete!\n');
}

checkAllTables().catch(console.error);