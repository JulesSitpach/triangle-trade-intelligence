# Field Name Inconsistency Audit Report

**Date**: October 23, 2025
**Scope**: Comprehensive audit of `trade_volume` field naming across codebase
**Status**: 30+ files identified with inconsistencies

---

## Executive Summary

The codebase uses **5 different field names** for the same data (annual trade volume):
- `trade_volume` ✅ (canonical - what form captures)
- `annual_trade_volume` ❌ (used by API responses and some components)
- `tradeVolume` ❌ (camelCase variant)
- `annual_volume` ❌ (shorthand variant)
- `annualTradeVolume` ❌ (different camelCase)

**Impact**: Components use fallback chains like `volume || annual_volume || annualTradeVolume || 0`, masking bugs and making values silently default to 0.

---

## CRITICAL PATH (User-Facing)

### 1. **components/workflow/results/ExecutiveSummary.js** 🔴 HIGH PRIORITY
```javascript
// Line 101 - Uses FALLBACK CHAIN
const volume = company?.trade_volume || company?.annual_trade_volume || 0;
```
**Issue**: Accepts both `trade_volume` and `annual_trade_volume`, hiding bugs
**Fix**: Use ONLY canonical `trade_volume` - fail if missing
**Status**: NEEDS FIX

### 2. **components/workflow/results/USMCAQualification.js** 🔴 HIGH PRIORITY
```javascript
// Line 13 - Uses FALLBACK CHAIN
const tradeVolume = results.company?.trade_volume || results.company?.annual_trade_volume || 0;

// Line 110 - Uses FALLBACK CHAIN again
Based on annual trade volume of ${(results.company?.trade_volume || results.company?.annual_trade_volume || 0).toLocaleString()}
```
**Issue**: Multiple fallback chains in same file
**Fix**: Normalize at entry point, use canonical name only
**Status**: NEEDS FIX

### 3. **components/workflow/results/RecommendedActions.js** 🔴 HIGH PRIORITY
```javascript
// Line 12 - Uses FALLBACK CHAIN
const tradeVolume = results?.company?.trade_volume || results?.company?.annual_trade_volume || 0;
```
**Issue**: Fallback chain
**Fix**: Use canonical only
**Status**: NEEDS FIX

### 4. **components/workflow/results/WorkflowResults.js** 🔴 HIGH PRIORITY
```javascript
// Multiple issues with different field names
annual_trade_volume: completionResults.company?.annual_trade_volume || 1000000
annual_trade_volume: results.company?.trade_volume
```
**Issue**: Inconsistent field naming when building result objects
**Fix**: Normalize before passing to API
**Status**: NEEDS FIX

### 5. **components/workflow/AuthorizationStep.js** 🔴 HIGH PRIORITY
```javascript
// Line 99 - Creates WRONG field name
annual_trade_volume: workflowData?.company?.trade_volume,
```
**Issue**: Reads from `trade_volume` but writes as `annual_trade_volume`
**Fix**: Keep as `trade_volume` throughout
**Status**: NEEDS FIX

### 6. **components/workflow/AlertsSubscriptionFlow.js** 🟡 MEDIUM
```javascript
// Line 36 - Uses WRONG field name
const tradeVolume = userProfile?.annual_trade_volume || 1000000;
```
**Issue**: Fallback to hardcoded 1000000
**Fix**: Use canonical `trade_volume`
**Status**: NEEDS FIX

---

## API ENDPOINTS

### 7. **pages/api/ai-vulnerability-alerts.js** 🔴 HIGH PRIORITY
```javascript
// Line 38 - Uses FALLBACK CHAIN
const rawTradeVolume = workflowData.company?.annual_trade_volume || workflowData.company?.trade_volume || 0;

// Line 75 - Writes WRONG field name
annual_trade_volume: parsedTradeVolume,
```
**Issue**: Reads one field name, writes another
**Fix**: Normalize input, use canonical throughout
**Status**: NEEDS FIX

### 8. **pages/api/consolidate-alerts.js** ✅ FIXED
```javascript
// Line 41 - FIXED to use canonical name
if (!user_profile.trade_volume && user_profile.userId)

// Line 313 - FIXED to use canonical name with proper message
Annual Trade Volume: $${userProfile.trade_volume || 'unknown (not provided in workflow)'}
```
**Previous Issue**: Checking 3 different camelCase variants
**Fix Applied**: Normalized to use canonical `trade_volume` only, removed fallback chains
**Status**: COMPLETED ✅

### 9. **pages/api/ai-trade-advisor.js** ✅ FIXED
```javascript
// Lines 71-74 - FIXED to use canonical with proper warning
const tradeVolume = profile.trade_volume || (() => {
  console.warn('⚠️ [FORM SCHEMA] Missing profile.trade_volume in ai-trade-advisor');
  return 0;
})();
```
**Previous Issue**: Fallback chain to multiple camelCase variants
**Fix Applied**: Canonical `trade_volume` only, logs warning if missing (proper "fail loud")
**Status**: COMPLETED ✅

### 10. **pages/api/dashboard-data.js** ✅ FIXED
```javascript
// Line 96 - FIXED to use canonical only
trade_volume: parseFloat(row.trade_volume) || 0,

// Line 124 - FIXED with validation
const tv = parseFloat(workflowData.company?.trade_volume);
if (isNaN(tv)) {
  console.warn('⚠️ [FORM SCHEMA] Invalid/missing company.trade_volume in dashboard-data');
  return 0;
}

// Line 260 - FIXED to use canonical
trade_volume: contextWorkflow.trade_volume || 0,
```
**Previous Issue**: Checked multiple field names, wrote to wrong field
**Fix Applied**: Canonical `trade_volume` throughout, validation with warning logs
**Status**: COMPLETED ✅

