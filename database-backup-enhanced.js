/**
 * ENHANCED TRIANGLE INTELLIGENCE PLATFORM - COMPREHENSIVE DATABASE BACKUP
 * Handles 500K+ records with proper error handling and memory management
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enhanced table configuration with memory-optimized batch sizes
const CRITICAL_TABLES = [
  // Core Intelligence Data - Memory optimized for large datasets
  { name: 'trade_flows', batchSize: 1000, maxRecords: 500000, description: 'Massive bilateral trade intelligence (500K+ records)' },
  { name: 'comtrade_reference', batchSize: 2000, maxRecords: 20000, description: 'Enhanced HS code classifications (17.5K records)' },
  
  // Learning & Pattern Intelligence
  { name: 'workflow_sessions', batchSize: 500, maxRecords: 1000, description: 'User journey patterns for institutional learning' },
  { name: 'hindsight_pattern_library', batchSize: 100, maxRecords: 500, description: 'Extracted success patterns' },
  { name: 'marcus_consultations', batchSize: 100, maxRecords: 500, description: 'AI analysis history and insights' },
  
  // Multilingual & UI
  { name: 'translations', batchSize: 500, maxRecords: 2000, description: 'Trilingual support (EN/ES/FR)' },
  
  // Treaty & Stable Data
  { name: 'usmca_tariff_rates', batchSize: 100, maxRecords: 100, description: '0% rates, treaty-locked forever' },
  { name: 'countries', batchSize: 100, maxRecords: 100, description: 'Enhanced geographic coverage' },
  { name: 'us_ports', batchSize: 50, maxRecords: 50, description: 'Port infrastructure (static)' },
  { name: 'trade_routes', batchSize: 50, maxRecords: 50, description: 'Routing logic (stable)' },
  
  // Market Intelligence
  { name: 'current_market_alerts', batchSize: 500, maxRecords: 1000, description: 'Real-time market intelligence' },
  { name: 'api_cache', batchSize: 500, maxRecords: 1000, description: 'Cached API responses with TTL' },
  { name: 'country_risk_scores', batchSize: 500, maxRecords: 1000, description: 'Risk volatility tracking' }
];

// Create timestamped backup directory
const createBackupDirectory = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = path.join(process.cwd(), 'database-backups', `triangle-intelligence-full-backup-${timestamp}`);
  
  await fs.mkdir(backupDir, { recursive: true });
  
  console.log(`📁 Created backup directory: ${backupDir}`);
  return backupDir;
};

// Enhanced export function with proper memory management
const exportTableDataEnhanced = async (tableName, batchSize, maxRecords, backupDir) => {
  const startTime = Date.now();
  let totalRecords = 0;
  let offset = 0;
  let hasMore = true;
  let fileCounter = 1;
  
  console.log(`📊 Starting enhanced export of ${tableName}...`);
  
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
    
    const expectedRecords = Math.min(count || 0, maxRecords);
    console.log(`   Expected records: ${expectedRecords.toLocaleString()} (limit: ${maxRecords.toLocaleString()})`);
    
    // Export data in batches with multiple files for large datasets
    while (hasMore && totalRecords < maxRecords) {
      const currentBatchSize = Math.min(batchSize, maxRecords - totalRecords);
      
      console.log(`   Fetching batch ${fileCounter} (${currentBatchSize} records)...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + currentBatchSize - 1)
        .order('created_at', { ascending: true });
        
      if (error) {
        // Try without order by for tables without created_at
        const { data: dataNoOrder, error: errorNoOrder } = await supabase
          .from(tableName)
          .select('*')
          .range(offset, offset + currentBatchSize - 1);
          
        if (errorNoOrder) {
          throw errorNoOrder;
        }
        
        if (!dataNoOrder || dataNoOrder.length === 0) {
          hasMore = false;
          break;
        }
        
        // Write batch to separate file for memory efficiency
        const batchFilePath = path.join(backupDir, `${tableName}_batch_${fileCounter.toString().padStart(3, '0')}.json`);
        await fs.writeFile(batchFilePath, JSON.stringify({
          table: tableName,
          batch: fileCounter,
          exported_at: new Date().toISOString(),
          record_count: dataNoOrder.length,
          offset_start: offset,
          offset_end: offset + dataNoOrder.length - 1,
          data: dataNoOrder
        }, null, 2));
        
        totalRecords += dataNoOrder.length;
        offset += currentBatchSize;
        fileCounter++;
        
        console.log(`   ✅ Batch ${fileCounter-1}: ${dataNoOrder.length} records (Total: ${totalRecords.toLocaleString()})`);
      } else {
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }
        
        // Write batch to separate file for memory efficiency
        const batchFilePath = path.join(backupDir, `${tableName}_batch_${fileCounter.toString().padStart(3, '0')}.json`);
        await fs.writeFile(batchFilePath, JSON.stringify({
          table: tableName,
          batch: fileCounter,
          exported_at: new Date().toISOString(),
          record_count: data.length,
          offset_start: offset,
          offset_end: offset + data.length - 1,
          data: data
        }, null, 2));
        
        totalRecords += data.length;
        offset += currentBatchSize;
        fileCounter++;
        
        console.log(`   ✅ Batch ${fileCounter-1}: ${data.length} records (Total: ${totalRecords.toLocaleString()})`);
      }
      
      // Prevent infinite loops and respect memory limits
      if (data && data.length < currentBatchSize) {
        hasMore = false;
      }
      
      // Memory management - pause between large batches
      if (tableName === 'trade_flows' && fileCounter % 10 === 0) {
        console.log(`   💤 Memory break after ${fileCounter-1} batches...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Create index file for multi-batch tables
    const indexFilePath = path.join(backupDir, `${tableName}_index.json`);
    await fs.writeFile(indexFilePath, JSON.stringify({
      table: tableName,
      exported_at: new Date().toISOString(),
      total_records: totalRecords,
      total_batches: fileCounter - 1,
      batch_pattern: `${tableName}_batch_*.json`,
      restore_order: Array.from({length: fileCounter - 1}, (_, i) => `${tableName}_batch_${(i+1).toString().padStart(3, '0')}.json`)
    }, null, 2));
    
    const duration = Date.now() - startTime;
    console.log(`✅ ${tableName}: ${totalRecords.toLocaleString()} records exported in ${fileCounter-1} batches (${duration}ms)`);
    
    return { 
      table: tableName, 
      records: totalRecords, 
      batches: fileCounter - 1,
      status: 'SUCCESS', 
      duration 
    };
    
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return { table: tableName, records: 0, status: 'ERROR', error: error.message };
  }
};

// Generate enhanced restore script for multi-batch files
const generateEnhancedRestoreScript = async (backupDir, backupResults) => {
  const restoreScriptContent = `#!/usr/bin/env node
/**
 * ENHANCED TRIANGLE INTELLIGENCE PLATFORM - DATABASE RESTORE SCRIPT
 * Restores database from multi-batch backup created on ${new Date().toISOString()}
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESTORE_BATCH_SIZE = 500; // Conservative batch size for restore

const restoreTableFromBatches = async (tableName) => {
  const startTime = Date.now();
  
  try {
    console.log(\`📊 Restoring \${tableName}...\`);
    
    // Load index file
    const indexPath = path.join(__dirname, \`\${tableName}_index.json\`);
    
    try {
      await fs.access(indexPath);
    } catch {
      console.log(\`⚠️  Index file \${tableName}_index.json not found - skipping\`);
      return { table: tableName, records: 0, status: 'SKIPPED' };
    }
    
    const indexContent = await fs.readFile(indexPath, 'utf8');
    const index = JSON.parse(indexContent);
    
    console.log(\`   Found \${index.total_records.toLocaleString()} records in \${index.total_batches} batches\`);
    
    let restoredRecords = 0;
    
    // Restore each batch in order
    for (const batchFile of index.restore_order) {
      const batchPath = path.join(__dirname, batchFile);
      
      try {
        const batchContent = await fs.readFile(batchPath, 'utf8');
        const batch = JSON.parse(batchContent);
        
        if (!batch.data || batch.data.length === 0) {
          console.log(\`   ⚠️  Empty batch \${batchFile} - skipping\`);
          continue;
        }
        
        // Restore batch data in smaller chunks
        for (let i = 0; i < batch.data.length; i += RESTORE_BATCH_SIZE) {
          const chunk = batch.data.slice(i, i + RESTORE_BATCH_SIZE);
          
          const { error } = await supabase
            .from(tableName)
            .upsert(chunk, { onConflict: 'id' });
            
          if (error) {
            console.error(\`❌ Error restoring chunk from \${batchFile}:\`, error.message);
          } else {
            restoredRecords += chunk.length;
          }
        }
        
        console.log(\`   ✅ Restored batch \${batch.batch}: \${batch.record_count} records (Total: \${restoredRecords.toLocaleString()})\`);
        
      } catch (batchError) {
        console.error(\`❌ Error processing batch \${batchFile}:\`, batchError.message);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(\`✅ \${tableName}: \${restoredRecords.toLocaleString()} records restored in \${(duration/1000).toFixed(1)}s\`);
    
    return { table: tableName, records: restoredRecords, status: 'SUCCESS', duration };
    
  } catch (error) {
    console.error(\`❌ Error restoring \${tableName}:\`, error.message);
    return { table: tableName, records: 0, status: 'ERROR', error: error.message };
  }
};

// Main restore function
const restoreDatabase = async () => {
  console.log('🔄 TRIANGLE INTELLIGENCE PLATFORM - ENHANCED DATABASE RESTORE');
  console.log('============================================================\\n');
  
  const startTime = Date.now();
  const tableNames = [
    'countries', 'us_ports', 'trade_routes', 'usmca_tariff_rates', 
    'comtrade_reference', 'trade_flows', 'workflow_sessions',
    'hindsight_pattern_library', 'marcus_consultations', 'translations',
    'current_market_alerts', 'api_cache', 'country_risk_scores'
  ];
  
  const results = [];
  
  for (const tableName of tableNames) {
    const result = await restoreTableFromBatches(tableName);
    results.push(result);
  }
  
  const totalDuration = Date.now() - startTime;
  const totalRecords = results.reduce((sum, r) => sum + r.records, 0);
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  
  console.log('\\n📊 ENHANCED RESTORE SUMMARY:');
  console.log('============================');
  console.log(\`Total Tables: \${results.length}\`);
  console.log(\`Successful: \${successCount}\`);
  console.log(\`Errors: \${errorCount}\`);
  console.log(\`Total Records Restored: \${totalRecords.toLocaleString()}\`);
  console.log(\`Total Duration: \${(totalDuration / 1000).toFixed(1)}s\`);
  
  console.log('\\n🎯 Enhanced restore completed!');
};

restoreDatabase().catch(console.error);
`;

  const restoreScriptPath = path.join(backupDir, 'restore-database-enhanced.js');
  await fs.writeFile(restoreScriptPath, restoreScriptContent);
  
  console.log(`📜 Generated enhanced restore script: ${restoreScriptPath}`);
};

// Main enhanced backup function
const backupDatabaseEnhanced = async () => {
  console.log('💾 TRIANGLE INTELLIGENCE PLATFORM - ENHANCED DATABASE BACKUP');
  console.log('===========================================================\n');
  
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
    
    // Export all tables with enhanced handling
    const results = [];
    for (const table of CRITICAL_TABLES) {
      const result = await exportTableDataEnhanced(
        table.name, 
        table.batchSize, 
        table.maxRecords,
        backupDir
      );
      result.description = table.description;
      results.push(result);
    }
    
    // Generate enhanced restore script
    await generateEnhancedRestoreScript(backupDir, results);
    
    // Create comprehensive backup summary
    const totalDuration = Date.now() - startTime;
    const totalRecords = results.reduce((sum, r) => sum + r.records, 0);
    const totalBatches = results.reduce((sum, r) => sum + (r.batches || 0), 0);
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    const skippedCount = results.filter(r => r.status === 'SKIPPED').length;
    
    const summary = {
      backup_type: 'ENHANCED_MULTI_BATCH_BACKUP',
      backup_created_at: new Date().toISOString(),
      backup_directory: backupDir,
      platform: 'Triangle Intelligence Platform',
      database_version: 'Supabase PostgreSQL',
      enhancement_features: [
        'Memory-optimized batch processing',
        'Multi-file output for large datasets', 
        'Progressive backup with pause breaks',
        'Enhanced error handling',
        'Batch-aware restore scripts'
      ],
      results,
      summary: {
        total_tables: results.length,
        successful: successCount,
        errors: errorCount,
        skipped: skippedCount,
        total_records: totalRecords,
        total_batches: totalBatches,
        duration_ms: totalDuration,
        average_records_per_second: Math.round(totalRecords / (totalDuration / 1000))
      },
      restore_instructions: {
        enhanced_command: 'node restore-database-enhanced.js',
        requirements: [
          'Set NEXT_PUBLIC_SUPABASE_URL environment variable',
          'Set SUPABASE_SERVICE_ROLE_KEY environment variable', 
          'Ensure target database has proper permissions',
          'Allow sufficient time for large dataset restoration'
        ]
      }
    };
    
    // Write comprehensive backup summary
    const summaryPath = path.join(backupDir, 'backup-summary-enhanced.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Display enhanced results
    console.log('\n📊 ENHANCED BACKUP SUMMARY:');
    console.log('==========================');
    console.log(`Backup Directory: ${backupDir}`);
    console.log(`Total Tables: ${results.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`Total Batches: ${totalBatches}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Backup Speed: ${Math.round(totalRecords / (totalDuration / 1000)).toLocaleString()} records/second`);
    
    console.log('\n📋 ENHANCED TABLE DETAILS:');
    results.forEach(result => {
      const status = result.status === 'SUCCESS' ? '✅' : 
                     result.status === 'ERROR' ? '❌' : '⚠️';
      const batchInfo = result.batches ? ` (${result.batches} batches)` : '';
      console.log(`${status} ${result.table.padEnd(25)}: ${result.records.toLocaleString().padStart(8)} records${batchInfo}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
    
    console.log('\n🎯 ENHANCED BACKUP COMPLETED SUCCESSFULLY!');
    console.log(`\n📁 Backup location: ${backupDir}`);
    console.log(`📜 Restore with: cd "${backupDir}" && node restore-database-enhanced.js`);
    
  } catch (error) {
    console.error('💥 ENHANCED BACKUP FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection:', reason);
  console.error('Promise:', promise);
  // Don't exit on unhandled rejections, just log them
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Run enhanced backup
if (require.main === module) {
  backupDatabaseEnhanced();
}

module.exports = { backupDatabaseEnhanced };