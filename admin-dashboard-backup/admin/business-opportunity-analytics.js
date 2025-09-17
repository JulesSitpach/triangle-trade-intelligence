/**
 * ADMIN API: Business Opportunity Analytics
 * GET /api/admin/business-opportunity-analytics - Shows how "not qualified" results create business value
 * Tracks Triangle Intelligence solution positioning and Mexico triangle routing opportunities
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get timeframe from query params
    const { timeframe = '30days' } = req.query;
    const daysBack = getDaysFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Query qualification results to track business opportunities
    const { data: qualificationResults, error: qualError } = await supabase
      .from('usmca_qualification_results')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Query workflow completions for opportunity tracking
    const { data: workflows, error: workflowError } = await supabase
      .from('workflow_completions')
      .select('*')
      .gte('completed_at', startDate.toISOString());

    // Query Mexico supplier connections for conversion tracking
    const { data: supplierConnections, error: supplierError } = await supabase
      .from('mexico_supplier_connections')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // If tables don't exist, use sample opportunity data
    const qualificationData = qualificationResults || generateSampleQualificationData();
    const workflowData = workflows || generateSampleWorkflowData();
    const supplierData = supplierConnections || generateSampleSupplierData();

    // Calculate business opportunity analytics
    const analytics = calculateBusinessOpportunityAnalytics(
      qualificationData, 
      workflowData, 
      supplierData, 
      startDate
    );

    return res.status(200).json({
      ...analytics,
      timeframe,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      data_status: {
        qualification_results_available: qualificationResults !== null,
        workflow_data_available: workflows !== null,
        supplier_connections_available: supplierConnections !== null,
        using_sample_data: qualificationResults === null
      }
    });

  } catch (error) {
    console.error('Business opportunity analytics error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Calculate comprehensive business opportunity analytics
 */
function calculateBusinessOpportunityAnalytics(qualifications, workflows, suppliers, startDate) {
  // Qualification outcome analysis
  const qualificationAnalysis = analyzeQualificationOutcomes(qualifications);
  
  // Business opportunity metrics
  const opportunityMetrics = calculateOpportunityMetrics(qualifications, workflows);
  
  // Mexico triangle routing performance
  const mexicoRouting = analyzeMexicoRoutingOpportunities(qualifications, suppliers);
  
  // Revenue opportunity pipeline
  const revenuePipeline = calculateRevenuePipeline(qualifications, workflows, suppliers);
  
  // Conversion funnel metrics
  const conversionFunnel = calculateConversionFunnel(qualifications, workflows, suppliers);
  
  // Strategic positioning metrics
  const strategicMetrics = calculateStrategicPositioning(qualifications);

  return {
    // Core opportunity metrics
    qualification_analysis: qualificationAnalysis,
    opportunity_metrics: opportunityMetrics,
    
    // Mexico triangle routing
    mexico_routing_performance: mexicoRouting,
    
    // Revenue and conversion
    revenue_pipeline: revenuePipeline,
    conversion_funnel: conversionFunnel,
    
    // Strategic positioning
    strategic_positioning: strategicMetrics,
    
    // Summary KPIs
    summary_kpis: {
      total_opportunities_identified: qualificationAnalysis.not_qualified_count,
      total_opportunity_value: revenuePipeline.total_annual_opportunity_value,
      avg_opportunity_value: revenuePipeline.avg_opportunity_value,
      conversion_rate: conversionFunnel.opportunity_to_engagement_rate,
      mexico_routing_adoption: mexicoRouting.mexico_adoption_rate
    }
  };
}

/**
 * Analyze qualification outcomes to identify business opportunities
 */
