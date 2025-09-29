require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Getting ALL real service requests...');

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Found ${data.length} REAL service requests:`);

    data.forEach((record, index) => {
      console.log(`\n[${index + 1}] ${record.id} - ${record.service_type}`);
      console.log(`   Company: ${record.company_name}`);
      console.log(`   Contact: ${record.contact_name} (${record.email})`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Assigned: ${record.assigned_to}`);
      console.log(`   Trade Volume: $${record.trade_volume?.toLocaleString() || 'N/A'}`);
      console.log(`   Created: ${new Date(record.created_at).toLocaleDateString()}`);

      if (record.subscriber_data) {
        console.log(`   Subscriber Data Keys: ${Object.keys(record.subscriber_data).join(', ')}`);
      }

      if (record.service_details) {
        console.log(`   Service Details Keys: ${Object.keys(record.service_details).join(', ')}`);
      }
    });
  }

  process.exit(0);
})();