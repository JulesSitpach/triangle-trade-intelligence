# DEPLOYMENT ROLLBACK PROCEDURE
**Triangle Intelligence Platform - Emergency Recovery**

**Last Updated**: October 19, 2025

---

## 🚨 WHEN TO ROLLBACK

Execute this procedure immediately if you encounter:

- **Critical bugs** affecting user workflows (payment failures, data loss)
- **Database corruption** or migration failures
- **Authentication system failures** (users locked out)
- **API integration failures** (OpenRouter/Anthropic/Stripe down >30 min)
- **Performance degradation** (>5s page loads, timeouts)
- **Security vulnerabilities** discovered in production

---

## ⚡ QUICK ROLLBACK (5 minutes)

### Step 1: Revert Vercel Deployment

**Via Vercel Dashboard (Fastest)**:
1. Go to https://vercel.com/jules-sitpach/triangle-trade-intelligence
2. Click "Deployments" tab
3. Find the last **stable deployment** (before the issue)
4. Click three dots (•••) → "Promote to Production"
5. Confirm promotion

**Via Vercel CLI** (if dashboard unavailable):
```bash
# Login to Vercel
vercel login

# List recent deployments
vercel list

# Find stable deployment URL (before issue)
# Copy the deployment URL

# Rollback to specific deployment
vercel alias set <deployment-url> triangle-trade-intelligence.vercel.app

# Example:
vercel alias set triangle-trade-intelligence-abc123.vercel.app triangle-trade-intelligence.vercel.app
```

**Verification**:
- Check https://triangle-trade-intelligence.vercel.app
- Verify version number in footer (should match stable deployment)
- Test critical user flow: Login → Workflow → Results

---

### Step 2: Database Migration Rollback (if applicable)

**Check if migration caused the issue**:
```sql
-- Connect to Supabase (mrwitpgbcaxgnirqtavt)
-- Check recent migrations
SELECT * FROM _migrations
ORDER BY executed_at DESC
LIMIT 5;
```

**If migration was applied in last 24 hours**:

1. **Option A: Manual Rollback SQL**
   - Locate rollback file: `database/migrations/YYYYMMDD_*_rollback.sql`
   - Execute rollback via Supabase SQL Editor
   - Example:
   ```sql
   -- Rollback production_indexes migration
   DROP INDEX IF EXISTS idx_crisis_alerts_active_date;
   DROP INDEX IF EXISTS idx_crisis_alerts_hs_codes;
   -- ... (drop all indexes created)
   ```

2. **Option B: Restore Database Snapshot** (nuclear option)
   - Go to Supabase Dashboard → Database → Backups
   - Select most recent backup BEFORE migration
   - Click "Restore" (this will overwrite current data)
   - **WARNING**: Data loss possible (all data after backup is lost)

**Verification**:
```sql
-- Verify table structure restored
\d crisis_alerts
\d service_requests
\d workflow_sessions
```

---

## 🔍 DETAILED ROLLBACK BY COMPONENT

### Rollback: Front-End Code Changes

**Git Revert**:
```bash
# Find the commit that broke production
git log --oneline -10

# Revert the problematic commit
git revert <commit-hash>

# Push to trigger auto-deploy
git push origin main
```

**Manual File Restoration**:
```bash
# Restore specific file from previous commit
git checkout HEAD~1 -- path/to/file.js

# Commit and push
git add path/to/file.js
git commit -m "fix: Rollback problematic changes to file.js"
git push origin main
```

**Vercel Auto-Deploys**: Pushing to `main` triggers automatic deployment (~2 minutes).

---

### Rollback: API Endpoint Changes

**Identify Breaking Endpoint**:
1. Check Vercel deployment logs
2. Look for 500 errors in `/api/*` routes
3. Check Supabase logs for database errors

**Quick Fix**:
```bash
# Revert API file
git checkout HEAD~1 -- pages/api/problematic-endpoint.js
git add pages/api/problematic-endpoint.js
git commit -m "fix: Rollback API endpoint changes"
git push origin main
```

