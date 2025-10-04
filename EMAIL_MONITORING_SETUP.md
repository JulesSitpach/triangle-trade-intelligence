# Email Monitoring System Setup Guide
## Triangle Trade Intelligence - SMB Subscription Value

---

## 🎯 What This Does

**Provides ongoing subscription value for SMB customers:**

1. **Weekly USMCA Digest** (30 min/week manual work)
   - You curate policy changes from customs.gov, trade.gov
   - Send to all Professional+ subscribers
   - They don't have to monitor news themselves

2. **HS Code Specific Alerts** (15 min/day manual work)
   - You check customs.gov for tariff changes
   - Send targeted alerts only to affected users
   - They get notified when THEIR products are affected

3. **Manual Process** (for now)
   - No complex automation needed
   - You're the curator, SendGrid delivers
   - Takes 45 min/week total

---

## 📦 What We Built

### Files Created:

1. **`lib/services/email-monitoring-service.js`**
   - Core service for sending emails
   - Weekly digest function
   - HS code alert function
   - Email HTML templates

2. **`pages/api/admin/send-weekly-digest.js`**
   - API endpoint for sending weekly digest
   - Admin only

3. **`pages/api/admin/send-hs-alert.js`**
   - API endpoint for HS code alerts
   - Admin only

4. **`pages/api/admin/active-hs-codes.js`**
   - Lists HS codes from user workflows
   - Shows which codes to monitor

5. **`pages/admin/email-digest.js`**
   - Admin UI for curating and sending emails
   - Weekly digest tab
   - HS code alert tab
   - Active HS codes list

---

## 🚀 Setup Instructions (1-2 Hours)

### Step 1: SendGrid Account Setup (15 min)

