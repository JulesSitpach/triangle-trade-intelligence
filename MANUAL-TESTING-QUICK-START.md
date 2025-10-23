# Manual Testing Quick Start Guide
**Phase 3a/3b/3c - Dashboard & Alerts Testing**

---

## ✅ What's Ready for Testing

### Data Bugs Already Fixed
All API data format issues have been resolved:
- ✅ Alert field names corrected (overall_risk_level, risk_score, alert_count)
- ✅ Recommendations structure fixed (immediate_actions)
- ✅ Estimated savings no longer hardcoded
- **Status**: Ready for browser testing

### Test Data Available
- ✅ `SUBSCRIPTION_TIER_TEST_SCRIPT.md` - 4 test accounts with complete company data
- ✅ `SAFE_TESTING_WITHOUT_DEPLOYMENT_RISK.md` - Testing strategies
- ✅ `TESTING_STRATEGY_FOR_CRITICAL_FIXES.md` - Detailed test procedures
- ✅ `test-dashboard-api.js` - Programmatic API verification script

### Server Status
- ✅ Dev server running on `http://localhost:3001`
- ✅ Authentication working
- ✅ Dashboard endpoint functional (returns 122 workflows, 5 alerts)

---

## 🚀 Quick Start: Manual Testing Workflow

### Step 1: Access the App
```
URL: http://localhost:3001
Login: macproductions010@gmail.com / Test2025!
```

### Step 2: Test Account
You're already logged in with the **Trial Account** which has:
- 122 workflows in database
- 5 crisis alerts
- 7-day trial countdown

### Step 3: Navigate to Dashboard
```
http://localhost:3001/dashboard
```

### Step 4: Test Each Section
1. **My Certificates Section**
   - [ ] Select from dropdown (122 items)
   - [ ] View qualification status
   - [ ] See component breakdown
   - [ ] Click "Download Certificate" (should show upgrade message for trial)

2. **Trade Alerts Section**
   - [ ] Select from dropdown (5 items)
   - [ ] See risk level and styling
   - [ ] View alert details (title, impact, actions)
   - [ ] Click "View Full Alert" (should navigate to trade-risk-alternatives page)

---

## 📋 Test Data Reference (Copy-Paste Ready)

### Current Login (Already Active)
```
Email: macproductions010@gmail.com
Password: Test2025!
Status: Trial user with test data loaded
```

### Additional Test Accounts (from SUBSCRIPTION_TIER_TEST_SCRIPT.md)

**Starter Tier ($99/month)**:
```
Email: starter@testcompany.com
Password: Pass123!
Company: MexManufacturing Ltd
Location: Monterrey, Mexico
```

**Professional Tier ($299/month)**:
```
Email: pro@testcompany.com
Password: Pass123!
Company: CanadaDistribution Inc
Location: Toronto, Canada
```

**Premium Tier ($599/month)**:
```
Email: premium@testcompany.com
Password: Pass123!
Company: GlobalWholesale Corp
Location: Houston, USA
```

---

## 🎯 Phase 3a: Login Flow Testing

**Checklist**:
- [ ] Login page loads
- [ ] Email/password validation works
- [ ] Session created successfully
- [ ] Redirected to dashboard after login
- [ ] User profile displays correctly
- [ ] Subscription tier shows

**Expected Result**: ✅ User should be logged in and see their dashboard

---

## 🎯 Phase 3b: Dashboard Display Testing

**Checklist**:
- [ ] Dashboard page loads (http://localhost:3001/dashboard)
- [ ] Trial countdown banner displays (7 days remaining)
- [ ] Usage tracker shows correct tier limits
- [ ] "My Certificates" section renders
  - [ ] Dropdown has 122 items
  - [ ] First workflow auto-selected
  - [ ] Component breakdown table visible
  - [ ] Tariff rates displaying
  - [ ] Savings amount shown (now fixed - no longer $0)
- [ ] "Trade Alerts" section renders
  - [ ] Dropdown has 5 items
  - [ ] Alert details display
  - [ ] Risk level shows with correct styling
  - [ ] Primary vulnerabilities list visible
  - [ ] Recommended actions list visible

**Expected Result**: ✅ All data sections display correctly with proper formatting

---

## 🎯 Phase 3c: Alert Interaction Testing

**Checklist**:
- [ ] Click alert in dropdown - details update
- [ ] "View Full Alert" button visible
- [ ] Click "View Full Alert"
  - [ ] Navigates to `/trade-risk-alternatives?analysis_id=<id>`
  - [ ] Alert details page loads
  - [ ] Related product information shows
- [ ] Delete alert button works
  - [ ] Confirmation dialog appears
  - [ ] Alert removed after confirmation
  - [ ] Dashboard refreshes with updated list
- [ ] Bulk "Clear All Alerts" works
  - [ ] Confirmation shows count of alerts
  - [ ] All 5 alerts deleted
  - [ ] Dashboard shows "No alerts yet"

**Expected Result**: ✅ All alert interactions work smoothly

---

## 🐛 Critical Bug Checklist (Already Fixed)

| Bug | Status | Verification |
|-----|--------|--------------|
| Alert overall_risk_level missing | ✅ FIXED | Alert dropdown should show risk level |
| Alert risk_score missing | ✅ FIXED | Alert details should show "Risk Score X/100" |
| Alert count missing | ✅ FIXED | Alert details should show "X alerts detected" |
| Recommendations immediate_actions missing | ✅ FIXED | Recommended Actions list should populate |
| Estimated annual savings hardcoded to $0 | ✅ FIXED | Workflow savings should show actual values |

---

## 💡 Testing Tips

### If Something Breaks
1. **Check browser console** (F12 → Console tab)
2. **Check server logs** (terminal where `npm run dev:3001` is running)
3. **Note the exact error** with steps to reproduce
4. **Check git status** to see what changed: `git status`

### Data Inspection
**To verify API data manually**:
```bash
# Run the test script to see actual API response
node test-dashboard-api.js
```

This will show:
- Workflows returned
- Alerts returned
- Usage stats
- All field names and values

### Browser DevTools
- **Network tab**: Verify `/api/dashboard-data` returns correct JSON
- **Console tab**: Check for JavaScript errors
- **Application tab**: Verify session cookie is set

---

## 🚨 What NOT to Test Yet

❌ Stripe payment integration (use test card 4242 4242 4242 4242 if testing signup)
❌ Email alerts (RSS monitoring backend not in scope)
❌ Admin dashboard (removed, not part of SaaS model)
❌ Multi-user collaboration (SaaS is single-user only)

---

## 📊 Success Criteria

### Phase 3a (Login)
- User can login
- Session persists
- Redirected to dashboard

### Phase 3b (Display)
- Dashboard loads
- All sections render
- Data displays correctly
- No console errors

### Phase 3c (Interaction)
- Dropdowns work
- Buttons work
- Navigation works
- CRUD operations work

**Go-Live Ready When**: ✅ All 3 phases pass without critical errors

---

## 📞 Questions/Issues?

If something doesn't work:
1. **Check the PROGRAMMATIC-ANALYSIS-REPORT.md** for API structure details
2. **Check the server console** for error messages
3. **Verify the session cookie** is in your requests (check Network tab)
4. **Verify all 5 alert fields** are present in API response (use test-dashboard-api.js)

---

**Ready to start Phase 3a? Login at http://localhost:3001** 🚀
