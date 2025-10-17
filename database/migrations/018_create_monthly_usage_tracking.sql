/**
 * Monthly Analysis Usage Tracking
 * Tracks USMCA analyses per user per month for subscription tier limits
 *
 * Limits:
 * - Trial: 1 analysis total (7 days)
 * - Starter: 10 analyses/month
 * - Professional: 100 analyses/month
 * - Premium: Unlimited (no tracking needed but track for analytics)
 */

-- Create monthly usage tracking table
CREATE TABLE IF NOT EXISTS monthly_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  analyses_count INTEGER DEFAULT 0,
  subscription_tier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per billing period
  UNIQUE(user_id, billing_period_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_period
ON monthly_usage_tracking(user_id, billing_period_start);

CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_id
ON monthly_usage_tracking(user_id);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_monthly_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_usage_timestamp
BEFORE UPDATE ON monthly_usage_tracking
FOR EACH ROW
EXECUTE FUNCTION update_monthly_usage_timestamp();

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
  v_period_start DATE;
  v_period_end DATE;
  v_current_count INTEGER;
  v_tier_limit INTEGER;
  v_limit_reached BOOLEAN;
BEGIN
  -- Get current billing period
  SELECT period_start, period_end
  INTO v_period_start, v_period_end
  FROM get_current_billing_period();

  -- Determine tier limit
  v_tier_limit := CASE p_subscription_tier
    WHEN 'Trial' THEN 1
    WHEN 'Starter' THEN 10
    WHEN 'Professional' THEN 100
    WHEN 'Premium' THEN 999999  -- Effectively unlimited
    ELSE 1  -- Default to Trial if unknown
  END;

  -- Insert or update usage record
  INSERT INTO monthly_usage_tracking (
    user_id,
    billing_period_start,
    billing_period_end,
    analyses_count,
    subscription_tier
  ) VALUES (
    p_user_id,
    v_period_start,
    v_period_end,
    1,
    p_subscription_tier
  )
  ON CONFLICT (user_id, billing_period_start)
  DO UPDATE SET
    analyses_count = monthly_usage_tracking.analyses_count + 1,
    subscription_tier = p_subscription_tier,
    updated_at = NOW()
  RETURNING monthly_usage_tracking.analyses_count
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
  v_period_start DATE;
  v_period_end DATE;
  v_current_count INTEGER;
  v_tier_limit INTEGER;
  v_remaining INTEGER;
  v_limit_reached BOOLEAN;
BEGIN
  -- Get current billing period
  SELECT period_start, period_end
  INTO v_period_start, v_period_end
  FROM get_current_billing_period();

  -- Determine tier limit
  v_tier_limit := CASE p_subscription_tier
    WHEN 'Trial' THEN 1
    WHEN 'Starter' THEN 10
    WHEN 'Professional' THEN 100
    WHEN 'Premium' THEN 999999
    ELSE 1
  END;

  -- Get current count (default 0 if no record exists)
  SELECT COALESCE(analyses_count, 0)
  INTO v_current_count
  FROM monthly_usage_tracking
  WHERE user_id = p_user_id
    AND billing_period_start = v_period_start;

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

-- Row Level Security (RLS)
ALTER TABLE monthly_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view own usage"
ON monthly_usage_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update for all users
CREATE POLICY "Service role can manage usage"
ON monthly_usage_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON monthly_usage_tracking TO authenticated;
GRANT ALL ON monthly_usage_tracking TO service_role;

-- Add comment for documentation
COMMENT ON TABLE monthly_usage_tracking IS 'Tracks monthly USMCA analysis usage per user for subscription tier limits';
COMMENT ON FUNCTION increment_analysis_count IS 'Increments analysis count for user and checks if limit reached';
COMMENT ON FUNCTION check_analysis_limit IS 'Checks current usage without incrementing';
