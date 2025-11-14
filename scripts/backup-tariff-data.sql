-- ============================================================================
-- BACKUP EXISTING TARIFF DATA BEFORE CLEAN IMPORT
-- Date: 2025-11-14
-- Reason: Wiping tariff_intelligence_master to import clean USITC HTS 2025 data
-- ============================================================================

-- Backup current tariff_intelligence_master table
CREATE TABLE tariff_intelligence_master_backup_20251114 AS
SELECT * FROM tariff_intelligence_master;

-- Verify backup created successfully
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN data_source LIKE '%AI Research%' THEN 1 END) as ai_researched_rows,
  COUNT(CASE WHEN mfn_ad_val_rate IS NOT NULL THEN 1 END) as rows_with_mfn_rates,
  COUNT(CASE WHEN usmca_ad_val_rate IS NOT NULL THEN 1 END) as rows_with_usmca_rates
FROM tariff_intelligence_master_backup_20251114;

-- ============================================================================
-- NOTES:
-- - Original table had ~12,127 rows (mixed AI + unknown sources)
-- - After backup, we'll TRUNCATE and import 36,170 clean USITC codes
-- - To restore: DROP TABLE tariff_intelligence_master;
--               ALTER TABLE tariff_intelligence_master_backup_20251114
--               RENAME TO tariff_intelligence_master;
-- ============================================================================
