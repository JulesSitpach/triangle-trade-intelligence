-- PHASE 2 OPTIMIZATION: RPC FUNCTIONS FOR TRIANGLE INTELLIGENCE
-- Run this in Supabase SQL Editor to create optimized database functions
-- Reduces 597K+ trade flows query bottlenecks through batch operations

-- Main intelligence aggregation function
CREATE OR REPLACE FUNCTION get_complete_intelligence(
  business_type TEXT,
  hs_codes TEXT[] DEFAULT '{}',
  include_patterns BOOLEAN DEFAULT true
) RETURNS JSON AS $$
DECLARE
  trade_flows_data JSON;
  comtrade_data JSON;
  patterns_data JSON;
BEGIN
  -- Get trade flows with business type filter (limited for performance)
  SELECT json_agg(
    json_build_object(
      'hs_code', t.hs_code,
      'product_description', t.product_description,
      'reporter_country', t.reporter_country,
      'partner_country', t.partner_country,
      'trade_value', t.trade_value,
      'quantity', t.quantity,
      'trade_flow', t.trade_flow
    )
  ) INTO trade_flows_data
  FROM (
    SELECT t.* FROM trade_flows t 
    WHERE (business_type IS NULL OR t.product_category ILIKE '%' || business_type || '%')
    AND (array_length(hs_codes, 1) IS NULL OR t.hs_code = ANY(hs_codes))
    ORDER BY t.trade_value DESC NULLS LAST
    LIMIT 50
  ) t;

  -- Get comtrade reference data for specific HS codes
  SELECT json_agg(
    json_build_object(
      'hs_code', c.hs_code,
      'product_description', c.product_description,
      'chapter', SUBSTRING(c.hs_code FROM 1 FOR 2),
      'section', c.section,
      'confidence', COALESCE(c.confidence, 90)
    )
  ) INTO comtrade_data
  FROM comtrade_reference c 
  WHERE (array_length(hs_codes, 1) IS NULL OR c.hs_code = ANY(hs_codes))
  LIMIT 100;

  -- Get hindsight patterns if requested
  IF include_patterns THEN
    SELECT json_agg(
      json_build_object(
        'pattern_type', p.pattern_type,
        'business_category', p.business_category,
        'success_indicators', p.success_indicators,
        'confidence_score', p.confidence_score
      )
    ) INTO patterns_data
    FROM hindsight_pattern_library p
    WHERE (business_type IS NULL OR p.business_category ILIKE '%' || business_type || '%')
    LIMIT 20;
  ELSE
    patterns_data := NULL;
  END IF;

  -- Return aggregated results
  RETURN json_build_object(
    'trade_flows', COALESCE(trade_flows_data, '[]'::json),
    'comtrade', COALESCE(comtrade_data, '[]'::json),
    'patterns', COALESCE(patterns_data, '[]'::json),
    'metadata', json_build_object(
      'business_type', business_type,
      'hs_codes_count', COALESCE(array_length(hs_codes, 1), 0),
      'include_patterns', include_patterns,
      'generated_at', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Optimized routing intelligence function
CREATE OR REPLACE FUNCTION get_routing_intelligence(
  origin_country TEXT,
  destination_country TEXT,
  business_type TEXT DEFAULT NULL,
  limit_results INTEGER DEFAULT 20
) RETURNS JSON AS $$
DECLARE
  trade_data JSON;
  usmca_data JSON;
  routes_data JSON;
BEGIN
  -- Get relevant trade flows
  SELECT json_agg(
    json_build_object(
      'hs_code', t.hs_code,
      'product_description', t.product_description,
      'trade_value', t.trade_value,
      'reporter_country', t.reporter_country,
      'partner_country', t.partner_country
    )
  ) INTO trade_data
  FROM (
    SELECT t.* FROM trade_flows t
    WHERE (t.reporter_country = origin_country OR t.partner_country = destination_country)
    AND (business_type IS NULL OR t.product_category ILIKE '%' || business_type || '%')
    ORDER BY t.trade_value DESC NULLS LAST
    LIMIT limit_results
  ) t;

  -- Get USMCA tariff rates
  SELECT json_agg(
    json_build_object(
      'origin_country', u.origin_country,
      'destination_country', u.destination_country,
      'usmca_rate', u.usmca_rate,
      'traditional_rate', u.traditional_rate,
      'savings_potential', (u.traditional_rate - u.usmca_rate)
    )
  ) INTO usmca_data
  FROM usmca_tariff_rates u
  WHERE u.origin_country = origin_country 
     OR u.destination_country = destination_country;

  -- Get available trade routes
  SELECT json_agg(
    json_build_object(
      'route_name', r.route_name,
      'origin', r.origin,
      'destination', r.destination,
      'transit_countries', r.transit_countries,
      'avg_transit_time', r.avg_transit_time,
      'route_efficiency', r.route_efficiency
    )
  ) INTO routes_data
  FROM trade_routes r
  WHERE r.origin = origin_country OR r.destination = destination_country;

  RETURN json_build_object(
    'trade_flows', COALESCE(trade_data, '[]'::json),
    'usmca_rates', COALESCE(usmca_data, '[]'::json),
    'routes', COALESCE(routes_data, '[]'::json),
    'analysis', json_build_object(
      'origin', origin_country,
      'destination', destination_country,
      'business_type', business_type,
      'routes_available', json_array_length(COALESCE(routes_data, '[]'::json)),
      'generated_at', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring function  
CREATE OR REPLACE FUNCTION get_query_performance_stats() RETURNS JSON AS $$
DECLARE
  trade_flows_count BIGINT;
  comtrade_count BIGINT;
  patterns_count BIGINT;
  sessions_count BIGINT;
BEGIN
  -- Get table sizes for performance monitoring
  SELECT COUNT(*) INTO trade_flows_count FROM trade_flows;
  SELECT COUNT(*) INTO comtrade_count FROM comtrade_reference;
  SELECT COUNT(*) INTO patterns_count FROM hindsight_pattern_library;
  SELECT COUNT(*) INTO sessions_count FROM workflow_sessions;

  RETURN json_build_object(
    'table_sizes', json_build_object(
      'trade_flows', trade_flows_count,
      'comtrade_reference', comtrade_count,
      'hindsight_patterns', patterns_count,
      'workflow_sessions', sessions_count
    ),
    'last_updated', NOW(),
    'optimization_status', 'Phase 2 RPC Functions Active'
  );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_trade_flows_category_value 
ON trade_flows (product_category, trade_value DESC) 
WHERE product_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trade_flows_countries_hs 
ON trade_flows (reporter_country, partner_country, hs_code) 
WHERE reporter_country IS NOT NULL AND partner_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comtrade_hs_section 
ON comtrade_reference (hs_code, section) 
WHERE hs_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patterns_business_confidence 
ON hindsight_pattern_library (business_category, confidence_score DESC) 
WHERE business_category IS NOT NULL;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_complete_intelligence(TEXT, TEXT[], BOOLEAN) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_routing_intelligence(TEXT, TEXT, TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_query_performance_stats() TO authenticated, anon;