/**
 * Add Cache TTL Logic to tariff_rates_cache
 * Implements type-specific expiration for volatile tariff data
 *
 * Problem: Section 301/232 rates are volatile but cached indefinitely
 * Solution: Add data_type field + automatic TTL calculation + staleness check
 *
 * Created: November 6, 2025
 */

-- Add data_type column to track what kind of data is cached
ALTER TABLE public.tariff_rates_cache
ADD COLUMN IF NOT EXISTS data_type TEXT DEFAULT 'tariff_rate';

-- Add is_stale computed column for easy filtering
ALTER TABLE public.tariff_rates_cache
ADD COLUMN IF NOT EXISTS is_stale BOOLEAN
GENERATED ALWAYS AS (
  CASE
    WHEN expires_at IS NULL THEN false  -- No expiration = never stale
    WHEN NOW() > expires_at THEN true   -- Past expiration = stale
    ELSE false
  END
) STORED;

-- Add index for staleness queries
CREATE INDEX IF NOT EXISTS idx_tariff_cache_staleness
ON public.tariff_rates_cache(hs_code, is_stale, cached_at DESC);

-- Update existing NULL expires_at based on data characteristics
-- Section 301/232 = 7 day TTL (highly volatile)
-- MFN rates = 90 day TTL (rarely change)
-- Default = 30 day TTL
UPDATE public.tariff_rates_cache
SET expires_at = CASE
  -- If Section 301 or 232 exists, this is volatile policy data (7 days)
  WHEN (section_301 > 0 OR section_232 > 0) THEN cached_at + INTERVAL '7 days'
  -- Pure MFN rates (no policy adjustments) are stable (90 days)
  WHEN (section_301 = 0 AND section_232 = 0) THEN cached_at + INTERVAL '90 days'
  -- Default safety (30 days)
  ELSE cached_at + INTERVAL '30 days'
END
WHERE expires_at IS NULL;

-- Function to calculate expiration based on data type
CREATE OR REPLACE FUNCTION calculate_cache_expiration(
  p_data_type TEXT,
  p_section_301 NUMERIC,
  p_section_232 NUMERIC
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  -- Section 301 (China tariffs) - 7 day TTL (changes frequently)
  IF p_section_301 > 0 THEN
    RETURN NOW() + INTERVAL '7 days';
  END IF;

  -- Section 232 (Steel/Aluminum) - 30 day TTL (less volatile)
  IF p_section_232 > 0 THEN
    RETURN NOW() + INTERVAL '30 days';
  END IF;

  -- Pure MFN rates - 90 day TTL (very stable)
  RETURN NOW() + INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically set expires_at on INSERT
CREATE OR REPLACE FUNCTION set_cache_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := calculate_cache_expiration(
      NEW.data_type,
      COALESCE(NEW.section_301, 0),
      COALESCE(NEW.section_232, 0)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tariff_cache_set_expiration ON public.tariff_rates_cache;
CREATE TRIGGER tariff_cache_set_expiration
BEFORE INSERT ON public.tariff_rates_cache
FOR EACH ROW
EXECUTE FUNCTION set_cache_expiration();

-- Comments for documentation
COMMENT ON COLUMN public.tariff_rates_cache.data_type IS 'Type of cached data: tariff_rate (default)';
COMMENT ON COLUMN public.tariff_rates_cache.is_stale IS 'Auto-computed: true if NOW() > expires_at';
COMMENT ON COLUMN public.tariff_rates_cache.expires_at IS 'Auto-calculated based on volatility: Section 301=7d, Section 232=30d, MFN=90d';

-- Create view for monitoring stale cache entries
CREATE OR REPLACE VIEW public.stale_tariff_cache AS
SELECT
  hs_code,
  component_description,
  origin_country,
  destination_country,
  section_301,
  section_232,
  data_type,
  cached_at,
  expires_at,
  EXTRACT(DAY FROM (NOW() - expires_at)) AS days_stale,
  CASE
    WHEN section_301 > 0 THEN 'Section 301 (China) - 7 day TTL'
    WHEN section_232 > 0 THEN 'Section 232 (Steel/Al) - 30 day TTL'
    ELSE 'MFN rate - 90 day TTL'
  END AS volatility_reason
FROM public.tariff_rates_cache
WHERE is_stale = true
ORDER BY expires_at ASC;

COMMENT ON VIEW public.stale_tariff_cache IS 'Monitoring view: all stale cache entries that need refresh';
