/**
 * Migration: Add missing business intelligence columns to workflow_completions
 * Date: October 24, 2025
 *
 * The workflow-data-capture-service was trying to insert these columns but they didn't exist.
 * This migration adds them to preserve business intelligence data for analytics and reporting.
 */

-- Add missing business intelligence columns to workflow_completions
ALTER TABLE workflow_completions
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS trade_volume NUMERIC,
ADD COLUMN IF NOT EXISTS supplier_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS annual_savings NUMERIC,
ADD COLUMN IF NOT EXISTS trust_score INTEGER;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workflow_completions_company_name
  ON workflow_completions(company_name);

CREATE INDEX IF NOT EXISTS idx_workflow_completions_business_type
  ON workflow_completions(business_type);

CREATE INDEX IF NOT EXISTS idx_workflow_completions_supplier_country
  ON workflow_completions(supplier_country);

-- Comment on the new columns
COMMENT ON COLUMN workflow_completions.company_name
  IS 'Company name from workflow completion - used for analytics and reporting';

COMMENT ON COLUMN workflow_completions.business_type
  IS 'Business type/sector from workflow - used for industry segmentation';

COMMENT ON COLUMN workflow_completions.trade_volume
  IS 'Annual trade volume from workflow - used for sizing and capacity planning';

COMMENT ON COLUMN workflow_completions.supplier_country
  IS 'Primary supplier country - used for supply chain analysis';

COMMENT ON COLUMN workflow_completions.annual_savings
  IS 'Estimated annual savings from USMCA certification - used for ROI reporting';

COMMENT ON COLUMN workflow_completions.trust_score
  IS 'Compliance/trust score from workflow - used for risk assessment';
