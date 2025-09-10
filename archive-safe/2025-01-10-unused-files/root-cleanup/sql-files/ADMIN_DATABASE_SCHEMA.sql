-- ================================================================
-- TRIANGLE INTELLIGENCE ADMIN DASHBOARD DATABASE SCHEMA
-- Complete SQL schema for all admin dashboard functionality
-- Execute in order - tables have dependencies
-- ================================================================

-- ================================================================
-- 1. USERS MANAGEMENT TABLES
-- ================================================================

-- Main users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'trial_expired', 'suspended')),
  subscription_tier VARCHAR(50) DEFAULT 'Trial' CHECK (subscription_tier IN ('Trial', 'Professional', 'Enterprise', 'Enterprise+')),
  workflow_completions INTEGER DEFAULT 0,
  certificates_generated INTEGER DEFAULT 0,
  total_savings DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional profile fields
  industry VARCHAR(100),
  company_size VARCHAR(50),
  phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'US'
);

-- Subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('Trial', 'Professional', 'Enterprise', 'Enterprise+')),
  monthly_fee DECIMAL(10,2) NOT NULL,
  usage_percent DECIMAL(5,2) DEFAULT 0.00,
  next_billing DATE,
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 2. WORKFLOW ANALYTICS TABLES
-- ================================================================

-- Workflow completions tracking
CREATE TABLE public.workflow_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workflow_type VARCHAR(100) NOT NULL DEFAULT 'usmca_compliance',
  product_description TEXT,
  hs_code VARCHAR(20),
  classification_confidence DECIMAL(5,2),
  qualification_result JSONB,
  savings_amount DECIMAL(12,2),
  completion_time_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Workflow steps tracking
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 4,
  step_timings JSONB, -- Store timing for each step
  
  -- Results
  certificate_generated BOOLEAN DEFAULT FALSE,
  certificate_id UUID,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255)
);

-- Certificate generation tracking
CREATE TABLE public.certificates_generated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.workflow_completions(id) ON DELETE CASCADE,
  certificate_type VARCHAR(100) DEFAULT 'usmca_compliance',
  product_description TEXT,
  hs_code VARCHAR(20),
  qualification_percentage DECIMAL(5,2),
  savings_amount DECIMAL(12,2),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Certificate data
  pdf_url TEXT,
  pdf_size_bytes INTEGER,
  certificate_data JSONB,
  
  -- Validation
  is_valid BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Performance tracking
CREATE TABLE public.api_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional metrics
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  database_query_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE
);

-- ================================================================
-- 3. SUPPLIER MANAGEMENT TABLES
-- ================================================================

-- Suppliers directory
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  specialization TEXT[],
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  partnership_level VARCHAR(50) DEFAULT 'basic' CHECK (partnership_level IN ('basic', 'preferred', 'premium', 'exclusive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.user_profiles(id),
  
  -- Contact information
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website VARCHAR(255),
  primary_contact_name VARCHAR(255),
  
  -- Business details
  business_license VARCHAR(255),
  tax_id VARCHAR(100),
  established_year INTEGER,
  employee_count VARCHAR(50),
  annual_revenue_range VARCHAR(50),
  
  -- Capabilities
  manufacturing_capabilities TEXT[],
  certifications TEXT[],
  quality_standards TEXT[],
  minimum_order_quantity VARCHAR(100),
  lead_time_days INTEGER,
  
  -- Performance metrics
  reliability_score DECIMAL(3,2) DEFAULT 0.00,
  quality_score DECIMAL(3,2) DEFAULT 0.00,
  communication_score DECIMAL(3,2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0
);

-- Supplier certifications tracking
CREATE TABLE public.supplier_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  certification_name VARCHAR(255) NOT NULL,
  certification_body VARCHAR(255),
  certificate_number VARCHAR(255),
  issued_date DATE,
  expiry_date DATE,
  document_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. CRISIS MANAGEMENT TABLES
-- ================================================================

-- RSS feeds monitoring
CREATE TABLE public.rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'disabled')),
  last_check TIMESTAMP WITH TIME ZONE,
  last_successful_check TIMESTAMP WITH TIME ZONE,
  items_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  check_interval_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Feed metadata
  feed_type VARCHAR(100), -- 'tariff_updates', 'trade_news', 'regulatory_changes'
  priority INTEGER DEFAULT 0,
  keywords TEXT[], -- Keywords to watch for
  
  -- Alert configuration
  alert_threshold INTEGER DEFAULT 1,
  alert_keywords TEXT[],
  notification_enabled BOOLEAN DEFAULT TRUE
);

