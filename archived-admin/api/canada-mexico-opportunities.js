/**
 * Canada-Mexico Partnership Opportunities API
 * Track strategic partnership opportunities from bilateral agreement
 * DATABASE-FIRST IMPLEMENTATION - NO HARDCODED DATA
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query triangle routing opportunities for Canada-Mexico focus
    const { data: opportunities, error: oppError } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .contains('countries', ['CA', 'MX'])
      .order('cost_savings_percent', { ascending: false });

    if (oppError) {
      console.error('Database error fetching opportunities:', oppError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch partnership opportunities from database'
      });
    }

    // Query CPKC rail routes for trade corridors
    const { data: railRoutes, error: railError } = await supabase
      .from('trade_routes')
      .select('*')
      .order('created_at', { ascending: false });

    // Query USMCA timeline
    const { data: usmcaTimeline, error: timelineError } = await supabase
      .from('trade_policy_calendar')
      .select('*')
      .order('created_at', { ascending: true });

    // Transform rail routes into trade corridors format
    const trade_corridors = railRoutes?.map(route => ({
      id: route.id,
      name: route.route_name,
      description: `${route.origin_city}-${route.destination_city} trade corridor`,
      route: `Canada (${route.origin_province_state}) → Mexico (${route.destination_province_state})`,
      primary_commodities: route.primary_commodities || [],
      annual_volume: route.volume_2024_usd ? `$${(route.volume_2024_usd / 1000000000).toFixed(1)}B` : 'TBD',
      triangle_routing_savings: `${route.cost_savings_percent_min}-${route.cost_savings_percent_max}%`,
      usmca_benefits: route.usmca_benefits || 'Trade facilitation',
      status: route.status
    })) || [];

    // Transform USMCA timeline
    const usmca_updates = usmcaTimeline?.map(event => ({
      id: event.id,
      date: event.event_date,
      title: event.event_title,
      description: event.description,
      impact: event.impact_level,
      priority: event.impact_level,
      canada_position: event.canada_position,
      mexico_position: event.mexico_position,
      triangle_implications: event.triangle_implications
    })) || [];

    // Calculate summary from triangle routing data
    const totalValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_annual_savings || 0), 0) || 0;
    const activeOpportunities = opportunities?.filter(o => o.implementation_status === 'active' || o.implementation_status === 'ready').length || 0;
    const highPriorityOpportunities = opportunities?.filter(o => o.cost_savings_percent >= 15).length || 0;

    res.status(200).json({
      success: true,
      opportunities: opportunities || [],
      trade_corridors,
      usmca_updates,
      summary: {
        total_opportunities: opportunities?.length || 0,
        total_estimated_value: totalValue > 0 ? `$${(totalValue / 1000000000).toFixed(1)}B` : '$0',
        active_opportunities: activeOpportunities,
        high_priority_opportunities: highPriorityOpportunities
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Canada-Mexico opportunities API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load partnership opportunities'
    });
  }
}