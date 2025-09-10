/**
 * Generate Customer Impacts and Business Opportunities (Fixed UUID version)
 * Creates the business intelligence layer that drives Mexico routing recommendations
 */

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generatePolicyOpportunitiesFixed() {
  console.log('🎯 GENERATING TRUMP POLICY BUSINESS OPPORTUNITIES (FIXED)');
  console.log('=======================================================');
  console.log('Creating customer impacts and Mexico routing opportunities with proper UUIDs...\n');

  try {
    // Get all policy events
    const { data: policyEvents, error: eventsError } = await supabase
      .from('trump_policy_events')
      .select('*')
      .order('event_date', { ascending: false });

    if (eventsError) {
      console.error('❌ Error fetching policy events:', eventsError.message);
      return { success: false, error: eventsError.message };
    }

    console.log(`📊 Found ${policyEvents.length} policy events to process`);

    // Simulate realistic customer portfolios with proper UUIDs
    const customers = [
      {
        id: randomUUID(),
        business_type: 'electronics_manufacturers',
        company_name: 'TechCorp Electronics',
        china_exposure: 0.75,
        annual_import_value: 2500000,
        primary_products: ['smartphones', 'laptops', 'components'],
        segments: ['electronics_manufacturers', 'tech_companies']
      },
      {
        id: randomUUID(),
        business_type: 'automotive_suppliers', 
        company_name: 'AutoParts Global',
        china_exposure: 0.45,
        annual_import_value: 5000000,
        primary_products: ['brake_systems', 'electronics', 'interior_components'],
        segments: ['automotive_suppliers']
      },
      {
        id: randomUUID(),
        business_type: 'fashion_retailers',
        company_name: 'Fashion Forward Inc',
        china_exposure: 0.85,
        annual_import_value: 1200000,
        primary_products: ['clothing', 'accessories', 'footwear'],
        segments: ['fashion_retailers']
      },
      {
        id: randomUUID(),
        business_type: 'steel_importers',
        company_name: 'MetalWorks Industries',
        china_exposure: 0.60,
        annual_import_value: 8000000,
        primary_products: ['steel_sheets', 'construction_materials'],
        segments: ['steel_importers', 'construction_companies']
      },
      {
        id: randomUUID(),
        business_type: 'tech_companies',
        company_name: 'ChipTech Solutions',
        china_exposure: 0.90,
        annual_import_value: 15000000,
        primary_products: ['semiconductors', 'circuit_boards'],
        segments: ['tech_companies', 'electronics_manufacturers']
      }
    ];

    console.log('👥 Customer Portfolio:');
    customers.forEach((customer, i) => {
      console.log(`   ${i + 1}. ${customer.company_name} (${customer.business_type})`);
      console.log(`      China Exposure: ${customer.china_exposure * 100}% | Import Value: $${customer.annual_import_value.toLocaleString()}`);
    });

    let totalImpacts = 0;
    let totalOpportunities = 0;
    let totalOpportunityValue = 0;
    let totalCustomerImpact = 0;

    // Clear existing impacts and opportunities
    await supabase.from('customer_policy_impacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('policy_business_opportunities').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Process each policy event
    for (const event of policyEvents) {
      console.log(`\n🔍 Processing: ${event.policy_title}`);

      // Find affected customers for this event
      const affectedCustomers = customers.filter(customer => {
        // Check if customer segments are affected
        const segmentMatch = event.affected_customer_segments?.some(segment => 
          customer.segments.includes(segment)
        ) || event.affected_customer_segments?.includes('all_importers');

        // Check if customer has significant China exposure
        const chinaExposureSignificant = customer.china_exposure > 0.2;

        return segmentMatch && chinaExposureSignificant;
      });

      console.log(`   📊 Affected customers: ${affectedCustomers.length}`);

      // Generate customer impacts
      for (const customer of affectedCustomers) {
        try {
          // Calculate impact based on event severity and customer exposure
          let impactMultiplier = 0.1; // Base 10% impact
          switch (event.impact_severity) {
            case 'critical': impactMultiplier = 0.25; break;
            case 'high': impactMultiplier = 0.15; break;
            case 'medium': impactMultiplier = 0.08; break;
            case 'low': impactMultiplier = 0.05; break;
          }

          const costImpact = customer.annual_import_value * customer.china_exposure * impactMultiplier;
          
          // Calculate disruption score (1-10 scale)
          let severityScore = 0;
          switch (event.impact_severity) {
            case 'critical': severityScore = 10; break;
            case 'high': severityScore = 8; break;
            case 'medium': severityScore = 6; break;
            case 'low': severityScore = 4; break;
          }
          
          const disruptionScore = Math.min(10, Math.round(customer.china_exposure * severityScore));

          // Create customer impact record
          const { data: impact, error: impactError } = await supabase
            .from('customer_policy_impacts')
            .insert({
              policy_event_id: event.id,
              customer_id: customer.id,
              customer_business_type: customer.business_type,
              affected_products: {
                primary_products: customer.primary_products,
                company_name: customer.company_name,
                china_exposure_percentage: customer.china_exposure * 100
              },
              estimated_cost_impact: Math.round(costImpact),
              supply_chain_disruption_score: disruptionScore,
              mexico_routing_recommended: event.mexico_routing_opportunity && disruptionScore >= 6
            })
            .select()
            .single();

          if (impactError) {
            console.warn(`   ⚠️ Error creating impact for ${customer.company_name}:`, impactError.message);
          } else {
            totalImpacts++;
            totalCustomerImpact += costImpact;
            console.log(`   ✅ ${customer.company_name}: $${Math.round(costImpact).toLocaleString()} impact (disruption: ${disruptionScore}/10)`);

            // Generate business opportunity if Mexico routing is recommended
            if (event.mexico_routing_opportunity && disruptionScore >= 6) {
              const serviceFeeRATIO = 0.10; // 10% service fee on savings facilitated
              const opportunityValue = costImpact * serviceFeeRATIO;

              // Determine opportunity type and messaging
              let opportunityType = 'mexico_routing';
              let mexicoAdvantage = 'Exclusive Triangle Intelligence supplier network access';
              let timelineAdvantage = 'Strategic 45-60 day transition timeline';

              if (event.implementation_timeline === 'immediate') {
                opportunityType = 'emergency_routing';
                timelineAdvantage = 'Emergency 30-day transition capability';
              }

              if (event.china_supplier_risk_level === 'extreme') {
                mexicoAdvantage += ' with crisis-tested transition protocols';
              }

              const { data: opportunity, error: oppError } = await supabase
                .from('policy_business_opportunities')
                .insert({
                  policy_event_id: event.id,
                  customer_id: customer.id,
                  opportunity_type: opportunityType,
                  opportunity_description: `Mexico triangle routing solution for ${customer.company_name} to mitigate China supplier risk from "${event.policy_title}"`,
                  estimated_value: Math.round(opportunityValue),
                  probability_score: event.implementation_probability || 0.7,
                  china_risk_mitigation_value: Math.round(costImpact),
                  mexico_supplier_advantage: mexicoAdvantage,
                  timeline_advantage: timelineAdvantage,
                  exclusive_network_access: true
                })
                .select()
                .single();

              if (oppError) {
                console.warn(`   ⚠️ Error creating opportunity for ${customer.company_name}:`, oppError.message);
              } else {
                totalOpportunities++;
                totalOpportunityValue += opportunityValue;
                console.log(`   💰 Business opportunity: $${Math.round(opportunityValue).toLocaleString()} (${opportunityType})`);
              }
            } else if (disruptionScore < 6) {
              console.log(`   ℹ️ ${customer.company_name}: Low disruption score (${disruptionScore}/10) - monitoring only`);
            }
          }

        } catch (error) {
          console.warn(`   ⚠️ Error processing ${customer.company_name}:`, error.message);
        }
      }
    }

    console.log('\n📊 GENERATION SUMMARY:');
    console.log(`✅ Customer impacts created: ${totalImpacts}`);
    console.log(`✅ Business opportunities created: ${totalOpportunities}`);
    console.log(`💰 Total opportunity value: $${Math.round(totalOpportunityValue).toLocaleString()}`);
    console.log(`⚠️ Total customer cost impact: $${Math.round(totalCustomerImpact).toLocaleString()}`);

    // Calculate competitive advantage metrics
    const { data: criticalRiskData } = await supabase
      .from('customer_policy_impacts')
      .select('count', { count: 'exact', head: true })
      .gte('supply_chain_disruption_score', 8);

    const criticalChinaRiskCases = criticalRiskData || 0;
    const averageOpportunitySize = totalOpportunities > 0 ? totalOpportunityValue / totalOpportunities : 0;
    const captureRatio = totalCustomerImpact > 0 ? (totalOpportunityValue / totalCustomerImpact) * 100 : 0;

    console.log('\n🎯 COMPETITIVE INTELLIGENCE SUMMARY:');
    console.log(`🇲🇽 Mexico routing opportunities: ${totalOpportunities}`);
    console.log(`🚨 Critical China risk cases: ${criticalChinaRiskCases}`);
    console.log(`📈 Average opportunity size: $${Math.round(averageOpportunitySize).toLocaleString()}`);
    console.log(`⚡ Crisis response advantage: ${Math.round(captureRatio)}% of customer impact capturable as Triangle Intelligence revenue`);

    return {
      success: true,
      customerImpacts: totalImpacts,
      businessOpportunities: totalOpportunities,
      totalOpportunityValue: Math.round(totalOpportunityValue),
      totalCustomerImpact: Math.round(totalCustomerImpact),
      mexicoRoutingOpportunities: totalOpportunities,
      averageOpportunitySize: Math.round(averageOpportunitySize),
      captureRatio: Math.round(captureRatio)
    };

  } catch (error) {
    console.error('\n❌ POLICY BUSINESS OPPORTUNITIES GENERATION: FAILED');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

generatePolicyOpportunitiesFixed().then(result => {
  if (result && result.success) {
    console.log('\n🎉 TRUMP POLICY BUSINESS INTELLIGENCE: FULLY OPERATIONAL');
    console.log('=====================================================');
    console.log('✅ Customer impact analysis complete');
    console.log('✅ Mexico routing opportunities identified');
    console.log('✅ Business pipeline generated from policy intelligence');
    console.log(`✅ Revenue opportunity: $${result.totalOpportunityValue?.toLocaleString()}`);
    console.log(`✅ Customer cost impact: $${result.totalCustomerImpact?.toLocaleString()}`);
    console.log(`✅ Triangle Intelligence capture ratio: ${result.captureRatio}%`);
    console.log('\n🚀 Triangle Intelligence crisis response advantage fully activated');
    console.log('🇲🇽 Policy-driven Mexico routing recommendations operational');
    console.log('📊 Crisis intelligence system positioning: MARKET LEADER');
  } else {
    console.log('\n🛠️ NEEDS ATTENTION: Policy business intelligence generation failed');
  }
}).catch(console.error);