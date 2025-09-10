/**
 * Find Electronics Tariff Data Across All Tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findElectronicsTariffs() {
  console.log('🔍 FINDING ELECTRONICS TARIFF DATA ACROSS ALL TABLES');
  console.log('=====================================================\n');

  try {
    // 1. Check hs_master_rebuild for electronics with rates > 0
    console.log('📊 1. HS_MASTER_REBUILD - Electronics with rates > 0:');
    const { data: hsMasterElectronics } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate, country_source')
      .or('hs_code.like.8542%,hs_code.like.8541%,hs_code.like.9002%,hs_code.like.8518%')
      .gt('mfn_rate', 0)
      .limit(10);
    
    if (hsMasterElectronics && hsMasterElectronics.length > 0) {
      hsMasterElectronics.forEach(record => {
        console.log(`   ${record.hs_code}: MFN ${record.mfn_rate}%, USMCA ${record.usmca_rate}%`);
        console.log(`      ${record.description?.substring(0, 80)}...`);
        console.log(`      Source: ${record.country_source}`);
      });
    } else {
      console.log('   No electronics with rates > 0 found in hs_master_rebuild');
    }

    // 2. Check tariff_rates table for electronics
    console.log('\n📊 2. TARIFF_RATES - Electronics records:');
    const { data: tariffRatesElectronics } = await supabase
      .from('tariff_rates')
      .select('hs_code, country, mfn_rate, usmca_rate, source')
      .or('hs_code.like.8542%,hs_code.like.8541%,hs_code.like.9002%,hs_code.like.8518%')
      .limit(10);
    
    if (tariffRatesElectronics && tariffRatesElectronics.length > 0) {
      tariffRatesElectronics.forEach(record => {
        console.log(`   ${record.hs_code}: MFN ${record.mfn_rate}%, USMCA ${record.usmca_rate}%`);
        console.log(`      Country: ${record.country}, Source: ${record.source}`);
      });
    } else {
      console.log('   No electronics found in tariff_rates');
    }

    // 3. Search for any records with rates that match our expected 12-18% range
    console.log('\n📊 3. RECORDS WITH 12-18% TARIFF RATES (our target range):');
    
    // Check hs_master_rebuild
    const { data: targetRatesMaster } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate')
      .gte('mfn_rate', 12)
      .lte('mfn_rate', 18)
      .limit(5);
      
    if (targetRatesMaster && targetRatesMaster.length > 0) {
      console.log('From hs_master_rebuild:');
      targetRatesMaster.forEach(record => {
        console.log(`   ${record.hs_code}: ${record.mfn_rate}% - ${record.description?.substring(0, 60)}...`);
      });
    }
    
    // Check tariff_rates
    const { data: targetRatesTariff } = await supabase
      .from('tariff_rates')
      .select('hs_code, mfn_rate, usmca_rate')
      .gte('mfn_rate', 12)
      .lte('mfn_rate', 18)
      .limit(5);
      
    if (targetRatesTariff && targetRatesTariff.length > 0) {
      console.log('From tariff_rates:');
      targetRatesTariff.forEach(record => {
        console.log(`   ${record.hs_code}: ${record.mfn_rate}% MFN, ${record.usmca_rate}% USMCA`);
      });
    }
    
    // Check usmca_tariff_rates
    const { data: targetRatesUSMCA } = await supabase
      .from('usmca_tariff_rates')
      .select('hs_code, hs_description, mfn_rate, usmca_rate')
      .gte('mfn_rate', 12)
      .lte('mfn_rate', 18)
      .limit(5);
      
    if (targetRatesUSMCA && targetRatesUSMCA.length > 0) {
      console.log('From usmca_tariff_rates:');
      targetRatesUSMCA.forEach(record => {
        console.log(`   ${record.hs_code}: ${record.mfn_rate}% - ${record.hs_description?.substring(0, 60)}...`);
      });
    }

    // 4. Look for the specific codes our AI classified
    console.log('\n📊 4. CHECKING AI CLASSIFICATION RESULTS:');
    const aiCodes = ['854231', '8542.31.00', '85423100', '900211', '9002.11.00', '90021100'];
    
    for (const code of aiCodes) {
      console.log(`\nChecking ${code}:`);
      
      // Check all tables
      const tables = ['hs_master_rebuild', 'tariff_rates', 'usmca_tariff_rates'];
      let found = false;
      
      for (const table of tables) {
        try {
          const { data } = await supabase
            .from(table)
            .select('*')
            .or(`hs_code.eq.${code},hs_code.like.${code}%,hs_code.like.%${code.replace(/\./g, '')}%`)
            .limit(1);
          
          if (data && data.length > 0) {
            const record = data[0];
            console.log(`   ✅ Found in ${table}: ${record.hs_code}`);
            if (record.mfn_rate !== undefined) {
              console.log(`      MFN: ${record.mfn_rate}%, USMCA: ${record.usmca_rate || 0}%`);
            }
            found = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      if (!found) {
        console.log(`   ❌ Not found in any table`);
      }
    }

    console.log('\n🎯 ELECTRONICS TARIFF SEARCH COMPLETE');
    
  } catch (error) {
    console.error('Electronics tariff search failed:', error);
  }
}

// Run search
findElectronicsTariffs();