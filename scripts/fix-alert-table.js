/**
 * Fix vulnerability_analyses table - Add missing columns
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTable() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FIXING VULNERABILITY_ANALYSES TABLE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Add annual_trade_volume column
    console.log('Adding annual_trade_volume column...');
    const { data: data1, error: error1 } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE vulnerability_analyses ADD COLUMN IF NOT EXISTS annual_trade_volume BIGINT DEFAULT 0;'
    });

    if (error1) {
      console.log('Using alternative method...');

      // Alternative: Use raw SQL query
      const { error: altError1 } = await supabase
        .from('vulnerability_analyses')
        .select('annual_trade_volume')
        .limit(1);

      if (altError1 && altError1.code === '42703') {
        console.log('✅ Column annual_trade_volume needs to be added');
        console.log('\nPlease run this SQL in Supabase SQL Editor:');
        console.log('ALTER TABLE vulnerability_analyses ADD COLUMN annual_trade_volume BIGINT DEFAULT 0;');
      } else if (!altError1) {
        console.log('✅ Column annual_trade_volume already exists');
      }
    }

    // Add qualification_status column
    console.log('\nAdding qualification_status column...');
    const { data: data2, error: error2 } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE vulnerability_analyses ADD COLUMN IF NOT EXISTS qualification_status TEXT;'
    });

    if (error2) {
      const { error: altError2 } = await supabase
        .from('vulnerability_analyses')
        .select('qualification_status')
        .limit(1);

      if (altError2 && altError2.code === '42703') {
        console.log('✅ Column qualification_status needs to be added');
        console.log('\nPlease run this SQL in Supabase SQL Editor:');
        console.log('ALTER TABLE vulnerability_analyses ADD COLUMN qualification_status TEXT;');
      } else if (!altError2) {
        console.log('✅ Column qualification_status already exists');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('COMPLETE SQL TO RUN IN SUPABASE DASHBOARD:');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`-- Copy and paste this into Supabase SQL Editor:

ALTER TABLE vulnerability_analyses
ADD COLUMN IF NOT EXISTS annual_trade_volume BIGINT DEFAULT 0;

ALTER TABLE vulnerability_analyses
ADD COLUMN IF NOT EXISTS qualification_status TEXT;

-- Update existing records with workflow data
UPDATE vulnerability_analyses v
SET
  annual_trade_volume = COALESCE(
    (SELECT (workflow_data->'company'->>'annual_trade_volume')::BIGINT
     FROM workflow_completions w
     WHERE w.user_id = v.user_id
     AND w.hs_code = v.hs_code
     ORDER BY w.completed_at DESC
     LIMIT 1),
    0
  ),
  qualification_status = COALESCE(
    (SELECT
       CASE
         WHEN (workflow_data->'usmca'->>'qualified')::BOOLEAN THEN 'QUALIFIED'
         ELSE 'NOT_QUALIFIED'
       END
     FROM workflow_completions w
     WHERE w.user_id = v.user_id
     AND w.hs_code = v.hs_code
     ORDER BY w.completed_at DESC
     LIMIT 1),
    'NOT_QUALIFIED'
  )
WHERE annual_trade_volume IS NULL OR qualification_status IS NULL;
`);

  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

fixTable();
