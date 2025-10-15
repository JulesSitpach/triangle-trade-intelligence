-- TRIANGLE INTELLIGENCE CRISIS PIVOT DATABASE SCHEMA
-- Zero Hardcoding Architecture - All Crisis Configuration Database-Driven
-- Created: December 2024

-- =============================================================================
-- 1. CRISIS CONFIGURATION TABLE
-- Stores all crisis-related parameters (tariff rates, thresholds, settings)
-- =============================================================================

CREATE TABLE crisis_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    config_type TEXT NOT NULL CHECK (config_type IN ('messaging', 'pricing', 'rates', 'features', 'validation', 'localization')),
    description TEXT,
    active BOOLEAN DEFAULT true,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_by TEXT DEFAULT 'system',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    
    -- Indexes for fast lookups
    CONSTRAINT crisis_config_key_valid CHECK (length(config_key) >= 3),
    CONSTRAINT crisis_config_value_not_empty CHECK (config_value != '{}'::jsonb)
);

-- Index for fast config lookups
CREATE INDEX idx_crisis_config_key_active ON crisis_config (config_key, active);
CREATE INDEX idx_crisis_config_type_active ON crisis_config (config_type, active);

Success. No rows returned

-- =============================================================================
-- 2. DYNAMIC SERVICE PRICING TABLE  
-- NO HARDCODED $299, $799, $2499 - All pricing configurable
-- =============================================================================

CREATE TABLE service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL CHECK (service_type IN ('platform_tier', 'professional_service', 'emergency', 'consulting', 'audit')),
    service_name TEXT NOT NULL,
    service_slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    display_name_en TEXT NOT NULL,
    display_name_es TEXT,
    description_en TEXT,
    description_es TEXT,
    pricing_model TEXT NOT NULL CHECK (pricing_model IN ('monthly', 'hourly', 'project', 'annual', 'one_time')),
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'MXN', 'CAD')),
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}', -- Usage limits, consultation hours, etc.
    market_segment TEXT DEFAULT 'global' CHECK (market_segment IN ('US', 'MX', 'CA', 'global')),
    target_audience TEXT[], -- 'small_business', 'enterprise', 'individual'
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    trial_available BOOLEAN DEFAULT false,
    trial_duration_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT service_pricing_name_not_empty CHECK (length(service_name) >= 2),
    CONSTRAINT service_pricing_display_order_valid CHECK (display_order >= 0),
    CONSTRAINT service_pricing_trial_logic CHECK (
        (trial_available = false) OR 
        (trial_available = true AND trial_duration_days > 0)
    )
);

-- Indexes for pricing lookups
CREATE INDEX idx_service_pricing_type_active ON service_pricing (service_type, active);
CREATE INDEX idx_service_pricing_segment_active ON service_pricing (market_segment, active);
CREATE INDEX idx_service_pricing_slug ON service_pricing (service_slug);


Success. No rows returned

-- =============================================================================
-- 3. CRISIS MESSAGING TABLE
-- All crisis-related text content - NO HARDCODED messages
-- =============================================================================

CREATE TABLE crisis_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_key TEXT UNIQUE NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('hero', 'cta', 'warning', 'benefit', 'disclaimer', 'success', 'error', 'info')),
    content_en TEXT NOT NULL,
    content_es TEXT,
    content_fr TEXT, -- For Canadian market
    variables JSONB DEFAULT '{}', -- Template variables like {tariff_rate}, {penalty_amount}
    context TEXT, -- Where this message appears (landing_page, dashboard, email, etc.)
    audience TEXT[], -- Target audience for this message
    priority INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    a_b_test_group TEXT, -- For A/B testing different messages
    conversion_tracked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT crisis_messages_key_valid CHECK (length(message_key) >= 3),
    CONSTRAINT crisis_messages_content_not_empty CHECK (length(content_en) >= 1),
    CONSTRAINT crisis_messages_priority_valid CHECK (priority >= 0)
);

-- Indexes for message lookups
CREATE INDEX idx_crisis_messages_key_active ON crisis_messages (message_key, active);
CREATE INDEX idx_crisis_messages_type_context ON crisis_messages (message_type, context);
CREATE INDEX idx_crisis_messages_ab_test ON crisis_messages (a_b_test_group, active);

Success. No rows returned

-- =============================================================================
-- 4. PROFESSIONAL VALIDATORS TABLE
-- Cristina's details and future validators - NO HARDCODED professional info
-- =============================================================================

