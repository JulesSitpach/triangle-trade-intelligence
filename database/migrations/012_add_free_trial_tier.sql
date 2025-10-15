-- Add Free Trial Tier Support
-- Creates automatic user profile creation with Trial tier on signup

-- Function to auto-create user profile after auth.users insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile with Trial tier by default
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    company_name,
    subscription_tier,
    status,
    created_at,
    terms_accepted_at,
    privacy_accepted_at,
    email_notifications
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Company Name'),
    'Trial',  -- Default to Trial tier for all new signups
    'active',
    NOW(),
    COALESCE((NEW.raw_user_meta_data->>'terms_accepted_at')::timestamp, NOW()),
    COALESCE((NEW.raw_user_meta_data->>'privacy_accepted_at')::timestamp, NOW()),
    true  -- Email notifications enabled by default
  )
  ON CONFLICT (id) DO NOTHING;  -- Skip if profile already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add email_notifications column if it doesn't exist
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Update existing users without a tier to Trial
UPDATE public.user_profiles
SET subscription_tier = 'Trial'
WHERE subscription_tier IS NULL OR subscription_tier = '';

-- Add index on subscription_tier for faster tier-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier
ON public.user_profiles(subscription_tier);

COMMENT ON COLUMN public.user_profiles.subscription_tier IS
'User subscription tier: Trial (free), Starter ($99), Professional ($299), Premium ($599), Enterprise (custom)';

COMMENT ON COLUMN public.user_profiles.email_notifications IS
'Whether user receives email notifications for crisis alerts (paid tiers only can receive emails)';
