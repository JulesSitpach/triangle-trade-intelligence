# User Production Readiness Checklist
**Focus: SMB Customer Experience Must Be Perfect**

## 🎯 Critical User Journeys (Test These End-to-End)

### Journey 1: First-Time Visitor → Free Analysis
```
[ ] 1. Visit homepage (/)
[ ] 2. Click "Start USMCA Analysis"
[ ] 3. Complete 2-step workflow WITHOUT login
[ ] 4. See results page
[ ] 5. Results show: Qualified OR Not Qualified
[ ] 6. VERIFY: No broken links, no errors, clear next steps
```

**Expected Result:** Visitor can run analysis in 5 minutes, sees clear results

---

### Journey 2: Analysis → Subscribe
```
[ ] 7. From results page, click "Subscribe" CTA
[ ] 8. Redirected to /pricing
[ ] 9. Review 3 tiers (Professional, Business, Professional Plus)
[ ] 10. Click "Subscribe to Professional" ($99/mo)
[ ] 11. Stripe checkout opens
[ ] 12. Complete payment (use test card: 4242 4242 4242 4242)
[ ] 13. Redirected back to site
[ ] 14. Can access /dashboard
[ ] 15. VERIFY: Subscription shows in dashboard, no errors
```

**Expected Result:** Clean payment flow, immediate access to dashboard

---

### Journey 3: Subscribe → Request Service
```
[ ] 16. Visit /services page
[ ] 17. See 6 professional services with prices
[ ] 18. VERIFY: Subscriber prices shown correctly (e.g. $250 not $300)
[ ] 19. Click "Request Service" for any service
[ ] 20. Fill out service request form
[ ] 21. Submit form
[ ] 22. VERIFY: Confirmation message, service appears in /my-services
```

**Expected Result:** Clear service pricing, easy request process

---

## 📱 Mobile Responsiveness (Test on iPhone/Android)

```
[ ] 23. Homepage loads correctly on mobile
[ ] 24. Navigation menu works (hamburger menu)
[ ] 25. USMCA workflow forms are usable on small screens
[ ] 26. Pricing page readable on mobile
[ ] 27. "What Subscribers Get Every Week" section renders properly
[ ] 28. All buttons are tappable (not too small)
[ ] 29. Text is readable without zooming
[ ] 30. No horizontal scrolling
```

**Test Devices:**
- iPhone 15 (Safari)
- Android (Chrome)
- iPad (Safari)

---

## 🔍 Pricing Page Verification (Critical!)

```
[ ] 31. No broken links in navigation (solutions, industries, intelligence DELETED)
[ ] 32. Hero says "For Small Importers" NOT "Enterprise Pricing"
[ ] 33. 3 tiers: Professional, Business, Professional Plus (NOT "Enterprise")
[ ] 34. Professional tier ($99/mo) features:
    [ ] Weekly USMCA policy digest (expert-curated)
    [ ] Tariff change alerts for your HS codes
    [ ] Unlimited USMCA qualification checks
    [ ] AI HS code suggestions and certificate templates
    [ ] Saves 5-10 hours/week monitoring customs.gov yourself

[ ] 35. Business tier ($299/mo) features:
    [ ] Everything in Professional
    [ ] Real-time crisis alerts (tariff changes, trade disputes)
    [ ] Priority email support (24-48 hour response)
    [ ] 20% discount on professional services
    [ ] Advanced trade policy analysis

[ ] 36. Professional Plus tier ($599/mo) features:
    [ ] Everything in Business
    [ ] Weekly expert-curated trade policy digest
    [ ] Quarterly 1-on-1 strategy calls with Jorge & Cristina
    [ ] 30% discount on professional services
    [ ] ⚠️ Limited availability - only 30 subscribers accepted

[ ] 37. "What Subscribers Get Every Week" section visible
    [ ] 📧 Monday Morning Digest card
    [ ] 🚨 Real-Time HS Code Alerts card
    [ ] 💰 ROI for Small Importers card

[ ] 38. FAQ section updated:
    [ ] "How do I get started?" (NOT "Is there a free trial?")
    [ ] "What makes your professional services different?" (NOT "3-person team capacity")
    [ ] Answers emphasize expertise and quality

[ ] 39. Footer says "small manufacturers and importers" (NOT "enterprise clients")

[ ] 40. Professional services section shows:
    [ ] Non-subscriber prices first ($300, $240, $480, $540, $780, $660)
    [ ] Subscriber savings clear ($250, $200, $400, $450, $650, $550)
    [ ] Discount amounts visible
```

