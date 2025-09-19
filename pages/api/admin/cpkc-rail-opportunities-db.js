/**
 * CPKC Rail Network Opportunities API - DATABASE VERSION
 * Track direct Canada-Mexico shipping routes and optimization opportunities
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
    // Query real database for CPKC rail routes
    const { data: railRoutes, error: railError } = await supabase
      .from('cpkc_rail_routes')
      .select('*')
      .order('volume_2024_usd', { ascending: false });

    if (railError) {
      console.error('Database error fetching rail routes:', railError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch CPKC rail data from database'
      });
    }

    // Transform database data to API format
    const rail_routes = railRoutes?.map(route => ({
      id: route.id,
      name: route.route_name,
      origin: `${route.origin_city}, ${route.origin_province_state}`,
      destination: `${route.destination_city}, ${route.destination_province_state}`,
      distance_km: route.distance_km,
      transit_days: `${route.transit_days_min}-${route.transit_days_max}`,
      primary_commodities: route.primary_commodities || [],
      capacity: route.capacity_level,
      triangle_routing: {
        enabled: route.triangle_routing_enabled,
        onward_destinations: route.onward_destinations || [],
        cost_savings: `${route.cost_savings_percent_min}-${route.cost_savings_percent_max}%`,
        usmca_benefits: route.usmca_benefits
      },
      infrastructure: route.infrastructure || {},
      status: route.status,
      volume_2024: route.volume_2024_usd ? `$${(route.volume_2024_usd / 1000000000).toFixed(1)}B` : 'TBD',
      growth_projection: `${route.growth_projection_percent || 0}% annually`
    })) || [];

    // Calculate network statistics from database
    const networkStats = {
      total_distance_km: railRoutes?.reduce((sum, route) => sum + (route.distance_km || 0), 0) || 0,
      average_transit_days: railRoutes?.length > 0 ?
        (railRoutes.reduce((sum, route) => sum + ((route.transit_days_min + route.transit_days_max) / 2), 0) / railRoutes.length).toFixed(1) : '0',
      intermodal_terminals: railRoutes?.reduce((sum, route) => sum + (route.infrastructure?.intermodal_terminals || 0), 0) || 0,
      total_volume_2024: railRoutes?.reduce((sum, route) => sum + (route.volume_2024_usd || 0), 0) || 0
    };

    // Calculate summary
    const summary = {
      total_routes: railRoutes?.length || 0,
      operational_routes: railRoutes?.filter(r => r.status === 'operational').length || 0,
      total_volume_2024: networkStats.total_volume_2024 > 0 ? `$${(networkStats.total_volume_2024 / 1000000000).toFixed(1)}B` : '$0',
      average_cost_savings: railRoutes?.length > 0 ?
        `${Math.round(railRoutes.reduce((sum, route) => sum + ((route.cost_savings_percent_min + route.cost_savings_percent_max) / 2), 0) / railRoutes.length)}%` : '0%',
      network_coverage: 'Canada to Mexico with Latin America connections'
    };

    res.status(200).json({
      success: true,
      rail_routes,
      summary,
      network_stats: {
        total_distance_km: networkStats.total_distance_km,
        average_transit_days: networkStats.average_transit_days,
        intermodal_terminals: networkStats.intermodal_terminals
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('CPKC rail opportunities API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load CPKC rail opportunities from database'
    });
  }
}