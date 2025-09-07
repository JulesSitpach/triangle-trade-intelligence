-- RSS FEEDS SAMPLE DATA - FIXED VERSION
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

-- Insert sample RSS feed activities (simulating recent checks) - FIXED SYNTAX
WITH feed_activity_data AS (
  SELECT 
    rf.id as feed_id,
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
  WHERE rf.is_active = true
)
INSERT INTO public.rss_feed_activities (feed_id, status, response_time_ms, items_found, new_items, created_at)
SELECT feed_id, status, response_time_ms, items_found, new_items, created_at
FROM feed_activity_data;

-- Add more activities (repeat the above for more data)
WITH feed_activity_data AS (
  SELECT 
    rf.id as feed_id,
    CASE 
        WHEN rf.failure_count = 0 THEN 'success'
        WHEN rf.failure_count = 1 AND random() < 0.8 THEN 'success'
        WHEN rf.failure_count = 2 AND random() < 0.6 THEN 'success'
        ELSE 'error'
    END as status,
    (200 + random() * 1500)::INTEGER as response_time_ms,
    (random() * 25)::INTEGER as items_found,
    (random() * 3)::INTEGER as new_items,
    NOW() - INTERVAL '1 hour' * (random() * 48) as created_at
  FROM public.rss_feeds rf
  WHERE rf.is_active = true
)
INSERT INTO public.rss_feed_activities (feed_id, status, response_time_ms, items_found, new_items, created_at)
SELECT feed_id, status, response_time_ms, items_found, new_items, created_at
FROM feed_activity_data;

-- Insert error activities for feeds with failures
INSERT INTO public.rss_feed_activities (feed_id, status, response_time_ms, error_message, created_at)
SELECT 
    rf.id,
    'error',
    8000 as response_time_ms, -- Slow error responses
    'Connection timeout' as error_message,
    NOW() - INTERVAL '6 hours' as created_at
FROM public.rss_feeds rf
WHERE rf.failure_count > 0;

INSERT INTO public.rss_feed_activities (feed_id, status, response_time_ms, error_message, created_at)
SELECT 
    rf.id,
    'error',
    7500 as response_time_ms,
    'Feed temporarily unavailable' as error_message,
    NOW() - INTERVAL '12 hours' as created_at
FROM public.rss_feeds rf
WHERE rf.failure_count > 1;

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
) VALUES
((CURRENT_DATE - INTERVAL '0 days')::DATE, 42, 18, 38, 2, 1850.50, 87500.00, 920, 245.30, 8),
((CURRENT_DATE - INTERVAL '1 days')::DATE, 38, 22, 35, 1, 2100.75, 95200.00, 1050, 198.45, 12),
((CURRENT_DATE - INTERVAL '2 days')::DATE, 45, 19, 41, 3, 1950.25, 102300.00, 890, 267.80, 5),
((CURRENT_DATE - INTERVAL '3 days')::DATE, 35, 16, 32, 0, 1650.00, 78900.00, 780, 289.15, 15),
((CURRENT_DATE - INTERVAL '4 days')::DATE, 29, 14, 27, 1, 1420.50, 65800.00, 650, 312.70, 18),
((CURRENT_DATE - INTERVAL '5 days')::DATE, 52, 25, 48, 4, 2450.75, 118200.00, 1180, 201.55, 9),
((CURRENT_DATE - INTERVAL '6 days')::DATE, 41, 20, 39, 2, 1980.25, 91600.00, 940, 234.25, 11)
ON CONFLICT (date) DO UPDATE SET 
    total_workflows = EXCLUDED.total_workflows,
    active_users = EXCLUDED.active_users,
    certificates_generated = EXCLUDED.certificates_generated;

-- Insert sample API performance logs (various endpoints)
INSERT INTO public.api_performance_logs (
    endpoint, method, status_code, response_time_ms, database_query_time_ms, 
    cache_hit, created_at
) VALUES
('/api/admin/users', 'GET', 200, 145, 85, false, NOW() - INTERVAL '1 hour'),
('/api/admin/suppliers', 'GET', 200, 320, 245, false, NOW() - INTERVAL '2 hours'),
('/api/admin/rss-feeds', 'GET', 200, 180, 125, true, NOW() - INTERVAL '30 minutes'),
('/api/admin/daily-activity', 'GET', 200, 220, 165, false, NOW() - INTERVAL '45 minutes'),
('/api/admin/performance-analytics', 'GET', 200, 380, 290, false, NOW() - INTERVAL '1.5 hours'),
('/api/simple-classification', 'POST', 200, 95, 45, true, NOW() - INTERVAL '3 hours'),
('/api/simple-usmca-compliance', 'POST', 200, 450, 380, false, NOW() - INTERVAL '4 hours'),
('/api/admin/users', 'GET', 200, 125, 75, true, NOW() - INTERVAL '5 hours'),
('/api/admin/suppliers', 'GET', 500, 5000, 4500, false, NOW() - INTERVAL '6 hours'),
('/api/admin/rss-feeds', 'GET', 200, 165, 110, false, NOW() - INTERVAL '20 minutes'),
('/api/admin/daily-activity', 'GET', 200, 190, 140, true, NOW() - INTERVAL '25 minutes'),
('/api/simple-classification', 'POST', 200, 85, 35, true, NOW() - INTERVAL '35 minutes'),
('/api/simple-usmca-compliance', 'POST', 400, 150, 90, false, NOW() - INTERVAL '40 minutes'),
('/api/admin/performance-analytics', 'GET', 200, 410, 320, false, NOW() - INTERVAL '50 minutes'),
('/api/admin/users', 'GET', 200, 135, 80, false, NOW() - INTERVAL '55 minutes');

-- Verification queries
SELECT 'RSS Feeds inserted:' as status, COUNT(*) as count FROM public.rss_feeds;
SELECT 'RSS Feed Activities inserted:' as status, COUNT(*) as count FROM public.rss_feed_activities;
SELECT 'Crisis Alerts inserted:' as status, COUNT(*) as count FROM public.crisis_alerts;
SELECT 'Crisis Responses inserted:' as status, COUNT(*) as count FROM public.crisis_responses;
SELECT 'Daily Analytics inserted:' as status, COUNT(*) as count FROM public.daily_analytics;
SELECT 'API Performance Logs inserted:' as status, COUNT(*) as count FROM public.api_performance_logs;