-- =====================================================
-- Migration: Create invoices table for Stripe webhook
-- Date: October 22, 2025
-- Purpose: CRITICAL FIX - Store Stripe invoice records
--          Required by webhook.js for payment_succeeded events
-- =====================================================

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,  -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT,  -- draft, open, paid, void, uncollectible
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id
ON invoices(stripe_invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer
ON invoices(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription
ON invoices(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user
ON invoices(user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status
ON invoices(status, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE invoices IS
'Stripe invoice records created by webhook.js when payment_succeeded events occur. Linked to user subscriptions.';

COMMENT ON COLUMN invoices.stripe_invoice_id IS
'Stripe invoice ID (e.g., in_xxx) - Unique identifier from Stripe API';

COMMENT ON COLUMN invoices.amount IS
'Invoice amount in cents (e.g., 29900 = $299.00)';

COMMENT ON COLUMN invoices.status IS
'Invoice status from Stripe: draft, open, paid, void, uncollectible';

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_timestamp ON invoices;
CREATE TRIGGER update_invoices_timestamp
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_timestamp();

-- Add RLS policies for security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can only view their own invoices
CREATE POLICY invoices_user_access ON invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert invoices (from webhook)
CREATE POLICY invoices_system_insert ON invoices
  FOR INSERT
  WITH CHECK (true);

-- System can update invoices
CREATE POLICY invoices_system_update ON invoices
  FOR UPDATE
  USING (true);
