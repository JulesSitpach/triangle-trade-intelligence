-- Fix hindsight_pattern_library table schema
-- Add missing business_type column for production readiness

-- Add business_type column if it doesn't exist
ALTER TABLE hindsight_pattern_library 
ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Update existing records with appropriate business types
UPDATE hindsight_pattern_library 
SET business_type = CASE 
    WHEN pattern_type LIKE '%manufacturing%' OR business_context LIKE '%manufacturing%' THEN 'Manufacturing'
    WHEN pattern_type LIKE '%electronics%' OR business_context LIKE '%electronics%' THEN 'Electronics'
    WHEN pattern_type LIKE '%automotive%' OR business_context LIKE '%automotive%' THEN 'Automotive'
    WHEN pattern_type LIKE '%textile%' OR business_context LIKE '%textile%' THEN 'Textiles'
    WHEN pattern_type LIKE '%machinery%' OR business_context LIKE '%machinery%' THEN 'Machinery'
    ELSE 'Consumer Goods'
END
WHERE business_type IS NULL;

-- Add updated_at timestamp for tracking
UPDATE hindsight_pattern_library 
SET updated_at = NOW()
WHERE business_type IS NOT NULL AND updated_at IS NULL;

-- Verify the fix
SELECT 
    id,
    pattern_type,
    business_type,
    business_context,
    updated_at
FROM hindsight_pattern_library 
ORDER BY id
LIMIT 10;