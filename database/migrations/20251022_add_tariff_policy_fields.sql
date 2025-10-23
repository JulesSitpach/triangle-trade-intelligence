-- =====================================================
-- Migration: Add explicit policy tariff fields
-- Date: October 22, 2025
-- Purpose: Store Section 301, Section 232, and total_rate
--          as numeric columns for better query performance
-- =====================================================

-- Add policy-specific tariff columns to tariff_rates_cache
ALTER TABLE tariff_rates_cache
ADD COLUMN IF NOT EXISTS section_301 NUMERIC(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS section_232 NUMERIC(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_rate NUMERIC(10,4);

-- Create indexes for policy-specific queries
CREATE INDEX IF NOT EXISTS idx_tariff_cache_section_301
ON tariff_rates_cache(section_301)
WHERE section_301 > 0;

CREATE INDEX IF NOT EXISTS idx_tariff_cache_section_232
ON tariff_rates_cache(section_232)
WHERE section_232 > 0;

CREATE INDEX IF NOT EXISTS idx_tariff_cache_total_rate
ON tariff_rates_cache(total_rate DESC);

-- Add comments for documentation
COMMENT ON COLUMN tariff_rates_cache.section_301 IS
'Section 301 tariff rate (%) - Extra duties on Chinese-origin goods when destination is USA';

COMMENT ON COLUMN tariff_rates_cache.section_232 IS
'Section 232 tariff rate (%) - Steel/aluminum duties or other safeguard measures';

COMMENT ON COLUMN tariff_rates_cache.total_rate IS
'Total effective tariff rate (%) - Sum of base MFN + Section 301 + Section 232 + other policies';

-- Backfill total_rate for existing cache entries (if not already calculated)
UPDATE tariff_rates_cache
SET total_rate = COALESCE(mfn_rate, 0) + COALESCE(section_301, 0) + COALESCE(section_232, 0)
WHERE total_rate IS NULL AND mfn_rate IS NOT NULL;

-- Add verification query
/*
SELECT
    COUNT(*) as total_rows,
    COUNT(CASE WHEN section_301 > 0 THEN 1 END) as rows_with_section_301,
    COUNT(CASE WHEN section_232 > 0 THEN 1 END) as rows_with_section_232,
    COUNT(CASE WHEN total_rate > 0 THEN 1 END) as rows_with_total_rate,
    AVG(total_rate) as avg_total_rate
FROM tariff_rates_cache;
*/
