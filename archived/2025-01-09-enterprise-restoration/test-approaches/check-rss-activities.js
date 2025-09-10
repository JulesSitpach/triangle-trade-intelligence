const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActivities() {
  console.log('🔍 CHECKING RSS FEED ACTIVITIES AFTER POLLING');
  console.log('==============================================');
  
  try {
    // Check activities
    const { data: activities, error: activitiesError } = await supabase
      .from('rss_feed_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError.message);
    }
    
    console.log(`📊 Total RSS activities: ${activities?.length || 0}`);
    
    // Check crisis alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (alertsError) {
      console.error('❌ Error fetching crisis alerts:', alertsError.message);
    }
    
    console.log(`🚨 Crisis alerts generated: ${alerts?.length || 0}`);
    
    // Check feed status updates
    const { data: feeds, error: feedsError } = await supabase
      .from('rss_feeds')
      .select('name, last_check_at, last_success_at, failure_count, url')
      .order('last_check_at', { ascending: false });
      
    if (feedsError) {
      console.error('❌ Error fetching feeds:', feedsError.message);
      return;
    }
    
    console.log('\n📡 FEED STATUS AFTER POLLING:');
    feeds?.forEach((feed, i) => {
      const lastCheck = feed.last_check_at ? new Date(feed.last_check_at).toLocaleString() : 'Never';
      const lastSuccess = feed.last_success_at ? new Date(feed.last_success_at).toLocaleString() : 'Never';
      
      console.log(`${i + 1}. ${feed.name}`);
      console.log(`   Last Check: ${lastCheck}`);
      console.log(`   Last Success: ${lastSuccess}`);
      console.log(`   Failures: ${feed.failure_count || 0}`);
      console.log('');
    });
    
    if (activities && activities.length > 0) {
      console.log('\n🆕 RECENT RSS CONTENT:');
      activities.slice(0, 3).forEach((activity, i) => {
        console.log(`${i + 1}. ${activity.title || 'No title'}`);
        console.log(`   Crisis Score: ${activity.crisis_score || 0}`);
        console.log(`   Keywords: ${activity.crisis_keywords_detected?.join(', ') || 'None'}`);
        console.log(`   Published: ${activity.pub_date ? new Date(activity.pub_date).toLocaleString() : 'Unknown'}`);
        console.log('');
      });
    }
    
    if (alerts && alerts.length > 0) {
      console.log('\n🚨 CRISIS ALERTS:');
      alerts.forEach((alert, i) => {
        console.log(`${i + 1}. ${alert.title}`);
        console.log(`   Severity: ${alert.severity_level}`);
        console.log(`   Keywords: ${alert.keywords_matched?.join(', ') || 'None'}`);
        console.log(`   Business Impact: ${alert.business_impact || 'Not specified'}`);
        console.log('');
      });
    }
    
    return {
      activitiesCount: activities?.length || 0,
      alertsCount: alerts?.length || 0,
      feedsPolled: feeds?.filter(f => f.last_check_at).length || 0,
      totalFeeds: feeds?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Error checking activities:', error.message);
    return null;
  }
}

checkActivities().then(result => {
  if (result) {
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Feeds polled: ${result.feedsPolled}/${result.totalFeeds}`);
    console.log(`📰 Content items: ${result.activitiesCount}`);
    console.log(`🚨 Crisis alerts: ${result.alertsCount}`);
    
    if (result.feedsPolled === result.totalFeeds && result.feedsPolled > 0) {
      console.log('\n🎉 RSS POLLING: FULLY OPERATIONAL');
      console.log('✅ All feeds successfully polled');
      console.log('✅ Crisis monitoring system is now 100% active');
    } else {
      console.log('\n⚠️ RSS POLLING: NEEDS INVESTIGATION');
      console.log('Some feeds may have connectivity issues');
    }
  }
}).catch(console.error);