-- Migration 021: Add Al Jazeera RSS Feed for International Trade Coverage
-- Date: October 16, 2025
-- Purpose: Add Al Jazeera as international news source for global trade policy monitoring

-- ============================================================================
-- Al Jazeera - International Trade & Economic Coverage
-- ============================================================================
-- Al Jazeera provides international perspective on:
-- - Middle East trade dynamics
-- - China-US trade relations from global viewpoint
-- - International supply chain disruptions
-- - Energy and commodity impacts on trade
-- - Geopolitical events affecting trade routes

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
  'Al Jazeera - International Trade',
  'https://www.aljazeera.com/xml/rss/all.xml',
  'news',
  'Al Jazeera international coverage of global trade, tariffs, and economic policy',
  true,
  'medium',
  60, -- Check hourly for international news
  ARRAY[
    -- US Trade Policy
    'us trade', 'us tariff', 'trump tariff', 'biden trade',
    'section 301', 'trade war', 'trade dispute',

    -- International trade agreements
    'trade agreement', 'free trade', 'tariff', 'tariffs',
    'customs', 'import', 'export', 'trade policy',

    -- Economy section (high-quality trade coverage)
    'economy', 'economic', 'economics',

    -- Countries and regions (key trade partners)
    'china trade', 'mexico trade', 'canada trade',
    'usmca', 'nafta', 'vietnam trade',
    'european union', 'middle east trade',

    -- Supply chain and logistics
    'supply chain', 'shipping', 'port', 'logistics',
    'freight', 'container shipping', 'maritime',
    'port fees', 'port fee', 'shipping fees',

    -- Economic impact
    'manufacturing', 'semiconductor', 'electronics',
    'automotive', 'steel', 'aluminum', 'oil',

    -- Trade disruptions
    'trade sanctions', 'embargo', 'blockade',
    'suez canal', 'strait of hormuz', 'red sea',

    -- Energy and commodities (trade impact)
    'oil price', 'crude oil', 'natural gas',
    'commodity', 'raw material', 'rare earth',

    -- Geopolitical events affecting trade
    'economic sanctions', 'trade ban', 'export control',
    'import restriction', 'protectionism',

    -- Business and economics
    'international business', 'multinational',
    'cross-border trade', 'trade route',

    -- Regional trade developments
    'asia pacific', 'middle east economy',
    'latin america trade', 'africa trade'
  ],
  ARRAY[
    -- Exclude non-trade content
    'sports', 'football', 'soccer', 'cricket',
    'entertainment', 'celebrity', 'film', 'music',

    -- Exclude internal politics (unless trade-related)
    'election campaign', 'political rally',
    'domestic policy' -- will still catch "trade policy"

    -- Exclude unrelated conflicts
    'civil war' -- unless "trade war"
    'terrorism', 'extremist',

    -- Exclude social issues (unless economic)
    'human rights' -- unless "trade and human rights"
    'religious', 'cultural festival',

    -- Exclude regional news not affecting trade
    'local government', 'municipal',
    'education reform', 'school',

    -- Financial markets (covered by FT)
    'stock market', 'stock exchange',
    'ipo', 'earnings report',
    'cryptocurrency', 'bitcoin'
  ]
) ON CONFLICT (url) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  exclusion_keywords = EXCLUDED.exclusion_keywords,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- Alternative Al Jazeera RSS feeds if needed:
-- ============================================================================
-- Option 1: Al Jazeera Economy: 'https://www.aljazeera.com/xml/rss/economy.xml'
-- Option 2: Al Jazeera Business: 'https://www.aljazeera.com/xml/rss/business.xml'
-- Option 3: Al Jazeera US: 'https://www.aljazeera.com/xml/rss/us.xml'
-- Current: All topics feed with keyword filtering for trade relevance

-- ============================================================================
-- Why Al Jazeera for Triangle Trade Intelligence?
-- ============================================================================
-- 1. International Perspective: Non-US viewpoint on US trade policy
-- 2. Middle East Coverage: Oil, energy trade impacts on shipping costs
-- 3. Global Supply Chain: Focus on Asia-Pacific, Middle East trade routes
-- 4. China Coverage: Independent reporting on US-China trade dynamics
-- 5. Mexico & Latin America: Regional trade developments affecting USMCA
-- 6. Geopolitical Context: How global events affect trade and tariffs

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
  RAISE NOTICE '   5. Financial Times - Trump Tariffs (news - high)';
  RAISE NOTICE '   6. Al Jazeera - International Trade (news - medium) ⭐ NEW';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Enhanced Global Coverage:';
  RAISE NOTICE '   Government sources: Official US policy announcements';
  RAISE NOTICE '   Financial Times: Western business analysis and impact';
  RAISE NOTICE '   Al Jazeera: International perspective and global trade events';
  RAISE NOTICE '';
  RAISE NOTICE '🌍 Geographic Coverage:';
  RAISE NOTICE '   North America: USTR, USITC, Commerce, CBP';
  RAISE NOTICE '   Europe: Financial Times';
  RAISE NOTICE '   Global: Al Jazeera (Middle East, Asia-Pacific, Latin America)';
END $$;

-- ============================================================================
-- Add configuration notes
-- ============================================================================
COMMENT ON COLUMN rss_feeds.priority_level IS 'critical = government sources | high = financial news | medium = international news';
