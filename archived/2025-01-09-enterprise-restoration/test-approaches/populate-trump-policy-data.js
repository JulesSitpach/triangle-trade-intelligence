/**
 * Populate Trump Policy Events Database
 * Initializes the policy intelligence system with realistic policy events
 * Tests the complete crisis response and Mexico routing integration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SAMPLE_POLICY_EVENTS = [
  {
    event_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    event_type: 'tariff',
    announcement_medium: 'truth_social',
    policy_title: 'Additional 25% Tariffs on Chinese Electronics',
    policy_description: 'New tariffs announced targeting Chinese-manufactured electronics and automotive components, effective in 30 days. Affects semiconductors, consumer electronics, and automotive parts.',
    affected_countries: ['China'],
    affected_industries: ['electronics', 'automotive'],
    affected_hs_codes: ['8471', '8473', '8544', '8537', '8708'],
    impact_severity: 'critical',
    implementation_timeline: '30_days',
    implementation_probability: 0.85,
    market_reaction_score: -7,
    stock_impact_sectors: ['technology', 'automotive'],
    china_supplier_risk_level: 'extreme',
    mexico_routing_opportunity: true,
    urgent_customer_notification: true,
    affected_customer_segments: ['electronics_manufacturers', 'automotive_suppliers'],
    recommended_actions: {
      immediate_actions: [
        'Review China supplier exposure',
        'Activate Mexico supplier network',
        'Assess tariff impact on current orders'
      ],
      mexico_routing: 'Available for 95% of affected components',
      timeline: 'Transition possible within 45 days',
      triangle_advantage: 'Exclusive Mexico electronics manufacturing network'
    },
    policy_details: {
      tariff_rate: '25%',
      effective_date: '2025-10-09',
      exemptions: ['medical devices', 'safety equipment'],
      enforcement_agency: 'CBP'
    }
  },
  {
    event_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    event_type: 'supplier_restriction',
    announcement_medium: 'executive_order',
    policy_title: 'China Semiconductor Supply Chain Restrictions',
    policy_description: 'Executive order restricting certain Chinese semiconductor suppliers from US market. Immediate effect on advanced chip imports.',
    affected_countries: ['China'],
    affected_industries: ['electronics', 'telecommunications', 'automotive'],
    affected_hs_codes: ['8541', '8542'],
    impact_severity: 'critical',
    implementation_timeline: 'immediate',
    implementation_probability: 0.95,
    market_reaction_score: -9,
    stock_impact_sectors: ['technology', 'telecommunications'],
    china_supplier_risk_level: 'extreme',
    mexico_routing_opportunity: true,
    urgent_customer_notification: true,
    affected_customer_segments: ['electronics_manufacturers', 'tech_companies'],
    recommended_actions: {
      immediate_actions: [
        'Audit semiconductor supply chain',
        'Identify Mexico assembly alternatives',
        'Review current inventory levels'
      ],
      mexico_routing: 'Established Mexico semiconductor assembly capabilities',
      timeline: 'Emergency transition protocols available',
      triangle_advantage: 'Crisis-tested Mexico tech manufacturing partners'
    },
    policy_details: {
      restricted_entities: ['SMIC', 'YMTC'],
      enforcement_date: '2025-09-08',
      penalties: 'Supply chain disruption, legal liability'
    }
  },
  {
    event_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    event_type: 'trade_agreement',
    announcement_medium: 'press_conference',
    policy_title: 'Enhanced USMCA Enforcement Measures',
    policy_description: 'Stricter enforcement of USMCA origin requirements with expedited Mexico routing benefits and enhanced qualification pathways.',
    affected_countries: ['Mexico', 'Canada'],
    affected_industries: ['automotive', 'textiles', 'manufacturing'],
    affected_hs_codes: ['8708', '6204', '6203', '9401'],
    impact_severity: 'medium',
    implementation_timeline: '90_days',
    implementation_probability: 0.75,
    market_reaction_score: 3,
    stock_impact_sectors: ['manufacturing', 'automotive'],
    china_supplier_risk_level: 'low',
    mexico_routing_opportunity: true,
    canada_alternative_potential: true,
    urgent_customer_notification: false,
    affected_customer_segments: ['manufacturers', 'automotive_suppliers', 'fashion_retailers'],
    recommended_actions: {
      immediate_actions: [
        'Review USMCA qualification status',
        'Optimize Mexico content percentage',
        'Evaluate Canada sourcing options'
      ],
      mexico_routing: 'Enhanced qualification pathways available',
      timeline: 'Mexico routing qualification within 60 days',
      triangle_advantage: 'USMCA expertise and established North American network'
    },
    policy_details: {
      new_requirements: ['Enhanced origin verification', 'Digital certificates'],
      benefits: ['Faster customs processing', 'Reduced audit risk'],
      compliance_date: '2025-12-01'
    }
  },
  {
    event_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    event_type: 'border_policy',
    announcement_medium: 'rally',
    policy_title: 'Increased Border Inspections for Chinese Goods',
    policy_description: 'Enhanced customs inspections for Chinese imports, increasing processing times and compliance requirements.',
    affected_countries: ['China'],
    affected_industries: ['all_imports'],
    affected_hs_codes: [], // Affects all Chinese imports
    impact_severity: 'high',
    implementation_timeline: 'immediate',
    implementation_probability: 0.70,
    market_reaction_score: -4,
    stock_impact_sectors: ['retail', 'manufacturing'],
    china_supplier_risk_level: 'high',
    mexico_routing_opportunity: true,
    urgent_customer_notification: true,
    affected_customer_segments: ['all_importers'],
    recommended_actions: {
      immediate_actions: [
        'Expect shipping delays from China',
        'Consider Mexico routing for time-sensitive goods',
        'Review compliance documentation'
      ],
      mexico_routing: 'Faster border processing for USMCA-qualified goods',
      timeline: 'Immediate shipping advantage via Mexico',
      triangle_advantage: 'Established customs relationships and expedited processing'
    },
    policy_details: {
      inspection_rate_increase: '300%',
      average_delay: '5-10 days',
      affected_ports: ['Los Angeles', 'Long Beach', 'New York']
    }
  },
  {
    event_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    event_type: 'sanctions',
    announcement_medium: 'executive_order',
    policy_title: 'Financial Sanctions on Chinese Steel Producers',
    policy_description: 'New financial sanctions targeting major Chinese steel producers, affecting payment processing and supply agreements.',
    affected_countries: ['China'],
    affected_industries: ['steel', 'construction', 'automotive'],
    affected_hs_codes: ['7208', '7209', '7210', '7211'],
    impact_severity: 'high',
    implementation_timeline: 'immediate',
    implementation_probability: 0.90,
    market_reaction_score: -6,
    stock_impact_sectors: ['steel', 'construction'],
    china_supplier_risk_level: 'extreme',
    mexico_routing_opportunity: true,
    urgent_customer_notification: true,
    affected_customer_segments: ['steel_importers', 'construction_companies', 'automotive_suppliers'],
    recommended_actions: {
      immediate_actions: [
        'Review steel supplier agreements',
        'Identify Mexico steel alternatives',
        'Assess payment processing compliance'
      ],
      mexico_routing: 'Mexico steel industry USMCA-qualified alternatives available',
      timeline: 'Emergency steel sourcing within 30 days',
      triangle_advantage: 'Established Mexico steel producer relationships'
    },
    policy_details: {
      sanctioned_entities: ['Baosteel', 'Ansteel'],
      financial_restrictions: ['Payment processing', 'Letters of credit'],
      compliance_deadline: '2025-09-15'
    }
  }
];

async function populateTrumpPolicyData() {
  console.log('🚨 POPULATING TRUMP POLICY INTELLIGENCE DATABASE');
  console.log('================================================');
  console.log('Initializing policy intelligence system for crisis response positioning...\n');

  try {
    // Clear existing policy events
    console.log('🧹 Clearing existing policy events...');
    const { error: deleteError } = await supabase
      .from('trump_policy_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('⚠️ Warning clearing policy events:', deleteError.message);
    }

    // Insert sample policy events
    console.log('📡 Inserting Trump policy events...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const event of SAMPLE_POLICY_EVENTS) {
      try {
        const { data, error } = await supabase
          .from('trump_policy_events')
          .insert(event)
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to insert ${event.policy_title}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ ${event.policy_title} (${event.event_type}) - Impact: ${event.impact_severity}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error inserting ${event.policy_title}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 INSERTION SUMMARY:');
    console.log(`✅ Successfully inserted: ${successCount} policy events`);
    console.log(`❌ Failed insertions: ${errorCount} policy events`);

    // Verify policy events were inserted
    console.log('\n🔍 Verifying policy events in database...');
    const { data: verifyEvents, error: verifyError } = await supabase
      .from('trump_policy_events')
      .select('id, policy_title, event_type, impact_severity, china_supplier_risk_level, mexico_routing_opportunity')
      .order('event_date', { ascending: false });

    if (verifyError) {
      console.error('❌ Failed to verify policy events:', verifyError.message);
      return false;
    }

    console.log(`📊 Total policy events in database: ${verifyEvents.length}`);
    
    verifyEvents.forEach((event, i) => {
      const chinaRisk = event.china_supplier_risk_level === 'extreme' ? '🚨' : 
                       event.china_supplier_risk_level === 'high' ? '⚠️' : '🟡';
      const mexicoOpp = event.mexico_routing_opportunity ? '🇲🇽' : '➖';
      
      console.log(`   ${i + 1}. ${event.policy_title.substring(0, 50)}...`);
      console.log(`      Type: ${event.event_type} | Severity: ${event.impact_severity} | China Risk: ${chinaRisk} | Mexico Opp: ${mexicoOpp}`);
    });

    // Generate customer impacts and business opportunities
    console.log('\n🎯 GENERATING CUSTOMER IMPACTS AND BUSINESS OPPORTUNITIES...');
    
    const customerImpacts = await generateCustomerImpacts(verifyEvents);
    const businessOpportunities = await generateBusinessOpportunities(verifyEvents, customerImpacts);

    console.log(`📊 Customer impacts generated: ${customerImpacts.length}`);
    console.log(`💰 Business opportunities created: ${businessOpportunities.length}`);

    // Calculate total business value
    const totalOpportunityValue = businessOpportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);
    const totalCustomerImpact = customerImpacts.reduce((sum, imp) => sum + (imp.estimated_cost_impact || 0), 0);

    console.log('\n💼 BUSINESS IMPACT SUMMARY:');
    console.log(`💰 Total Business Opportunity Value: $${totalOpportunityValue.toLocaleString()}`);
    console.log(`⚠️ Total Customer Cost Impact: $${totalCustomerImpact.toLocaleString()}`);
    console.log(`🇲🇽 Mexico Routing Opportunities: ${businessOpportunities.filter(opp => opp.opportunity_type === 'mexico_routing').length}`);
    console.log(`🚨 Critical China Risk Cases: ${customerImpacts.filter(imp => imp.supply_chain_disruption_score >= 8).length}`);

    return {
      success: true,
      policyEventsPopulated: successCount,
      customerImpacts: customerImpacts.length,
      businessOpportunities: businessOpportunities.length,
      totalOpportunityValue,
      totalCustomerImpact
    };

  } catch (error) {
    console.error('\n❌ TRUMP POLICY DATA POPULATION: FAILED');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate customer impacts for policy events
 */
