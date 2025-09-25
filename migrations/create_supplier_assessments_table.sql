-- Create supplier_assessments table for capability assessment submissions
-- This table stores supplier responses to capability assessment forms

CREATE TABLE IF NOT EXISTS supplier_assessments (
    id SERIAL PRIMARY KEY,
    assessment_id VARCHAR(255) NOT NULL UNIQUE,

    -- Client and Supplier Context
    client_company VARCHAR(255),
    supplier_name VARCHAR(255),
    assessment_token VARCHAR(255),

    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(100),
    company_website VARCHAR(500),
    years_in_business VARCHAR(50),

    -- Production Capabilities
    production_capacity VARCHAR(100),
    manufacturing_processes TEXT[], -- Array of selected processes
    quality_certifications TEXT[], -- Array of selected certifications
    production_lead_times VARCHAR(100),
    minimum_order_quantity VARCHAR(255),

    -- Infrastructure
    facility_size VARCHAR(255),
    equipment_overview TEXT,
    workforce_size VARCHAR(100),
    location_advantages TEXT,

    -- Quality & Compliance
    quality_management_system VARCHAR(255),
    export_experience VARCHAR(100),
    usmca_compliance VARCHAR(100),
    sustainability_practices TEXT,

    -- Partnership Details
    pricing_structure VARCHAR(100),
    payment_terms VARCHAR(100),
    partnership_interest_level VARCHAR(100) NOT NULL,
    additional_capabilities TEXT,
    references TEXT,

    -- Metadata
    status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    assigned_to VARCHAR(100) DEFAULT 'Jorge',
    priority VARCHAR(20) DEFAULT 'medium',

    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Assessment Results (filled by Jorge's team)
    qualification_score INTEGER,
    qualification_status VARCHAR(50),
    reviewer_notes TEXT,
    client_introduction_made BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_supplier_assessments_assessment_id ON supplier_assessments(assessment_id);
CREATE INDEX idx_supplier_assessments_client_company ON supplier_assessments(client_company);
CREATE INDEX idx_supplier_assessments_status ON supplier_assessments(status);
CREATE INDEX idx_supplier_assessments_assigned_to ON supplier_assessments(assigned_to);
CREATE INDEX idx_supplier_assessments_priority ON supplier_assessments(priority);
CREATE INDEX idx_supplier_assessments_submitted_at ON supplier_assessments(submitted_at);
CREATE INDEX idx_supplier_assessments_interest_level ON supplier_assessments(partnership_interest_level);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_supplier_assessments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_supplier_assessments_updated_at
    BEFORE UPDATE ON supplier_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_assessments_updated_at_column();

-- Create function to get assessment summary stats
CREATE OR REPLACE FUNCTION get_assessment_summary_stats()
RETURNS TABLE (
    total_assessments INTEGER,
    pending_review INTEGER,
    high_interest INTEGER,
    this_month INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_assessments,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END)::INTEGER as pending_review,
        COUNT(CASE WHEN partnership_interest_level = 'very-high' THEN 1 END)::INTEGER as high_interest,
        COUNT(CASE WHEN submitted_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::INTEGER as this_month
    FROM supplier_assessments;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE supplier_assessments IS 'Stores supplier capability assessment responses for partnership evaluation';
COMMENT ON COLUMN supplier_assessments.assessment_id IS 'Unique assessment identifier (ASMT_timestamp_random)';
COMMENT ON COLUMN supplier_assessments.manufacturing_processes IS 'Array of selected manufacturing capabilities';
COMMENT ON COLUMN supplier_assessments.quality_certifications IS 'Array of selected quality certifications';
COMMENT ON COLUMN supplier_assessments.partnership_interest_level IS 'Supplier interest level: very-high, high, moderate, preliminary';
COMMENT ON COLUMN supplier_assessments.qualification_score IS 'Jorge team assessment score (1-100)';
COMMENT ON FUNCTION get_assessment_summary_stats() IS 'Returns summary statistics for supplier assessments dashboard';