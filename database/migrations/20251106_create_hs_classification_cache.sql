/**
 * HS Classification Cache Table
 * Permanently caches AI-classified HS codes (classifications don't change)
 *
 * Problem: ClassificationAgent makes fresh AI call every time (~$0.01 per classification)
 * Solution: Cache classifications permanently (HS codes are stable, no expiration needed)
 *
 * Cost Savings:
 * - First classification: $0.01 (AI call)
 * - Subsequent lookups: $0.00 (database hit)
 * - Expected: 80%+ cache hit rate after first week
 *
 * Created: November 6, 2025
 */

-- Create hs_classification_cache table
CREATE TABLE IF NOT EXISTS public.hs_classification_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification Input (cache key)
  component_description TEXT NOT NULL,
  component_description_normalized TEXT NOT NULL,  -- Lowercase, trimmed for matching

  -- Classification Output
  hs_code VARCHAR(10) NOT NULL,
  hs_description TEXT,
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Context & Metadata
  origin_country VARCHAR(2),
  product_category VARCHAR(100),
  industry_sector VARCHAR(100),

  -- Data Quality
  classification_source TEXT DEFAULT 'ai_classification',
  ai_model TEXT DEFAULT 'anthropic/claude-haiku-4.5',
  ai_reasoning TEXT,  -- Why this HS code was chosen

  -- Usage Tracking
  times_used INTEGER DEFAULT 1,  -- How many times this cached classification was reused
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Audit Trail
  classified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  classified_by_workflow_id UUID,
  classified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Composite index for fast cache lookups (description-based)
CREATE INDEX IF NOT EXISTS idx_hs_classification_lookup
ON public.hs_classification_cache(component_description_normalized, origin_country);

-- Index for HS code reverse lookups
CREATE INDEX IF NOT EXISTS idx_hs_classification_by_code
ON public.hs_classification_cache(hs_code, confidence_score DESC);

-- Index for monitoring usage patterns
CREATE INDEX IF NOT EXISTS idx_hs_classification_usage
ON public.hs_classification_cache(times_used DESC, last_used_at DESC);

-- Index for low-confidence classifications (for manual review)
CREATE INDEX IF NOT EXISTS idx_hs_classification_low_confidence
ON public.hs_classification_cache(confidence_score ASC)
WHERE confidence_score < 0.70;

-- Enable Row Level Security
ALTER TABLE public.hs_classification_cache ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read cache
CREATE POLICY "Authenticated users can read classification cache"
ON public.hs_classification_cache
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only service role can insert/update cache
CREATE POLICY "Service role can insert classification cache"
ON public.hs_classification_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update classification cache"
ON public.hs_classification_cache
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger: Update updated_at on row modification
CREATE OR REPLACE FUNCTION update_hs_classification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hs_classification_updated_at
BEFORE UPDATE ON public.hs_classification_cache
FOR EACH ROW
EXECUTE FUNCTION update_hs_classification_timestamp();

-- Trigger: Auto-normalize description on insert
CREATE OR REPLACE FUNCTION normalize_component_description()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize: lowercase, trim whitespace, remove extra spaces
  NEW.component_description_normalized := LOWER(TRIM(REGEXP_REPLACE(NEW.component_description, '\s+', ' ', 'g')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hs_classification_normalize_description
BEFORE INSERT OR UPDATE ON public.hs_classification_cache
FOR EACH ROW
EXECUTE FUNCTION normalize_component_description();

-- Function: Increment times_used counter when cache hit
CREATE OR REPLACE FUNCTION increment_classification_usage(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.hs_classification_cache
  SET
    times_used = times_used + 1,
    last_used_at = NOW()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.hs_classification_cache IS 'Permanent cache of AI-classified HS codes (no expiration - classifications are stable)';
COMMENT ON COLUMN public.hs_classification_cache.component_description_normalized IS 'Normalized description for fuzzy matching (lowercase, trimmed)';
COMMENT ON COLUMN public.hs_classification_cache.confidence_score IS 'AI confidence 0.0-1.0 (0.95 = 95% confident)';
COMMENT ON COLUMN public.hs_classification_cache.times_used IS 'Cache hit counter - how many times this classification was reused';
COMMENT ON COLUMN public.hs_classification_cache.last_used_at IS 'Last time this cached classification was accessed';

-- Create monitoring view for cache performance
CREATE OR REPLACE VIEW public.hs_classification_cache_stats AS
SELECT
  COUNT(*) AS total_cached_classifications,
  COUNT(DISTINCT hs_code) AS unique_hs_codes,
  SUM(times_used) AS total_cache_hits,
  ROUND(AVG(confidence_score), 2) AS avg_confidence,
  COUNT(*) FILTER (WHERE confidence_score < 0.70) AS low_confidence_count,
  COUNT(*) FILTER (WHERE times_used > 1) AS reused_classifications,
  ROUND(100.0 * COUNT(*) FILTER (WHERE times_used > 1) / COUNT(*), 1) AS reuse_rate_percent
FROM public.hs_classification_cache;

COMMENT ON VIEW public.hs_classification_cache_stats IS 'Cache performance metrics: hit rate, confidence distribution, reuse statistics';

-- Create view for low-confidence classifications (manual review needed)
CREATE OR REPLACE VIEW public.hs_classification_review_needed AS
SELECT
  component_description,
  hs_code,
  hs_description,
  confidence_score,
  times_used,
  classified_at,
  ai_reasoning
FROM public.hs_classification_cache
WHERE confidence_score < 0.70
ORDER BY times_used DESC, confidence_score ASC;

COMMENT ON VIEW public.hs_classification_review_needed IS 'Low-confidence classifications that may need manual verification';
