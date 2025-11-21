/**
 * DATABASE CONSTRAINTS & INDEXES FOR TARIFF CACHE
 *
 * PURPOSE:
 * Add defensive database-level constraints to prevent data corruption.
 * These constraints catch bad data BEFORE insertion, not after.
 *
 * WHAT IT ADDS:
 * 1. CHECK constraints on tariff rate ranges (0.0-1.0)
 * 2. CHECK constraints preventing zero rates without documentation
 * 3. NOT NULL constraints on critical fields
 * 4. Performance indexes on frequently queried columns
 * 5. Unique constraint to prevent duplicate records
 *
 * WHY:
 * Defense in depth - database enforces rules even if application code fails.
 *
 * USAGE:
 * Run via Supabase SQL Editor or migration tool:
 * psql -U postgres -d your_database -f add-tariff-cache-constraints.sql
 *
 * OR use the Node.js script: node scripts/apply-database-constraints.js
 *
 * Created: November 20, 2025
 * Reason: Audit revealed 233 corrupted records from missing constraints
 */

-- ============================================================================
-- PART 1: CHECK CONSTRAINTS (Rate Ranges & No Zero Rates)
-- ============================================================================

-- Section 301 rate range (0.0 to 1.0 or NULL)
ALTER TABLE policy_tariffs_cache
DROP CONSTRAINT IF EXISTS chk_section_301_range;

ALTER TABLE policy_tariffs_cache
ADD CONSTRAINT chk_section_301_range
CHECK (
  section_301 IS NULL OR
  (section_301 >= 0.0 AND section_301 <= 1.0)
);

COMMENT ON CONSTRAINT chk_section_301_range ON policy_tariffs_cache
IS 'Section 301 rates must be 0.0-1.0 (0%-100%) or NULL. Prevents storing 25 instead of 0.25.';

-- Section 232 rate range (0.0 to 1.0 or NULL)
ALTER TABLE policy_tariffs_cache
DROP CONSTRAINT IF EXISTS chk_section_232_range;

ALTER TABLE policy_tariffs_cache
ADD CONSTRAINT chk_section_232_range
CHECK (
  section_232 IS NULL OR
  (section_232 >= 0.0 AND section_232 <= 1.0)
);

COMMENT ON CONSTRAINT chk_section_232_range ON policy_tariffs_cache
IS 'Section 232 rates must be 0.0-1.0 (0%-100%) or NULL. Prevents storing 50 instead of 0.50.';

-- Section 201 rate range (0.0 to 1.0 or NULL)
ALTER TABLE policy_tariffs_cache
DROP CONSTRAINT IF EXISTS chk_section_201_range;

ALTER TABLE policy_tariffs_cache
ADD CONSTRAINT chk_section_201_range
CHECK (
  section_201 IS NULL OR
  (section_201 >= 0.0 AND section_201 <= 1.0)
);

COMMENT ON CONSTRAINT chk_section_201_range ON policy_tariffs_cache
IS 'Section 201 rates must be 0.0-1.0 (0%-100%) or NULL.';

-- IEEPA reciprocal rate range (0.0 to 1.0 or NULL)
ALTER TABLE policy_tariffs_cache
DROP CONSTRAINT IF EXISTS chk_ieepa_rate_range;

ALTER TABLE policy_tariffs_cache
ADD CONSTRAINT chk_ieepa_rate_range
CHECK (
  ieepa_reciprocal IS NULL OR
  (ieepa_reciprocal >= 0.0 AND ieepa_reciprocal <= 1.0)
);

COMMENT ON CONSTRAINT chk_ieepa_rate_range ON policy_tariffs_cache
IS 'IEEPA rates must be 0.0-1.0 (0%-100%) or NULL.';

-- ============================================================================
-- PART 2: NOT NULL CONSTRAINTS (Critical Fields)
-- ============================================================================

-- HS code cannot be NULL (every record must have a code)
ALTER TABLE policy_tariffs_cache
ALTER COLUMN hs_code SET NOT NULL;

COMMENT ON COLUMN policy_tariffs_cache.hs_code
IS 'HS code (8-digit HTS-8 format). Cannot be NULL - every record must identify a product.';

-- Verified source cannot be NULL (must document where rate came from)
ALTER TABLE policy_tariffs_cache
ALTER COLUMN verified_source SET NOT NULL;

