/**
 * Migration: Create dev_issues table for tracking code bugs
 * Purpose: Log missing data, validation errors, and other dev issues visible to admins
 * These are NOT user errors - they are CODE BUGS that need fixing
 */

-- Create dev_issues table
CREATE TABLE IF NOT EXISTS dev_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Issue classification
  issue_type TEXT NOT NULL,          -- 'missing_data', 'validation_error', 'api_error', etc.
  severity TEXT NOT NULL,            -- 'critical', 'high', 'medium', 'low'
  component TEXT NOT NULL,           -- 'pdf_generator', 'certificate_api', 'workflow', etc.

  -- Issue details
  message TEXT NOT NULL,             -- Human-readable description
  context_data JSONB,                -- Full context object (certificate data, error stack, etc.)

  -- Related records
  user_id UUID REFERENCES auth.users(id),              -- Optional - which user triggered this
  certificate_number TEXT,           -- Optional - which certificate

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- Occurrences (same issue happening multiple times)
  occurrence_count INTEGER DEFAULT 1,
  last_occurrence_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_dev_issues_unresolved ON dev_issues(resolved, created_at DESC) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_dev_issues_severity ON dev_issues(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_issues_component ON dev_issues(component, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_issues_certificate ON dev_issues(certificate_number) WHERE certificate_number IS NOT NULL;

-- RLS Policy: Only admins can view dev issues
ALTER TABLE dev_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view dev issues" ON dev_issues
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE is_admin = TRUE
    )
  );

CREATE POLICY "System can insert dev issues" ON dev_issues
  FOR INSERT
  WITH CHECK (true);  -- Allow system to log issues (API uses service role key)

CREATE POLICY "Admins can update dev issues" ON dev_issues
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE is_admin = TRUE
    )
  );

-- Comment
COMMENT ON TABLE dev_issues IS 'Tracks code bugs and missing data issues for admin visibility - NOT user errors';
