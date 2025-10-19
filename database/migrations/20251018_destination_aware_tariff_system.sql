-- =====================================================
-- Migration: Destination-Aware Tariff Intelligence System
-- Date: October 18, 2025
-- Description: Add destination_country tracking and 3-tier cache strategy
-- =====================================================

-- =====================================================
-- STEP 1: Add destination tracking to workflow_sessions
-- =====================================================

ALTER TABLE workflow_sessions
ADD COLUMN IF NOT EXISTS destination_country TEXT,
ADD COLUMN IF NOT EXISTS trade_flow_type TEXT,
ADD COLUMN IF NOT EXISTS tariff_cache_strategy TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_destination
ON workflow_sessions(destination_country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_sessions_trade_flow
ON workflow_sessions(trade_flow_type);

-- Add comments for documentation
COMMENT ON COLUMN workflow_sessions.destination_country IS
'Export destination country (where goods are sent) - Used for tariff lookup routing';

COMMENT ON COLUMN workflow_sessions.trade_flow_type IS
'Auto-calculated trade flow (e.g., CA→MX, MX→US, US→CA) based on manufacturing_location and destination_country';

COMMENT ON COLUMN workflow_sessions.tariff_cache_strategy IS
'Cache strategy for tariff lookups: database (MX), ai_90day (CA), ai_24hr (US)';

-- =====================================================
-- STEP 2: Create tariff_cache table for AI-generated rates
-- =====================================================

CREATE TABLE IF NOT EXISTS tariff_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  component_type TEXT NOT NULL,
  hs_code TEXT,
  hs_description TEXT,
  mfn_rate DECIMAL(10,4),
  usmca_rate DECIMAL(10,4),
  savings_amount DECIMAL(12,2),
  savings_percentage DECIMAL(5,2),
  ai_confidence INTEGER,
  policy_context JSONB,  -- Store AI policy analysis (Section 301, port fees, etc.)
  cache_ttl_hours INTEGER NOT NULL,  -- 24 or 2160 (90 days)
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  data_source TEXT DEFAULT 'ai_research',  -- 'ai_research', 'database', 'ai_cached_90day', 'ai_cached_24hr'

  -- Composite unique index to prevent duplicate cache entries
  CONSTRAINT unique_cache_entry UNIQUE (origin_country, destination_country, component_type, hs_code)
);

