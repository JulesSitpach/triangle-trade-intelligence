#!/usr/bin/env node
/**
 * TRIANGLE INTELLIGENCE PLATFORM - DATABASE RESTORE SCRIPT
 * Restores database from backup created on 2025-08-21T00:53:17.835Z
 * 
 * Usage: node restore-database.js
 * 
 * Prerequisites:
 * - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * - Ensure target database is accessible and has proper permissions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 1000; // Smaller batches for restore to avoid timeouts

// Restore tables in correct order (dependencies first)
const RESTORE_ORDER = [
  'countries',
  'us_ports', 
  'trade_routes',
  'usmca_tariff_rates',
  'comtrade_reference',
  'trade_flows',
  'workflow_sessions',
  'hindsight_pattern_library',
  'marcus_consultations',
  'translations',
  'current_market_alerts',
  'api_cache',
  'country_risk_scores',
  'shipping_network_effects',
  'shipping_volume_patterns',
  'shipping_success_patterns'
];

const restoreTable = async (tableName) => {
  const startTime = Date.now();
  
  try {
    console.log(`📊 Restoring ${tableName}...`);
    
    // Load backup data
    const filePath = path.join(__dirname, `${tableName}.json`);
    
    try {
      await fs.access(filePath);
    } catch {
      console.log(`⚠️  Backup file ${tableName}.json not found - skipping`);
      return { table: tableName, records: 0, status: 'SKIPPED' };
    }
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    const backup = JSON.parse(fileContent);
    
    if (!backup.data || backup.data.length === 0) {
      console.log(`⚠️  No data in ${tableName} backup - skipping`);
      return { table: tableName, records: 0, status: 'EMPTY' };
    }
    
    console.log(`   Found ${backup.record_count.toLocaleString()} records to restore`);
    
    // Clear existing data (optional - comment out to append instead)
    // const { error: deleteError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // if (deleteError) console.log(`⚠️  Could not clear ${tableName}: ${deleteError.message}`);
    
    // Restore data in batches
    let restoredRecords = 0;
    for (let i = 0; i < backup.data.length; i += BATCH_SIZE) {
      const batch = backup.data.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'id' }); // Use upsert to handle duplicates
        
      if (error) {
        console.error(`❌ Error restoring batch for ${tableName}:`, error.message);
        // Continue with next batch
      } else {
        restoredRecords += batch.length;
        console.log(`   Restored ${restoredRecords.toLocaleString()}/${backup.record_count.toLocaleString()} records`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ ${tableName}: ${restoredRecords.toLocaleString()} records restored in ${duration}ms`);
    
    return { table: tableName, records: restoredRecords, status: 'SUCCESS', duration };
    
  } catch (error) {
    console.error(`❌ Error restoring ${tableName}:`, error.message);
    return { table: tableName, records: 0, status: 'ERROR', error: error.message };
  }
};

// Main restore function
const restoreDatabase = async () => {
  console.log('🔄 TRIANGLE INTELLIGENCE PLATFORM - DATABASE RESTORE');
  console.log('===================================================\n');
  
  const startTime = Date.now();
  const results = [];
  
  for (const tableName of RESTORE_ORDER) {
    const result = await restoreTable(tableName);
    results.push(result);
  }
  
  const totalDuration = Date.now() - startTime;
  const totalRecords = results.reduce((sum, r) => sum + r.records, 0);
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  
  console.log('\n📊 RESTORE SUMMARY:');
  console.log('==================');
  console.log(`Total Tables: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total Records Restored: ${totalRecords.toLocaleString()}`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  
  if (errorCount > 0) {
    console.log('\n❌ ERRORS:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      console.log(`  - ${r.table}: ${r.error}`);
    });
  }
  
  console.log('\n🎯 Restore completed!');
  
  // Write restore summary
  await fs.writeFile('restore-summary.json', JSON.stringify({
    restored_at: new Date().toISOString(),
    results,
    summary: {
      total_tables: results.length,
      successful: successCount,
      errors: errorCount,
      total_records: totalRecords,
      duration_ms: totalDuration
    }
  }, null, 2));
};

// Run restore
restoreDatabase().catch(console.error);