**Emergency Disable**:
If endpoint is critical but broken, add maintenance mode:
```javascript
// pages/api/problematic-endpoint.js
export default async function handler(req, res) {
  // Temporary maintenance mode
  return res.status(503).json({
    error: 'Service temporarily unavailable',
    message: 'This endpoint is undergoing maintenance. Please try again in 30 minutes.',
    retry_after: 1800 // 30 minutes
  });
}
```

---

### Rollback: Database Schema Changes

**Schema Change Rollback Steps**:

1. **Identify the migration**:
   ```sql
   SELECT name, executed_at
   FROM _migrations
   ORDER BY executed_at DESC
   LIMIT 10;
   ```

2. **Execute rollback migration**:
   - Locate: `database/migrations/YYYYMMDD_<name>_rollback.sql`
   - Apply via Supabase SQL Editor

3. **Delete migration record** (prevents re-run):
   ```sql
   DELETE FROM _migrations
   WHERE name = 'YYYYMMDD_problematic_migration';
   ```

**Common Rollback Patterns**:

```sql
-- Rollback: Added column
ALTER TABLE table_name DROP COLUMN column_name;

-- Rollback: Added table
DROP TABLE IF EXISTS table_name CASCADE;

-- Rollback: Added index
DROP INDEX IF EXISTS index_name;

-- Rollback: Modified column type
ALTER TABLE table_name ALTER COLUMN column_name TYPE old_type;

-- Rollback: Added constraint
ALTER TABLE table_name DROP CONSTRAINT constraint_name;
```

---

### Rollback: Environment Variables

**If .env changes broke production**:

