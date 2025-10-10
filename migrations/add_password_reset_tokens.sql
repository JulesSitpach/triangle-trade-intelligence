-- Add password reset token columns to user_profiles table
-- Run this migration in Supabase SQL Editor

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_reset_token
ON user_profiles(reset_token)
WHERE reset_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_profiles.reset_token IS 'Temporary token for password reset (cleared after use)';
COMMENT ON COLUMN user_profiles.reset_token_expiry IS 'Expiration timestamp for reset token (1 hour validity)';
