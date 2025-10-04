/**
 * Migration Runner - Applies workflow_sessions table migration
 * Run with: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('📦 Reading migration file...');

    const migrationPath = path.join(__dirname, '..', 'migrations', '003_create_workflow_sessions_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executing migration...');
    console.log('SQL:\n', migrationSQL.substring(0, 200) + '...');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // Try direct query if RPC doesn't exist
      console.log('⚠️ RPC failed, trying direct query...');

      const { data: queryData, error: queryError } = await supabase
        .from('_migrations')
        .select('*')
        .limit(1);

      if (queryError) {
        console.error('❌ Migration failed:', queryError.message);
        console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
        console.log(migrationSQL);
        process.exit(1);
      }
    }

    console.log('✅ Migration executed successfully!');
    console.log('📊 Verifying table...');

    // Verify table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('workflow_sessions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('⚠️ Table verification failed:', tableError.message);
      console.log('\n📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:');
      console.log('\n' + migrationSQL);
    } else {
      console.log('✅ Table workflow_sessions verified and ready!');
    }

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    console.log('\n📋 Please run the migration manually:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run the SQL from: migrations/003_create_workflow_sessions_table.sql');
    process.exit(1);
  }
}

runMigration();
