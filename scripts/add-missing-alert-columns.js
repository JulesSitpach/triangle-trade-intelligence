/**
 * Add missing columns to vulnerability_analyses table
 * - annual_trade_volume
 * - qualification_status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumns() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('ADDING MISSING COLUMNS TO vulnerability_analyses');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Use raw SQL to add columns
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Add annual_trade_volume column
      ALTER TABLE vulnerability_analyses
      ADD COLUMN IF NOT EXISTS annual_trade_volume BIGINT DEFAULT 0;

      -- Add qualification_status column
      ALTER TABLE vulnerability_analyses
      ADD COLUMN IF NOT EXISTS qualification_status TEXT;

      -- Create index for better query performance
      CREATE INDEX IF NOT EXISTS idx_vulnerability_analyses_annual_trade_volume
      ON vulnerability_analyses(annual_trade_volume);

      CREATE INDEX IF NOT EXISTS idx_vulnerability_analyses_qualification_status
      ON vulnerability_analyses(qualification_status);
    `
  });

  if (error) {
    console.error('❌ Error adding columns:', error);
    console.log('\nTrying alternative approach using individual ALTER TABLE statements...\n');

    // Try adding columns one by one
    try {
      // This won't work with execute_sql either, so we need to use the Supabase dashboard
      console.log('⚠️ Cannot add columns via API - need to use Supabase dashboard\n');
      console.log('Please run these SQL commands in Supabase SQL Editor:\n');
      console.log('```sql');
      console.log('ALTER TABLE vulnerability_analyses');
      console.log('ADD COLUMN IF NOT EXISTS annual_trade_volume BIGINT DEFAULT 0;');
      console.log('');
      console.log('ALTER TABLE vulnerability_analyses');
      console.log('ADD COLUMN IF NOT EXISTS qualification_status TEXT;');
      console.log('```');
      process.exit(1);
    } catch (err) {
      console.error('Alternative approach failed:', err);
      process.exit(1);
    }
  } else {
    console.log('✅ Columns added successfully!');
    console.log('  - annual_trade_volume (BIGINT)');
    console.log('  - qualification_status (TEXT)');
    process.exit(0);
  }
}

addColumns().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
