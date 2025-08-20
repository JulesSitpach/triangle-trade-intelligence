-- DATABASE SCHEMA FIXES FOR TRIANGLE INTELLIGENCE PLATFORM
-- Addresses Priority 3: Database Schema Repairs

-- 1. Add missing shipping_network_effects table
CREATE TABLE IF NOT EXISTS shipping_network_effects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_country text NOT NULL,
    business_type text NOT NULL,
    route_pattern text NOT NULL,
    success_rate decimal(5,2) DEFAULT 0,
    pattern_strength integer DEFAULT 0,
    volume_threshold bigint DEFAULT 0,
    cost_efficiency decimal(10,2) DEFAULT 0,
    time_efficiency decimal(10,2) DEFAULT 0,
    risk_score integer DEFAULT 0,
    seasonal_variance decimal(5,2) DEFAULT 0,
    carrier_preference text,
    port_preference text,
    documentation_complexity integer DEFAULT 5,
    compliance_score decimal(5,2) DEFAULT 0,
    network_growth_factor decimal(5,2) DEFAULT 0,
    institutional_memory text,
    pattern_type text CHECK (pattern_type IN ('TRIANGLE_ROUTING', 'DIRECT_SHIPPING', 'HYBRID_APPROACH')),
    learning_source text CHECK (learning_source IN ('USER_SUCCESS', 'CARRIER_DATA', 'GOVERNMENT_ANALYSIS', 'MARKET_INTELLIGENCE')),
    confidence_level integer DEFAULT 75 CHECK (confidence_level >= 0 AND confidence_level <= 100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_validated timestamp with time zone DEFAULT now(),
    validation_status text DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALIDATED', 'NEEDS_REVIEW')),
    data_source text DEFAULT 'PLATFORM_LEARNING',
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_network_effects_supplier_business 
ON shipping_network_effects(supplier_country, business_type);

CREATE INDEX IF NOT EXISTS idx_shipping_network_effects_pattern_strength 
ON shipping_network_effects(pattern_strength DESC);

CREATE INDEX IF NOT EXISTS idx_shipping_network_effects_success_rate 
ON shipping_network_effects(success_rate DESC);

-- 2. Add company_name column to workflow_sessions if it doesn't exist
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_sessions' 
        AND column_name = 'company_name'
    ) THEN
        -- Add the column
        ALTER TABLE workflow_sessions 
        ADD COLUMN company_name text;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS idx_workflow_sessions_company_name 
        ON workflow_sessions(company_name);
    END IF;
END
$$;

-- 3. Add missing columns to workflow_sessions for better tracking
DO $$
BEGIN
    -- Add business_type column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_sessions' 
        AND column_name = 'business_type'
    ) THEN
        ALTER TABLE workflow_sessions 
        ADD COLUMN business_type text;
    END IF;
    
    -- Add import_volume column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_sessions' 
        AND column_name = 'import_volume'
    ) THEN
        ALTER TABLE workflow_sessions 
        ADD COLUMN import_volume text;
    END IF;
    
    -- Add primary_supplier_country column if missing
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_sessions' 
        AND column_name = 'primary_supplier_country'
    ) THEN
        ALTER TABLE workflow_sessions 
        ADD COLUMN primary_supplier_country text;
    END IF;
END
$$;

-- 4. Create shipping_volume_patterns table if referenced in code
CREATE TABLE IF NOT EXISTS shipping_volume_patterns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    route_type text NOT NULL,
    volume_category text,
    seasonal_pattern text,
    confidence_score decimal(5,2) DEFAULT 75,
    data_quality integer DEFAULT 75 CHECK (data_quality >= 0 AND data_quality <= 100),
    business_type text,
    supplier_country text,
    destination_country text DEFAULT 'US',
    carrier_preference text,
    cost_per_unit decimal(10,4) DEFAULT 0,
    transit_time_days integer DEFAULT 0,
    reliability_score decimal(5,2) DEFAULT 75,
    seasonal_variance decimal(5,2) DEFAULT 0,
    peak_season_multiplier decimal(5,2) DEFAULT 1.0,
    off_season_multiplier decimal(5,2) DEFAULT 1.0,
    network_effects_enabled boolean DEFAULT true,
    learning_source text DEFAULT 'PLATFORM_ANALYSIS',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_shipping_volume_patterns_route_confidence 
