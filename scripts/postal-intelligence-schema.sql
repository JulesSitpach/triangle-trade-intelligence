-- USMCA Postal Intelligence Database Schema
-- Execute this in your Supabase SQL Editor

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS postal_intelligence;

-- Create postal_intelligence table for USMCA countries
CREATE TABLE postal_intelligence (
  id SERIAL PRIMARY KEY,
  postal_code VARCHAR(10) NOT NULL UNIQUE,
  country VARCHAR(2) NOT NULL,
  state_province VARCHAR(50),
  city VARCHAR(100),
  region VARCHAR(50),
  metro VARCHAR(100),
  nearest_ports TEXT[], -- Array of nearby ports
  shipping_zone VARCHAR(20),
  tax_jurisdiction VARCHAR(100),
  economic_zone VARCHAR(100),
  usmca_gateway BOOLEAN DEFAULT false,
  us_border BOOLEAN DEFAULT false,
  mexico_border BOOLEAN DEFAULT false,
  canada_border BOOLEAN DEFAULT false,
  trade_advantages TEXT[],
  confidence_score INTEGER DEFAULT 70 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX idx_postal_code ON postal_intelligence(postal_code);
CREATE INDEX idx_country ON postal_intelligence(country);
CREATE INDEX idx_country_region ON postal_intelligence(country, region);
CREATE INDEX idx_usmca_gateway ON postal_intelligence(usmca_gateway);
CREATE INDEX idx_shipping_zone ON postal_intelligence(shipping_zone);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_postal_intelligence_updated_at ON postal_intelligence;
CREATE TRIGGER update_postal_intelligence_updated_at 
    BEFORE UPDATE ON postal_intelligence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE postal_intelligence ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (public read for postal lookups)
CREATE POLICY "Enable read access for all users" ON postal_intelligence
    FOR SELECT USING (true);

-- Create policy for service role (full access for data management)
CREATE POLICY "Enable full access for service role" ON postal_intelligence
    FOR ALL USING (auth.role() = 'service_role');

-- Create a view for public API access (without internal fields)
CREATE OR REPLACE VIEW postal_intelligence_public AS
SELECT 
    postal_code,
    country,
    state_province,
    city,
    region,
    metro,
    nearest_ports,
    shipping_zone,
    usmca_gateway,
    us_border,
    mexico_border,
    canada_border,
    trade_advantages,
    confidence_score
FROM postal_intelligence;

-- Grant access to the view
GRANT SELECT ON postal_intelligence_public TO anon;
GRANT SELECT ON postal_intelligence_public TO authenticated;

-- Insert a test record to verify table works
INSERT INTO postal_intelligence (
    postal_code, country, state_province, city, region, metro,
    nearest_ports, shipping_zone, usmca_gateway, confidence_score,
    trade_advantages
) VALUES (
    'TEST1', 'US', 'TEST', 'Test City', 'Test Region', 'Test Metro',
    ARRAY['Test Port'], 'Test Zone', true, 100,
    ARRAY['Test creation successful']
);

-- Verify the test record
SELECT 
    postal_code, 
    country, 
    city, 
    usmca_gateway,
    confidence_score
FROM postal_intelligence 
WHERE postal_code = 'TEST1';

-- Clean up test record
DELETE FROM postal_intelligence WHERE postal_code = 'TEST1';

-- Show table info
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'postal_intelligence';

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'postal_intelligence';

COMMENT ON TABLE postal_intelligence IS 'USMCA Postal Code Intelligence for US, Canada, and Mexico trade routing optimization';
COMMENT ON COLUMN postal_intelligence.postal_code IS 'ZIP code (US), Postal code (CA), or Código postal (MX)';
COMMENT ON COLUMN postal_intelligence.usmca_gateway IS 'Indicates if location provides USMCA trade advantages';
COMMENT ON COLUMN postal_intelligence.trade_advantages IS 'Array of specific trade advantages for this location';
COMMENT ON COLUMN postal_intelligence.confidence_score IS 'Data quality confidence (0-100%)';