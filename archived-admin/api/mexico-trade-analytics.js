/**
 * MEXICO TRADE ANALYTICS API
 * Supabase integration for Mexico-focused trade intelligence
 * NO HARDCODED VALUES - Database driven analytics
 */

import { createClient } from '@supabase/supabase-js';

// Direct Supabase connection for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeframe = '30days' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90));

    // Query 1: USMCA Certificate Generation Statistics
    const { data: certificates, error: certError } = await supabase
      .from('usmca_certificates')
      .select('id, created_at, certificate_status, total_savings')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (certError) console.error('Certificate query error:', certError);

    // Query 2: Mexico Tariff Savings Analysis
    const { data: tariffSavings, error: tariffError } = await supabase
      .from('tariff_analysis_results')
      .select('id, created_at, mexico_savings, total_potential_savings, hs_code')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (tariffError) console.error('Tariff savings query error:', tariffError);

    // Query 3: Triangle Routing Opportunities
    const { data: routingOps, error: routingError } = await supabase
      .from('triangle_routing_opportunities')
      .select('id, created_at, origin_country, destination_country, savings_percentage')
      .eq('intermediate_country', 'Mexico')
      .gte('created_at', startDate.toISOString());

    if (routingError) console.error('Routing opportunities query error:', routingError);

    // Query 4: User Engagement with Mexico Features
    const { data: userEngagement, error: engagementError } = await supabase
      .from('workflow_completions')
      .select('id, created_at, user_id, workflow_type, completion_status')
      .in('workflow_type', ['usmca_compliance', 'mexico_routing', 'certificate_generation'])
      .gte('created_at', startDate.toISOString());

    if (engagementError) console.error('User engagement query error:', engagementError);

    // Query 5: Top Mexico Trade Partners
    const { data: tradePartners, error: partnersError } = await supabase
      .from('company_profiles')
      .select('id, company_name, country, total_trade_volume')
      .eq('country', 'Mexico')
      .order('total_trade_volume', { ascending: false })
      .limit(10);

    if (partnersError) console.error('Trade partners query error:', partnersError);

    // Calculate analytics metrics
    const analytics = {
      overview: {
        total_certificates: certificates?.length || 0,
        total_mexico_savings: tariffSavings?.reduce((sum, item) => sum + (item.mexico_savings || 0), 0) || 0,
        active_routing_opportunities: routingOps?.length || 0,
        user_engagement_rate: userEngagement?.filter(item => item.completion_status === 'completed').length || 0
      },
      trends: {
        certificates_by_day: groupByDay(certificates || []),
        savings_by_day: groupSavingsByDay(tariffSavings || []),
        routing_by_country: groupRoutingByCountry(routingOps || [])
      },
      mexico_focus: {
        top_hs_codes: getTopHSCodes(tariffSavings || []),
        trade_partners: tradePartners || [],
        average_savings_percentage: calculateAverageSavings(tariffSavings || [])
      },
      user_activity: {
        workflow_completions: userEngagement || [],
        engagement_by_type: groupEngagementByType(userEngagement || [])
      }
    };

    res.status(200).json({
      success: true,
      data: analytics,
      timeframe,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mexico trade analytics error:', error);
    res.status(500).json({
      error: 'Failed to load Mexico trade analytics',
      details: error.message
    });
  }
}

// Helper functions for data processing
function groupByDay(data) {
  const grouped = {};
  data.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });
  return grouped;
}

function groupSavingsByDay(data) {
  const grouped = {};
  data.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + (item.mexico_savings || 0);
  });
  return grouped;
}

function groupRoutingByCountry(data) {
  const grouped = {};
  data.forEach(item => {
    const country = item.origin_country;
    grouped[country] = (grouped[country] || 0) + 1;
  });
  return grouped;
}

function getTopHSCodes(data) {
  const hsCounts = {};
  data.forEach(item => {
    if (item.hs_code) {
      hsCounts[item.hs_code] = (hsCounts[item.hs_code] || 0) + (item.mexico_savings || 0);
    }
  });

  return Object.entries(hsCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([hs_code, savings]) => ({ hs_code, savings }));
}

function calculateAverageSavings(data) {
  if (data.length === 0) return 0;
  const totalSavings = data.reduce((sum, item) => sum + (item.mexico_savings || 0), 0);
  return totalSavings / data.length;
}

function groupEngagementByType(data) {
  const grouped = {};
  data.forEach(item => {
    const type = item.workflow_type;
    if (!grouped[type]) {
      grouped[type] = { total: 0, completed: 0 };
    }
    grouped[type].total++;
    if (item.completion_status === 'completed') {
      grouped[type].completed++;
    }
  });
  return grouped;
}