async function generateCustomerImpacts(policyEvents) {
  const impacts = [];
  
  // Simulate customer portfolios
  const customers = [
    { id: 'customer-electronics-1', business_type: 'electronics_manufacturers', china_exposure: 0.75, annual_import_value: 2500000 },
    { id: 'customer-automotive-1', business_type: 'automotive_suppliers', china_exposure: 0.45, annual_import_value: 5000000 },
    { id: 'customer-fashion-1', business_type: 'fashion_retailers', china_exposure: 0.85, annual_import_value: 1200000 },
    { id: 'customer-steel-1', business_type: 'steel_importers', china_exposure: 0.60, annual_import_value: 8000000 },
    { id: 'customer-tech-1', business_type: 'tech_companies', china_exposure: 0.90, annual_import_value: 15000000 }
  ];

  for (const event of policyEvents) {
    for (const customer of customers) {
      // Check if customer is affected
      const isAffected = event.affected_customer_segments?.includes(customer.business_type) ||
                        event.affected_customer_segments?.includes('all_importers');
      
      if (isAffected && customer.china_exposure > 0.2) {
        // Calculate impact based on event severity and customer exposure
        let impactMultiplier = 0.1; // Base 10% impact
        if (event.impact_severity === 'critical') impactMultiplier = 0.25;
        else if (event.impact_severity === 'high') impactMultiplier = 0.15;
        
        const costImpact = customer.annual_import_value * customer.china_exposure * impactMultiplier;
        const disruptionScore = Math.min(10, Math.round(customer.china_exposure * 
          (event.impact_severity === 'critical' ? 10 : event.impact_severity === 'high' ? 8 : 6)));

        try {
          const { data: impact } = await supabase
            .from('customer_policy_impacts')
            .insert({
              policy_event_id: event.id,
              customer_id: customer.id,
              customer_business_type: customer.business_type,
              estimated_cost_impact: costImpact,
              supply_chain_disruption_score: disruptionScore,
              mexico_routing_recommended: event.mexico_routing_opportunity && disruptionScore >= 6
            })
            .select()
            .single();

          if (impact) impacts.push(impact);
        } catch (error) {
          console.warn(`⚠️ Error creating customer impact for ${customer.id}:`, error.message);
        }
      }
    }
  }

  return impacts;
}

