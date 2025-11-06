# Page Reload Recovery Guide - Triangle Intelligence Platform

**Last Updated**: November 6, 2025 (Alert Matching Fix)
**Purpose**: Ensure users can reload ANY page during the workflow without losing data

---

## ✅ RELOAD RECOVERY STATUS

All pages have been tested and confirmed to reload correctly with full data recovery from localStorage.

### **Workflow Pages (usmca-workflow.js)**

**Location**: `hooks/useWorkflowState.js` (lines 14-249)

✅ **Step 1: Company Information**
- **Reloads to**: Step 1
- **Data Restored**: All form fields from `triangleUserData` localStorage key
- **Implementation**: `useEffect` on lines 177-198 restores formData after dropdown options load

✅ **Step 2: Component Origins**
- **Reloads to**: Step 2
- **Data Restored**: Components array, company data, product description
- **Implementation**: Same as Step 1 + cross-tab sync (lines 122-149)

✅ **Step 3: Results**
- **Reloads to**: Step 3
- **Data Restored**: Full analysis results, USMCA qualification, savings, components
- **Implementation**:
  - Lines 14-32: Detects saved results and jumps to step 3
  - Lines 202-236: Restores results from `usmca_workflow_results` key
  - Lines 238-249: Re-loads results if user navigates back

✅ **Step 4: Certificate Authorization**
- **Reloads to**: Step 4 (certificate page)
- **Data Restored**: Authorization fields, exporter/importer/producer details
- **Implementation**: `usmca-certificate-completion.js` lines 80-221

---

### **Certificate Completion Page (usmca-certificate-completion.js)**

**Location**: `pages/usmca-certificate-completion.js`

✅ **Certificate Page Reload**
- **Data Restored**:
  - Company info (name, address, country, tax ID, contact)
  - Product details (description, HS code, manufacturing location)
  - USMCA results (qualification, RVC%, preference criterion)
  - Components breakdown with tariff rates
  - Authorization fields (signatory name, title, email, phone)
  - **NEW (Nov 6)**: Certificate fields 7-11 (HS code, preference criterion, is_producer, qualification method, country of origin)

- **Implementation**:
  - Lines 80-89: Loads from `usmca_workflow_results` and `triangleUserData`
  - Lines 96-165: Merges workflow results and form data
  - Lines 145-165: **NEW**: Explicitly creates certificate fields 7-11 for persistence
  - Lines 167-221: Auto-populates certificate data structure
  - Lines 232-256: Restores certificate edits from `usmca_certificate_edits` key

---

### **User Dashboard (components/UserDashboard.js)**

**Location**: `components/UserDashboard.js`

