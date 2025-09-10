const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 CHECKING TRUMP POLICY DATABASE TABLES');
  console.log('========================================');
  
  const tables = [
    'trump_policy_events',
    'customer_policy_impacts', 
    'policy_business_opportunities',
    'trump_policy_alert_templates',
    'trump_policy_sources'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`📊 ${table}: NOT EXISTS (${error.message})`);
      } else {
        console.log(`📊 ${table}: EXISTS (${data || 0} records)`);
      }
    } catch (err) {
      console.log(`📊 ${table}: ERROR - ${err.message}`);
    }
  }
  
  // Check trump_policy_events content
  console.log('\n🔍 TRUMP POLICY EVENTS CONTENT:');
  try {
    const { data: events, error } = await supabase
      .from('trump_policy_events')
      .select('policy_title, event_type, impact_severity, china_supplier_risk_level, mexico_routing_opportunity')
      .order('event_date', { ascending: false })
      .limit(5);
      
    if (error) {
      console.log('❌ Error fetching events:', error.message);
    } else {
      events?.forEach((event, i) => {
        console.log(`${i + 1}. ${event.policy_title}`);
        console.log(`   Type: ${event.event_type} | Severity: ${event.impact_severity}`);
        console.log(`   China Risk: ${event.china_supplier_risk_level} | Mexico Opp: ${event.mexico_routing_opportunity}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('❌ Error checking events:', err.message);
  }
}

checkTables();