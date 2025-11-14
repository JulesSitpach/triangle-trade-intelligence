-- Check if these HS codes exist in our database and verify tariff rates
SELECT 
  hts8,
  brief_description,
  mfn_ad_val_rate as mfn_rate,
  usmca_ad_val_rate as usmca_rate
FROM tariff_intelligence_master
WHERE hts8 IN ('85423100', '76169990', '85285900')
ORDER BY hts8;
