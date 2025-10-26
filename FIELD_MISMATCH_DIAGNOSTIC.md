# Field Mismatch Diagnostic Report
**Date:** October 26, 2025
**Severity:** Critical
**Status:** Identified, Contract Updated, Solution In Progress

---

## Executive Summary

Frontend code expects **29 component fields** but API returns only **13 core fields**.

**Result:** 16 missing fields cause `undefined` values in the frontend, displaying as empty/0/missing.

**Root Cause:** No explicit contract between frontend and API about what fields should exist.

---

## The 29 Fields Frontend Expects

Based on analysis of `components/workflow/results/USMCAQualification.js`:

### ✅ Currently Provided (13 fields)
1. `description` - Component name
2. `mfn_rate` - Base duty rate
3. `usmca_rate` - Preferential rate
4. `section_301` - China tariff
5. `section_232` - Steel/aluminum tariff
6. `total_rate` - Sum of all duties
7. `value_percentage` - Component value % of product
8. `origin_country` - Country of origin
9. `hs_code` - HS code
10. `savings_percentage` - Tariff savings %
11. `policy_adjustments` - Applied policies (array)
12. `ai_confidence` - AI confidence score
13. `data_source` - Where data came from

### ❌ MISSING (16 fields causing undefined)
1. **`base_mfn_rate`** (CRITICAL)
   - Frontend code: `component.base_mfn_rate || component.mfn_rate || 0`
   - Purpose: Base MFN before Section 301/232 applied
   - Why needed: To calculate CORRECT savings (MFN savings vs total rate savings)
   - Current fallback: Silently uses `mfn_rate`
   - Impact: Savings calculations may be wrong

2. **`rate_source`** (CRITICAL - Data Quality)
   - Frontend code: Shows ✓ Current 2025 or ⚠️ Jan 2025 data badge
   - Purpose: Displays data freshness/source to user
   - Values: 'openrouter_current' | 'database_fallback' | 'ai_enriched' | etc
   - Impact: User doesn't know if viewing stale data

3. **`stale`** (CRITICAL - Data Quality)
   - Frontend code: Displays warning if `component.stale === true`
   - Purpose: Flag for old cached data
   - When true: Shows "⚠️ Jan 2025 data" warning
   - Impact: User can't tell if data is outdated

4. **`ai_reasoning`** (Important - Transparency)
   - Frontend code: Expandable detail showing WHY AI classified this way
   - Purpose: "Classified as semiconductor based on function and complexity. MFN rate 0% under ITA agreement."
   - Impact: User has no explanation for AI's classification

5. **`alternative_codes`** (Important - Classification Confidence)
   - Frontend code: Shows other possible HS codes if classification uncertain
   - Purpose: Alternative classifications user should consider
   - Type: Array of HS codes
   - Impact: User unaware of classification uncertainty