-- Crisis alerts and responses
CREATE TABLE public.crisis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  alert_type VARCHAR(100) NOT NULL, -- 'tariff_change', 'regulatory_update', 'trade_disruption'
  severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  
  -- Source information
  source_feed_id UUID REFERENCES public.rss_feeds(id),
  source_url TEXT,
  source_content TEXT,
  detected_keywords TEXT[],
  
  -- Impact assessment
  affected_products TEXT[],
  affected_countries TEXT[],
  estimated_impact DECIMAL(12,2),
  
  -- Response tracking
  automated_response_sent BOOLEAN DEFAULT FALSE,
  user_notifications_sent INTEGER DEFAULT 0,
  manual_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES public.user_profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crisis response templates
CREATE TABLE public.crisis_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  template TEXT NOT NULL,
  trigger_conditions JSONB,
  priority INTEGER DEFAULT 0,
  alert_types TEXT[], -- Which alert types this template applies to
  
  -- Template metadata
  created_by UUID REFERENCES public.user_profiles(id),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 5. ANALYTICS AND REPORTING TABLES
-- ================================================================

-- Daily activity aggregation (for performance)
CREATE TABLE public.daily_analytics (
  date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_workflows INTEGER DEFAULT 0,
  completed_workflows INTEGER DEFAULT 0,
  certificates_generated INTEGER DEFAULT 0,
  total_savings_generated DECIMAL(12,2) DEFAULT 0.00,
  avg_workflow_time_seconds DECIMAL(10,2) DEFAULT 0.00,
  
  -- Performance metrics
  avg_api_response_time_ms DECIMAL(10,2) DEFAULT 0.00,
  total_api_calls INTEGER DEFAULT 0,
  failed_api_calls INTEGER DEFAULT 0,
  
  -- Revenue metrics
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  new_subscriptions INTEGER DEFAULT 0,
  canceled_subscriptions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration tracking
CREATE TABLE public.system_configs (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_sensitive BOOLEAN DEFAULT FALSE,
  last_modified_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ================================================================

-- User profile indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX idx_user_profiles_tier ON public.user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Subscription indexes
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Workflow completion indexes
CREATE INDEX idx_workflow_completions_user_id ON public.workflow_completions(user_id);
CREATE INDEX idx_workflow_completions_completed_at ON public.workflow_completions(completed_at);
CREATE INDEX idx_workflow_completions_workflow_type ON public.workflow_completions(workflow_type);

-- Certificate indexes
CREATE INDEX idx_certificates_user_id ON public.certificates_generated(user_id);
CREATE INDEX idx_certificates_generated_at ON public.certificates_generated(generated_at);
CREATE INDEX idx_certificates_workflow_id ON public.certificates_generated(workflow_id);

-- Performance logs indexes
CREATE INDEX idx_api_performance_endpoint ON public.api_performance_logs(endpoint);
CREATE INDEX idx_api_performance_created_at ON public.api_performance_logs(created_at);
CREATE INDEX idx_api_performance_response_time ON public.api_performance_logs(response_time_ms);

-- Supplier indexes
CREATE INDEX idx_suppliers_verification_status ON public.suppliers(verification_status);
CREATE INDEX idx_suppliers_location ON public.suppliers(location);
CREATE INDEX idx_suppliers_country ON public.suppliers(country);
CREATE INDEX idx_suppliers_specialization ON public.suppliers USING GIN(specialization);
CREATE INDEX idx_suppliers_created_at ON public.suppliers(created_at);

-- Supplier certification indexes
CREATE INDEX idx_supplier_certifications_supplier_id ON public.supplier_certifications(supplier_id);
CREATE INDEX idx_supplier_certifications_expiry_date ON public.supplier_certifications(expiry_date);

-- RSS feeds indexes
CREATE INDEX idx_rss_feeds_status ON public.rss_feeds(status);
CREATE INDEX idx_rss_feeds_feed_type ON public.rss_feeds(feed_type);
CREATE INDEX idx_rss_feeds_last_check ON public.rss_feeds(last_check);

-- Crisis alerts indexes
CREATE INDEX idx_crisis_alerts_type ON public.crisis_alerts(alert_type);
CREATE INDEX idx_crisis_alerts_severity ON public.crisis_alerts(severity);
CREATE INDEX idx_crisis_alerts_status ON public.crisis_alerts(status);
CREATE INDEX idx_crisis_alerts_created_at ON public.crisis_alerts(created_at);

-- Daily analytics indexes
CREATE INDEX idx_daily_analytics_date ON public.daily_analytics(date DESC);

-- System config indexes
CREATE INDEX idx_system_configs_category ON public.system_configs(category);

-- ================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Admin access policies (users with admin role can access everything)
CREATE POLICY "Admin full access user_profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- User can only see their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Similar policies for other tables...
-- (Add more specific RLS policies as needed for security)

-- ================================================================
-- 8. SAMPLE DATA FOR TESTING (OPTIONAL - SKIP IF DATA EXISTS)
-- ================================================================

-- Insert sample RSS feeds (only if they don't exist)
INSERT INTO public.rss_feeds (url, title, description, feed_type, keywords, alert_keywords) 
SELECT * FROM (VALUES
  ('https://www.trade.gov/rss.xml', 'Trade.gov Updates', 'Official US trade policy updates', 'trade_news', ARRAY['tariff', 'trade', 'USMCA'], ARRAY['tariff increase', 'trade war']),
  ('https://ustr.gov/rss.xml', 'USTR News', 'US Trade Representative announcements', 'regulatory_changes', ARRAY['USMCA', 'agreement', 'policy'], ARRAY['section 232', 'antidumping']),
  ('https://www.cbp.gov/newsroom/rss', 'CBP Newsroom', 'Customs and Border Protection updates', 'tariff_updates', ARRAY['customs', 'classification', 'duty'], ARRAY['rate change', 'classification ruling'])
) AS v(url, title, description, feed_type, keywords, alert_keywords)
WHERE NOT EXISTS (SELECT 1 FROM public.rss_feeds WHERE rss_feeds.url = v.url);

-- Insert sample crisis response templates (only if they don't exist)
INSERT INTO public.crisis_response_templates (title, template, alert_types, priority) 
SELECT * FROM (VALUES
  ('Tariff Increase Alert', 'URGENT: New tariff increases detected affecting {affected_products}. Estimated impact: {estimated_impact}. Review your classifications immediately.', ARRAY['tariff_change'], 1),
  ('Regulatory Change Notice', 'Regulatory update detected: {title}. This may affect your trade compliance. Please review: {source_url}', ARRAY['regulatory_update'], 2),
  ('Trade Disruption Alert', 'Trade disruption detected in {affected_countries}. Monitor your supply chain for potential impacts.', ARRAY['trade_disruption'], 1)
) AS v(title, template, alert_types, priority)
WHERE NOT EXISTS (SELECT 1 FROM public.crisis_response_templates WHERE crisis_response_templates.title = v.title);

-- Insert sample system configurations (only if they don't exist)
INSERT INTO public.system_configs (key, value, description, category) 
SELECT * FROM (VALUES
  ('crisis_monitoring_enabled', '"true"'::jsonb, 'Enable/disable crisis monitoring system', 'crisis'),
  ('rss_check_interval_minutes', '"15"'::jsonb, 'How often to check RSS feeds for updates', 'crisis'),
  ('max_alerts_per_day', '"50"'::jsonb, 'Maximum alerts to generate per day', 'crisis'),
  ('notification_email_template', '{"subject": "Crisis Alert: {title}", "body": "Alert detected: {description}"}'::jsonb, 'Email template for crisis notifications', 'notifications'),
  ('performance_metrics_retention_days', '"90"'::jsonb, 'How long to keep performance metrics', 'analytics')
) AS v(key, value, description, category)
WHERE NOT EXISTS (SELECT 1 FROM public.system_configs WHERE system_configs.key = v.key);

-- ================================================================
-- 9. USEFUL VIEWS FOR ADMIN DASHBOARDS
-- ================================================================

-- User summary view
CREATE VIEW public.user_summary AS
SELECT 
  up.id,
  up.company_name,
  up.email,
  up.status,
  up.subscription_tier,
  up.workflow_completions,
  up.certificates_generated,
  up.total_savings,
  up.created_at,
  up.last_login,
  us.monthly_fee,
  us.usage_percent,
  us.next_billing,
  CASE 
    WHEN up.last_login > NOW() - INTERVAL '7 days' THEN 'highly_active'
    WHEN up.last_login > NOW() - INTERVAL '30 days' THEN 'active'
    WHEN up.last_login > NOW() - INTERVAL '90 days' THEN 'low_activity'
    ELSE 'inactive'
  END as activity_level
FROM public.user_profiles up
LEFT JOIN public.user_subscriptions us ON up.id = us.user_id;

-- Workflow analytics view
CREATE VIEW public.workflow_analytics_summary AS
SELECT 
  DATE(completed_at) as date,
  COUNT(*) as total_workflows,
  COUNT(CASE WHEN certificate_generated = true THEN 1 END) as certificates_generated,
  AVG(completion_time_seconds) as avg_completion_time,
  SUM(savings_amount) as total_savings,
  COUNT(DISTINCT user_id) as unique_users
FROM public.workflow_completions
GROUP BY DATE(completed_at)
ORDER BY date DESC;

-- Performance metrics view
CREATE VIEW public.performance_summary AS
SELECT 
  endpoint,
  DATE(created_at) as date,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
  (COUNT(CASE WHEN status_code < 400 THEN 1 END)::float / COUNT(*)::float * 100) as success_rate
FROM public.api_performance_logs
GROUP BY endpoint, DATE(created_at)
ORDER BY date DESC, endpoint;

-- ================================================================
-- INSTALLATION COMPLETE
-- ================================================================

-- To verify installation, run:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%user%' OR table_name LIKE '%workflow%' OR table_name LIKE '%supplier%';