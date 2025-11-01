-- Create users table with complete structure for subscription management
-- This is separate from auth.users and user_profiles (which handle authentication)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to auth system (can be auth.users.id or user_profiles.id)
    auth_user_id UUID UNIQUE NOT NULL,

    -- Profile Information
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    phone TEXT,
    avatar_url TEXT,

    -- Role & Permissions
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'broker')),

    -- Subscription Management
    subscription_tier TEXT DEFAULT 'trial' CHECK (
        subscription_tier IN ('trial', 'professional', 'business', 'enterprise')
    ),
    subscription_status TEXT DEFAULT 'active' CHECK (
        subscription_status IN ('active', 'cancelled', 'expired', 'past_due')
    ),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,

    -- Usage Tracking
    workflow_completions INTEGER DEFAULT 0,
    certificates_generated INTEGER DEFAULT 0,
    service_purchases INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_trial_ends_at ON users(trial_ends_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (auth_user_id = auth.uid());

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
    USING (auth_user_id = auth.uid());

-- Add helpful comments
COMMENT ON TABLE users IS 'User business data with subscription management (separate from auth)';
COMMENT ON COLUMN users.auth_user_id IS 'Links to auth.users.id or user_profiles.id';
COMMENT ON COLUMN users.subscription_tier IS 'Current subscription plan level';
COMMENT ON COLUMN users.trial_ends_at IS 'When trial period expires (14 days from signup)';
