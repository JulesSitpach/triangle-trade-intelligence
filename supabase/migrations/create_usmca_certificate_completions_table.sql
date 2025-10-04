-- USMCA Certificate Completions Table
-- Stores completed USMCA certificates with all required fields

CREATE TABLE IF NOT EXISTS usmca_certificate_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Company Information
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  tax_id TEXT,
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,

  -- Product Information
  product_description TEXT NOT NULL,
  hs_code TEXT NOT NULL,
  manufacturing_location TEXT NOT NULL,

  -- USMCA Qualification Data
  qualification_status TEXT NOT NULL, -- QUALIFIED, NOT_QUALIFIED, PARTIAL
  regional_content_percentage DECIMAL(5,2),
  required_threshold DECIMAL(5,2),

  -- Component Origins
  component_origins JSONB, -- Array of components with origins

  -- Authorization
  authorized_by TEXT NOT NULL,
  authorized_title TEXT NOT NULL,
  authorized_signature TEXT, -- Base64 encoded signature image

  -- Certificate Data
  certificate_number TEXT UNIQUE,
  certificate_data JSONB NOT NULL, -- Full certificate JSON
  pdf_url TEXT, -- S3/storage URL for generated PDF

  -- Metadata
  workflow_id UUID, -- Link to original workflow
  blanket_period_from DATE,
  blanket_period_to DATE,

  -- Timestamps
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_usmca_certificates_user_id
  ON usmca_certificate_completions(user_id);

-- Index for certificate number lookups
CREATE INDEX IF NOT EXISTS idx_usmca_certificates_number
  ON usmca_certificate_completions(certificate_number);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_usmca_certificates_issued_at
  ON usmca_certificate_completions(issued_at DESC);

-- Row Level Security
ALTER TABLE usmca_certificate_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own certificates
CREATE POLICY "Users can view their own certificates"
  ON usmca_certificate_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own certificates
CREATE POLICY "Users can create their own certificates"
  ON usmca_certificate_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own certificates
CREATE POLICY "Users can update their own certificates"
  ON usmca_certificate_completions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own certificates
CREATE POLICY "Users can delete their own certificates"
  ON usmca_certificate_completions
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE usmca_certificate_completions IS 'Completed USMCA Certificates of Origin with full authorization data';
