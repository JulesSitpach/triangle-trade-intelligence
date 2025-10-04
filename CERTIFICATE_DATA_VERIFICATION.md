# Certificate Data Verification Guide

**Status:** Certificate data flow fix complete - Ready for end-to-end verification
**Date:** January 2025

---

## ✅ What Was Fixed

### Problem
Certificate completion page was showing blank fields for:
- Company address
- Tax ID
- Contact person
- Contact email
- Contact phone
- Manufacturing location

### Root Cause
The AI endpoint `/api/ai-usmca-complete-analysis` wasn't passing through all company detail fields that were collected in Step 1.

### Solution
Updated AI endpoint response to include complete company object with all fields and aliases for compatibility.

---

## 🔍 Complete Data Flow Verification

### Step 1: Company Information Form Collects
```javascript
// CompanyInformationStep.js collects these fields:
formData = {
  company_name: "Industrial Hydraulics Mexico",
  business_type: "Machinery & Equipment",
  trade_volume: "$1M - $5M",
  company_address: "Av Industrial 123, Monterrey, NL",
  tax_id: "RFC123456ABC",
  contact_person: "Joe Rodriguez",
  contact_email: "joe@industrial-mx.com",
  contact_phone: "555-1234",
  supplier_country: "MX",
  destination_country: "US"
}
```

**Console Check #1:** After filling Step 1, click Next and check console for:
```
🚀 ========== STEP 1 COMPLETE: COMPANY DATA ==========
📋 Company Information:
  company_name: "Industrial Hydraulics Mexico"
  company_address: "Av Industrial 123, Monterrey, NL"
  tax_id: "RFC123456ABC"
  contact_person: "Joe Rodriguez"
```

---

### Step 2: useWorkflowState Stores Data
```javascript
// hooks/useWorkflowState.js line 214
console.log('⚙️ ========== PROCESS WORKFLOW CALLED ==========');
console.log('📋 formData received by useWorkflowState:', {
  company_name: formData.company_name,
  business_type: formData.business_type,
  component_origins_count: formData.component_origins?.length,
  component_origins: formData.component_origins
});
```

**Console Check #2:** When clicking "Continue to USMCA Analysis", verify:
```
⚙️ ========== PROCESS WORKFLOW CALLED ==========
📋 formData received by useWorkflowState: {
  company_name: "Industrial Hydraulics Mexico",
  component_origins_count: 2
}
```

---

### Step 3: Workflow Service Sends to API
```javascript
// lib/services/workflow-service.js line 151
console.log('🌐 ========== WORKFLOW SERVICE: API REQUEST ==========');
console.log('📤 Data being sent to API:', {
  company_name: formData.company_name,
  business_type: formData.business_type,
  company_address: formData.company_address,
  tax_id: formData.tax_id,
  contact_person: formData.contact_person,
  contact_email: formData.contact_email,
  contact_phone: formData.contact_phone
});

console.log('⚠️ CERTIFICATE FIELDS CHECK:', {
  has_company_address: !!formData.company_address,
  has_tax_id: !!formData.tax_id,
  has_contact_person: !!formData.contact_person,
  has_contact_email: !!formData.contact_email,
  has_contact_phone: !!formData.contact_phone
});
```

**Console Check #3:** Verify ALL fields are true:
```
⚠️ CERTIFICATE FIELDS CHECK: {
  has_company_address: true  ← Must be true
  has_tax_id: true           ← Must be true
  has_contact_person: true   ← Must be true
  has_contact_email: true    ← Must be true
  has_contact_phone: true    ← Must be true
}
```

❌ **If any are false:** Data didn't get collected in Step 1 properly

---

### Step 4: AI Endpoint Processes and Returns Complete Data
```javascript
// pages/api/ai-usmca-complete-analysis.js line 98-115
company: {
  name: formData.company_name,
  company_name: formData.company_name, // Alias
  business_type: formData.business_type,
  trade_volume: formData.trade_volume,
  supplier_country: formData.supplier_country,
  destination_country: formData.destination_country,

  // Company details for certificate (THE FIX)
  company_address: formData.company_address || '',
  address: formData.company_address || '',
  tax_id: formData.tax_id || '',
  contact_person: formData.contact_person || '',
  contact_email: formData.contact_email || '',
  contact_phone: formData.contact_phone || '',
  country: formData.destination_country || 'US',
  exporter_country: formData.destination_country || 'US'
}
```

**Console Check #4:** After AI analysis completes:
```
📥 ========== AI ANALYSIS RESPONSE RECEIVED ==========
AI Analysis Response: {
  success: true,
  has_company: true,
  has_product: true,
  has_usmca: true,
  usmca_qualified: false,
  north_american_content: 40,
  ai_confidence: 85
}
```

---

### Step 5: Data Saved to localStorage
```javascript
// workflow-service.js line 242
localStorage.setItem('usmca_workflow_results', JSON.stringify(workflowData));

// Where workflowData contains:
{
  company: {
    name: "Industrial Hydraulics Mexico",
    company_name: "Industrial Hydraulics Mexico",
    company_address: "Av Industrial 123, Monterrey, NL",
    address: "Av Industrial 123, Monterrey, NL",
    tax_id: "RFC123456ABC",
    contact_person: "Joe Rodriguez",
    contact_email: "joe@industrial-mx.com",
    contact_phone: "555-1234",
    country: "US",
    exporter_country: "US"
  },
  product: { ... },
  usmca: { ... }
}
```

**Manual Check:** Open browser DevTools → Application → Local Storage → Check `usmca_workflow_results`

---

