/**
 * Database Connection Test
 * Tests actual Supabase connection and table availability
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  // Check environment variables
  console.log('✅ Environment Variables:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
  console.log();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Missing required environment variables');
    return;
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('📊 Testing Database Tables:\n');

  // Test critical tables
  const tables = [
    'hs_master_rebuild',
    'user_profiles',
    'workflow_completions',
    'rss_feeds',
    'crisis_alerts',
    'usmca_qualification_rules',
    'suppliers',
    'daily_metrics'
  ];

  const results = {
    connected: false,
    tables: {},
    errors: []
  };

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        results.tables[table] = { status: 'error', message: error.message };
        results.errors.push(`${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Accessible (${count || 0} records)`);
        results.tables[table] = { status: 'success', count: count || 0 };
        results.connected = true;
      }
    } catch (e) {
      console.log(`   ❌ ${table}: ${e.message}`);
      results.tables[table] = { status: 'error', message: e.message };
      results.errors.push(`${table}: ${e.message}`);
    }
  }

  console.log('\n📈 Connection Summary:');
  console.log('   Database Connected:', results.connected ? '✅ Yes' : '❌ No');
  
  const successCount = Object.values(results.tables).filter(t => t.status === 'success').length;
  const errorCount = Object.values(results.tables).filter(t => t.status === 'error').length;
  
  console.log(`   Tables Accessible: ${successCount}/${tables.length}`);
  console.log(`   Tables with Errors: ${errorCount}/${tables.length}`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  Common Issues:');
    if (results.errors.some(e => e.includes('relation') && e.includes('does not exist'))) {
      console.log('   - Tables don\'t exist in database (need to run migrations)');
    }
    if (results.errors.some(e => e.includes('permission') || e.includes('denied'))) {
      console.log('   - Permission issues (check RLS policies)');
    }
    if (results.errors.some(e => e.includes('JWT'))) {
      console.log('   - Authentication issues (check API keys)');
    }
  }

  // Test specific query that's failing
  console.log('\n🔬 Testing Specific Query (hs_master_rebuild):');
  try {
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate')
      .limit(1);
    
    if (error) {
      console.log('   ❌ Query failed:', error.message);
    } else if (data && data.length > 0) {
      console.log('   ✅ Query successful, sample record:');
      console.log('      HS Code:', data[0].hs_code);
      console.log('      Description:', data[0].description?.substring(0, 50) + '...');
    } else {
      console.log('   ⚠️  Query successful but no data found');
    }
  } catch (e) {
    console.log('   ❌ Query error:', e.message);
  }

  return results;
}

// Run the test
testDatabaseConnection()
  .then(results => {
    console.log('\n✨ Test Complete');
    process.exit(results.connected ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });