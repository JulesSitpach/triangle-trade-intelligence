/**
 * Critical Minerals Trade Opportunities API - DATABASE VERSION
 * Track energy transition materials for Canada-Mexico trade
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
    // Query real database for critical minerals
    const { data: minerals, error: mineralsError } = await supabase
      .from('critical_minerals_trade')
      .select('*')
      .order('strategic_importance', { ascending: false })
      .order('canada_mexico_trade_2024_usd', { ascending: false });

    if (mineralsError) {
      console.error('Database error fetching minerals:', mineralsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch critical minerals data from database'
      });
    }

    // Query trade routes
    const { data: tradeRoutes, error: routesError } = await supabase
      .from('canada_mexico_trade_routes')
      .select('*')
      .order('cost_per_tonne_usd', { ascending: true });

    // Query market opportunities
    const { data: marketOpportunities, error: marketError } = await supabase
      .from('canada_mexico_market_opportunities')
      .select('*')
      .order('estimated_value_annual_usd', { ascending: false });

    // Transform database data
    const trade_routes = tradeRoutes?.map(route => ({
      id: route.id,
      name: route.route_name,
      origin: `${route.origin_city}, ${route.origin_country}`,
      destination: `${route.destination_city}, ${route.destination_country}`,
      transport_mode: route.transport_mode,
      transit_time: `${route.transit_time_days_min}-${route.transit_time_days_max} days`,
      primary_minerals: route.primary_minerals || [],
      annual_capacity: `${route.annual_capacity_tonnes?.toLocaleString() || 0} tonnes`,
      cost_per_tonne: `$${route.cost_per_tonne_usd || 0}`,
      triangle_routing_benefits: route.triangle_routing_benefits
    })) || [];

    const market_opportunities = marketOpportunities?.map(opp => ({
      id: opp.id,
      title: opp.opportunity_title,
      description: opp.description,
      minerals_involved: opp.minerals_involved || [],
      estimated_value: opp.estimated_value_annual_usd ? `$${(opp.estimated_value_annual_usd / 1000000).toFixed(0)}M annually` : 'TBD',
      timeline: `${opp.timeline_start} - ${opp.timeline_end}`,
      key_partners: opp.key_partners || [],
      triangle_routing_advantage: opp.triangle_routing_advantage
    })) || [];

    // Calculate summary from database
    const totalTradeValue2024 = minerals?.reduce((sum, mineral) => sum + (mineral.canada_mexico_trade_2024_usd || 0), 0) || 0;
    const projectedValue2025 = minerals?.reduce((sum, mineral) => sum + (mineral.projected_2025_usd || 0), 0) || 0;
    const growthRate = totalTradeValue2024 > 0 ? ((projectedValue2025 - totalTradeValue2024) / totalTradeValue2024 * 100).toFixed(1) : '0';

    const summary = {
      total_minerals_tracked: minerals?.length || 0,
      critical_importance_minerals: minerals?.filter(m => m.strategic_importance === 'critical').length || 0,
      total_trade_value_2024: totalTradeValue2024 > 0 ? `$${(totalTradeValue2024 / 1000000000).toFixed(3)}B` : '$0',
      projected_2025: projectedValue2025 > 0 ? `$${(projectedValue2025 / 1000000000).toFixed(3)}B` : '$0',
      growth_rate: `${growthRate}%`
    };

    res.status(200).json({
      success: true,
      minerals: minerals || [],
      trade_routes,
      market_opportunities,
      summary,
      strategic_insights: {
        canada_advantages: 'World-class reserves, established mining sector, USMCA benefits',
        mexico_opportunities: 'Growing manufacturing sector, strategic location, energy transition',
        triangle_routing_benefits: 'Regional supply chain integration, cost optimization, trade agreement advantages'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Critical minerals trade API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load critical minerals trade data from database'
    });
  }
}