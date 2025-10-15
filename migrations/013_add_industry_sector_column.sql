-- Migration 013: Add industry_sector column to workflow_sessions table
-- Date: October 15, 2025
-- Purpose: Separate business role (business_type) from industry classification (industry_sector)
--
-- CRITICAL: This fixes the field name confusion where business_type was used for TWO purposes:
-- - Business role: Importer, Exporter, Manufacturer, Distributor
-- - Industry classification: Automotive, Electronics, Textiles, etc.
--
-- After this migration:
-- - business_type = Business role (Importer/Exporter/etc)
-- - industry_sector = Industry classification (Automotive/Electronics/etc)

-- Step 1: Add industry_sector column
ALTER TABLE workflow_sessions
ADD COLUMN IF NOT EXISTS industry_sector TEXT;

-- Step 2: Add comment to document the field
COMMENT ON COLUMN workflow_sessions.business_type IS 'Business role in supply chain: Importer, Exporter, Manufacturer, Distributor';
COMMENT ON COLUMN workflow_sessions.industry_sector IS 'Industry classification for HS code context: Automotive, Electronics, Textiles, etc.';

-- Step 3: Optional data migration (uncomment if needed)
-- Note: For new workflows, both fields will be properly populated
-- For old workflows, business_type may contain mixed data (either role or industry)
-- This is acceptable since old workflows are historical data

-- If you need to migrate existing data where business_type contains industry sectors:
-- UPDATE workflow_sessions
-- SET industry_sector = business_type
-- WHERE business_type IN ('Agriculture & Food', 'Automotive', 'Electronics & Technology',
--                         'Energy Equipment', 'General Manufacturing', 'Machinery & Equipment',
--                         'Textiles & Apparel', 'Other')
-- AND industry_sector IS NULL;

-- Create index for faster filtering by industry_sector
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_industry_sector ON workflow_sessions(industry_sector);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 013 completed successfully!';
  RAISE NOTICE 'Added industry_sector column to workflow_sessions table';
  RAISE NOTICE 'Business Type (role) and Industry Sector (classification) are now separate fields';
END $$;
