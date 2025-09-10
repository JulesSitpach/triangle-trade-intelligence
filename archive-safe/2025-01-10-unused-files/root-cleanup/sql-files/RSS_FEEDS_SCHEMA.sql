-- RSS FEEDS AND CRISIS MONITORING SCHEMA
-- Add these tables to make the /api/admin/rss-feeds endpoint functional

-- RSS Feeds table - stores RSS feed configurations
CREATE TABLE IF NOT EXISTS public.rss_feeds (
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

-- RSS Feed Activities table - tracks each feed check
CREATE TABLE IF NOT EXISTS public.rss_feed_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('success', 'error', 'timeout')) NOT NULL,
    response_time_ms INTEGER,
    items_found INTEGER DEFAULT 0,
    new_items INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crisis Alerts table - stores alerts generated from RSS feeds
CREATE TABLE IF NOT EXISTS public.crisis_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_type TEXT CHECK (source_type IN ('rss_feed', 'manual', 'api', 'automated')) DEFAULT 'rss_feed',
    source_id UUID, -- References rss_feeds.id when source_type is 'rss_feed'
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

-- Crisis Responses table - automated and manual responses to alerts
CREATE TABLE IF NOT EXISTS public.crisis_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID REFERENCES public.crisis_alerts(id) ON DELETE CASCADE,
    response_type TEXT CHECK (response_type IN ('email', 'sms', 'webhook', 'dashboard', 'api_update')) NOT NULL,
    response_status TEXT CHECK (response_status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')) DEFAULT 'pending',
    recipient_type TEXT CHECK (recipient_type IN ('user', 'admin', 'system', 'external_api')) NOT NULL,
    recipient_identifier TEXT, -- email, phone, webhook URL, etc.
    message_content TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Analytics table - aggregated daily metrics (referenced by existing APIs)
CREATE TABLE IF NOT EXISTS public.daily_analytics (
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

-- API Performance Logs table - detailed API performance tracking
CREATE TABLE IF NOT EXISTS public.api_performance_logs (
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rss_feeds_active ON public.rss_feeds(is_active);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_category ON public.rss_feeds(category);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_priority ON public.rss_feeds(priority_level);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_last_check ON public.rss_feeds(last_check_at);

CREATE INDEX IF NOT EXISTS idx_rss_feed_activities_feed_id ON public.rss_feed_activities(feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_feed_activities_status ON public.rss_feed_activities(status);
CREATE INDEX IF NOT EXISTS idx_rss_feed_activities_created_at ON public.rss_feed_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_crisis_alerts_source_type ON public.crisis_alerts(source_type);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON public.crisis_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_active ON public.crisis_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_created_at ON public.crisis_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_crisis_responses_alert_id ON public.crisis_responses(alert_id);
CREATE INDEX IF NOT EXISTS idx_crisis_responses_status ON public.crisis_responses(response_status);
CREATE INDEX IF NOT EXISTS idx_crisis_responses_type ON public.crisis_responses(response_type);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON public.daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_api_performance_logs_endpoint ON public.api_performance_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_performance_logs_created_at ON public.api_performance_logs(created_at);

-- Row Level Security (RLS) - Enable but allow full access for development
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feed_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for service role (for development)
CREATE POLICY "Allow all operations on rss_feeds for service role" ON public.rss_feeds
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on rss_feed_activities for service role" ON public.rss_feed_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on crisis_alerts for service role" ON public.crisis_alerts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on crisis_responses for service role" ON public.crisis_responses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on daily_analytics for service role" ON public.daily_analytics
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on api_performance_logs for service role" ON public.api_performance_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Sample RSS Feeds Data
INSERT INTO public.rss_feeds (name, url, category, priority_level, keywords, check_frequency_minutes) VALUES
('US Trade Representative', 'https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml', 'government', 'high', ARRAY['tariff', 'trade', 'USMCA', 'China', 'Mexico', 'Canada'], 15),
('CBP Trade News', 'https://www.cbp.gov/newsroom/national-media-release/rss', 'customs', 'high', ARRAY['customs', 'border', 'trade', 'import', 'export'], 15),
('Commerce Department Trade', 'https://www.commerce.gov/tags/trade/feed', 'government', 'medium', ARRAY['commerce', 'trade', 'international', 'tariff'], 30),
('Reuters Trade News', 'https://feeds.reuters.com/reuters/businessNews', 'news', 'medium', ARRAY['trade war', 'tariff', 'import', 'export', 'customs'], 30),
('Bloomberg Trade', 'https://feeds.bloomberg.com/markets/news.rss', 'financial', 'medium', ARRAY['trade', 'tariff', 'import', 'market'], 45)
ON CONFLICT (url) DO NOTHING;

-- Sample RSS Feed Activities (simulate recent checks)
INSERT INTO public.rss_feed_activities (feed_id, status, response_time_ms, items_found, new_items, created_at)
SELECT 
    rf.id,
    CASE 
        WHEN random() < 0.9 THEN 'success'
        ELSE 'error'
    END,
    (random() * 2000 + 200)::INTEGER, -- 200-2200ms response time
    (random() * 50)::INTEGER, -- 0-50 items found
    (random() * 5)::INTEGER, -- 0-5 new items
    NOW() - INTERVAL '1 hour' * (random() * 72) -- Random time in last 3 days
FROM public.rss_feeds rf, generate_series(1, 10) -- 10 activities per feed
ON CONFLICT DO NOTHING;

-- Sample Crisis Alerts
INSERT INTO public.crisis_alerts (
    source_type, alert_type, severity_level, title, description, 
    affected_countries, estimated_impact_usd, confidence_score
) VALUES
('rss_feed', 'tariff_change', 'high', 'New Tariffs Announced on Chinese Electronics', 'Additional 25% tariffs announced on Chinese electronics imports effective next month', ARRAY['CN', 'US'], 1500000.00, 0.85),
('rss_feed', 'policy_update', 'medium', 'USMCA Implementation Update', 'New guidelines for USMCA certificate of origin requirements', ARRAY['US', 'MX', 'CA'], 500000.00, 0.92),
('automated', 'trade_disruption', 'critical', 'Port Strike Affecting Supply Chain', 'Major port strike expected to delay shipments by 2-3 weeks', ARRAY['US'], 2500000.00, 0.95),
('rss_feed', 'market_volatility', 'medium', 'Steel Prices Surge Due to Trade Restrictions', 'Steel import restrictions cause 15% price increase', ARRAY['US', 'CN'], 800000.00, 0.78)
ON CONFLICT DO NOTHING;

-- Sample Crisis Responses
INSERT INTO public.crisis_responses (alert_id, response_type, response_status, recipient_type, recipient_identifier, sent_at)
SELECT 
    ca.id,
    'email',
    'delivered',
    'admin',
    'admin@triangleintelligence.com',
    ca.created_at + INTERVAL '5 minutes'
FROM public.crisis_alerts ca
LIMIT 3;

-- Sample Daily Analytics (last 7 days)
INSERT INTO public.daily_analytics (
    date, total_workflows, active_users, certificates_generated, 
    new_users, total_savings_generated, total_api_calls, avg_api_response_time_ms
)
SELECT 
    (CURRENT_DATE - INTERVAL '1 day' * generate_series)::DATE,
    (random() * 50 + 10)::INTEGER, -- 10-60 workflows
    (random() * 20 + 5)::INTEGER,  -- 5-25 active users
    (random() * 40 + 8)::INTEGER,  -- 8-48 certificates
    (random() * 5)::INTEGER,       -- 0-5 new users
    (random() * 100000 + 25000)::DECIMAL(15,2), -- $25K-$125K savings
    (random() * 1000 + 200)::INTEGER, -- 200-1200 API calls
    (random() * 200 + 150)::DECIMAL(8,2) -- 150-350ms avg response
FROM generate_series(0, 6) -- Last 7 days
ON CONFLICT (date) DO NOTHING;

-- Update RSS feeds with recent check timestamps
UPDATE public.rss_feeds 
SET 
    last_check_at = NOW() - INTERVAL '1 hour' * (random() * 2),
    last_success_at = NOW() - INTERVAL '1 hour' * (random() * 4)
WHERE id IN (SELECT id FROM public.rss_feeds LIMIT 3);

-- Add some failure counts to simulate real-world conditions
UPDATE public.rss_feeds 
SET failure_count = 1 
WHERE id IN (SELECT id FROM public.rss_feeds ORDER BY random() LIMIT 1);

-- Verification queries - run these to check data was inserted
SELECT 'RSS Feeds inserted:' as status, COUNT(*) as count FROM public.rss_feeds;
SELECT 'RSS Feed Activities inserted:' as status, COUNT(*) as count FROM public.rss_feed_activities;
SELECT 'Crisis Alerts inserted:' as status, COUNT(*) as count FROM public.crisis_alerts;
SELECT 'Crisis Responses inserted:' as status, COUNT(*) as count FROM public.crisis_responses;
SELECT 'Daily Analytics inserted:' as status, COUNT(*) as count FROM public.daily_analytics;