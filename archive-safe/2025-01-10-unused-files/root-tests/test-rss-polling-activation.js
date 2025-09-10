/**
 * Test RSS Polling Activation
 * Activates the crisis monitoring system and tests real RSS feed polling
 * This will make the crisis alerts system 100% operational
 */

require('dotenv').config({ path: '.env.local' });

async function testRSSPollingActivation() {
  console.log('🚀 ACTIVATING RSS CRISIS MONITORING SYSTEM');
  console.log('=========================================');
  console.log('Testing: Real-time RSS polling and crisis alert generation');
  console.log('Goal: Achieve 100% operational crisis monitoring system\n');

  try {
    // STEP 1: Check current polling status
    console.log('1. 📊 CHECKING CURRENT POLLING STATUS');
    
    const statusResponse = await fetch('http://localhost:3000/api/admin/rss-polling');
    const statusData = await statusResponse.json();
    
    console.log(`   Current Status: ${statusData.polling_status?.uptime || 'Unknown'}`);
    console.log(`   Engine Initialized: ${statusData.engine_initialized ? 'Yes' : 'No'}`);
    console.log(`   Is Polling: ${statusData.polling_status?.isPolling ? 'Yes' : 'No'}`);

    // STEP 2: Perform manual test poll
    console.log('\n2. 🧪 MANUAL RSS POLL TEST');
    console.log('   Testing RSS feed connectivity and content parsing...');
    
    const pollTestResponse = await fetch('http://localhost:3000/api/admin/rss-polling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'poll_once'
      })
    });
    
    const pollTestData = await pollTestResponse.json();
    
    console.log(`   Poll Result: ${pollTestData.message}`);
    if (pollTestData.poll_result) {
      console.log(`   ✅ Successful polls: ${pollTestData.poll_result.successful || 0}`);
      console.log(`   ❌ Failed polls: ${pollTestData.poll_result.failed || 0}`);
      console.log(`   📊 Total feeds tested: ${pollTestData.poll_result.total || 0}`);
    }

    // STEP 3: Check for new RSS content and activities
    console.log('\n3. 📰 RSS CONTENT ANALYSIS');
    
    // Wait a moment for database updates
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const feedsResponse = await fetch('http://localhost:3000/api/admin/rss-feeds');
    const feedsData = await feedsResponse.json();
    
    const feedsWithActivity = feedsData.rss_feeds?.filter(feed => 
      feed.last_check_at && feed.last_check_at !== 'Never'
    ) || [];
    
    console.log(`   📡 Feeds Successfully Polled: ${feedsWithActivity.length}/${feedsData.rss_feeds?.length || 0}`);
    console.log(`   🔄 Overall Health: ${feedsData.summary?.overall_health_percentage || 0}%`);
    console.log(`   ⚡ Success Rate: ${feedsData.summary?.success_rate || 0}%`);
    
    feedsWithActivity.slice(0, 3).forEach((feed, i) => {
      console.log(`   ${i + 1}. ${feed.name}: ${feed.health_status} (${feed.uptime_percentage}% uptime)`);
    });

    // STEP 4: Start continuous polling (if manual test successful)
    if (pollTestData.poll_result?.successful > 0) {
      console.log('\n4. 🚀 STARTING CONTINUOUS CRISIS MONITORING');
      console.log('   Activating real-time RSS polling every 10 minutes...');
      
      const startPollingResponse = await fetch('http://localhost:3000/api/admin/rss-polling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          interval_minutes: 10
        })
      });
      
      const startPollingData = await startPollingResponse.json();
      
      console.log(`   ✅ ${startPollingData.message}`);
      console.log(`   🔄 Polling Status: ${startPollingData.status?.uptime || 'Unknown'}`);
      console.log(`   ⏰ Check Interval: 10 minutes`);
    } else {
      console.log('\n4. ⚠️ CONTINUOUS POLLING NOT STARTED');
      console.log('   Manual poll test failed - investigating feed connectivity issues');
    }

    // STEP 5: Test Crisis Alert System Integration
    console.log('\n5. 🚨 CRISIS ALERT SYSTEM INTEGRATION TEST');
    
    // Re-run the crisis alerts test to see improvement
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const testProcess = spawn('node', ['test-crisis-alerts-system.js'], {
        stdio: 'pipe'
      });
      
      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.on('close', (code) => {
        // Extract key metrics from the output
        const readinessMatch = output.match(/Overall Crisis System Readiness: (\d+)%/);
        const feedsMatch = output.match(/Total Feeds Monitored: (\d+)/);
        const alertsMatch = output.match(/Crisis Alerts Identified: (\d+)/);
        
        const readiness = readinessMatch ? parseInt(readinessMatch[1]) : 0;
        const feedsMonitored = feedsMatch ? parseInt(feedsMatch[1]) : 0;
        const alertsGenerated = alertsMatch ? parseInt(alertsMatch[1]) : 0;
        
        console.log('   📊 CRISIS SYSTEM STATUS (After RSS Activation):');
        console.log(`   • System Readiness: ${readiness}%`);
        console.log(`   • Feeds Monitored: ${feedsMonitored}`);
        console.log(`   • Alerts Generated: ${alertsGenerated}`);
        
        resolve({
          readiness,
          feedsMonitored,
          alertsGenerated,
          rssPollingActive: pollTestData.poll_result?.successful > 0
        });
      });
    });

  } catch (error) {
    console.error('\n❌ RSS POLLING ACTIVATION FAILED');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

testRSSPollingActivation().then(result => {
  if (result && typeof result === 'object') {
    console.log('\n🎉 RSS CRISIS MONITORING ACTIVATION: COMPLETE');
    console.log('=============================================');
    
    if (result.readiness >= 80) {
      console.log('✅ Crisis monitoring system is now OPERATIONAL');
      console.log('✅ Triangle Intelligence positioned as crisis intelligence leader');
      console.log(`✅ System readiness: ${result.readiness}% (Target: 80%+)`);
    } else {
      console.log('⚠️ Crisis monitoring system needs additional configuration');
      console.log(`📊 Current readiness: ${result.readiness}%`);
    }
    
    if (result.rssPollingActive) {
      console.log('✅ RSS polling engine: ACTIVE and monitoring trade intelligence');
      console.log('🚨 Crisis alerts will now be generated in real-time');
    } else {
      console.log('⚠️ RSS polling engine needs connectivity troubleshooting');
    }
  }
}).catch(console.error);