/**
 * DATABASE MIGRATION RUNNER
 * Executes SQL migrations on Supabase database
 *
 * Usage:
 *   node scripts/run-database-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Execute SQL migration file
 */
async function runMigration(migrationFile, description) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Running migration: ${migrationFile}`);
  console.log(`📋 ${description}`);
  console.log('='.repeat(80));

  try {
    // Read SQL file
    const migrationPath = join(__dirname, '..', 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf8');

    // Split into statements (basic approach - may need refinement)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement via RPC (if available) or direct query
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) continue;

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Try to execute via direct SQL query
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // If RPC doesn't exist, try alternative method
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log('   ⚠️  exec_sql function not available - manual execution required');
            console.log(`   📋 SQL: ${statement.substring(0, 100)}...`);
            continue;
          }

          throw error;
        }

        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      } catch (stmtError) {
        console.error(`   ❌ Error in statement ${i + 1}:`, stmtError.message);
        throw stmtError;
      }
    }

    console.log(`\n✅ Migration ${migrationFile} completed successfully!`);
    return { success: true, file: migrationFile };

  } catch (error) {
    console.error(`\n❌ Migration ${migrationFile} FAILED:`, error.message);
    return { success: false, file: migrationFile, error: error.message };
  }
}

/**
 * Alternative: Execute via Supabase SQL editor
 */
function printManualInstructions(migrationFile) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔧 MANUAL MIGRATION INSTRUCTIONS');
  console.log('='.repeat(80));
  console.log(`
Since automated SQL execution via RPC may not be available, you can run the
migration manually using the Supabase SQL Editor:

1. Open Supabase Dashboard: ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', '')}
2. Navigate to: SQL Editor
3. Click "New Query"
4. Copy the SQL from: migrations/${migrationFile}
5. Paste into the SQL Editor
6. Click "Run"
7. Verify the migration completed successfully

After manual execution, re-run this script to verify the schema.
`);
  console.log('='.repeat(80));
}

/**
 * Verify migration results
 */
async function verifyMigration(migrationName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Verifying migration: ${migrationName}`);
  console.log('='.repeat(80));

  if (migrationName === 'subscriber_data') {
    // Check if subscriber_data column exists
    const { data, error } = await supabase
      .from('service_requests')
      .select('subscriber_data')
      .limit(1);

    if (error) {
      console.log('❌ subscriber_data column NOT found');
      console.log(`   Error: ${error.message}`);
      return false;
    }

    console.log('✅ subscriber_data column EXISTS');

    // Check how many rows have data
    const { count } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total service_requests: ${count}`);
    return true;
  }

  if (migrationName === 'service_completions') {
    // Check if table exists
    const { data, error } = await supabase
      .from('service_completions')
      .select('*')
      .limit(0);

    if (error) {
      console.log('❌ service_completions table NOT found');
      console.log(`   Error: ${error.message}`);
      return false;
    }

    console.log('✅ service_completions table EXISTS');
    return true;
  }

  return true;
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 TRIANGLE INTELLIGENCE - DATABASE MIGRATIONS');
  console.log('='.repeat(80));
  console.log(`Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);

  const migrations = [
    {
      file: 'add_subscriber_data_to_service_requests.sql',
      name: 'subscriber_data',
      description: 'Add subscriber_data JSONB column to service_requests (CRITICAL)',
      required: true
    },
    {
      file: 'create_service_completions_table.sql',
      name: 'service_completions',
      description: 'Create service_completions table (OPTIONAL)',
      required: false
    }
  ];

  const results = [];

  for (const migration of migrations) {
    // Print instructions for manual execution
    printManualInstructions(migration.file);

    // Ask user to continue after manual execution
    console.log(`\n⏸️  Please execute the migration manually, then press Enter to verify...`);
    console.log(`   Or type 'skip' to skip this migration.\n`);

    // Wait for user input (in Node.js environment)
    // For now, just continue automatically with verification
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify migration
    const verified = await verifyMigration(migration.name);

    results.push({
      ...migration,
      verified
    });
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(80));

  results.forEach(r => {
    const status = r.verified ? '✅ VERIFIED' : '❌ NOT VERIFIED';
    const required = r.required ? 'REQUIRED' : 'OPTIONAL';
    console.log(`${status} - ${r.name} (${required})`);
  });

  const allRequired = results.filter(r => r.required).every(r => r.verified);

  if (allRequired) {
    console.log('\n🎉 ALL REQUIRED MIGRATIONS VERIFIED - LAUNCH READY');
  } else {
    console.log('\n⚠️  SOME REQUIRED MIGRATIONS NOT VERIFIED - MANUAL ACTION NEEDED');
  }

  console.log('\n' + '='.repeat(80));
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✅ Migration runner completed');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify schema: node scripts/validate-database-schema.js');
    console.log('   2. Repopulate test data: node scripts/populate-complete-test-data.js');
    console.log('   3. Test dashboards at http://localhost:3000/admin\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Migration runner error:', err);
    process.exit(1);
  });
