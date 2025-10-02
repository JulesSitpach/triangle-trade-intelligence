-- Migration: Add Terms of Service and Privacy Policy acceptance tracking
-- Date: 2025-10-02
-- Description: Add fields to track when users accept legal terms

-- Add terms acceptance fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Create index for compliance queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_terms_accepted
ON user_profiles(terms_accepted_at)
WHERE terms_accepted_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.terms_accepted_at IS 'Timestamp when user accepted Terms of Service';
COMMENT ON COLUMN user_profiles.privacy_accepted_at IS 'Timestamp when user accepted Privacy Policy';

-- Backfill existing users with current timestamp (they implicitly accepted by using the platform)
UPDATE user_profiles
SET
  terms_accepted_at = COALESCE(created_at, NOW()),
  privacy_accepted_at = COALESCE(created_at, NOW())
WHERE terms_accepted_at IS NULL OR privacy_accepted_at IS NULL;
