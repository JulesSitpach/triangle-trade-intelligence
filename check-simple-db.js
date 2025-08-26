const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkExistingTables() {
  console.log('🔍 CHECKING EXISTING DATABASE STRUCTURE');
  console.log('====================================');
  
  const tablesToCheck = ['comtrade_reference', 'trade_flows', 'countries', 'workflow_sessions'];
  
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (!error) {
        console.log('✅ ' + table + ': ' + (count || 0) + ' records');
      }
    } catch (err) {
      console.log('❌ ' + table + ': Not accessible');
    }
  }
  
  console.log('');
  console.log('🎯 SIMPLE APPROACH RECOMMENDATION:');
  console.log('📋 Use existing comtrade_reference for HS codes');
  console.log('📝 Use existing workflow_sessions for user data');
  console.log('🌍 Use existing countries for dropdowns');
  console.log('');
  console.log('🎯 NEXT: Enhance existing tables instead of creating new ones');
}

checkExistingTables().catch(console.error);