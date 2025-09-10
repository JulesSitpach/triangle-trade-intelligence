-- ================================================================
-- TEMPORARY: DISABLE RLS FOR ADMIN API TESTING
-- Run this to temporarily disable Row Level Security for testing admin APIs
-- IMPORTANT: Re-enable RLS in production with proper admin policies
-- ================================================================

-- Disable RLS temporarily on key tables for testing
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.workflow_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates_generated DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_certifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_response_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'user_profiles', 'user_subscriptions', 'workflow_completions',
  'certificates_generated', 'suppliers', 'crisis_alerts'
)
ORDER BY tablename;