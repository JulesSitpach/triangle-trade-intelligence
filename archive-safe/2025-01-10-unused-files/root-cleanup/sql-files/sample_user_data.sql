-- ================================================================
-- SAMPLE USER DATA FOR ADMIN DASHBOARD TESTING
-- Creates realistic test data to demonstrate admin dashboard functionality
-- ================================================================

-- Create sample user profiles
INSERT INTO public.user_profiles (
    id, company_name, email, status, subscription_tier, 
    workflow_completions, certificates_generated, total_savings,
    industry, company_size, phone, city, state, country, 
    created_at, last_login
) VALUES
-- Active users with recent activity
('550e8400-e29b-41d4-a716-446655440001', 'TechFlow Solutions', 'admin@techflow.com', 'active', 'Enterprise+', 
 23, 18, 650000.00, 'Technology', '100-500', '555-0101', 'Austin', 'Texas', 'US',
 '2024-01-15 10:00:00+00', '2024-09-04 14:30:00+00'),

('550e8400-e29b-41d4-a716-446655440002', 'Global Manufacturing Co', 'procurement@globalmanuf.com', 'active', 'Enterprise', 
 15, 12, 425000.00, 'Manufacturing', '500-1000', '555-0102', 'Detroit', 'Michigan', 'US',
 '2024-02-20 09:15:00+00', '2024-09-03 11:20:00+00'),

('550e8400-e29b-41d4-a716-446655440003', 'Midwest Trading LLC', 'ops@midwesttrading.com', 'active', 'Professional', 
 8, 6, 180000.00, 'Import/Export', '10-50', '555-0103', 'Chicago', 'Illinois', 'US',
 '2024-03-10 15:45:00+00', '2024-09-05 08:45:00+00'),

-- Trial users
('550e8400-e29b-41d4-a716-446655440004', 'StartUp Logistics', 'founder@startuplogistics.com', 'trial', 'Trial', 
 3, 2, 45000.00, 'Logistics', '1-10', '555-0104', 'San Francisco', 'California', 'US',
 '2024-08-15 12:00:00+00', '2024-09-02 16:30:00+00'),

('550e8400-e29b-41d4-a716-446655440005', 'Green Import Solutions', 'contact@greenimport.com', 'trial', 'Trial', 
 5, 3, 75000.00, 'Renewable Energy', '20-50', '555-0105', 'Portland', 'Oregon', 'US',
 '2024-08-28 14:20:00+00', '2024-09-01 10:15:00+00'),

-- Expired trial users
('550e8400-e29b-41d4-a716-446655440006', 'Small Business Imports', 'owner@smallbizimports.com', 'trial_expired', 'Trial', 
 2, 0, 0.00, 'Retail', '1-10', '555-0106', 'Phoenix', 'Arizona', 'US',
 '2024-07-01 11:30:00+00', '2024-08-01 13:45:00+00'),

-- New user with high potential
('550e8400-e29b-41d4-a716-446655440007', 'Automotive Parts Direct', 'ceo@autopartsdirect.com', 'active', 'Professional', 
 12, 10, 320000.00, 'Automotive', '50-100', '555-0107', 'Nashville', 'Tennessee', 'US',
 '2024-06-01 08:00:00+00', '2024-09-05 12:00:00+00');

-- Create corresponding subscriptions for active users
INSERT INTO public.user_subscriptions (
    user_id, tier, monthly_fee, usage_percent, next_billing, 
    stripe_subscription_id, status, created_at
) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Enterprise+', 999.00, 85.5, '2024-10-15', 'sub_techflow_001', 'active', '2024-01-15 10:30:00+00'),
('550e8400-e29b-41d4-a716-446655440002', 'Enterprise', 799.00, 72.3, '2024-10-20', 'sub_globalmanuf_002', 'active', '2024-02-20 09:45:00+00'),
('550e8400-e29b-41d4-a716-446655440003', 'Professional', 299.00, 65.8, '2024-10-10', 'sub_midwest_003', 'active', '2024-03-10 16:15:00+00'),
('550e8400-e29b-41d4-a716-446655440007', 'Professional', 299.00, 78.2, '2024-10-01', 'sub_autoparts_007', 'active', '2024-06-01 08:30:00+00');

-- Create workflow completions for realistic analytics
INSERT INTO public.workflow_completions (
    user_id, workflow_type, product_description, hs_code, 
    classification_confidence, savings_amount, completion_time_seconds,
    steps_completed, total_steps, certificate_generated, completed_at
) VALUES
-- TechFlow Solutions workflows
('550e8400-e29b-41d4-a716-446655440001', 'usmca_compliance', 'Wireless networking equipment', '8517620000', 92.5, 45000.00, 420, 4, 4, true, '2024-09-03 10:15:00+00'),
('550e8400-e29b-41d4-a716-446655440001', 'usmca_compliance', 'Computer processors', '8542310000', 88.2, 62000.00, 380, 4, 4, true, '2024-09-02 14:30:00+00'),
('550e8400-e29b-41d4-a716-446655440001', 'usmca_compliance', 'LED displays', '8531200000', 94.1, 28000.00, 450, 4, 4, true, '2024-09-01 11:45:00+00'),

-- Global Manufacturing workflows
('550e8400-e29b-41d4-a716-446655440002', 'usmca_compliance', 'Steel automotive parts', '8708999000', 91.3, 85000.00, 520, 4, 4, true, '2024-09-04 09:20:00+00'),
('550e8400-e29b-41d4-a716-446655440002', 'usmca_compliance', 'Aluminum components', '7616999000', 89.7, 42000.00, 480, 4, 4, true, '2024-09-01 15:10:00+00'),

