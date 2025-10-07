-- Add password_hash column to user_profiles table
-- This enables secure password authentication

-- Add the column (allow NULL initially for existing users)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index for faster lookups (email is already indexed, this is just for completeness)
CREATE INDEX IF NOT EXISTS idx_user_profiles_password_hash
ON user_profiles(password_hash)
WHERE password_hash IS NOT NULL;

-- Note: Existing users without password_hash will need to reset their password
-- or you can migrate them manually with a default hashed password
