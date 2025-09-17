// Debug database information
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDatabase() {
  console.log('🔍 Database Debug Information...\n');
  
  // 1. Check current data in key tables
  console.log('📊 Current Data in Tables:');
  
  // Check if users table exists
  const { data: baseUsers, error: baseUsersError } = await supabase
    .from('users')
    .select('*')
    .limit(5);
  
  console.log(`users: ${baseUsers?.length || 0} records`);
  if (baseUsersError) console.log('users table error:', baseUsersError);
  
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log(`user_profiles: ${users?.length || 0} records`);
  if (usersError) console.log('user_profiles error:', usersError);
  
  const { data: workflows, error: workflowsError } = await supabase
    .from('workflow_completions')
    .select('*')
    .order('completed_at', { ascending: false })
    .limit(10);
  
  console.log(`workflow_completions: ${workflows?.length || 0} records`);
  if (workflowsError) {
    console.log('workflow_completions error:', workflowsError);
  } else if (workflows && workflows.length > 0) {
    console.log('Sample workflow record:', JSON.stringify(workflows[0], null, 2));
  }
  
  // 2. Try a simple test upsert to see exact error
  console.log('\n🧪 Testing Simple Upsert:');
  
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format
  
  // Try upsert directly to user_profiles (no users table needed)
  const { data: insertResult, error: insertError } = await supabase
    .from('user_profiles')
    .upsert([{
      id: testUserId,
      company_name: 'Debug Test Company',
      email: 'debug@test.com',
      status: 'trial',
      subscription_tier: 'Trial',
      workflow_completions: 1,
      certificates_generated: 0,
      total_savings: 50000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }], { onConflict: 'id' })
    .select();
  
  if (insertError) {
    console.log('❌ Upsert Error:', insertError);
  } else {
    console.log('✅ Upsert Success:', insertResult);
    
    // Clean up the test record
    await supabase.from('user_profiles').delete().eq('id', testUserId);
    console.log('🧹 Test record cleaned up');
  }
  
  // 3. Check table constraints and structure
  console.log('\n📋 Table Information Needed:');
  console.log('- What are the exact column types and constraints?');
  console.log('- Are there any NOT NULL columns I am missing?');
  console.log('- Are there any foreign key constraints?');
  console.log('- What are the default values for columns?');
  console.log('- Are there any triggers or policies blocking inserts?');
  
  // 4. Check if there are any recent inserts at all
  const { data: recentWorkflows, error: recentError } = await supabase
    .from('workflow_completions')
    .select('id, completed_at, user_id')
    .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('completed_at', { ascending: false });
  
  console.log(`\n⏰ Workflows in last 24 hours: ${recentWorkflows?.length || 0}`);
  if (recentError) console.log('Error checking recent workflows:', recentError);
  
  console.log('\n🔍 Questions for you:');
  console.log('1. Can you run: SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 5;');
  console.log('2. Can you run: SELECT * FROM workflow_completions ORDER BY completed_at DESC LIMIT 5;');
  console.log('3. Can you check if there are any RLS (Row Level Security) policies?');
  console.log('4. Can you show the exact table schema with: \\d user_profiles and \\d workflow_completions');
  console.log('5. Are there any constraints or triggers that might block inserts?');
}

debugDatabase().catch(console.error);