CREATE TABLE professional_validators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    validator_name TEXT NOT NULL,
    license_number TEXT,
    license_type TEXT CHECK (license_type IN ('customs_broker', 'attorney', 'consultant', 'certified_professional')),
    license_country TEXT DEFAULT 'MX',
    specializations TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    experience_years INTEGER CHECK (experience_years >= 0),
    hourly_rate DECIMAL(8,2) CHECK (hourly_rate >= 0),
    currency TEXT DEFAULT 'USD',
    liability_coverage BOOLEAN DEFAULT false,
    insurance_amount DECIMAL(12,2),
    active BOOLEAN DEFAULT true,
    available_for_emergency BOOLEAN DEFAULT false,
    bio_en TEXT,
    bio_es TEXT,
    credentials JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}', -- Email, phone, etc.
    availability_schedule JSONB DEFAULT '{}', -- Working hours, timezone
    validation_approval_required BOOLEAN DEFAULT false, -- For high-value cases
    max_case_value DECIMAL(12,2), -- Maximum value they can validate
    response_time_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT professional_validators_name_not_empty CHECK (length(validator_name) >= 2),
    CONSTRAINT professional_validators_experience_valid CHECK (
        experience_years IS NULL OR experience_years BETWEEN 0 AND 60
    ),
    CONSTRAINT professional_validators_response_time_valid CHECK (
        response_time_hours > 0 AND response_time_hours <= 168
    )
);

-- Indexes for validator lookups
CREATE INDEX idx_professional_validators_active ON professional_validators (active);
CREATE INDEX idx_professional_validators_specializations ON professional_validators USING GIN (specializations);
CREATE INDEX idx_professional_validators_emergency ON professional_validators (available_for_emergency, active);

Success. No rows returned


-- =============================================================================
-- 5. CRISIS CALCULATIONS LOG TABLE
-- Track all crisis penalty calculations for analytics and improvement
-- =============================================================================

CREATE TABLE crisis_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    user_id UUID, -- If authenticated
    calculation_type TEXT CHECK (calculation_type IN ('penalty_estimate', 'savings_calculation', 'roi_analysis')),
    input_data JSONB NOT NULL, -- All input parameters
    output_data JSONB NOT NULL, -- Calculated results
    crisis_rate_used DECIMAL(5,4), -- The crisis tariff rate at time of calculation
    usmca_rate_used DECIMAL(5,4), -- The USMCA rate used
    trade_volume DECIMAL(12,2),
    hs_code TEXT,
    origin_country TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Constraints
    CONSTRAINT crisis_calculations_rates_valid CHECK (
        crisis_rate_used >= 0 AND crisis_rate_used <= 1 AND
        usmca_rate_used >= 0 AND usmca_rate_used <= 1
    ),
    CONSTRAINT crisis_calculations_volume_positive CHECK (trade_volume > 0)
);

-- Indexes for analytics
CREATE INDEX idx_crisis_calculations_date ON crisis_calculations (calculated_at);
CREATE INDEX idx_crisis_calculations_type ON crisis_calculations (calculation_type);
CREATE INDEX idx_crisis_calculations_hs_code ON crisis_calculations (hs_code);

Success. No rows returned

-- =============================================================================
-- 6. LOCALIZATION CONTENT TABLE
-- Database-driven translations for Spanish/French content
-- =============================================================================

CREATE TABLE localization_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key TEXT NOT NULL,
    locale TEXT NOT NULL CHECK (locale IN ('en', 'es', 'fr')),
    content_type TEXT CHECK (content_type IN ('ui_text', 'email_template', 'document_template', 'help_text')),
    content_value TEXT NOT NULL,
    content_context TEXT, -- Page, component, or feature where this is used
    variables JSONB DEFAULT '{}', -- Available template variables
    last_reviewed_date DATE,
    reviewed_by TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of key and locale
    UNIQUE (content_key, locale),
    
    -- Constraints
    CONSTRAINT localization_content_key_valid CHECK (length(content_key) >= 2),
    CONSTRAINT localization_content_value_not_empty CHECK (length(content_value) >= 1)
);

-- Indexes for localization lookups
CREATE INDEX idx_localization_content_key_locale ON localization_content (content_key, locale, active);
CREATE INDEX idx_localization_content_type_locale ON localization_content (content_type, locale);

Success. No rows returned

-- =============================================================================
-- 7. PROFESSIONAL VALIDATION REQUESTS TABLE
-- Track requests for Cristina's validation services
-- =============================================================================

