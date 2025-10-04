-- STEP 1: Create workflow_sessions table
-- Run this first in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS workflow_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    company_name TEXT,
    business_type TEXT,
    manufacturing_location TEXT,
    trade_volume DECIMAL(15,2),
    product_description TEXT,
    hs_code TEXT,
    component_origins JSONB DEFAULT '[]'::jsonb,
    qualification_status TEXT,
    usmca_eligibility_score DECIMAL(5,2),
    regional_value_content DECIMAL(5,2),
    annual_tariff_cost DECIMAL(15,2),
    potential_usmca_savings DECIMAL(15,2),
    compliance_gaps TEXT[],
    vulnerability_factors TEXT[],
    certificate_id UUID,
    certificate_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);
