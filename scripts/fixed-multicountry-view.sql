-- Fixed Multi-Country View SQL
-- This creates a comparison view for US and Canadian tariff rates

CREATE OR REPLACE VIEW hs_master_multicountry AS
WITH base_codes AS (
  SELECT DISTINCT 
    CASE 
      WHEN hs_code LIKE '%_CA' THEN LEFT(hs_code, LENGTH(hs_code) - 3)
      WHEN hs_code LIKE '%_MX' THEN LEFT(hs_code, LENGTH(hs_code) - 3)  
      ELSE hs_code 
    END as base_hs_code
  FROM hs_master_rebuild
),
rates_by_country AS (
  SELECT 
    CASE 
      WHEN hs_code LIKE '%_CA' THEN LEFT(hs_code, LENGTH(hs_code) - 3)
      WHEN hs_code LIKE '%_MX' THEN LEFT(hs_code, LENGTH(hs_code) - 3)
      ELSE hs_code 
    END as base_hs_code,
    country_source,
    mfn_rate,
    usmca_rate,
    description,
    chapter
  FROM hs_master_rebuild
  WHERE mfn_rate > 0
)
SELECT 
  r.base_hs_code as hs_code,
  MAX(CASE WHEN r.country_source = 'US' THEN r.description END) as description,
  MAX(r.chapter) as chapter,
  
  -- US Rates
  MAX(CASE WHEN r.country_source = 'US' THEN r.mfn_rate END) as us_mfn_rate,
  MAX(CASE WHEN r.country_source = 'US' THEN r.usmca_rate END) as us_usmca_rate,
  MAX(CASE WHEN r.country_source = 'US' THEN (r.mfn_rate - r.usmca_rate) END) as us_savings,
  
  -- Canadian Rates  
  MAX(CASE WHEN r.country_source = 'CA' THEN r.mfn_rate END) as ca_mfn_rate,
  MAX(CASE WHEN r.country_source = 'CA' THEN r.usmca_rate END) as ca_usmca_rate,
  MAX(CASE WHEN r.country_source = 'CA' THEN (r.mfn_rate - r.usmca_rate) END) as ca_savings,
  
  -- Best rate comparison
  GREATEST(
    COALESCE(MAX(CASE WHEN r.country_source = 'US' THEN r.mfn_rate END), 0),
    COALESCE(MAX(CASE WHEN r.country_source = 'CA' THEN r.mfn_rate END), 0)
  ) as highest_mfn_rate,
  
  GREATEST(
    COALESCE(MAX(CASE WHEN r.country_source = 'US' THEN (r.mfn_rate - r.usmca_rate) END), 0),
    COALESCE(MAX(CASE WHEN r.country_source = 'CA' THEN (r.mfn_rate - r.usmca_rate) END), 0)
  ) as best_usmca_savings,
  
  -- Product categorization
  CASE
    WHEN MAX(r.chapter) <= 24 THEN 'Food & Agriculture'
    WHEN MAX(r.chapter) <= 27 THEN 'Raw Materials'
    WHEN MAX(r.chapter) <= 38 THEN 'Chemicals'
    WHEN MAX(r.chapter) <= 40 THEN 'Plastics & Rubber'
    WHEN MAX(r.chapter) <= 43 THEN 'Leather & Hides'
    WHEN MAX(r.chapter) <= 49 THEN 'Wood & Paper'
    WHEN MAX(r.chapter) <= 63 THEN 'Textiles & Clothing'
    WHEN MAX(r.chapter) <= 67 THEN 'Footwear & Accessories'
    WHEN MAX(r.chapter) <= 71 THEN 'Stone & Precious Items'
    WHEN MAX(r.chapter) <= 83 THEN 'Base Metals'
    WHEN MAX(r.chapter) <= 85 THEN 'Machinery & Electronics'
    WHEN MAX(r.chapter) <= 89 THEN 'Transportation'
    WHEN MAX(r.chapter) <= 92 THEN 'Precision Instruments'
    ELSE 'Other Products'
  END as product_category
  
FROM rates_by_country r
GROUP BY r.base_hs_code
HAVING COUNT(DISTINCT r.country_source) >= 1
ORDER BY best_usmca_savings DESC;