1. **Via Vercel Dashboard**:
   - Go to Settings → Environment Variables
   - Find the changed variable
   - Click "Edit" → Restore previous value
   - Click "Save"
   - **CRITICAL**: Trigger redeploy (Vercel doesn't auto-redeploy on env changes)

2. **Trigger Redeploy**:
   ```bash
   # Empty commit to trigger redeploy
   git commit --allow-empty -m "chore: Redeploy with reverted env vars"
   git push origin main
   ```

**Common Env Var Issues**:
- `OPENROUTER_API_KEY` invalid → Restore from 1Password
- `SUPABASE_SERVICE_ROLE_KEY` rotated → Get new key from Supabase
- `STRIPE_SECRET_KEY` changed → Restore test/live key from Stripe dashboard
- `JWT_SECRET` changed → **DO NOT CHANGE** (breaks all existing sessions)

---

## 📊 POST-ROLLBACK VERIFICATION

After executing rollback, verify these critical paths:

### 1. Authentication System ✅
```bash
# Test login
curl -X POST https://triangle-trade-intelligence.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Expected: 200 OK with session cookie
```

### 2. Workflow Creation ✅
- Login as test user
- Navigate to `/usmca-workflow`
- Complete Step 1 (Company Info)
- Verify localStorage saves data
- Verify database sync (check `workflow_sessions` table)

### 3. Payment Flow ✅
- Navigate to `/services`
- Click "Purchase Service"
- Verify Stripe checkout opens
- Test payment with test card: `4242 4242 4242 4242`
- Verify webhook updates database

### 4. Admin Dashboards ✅
- Login as admin (triangleintel@gmail.com)
- Navigate to `/admin/broker-dashboard`
- Verify service requests load
- Open service workflow modal
- Verify enriched components display

### 5. Database Queries ✅
```sql
-- Verify critical tables exist
SELECT COUNT(*) FROM workflow_sessions;
SELECT COUNT(*) FROM service_requests;
SELECT COUNT(*) FROM crisis_alerts;
SELECT COUNT(*) FROM user_profiles;

-- Check for orphaned data
SELECT COUNT(*) FROM service_requests WHERE user_id NOT IN (SELECT id FROM auth.users);
```

---

## 🆘 EMERGENCY CONTACTS

### Critical Failures (Can't Rollback)

**Vercel Down**:
- Status: https://www.vercel-status.com
- Contact: support@vercel.com
- Backup: Deploy to Netlify (see NETLIFY_DEPLOYMENT.md)

**Supabase Down**:
- Status: https://status.supabase.com
- Contact: support@supabase.io
- Backup: Restore from local database dump

**OpenRouter API Down**:
- Status: https://openrouter.ai/status
- Fallback: Anthropic Direct API (automatic in BaseAgent)
- Manual: Update OPENROUTER_API_KEY in env

**Stripe Down**:
- Status: https://status.stripe.com
- Contact: support@stripe.com
- Workaround: Disable payment features temporarily

### Team Escalation

**Developer Emergency**:
- Email: jules@triangleintel.com
- Phone: [REDACTED]

**Admin Team** (for business continuity):
- Cristina: cristina@triangleintel.com
- Jorge: jorge@triangleintel.com

---

## 🔐 DATA RECOVERY

### User Data Lost (Workflow Sessions)

**If workflow_sessions table corrupted**:

1. **Check Supabase backups**:
   - Supabase → Database → Backups
   - Restore most recent backup

2. **Recover from localStorage** (if user still has browser session):
   ```javascript
   // User can export their data
   const workflowData = localStorage.getItem('usmca_workflow_data');
   console.log(JSON.parse(workflowData));

   // Send to admin for manual database insert
   ```

3. **Contact affected users**:
   ```sql
   -- Get emails of affected users
   SELECT u.email, ws.created_at
   FROM workflow_sessions ws
   JOIN auth.users u ON ws.user_id = u.id
   WHERE ws.created_at > '2025-10-19 00:00:00'
   ORDER BY ws.created_at DESC;
   ```

### Service Requests Lost

**If service_requests table corrupted**:

1. **Recover from Stripe webhooks**:
   - Stripe Dashboard → Events → Filter: `checkout.session.completed`
   - Download CSV of recent payments
   - Reconstruct service_requests from Stripe metadata

2. **Manual database reconstruction**:
   ```sql
   -- Recreate service request from Stripe data
   INSERT INTO service_requests (
     user_id,
     service_type,
     price,
     status,
     created_at
   ) VALUES (
     '<user_id from email>',
     'usmca-advantage',
     149.00,
     'pending_fulfillment',
     '2025-10-19 10:00:00'
   );
   ```

---

## 📝 POST-INCIDENT REPORT

After rollback is complete, document the incident:

**Template**:
```markdown
# Production Incident Report

**Date**: YYYY-MM-DD HH:MM UTC
**Duration**: X minutes/hours
**Severity**: Critical/High/Medium/Low

## What Happened
[Brief description of the issue]

## Root Cause
[Technical explanation of what caused the failure]

## Impact
- Users affected: X
- Revenue lost: $X
- Data lost: Yes/No

## Resolution Steps
1. [Step 1]
2. [Step 2]
3. [Verification]

## Prevention Measures
- [ ] Add test coverage for this scenario
- [ ] Update deployment checklist
- [ ] Add monitoring alert for this failure mode

## Lessons Learned
[What we learned and how we'll prevent this in the future]
```

**Save to**: `incident-reports/YYYYMMDD_incident.md`

---

## ✅ ROLLBACK CHECKLIST

Before declaring rollback successful:

- [ ] Vercel deployment reverted (version number matches stable)
- [ ] Database migration rolled back (if applicable)
- [ ] Environment variables restored (if changed)
- [ ] Authentication working (test login)
- [ ] Workflow creation working (test end-to-end)
- [ ] Payment flow working (test Stripe checkout)
- [ ] Admin dashboards loading (test service modals)
- [ ] No errors in Vercel logs (check last 100 requests)
- [ ] No errors in Supabase logs (check last 100 queries)
- [ ] Users notified (if downtime >15 minutes)
- [ ] Incident report created
- [ ] Post-mortem scheduled (within 24 hours)

---

## 🔄 ROLLBACK TESTING (Before Production Launch)

**Test rollback procedure in staging**:

1. **Deploy test change**:
   ```bash
   git checkout -b test-rollback
   echo "// test change" >> pages/index.js
   git commit -m "test: Rollback simulation"
   git push origin test-rollback
   ```

2. **Merge to main** (triggers production deploy)

3. **Execute rollback steps** (revert to previous deployment)

4. **Verify rollback successful** (run post-rollback checklist)

5. **Document timing**: Rollback should take <5 minutes

---

**Last Updated**: October 19, 2025
**Next Review**: Before every major release
**Owner**: Development Team
