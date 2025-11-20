# Hardcoded Rates Audit Report
**Generated:** November 20, 2025
**Status:** 🚨 CRITICAL DATA INTEGRITY ISSUE

---

## Executive Summary

Found **300+ instances** of hardcoded tariff rates across the codebase. These violations prevent accurate tariff calculations and create systematic data integrity issues.

**Critical Pattern**: When a rate is missing, code defaults to `0` instead of querying the database or triggering AI research.

**Impact**: Users see incorrect tariff rates, incorrect USMCA qualifications, and incorrect savings calculations.

---

## 🔴 CRITICAL: Pattern 1 - `return 0;` in Tariff Context

### pages/api/ai-usmca-complete-analysis.js (5 instances)

**Line 1077**: `return 0;`
- **Context**: Function calculating USMCA rate for components
- **Bug**: Hardcodes 0% instead of looking up actual USMCA preferential rate from database
- **Fix Required**: `return await getUSMCARateFromDatabase(hsCode, originCountry);`

**Line 1084**: `return 0;`
- **Context**: Fallback in USMCA rate calculation
- **Bug**: Returns 0% when database lookup fails
- **Fix Required**: Set `stale: true` to trigger AI research

**Line 1103**: `return 0;`
- **Context**: USMCA rate for qualified products
- **Bug**: Assumes all qualified products have 0% USMCA rate (WRONG - some have 2.5%, 5%, etc.)
- **Fix Required**: Look up actual USMCA rate from tariff_intelligence_master table

**Line 1118**: `return 0;`
- **Context**: getMFNRate() fallback
- **Bug**: Returns 0% when MFN rate not found
- **Fix Required**: Set `stale: true` to trigger AI research, never default to 0%

**Line 1146**: `return 0;`
- **Context**: getUSMCARate() fallback
- **Bug**: Returns 0% when USMCA rate not found in database
- **Fix Required**: Set `stale: true` to trigger AI research

### pages/api/crisis-calculator.js

**Line 36**: `return 0; // No Section 301 for non-China origin`
- **Context**: Section 301 calculation
- **Bug**: Hardcodes Section 301 = 0% for non-China origins (ignores Vietnam, Russia, etc.)
- **Fix Required**: Check policy_tariffs_cache for ALL origin countries

### lib/tariff/enrichment-router.js

**Line 1149**: `if (mfn === 0) return 0;`
- **Context**: Assumes if MFN rate is 0%, USMCA rate is also 0%
- **Bug**: Duty-free MFN doesn't mean duty-free USMCA (could be 2.5% USMCA rate)
- **Fix Required**: Always look up USMCA rate separately, never assume based on MFN

---

## 🔴 CRITICAL: Pattern 2 - Rate Assignments to `0`

### pages/api/ai-usmca-complete-analysis.js

**Lines 793-797**: Complete rate reset
```javascript
mfn_rate: 0,
base_mfn_rate: 0,
section_301: 0,
section_232: 0,
usmca_rate: 0,
```
- **Context**: Initializing component rates before enrichment
- **Bug**: If enrichment fails, component keeps 0% rates (no fallback)
- **Fix Required**: Set `stale: true` to force AI research when enrichment incomplete

**Lines 924-928**: Same pattern (rate reset to 0)
- **Context**: Database cache miss handling
- **Bug**: Returns 0% rates instead of triggering AI research
- **Fix Required**: Set `stale: true` when database returns no data

**Lines 961-965**: Placeholder rates (comment says "AI will research actual rate")
```javascript
mfn_rate: 0,  // Placeholder - AI will research actual rate
base_mfn_rate: 0,
section_301: 0,
section_232: 0,
usmca_rate: 0,
```
- **Bug**: Placeholders never get replaced if AI research doesn't trigger
- **Fix Required**: Ensure `stale: true` is set to force AI research

**Line 1218**: `applied_rate: 0,`
- **Context**: Section 232 applied rate
- **Bug**: Hardcodes 0% instead of checking policy_tariffs_cache
- **Fix Required**: Query database for Section 232 rate

