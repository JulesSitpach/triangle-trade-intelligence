-- ================================================================================
-- HTS Tariff Rates 2025 Database Schema
-- Official USITC Harmonized Tariff Schedule data with MFN and USMCA rates
-- ================================================================================

-- Create the main HTS tariff rates table
CREATE TABLE IF NOT EXISTS hts_tariff_rates_2025 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- HTS Classification
  hts8 TEXT NOT NULL UNIQUE,                    -- 8-digit HS code (e.g., "01012100")
  brief_description TEXT,                       -- Product description

  -- MFN (Most Favored Nation) Rates
  mfn_text_rate TEXT,                          -- Textual rate description
  mfn_rate_type_code TEXT,                     -- Rate type code
  mfn_ave TEXT,                                -- Average rate
  mfn_ad_val_rate DECIMAL(10,4) DEFAULT 0,     -- MFN ad valorem rate (as decimal, e.g., 0.05 = 5%)
  mfn_specific_rate DECIMAL(10,4) DEFAULT 0,   -- MFN specific rate
  mfn_other_rate DECIMAL(10,4) DEFAULT 0,      -- MFN other rate

  -- USMCA (US-Mexico-Canada Agreement) Rates
  usmca_indicator TEXT,                        -- USMCA applicability indicator
  usmca_rate_type_code TEXT,                   -- USMCA rate type
  usmca_ad_val_rate DECIMAL(10,4) DEFAULT 0,   -- USMCA ad valorem rate (as decimal, e.g., 0.00 = 0%)
  usmca_specific_rate DECIMAL(10,4) DEFAULT 0, -- USMCA specific rate
  usmca_other_rate DECIMAL(10,4) DEFAULT 0,    -- USMCA other rate

  -- Mexico Rates (Legacy NAFTA - for historical comparison)
  nafta_mexico_ind TEXT,                       -- NAFTA Mexico indicator
  mexico_rate_type_code TEXT,                  -- Mexico rate type
  mexico_ad_val_rate DECIMAL(10,4) DEFAULT 0,  -- Mexico ad valorem rate
  mexico_specific_rate DECIMAL(10,4) DEFAULT 0,-- Mexico specific rate

  -- Canada Rates (Legacy NAFTA - for historical comparison)
  nafta_canada_ind TEXT,                       -- NAFTA Canada indicator

  -- Effective Dates
  begin_effect_date DATE,                      -- Rate effective start date
  end_effective_date DATE,                     -- Rate effective end date

  -- Additional Classification Info
  quantity_1_code TEXT,                        -- First quantity unit code
  quantity_2_code TEXT,                        -- Second quantity unit code
  wto_binding_code TEXT,                       -- WTO binding code

  -- Special Program Indicators (for comprehensive trade intelligence)
  gsp_indicator TEXT,                          -- Generalized System of Preferences
  cbi_indicator TEXT,                          -- Caribbean Basin Initiative
  agoa_indicator TEXT,                         -- African Growth and Opportunity Act
  israel_fta_indicator TEXT,                   -- Israel FTA
  jordan_indicator TEXT,                       -- Jordan FTA
  singapore_indicator TEXT,                    -- Singapore FTA
  chile_indicator TEXT,                        -- Chile FTA
  australia_indicator TEXT,                    -- Australia FTA
  korea_indicator TEXT,                        -- Korea FTA
  colombia_indicator TEXT,                     -- Colombia FTA
  panama_indicator TEXT,                       -- Panama FTA
  peru_indicator TEXT,                         -- Peru FTA

  -- Administrative Fields
  footnote_comment TEXT,                       -- Any footnotes or comments
  additional_duty TEXT,                        -- Additional duty information

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT DEFAULT 'USITC HTS 2025',

  -- Constraints
  CONSTRAINT valid_mfn_rate CHECK (mfn_ad_val_rate >= 0 AND mfn_ad_val_rate <= 1),
  CONSTRAINT valid_usmca_rate CHECK (usmca_ad_val_rate >= 0 AND usmca_ad_val_rate <= 1),
  CONSTRAINT valid_mexico_rate CHECK (mexico_ad_val_rate >= 0 AND mexico_ad_val_rate <= 1)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_hts_tariff_rates_hts8 ON hts_tariff_rates_2025(hts8);
CREATE INDEX IF NOT EXISTS idx_hts_tariff_rates_description ON hts_tariff_rates_2025 USING gin(to_tsvector('english', brief_description));
CREATE INDEX IF NOT EXISTS idx_hts_tariff_rates_usmca ON hts_tariff_rates_2025(usmca_indicator) WHERE usmca_indicator IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hts_tariff_rates_effective_date ON hts_tariff_rates_2025(begin_effect_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hts_tariff_rates_updated_at BEFORE UPDATE
  ON hts_tariff_rates_2025 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy querying of savings potential
CREATE OR REPLACE VIEW hts_usmca_savings AS
SELECT
  hts8,
  brief_description,
  mfn_ad_val_rate,
  usmca_ad_val_rate,
  (mfn_ad_val_rate - usmca_ad_val_rate) AS savings_rate,
  ROUND(((mfn_ad_val_rate - usmca_ad_val_rate) / NULLIF(mfn_ad_val_rate, 0)) * 100, 2) AS savings_percentage,
  begin_effect_date,
  CASE
    WHEN (mfn_ad_val_rate - usmca_ad_val_rate) > 0.10 THEN 'HIGH'
    WHEN (mfn_ad_val_rate - usmca_ad_val_rate) > 0.05 THEN 'MEDIUM'
    WHEN (mfn_ad_val_rate - usmca_ad_val_rate) > 0 THEN 'LOW'
    ELSE 'NONE'
  END AS savings_tier
FROM hts_tariff_rates_2025
WHERE usmca_ad_val_rate IS NOT NULL
  AND mfn_ad_val_rate > usmca_ad_val_rate;

-- Add RLS (Row Level Security) policies
ALTER TABLE hts_tariff_rates_2025 ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users"
  ON hts_tariff_rates_2025 FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policy: Allow write access only to service role (admin/API imports)
CREATE POLICY "Allow write access to service role only"
  ON hts_tariff_rates_2025 FOR ALL
  USING (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON TABLE hts_tariff_rates_2025 IS 'Official USITC Harmonized Tariff Schedule 2025 with MFN and USMCA rates';
COMMENT ON COLUMN hts_tariff_rates_2025.hts8 IS '8-digit Harmonized System code';
COMMENT ON COLUMN hts_tariff_rates_2025.mfn_ad_val_rate IS 'Most Favored Nation ad valorem rate (0.05 = 5%)';
COMMENT ON COLUMN hts_tariff_rates_2025.usmca_ad_val_rate IS 'USMCA preferential rate (0.00 = 0%)';
COMMENT ON COLUMN hts_tariff_rates_2025.begin_effect_date IS 'Date when tariff rates became effective';
COMMENT ON VIEW hts_usmca_savings IS 'View showing potential USMCA savings for each HS code';
