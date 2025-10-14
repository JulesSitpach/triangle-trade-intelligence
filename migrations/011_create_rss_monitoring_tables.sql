-- RSS MONITORING SYSTEM TABLES
-- Enables real-time government feed monitoring for crisis alerts
-- Part of referral trial activation for Adam Williams & Anthony Robinson

-- ============================================================================
-- TABLE: rss_feeds
-- Stores RSS feed configurations for government sources
-- ============================================================================
CREATE TABLE IF NOT EXISTS rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'government', 'trade_news', 'industry'
  description TEXT,

  -- Monitoring configuration
  is_active BOOLEAN DEFAULT true,
  priority_level TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  poll_frequency_minutes INTEGER DEFAULT 30,

  -- Crisis detection keywords
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[], -- Keywords to detect crisis scenarios
  exclusion_keywords TEXT[] DEFAULT ARRAY[]::TEXT[], -- Keywords to exclude false positives

  -- Feed health tracking
  last_check_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- TABLE: rss_feed_activities
-- Stores RSS polling results and detected items
-- ============================================================================
CREATE TABLE IF NOT EXISTS rss_feed_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES rss_feeds(id) ON DELETE CASCADE,

  -- RSS Item Data
  item_guid TEXT, -- Unique identifier from RSS feed
  title TEXT,
  link TEXT,
  description TEXT,
  content TEXT,
  pub_date TIMESTAMPTZ,

  -- Crisis Detection Results
  crisis_keywords_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  crisis_score INTEGER DEFAULT 0, -- 0-10 scale based on keyword matches

  -- Polling Metadata
  status TEXT DEFAULT 'success', -- 'success', 'error', 'skipped'
  error_message TEXT,
  response_time_ms INTEGER,
  items_found INTEGER,
  new_items INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicate RSS items
  CONSTRAINT unique_feed_item UNIQUE (feed_id, item_guid)
);

-- ============================================================================
-- TABLE: crisis_alerts
-- Stores generated crisis alerts from RSS monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS crisis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source Information
  source_type TEXT NOT NULL, -- 'rss_feed', 'manual', 'api'
  source_id UUID, -- References rss_feeds.id if from RSS
  source_url TEXT,

  -- Alert Details
  title TEXT NOT NULL,
  description TEXT,
  severity_level TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  keywords_matched TEXT[] DEFAULT ARRAY[]::TEXT[],
  crisis_score INTEGER DEFAULT 0,

  -- Business Impact Analysis
  feed_category TEXT, -- Category from rss_feeds
  business_impact TEXT, -- AI-generated impact assessment
  recommended_actions TEXT, -- AI-generated action items
  affected_hs_codes TEXT[] DEFAULT ARRAY[]::TEXT[], -- Which HS codes are affected
  affected_industries TEXT[] DEFAULT ARRAY[]::TEXT[], -- Which industries are affected

  -- Alert Status
  is_active BOOLEAN DEFAULT true,
  requires_attention BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),

  -- User Notification Tracking
  notifications_sent INTEGER DEFAULT 0,
  last_notification_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Alert expiration (optional)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- rss_feeds indexes
CREATE INDEX IF NOT EXISTS idx_rss_feeds_active ON rss_feeds(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rss_feeds_category ON rss_feeds(category);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_priority ON rss_feeds(priority_level);

-- rss_feed_activities indexes
CREATE INDEX IF NOT EXISTS idx_rss_feed_activities_feed_id ON rss_feed_activities(feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_feed_activities_pub_date ON rss_feed_activities(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_rss_feed_activities_crisis_score ON rss_feed_activities(crisis_score DESC) WHERE crisis_score >= 3;
CREATE INDEX IF NOT EXISTS idx_rss_feed_activities_created_at ON rss_feed_activities(created_at DESC);

-- crisis_alerts indexes
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_active ON crisis_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON crisis_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_created_at ON crisis_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_requires_attention ON crisis_alerts(requires_attention) WHERE requires_attention = true;
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_source_type ON crisis_alerts(source_type);

-- ============================================================================
-- TRIGGERS for Automatic Timestamp Updates
-- ============================================================================

-- Update updated_at on rss_feeds
CREATE OR REPLACE FUNCTION update_rss_feeds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rss_feeds_timestamp
  BEFORE UPDATE ON rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION update_rss_feeds_updated_at();

-- Update updated_at on crisis_alerts
CREATE OR REPLACE FUNCTION update_crisis_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crisis_alerts_timestamp
  BEFORE UPDATE ON crisis_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_crisis_alerts_updated_at();

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================

COMMENT ON TABLE rss_feeds IS 'RSS feed configurations for government and trade news sources';
COMMENT ON TABLE rss_feed_activities IS 'RSS polling results and detected crisis items';
COMMENT ON TABLE crisis_alerts IS 'Generated crisis alerts from RSS monitoring system';

COMMENT ON COLUMN rss_feeds.keywords IS 'Crisis detection keywords (tariff, trade war, section 301, etc.)';
COMMENT ON COLUMN rss_feeds.exclusion_keywords IS 'Keywords to exclude false positives';
COMMENT ON COLUMN rss_feed_activities.crisis_score IS 'Crisis severity score 0-10 based on keyword matches';
COMMENT ON COLUMN crisis_alerts.severity_level IS 'Alert severity: critical, high, medium, low';
COMMENT ON COLUMN crisis_alerts.business_impact IS 'AI-generated business impact assessment';
COMMENT ON COLUMN crisis_alerts.recommended_actions IS 'AI-generated recommended actions';