CREATE TABLE professional_validation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT CHECK (request_type IN ('certificate_review', 'emergency_consultation', 'compliance_audit', 'supply_chain_analysis')),
    client_company TEXT,
    client_email TEXT,
    client_phone TEXT,
    urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'emergency')),
    trade_volume DECIMAL(12,2),
    hs_codes TEXT[], -- Products involved
    case_description TEXT,
    requested_validator_id UUID REFERENCES professional_validators(id),
    assigned_validator_id UUID REFERENCES professional_validators(id),
    estimated_hours DECIMAL(4,2),
    quoted_price DECIMAL(8,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled')),
    priority_score INTEGER DEFAULT 0, -- For queue management
    internal_notes TEXT,
    client_notes TEXT,
    deliverables JSONB DEFAULT '{}',
    deadline_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT professional_validation_requests_volume_positive CHECK (
        trade_volume IS NULL OR trade_volume > 0
    ),
    CONSTRAINT professional_validation_requests_hours_valid CHECK (
        estimated_hours IS NULL OR (estimated_hours > 0 AND estimated_hours <= 100)
    ),
    CONSTRAINT professional_validation_requests_price_valid CHECK (
        quoted_price IS NULL OR quoted_price >= 0
    )
);

-- Indexes for validation request management
CREATE INDEX idx_professional_validation_requests_status ON professional_validation_requests (status);
CREATE INDEX idx_professional_validation_requests_urgency ON professional_validation_requests (urgency_level, created_at);
CREATE INDEX idx_professional_validation_requests_validator ON professional_validation_requests (assigned_validator_id);

Success. No rows returned

-- =============================================================================
-- INITIAL CONFIGURATION DATA INSERTS
-- =============================================================================

-- Crisis Configuration Data
INSERT INTO crisis_config (config_key, config_value, config_type, description) VALUES 

-- Crisis tariff rates (easily updatable when Trump changes policies)
('trump_tariff_rate', '{"rate": 0.25, "source": "Trump_2024_Campaign", "last_updated": "2024-12-01", "applies_to": "all_imports"}', 'rates', 'Current Trump administration threatened tariff rate'),
('biden_current_rate', '{"rate": 0.072, "source": "Biden_Administration_Average", "last_updated": "2024-12-01"}', 'rates', 'Current average tariff rate under Biden'),

-- Professional validation thresholds
('validation_thresholds', '{"auto_approve_under": 50000, "professional_review_over": 50000, "expert_required_over": 500000}', 'validation', 'Dollar thresholds requiring different validation levels'),
('emergency_response_sla', '{"standard_hours": 24, "priority_hours": 4, "emergency_hours": 1}', 'features', 'Service level agreements for response times'),

-- ROI calculation parameters
('roi_calculation_params', '{"annual_months": 12, "risk_multiplier": 1.2, "conservative_estimate": 0.8}', 'rates', 'Parameters for ROI calculations'),

-- Crisis messaging variables
('crisis_messaging_vars', '{"penalty_emphasis": "business-ending", "urgency_level": "immediate", "professional_backing": "licensed_customs_broker"}', 'messaging', 'Global variables for crisis messaging');

-- Service Pricing Data (NO HARDCODED pricing)
INSERT INTO service_pricing (service_type, service_name, service_slug, display_name_en, display_name_es, description_en, pricing_model, base_price, features, market_segment, display_order) VALUES 

-- Platform Tiers
('platform_tier', 'survival_plan', 'survival-plan', 'Crisis Survival Plan', 'Plan de Supervivencia de Crisis', 'Essential USMCA compliance with crisis-focused features', 'monthly', 299.00, '{"crisis_calculator": true, "basic_validation": true, "standard_certificates": true, "email_support": true}', 'global', 1),

('platform_tier', 'protection_plan', 'protection-plan', 'Professional Protection Plan', 'Plan de Protección Profesional', 'Enhanced protection with monthly professional consultations', 'monthly', 799.00, '{"everything_in_survival": true, "monthly_consultation": true, "priority_response": true, "complex_case_support": true, "phone_support": true}', 'global', 2),

('platform_tier', 'enterprise_shield', 'enterprise-shield', 'Enterprise Crisis Shield', 'Escudo Empresarial de Crisis', 'Complete enterprise protection with dedicated account management', 'monthly', 2499.00, '{"everything_in_protection": true, "dedicated_manager": true, "24_7_support": true, "custom_compliance": true, "cbp_audit_prep": true, "unlimited_consultations": true}', 'global', 3),

-- Emergency Services
('emergency', 'crisis_intervention', 'crisis-intervention', 'Emergency Crisis Intervention', 'Intervención de Crisis de Emergencia', 'Immediate professional consultation for urgent compliance issues', 'hourly', 500.00, '{"immediate_response": true, "licensed_broker": true, "cbp_preparation": true, "emergency_documentation": true}', 'global', 1),

