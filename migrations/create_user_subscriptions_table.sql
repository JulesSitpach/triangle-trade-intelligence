-- Create user_subscriptions table for subscription-aware agent responses
-- This table tracks subscription tiers and usage for each user

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    tier VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (tier IN ('trial', 'professional', 'business', 'enterprise')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),

    -- Usage tracking
    usage_classifications INTEGER NOT NULL DEFAULT 0,
    usage_certificates INTEGER NOT NULL DEFAULT 0,

    -- Billing period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),

    -- Payment info (for future integration)
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions(period_end);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample subscriptions for testing
INSERT INTO user_subscriptions (user_id, tier, status, usage_classifications, usage_certificates) VALUES
('user_001', 'professional', 'active', 15, 5),
('user_002', 'business', 'active', 45, 20),
('user_003', 'trial', 'active', 3, 1),
('admin_001', 'enterprise', 'active', 0, 0),
('demo_user', 'trial', 'active', 4, 1)
ON CONFLICT (user_id) DO NOTHING;

-- Create function to reset monthly usage (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE user_subscriptions
    SET
        usage_classifications = 0,
        usage_certificates = 0,
        period_start = CURRENT_TIMESTAMP,
        period_end = CURRENT_TIMESTAMP + INTERVAL '30 days'
    WHERE period_end < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON TABLE user_subscriptions IS 'Tracks user subscription tiers and usage for agent response customization';
COMMENT ON COLUMN user_subscriptions.tier IS 'Subscription tier: trial, professional, business, enterprise';
COMMENT ON COLUMN user_subscriptions.usage_classifications IS 'Number of classifications used this billing period';
COMMENT ON COLUMN user_subscriptions.usage_certificates IS 'Number of certificates generated this billing period';
COMMENT ON FUNCTION reset_monthly_usage() IS 'Resets usage counters for expired billing periods';