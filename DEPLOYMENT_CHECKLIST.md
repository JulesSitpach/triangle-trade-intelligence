# ✅ DEPLOYMENT CHECKLIST - RSS Monitoring & Referral Trial System

**Date**: January 2025
**Goal**: Launch referral trials for Adam Williams & Anthony Robinson with real-time monitoring

---

## PRE-DEPLOYMENT CHECKS

### ✅ Code Complete
- [x] Referral trial system (`pages/signup/referral.js`, `/api/auth/signup-referral.js`)
- [x] RSS polling engine (`lib/services/rss-polling-engine.js`)
- [x] Email notification service (`lib/services/resend-alert-service.js`)
- [x] Cron job endpoint (`pages/api/cron/rss-polling.js`)
- [x] Vercel cron configuration (`vercel.json`)
- [x] Alerts page monitoring badge (`pages/trade-risk-alternatives.js`)

### ✅ Environment Variables
- [x] `RESEND_API_KEY=re_SEvamtPB_fu4QpUZyJnSBD3btXfMtfaV8`
- [x] `RESEND_FROM_EMAIL=alerts@triangle-trade-intelligence.com`
- [x] `CRON_SECRET` configured for production
- [x] `NEXT_PUBLIC_SUPABASE_URL` configured
- [x] `SUPABASE_SERVICE_ROLE_KEY` configured

### ✅ Database Migrations Ready
- [x] `migrations/010_add_referral_tracking_to_user_profiles.sql`
- [x] `migrations/011_create_rss_monitoring_tables.sql`
- [x] `migrations/012_seed_rss_feeds.sql` (with government sources)

---

## DEPLOYMENT SEQUENCE

### Step 1: Database Migrations ⏳
**Run in Supabase SQL Editor:**

```sql
-- 1. Referral tracking (run first)
\i migrations/010_add_referral_tracking_to_user_profiles.sql

-- 2. RSS tables (run second)
\i migrations/011_create_rss_monitoring_tables.sql

-- 3. Seed government sources (run third)
\i migrations/012_seed_rss_feeds.sql
```

**Verification:**
```sql
-- Check referral columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('referred_by', 'referral_source', 'referral_date', 'referral_converted');

-- Check RSS tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('rss_feeds', 'rss_feed_activities', 'crisis_alerts');

-- Check 4 government sources configured
SELECT name, category, priority_level, is_active
FROM rss_feeds
ORDER BY priority_level;
-- Expected: USTR, USITC, Commerce ITA, Federal Register CBP
```

**Status**: ⏳ PENDING
**Completed**: [ ]

---

### Step 2: Deploy to Vercel ⏳

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Complete RSS monitoring with email notifications

- Add referral trial system for Adam Williams & Anthony Robinson
- Integrate 4 official government RSS sources (USTR, USITC, Commerce ITA, Federal Register CBP)
- Complete email notification system with Resend API
- Add monitoring badge to alerts page showing 4 official sources
- Configure Vercel cron job for automated polling every 30 minutes

Delivers exactly what Adam & Anthony requested:
- Adam: 'real-time policy alerts' from official USTR/USITC sources
- Anthony: 'live customs updates' from Federal Register CBP

🤖 Generated with Claude Code"

# Push to main (auto-deploys to Vercel)
git push
```

**Verification:**
- [ ] Vercel build succeeded
- [ ] No build errors in Vercel logs
- [ ] Production URL accessible: https://triangle-trade-intelligence.vercel.app

**Status**: ⏳ PENDING
**Completed**: [ ]

---

### Step 3: Verify Vercel Cron Job ⏳

1. Go to Vercel Dashboard → triangle-trade-intelligence
2. Navigate to **Settings → Cron Jobs**
3. Verify cron job is listed:
   - **Path**: `/api/cron/rss-polling`
   - **Schedule**: `*/30 * * * *` (every 30 minutes)
   - **Status**: ✅ Active

**If cron job not visible:**
- Check `vercel.json` is in root directory
- Redeploy: `vercel --prod`
- Wait 5 minutes for Vercel to register cron

**Status**: ⏳ PENDING
**Completed**: [ ]

---

### Step 4: Test RSS Polling ⏳

**Manual test from local:**
```bash
curl http://localhost:3000/api/cron/rss-polling
```

**Expected response:**
```json
{
  "success": true,
  "feeds_polled": 4,
  "successful_polls": 4,
  "failed_polls": 0
}
```

**Production test:**
```bash
curl https://triangle-trade-intelligence.vercel.app/api/cron/rss-polling
```

**Check database for results:**
```sql
-- Should see recent RSS activity
SELECT
  rf.name,
  rfa.title,
  rfa.crisis_score,
  rfa.created_at