-- Indexes for cache lookups
CREATE INDEX IF NOT EXISTS idx_tariff_cache_lookup
ON tariff_cache(origin_country, destination_country, component_type, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_tariff_cache_expiry
ON tariff_cache(expires_at)
WHERE expires_at > NOW();  -- Only index non-expired cache

CREATE INDEX IF NOT EXISTS idx_tariff_cache_destination
ON tariff_cache(destination_country, cached_at DESC);

-- Add comments
COMMENT ON TABLE tariff_cache IS
'Cache table for AI-generated tariff rates with destination-aware TTL (90 days for CA, 24 hours for US)';

COMMENT ON COLUMN tariff_cache.cache_ttl_hours IS
'Time to live in hours: 24 for US (volatile), 2160 for Canada (90 days, stable)';

COMMENT ON COLUMN tariff_cache.policy_context IS
'JSON object storing AI policy analysis: Section 301 tariffs, port fees, IEEPA, retaliatory measures, etc.';

-- =====================================================
-- STEP 3: Create function to auto-calculate cache expiry
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_cache_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate expires_at based on cached_at + cache_ttl_hours
  NEW.expires_at := NEW.cached_at + (NEW.cache_ttl_hours || ' hours')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set expires_at
DROP TRIGGER IF EXISTS set_cache_expiry ON tariff_cache;
CREATE TRIGGER set_cache_expiry
BEFORE INSERT ON tariff_cache
FOR EACH ROW
EXECUTE FUNCTION calculate_cache_expiry();

-- =====================================================
-- STEP 4: Enhance crisis_alerts for trade flow filtering
-- =====================================================

-- Add destination-specific and origin-specific filtering
ALTER TABLE crisis_alerts
ADD COLUMN IF NOT EXISTS affected_destinations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS affected_origins TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS alert_scope TEXT DEFAULT 'global';

-- Indexes for alert filtering using GIN (optimized for array searches)
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_destinations
ON crisis_alerts USING GIN(affected_destinations);

CREATE INDEX IF NOT EXISTS idx_crisis_alerts_origins
ON crisis_alerts USING GIN(affected_origins);

CREATE INDEX IF NOT EXISTS idx_crisis_alerts_scope
ON crisis_alerts(alert_scope, created_at DESC);

-- Add comments
COMMENT ON COLUMN crisis_alerts.affected_destinations IS
'Array of destination countries this alert affects (e.g., {US, CA} for USMCA-wide policy)';

COMMENT ON COLUMN crisis_alerts.affected_origins IS
'Array of origin countries this alert affects (e.g., {CN} for China-specific tariffs)';

COMMENT ON COLUMN crisis_alerts.alert_scope IS
'Alert scope: global (affects all flows), destination_specific (only certain destinations), origin_specific (only certain origins)';

-- =====================================================
-- STEP 5: Create helper function for trade flow calculation
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_trade_flow(
  p_manufacturing_location TEXT,
  p_destination_country TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_origin_code TEXT;
  v_dest_code TEXT;
BEGIN
  -- Normalize country codes
  v_origin_code := CASE
    WHEN p_manufacturing_location ILIKE '%canada%' OR p_manufacturing_location = 'CA' THEN 'CA'
    WHEN p_manufacturing_location ILIKE '%mexico%' OR p_manufacturing_location = 'MX' THEN 'MX'
    WHEN p_manufacturing_location ILIKE '%united states%' OR p_manufacturing_location ILIKE '%usa%' OR p_manufacturing_location = 'US' THEN 'US'
    ELSE p_manufacturing_location
  END;

  v_dest_code := CASE
    WHEN p_destination_country ILIKE '%canada%' OR p_destination_country = 'CA' THEN 'CA'
    WHEN p_destination_country ILIKE '%mexico%' OR p_destination_country = 'MX' THEN 'MX'
    WHEN p_destination_country ILIKE '%united states%' OR p_destination_country ILIKE '%usa%' OR p_destination_country = 'US' THEN 'US'
    ELSE p_destination_country
  END;

  -- Return trade flow type (e.g., "CA→MX")
  RETURN v_origin_code || '→' || v_dest_code;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_trade_flow IS
'Calculate trade flow type (e.g., CA→MX, MX→US) from manufacturing location and destination country';

-- =====================================================
-- STEP 6: Create helper function for cache strategy determination
-- =====================================================

CREATE OR REPLACE FUNCTION get_cache_strategy(
  p_destination_country TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_dest_code TEXT;
BEGIN
  -- Normalize destination country code
  v_dest_code := CASE
    WHEN p_destination_country ILIKE '%canada%' OR p_destination_country = 'CA' THEN 'CA'
    WHEN p_destination_country ILIKE '%mexico%' OR p_destination_country = 'MX' THEN 'MX'
    WHEN p_destination_country ILIKE '%united states%' OR p_destination_country ILIKE '%usa%' OR p_destination_country = 'US' THEN 'US'
    ELSE p_destination_country
  END;

  -- Determine cache strategy based on destination policy stability
  RETURN CASE v_dest_code
    WHEN 'MX' THEN 'database'      -- Mexico: Stable rates, database lookup (free)
    WHEN 'CA' THEN 'ai_90day'      -- Canada: Stable rates, 90-day cache (minimal cost)
    WHEN 'US' THEN 'ai_24hr'       -- USA: Volatile rates, 24-hour cache (necessary)
    ELSE 'ai_24hr'                 -- Default to safest (most current)
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_cache_strategy IS
'Determine tariff cache strategy based on destination country policy stability: database (MX), ai_90day (CA), ai_24hr (US)';

-- =====================================================
-- STEP 7: Create view for cache performance analytics
-- =====================================================

CREATE OR REPLACE VIEW tariff_cache_performance AS
SELECT
  destination_country,
  COUNT(*) AS total_cached_entries,
  SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) AS active_cache_entries,
  SUM(CASE WHEN expires_at <= NOW() THEN 1 ELSE 0 END) AS expired_cache_entries,
  ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - cached_at)) / 86400)::numeric, 1) AS avg_cache_age_days,
  ROUND((SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS cache_hit_rate_estimate,
  MAX(cached_at) AS most_recent_cache,
  MIN(cached_at) AS oldest_cache
FROM tariff_cache
GROUP BY destination_country;

COMMENT ON VIEW tariff_cache_performance IS
'Analytics view for monitoring cache performance by destination country';

-- =====================================================
-- STEP 8: Grant permissions (if using Row Level Security)
-- =====================================================

-- Grant access to authenticated users (adjust based on your RLS policies)
GRANT SELECT ON tariff_cache TO authenticated;
GRANT SELECT ON tariff_cache_performance TO authenticated;
GRANT SELECT, INSERT, UPDATE ON workflow_sessions TO authenticated;

-- Grant full access to service role (for API endpoints)
GRANT ALL ON tariff_cache TO service_role;
GRANT ALL ON tariff_cache_performance TO service_role;
GRANT ALL ON workflow_sessions TO service_role;
GRANT ALL ON crisis_alerts TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251018_destination_aware_tariff_system.sql completed successfully';
  RAISE NOTICE 'Added: destination_country, trade_flow_type, tariff_cache_strategy to workflow_sessions';
  RAISE NOTICE 'Created: tariff_cache table with auto-expiry trigger';
  RAISE NOTICE 'Enhanced: crisis_alerts with affected_destinations and affected_origins';
  RAISE NOTICE 'Created: Helper functions for trade_flow and cache_strategy calculation';
  RAISE NOTICE 'Created: tariff_cache_performance analytics view';
END $$;
