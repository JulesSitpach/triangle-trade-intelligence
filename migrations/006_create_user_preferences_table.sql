-- Create user preferences table for notification and email settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Email notification preferences
  email_marketing BOOLEAN DEFAULT true,
  email_product_updates BOOLEAN DEFAULT true,
  email_security_alerts BOOLEAN DEFAULT true,
  email_billing_notifications BOOLEAN DEFAULT true,
  email_service_updates BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT false,

  -- SMS notification preferences (future use)
  sms_enabled BOOLEAN DEFAULT false,
  sms_security_alerts BOOLEAN DEFAULT false,

  -- UI preferences
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'America/New_York',
  date_format TEXT DEFAULT 'MM/DD/YYYY',

  -- Privacy settings
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('private', 'public')),
  data_sharing_analytics BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all preferences
CREATE POLICY "Service role can manage preferences"
  ON user_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences when user is created
DROP TRIGGER IF EXISTS create_user_preferences_trigger ON user_profiles;
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();

COMMENT ON TABLE user_preferences IS 'Stores user notification and privacy preferences';
COMMENT ON COLUMN user_preferences.email_marketing IS 'Receive marketing emails and promotions';
COMMENT ON COLUMN user_preferences.email_product_updates IS 'Receive product updates and new features';
COMMENT ON COLUMN user_preferences.email_security_alerts IS 'Receive security alerts (cannot be disabled)';
COMMENT ON COLUMN user_preferences.email_billing_notifications IS 'Receive billing and payment notifications';
