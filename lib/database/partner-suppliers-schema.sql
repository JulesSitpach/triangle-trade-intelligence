/**
 * PARTNER SUPPLIERS DATABASE SCHEMA
 * Extends Triangle Intelligence with supplier network for crisis solutions
 * Integrates with existing crisis alert system
 */

-- Partner Suppliers Table
-- Core supplier information for USMCA alternatives
CREATE TABLE IF NOT EXISTS partner_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Company Information
    company_name TEXT NOT NULL,
    location TEXT, -- e.g. "Querétaro, México"
    country_code TEXT DEFAULT 'MX',
    website TEXT,
    
    -- HS Code Specializations
    hs_specialties TEXT[], -- e.g. ["8544", "8708", "6109"]
    product_categories TEXT[], -- e.g. ["electrical_components", "auto_parts"]
    
    -- Contact Information  
    contact_person TEXT,
    contact_title TEXT,
    phone TEXT,
    email TEXT,
    
    -- USMCA & Compliance
    usmca_qualified BOOLEAN DEFAULT false,
    usmca_certification_time_days INTEGER, -- e.g. 14-21 days
    quality_certifications TEXT[], -- e.g. ["ISO 9001", "UL Listed", "IATF 16949"]
    
    -- Broker Verification
    broker_verified BOOLEAN DEFAULT false,
    broker_visit_date DATE,
    broker_notes TEXT,
    verification_status TEXT DEFAULT 'pending', -- pending, verified, flagged
    
    -- Capacity & Pricing
    production_capacity TEXT, -- e.g. "2M units/month", "500K USD/month"
    pricing_premium_percent DECIMAL, -- % above typical Chinese suppliers
    minimum_order_quantity TEXT,
    lead_time_weeks INTEGER,
    
    -- Performance Tracking
    introduction_count INTEGER DEFAULT 0,
    successful_partnerships INTEGER DEFAULT 0,
    average_rating DECIMAL,
    last_contacted DATE,
    
    -- System Fields
    status TEXT DEFAULT 'active', -- active, inactive, pending_review
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT -- broker who added this supplier
);

-- Crisis Solutions Junction Table
-- Links crisis alerts to relevant supplier alternatives
CREATE TABLE IF NOT EXISTS crisis_solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Crisis Alert Reference
    crisis_alert_id TEXT NOT NULL, -- matches alert ID from trump-tariff-alerts.js
    hs_code TEXT NOT NULL, -- specific HS code affected
    
    -- Supplier Reference
    supplier_id UUID REFERENCES partner_suppliers(id) ON DELETE CASCADE,
    
    -- Solution Analysis
    estimated_cost_savings DECIMAL, -- annual USD savings
    net_benefit_percent DECIMAL, -- net benefit after premium costs
    tariff_savings_percent DECIMAL DEFAULT 25, -- USMCA tariff avoidance
    
    -- Recommendation Priority
    recommendation_priority INTEGER DEFAULT 5, -- 1=top choice, 5=last resort
    broker_recommendation TEXT, -- custom broker insights
    
    -- Matching Logic
    match_confidence DECIMAL DEFAULT 0.5, -- 0-1 algorithm confidence
    match_criteria JSONB, -- store matching algorithm details
    
    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Supplier Introduction Requests Table
-- Tracks customer requests for supplier introductions
CREATE TABLE IF NOT EXISTS supplier_introduction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer Information
    user_email TEXT NOT NULL,
    company_name TEXT,
    user_profile JSONB, -- store full user profile from crisis dashboard
    
    -- Request Details
    supplier_id UUID REFERENCES partner_suppliers(id),
    hs_code TEXT,
    crisis_alert_id TEXT,
    
    -- Requirements
    annual_volume TEXT,
    timeline_urgency TEXT, -- immediate, 30_days, 90_days, planning
    specific_requirements TEXT,
    
    -- Request Status
    status TEXT DEFAULT 'pending', -- pending, broker_contacted, introduction_made, closed
    broker_notes TEXT,
    introduction_date DATE,
    
    -- Follow-up Tracking
    customer_response TEXT, -- interested, not_interested, partnership_formed
    partnership_value DECIMAL, -- USD value if partnership formed
    broker_fee_earned DECIMAL,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    assigned_broker TEXT
);

