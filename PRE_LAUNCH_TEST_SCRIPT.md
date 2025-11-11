# 🚀 PRE-LAUNCH TEST SCRIPT
**Date**: November 11, 2025
**Time Required**: 30-45 minutes
**Goal**: Verify platform is 100% ready for paying customers

---

## ✅ PRE-TEST CHECKLIST

Before starting, confirm you have:
- [ ] Access to Vercel dashboard (https://vercel.com/julessitpachs-projects/triangle-trade-intelligence)
- [ ] Access to Stripe dashboard (https://dashboard.stripe.com/)
- [ ] Access to Supabase dashboard (https://supabase.com/dashboard/project/mrwitpgbcaxgnirqtavt)
- [ ] A test email you can check (not your real company email)
- [ ] 15 minutes of uninterrupted time

---

## 🎯 TEST 1: BASIC SITE FUNCTIONALITY (5 minutes)

### Test 1A: Homepage Loads
```bash
# Run from Windows PowerShell or Git Bash
curl -I https://triangle-trade-intelligence.vercel.app
```

**Expected**: `HTTP/2 200`
**If fails**: Check Vercel deployment status

### Test 1B: Critical Pages Load
Open these URLs in browser (Ctrl+Click each):
- [ ] https://triangle-trade-intelligence.vercel.app (homepage)
- [ ] https://triangle-trade-intelligence.vercel.app/pricing (pricing page)
- [ ] https://triangle-trade-intelligence.vercel.app/login (login page)
- [ ] https://triangle-trade-intelligence.vercel.app/usmca-workflow (workflow - should redirect to login)

**Expected**: All pages load with no console errors
**If fails**: Open DevTools (F12) → Console tab → Screenshot errors

---

## 🔐 TEST 2: USER REGISTRATION & LOGIN (5 minutes)

### Test 2A: Create New Account
1. Go to: https://triangle-trade-intelligence.vercel.app/signup
2. Fill in:
   - **Email**: `test+prelaunch@yourdomain.com` (use + trick for multiple tests)
   - **Password**: `TestLaunch2025!`
   - **Company Name**: `Test Company Inc`
   - **Full Name**: `Test User`
3. Click "Sign Up"

**Expected**:
- ✅ Redirects to dashboard
- ✅ Shows "Trial" subscription tier
- ✅ Shows "0/1 analyses used this month"

**If fails**:
- Screenshot the error
- Check browser console (F12)
- Note exact error message

### Test 2B: Logout & Login
1. Click profile → Logout
2. Go to: https://triangle-trade-intelligence.vercel.app/login
3. Login with same credentials

**Expected**:
- ✅ Successfully logs in
- ✅ Returns to dashboard
- ✅ Still shows Trial tier

**Record Results**:
```
Test 2A: [ ] PASS  [ ] FAIL
Test 2B: [ ] PASS  [ ] FAIL
Error (if any): ____________________
```

---

## 📊 TEST 3: USMCA WORKFLOW (10 minutes)

### Test 3A: Start Workflow
1. From dashboard, click "Start USMCA Analysis"
2. **Step 1 - Company Info**:
   - Company Name: `Acme Manufacturing`
   - Country: `United States`
   - Industry: `Electronics`
   - Destination: `Canada`
   - Click "Next"

**Expected**: Advances to Step 2

### Test 3B: Add Components
1. **Step 2 - Component Origins**
2. Add 3 components:

**Component 1**:
- Description: `Microcontroller chip`
- Origin: `China`
- Value: `10.50`
- Quantity: `1000`
- Click "Classify with AI"

**Component 2**:
- Description: `Plastic housing`
- Origin: `Mexico`
- Value: `2.25`
- Quantity: `1000`
- Click "Classify with AI"

**Component 3**:
- Description: `Copper wiring`
- Origin: `United States`
- Value: `1.50`
- Quantity: `1000`
- Click "Classify with AI"

**Expected**:
- ✅ AI suggests HS codes for each component
- ✅ Each component shows tariff rates
- ✅ "Analyze USMCA Qualification" button becomes active

**If AI classification fails**:
- Note which component failed
- Check if OpenRouter API key is working
- Try again (might be temporary)

### Test 3C: Run Analysis
1. Click "Analyze USMCA Qualification"
2. Wait for analysis (should take 10-30 seconds)

**Expected**:
- ✅ Shows loading spinner
- ✅ Completes within 30 seconds
- ✅ Shows qualification status (Qualified/Not Qualified)
- ✅ Shows tariff savings calculation
- ✅ Shows component breakdown with rates

**Critical Check**:
- [ ] All 3 components have MFN rates (not 0.0%)
- [ ] Shows USMCA preferential rates
- [ ] Shows savings calculation
- [ ] Shows qualification percentage (e.g., "65% vs 60% required")

**If analysis fails**:
- Screenshot the error
- Check browser console
- Check if it says "API limit reached" (means Trial limit hit)

### Test 3D: View Results & Alerts
1. After analysis completes, go to "Trade Alerts" tab
2. Check if any alerts appear

**Expected**:
- ✅ Either shows relevant alerts OR "No active alerts"
- ✅ If China components, might show Section 301 alert
- ✅ Alert cards have color coding (red/yellow/blue)

**Record Results**:
```
Test 3A: [ ] PASS  [ ] FAIL
Test 3B: [ ] PASS  [ ] FAIL (Component # that failed: ___)
Test 3C: [ ] PASS  [ ] FAIL
Test 3D: [ ] PASS  [ ] FAIL
Analysis Result: [ ] Qualified  [ ] Not Qualified  [ ] Error
Error (if any): ____________________
```

---

## 💳 TEST 4: STRIPE PAYMENT FLOW (10 minutes) ⚠️ CRITICAL

### Test 4A: View Pricing
1. Go to: https://triangle-trade-intelligence.vercel.app/pricing
2. Check all 3 tiers display correctly

**Expected**:
- ✅ Starter: $99/month or $950/year
- ✅ Professional: $299/month or $2,850/year
- ✅ Premium: $599/month or $5,750/year
- ✅ Each tier shows feature list

### Test 4B: Start Checkout (Test Mode)
1. Click "Subscribe" on **Starter Plan** (monthly)
2. Should redirect to Stripe Checkout

**Expected**:
- ✅ Redirects to `checkout.stripe.com`
- ✅ Shows "Triangle Trade Intelligence" as merchant
- ✅ Shows $99.00 amount
- ✅ Shows "Monthly subscription"

### Test 4C: Complete Test Payment
Use Stripe test cards (TEST MODE - no real charges):

1. **Card Number**: `4242 4242 4242 4242`
2. **Expiry**: `12/34` (any future date)
3. **CVC**: `123` (any 3 digits)
4. **Name**: `Test User`
5. **Email**: Your test email from Test 2
6. Click "Subscribe"

**Expected**:
- ✅ Processing spinner appears
- ✅ Redirects back to your site (success page or dashboard)
- ✅ Shows "Payment successful" or similar message

### Test 4D: Verify Subscription Activated
1. Go to dashboard
2. Check subscription tier

**Expected**:
- ✅ Tier changed from "Trial" to "Starter"
- ✅ Shows "15/15 analyses available" (or similar)
- ✅ No more trial limitations

### Test 4E: Verify Stripe Webhook (CRITICAL)
1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Find your webhook endpoint
3. Check recent events

**Expected**:
- ✅ See `checkout.session.completed` event (last few minutes)
- ✅ Status: Green checkmark (succeeded)
- ✅ Response code: 200

**If webhook failed**:
- Click the failed event
- Screenshot the error response
- Note the response code (400/500)
- **THIS IS CRITICAL - subscription won't activate without webhooks**

**Record Results**:
```
Test 4A: [ ] PASS  [ ] FAIL
Test 4B: [ ] PASS  [ ] FAIL
Test 4C: [ ] PASS  [ ] FAIL
Test 4D: [ ] PASS  [ ] FAIL (Tier: ________)
Test 4E: [ ] PASS  [ ] FAIL (Webhook status: ________)
Critical Issues: ____________________
```

---

## 📧 TEST 5: EMAIL SYSTEM (5 minutes)

### Test 5A: Create Test Email Endpoint
1. Open: `D:\bacjup\triangle-simple\pages\api\test-email.js`
2. Copy this code:

```javascript
import { sendWelcomeEmail } from '../../lib/email/resend-client.js';

export default async function handler(req, res) {
  const testUser = {
    email: req.query.email || 'test@example.com',
    full_name: 'Pre-Launch Test User',
    company_name: 'Test Company'
  };

  try {
    const result = await sendWelcomeEmail(testUser);

    res.json({
      success: result.success,
      message: result.success ? 'Email sent! Check your inbox.' : 'Email failed',
      error: result.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

3. Commit and push to deploy:
```bash
git add pages/api/test-email.js
git commit -m "test: Add email system test endpoint"
git push
```

4. Wait 2-3 minutes for Vercel deployment

### Test 5B: Send Test Email
```bash
# Replace YOUR_EMAIL with your actual test email
curl "https://triangle-trade-intelligence.vercel.app/api/test-email?email=YOUR_EMAIL@example.com"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Email sent! Check your inbox.",
  "timestamp": "2025-11-11T..."
}
```

### Test 5C: Check Email Received
1. Check your email inbox (wait up to 2 minutes)
2. Check spam/junk folder if not in inbox

**Expected**:
- ✅ Email arrives within 2 minutes
- ✅ Subject: "Welcome to Triangle Trade Intelligence - Let's Get Started!"
- ✅ Email has proper formatting (not plain text)
- ✅ Blue header with "Triangle Trade Intelligence" logo
- ✅ "Start Your Analysis" button works (links to site)

**If email fails**:
- Check Resend dashboard: https://resend.com/emails
- Look for recent sent emails
- Check delivery status
- Note any error messages

**Record Results**:
```
Test 5A: [ ] PASS  [ ] FAIL (Deployment error: ______)
Test 5B: [ ] PASS  [ ] FAIL (API response: ______)
Test 5C: [ ] PASS  [ ] FAIL (Email arrived: ______)
Email in spam? [ ] YES  [ ] NO
Error (if any): ____________________
```

---

## 🗄️ TEST 6: DATABASE INTEGRITY (3 minutes)

### Test 6A: Check Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/mrwitpgbcaxgnirqtavt/editor
2. Click "user_profiles" table
3. Find your test user

**Expected**:
- ✅ Your test user appears in table
- ✅ `subscription_tier` = "Starter" (if Test 4 passed)
- ✅ `analyses_this_month` = 1 (from Test 3)
- ✅ `trial_ends_at` has a date (7 days from signup)

### Test 6B: Check Workflow Data
1. In Supabase, click "workflow_completions" table
2. Find your test workflow

**Expected**:
- ✅ 1 row with your test company "Acme Manufacturing"
- ✅ `qualification_status` = "Qualified" or "Not Qualified"
- ✅ `estimated_annual_savings` has a number (not NULL)
- ✅ `component_origins` has JSON data

**Record Results**:
```
Test 6A: [ ] PASS  [ ] FAIL (Issue: ______)
Test 6B: [ ] PASS  [ ] FAIL (Issue: ______)
Data looks correct? [ ] YES  [ ] NO
```

---

## 🎯 TEST 7: SUBSCRIPTION LIMITS (5 minutes)

### Test 7A: Check Trial Limit (if you have a Trial account)
1. Create a NEW account (different email): `test+trial@yourdomain.com`
2. Run 1 USMCA analysis
3. Try to run a 2nd analysis

**Expected**:
- ✅ First analysis: Works
- ✅ Second analysis: Shows "Trial limit reached" message
- ✅ Prompts to upgrade to paid plan

### Test 7B: Check Starter Limit
1. Use your Starter account (from Test 4)
2. Dashboard should show "1/15 analyses used"
3. Run 14 more analyses (can be quick dummy data)
4. On the 15th analysis, should work
5. On the 16th analysis, should block

**Expected**:
- ✅ Analyses 1-15: Work normally
- ✅ Analysis 16: Shows "Monthly limit reached"
- ✅ Prompts to upgrade to Professional plan

**Record Results**:
```
Test 7A: [ ] PASS  [ ] FAIL  [ ] SKIPPED (no trial account)
Test 7B: [ ] PASS  [ ] FAIL  [ ] SKIPPED (too time consuming)
Limit enforcement working? [ ] YES  [ ] NO
```

---

## 📊 FINAL RESULTS SUMMARY

### Critical Tests (Must Pass)
- [ ] **Test 2**: User Registration & Login
- [ ] **Test 3C**: USMCA Analysis Completes
- [ ] **Test 4**: Stripe Payment Flow
- [ ] **Test 4E**: Stripe Webhook Working

### Important Tests (Should Pass)
- [ ] **Test 1**: Site Loads
- [ ] **Test 5**: Email Delivery
- [ ] **Test 6**: Database Updates

### Optional Tests (Nice to Have)
- [ ] **Test 7**: Subscription Limits

---

## 🚨 CRITICAL ISSUES (IF ANY FAILED)

### If Test 4E Failed (Webhook)
**Problem**: Payments succeed but subscriptions don't activate
**Fix Required**:
1. Check Vercel environment variables have `STRIPE_WEBHOOK_SECRET`
2. Verify webhook endpoint URL is correct
3. Check webhook logs in Stripe dashboard
**Impact**: HIGH - Users can pay but won't get access
**Can launch?**: NO - Fix this first

### If Test 5 Failed (Email)
**Problem**: Users won't receive welcome emails or alerts
**Fix Required**:
1. Check `RESEND_API_KEY` in Vercel env variables
2. Verify Resend account is active
3. Check if emails are being blocked
**Impact**: MEDIUM - Platform works, but no notifications
**Can launch?**: YES - But fix ASAP

### If Test 3C Failed (USMCA Analysis)
**Problem**: Core feature broken
**Fix Required**:
1. Check `OPENROUTER_API_KEY` is valid
2. Check `ANTHROPIC_API_KEY` as fallback
3. Check Supabase connection
**Impact**: CRITICAL - Core feature doesn't work
**Can launch?**: NO - This is the main product

---

## ✅ LAUNCH READINESS DECISION

**Count your results:**
- Critical Tests Passed: ___/4
- Important Tests Passed: ___/3
- Optional Tests Passed: ___/1

**Decision Matrix:**

| Critical Pass | Important Pass | Ready to Launch? |
|---------------|----------------|------------------|
| 4/4 | 3/3 | ✅ YES - Launch ready |
| 4/4 | 2/3 | ✅ YES - Launch with email issue noted |
| 3/4 | Any | ⚠️ MAYBE - Depends on which test failed |
| <3/4 | Any | ❌ NO - Fix critical issues first |

**Specific Failures:**
- If Test 4E failed (webhook): ❌ DON'T LAUNCH (payments won't work)
- If Test 3C failed (analysis): ❌ DON'T LAUNCH (core feature broken)
- If Test 2 failed (auth): ❌ DON'T LAUNCH (can't login)
- If Test 5 failed (email): ✅ CAN LAUNCH (but fix within 24h)

---

## 📝 REPORT TEMPLATE

Copy this and fill it out:

```
=== PRE-LAUNCH TEST REPORT ===
Date: November 11, 2025
Tester: [Your Name]
Duration: [XX] minutes

CRITICAL TESTS:
- Registration/Login: [PASS/FAIL]
- USMCA Analysis: [PASS/FAIL]
- Stripe Payment: [PASS/FAIL]
- Stripe Webhook: [PASS/FAIL]

IMPORTANT TESTS:
- Site Loads: [PASS/FAIL]
- Email Delivery: [PASS/FAIL]
- Database Updates: [PASS/FAIL]

ISSUES FOUND:
1. [Issue description]
2. [Issue description]

LAUNCH DECISION: [READY / NOT READY / READY WITH CAVEATS]

NOTES:
[Any additional observations]
```

---

## 🎉 POST-TEST ACTIONS

### If All Tests Pass:
1. ✅ Delete test user accounts from Supabase
2. ✅ Switch Stripe from test mode to live mode
3. ✅ Update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to live keys
4. ✅ Test ONE real payment with your own card ($99)
5. ✅ Announce launch! 🚀

### If Any Critical Test Fails:
1. ❌ DO NOT launch
2. 📸 Screenshot all errors
3. 📋 Create GitHub issue with test report
4. 🔧 Fix issues
5. 🔄 Re-run this test script

---

## 💡 TIPS FOR SUCCESS

1. **Use Chrome Incognito** - Fresh session, no cache issues
2. **Open DevTools** - Catch JavaScript errors immediately (F12)
3. **Take Screenshots** - Every error, every success
4. **Don't rush** - Better to find bugs now than after launch
5. **Test on mobile too** - If time permits, repeat Tests 1-3 on phone

---

## 🆘 NEED HELP?

If tests fail and you're not sure why:
1. Screenshot the error
2. Check browser console (F12 → Console)
3. Check Vercel deployment logs
4. Check Stripe webhook logs
5. Check Supabase database directly

**Common Issues**:
- "Network Error": Check internet connection
- "401 Unauthorized": Session expired, login again
- "429 Too Many Requests": Wait 1 minute, try again
- "500 Server Error": Check Vercel function logs

---

**Good luck! You've got this! 🚀**
