-- STEP 4: CREATE WORKFLOW AND CERTIFICATES TABLES
-- Run this in Supabase SQL Editor after the core tables

-- Workflow Completions Table
CREATE TABLE IF NOT EXISTS workflow_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User Reference
    user_id TEXT NOT NULL,
    email TEXT,

    -- Workflow Information
    workflow_type TEXT NOT NULL,
    workflow_name TEXT,
    hs_code TEXT,

    -- Completion Details
    completed_at TIMESTAMP DEFAULT NOW(),
    certificate_generated BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'completed',

    -- Financial Impact
    total_savings DECIMAL DEFAULT 0,
    estimated_duty_savings DECIMAL DEFAULT 0,
    compliance_cost_savings DECIMAL DEFAULT 0,

    -- Workflow Data
    workflow_data JSONB,
    session_id TEXT,
    completion_time_minutes INTEGER,

    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User Reference
    user_id TEXT NOT NULL,
    email TEXT,

    -- Certificate Information
    certificate_type TEXT NOT NULL,
    certificate_name TEXT,
    certificate_number TEXT UNIQUE,

    -- Generation Details
    generated_at TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'active',

    -- Certificate Content
    certificate_data JSONB,
    pdf_url TEXT,
    verification_code TEXT,

    -- Validity
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,

    -- Related Data
    workflow_completion_id UUID REFERENCES workflow_completions(id),
    hs_code TEXT,

    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_completions_user_id ON workflow_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_completions_completed_at ON workflow_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_workflow_completions_workflow_type ON workflow_completions(workflow_type);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_generated_at ON certificates(generated_at);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_type ON certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);

-- Insert some sample data for testing
INSERT INTO workflow_completions (user_id, email, workflow_type, workflow_name, hs_code, total_savings, status) VALUES
('user_001', 'test@example.com', 'usmca-compliance', 'USMCA Certificate of Origin', '8471.30', 15000.00, 'completed'),
('user_002', 'demo@company.com', 'tariff-optimization', 'Tariff Code Optimization', '8471.49', 8500.00, 'completed'),
('user_003', 'customer@business.com', 'mexico-routing', 'Mexico Trade Route Analysis', '8542.31', 22000.00, 'completed')
ON CONFLICT DO NOTHING;

INSERT INTO certificates (user_id, email, certificate_type, certificate_name, certificate_number, workflow_completion_id, hs_code) VALUES
(
    'user_001',
    'test@example.com',
    'usmca-origin',
    'USMCA Certificate of Origin',
    'USMCA-2024-001',
    (SELECT id FROM workflow_completions WHERE user_id = 'user_001' LIMIT 1),
    '8471.30'
),
(
    'user_002',
    'demo@company.com',
    'tariff-optimization',
    'Optimized Tariff Classification',
    'TOC-2024-002',
    (SELECT id FROM workflow_completions WHERE user_id = 'user_002' LIMIT 1),
    '8471.49'
),
(
    'user_003',
    'customer@business.com',
    'mexico-routing',
    'Mexico Trade Route Certificate',
    'MTR-2024-003',
    (SELECT id FROM workflow_completions WHERE user_id = 'user_003' LIMIT 1),
    '8542.31'
)
ON CONFLICT DO NOTHING;