-- Professional Services
('professional_service', 'supply_chain_audit', 'supply-chain-audit', 'Supply Chain Crisis Audit', 'Auditoría de Crisis de Cadena de Suministro', 'Complete supply chain assessment and USMCA optimization strategy', 'project', 25000.00, '{"full_assessment": true, "optimization_plan": true, "implementation_support": true, "quarterly_reviews": true}', 'global', 1),

('professional_service', 'mexico_sourcing_strategy', 'mexico-sourcing-strategy', 'Mexico Sourcing Strategy', 'Estrategia de Abastecimiento de México', 'Strategic guidance for Mexico sourcing and supplier relationships', 'project', 15000.00, '{"supplier_identification": true, "qualification_analysis": true, "relationship_management": true, "ongoing_support": true}', 'global', 2);

-- Crisis Messages (NO HARDCODED messaging)
INSERT INTO crisis_messages (message_key, message_type, content_en, content_es, variables, context, priority) VALUES 

-- Hero messages
('hero_title_main', 'hero', 'Avoid {trump_tariff_rate}% Trump Tariff Penalties with Professional USMCA Compliance', 'Evita las Penalidades Arancelarias de Trump del {trump_tariff_rate}% con Cumplimiento USMCA Profesional', '{"trump_tariff_rate": "crisis_config.trump_tariff_rate.rate"}', 'landing_page', 100),

('hero_subtitle', 'hero', 'While your competitors face {trump_tariff_rate}% penalties, you pay 0% with trade compliance expert validation', 'Mientras tus competidores enfrentan penalidades del {trump_tariff_rate}%, tú pagas 0% con validación de corredor aduanal licenciado', '{"trump_tariff_rate": "crisis_config.trump_tariff_rate.rate"}', 'landing_page', 90),

-- Warning messages  
('penalty_warning', 'warning', 'One documentation error = ${penalty_amount} penalty on single shipment', 'Un error de documentación = penalidad de ${penalty_amount} en un solo envío', '{"penalty_amount": "calculated_from_trade_volume"}', 'calculator', 100),

('business_survival', 'warning', 'Don''t let {trump_tariff_rate}% tariffs destroy your business - Get protected today', 'No dejes que los aranceles del {trump_tariff_rate}% destruyan tu negocio - Protégete hoy', '{"trump_tariff_rate": "crisis_config.trump_tariff_rate.rate"}', 'cta_sections', 80),

-- Call-to-action messages
('cta_emergency', 'cta', 'Get Emergency Consultation - ${emergency_rate}/hour', 'Obtén Consulta de Emergencia - ${emergency_rate}/hora', '{"emergency_rate": "service_pricing.crisis_intervention.base_price"}', 'emergency_section', 100),

('cta_professional', 'cta', 'Start Professional Protection - ${protection_price}/month', 'Comienza Protección Profesional - ${protection_price}/mes', '{"protection_price": "service_pricing.protection_plan.base_price"}', 'pricing_section', 90),

-- Benefits
('benefit_professional', 'benefit', 'Validated by {validator_name}, Trade Compliance Expert #{license_number}', 'Validado por {validator_name}, Experta en Cumplimiento Comercial Certificada #{license_number}', '{"validator_name": "professional_validators.primary.validator_name", "license_number": "professional_validators.primary.license_number"}', 'validation_section', 100),

('benefit_experience', 'benefit', '{experience_years} years of Mexico-US trade expertise backing every recommendation', '{experience_years} años de experiencia en comercio México-US respaldando cada recomendación', '{"experience_years": "professional_validators.primary.experience_years"}', 'credibility_section', 80);

-- Professional Validators (NO HARDCODED Cristina details)
INSERT INTO professional_validators (validator_name, license_number, license_type, license_country, specializations, languages, experience_years, hourly_rate, liability_coverage, active, available_for_emergency, bio_en, bio_es) VALUES 

('Cristina Escalante', '4601913', 'certified_professional', 'MX', ARRAY['USMCA', 'Mexico_Trade', 'Supply_Chain', 'CBP_Compliance', 'Automotive', 'Electronics'], ARRAY['Spanish', 'English'], 17, 500.00, true, true, true, 
'Trade Compliance Expert with 17 years of experience in Mexico-US trade. Former senior roles at Motorola, Arris, and Tekmovil. Specialized in USMCA compliance, supply chain optimization, and CBP audit preparation.', 
'Experta en Cumplimiento Comercial Certificada con 17 años de experiencia en comercio México-EE.UU. Roles senior anteriores en Motorola, Arris y Tekmovil. Especializada en cumplimiento USMCA, optimización de cadena de suministro y preparación de auditorías CBP.');

