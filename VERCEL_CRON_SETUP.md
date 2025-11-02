# Vercel Cron Job Configuration - Triangle Trade Intelligence

**Status:** ✅ READY TO DEPLOY
**Last Updated:** November 2, 2025
**Environment:** Production (Vercel)

---

## 🎯 Overview

Three automated cron jobs have been configured to:
1. **Monitor tariff policy changes** - Every 2 hours
2. **Send daily digest emails** - 8 AM UTC daily
3. **Flag stale tariff data** - Midnight UTC daily

---

## 📋 Configuration Details

### 1. RSS Polling & Alert Detection
**Endpoint:** `/api/cron/rss-polling`
**Schedule:** Every 2 hours (`0 */2 * * *`)
**Purpose:** Poll RSS feeds, detect tariff changes, create crisis alerts

**What it does:**
- Polls USITC, USTR, Federal Register, and Financial Times feeds
- Uses AI to detect Section 301/232 rate changes
- Detects USMCA renegotiation announcements
- Creates crisis alerts immediately (UI visibility)
- Logs changes for daily digest bundling

**Time to complete:** ~10-30 seconds
**Cost:** ~$0.05-0.10/day (336 calls/month)

---

### 2. Daily Tariff Digest Email
**Endpoint:** `/api/cron/send-daily-tariff-digest`
**Schedule:** 8 AM UTC daily (`0 8 * * *`)
**Purpose:** Bundle all detected tariff changes from previous 24 hours into single email

**What it does:**
- Finds all tariff changes logged by RSS polling (is_processed = false)
- Groups changes by user and workflow
- Creates rich email with all changes and impact analysis
- Marks changes as processed
- Logs digest in `daily_digest_sent` audit table

**Time to complete:** ~2-5 seconds
**Cost:** Variable based on user count (1 email per affected user/day)

---

### 3. Flag Stale Policy Rates
**Endpoint:** `/api/cron/flag-stale-policy-rates`
**Schedule:** Midnight UTC daily (`0 0 * * *`)
**Purpose:** Mark tariff rates older than 7 days as potentially stale

**What it does:**
- Finds rates not updated in 7+ days
- Marks with `is_stale = true` flag
- Used for analytics and reliability warnings

**Time to complete:** ~5 seconds
**Cost:** Minimal ($0.01/day)

---

## 🔐 Required Environment Variables

These must be set in Vercel project settings:

```
CRON_SECRET=<your-secret-key>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
OPENROUTER_API_KEY=<your-openrouter-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
RESEND_API_KEY=<your-resend-key>
```

### How to set CRON_SECRET:
Generate a random secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add to Vercel environment variables.

---

## 🚀 Deployment Instructions

### Step 1: Generate CRON_SECRET
```bash
# Run this locally
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Add to Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select **triangle-trade-intelligence** project
3. Go to **Settings → Environment Variables**
4. Add `CRON_SECRET=<your-generated-key>`
5. Save

### Step 3: Deploy with Cron Config
```bash
git add vercel.json
git commit -m "feat: Configure Vercel cron jobs for tariff monitoring and email digests"
git push
```

Vercel will automatically:
- ✅ Read vercel.json cron configuration
- ✅ Schedule all three cron jobs
- ✅ Start execution on next schedule

### Step 4: Verify in Vercel Dashboard
1. Go to **Deployments → Cron Jobs**
2. Confirm you see:
   - ✅ `/api/cron/rss-polling` (every 2 hours)
   - ✅ `/api/cron/send-daily-tariff-digest` (8 AM UTC)
   - ✅ `/api/cron/flag-stale-policy-rates` (midnight UTC)

---

## 📊 Monitoring & Testing

### Manual Test (Before Deployment)
```bash
# Test RSS polling endpoint
curl -X POST http://localhost:3001/api/cron/rss-polling \
  -H "Authorization: Bearer test-secret" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "message": "Tariff updates and agreement monitoring completed successfully",
  "rss_polling": { ... },
  "tariff_change_detection": { ... },
  "usmca_renegotiation_detection": { ... }
}
```

### Monitor in Production
1. **Vercel Dashboard:**
   - Go to **Deployments → Cron Jobs**
   - See execution logs and next run times

2. **Supabase Database:**
   - Check `tariff_changes_log` for detected changes
   - Check `daily_digest_sent` for email audit trail
   - Check `crisis_alerts` for new alerts created

3. **Email Verification:**
   - Users should receive daily digest at 8 AM UTC
   - Check email logs in Resend dashboard

---

## ⚡ Performance & Cost

| Job | Frequency | Calls/Month | Est. Cost | Cost Source |
|-----|-----------|------------|----------|------------|
| RSS Polling | Every 2h | 336 | $0.05-0.10/day | API calls + AI processing |
| Daily Digest | 8 AM UTC | ~30 | $0.02-0.05/day | Email sending + processing |
| Stale Flagging | Midnight | 30 | $0.01/day | Database query |
| **Total** | — | **396** | **$0.08-0.15/day** | **~$2.50-4.50/month** |

---

## 🔧 Troubleshooting

### Cron job not running?
1. Check CRON_SECRET is set in Vercel
2. Verify endpoint returns 200 status code
3. Check Vercel logs: Dashboard → Deployments → Cron Jobs

### API keys failing?
1. Verify all env vars are set: `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. Test endpoint locally first: `npm run dev:3001`
3. Check API key expiration dates

### No emails being sent?
1. Verify `RESEND_API_KEY` is set
2. Check `daily_digest_sent` table - digest may have run but email failed
3. Check Resend dashboard for bounce/error logs

### Too many changes detected?
- Reduce RSS feed polling frequency to 4x/day instead of 12x/day
- Change schedule from `0 */2 * * *` to `0 */6 * * *`

---

## 📝 Data Flow Architecture

```
RSS Feeds (USITC, USTR, etc.)
        ↓
RSS Polling Cron (every 2h)
        ↓
Tariff Change Detector (AI-powered)
        ├→ Create Crisis Alerts (UI visible)
        └→ Log to tariff_changes_log (for digest)
        ↓
Daily Digest Cron (8 AM UTC)
        ├→ Query tariff_changes_log (is_processed = false)
        ├→ Group by user
        ├→ Create rich email
        └→ Send via Resend
        ↓
USMCA Renegotiation Tracker
        ├→ Detect agreement announcements
        └→ Create USMCA renegotiation alerts
```

---

## ✅ Checklist

- [ ] Generate CRON_SECRET
- [ ] Add CRON_SECRET to Vercel environment variables
- [ ] Verify all other env vars are set
- [ ] Deploy: `git push` (auto-deploys to Vercel)
- [ ] Wait 5 minutes for Vercel to process
- [ ] Check Vercel Dashboard → Cron Jobs (should show 3 jobs)
- [ ] Monitor first execution (check logs)
- [ ] Verify crisis alerts appear in UI after first RSS polling
- [ ] Verify email received at 8 AM UTC next day
- [ ] Update CLAUDE.md with activation date

---

## 🎉 Ready to Go!

Once deployed, the system will:
1. ✅ Automatically detect tariff changes every 2 hours
2. ✅ Create alerts visible in the UI immediately
3. ✅ Bundle changes into daily email digest at 8 AM UTC
4. ✅ Track USMCA renegotiations automatically
5. ✅ Log all activity for audit trail

**No additional action required** - just deploy and monitor!
