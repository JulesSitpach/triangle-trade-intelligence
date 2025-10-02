-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void', 'payment_failed')),
  invoice_pdf TEXT, -- URL to Stripe-hosted PDF
  hosted_invoice_url TEXT, -- URL to Stripe-hosted invoice page
  invoice_number TEXT,
  description TEXT,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_customer_id ON invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_subscription_id ON invoices(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  USING (user_id = auth.uid());

-- Only system (service role) can insert/update/delete invoices
CREATE POLICY "Service role can manage invoices"
  ON invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE invoices IS 'Stores invoice records synced with Stripe';
COMMENT ON COLUMN invoices.amount IS 'Invoice amount in cents (e.g., 9900 = $99.00)';
COMMENT ON COLUMN invoices.status IS 'Invoice status synced from Stripe';
COMMENT ON COLUMN invoices.invoice_pdf IS 'URL to Stripe-hosted PDF version of invoice';
