-- TRIANGLE INTELLIGENCE TARIFF MONITORING SCHEMA
-- Database schema for Trump-era tariff monitoring and customer alert system
-- Integrates with existing Triangle Intelligence database architecture

-- Customer alert subscriptions table
CREATE TABLE IF NOT EXISTS customer_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('regulatory', 'product_specific', 'deadline', 'operational', 'trump_tariff')),
    hs_codes TEXT[] DEFAULT '{}', -- Array of HS codes this customer tracks
    countries TEXT[] DEFAULT '{}', -- Countries this customer imports from
    business_type TEXT,
    trade_volume_annually BIGINT,
    alert_priority TEXT DEFAULT 'medium' CHECK (alert_priority IN ('critical', 'high', 'medium', 'low', 'info')),
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "webhook": false, "in_app": true}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regulatory updates and announcements
CREATE TABLE IF NOT EXISTS regulatory_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('CBP', 'CBSA', 'SAT', 'USMCA_Committee', 'White_House', 'USTR', 'Federal_Register')),
    update_type TEXT NOT NULL CHECK (update_type IN ('rule_interpretation', 'procedure_change', 'tariff_update', 'trump_tariff', 'emergency_measure')),
    document_number TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    affected_hs_codes TEXT[] DEFAULT '{}',
    affected_countries TEXT[] DEFAULT '{}',
    old_tariff_rates JSONB, -- {"hs_code": "rate", ...}
    new_tariff_rates JSONB, -- {"hs_code": "rate", ...}
    effective_date DATE NOT NULL,
    announcement_date DATE DEFAULT CURRENT_DATE,
    urgency_level TEXT DEFAULT 'medium' CHECK (urgency_level IN ('immediate', 'urgent', 'high', 'medium', 'low')),
    is_trump_era BOOLEAN DEFAULT false,
    source_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed', 'superseded')),
    impact_severity TEXT DEFAULT 'medium' CHECK (impact_severity IN ('critical', 'high', 'medium', 'low', 'minimal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Individual alert instances generated from regulatory updates
CREATE TABLE IF NOT EXISTS alert_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_alert_id UUID REFERENCES customer_alerts(id) ON DELETE CASCADE,
    regulatory_update_id UUID REFERENCES regulatory_updates(id),
    alert_title TEXT NOT NULL,
    alert_message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    estimated_impact JSONB, -- {"cost_increase": 12000, "percentage_increase": 15.5, "affected_products": 3}
    recommended_actions TEXT[],
    read_status BOOLEAN DEFAULT false,
    sent_notifications JSONB DEFAULT '{}', -- {"email": "2025-01-01T10:00:00Z", "sms": null, ...}
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer product tracking (what products each customer imports)
CREATE TABLE IF NOT EXISTS customer_product_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_alert_id UUID REFERENCES customer_alerts(id) ON DELETE CASCADE,
    hs_code TEXT NOT NULL,
    product_description TEXT,
    supplier_countries TEXT[] DEFAULT '{}',
    annual_volume_usd BIGINT,
    unit_price_usd DECIMAL(12,2),
    seasonal_pattern TEXT CHECK (seasonal_pattern IN ('consistent', 'seasonal_q1', 'seasonal_q2', 'seasonal_q3', 'seasonal_q4')),
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tariff monitoring sources and their check status
CREATE TABLE IF NOT EXISTS monitoring_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT NOT NULL UNIQUE,
    source_url TEXT NOT NULL,
    check_frequency_minutes INTEGER NOT NULL DEFAULT 360, -- 6 hours default
    last_successful_check TIMESTAMP WITH TIME ZONE,
    last_check_attempt TIMESTAMP WITH TIME ZONE,
    consecutive_failures INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    source_type TEXT CHECK (source_type IN ('urgent', 'critical', 'important', 'monitoring')),
    parsing_rules JSONB, -- Rules for parsing this source
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_alerts_user_id ON customer_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_alerts_active ON customer_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_effective_date ON regulatory_updates(effective_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_trump_era ON regulatory_updates(is_trump_era) WHERE is_trump_era = true;
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_urgency ON regulatory_updates(urgency_level);
CREATE INDEX IF NOT EXISTS idx_alert_instances_customer ON alert_instances(customer_alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_instances_unread ON alert_instances(read_status) WHERE read_status = false;
CREATE INDEX IF NOT EXISTS idx_customer_product_tracking_customer ON customer_product_tracking(customer_alert_id);
CREATE INDEX IF NOT EXISTS idx_customer_product_tracking_hs_code ON customer_product_tracking(hs_code);

-- Initialize monitoring sources
INSERT INTO monitoring_sources (source_name, source_url, source_type, check_frequency_minutes) VALUES
('CBP_CSMS', 'https://www.cbp.gov/trade/automated/cargo-systems-messaging-service', 'urgent', 120),
('White_House_Actions', 'https://www.whitehouse.gov/presidential-actions/', 'urgent', 120),
('Federal_Register', 'https://www.federalregister.gov/', 'critical', 360),
('USTR_Announcements', 'https://ustr.gov/about-us/policy-offices/press-office', 'critical', 360),
('CBP_News', 'https://www.cbp.gov/newsroom/announcements', 'important', 1440),
('CBSA_Updates', 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/menu-eng.html', 'monitoring', 1440),
('SAT_Mexico', 'https://www.sat.gob.mx/english', 'monitoring', 1440)
ON CONFLICT (source_name) DO NOTHING;