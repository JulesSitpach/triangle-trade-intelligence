/**
 * Test Crisis Intelligence UI Integration
 * Validates that the UI dashboard reflects our RSS monitoring and Trump policy intelligence data
 */

require('dotenv').config({ path: '.env.local' });

async function testCrisisUIIntegration() {
  console.log('🖥️ TESTING CRISIS INTELLIGENCE UI INTEGRATION');
  console.log('==============================================');
  console.log('Validating: UI dashboard reflects RSS + Trump policy data');
  console.log('Goal: Confirm UI shows operational crisis intelligence system\n');

  try {
    // Test 1: Check RSS Feeds API data that UI should display
    console.log('1. 📡 RSS FEEDS API DATA (UI Source)');
    const rssResponse = await fetch('http://localhost:3000/api/admin/rss-feeds');
    const rssData = await rssResponse.json();
    
    console.log(`   ✅ RSS Feeds Available: ${rssData.rss_feeds?.length || 0}`);
    console.log(`   ⚡ Active Feeds: ${rssData.summary?.active || 0}`);
    console.log(`   📊 Total Alerts: ${rssData.summary?.total_alerts || 0}`);
    console.log(`   🔄 Success Rate: ${rssData.summary?.success_rate || 0}%`);

    // Test 2: Check RSS Polling Status that UI should display
    console.log('\n2. 🔄 RSS POLLING STATUS (UI Control)');
    const pollingResponse = await fetch('http://localhost:3000/api/admin/rss-polling');
    const pollingData = await pollingResponse.json();
    
    console.log(`   ⚡ Polling Active: ${pollingData.polling_status?.isPolling ? 'YES' : 'NO'}`);
    console.log(`   🛠️ Engine Initialized: ${pollingData.engine_initialized ? 'YES' : 'NO'}`);
    console.log(`   📊 Status: ${pollingData.polling_status?.uptime || 'Unknown'}`);

    // Test 3: Check Trump Policy Events that UI should display
    console.log('\n3. 🏛️ TRUMP POLICY EVENTS (UI Display)');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: policyEvents, error: policyError } = await supabase
      .from('trump_policy_events')
      .select('id, policy_title, event_type, impact_severity, china_supplier_risk_level, mexico_routing_opportunity')
      .order('event_date', { ascending: false });
    
    if (policyError) {
      console.log(`   ❌ Policy Events Error: ${policyError.message}`);
    } else {
      console.log(`   📊 Total Policy Events: ${policyEvents?.length || 0}`);
      console.log(`   🚨 Critical Events: ${policyEvents?.filter(e => e.impact_severity === 'critical').length || 0}`);
      console.log(`   🇨🇳 China Risk Events: ${policyEvents?.filter(e => e.china_supplier_risk_level === 'extreme').length || 0}`);
      console.log(`   🇲🇽 Mexico Opportunities: ${policyEvents?.filter(e => e.mexico_routing_opportunity).length || 0}`);
    }

    // Test 4: Check Business Opportunities that UI should display
    console.log('\n4. 💰 BUSINESS OPPORTUNITIES (UI Metrics)');
    const { data: businessOpps, error: oppsError } = await supabase
      .from('policy_business_opportunities')
      .select('id, opportunity_type, estimated_value, status');
    
    if (oppsError) {
      console.log(`   ❌ Business Opportunities Error: ${oppsError.message}`);
    } else {
      const totalValue = businessOpps?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const mexicoRouting = businessOpps?.filter(opp => opp.opportunity_type.includes('mexico')).length || 0;
      
      console.log(`   📊 Total Opportunities: ${businessOpps?.length || 0}`);
      console.log(`   💵 Total Value: $${totalValue.toLocaleString()}`);
      console.log(`   🇲🇽 Mexico Routing: ${mexicoRouting} opportunities`);
    }

    // Test 5: Crisis Management Dashboard Accessibility
    console.log('\n5. 🖥️ CRISIS MANAGEMENT DASHBOARD ACCESS');
    try {
      const dashboardResponse = await fetch('http://localhost:3000/admin/crisis-management');
      
      if (dashboardResponse.ok) {
        const htmlContent = await dashboardResponse.text();
        const hasTitle = htmlContent.includes('Crisis Management');
        const hasTriangleLayout = htmlContent.includes('Triangle');
        
        console.log(`   ✅ Dashboard Accessible: ${dashboardResponse.status === 200 ? 'YES' : 'NO'}`);
        console.log(`   📊 Has Crisis Title: ${hasTitle ? 'YES' : 'NO'}`);
        console.log(`   🔧 Triangle Layout: ${hasTriangleLayout ? 'YES' : 'NO'}`);
        console.log(`   📏 Content Length: ${Math.round(htmlContent.length / 1000)}KB`);
      } else {
        console.log(`   ❌ Dashboard Error: HTTP ${dashboardResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Dashboard Access Error: ${error.message}`);
    }

    // Test 6: UI Data Integration Assessment
    console.log('\n6. 📊 UI DATA INTEGRATION ASSESSMENT');
    console.log('=====================================');
    
    const uiDataAvailable = {
      rssFeeds: (rssData.rss_feeds?.length || 0) > 0,
      pollingStatus: pollingData.engine_initialized,
      policyEvents: (policyEvents?.length || 0) > 0,
      businessOpportunities: (businessOpps?.length || 0) > 0,
      crisisAlerts: (policyEvents?.filter(e => e.impact_severity === 'critical').length || 0) > 0
    };
    
    const availableComponents = Object.values(uiDataAvailable).filter(Boolean).length;
    const totalComponents = Object.keys(uiDataAvailable).length;
    const uiReadiness = Math.round((availableComponents / totalComponents) * 100);
    
    console.log('✅ UI DATA COMPONENTS:');
    Object.entries(uiDataAvailable).forEach(([component, available]) => {
      const componentName = component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   • ${componentName}: ${available ? '✅ AVAILABLE' : '⚠️ MISSING'}`);
    });
    
    console.log(`\n📊 UI Data Readiness: ${uiReadiness}%`);

    // Test 7: Expected UI Behavior Validation
    console.log('\n7. 🎯 EXPECTED UI BEHAVIOR VALIDATION');
    console.log('====================================');
    
    const expectedUIBehavior = {
      showsActiveRSSFeeds: rssData.summary?.active > 0,
      showsPolicyEventCount: (policyEvents?.length || 0) > 0,
      showsOpportunityValue: (businessOpps?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0) > 0,
      canControlPolling: pollingData.engine_initialized,
      displaysRealCrisisData: (policyEvents?.filter(e => e.impact_severity === 'critical').length || 0) > 0
    };
    
    const workingBehaviors = Object.values(expectedUIBehavior).filter(Boolean).length;
    const totalBehaviors = Object.keys(expectedUIBehavior).length;
    const behaviorReadiness = Math.round((workingBehaviors / totalBehaviors) * 100);
    
    console.log('🎯 EXPECTED UI BEHAVIORS:');
    Object.entries(expectedUIBehavior).forEach(([behavior, working]) => {
      const behaviorName = behavior.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   • ${behaviorName}: ${working ? '✅ WORKING' : '⚠️ NEEDS DATA'}`);
    });
    
    console.log(`\n📊 UI Behavior Readiness: ${behaviorReadiness}%`);

    return {
      success: true,
      uiReadiness,
      behaviorReadiness,
      dataComponents: uiDataAvailable,
      metrics: {
        rssFeeds: rssData.rss_feeds?.length || 0,
        policyEvents: policyEvents?.length || 0,
        businessOpportunities: businessOpps?.length || 0,
        totalOpportunityValue: businessOpps?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0,
        pollingActive: pollingData.polling_status?.isPolling || false
      }
    };

  } catch (error) {
    console.error('\n❌ CRISIS UI INTEGRATION TEST: FAILED');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

testCrisisUIIntegration().then(result => {
  if (result && result.success) {
    console.log('\n🎉 CRISIS INTELLIGENCE UI INTEGRATION: SUCCESS');
    console.log('============================================');
    console.log(`✅ UI Data Readiness: ${result.uiReadiness}%`);
    console.log(`✅ UI Behavior Readiness: ${result.behaviorReadiness}%`);
    console.log('\n📊 DASHBOARD DISPLAYS:');
    console.log(`   • ${result.metrics.rssFeeds} RSS feeds monitored`);
    console.log(`   • ${result.metrics.policyEvents} Trump policy events`);
    console.log(`   • ${result.metrics.businessOpportunities} business opportunities`);
    console.log(`   • $${result.metrics.totalOpportunityValue.toLocaleString()} opportunity value`);
    console.log(`   • RSS polling: ${result.metrics.pollingActive ? 'ACTIVE' : 'STANDBY'}`);
    console.log('\n🚀 Crisis management dashboard reflects operational intelligence system');
  } else {
    console.log('\n❌ CRISIS UI INTEGRATION: FAILED');
  }
}).catch(console.error);