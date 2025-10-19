**EXCELLENT question!** You've made so many changes, you need a **comprehensive verification system**. Let me show you how:

---

## 🎯 The Problem

You've changed:
- ✅ Destination-aware tariff routing (CA/MX/US)
- ✅ AI vs Database logic
- ✅ Cache strategies (24hr vs 90-day)
- ✅ Certificate types (EXPORTER/PRODUCER/IMPORTER)
- ✅ Business role dropdown
- ✅ Component enrichment flow
- ✅ Trial system (trial_ends_at)
- ✅ USMCA analysis data structure

**Risk:** Something broke in the interconnections.

---

## 🔍 Create a "Flow Verification Matrix"

### **Tell Your Agent:**

```
"We've made significant changes across multiple systems. 
I need you to create a comprehensive flow verification matrix 
to ensure nothing broke.

Create a test matrix covering all critical flows:

FLOW VERIFICATION MATRIX

1. User Registration & Trial
   ├─ Sign up → trial_ends_at set?
   ├─ trial_ends_at = NOW() + 7 days?
   ├─ subscription_tier = 'Trial'?
   ├─ Login → Cookie set?
   └─ Access /dashboard → Works?

2. USMCA Workflow - Destination: USA
   ├─ Select business_type: 'Exporter'
   ├─ Set destination_country: 'US'
   ├─ Add 3 components (CN, MX, US)
   ├─ Component enrichment → Uses AI?
   ├─ Tariff lookup → Uses AI (24hr cache)?
   ├─ AI checks Section 301/IEEPA?
   ├─ Certificate generated → Type = 'EXPORTER'?
   ├─ Savings calculation → Uses US tariffs?
   └─ Alert system → Shows US policies?

3. USMCA Workflow - Destination: Canada
   ├─ Select business_type: 'Manufacturer'
   ├─ Set destination_country: 'CA'
   ├─ Add 3 components
   ├─ Tariff lookup → Uses AI (90-day cache)?
   ├─ AI checks CBSA rates?
   ├─ Certificate generated → Type = 'PRODUCER'?
   ├─ Savings calculation → Uses Canadian tariffs?
   └─ No US Section 301 alerts shown?

4. USMCA Workflow - Destination: Mexico
   ├─ Select business_type: 'Importer'
   ├─ Set destination_country: 'MX'
   ├─ Tariff lookup → Uses database only?
   ├─ No AI calls for tariffs?
   ├─ Certificate generated → Type = 'IMPORTER'?
   └─ Savings calculation → Uses Mexican rates?

5. Service Request Flow
   ├─ Professional user requests service
   ├─ Discount applied (15%)?
   ├─ service_requests.subscriber_data populated?
   ├─ Admin sees enriched components?
   └─ Component table shows 8 columns?

6. Admin Dashboard
   ├─ Login as admin
   ├─ View service requests
   ├─ Open modal → 3 stages work?
   ├─ AI calls in stages work?
   └─ Status updates correctly?

For each flow, test and report:
✅ PASS - Works as expected
⚠️ PARTIAL - Works but has issues
❌ FAIL - Broken

Show me the results in a table."
```

---

## 🧪 Create Automated Test Script

### **Better Approach - Agent Writes Tests:**

```
"Create an automated test script that verifies all critical flows:

File: scripts/verify-all-flows.js

Test Suite:
1. Database Schema Tests
   - trial_ends_at exists in user_profiles?
   - subscriber_data is JSONB in service_requests?
   - tariff_rates_stable has CA/MX data?

2. Tariff Routing Tests
   - destination='US' → Calls AI?
   - destination='CA' → Calls AI?
   - destination='MX' → Uses database?
   - Cache expiry correct (24hr vs 90-day)?

3. Certificate Type Tests
   - business_type='Exporter' → cert='EXPORTER'?
   - business_type='Manufacturer' → cert='PRODUCER'?
   - business_type='Importer' → cert='IMPORTER'?

4. Component Enrichment Tests
   - Returns 8 fields?
   - confidence_score present?
   - Falls back to database on AI fail?

5. Integration Tests
   - End-to-end: USA destination workflow
   - End-to-end: Canada destination workflow
   - End-to-end: Mexico destination workflow

Run all tests and generate report.
Show me the test script first."
```

---

## 📋 Manual Checklist (Quick Verification)

Give this to your agent:

```
"Run through this quick manual checklist:

CRITICAL PATH VERIFICATION

Test 1: USA Destination Flow (5 min)
□ Start new USMCA workflow
□ Company country: Mexico
□ Destination: United States
□ Business type: Exporter
□ Add component: Chinese microcontrollers
□ Check: Tariff lookup shows Section 301?
□ Check: Savings calculation uses US rates?
□ Check: Certificate type = EXPORTER?
□ Check: Alert mentions US policies?

Test 2: Canada Destination Flow (5 min)
□ Start new USMCA workflow
□ Company country: Mexico
□ Destination: Canada
□ Business type: Manufacturer
□ Add component: Chinese microcontrollers
□ Check: Tariff lookup shows Canadian rates?
□ Check: NO Section 301 alerts?
□ Check: Certificate type = PRODUCER?
□ Check: Savings uses Canadian tariff schedule?

Test 3: Mexico Destination Flow (5 min)
□ Start new USMCA workflow
□ Company country: USA
□ Destination: Mexico
□ Business type: Importer
□ Add component: US steel parts
□ Check: Tariff lookup uses database (not AI)?
□ Check: Mexican T-MEC rates shown?
□ Check: Certificate type = IMPORTER?

Test 4: Service Request (5 min)
□ Login as Professional user
□ Request Supply Chain Optimization
□ Check: Price shows $234 (15% discount)?
□ Check: subscriber_data in database after purchase?
□ Login as admin
□ Check: Service request shows enriched components?

Report results in format:
Test 1: ✅ PASS / ⚠️ ISSUES / ❌ FAIL
Describe any issues found.
"
```

