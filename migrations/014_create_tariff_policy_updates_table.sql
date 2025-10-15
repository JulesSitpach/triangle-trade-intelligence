-- Migration 014: Create tariff_policy_updates table for RSS-to-AI-prompt integration
-- Date: October 15, 2025
-- Purpose: Store tariff policy changes from RSS feeds to dynamically update AI prompts

-- Create tariff_policy_updates table
CREATE TABLE IF NOT EXISTS tariff_policy_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy identification
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  effective_date DATE,

  -- Policy categorization
  policy_type TEXT NOT NULL CHECK (policy_type IN (
    'section_301',           -- Section 301 China tariffs
    'port_fees',             -- Chinese ship port fees
    'bilateral_deal',        -- Bilateral trade deals
    'investigation',         -- USITC investigations
    'antidumping',          -- Antidumping duties
    'countervailing',       -- Countervailing duties
    'hts_classification',   -- HTS code changes
    'usmca_ruling',         -- USMCA interpretations
    'other'                 -- Other policy changes
  )),

  -- Affected entities
  affected_countries TEXT[] DEFAULT '{}',  -- Array of country codes: ['CN', 'MX', 'VN']
  affected_hs_codes TEXT[] DEFAULT '{}',   -- Array of HS codes: ['8537.10', '8542.31']

  -- Tariff adjustment details
  tariff_adjustment TEXT NOT NULL,         -- Human-readable: 'China +100%', 'Port fees +3%'
  adjustment_percentage DECIMAL(10,2),     -- Numeric value: 100.00, 3.00
  base_rate_change BOOLEAN DEFAULT false,  -- Does this change base MFN rates?

  -- AI prompt integration
  prompt_text TEXT NOT NULL,               -- Text to inject into AI prompts
  is_active BOOLEAN DEFAULT true,          -- Include in active AI prompts?
  priority INTEGER DEFAULT 5,              -- Priority order in prompt (1=highest, 10=lowest)

  -- Source tracking
  source_rss_item_id UUID REFERENCES rss_feed_activities(id),
  source_url TEXT,
  source_feed_name TEXT,

  -- Admin workflow
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- RSS item detected, awaiting admin review
    'approved',   -- Admin approved, will be included in AI prompts
    'rejected',   -- Admin rejected, will NOT be included
    'expired'     -- Policy no longer active
  )),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- When this policy expires (if known)

  -- Notes
  admin_notes TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_tariff_policy_updates_is_active ON tariff_policy_updates(is_active);
CREATE INDEX idx_tariff_policy_updates_status ON tariff_policy_updates(status);
CREATE INDEX idx_tariff_policy_updates_policy_type ON tariff_policy_updates(policy_type);
CREATE INDEX idx_tariff_policy_updates_effective_date ON tariff_policy_updates(effective_date);
CREATE INDEX idx_tariff_policy_updates_priority ON tariff_policy_updates(priority);
CREATE INDEX idx_tariff_policy_updates_affected_countries ON tariff_policy_updates USING GIN (affected_countries);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tariff_policy_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tariff_policy_updates_updated_at
  BEFORE UPDATE ON tariff_policy_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_tariff_policy_updates_updated_at();

-- Add comments for documentation
COMMENT ON TABLE tariff_policy_updates IS 'Stores tariff policy changes from RSS feeds to dynamically update AI prompts with current 2025 policy context';
COMMENT ON COLUMN tariff_policy_updates.policy_type IS 'Type of policy change (section_301, port_fees, bilateral_deal, etc.)';
COMMENT ON COLUMN tariff_policy_updates.tariff_adjustment IS 'Human-readable description of tariff change (e.g., "China +100%")';
COMMENT ON COLUMN tariff_policy_updates.prompt_text IS 'Text to inject into AI prompts for this policy update';
COMMENT ON COLUMN tariff_policy_updates.is_active IS 'Whether this policy should be included in active AI prompts';
COMMENT ON COLUMN tariff_policy_updates.priority IS 'Priority order in prompt (1=highest priority, 10=lowest)';
COMMENT ON COLUMN tariff_policy_updates.status IS 'Admin review status: pending, approved, rejected, or expired';

-- Seed with current 2025 policies
INSERT INTO tariff_policy_updates (
  title,
  description,
  effective_date,
  policy_type,
  affected_countries,
  tariff_adjustment,
  adjustment_percentage,
  prompt_text,
  is_active,
  priority,
  status,
  source_url,
  reviewed_by,
  reviewed_at
) VALUES
(
  'Section 301 China Tariff Increase',
  'Trump Administration Section 301 tariffs increased by 100% on Chinese imports effective November 1, 2025',
  '2025-11-01',
  'section_301',
  ARRAY['CN'],
  'China +100%',
  100.00,
  'Section 301 China Tariffs: +100% increase effective Nov 1st, 2025 - Add 100% to base MFN rate for all Chinese imports',
  true,
  1,
  'approved',
  'https://ustr.gov/about-us/policy-offices/press-office/press-releases',
  'System',
  NOW()
),
(
  'Chinese Ship Port Fees',
  'New fees on all Chinese-flagged vessels entering US ports, adds approximately 2-5% to total landed cost',
  '2025-10-01',
  'port_fees',
  ARRAY['CN'],
  'Port fees +3%',
  3.00,
  'Chinese Ship Port Fees: New fees on Chinese-flagged vessels add ~2-5% effective cost (estimate +3% on landed cost)',
  true,
  2,
  'approved',
  'https://www.trade.gov/rss/ita_press_releases.xml',
  'System',
  NOW()
),
(
  'Vietnam/Thailand Transshipment Investigation',
  'USITC investigation into transshipment of Chinese goods through Vietnam and Thailand, potential additional tariffs',
  '2025-09-15',
  'investigation',
  ARRAY['VN', 'TH'],
  'Under investigation +25%',
  25.00,
  'Vietnam/Thailand: Under investigation for transshipment (potential +25% tariffs if confirmed)',
  true,
  3,
  'approved',
  'https://www.usitc.gov/press_room/news_releases/rss.xml',
  'System',
  NOW()
),
(
  'EU Energy Crisis Manufacturing Impact',
  'European energy crisis affecting manufacturing costs, indirect cost pressure on EU imports',
  '2025-08-01',
  'other',
  ARRAY['DE', 'FR', 'IT', 'ES'],
  'EU manufacturing +30%',
  30.00,
  'EU: Energy crisis affecting manufacturing costs (+25-35% indirect cost pressure on EU imports)',
  true,
  4,
  'approved',
  'https://www.ft.com/trump-tariffs',
  'System',
  NOW()
);

-- Grant permissions (adjust for your setup)
-- ALTER TABLE tariff_policy_updates ENABLE ROW LEVEL SECURITY;
