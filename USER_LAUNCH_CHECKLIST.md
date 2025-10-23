# User Subscription Launch Checklist
**Focus: Get paying customers NOW. Admin features can wait.**

## 🎯 Critical User Journey (Must Work Perfectly)

### 1. Signup & Trial (7 Days Free)
- [ ] User can signup without credit card
- [ ] Trial ends at 7 days from signup
- [ ] User sees "7 days left" countdown in dashboard
- [ ] After 7 days, workflow requires upgrade
- [ ] Trial user can preview certificate (watermarked)
- [ ] Trial user CANNOT download certificate

**Test:** Create new account, verify trial_ends_at is set correctly

---

### 2. USMCA Workflow (Core Product)
- [ ] Step 1: Company info saves correctly
- [ ] Step 2: Component origins enrichment works
- [ ] Results show correct qualification status
- [ ] Savings calculations are accurate (NO HARDCODED NUMBERS)
- [ ] HS codes classified correctly via AI
- [ ] Tariff rates from AI (2025 policy), NOT database

**Test:** Run full workflow with 3-5 components, verify all numbers

---

### 3. Certificate Generation (Revenue Driver)
- [ ] Preview works for all users
- [ ] Download only for paying subscribers
- [ ] All 3 certificate types work (EXPORTER/IMPORTER/PRODUCER)
- [ ] Company country shows correctly (NOT destination country)
- [ ] No "Missing country" errors
- [ ] Certificate number generates correctly

**Test:** Generate all 3 types, download PDF, verify all fields populated

---

### 4. Pricing & Subscription (Revenue Critical)
**NO HARDCODED PRICES - Use config/service-configurations.js**

- [ ] Pricing page shows correct amounts:
  - Trial: $0 (7 days)
  - Starter: $99/month
  - Professional: $299/month
  - Premium: $599/month

- [ ] Stripe checkout works
- [ ] After payment, user tier updates immediately
- [ ] Subscriber can download certificates
- [ ] Subscriber sees correct service discounts (15% Pro, 25% Premium)

**Test:** Subscribe to Starter plan, verify access unlocked

---

### 5. Dashboard (User Home Base)
- [ ] Shows workflow history
- [ ] Shows alerts (if any)
- [ ] Displays current subscription tier correctly
- [ ] "Request Service" shows correct pricing with discounts
- [ ] Chatbot has "Email Support" button
- [ ] No broken links

**Test:** Navigate entire dashboard, click every link

---

### 6. Service Purchases (Secondary Revenue)
- [ ] Non-subscribers see full prices
- [ ] Professional subscribers see 15% discount
- [ ] Premium subscribers see 25% discount
- [ ] Service request form submits correctly
- [ ] User receives confirmation email

**Test:** Request a service, verify price calculation

---

### 7. Email & Support (Customer Retention)
- [ ] All support emails go to: triangleintel@gmail.com
- [ ] Subject lines auto-populate
- [ ] Dashboard chatbot has email button
- [ ] Contact forms work
- [ ] Footer links work

**Test:** Send test email from each form

---

## 🚫 Known Issues to IGNORE for Launch
These won't stop customers from paying:
- Admin dashboard can wait
- Service delivery workflow can wait (you'll handle manually)
- Analytics can wait
- Edge cases in complex workflows

---

## ✅ Pre-Launch Test Script

### Test 1: New User Trial Journey (30 min)
```
1. Signup (new email)
2. Run USMCA workflow (3 components)
3. Preview certificate
4. Try to download → Blocked (trial)
5. Verify trial expiration date shows
```

### Test 2: Paid Subscriber Journey (30 min)
```
1. Signup with test Stripe card
2. Subscribe to Starter ($99)
3. Verify tier shows in dashboard
4. Run USMCA workflow
5. Download certificate successfully
6. Request a service → Verify NO discount (Starter)
```

### Test 3: Premium Subscriber Journey (30 min)
```
1. Signup with test Stripe card
2. Subscribe to Premium ($599)
3. Run workflow
4. Download certificate
5. Request service → Verify 25% discount applied
```

### Test 4: Critical Numbers Verification (15 min)
```
1. Pricing page: Verify $99, $299, $599 displayed
2. Service request: Verify discounts calculate correctly
3. Workflow results: Verify no hardcoded tariff rates
4. Certificate: Verify all fields populated correctly
```

---

## 🎯 Launch Readiness Score

**You're ready to launch when:**
- ✅ All 4 test scripts pass
- ✅ Certificate downloads work for paying users
- ✅ Stripe payments process correctly
- ✅ No hardcoded numbers found in pricing/workflows
- ✅ Support email works (triangleintel@gmail.com)

**You can launch even if:**
- ❌ Admin dashboard has bugs (handle services manually)
- ❌ Analytics incomplete (add later)
- ❌ Some alerts don't trigger (improve over time)

---

## 💰 Revenue Protection Checklist

**These bugs would LOSE MONEY - fix immediately:**
1. User can download certificate without paying
2. Subscription doesn't unlock features
3. Pricing shows wrong amounts
4. Stripe checkout broken
5. Service discounts calculate incorrectly

**These bugs are ANNOYING but won't lose money:**
1. Admin dashboard broken (you handle manually)
2. Some alerts missing (users still get value)
3. Slow AI responses (still works)
4. Minor UI glitches (users tolerate)

---

## 🚀 Launch Confidence Statement

**You can launch when you can honestly say:**

> "A new user can signup, run the USMCA workflow, see accurate results, upgrade to a paid plan, download their certificate, and request professional services - all without bugs that block revenue."

Everything else can be fixed AFTER you have paying customers.

---

## Next Steps

1. **Run the 4 test scripts above** (2 hours total)
2. **Fix any critical bugs** found
3. **Launch marketing** (social media, ads, outreach)
4. **Get first paying customer** 🎉
5. **Pay back your mother** ❤️
6. **Improve admin features** while customers keep coming

You've got this! The platform is ready. Time to launch. 🚀