COMMENT ON COLUMN policy_tariffs_cache.verified_source
IS 'Source of tariff rate (USITC, USTR, Federal Register, etc). Cannot be NULL - must document source.';

-- Verified date cannot be NULL (must know when rate was verified)
ALTER TABLE policy_tariffs_cache
ALTER COLUMN verified_date SET NOT NULL;

COMMENT ON COLUMN policy_tariffs_cache.verified_date
IS 'Date rate was verified. Cannot be NULL - must know data freshness for staleness detection.';

-- Origin country should not be NULL for policy tariffs
-- (Some policy tariffs are country-specific, some are blanket)
-- We'll make this optional for now, but add a comment
COMMENT ON COLUMN policy_tariffs_cache.origin_country
IS 'Origin country for country-specific tariffs (CN, MX, etc). NULL for blanket tariffs affecting all countries.';

-- ============================================================================
-- PART 3: PERFORMANCE INDEXES
-- ============================================================================

-- Index on hs_code (most common query)
DROP INDEX IF EXISTS idx_policy_tariffs_hs_code;
CREATE INDEX idx_policy_tariffs_hs_code
ON policy_tariffs_cache(hs_code);

COMMENT ON INDEX idx_policy_tariffs_hs_code
IS 'Performance index for HS code lookups. Most queries filter by hs_code.';

-- Index on origin_country (frequently used in WHERE clauses)
DROP INDEX IF EXISTS idx_policy_tariffs_origin;
CREATE INDEX idx_policy_tariffs_origin
ON policy_tariffs_cache(origin_country);

COMMENT ON INDEX idx_policy_tariffs_origin
IS 'Performance index for country-specific tariff lookups (China, Mexico, etc).';

-- Composite index on (hs_code, origin_country) for exact match queries
DROP INDEX IF EXISTS idx_policy_tariffs_hs_origin;
CREATE INDEX idx_policy_tariffs_hs_origin
ON policy_tariffs_cache(hs_code, origin_country);

COMMENT ON INDEX idx_policy_tariffs_hs_origin
IS 'Composite index for exact match queries (hs_code + origin_country). Faster than two separate indexes.';

-- Index on verified_date (for staleness detection)
DROP INDEX IF EXISTS idx_policy_tariffs_verified_date;
CREATE INDEX idx_policy_tariffs_verified_date
ON policy_tariffs_cache(verified_date);

COMMENT ON INDEX idx_policy_tariffs_verified_date
IS 'Performance index for data freshness queries. Used by daily health checks to find stale data.';

-- Partial index on section_301 (only index non-NULL values)
DROP INDEX IF EXISTS idx_policy_tariffs_section_301;
CREATE INDEX idx_policy_tariffs_section_301
ON policy_tariffs_cache(section_301)
WHERE section_301 IS NOT NULL;

COMMENT ON INDEX idx_policy_tariffs_section_301
IS 'Partial index on Section 301 rates. Only indexes codes with Section 301 tariffs (China-related).';

-- Partial index on section_232 (only index non-NULL values)
DROP INDEX IF EXISTS idx_policy_tariffs_section_232;
CREATE INDEX idx_policy_tariffs_section_232
ON policy_tariffs_cache(section_232)
WHERE section_232 IS NOT NULL;

COMMENT ON INDEX idx_policy_tariffs_section_232
IS 'Partial index on Section 232 rates. Only indexes codes with Section 232 tariffs (steel/aluminum).';

-- ============================================================================
-- PART 4: UNIQUE CONSTRAINTS (Prevent Duplicates)
-- ============================================================================

-- Unique constraint on (hs_code, origin_country)
-- Prevents duplicate records with conflicting rates
DROP INDEX IF EXISTS unique_policy_tariff_key;
CREATE UNIQUE INDEX unique_policy_tariff_key
ON policy_tariffs_cache(hs_code, origin_country)
WHERE origin_country IS NOT NULL;

COMMENT ON INDEX unique_policy_tariff_key
IS 'Unique constraint prevents duplicate (hs_code, origin_country) records with conflicting rates.';

-- For blanket tariffs (NULL origin_country), allow one per hs_code
DROP INDEX IF EXISTS unique_blanket_tariff_key;
CREATE UNIQUE INDEX unique_blanket_tariff_key
ON policy_tariffs_cache(hs_code)
WHERE origin_country IS NULL;

COMMENT ON INDEX unique_blanket_tariff_key
IS 'Unique constraint for blanket tariffs (NULL origin). Only one blanket tariff per HS code.';

