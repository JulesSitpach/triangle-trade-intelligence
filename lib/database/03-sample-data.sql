-- STEP 3: INSERT SAMPLE DATA
-- Run this after Steps 1 & 2 complete successfully

-- Sample Suppliers for Testing
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
    false,
    15.0,
    18,
    'Potential supplier - needs facility visit for verification'
),
(
    'AutoComponentes Norte', 
    'Tijuana, México', 
    'MX', 
    ARRAY['8708', '8714'], 
    'Roberto Martínez', 
    false,
    12.0,
    21,
    'Automotive parts specialist - established 2015'
),
(
    'Textiles de León', 
    'León, Guanajuato', 
    'MX', 
    ARRAY['6109', '6204'], 
    'Ana Rodríguez', 
    false,
    8.0,
    14,
    'Textile manufacturer with USMCA experience'
)
ON CONFLICT (company_name) DO NOTHING;

-- Test the function works
SELECT * FROM get_suppliers_for_hs_code('8544250000');

-- Verify data inserted correctly
SELECT 
    company_name, 
    location, 
    hs_specialties, 
    broker_verified,
    created_at
FROM partner_suppliers
ORDER BY created_at DESC;