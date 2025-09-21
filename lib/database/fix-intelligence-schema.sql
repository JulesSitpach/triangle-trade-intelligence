-- FIX INTELLIGENCE SUBSCRIPTION DATABASE ISSUES
-- Addresses the missing table relationships and columns

-- 1. Create intelligence_subscriptions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS intelligence_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL DEFAULT 'jorge_intelligence',
    status TEXT NOT NULL DEFAULT 'active',
    monthly_fee DECIMAL(10,2) DEFAULT 500.00,
    last_briefing_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create user_profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    company_name TEXT,
    business_type TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create intelligence_preferences table
CREATE TABLE IF NOT EXISTS intelligence_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES intelligence_subscriptions(id) ON DELETE CASCADE,
    focus_areas TEXT[],
    delivery_format TEXT DEFAULT 'email',
    update_frequency TEXT DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create intelligence_entries table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS intelligence_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intelligence_type TEXT NOT NULL,
    target_industry TEXT,
    description TEXT NOT NULL,
    priority_level TEXT DEFAULT 'medium',
    source_type TEXT DEFAULT 'manual',
    source_url TEXT,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create intelligence_client_assignments table
CREATE TABLE IF NOT EXISTS intelligence_client_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intelligence_entry_id UUID REFERENCES intelligence_entries(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES intelligence_subscriptions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create intelligence_briefings table
CREATE TABLE IF NOT EXISTS intelligence_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES intelligence_subscriptions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    delivery_status TEXT DEFAULT 'pending'
);

-- 7. Add missing origin_country column to usmca_trade_flows (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usmca_trade_flows') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name = 'usmca_trade_flows' AND column_name = 'origin_country') THEN
            ALTER TABLE usmca_trade_flows ADD COLUMN origin_country TEXT;
            UPDATE usmca_trade_flows SET origin_country = 'US' WHERE origin_country IS NULL;
        END IF;
    ELSE
        -- Create usmca_trade_flows table if it doesn't exist
        CREATE TABLE usmca_trade_flows (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            origin_country TEXT NOT NULL DEFAULT 'US',
            destination_country TEXT NOT NULL,
            hs_code TEXT,
            trade_value DECIMAL(15,2),
            flow_year INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- 8. Create proper foreign key relationships
-- Fix intelligence_subscriptions -> user_profiles relationship
DO $$
BEGIN
    -- Add user_profile_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'intelligence_subscriptions' AND column_name = 'user_profile_id') THEN
        ALTER TABLE intelligence_subscriptions ADD COLUMN user_profile_id UUID REFERENCES user_profiles(id);
    END IF;
END $$;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_intelligence_subscriptions_user_profile ON intelligence_subscriptions(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_subscriptions_status ON intelligence_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_client_assignments_entry ON intelligence_client_assignments(intelligence_entry_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_client_assignments_subscription ON intelligence_client_assignments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_entries_status ON intelligence_entries(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_entries_type ON intelligence_entries(intelligence_type);
CREATE INDEX IF NOT EXISTS idx_usmca_trade_flows_origin ON usmca_trade_flows(origin_country);

-- 10. Insert sample data for testing (only if tables are empty)
INSERT INTO user_profiles (id, email, company_name, business_type)
SELECT
    uuid_generate_v4(),
    'test@example.com',
    'Test Company Inc',
    'Manufacturing'
WHERE NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1);

-- Link intelligence subscription to user profile
DO $$
DECLARE
    test_user_id UUID;
    test_subscription_id UUID;
BEGIN
    -- Get or create test user
    SELECT id INTO test_user_id FROM user_profiles WHERE email = 'test@example.com' LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        -- Insert test subscription
        INSERT INTO intelligence_subscriptions (id, user_profile_id, service_type, status, monthly_fee)
        SELECT
            uuid_generate_v4(),
            test_user_id,
            'jorge_intelligence',
            'active',
            500.00
        WHERE NOT EXISTS (SELECT 1 FROM intelligence_subscriptions LIMIT 1)
        RETURNING id INTO test_subscription_id;

        -- Insert test intelligence entry
        INSERT INTO intelligence_entries (intelligence_type, target_industry, description, priority_level, status)
        SELECT
            'market_analysis',
            'Manufacturing',
            'Sample intelligence entry for testing',
            'high',
            'active'
        WHERE NOT EXISTS (SELECT 1 FROM intelligence_entries LIMIT 1);
    END IF;
END $$;

-- Success message
SELECT 'Intelligence schema fixes applied successfully' as result;