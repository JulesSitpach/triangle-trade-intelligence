-- Create executive_summaries table to store ONE master summary per workflow
-- This becomes the single source of truth for all alerts, emails, and analytics

CREATE TABLE executive_summaries (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_session_id UUID REFERENCES workflow_sessions(id) ON DELETE SET NULL,
  workflow_completion_id UUID REFERENCES workflow_completions(id) ON DELETE SET NULL,

  -- Company & Product Context
  company_name TEXT NOT NULL,
  company_country TEXT,
  product_description TEXT,
  hs_code TEXT,
  destination_country TEXT,  -- US, CA, MX for USMCA
  annual_trade_volume NUMERIC,

  -- USMCA Analysis Results (from workflow_intelligence)
  usmca_qualified BOOLEAN DEFAULT FALSE,
  regional_content_percentage NUMERIC,
  threshold_applied NUMERIC,
  gap_percentage NUMERIC,  -- How far below threshold
  qualification_rule TEXT,  -- "RVC 65% (Transaction Value Method)" etc.

  -- Financial Impact
  annual_tariff_burden NUMERIC,  -- Total duties without USMCA
  potential_annual_savings NUMERIC,  -- If qualified
  savings_percentage NUMERIC,
  monthly_tariff_burden NUMERIC,
  tariff_as_percent_of_volume NUMERIC,

  -- Strategic Content (from generateExecutiveAlert)
  headline TEXT,
  situation_brief TEXT,
  executive_summary JSONB,  -- Full narrative from AI
  financial_snapshot JSONB,  -- Breakdown by component
  strategic_roadmap JSONB,  -- 4+ options with timelines
  action_this_week TEXT[],  -- Top 4 immediate actions
  recommendations JSONB,  -- Full array of 8+ recommendations

  -- Component Breakdown
  component_breakdown JSONB,  -- Array of components with tariff impact
  critical_components JSONB,  -- Top 3 non-USMCA components

  -- Confidence & AI Metadata
  ai_confidence NUMERIC,  -- 0.0-1.0 confidence score
  generation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ai_model_used TEXT,  -- "claude-3.5-haiku" etc.
  ai_cost_cents NUMERIC,  -- Cost to generate this summary

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ  -- When summary should be refreshed (90 days)
);

-- Indexes for fast lookup
CREATE INDEX idx_executive_summaries_user_id ON executive_summaries(user_id);
CREATE INDEX idx_executive_summaries_workflow_session_id ON executive_summaries(workflow_session_id);
CREATE INDEX idx_executive_summaries_workflow_completion_id ON executive_summaries(workflow_completion_id);
CREATE INDEX idx_executive_summaries_created_at ON executive_summaries(created_at DESC);
CREATE INDEX idx_executive_summaries_expires_at ON executive_summaries(expires_at);
CREATE INDEX idx_executive_summaries_qualified ON executive_summaries(usmca_qualified);

-- RLS Policies - Users see only their own summaries
ALTER TABLE executive_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executive summaries"
  ON executive_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executive summaries"
  ON executive_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executive summaries"
  ON executive_summaries FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do anything (for background jobs, email triggers)
CREATE POLICY "Service role can manage all executive summaries"
  ON executive_summaries
  USING (current_user = 'authenticated')
  WITH CHECK (current_user = 'authenticated');

-- Table comment for future developers
COMMENT ON TABLE executive_summaries IS
  'Single source of truth for executive trade alert summaries. Generated once per workflow,
  reused by alerts page, email system, analytics, and certificate workflow. Cost: ~$0.02
  to generate, unlimited reuse. Expires after 90 days (user should re-analyze for fresh tariff data).';

COMMENT ON COLUMN executive_summaries.ai_cost_cents IS
  'Cost in cents to generate this summary (typically 2-3 cents for ~$0.02). Track for cost optimization.';

COMMENT ON COLUMN executive_summaries.expires_at IS
  'Summaries are stale after 90 days due to changing tariff policies (Section 301/232 updates).
  Email system should prompt user to re-run analysis if expired.';
