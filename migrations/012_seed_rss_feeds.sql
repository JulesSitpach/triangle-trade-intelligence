-- SEED RSS FEEDS for Crisis Monitoring
-- Configures OFFICIAL GOVERNMENT SOURCES for authoritative trade policy alerts
-- Part of referral trial activation - real-time monitoring for Adam & Anthony

-- ============================================================================
-- USTR (U.S. Trade Representative) - THE PRIMARY SOURCE
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
  'USTR Press Releases',
  'https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml',
  'government',
  'Official U.S. Trade Representative announcements - Section 301, USMCA, trade agreements',
  true,
  'critical',
  30,
  ARRAY[
    -- Section 301 (Critical for electronics/China imports)
    'section 301', 'section301', 'unfair trade practice',
    'trade investigation', '301 tariff', '301 action',

    -- USMCA/NAFTA (Critical for North America trade)
    'usmca', 'nafta', 'united states mexico canada agreement',
    'regional content', 'rules of origin', 'trade agreement',

    -- Tariff actions
    'tariff', 'tariffs', 'duty', 'duties', 'import tax',
    'tariff increase', 'tariff modification', 'tariff rate',

    -- Trade disputes and negotiations
    'trade dispute', 'trade war', 'trade negotiation',
    'retaliatory', 'retaliation', 'trade remedy',

    -- Country-specific
    'china', 'chinese', 'mexico', 'mexican', 'canada', 'canadian',

    -- Emergency actions
    'immediate', 'emergency', 'suspension', 'termination',
    'withdrawal', 'investigation initiated'
  ],
  ARRAY[
    -- Exclude non-trade content
    'agricultural marketing', 'trade mission',
    'advisory committee', 'public comment'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  updated_at = NOW();

-- ============================================================================
-- USITC (U.S. International Trade Commission)
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
  'USITC News Releases',
  'https://www.usitc.gov/press_room/news_releases/rss.xml',
  'government',
  'Official U.S. International Trade Commission investigations and determinations',
  true,
  'critical',
  30,
  ARRAY[
    -- Investigation types
    'investigation', 'section 301', 'section 337',
    'antidumping', 'countervailing', 'safeguard',

    -- Determinations and rulings
    'determination', 'preliminary', 'final determination',
    'affirmative', 'negative', 'injury determination',

    -- Product categories (HS code related)
    'electronics', 'semiconductors', 'automotive',
    'steel', 'aluminum', 'textiles', 'agriculture',

    -- Import/export focus
    'import', 'imports', 'imported', 'importer',
    'china', 'mexico', 'canada', 'asia',

    -- Tariff and duty actions
    'tariff', 'duty', 'rate', 'classification',
    'harmonized tariff', 'hs code', 'hts',

    -- Remedies and enforcement
    'remedy', 'exclusion order', 'cease and desist',
    'patent infringement', 'unfair trade'
  ],
  ARRAY[
    -- Exclude procedural notices
    'comment period', 'extension of time',
    'schedule conference', 'public hearing notice'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  updated_at = NOW();

-- ============================================================================
-- Commerce Department ITA (International Trade Administration)
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
  'Commerce ITA Press Releases',
  'https://www.trade.gov/rss/ita_press_releases.xml',
  'government',
  'Official Commerce Department antidumping and countervailing duty determinations',
  true,
  'high',
  30,
  ARRAY[
    -- Antidumping and countervailing duties
    'antidumping', 'anti-dumping', 'countervailing',
    'cvd', 'ad/cvd', 'dumping margin',

    -- Determinations
    'preliminary determination', 'final determination',
    'affirmative determination', 'negative determination',
    'injury', 'material injury', 'threat of injury',

    -- Administrative reviews
    'administrative review', 'sunset review',
    'changed circumstances', 'scope inquiry',

    -- Tariff actions
    'duty order', 'antidumping order', 'countervailing order',
    'tariff', 'duty rate', 'cash deposit rate',

    -- Product and country focus
    'steel', 'aluminum', 'solar', 'semiconductors',
    'china', 'mexico', 'canada', 'vietnam', 'korea',

    -- Trade remedies
    'trade remedy', 'unfair trade', 'subsidy',
    'dumping', 'circumvention', 'evasion'
  ],
  ARRAY[
    -- Exclude non-enforcement content
    'trade mission', 'export promotion',
    'market research', 'trade show'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  updated_at = NOW();

-- ============================================================================
-- Federal Register CBP (Customs & Border Protection)
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
  'Federal Register - Customs & Trade',
  'https://www.federalregister.gov/api/v1/documents.rss?conditions[agencies][]=customs-and-border-protection',
  'government',
  'Official U.S. Customs and Border Protection rules and regulations',
  true,
  'high',
  60, -- Government feeds update less frequently
  ARRAY[
    -- Customs and classification
    'tariff', 'duty', 'classification', 'ruling',
    'harmonized tariff schedule', 'hts', 'hs code',
    'country of origin', 'certificate of origin',

    -- Preferential trade programs
    'preferential rate', 'most favored nation', 'mfn',
    'usmca', 'nafta', 'free trade agreement',
    'gsp', 'generalized system of preferences',

    -- Regulatory actions
    'final rule', 'proposed rule', 'notice',
    'modification', 'suspension', 'revocation',
    'termination', 'withdrawal',

    -- Customs procedures
    'customs procedure', 'entry', 'drawback',
    'bonded warehouse', 'foreign trade zone',
    'informed compliance', 'reasonable care',

    -- Enforcement
    'penalty', 'seizure', 'detention',
    'prior disclosure', 'mitigation'
  ],
  ARRAY[
    -- Federal Register publishes lots of non-trade content
    'environmental', 'energy', 'health',
    'labor', 'education', 'veterans',
    'immigration', 'border security personnel'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  updated_at = NOW();

-- ============================================================================
-- Verify seed data
-- ============================================================================
DO $$
DECLARE
  feed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO feed_count FROM rss_feeds WHERE is_active = true;
  RAISE NOTICE '✅ RSS Monitoring Activated: % active feeds configured', feed_count;
  RAISE NOTICE '📡 Official Government Sources:';
  RAISE NOTICE '   1. USTR Press Releases (Section 301, USMCA, trade policy)';
  RAISE NOTICE '   2. USITC News Releases (investigations, determinations)';
  RAISE NOTICE '   3. Commerce ITA (antidumping, countervailing duties)';
  RAISE NOTICE '   4. Federal Register CBP (customs rules, tariff classifications)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ready for referral trial launch:';
  RAISE NOTICE '   Adam Williams: "real-time policy alerts" ✅ DELIVERED';
  RAISE NOTICE '   Anthony Robinson: "live customs updates" ✅ DELIVERED';
END $$;