---

## 🧭 Navigation Consistency (No Broken Links!)

**Check these pages:**
```
[ ] 41. / (homepage) - All links work
[ ] 42. /pricing - All links work
[ ] 43. /services - All links work
[ ] 44. /usmca-workflow - All links work
[ ] 45. /dashboard - All links work
[ ] 46. /login - All links work
[ ] 47. /signup - All links work
[ ] 48. /my-services - All links work
[ ] 49. /contact - All links work
```

**Verify NO links to deleted pages:**
- ❌ /solutions
- ❌ /industries
- ❌ /intelligence
- ❌ /supplier-capability-assessment
- ❌ /sales-presentations
- ❌ /system-status
- ❌ /simple-certificate
- ❌ /certificates

---

## 📝 Copy/Language Audit (SMB Focus)

**Search entire site for "enterprise" (case-insensitive):**
```bash
# Run this command:
grep -ri "enterprise" pages/*.js --exclude-dir=admin --exclude-dir=api
```

```
[ ] 50. No "enterprise" language on user-facing pages
[ ] 51. All copy speaks to "small importers," "small manufacturers," "SMBs"
[ ] 52. No "Fortune 500" or "large-scale" language
[ ] 53. Benefits focus on time savings and cost reduction
[ ] 54. Professional services emphasize expertise (not team size)
```

---

## 💳 Payment Flow (Stripe Integration)

```
[ ] 55. Stripe checkout opens correctly
[ ] 56. Test card works (4242 4242 4242 4242, any future date, any CVV)
[ ] 57. After payment, user redirected to success page
[ ] 58. Subscription recorded in database
[ ] 59. User can see subscription in /dashboard
[ ] 60. User can cancel subscription in /account/subscription
[ ] 61. Professional services payment works
[ ] 62. Service requests linked to Stripe payment
```

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication required: `4000 0025 0000 3155`

---

## 🚨 Error Handling (Graceful Failures)

```
[ ] 63. Workflow API fails → User sees friendly error message
[ ] 64. Stripe checkout fails → User sees retry option
[ ] 65. Login fails → Clear error message (wrong password, etc.)
[ ] 66. Service request without login → Prompted to login/signup
[ ] 67. Network timeout → Loading state doesn't hang forever
[ ] 68. 404 pages show helpful navigation back to homepage
```

---

## 🔐 Authentication Flow

```
[ ] 69. User can signup at /signup
[ ] 70. Signup form title says "Create Account" (NOT "Start Free Trial")
[ ] 71. User can login at /login
[ ] 72. After login, user redirected to /dashboard
[ ] 73. User can logout
[ ] 74. After logout, protected pages redirect to /login
[ ] 75. Password reset flow works
```

---

## 📊 Dashboard Verification

```
[ ] 76. Dashboard loads without errors
[ ] 77. Shows user's subscription tier
[ ] 78. Shows service requests status
[ ] 79. Links to /my-services work
[ ] 80. Links to /account/subscription work
[ ] 81. "Start USMCA Analysis" link works
```

---

## 📧 Email Confirmations (If Implemented)

```
[ ] 82. Signup sends welcome email
[ ] 83. Subscription confirmation email sent
[ ] 84. Service request confirmation email sent
[ ] 85. Weekly digest received (if subscribed)
[ ] 86. Unsubscribe link works
```

**Note:** Email monitoring is manual curation, so this tests the system works when you send emails.

---

## 🎨 Visual/UX Polish

