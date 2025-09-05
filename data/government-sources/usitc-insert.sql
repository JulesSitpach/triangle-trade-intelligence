
INSERT INTO hs_master_rebuild (
  hs_code, description, chapter, heading, subheading,
  us_mfn_rate, us_usmca_rate, us_source, us_effective_date,
  product_category, usmca_eligible
) VALUES (
  '640411',
  'Sports footwear; tennis shoes, basketball shoes, gym shoes, training shoes and the like, whether or not having metal reinforcements',
  64,
  '6404',
  '640411',
  37.5,
  0,
  'USITC_HTS_2024',
  '2024-01-01',
  'Footwear & Accessories',
  true
) ON CONFLICT (hs_code) DO UPDATE SET
  us_mfn_rate = EXCLUDED.us_mfn_rate,
  us_usmca_rate = EXCLUDED.us_usmca_rate,
  us_source = EXCLUDED.us_source,
  us_effective_date = EXCLUDED.us_effective_date,
  last_verified = CURRENT_TIMESTAMP;


INSERT INTO hs_master_rebuild (
  hs_code, description, chapter, heading, subheading,
  us_mfn_rate, us_usmca_rate, us_source, us_effective_date,
  product_category, usmca_eligible
) VALUES (
  '611020',
  'Jerseys, pullovers, cardigans, waistcoats and similar articles, knitted or crocheted, of cotton',
  61,
  '6110',
  '611020',
  32,
  0,
  'USITC_HTS_2024',
  '2024-01-01',
  'Textiles & Clothing',
  true
) ON CONFLICT (hs_code) DO UPDATE SET
  us_mfn_rate = EXCLUDED.us_mfn_rate,
  us_usmca_rate = EXCLUDED.us_usmca_rate,
  us_source = EXCLUDED.us_source,
  us_effective_date = EXCLUDED.us_effective_date,
  last_verified = CURRENT_TIMESTAMP;


INSERT INTO hs_master_rebuild (
  hs_code, description, chapter, heading, subheading,
  us_mfn_rate, us_usmca_rate, us_source, us_effective_date,
  product_category, usmca_eligible
) VALUES (
  '020130',
  'Meat of bovine animals, boneless, fresh or chilled',
  2,
  '0201',
  '020130',
  26.4,
  0,
  'USITC_HTS_2024',
  '2024-01-01',
  'Food & Agriculture',
  true
) ON CONFLICT (hs_code) DO UPDATE SET
  us_mfn_rate = EXCLUDED.us_mfn_rate,
  us_usmca_rate = EXCLUDED.us_usmca_rate,
  us_source = EXCLUDED.us_source,
  us_effective_date = EXCLUDED.us_effective_date,
  last_verified = CURRENT_TIMESTAMP;