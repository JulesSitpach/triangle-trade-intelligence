-- Simple USMCA Compliance Database - 3 Core Tables Only
-- Focused on actual USMCA functionality, not over-engineering

-- 1. Essential HS Codes with USMCA Rules
CREATE TABLE IF NOT EXISTS usmca_hs_codes (
    hs_code VARCHAR(10) PRIMARY KEY,
    product_description TEXT NOT NULL,
    chapter INTEGER,
    usmca_rule VARCHAR(50) NOT NULL, -- 'regional_content', 'tariff_shift', 'process_rule'
    regional_content_percentage DECIMAL(5,2), -- e.g. 75.00 for 75%
    tariff_shift_required TEXT, -- e.g. 'Change from any other chapter'
    specific_process TEXT, -- Manufacturing requirements
    
    -- Tariff rates for savings calculation
    us_mfn_rate DECIMAL(5,2) DEFAULT 0,
    us_usmca_rate DECIMAL(5,2) DEFAULT 0,
    ca_mfn_rate DECIMAL(5,2) DEFAULT 0, 
    ca_usmca_rate DECIMAL(5,2) DEFAULT 0,
    mx_mfn_rate DECIMAL(5,2) DEFAULT 0,
    mx_usmca_rate DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Submissions (Simple session tracking)
CREATE TABLE IF NOT EXISTS user_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100),
    
    -- Foundation data
    company_name VARCHAR(200),
    business_type VARCHAR(100),
    supplier_country VARCHAR(3),
    trade_volume VARCHAR(50),
    
    -- Product classification
    product_description TEXT,
    hs_code VARCHAR(10),
    classification_confidence DECIMAL(3,2),
    
    -- USMCA qualification
    component_origins JSONB, -- [{component: 'steel', origin: 'US', percentage: 60}]
    manufacturing_location VARCHAR(3),
    usmca_qualified BOOLEAN,
    qualification_method VARCHAR(50),
    
    -- Results
    annual_savings DECIMAL(12,2),
    certificate_generated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Countries (Simple reference)
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    usmca_member BOOLEAN DEFAULT FALSE
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_hs_codes_chapter ON usmca_hs_codes(chapter);
CREATE INDEX IF NOT EXISTS idx_submissions_session ON user_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON user_submissions(created_at);

-- Simple business types (just insert directly, no over-engineering)
INSERT INTO countries (code, name, usmca_member) VALUES
    ('US', 'United States', TRUE),
    ('CA', 'Canada', TRUE),
    ('MX', 'Mexico', TRUE),
    ('CN', 'China', FALSE),
    ('IN', 'India', FALSE),
    ('DE', 'Germany', FALSE),
    ('JP', 'Japan', FALSE),
    ('KR', 'South Korea', FALSE),
    ('VN', 'Vietnam', FALSE),
    ('TH', 'Thailand', FALSE),
    ('TW', 'Taiwan', FALSE),
    ('MY', 'Malaysia', FALSE),
    ('ID', 'Indonesia', FALSE),
    ('PH', 'Philippines', FALSE),
    ('SG', 'Singapore', FALSE)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    usmca_member = EXCLUDED.usmca_member;