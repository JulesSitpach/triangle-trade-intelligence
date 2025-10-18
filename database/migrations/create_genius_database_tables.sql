-- =====================================================
-- GENIUS DATABASE: Self-Improving AI Intelligence
-- Every AI call saves results to build knowledge over time
-- Created: October 2025
-- =====================================================

-- =====================================================
-- 1. AI CLASSIFICATIONS (HS Codes + Tariff Rates)
-- =====================================================
-- Already exists, just documenting structure:
-- CREATE TABLE ai_classifications (
--   hs_code TEXT,
--   component_description TEXT,
--   mfn_rate DECIMAL,
--   usmca_rate DECIMAL,
--   policy_adjustments JSONB,
--   origin_country TEXT,
--   confidence INTEGER,
--   verified BOOLEAN DEFAULT false,
--   last_updated DATE,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- =====================================================
-- 2. AI SUPPLIER INTELLIGENCE
-- Saves supplier research from market-entry, supplier-sourcing, crisis-response
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_supplier_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  industry_sector TEXT,
  products_offered TEXT[],
  certifications TEXT[],
  production_capacity TEXT,
  usmca_compliant BOOLEAN,
  reliability_score INTEGER, -- 1-100
  cost_competitiveness TEXT, -- 'low', 'medium', 'high'
  lead_time_days INTEGER,
  minimum_order_quantity TEXT,
  contact_info JSONB,
  source_analysis TEXT, -- Which AI endpoint discovered this
  ai_confidence INTEGER DEFAULT 85,
  verified BOOLEAN DEFAULT false,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supplier_country ON ai_supplier_intelligence(country);
CREATE INDEX idx_supplier_industry ON ai_supplier_intelligence(industry_sector);
CREATE INDEX idx_supplier_usmca ON ai_supplier_intelligence(usmca_compliant);

-- =====================================================
-- 3. AI CRISIS INTELLIGENCE (Trade Policy Changes)
-- Saves crisis alerts from vulnerability analysis, consolidate-alerts, crisis-discovery
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_crisis_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crisis_type TEXT NOT NULL, -- 'tariff_change', 'trade_dispute', 'supply_disruption', etc.
  affected_countries TEXT[],
  affected_hs_codes TEXT[],
  severity TEXT, -- 'low', 'medium', 'high', 'critical'
  impact_summary TEXT,
  policy_details JSONB, -- Full policy change details
  effective_date DATE,
  source TEXT, -- 'Section 301', 'IEEPA', 'Trade War', etc.
  mitigation_strategies TEXT[],
  ai_analysis TEXT,
  ai_confidence INTEGER DEFAULT 90,
  verified BOOLEAN DEFAULT false,
  resolution_status TEXT DEFAULT 'active', -- 'active', 'monitoring', 'resolved'
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crisis_type ON ai_crisis_intelligence(crisis_type);
CREATE INDEX idx_crisis_severity ON ai_crisis_intelligence(severity);
CREATE INDEX idx_crisis_status ON ai_crisis_intelligence(resolution_status);

-- =====================================================
-- 4. AI USMCA QUALIFICATION RESEARCH
-- Saves USMCA qualification determinations for product categories
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usmca_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_category TEXT NOT NULL,
  industry_sector TEXT,
  hs_code_range TEXT, -- e.g., '8542.31-8542.39'
  required_threshold INTEGER NOT NULL, -- 55%, 65%, 75%
  threshold_source TEXT, -- USMCA citation
  threshold_reasoning TEXT,
  regional_value_method TEXT, -- 'Transaction Value', 'Net Cost'
  product_specific_rules TEXT[],
  documentation_required TEXT[],
  common_pitfalls TEXT[],
  optimization_strategies TEXT[],
  ai_confidence INTEGER DEFAULT 90,
  verified BOOLEAN DEFAULT false,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usmca_category ON ai_usmca_qualifications(product_category);
CREATE INDEX idx_usmca_threshold ON ai_usmca_qualifications(required_threshold);

-- =====================================================
-- 5. AI TRADE POLICY INTELLIGENCE
-- Saves policy analysis from ai-trade-advisor, crisis-response
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_trade_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  policy_type TEXT, -- 'Section 301', 'IEEPA', 'Bilateral', 'Multilateral'
  affected_countries TEXT[],
  affected_hs_codes TEXT[],
  policy_details TEXT,
  tariff_changes JSONB, -- Before/after rates
  effective_date DATE,
  sunset_date DATE,
  exemptions TEXT[],
  strategic_implications TEXT,
  business_recommendations TEXT[],
  ai_analysis TEXT,
  ai_confidence INTEGER DEFAULT 85,
  verified BOOLEAN DEFAULT false,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policy_type ON ai_trade_policies(policy_type);
CREATE INDEX idx_policy_effective ON ai_trade_policies(effective_date);

-- =====================================================
-- 6. AI MANUFACTURING FEASIBILITY
-- Saves manufacturing analysis from manufacturing-feasibility-analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_manufacturing_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL,
  manufacturing_country TEXT NOT NULL,
  feasibility_score INTEGER, -- 1-100
  cost_analysis JSONB,
  infrastructure_assessment TEXT,
  labor_availability TEXT,
  regulatory_compliance TEXT[],
  lead_time_estimate TEXT,
  investment_required TEXT,
  risk_factors TEXT[],
  competitive_advantages TEXT[],
  ai_analysis TEXT,
  ai_confidence INTEGER DEFAULT 80,
  verified BOOLEAN DEFAULT false,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mfg_country ON ai_manufacturing_intelligence(manufacturing_country);
CREATE INDEX idx_mfg_product ON ai_manufacturing_intelligence(product_type);

-- =====================================================
-- 7. AI MARKET INTELLIGENCE
-- Saves market analysis from market-entry-analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_market TEXT NOT NULL, -- Country/region
  product_category TEXT NOT NULL,
  market_size TEXT,
  growth_rate TEXT,
  competitive_landscape TEXT,
  entry_barriers TEXT[],
  regulatory_requirements TEXT[],
  distribution_channels TEXT[],
  pricing_strategy TEXT,
  target_customer_profile TEXT,
  success_factors TEXT[],
  risk_factors TEXT[],
  ai_analysis TEXT,
  ai_confidence INTEGER DEFAULT 75,
  verified BOOLEAN DEFAULT false,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_country ON ai_market_intelligence(target_market);
CREATE INDEX idx_market_category ON ai_market_intelligence(product_category);

-- =====================================================
-- 8. AI DOCUMENT INTELLIGENCE
-- Saves extracted insights from trade documents (invoices, BOLs, certs)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_document_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL, -- 'invoice', 'BOL', 'certificate', 'customs_declaration'
  extracted_data JSONB NOT NULL, -- Structured document data
  hs_codes_found TEXT[],
  countries_mentioned TEXT[],
  compliance_issues TEXT[],
  data_quality_score INTEGER, -- 1-100
  extraction_confidence INTEGER,
  verification_status TEXT DEFAULT 'pending',
  ai_analysis TEXT,
  user_id UUID REFERENCES auth.users(id),
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_type ON ai_document_intelligence(document_type);
CREATE INDEX idx_doc_user ON ai_document_intelligence(user_id);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- AI classifications: Read-only for authenticated users, insert via service role
ALTER TABLE ai_supplier_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_crisis_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usmca_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_trade_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_manufacturing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_intelligence ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read AI intelligence
CREATE POLICY "Authenticated users can read supplier intelligence"
  ON ai_supplier_intelligence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read crisis intelligence"
  ON ai_crisis_intelligence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read USMCA qualifications"
  ON ai_usmca_qualifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read trade policies"
  ON ai_trade_policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read manufacturing intelligence"
  ON ai_manufacturing_intelligence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read market intelligence"
  ON ai_market_intelligence FOR SELECT
  TO authenticated
  USING (true);

-- Users can only see their own document intelligence
CREATE POLICY "Users can read own document intelligence"
  ON ai_document_intelligence FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert AI results (via API endpoints)
CREATE POLICY "Service role can insert supplier intelligence"
  ON ai_supplier_intelligence FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert crisis intelligence"
  ON ai_crisis_intelligence FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert USMCA qualifications"
  ON ai_usmca_qualifications FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert trade policies"
  ON ai_trade_policies FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert manufacturing intelligence"
  ON ai_manufacturing_intelligence FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert market intelligence"
  ON ai_market_intelligence FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert document intelligence"
  ON ai_document_intelligence FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- GENIUS DATABASE STATS VIEW
-- =====================================================
CREATE OR REPLACE VIEW genius_database_stats AS
SELECT
  'HS Classifications' AS intelligence_type,
  COUNT(*)::INTEGER AS total_records,
  COUNT(DISTINCT hs_code)::INTEGER AS unique_items,
  AVG(confidence)::INTEGER AS avg_confidence,
  COUNT(*) FILTER (WHERE verified = true)::INTEGER AS verified_count,
  MAX(last_updated) AS latest_update
FROM ai_classifications
UNION ALL
SELECT
  'Suppliers',
  COUNT(*)::INTEGER,
  COUNT(DISTINCT supplier_name)::INTEGER,
  AVG(ai_confidence)::INTEGER,
  COUNT(*) FILTER (WHERE verified = true)::INTEGER,
  MAX(last_updated)
FROM ai_supplier_intelligence
UNION ALL
SELECT
  'Crisis Alerts',
  COUNT(*)::INTEGER,
  COUNT(DISTINCT crisis_type)::INTEGER,
  AVG(ai_confidence)::INTEGER,
  COUNT(*) FILTER (WHERE verified = true)::INTEGER,
  MAX(last_updated)
FROM ai_crisis_intelligence
UNION ALL
SELECT
  'USMCA Rules',
  COUNT(*)::INTEGER,
  COUNT(DISTINCT product_category)::INTEGER,
  AVG(ai_confidence)::INTEGER,
  COUNT(*) FILTER (WHERE verified = true)::INTEGER,
  MAX(last_updated)
FROM ai_usmca_qualifications
UNION ALL
SELECT
  'Trade Policies',
  COUNT(*)::INTEGER,
  COUNT(DISTINCT policy_name)::INTEGER,
  AVG(ai_confidence)::INTEGER,
  COUNT(*) FILTER (WHERE verified = true)::INTEGER,
  MAX(last_updated)
FROM ai_trade_policies
UNION ALL
SELECT
  'Manufacturing Sites',
  COUNT(*)::INTEGER,
  COUNT(DISTINCT manufacturing_country)::INTEGER,
  AVG(ai_confidence)::INTEGER,
  COUNT(*) FILTER (WHERE verified = true)::INTEGER,
  MAX(last_updated)
FROM ai_manufacturing_intelligence
UNION ALL
SELECT
  'Market Insights',
  COUNT(*)::INTEGER,
  COUNT(DISTINCT target_market)::INTEGER,
  AVG(ai_confidence)::INTEGER,
  COUNT(*) FILTER (WHERE verified = true)::INTEGER,
  MAX(last_updated)
FROM ai_market_intelligence
UNION ALL
SELECT
  'Document Extracts',
  COUNT(*)::INTEGER,
  COUNT(DISTINCT document_type)::INTEGER,
  AVG(extraction_confidence)::INTEGER,
  COUNT(*) FILTER (WHERE verification_status = 'verified')::INTEGER,
  MAX(last_updated)
FROM ai_document_intelligence;

-- Grant view access to authenticated users
GRANT SELECT ON genius_database_stats TO authenticated;