function analyzeQualificationOutcomes(qualifications) {
  const qualified = qualifications.filter(q => q.qualified === true);
  const notQualified = qualifications.filter(q => q.qualified === false);
  
  // Gap analysis for not qualified
  const gapDistribution = {
    quick_wins: notQualified.filter(q => (q.gap_percentage || 0) <= 10).length,
    strategic_opportunities: notQualified.filter(q => (q.gap_percentage || 0) > 10 && (q.gap_percentage || 0) <= 25).length,
    transformation_opportunities: notQualified.filter(q => (q.gap_percentage || 0) > 25).length
  };
  
  // Business types with highest opportunity rates
  const businessTypeOpportunities = calculateBusinessTypeOpportunities(notQualified);
  
  // China supplier crisis opportunities
  const chinaOpportunities = notQualified.filter(q => 
    q.component_origins?.some(c => c.origin_country?.toUpperCase() === 'CHINA')
  ).length;

  return {
    total_qualifications: qualifications.length,
    qualified_count: qualified.length,
    not_qualified_count: notQualified.length,
    qualification_rate: qualifications.length > 0 ? 
      Math.round((qualified.length / qualifications.length) * 1000) / 10 : 0,
    opportunity_rate: qualifications.length > 0 ? 
      Math.round((notQualified.length / qualifications.length) * 1000) / 10 : 0,
    
    gap_distribution: gapDistribution,
    business_type_opportunities: businessTypeOpportunities,
    china_crisis_opportunities: chinaOpportunities,
    
    // Opportunity categorization
    immediate_opportunities: gapDistribution.quick_wins,
    strategic_opportunities: gapDistribution.strategic_opportunities,
    transformation_opportunities: gapDistribution.transformation_opportunities
  };
}

/**
 * Calculate opportunity metrics and potential value
 */
function calculateOpportunityMetrics(qualifications, workflows) {
  const notQualified = qualifications.filter(q => q.qualified === false);
  
  // Calculate total potential savings from gaps
  const totalPotentialSavings = notQualified.reduce((sum, q) => {
    const potential = q.potential_annual_savings || (q.gap_percentage * 1000) || 5000;
    return sum + potential;
  }, 0);
  
  // Average opportunity value
  const avgOpportunityValue = notQualified.length > 0 ? 
    totalPotentialSavings / notQualified.length : 0;
  
  // High-value opportunities (>$50K potential)
  const highValueOpportunities = notQualified.filter(q => 
    (q.potential_annual_savings || 0) > 50000
  ).length;
  
  // Quick win opportunities (<10% gap)
  const quickWinValue = notQualified
    .filter(q => (q.gap_percentage || 0) <= 10)
    .reduce((sum, q) => sum + (q.potential_annual_savings || 10000), 0);

  return {
    total_potential_savings: Math.round(totalPotentialSavings),
    avg_opportunity_value: Math.round(avgOpportunityValue),
    high_value_opportunities: highValueOpportunities,
    quick_win_opportunities: notQualified.filter(q => (q.gap_percentage || 0) <= 10).length,
    quick_win_total_value: Math.round(quickWinValue),
    
    // Opportunity distribution by value
    value_distribution: [
      {
        range: '$5K - $25K',
        count: notQualified.filter(q => {
          const val = q.potential_annual_savings || 10000;
          return val >= 5000 && val < 25000;
        }).length
      },
      {
        range: '$25K - $100K',
        count: notQualified.filter(q => {
          const val = q.potential_annual_savings || 10000;
          return val >= 25000 && val < 100000;
        }).length
      },
      {
        range: '$100K+',
        count: notQualified.filter(q => {
          const val = q.potential_annual_savings || 10000;
          return val >= 100000;
        }).length
      }
    ]
  };
}

/**
 * Analyze Mexico triangle routing opportunities
 */
function analyzeMexicoRoutingOpportunities(qualifications, suppliers) {
  const notQualified = qualifications.filter(q => q.qualified === false);
  
  // Mexico-relevant opportunities
  const mexicoOpportunities = notQualified.filter(q => 
    q.remediation_strategies?.some(s => s.includes('Mexico')) ||
    q.mexico_opportunities?.length > 0
  );
  
  // China to Mexico transitions (highest priority)
  const chinaTransitions = notQualified.filter(q =>
    q.component_origins?.some(c => c.origin_country?.toUpperCase() === 'CHINA') &&
    q.mexico_opportunities?.length > 0
  );
  
  // Supplier connections made
  const supplierConnections = suppliers.length;
  const mexicos = suppliers.filter(s => s.supplier_country === 'Mexico').length;
  
  return {
    total_mexico_opportunities: mexicoOpportunities.length,
    china_to_mexico_transitions: chinaTransitions.length,
    mexico_adoption_rate: notQualified.length > 0 ? 
      Math.round((mexicoOpportunities.length / notQualified.length) * 1000) / 10 : 0,
    
    supplier_connections: {
      total_connections: supplierConnections,
      mexico_connections: mexicos,
      mexico_connection_rate: supplierConnections > 0 ? 
        Math.round((mexicos / supplierConnections) * 1000) / 10 : 0
    },
    
    // Crisis response metrics
    crisis_response: {
      china_supplier_clients: chinaTransitions.length,
      urgent_diversification_opportunities: chinaTransitions.length,
      avg_china_risk_mitigation_value: chinaTransitions.length > 0 ?
        Math.round(chinaTransitions.reduce((sum, q) => 
          sum + (q.potential_annual_savings || 25000), 0) / chinaTransitions.length) : 0
    }
  };
}

