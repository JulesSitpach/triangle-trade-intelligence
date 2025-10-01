-- ============================================================================
-- MIGRATION: Create service_completions table
-- Date: 2025-10-01
-- Purpose: Track completed service deliverables
-- Status: OPTIONAL (Not required for initial launch)
-- ============================================================================

BEGIN;

-- Drop table if exists (fresh start)
DROP TABLE IF EXISTS service_completions CASCADE;

-- Create service_completions table
CREATE TABLE service_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    completion_data JSONB,
    report_url TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one completion per request
    CONSTRAINT service_completions_service_request_id_unique
      UNIQUE (service_request_id)
);

-- Create indexes
CREATE INDEX idx_service_completions_request_id
  ON service_completions(service_request_id);
CREATE INDEX idx_service_completions_completed_at
  ON service_completions(completed_at);
CREATE INDEX idx_service_completions_completion_data
  ON service_completions USING GIN (completion_data);

-- Add comments
COMMENT ON TABLE service_completions IS
  'Completed service deliverables with reports and completion data';
COMMENT ON COLUMN service_completions.completion_data IS
  'Service-specific completion data including AI analysis results (JSONB)';
COMMENT ON COLUMN service_completions.report_url IS
  'URL or file path to generated report (PDF, etc.)';

COMMIT;

-- Verify table creation
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'service_completions'
ORDER BY ordinal_position;