1. Go to https://sendgrid.com/
2. Create free account (2,000 emails/month free - plenty for SMBs)
3. Verify your email address
4. Create API Key:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "Triangle Intelligence Production"
   - Permissions: "Full Access"
   - Copy the API key (you'll only see it once!)

5. Verify sender email:
   - Go to Settings → Sender Authentication
   - Single Sender Verification
   - Add: `updates@triangleintelligence.com`
   - Check your email, click verification link

### Step 2: Add Environment Variable (2 min)

Add to your `.env.local` file:

```bash
# SendGrid API Key for email monitoring
SENDGRID_API_KEY=SG.your_key_here_copy_from_sendgrid

# App URL for email links
NEXT_PUBLIC_APP_URL=https://triangleintelligence.com
```

Restart your dev server after adding this.

### Step 3: Database Changes Needed (5 min)

Add these fields to `user_profiles` table (if not already there):

```sql
-- Add email notification preference
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'weekly_digest' or 'hs_code_alert'
  hs_code TEXT, -- only for hs_code_alert
  recipients_count INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  content_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Run this in Supabase SQL Editor.

### Step 4: Test Sending (10 min)

1. Start dev server: `npm run dev`
2. Log in as admin
3. Go to `/admin/email-digest`
4. Fill in a test weekly digest:
   - Subject: "Test Digest - Please Ignore"
   - Section 1:
     - Title: "Testing Email System"
     - Content: "This is a test of the weekly digest system. If you receive this, it's working!"
5. Click "Send to All Subscribers"
6. Check your email (should arrive in 1-2 minutes)

### Step 5: Set Up Monitoring Routine (30 min)

#### Weekly Digest (Every Monday, 30 min):

**Sources to Check:**
- https://www.cbp.gov/newsroom - Customs and Border Protection news
- https://www.trade.gov/usmca - USMCA updates
- https://www.usitc.gov/ - Tariff rate changes
- https://www.federalregister.gov/ - Regulatory changes

**What to Look For:**
- New tariff rates announced
- USMCA rule changes
- Documentation requirement updates
- Compliance deadline changes
- Trade policy shifts

**Your Curation Process:**
1. Scan headlines (10 min)
2. Pick 2-4 most important changes (5 min)
3. Write simple summaries in /admin/email-digest (10 min)
4. Add action items if users need to do something (5 min)
5. Send to subscribers

#### Daily HS Code Check (15 min/day):

**Process:**
1. Go to /admin/email-digest → "Active HS Codes" tab
2. See list of HS codes your users care about
3. Visit https://hts.usitc.gov/
4. Search for each active HS code
5. Check if tariff rate changed from yesterday
6. If YES:
   - Go to "HS Code Alert" tab
   - Fill in what changed
   - Send alert (goes only to affected users)
7. If NO: Done for today

---

## 💻 How to Use (Your Weekly Workflow)

### Monday Morning - Weekly Digest (30 min)

```
8:00 AM - Check trade news sources
8:10 AM - Identify 3 key changes this week
8:15 AM - Go to /admin/email-digest
8:20 AM - Write Section 1: New tariff announcement
8:25 AM - Write Section 2: USMCA rule update
8:30 AM - Write Section 3: Compliance deadline reminder
8:35 AM - Preview email
8:37 AM - Click "Send to All Subscribers"
8:38 AM - Check your own email to confirm delivery
```

### Daily - HS Code Check (15 min)

```
9:00 AM - Go to /admin/email-digest → "Active HS Codes" tab
9:01 AM - See you have 15 HS codes to monitor
9:02 AM - Visit customs.gov tariff database
9:10 AM - Check all 15 codes (takes ~30 seconds each)
9:14 AM - Found change for HS code 8517.62.00.00
9:15 AM - Fill in alert form
9:17 AM - Send alert to 12 affected users
9:18 AM - Done
```

---

## 📧 Email Templates

### Weekly Digest Example:

**Subject:** "USMCA Update: New Steel Tariffs + Compliance Deadlines"

**Section 1: New Steel Import Tariffs**
- Content: "Effective March 1, steel imports from non-USMCA countries face 15% additional tariff. USMCA-compliant imports remain 0%. This affects HS codes 7208-7212."
- Action: "Review your steel imports - ensure USMCA certificates are current"

**Section 2: Certificate Renewal Reminder**
- Content: "USMCA certificates older than 4 years need renewal. Check your certificate dates."
- Action: "If your certificate expires before June 2025, request renewal now"

### HS Code Alert Example:

**HS Code:** 8517.62.00.00
**Subject:** "Tariff Rate Increase"
**Change Type:** Tariff Rate Increase
**Description:** "Tariff rate for HS code 8517.62.00.00 (telecom equipment) increased from 0% to 5.8% for non-USMCA imports effective March 15, 2025."
**Impact:** "If your telecom equipment doesn't qualify for USMCA, you'll pay $5,800 more per $100k shipment. USMCA-qualified imports still pay 0%."
**Action:** "Verify your USMCA certificate is current. Run a new analysis if supply chain changed."

---

## 🎯 Subscription Value Proposition

**Before Email Monitoring:**
- User: "Why should I stay subscribed after getting my certificate?"
- You: "Uh... you get unlimited analyses?" (weak value)

**After Email Monitoring:**
- User: "Why should I stay subscribed?"
- You: "We monitor trade policy 24/7 so you don't have to. You get weekly digests of what changed, and instant alerts if YOUR products are affected. Plus quarterly strategy calls and priority support."
- User: "That's worth $299/month. I don't have time to watch customs.gov every day."

**ROI for SMB:**
- Your time: 45 min/week (30 min digest + 15 min/day HS checks)
- Their time saved: 5-10 hours/week (not monitoring news, not researching changes)
- Their cost: $299/month = $3,588/year
- Their time worth: $50-100/hr × 5 hrs/week × 52 weeks = $13k-26k/year value

**They save $10k+ in time, pay you $3.6k. That's a good deal for SMB owners.**

---

## 🚀 Phase 2: Automation (Optional, Later)

**Once you have 100+ subscribers, automate:**

1. **RSS Feed Monitoring**
   - Automatically scrape customs.gov RSS
   - Flag likely important changes
   - You review and approve before sending

2. **HS Code API Integration**
   - Automated tariff rate checking
   - Alert you when change detected
   - You review and send alert

3. **SMS Alerts (Twilio)**
   - For URGENT changes only
   - Charge $20/month extra for SMS
   - Your curated urgent alerts only

**Don't build this yet.** Manual process works fine for first 50-100 subscribers.

---

## ✅ Testing Checklist

Before going live:

- [ ] SendGrid account created and verified
- [ ] API key added to .env.local
- [ ] Sender email verified
- [ ] Database tables created (user_profiles.email_notifications, email_logs)
- [ ] Test digest sent successfully
- [ ] Received test email in inbox (not spam)
- [ ] /admin/email-digest page loads for admin user
- [ ] Active HS codes list populates
- [ ] Can send HS code alert
- [ ] Monitoring routine scheduled (Monday 8am, Daily 9am)

---

## 📊 Success Metrics

**Track these in email_logs table:**

- Weekly digest open rate (via SendGrid analytics)
- HS code alert click rate (links to dashboard)
- Subscriber retention (do Professional tier users stay longer?)
- Support tickets reduced (fewer "did policy change?" questions)

**Goal:**
- 40%+ open rate on weekly digests (industry average: 20-25%)
- 60%+ open rate on HS code alerts (targeted, urgent)
- Reduce support inquiries by 30% (users get info proactively)

---

## 💡 Marketing This Feature

**Update Pricing Page:**

**Professional Tier ($299/mo) - Add:**
- ✅ Weekly USMCA policy digest (we monitor so you don't have to)
- ✅ HS code specific alerts (instant notification when YOUR products affected)
- ✅ Quarterly 30-min strategy call
- ✅ 1 free certificate/month ($300 value)

**Why SMBs Will Subscribe:**

> "I'm a small manufacturer. I don't have time to check customs.gov every day. Triangle Trade Intelligence watches trade policy for me. I get a weekly email with what changed, and if something affects MY products, I get instant alert. Worth every penny of the $299/month."

---

## 🎯 Next Steps

1. **This Week:** Set up SendGrid, add API key, test sending
2. **Next Monday:** Send first weekly digest to your existing subscribers
3. **Daily:** Check HS codes (15 min)
4. **After 1 Month:** Review open rates, adjust content
5. **After 3 Months:** Add automation if subscriber count > 50

**The goal: Make your subscription valuable BEYOND the initial certificate.**

SMB owners will stay subscribed because you save them hours of work every week.

---

**Questions? Check:**
- SendGrid docs: https://docs.sendgrid.com/
- Your admin panel: /admin/email-digest
- Test sending with your own email first!
