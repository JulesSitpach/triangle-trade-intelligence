/**
 * Database Structure Inspector
 * Examine actual table structures and relationships
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectDatabaseStructure() {
  console.log('🔍 INSPECTING ACTUAL DATABASE STRUCTURE');
  console.log('=====================================\n');

  try {
    // 1. Check what tables actually exist
    console.log('📋 1. CHECKING AVAILABLE TABLES:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names'); // This may not work, let's try another approach

    if (tablesError) {
      console.log('RPC failed, trying direct queries...\n');
    }

    // 2. Examine hs_master_rebuild table structure
    console.log('📊 2. HS_MASTER_REBUILD TABLE STRUCTURE:');
    console.log('Getting sample record to see columns...');
    
    const { data: hsData, error: hsError } = await supabase
      .from('hs_master_rebuild')
      .select('*')
      .limit(1);
    
    if (hsError) {
      console.error('❌ HS table error:', hsError);
    } else if (hsData && hsData.length > 0) {
      console.log('✅ HS table sample record:');
      console.log('Columns:', Object.keys(hsData[0]));
      console.log('Sample data:', hsData[0]);
      console.log('');
    }

    // 3. Check if tariff_rates table exists
    console.log('📊 3. TARIFF_RATES TABLE CHECK:');
    const { data: tariffData, error: tariffError } = await supabase
      .from('tariff_rates')
      .select('*')
      .limit(1);
    
    if (tariffError) {
      console.error('❌ tariff_rates table error:', tariffError.message);
      console.log('   This table may not exist or have different name\n');
    } else if (tariffData) {
      console.log('✅ tariff_rates table exists');
      if (tariffData.length > 0) {
        console.log('Columns:', Object.keys(tariffData[0]));
        console.log('Sample data:', tariffData[0]);
      } else {
        console.log('Table exists but is empty');
      }
      console.log('');
    }

    // 4. Look for tables with "tariff" in the name
    console.log('📊 4. SEARCHING FOR TARIFF-RELATED TABLES:');
    
    // Try some common table name patterns
    const possibleTariffTables = [
      'tariff_rates',
      'tariffs', 
      'usmca_tariff_rates',
      'hs_tariffs',
      'trade_tariffs',
      'customs_rates'
    ];

    for (const tableName of possibleTariffTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Found table: ${tableName}`);
          if (data && data.length > 0) {
            console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
            console.log(`   Sample HS code: ${data[0].hs_code || data[0].hs || data[0].code || 'N/A'}`);
          }
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }

    // 5. Check records count and tariff rate distribution
    console.log('\n📊 5. DATA ANALYSIS:');
    
    // Count HS records by digit length
    const { data: countData } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code')
      .limit(100);
      
    if (countData) {
      const digitCounts = {};
      countData.forEach(record => {
        const length = record.hs_code?.length || 0;
        digitCounts[length] = (digitCounts[length] || 0) + 1;
      });
      
      console.log('HS code length distribution (sample):');
      Object.entries(digitCounts).forEach(([length, count]) => {
        console.log(`   ${length}-digit codes: ${count} records`);
      });
    }

    // 6. Look for records with actual tariff rates > 0
    console.log('\n📊 6. RECORDS WITH ACTUAL TARIFF RATES:');
    
    // Check for different possible rate column names
    const rateColumns = ['mfn_rate', 'tariff_rate', 'duty_rate', 'general_rate'];
    
    for (const column of rateColumns) {
      try {
        const { data: rateData } = await supabase
          .from('hs_master_rebuild')
          .select(`hs_code, description, ${column}`)
          .gt(column, 0)
          .limit(3);
          
        if (rateData && rateData.length > 0) {
          console.log(`✅ Found records with ${column} > 0:`);
          rateData.forEach(record => {
            console.log(`   ${record.hs_code}: ${record[column]}% - ${record.description?.substring(0, 50)}...`);
          });
        }
      } catch (e) {
        console.log(`   Column "${column}" doesn't exist in hs_master_rebuild`);
      }
    }

    console.log('\n🎯 INSPECTION COMPLETE');
    
  } catch (error) {
    console.error('Database inspection failed:', error);
  }
}

// Run inspection
inspectDatabaseStructure();