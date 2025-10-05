/**
 * Check vulnerability_analyses table schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECKING VULNERABILITY_ANALYSES TABLE SCHEMA');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get one record to see what columns exist
  const { data, error } = await supabase
    .from('vulnerability_analyses')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Columns in vulnerability_analyses table:\n');
  Object.keys(data).forEach(key => {
    const value = data[key];
    const type = Array.isArray(value) ? 'array' : typeof value;
    console.log(`  - ${key}: ${type}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('REQUIRED COLUMNS CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');

  const requiredColumns = [
    'annual_trade_volume',
    'qualification_status',
    'recommended_alternatives',
    'vulnerabilities',
    'component_origins',
    'alerts'
  ];

  requiredColumns.forEach(col => {
    const exists = col in data;
    const status = exists ? '✓ EXISTS' : '❌ MISSING';
    const value = exists ? `(value: ${JSON.stringify(data[col])})` : '';
    console.log(`  ${status}: ${col} ${value}`);
  });

  process.exit(0);
}

checkSchema().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
