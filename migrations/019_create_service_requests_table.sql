-- ============================================================================
-- SERVICE REQUESTS TABLE
-- Stores professional service purchase requests from users
-- Links to 6 team collaboration services (trade-health-check, usmca-advantage, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service identification
  service_type TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  industry TEXT,
  trade_volume DECIMAL(15,2),

  -- Assignment and workflow
  assigned_to TEXT NOT NULL DEFAULT 'Jorge',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',

  -- Planning
  timeline TEXT,
  budget_range TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Client consent tracking (GDPR/privacy compliance)
  data_storage_consent BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  privacy_policy_version TEXT,
  consent_ip_address TEXT,
  consent_user_agent TEXT,

  -- JSONB fields for flexible data storage
  service_details JSONB,          -- Service-specific form data
  subscriber_data JSONB,           -- Complete USMCA workflow data (PRIMARY FIELD)
  workflow_data JSONB,             -- Legacy field (kept for backwards compatibility)

  -- Consultation tracking
  consultation_status TEXT,
  consultation_duration TEXT,
  next_steps TEXT,

  -- Constraints
  CONSTRAINT valid_service_type CHECK (service_type IN (
    'trade-health-check',
    'usmca-advantage',
    'supply-chain-optimization',
    'pathfinder',
    'supply-chain-resilience',
    'crisis-navigator'
  )),

  CONSTRAINT valid_status CHECK (status IN (
    'pending_payment',
    'pending',
    'in_progress',
    'research_in_progress',
    'proposal_sent',
    'completed',
    'cancelled',
    'pending_schedule',
    'scheduled',
    'consultation_completed'
  )),

  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  CONSTRAINT valid_assigned_to CHECK (assigned_to IN ('Jorge', 'Cristina', 'Jorge & Cristina'))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Filter by team member
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to
  ON service_requests(assigned_to);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_service_requests_status
  ON service_requests(status);

-- Sort by creation date (most recent first)
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at
  ON service_requests(created_at DESC);

-- Search by email (for user lookup)
CREATE INDEX IF NOT EXISTS idx_service_requests_email
  ON service_requests(email);

-- Filter by service type
CREATE INDEX IF NOT EXISTS idx_service_requests_service_type
  ON service_requests(service_type);

-- Composite index for common queries (assigned_to + status)
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_status
  ON service_requests(assigned_to, status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all service requests
CREATE POLICY "Admins can view all service requests"
  ON service_requests FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policy: Admins can create/update/delete service requests
CREATE POLICY "Admins can manage service requests"
  ON service_requests FOR ALL
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policy: Users can view their own service requests
CREATE POLICY "Users can view their own service requests"
  ON service_requests FOR SELECT
  USING (
    email IN (
      SELECT email FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE service_requests IS 'Professional service requests from users (6 team collaboration services)';
COMMENT ON COLUMN service_requests.service_type IS 'One of 6 services: trade-health-check, usmca-advantage, supply-chain-optimization, pathfinder, supply-chain-resilience, crisis-navigator';
COMMENT ON COLUMN service_requests.assigned_to IS 'Team member assigned: Jorge, Cristina, or Jorge & Cristina (team collaboration)';
COMMENT ON COLUMN service_requests.subscriber_data IS 'PRIMARY FIELD: Complete USMCA workflow data (JSONB) with component enrichment';
COMMENT ON COLUMN service_requests.workflow_data IS 'LEGACY FIELD: Kept for backwards compatibility, use subscriber_data instead';
COMMENT ON COLUMN service_requests.data_storage_consent IS 'GDPR compliance: User must explicitly consent to data storage';
COMMENT ON COLUMN service_requests.service_details IS 'Service-specific form data (flexible JSONB)';

-- ============================================================================
-- EXAMPLE DATA STRUCTURE
-- ============================================================================

/*
subscriber_data JSONB structure (snake_case):
{
  "company_name": "Acme Manufacturing",
  "business_type": "Manufacturer",
  "trade_volume": "$1M - $5M",
  "manufacturing_location": "Mexico",
  "supplier_country": "China",
  "product_description": "Electric motors",
  "component_origins": [
    {
      "country": "China",
      "percentage": 45,
      "value_percentage": 45,
      "component_type": "Motors",
      "description": "Electric motors 500W",
      "hs_code": "8501.10",
      "hs_description": "Electric motors of an output not exceeding 37.5 W",
      "mfn_rate": 0.026,
      "usmca_rate": 0.00,
      "savings_amount": 260,
      "savings_percentage": 100,
      "ai_confidence": 95
    }
  ],
  "qualification_status": "QUALIFIED",
  "north_american_content": 55,
  "annual_tariff_cost": 26000,
  "potential_usmca_savings": 26000
}
*/