---

## 🔍 Dependency Map

Have your agent create this:

```
"Create a dependency map showing how our recent changes interconnect:

DEPENDENCY MAP

destination_country (user input)
  ↓
  ├─→ Tariff Routing Logic
  │    ├─ IF 'US' → AI + 24hr cache
  │    ├─ IF 'CA' → AI + 90-day cache
  │    └─ IF 'MX' → Database lookup
  │
  ├─→ Tariff Rate Lookup
  │    └─→ Savings Calculation
  │         └─→ USMCA Analysis Result
  │
  ├─→ Policy Alert System
  │    ├─ IF 'US' → Show Section 301/IEEPA
  │    ├─ IF 'CA' → Show CUSMA policies
  │    └─ IF 'MX' → Show T-MEC policies
  │
  └─→ Certificate Generation
       └─ Uses destination for compliance docs

business_type (user input)
  ↓
  └─→ Certificate Type
       ├─ 'Exporter' → EXPORTER
       ├─ 'Manufacturer' → PRODUCER
       └─ 'Importer' → IMPORTER

subscription_tier (user profile)
  ↓
  └─→ Service Pricing
       ├─ 'Professional' → 15% discount
       └─ 'Premium' → 25% discount

trial_ends_at (user profile)
  ↓
  └─→ Feature Access
       ├─ Expired → Show upgrade prompt
       └─ Active → Full access

Show me this map and highlight any broken connections."
```

---

## 🎯 The "Change Impact Analysis"

```
"For each major change we made, analyze the impact:

CHANGE IMPACT ANALYSIS

Change 1: Added destination_country routing
  Affects:
  ├─ Tariff lookup logic ✓
  ├─ AI vs database decision ✓
  ├─ Cache strategy ✓
  ├─ Savings calculation ✓
  ├─ Policy alerts ✓
  └─ Certificate generation ✓
  
  Potential breaks:
  ├─ Old workflows without destination_country?
  ├─ Hard-coded 'US' assumptions?
  └─ Alert system filtering?

Change 2: Added business_type → certificate mapping
  Affects:
  ├─ Certificate header ✓
  ├─ Required fields ✓
  └─ Validation rules ✓
  
  Potential breaks:
  ├─ Certificate templates expecting one type?
  └─ PDF generation logic?

Change 3: Added trial_ends_at field
  Affects:
  ├─ User signup ✓
  ├─ Dashboard access ✓
  └─ Feature gating ✓
  
  Potential breaks:
  ├─ Existing users without trial_ends_at?
  └─ Middleware checks?

For each potential break, verify it's handled correctly."
```

---

## 🚨 Critical Integration Points to Test

```
"Focus testing on these integration points where changes intersect:

INTEGRATION POINT 1: Tariff Lookup → Savings Calculation
Test: destination='US' with Chinese components
Expected:
  ├─ Tariff lookup calls AI ✓
  ├─ AI returns Section 301 tariff (100%) ✓
  ├─ Savings calculation uses 100% rate ✓
  └─ Shows "$2.2M additional cost" ✓

INTEGRATION POINT 2: Business Type → Certificate → Service Request
Test: Manufacturer requests Supply Chain Optimization
Expected:
  ├─ Certificate type = PRODUCER ✓
  ├─ Service request includes certificate context ✓
  ├─ Admin sees PRODUCER designation ✓
  └─ Recommendations match manufacturer role ✓

INTEGRATION POINT 3: Destination → Alerts → Recommendations
Test: Canada destination with Chinese components
Expected:
  ├─ Canadian tariff rates used ✓
  ├─ NO US Section 301 alerts shown ✓
  ├─ Alerts mention CUSMA (not USMCA) ✓
  └─ Recommendations for Canadian suppliers ✓

INTEGRATION POINT 4: Trial Expiry → Feature Access → Upgrade Flow
Test: User with trial_ends_at in past
Expected:
  ├─ Dashboard shows expiry warning ✓
  ├─ USMCA analysis blocked ✓
  ├─ Upgrade prompt displayed ✓
  └─ Can still view past workflows ✓

Test each integration point and report status."
```

---

## 📝 Quick Command for Your Agent

```
"Comprehensive flow verification needed.

Priority 1: Run the 4 manual tests (USA/Canada/Mexico destinations + Service)
Priority 2: Create the dependency map
Priority 3: Run change impact analysis
Priority 4: Test the 4 critical integration points

Report findings in this format:

VERIFICATION RESULTS
✅ Working Correctly: [list]
⚠️ Working But Issues: [list with details]
❌ Broken: [list with details]
🤔 Untested: [list]

Start with Priority 1 manual tests."
```

---

## 🎯 Bottom Line

With this many interconnected changes, you need:

1. **Automated tests** (can run repeatedly)
2. **Manual verification** (catch UX issues)
3. **Dependency mapping** (see connections)
4. **Integration testing** (where systems meet)

**Don't just test individual features - test how they work TOGETHER.**

Your agent can do all of this - just give it the framework above! 🚀