✅ **Dashboard Page Reload**
- **Data Source**: Fetched from `/api/dashboard-data` API (NOT localStorage)
- **Data Restored**:
  - User profile (name, email, subscription tier)
  - Workflow history (all completed analyses)
  - Active alerts (policy changes affecting user's products)
  - Usage stats (analyses used vs limit)

- **Implementation**:
  - Lines 16-59: Fetches fresh data from database on mount
  - Lines 26-27: **NEW (Nov 6)**: Cache-busting timestamp ensures fresh data
  - No localStorage dependency (always fresh from database)

---

## 📦 LOCAL STORAGE KEYS

### **1. `triangleUserData`** (Step 1-2 Form Data)
```javascript
{
  company_name: "TechCorp Manufacturing Inc",
  business_type: "Manufacturer",
  company_country: "US",
  company_address: "1250 Innovation Drive, Los Angeles, CA 90001",
  tax_id: "94-1234567",
  contact_person: "Jennifer Martinez",
  contact_phone: "+1 (310) 555-0123",
  contact_email: "j.martinez@techcorpmfg.com",
  industry_sector: "Electronics",
  trade_volume: "$15,000,000",
  destination_country: "US",
  product_description: "IoT device for home automation...",
  manufacturing_location: "United States",
  substantial_transformation: true,
  component_origins: [
    {
      description: "Multilayer printed circuit board...",
      origin_country: "CN",
      value_percentage: 45,
      hs_code: "8534.00.00"
    },
    // ... more components
  ]
}
```

### **2. `usmca_workflow_results`** (Step 3 Analysis Results)
```javascript
{
  company: {
    name: "TechCorp Manufacturing Inc",
    company_name: "TechCorp Manufacturing Inc",
    company_country: "US",
    company_address: "1250 Innovation Drive, Los Angeles, CA 90001",
    business_type: "Manufacturer",
    tax_id: "94-1234567",
    contact_person: "Jennifer Martinez",
    contact_phone: "+1 (310) 555-0123",
    contact_email: "j.martinez@techcorpmfg.com"
  },
  product: {
    description: "IoT device for home automation...",
    hs_code: "8534.00.00"
  },
  components: [
    {
      description: "Multilayer printed circuit board...",
      origin_country: "CN",
      value_percentage: 45,
      hs_code: "8534.00.00",
      mfn_rate: 6.8,
      usmca_rate: 0.0,
      savings_percentage: 6.8
    },
    // ... more components
  ],
  usmca: {
    qualified: true,
    regional_content: 75.5,
    north_american_content: 75.5,
    preference_criterion: "B",  // ✅ NEW (Nov 6)
    qualification_method: "RVC",  // ✅ NEW (Nov 6)
    manufacturing_location: "United States",  // ✅ NEW (Nov 6)
    is_producer: true  // ✅ NEW (Nov 6)
  },
  savings: {
    annual_savings: 45000,
    monthly_savings: 3750
  },
  trust: {
    score: 85,
    overall_trust_score: 0.85
  }
}
```

### **3. `usmca_authorization_data`** (Step 4 Authorization)
```javascript
{
  certifier_type: "PRODUCER",
  signatory_name: "Jennifer Martinez",
  signatory_title: "Export Manager",
  signatory_email: "j.martinez@techcorpmfg.com",
  signatory_phone: "+1 (310) 555-0123",
  accuracy_certification: true,
  authority_certification: true,

  // Exporter fields
  exporter_same_as_company: true,
  exporter_name: "TechCorp Manufacturing Inc",
  exporter_address: "1250 Innovation Drive, Los Angeles, CA 90001",
  exporter_country: "United States",
  exporter_tax_id: "94-1234567",
  exporter_phone: "+1 (310) 555-0123",
  exporter_email: "j.martinez@techcorpmfg.com",

  // Importer fields (customer info)
  importer_same_as_company: false,
  importer_name: "TechRetail Distribution USA Inc",
  importer_address: "4520 Commerce Boulevard, Santa Clara, CA 95054",
  importer_country: "United States",
  importer_tax_id: "77-9876543",
  importer_phone: "+1 (408) 555-2100",
  importer_email: "purchasing@techretail.com",

  // Producer fields
  producer_same_as_company: true,
  producer_name: "TechCorp Manufacturing Inc",
  producer_address: "1250 Innovation Drive, Los Angeles, CA 90001",
  producer_country: "United States",
  producer_tax_id: "94-1234567",
  producer_phone: "+1 (310) 555-0123",
  producer_email: "j.martinez@techcorpmfg.com"
}
```

### **4. `workflow_current_step`** (Current Step Number)
```javascript
"3"  // String: "1", "2", "3", or "4"
```

### **5. `usmca_certificate_edits`** (Certificate Preview Edits)
```javascript
{
  timestamp: 1699456789000,
  certificate: {
    exporter: { /* ... */ },
    importer: { /* ... */ },
    producer: { /* ... */ },
    product: { /* ... */ },
    hs_classification: { code: "8534.00.00" },
    preference_criterion: "B",  // ✅ Field 8
    producer_declaration: { is_producer: true },  // ✅ Field 9
    qualification_method: { method: "RVC" },  // ✅ Field 10
    country_of_origin: "United States",  // ✅ Field 11
    components: [ /* ... */ ]
  }
}
```

---

## 🔄 RELOAD SCENARIOS

### **Scenario 1: User Closes Browser Mid-Workflow**
**When**: User is on Step 2 (adding components), closes browser tab

**What Happens on Reload**:
1. Browser opens to `/usmca-workflow`
2. `useWorkflowState` hook checks localStorage
3. Finds `workflow_current_step = "2"` and `triangleUserData`
4. Restores to Step 2 with all company info and components
5. User continues exactly where they left off

**Implementation**: `hooks/useWorkflowState.js` lines 14-32

---

### **Scenario 2: User Refreshes Results Page**
**When**: User completes analysis, views results on Step 3, hits F5

**What Happens on Reload**:
1. Page reloads `/usmca-workflow`
2. `useWorkflowState` finds `usmca_workflow_results` in localStorage
3. Restores to Step 3 with full analysis results
4. All data visible: qualification status, savings, components, alerts

**Implementation**: `hooks/useWorkflowState.js` lines 202-249

---

### **Scenario 3: User Reloads Certificate Page**
**When**: User is filling out authorization form on Step 4, accidentally hits refresh

**What Happens on Reload**:
1. Page reloads `/usmca-certificate-completion`
2. Loads workflow results from `usmca_workflow_results`
3. Loads form data from `triangleUserData`
4. Loads authorization data from `usmca_authorization_data`
5. **NEW (Nov 6)**: Auto-fills certificate fields 7-11 from analysis results
6. All fields repopulate: company info, exporter, importer, producer, signatory
7. User continues filling out form

**Implementation**: `pages/usmca-certificate-completion.js` lines 80-221

---

### **Scenario 4: User Navigates Back from Alerts Page**
**When**: User completes workflow, clicks "View Alerts", then clicks browser back button

**What Happens**:
1. Router navigates to `/usmca-workflow`
2. `useWorkflowState` detects `currentStep = 3` but `results = null`
3. Re-loads results from localStorage
4. Results page displays with all data intact

**Implementation**: `hooks/useWorkflowState.js` lines 238-249

---

### **Scenario 5: User Opens Multiple Tabs**
**When**: User has workflow open in 2 browser tabs, edits in both

**What Happens**:
1. `CrossTabSync` detects changes in other tab
2. Syncs data across tabs using `storage` event
3. Both tabs stay in sync
4. **Note**: Last write wins if editing same field

**Implementation**: `hooks/useWorkflowState.js` lines 118-149

---

## ⚠️ KNOWN LIMITATIONS

### **1. Database vs localStorage Mismatch**
**Issue**: If user completes workflow but database save fails, reload will show localStorage data but database will be empty

**Solution**: Always save to database AND localStorage. If database save fails, show error and don't allow user to proceed.

**Status**: ✅ HANDLED - All workflow steps save to both database and localStorage

---

### **2. Stale Data After Analysis Limit Reset**
**Issue**: If admin resets user's analysis count in database, localStorage still shows old limit

**Solution**: Dashboard always fetches fresh data from API, ignoring localStorage

**Status**: ✅ HANDLED - Dashboard uses `fetchUserData()` with cache-busting timestamp (Nov 6)

---

### **3. Certificate Edits Lost on Hard Refresh**
**Issue**: User edits certificate preview, refreshes page, edits are lost

**Solution**: `usmca_certificate_edits` key saves all preview edits

**Status**: ✅ HANDLED - Lines 232-256 in `usmca-certificate-completion.js` restore edits

---

### **4. Certificate Fields 7-11 Missing After Reload**
**Issue**: HS code, preference criterion, producer, qualification method, country of origin were not persisting

**Solution (Nov 6)**: Added explicit fields to `analysisResults` and saved to localStorage

**Status**: ✅ FIXED - Fields now persist correctly

---

## 🧪 TESTING CHECKLIST

To verify reload recovery works correctly, test these scenarios:

### **Test 1: Reload on Each Step**
- [ ] Start workflow, enter company info, **reload** → Should return to Step 1 with data
- [ ] Add 2 components, **reload** → Should return to Step 2 with components
- [ ] Complete analysis, **reload** → Should return to Step 3 with results
- [ ] Fill authorization form, **reload** → Should return to Step 4 with fields filled

### **Test 2: Close Browser and Reopen**
- [ ] Start workflow, close browser completely
- [ ] Reopen browser, navigate to `/usmca-workflow`
- [ ] Should restore to last step with all data intact

### **Test 3: Navigate Away and Back**
- [ ] Complete workflow, click "View Alerts"
- [ ] Click browser back button
- [ ] Results should display immediately (no re-analysis needed)

### **Test 4: Multiple Tabs**
- [ ] Open workflow in Tab 1
- [ ] Open workflow in Tab 2
- [ ] Edit company name in Tab 1
- [ ] Tab 2 should auto-update with new company name

### **Test 5: Certificate Reload**
- [ ] Complete workflow, reach certificate page
- [ ] Fill out exporter, importer, producer fields
- [ ] **Reload page**
- [ ] All fields should repopulate
- [ ] Certificate fields 7-11 should have values (not empty)

---

## 📝 DEVELOPER NOTES

### **When Adding New Workflow Steps**

If you add a new step to the workflow, ensure:

1. **Save step number** to `workflow_current_step` localStorage key
2. **Save form data** to `triangleUserData` key
3. **Save results** to `usmca_workflow_results` key (if applicable)
4. **Restore on mount** using `useEffect` hook
5. **Update this guide** with new reload behavior

### **When Adding New Fields**

If you add new fields to the form:

1. **Add to `formData` initial state** in `useWorkflowState.js`
2. **Add to localStorage save** in `updateFormData` function
3. **Add to localStorage restore** in `loadSavedData` function
4. **Test reload** to verify field persists

---

**Last Verified**: November 6, 2025
**All reload scenarios tested**: ✅ PASSING
**Certificate fields 7-11 persist**: ✅ FIXED
**Component alert matching**: ✅ FIXED (Nov 6) - Filters out invalid HS codes from alerts

---

## 🔧 ALERT MATCHING FIX (Nov 6, 2025)

### Issue
Component Tariff Intelligence table showed "✅ No alerts" for all components, even when alerts existed for their origin countries.

### Root Cause
Alerts in database had invalid HS codes:
- `"2025"` (year, not HS code)
- `"8217"` (only 4 digits, HS codes need 6-10)
- `"8230"` (only 4 digits)

The matching logic treated these as valid HS codes, which:
1. Blocked TYPE 1 country-based matching (line 1174: `if (originMatch && !hasHSCodes && !hasIndustries)`)
2. Failed TYPE 2 HS code matching (line 1202: "8217" doesn't match "7326908500")

### Solution (trade-risk-alternatives.js lines 1155-1160)
Added validation to filter out invalid HS codes before matching:
```javascript
const validHSCodes = (alert.affected_hs_codes || []).filter(code => {
  const normalized = String(code).replace(/\./g, '');
  // Valid HS codes are 6-10 digits, not years (2024, 2025) or short codes (8217)
  return normalized.length >= 6 && !/^20\d{2}$/.test(normalized);
});
const hasHSCodes = validHSCodes.length > 0;
```

### Result
Alerts with invalid HS codes now treated as country-only alerts, allowing TYPE 1 matching to work correctly.

**Example**:
- Alert: "Florida East Coast boosts Grupo Mexico" with `affected_countries: ["MX"]`, `affected_hs_codes: ["8217"]`
- Before: `hasHSCodes = true` → blocked TYPE 1 → no match ❌
- After: `validHSCodes = []` → `hasHSCodes = false` → TYPE 1 match ✅

Components from Mexico/China/Canada now correctly show relevant policy alerts.
