/**
 * Fix Monthly Usage Tracking Schema - Oct 28, 2025
 *
 * PROBLEM: Migration 018 created columns that don't match the JavaScript code
 * - Created: billing_period_start, billing_period_end, analyses_count
 * - Expected: month_year, analysis_count
 *
 * SOLUTION: Alter table to rename columns to match JavaScript expectations
 */

-- First, drop the old RPC functions that reference the old schema
DROP FUNCTION IF EXISTS increment_analysis_count(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS check_analysis_limit(UUID, TEXT) CASCADE;

-- Rename billing_period_start to month_year (YYYY-MM format)
-- This requires creating a new column, migrating data, then dropping the old one
BEGIN;

-- Add new month_year column if it doesn't exist
ALTER TABLE monthly_usage_tracking
ADD COLUMN IF NOT EXISTS month_year TEXT;

-- Populate month_year from billing_period_start (convert DATE to YYYY-MM format)
UPDATE monthly_usage_tracking
SET month_year = TO_CHAR(billing_period_start, 'YYYY-MM')
WHERE month_year IS NULL AND billing_period_start IS NOT NULL;

-- Rename analyses_count to analysis_count
ALTER TABLE monthly_usage_tracking
RENAME COLUMN analyses_count TO analysis_count;

-- Rename billing_period_end to billing_period_end_archive (keep for backwards compat)
-- Actually, we don't need it anymore since we're using month_year
-- But keep it for now in case it's referenced elsewhere

-- Update the unique constraint to use month_year instead of billing_period_start
ALTER TABLE monthly_usage_tracking
DROP CONSTRAINT IF EXISTS monthly_usage_tracking_user_id_billing_period_start_key;

-- Add new unique constraint on user_id + month_year
ALTER TABLE monthly_usage_tracking
ADD CONSTRAINT monthly_usage_tracking_user_id_month_year_key UNIQUE(user_id, month_year);

-- Drop old indexes and create new ones
DROP INDEX IF EXISTS idx_monthly_usage_user_period;

CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_month_year
ON monthly_usage_tracking(user_id, month_year);

-- Recreate the RPC functions with correct schema

-- Function to get current billing period (calendar month)
CREATE OR REPLACE FUNCTION get_current_billing_period()
RETURNS TABLE(period_start DATE, period_end DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', CURRENT_DATE)::DATE as period_start,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE as period_end;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage count (idempotent)
CREATE OR REPLACE FUNCTION increment_analysis_count(
  p_user_id UUID,
  p_subscription_tier TEXT DEFAULT 'Trial'
)
RETURNS TABLE(
  current_count INTEGER,
  limit_reached BOOLEAN,
  tier_limit INTEGER
) AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_tier_limit INTEGER;
  v_limit_reached BOOLEAN;
BEGIN
  -- Get current month in YYYY-MM format
  v_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Determine tier limit (✅ FIXED Nov 8, 2025: Starter 10→15, Premium 999999→500)
  v_tier_limit := CASE p_subscription_tier
    WHEN 'Trial' THEN 1
    WHEN 'Starter' THEN 15        -- ✅ FIXED: Was 10, now 15 (matches pricing page)
    WHEN 'Professional' THEN 100
    WHEN 'Premium' THEN 500       -- ✅ FIXED: Was 999999, now 500 (prevents AI cost abuse)
    ELSE 1  -- Default to Trial if unknown
  END;

  -- Insert or update usage record
  INSERT INTO monthly_usage_tracking (
    user_id,
    month_year,
    billing_period_start,
    billing_period_end,
    analysis_count,
    subscription_tier
  ) VALUES (
    p_user_id,
    v_month_year,
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
    1,
    p_subscription_tier
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    analysis_count = monthly_usage_tracking.analysis_count + 1,
    subscription_tier = p_subscription_tier,
    updated_at = NOW()
  RETURNING monthly_usage_tracking.analysis_count
  INTO v_current_count;

  -- Check if limit reached
  v_limit_reached := v_current_count >= v_tier_limit;

  -- Return results
  RETURN QUERY
  SELECT v_current_count, v_limit_reached, v_tier_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to check usage without incrementing
CREATE OR REPLACE FUNCTION check_analysis_limit(
  p_user_id UUID,
  p_subscription_tier TEXT DEFAULT 'Trial'
)
RETURNS TABLE(
  current_count INTEGER,
  tier_limit INTEGER,
  remaining_analyses INTEGER,
  limit_reached BOOLEAN
) AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_tier_limit INTEGER;
  v_remaining INTEGER;
  v_limit_reached BOOLEAN;
BEGIN
  -- Get current month in YYYY-MM format
  v_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Determine tier limit (✅ FIXED Nov 8, 2025: Starter 10→15, Premium 999999→500)
  v_tier_limit := CASE p_subscription_tier
    WHEN 'Trial' THEN 1
    WHEN 'Starter' THEN 15        -- ✅ FIXED: Was 10, now 15
    WHEN 'Professional' THEN 100
    WHEN 'Premium' THEN 500       -- ✅ FIXED: Was 999999, now 500
    ELSE 1
  END;

  -- Get current count (default 0 if no record exists)
  SELECT COALESCE(analysis_count, 0)
  INTO v_current_count
  FROM monthly_usage_tracking
  WHERE user_id = p_user_id
    AND month_year = v_month_year;

  -- If no record exists, count is 0
  v_current_count := COALESCE(v_current_count, 0);

  -- Calculate remaining
  v_remaining := GREATEST(0, v_tier_limit - v_current_count);
  v_limit_reached := v_current_count >= v_tier_limit;

  -- Return results
  RETURN QUERY
  SELECT v_current_count, v_tier_limit, v_remaining, v_limit_reached;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Update trigger to handle the new schema
CREATE OR REPLACE FUNCTION update_monthly_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_monthly_usage_timestamp ON monthly_usage_tracking;

CREATE TRIGGER trigger_update_monthly_usage_timestamp
BEFORE UPDATE ON monthly_usage_tracking
FOR EACH ROW
EXECUTE FUNCTION update_monthly_usage_timestamp();

-- Update RLS policy comment
COMMENT ON FUNCTION increment_analysis_count IS 'Increments analysis count for user and checks if limit reached (uses month_year column)';
COMMENT ON FUNCTION check_analysis_limit IS 'Checks current usage without incrementing (uses month_year column)';
