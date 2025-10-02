-- Add trial tracking columns to user_profiles table
-- This enables 14-day free trial management for new users

-- Add trial tracking columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;

-- Set trial dates for existing users (backfill)
-- Users with active subscriptions are marked as trial_used=true
UPDATE user_profiles
SET
  trial_start_date = created_at,
  trial_end_date = created_at + INTERVAL '14 days',
  trial_used = CASE
    WHEN subscription_tier IN ('professional', 'business', 'enterprise')
      AND status = 'active'
    THEN true
    ELSE false
  END
WHERE trial_start_date IS NULL;

-- Create index for trial queries (important for performance)
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_end
ON user_profiles(trial_end_date)
WHERE trial_used = false;

-- Add helpful comments
COMMENT ON COLUMN user_profiles.trial_start_date IS '14-day free trial start date (set on registration)';
COMMENT ON COLUMN user_profiles.trial_end_date IS '14-day free trial expiration date';
COMMENT ON COLUMN user_profiles.trial_used IS 'Whether user has used their free trial (prevents multiple trials)';
