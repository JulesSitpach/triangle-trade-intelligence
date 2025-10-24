-- =====================================================
-- Migration: Add unique constraint to tariff_rates_cache
-- Date: October 24, 2025
-- Purpose: Prevent duplicate cache entries for same HS code + destination
--          Eliminates redundant entries that increase storage and query costs
-- =====================================================

-- Add unique constraint: no duplicates for same HS code + destination
-- This prevents the N+1 duplication issue identified in tariff caching
-- Impact: Ensures single source of truth for each HS code per destination
ALTER TABLE tariff_rates_cache
ADD CONSTRAINT unique_hs_code_destination
UNIQUE (hs_code, destination_country) WHERE expires_at > NOW();

-- Create index for efficient lookups by HS code + destination
CREATE INDEX IF NOT EXISTS idx_tariff_cache_hs_destination
ON tariff_rates_cache(hs_code, destination_country);

-- Clean up any existing duplicates before constraint takes effect
-- Keep the most recent entry for each HS code + destination combination
DELETE FROM tariff_rates_cache t1
WHERE EXISTS (
  SELECT 1 FROM tariff_rates_cache t2
  WHERE t1.hs_code = t2.hs_code
  AND t1.destination_country = t2.destination_country
  AND t1.id < t2.id  -- Delete older entries
  AND t1.expires_at > NOW()
  AND t2.expires_at > NOW()
);

-- Verify cleanup
/*
SELECT
    hs_code,
    destination_country,
    COUNT(*) as duplicate_count
FROM tariff_rates_cache
WHERE expires_at > NOW()
GROUP BY hs_code, destination_country
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
*/