/**
 * Calculate revenue pipeline from opportunities
 */
function calculateRevenuePipeline(qualifications, workflows, suppliers) {
  const notQualified = qualifications.filter(q => q.qualified === false);
  
  // Total annual opportunity value (customer savings potential)
  const totalOpportunityValue = notQualified.reduce((sum, q) => 
    sum + (q.potential_annual_savings || 15000), 0);
  
  // Triangle Intelligence revenue potential (assuming 10% of savings as service fee)
  const triangleRevenueOpportunity = totalOpportunityValue * 0.10;
  
  // Pipeline stages
  const pipeline = {
    identified_opportunities: notQualified.length,
    engaged_prospects: workflows.filter(w => w.status === 'in_progress').length,
    active_implementations: suppliers.length,
    completed_transformations: workflows.filter(w => w.status === 'completed').length
  };

  return {
    total_annual_opportunity_value: Math.round(totalOpportunityValue),
    triangle_revenue_opportunity: Math.round(triangleRevenueOpportunity),
    avg_opportunity_value: notQualified.length > 0 ? 
      Math.round(totalOpportunityValue / notQualified.length) : 0,
    
    pipeline_stages: pipeline,
    
    // Revenue projections
    projected_monthly_revenue: Math.round(triangleRevenueOpportunity / 12),
    high_confidence_opportunities: notQualified.filter(q => 
      (q.gap_percentage || 0) <= 15 && (q.potential_annual_savings || 0) > 20000
    ).length
  };
}

/**
 * Calculate conversion funnel metrics
 */
function calculateConversionFunnel(qualifications, workflows, suppliers) {
  const notQualified = qualifications.filter(q => q.qualified === false);
  const totalOpportunities = notQualified.length;
  
  // Conversion stages
  const analysisToEngagement = workflows.length;
  const engagementToImplementation = suppliers.length;
  const implementationToSuccess = workflows.filter(w => w.status === 'completed').length;
  
  return {
    total_opportunities: totalOpportunities,
    analysis_to_engagement: analysisToEngagement,
    engagement_to_implementation: engagementToImplementation,
    implementation_to_success: implementationToSuccess,
    
    // Conversion rates
    opportunity_to_engagement_rate: totalOpportunities > 0 ?
      Math.round((analysisToEngagement / totalOpportunities) * 1000) / 10 : 0,
    engagement_to_implementation_rate: analysisToEngagement > 0 ?
      Math.round((engagementToImplementation / analysisToEngagement) * 1000) / 10 : 0,
    implementation_to_success_rate: engagementToImplementation > 0 ?
      Math.round((implementationToSuccess / engagementToImplementation) * 1000) / 10 : 0,
    
    // Overall conversion
    overall_conversion_rate: totalOpportunities > 0 ?
      Math.round((implementationToSuccess / totalOpportunities) * 1000) / 10 : 0
  };
}

/**
 * Calculate strategic positioning metrics
 */
function calculateStrategicPositioning(qualifications) {
  const notQualified = qualifications.filter(q => q.qualified === false);
  
  // Strategic messaging analysis
  const crisisPositioning = notQualified.filter(q =>
    q.component_origins?.some(c => c.origin_country?.toUpperCase() === 'CHINA')
  ).length;
  
  const exclusiveNetworkPositioning = notQualified.filter(q =>
    q.mexico_opportunities?.some(o => o.triangle_advantage?.includes('exclusive'))
  ).length;
  
  return {
    crisis_response_positioning: {
      china_supplier_opportunities: crisisPositioning,
      urgent_diversification_messaging: crisisPositioning,
      crisis_response_rate: notQualified.length > 0 ?
        Math.round((crisisPositioning / notQualified.length) * 1000) / 10 : 0
    },
    
    competitive_differentiation: {
      exclusive_network_positioning: exclusiveNetworkPositioning,
      verified_supplier_advantage: notQualified.length, // All get this positioning
      triangle_intelligence_branding: notQualified.length
    },
    
    value_proposition_strength: {
      immediate_roi_opportunities: notQualified.filter(q => (q.gap_percentage || 0) <= 10).length,
      strategic_transformation_opportunities: notQualified.filter(q => (q.gap_percentage || 0) > 20).length,
      comprehensive_solution_positioning: notQualified.length
    }
  };
}

