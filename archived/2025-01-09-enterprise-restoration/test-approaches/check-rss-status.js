const https = require('https');

async function checkRSSStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/rss-feeds');
    const data = await response.json();
    
    console.log('📊 RSS FEEDS STATUS AFTER POPULATION:');
    console.log('=====================================');
    console.log(`Total feeds: ${data.rss_feeds?.length || 0}`);
    console.log(`Active feeds: ${data.summary?.active || 0}`);
    console.log(`Health percentage: ${data.summary?.overall_health_percentage || 0}%`);
    console.log('');
    
    console.log('📡 FEED DETAILS:');
    data.rss_feeds?.forEach((feed, i) => {
      console.log(`${i + 1}. ${feed.name} (${feed.category})`);
      console.log(`   Status: ${feed.is_active ? '🟢 Active' : '🔴 Inactive'}`);
      console.log(`   Priority: ${feed.priority_level}`);
      console.log(`   Check frequency: ${feed.check_frequency_minutes} minutes`);
      console.log(`   Last check: ${feed.last_check_at || 'Never'}`);
      console.log(`   Health: ${feed.health_status || 'Unknown'}`);
      console.log(`   Keywords: ${feed.keywords?.join(', ') || 'None'}`);
      console.log('');
    });
    
    console.log('🔍 ANALYSIS:');
    if (data.rss_feeds?.length > 0) {
      console.log('✅ RSS feeds are populated in database');
      
      const neverChecked = data.rss_feeds.filter(f => !f.last_check_at).length;
      if (neverChecked === data.rss_feeds.length) {
        console.log('⚠️ No feeds have been polled yet (needs RSS polling engine)');
        console.log('📋 Next step: Implement RSS content fetching and alert generation');
      } else {
        console.log('✅ Some feeds have been checked');
      }
    } else {
      console.log('❌ No RSS feeds found in database');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error checking RSS status:', error.message);
    return null;
  }
}

checkRSSStatus();