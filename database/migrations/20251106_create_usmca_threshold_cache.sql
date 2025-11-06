/**
 * USMCA Threshold Cache Table
 * Stores AI-verified current RVC thresholds with timestamp and staleness tracking
 *
 * Purpose: Replace static industry_thresholds with dynamic AI-verified values
 * Cache Duration: 30 days (mark stale after)
 * Refresh Strategy: AI fetches new value when cache stale or missing
 *
 * Created: November 6, 2025
 */

-- Create usmca_threshold_cache table
CREATE TABLE IF NOT EXISTS public.usmca_threshold_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  hs_code VARCHAR(10) NOT NULL,  -- Normalized HS code (no periods)
  product_category VARCHAR(100) NOT NULL,  -- Industry category (Electronics, Automotive, etc.)

  -- Threshold Data
  rvc_threshold_percent DECIMAL(5,2) NOT NULL,  -- Regional Value Content % (e.g., 65.00)
  labor_credit_percent DECIMAL(5,2) DEFAULT 0,  -- Manufacturing labor credit % (usually 0 in 2025)
  treaty_article VARCHAR(50) NOT NULL,  -- USMCA article reference (e.g., "Annex 4-B Art. 4.7")
  calculation_method VARCHAR(50) DEFAULT 'Transaction Value',  -- RVC calculation method
  preference_criterion CHAR(1) DEFAULT 'B',  -- USMCA Certificate Field 7 (A/B/C/D)

  -- Data Quality
  data_source VARCHAR(50) NOT NULL,  -- Source: "USMCA Annex 4-B", "USMCA Chapter 4", "USTR", etc.
  confidence_level VARCHAR(20) DEFAULT 'medium',  -- Confidence: high, medium, low
  last_verified_date DATE,  -- Date AI last verified this threshold (for freshness tracking)

  -- Caching Metadata
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cached_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- User who triggered cache
  cached_by_workflow_id UUID,  -- Workflow that triggered cache (for debugging)
  cached_by_company VARCHAR(255),  -- Company name (for debugging)

  -- Indexes for fast lookups
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Composite index for cache lookups (HS code + category + freshness)
CREATE INDEX IF NOT EXISTS idx_threshold_cache_lookup
ON public.usmca_threshold_cache(hs_code, product_category, cached_at DESC);

-- Index for staleness monitoring (find caches >30 days old)
CREATE INDEX IF NOT EXISTS idx_threshold_cache_staleness
ON public.usmca_threshold_cache(cached_at);

-- Index for user tracking (who's using which thresholds)
CREATE INDEX IF NOT EXISTS idx_threshold_cache_user
ON public.usmca_threshold_cache(cached_by_user_id, cached_at DESC);

-- Enable Row Level Security
ALTER TABLE public.usmca_threshold_cache ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read cache (public data)
CREATE POLICY "Authenticated users can read threshold cache"
ON public.usmca_threshold_cache
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only system (service role) can insert/update cache
CREATE POLICY "Service role can insert threshold cache"
ON public.usmca_threshold_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update threshold cache"
ON public.usmca_threshold_cache
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger: Update updated_at on row modification
CREATE OR REPLACE FUNCTION update_threshold_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER threshold_cache_updated_at
BEFORE UPDATE ON public.usmca_threshold_cache
FOR EACH ROW
EXECUTE FUNCTION update_threshold_cache_timestamp();

-- Comments for documentation
COMMENT ON TABLE public.usmca_threshold_cache IS 'AI-verified USMCA RVC thresholds with 30-day cache expiry';
COMMENT ON COLUMN public.usmca_threshold_cache.hs_code IS 'Normalized HS code without periods (e.g., 854231)';
COMMENT ON COLUMN public.usmca_threshold_cache.rvc_threshold_percent IS 'Regional Value Content threshold percentage required for USMCA qualification';
COMMENT ON COLUMN public.usmca_threshold_cache.treaty_article IS 'USMCA treaty article reference for legal compliance';
COMMENT ON COLUMN public.usmca_threshold_cache.confidence_level IS 'AI confidence: high (Annex 4-B specific), medium (chapter rules), low (default)';
COMMENT ON COLUMN public.usmca_threshold_cache.cached_at IS 'Timestamp of cache entry - mark stale after 30 days';