6. **`classified_hs_code`** (Important - AI Assignment)
   - Frontend code: Shows which HS code AI assigned (vs user input)
   - Purpose: HS code assigned by AI (may differ from user's guess)
   - Impact: Confusing if AI chose different code

7. **`hs_description`** (Important - Context)
   - Frontend code: Official description of what this HS code covers
   - Purpose: "Integrated circuits and microelectronic assemblies"
   - Impact: User doesn't understand their component's classification

8. **`is_usmca_member`** (Moderate - Quick Reference)
   - Frontend code: Quick check if origin_country is US/CA/MX
   - Purpose: Boolean flag for USMCA eligibility quick check
   - Impact: Redundant but used for display optimization

9. **`component_type`** (Moderate - Alternative Field)
   - Frontend code: Falls back to this if `description` missing
   - Purpose: Type of component (Microprocessor, Housing, etc)
   - Impact: Fallback works but inconsistent

10. **`country`** (Moderate - Alternative Field)
    - Frontend code: Falls back to this if `origin_country` missing
    - Purpose: Alternate name for country field
    - Impact: Fallback works but inconsistent

11. **`percentage`** (Moderate - Alternative Field)
    - Frontend code: Falls back to this if `value_percentage` missing
    - Purpose: Alternate name for percentage field
    - Impact: Fallback works but inconsistent

12. **`confidence`** (Moderate - Alternative Field)
    - Frontend code: May use this if `ai_confidence` missing
    - Purpose: Alternate confidence field name
    - Impact: Fallback works but inconsistent

13. **`port_fees`** (Low - Dead Code?)
    - Frontend code: Searched but not found in results component
    - Purpose: Unknown - may be legacy
    - Impact: Not currently displayed

14. **`tariff_rates`** (Low - Complex Structure)
    - Frontend code: Complete tariff object (may be nested)
    - Purpose: Full tariff structure with all rates
    - Impact: May be used for deep drill-down

15. **`rate_completeness`** (Low - Data Quality Metadata)
    - Frontend code: Shows if rates are complete/partial/minimal
    - Purpose: Data quality indicator
    - Impact: Informational only

16. **`database_comparison`** (Low - Debug?)
    - Frontend code: Searched but not actively used
    - Purpose: Unknown - comparison with database values?
    - Impact: May be removed

---

## Severity Breakdown

### 🔴 CRITICAL (Fix Immediately)
- `base_mfn_rate` - Wrong savings calculations
- `rate_source` - User can't verify data freshness
- `stale` - User unaware of outdated data

### 🟡 IMPORTANT (Fix Soon)
- `ai_reasoning` - Users want to understand AI decisions
- `alternative_codes` - Classification transparency
- `classified_hs_code` - AI vs user input confusion
- `hs_description` - Context for classification

### 🟢 MODERATE (Nice to Have)
- `is_usmca_member` - Optimization
- Field fallbacks (`component_type`, `country`, `percentage`, `confidence`) - Compatibility

### 🔵 LOW (Consider Later)
- `port_fees` - May be dead code
- `tariff_rates` - Advanced feature
- `database_comparison` - Debug only

---

## The Data Contract Solution

**Before:** Frontend and API had implicit, different assumptions
```javascript
Frontend expects:  base_mfn_rate, rate_source, stale, ai_reasoning, ...
API provides:      mfn_rate, nothing, false, null, ...
Result:            undefined → empty/0 display
```

**After:** Explicit contract in `lib/contracts/COMPONENT_DATA_CONTRACT.js`
```javascript
contract.fields.base_mfn_rate = {
  required: true,
  names: { database: '...', api: '...', frontend: '...' },
  types: { api: 'number' },
  validate: (val) => val >= 0 && val <= 100
}

// Now validation catches missing fields:
validateComponent(component, 'api');
// Output if missing: ❌ VALIDATION FAILED
// Missing required field: base_mfn_rate
```

---

## Action Items

### Phase 1: Contract Documentation ✅ DONE
- [x] Updated `COMPONENT_DATA_CONTRACT.js` with all 29 fields
- [x] Added field definitions, transformations, validation rules
- [x] Documented why each field is needed

### Phase 2: API Response Enrichment (NEXT)
- [ ] Update API to populate all 16 missing fields
- [ ] Ensure `base_mfn_rate` matches `mfn_rate` OR clearly shows difference
- [ ] Add `rate_source` metadata (openrouter_current vs database_fallback)
- [ ] Add `stale` flag (check last_updated timestamp)
- [ ] Add `ai_reasoning` from AI response
- [ ] Add alternative codes if confidence < 0.95
- [ ] Add HS code description from tariff tables

### Phase 3: API Response Validation (AFTER Phase 2)
- [ ] Add validation to catch missing critical fields
- [ ] Fail loud before sending incomplete responses
- [ ] Log to dev_issues if critical fields missing

### Phase 4: Frontend Robustness (OPTIONAL)
- [ ] Update fallback logic to prioritize correct fields
- [ ] Remove dead code field checks
- [ ] Simplify field access patterns

### Phase 5: AI Prompt Enhancement (OPTIONAL)
- [ ] Update AI prompt to return all required fields
- [ ] Request `ai_reasoning` for every classification
- [ ] Request `alternative_codes` for medium-confidence classifications

---

## Implementation Priority

**Must Do (Blocks Users):**
1. Add `base_mfn_rate` to API - wrong savings shown otherwise
2. Add `rate_source` + `stale` - users can't verify data freshness
3. Add validation - catch missing fields immediately

**Should Do (Better UX):**
4. Add `ai_reasoning` - explain AI decisions
5. Add `hs_description` - context for classifications
6. Add `alternative_codes` - show classification uncertainty

**Nice To Have:**
7. Optimize field access patterns
8. Remove dead code

---

## Testing the Fix

Once API is updated, validate with:

```javascript
import { validateComponent } from './lib/contracts/component-transformer.js';

// Fetch from API
const response = await fetch('/api/ai-usmca-complete-analysis', { ... });
const { results } = await response.json();

// Validate before using in frontend
const component = results.component_origins[0];
const validation = validateComponent(component, 'api');

if (!validation.valid) {
  console.error('❌ API Response Invalid:');
  validation.errors.forEach(err => console.error(`  - ${err}`));
  validation.warnings.forEach(warn => console.warn(`  ⚠️ ${warn}`));
}

// If valid, component is guaranteed to have all required fields
console.log(component.base_mfn_rate);    // ✅ Defined
console.log(component.rate_source);      // ✅ Defined
console.log(component.ai_reasoning);     // ✅ Defined
```

---

## Why This Happened

1. **No Contract:** Frontend and API had no explicit agreement about fields
2. **Silent Failures:** When fields missing, JavaScript just returns `undefined`
3. **Fallback Cascades:** Code falls back to other names, hiding the real problem
4. **No Validation:** API didn't check what it was sending
5. **Implicit Assumptions:** Developers assumed others would provide the same fields

## How This Is Now Prevented

1. **Explicit Contract:** `COMPONENT_DATA_CONTRACT.js` lists all 29 fields
2. **Loud Failures:** Validation throws error if fields missing
3. **Type Safety:** Contract enforces correct types
4. **Transformation Tracking:** `component-transformer.js` shows what changed
5. **Documentation:** Every field has a purpose, type, and transformation rule

---

## Files Changed

- `lib/contracts/COMPONENT_DATA_CONTRACT.js` (+304 lines)
  - Added 16 missing field definitions
  - Documented why each field is needed
  - Added validation rules for each field
  - Added transformation functions

---

## Commits

- **d6405ad** - Add missing fields to data contract that frontend expects

---

## Next Steps

1. ✅ Data contract updated with all fields
2. ⏳ API response enriched with missing fields (IN PROGRESS)
3. ⏳ Validation added to catch missing fields
4. ⏳ Frontend simplification (optional)

---

**Discovered by:** User notification on Oct 26, 2025
**Root cause:** Zero communication between frontend and API about field expectations
**Solution:** Data Contract Pattern with explicit field definitions and validation
