-- Migration: Performance Optimization Indexes
-- Date: 2025-10-02
-- Description: Add indexes for frequently queried columns to improve performance

-- Index for user lookups by email (login queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email
ON user_profiles(email);

-- Index for user lookups by status (active users)
CREATE INDEX IF NOT EXISTS idx_user_profiles_status
ON user_profiles(status)
WHERE status = 'active';

-- Index for user lookups by subscription tier
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier
ON user_profiles(subscription_tier);

-- Index for service requests by user (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_service_requests_user_created
ON service_requests(user_id, created_at DESC);

-- Index for service requests by status (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created
ON service_requests(status, created_at DESC);

-- Index for service requests by service type
CREATE INDEX IF NOT EXISTS idx_service_requests_type
ON service_requests(service_type);

-- Composite index for trial user queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_composite
ON user_profiles(status, subscription_tier)
WHERE status = 'trial';

-- Index for workflow sessions by user (workflow restore queries)
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_user_updated
ON workflow_sessions(user_id, updated_at DESC);

-- Index for subscriptions by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user
ON subscriptions(user_id);

-- Index for subscriptions by Stripe subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
ON subscriptions(stripe_subscription_id);

-- Index for invoices by user
CREATE INDEX IF NOT EXISTS idx_invoices_user_created
ON invoices(user_id, created_at DESC);

-- Index for user preferences by user
CREATE INDEX IF NOT EXISTS idx_user_preferences_user
ON user_preferences(user_id);

-- Add comments for documentation
COMMENT ON INDEX idx_user_profiles_email IS 'Optimizes login queries by email';
COMMENT ON INDEX idx_service_requests_user_created IS 'Optimizes user dashboard service request queries';
COMMENT ON INDEX idx_service_requests_status_created IS 'Optimizes admin dashboard queries by status';
COMMENT ON INDEX idx_user_profiles_trial_composite IS 'Optimizes trial expiration queries';
COMMENT ON INDEX idx_workflow_sessions_user_updated IS 'Optimizes workflow data restoration';
