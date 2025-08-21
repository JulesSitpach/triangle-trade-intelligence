/**
 * TRIANGLE INTELLIGENCE PLATFORM - COMPREHENSIVE DATABASE BACKUP
 * Exports all critical tables with 519K+ records, translations, and intelligence data
 * Creates timestamped backup directory with JSON files and restore script
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Critical tables to backup (in order of importance)
const CRITICAL_TABLES = [
  // Core Intelligence Data (500K+ records)
  { name: 'trade_flows', batchSize: 5000, description: 'Massive bilateral trade intelligence (500K+ records)' },
  { name: 'comtrade_reference', batchSize: 2000, description: 'Enhanced HS code classifications (17.5K records)' },
  
  // Learning & Pattern Intelligence
  { name: 'workflow_sessions', batchSize: 1000, description: 'User journey patterns for institutional learning' },
  { name: 'hindsight_pattern_library', batchSize: 500, description: 'Extracted success patterns' },
  { name: 'marcus_consultations', batchSize: 500, description: 'AI analysis history and insights' },
  
  // Multilingual & UI
  { name: 'translations', batchSize: 1000, description: 'Trilingual support (EN/ES/FR)' },
  
  // Treaty & Stable Data
  { name: 'usmca_tariff_rates', batchSize: 500, description: '0% rates, treaty-locked forever' },
  { name: 'countries', batchSize: 500, description: 'Enhanced geographic coverage' },
  { name: 'us_ports', batchSize: 500, description: 'Port infrastructure (static)' },
  { name: 'trade_routes', batchSize: 500, description: 'Routing logic (stable)' },
  
  // Market Intelligence (if exists)
  { name: 'current_market_alerts', batchSize: 1000, description: 'Real-time market intelligence' },
  { name: 'api_cache', batchSize: 1000, description: 'Cached API responses with TTL' },
  { name: 'country_risk_scores', batchSize: 500, description: 'Risk volatility tracking' },
  
  // Extended Intelligence Tables (if exists)
  { name: 'shipping_network_effects', batchSize: 1000, description: 'Shipping pattern intelligence' },
  { name: 'shipping_volume_patterns', batchSize: 1000, description: 'Volume pattern analysis' },
  { name: 'shipping_success_patterns', batchSize: 1000, description: 'Proven shipping strategies' }
];

// Create timestamped backup directory
const createBackupDirectory = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = path.join(process.cwd(), 'database-backups', `triangle-intelligence-backup-${timestamp}`);
  
  await fs.mkdir(backupDir, { recursive: true });
  
  console.log(`📁 Created backup directory: ${backupDir}`);
  return backupDir;
};

// Export table data in batches for large tables
const exportTableData = async (tableName, batchSize, backupDir) => {
  const startTime = Date.now();
  let totalRecords = 0;
  let allData = [];
  let offset = 0;
  let hasMore = true;
  
  console.log(`📊 Exporting ${tableName}...`);
  
  try {
    // Get total count first
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      if (countError.message.includes('does not exist')) {
        console.log(`⚠️  Table ${tableName} does not exist - skipping`);
        return { table: tableName, records: 0, status: 'SKIPPED', error: 'Table does not exist' };
      }
      throw countError;
    }
    
    console.log(`   Expected records: ${count?.toLocaleString() || 0}`);
    
    // Export data in batches
    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + batchSize - 1)
        .order('created_at', { ascending: true });
        
      if (error) {
        // Try without order by for tables without created_at
        const { data: dataNoOrder, error: errorNoOrder } = await supabase
          .from(tableName)
          .select('*')
          .range(offset, offset + batchSize - 1);
          
        if (errorNoOrder) {
          throw errorNoOrder;
        }
        
        if (!dataNoOrder || dataNoOrder.length === 0) {
          hasMore = false;
          break;
        }
        
        allData.push(...dataNoOrder);
        totalRecords += dataNoOrder.length;
        offset += batchSize;
        
        console.log(`   Exported ${totalRecords.toLocaleString()} records...`);
      } else {
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }
        
        allData.push(...data);
        totalRecords += data.length;
        offset += batchSize;
        
        console.log(`   Exported ${totalRecords.toLocaleString()} records...`);
      }
      
      // Prevent infinite loops
      if (data && data.length < batchSize) {
        hasMore = false;
      }
    }
    
    // Write to JSON file
    const filePath = path.join(backupDir, `${tableName}.json`);
    await fs.writeFile(filePath, JSON.stringify({
      table: tableName,
      exported_at: new Date().toISOString(),
      record_count: totalRecords,
      data: allData
    }, null, 2));
    
    const duration = Date.now() - startTime;
    console.log(`✅ ${tableName}: ${totalRecords.toLocaleString()} records exported in ${duration}ms`);
    
    return { table: tableName, records: totalRecords, status: 'SUCCESS', duration };
    
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return { table: tableName, records: 0, status: 'ERROR', error: error.message };
  }
};

// Generate restore script
const generateRestoreScript = async (backupDir, backupResults) => {
  const restoreScriptContent = `#!/usr/bin/env node
/**
 * TRIANGLE INTELLIGENCE PLATFORM - DATABASE RESTORE SCRIPT
 * Restores database from backup created on ${new Date().toISOString()}
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
    console.log(\`📊 Restoring \${tableName}...\`);
    
    // Load backup data
    const filePath = path.join(__dirname, \`\${tableName}.json\`);
    
    try {
      await fs.access(filePath);
    } catch {
      console.log(\`⚠️  Backup file \${tableName}.json not found - skipping\`);
      return { table: tableName, records: 0, status: 'SKIPPED' };
    }
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    const backup = JSON.parse(fileContent);
    
    if (!backup.data || backup.data.length === 0) {
      console.log(\`⚠️  No data in \${tableName} backup - skipping\`);
      return { table: tableName, records: 0, status: 'EMPTY' };
    }
    
    console.log(\`   Found \${backup.record_count.toLocaleString()} records to restore\`);
    
    // Clear existing data (optional - comment out to append instead)
    // const { error: deleteError } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // if (deleteError) console.log(\`⚠️  Could not clear \${tableName}: \${deleteError.message}\`);
    
    // Restore data in batches
    let restoredRecords = 0;
    for (let i = 0; i < backup.data.length; i += BATCH_SIZE) {
      const batch = backup.data.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'id' }); // Use upsert to handle duplicates
        
      if (error) {
        console.error(\`❌ Error restoring batch for \${tableName}:\`, error.message);
        // Continue with next batch
      } else {
        restoredRecords += batch.length;
        console.log(\`   Restored \${restoredRecords.toLocaleString()}/\${backup.record_count.toLocaleString()} records\`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(\`✅ \${tableName}: \${restoredRecords.toLocaleString()} records restored in \${duration}ms\`);
    
    return { table: tableName, records: restoredRecords, status: 'SUCCESS', duration };
    
  } catch (error) {
    console.error(\`❌ Error restoring \${tableName}:\`, error.message);
    return { table: tableName, records: 0, status: 'ERROR', error: error.message };
  }
};

// Main restore function
const restoreDatabase = async () => {
  console.log('🔄 TRIANGLE INTELLIGENCE PLATFORM - DATABASE RESTORE');
  console.log('===================================================\\n');
  
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
  
  console.log('\\n📊 RESTORE SUMMARY:');
  console.log('==================');
  console.log(\`Total Tables: \${results.length}\`);
  console.log(\`Successful: \${successCount}\`);
  console.log(\`Errors: \${errorCount}\`);
  console.log(\`Total Records Restored: \${totalRecords.toLocaleString()}\`);
  console.log(\`Total Duration: \${(totalDuration / 1000).toFixed(1)}s\`);
  
  if (errorCount > 0) {
    console.log('\\n❌ ERRORS:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      console.log(\`  - \${r.table}: \${r.error}\`);
    });
  }
  
  console.log('\\n🎯 Restore completed!');
  
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
`;

  const restoreScriptPath = path.join(backupDir, 'restore-database.js');
  await fs.writeFile(restoreScriptPath, restoreScriptContent);
  
  // Make executable (if on Unix-like system)
  try {
    await fs.chmod(restoreScriptPath, '755');
  } catch (error) {
    // Ignore chmod errors on Windows
  }
  
  console.log(`📜 Generated restore script: ${restoreScriptPath}`);
};

// Main backup function
const backupDatabase = async () => {
  console.log('💾 TRIANGLE INTELLIGENCE PLATFORM - DATABASE BACKUP');
  console.log('==================================================\n');
  
  const startTime = Date.now();
  
  try {
    // Create backup directory
    const backupDir = await createBackupDirectory();
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('translations')
      .select('*')
      .limit(1);
      
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    
    console.log('✅ Database connection successful\n');
    
    // Export all tables
    const results = [];
    for (const table of CRITICAL_TABLES) {
      const result = await exportTableData(table.name, table.batchSize, backupDir);
      result.description = table.description;
      results.push(result);
    }
    
    // Generate restore script
    await generateRestoreScript(backupDir, results);
    
    // Create backup summary
    const totalDuration = Date.now() - startTime;
    const totalRecords = results.reduce((sum, r) => sum + r.records, 0);
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    const skippedCount = results.filter(r => r.status === 'SKIPPED').length;
    
    const summary = {
      backup_created_at: new Date().toISOString(),
      backup_directory: backupDir,
      platform: 'Triangle Intelligence Platform',
      database_version: 'Supabase PostgreSQL',
      results,
      summary: {
        total_tables: results.length,
        successful: successCount,
        errors: errorCount,
        skipped: skippedCount,
        total_records: totalRecords,
        duration_ms: totalDuration
      },
      restore_instructions: {
        command: 'node restore-database.js',
        requirements: [
          'Set NEXT_PUBLIC_SUPABASE_URL environment variable',
          'Set SUPABASE_SERVICE_ROLE_KEY environment variable',
          'Ensure target database has proper permissions'
        ]
      }
    };
    
    // Write backup summary
    const summaryPath = path.join(backupDir, 'backup-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Display results
    console.log('\n📊 BACKUP SUMMARY:');
    console.log('==================');
    console.log(`Backup Directory: ${backupDir}`);
    console.log(`Total Tables: ${results.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    
    console.log('\n📋 TABLE DETAILS:');
    results.forEach(result => {
      const status = result.status === 'SUCCESS' ? '✅' : 
                     result.status === 'ERROR' ? '❌' : '⚠️';
      console.log(`${status} ${result.table.padEnd(25)}: ${result.records.toLocaleString().padStart(8)} records`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
    
    if (errorCount > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      results.filter(r => r.status === 'ERROR').forEach(r => {
        console.log(`  - ${r.table}: ${r.error}`);
      });
    }
    
    if (skippedCount > 0) {
      console.log('\n⚠️  SKIPPED TABLES:');
      results.filter(r => r.status === 'SKIPPED').forEach(r => {
        console.log(`  - ${r.table}: ${r.error || 'Table does not exist'}`);
      });
    }
    
    console.log('\n🎯 BACKUP COMPLETED SUCCESSFULLY!');
    console.log(`\n📁 Backup location: ${backupDir}`);
    console.log(`📜 Restore with: cd "${backupDir}" && node restore-database.js`);
    
  } catch (error) {
    console.error('💥 BACKUP FAILED:', error.message);
    process.exit(1);
  }
};

// Run backup
if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase };