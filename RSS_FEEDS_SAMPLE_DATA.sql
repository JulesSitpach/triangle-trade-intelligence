-- RSS FEEDS SAMPLE DATA
-- Add this after running RSS_FEEDS_TABLES_ONLY.sql

-- Insert sample RSS feeds (government and trade sources)
INSERT INTO public.rss_feeds (name, url, category, priority_level, keywords, check_frequency_minutes, is_active, failure_count, max_failures_allowed) VALUES
('US Trade Representative', 'https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml', 'government', 'high', ARRAY['tariff', 'trade', 'USMCA', 'China', 'Mexico', 'Canada'], 15, true, 0, 3),
('CBP Trade News', 'https://www.cbp.gov/newsroom/national-media-release/rss', 'customs', 'high', ARRAY['customs', 'border', 'trade', 'import', 'export'], 15, true, 1, 3),
('Commerce Department Trade', 'https://www.commerce.gov/tags/trade/feed', 'government', 'medium', ARRAY['commerce', 'trade', 'international', 'tariff'], 30, true, 0, 3),
('Reuters Trade News', 'https://feeds.reuters.com/reuters/businessNews', 'news', 'medium', ARRAY['trade war', 'tariff', 'import', 'export', 'customs'], 30, true, 2, 3),
('Bloomberg Trade', 'https://feeds.bloomberg.com/markets/news.rss', 'financial', 'medium', ARRAY['trade', 'tariff', 'import', 'market'], 45, false, 0, 3)
ON CONFLICT (url) DO NOTHING;

-- Update some feeds with recent check timestamps
UPDATE public.rss_feeds 
SET 
    last_check_at = NOW() - INTERVAL '30 minutes',
    last_success_at = NOW() - INTERVAL '35 minutes'
WHERE name IN ('US Trade Representative', 'Commerce Department Trade');

UPDATE public.rss_feeds 
SET 
    last_check_at = NOW() - INTERVAL '2 hours',
    last_success_at = NOW() - INTERVAL '4 hours'
WHERE name = 'CBP Trade News';

UPDATE public.rss_feeds 
SET 
    last_check_at = NOW() - INTERVAL '1 hour',
    last_success_at = NOW() - INTERVAL '1 hour 10 minutes'
WHERE name = 'Reuters Trade News';

-- Insert sample RSS feed activities (simulating recent checks)
INSERT INTO public.rss_feed_activities (feed_id, status, response_time_ms, items_found, new_items, created_at)
SELECT 
    rf.id,
    CASE 
        WHEN rf.failure_count = 0 THEN 'success'
        WHEN rf.failure_count = 1 AND random() < 0.8 THEN 'success'
        WHEN rf.failure_count = 2 AND random() < 0.6 THEN 'success'
        ELSE 'error'
    END as status,
    (200 + random() * 1500)::INTEGER as response_time_ms, -- 200-1700ms
    (random() * 25)::INTEGER as items_found, -- 0-25 items
    (random() * 3)::INTEGER as new_items, -- 0-3 new items
    NOW() - INTERVAL '1 hour' * (random() * 48) as created_at -- Random time in last 2 days
FROM public.rss_feeds rf
CROSS JOIN generate_series(1, 8) -- 8 activities per feed
WHERE rf.is_active = true;

-- Add some error activities for feeds with failures
INSERT INTO public.rss_feed_activities (feed_id, status, response_time_ms, error_message, created_at)
SELECT 
    rf.id,
    'error',
    (5000 + random() * 5000)::INTEGER, -- Slow error responses
    CASE 
        WHEN random() < 0.4 THEN 'Connection timeout'
        WHEN random() < 0.7 THEN 'Feed temporarily unavailable'
        ELSE 'Invalid RSS format'
    END as error_message,
    NOW() - INTERVAL '1 hour' * (random() * 24) -- Random time in last day
FROM public.rss_feeds rf
WHERE rf.failure_count > 0
CROSS JOIN generate_series(1, 2); -- 2 error activities per failed feed

-- Insert sample crisis alerts (generated from RSS monitoring)
INSERT INTO public.crisis_alerts (
    source_type, source_id, alert_type, severity_level, title, description, 
    affected_countries, affected_hs_codes, estimated_impact_usd, confidence_score, 
    is_active, requires_action, automated_response_triggered, user_notifications_sent,
    created_at
) VALUES
('rss_feed', (SELECT id FROM public.rss_feeds WHERE name = 'US Trade Representative' LIMIT 1), 'tariff_change', 'high', 
    'New Steel Tariffs Announced', 'Additional 25% tariffs on steel imports from China effective January 1st', 
    ARRAY['CN', 'US'], ARRAY['7208', '7209', '7210'], 2500000.00, 0.92, true, true, true, 156,
    NOW() - INTERVAL '6 hours'),

('rss_feed', (SELECT id FROM public.rss_feeds WHERE name = 'CBP Trade News' LIMIT 1), 'policy_update', 'medium',
    'New USMCA Certificate Requirements', 'Updated certificate of origin requirements for automotive parts',
    ARRAY['US', 'MX', 'CA'], ARRAY['8708', '8707'], 800000.00, 0.88, true, false, true, 89,
    NOW() - INTERVAL '12 hours'),

