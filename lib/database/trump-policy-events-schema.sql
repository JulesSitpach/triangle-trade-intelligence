-- Trump Policy Events Database Schema
-- Captures policy intelligence that drives strategic sourcing recommendations
-- Integrates with Triangle Intelligence crisis response and Mexico routing positioning

-- Core Trump Policy Events Table
CREATE TABLE IF NOT EXISTS trump_policy_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Identification
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'tariff', 'trade_agreement', 'supplier_restriction', 'border_policy', 'sanctions'
    announcement_medium VARCHAR(100), -- 'truth_social', 'press_conference', 'executive_order', 'tweet', 'rally'
    source_url TEXT,
    
    -- Policy Content
    policy_title VARCHAR(500) NOT NULL,
    policy_description TEXT,
    policy_details JSONB, -- Structured policy specifics
    
    -- Geographic and Industry Impact
    affected_countries VARCHAR(255)[], -- ['China', 'Mexico', 'Canada']
    affected_industries VARCHAR(255)[], -- ['automotive', 'electronics', 'textiles']
    affected_hs_codes VARCHAR(20)[], -- Specific product codes impacted
    
    -- Business Impact Assessment
    impact_severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    implementation_timeline VARCHAR(100), -- 'immediate', '30_days', '90_days', 'next_term'
    implementation_probability DECIMAL(3,2), -- 0.00 to 1.00 confidence score
    
    -- Market Intelligence
    market_reaction_score INTEGER, -- -10 to +10 market sentiment
    stock_impact_sectors VARCHAR(255)[], -- Affected market sectors
    commodity_price_impact JSONB, -- Price movement predictions
    
    -- Triangle Intelligence Business Logic
    china_supplier_risk_level VARCHAR(20), -- 'extreme', 'high', 'medium', 'low'
    mexico_routing_opportunity BOOLEAN DEFAULT false,
    canada_alternative_potential BOOLEAN DEFAULT false,
    urgent_customer_notification BOOLEAN DEFAULT false,
    
    -- Customer Portfolio Matching
    affected_customer_segments VARCHAR(255)[], -- Customer types impacted
    recommended_actions JSONB, -- Structured action items
    mexico_suppliers_recommended INTEGER DEFAULT 0,
    
    -- Processing Status
    alert_generated BOOLEAN DEFAULT false,
    customers_notified INTEGER DEFAULT 0,
    business_opportunities_created INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    analyst_notes TEXT
);

