/**
 * Subscription Lock Period
 * Prevents plan gaming by locking subscription changes for:
 * - Unlimited tier: 60 days (requires 2-month commitment for $599)
 * - Professional tier: 30 days (requires 1-month commitment)
 * - Starter tier: 0 days (cancel anytime)
 */

-- Add locked_until column to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Add comment explaining the column
COMMENT ON COLUMN subscriptions.locked_until IS 'User cannot downgrade/cancel subscription before this date. NULL = no lock.';

-- Create index for efficient downgrade eligibility checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_locked_until
ON subscriptions(user_id, locked_until);

-- Helper function to check if user can downgrade
CREATE OR REPLACE FUNCTION can_user_downgrade(p_user_id UUID)
RETURNS TABLE(can_downgrade BOOLEAN, locked_until TIMESTAMPTZ, days_remaining INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN sub.locked_until IS NULL THEN true
      WHEN NOW() >= sub.locked_until THEN true
      ELSE false
    END as can_downgrade,
    sub.locked_until,
    CASE
      WHEN sub.locked_until IS NULL THEN 0
      ELSE CEIL(EXTRACT(EPOCH FROM (sub.locked_until - NOW())) / 86400)::INTEGER
    END as days_remaining
  FROM subscriptions sub
  WHERE sub.user_id = p_user_id
  ORDER BY sub.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function to set lock period based on tier
CREATE OR REPLACE FUNCTION calculate_lock_period(p_tier_name TEXT)
RETURNS INTERVAL AS $$
BEGIN
  RETURN CASE p_tier_name
    WHEN 'Unlimited' THEN INTERVAL '60 days'
    WHEN 'Professional' THEN INTERVAL '30 days'
    WHEN 'Starter' THEN INTERVAL '0 days'
    ELSE INTERVAL '0 days'
  END;
END;
$$ LANGUAGE plpgsql;
