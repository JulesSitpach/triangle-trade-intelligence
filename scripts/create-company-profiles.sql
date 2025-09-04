-- SIMPLE COMPANY PROFILES TABLE
-- Run this in your Supabase SQL editor

-- Drop existing table if needed (be careful!)
-- DROP TABLE IF EXISTS company_profiles CASCADE;

-- Create the table
CREATE TABLE company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    business_type TEXT,
    industry_sectors TEXT[],
    ai_business_context JSONB DEFAULT '{}',
    primary_hs_chapters INTEGER[],
    secondary_hs_chapters INTEGER[],
    trade_volume TEXT,
    supply_chain_pattern TEXT,
    trade_agreements TEXT[],
    keyword_priorities JSONB DEFAULT '{}',
    material_focus TEXT[],
    application_focus TEXT[],
    analysis_confidence DECIMAL(3,2) DEFAULT 0.5,
    last_ai_analysis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_company_profiles_company_id ON company_profiles(company_id);
CREATE INDEX idx_company_profiles_primary_chapters ON company_profiles USING GIN(primary_hs_chapters);

-- Insert AutoParts Mexico SA
INSERT INTO company_profiles (
    company_id,
    company_name,
    business_type,
    industry_sectors,
    ai_business_context,
    primary_hs_chapters,
    secondary_hs_chapters,
    trade_volume,
    supply_chain_pattern,
    trade_agreements,
    keyword_priorities,
    material_focus,
    application_focus,
    analysis_confidence
) VALUES (
    'autoparts_mexico_sa',
    'AutoParts Mexico SA',
    'Automotive Manufacturing',
    ARRAY['automotive', 'electrical_components'],
    '{"classification": "automotive_electrical_assembly", "complexity": "multi_component", "primary_products": ["wire_harness", "dashboard_components"], "usmca_optimized": true}'::JSONB,
    ARRAY[8544, 85, 8708, 87],
    ARRAY[40, 39, 73, 74],
    '$3,000,000',
    'US components → Mexico assembly → US export',
    ARRAY['USMCA'],
    '{"wire": 10, "harness": 9, "dashboard": 8, "electrical": 10, "automotive": 7}'::JSONB,
    ARRAY['copper', 'plastic', 'rubber'],
    ARRAY['wire_harness', 'dashboard', 'electrical_conductor'],
    0.92
);

-- Verify it was created
SELECT company_id, company_name, primary_hs_chapters FROM company_profiles;