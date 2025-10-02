-- Migration: Create workflow_sessions table
-- Purpose: Persist USMCA workflow data to database instead of localStorage

-- Create workflow_sessions table
CREATE TABLE IF NOT EXISTS workflow_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_key TEXT UNIQUE NOT NULL,

    -- Workflow status
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),

    -- Step 1: Company Information
    company_name TEXT,
    business_type TEXT,
    manufacturing_location TEXT,
    trade_volume DECIMAL(15,2),

    -- Step 2: Product Information
    product_description TEXT,
    hs_code TEXT,
    component_origins JSONB DEFAULT '[]'::jsonb,

    -- Results/Analysis
    qualification_status TEXT,
    usmca_eligibility_score DECIMAL(5,2),
    regional_value_content DECIMAL(5,2),
    annual_tariff_cost DECIMAL(15,2),
    potential_usmca_savings DECIMAL(15,2),
    compliance_gaps TEXT[],
    vulnerability_factors TEXT[],

    -- Certificate tracking
    certificate_id UUID,
    certificate_generated_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_user_id ON workflow_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_session_key ON workflow_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_status ON workflow_sessions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_last_accessed ON workflow_sessions(last_accessed DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_workflow_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_sessions_updated_at
    BEFORE UPDATE ON workflow_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_sessions_updated_at();

-- Add helpful comments
COMMENT ON TABLE workflow_sessions IS 'Stores USMCA workflow session data for authenticated users';
COMMENT ON COLUMN workflow_sessions.session_key IS 'Unique identifier for this workflow session (UUID format)';
COMMENT ON COLUMN workflow_sessions.component_origins IS 'JSONB array of component origin data: [{country, percentage, component_type}]';
COMMENT ON COLUMN workflow_sessions.status IS 'Current workflow status: in_progress, completed, or abandoned';