**Line 2342**: `usmca_rate: 0,  // USMCA rate is 0% for qualifying products`
- **Context**: ❌ **THIS IS THE BUG USER SHOWED IN SCREENSHOT**
- **Bug**: Assumes ALL qualifying products have 0% USMCA rate (China component showing 2.9% USMCA rate instead of 0%)
- **Root Cause**: When origin is non-USMCA (China), code returns MFN rate as USMCA rate
- **Fix Required**:
  ```javascript
  // ❌ WRONG:
  usmca_rate: 0,  // Hardcoded assumption

  // ✅ CORRECT:
  const usmcaRate = await getUSMCARateFromDatabase(hsCode, destinationCountry);
  usmca_rate: usmcaRate,  // Could be 0%, 2.5%, 5%, etc.
  ```

### lib/agents/tariff-research-agent.js

**Line 133**: `result.usmca_rate = 0; // T-MEC preferential rate`
- **Context**: Hardcodes Mexico USMCA rate to 0%
- **Bug**: Mexico has different USMCA rates (not always 0%)
- **Fix Required**: Look up actual Mexico USMCA rate from database

### lib/utils/field-validator.js

**Line 20**: `record.usmca_rate = 0; // Default to 0 for USMCA qualifying products`
- **Context**: Validation fallback
- **Bug**: Assumes 0% USMCA rate for all qualifying products
- **Fix Required**: Query database for actual USMCA rate

---

## 🟠 HIGH PRIORITY: Pattern 3 - `|| 0` Defaults (300+ instances)

### Summary
The pattern `component.mfn_rate || 0` means: "If mfn_rate is undefined/null/false, use 0%"

**Problem**: Missing rate should trigger database lookup or AI research, NOT default to 0%.

### Most Critical Files

#### pages/api/ai-usmca-complete-analysis.js (47 instances)
**Lines 745-749**: Component rate defaults
```javascript
mfn_rate: component.mfn_rate || 0,
base_mfn_rate: component.base_mfn_rate || component.mfn_rate || 0,
section_301: component.section_301 || 0,
section_232: component.section_232 || 0,
usmca_rate: component.usmca_rate || 0,
```
- **Bug**: If component is missing any rate, defaults to 0% (wrong)
- **Fix Required**: If rate is missing, set `stale: true` and trigger AI research

**Lines 941-945**: Database cache fallback
```javascript
mfn_rate: parseFloat(cachedRate.mfn_rate) || 0,
base_mfn_rate: parseFloat(cachedRate.mfn_rate) || 0,
section_301: parseFloat(cachedRate.section_301) || 0,
section_232: parseFloat(cachedRate.section_232) || 0,
usmca_rate: parseFloat(cachedRate.usmca_rate) || 0,
```
- **Bug**: If parseFloat fails or cache is missing rate, defaults to 0%
- **Fix Required**: Check if rate exists in cache before parsing, trigger AI if missing

**Lines 1312-1316**: Pre-AI enrichment defaults
```javascript
mfn_rate: component.mfn_rate || 0,
base_mfn_rate: component.base_mfn_rate || component.mfn_rate || 0,
section_301: component.section_301 || 0,
section_232: component.section_232 || 0,
usmca_rate: component.usmca_rate || 0,
```
- **Context**: Before sending to AI for enrichment
- **Bug**: If AI enrichment fails, component keeps 0% rates
- **Fix Required**: Validate enrichment succeeded, retry if rates still 0

#### lib/schemas/component-schema.js (13 instances)
**Lines 110-119**: Schema defaults
```javascript
mfn_rate: component.mfn_rate || 0,
base_mfn_rate: component.base_mfn_rate || component.mfn_rate || 0,
policy_adjusted_mfn_rate: component.policy_adjusted_mfn_rate || component.mfn_rate || 0,
usmca_rate: component.usmca_rate || 0,
section_301: component.section_301 || 0,
section_232: component.section_232 || 0,
port_fees: component.port_fees || 0,
total_rate: component.total_rate || component.mfn_rate || 0,
```
- **Bug**: Component schema ENFORCES 0% defaults for missing rates
- **Impact**: Every component that goes through schema validation gets 0% if rate is missing
- **Fix Required**: Schema should REJECT components with missing rates, not default to 0

