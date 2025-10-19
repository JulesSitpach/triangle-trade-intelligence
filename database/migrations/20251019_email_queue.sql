-- Email Queue System
-- Created: October 19, 2025
-- Purpose: Reliable email delivery with retry logic

-- =======================
-- EMAIL QUEUE TABLE
-- =======================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email Details
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,

  -- Metadata
  email_type TEXT NOT NULL,  -- 'crisis_alert', 'service_confirmation', 'trial_expiration', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  related_id UUID,  -- crisis_alert.id, service_request.id, etc.

  -- Delivery Status
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'sending', 'sent', 'failed', 'cancelled'
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When to send (allows scheduling)
  sent_at TIMESTAMPTZ,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Error Tracking
  error_message TEXT,
  error_code TEXT,
  resend_message_id TEXT,  -- Resend API message ID (for tracking)

  -- Priority
  priority INTEGER NOT NULL DEFAULT 5,  -- 1=highest, 10=lowest

  -- Additional Data
  metadata JSONB  -- Custom data for email template
);

-- =======================
-- INDEXES
-- =======================

-- Index for pending emails to process
CREATE INDEX idx_email_queue_pending
ON email_queue(status, scheduled_for, priority)
WHERE status IN ('pending', 'sending');

-- Index for user email history
CREATE INDEX idx_email_queue_user
ON email_queue(user_id, created_at DESC);

-- Index for retry queue
CREATE INDEX idx_email_queue_retry
ON email_queue(next_retry_at, retry_count)
WHERE status = 'failed' AND retry_count < max_retries;

-- Index for email type filtering
CREATE INDEX idx_email_queue_type
ON email_queue(email_type, status, created_at DESC);

-- =======================
-- ROW LEVEL SECURITY
-- =======================

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (API endpoints)
CREATE POLICY "Service role full access"
ON email_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can view their own email history
CREATE POLICY "Users view own emails"
ON email_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =======================
-- HELPER FUNCTIONS
-- =======================

-- Function to automatically calculate next retry time
CREATE OR REPLACE FUNCTION calculate_next_retry(
  current_retry_count INTEGER
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  retry_delay_minutes INTEGER;
BEGIN
  -- Exponential backoff: 5, 15, 30 minutes
  retry_delay_minutes := CASE
    WHEN current_retry_count = 0 THEN 5
    WHEN current_retry_count = 1 THEN 15
    WHEN current_retry_count = 2 THEN 30
    ELSE 60
  END;

  RETURN NOW() + (retry_delay_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to mark email as failed and schedule retry
CREATE OR REPLACE FUNCTION mark_email_failed(
  email_id UUID,
  error_msg TEXT,
  error_code_val TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  current_retries INTEGER;
  max_retries_val INTEGER;
BEGIN
  -- Get current retry count
  SELECT retry_count, max_retries
  INTO current_retries, max_retries_val
  FROM email_queue
  WHERE id = email_id;

  -- Check if we should retry
  IF current_retries < max_retries_val THEN
    -- Schedule retry
    UPDATE email_queue
    SET
      status = 'failed',
      retry_count = retry_count + 1,
      last_retry_at = NOW(),
      next_retry_at = calculate_next_retry(retry_count),
      error_message = error_msg,
      error_code = error_code_val
    WHERE id = email_id;
  ELSE
    -- Max retries exceeded - mark as permanently failed
    UPDATE email_queue
    SET
      status = 'failed',
      error_message = error_msg || ' (Max retries exceeded)',
      error_code = error_code_val
    WHERE id = email_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- EMAIL QUEUE STATISTICS VIEW
-- =======================

CREATE OR REPLACE VIEW email_queue_stats AS
SELECT
  email_type,
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries,
  MAX(created_at) as last_queued
FROM email_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY email_type, status
ORDER BY email_type, status;

-- =======================
-- VERIFICATION QUERIES
-- =======================

/*
-- Check pending emails to process
SELECT id, email_type, recipient_email, scheduled_for, priority
FROM email_queue
WHERE status = 'pending' AND scheduled_for <= NOW()
ORDER BY priority ASC, scheduled_for ASC
LIMIT 10;

-- Check failed emails eligible for retry
SELECT id, email_type, recipient_email, retry_count, next_retry_at, error_message
FROM email_queue
WHERE status = 'failed' AND retry_count < max_retries AND next_retry_at <= NOW()
ORDER BY next_retry_at ASC
LIMIT 10;

-- Email queue health
SELECT * FROM email_queue_stats;
*/

-- =======================
-- CLEANUP POLICY
-- =======================

-- Function to clean up old sent emails (run monthly)
CREATE OR REPLACE FUNCTION cleanup_old_emails() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sent emails older than 90 days
  DELETE FROM email_queue
  WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

/*
-- Run cleanup manually:
SELECT cleanup_old_emails();

-- Or schedule with pg_cron (if available):
SELECT cron.schedule('cleanup-emails', '0 2 * * 0', 'SELECT cleanup_old_emails()');
*/
