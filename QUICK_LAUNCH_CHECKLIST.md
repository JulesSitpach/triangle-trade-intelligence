# ⚡ QUICK LAUNCH CHECKLIST
**30-Minute Version** - Essential tests only

---

## 🎯 THE 5 CRITICAL TESTS

### ✅ 1. CAN USERS SIGN UP? (3 min)
```
Go to: /signup
Create account with: test+launch@yourmail.com
Expected: Redirects to dashboard, shows "Trial" tier
```
**Result**: [ ] PASS  [ ] FAIL

---

### ✅ 2. CAN USERS RUN ANALYSIS? (10 min)
```
1. Start USMCA workflow
2. Add company: "Acme Inc", Industry: "Electronics", Destination: "Canada"
3. Add 3 components:
   - "Microcontroller" from China, $10.50, qty 1000
   - "Plastic housing" from Mexico, $2.25, qty 1000
   - "Copper wire" from USA, $1.50, qty 1000
4. Click "Classify with AI" for each
5. Click "Analyze USMCA Qualification"
6. Wait for results

Expected:
- Shows qualification status
- Shows tariff rates for all components
- Shows savings calculation
```
**Result**: [ ] PASS  [ ] FAIL
**Qualification**: [ ] Qualified [ ] Not Qualified
**Savings Shown**: $________

---

### ✅ 3. CAN USERS PAY? (10 min) ⚠️ MOST CRITICAL
```
1. Go to /pricing
2. Click "Subscribe" on Starter Plan ($99/month)
3. Use test card: 4242 4242 4242 4242, exp: 12/34, cvc: 123
4. Complete checkout

Expected:
- Redirects to Stripe checkout
- Payment succeeds
- Returns to your site
- Dashboard shows "Starter" tier (not "Trial")
```
**Result**: [ ] PASS  [ ] FAIL
**New Tier**: __________

**CRITICAL CHECK - Stripe Webhook**:
```
Go to: https://dashboard.stripe.com/test/webhooks
Check: Last event = "checkout.session.completed" with ✅ green checkmark
```
**Webhook Status**: [ ] SUCCESS (200)  [ ] FAILED (___) ⚠️

---

### ✅ 4. DO EMAILS SEND? (5 min)
```
1. Deploy test endpoint:
   git add pages/api/test-email.js
   git commit -m "test: email"
   git push

2. Wait 2 min, then run:
   curl "https://triangle-trade-intelligence.vercel.app/api/test-email?email=YOUR_EMAIL"

3. Check your inbox (wait 2 min)

Expected:
- API returns: "success": true
- Email arrives in inbox
- Subject: "Welcome to Triangle Trade Intelligence"
```
**Result**: [ ] PASS  [ ] FAIL
**Email Arrived**: [ ] YES (inbox)  [ ] YES (spam)  [ ] NO

---

### ✅ 5. IS DATA SAVING? (2 min)
```
1. Go to Supabase: https://supabase.com/dashboard/project/mrwitpgbcaxgnirqtavt
2. Check "user_profiles" table → Find your test user
3. Check "workflow_completions" table → Find "Acme Inc"

Expected:
- User exists with subscription_tier = "Starter"
- Workflow exists with qualification_status and savings
```
**Result**: [ ] PASS  [ ] FAIL

---

## 🚦 LAUNCH DECISION

Count your passes: ___/5

- **5/5**: ✅ **LAUNCH READY** - Everything works perfectly
- **4/5**: ⚠️ **DEPENDS**:
  - If Test 3 (Webhook) failed: ❌ DON'T LAUNCH (payments won't activate)
  - If Test 4 (Email) failed: ✅ CAN LAUNCH (but fix within 24h)
  - Otherwise: ✅ CAN LAUNCH
- **<4/5**: ❌ **NOT READY** - Fix issues first, retest

---

## ❌ CRITICAL FAILURE RESPONSES

### If Test 3 Failed (Webhook) ⚠️ CRITICAL
**Problem**: Users can pay but subscriptions won't activate
**Fix**:
1. Check Vercel env vars have `STRIPE_WEBHOOK_SECRET`
2. Check webhook endpoint in Stripe dashboard
3. View error in Stripe webhook logs
**Can Launch**: ❌ NO - Must fix first

### If Test 2 Failed (Analysis) ⚠️ CRITICAL
**Problem**: Core product doesn't work
**Fix**:
1. Check `OPENROUTER_API_KEY` in Vercel
2. Check `ANTHROPIC_API_KEY` as backup
3. Test API keys manually
**Can Launch**: ❌ NO - Must fix first

### If Test 4 Failed (Email)
**Problem**: No welcome emails or alerts
**Fix**:
1. Check `RESEND_API_KEY` in Vercel
2. Verify Resend account active
**Can Launch**: ✅ YES - But fix within 24h

---

## ✅ IF ALL TESTS PASS

**Before Going Live**:
1. [ ] Delete test user accounts
2. [ ] Switch Stripe to LIVE mode
3. [ ] Update Stripe keys in Vercel (live keys)
4. [ ] Test ONE real payment with your card
5. [ ] Announce launch 🚀

**Live Stripe Keys** (from .env.local lines 16-17):
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RAvYo...
STRIPE_SECRET_KEY=sk_live_51RAvYo...
```

---

## 📸 EVIDENCE CHECKLIST

Take screenshots of:
- [ ] Successful payment in Stripe dashboard
- [ ] Green webhook checkmark in Stripe
- [ ] User dashboard showing "Starter" tier
- [ ] USMCA analysis results page
- [ ] Welcome email in inbox
- [ ] Supabase database with user data

---

## ⏱️ TIME BREAKDOWN

- Test 1 (Signup): 3 min
- Test 2 (Analysis): 10 min
- Test 3 (Payment): 10 min
- Test 4 (Email): 5 min
- Test 5 (Database): 2 min
**Total**: 30 minutes

---

## 🎯 FINAL STATUS

**Date Tested**: __________
**Time**: __________
**Results**: ___/5 passed

**Launch Decision**:
```
[ ] ✅ READY TO LAUNCH
[ ] ⚠️ READY WITH MINOR ISSUES (list: _____________)
[ ] ❌ NOT READY (critical issues: _____________)
```

**Next Steps**:
1. _______________________
2. _______________________
3. _______________________

---

**You've got this! 🚀**
