-- ADD DIRECT CBP FEEDS - "Live Customs Updates" Feature
-- Addresses LinkedIn member request: "live customs updates? Would be clutch for folks trying to go global"
-- Adds CBP Newsroom and Trade Bulletins for immediate customs clearance intelligence

-- ============================================================================
-- CBP Newsroom Spotlight (Real-time customs updates)
-- ============================================================================
INSERT INTO rss_feeds (
  name,
  url,
  category,
  description,
  is_active,
  priority_level,
  poll_frequency_minutes,
  keywords,
  exclusion_keywords
) VALUES (
  'CBP Newsroom - Spotlights',
  'https://www.cbp.gov/newsroom/spotlights/feed',
  'government',
  'Real-time Customs & Border Protection spotlights - customs clearance, compliance, enforcement',
  true,
  'critical',  -- High priority for "live customs updates" feature
  30,  -- Check every 30 minutes for real-time updates
  ARRAY[
    -- Customs clearance and procedures
    'customs clearance', 'port of entry', 'customs hold',
    'detention', 'release', 'exam', 'inspection',
    'entry processing', 'clearance delay',

    -- Trade compliance
    'trade compliance', 'compliance alert', 'trade alert',
    'informed compliance', 'reasonable care',
    'importer responsibility', 'broker requirements',

    -- Tariff and classification
    'tariff', 'tariff classification', 'hs code', 'hts',
    'harmonized tariff', 'classification ruling',
    'binding ruling', 'advance ruling',

    -- USMCA and certificates
    'usmca', 'certificate of origin', 'preferential treatment',
    'rules of origin', 'regional value content', 'rvc',
    'nafta', 'free trade agreement',

    -- Section 301/232
    'section 301', 'section 232', 'additional duties',
    'steel tariff', 'aluminum tariff', 'china tariff',

    -- Documentation requirements
    'documentation', 'required documents', 'commercial invoice',
    'packing list', 'entry documentation', 'entry summary',

    -- Enforcement and penalties
    'penalty', 'fine', 'seizure', 'violation',
    'enforcement action', 'compliance check',
    'audit', 'verification', 'focused assessment',

    -- Port-specific updates
    'los angeles', 'long beach', 'laredo', 'el paso',
    'detroit', 'port delay', 'port closure',
    'border crossing', 'wait time',

    -- Product-specific alerts
    'electronics', 'automotive', 'textiles', 'apparel',
    'steel', 'aluminum', 'agricultural', 'food safety',

    -- Trade facilitation
    'trusted trader', 'ctpat', 'ace system',
    'automated commercial environment', 'entry filing',
    'electronic filing', 'manifest requirements'
  ],
  ARRAY[
    -- Exclude non-trade content
    'immigration', 'visa', 'passport', 'travel',
    'border patrol', 'drug seizure', 'human trafficking',
    'personnel announcement', 'career opportunity',
    'national security unrelated to trade'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  priority_level = EXCLUDED.priority_level,
  poll_frequency_minutes = EXCLUDED.poll_frequency_minutes,
  updated_at = NOW();

-- ============================================================================
-- CBP Trade Weekly Bulletin (Official weekly trade updates)
-- ============================================================================
INSERT INTO rss_feeds (
  name,
  url,
  category,
  description,
  is_active,
  priority_level,
  poll_frequency_minutes,
  keywords,
  exclusion_keywords
) VALUES (
  'CBP Customs Bulletin',
  'https://www.cbp.gov/document/bulletins/weekly-bulletin-rss',
  'government',
  'Official CBP weekly bulletins - rulings, regulations, general notices',
  true,
  'high',
  120,  -- Check every 2 hours (bulletins are weekly but need timely alerts)
  ARRAY[
    -- Customs rulings
    'ruling', 'ny ruling', 'hq ruling',
    'classification ruling', 'origin ruling',
    'marking ruling', 'valuation ruling',

    -- Tariff actions
    'tariff modification', 'tariff rate change',
    'duty suspension', 'duty elimination',
    'preferential tariff', 'most favored nation',

    -- Regulatory actions
    'general notice', 'proposed regulations',
    'final regulations', 'revocation',
    'modification of ruling', 'correction',

    -- Product classifications
    'harmonized tariff schedule', 'hts amendment',
    'classification change', 'hs code',
    'chapter 84', 'chapter 85', 'chapter 87',

    -- Trade agreements
    'usmca implementation', 'free trade agreement',
    'trade preference program', 'gsp',
    'generalized system of preferences',

    -- Compliance and procedures
    'entry procedure', 'drawback', 'protest',
    'prior disclosure', 'informed compliance',
    'mitigation guidelines', 'penalty guidelines'
  ],
  ARRAY[
    -- Exclude administrative content
    'solicitation', 'contract award',
    'personnel matter', 'internal directive'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  updated_at = NOW();

-- ============================================================================
-- Verify new feeds
-- ============================================================================
DO $$
DECLARE
  feed_count INTEGER;
  cbp_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO feed_count FROM rss_feeds WHERE is_active = true;
  SELECT COUNT(*) INTO cbp_count FROM rss_feeds WHERE name LIKE '%CBP%' AND is_active = true;

  RAISE NOTICE '✅ CBP Live Customs Updates Activated';
  RAISE NOTICE '📡 Total Active Feeds: %', feed_count;
  RAISE NOTICE '🛃 CBP-Specific Feeds: %', cbp_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 LinkedIn Member Request DELIVERED:';
  RAISE NOTICE '   "live customs updates? Would be clutch for folks trying to go global"';
  RAISE NOTICE '   ✅ CBP Newsroom Spotlights (real-time)';
  RAISE NOTICE '   ✅ CBP Weekly Bulletins (rulings & regulations)';
  RAISE NOTICE '   ✅ Federal Register CBP (existing)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Coverage:';
  RAISE NOTICE '   • Customs clearance delays & holds';
  RAISE NOTICE '   • Documentation requirements';
  RAISE NOTICE '   • USMCA certificate compliance';
  RAISE NOTICE '   • Port-specific updates';
  RAISE NOTICE '   • Classification rulings';
  RAISE NOTICE '   • Section 301/232 enforcement';
END $$;
