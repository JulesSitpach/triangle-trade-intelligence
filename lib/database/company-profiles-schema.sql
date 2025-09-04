-- Company Profiles with AI Business Context
-- One-time AI analysis stored for efficient product searches

CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    business_type TEXT,
    industry_sectors TEXT[], -- e.g., ['automotive', 'electrical_components']
    
    -- AI-analyzed business context (stored as JSONB for flexibility)
    ai_business_context JSONB NOT NULL DEFAULT '{}',
    
    -- Extracted key data for fast queries
    primary_hs_chapters INTEGER[], -- e.g., [85, 87, 40, 70]
    secondary_hs_chapters INTEGER[], -- Additional relevant chapters
    
    -- Trade context
    trade_volume TEXT,
    supply_chain_pattern TEXT, -- e.g., 'Mexico manufacturing → US export'
    trade_agreements TEXT[], -- e.g., ['USMCA', 'CAFTA']
    
    -- Search optimization hints
    keyword_priorities JSONB DEFAULT '{}', -- Product-specific keywords
    material_focus TEXT[], -- e.g., ['copper', 'steel', 'plastic']
    application_focus TEXT[], -- e.g., ['wire_harness', 'dashboard', 'electrical']
    
    -- Metadata
    last_ai_analysis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analysis_confidence DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_company_profiles_company_id ON company_profiles(company_id);
CREATE INDEX idx_company_profiles_primary_chapters ON company_profiles USING GIN(primary_hs_chapters);
CREATE INDEX idx_company_profiles_business_type ON company_profiles(business_type);

-- Sample data for testing
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
) VALUES 
-- AutoParts Mexico SA
(
    'autoparts_mexico_sa',
    'AutoParts Mexico SA',
    'Automotive Manufacturing',
    ARRAY['automotive', 'electrical_components'],
    '{"classification": "automotive_electrical_assembly", "complexity": "multi_component", "primary_products": ["wire_harness", "dashboard_components"], "usmca_optimized": true}'::JSONB,
    ARRAY[8544, 85, 8708, 87], -- Electrical conductors, electrical machinery, auto parts, vehicles
    ARRAY[40, 39, 73, 74], -- Rubber, plastics, steel, copper
    '$3,000,000',
    'US components → Mexico assembly → US export',
    ARRAY['USMCA'],
    '{"wire": 10, "harness": 9, "dashboard": 8, "electrical": 10, "automotive": 7}'::JSONB,
    ARRAY['copper', 'plastic', 'rubber'],
    ARRAY['wire_harness', 'dashboard', 'electrical_conductor'],
    0.92
),
-- TechFlow Electronics
(
    'techflow_electronics',
    'TechFlow Electronics Inc',
    'Electronics Manufacturing',
    ARRAY['electronics', 'consumer_electronics'],
    '{"classification": "electronics_importer", "complexity": "standard", "primary_products": ["smartphones", "tablets"], "china_dependent": true}'::JSONB,
    ARRAY[85, 8517, 8471], -- Electrical machinery, telecom, computers
    ARRAY[90, 39], -- Optical instruments, plastics
    '$8,500,000',
    'China → US direct import',
    ARRAY['MFN'],
    '{"smartphone": 10, "circuit": 8, "processor": 7, "display": 6}'::JSONB,
    ARRAY['silicon', 'glass', 'plastic'],
    ARRAY['consumer_electronics', 'telecom_equipment'],
    0.88
),
-- Northern Textiles
(
    'northern_textiles',
    'Northern Textiles Ltd',
    'Textile Manufacturing',
    ARRAY['textiles', 'apparel'],
    '{"classification": "textile_producer", "complexity": "standard", "primary_products": ["fabrics", "yarns"], "vietnam_sourcing": true}'::JSONB,
    ARRAY[52, 54, 61, 62], -- Cotton, synthetic fibers, apparel
    ARRAY[63, 58, 59], -- Other textiles
    '$5,000,000',
    'Vietnam → Canada → US',
    ARRAY['USMCA', 'CPTPP'],
    '{"cotton": 10, "polyester": 8, "fabric": 9, "yarn": 7}'::JSONB,
    ARRAY['cotton', 'polyester', 'nylon'],
    ARRAY['fabric_production', 'yarn_spinning'],
    0.85
);

-- Function to get company context for classification
CREATE OR REPLACE FUNCTION get_company_context(p_company_id TEXT)
RETURNS TABLE (
    company_name TEXT,
    primary_chapters INTEGER[],
    secondary_chapters INTEGER[],
    keyword_priorities JSONB,
    material_focus TEXT[],
    application_focus TEXT[],
    analysis_confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.company_name,
        cp.primary_hs_chapters,
        cp.secondary_hs_chapters,
        cp.keyword_priorities,
        cp.material_focus,
        cp.application_focus,
        cp.analysis_confidence
    FROM company_profiles cp
    WHERE cp.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;