### Step 6: Certificate Page Loads Data
```javascript
// pages/usmca-certificate-completion.js line 92-98
company_info: {
  exporter_name: initialData.company?.name || initialData.company?.company_name,
  exporter_address: initialData.company?.company_address || initialData.company?.address,
  exporter_country: initialData.company?.country || initialData.company?.exporter_country,
  exporter_tax_id: initialData.company?.tax_id,
  exporter_phone: initialData.company?.contact_phone || initialData.company?.phone,
  exporter_email: initialData.company?.contact_email || initialData.company?.email
}
```

**Console Check #5:** On certificate page load:
```
Loading workflow data from localStorage: {
  company: {
    name: "Industrial Hydraulics Mexico",
    company_address: "Av Industrial 123, Monterrey, NL",
    tax_id: "RFC123456ABC"
  }
}
```

---

## 🧪 End-to-End Test Instructions

### Test Case: Complete Workflow with Full Company Data

**Step 1: Clear Cache**
```javascript
// Open browser console and run:
localStorage.clear()
// Then refresh the page
```

**Step 2: Fill Company Information (Step 1)**
```
Company Name: Industrial Hydraulics Mexico
Business Type: Machinery & Equipment
Trade Volume: $1M - $5M
Company Address: Av Industrial 123, Monterrey, NL
Tax ID: RFC123456ABC
Contact Person: Joe Rodriguez
Contact Email: joe@industrial-mx.com
Contact Phone: 555-1234
Supplier Country: Mexico
Destination Country: United States
```

**Step 3: Fill Product Information (Step 2)**
```
Product Description: High-pressure hydraulic pumps for industrial applications
Manufacturing Location: Mexico

Component 1:
  Description: Motor assembly
  Country: China
  Value %: 60%

Component 2:
  Description: Pump housing and assembly
  Country: Mexico
  Value %: 40%
```

**Step 4: Click "Continue to USMCA Analysis"**

Watch console output for ALL 5 console checks above.

**Step 5: Navigate to Certificate Page**

Click "Generate Certificate" button from results page.

**Step 6: Verify Certificate Fields Populated**

Certificate page should display:

```
FIELD 1 - EXPORTER INFORMATION
Company: Industrial Hydraulics Mexico    ✅
Address: Av Industrial 123, Monterrey... ✅
Country: US                              ✅
Tax ID: RFC123456ABC                     ✅
Phone: 555-1234                          ✅
Email: joe@industrial-mx.com             ✅

FIELD 5 - DESCRIPTION OF GOOD(S)
HS Code: [AI classified]                 ✅
Description: High-pressure hydraulic...  ✅
Manufacturing Location: Mexico           ✅

FIELD 6 - PREFERENCE CRITERION
Regional Value Content: 40.0%            ✅
Required Threshold: 60%                  ✅

FIELD 12 - AUTHORIZED SIGNATURE
[Form fields for user to complete]      ✅
```

---

## ✅ Success Criteria

### All Must Be True:
- [ ] Console Check #1: Company data logged after Step 1
- [ ] Console Check #2: formData passed to useWorkflowState
- [ ] Console Check #3: ALL certificate fields show `true`
- [ ] Console Check #4: AI analysis response received
- [ ] Console Check #5: Certificate page loads workflow data
- [ ] Certificate displays company name ✅
- [ ] Certificate displays company address ✅
- [ ] Certificate displays tax ID ✅
- [ ] Certificate displays contact email ✅
- [ ] Certificate displays contact phone ✅
- [ ] Certificate displays manufacturing location ✅
- [ ] Certificate displays regional content % ✅

---

## 🐛 Troubleshooting

### If Certificate Shows Blank Fields:

**Check #1: Did Step 1 collect the data?**
```javascript
// After Step 1, check localStorage:
JSON.parse(localStorage.getItem('workflow_form_data'))
// Should show all company fields
```

**Check #2: Did API receive the data?**
```
Look for console log:
⚠️ CERTIFICATE FIELDS CHECK: {
  has_company_address: false  ← PROBLEM!
}
```
→ If false: Form data not being passed to API

**Check #3: Did API return the data?**
```javascript
// Check localStorage after analysis:
const results = JSON.parse(localStorage.getItem('usmca_workflow_results'));
console.log('Company data in results:', results.company);
// Should show: company_address, tax_id, contact_person, etc.
```
→ If missing: AI endpoint not passing through fields

**Check #4: Is certificate page reading correct path?**
```
Certificate page checks multiple paths:
  initialData.company?.company_address
  initialData.company?.address
  workflowData?.company_address
```
→ At least ONE path should have data

---

## 📊 Field Mapping Reference

| Step 1 Form Field | localStorage Key | Certificate Display Field |
|------------------|------------------|---------------------------|
| company_name | company.name | exporter_name |
| company_address | company.company_address | exporter_address |
| tax_id | company.tax_id | exporter_tax_id |
| contact_email | company.contact_email | exporter_email |
| contact_phone | company.contact_phone | exporter_phone |
| destination_country | company.country | exporter_country |
| manufacturing_location | usmca.manufacturing_location | manufacturing_location |

**Aliases (for compatibility):**
- `company.name` = `company.company_name`
- `company.company_address` = `company.address`
- `company.contact_email` = `company.email`
- `company.contact_phone` = `company.phone`

---

## 📝 Files Modified for This Fix

1. ✅ **`pages/api/ai-usmca-complete-analysis.js`** (lines 98-115)
   - Added all company detail fields to response
   - Added field aliases for compatibility

2. ✅ **`lib/services/workflow-service.js`** (lines 162-178)
   - Added debug logging for certificate fields
   - Logs which fields are present before API call

3. ✅ **`pages/usmca-certificate-completion.js`** (lines 92-98)
   - Already had correct fallback logic
   - No changes needed

---

**Test Status:** Ready for verification
**Next Action:** Run complete end-to-end test following instructions above
**Expected Result:** All certificate fields display correctly with company information
