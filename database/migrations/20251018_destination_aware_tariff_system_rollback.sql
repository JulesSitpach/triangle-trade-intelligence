-- =====================================================
-- Migration Rollback: Destination-Aware Tariff Intelligence System
-- Date: October 18, 2025
-- Description: Rollback script to undo destination_country tracking changes
-- WARNING: This will delete the tariff_cache table and all cached data
-- =====================================================

-- =====================================================
-- STEP 1: Drop analytics view
-- =====================================================

DROP VIEW IF EXISTS tariff_cache_performance;

-- =====================================================
-- STEP 2: Drop helper functions
-- =====================================================

DROP FUNCTION IF EXISTS get_cache_strategy(TEXT);
DROP FUNCTION IF EXISTS calculate_trade_flow(TEXT, TEXT);
DROP FUNCTION IF EXISTS calculate_cache_expiry();

-- =====================================================
-- STEP 3: Drop tariff_cache table
-- WARNING: This will delete all cached tariff data
-- =====================================================

DROP TABLE IF EXISTS tariff_cache CASCADE;

-- =====================================================
-- STEP 4: Remove columns from crisis_alerts
-- =====================================================

ALTER TABLE crisis_alerts
DROP COLUMN IF EXISTS affected_destinations,
DROP COLUMN IF EXISTS affected_origins,
DROP COLUMN IF EXISTS alert_scope;

-- Drop indexes
DROP INDEX IF EXISTS idx_crisis_alerts_destinations;
DROP INDEX IF EXISTS idx_crisis_alerts_origins;
DROP INDEX IF EXISTS idx_crisis_alerts_scope;

-- =====================================================
-- STEP 5: Remove columns from workflow_sessions
-- WARNING: This will delete destination_country data from all workflows
-- =====================================================

ALTER TABLE workflow_sessions
DROP COLUMN IF EXISTS destination_country,
DROP COLUMN IF EXISTS trade_flow_type,
DROP COLUMN IF EXISTS tariff_cache_strategy;

-- Drop indexes
DROP INDEX IF EXISTS idx_workflow_sessions_destination;
DROP INDEX IF EXISTS idx_workflow_sessions_trade_flow;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Rollback 20251018_destination_aware_tariff_system_rollback.sql completed';
  RAISE NOTICE 'Removed: destination_country, trade_flow_type, tariff_cache_strategy from workflow_sessions';
  RAISE NOTICE 'Dropped: tariff_cache table';
  RAISE NOTICE 'Removed: affected_destinations, affected_origins, alert_scope from crisis_alerts';
  RAISE NOTICE 'Dropped: Helper functions and analytics view';
  RAISE WARNING 'All cached tariff data has been deleted';
  RAISE WARNING 'All workflow destination_country data has been deleted';
END $$;