```
[ ] 87. All images load correctly
[ ] 88. Video on homepage plays correctly (earth-seamless-loop.mp4)
[ ] 89. No console errors in browser DevTools
[ ] 90. Loading states show during API calls
[ ] 91. Success/error messages are clear
[ ] 92. Forms have clear labels and placeholders
[ ] 93. Buttons have clear CTAs (no generic "Submit")
[ ] 94. Colors are professional (no bright/harsh colors)
[ ] 95. Typography is readable (no tiny text)
```

---

## 🔍 SEO/Meta Tags (SMB Focused)

```
[ ] 96. Homepage title: "Triangle Trade Intelligence | USMCA Compliance..."
[ ] 97. Pricing page title: "Affordable Plans for Small Importers"
[ ] 98. Services page title: Mentions "small businesses" or "SMBs"
[ ] 99. Meta descriptions focus on SMB benefits
[ ] 100. No "enterprise" in any meta tags
```

---

## ✅ Final Pre-Launch Checklist

```
[ ] 101. Run full test suite: npm test
[ ] 102. Check production build: npm run build
[ ] 103. Test production build locally: npm start
[ ] 104. Verify environment variables set:
    [ ] NEXT_PUBLIC_SUPABASE_URL
    [ ] SUPABASE_SERVICE_ROLE_KEY
    [ ] STRIPE_PUBLIC_KEY
    [ ] STRIPE_SECRET_KEY
    [ ] SENDGRID_API_KEY (for email monitoring)

[ ] 105. Database tables exist:
    [ ] user_profiles
    [ ] service_requests
    [ ] usmca_workflows
    [ ] email_logs

[ ] 106. SSL certificate valid (HTTPS working)
[ ] 107. Custom domain configured (if applicable)
[ ] 108. Analytics tracking set up (Google Analytics, etc.)
[ ] 109. Error monitoring set up (Sentry, etc.)
[ ] 110. Backup strategy in place for database
```

---

## 🎯 Critical Issues to Fix Before Launch

**If ANY of these fail, DO NOT launch:**

1. ❌ Broken navigation links (404 errors)
2. ❌ Stripe payment flow broken
3. ❌ User cannot complete USMCA workflow
4. ❌ Signup/login broken
5. ❌ Mobile site completely broken
6. ❌ "Enterprise" language still visible
7. ❌ Pricing tiers incorrect
8. ❌ Professional services pricing wrong

---

## 🚀 Launch Day Smoke Test (5 Minutes)

```
1. Visit homepage as anonymous user
2. Run USMCA workflow
3. Subscribe to Professional tier ($99/mo)
4. Request a service
5. Logout and login
6. Check dashboard
7. Verify everything works
```

**If this 5-minute flow works perfectly, you're ready to launch.**

---

## 📱 Quick Testing Commands

```bash
# Check for broken links to deleted pages
grep -r "href=\"/solutions\|href=\"/industries\|href=\"/intelligence\|href=\"/supplier-capability" pages/*.js

# Check for "enterprise" language on user pages
grep -ri "enterprise" pages/*.js --exclude-dir=admin --exclude-dir=api | grep -v "Professional Plus"

# Check for "free trial" mentions
grep -ri "free trial\|Free Trial" pages/*.js --exclude-dir=admin --exclude-dir=api

# Check for "3-person team" capacity language
grep -r "3-person team\|40/month\|8-10/month" pages/pricing.js

# Run linter
npm run lint

# Build production
npm run build
```

---

## 🎉 Success Criteria

**You're ready to launch when:**

✅ All 110 checklist items pass
✅ 5-minute smoke test works perfectly
✅ No "enterprise" language visible to SMBs
✅ Pricing page shows clear SMB value
✅ Mobile experience is smooth
✅ Payment flow works end-to-end
✅ No broken links anywhere
✅ Zero console errors

**Then launch and monitor:**
- User signups per day
- Workflow completion rate
- Free → Paid conversion rate
- Service request rate
- Customer support tickets

---

**Bottom Line:** If an SMB owner can visit your site, run a free analysis, understand the pricing, subscribe, and request a service WITHOUT CONFUSION, you're ready to launch. 🚀