FROM rss_feed_activities rfa
JOIN rss_feeds rf ON rfa.feed_id = rf.id
ORDER BY rfa.created_at DESC
LIMIT 10;
```

**Status**: ⏳ PENDING
**Completed**: [ ]

---

### Step 5: Test Email Notifications (Optional) ⏳

**Create a test critical alert:**
```sql
INSERT INTO crisis_alerts (
  source_type,
  title,
  description,
  severity_level,
  keywords_matched,
  crisis_score,
  business_impact,
  recommended_actions,
  feed_category,
  is_active,
  source_url
) VALUES (
  'rss_feed',
  'TEST: USTR Announces Section 301 Investigation on Electronics',
  'This is a test alert to verify email notifications are working correctly',
  'critical',
  ARRAY['section 301', 'china', 'electronics'],
  8,
  'China supplier risk - Mexico triangle routing opportunity; Trade conflict - Supply chain diversification critical',
  '1. Review China supplier dependencies; 2. Activate Mexico triangle routing analysis; 3. Contact Triangle Trade Intelligence for crisis response',
  'government',
  true,
  'https://ustr.gov/test-alert'
);
```

**Then check email sent:**
- [ ] Email received at triangleintel@gmail.com
- [ ] Subject line correct: "🚨 Trade Alert: TEST: USTR Announces..."
- [ ] HTML formatting displays correctly
- [ ] All sections present (title, description, impact, actions, CTA)
- [ ] Severity badge is red (critical)

**Status**: ⏳ PENDING (Optional)
**Completed**: [ ]

---

### Step 6: Verify Referral Signup Pages ⏳

**Test referral links:**

1. **Adam Williams**:
   https://triangle-trade-intelligence.vercel.app/signup/referral?ref=adam
   - [ ] Page loads correctly
   - [ ] Shows "Referred by Adam Williams" badge
   - [ ] 30-day Professional trial message visible
   - [ ] Signup form functional
   - [ ] Auto-login after signup

2. **Anthony Robinson**:
   https://triangle-trade-intelligence.vercel.app/signup/referral?ref=anthony
   - [ ] Page loads correctly
   - [ ] Shows "Referred by Anthony Robinson" badge
   - [ ] 30-day Professional trial message visible
   - [ ] Signup form functional
   - [ ] Auto-login after signup

**Test signup flow:**
- [ ] Create test account via referral link
- [ ] Verify auto-login (redirects to dashboard)
- [ ] Check database: `referred_by` column populated
- [ ] Check database: `subscription_tier = 'Professional'`
- [ ] Check database: `status = 'trial'`
- [ ] Check database: `trial_end_date` = 30 days from now

**Status**: ⏳ PENDING
**Completed**: [ ]

---

### Step 7: Verify Alerts Page Badge ⏳

**Check monitoring badge display:**

1. Go to: https://triangle-trade-intelligence.vercel.app/trade-risk-alternatives
2. Scroll to monitoring badge section
3. Verify badge shows:
   - [ ] Title: "📡 Real-Time Government Monitoring Active"
   - [ ] Lists 4 official sources:
     - USTR Press Releases (checks every 30 min)
     - USITC News Releases (checks every 30 min)
     - Commerce ITA (checks every 30 min)
     - Federal Register CBP (checks hourly)
   - [ ] Explanation about authoritative sources
   - [ ] Professional styling (alert-info class)

**Status**: ⏳ PENDING
**Completed**: [ ]

---

## POST-DEPLOYMENT MONITORING

### Day 1 (After Deployment):
- [ ] Monitor Vercel logs for cron job executions (every 30 min)
- [ ] Check Supabase for new RSS activities
- [ ] Verify no error logs in Vercel
- [ ] Check RSS feed failure_count (should be 0 or low)

**Queries:**
```sql
-- RSS polling success rate
SELECT
  rf.name,
  rf.last_check_at,
  rf.failure_count,
  COUNT(rfa.id) as items_processed
FROM rss_feeds rf
LEFT JOIN rss_feed_activities rfa ON rf.id = rfa.feed_id
WHERE rfa.created_at > NOW() - INTERVAL '24 hours'
GROUP BY rf.id;

