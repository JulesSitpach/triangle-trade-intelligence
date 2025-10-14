-- Add referral tracking columns to user_profiles table
-- This enables tracking who referred trial users and conversion metrics

-- Add referral tracking columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS referral_converted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_converted_date TIMESTAMPTZ;

-- Create index for referral queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by
ON user_profiles(referred_by)
WHERE referred_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_source
ON user_profiles(referral_source);

-- Add helpful comments
COMMENT ON COLUMN user_profiles.referred_by IS 'Name of person who referred this user (e.g., "Adam Williams")';
COMMENT ON COLUMN user_profiles.referral_source IS 'Source/platform of referral (e.g., "linkedin", "email", "direct")';
COMMENT ON COLUMN user_profiles.referral_date IS 'Date when user signed up via referral';
COMMENT ON COLUMN user_profiles.referral_converted IS 'Whether referral converted to paid subscription';
COMMENT ON COLUMN user_profiles.referral_converted_date IS 'Date when referral converted to paid';
