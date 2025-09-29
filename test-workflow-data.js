/**
 * Test script to check if workflow_data exists in database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkWorkflowData() {
  console.log('🔍 Checking workflow_data in service_requests table...\n');

  const { data, error } = await supabase
    .from('service_requests')
    .select('id, company_name, service_type, workflow_data, service_details')
    .limit(3);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No service requests found in database');
    console.log('💡 Run: node scripts/populate-sample-data.js');
    return;
  }

  console.log(`✅ Found ${data.length} service requests\n`);

  data.forEach((request, index) => {
    console.log(`\n📋 Request ${index + 1}:`);
    console.log(`   Company: ${request.company_name}`);
    console.log(`   Service: ${request.service_type}`);
    console.log(`   workflow_data exists: ${request.workflow_data ? '✅ YES' : '❌ NO'}`);

    if (request.workflow_data) {
      console.log(`   workflow_data fields:`);
      console.log(`     - company_name: ${request.workflow_data.company_name || 'missing'}`);
      console.log(`     - product_description: ${request.workflow_data.product_description || 'missing'}`);
      console.log(`     - component_origins: ${request.workflow_data.component_origins?.length || 0} items`);
      console.log(`     - trade_volume: ${request.workflow_data.annual_trade_volume || request.workflow_data.trade_volume || 'missing'}`);
      console.log(`     - qualification_status: ${request.workflow_data.qualification_status || 'missing'}`);
    }

    console.log(`   service_details exists: ${request.service_details ? '✅ YES' : '❌ NO'}`);

    if (request.service_details) {
      console.log(`   service_details fields:`);
      console.log(`     - product_description: ${request.service_details.product_description || 'missing'}`);
      console.log(`     - trade_volume: ${request.service_details.trade_volume || 'missing'}`);
    }
  });

  console.log('\n\n📊 Summary:');
  const withWorkflowData = data.filter(r => r.workflow_data).length;
  const withServiceDetails = data.filter(r => r.service_details).length;

  console.log(`   Requests with workflow_data: ${withWorkflowData}/${data.length}`);
  console.log(`   Requests with service_details: ${withServiceDetails}/${data.length}`);

  if (withWorkflowData === 0) {
    console.log('\n❌ ISSUE FOUND: No requests have workflow_data populated!');
    console.log('💡 Solution: Run populate-sample-data.js to add test data');
  }
}

checkWorkflowData().catch(console.error);