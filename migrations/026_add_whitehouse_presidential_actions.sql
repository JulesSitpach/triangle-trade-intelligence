-- ADD WHITE HOUSE PRESIDENTIAL ACTIONS RSS FEED
-- THE PRIMARY SOURCE for Executive Orders on tariffs, trade policy, Section 301/232
-- More authoritative than USTR - this is where trade policy ORIGINATES

-- ============================================================================
-- White House Presidential Actions - CRITICAL SOURCE
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
  'White House Presidential Actions',
  'https://www.whitehouse.gov/presidential-actions/feed/',
  'government',
  'Executive Orders, Presidential Memoranda, Proclamations - THE SOURCE of tariff policy changes, Section 301/232 modifications, trade emergencies',
  true,
  'critical',
  30,  -- Check every 30 minutes (high-impact, low-frequency)
  ARRAY[
    -- Tariff and Trade Policy (CRITICAL)
    'tariff', 'tariffs', 'duty', 'duties', 'import tax',
    'reciprocal tariff', 'tariff modification', 'tariff adjustment',
    'trade policy', 'trade agreement', 'trade action',

    -- Section 301/232 (CRITICAL for your users)
    'section 301', 'section 232', 'unfair trade',
    'national security', 'steel', 'aluminum',
    'trade investigation', 'trade remedy',

    -- USMCA and North American Trade
    'usmca', 'nafta', 'united states mexico canada',
    'north american', 'mexico', 'canada', 'canadian', 'mexican',
    'regional content', 'rules of origin',

    -- China Trade (Section 301 main target)
    'china', 'chinese', 'peoples republic',
    'unfair trade practice', 'intellectual property',
    'forced technology transfer', 'trade war',

    -- Executive Actions (the format)
    'executive order', 'presidential memorandum',
    'proclamation', 'emergency declaration',
    'immediate effect', 'hereby ordered',

    -- Import/Export Controls
    'import', 'export', 'customs', 'border',
    'commerce department', 'trade representative',
    'international trade', 'foreign trade',

    -- Emergency and Urgent Actions
    'emergency', 'immediate', 'national interest',
    'suspension', 'termination', 'modification',
    'effective immediately', 'hereby proclaimed',

    -- Product Categories (match user industries)
    'electronics', 'semiconductors', 'automotive',
    'machinery', 'textiles', 'agriculture',
    'manufacturing', 'industrial goods'
  ],
  ARRAY[
    -- Exclude non-trade content
    'nomination', 'appointment', 'ambassador',
    'judicial', 'court', 'judge',
    'holiday', 'observance', 'memorial',
    'flag', 'anthem', 'patriotic',
    'education', 'healthcare', 'immigration',
    'military deployment', 'defense budget',
    'environmental', 'climate', 'conservation'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  priority_level = EXCLUDED.priority_level,
  poll_frequency_minutes = EXCLUDED.poll_frequency_minutes,
  updated_at = NOW();

-- ============================================================================
-- Verify addition
-- ============================================================================
DO $$
DECLARE
  feed_exists BOOLEAN;
  critical_count INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM rss_feeds
    WHERE url = 'https://www.whitehouse.gov/presidential-actions/feed/'
  ) INTO feed_exists;

  SELECT COUNT(*) INTO critical_count
  FROM rss_feeds
  WHERE priority_level = 'critical' AND is_active = true;

  IF feed_exists THEN
    RAISE NOTICE '✅ WHITE HOUSE PRESIDENTIAL ACTIONS FEED ADDED';
    RAISE NOTICE '';
    RAISE NOTICE '🏛️ THE SOURCE OF TRADE POLICY:';
    RAISE NOTICE '   • Executive Orders on tariffs (immediate impact)';
    RAISE NOTICE '   • Section 301/232 modifications via EO';
    RAISE NOTICE '   • China trade policy changes';
    RAISE NOTICE '   • USMCA enforcement actions';
    RAISE NOTICE '   • Emergency trade declarations';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Poll Frequency: Every 30 minutes';
    RAISE NOTICE '🎯 Priority Level: CRITICAL';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Total Critical Feeds: %', critical_count;
    RAISE NOTICE '';
    RAISE NOTICE '💡 WHY THIS MATTERS:';
    RAISE NOTICE '   This is MORE authoritative than USTR - Presidential Actions';
    RAISE NOTICE '   are the ORIGIN of trade policy. When the President signs an';
    RAISE NOTICE '   Executive Order modifying tariffs, it appears HERE first.';
    RAISE NOTICE '';
    RAISE NOTICE '   Example from Nov 14, 2025:';
    RAISE NOTICE '   "Modifying Agricultural Product Tariffs" - Direct tariff changes';
    RAISE NOTICE '   affecting your users'' supply chains.';
  ELSE
    RAISE NOTICE '❌ Failed to add White House feed';
  END IF;
END $$;
