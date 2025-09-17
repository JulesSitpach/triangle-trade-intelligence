// Check latest workflow with real data
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestData() {
  console.log('🔍 Checking latest data...');
  
  // Check user_profiles with more recent data
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('📊 user_profiles table:', usersError ? 'ERROR: ' + usersError.message : `${users?.length || 0} records`);
  
  if (users && users.length > 0) {
    console.log('👤 Recent users:');
    users.forEach(u => {
      console.log(`- ${u.company_name} (${u.email}) - $${u.total_savings || 0} savings - ${u.created_at}`);
    });
  }
  
  // Check latest workflow_completions
  const { data: workflows, error: workflowsError } = await supabase
    .from('workflow_completions')
    .select('*')
    .order('completed_at', { ascending: false })
    .limit(3);
  
  console.log('\n📋 Latest workflow_completions:', workflowsError ? 'ERROR: ' + workflowsError.message : `${workflows?.length || 0} records`);
  
  if (workflows && workflows.length > 0) {
    console.log('📈 Latest workflows:');
    workflows.forEach(w => {
      console.log(`- ${w.user_id || 'Unknown'} - ${w.product_description || 'No description'} - ${w.completed_at} - $${w.savings_amount || 0}`);
    });
  }
}

checkLatestData().catch(console.error);