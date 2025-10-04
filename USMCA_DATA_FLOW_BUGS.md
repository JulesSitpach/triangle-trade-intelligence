# USMCA Workflow Data Flow & Bugs Report

## Current Architecture Problems

### Problem 1: Database vs Config File Conflict
**Your system has 3 sources of truth for thresholds:**

1. **config/usmca-thresholds.js** (NOT USED by main engine)
2. **usmca_qualification_rules** database table (USED FIRST)
3. **Emergency fallback** in engine code (USED LAST)

**The engine prioritizes:**
Database → Emergency Fallback → (Never reaches config file)

**Fix:** Remove all fallbacks and make config file the ONLY source.

---

### Problem 2: Generic Recommendations

**File:** `pages/api/database-driven-usmca-compliance.js:748-784`

**Current function signature:**
```javascript
async function generateWorkflowRecommendations(product, usmca, savings) {
  // Has NO access to businessType or product description
  // Returns same advice for ALL products
}
```

**What it outputs for textile companies:**
```
❌ "Explore triangle routing opportunities through Mexico"
❌ "Consider supply chain adjustments to meet USMCA requirements"
```

**What it SHOULD output for textile companies:**
```
✅ "Source fabric from US or Mexico textile mills"
✅ "Replace India fabric supplier with North Carolina or Mexico suppliers"
✅ "Yarn-forward rule requires fabric sourced from USMCA region"
```

**Fix:** Pass `businessType` and `productDescription` to recommendation function.

---

### Problem 3: Component Data Gets Lost

**User enters components:**
```javascript
{
  component_origins: [
    { origin_country: 'IN', value_percentage: 60, description: 'Cotton fabric' },
    { origin_country: 'MX', value_percentage: 40, description: 'Assembly labor' }
  ]
}
```

**What reaches the engine:**
```javascript
componentOrigins.map(comp => ({
  ...comp,
  is_usmca_member: usmcaCountries.includes(comp.origin_country)
}))
// Component DESCRIPTIONS lost! Engine can't tell fabric from sensors.
```

**Recommendations then say:**
- "Replace TW supplier (sensor components)" ← Wrong! It's fabric, not sensors.

**Fix:** Preserve component descriptions through entire flow.

---

## Complete Data Flow (Current System)

### Step 1: User Input
**File:** `components/workflow/ComponentOriginsStepEnhanced.js`
**Stored in:** localStorage `triangleUserData`

```javascript
formData = {
  company_name: "XYZ Textiles",
  business_type: "Textiles & Apparel",
  product_description: "Cotton t-shirts",
  component_origins: [
    { origin_country: "IN", value_percentage: 60, description: "Cotton fabric" },
    { origin_country: "MX", value_percentage: 40, description: "Assembly" }
  ]
}
```

### Step 2: Workflow Processing
**File:** `hooks/useWorkflowState.js:225`
**Calls:** `workflowService.processCompleteWorkflow(formData)`

### Step 3: API Request
**File:** `lib/services/workflow-service.js:166`
**Calls:** `POST /api/database-driven-usmca-compliance`

### Step 4: Database Query
**File:** `lib/core/database-driven-usmca-engine.js:189`
```javascript
const rules = await this.getQualificationRules(hsCode, businessType);
// Queries: usmca_qualification_rules WHERE product_category = 'Textiles & Apparel'
```

**If database returns:** `regional_content_threshold: 62.5`
**Result:** User sees wrong threshold (62.5% instead of 55%)

### Step 5: Qualification Check
**File:** `lib/core/database-driven-usmca-engine.js:243-318`
```javascript
calculateRegionalContent(componentOrigins, usmcaCountries, rules, manufacturingLocation)
```

**Calculation:**
- North American content: 40% (only Mexico assembly)
- Threshold from DB: 62.5% (WRONG - should be 55%)
- Result: NOT QUALIFIED (should be NOT QUALIFIED at 55% too, but for right reason)

### Step 6: Recommendations
**File:** `pages/api/database-driven-usmca-compliance.js:748`
```javascript
generateWorkflowRecommendations(product, usmca, savings)
// Does NOT receive businessType or component descriptions
// Returns generic advice
```

**Output:**
```
❌ "Explore triangle routing opportunities through Mexico"
❌ "Consider supply chain adjustments" (vague)
```

### Step 7: Results Display
**File:** `components/workflow/WorkflowResults.js`
**Sub-components:**
- `USMCAQualification` → shows wrong threshold
- `RecommendedActions` → shows generic advice

---

## All Fallback Data Locations

### Emergency Fallback #1: Threshold
**File:** `lib/core/database-driven-usmca-engine.js:106-113`
```javascript
const fallbackRule = {
  rule_type: 'regional_content',
  regional_content_threshold: this.defaultThreshold, // 62.5%
  source: 'emergency_fallback'
};
```

**Triggered when:** Database query returns no rules for business type

### Emergency Fallback #2: Tariff Rates
**File:** `lib/core/database-driven-usmca-engine.js:161-169`
```javascript
const fallbackResult = {
  mfn_rate: this.emergencyFallbackRate, // 6.8%
  usmca_rate: 0,
  source: 'emergency_fallback'
};
```

**Triggered when:** Database has no tariff rates for HS code

### Emergency Fallback #3: Qualification Error
**File:** `pages/api/database-driven-usmca-compliance.js:548-560`
```javascript
return {
  qualified: false,
  rule: 'Database Error - Professional Review Required',
  reason: `Unable to verify USMCA qualification: ${error.message}`,
  database_error: error.message
};
```

