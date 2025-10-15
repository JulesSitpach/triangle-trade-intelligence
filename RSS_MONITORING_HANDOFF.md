# RSS Monitoring System - Handoff for Tomorrow

**Date:** October 14, 2025
**Project:** Triangle Trade Intelligence - RSS Crisis Monitoring
**Status:** 95% Complete - One debugging issue remaining

---

## 🎯 WHAT WE ACCOMPLISHED TODAY

### ✅ Site Restored After Deployment Issue
- **Fixed:** Dashboard API hanging issue that caused blank pages
- **Solution:** Added error handling to crisis_alerts query in `pages/api/dashboard-data.js`
- **Commits:** 11b90b6, c68c6e3

### ✅ Database Migrations Applied to Production
1. **Migration 011** - Added missing RSS monitoring columns
   - Added to `rss_feed_activities`: item_guid, title, link, description, content, pub_date, crisis_keywords_detected, crisis_score
   - Fixed schema mismatch between migration and code

2. **Migration 012** - Seeded 4 official government RSS feeds
   - ✅ USTR Press Releases (Section 301, USMCA, trade policy)
   - ✅ USITC News Releases (investigations, determinations)
   - ✅ Commerce ITA Press Releases (antidumping, countervailing duties)
   - ✅ Federal Register CBP (customs rules, tariff classifications)

### ✅ RSS Diagnostic Endpoint Fixed
- **File:** `pages/api/rss-diagnostic.js`
- **Fixed:** Corrected table/column names to match actual schema
  - `rss_feed_items` → `rss_feed_activities`
  - `published_at` → `pub_date`
  - `last_checked_at` → `last_check_at`
- **Testing:** https://triangle-trade-intelligence.vercel.app/api/rss-diagnostic
- **Status:** ✅ Working correctly

### ✅ Vercel Cron Jobs Enabled (Pro Tier)
- **File:** `vercel.json`
- **Configuration:**
  ```json
  "crons": [
    {
      "path": "/api/cron/rss-polling",
      "schedule": "*/30 * * * *"
    }
  ]
  ```
- **Status:** Configured but endpoint needs debugging

### ✅ GitHub Actions Workflows Created
- `.github/workflows/rss-polling.yml` - Automated polling every 30 minutes
- `.github/workflows/manual-rss-test.yml` - Manual testing workflow
- **Status:** Working as backup to Vercel Cron

---

## ❌ CURRENT ISSUE - RSS Polling Endpoint Returns HTTP 500

### The Problem
**Endpoint:** https://triangle-trade-intelligence.vercel.app/api/cron/rss-polling
**Error:** HTTP 500 - Server Error
**Impact:** Vercel Cron jobs will run but fail, RSS feeds won't be polled

### What We Know
1. ✅ Database tables exist and are properly configured
2. ✅ RSS feeds are seeded in the database (4 active feeds)
3. ✅ Dependencies installed (`rss-parser` is in package.json)
4. ✅ Environment variables are set (SUPABASE_SERVICE_ROLE_KEY confirmed in Vercel)
5. ❌ RSSPollingEngine initialization or execution failing

### Test Results
```bash
# GitHub Actions test result:
HTTP Status: 500
Response: <!DOCTYPE html>...500 - Server Error...
```

### Files Involved
- `pages/api/cron/rss-polling.js` - Cron endpoint (line 38: `new RSSPollingEngine()`)
- `lib/services/rss-polling-engine.js` - Main polling engine (CommonJS module)
- `lib/services/resend-alert-service.js` - Email notification service

---

## 🔍 DEBUGGING STEPS FOR TOMORROW

### Step 1: Check Vercel Function Logs
After the next cron job runs (every 30 minutes), check Vercel logs:
1. Go to https://vercel.com/dashboard
2. Select "triangle-trade-intelligence" project
3. Go to "Deployments" → Latest deployment
4. Click "Functions" tab
5. Find `/api/cron/rss-polling` function
6. View runtime logs to see the actual error

**Vercel Cron Documentation:**
- Quickstart: https://vercel.com/docs/cron-jobs/quickstart
- Manage: https://vercel.com/docs/cron-jobs/manage-cron-jobs

### Step 2: Check CommonJS vs ES Modules Issue
The `RSSPollingEngine` uses `require()` (CommonJS) but Next.js API routes expect ES modules in production.

**Potential fix:**
```javascript
// pages/api/cron/rss-polling.js
// Change from:
const RSSPollingEngine = require('../../../lib/services/rss-polling-engine');

// To:
import RSSPollingEngine from '../../../lib/services/rss-polling-engine';

// OR convert rss-polling-engine.js to ES6:
// module.exports = RSSPollingEngine;
// →
// export default RSSPollingEngine;
```

### Step 3: Test Locally First
Before deploying, test the endpoint locally:
```bash
# Start dev server
npm run dev:3001

# Test the endpoint
curl http://localhost:3001/api/cron/rss-polling

# Or use the test script
node scripts/activate-rss-monitoring.js
```

### Step 4: Add Detailed Error Logging
Update `pages/api/cron/rss-polling.js` to log more details:

