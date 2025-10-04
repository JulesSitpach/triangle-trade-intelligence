-- STEP 3: Create trigger (run after STEP 2 succeeds)
-- Run this third in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_workflow_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_sessions_updated_at
    BEFORE UPDATE ON workflow_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_sessions_updated_at();
