/**
 * Migration: Create industry_thresholds table
 * Purpose: Move hardcoded USMCA thresholds to database for regulatory flexibility
 * Date: October 24, 2025
 *
 * Benefits:
 * - Update thresholds without code deployment
 * - Track compliance audit history
 * - Add new industries through admin interface
 * - Implement effective dates for regulatory changes
 * - A/B test threshold interpretations
 */

-- Create industry thresholds table
CREATE TABLE IF NOT EXISTS public.industry_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Industry identification
  industry_key VARCHAR(50) NOT NULL UNIQUE,           -- "Electronics", "Automotive", etc.
  display_name VARCHAR(100) NOT NULL,                -- "Electronics & Technology", "Automotive & Transportation"

  -- USMCA qualification requirements
  rvc_percentage DECIMAL(4,1) NOT NULL,              -- Regional Value Content threshold (e.g., 65.0)
  labor_percentage DECIMAL(4,1) NOT NULL,            -- Labor credit allowed (e.g., 17.5)
  usmca_article VARCHAR(50) NOT NULL,                -- Article reference (e.g., "Annex 4-B Art. 4.7")
  qualification_method VARCHAR(100) NOT NULL,        -- "Net Cost", "Transaction Value", "Yarn Forward"

  -- Regulatory tracking
  effective_date DATE DEFAULT CURRENT_DATE,          -- When this threshold becomes active
  deprecated_date DATE,                              -- When threshold is superseded (NULL = still active)
  source_regulation VARCHAR(255),                    -- Reference to USMCA text or regulatory notice

  -- Audit trail
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT                                         -- Implementation notes, policy changes
);

-- Create indexes for fast lookups
CREATE INDEX idx_industry_thresholds_key ON public.industry_thresholds(industry_key);
CREATE INDEX idx_industry_thresholds_active ON public.industry_thresholds(is_active, effective_date);
CREATE INDEX idx_industry_thresholds_display ON public.industry_thresholds(display_name);

-- RLS: Anyone can read, only admins can write
ALTER TABLE public.industry_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read industry thresholds" ON public.industry_thresholds
  FOR SELECT USING (true);

CREATE POLICY "Write industry thresholds (admin only)" ON public.industry_thresholds
  FOR INSERT WITH CHECK (false);  -- Disable INSERT through RLS, use admin API only

CREATE POLICY "Update industry thresholds (admin only)" ON public.industry_thresholds
  FOR UPDATE USING (false);  -- Disable UPDATE through RLS, use admin API only

-- Seed with current hardcoded values (MVP baseline)
INSERT INTO public.industry_thresholds
  (industry_key, display_name, rvc_percentage, labor_percentage, usmca_article, qualification_method, source_regulation, is_active)
VALUES
  ('Automotive', 'Automotive & Transportation', 75.0, 22.5, 'Annex 4-B Art. 4.5', 'Net Cost', 'USMCA Chapter 4 (Automotive)', TRUE),
  ('Electronics', 'Electronics & Technology', 65.0, 17.5, 'Annex 4-B Art. 4.7', 'Transaction Value', 'USMCA Chapter 4 (Electronics)', TRUE),
  ('Textiles/Apparel', 'Textiles & Apparel', 55.0, 27.5, 'Annex 4-B Art. 4.3', 'Yarn Forward', 'USMCA Chapter 4 (Textiles)', TRUE),
  ('Chemicals', 'Chemicals & Materials', 62.5, 12.5, 'Article 4.2', 'Net Cost', 'USMCA Article 4.2', TRUE),
  ('Agriculture', 'Agriculture & Food', 60.0, 17.5, 'Annex 4-B Art. 4.4', 'Transaction Value', 'USMCA Chapter 4 (Agriculture)', TRUE),
  ('Machinery', 'Machinery & Equipment', 62.5, 12.5, 'Article 4.2', 'Net Cost', 'USMCA Article 4.2 (Default)', TRUE),
  ('Precision Instruments', 'Precision Instruments', 62.5, 12.5, 'Article 4.2', 'Net Cost', 'USMCA Article 4.2 (Default)', TRUE),
  ('Transport Equipment', 'Transport Equipment', 62.5, 15.0, 'Article 4.2', 'Net Cost', 'USMCA Article 4.2 (Default)', TRUE),
  ('Base Metals', 'Base Metals & Articles', 62.5, 12.5, 'Article 4.2', 'Net Cost', 'USMCA Article 4.2 (Default)', TRUE),
  ('Leather', 'Leather & Leather Goods', 55.0, 20.0, 'Annex 4-B Art. 4.3', 'Transaction Value', 'USMCA Chapter 4', TRUE),
  ('Wood Products', 'Wood & Wood Products', 62.5, 12.5, 'Article 4.2', 'Net Cost', 'USMCA Article 4.2 (Default)', TRUE),
  ('Plastics & Rubber', 'Plastics & Rubber', 62.5, 12.5, 'Article 4.2', 'Net Cost', 'USMCA Article 4.2 (Default)', TRUE),
  ('Default', 'General Manufacturing', 62.5, 15.0, 'Article 4.2', 'Net Cost or Transaction Value', 'USMCA Article 4.2 (Fallback)', TRUE);

-- Create logging table to track threshold lookups
CREATE TABLE IF NOT EXISTS public.industry_threshold_lookup_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lookup details
  requested_industry VARCHAR(100) NOT NULL,          -- What user selected
  mapped_to_key VARCHAR(50),                         -- What key was found
  source_type VARCHAR(20) NOT NULL,                  -- "database" or "hardcoded"
  threshold_used DECIMAL(4,1),                       -- RVC % that was applied

  -- Context
  user_id UUID REFERENCES auth.users(id),
  workflow_id UUID,
  company_name VARCHAR(255),

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for migration tracking
CREATE INDEX idx_threshold_lookup_source ON public.industry_threshold_lookup_log(source_type);
CREATE INDEX idx_threshold_lookup_industry ON public.industry_threshold_lookup_log(requested_industry);
