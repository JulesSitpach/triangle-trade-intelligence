-- Priority 1: Specialist Tables for "Coming Soon" Revenue Features
-- Enables specialist referral monetization with CA/MX expertise advantage

-- Specialist Waiting List (for "Coming Soon" buttons)
CREATE TABLE IF NOT EXISTS specialist_waiting_list (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    business_type VARCHAR(100),
    stage_requested INTEGER NOT NULL,
    specialist_type VARCHAR(100) NOT NULL, -- 'trade_setup', 'hs_code', 'logistics', etc.
    urgency_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- User context for better matching
    import_volume VARCHAR(50),
    products_count INTEGER,
    preferred_route VARCHAR(50), -- 'china_mexico_usa', 'china_canada_usa'
    
    -- Tracking
    signed_up_at TIMESTAMP DEFAULT NOW(),
    notified_when_ready BOOLEAN DEFAULT false,
    estimated_savings INTEGER, -- Annual savings potential
    
    -- Metadata
    source_stage_data JSONB, -- Stage completion data for context
    notes TEXT,
    
    UNIQUE(user_email, stage_requested, specialist_type)
);

-- Canadian & Mexican Specialists (Competitive Advantage)
CREATE TABLE IF NOT EXISTS ca_mx_specialists (
    id SERIAL PRIMARY KEY,
    specialist_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Geographic Coverage
    country VARCHAR(2) NOT NULL, -- 'CA' or 'MX'
    region VARCHAR(100), -- 'Ontario', 'Quebec', 'Jalisco', etc.
    primary_ports TEXT[], -- Array of ports they cover
    
    -- Expertise
    specialist_type VARCHAR(100) NOT NULL, -- 'customs_broker', 'trade_attorney', etc.
    industries TEXT[], -- Array of industries ['Electronics', 'Textiles']
    certifications TEXT[], -- Professional certifications
    years_experience INTEGER,
    
    -- Business Model
    consultation_fee INTEGER, -- USD per hour
    referral_fee INTEGER, -- What we earn per referral
    minimum_project_size INTEGER, -- Minimum import volume they handle
    
    -- Performance Tracking
    total_referrals INTEGER DEFAULT 0,
    successful_connections INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2), -- Out of 5.0
    last_referral_date TIMESTAMP,
    
    -- Capacity Management
    current_capacity INTEGER DEFAULT 100, -- % capacity remaining
    response_time_hours INTEGER DEFAULT 24,
    preferred_contact_method VARCHAR(50) DEFAULT 'email',
    
    -- Language & Cultural Advantages
    languages TEXT[], -- ['English', 'Spanish', 'French']
    cultural_expertise TEXT[], -- ['USMCA', 'Mexican_markets', 'Canadian_regulations']
    
    -- Metadata
    bio TEXT,
    specialties TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Performance boost fields
    triangle_routing_expert BOOLEAN DEFAULT false,
    usmca_certified BOOLEAN DEFAULT false,
    family_business_specialist BOOLEAN DEFAULT false -- Our unique advantage
);

-- Success Strategy Templates (Proven Playbooks)
CREATE TABLE IF NOT EXISTS success_strategy_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    import_volume_range VARCHAR(50), -- '$1M-$5M', 'Over $25M', etc.
    
    -- Strategy Details
    primary_route VARCHAR(100), -- 'china_mexico_usa'
    implementation_phases JSONB, -- Step-by-step implementation
    timeline_weeks INTEGER,
    complexity_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
    
    -- Success Metrics
    average_savings_amount INTEGER,
    average_savings_percentage DECIMAL(5,2),
    implementation_success_rate DECIMAL(5,2), -- % of companies that succeeded
    payback_period_months INTEGER,
    
    -- Requirements
    minimum_import_volume INTEGER,
    required_product_types TEXT[],
    regulatory_requirements TEXT[],
    specialist_support_needed TEXT[], -- Which specialists typically needed
    
    -- Template Content
    strategy_overview TEXT,
    key_benefits TEXT[],
    common_challenges TEXT[],
    risk_mitigation_steps TEXT[],
    
    -- Pattern Data
    based_on_companies INTEGER, -- How many successful companies this template represents
    last_updated TIMESTAMP DEFAULT NOW(),
    confidence_score INTEGER DEFAULT 85, -- How confident we are in this template
    
    -- Metadata
    created_by VARCHAR(100), -- 'system', 'marcus_ai', 'specialist_input'
    tags TEXT[],
    industry_specific_notes TEXT,
    
    -- Specialist Matching
    recommended_specialists INTEGER[], -- ca_mx_specialists.id references
    typical_specialist_fees INTEGER -- Total specialist costs for this template
);

-- Success Pattern Library (What Actually Worked)
CREATE TABLE IF NOT EXISTS success_pattern_library (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'cost_reduction', 'time_optimization', 'risk_mitigation'
    
    -- Business Context
    business_type VARCHAR(100),
    import_volume_range VARCHAR(50),
    product_categories TEXT[],
    
    -- Pattern Description
    situation_description TEXT NOT NULL, -- What the company faced
    solution_implemented TEXT NOT NULL, -- What they actually did
    outcome_achieved TEXT NOT NULL, -- What happened
    
    -- Quantified Results
    savings_amount INTEGER,
    savings_percentage DECIMAL(5,2),
    implementation_time_weeks INTEGER,
    roi_percentage DECIMAL(5,2),
    
    -- Pattern Metadata
    confidence_level INTEGER DEFAULT 85, -- How reliable this pattern is
    replication_difficulty VARCHAR(20), -- 'easy', 'medium', 'hard'
    applies_to_volume_ranges TEXT[], -- Which import volumes this works for
    geographic_constraints TEXT[], -- Any location-specific requirements
    
    -- Learning Data
    extracted_from_session_id INTEGER, -- Which user session this came from
    similar_pattern_count INTEGER DEFAULT 1, -- How many times we've seen this
    last_observed TIMESTAMP DEFAULT NOW(),
    
    -- Actionability
    actionable_steps TEXT[], -- Specific steps others can take
    warning_signs TEXT[], -- What to watch out for
    specialist_support_recommended BOOLEAN DEFAULT false,
    estimated_implementation_cost INTEGER,
    
    -- Cross-references
    related_strategy_template_id INTEGER REFERENCES success_strategy_templates(id),
    specialist_types_needed TEXT[], -- Which types of specialists help with this
    
    -- Quality Control
    verified_by VARCHAR(100), -- 'system', 'specialist', 'manual_review'
    verification_date TIMESTAMP,
    pattern_quality_score INTEGER DEFAULT 75
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_specialist_waiting_list_stage ON specialist_waiting_list(stage_requested, specialist_type);
CREATE INDEX IF NOT EXISTS idx_ca_mx_specialists_type_country ON ca_mx_specialists(specialist_type, country);
CREATE INDEX IF NOT EXISTS idx_ca_mx_specialists_active_capacity ON ca_mx_specialists(is_active, current_capacity) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_success_templates_business_volume ON success_strategy_templates(business_type, import_volume_range);
CREATE INDEX IF NOT EXISTS idx_success_patterns_type_business ON success_pattern_library(pattern_type, business_type);

-- Comments
COMMENT ON TABLE specialist_waiting_list IS 'Users waiting for specialist connections - powers "Coming Soon" features';
COMMENT ON TABLE ca_mx_specialists IS 'Canadian/Mexican specialist network - competitive advantage';
COMMENT ON TABLE success_strategy_templates IS 'Proven implementation playbooks for different business types';
COMMENT ON TABLE success_pattern_library IS 'Extracted success patterns from real user journeys';