/**
 * Calculate business type opportunity distribution
 */
function calculateBusinessTypeOpportunities(notQualified) {
  const businessTypes = {};
  
  notQualified.forEach(q => {
    const businessType = q.business_type || 'Unknown';
    if (!businessTypes[businessType]) {
      businessTypes[businessType] = {
        count: 0,
        total_potential_savings: 0,
        avg_gap_percentage: 0
      };
    }
    
    businessTypes[businessType].count++;
    businessTypes[businessType].total_potential_savings += (q.potential_annual_savings || 10000);
    businessTypes[businessType].avg_gap_percentage += (q.gap_percentage || 0);
  });
  
  // Calculate averages
  Object.keys(businessTypes).forEach(type => {
    const data = businessTypes[type];
    data.avg_gap_percentage = data.count > 0 ? 
      Math.round((data.avg_gap_percentage / data.count) * 10) / 10 : 0;
    data.avg_potential_savings = data.count > 0 ? 
      Math.round(data.total_potential_savings / data.count) : 0;
  });
  
  return Object.entries(businessTypes).map(([type, data]) => ({
    business_type: type,
    ...data
  }));
}

/**
 * Generate sample qualification data for demo purposes
 */
function generateSampleQualificationData() {
  const businessTypes = ['Electronics', 'Automotive', 'Textiles', 'Machinery'];
  const countries = ['China', 'Vietnam', 'India', 'Mexico', 'Canada'];
  const sampleData = [];
  
  for (let i = 0; i < 50; i++) {
    const gapPercentage = Math.random() * 70; // 0-70% gap
    const qualified = gapPercentage < 10; // Qualified if gap < 10%
    const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    const hasChina = Math.random() > 0.6; // 40% have China suppliers
    
    sampleData.push({
      id: `sample_${i}`,
      qualified,
      business_type: businessType,
      gap_percentage: Math.round(gapPercentage * 10) / 10,
      potential_annual_savings: Math.round((gapPercentage * 1000 + Math.random() * 20000)),
      component_origins: hasChina ? [
        { origin_country: 'China', value_percentage: 60 + Math.random() * 30 }
      ] : [
        { origin_country: countries[Math.floor(Math.random() * countries.length)], value_percentage: 50 + Math.random() * 40 }
      ],
      remediation_strategies: qualified ? [] : [
        'Triangle Intelligence Mexico Bridge Program',
        'Strategic supplier transition'
      ],
      mexico_opportunities: qualified ? [] : [
        {
          strategy: 'Mexico Triangle Routing',
          triangle_advantage: 'exclusive network access'
        }
      ],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return sampleData;
}

/**
 * Generate sample workflow data
 */
function generateSampleWorkflowData() {
  const statuses = ['in_progress', 'completed', 'pending'];
  const sampleData = [];
  
  for (let i = 0; i < 15; i++) {
    sampleData.push({
      id: `workflow_${i}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      savings_amount: 5000 + Math.random() * 45000,
      completed_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return sampleData;
}

/**
 * Generate sample supplier connection data
 */
function generateSampleSupplierData() {
  const countries = ['Mexico', 'Canada', 'US'];
  const sampleData = [];
  
  for (let i = 0; i < 8; i++) {
    sampleData.push({
      id: `supplier_${i}`,
      supplier_country: countries[Math.floor(Math.random() * countries.length)],
      connection_type: 'triangle_intelligence_introduction',
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return sampleData;
}

/**
 * Convert timeframe string to days
 */
function getDaysFromTimeframe(timeframe) {
  switch (timeframe) {
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    case '1year': return 365;
    default: return 30;
  }
}