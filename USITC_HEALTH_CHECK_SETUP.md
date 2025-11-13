# USITC API Daily Health Check Setup

## 📋 What This Does

Automatically checks USITC API health **every day at 9 AM UTC** (3 AM CST):
- ✅ If API is healthy (200 OK) → Logs success
- ⚠️ If API is down (503) → Logs downtime
- 🎉 If API **just recovered** → Logs recovery + sends notification to `dev_issues` table

**You'll know immediately when USITC comes back online!**

---

## 🗄️ Step 1: Create Database Table

Run this SQL in Supabase:

```sql
-- Health check logs table
CREATE TABLE IF NOT EXISTS api_health_logs (
  id BIGSERIAL PRIMARY KEY,
  api_name TEXT NOT NULL,              -- 'usitc_dataweb'
  status_code INTEGER NOT NULL,        -- HTTP status (200, 503, etc.)
  is_healthy BOOLEAN NOT NULL,         -- true if 200 OK
  response_time_ms INTEGER,            -- Response time (optional)
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,                  -- Error details if unhealthy

  -- Indexes for fast queries
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_health_logs_api_name ON api_health_logs(api_name);
CREATE INDEX idx_api_health_logs_checked_at ON api_health_logs(checked_at DESC);

-- Enable RLS (optional)
ALTER TABLE api_health_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything
CREATE POLICY "Service role full access" ON api_health_logs
  FOR ALL USING (auth.role() = 'service_role');
```

---

## ⚙️ Step 2: Set Up Vercel Cron Job

### Option A: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/julessitpachs-projects/triangle-trade-intelligence/settings/cron
2. Click **"Add Cron Job"**
3. Fill in:
   - **Path**: `/api/cron/check-usitc-health`
   - **Schedule**: `0 9 * * *` (Daily at 9 AM UTC)
   - **Description**: "Check USITC API health daily"
4. Click **"Create"**

### Option B: vercel.json Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-usitc-health",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Then commit and push.

---

## 🔐 Step 3: Add Environment Variable

Add `CRON_SECRET` to Vercel:

1. Generate secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add to Vercel:
   - Go to: Settings → Environment Variables
   - Name: `CRON_SECRET`
   - Value: `<generated-secret>`
   - Environment: Production

3. Redeploy for changes to take effect.

---

## 📊 Step 4: Monitor Health Checks

### View Recent Checks (SQL):

```sql
SELECT
  api_name,
  status_code,
  is_healthy,
  checked_at,
  error_message
FROM api_health_logs
WHERE api_name = 'usitc_dataweb'
ORDER BY checked_at DESC
LIMIT 10;
```

### Check for Recovery Event:

```sql
SELECT *
FROM dev_issues
WHERE issue_type = 'api_recovery'
  AND title LIKE '%USITC%'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🧪 Test Manually (Before Cron Setup)

```bash
# Test health check endpoint manually
curl -X GET "https://triangle-trade-intelligence.vercel.app/api/cron/check-usitc-health" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response (when down):
{
  "status": "unhealthy",
  "message": "USITC API returned 503",
  "statusCode": 503,
  "nextCheck": "24 hours"
}

# Expected response (when recovered):
{
  "status": "healthy",
  "message": "USITC API is online",
  "statusCode": 200,
  "recovery": true,
  "nextCheck": "24 hours"
}
```

---

## 📈 What Happens When API Recovers?

1. **Daily check runs** at 9 AM UTC
2. **Detects 200 OK** (API back online)
3. **Compares to yesterday** (was it down before?)
4. **If YES (recovery)**:
   - ✅ Logs to `api_health_logs` (is_healthy = true)
   - ✅ Logs to `dev_issues` (title: "USITC API Back Online")
   - 🔔 You check `dev_issues` table → see recovery notification

5. **You activate integration**:
   - USITC code already exists in `lib/services/usitc-dataweb-api.js`
   - Token already valid (expires May 12, 2026)
   - Just enable the integration (15 minutes)

---

## 🎯 Benefits

- ✅ **Automatic monitoring** - No manual checks needed
- ✅ **Recovery notification** - Know immediately when API comes back
- ✅ **Historical data** - See uptime trends in `api_health_logs`
- ✅ **Zero cost** - Vercel cron jobs are free for daily checks

---

## 📝 Schedule Details

**Cron Expression**: `0 9 * * *`
- Minute: 0
- Hour: 9 (UTC)
- Day: Every day
- Month: Every month
- Weekday: Every weekday

**Timezone**: UTC (3 AM CST/CDT)

**Why 9 AM UTC?**
- Off-peak hours for USITC servers
- Morning in US (when you're likely checking dashboard)
- Avoids midnight (common maintenance window)

---

## 🚀 Ready to Deploy?

1. Create `api_health_logs` table in Supabase ✅
2. Add cron job in Vercel ✅
3. Add `CRON_SECRET` environment variable ✅
4. Commit and push `pages/api/cron/check-usitc-health.js` ✅
5. Wait for tomorrow 9 AM UTC for first check 🕐

**File ready:** `pages/api/cron/check-usitc-health.js` (just created)

---

**Want me to commit this now?**
