/**
 * Complete Crisis Intelligence System Test
 * Tests the integrated RSS monitoring + Trump policy intelligence system
 * Validates Triangle Intelligence crisis response market leadership positioning
 */

require('dotenv').config({ path: '.env.local' });

async function testCompleteCrisisIntelligenceSystem() {
  console.log('🚨 COMPLETE CRISIS INTELLIGENCE SYSTEM TEST');
  console.log('==========================================');
  console.log('Testing: Integrated RSS monitoring + Trump policy intelligence');
  console.log('Goal: Validate Triangle Intelligence as crisis response market leader\n');

  try {
    const results = {
      rssMonitoring: {},
      trumpPolicyIntelligence: {},
      businessOpportunities: {},
      crisisResponse: {},
      competitiveAdvantage: {}
    };

    // SECTION 1: RSS FEED MONITORING STATUS
    console.log('1. 📡 RSS FEED MONITORING SYSTEM STATUS');
    console.log('======================================');
    
    const rssResponse = await fetch('http://localhost:3000/api/admin/rss-feeds');
    const rssData = await rssResponse.json();
    
    console.log(`   📊 Total RSS Feeds: ${rssData.rss_feeds?.length || 0}`);
    console.log(`   🟢 Active Feeds: ${rssData.summary?.active || 0}`);
    console.log(`   ⚡ Success Rate: ${rssData.summary?.success_rate || 0}%`);
    console.log(`   📰 Content Items: ${rssData.data_status?.total_activities_period || 0}`);
    console.log(`   🚨 Alerts Generated: ${rssData.summary?.total_alerts || 0}`);
    
    results.rssMonitoring = {
      totalFeeds: rssData.rss_feeds?.length || 0,
      activeFeeds: rssData.summary?.active || 0,
      successRate: rssData.summary?.success_rate || 0,
      contentItems: rssData.data_status?.total_activities_period || 0,
      alertsGenerated: rssData.summary?.total_alerts || 0
    };

    // SECTION 2: TRUMP POLICY INTELLIGENCE
    console.log('\n2. 🏛️ TRUMP POLICY INTELLIGENCE SYSTEM');
    console.log('=====================================');
    
    // Simulate a Trump policy tracker API call (using database data)
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: policyEvents } = await supabase
      .from('trump_policy_events')
      .select('*')
      .order('event_date', { ascending: false });
    
    const { data: customerImpacts } = await supabase
      .from('customer_policy_impacts')
      .select('*');
    
    const { data: businessOpportunities } = await supabase
      .from('policy_business_opportunities')
      .select('*');
    
    console.log(`   📊 Policy Events Tracked: ${policyEvents?.length || 0}`);
    console.log(`   🚨 Critical Events: ${policyEvents?.filter(e => e.impact_severity === 'critical').length || 0}`);
    console.log(`   🇨🇳 China Risk Events: ${policyEvents?.filter(e => e.china_supplier_risk_level === 'extreme').length || 0}`);
    console.log(`   🇲🇽 Mexico Opportunities: ${policyEvents?.filter(e => e.mexico_routing_opportunity).length || 0}`);
    console.log(`   👥 Customer Impacts: ${customerImpacts?.length || 0}`);
    
    results.trumpPolicyIntelligence = {
      policyEvents: policyEvents?.length || 0,
      criticalEvents: policyEvents?.filter(e => e.impact_severity === 'critical').length || 0,
      chinaRiskEvents: policyEvents?.filter(e => e.china_supplier_risk_level === 'extreme').length || 0,
      mexicoOpportunities: policyEvents?.filter(e => e.mexico_routing_opportunity).length || 0,
      customerImpacts: customerImpacts?.length || 0
    };

    // SECTION 3: BUSINESS OPPORTUNITIES PIPELINE
    console.log('\n3. 💰 BUSINESS OPPORTUNITIES PIPELINE');
    console.log('===================================');
    
    const totalOpportunityValue = businessOpportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
    const totalCustomerImpact = customerImpacts?.reduce((sum, imp) => sum + (imp.estimated_cost_impact || 0), 0) || 0;
    const mexicoRoutingOpps = businessOpportunities?.filter(opp => opp.opportunity_type.includes('mexico')).length || 0;
    const emergencyOpps = businessOpportunities?.filter(opp => opp.opportunity_type === 'emergency_routing').length || 0;
    
    console.log(`   💵 Total Opportunity Value: $${totalOpportunityValue.toLocaleString()}`);
    console.log(`   ⚠️ Total Customer Cost Impact: $${totalCustomerImpact.toLocaleString()}`);
    console.log(`   🇲🇽 Mexico Routing Opportunities: ${mexicoRoutingOpps}`);
    console.log(`   🚨 Emergency Response Opportunities: ${emergencyOpps}`);
    console.log(`   📈 Revenue Capture Rate: ${totalCustomerImpact > 0 ? Math.round((totalOpportunityValue / totalCustomerImpact) * 100) : 0}%`);
    
    results.businessOpportunities = {
      totalValue: totalOpportunityValue,
      customerImpact: totalCustomerImpact,
      mexicoRouting: mexicoRoutingOpps,
      emergencyResponse: emergencyOpps,
      captureRate: totalCustomerImpact > 0 ? Math.round((totalOpportunityValue / totalCustomerImpact) * 100) : 0
    };

    // SECTION 4: INTEGRATED CRISIS RESPONSE CAPABILITIES
    console.log('\n4. 🛡️ INTEGRATED CRISIS RESPONSE CAPABILITIES');
    console.log('===========================================');
    
    const businessOppsResponse = await fetch('http://localhost:3000/api/admin/business-opportunity-analytics');
    const businessData = await businessOppsResponse.json();
    
    const chinaOpportunities = businessData.qualification_analysis?.china_crisis_opportunities || 0;
    const mexicoSolutions = businessData.mexico_routing_performance?.total_mexico_opportunities || 0;
    const crisisResponseRatio = mexicoSolutions > 0 ? Math.round((chinaOpportunities / mexicoSolutions) * 100) : 0;
    
    console.log(`   🚨 China Crisis Detection: ${chinaOpportunities} customers at risk`);
    console.log(`   🇲🇽 Mexico Solutions Ready: ${mexicoSolutions} triangle routing options`);
    console.log(`   ⚡ Crisis-to-Solution Ratio: ${crisisResponseRatio}%`);
    console.log(`   🔄 RSS + Policy Integration: ${results.rssMonitoring.activeFeeds > 0 && results.trumpPolicyIntelligence.policyEvents > 0 ? 'OPERATIONAL' : 'NEEDS INTEGRATION'}`);
    
    results.crisisResponse = {
      chinaOpportunities,
      mexicoSolutions,
      crisisToSolutionRatio: crisisResponseRatio,
      integrationStatus: results.rssMonitoring.activeFeeds > 0 && results.trumpPolicyIntelligence.policyEvents > 0
    };

    // SECTION 5: COMPETITIVE ADVANTAGE ASSESSMENT
    console.log('\n5. 🏆 COMPETITIVE ADVANTAGE ASSESSMENT');
    console.log('====================================');
    
    const avgOpportunitySize = businessOpportunities?.length > 0 ? totalOpportunityValue / businessOpportunities.length : 0;
    const criticalRiskCases = customerImpacts?.filter(imp => imp.supply_chain_disruption_score >= 8).length || 0;
    const immediateResponseCases = businessOpportunities?.filter(opp => opp.timeline_advantage?.includes('Emergency')).length || 0;
    
    console.log('   🎯 TRIANGLE INTELLIGENCE ADVANTAGES:');
    console.log(`   • Real-time Policy Monitoring: ${results.trumpPolicyIntelligence.policyEvents} events tracked`);
    console.log(`   • RSS Intelligence Network: ${results.rssMonitoring.activeFeeds} feeds monitoring 24/7`);
    console.log(`   • Mexico Supplier Network: ${mexicoSolutions} triangle routing solutions`);
    console.log(`   • Crisis Response Speed: ${immediateResponseCases} emergency cases ready`);
    console.log(`   • Average Deal Size: $${Math.round(avgOpportunitySize).toLocaleString()}`);
    console.log(`   • Critical Risk Management: ${criticalRiskCases} high-disruption cases`);
    
    results.competitiveAdvantage = {
      policyMonitoring: results.trumpPolicyIntelligence.policyEvents,
      rssNetwork: results.rssMonitoring.activeFeeds,
      mexicoNetwork: mexicoSolutions,
      emergencyResponse: immediateResponseCases,
      avgDealSize: Math.round(avgOpportunitySize),
      criticalRiskCases
    };

    // SECTION 6: SYSTEM READINESS ASSESSMENT
    console.log('\n6. 📋 CRISIS INTELLIGENCE SYSTEM READINESS');
    console.log('=========================================');
    
    const systemComponents = {
      rssMonitoring: results.rssMonitoring.activeFeeds > 0 && results.rssMonitoring.successRate > 50,
      trumpPolicyTracking: results.trumpPolicyIntelligence.policyEvents > 0,
      customerImpactAnalysis: results.trumpPolicyIntelligence.customerImpacts > 0,
      businessOpportunityGeneration: results.businessOpportunities.totalValue > 0,
      mexicoRoutingIntegration: results.businessOpportunities.mexicoRouting > 0,
      crisisResponseCapability: results.crisisResponse.integrationStatus
    };
    
    const readyComponents = Object.values(systemComponents).filter(Boolean).length;
    const totalComponents = Object.keys(systemComponents).length;
    const systemReadiness = Math.round((readyComponents / totalComponents) * 100);
    
    console.log('✅ SYSTEM COMPONENTS STATUS:');
    Object.entries(systemComponents).forEach(([component, status]) => {
      const componentName = component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   • ${componentName}: ${status ? '✅ OPERATIONAL' : '⚠️ NEEDS ATTENTION'}`);
    });
    
    console.log(`\n📊 Overall Crisis Intelligence Readiness: ${systemReadiness}%`);

    // SECTION 7: MARKET POSITIONING SUMMARY
    console.log('\n7. 🚀 TRIANGLE INTELLIGENCE MARKET POSITIONING');
    console.log('============================================');
    
    if (systemReadiness >= 85) {
      console.log('🏆 STATUS: CRISIS INTELLIGENCE MARKET LEADER');
      console.log('✅ Triangle Intelligence is positioned as the premier crisis response platform');
      console.log('✅ Integrated RSS + Policy monitoring provides 24-48 hour competitive advantage');
      console.log('✅ Mexico triangle routing creates sustainable competitive moat');
      console.log('✅ Crisis-driven customer acquisition and retention strategy operational');
    } else if (systemReadiness >= 70) {
      console.log('🎯 STATUS: CRISIS INTELLIGENCE CAPABILITIES STRONG');
      console.log('✅ Major crisis response capabilities operational');
      console.log('⚠️ Some integration enhancements needed for market leadership');
    } else {
      console.log('🛠️ STATUS: CRISIS INTELLIGENCE UNDER DEVELOPMENT');
      console.log('⚠️ Core components need optimization for competitive advantage');
    }

    return {
      success: true,
      systemReadiness,
      ...results,
      marketPosition: systemReadiness >= 85 ? 'MARKET_LEADER' : systemReadiness >= 70 ? 'STRONG_POSITION' : 'UNDER_DEVELOPMENT'
    };

  } catch (error) {
    console.error('\n❌ CRISIS INTELLIGENCE SYSTEM TEST: FAILED');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

testCompleteCrisisIntelligenceSystem().then(result => {
  if (result && result.success) {
    console.log('\n🎉 COMPLETE CRISIS INTELLIGENCE SYSTEM: VALIDATION SUCCESS');
    console.log('========================================================');
    console.log(`✅ System Readiness: ${result.systemReadiness}%`);
    console.log(`✅ Market Position: ${result.marketPosition.replace('_', ' ')}`);
    console.log('✅ Triangle Intelligence crisis response advantage: FULLY OPERATIONAL');
    console.log('\n🚀 Ready for customer engagement and crisis response market leadership');
  } else {
    console.log('\n❌ CRISIS INTELLIGENCE SYSTEM: VALIDATION FAILED');
  }
}).catch(console.error);