# Labor Credit Fix - Nov 21, 2025

## Problem: Phantom Labor Credit

**What was happening:**
- Demo data had NO `manufacturing_process` field
- Code checked `substantial_transformation` checkbox → inferred "high complexity"
- AI fabricated 16-20% labor credit without actual manufacturing data
- Result: 96-98% RVC (80% components + **phantom** 16-18% labor)

**Example of fabrication:**
```javascript
// BEFORE:
substantial_transformation: true  // Just a checkbox
→ AI interprets as "high complexity"
→ AI invents 16-18% labor credit
→ Total RVC: 80% + 18% = 98% ✗ (fabricated)
```

## Root Cause

**File:** `lib/usmca/qualification-engine.js` (line 59)

**Old code:**
```javascript
const laborValueAdded = threshold.labor || 12;  // ✗ ALWAYS used database baseline
```

**Problem:** Database baseline (18% for Automotive) was used even when user provided ZERO manufacturing data.

**AI Prompt issue:**
```javascript
LABOR CREDIT BASELINE: 18% (from industry research for Automotive)
Complexity: High (substantial transformation)  // ← Misleading!

You may adjust this baseline UP or DOWN...
```

AI saw "high complexity" and adjusted UP from 18%, fabricating credit without data.

## Solution: Option A - Conservative (No Data = No Credit)

### Code Changes

**File 1:** `lib/usmca/qualification-engine.js` (line 62-64)

```javascript
// ✅ FIX (Nov 21, 2025): OPTION A - Conservative approach
// No manufacturing_process data = No labor credit (prevents fabricating numbers)
const laborValueAdded = manufacturingProcess
  ? (threshold.labor || 12)  // User provided process details - use database baseline
  : 0;  // No manufacturing details = no labor credit (honest)
```

**File 2:** `lib/usmca/qualification-engine.js` (line 145-159)

```javascript
${laborValueAdded > 0 ? `✅ LABOR CREDIT BASELINE: ${laborValueAdded}%
Manufacturing Process Provided: "${manufacturingProcess}"
You may adjust this baseline UP or DOWN (within 5-25% range) based on the specific processes...`

: `⚠️ NO LABOR CREDIT - Missing Manufacturing Data
User did not provide manufacturing process details or labor cost data.
REQUIRED: You MUST return labor_credit_percentage: 0%
DO NOT fabricate or estimate labor credit without actual data.`}
```

**File 3:** `lib/constants/demo-data.js` (line 33-34)

```javascript
// ✅ FIX: Added manufacturing_process to enable labor credit calculation
// Demo should showcase full platform capability
manufacturing_process: 'Steel backing plate stamping and heat treatment, ceramic friction material mixing and compression molding, high-pressure bonding of friction material to backing plates, automated assembly with hardware components, quality testing',
substantial_transformation: true,
```

### Results

**Demo Data (WITH manufacturing_process):**
- Component RVC: 80% (MX 50% + US 30%)
- Labor Credit: 16-18% ✅ (legitimate - calculated from actual processes)
- Total RVC: 96-98%
- Qualifies for USMCA (exceeds 75% threshold)

**Real Users (WITHOUT manufacturing_process):**
- Component RVC: Variable (based on their components)
- Labor Credit: 0% ✅ (honest - no data provided)
- Total RVC: Just component RVC
- May or may not qualify depending on components

**Message to users without data:**
> "Add manufacturing process details to calculate labor credit and increase your RVC by 15-20%"

## Why This Is Better

### Before (Phantom Credits)
- ❌ Fabricated numbers without user data
- ❌ Users trusted inaccurate RVC calculations
- ❌ Potential CBP audit failures (wrong certificates)
- ❌ Platform liability for bad advice

### After (Honest + Showcases Capability)
- ✅ No fabrication - only calculate with actual data
- ✅ Demo showcases full capability (when data provided)
- ✅ Users incentivized to provide manufacturing details
- ✅ Platform differentiation (competitors don't calculate labor credit)
- ✅ Accurate USMCA certificates (defensible in audits)

## Implementation Notes

**Substantial Transformation Checkbox:**
- **Purpose:** Determines if product qualifies for USMCA (tariff classification changes)
- **NOT a labor credit calculator:** Just a yes/no qualifier
- **Correct use:** "Does manufacturing change the HS code?" → Check if yes

**Labor Credit Calculation:**
- **Requires:** Specific manufacturing process description OR actual labor cost data
- **Database baseline:** Industry-specific percentage (12-18%) as starting point
- **AI adjustment:** Based on actual processes described (within 5-25% range)
- **Result:** Realistic labor credit percentage for RVC calculation

## Testing

**Test Case 1: Demo data (with manufacturing_process)**
```javascript
Input: manufacturing_process = "stamping, heat treatment, bonding..."
Expected: labor_credit ≈ 18%, total_rvc ≈ 98%
```

**Test Case 2: User without manufacturing data**
```javascript
Input: manufacturing_process = null
Expected: labor_credit = 0%, total_rvc = component_rvc only
```

**Test Case 3: User with manufacturing data**
```javascript
Input: manufacturing_process = "Basic assembly and packaging"
Expected: labor_credit ≈ 8-12% (AI adjusts DOWN from baseline)
```

## Database Schema (No Changes Required)

**Table:** `industry_thresholds`
- `labor_percentage`: Baseline labor credit by industry (already exists)
- Values: 12% (Agriculture), 18% (Automotive), 15% (Electronics), etc.

**Table:** `workflow_sessions`
- `manufacturing_process`: Text field for user-provided process description (already exists)
- `substantial_transformation`: Boolean for USMCA qualification (already exists)

## Related Files

- ✅ `lib/usmca/qualification-engine.js` - Labor credit calculation logic
- ✅ `lib/constants/demo-data.js` - Demo with realistic manufacturing processes
- ✅ `lib/services/industry-thresholds-service.js` - Database baseline retrieval
- ✅ `lib/agents/labor-credit-research-agent.js` - AI research for baselines (unused in this fix)

## Key Principles

1. **No data = No credit** - Conservative approach prevents fabrication
2. **Demo showcases capability** - Shows what platform can do with complete data
3. **Incentivize user data** - Clear benefit to providing manufacturing details
4. **AI adjusts baseline** - Not inventing numbers, adjusting based on actual processes
5. **Audit-defensible** - Can justify every labor credit percentage with source data

---

**Status:** ✅ COMPLETE (Nov 21, 2025)
**Impact:** High - Prevents fabricated RVC calculations, improves user trust
**Risk:** Low - Conservative approach (0% when uncertain)