-- Localization Content (Key UI elements)
INSERT INTO localization_content (content_key, locale, content_type, content_value, content_context) VALUES 

-- Navigation
('nav_home', 'en', 'ui_text', 'Home', 'main_navigation'),
('nav_home', 'es', 'ui_text', 'Inicio', 'main_navigation'),
('nav_calculator', 'en', 'ui_text', 'Crisis Calculator', 'main_navigation'),
('nav_calculator', 'es', 'ui_text', 'Calculadora de Crisis', 'main_navigation'),
('nav_professional', 'en', 'ui_text', 'Professional Services', 'main_navigation'),
('nav_professional', 'es', 'ui_text', 'Servicios Profesionales', 'main_navigation'),

-- Form labels
('form_company_name', 'en', 'ui_text', 'Company Name', 'forms'),
('form_company_name', 'es', 'ui_text', 'Nombre de la Empresa', 'forms'),
('form_trade_volume', 'en', 'ui_text', 'Annual Trade Volume', 'forms'),
('form_trade_volume', 'es', 'ui_text', 'Volumen Comercial Anual', 'forms'),
('form_product_description', 'en', 'ui_text', 'Product Description', 'forms'),
('form_product_description', 'es', 'ui_text', 'Descripción del Producto', 'forms'),

-- Buttons
('btn_calculate', 'en', 'ui_text', 'Calculate Crisis Impact', 'buttons'),
('btn_calculate', 'es', 'ui_text', 'Calcular Impacto de Crisis', 'buttons'),
('btn_get_started', 'en', 'ui_text', 'Get Protected Now', 'buttons'),
('btn_get_started', 'es', 'ui_text', 'Protégete Ahora', 'buttons'),
('btn_emergency', 'en', 'ui_text', 'Emergency Consultation', 'buttons'),
('btn_emergency', 'es', 'ui_text', 'Consulta de Emergencia', 'buttons');

Success. No rows returned

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crisis_config_updated_at BEFORE UPDATE ON crisis_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_pricing_updated_at BEFORE UPDATE ON service_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crisis_messages_updated_at BEFORE UPDATE ON crisis_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_validators_updated_at BEFORE UPDATE ON professional_validators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_localization_content_updated_at BEFORE UPDATE ON localization_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_professional_validation_requests_updated_at BEFORE UPDATE ON professional_validation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

Success. No rows returned

-- =============================================================================
-- VIEWS FOR EASY ACCESS
-- =============================================================================

-- Active crisis configuration view
CREATE VIEW active_crisis_config AS
SELECT config_key, config_value, config_type, description, effective_date
FROM crisis_config 
WHERE active = true 
  AND (effective_date <= NOW())
  AND (expiry_date IS NULL OR expiry_date > NOW())
ORDER BY config_key;

-- Current pricing view (multi-currency support)
CREATE VIEW current_pricing AS
SELECT 
    service_type,
    service_slug,
    display_name_en,
    display_name_es,
    pricing_model,
    base_price,
    currency,
    features,
    market_segment,
    display_order
FROM service_pricing 
WHERE active = true 
ORDER BY service_type, display_order;

-- Active professional validators view
CREATE VIEW active_validators AS
SELECT 
    id,
    validator_name,
    license_number,
    specializations,
    languages,
    experience_years,
    hourly_rate,
    available_for_emergency,
    bio_en,
    bio_es
FROM professional_validators 
WHERE active = true;

Success. No rows returned


-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE crisis_config IS 'Configuration table for all crisis-related parameters - eliminates hardcoded values';
COMMENT ON TABLE service_pricing IS 'Dynamic pricing table - no hardcoded $299/$799/$2499 pricing';  
COMMENT ON TABLE crisis_messages IS 'All crisis messaging with template variables - no hardcoded text';
COMMENT ON TABLE professional_validators IS 'Professional validator information - no hardcoded Cristina details';
COMMENT ON TABLE crisis_calculations IS 'Log of all crisis calculations for analytics and improvement';
COMMENT ON TABLE localization_content IS 'Database-driven translations for Spanish/French localization';
COMMENT ON TABLE professional_validation_requests IS 'Professional validation service requests and tracking';

Success. No rows returned

-- =============================================================================
-- END OF CRISIS PIVOT SCHEMA
-- =============================================================================