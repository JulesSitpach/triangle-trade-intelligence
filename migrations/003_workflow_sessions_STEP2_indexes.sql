-- STEP 2: Create indexes (run after STEP 1 succeeds)
-- Run this second in Supabase SQL Editor

CREATE INDEX IF NOT EXISTS idx_workflow_sessions_user_id ON workflow_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_session_key ON workflow_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_status ON workflow_sessions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_last_accessed ON workflow_sessions(last_accessed DESC);