#### lib/agents/classification-agent.js (15 instances)
**Lines 868-870**: Classification rate defaults
```javascript
mfn_rate: primaryData.general_rate || primaryData.mfn_rate || 0,
usmca_rate: primaryData.special_rate || primaryData.usmca_rate || 0,
special_rate: primaryData.special_rate || 0,
```
- **Bug**: If database lookup fails, classification returns 0% rates
- **Fix Required**: Return `{ stale: true }` instead of rates when lookup fails

**Lines 886-888**: USMCA data defaults
**Lines 904-906**: Fallback data defaults
**Lines 970-972**: Match defaults
**Lines 1075-1077**: Best match defaults
- **Same pattern repeated 5 times in one file**
- **Fix Required**: All 5 locations need database lookup validation

#### lib/agents/tariff-research-agent.js (10 instances)
**Lines 129-133**: Mexico rate research
```javascript
result.mfn_rate = parseFloat(data.mfn_ad_val_rate || 0);
result.usmca_rate = parseFloat(data.usmca_ad_val_rate || 0);
// ...
result.mfn_rate = parseFloat(data.mexico_ad_val_rate || 0);
result.usmca_rate = 0; // T-MEC preferential rate (HARDCODED)
```
- **Bug**: AI research defaults to 0% if AI doesn't return rate
- **Fix Required**: If AI fails, mark result as `stale: true` for retry

**Lines 505-507**: Canada/Mexico rate defaults
```javascript
mfn_rate: rates.mfn_rate || rates.igi_rate || 0,
usmca_rate: rates.cusma_rate || rates.tmec_rate || 0,
total_rate: rates.mfn_rate || rates.igi_rate || 0,
```
- **Bug**: Multiple fallbacks still end at 0%
- **Fix Required**: If all sources fail, return `{ stale: true }`

**Lines 747-753**: AI response parsing
```javascript
base_mfn_rate: parseFloat(parsed.base_mfn_rate || 0),
section_301: parseFloat(parsed.section_301 || 0),
section_232: parseFloat(parsed.section_232 || 0),
ieepa: parseFloat(parsed.ieepa || 0),
port_fees: parseFloat(parsed.port_fees || 0),
total_rate: parseFloat(parsed.total_rate || 0),
usmca_rate: parseFloat(parsed.usmca_rate || 0),
```
- **Bug**: If AI doesn't return a rate field, parses as 0%
- **Fix Required**: Validate AI response has all required fields before parsing

---

## 🟠 HIGH PRIORITY: Pattern 4 - `: 0` in Tariff Objects

### pages/api/ai-usmca-complete-analysis.js

**Lines 2345-2353**: Savings calculations initialized to 0
```javascript
current_annual_savings: 0,
current_monthly_savings: 0,
current_savings_percentage: 0,
potential_annual_savings: 0,
potential_monthly_savings: 0,
potential_savings_percentage: 0,
annual_savings: 0,
monthly_savings: 0,
savings_percentage: 0,
```
- **Context**: All financial calculations start at 0
- **Bug**: If calculation fails, user sees $0 savings (misleading)
- **Fix Required**: Set savings to `null` if calculation incomplete, not 0

### pages/api/crisis-calculator.js

**Lines 98-100**: Section 301 impact object
```javascript
rate: 0,
rate_percentage: 0,
annual_burden: 0,
```
- **Context**: Section 301 impact for non-China components
- **Bug**: Hardcodes 0% Section 301 (ignores Vietnam, Russia, etc.)
- **Fix Required**: Query policy_tariffs_cache for Section 301 rate

**Lines 140-142**: Section 232 impact object (same pattern)

---

## 🟡 MEDIUM PRIORITY: Other Rate Defaults

### File: lib/services/usitc-dataweb-api.js
**Lines 235-236**: Variable initialization
```javascript
let mfn_rate = 0;
let usmca_rate = 0;
```
- **Context**: Variables initialized before USITC API call
- **Status**: ⚠️ May be OK if followed by API lookup (needs verification)
- **Check**: Ensure these are ALWAYS overwritten by API response