-- Midwest Trading workflows
('550e8400-e29b-41d4-a716-446655440003', 'usmca_compliance', 'Agricultural machinery parts', '8432900000', 86.4, 35000.00, 390, 4, 4, true, '2024-09-03 13:25:00+00'),
('550e8400-e29b-41d4-a716-446655440003', 'usmca_compliance', 'Food processing equipment', '8438500000', 92.8, 28000.00, 410, 4, 4, false, '2024-09-02 16:40:00+00'),

-- Trial user workflows
('550e8400-e29b-41d4-a716-446655440004', 'usmca_compliance', 'Shipping containers', '8609000000', 78.5, 15000.00, 680, 3, 4, false, '2024-08-30 12:15:00+00'),
('550e8400-e29b-41d4-a716-446655440005', 'usmca_compliance', 'Solar panel components', '8541400000', 85.2, 22000.00, 520, 4, 4, true, '2024-08-29 14:50:00+00');

-- Create certificates for completed workflows
INSERT INTO public.certificates_generated (
    user_id, workflow_id, certificate_type, product_description, 
    hs_code, qualification_percentage, savings_amount, 
    pdf_url, is_valid, generated_at
) VALUES
('550e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM public.workflow_completions WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' AND product_description = 'Wireless networking equipment'), 
 'usmca_compliance', 'Wireless networking equipment', '8517620000', 
 92.5, 45000.00, 'https://certificates.triangleintel.com/cert_001.pdf', true, '2024-09-03 10:20:00+00'),

('550e8400-e29b-41d4-a716-446655440002', 
 (SELECT id FROM public.workflow_completions WHERE user_id = '550e8400-e29b-41d4-a716-446655440002' AND product_description = 'Steel automotive parts'), 
 'usmca_compliance', 'Steel automotive parts', '8708999000', 
 91.3, 85000.00, 'https://certificates.triangleintel.com/cert_002.pdf', true, '2024-09-04 09:25:00+00'),

('550e8400-e29b-41d4-a716-446655440003', 
 (SELECT id FROM public.workflow_completions WHERE user_id = '550e8400-e29b-41d4-a716-446655440003' AND product_description = 'Agricultural machinery parts'), 
 'usmca_compliance', 'Agricultural machinery parts', '8432900000', 
 86.4, 35000.00, 'https://certificates.triangleintel.com/cert_003.pdf', true, '2024-09-03 13:30:00+00');

-- Create some API performance logs for testing
INSERT INTO public.api_performance_logs (
    endpoint, method, response_time_ms, status_code, 
    user_id, request_size_bytes, response_size_bytes, 
    database_query_time_ms, cache_hit, created_at
) VALUES
('/api/simple-classification', 'POST', 245, 200, '550e8400-e29b-41d4-a716-446655440001', 1024, 2048, 85, false, '2024-09-05 10:15:00+00'),
('/api/simple-usmca-compliance', 'POST', 320, 200, '550e8400-e29b-41d4-a716-446655440002', 2048, 4096, 120, false, '2024-09-05 09:30:00+00'),
('/api/trust/complete-certificate', 'POST', 180, 200, '550e8400-e29b-41d4-a716-446655440003', 512, 8192, 45, true, '2024-09-05 11:45:00+00'),
('/api/simple-savings', 'POST', 95, 200, '550e8400-e29b-41d4-a716-446655440001', 256, 512, 25, true, '2024-09-05 12:20:00+00');

-- Create daily analytics aggregation for recent days
INSERT INTO public.daily_analytics (
    date, total_users, active_users, new_users, 
    total_workflows, completed_workflows, certificates_generated,
    total_savings_generated, avg_workflow_time_seconds,
    avg_api_response_time_ms, total_api_calls, failed_api_calls,
    total_revenue, new_subscriptions, canceled_subscriptions
) VALUES
('2024-09-05', 7, 4, 0, 3, 3, 2, 108000.00, 385.50, 210.00, 15, 0, 2396.00, 0, 0),
('2024-09-04', 7, 4, 0, 2, 2, 1, 127000.00, 500.00, 195.50, 12, 0, 2396.00, 0, 0),
('2024-09-03', 7, 3, 0, 2, 2, 2, 80000.00, 435.00, 220.25, 18, 1, 2396.00, 0, 0),
('2024-09-02', 7, 3, 0, 2, 1, 1, 90000.00, 395.00, 185.75, 22, 0, 2396.00, 0, 0),
('2024-09-01', 7, 2, 0, 2, 2, 1, 70000.00, 465.00, 205.50, 14, 0, 2396.00, 0, 0);

-- Update user profile totals to match workflow data
UPDATE public.user_profiles SET 
    workflow_completions = (SELECT COUNT(*) FROM public.workflow_completions WHERE user_id = user_profiles.id),
    certificates_generated = (SELECT COUNT(*) FROM public.certificates_generated WHERE user_id = user_profiles.id),
    total_savings = (SELECT COALESCE(SUM(savings_amount), 0) FROM public.workflow_completions WHERE user_id = user_profiles.id)
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007'
);

-- Success message
SELECT 'Sample user data created successfully!' as status,
       COUNT(*) as users_created FROM public.user_profiles 
WHERE id LIKE '550e8400-e29b-41d4-a716-4466554400%';