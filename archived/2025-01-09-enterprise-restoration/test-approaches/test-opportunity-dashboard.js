/**
 * Test the Business Opportunity Analytics Dashboard
 * Shows how "not qualified" results create business value for Triangle Intelligence
 */

require('dotenv').config({ path: '.env.local' });

async function testOpportunityDashboard() {
  console.log('🚀 TRIANGLE INTELLIGENCE BUSINESS OPPORTUNITY DASHBOARD');
  console.log('====================================================\n');

  try {
    const response = await fetch('http://localhost:3000/api/admin/business-opportunity-analytics');
    
    if (!response.ok) {
      throw new Error(`Dashboard API returned ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📊 OPPORTUNITY OVERVIEW:');
    console.log('========================');
    console.log(`Total Opportunities Identified: ${data.summary_kpis?.total_opportunities_identified || 0}`);
    console.log(`Total Annual Opportunity Value: $${(data.summary_kpis?.total_opportunity_value || 0).toLocaleString()}`);
    console.log(`Average Opportunity Value: $${(data.summary_kpis?.avg_opportunity_value || 0).toLocaleString()}`);
    console.log(`Mexico Routing Adoption Rate: ${data.summary_kpis?.mexico_routing_adoption || 0}%`);
    console.log(`Conversion Rate: ${data.summary_kpis?.conversion_rate || 0}%`);
    
    console.log('\n🎯 QUALIFICATION OUTCOMES (Business Opportunities):');
    console.log('===================================================');
    const qual = data.qualification_analysis || {};
    console.log(`Not Qualified (Our Opportunities): ${qual.not_qualified_count || 0} (${qual.opportunity_rate || 0}%)`);
    console.log(`Quick Win Opportunities (<10% gap): ${qual.gap_distribution?.quick_wins || 0}`);
    console.log(`Strategic Opportunities (10-25% gap): ${qual.gap_distribution?.strategic_opportunities || 0}`);
    console.log(`Transformation Opportunities (>25% gap): ${qual.gap_distribution?.transformation_opportunities || 0}`);
    console.log(`China Crisis Opportunities: ${qual.china_crisis_opportunities || 0}`);
    
    console.log('\n🇲🇽 MEXICO TRIANGLE ROUTING PERFORMANCE:');
    console.log('=========================================');
    const mexico = data.mexico_routing_performance || {};
    console.log(`Total Mexico Opportunities: ${mexico.total_mexico_opportunities || 0}`);
    console.log(`China→Mexico Transitions Available: ${mexico.china_to_mexico_transitions || 0}`);
    console.log(`Supplier Connections Made: ${mexico.supplier_connections?.total_connections || 0}`);
    console.log(`Mexico Connection Rate: ${mexico.supplier_connections?.mexico_connection_rate || 0}%`);
    console.log(`Average Crisis Mitigation Value: $${(mexico.crisis_response?.avg_china_risk_mitigation_value || 0).toLocaleString()}`);
    
    console.log('\n💰 REVENUE PIPELINE:');
    console.log('====================');
    const revenue = data.revenue_pipeline || {};
    console.log(`Customer Opportunity Value: $${(revenue.total_annual_opportunity_value || 0).toLocaleString()}`);
    console.log(`Triangle Intelligence Revenue Opportunity: $${(revenue.triangle_revenue_opportunity || 0).toLocaleString()}`);
    console.log(`Projected Monthly Revenue: $${(revenue.projected_monthly_revenue || 0).toLocaleString()}`);
    console.log(`High Confidence Opportunities: ${revenue.high_confidence_opportunities || 0}`);
    
    console.log('\n📈 CONVERSION FUNNEL:');
    console.log('=====================');
    const funnel = data.conversion_funnel || {};
    console.log(`Total Opportunities: ${funnel.total_opportunities || 0}`);
    console.log(`Analysis → Engagement: ${funnel.analysis_to_engagement || 0} (${funnel.opportunity_to_engagement_rate || 0}%)`);
    console.log(`Engagement → Implementation: ${funnel.engagement_to_implementation || 0} (${funnel.engagement_to_implementation_rate || 0}%)`);
    console.log(`Implementation → Success: ${funnel.implementation_to_success || 0} (${funnel.implementation_to_success_rate || 0}%)`);
    console.log(`Overall Conversion Rate: ${funnel.overall_conversion_rate || 0}%`);
    
    console.log('\n🎖️ STRATEGIC POSITIONING:');
    console.log('=========================');
    const strategic = data.strategic_positioning || {};
    console.log(`Crisis Response Positioning: ${strategic.crisis_response_positioning?.china_supplier_opportunities || 0} opportunities`);
    console.log(`Exclusive Network Positioning: ${strategic.competitive_differentiation?.exclusive_network_positioning || 0} clients`);
    console.log(`Immediate ROI Opportunities: ${strategic.value_proposition_strength?.immediate_roi_opportunities || 0}`);
    
    console.log('\n💡 KEY BUSINESS INSIGHT:');
    console.log('========================');
    console.log('✅ Every "not qualified" result = Major business opportunity for Triangle Intelligence');
    console.log('✅ Traditional compliance tools show failure - we show value creation pathway');
    console.log('✅ China crisis creates urgency - we provide immediate Mexico alternatives');
    console.log('✅ Our exclusive supplier network differentiates from commodity tools');
    console.log(`✅ Current pipeline: $${(revenue.triangle_revenue_opportunity || 0).toLocaleString()} annual revenue opportunity`);
    
    if (data.data_status?.using_sample_data) {
      console.log('\n📝 Note: Dashboard showing sample data - connects to real qualification results when available');
    }

  } catch (error) {
    console.error('🚨 Dashboard test failed:', error.message);
  }
}

testOpportunityDashboard();