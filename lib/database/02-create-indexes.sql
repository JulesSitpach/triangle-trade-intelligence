-- STEP 2: CREATE INDEXES AND FUNCTIONS
-- Run this after Step 1 completes successfully

-- Performance Indexes
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