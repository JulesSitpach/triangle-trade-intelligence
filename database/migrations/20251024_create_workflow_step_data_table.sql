/**
 * Migration: Create workflow_step_data table for step-by-step tracking
 * Date: October 24, 2025
 *
 * Tracks which steps users complete in the workflow and captures the data
 * entered at each step. Useful for:
 * - Debugging workflow issues
 * - Understanding where users drop off
 * - Analyzing workflow completion rates by step
 * - User journey analytics
 */

CREATE TABLE IF NOT EXISTS workflow_step_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workflow reference
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Step information
  step_name TEXT NOT NULL, -- 'company_info', 'product_analysis', 'component_origins', etc.
  step_order INTEGER,

  -- Data captured at this step
  step_data JSONB NOT NULL, -- Complete data object from the step

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_workflow_step_data_session_id
  ON workflow_step_data(session_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_data_user_id
  ON workflow_step_data(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_step_data_step_name
  ON workflow_step_data(step_name);

CREATE INDEX IF NOT EXISTS idx_workflow_step_data_created_at
  ON workflow_step_data(created_at DESC);

-- Composite index for common queries (session + step)
CREATE INDEX IF NOT EXISTS idx_workflow_step_data_session_step
  ON workflow_step_data(session_id, step_name);

-- Comments
COMMENT ON TABLE workflow_step_data
  IS 'Tracks step-by-step workflow progression and data capture for debugging and analytics';

COMMENT ON COLUMN workflow_step_data.step_name
  IS 'Name of the workflow step: company_info, product_analysis, component_origins, qualification_results, certificate_generation';

COMMENT ON COLUMN workflow_step_data.step_data
  IS 'Complete data object captured at this step - preserves user inputs for debugging and recovery';

-- RLS Policy: Users can see their own step data, system can insert
ALTER TABLE workflow_step_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own step data" ON workflow_step_data
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "System can insert step data" ON workflow_step_data
  FOR INSERT
  WITH CHECK (true);
