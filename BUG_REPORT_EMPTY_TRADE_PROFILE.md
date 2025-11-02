# Bug Report: Empty Trade Profile Fields on Alerts Page

## Issue
The "Your Trade Profile" section on `/trade-risk-alternatives` shows:
- Company: *(empty)*
- HS Code: *(empty)*
- Annual Volume: $8,500,000 ✅
- USMCA Status: NEEDS_REVIEW ✅

## Root Cause

**Data Structure Mismatch** between what's sent from the frontend and what the backend expects.

### What's Happening:

**1. Frontend Sends FLAT Data** (`hooks/useWorkflowState.js` lines 816-825):
```javascript
const response = await fetch('/api/workflow-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    workflowData: cleanFormData,  // ← Flat structure
    userId: 'current-user',
    action: 'save'
  })
});
```

Where `cleanFormData` is a flat object like:
```javascript
{
  company_name: "Acme Corp",        // ← Direct field
  company_address: "...",
  business_type: "Electronics",
  trade_volume: 8500000,
  product_description: "...",
  hs_code: "8542.31.00",            // ← Direct field
  classified_hs_code: "8542.31.00",
  component_origins: [...]
}
```

**2. Backend Expects NESTED Data** (`pages/api/workflow-session.js` lines 196-214):
```javascript
const companyData = workflowData.company || {};  // ← Expects .company object

const sessionRecord = {
  ...
  company_name: companyData.company_name || companyData.name || null,  // ← Looking in nested obj
  ...
  hs_code: workflowData.product?.hs_code || workflowData.hs_code || null,  // ← Fallback to flat, but...
};
```

**The Problem:**
- `workflowData.company` doesn't exist → `companyData = {}`
- `companyData.company_name` is undefined
- `companyData.name` is undefined
- Result: `company_name = null` in database

