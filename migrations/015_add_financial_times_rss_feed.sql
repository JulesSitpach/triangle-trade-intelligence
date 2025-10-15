-- Migration 015: Add Financial Times RSS Feed for Trump Tariff Coverage
-- Date: October 15, 2025
-- Purpose: Add Financial Times as additional source for tariff policy monitoring

-- ============================================================================
-- Financial Times - Trump Tariffs Coverage
-- ============================================================================
-- Note: Financial Times RSS feeds may require subscription/authentication
-- This adds the feed configuration - RSS polling engine will handle auth via headers

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
  'Financial Times - Trump Tariffs',
  'https://www.ft.com/rss/trump-tariffs',
  'news',
  'Financial Times coverage of Trump administration tariff policies and trade impacts',
  true,
  'high',
  60, -- Check hourly (FT updates less frequently than government sources)
  ARRAY[
    -- Trump administration tariff actions
    'trump tariff', 'trump administration', 'section 301',
    'china tariff', 'tariff increase', 'tariff policy',

    -- Trade war and disputes
    'trade war', 'trade dispute', 'trade conflict',
    'retaliatory tariff', 'bilateral trade', 'trade negotiation',

    -- Economic impact
    'supply chain', 'manufacturing', 'import cost',
    'tariff impact', 'economic impact', 'trade impact',

    -- Countries and regions
    'china', 'mexico', 'canada', 'usmca', 'nafta',
    'european union', 'eu', 'vietnam', 'asia',

    -- Specific industries
    'electronics', 'automotive', 'steel', 'aluminum',
    'semiconductors', 'manufacturing', 'agriculture',

    -- Policy instruments
    'section 301', 'section 232', 'national security',
    'reciprocal tariff', 'most favored nation', 'mfn',

    -- Business impact
    'port fees', 'customs duty', 'import tax',
    'cost increase', 'price increase', 'inflation',

    -- Policy changes
    'tariff announcement', 'policy shift', 'new tariff',
    'tariff exemption', 'exclusion process'
  ],
  ARRAY[
    -- Exclude non-tariff financial news
    'stock market', 'earnings report', 'quarterly results',
    'ipo', 'merger', 'acquisition',
    'cryptocurrency', 'bitcoin', 'forex',
    'interest rate', 'federal reserve', 'central bank',

    -- Exclude general Trump news not related to tariffs
    'election', 'campaign', 'domestic policy',
    'immigration', 'climate', 'healthcare'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Alternative URLs if primary RSS feed doesn't work:
-- Option 1: FT World Trade RSS: 'https://www.ft.com/world/us/trade?format=rss'
-- Option 2: FT US Economy RSS: 'https://www.ft.com/world/us/economy?format=rss'
-- Option 3: Generic FT RSS with tariff filter: handled by keywords

-- Update rss_polling_engine.js to handle potential FT paywall:
-- Add note that FT may require:
-- - HTTP headers: User-Agent, Referer
-- - Authentication: API key or session cookie
-- - Rate limiting: Respect 429 responses

-- ============================================================================
-- Verify updated feed count
-- ============================================================================
DO $$
DECLARE
  feed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO feed_count FROM rss_feeds WHERE is_active = true;
  RAISE NOTICE '✅ RSS Monitoring Updated: % active feeds configured', feed_count;
  RAISE NOTICE '📡 Monitoring Sources:';
  RAISE NOTICE '   1. USTR Press Releases (government - critical)';
  RAISE NOTICE '   2. USITC News Releases (government - critical)';
  RAISE NOTICE '   3. Commerce ITA Press Releases (government - high)';
  RAISE NOTICE '   4. Federal Register CBP (government - high)';
  RAISE NOTICE '   5. Financial Times - Trump Tariffs (news - high) ⭐ NEW';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Enhanced Coverage:';
  RAISE NOTICE '   Government sources: Official policy announcements';
  RAISE NOTICE '   Financial Times: Analysis, business impact, early warnings';
END $$;

-- ============================================================================
-- Add configuration note to rss_feeds table metadata
-- ============================================================================
COMMENT ON COLUMN rss_feeds.url IS 'RSS feed URL - For Financial Times, may need authentication headers in polling engine';
