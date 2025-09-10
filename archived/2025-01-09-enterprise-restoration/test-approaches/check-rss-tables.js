const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking RSS feeds database tables...');
  
  try {
    // Check rss_feeds table
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('count', { count: 'exact', head: true });
    
    const feedsStatus = feedsError ? 'NOT EXISTS' : `EXISTS (${feeds || 0} records)`;
    console.log('📊 rss_feeds table:', feedsStatus);
    
    // Check rss_feed_activities table
    const { data: activities, error: activitiesError } = await supabase
      .from('rss_feed_activities')
      .select('count', { count: 'exact', head: true });
    
    const activitiesStatus = activitiesError ? 'NOT EXISTS' : `EXISTS (${activities || 0} records)`;
    console.log('📊 rss_feed_activities table:', activitiesStatus);
    
    // Check crisis_alerts table
    const { data: alerts, error: alertsError } = await supabase
      .from('crisis_alerts')
      .select('count', { count: 'exact', head: true });
    
    const alertsStatus = alertsError ? 'NOT EXISTS' : `EXISTS (${alerts || 0} records)`;
    console.log('📊 crisis_alerts table:', alertsStatus);
    
    return {
      rss_feeds: !feedsError,
      rss_feed_activities: !activitiesError,
      crisis_alerts: !alertsError
    };
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return { error: error.message };
  }
}

checkTables().then(result => {
  if (result.error) {
    console.log('\n❌ CRISIS ALERTS DATABASE: NOT READY');
  } else {
    const ready = result.rss_feeds && result.rss_feed_activities && result.crisis_alerts;
    console.log(`\n${ready ? '✅' : '⚠️'} CRISIS ALERTS DATABASE: ${ready ? 'READY' : 'NEEDS TABLES'}`);
  }
}).catch(console.error);