('rss_feed', (SELECT id FROM public.rss_feeds WHERE name = 'Reuters Trade News' LIMIT 1), 'trade_disruption', 'critical',
    'Port Strike Expected to Affect Imports', 'Major West Coast port strike may delay shipments by 2-3 weeks',
    ARRAY['US'], ARRAY['*'], 5200000.00, 0.95, true, true, false, 234,
    NOW() - INTERVAL '2 hours'),

('automated', NULL, 'market_volatility', 'medium',
    'Aluminum Prices Surge 12%', 'Aluminum prices increase due to supply chain constraints',
    ARRAY['US', 'CA'], ARRAY['7601', '7603'], 1100000.00, 0.79, true, false, true, 67,
    NOW() - INTERVAL '18 hours');

-- Insert sample crisis responses
INSERT INTO public.crisis_responses (alert_id, response_type, response_status, recipient_type, recipient_identifier, message_content, sent_at, delivered_at)
SELECT 
    ca.id,
    'email' as response_type,
    'delivered' as response_status,
    'admin' as recipient_type,
    'admin@triangleintelligence.com' as recipient_identifier,
    CONCAT('CRISIS ALERT: ', ca.title, ' - ', ca.description) as message_content,
    ca.created_at + INTERVAL '5 minutes' as sent_at,
    ca.created_at + INTERVAL '6 minutes' as delivered_at
FROM public.crisis_alerts ca
WHERE ca.automated_response_triggered = true
LIMIT 3;

-- Insert sample daily analytics data (last 7 days)
INSERT INTO public.daily_analytics (
    date, total_workflows, active_users, certificates_generated, 
    new_users, total_revenue, total_savings_generated, 
    total_api_calls, avg_api_response_time_ms, failed_api_calls
)
SELECT 
    (CURRENT_DATE - generate_series)::DATE as date,
    (15 + random() * 40)::INTEGER as total_workflows, -- 15-55 workflows
    (8 + random() * 20)::INTEGER as active_users,     -- 8-28 active users  
    (12 + random() * 35)::INTEGER as certificates_generated, -- 12-47 certificates
    (random() * 4)::INTEGER as new_users,             -- 0-4 new users
    (random() * 2500 + 500)::DECIMAL(15,2) as total_revenue, -- $500-$3000 revenue
    (25000 + random() * 85000)::DECIMAL(15,2) as total_savings_generated, -- $25K-$110K savings
    (450 + random() * 800)::INTEGER as total_api_calls, -- 450-1250 API calls
    (180 + random() * 120)::DECIMAL(8,2) as avg_api_response_time_ms, -- 180-300ms avg response
    (random() * 25)::INTEGER as failed_api_calls      -- 0-25 failed calls
FROM generate_series(0, 6) -- Last 7 days
ON CONFLICT (date) DO UPDATE SET 
    total_workflows = EXCLUDED.total_workflows,
    active_users = EXCLUDED.active_users,
    certificates_generated = EXCLUDED.certificates_generated;

-- Insert sample API performance logs (last few hours)
INSERT INTO public.api_performance_logs (
    endpoint, method, status_code, response_time_ms, database_query_time_ms, 
    cache_hit, created_at
)
SELECT 
    endpoints.endpoint,
    'GET' as method,
    CASE WHEN random() < 0.95 THEN 200 ELSE (ARRAY[400, 404, 500])[ceil(random() * 3)] END as status_code,
    (50 + random() * 400)::INTEGER as response_time_ms, -- 50-450ms
    (10 + random() * 150)::INTEGER as database_query_time_ms, -- 10-160ms
    random() < 0.3 as cache_hit, -- 30% cache hit rate
    NOW() - INTERVAL '1 hour' * (random() * 6) as created_at -- Last 6 hours
FROM (
    VALUES 
    ('/api/admin/users'),
    ('/api/admin/suppliers'),
    ('/api/admin/rss-feeds'),
    ('/api/admin/daily-activity'),
    ('/api/admin/performance-analytics'),
    ('/api/simple-classification'),
    ('/api/simple-usmca-compliance')
) AS endpoints(endpoint)
CROSS JOIN generate_series(1, 15); -- 15 logs per endpoint

-- Verification queries
SELECT 'RSS Feeds inserted:' as status, COUNT(*) as count FROM public.rss_feeds;
SELECT 'RSS Feed Activities inserted:' as status, COUNT(*) as count FROM public.rss_feed_activities;
SELECT 'Crisis Alerts inserted:' as status, COUNT(*) as count FROM public.crisis_alerts;
SELECT 'Crisis Responses inserted:' as status, COUNT(*) as count FROM public.crisis_responses;
SELECT 'Daily Analytics inserted:' as status, COUNT(*) as count FROM public.daily_analytics;
SELECT 'API Performance Logs inserted:' as status, COUNT(*) as count FROM public.api_performance_logs;