-- Create api_health_logs table for monitoring external API health
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS api_health_logs (
  id BIGSERIAL PRIMARY KEY,
  api_name TEXT NOT NULL,              -- 'usitc_dataweb', 'openrouter', etc.
  status_code INTEGER NOT NULL,        -- HTTP status (200, 503, 0 for network error)
  is_healthy BOOLEAN NOT NULL,         -- true if 200 OK
  response_time_ms INTEGER,            -- Response time in milliseconds
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,                  -- Error details if unhealthy
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_api_health_logs_api_name ON api_health_logs(api_name);
CREATE INDEX idx_api_health_logs_checked_at ON api_health_logs(checked_at DESC);
CREATE INDEX idx_api_health_logs_is_healthy ON api_health_logs(is_healthy);

-- Enable Row Level Security
ALTER TABLE api_health_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything (for cron jobs)
CREATE POLICY "Service role full access" ON api_health_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read (for dashboard)
CREATE POLICY "Authenticated users can read" ON api_health_logs
  FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON TABLE api_health_logs IS 'Logs health checks for external APIs (USITC, OpenRouter, etc.)';
COMMENT ON COLUMN api_health_logs.api_name IS 'Name of the API being monitored';
COMMENT ON COLUMN api_health_logs.status_code IS 'HTTP status code (200, 503, etc.) or 0 for network error';
COMMENT ON COLUMN api_health_logs.is_healthy IS 'True if API returned 200 OK';
COMMENT ON COLUMN api_health_logs.response_time_ms IS 'Response time in milliseconds';
COMMENT ON COLUMN api_health_logs.error_message IS 'Error message if health check failed';