-- Supplier Performance Metrics Table
-- Track supplier reliability and customer satisfaction
CREATE TABLE IF NOT EXISTS supplier_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    supplier_id UUID REFERENCES partner_suppliers(id) ON DELETE CASCADE,
    
    -- Performance Indicators
    response_time_hours INTEGER, -- how quickly they respond to inquiries
    quote_accuracy_rating DECIMAL, -- 1-5 scale
    delivery_reliability_rating DECIMAL, -- 1-5 scale
    quality_rating DECIMAL, -- 1-5 scale
    communication_rating DECIMAL, -- 1-5 scale
    
    -- Business Metrics
    partnerships_initiated INTEGER DEFAULT 0,
    partnerships_successful INTEGER DEFAULT 0,
    average_deal_size DECIMAL,
    total_facilitated_volume DECIMAL,
    
    -- Period Tracking
    evaluation_period TEXT, -- monthly, quarterly, annual
    period_start DATE,
    period_end DATE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_partner_suppliers_hs_specialties 
    ON partner_suppliers USING gin(hs_specialties);

CREATE INDEX IF NOT EXISTS idx_partner_suppliers_country_verified 
    ON partner_suppliers(country_code, broker_verified, status);

CREATE INDEX IF NOT EXISTS idx_crisis_solutions_alert_hs 
    ON crisis_solutions(crisis_alert_id, hs_code);

CREATE INDEX IF NOT EXISTS idx_crisis_solutions_priority 
    ON crisis_solutions(recommendation_priority, is_active);

CREATE INDEX IF NOT EXISTS idx_introduction_requests_status 
    ON supplier_introduction_requests(status, created_at);

CREATE INDEX IF NOT EXISTS idx_supplier_performance 
    ON supplier_performance_metrics(supplier_id, period_end);

-- Sample Data for Testing (Broker can replace with real suppliers)
INSERT INTO partner_suppliers (
    company_name, location, country_code, hs_specialties, 
    contact_person, broker_verified, pricing_premium_percent, 
    usmca_certification_time_days, broker_notes
) VALUES 
(
    'ElectroMex Solutions', 
    'Querétaro, México', 
    'MX', 
    ARRAY['8544', '8536'], 
    'María González', 
    false, -- Broker to verify
    15.0, -- 15% premium vs Chinese suppliers
    18, -- 2-3 weeks certification
    'Potential supplier - needs facility visit for verification'
),
(
    'AutoComponentes Norte', 
    'Tijuana, México', 
    'MX', 
    ARRAY['8708', '8714'], 
    'Roberto Martínez', 
    false, -- Broker to verify
    12.0, -- 12% premium
    21, -- 3 weeks certification
    'Automotive parts specialist - established 2015'
),
(
    'Textiles de León', 
    'León, Guanajuato', 
    'MX', 
    ARRAY['6109', '6204'], 
    'Ana Rodríguez', 
    false, -- Broker to verify
    8.0, -- 8% premium - textiles more cost competitive
    14, -- 2 weeks certification
    'Textile manufacturer with USMCA experience'
);

-- Views for Common Queries
CREATE OR REPLACE VIEW verified_suppliers AS
SELECT 
    ps.*,
    COALESCE(spm.quality_rating, 0) as avg_quality_rating,
    COALESCE(spm.partnerships_successful, 0) as total_successful_partnerships
FROM partner_suppliers ps
LEFT JOIN supplier_performance_metrics spm ON ps.id = spm.supplier_id
WHERE ps.broker_verified = true 
  AND ps.status = 'active';

CREATE OR REPLACE VIEW crisis_supplier_matches AS
SELECT 
    cs.crisis_alert_id,
    cs.hs_code,
    ps.company_name,
    ps.location,
    ps.contact_person,
    cs.estimated_cost_savings,
    cs.net_benefit_percent,
    cs.recommendation_priority,
    ps.pricing_premium_percent,
    ps.usmca_certification_time_days
FROM crisis_solutions cs
JOIN partner_suppliers ps ON cs.supplier_id = ps.id
WHERE cs.is_active = true
  AND ps.status = 'active'
ORDER BY cs.crisis_alert_id, cs.recommendation_priority;

-- Functions for Business Logic
CREATE OR REPLACE FUNCTION get_suppliers_for_hs_code(target_hs_code TEXT)
RETURNS TABLE (
    supplier_id UUID,
    company_name TEXT,
    location TEXT,
    contact_person TEXT,
    pricing_premium_percent DECIMAL,
    certification_time_days INTEGER,
    broker_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.company_name,
        ps.location,
        ps.contact_person,
        ps.pricing_premium_percent,
        ps.usmca_certification_time_days,
        ps.broker_verified
    FROM partner_suppliers ps
    WHERE ps.hs_specialties && ARRAY[LEFT(target_hs_code, 4)]
      AND ps.status = 'active'
    ORDER BY ps.broker_verified DESC, ps.pricing_premium_percent ASC;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_suppliers_updated_at 
    BEFORE UPDATE ON partner_suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_introduction_requests_updated_at 
    BEFORE UPDATE ON supplier_introduction_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();