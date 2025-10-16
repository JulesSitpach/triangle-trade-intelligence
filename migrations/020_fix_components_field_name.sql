-- ============================================================================
-- DATA MIGRATION: Fix Component Field Name Inconsistency
-- Issue: 4 service_requests use 'components' instead of 'component_origins'
-- Impact: Admin dashboards cannot display component data for these records
-- Solution: Rename 'components' → 'component_origins' in subscriber_data JSONB
-- ============================================================================

-- Step 1: Identify affected records
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM service_requests
  WHERE subscriber_data ? 'components'
    AND NOT (subscriber_data ? 'component_origins');

  RAISE NOTICE 'Found % records with wrong field name (components instead of component_origins)', affected_count;
END $$;

-- Step 2: Fix the field name by transforming JSONB
-- This renames 'components' → 'component_origins' while preserving all other fields
UPDATE service_requests
SET
  subscriber_data = subscriber_data - 'components' || jsonb_build_object('component_origins', subscriber_data->'components'),
  updated_at = NOW()
WHERE subscriber_data ? 'components'
  AND NOT (subscriber_data ? 'component_origins');

-- Step 3: Verify the fix
DO $$
DECLARE
  remaining_count INTEGER;
  fixed_count INTEGER;
BEGIN
  -- Check if any records still have wrong field name
  SELECT COUNT(*) INTO remaining_count
  FROM service_requests
  WHERE subscriber_data ? 'components'
    AND NOT (subscriber_data ? 'component_origins');

  -- Count records with correct field name
  SELECT COUNT(*) INTO fixed_count
  FROM service_requests
  WHERE subscriber_data ? 'component_origins';

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - Records with component_origins: %', fixed_count;
  RAISE NOTICE '  - Records still with wrong field name: %', remaining_count;

  IF remaining_count > 0 THEN
    RAISE WARNING 'Some records still have wrong field name!';
  ELSE
    RAISE NOTICE '✅ All records fixed successfully';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE service_requests IS 'Professional service requests - PRIMARY FIELD: subscriber_data.component_origins (NOT components)';