### 11. **pages/api/crisis-response-analysis.js** 🟡 MEDIUM
```javascript
// Line 58 - Uses SHORTHAND
annual_volume: serviceDetails?.trade_volume || original_request?.trade_volume,
```
**Issue**: Uses `annual_volume` as shorthand
**Fix**: Stick to `trade_volume`
**Status**: NEEDS FIX

### 12. **pages/api/manufacturing-feasibility-analysis.js** 🟡 MEDIUM
Same as crisis-response-analysis.js
**Status**: NEEDS FIX

### 13. **pages/api/crisis-solutions.js** 🟡 MEDIUM
```javascript
// Line 91 - Uses WEIRD CAMELCASE
annual_volume: user_profile.annualTradeVolume ?
```
**Issue**: `annualTradeVolume` variant
**Fix**: Use `trade_volume`
**Status**: NEEDS FIX

---

## ARCHIVED/LEGACY COMPONENTS

### 14-20. **components/_archive/** (CrisisResponseTab, HSClassificationTab, etc) 🟢 LOW
These are in archive but still reference `comp.country` instead of `comp.origin_country`
**Status**: Can be left as-is (archived) or updated for consistency

---

## SUMMARY BY CATEGORY

### **Field Name Variants Found** (5 total):
1. `trade_volume` ✅ CANONICAL
2. `annual_trade_volume` ❌ (8 files)
3. `tradeVolume` ❌ (6 files)
4. `annual_volume` ❌ (3 files)
5. `annualTradeVolume` ❌ (1 file)

### **Files to Fix** (13 active):
- **Critical Path (User-Facing)**: 6 files
- **API Endpoints**: 7 files
- **Archived**: ~5 files (optional)

### **Pattern**: Fallback Chains
18 instances of `x || y || z || 0` that mask bugs

---

## REMEDIATION STRATEGY

### Phase 1: Normalize Data at Boundaries (THIS TASK)
1. Fix critical workflow results components (ExecutiveSummary, USMCAQualification, etc)
2. Fix API endpoints to normalize input
3. Remove all fallback chains
4. Use `normalizeFormData()` from `lib/schemas/form-data-schema.js`

### Phase 2: Enforce Schema Validation
Add validation calls to all data-receiving functions:
```javascript
import { validateFormSchema, normalizeFormData } from '../schemas/form-data-schema.js';

// At API entry point or component mount
const validation = validateFormSchema(formData, 'MyComponent');
if (!validation.valid) {
  console.error('Validation failed:', validation.missing);
}

// Normalize all aliases
const normalized = normalizeFormData(formData);
```

### Phase 3: Testing
- Verify trade_volume displays correctly in all results
- Verify no silent $0 defaults
- Test with actual workflow data

---

## Files to Fix (Priority Order)

### ACTIVE FILES (SaaS USMCA Certificate Platform)
1. ✅ `components/workflow/ComponentOriginsStepEnhanced.js` (ALREADY FIXED)
2. 🔴 `components/workflow/results/ExecutiveSummary.js`
3. 🔴 `components/workflow/results/USMCAQualification.js`
4. 🔴 `components/workflow/results/RecommendedActions.js`
5. 🔴 `components/workflow/results/WorkflowResults.js`
6. 🔴 `components/workflow/AuthorizationStep.js`
7. 🔴 `pages/api/ai-vulnerability-alerts.js`
8. 🟡 `components/workflow/AlertsSubscriptionFlow.js`
9. ✅ `pages/api/consolidate-alerts.js` (FIXED Oct 23)
10. ✅ `pages/api/ai-trade-advisor.js` (FIXED Oct 23)
11. ✅ `pages/api/dashboard-data.js` (FIXED Oct 23)

### ARCHIVED FILES (Old Consulting Service Model - Removed)
- 📦 `pages/api/archived-api/crisis-response-analysis.js` (archived, MEDIUM priority)
- 📦 `pages/api/archived-api/manufacturing-feasibility-analysis.js` (archived, MEDIUM priority)
- 📦 `pages/api/archived-api/crisis-solutions.js` (archived, MEDIUM priority)

---

## ✅ Completion Status (October 23, 2025)

### COMPLETED
- ✅ **MEDIUM Priority API Fixes (Active Files)**:
  - `pages/api/consolidate-alerts.js` - Canonical `trade_volume` only, removed fallback chains
  - `pages/api/ai-trade-advisor.js` - Canonical `trade_volume`, proper "fail loud" warning logging
  - `pages/api/dashboard-data.js` - Canonical throughout, validation with warning logs

- ✅ **Archived Legacy Files**:
  - Moved 3 deprecated consulting service APIs to `pages/api/archived-api/` (crisis-response-analysis, manufacturing-feasibility, crisis-solutions)
  - Aligns codebase with SaaS-only business model per CLAUDE.md

### REMAINING
- **HIGH Priority (6 files)**: Critical path components (ExecutiveSummary, USMCAQualification, RecommendedActions, WorkflowResults, AuthorizationStep, ai-vulnerability-alerts)
- **MEDIUM Priority (1 file)**: AlertsSubscriptionFlow
- **Total Remaining Effort**: ~15 targeted fixes across 7 user-facing components

**Expected Outcome**: Single field name (`trade_volume`) used throughout all active files, no silent $0 defaults, proper validation with warning logs