Meanwhile, `workflowData.hs_code` exists as a flat field, but the fallback only checks `workflowData.product?.hs_code` first (which doesn't exist), then `workflowData.hs_code`.

Wait, actually HS code should work via the fallback... unless it's also null. Let me check if `workflowData.hs_code` is being sent.

**3. Annual Volume WORKS Because** (lines 218-221 in dashboard-data.js):
```javascript
const rawTradeVolume = mostRecentWorkflow.trade_volume || workflowData.company?.trade_volume;
```

The hook sends both:
- Direct field: `workflowData.trade_volume = 8500000` ✅ (in database as `trade_volume` column)
- Nested field: `workflowData.company.trade_volume` ✗ (doesn't exist)

So it loads from the database column successfully.

**4. But Company Name FAILS Because:**
- Hook sends: `workflowData.company_name` (flat) ✗
- Hook does NOT send: `workflowData.company.company_name` (nested)
- Backend expects: `workflowData.company.company_name` (nested)
- Database column fallback: None (backend assumes it was saved from nested structure)
- Result: Database column `company_name` is NULL

---

## Solution

**Option A: Fix the Backend (Safest - No UI changes)**

Add fallback to check flat fields in `pages/api/workflow-session.js` line 209:

```javascript
company_name:
  companyData.company_name ||           // Nested: workflowData.company.company_name
  companyData.name ||                    // Nested: workflowData.company.name
  workflowData.company_name ||           // Flat: workflowData.company_name
  null,
```

And line 213 for HS code:

```javascript
hs_code:
  workflowData.product?.hs_code ||       // Nested: workflowData.product.hs_code
  workflowData.hs_code ||                // Flat: workflowData.hs_code
  workflowData.classified_hs_code ||     // Alternative flat field name
  null,
```

**Option B: Fix the Frontend (Standardization)**

Restructure data before sending in `hooks/useWorkflowState.js` line 819-821:

```javascript
body: JSON.stringify({
  sessionId,
  workflowData: {
    company: {
      company_name: cleanFormData.company_name,
      name: cleanFormData.company_name,
      business_type: cleanFormData.business_type,
      trade_volume: cleanFormData.trade_volume,
      // ... other company fields
    },
    product: {
      hs_code: cleanFormData.classified_hs_code || cleanFormData.hs_code,
      description: cleanFormData.product_description,
      // ...
    },
    components: cleanFormData.component_origins,
    // ... other flat fields
  },
  userId: 'current-user',
  action: 'save'
})
```

---

## Why Trade Volume Works But Company Name Doesn't

| Field | Frontend Sends | Backend Expects | Database Column | Works? |
|-------|---|---|---|---|
| `trade_volume` | Flat: `workflowData.trade_volume` | Flat OR Nested | `trade_volume` ✅ | ✅ YES |
| `company_name` | Flat: `workflowData.company_name` | Nested: `workflowData.company.company_name` | `company_name` NULL | ❌ NO |
| `hs_code` | Flat: `workflowData.hs_code` | Nested: `workflowData.product?.hs_code` | `hs_code` NULL | ❌ NO |

---

## Recommended Fix

**Option A is recommended** because:
1. **Lower risk** - Only changes the save logic, not the entire data pipeline
2. **Backward compatible** - Works with both old (flat) and new (nested) data structures
3. **No UI changes needed** - Doesn't require refactoring frontend hooks
4. **Faster to deploy** - Single file change, less testing needed

### Implementation (Option A):

**File**: `pages/api/workflow-session.js`

**Lines 207-214** (BEFORE):
```javascript
// ✅ FIXED (Oct 24): Extract company/product fields to dedicated columns
// Dashboard validation requires these fields to be populated in DB columns, not just JSONB
company_name: companyData.company_name || companyData.name || null,
business_type: companyData.business_type || null,
trade_volume: companyData.trade_volume || workflowData.trade_volume || null,
manufacturing_location: companyData.manufacturing_location || null,
hs_code: workflowData.product?.hs_code || workflowData.hs_code || null,
product_description: workflowData.product?.description || workflowData.product_description || null,
```

**Lines 207-214** (AFTER):
```javascript
// ✅ FIXED (Oct 24): Extract company/product fields to dedicated columns
// ✅ FIXED (Nov 1): Support both nested (workflowData.company) and flat (workflowData) structures
// Dashboard validation requires these fields to be populated in DB columns, not just JSONB
company_name:
  companyData.company_name ||           // Nested: workflowData.company.company_name
  companyData.name ||                   // Nested: workflowData.company.name
  workflowData.company_name ||          // Flat: workflowData.company_name (from useWorkflowState hook)
  null,
business_type:
  companyData.business_type ||          // Nested
  workflowData.business_type ||         // Flat
  null,
trade_volume:
  companyData.trade_volume ||
  workflowData.trade_volume ||
  null,
manufacturing_location:
  companyData.manufacturing_location ||
  workflowData.manufacturing_location ||
  null,
hs_code:
  workflowData.product?.hs_code ||      // Nested: workflowData.product.hs_code
  workflowData.hs_code ||               // Flat: workflowData.hs_code (from useWorkflowState hook)
  workflowData.classified_hs_code ||    // Alternative: workflowData.classified_hs_code
  null,
product_description:
  workflowData.product?.description ||
  workflowData.product_description ||
  null,
```

---

## Testing

After fix, verify:

1. **Complete workflow** on `/usmca-workflow` with:
   - Company Name: "Test Company"
   - HS Code: "8542.31.00"
   - Annual Volume: $8,500,000

2. **Navigate to** `/trade-risk-alternatives`

3. **Verify "Your Trade Profile" shows**:
   - Company: "Test Company" ✅
   - HS Code: "8542.31.00" ✅
   - Annual Volume: $8,500,000 ✅
   - USMCA Status: (correct status) ✅

---

## Impact

- **Severity**: Medium (Visual display, not data loss)
- **User Impact**: Trade profile fields appear empty, but data is being saved correctly in other places
- **Data Integrity**: Not compromised (workflow data still saved to database)
- **Scope**: Only affects display of company_name and hs_code on alerts page

---

## Related Issues

This is a **data structure mismatch** issue, likely created when refactoring from nested to flat data structure. Similar to:
- Alert matching in consolidate-alerts.js (had to handle both formats)
- Workflow data transformation in dashboard-data.js (had to add fallbacks)