-- Customer Policy Impact Tracking
CREATE TABLE IF NOT EXISTS customer_policy_impacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    policy_event_id UUID REFERENCES trump_policy_events(id),
    customer_id UUID, -- References user_profiles or customer table
    
    -- Impact Assessment
    customer_business_type VARCHAR(100), -- 'automotive', 'electronics', 'fashion'
    affected_products JSONB, -- Customer's affected product lines
    estimated_cost_impact DECIMAL(15,2), -- Dollar impact estimate
    supply_chain_disruption_score INTEGER, -- 1-10 disruption severity
    
    -- Triangle Intelligence Response
    mexico_routing_recommended BOOLEAN DEFAULT false,
    supplier_introductions_needed INTEGER DEFAULT 0,
    consultation_scheduled BOOLEAN DEFAULT false,
    
    -- Customer Response Tracking
    customer_alerted_at TIMESTAMP WITH TIME ZONE,
    customer_response VARCHAR(50), -- 'interested', 'not_interested', 'need_info'
    meeting_scheduled BOOLEAN DEFAULT false,
    deal_closed BOOLEAN DEFAULT false,
    deal_value DECIMAL(15,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy Alert Templates
CREATE TABLE IF NOT EXISTS trump_policy_alert_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template Configuration
    policy_type VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    customer_segment VARCHAR(100),
    
    -- Alert Content
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    call_to_action TEXT,
    
    -- Triangle Intelligence Positioning
    crisis_response_messaging TEXT,
    mexico_routing_benefits TEXT,
    competitive_advantage_points JSONB,
    
    -- Urgency Settings
    send_immediately BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT true,
    escalation_criteria JSONB,
    
    -- Effectiveness Tracking
    open_rate DECIMAL(4,2),
    click_rate DECIMAL(4,2),
    response_rate DECIMAL(4,2),
    conversion_rate DECIMAL(4,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Policy Intelligence Sources
CREATE TABLE IF NOT EXISTS trump_policy_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source Configuration
    source_name VARCHAR(200) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'social_media', 'news_feed', 'government_api', 'rally_transcript'
    source_url TEXT,
    api_endpoint TEXT,
    
    -- Monitoring Settings
    check_frequency_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    priority_level VARCHAR(20) DEFAULT 'medium',
    
    -- Content Processing
    keywords_track VARCHAR(255)[],
    keywords_exclude VARCHAR(255)[],
    sentiment_analysis_enabled BOOLEAN DEFAULT true,
    
    -- Source Reliability
    reliability_score DECIMAL(3,2), -- 0.00 to 1.00
    false_positive_rate DECIMAL(3,2),
    average_lead_time_hours INTEGER, -- Hours ahead of official announcements
    
    -- Performance Metrics
    total_events_detected INTEGER DEFAULT 0,
    accurate_predictions INTEGER DEFAULT 0,
    last_successful_check TIMESTAMP WITH TIME ZONE,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Opportunity Tracking from Policy Events
CREATE TABLE IF NOT EXISTS policy_business_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    policy_event_id UUID REFERENCES trump_policy_events(id),
    customer_id UUID,
    
    -- Opportunity Details
    opportunity_type VARCHAR(100), -- 'mexico_routing', 'supplier_introduction', 'consultation', 'compliance_review'
    opportunity_description TEXT,
    estimated_value DECIMAL(15,2),
    probability_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Triangle Intelligence Value Proposition
    china_risk_mitigation_value DECIMAL(15,2),
    mexico_supplier_advantage TEXT,
    timeline_advantage TEXT,
    exclusive_network_access BOOLEAN DEFAULT false,
    
    -- Sales Pipeline
    status VARCHAR(50) DEFAULT 'identified', -- 'identified', 'contacted', 'qualified', 'proposal', 'closed'
    contact_attempts INTEGER DEFAULT 0,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_follow_up_at TIMESTAMP WITH TIME ZONE,
    
    -- Outcome Tracking
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_value DECIMAL(15,2),
    referral_generated BOOLEAN DEFAULT false,
    customer_satisfaction_score INTEGER, -- 1-10
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_trump_policy_events_date ON trump_policy_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_trump_policy_events_type ON trump_policy_events(event_type);
CREATE INDEX IF NOT EXISTS idx_trump_policy_events_countries ON trump_policy_events USING GIN(affected_countries);
CREATE INDEX IF NOT EXISTS idx_trump_policy_events_industries ON trump_policy_events USING GIN(affected_industries);
CREATE INDEX IF NOT EXISTS idx_trump_policy_events_severity ON trump_policy_events(impact_severity);
CREATE INDEX IF NOT EXISTS idx_trump_policy_events_china_risk ON trump_policy_events(china_supplier_risk_level);
CREATE INDEX IF NOT EXISTS idx_trump_policy_events_mexico_opportunity ON trump_policy_events(mexico_routing_opportunity);

CREATE INDEX IF NOT EXISTS idx_customer_policy_impacts_customer ON customer_policy_impacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_policy_impacts_policy ON customer_policy_impacts(policy_event_id);
CREATE INDEX IF NOT EXISTS idx_customer_policy_impacts_response ON customer_policy_impacts(customer_response);

CREATE INDEX IF NOT EXISTS idx_policy_opportunities_status ON policy_business_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_policy_opportunities_value ON policy_business_opportunities(estimated_value DESC);
CREATE INDEX IF NOT EXISTS idx_policy_opportunities_customer ON policy_business_opportunities(customer_id);

-- Sample Policy Event Data for Testing
INSERT INTO trump_policy_events (
    event_date,
    event_type,
    announcement_medium,
    policy_title,
    policy_description,
    affected_countries,
    affected_industries,
    affected_hs_codes,
    impact_severity,
    implementation_timeline,
    implementation_probability,
    china_supplier_risk_level,
    mexico_routing_opportunity,
    urgent_customer_notification,
    affected_customer_segments,
    recommended_actions
) VALUES 
(
    NOW() - INTERVAL '2 hours',
    'tariff',
    'truth_social',
    'Additional 25% Tariffs on Chinese Electronics',
    'New tariffs announced targeting Chinese-manufactured electronics and automotive components, effective in 30 days',
    ARRAY['China'],
    ARRAY['electronics', 'automotive'],
    ARRAY['8471', '8473', '8544', '8537'],
    'critical',
    '30_days',
    0.85,
    'extreme',
    true,
    true,
    ARRAY['electronics_manufacturers', 'automotive_suppliers'],
    '{"immediate_actions": ["Review China supplier exposure", "Activate Mexico supplier network"], "mexico_routing": "Available for 95% of affected components", "timeline": "Transition possible within 45 days"}'::jsonb
),
(
    NOW() - INTERVAL '1 day',
    'supplier_restriction',
    'executive_order',
    'China Semiconductor Supply Chain Restrictions',
    'Executive order restricting certain Chinese semiconductor suppliers from US market',
    ARRAY['China'],
    ARRAY['electronics', 'telecommunications'],
    ARRAY['8541', '8542'],
    'high',
    'immediate',
    0.95,
    'extreme',
    true,
    true,
    ARRAY['electronics_manufacturers', 'tech_companies'],
    '{"immediate_actions": ["Audit semiconductor supply chain", "Identify Mexico assembly alternatives"], "mexico_routing": "Established Mexico semiconductor assembly capabilities", "timeline": "Emergency transition protocols available"}'::jsonb
),
(
    NOW() - INTERVAL '6 hours',
    'trade_agreement',
    'press_conference',
    'Enhanced USMCA Enforcement Measures',
    'Stricter enforcement of USMCA origin requirements with expedited Mexico routing benefits',
    ARRAY['Mexico', 'Canada'],
    ARRAY['automotive', 'textiles', 'manufacturing'],
    ARRAY['8708', '6204', '6203'],
    'medium',
    '90_days',
    0.75,
    'low',
    true,
    false,
    ARRAY['manufacturers', 'automotive_suppliers'],
    '{"immediate_actions": ["Review USMCA qualification status", "Optimize Mexico content"], "mexico_routing": "Enhanced qualification pathways available", "timeline": "Mexico routing qualification within 60 days"}'::jsonb
);

-- Sample Alert Templates
INSERT INTO trump_policy_alert_templates (
    policy_type,
    severity_level,
    customer_segment,
    subject_template,
    body_template,
    crisis_response_messaging,
    mexico_routing_benefits,
    competitive_advantage_points,
    send_immediately,
    follow_up_required
) VALUES 
(
    'tariff',
    'critical',
    'electronics_manufacturers',
    'URGENT: New {policy_title} Affects Your Supply Chain',
    'A new trade policy announcement directly impacts your product portfolio. Our analysis shows {estimated_cost_impact} potential cost exposure. Triangle Intelligence has identified immediate Mexico routing alternatives that can mitigate this risk.',
    'Triangle Intelligence crisis response team has been activated. We are monitoring this situation 24/7 and have immediate solutions available.',
    'Our exclusive Mexico supplier network offers: (1) Established electronics manufacturing capabilities, (2) USMCA qualification pathways, (3) 30-45 day transition timelines, (4) Cost parity or savings compared to current suppliers.',
    '["24-48 hour response advantage over competitors", "Exclusive Mexico supplier access", "Crisis-tested transition protocols", "USMCA qualification expertise"]'::jsonb,
    true,
    true
);

-- Comments for Implementation Guidance
COMMENT ON TABLE trump_policy_events IS 'Core table tracking Trump policy announcements that affect customer supply chains. Focuses on actionable policy intelligence rather than general political commentary.';

COMMENT ON COLUMN trump_policy_events.china_supplier_risk_level IS 'Assessment of risk level for China-based suppliers based on this policy announcement. Drives urgency of Mexico routing recommendations.';

COMMENT ON COLUMN trump_policy_events.mexico_routing_opportunity IS 'Boolean flag indicating whether this policy creates an opportunity for Triangle Intelligence Mexico routing services.';

COMMENT ON TABLE customer_policy_impacts IS 'Tracks how specific policy events affect individual customers and their supply chains. Enables targeted outreach and personalized recommendations.';

COMMENT ON TABLE trump_policy_alert_templates IS 'Pre-configured alert templates that position Triangle Intelligence as the crisis response solution while providing actionable policy intelligence.';

COMMENT ON TABLE policy_business_opportunities IS 'Tracks business opportunities generated from policy events. Measures ROI of policy monitoring and crisis response positioning.';