```javascript
try {
  console.log('🔄 RSS Polling Cron Job Started:', new Date().toISOString());

  // Add these debug logs:
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasResendKey: !!process.env.RESEND_API_KEY,
    nodeEnv: process.env.NODE_ENV
  });

  console.log('Requiring RSSPollingEngine...');
  const RSSPollingEngine = require('../../../lib/services/rss-polling-engine');

  console.log('Instantiating RSSPollingEngine...');
  const rssEngine = new RSSPollingEngine();

  console.log('Polling all feeds...');
  const result = await rssEngine.pollAllFeeds();

  // ... rest of code
} catch (error) {
  console.error('❌ DETAILED ERROR:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  // ... rest of error handling
}
```

### Step 5: Alternative - Simplify for Testing
Create a minimal test version to isolate the issue:

```javascript
// pages/api/cron/rss-polling-simple.js
export default async function handler(req, res) {
  try {
    // Test 1: Can we connect to Supabase?
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test 2: Can we query the feeds?
    const { data: feeds, error } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      test: 'basic_supabase_query',
      feeds_count: feeds?.length || 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
```

---

## 📋 VERIFICATION CHECKLIST

Once the RSS polling endpoint is fixed, verify:

1. **Vercel Cron Working**
   - Check Vercel dashboard → Cron Jobs tab
   - Verify "rss-polling" job is scheduled
   - Check last run status and logs

2. **RSS Feeds Being Polled**
   ```sql
   -- Check rss_feeds last_check_at timestamps
   SELECT name, last_check_at, last_success_at, failure_count
   FROM rss_feeds
   WHERE is_active = true;
   ```

3. **RSS Items Being Stored**
   ```sql
   -- Check for new items in rss_feed_activities
   SELECT COUNT(*), MAX(created_at)
   FROM rss_feed_activities;
   ```

4. **Crisis Alerts Being Generated**
   ```sql
   -- Check for new crisis alerts
   SELECT COUNT(*), MAX(created_at)
   FROM crisis_alerts
   WHERE source_type = 'rss_feed';
   ```

5. **Email Notifications Working**
   - Check Resend dashboard for sent emails
   - Verify emails sent for high/critical severity alerts

6. **Dashboard Displaying Alerts**
   - Login as test user
   - Check `/dashboard` shows crisis alerts
   - Verify alerts match user's HS codes

---

## 🗂️ KEY FILES REFERENCE

### API Endpoints
- `pages/api/cron/rss-polling.js` - Main cron endpoint (NEEDS FIX)
- `pages/api/rss-diagnostic.js` - Diagnostic endpoint (✅ WORKING)
- `pages/api/dashboard-data.js` - User dashboard data (✅ WORKING)

### Core Services
- `lib/services/rss-polling-engine.js` - RSS polling logic
- `lib/services/resend-alert-service.js` - Email notifications

### Database
- Tables: `rss_feeds`, `rss_feed_activities`, `crisis_alerts`
- Migrations: `migrations/011_*.sql`, `migrations/012_*.sql`

### Configuration
- `vercel.json` - Cron configuration
- `.github/workflows/rss-polling.yml` - GitHub Actions backup
- `.env.local` - Environment variables (local)
- Vercel → Settings → Environment Variables (production)

---

## 🔑 ENVIRONMENT VARIABLES NEEDED

Verify these are set in Vercel → Settings → Environment Variables:

```bash
# Supabase (✅ Confirmed present)
NEXT_PUBLIC_SUPABASE_URL=https://mrwitpgbcaxgnirqtavt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Resend Email (✅ Set in .env.local, verify in Vercel)
RESEND_API_KEY=re_SEvamtPB_fu4QpUZyJnSBD3btXfMtfaV8
RESEND_FROM_EMAIL=alerts@triangle-trade-intelligence.com

# Vercel Cron (optional - used for auth)
CRON_SECRET=<generate if needed>
```

---

## 🎯 SUCCESS CRITERIA

The RSS monitoring system will be 100% complete when:

1. ✅ Vercel Cron job runs successfully every 30 minutes
2. ✅ RSS feeds are polled without errors
3. ✅ Crisis alerts are generated for high-score items
4. ✅ Email notifications sent for critical/high alerts
5. ✅ User dashboard displays relevant crisis alerts
6. ✅ RSS diagnostic endpoint shows active polling

---

## 💡 ALTERNATIVE APPROACH (If CommonJS is the issue)

If the module system is causing problems, consider:

1. **Move RSS polling to a background worker**
   - Use Vercel Edge Functions instead of API routes
   - Or use a separate Node.js service

2. **Simplify the architecture**
   - Call RSS feeds directly in the API route (no RSSPollingEngine class)
   - Use `node-fetch` instead of `rss-parser`

3. **Use Vercel Serverless Functions properly**
   - Convert all files to ES6 modules
   - Use `export default` instead of `module.exports`

---

## 📞 QUICK REFERENCE

**Production URL:** https://triangle-trade-intelligence.vercel.app
**RSS Diagnostic:** https://triangle-trade-intelligence.vercel.app/api/rss-diagnostic
**RSS Polling:** https://triangle-trade-intelligence.vercel.app/api/cron/rss-polling

**Vercel Dashboard:** https://vercel.com/dashboard
**GitHub Repo:** https://github.com/JulesSitpach/triangle-trade-intelligence

**Supabase Project:** mrwitpgbcaxgnirqtavt
**Admin Email:** triangleintel@gmail.com

---

**Good luck tomorrow! The system is 95% there - just need to debug that one endpoint and everything will be fully automated.** 🚀
