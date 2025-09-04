-- Add TechFlow Electronics and Northern Textiles for testing

-- TechFlow Electronics (Electronics Importer)
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
    'techflow_electronics',
    'TechFlow Electronics Inc',
    'Electronics Manufacturing',
    ARRAY['electronics', 'consumer_electronics'],
    '{"classification": "electronics_importer", "complexity": "standard", "primary_products": ["smartphones", "tablets", "circuit boards"], "china_dependent": true}'::JSONB,
    ARRAY[8517, 85, 8471], -- Telecom equipment, electrical machinery, computers
    ARRAY[90, 39], -- Optical instruments, plastics
    '$8,500,000',
    'China → US direct import',
    ARRAY['MFN'],
    '{"smartphone": 10, "circuit": 9, "display": 8, "board": 8, "processor": 7}'::JSONB,
    ARRAY['silicon', 'glass', 'plastic'],
    ARRAY['consumer_electronics', 'telecom_equipment', 'circuit_boards'],
    0.88
);

-- Northern Textiles (Textile Manufacturer)
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
    'northern_textiles',
    'Northern Textiles Ltd',
    'Textile Manufacturing',
    ARRAY['textiles', 'apparel'],
    '{"classification": "textile_producer", "complexity": "standard", "primary_products": ["cotton fabrics", "polyester yarns", "textile materials"], "vietnam_sourcing": true}'::JSONB,
    ARRAY[52, 54, 61, 62], -- Cotton, synthetic fibers, apparel
    ARRAY[63, 58, 59], -- Other textiles
    '$5,000,000',
    'Vietnam → Canada → US',
    ARRAY['USMCA', 'CPTPP'],
    '{"cotton": 10, "polyester": 8, "fabric": 9, "yarn": 7, "textile": 10}'::JSONB,
    ARRAY['cotton', 'polyester', 'nylon'],
    ARRAY['fabric_production', 'yarn_spinning', 'textile_manufacturing'],
    0.85
);

-- Verify all three companies exist
SELECT company_id, company_name, primary_hs_chapters 
FROM company_profiles 
ORDER BY company_name;