**Triggered when:** Database query throws error

### Emergency Fallback #4: Trade Volume
**File:** `pages/api/database-driven-usmca-compliance.js:268`
```javascript
data.trade_volume = SYSTEM_CONFIG.business.defaultTradeVolume; // $1M default
```

**Triggered when:** User doesn't provide trade volume

### Default Sample Data
**File:** `lib/services/workflow-service.js:125-143`
```javascript
getDefaultDropdownOptions() {
  return {
    businessTypes: [
      { value: 'electronics', label: 'Electronics & Technology' },
      { value: 'automotive', label: 'Automotive & Transportation' },
      // ... sample data
    ]
  };
}
```

**Triggered when:** Dropdown API fails

---

## Required Fixes (Priority Order)

### Fix 1: Remove Database Threshold Lookup
**File:** `lib/core/database-driven-usmca-engine.js:189`

**Before:**
```javascript
const rules = await this.getQualificationRules(hsCode, businessType);
```

**After:**
```javascript
import { getUSMCAThreshold } from '../../config/usmca-thresholds.js';
const thresholdData = await getUSMCAThreshold(businessType, hsCode);
const rules = {
  regional_content_threshold: thresholdData.threshold,
  source: thresholdData.source,
  rule_type: thresholdData.rule_type
};
```

### Fix 2: Product-Specific Recommendations
**File:** `pages/api/database-driven-usmca-compliance.js:748`

**Before:**
```javascript
async function generateWorkflowRecommendations(product, usmca, savings) {
```

**After:**
```javascript
async function generateWorkflowRecommendations(product, usmca, savings, formData) {
  const businessType = formData.business_type;
  const componentOrigins = formData.component_origins;

  // Product-specific recommendations
  if (!usmca.qualified) {
    if (businessType.includes('Textiles')) {
      const nonUSMCA = componentOrigins.filter(c => !['US', 'MX', 'CA'].includes(c.origin_country));
      recommendations.push(
        `Replace ${nonUSMCA[0].origin_country} supplier for ${nonUSMCA[0].description}`,
        'Source fabric from US or Mexico textile mills',
        'Consider North Carolina or Mexico textile suppliers'
      );
    } else if (businessType.includes('Electronics')) {
      // Electronics-specific advice
    }
  }
}
```

### Fix 3: Remove All Fallback Data
**Files to modify:**
1. `lib/core/database-driven-usmca-engine.js` - Remove emergency fallback threshold
2. `lib/core/database-driven-usmca-engine.js` - Remove emergency fallback tariff
3. `pages/api/database-driven-usmca-compliance.js` - Remove emergency fallback qualification

**Replace with:**
```javascript
// Throw errors instead of returning fallback data
if (!rules) {
  throw new Error('No USMCA rules found - database incomplete');
}
```

### Fix 4: Preserve Component Descriptions
**File:** `lib/core/database-driven-usmca-engine.js:314-318`

**Before:**
```javascript
component_breakdown: componentOrigins.map(comp => ({
  ...comp,
  is_usmca_member: usmcaCountries.includes(comp.origin_country)
}))
```

**After:**
```javascript
component_breakdown: componentOrigins.map(comp => ({
  origin_country: comp.origin_country,
  value_percentage: comp.value_percentage,
  description: comp.description || 'Unknown component',
  component_type: comp.component_type || 'Unknown',
  is_usmca_member: usmcaCountries.includes(comp.origin_country)
}))
```

---

## Testing After Fixes

### Test Case 1: Textile Company (India Fabric)
**Input:**
```javascript
{
  company_name: "ABC Textiles",
  business_type: "Textiles & Apparel",
  product_description: "Cotton t-shirts",
  component_origins: [
    { origin_country: "IN", value_percentage: 60, description: "Cotton fabric" },
    { origin_country: "MX", value_percentage: 40, description: "Assembly labor" }
  ]
}
```

**Expected Output:**
```javascript
{
  qualified: false,
  threshold_applied: 55,  // ✅ Correct textile threshold
  north_american_content: 40,
  recommendations: [
    "Replace India supplier for Cotton fabric",
    "Source fabric from US or Mexico textile mills",
    "Yarn-forward rule requires USMCA-region fabric sourcing"
  ]
}
```

### Test Case 2: Electronics Company (China Components)
**Input:**
```javascript
{
  company_name: "Tech Corp",
  business_type: "Electronics & Technology",
  product_description: "Wireless sensors",
  component_origins: [
    { origin_country: "CN", value_percentage: 70, description: "PCB boards" },
    { origin_country: "MX", value_percentage: 30, description: "Assembly" }
  ]
}
```

**Expected Output:**
```javascript
{
  qualified: false,
  threshold_applied: 65,  // ✅ Correct electronics threshold
  north_american_content: 30,
  recommendations: [
    "Replace China supplier for PCB boards",
    "Source electronics components from US or Mexico manufacturers",
    "Consider Guadalajara or San Diego electronics suppliers"
  ]
}
```

---

## Summary

**Root Cause:** System uses database as source of truth, but database has wrong values.

**Quick Fix:** Remove all database threshold lookups, use config file only.

**Complete Fix:**
1. Use config file for thresholds (not database)
2. Make recommendations product-specific (not generic)
3. Remove all fallback data (fail loudly instead)
4. Preserve component descriptions through entire flow
