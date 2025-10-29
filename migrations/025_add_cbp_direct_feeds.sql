-- ADD GOVERNMENT + TRADE INTELLIGENCE FEEDS - "Live Customs Updates" Feature
-- Addresses LinkedIn member request: "live customs updates? Would be clutch for folks trying to go global"
-- Adds 4 authoritative data sources: CBP (2 feeds), WTO, and Journal of Commerce (JOC)

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

    -- USMCA Renegotiation 2026 (NEW)
    'usmca review', 'usmca renegotiation', 'usmca 2026',
    'usmca amendment', 'usmca joint review', 'usmca extension',
    'rvc threshold', 'rvc increase', 'rvc change',
    'china transshipment', 'transshipping', 'country of origin fraud',
    'minimum wage requirement', 'labor provisions', 'wage compliance',
    'ustr public comment', 'usmca public input', 'trade representative review',

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

    -- USMCA Renegotiation 2026 (NEW)
    'usmca review', 'usmca renegotiation', 'usmca 2026',
    'rvc threshold', 'regional value content change',
    'china transshipment', 'origin verification',
    'minimum wage', 'labor compliance',

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
-- WTO News Feed (Dispute settlements, trade policy changes, tariff rulings)
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
  'WTO News & Disputes',
  'https://www.wto.org/library/rss/latest_news_e.xml',
  'international',
  'WTO dispute settlements, trade policy changes, anti-dumping rulings affecting tariff rates',
  true,
  'high',
  120,  -- Check every 2 hours (WTO news is less frequent but high-impact)
  ARRAY[
    -- Dispute settlements (affect tariff rates)
    'dispute settlement', 'arbitration', 'ruling', 'panel report',
    'anti-dumping', 'countervailing duty', 'cvd', 'safeguard',
    'compliance panel', 'retaliation', 'suspension of concessions',

    -- Tariff policy changes
    'tariff', 'duty', 'most favored nation', 'mfn',
    'preferential tariff', 'trade agreement', 'free trade',
    'customs valuation', 'rules of origin', 'classification',

    -- Trade barriers and restrictions
    'trade barrier', 'import restriction', 'export restriction',
    'quota', 'license requirement', 'technical barrier',
    'sanitary', 'phytosanitary', 'sps', 'tbt',

    -- Product-specific (match user industries)
    'electronics', 'automotive', 'steel', 'aluminum',
    'textiles', 'agriculture', 'pharmaceuticals',

    -- Regional agreements
    'usmca', 'nafta', 'cptpp', 'rcep',
    'eu trade', 'china trade', 'us trade policy',

    -- USMCA Renegotiation 2026 (NEW)
    'usmca review', 'usmca renegotiation', 'north american trade',
    'regional value content', 'rvc', 'rules of origin update',
    'transshipment', 'circumvention', 'origin fraud',
    'labor standards', 'wage requirements',

    -- Economic analysis
    'trade intervention', 'trade policy review',
    'market access', 'subsidies', 'state aid'
  ],
  ARRAY[
    -- Exclude non-tariff content
    'appointment', 'personnel', 'conference schedule',
    'video', 'podcast', 'webcast', 'press conference logistics',
    'building renovation', 'internal administration'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  updated_at = NOW();

-- ============================================================================
-- Journal of Commerce (JOC) - Trade intelligence and supply chain monitoring
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
  'Journal of Commerce (JOC)',
  'https://www.joc.com/api/rssfeed',
  'trade_news',
  'Maritime trade, port operations, tariff impacts, supply chain disruptions',
  true,
  'high',
  180,  -- Check every 3 hours (premium trade intelligence)
  ARRAY[
    -- Tariff and trade policy
    'tariff', 'duty', 'section 301', 'section 232',
    'trade war', 'trade policy', 'customs', 'import duty',
    'anti-dumping', 'countervailing duty', 'trade agreement',

    -- Port operations (affects shipping timelines)
    'port congestion', 'vessel delay', 'port closure',
    'customs hold', 'clearance delay', 'terminal congestion',
    'los angeles', 'long beach', 'oakland', 'seattle',
    'savannah', 'charleston', 'houston', 'miami',
    'laredo', 'el paso', 'detroit', 'border crossing',

    -- Supply chain disruptions
    'supply chain', 'shortage', 'disruption', 'delay',
    'capacity constraint', 'equipment shortage', 'container shortage',
    'freight rate', 'shipping rate', 'rate increase',

    -- Trade volumes (affects tariff exposure)
    'import volume', 'export volume', 'trade volume',
    'china imports', 'asia imports', 'mexico trade',
    'usmca', 'nafta', 'trade lane', 'trans-pacific',

    -- USMCA Renegotiation 2026 (NEW)
    'usmca review', 'usmca renegotiation', 'usmca 2026',
    'rvc threshold', 'regional value content',
    'nearshoring', 'reshoring', 'mexico manufacturing',
    'china alternative', 'supplier diversification',
    'origin compliance', 'transshipment risk',

    -- Origin-specific (supplier country risks)
    'china', 'vietnam', 'mexico', 'taiwan', 'south korea',
    'thailand', 'india', 'malaysia', 'indonesia',

    -- Product categories (match user industries)
    'electronics', 'automotive', 'textiles', 'steel',
    'aluminum', 'machinery', 'chemicals', 'agriculture'
  ],
  ARRAY[
    -- Exclude non-trade content
    'job posting', 'career opportunity', 'webinar',
    'conference', 'event registration', 'subscription offer',
    'cruise ship', 'passenger ferry', 'tourism'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  updated_at = NOW();

-- ============================================================================
-- PBS NewsHour (Authoritative US trade news and policy analysis)
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
  'PBS NewsHour',
  'https://www.pbs.org/newshour/feeds/rss/headlines',
  'trade_news',
  'PBS NewsHour headlines - authoritative US trade policy, tariff changes, international trade',
  true,
  'high',
  180,  -- Check every 3 hours (authoritative but less frequent)
  ARRAY[
    -- Trade policy and tariffs
    'tariff', 'trade policy', 'trade war', 'trade deal',
    'trade agreement', 'import duty', 'export restrictions',
    'section 301', 'section 232', 'usmca', 'nafta',

    -- USMCA Renegotiation 2026 (NEW - Critical Coverage)
    'usmca review', 'usmca renegotiation', 'usmca 2026',
    'usmca joint review', 'usmca extension', 'usmca amendment',
    'north american trade', 'trilateral trade',
    'rvc threshold', 'regional value content', 'rules of origin',
    'china transshipment', 'origin fraud', 'circumvention',
    'minimum wage', 'labor provisions', 'worker protections',
    'ustr review', 'public comment period', 'trade representative',
    'congressional hearing', 'senate finance committee',
    'mexico position', 'canada position', 'trudeau trade',

    -- Customs and border
    'customs', 'border', 'cbp', 'customs and border protection',
    'port of entry', 'import restrictions', 'trade compliance',

    -- International trade
    'china trade', 'mexico trade', 'canada trade',
    'trade relations', 'trade sanctions', 'trade embargo',
    'wto', 'world trade organization', 'trade dispute',

    -- Economic policy
    'commerce department', 'ustr', 'trade representative',
    'trade deficit', 'trade surplus', 'trade balance',

    -- Supply chain
    'supply chain', 'manufacturing', 'reshoring', 'nearshoring',
    'semiconductor', 'critical minerals', 'rare earth'
  ],
  ARRAY[
    -- Exclude non-trade content
    'election', 'campaign', 'debate', 'voting',
    'entertainment', 'sports', 'weather', 'local news',
    'obituary', 'arts and culture', 'book review'
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
  RAISE NOTICE '';
  RAISE NOTICE '✅ Government Sources:';
  RAISE NOTICE '   • CBP Newsroom Spotlights (real-time customs updates, 30-min polling)';
  RAISE NOTICE '   • CBP Weekly Bulletins (rulings & regulations, 2-hour polling)';
  RAISE NOTICE '   • WTO News & Disputes (trade policy & tariff rulings, 2-hour polling)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trade Intelligence:';
  RAISE NOTICE '   • Journal of Commerce (JOC) (supply chain & port ops, 3-hour polling)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Comprehensive Coverage:';
  RAISE NOTICE '   • Customs clearance delays & holds';
  RAISE NOTICE '   • Documentation requirements';
  RAISE NOTICE '   • USMCA certificate compliance';
  RAISE NOTICE '   • Port congestion & vessel delays';
  RAISE NOTICE '   • Classification rulings (CBP & WTO)';
  RAISE NOTICE '   • Section 301/232 enforcement';
  RAISE NOTICE '   • WTO dispute settlements (affect tariff rates)';
  RAISE NOTICE '   • Anti-dumping & countervailing duty rulings';
  RAISE NOTICE '   • Supply chain disruptions & rate changes';
  RAISE NOTICE '   • Trade volume shifts (China, Mexico, Asia)';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 USMCA Renegotiation 2026 Monitoring:';
  RAISE NOTICE '   • RVC threshold changes (65% → 70%?)';
  RAISE NOTICE '   • China transshipment enforcement';
  RAISE NOTICE '   • Minimum wage requirements ($16/hr)';
  RAISE NOTICE '   • USTR public comment periods';
  RAISE NOTICE '   • Congressional hearings & positions';
  RAISE NOTICE '   • Mexico/Canada negotiation stance';
  RAISE NOTICE '   • Joint review timeline (July 2026)';
END $$;