/**
 * Generate business opportunities from customer impacts
 */
async function generateBusinessOpportunities(policyEvents, customerImpacts) {
  const opportunities = [];

  for (const impact of customerImpacts) {
    const event = policyEvents.find(e => e.id === impact.policy_event_id);
    
    if (event && event.mexico_routing_opportunity && impact.supply_chain_disruption_score >= 6) {
      // Calculate opportunity value (Triangle Intelligence service fee)
      const serviceFeeFRATION = 0.10; // 10% service fee
      const opportunityValue = impact.estimated_cost_impact * serviceFeeFRATION;
      
      try {
        const { data: opportunity } = await supabase
          .from('policy_business_opportunities')
          .insert({
            policy_event_id: event.id,
            customer_id: impact.customer_id,
            opportunity_type: 'mexico_routing',
            opportunity_description: `Mexico triangle routing to mitigate China supplier risk from ${event.policy_title}`,
            estimated_value: opportunityValue,
            probability_score: 0.7,
            china_risk_mitigation_value: impact.estimated_cost_impact,
            mexico_supplier_advantage: 'Exclusive Triangle Intelligence supplier network access',
            timeline_advantage: event.implementation_timeline === 'immediate' ? 
              'Emergency 30-day transition capability' : 'Strategic 45-60 day transition timeline'
          })
          .select()
          .single();

        if (opportunity) opportunities.push(opportunity);
      } catch (error) {
        console.warn(`⚠️ Error creating business opportunity:`, error.message);
      }
    }
  }

  return opportunities;
}

populateTrumpPolicyData().then(result => {
  if (result && result.success) {
    console.log('\n🎉 TRUMP POLICY INTELLIGENCE SYSTEM: FULLY OPERATIONAL');
    console.log('=====================================================');
    console.log('✅ Policy intelligence database populated');
    console.log('✅ Customer impact analysis complete');
    console.log('✅ Business opportunity pipeline generated');
    console.log(`✅ Total revenue opportunity: $${result.totalOpportunityValue?.toLocaleString()}`);
    console.log('\n🚀 Triangle Intelligence positioned as crisis intelligence leader');
    console.log('🇲🇽 Mexico routing competitive advantage fully activated');
  } else {
    console.log('\n🛠️ NEEDS ATTENTION: Trump policy intelligence setup requires debugging');
  }
}).catch(console.error);