ON shipping_volume_patterns(route_type, confidence_score DESC);

-- 5. Create shipping_success_patterns table if referenced
CREATE TABLE IF NOT EXISTS shipping_success_patterns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_type text NOT NULL,
    success_rate decimal(5,2) NOT NULL DEFAULT 0,
    pattern_description text,
    route_configuration jsonb DEFAULT '{}'::jsonb,
    cost_savings_percentage decimal(5,2) DEFAULT 0,
    time_savings_days integer DEFAULT 0,
    risk_mitigation_score decimal(5,2) DEFAULT 0,
    implementation_complexity integer DEFAULT 5 CHECK (implementation_complexity >= 1 AND implementation_complexity <= 10),
    recommended_volume_threshold bigint DEFAULT 0,
    seasonal_applicability text[] DEFAULT ARRAY[]::text[],
    carrier_compatibility text[] DEFAULT ARRAY[]::text[],
    regulatory_compliance_score decimal(5,2) DEFAULT 75,
    user_feedback_score decimal(5,2) DEFAULT 0,
    validation_status text DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALIDATED', 'DEPRECATED')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_applied timestamp with time zone,
    success_count integer DEFAULT 0,
    failure_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_success_patterns_business_success 
ON shipping_success_patterns(business_type, success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_shipping_success_patterns_validation 
ON shipping_success_patterns(validation_status, success_rate DESC);

-- 6. Insert some sample data for shipping_network_effects to support Beast Master
INSERT INTO shipping_network_effects (
    supplier_country, business_type, route_pattern, success_rate, pattern_strength,
    volume_threshold, cost_efficiency, time_efficiency, risk_score, 
    pattern_type, learning_source, confidence_level, validation_status
) VALUES 
    ('CN', 'Electronics', 'CN-MX-US', 85.5, 95, 1000000, 25.3, 15.2, 3, 'TRIANGLE_ROUTING', 'USER_SUCCESS', 90, 'VALIDATED'),
    ('CN', 'Manufacturing', 'CN-CA-US', 78.2, 88, 2000000, 22.1, 12.8, 4, 'TRIANGLE_ROUTING', 'USER_SUCCESS', 85, 'VALIDATED'),
    ('VN', 'Textiles', 'VN-MX-US', 92.1, 82, 500000, 30.5, 18.7, 2, 'TRIANGLE_ROUTING', 'CARRIER_DATA', 88, 'VALIDATED'),
    ('TW', 'Automotive', 'TW-CA-US', 89.3, 91, 5000000, 28.9, 14.5, 3, 'TRIANGLE_ROUTING', 'MARKET_INTELLIGENCE', 92, 'VALIDATED'),
    ('TH', 'Medical', 'TH-MX-US', 76.8, 75, 750000, 19.2, 11.3, 5, 'TRIANGLE_ROUTING', 'GOVERNMENT_ANALYSIS', 80, 'VALIDATED')
ON CONFLICT DO NOTHING;

-- 7. Insert sample data for shipping_volume_patterns
INSERT INTO shipping_volume_patterns (
    route_type, volume_category, seasonal_pattern, confidence_score, 
    business_type, supplier_country, carrier_preference, cost_per_unit, 
    transit_time_days, reliability_score
) VALUES 
    ('triangle_routing', 'High', 'Q4_HEAVY', 85, 'Electronics', 'CN', 'Maritime', 2.50, 21, 88),
    ('triangle_routing', 'Medium', 'STEADY_YEAR_ROUND', 78, 'Manufacturing', 'VN', 'Maritime', 3.20, 28, 82),
    ('triangle_routing', 'High', 'Q1_Q2_PEAK', 92, 'Textiles', 'TW', 'Air_Sea_Combo', 4.10, 18, 91),
    ('direct_shipping', 'Low', 'SEASONAL_VARIANCE', 65, 'Medical', 'TH', 'Air_Freight', 8.75, 7, 95),
    ('triangle_routing', 'Very_High', 'Q4_HEAVY', 89, 'Automotive', 'MX', 'Rail_Road', 1.85, 14, 87)
ON CONFLICT DO NOTHING;

-- 8. Insert sample data for shipping_success_patterns  
INSERT INTO shipping_success_patterns (
    business_type, success_rate, pattern_description, cost_savings_percentage,
    time_savings_days, risk_mitigation_score, recommended_volume_threshold,
    validation_status, success_count
) VALUES 
    ('Electronics', 87.5, 'China-Mexico-US triangle routing for electronics components', 23.5, 5, 85.2, 1000000, 'VALIDATED', 47),
    ('Manufacturing', 82.3, 'Multi-modal shipping with customs pre-clearance', 19.8, 3, 78.9, 2000000, 'VALIDATED', 33),
    ('Textiles', 91.2, 'Southeast Asia consolidation with USMCA benefits', 28.7, 7, 92.1, 500000, 'VALIDATED', 62),
    ('Automotive', 85.9, 'Just-in-time delivery with buffer stock optimization', 21.3, 2, 88.4, 5000000, 'VALIDATED', 28),
    ('Medical', 79.6, 'Temperature-controlled triangle routing with expedited clearance', 15.4, 1, 94.7, 750000, 'VALIDATED', 19)
ON CONFLICT DO NOTHING;

-- 9. Add RLS (Row Level Security) policies if needed
-- Enable RLS on new tables for security
ALTER TABLE shipping_network_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_volume_patterns ENABLE ROW LEVEL SECURITY;  
ALTER TABLE shipping_success_patterns ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access (adjust as needed for your auth system)
CREATE POLICY IF NOT EXISTS "Allow read access to shipping_network_effects" 
ON shipping_network_effects FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow read access to shipping_volume_patterns" 
ON shipping_volume_patterns FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow read access to shipping_success_patterns" 
ON shipping_success_patterns FOR SELECT USING (true);

-- 10. Create a view for Beast Master Controller integration
CREATE OR REPLACE VIEW beast_master_shipping_intelligence AS
SELECT 
    sne.supplier_country,
    sne.business_type,
    sne.route_pattern,
    sne.success_rate,
    sne.pattern_strength,
    sne.cost_efficiency,
    sne.time_efficiency,
    sne.risk_score,
    ssp.cost_savings_percentage,
    ssp.time_savings_days,
    svp.carrier_preference,
    svp.transit_time_days,
    svp.reliability_score,
    svp.seasonal_pattern
FROM shipping_network_effects sne
LEFT JOIN shipping_success_patterns ssp ON sne.business_type = ssp.business_type
LEFT JOIN shipping_volume_patterns svp ON sne.business_type = svp.business_type 
WHERE sne.validation_status = 'VALIDATED'
ORDER BY sne.pattern_strength DESC, sne.success_rate DESC;

-- Grant permissions on the view
GRANT SELECT ON beast_master_shipping_intelligence TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE shipping_network_effects IS 'Network effects learning from shipping pattern successes - supports Beast Master Intelligence';
COMMENT ON TABLE shipping_volume_patterns IS 'Historical shipping volume patterns for capacity analysis';  
COMMENT ON TABLE shipping_success_patterns IS 'Proven shipping success patterns for recommendation engine';
COMMENT ON VIEW beast_master_shipping_intelligence IS 'Optimized view for Beast Master Controller shipping intelligence queries';

-- Update table statistics for query optimization
ANALYZE shipping_network_effects;
ANALYZE shipping_volume_patterns;
ANALYZE shipping_success_patterns;
ANALYZE workflow_sessions;