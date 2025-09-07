-- SIMPLIFIED RSS FEEDS SCHEMA - TABLES ONLY (for debugging)
-- Run this first to create just the tables without indexes or data

-- Drop tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS public.crisis_responses CASCADE;
DROP TABLE IF EXISTS public.crisis_alerts CASCADE;  
DROP TABLE IF EXISTS public.rss_feed_activities CASCADE;
DROP TABLE IF EXISTS public.rss_feeds CASCADE;
DROP TABLE IF EXISTS public.daily_analytics CASCADE;
DROP TABLE IF EXISTS public.api_performance_logs CASCADE;

-- RSS Feeds table
CREATE TABLE public.rss_feeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'general',
    priority_level TEXT CHECK (priority_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    check_frequency_minutes INTEGER DEFAULT 30,
    last_check_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    max_failures_allowed INTEGER DEFAULT 3,
    keywords TEXT[] DEFAULT '{}',
    exclusion_keywords TEXT[] DEFAULT '{}',
    alert_threshold INTEGER DEFAULT 1,
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSS Feed Activities table
CREATE TABLE public.rss_feed_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('success', 'error', 'timeout')) NOT NULL,
    response_time_ms INTEGER,
    items_found INTEGER DEFAULT 0,
    new_items INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crisis Alerts table
CREATE TABLE public.crisis_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_type TEXT CHECK (source_type IN ('rss_feed', 'manual', 'api', 'automated')) DEFAULT 'rss_feed',
    source_id UUID,
    alert_type TEXT CHECK (alert_type IN ('tariff_change', 'trade_disruption', 'policy_update', 'crisis_escalation', 'market_volatility')) NOT NULL,
    severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT,
    affected_countries TEXT[] DEFAULT '{}',
    affected_hs_codes TEXT[] DEFAULT '{}',
    estimated_impact_usd DECIMAL(15,2),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_active BOOLEAN DEFAULT true,
    requires_action BOOLEAN DEFAULT false,
    automated_response_triggered BOOLEAN DEFAULT false,
    user_notifications_sent INTEGER DEFAULT 0,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crisis Responses table
CREATE TABLE public.crisis_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID REFERENCES public.crisis_alerts(id) ON DELETE CASCADE,
    response_type TEXT CHECK (response_type IN ('email', 'sms', 'webhook', 'dashboard', 'api_update')) NOT NULL,
    response_status TEXT CHECK (response_status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')) DEFAULT 'pending',
    recipient_type TEXT CHECK (recipient_type IN ('user', 'admin', 'system', 'external_api')) NOT NULL,
    recipient_identifier TEXT,
    message_content TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Analytics table (for existing APIs)
CREATE TABLE public.daily_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_workflows INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    certificates_generated INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_savings_generated DECIMAL(15,2) DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    avg_api_response_time_ms DECIMAL(8,2) DEFAULT 0,
    failed_api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Performance Logs table (for performance analytics API)
CREATE TABLE public.api_performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    database_query_time_ms INTEGER,
    cache_hit BOOLEAN,
    user_agent TEXT,
    ip_address INET,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

but these commands dont work in superbase -- Verify tables were created
SELECT 'Tables created successfully!' as status;
\dt public.rss*;
\dt public.crisis*;
\dt public.daily*;
\dt public.api*;