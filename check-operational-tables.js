/**
 * Check operational tables for Sales-Broker workflow
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOperationalTables() {
  console.log('🗄️ Checking Operational Tables for Workflow Management\n');

  const operationalTables = [
    'user_profiles',            // SMB clients
    'workflow_completions',     // Completed USMCA workflows
    'client_assignments',       // Sales-Broker client assignment
    'sales_broker_handoffs',    // Handoff tracking
    'partner_pipeline',         // Partner acquisition pipeline
    'broker_assessments',       // Broker assessment of partners
    'collaboration_queue',      // Cross-team collaboration items
    'revenue_attribution'       // Revenue tracking
  ];

  for (const table of operationalTables) {
    console.log(`\n📊 TABLE: ${table}`);
    console.log('─'.repeat(40));

    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      console.log(`   Total records: ${count || 0}`);

      if (count > 0) {
        const { data: sample } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          .single();

        if (sample) {
          console.log(`   Columns: ${Object.keys(sample).join(', ')}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Table doesn't exist: ${error.message}`);
    }
  }

  console.log('\n=====================================');
  console.log('🎯 Next Steps: Create missing operational tables');
  console.log('=====================================\n');
}

checkOperationalTables().catch(console.error);