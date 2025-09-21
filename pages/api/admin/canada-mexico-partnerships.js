/**
 * Canada-Mexico Partnership Opportunities API
 * Serves real partnership data from Supabase for Jorge's intelligence briefings
 * Database-driven, no hardcoded values
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
    // Get Canada-Mexico direct trade routes
    const { data: tradeRoutes, error: routesError } = await supabase
      .from('trade_routes')
      .select('*')
      .or('and(origin_country.eq.CA,destination_country.eq.MX),and(origin_country.eq.MX,destination_country.eq.CA)');

    if (routesError && routesError.code !== 'PGRST116') {
      console.error('Trade routes error:', routesError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Get triangle routing opportunities involving Canada/Mexico
    const { data: triangleRoutes, error: triangleError } = await supabase
      .from('usmca_business_intelligence')
      .select('*')
      .or('recommended_triangle_route.ilike.%Canada%,recommended_triangle_route.ilike.%Mexico%');

    if (triangleError && triangleError.code !== 'PGRST116') {
      console.error('Triangle routes error:', triangleError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Get trade flows data for Canada-Mexico volume analysis
    // Note: Using trade_flows table since usmca_trade_flows may not have origin_country column
    const { data: tradeFlows, error: flowsError } = await supabase
      .from('trade_flows')
      .select('*')
      .or('export_country.eq.CA,export_country.eq.MX,import_country.eq.CA,import_country.eq.MX')
      .limit(20);

    if (flowsError && flowsError.code !== 'PGRST116') {
      console.error('Trade flows error:', flowsError);
    }

    // Transform data for Jorge's dashboard
    const partnerships = {
      direct_routes: (tradeRoutes || []).map(route => ({
        route: `${route.origin_country === 'CA' ? 'Canada' : 'Mexico'} → ${route.destination_country === 'MX' ? 'Mexico' : 'Canada'}`,
        ports: route.major_ports,
        transit_days: route.typical_transit_days,
        benefits: route.trade_agreements?.benefits || 'USMCA advantages',
        status: route.trade_agreements?.status || 'active'
      })),

      triangle_opportunities: (triangleRoutes || []).map(opportunity => ({
        business_type: opportunity.business_type,
        route: opportunity.recommended_triangle_route,
        avg_savings: opportunity.avg_usmca_savings,
        success_rate: opportunity.success_rate_percentage,
        implementation_timeline: opportunity.typical_implementation_months,
        executive_summary: opportunity.marcus_executive_summary,
        key_factors: opportunity.key_success_factors,
        next_steps: opportunity.actionable_next_steps
      })),

      trade_volume_insights: (tradeFlows || []).map(flow => ({
        product_category: flow.product_category || flow.commodity_code,
        trade_value: flow.trade_value_usd || flow.value,
        growth_rate: flow.yoy_growth_percentage || 0,
        market_share: flow.market_share_percentage || 0,
        route: `${flow.export_country || 'Unknown'} → ${flow.import_country || 'Unknown'}`
      }))
    };

    // Calculate metrics for dashboard summary
    const metrics = {
      total_opportunities: partnerships.triangle_opportunities.length,
      avg_savings: partnerships.triangle_opportunities.reduce((sum, opp) => sum + (opp.avg_savings || 0), 0) / Math.max(partnerships.triangle_opportunities.length, 1),
      avg_success_rate: partnerships.triangle_opportunities.reduce((sum, opp) => sum + (opp.success_rate || 0), 0) / Math.max(partnerships.triangle_opportunities.length, 1),
      direct_routes_available: partnerships.direct_routes.length,
      total_trade_volume: partnerships.trade_volume_insights.reduce((sum, insight) => sum + (insight.trade_value || 0), 0)
    };

    return res.status(200).json({
      partnerships,
      metrics,
      data_source: (tradeRoutes?.length > 0 || triangleRoutes?.length > 0) ? 'database' : 'empty',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Canada-Mexico partnerships API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch partnership data',
      partnerships: {
        direct_routes: [],
        triangle_opportunities: [],
        trade_volume_insights: []
      },
      metrics: {
        total_opportunities: 0,
        avg_savings: 0,
        avg_success_rate: 0,
        direct_routes_available: 0,
        total_trade_volume: 0
      },
      data_source: 'error'
    });
  }
}