-- Crisis alerts generated
SELECT severity_level, COUNT(*)
FROM crisis_alerts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY severity_level;
```

---

### Day 2-3 (LinkedIn Outreach):
- [ ] Copy LinkedIn messages from `REFERRAL_TRIAL_SYSTEM.md`
- [ ] Send message to Adam Williams
- [ ] Send message to Anthony Robinson
- [ ] Track if they view the message (LinkedIn will show)

---

### Week 1 (Monitoring Signups):
- [ ] Check for Adam Williams signup
- [ ] Check for Anthony Robinson signup
- [ ] Monitor their activity (logins, workflows, alerts viewed)
- [ ] Send welcome email if they sign up

**Tracking query:**
```sql
SELECT
  email,
  company_name,
  referred_by,
  subscription_tier,
  status,
  trial_end_date,
  created_at,
  last_login_at
FROM user_profiles
WHERE referred_by IN ('Adam Williams', 'Anthony Robinson')
ORDER BY created_at DESC;
```

---

### Week 2 (Engagement Check):
- [ ] Follow up via LinkedIn: "How's it going? Need help?"
- [ ] Check their workflow completion count
- [ ] Check if they're receiving/opening alert emails
- [ ] Address any feedback or issues

---

### Week 3 (Conversion Prep):
- [ ] Send usage report: "You've analyzed X products, saved $Y"
- [ ] Highlight value delivered
- [ ] Tease upcoming features
- [ ] Ask for feedback/testimonials

---

### Week 4 (Conversion Push):
- [ ] Day 23: Conversion email with 50% first month discount
- [ ] Day 27: Final reminder (3 days left)
- [ ] Day 30: Trial expires, downgrade to Starter or convert
- [ ] Request testimonial if positive experience

---

## SUCCESS METRICS

### Technical Metrics:
- [ ] **RSS Polling**: 95%+ success rate (failed_polls < 5%)
- [ ] **Cron Job**: Executing every 30 minutes without errors
- [ ] **Email Delivery**: 95%+ delivery rate (via Resend logs)
- [ ] **Crisis Alerts**: At least 1-2 alerts per day from government sources
- [ ] **Page Load**: Referral pages load in <2 seconds

### Business Metrics:
- [ ] **Signups**: Both Adam & Anthony sign up within 7 days
- [ ] **Engagement**: 5+ logins per user within first week
- [ ] **Workflow Usage**: 3+ workflows completed by each user
- [ ] **Alert Opens**: 50%+ email open rate for crisis alerts
- [ ] **Feedback**: Positive testimonials or recommendations
- [ ] **Conversion**: At least 1 of 2 converts to paid subscription

### User Feedback (Target):
- **Adam**: "This is exactly what I asked for - better than Bloomberg"
- **Anthony**: "Super clutch for e-commerce logistics companies"
- Both: Request LinkedIn recommendations
- Both: Refer 2-3 people from their networks

---

## ROLLBACK PLAN (If Things Go Wrong)

### If RSS polling fails:
1. Check Vercel logs: `/api/cron/rss-polling` errors
2. Verify RSS feed URLs are still valid
3. Increase poll_frequency_minutes to reduce load
4. Disable problematic feeds temporarily

### If emails fail:
1. Check Resend dashboard for delivery errors
2. Verify RESEND_API_KEY is correct
3. Check bounce/spam rates
4. Consider domain verification if high bounce rate

### If signups fail:
1. Test referral links manually
2. Check Supabase logs for signup API errors
3. Verify JWT_SECRET is configured correctly
4. Test auto-login flow

### If cron job not running:
1. Redeploy: `vercel --prod`
2. Verify vercel.json is in root
3. Check Vercel dashboard → Cron Jobs section
4. Add CRON_SECRET to Vercel environment variables

---

## FINAL CHECKLIST BEFORE LINKEDIN OUTREACH

**Everything must be ✅ before sending LinkedIn messages:**

- [ ] RSS monitoring system tested and working
- [ ] Email notifications tested and working
- [ ] Referral signup pages tested and working
- [ ] Vercel cron job active and running
- [ ] Alerts page badge visible and correct
- [ ] No errors in Vercel logs
- [ ] At least 1-2 crisis alerts generated in database
- [ ] LinkedIn messages drafted and ready

---

**Status**: 🚧 IN PROGRESS
**Next Action**: Deploy database migrations
**Expected Completion**: Today
**LinkedIn Outreach**: Tomorrow (after 24hr monitoring)

✅ **WE'RE READY TO LAUNCH!**
