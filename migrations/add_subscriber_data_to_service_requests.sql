-- ============================================================================
-- MIGRATION: Add subscriber_data to service_requests
-- Date: 2025-10-01
-- Purpose: Add JSONB column for complete USMCA workflow data
-- Status: REQUIRED FOR LAUNCH
-- ============================================================================

BEGIN;

-- Step 1: Add new columns
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS client_company TEXT,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS subscriber_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_data JSONB;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id
  ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_subscriber_data
  ON service_requests USING GIN (subscriber_data);

-- Step 3: Add comments
COMMENT ON COLUMN service_requests.subscriber_data IS
  'Complete USMCA workflow data required for all professional services (JSONB)';
COMMENT ON COLUMN service_requests.workflow_data IS
  'Optional: Additional workflow-specific data (JSONB)';

-- Step 4: Migrate existing data from service_details to subscriber_data
UPDATE service_requests
SET
  client_company = company_name,
  subscriber_data = jsonb_build_object(
    'company_name', company_name,
    'business_type', COALESCE(industry, 'General'),
    'trade_volume', COALESCE(trade_volume::text, '0'),
    'manufacturing_location', COALESCE(service_details->>'manufacturing_location', 'Unknown'),
    'product_description', COALESCE(
      service_details->>'product_description',
      service_details->>'project_description',
      'Product description not provided'
    ),
    'component_origins', COALESCE(
      service_details->'component_origins',
      '[]'::jsonb
    ),
    'qualification_status', 'PENDING',
    'annual_tariff_cost', 0,
    'potential_usmca_savings', 0,
    'compliance_gaps', '[]'::jsonb,
    'vulnerability_factors', '[]'::jsonb,
    'contact_name', COALESCE(contact_name, 'Not provided'),
    'email', COALESCE(email, 'triangleintel@gmail.com'),
    'phone', COALESCE(phone, 'Not provided')
  )
WHERE subscriber_data = '{}'::jsonb OR subscriber_data IS NULL;

COMMIT;

-- Verify migration
SELECT
  COUNT(*) as total_rows,
  COUNT(subscriber_data) as rows_with_subscriber_data,
  COUNT(CASE WHEN subscriber_data != '{}'::jsonb THEN 1 END) as rows_with_data,
  COUNT(CASE WHEN subscriber_data->>'company_name' IS NOT NULL THEN 1 END) as rows_with_company_name
FROM service_requests;