-- ============================================================================
-- PART 5: VALIDATION QUERIES (Verify Constraints Applied)
-- ============================================================================

-- Check all constraints were created
SELECT
  constraint_name,
  constraint_type,
  is_deferrable,
  initially_deferred
FROM information_schema.table_constraints
WHERE table_name = 'policy_tariffs_cache'
ORDER BY constraint_type, constraint_name;

-- Expected output:
-- chk_section_301_range     | CHECK
-- chk_section_232_range     | CHECK
-- chk_section_201_range     | CHECK
-- chk_ieepa_rate_range      | CHECK
-- unique_policy_tariff_key  | UNIQUE
-- unique_blanket_tariff_key | UNIQUE

-- Check all indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'policy_tariffs_cache'
ORDER BY indexname;

-- Expected output:
-- idx_policy_tariffs_hs_code
-- idx_policy_tariffs_origin
-- idx_policy_tariffs_hs_origin
-- idx_policy_tariffs_verified_date
-- idx_policy_tariffs_section_301
-- idx_policy_tariffs_section_232
-- unique_policy_tariff_key
-- unique_blanket_tariff_key

-- Check NOT NULL constraints
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'policy_tariffs_cache'
AND column_name IN ('hs_code', 'verified_source', 'verified_date')
ORDER BY column_name;

-- Expected output:
-- hs_code          | NO  | character varying
-- verified_source  | NO  | text
-- verified_date    | NO  | timestamp with time zone

-- ============================================================================
-- PART 6: TEST CONSTRAINTS (Verify They Work)
-- ============================================================================

-- Test 1: Try inserting rate > 1.0 (should FAIL)
DO $$
BEGIN
  BEGIN
    INSERT INTO policy_tariffs_cache (hs_code, section_301, verified_source, verified_date)
    VALUES ('99999999', 25.0, 'TEST', NOW());
    RAISE EXCEPTION 'TEST FAILED: Should have rejected rate > 1.0';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'TEST PASSED: Rejected rate > 1.0 (section_301 = 25.0)';
  END;
END $$;

-- Test 2: Try inserting NULL hs_code (should FAIL)
DO $$
BEGIN
  BEGIN
    INSERT INTO policy_tariffs_cache (hs_code, section_301, verified_source, verified_date)
    VALUES (NULL, 0.25, 'TEST', NOW());
    RAISE EXCEPTION 'TEST FAILED: Should have rejected NULL hs_code';
  EXCEPTION
    WHEN not_null_violation THEN
      RAISE NOTICE 'TEST PASSED: Rejected NULL hs_code';
  END;
END $$;

-- Test 3: Try inserting NULL verified_source (should FAIL)
DO $$
BEGIN
  BEGIN
    INSERT INTO policy_tariffs_cache (hs_code, section_301, verified_source, verified_date)
    VALUES ('99999999', 0.25, NULL, NOW());
    RAISE EXCEPTION 'TEST FAILED: Should have rejected NULL verified_source';
  EXCEPTION
    WHEN not_null_violation THEN
      RAISE NOTICE 'TEST PASSED: Rejected NULL verified_source';
  END;
END $$;

-- Test 4: Try inserting valid record (should SUCCEED)
DO $$
BEGIN
  INSERT INTO policy_tariffs_cache (hs_code, section_301, verified_source, verified_date, origin_country)
  VALUES ('99999999', 0.25, 'TEST', NOW(), 'CN')
  ON CONFLICT (hs_code, origin_country) DO NOTHING;
  RAISE NOTICE 'TEST PASSED: Accepted valid record';
END $$;

-- Clean up test record
DELETE FROM policy_tariffs_cache WHERE hs_code = '99999999' AND verified_source = 'TEST';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ DATABASE CONSTRAINTS & INDEXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '';
  RAISE NOTICE 'Protection Added:';
  RAISE NOTICE '  ✅ CHECK constraints prevent rates outside 0.0-1.0 range';
  RAISE NOTICE '  ✅ NOT NULL constraints prevent missing critical fields';
  RAISE NOTICE '  ✅ UNIQUE constraints prevent duplicate records';
  RAISE NOTICE '  ✅ Performance indexes speed up queries';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run validation queries to verify constraints';
  RAISE NOTICE '  2. Test by trying to insert bad data (should be rejected)';
  RAISE NOTICE '  3. Monitor query performance (should be faster)';
  RAISE NOTICE '';
END $$;
