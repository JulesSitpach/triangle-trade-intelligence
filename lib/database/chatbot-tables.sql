-- Triangle Intelligence Team Chatbot Database Tables
-- Stores conversations, findings, and agent interactions

-- Main conversations table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    agent_name VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2),
    context_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    INDEX idx_chatbot_sender (sender),
    INDEX idx_chatbot_agent (agent_name),
    INDEX idx_chatbot_created (created_at DESC),
    INDEX idx_chatbot_context USING GIN (context_data)
);

-- Chatbot findings for dashboard integration
CREATE TABLE IF NOT EXISTS chatbot_findings (
    id SERIAL PRIMARY KEY,
    dashboard VARCHAR(50) NOT NULL,
    findings JSONB NOT NULL,
    agent_name VARCHAR(50),
    confidence DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'pending_review',
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_findings_dashboard (dashboard),
    INDEX idx_findings_status (status),
    INDEX idx_findings_created (created_at DESC),
    INDEX idx_findings_data USING GIN (findings)
);

-- Agent collaboration tracking
CREATE TABLE IF NOT EXISTS agent_collaborations (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chatbot_conversations(id),
    primary_agent VARCHAR(50) NOT NULL,
    collaborating_agent VARCHAR(50) NOT NULL,
    collaboration_type VARCHAR(50),
    contribution JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_collab_conversation (conversation_id),
    INDEX idx_collab_agents (primary_agent, collaborating_agent)
);

-- API usage tracking for external services
CREATE TABLE IF NOT EXISTS chatbot_api_usage (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chatbot_conversations(id),
    api_service VARCHAR(50) NOT NULL, -- 'sam_gov', 'comtrade', 'census', 'openrouter'
    endpoint VARCHAR(200),
    request_data JSONB,
    response_status INTEGER,
    response_data JSONB,
    processing_time_ms INTEGER,
    cost_estimate DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_api_service (api_service),
    INDEX idx_api_status (response_status),
    INDEX idx_api_created (created_at DESC)
);

-- Team member preferences and settings
CREATE TABLE IF NOT EXISTS chatbot_user_preferences (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) UNIQUE NOT NULL,
    preferred_agents TEXT[], -- Array of preferred agent types
    notification_settings JSONB DEFAULT '{}',
    dashboard_integrations TEXT[], -- Which dashboards to auto-update
    api_permissions JSONB DEFAULT '{}', -- Which APIs user can access
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_user_prefs_name (user_name),
    INDEX idx_user_prefs_settings USING GIN (notification_settings)
);

-- Insert default user preferences for team members
INSERT INTO chatbot_user_preferences (user_name, preferred_agents, dashboard_integrations, api_permissions) VALUES
('jorge',
 ARRAY['market', 'research'],
 ARRAY['client-portfolio', 'collaboration-workspace'],
 '{"sam_gov": true, "comtrade": true, "census": true, "openrouter": true}'
),
('cristina',
 ARRAY['compliance', 'market'],
 ARRAY['broker-dashboard', 'collaboration-workspace'],
 '{"sam_gov": true, "comtrade": true, "census": false, "openrouter": false}'
),
('admin',
 ARRAY['coordination', 'research'],
 ARRAY['dev-dashboard', 'client-portfolio'],
 '{"sam_gov": true, "comtrade": true, "census": true, "openrouter": true}'
)
ON CONFLICT (user_name) DO NOTHING;

-- Sample conversation data for testing
INSERT INTO chatbot_conversations (sender, message, response, agent_name, confidence, context_data) VALUES
('jorge', 'Check SAM registration for ABC Manufacturing Corp', 'I found ABC Manufacturing Corp is actively registered in SAM.gov with DUNS 123456789. Their registration expires March 2025 and they are eligible for government contracts.', 'ComplianceBot', 0.95, '{"dashboard": "broker", "companies": ["ABC Manufacturing Corp"]}'),
('cristina', 'Show trade volume for HS 8471 from Mexico', 'Based on UN Comtrade data, HS 8471 (computers/processing units) from Mexico shows $2.3B in annual trade volume to the US market. This represents a 12% increase from previous year.', 'MarketBot', 0.92, '{"dashboard": "collaboration", "hs_codes": ["8471"], "countries": ["Mexico"]}'),
('admin', 'Analyze the impact of new USMCA regulations on automotive supply chain', 'The new USMCA automotive content requirements present both challenges and opportunities. Key findings: 1) Increased Mexico sourcing benefits 2) Supply chain restructuring needed 3) Compliance verification critical for cost savings.', 'ResearchBot', 0.88, '{"dashboard": "dev", "topic": "usmca_automotive"}}')
ON CONFLICT DO NOTHING;

-- Sample findings for dashboard integration
INSERT INTO chatbot_findings (dashboard, findings, agent_name, confidence, status) VALUES
('broker-dashboard',
 '{"verified_suppliers": 3, "compliance_issues": 1, "recommendation": "ABC Corp needs SAM registration renewal", "priority": "medium"}',
 'ComplianceBot', 0.94, 'pending_review'
),
('collaboration-workspace',
 '{"trade_opportunities": 5, "mexico_volume": "$2.3B", "growth_rate": "12%", "recommendation": "Expand Mexico triangle routing services", "priority": "high"}',
 'MarketBot', 0.91, 'pending_review'
)
ON CONFLICT DO NOTHING;

-- Comments explaining the schema
COMMENT ON TABLE chatbot_conversations IS 'Stores all team chatbot interactions with AI agents';
COMMENT ON TABLE chatbot_findings IS 'AI-generated insights and recommendations for dashboard integration';
COMMENT ON TABLE agent_collaborations IS 'Tracks when multiple AI agents work together on complex requests';
COMMENT ON TABLE chatbot_api_usage IS 'Monitors external API usage and costs for optimization';
COMMENT ON TABLE chatbot_user_preferences IS 'Team member settings and preferences for chatbot interactions';