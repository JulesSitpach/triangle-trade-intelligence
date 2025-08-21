-- Subscription management tables for Triangle Intelligence
-- Run this SQL in your Supabase SQL editor

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- User preferences
  preferred_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  company_name TEXT,
  business_type TEXT,
  
  -- Profile status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe fields
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  
  -- Subscription details
  tier TEXT NOT NULL CHECK (tier IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete')),
  
  -- Billing
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id) -- One active subscription per user
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Usage counters (reset monthly)
  monthly_analyses INTEGER DEFAULT 0,
  saved_routes INTEGER DEFAULT 0,
  alert_channels INTEGER DEFAULT 0,
  marcus_consultations INTEGER DEFAULT 0,
  
  -- Reset tracking
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one record per billing period
  UNIQUE(user_id, current_period_start)
);

-- Subscription events log
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'created', 'updated', 'canceled', 'payment_succeeded', etc.
  stripe_event_id TEXT,
  
  -- Event data (JSON for flexibility)
  event_data JSONB,
  
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON subscription_usage(current_period_start, current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_id ON subscription_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_processed ON subscription_events(processed);

-- RLS Policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Subscription policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON subscription_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage usage" ON subscription_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Events are managed by service role only
CREATE POLICY "Service role can manage events" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');

-- Helper functions

-- Function to get current user subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  tier TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.tier, s.status, s.current_period_end, s.cancel_at_period_end
  FROM subscriptions s
  WHERE s.user_id = user_uuid AND s.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  user_uuid UUID,
  usage_type TEXT,
  increment_amount INTEGER DEFAULT 1
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_amount INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  user_tier TEXT;
  tier_limits JSONB;
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get user's current tier
  SELECT s.tier INTO user_tier
  FROM subscriptions s
  WHERE s.user_id = user_uuid AND s.status = 'active'
  LIMIT 1;
  
  -- If no active subscription, return not allowed
  IF user_tier IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Define tier limits
  tier_limits := '{
    "STARTER": {"monthlyAnalyses": 50, "savedRoutes": 10, "alertChannels": 1, "marcusConsultations": 5},
    "PROFESSIONAL": {"monthlyAnalyses": 500, "savedRoutes": 100, "alertChannels": 5, "marcusConsultations": 50},
    "ENTERPRISE": {"monthlyAnalyses": -1, "savedRoutes": -1, "alertChannels": -1, "marcusConsultations": -1}
  }'::jsonb;
  
  -- Get the limit for this tier and usage type
  max_limit := (tier_limits -> user_tier ->> usage_type)::INTEGER;
  
  -- If unlimited (-1), always allow
  IF max_limit = -1 THEN
    RETURN QUERY SELECT TRUE, 0, -1, -1;
    RETURN;
  END IF;
  
  -- Get current usage
  EXECUTE format('SELECT COALESCE(%I, 0) FROM subscription_usage WHERE user_id = $1 AND current_period_start <= now() AND current_period_end > now()', usage_type)
  INTO current_count
  USING user_uuid;
  
  current_count := COALESCE(current_count, 0);
  
  -- Check if increment would exceed limit
  IF current_count + increment_amount <= max_limit THEN
    RETURN QUERY SELECT TRUE, current_count, max_limit, max_limit - current_count - increment_amount;
  ELSE
    RETURN QUERY SELECT FALSE, current_count, max_limit, max_limit - current_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid UUID,
  usage_type TEXT,
  increment_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  usage_check RECORD;
  current_period_start TIMESTAMP WITH TIME ZONE;
  current_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if usage is allowed
  SELECT * INTO usage_check FROM check_usage_limit(user_uuid, usage_type, increment_amount);
  
  IF NOT usage_check.allowed THEN
    RETURN FALSE;
  END IF;
  
  -- Get current billing period
  SELECT s.current_period_start, s.current_period_end
  INTO current_period_start, current_period_end
  FROM subscriptions s
  WHERE s.user_id = user_uuid AND s.status = 'active'
  LIMIT 1;
  
  -- Insert or update usage record
  INSERT INTO subscription_usage (
    user_id, 
    current_period_start, 
    current_period_end
  )
  VALUES (
    user_uuid, 
    current_period_start, 
    current_period_end
  )
  ON CONFLICT (user_id, current_period_start) 
  DO NOTHING;
  
  -- Increment the specific usage counter
  EXECUTE format(
    'UPDATE subscription_usage SET %I = %I + $1, updated_at = now() WHERE user_id = $2 AND current_period_start = $3',
    usage_type, usage_type
  )
  USING increment_amount, user_uuid, current_period_start;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;