### File: pages/api/dashboard-data.js
**Lines 643-645**: Alert metrics default to 0
```javascript
total_resolved: 0,
total_cost_impact_prevented: 0,
resolved_last_30d: 0,
```
- **Context**: Alert tracking metrics
- **Status**: ✅ OK (metrics can legitimately be 0 if no alerts resolved)

### File: pages/api/workflow-session.js
**Lines 137-141**: Component persistence defaults
```javascript
usmca_rate: component.usmca_rate !== undefined ? component.usmca_rate : 0,
section_301: component.section_301 !== undefined ? component.section_301 : 0,
section_232: component.section_232 !== undefined ? component.section_232 : 0,
total_rate: component.total_rate !== undefined ? component.total_rate : 0,
savings_percentage: component.savings_percentage !== undefined ? component.savings_percentage : 0,
```
- **Bug**: Database save defaults missing rates to 0%
- **Impact**: When workflow is resumed, components have 0% rates instead of triggering lookup
- **Fix Required**: Store `null` for missing rates, not 0

---

## 📊 Statistics

| Pattern | Count | Severity | Files Affected |
|---------|-------|----------|----------------|
| `return 0;` | 7 | 🔴 CRITICAL | 3 |
| `rate = 0` | 15+ | 🔴 CRITICAL | 5 |
| `|| 0` defaults | 300+ | 🟠 HIGH | 20+ |
| `: 0` in objects | 50+ | 🟠 HIGH | 10+ |
| **TOTAL** | **372+** | - | **30+** |

---

## 🎯 Recommended Fix Priority

### Phase 1: Critical Bugs (Fix Today)
1. **ai-usmca-complete-analysis.js:2342** - Fix China component showing 2.9% USMCA rate (user screenshot bug)
2. **ai-usmca-complete-analysis.js:1077-1146** - Replace all 5 `return 0;` with database lookups
3. **crisis-calculator.js:36** - Fix Section 301 hardcoded to 0% for non-China
4. **enrichment-router.js:1149** - Fix assumption that MFN=0 means USMCA=0

### Phase 2: High Priority (Fix This Week)
5. **component-schema.js** - Remove `|| 0` defaults from schema (lines 110-119)
6. **classification-agent.js** - Replace 15 instances of `|| 0` with `stale: true` triggers
7. **tariff-research-agent.js** - Fix AI research defaulting to 0% when AI fails (10 instances)
8. **workflow-session.js** - Store `null` for missing rates, not 0 (lines 137-141)

### Phase 3: Systematic Cleanup (Fix This Month)
9. **ai-usmca-complete-analysis.js** - Replace 47 instances of `|| 0` with proper validation
10. **All remaining files** - Audit and fix 200+ remaining `|| 0` defaults

---

## 🔧 Correct Pattern (Example)

### ❌ WRONG (Current Pattern):
```javascript
const mfnRate = component.mfn_rate || 0;  // Defaults to 0% if missing
return mfnRate;
```

### ✅ CORRECT (Database-First Pattern):
```javascript
// Step 1: Try database lookup
const dbRate = await supabase
  .from('tariff_intelligence_master')
  .select('mfn_ad_val_rate')
  .eq('hts_8', hsCode)
  .single();

if (dbRate?.data?.mfn_ad_val_rate !== null) {
  return dbRate.data.mfn_ad_val_rate;  // Return actual rate from database
}

// Step 2: If database has no data, trigger AI research
return {
  stale: true,  // Trigger AI research
  reason: 'HS code not in database'
};

// Step 3: NEVER default to 0
```

---

## 🚨 Impact on Users

**Current State**:
- China components showing 2.9% USMCA rate (should be 0%)
- Non-USMCA components defaulting to 0% rates (should be actual MFN rates)
- Savings calculations showing $0 (should show actual savings)
- Section 301 ignored for non-China origins (Vietnam, Russia also have Section 301)

**After Fix**:
- All rates come from database (12,118 HS codes)
- Missing rates trigger AI research (not default to 0%)
- Users see accurate tariff rates, savings, and USMCA qualifications

---

**Next Step**: User must decide which phase to tackle first. Recommend starting with Phase 1 (4 critical bugs) before pushing commits.
