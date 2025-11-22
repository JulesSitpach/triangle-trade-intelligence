SELECT hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate 
FROM tariff_intelligence_master 
WHERE hts8 IN ('68138100', '73269085')
ORDER BY hts8;
