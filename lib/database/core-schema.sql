-- Triangle Intelligence: Dynamic USMCA Database Schema
-- All data-driven, zero hardcoding approach

-- Core USMCA HS Codes (dynamic classification system)
CREATE TABLE IF NOT EXISTS usmca_hs_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    chapter VARCHAR(2) NOT NULL,
    section VARCHAR(2),
    
    -- Dynamic tariff rates (no hardcoded values)
    us_mfn_rate DECIMAL(5,2),
    us_usmca_rate DECIMAL(5,2),
    ca_mfn_rate DECIMAL(5,2), 
    ca_usmca_rate DECIMAL(5,2),
    mx_mfn_rate DECIMAL(5,2),
    mx_usmca_rate DECIMAL(5,2),
    
    -- Rules of Origin (dynamic criteria)
    origin_requirement TEXT,
    origin_percentage DECIMAL(5,2),
    tariff_shift_required BOOLEAN DEFAULT false,
    specific_process_required TEXT,
    
    -- Dynamic metadata
    certification_requirements JSONB,
    trade_volume_rank INTEGER,
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data_source VARCHAR(100),
    last_verified_at TIMESTAMPTZ
);

-- Dynamic USMCA Certificate Templates
CREATE TABLE IF NOT EXISTS usmca_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_type VARCHAR(100) NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    
    -- Dynamic form structure
    required_fields JSONB NOT NULL, -- [{field: "producer_name", type: "text", validation: "required"}]
    optional_fields JSONB,
    conditional_fields JSONB, -- Fields that appear based on other selections
    
    -- Dynamic validation rules
    validation_rules JSONB, -- {field_name: {min_length: 5, pattern: "regex"}}
    business_rules JSONB, -- Complex validation logic
    
    -- Template configuration
    applicable_hs_codes TEXT[], -- Dynamic array of applicable codes
    applicable_countries TEXT[], -- Dynamic country list
    priority_order INTEGER,
    
    -- Template content (fully dynamic)
    pdf_template_config JSONB,
    form_layout_config JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Dynamic User Journey Tracking
CREATE TABLE IF NOT EXISTS user_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID, -- Optional for logged-in users
    
    -- Dynamic form data (no hardcoded structure)
    business_profile JSONB, -- All business details as flexible JSON
    product_selection JSONB, -- Product choices and classifications
    routing_preferences JSONB, -- Shipping and routing selections
    compliance_requirements JSONB, -- Regulatory needs
    
    -- Dynamic journey tracking
    pages_completed TEXT[] DEFAULT '{}',
    current_page VARCHAR(50),
    completion_percentage DECIMAL(5,2),
    
    -- Dynamic results
    recommended_hs_codes JSONB, -- [{hs_code, confidence, reasoning}]
    calculated_savings JSONB, -- {currency, amount, breakdown}
    suggested_providers JSONB, -- Marketplace recommendations
    compliance_status JSONB, -- {usmca_eligible, requirements_met, missing_items}
    
    -- Dynamic timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Dynamic metadata
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    utm_parameters JSONB
);

-- Dynamic Country Master Data
CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    region VARCHAR(50),
    sub_region VARCHAR(50),
    
    -- Dynamic trade relationships
    usmca_member BOOLEAN DEFAULT false,
    fta_agreements JSONB, -- [{agreement_name, effective_date, key_provisions}]
    trade_preferences JSONB, -- GSP, MFN status, etc.
    
    -- Dynamic economic indicators
    economic_indicators JSONB, -- {gdp, trade_volume, currency, etc.}
    business_environment JSONB, -- {ease_of_doing_business, corruption_index, etc.}
    
    -- Dynamic logistics info
    major_ports JSONB, -- [{port_name, port_code, capabilities}]
    transportation_networks JSONB,
    customs_procedures JSONB,
    
    -- Dynamic regulatory framework
    regulatory_requirements JSONB,
    documentation_requirements JSONB,
    licensing_requirements JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Dynamic Configuration System (zero hardcoding)
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_category VARCHAR(100) NOT NULL, -- 'ui', 'business_rules', 'integrations'
    config_key VARCHAR(200) NOT NULL,
    config_value JSONB NOT NULL,
    
    -- Dynamic environment support
    environment VARCHAR(50) DEFAULT 'production', -- dev, staging, production
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Dynamic metadata
    description TEXT,
    last_modified_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(config_category, config_key, environment)
);

-- Dynamic Business Rules Engine
CREATE TABLE IF NOT EXISTS business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(200) NOT NULL,
    rule_category VARCHAR(100) NOT NULL, -- 'classification', 'compliance', 'pricing'
    
    -- Dynamic rule definition
    conditions JSONB NOT NULL, -- {field: "hs_code", operator: "starts_with", value: "84"}
    actions JSONB NOT NULL, -- {action: "set_field", field: "category", value: "machinery"}
    priority INTEGER DEFAULT 100,
    
    -- Dynamic applicability
    applicable_countries TEXT[],
    applicable_date_range JSONB, -- {start_date, end_date}
    applicable_user_types TEXT[],
    
    -- Dynamic rule metadata
    rule_logic TEXT, -- Human-readable rule description
    data_sources TEXT[], -- Where this rule came from
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Dynamic Form Field Definitions (completely flexible UI)
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- text, select, checkbox, radio, etc.
    
    -- Dynamic field configuration
    field_config JSONB NOT NULL, -- All field properties as JSON
    validation_rules JSONB, -- Dynamic validation
    conditional_logic JSONB, -- When to show/hide this field
    
    -- Dynamic options (for selects, radios, etc.)
    options_source VARCHAR(100), -- 'static', 'database_query', 'api_endpoint'
    options_query TEXT, -- SQL query or API endpoint
    static_options JSONB, -- Fallback static options
    
    -- Dynamic positioning and styling  
    display_order INTEGER,
    css_classes TEXT,
    responsive_config JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(page_name, field_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usmca_hs_codes_code ON usmca_hs_codes(hs_code);
CREATE INDEX IF NOT EXISTS idx_usmca_hs_codes_chapter ON usmca_hs_codes(chapter);
CREATE INDEX IF NOT EXISTS idx_user_submissions_session ON user_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(country_code);
CREATE INDEX IF NOT EXISTS idx_system_config_lookup ON system_config(config_category, config_key, environment);
CREATE INDEX IF NOT EXISTS idx_business_rules_category ON business_rules(rule_category, is_active);
CREATE INDEX IF NOT EXISTS idx_form_fields_page ON form_fields(page_name, is_active);

-- Add update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usmca_hs_codes_updated_at BEFORE UPDATE ON usmca_hs_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usmca_certifications_updated_at BEFORE UPDATE ON usmca_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_submissions_updated_at BEFORE UPDATE ON user_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_rules_updated_at BEFORE UPDATE ON business_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON form_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();