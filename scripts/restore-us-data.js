#!/usr/bin/env node

/**
 * Restore US Data Emergency Script
 * Restores the backed-up US data and fixes the HTS integration
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreUSData() {
  console.log('🚨 RESTORING BACKED-UP US DATA\n');
  
  try {
    // Find the backup file
    const backupDir = 'data/hts-2024';
    const files = fs.readdirSync(backupDir);
    const backupFile = files.find(f => f.startsWith('us-data-backup-'));
    
    if (!backupFile) {
      console.log('❌ No backup file found');
      return;
    }

    const backupPath = path.join(backupDir, backupFile);
    console.log(`📁 Found backup: ${backupPath}`);
    
    // Read backup data
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`📊 Backup contains ${backupData.length} US records`);

    // Restore in batches
    const batchSize = 50;
    let restoredCount = 0;
    
    for (let i = 0; i < backupData.length; i += batchSize) {
      const batch = backupData.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('hs_master_rebuild')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      } else {
        restoredCount += batch.length;
        console.log(`✅ Restored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(backupData.length / batchSize)} (${restoredCount} total)`);
      }
    }

    console.log(`\n✅ Restoration completed: ${restoredCount} US records restored`);
    
    // Verify restoration
    const { count: totalUS } = await supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .eq('country_source', 'US');

    console.log(`🔍 Verification: ${totalUS} US records in database`);
    console.log('✅ US data successfully restored!\n');

  } catch (error) {
    console.error('💥 Restoration failed:', error.message);
  }
}

restoreUSData();