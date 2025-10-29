# THE REAL ROOT CAUSE

**Date:** Oct 28, 2025
**Issue:** Annual Savings column showing "—" for a week despite multiple "fixes"

---

## 🎯 ROOT CAUSE

**Line 1320** in `pages/api/ai-usmca-complete-analysis.js`:

```javascript
Object.entries(COMPONENT_DATA_CONTRACT.fields).forEach(([dbFieldName, fieldDef]) => {
  // Only copies fields that exist in the contract
  // SILENTLY DROPS everything else
});
```

**What happened:**
1. We calculated `annual_savings` correctly (line 994)
2. We merged it into `componentBreakdown` (line 1290)
3. Transformation code (line 1320) checked the contract
4. `annual_savings` wasn't in the contract → **SILENTLY DROPPED**
5. Frontend received components without `annual_savings` → Shows "—"

**The Irony:**
- Data contract created to "prevent bugs"
- Actually CAUSED the bug by silently dropping fields
- Made debugging 10x harder (invisible data loss)

---

## ❌ WHAT SHOULD NEVER HAVE EXISTED

**File:** `lib/contracts/COMPONENT_DATA_CONTRACT.js`
**Created:** Oct 26, 2025 by previous agent
**Purpose:** "Prevent field name chaos across layers"
**Actual Result:** Created field name chaos + silent data loss

**The "Problem" It Was Solving:**
- Database uses: `mfn_rate`
- API uses: `mfnRate` (camelCase)
- Frontend uses: `savingsPercentage`
- AI uses: `tariffRate`

**The "Solution":**
- 1,200-line file defining every field
- Transformation functions between layers
- Silent dropping of unlisted fields ← **BUG**

---

## ✅ THE ACTUAL SOLUTION (Already in CLAUDE.md)

**Use snake_case everywhere:**

```javascript
// Database
annual_savings: INTEGER

// API Response
{
  "annual_savings": 38250
}

// Frontend
component.annual_savings

// AI Prompt
"annual_savings": 38250
```

**Result:**
- NO transformation needed
- NO contract needed
- NO silent dropping
- NO bugs

**From CLAUDE.md:**
```markdown
## 📝 NAMING CONVENTION: snake_case ONLY (NO camelCase)

**Database Schema**: ✅ All columns use snake_case
**API Responses**: ✅ Return snake_case
**Frontend**: ✅ Use snake_case (component.annual_savings)
```

---

## 🐛 WHY THE BUG PERSISTED FOR A WEEK

### Attempt 1: "Fixed" Annual Savings Calculation
**What we did:** Added calculation in `componentFinancials`
**Why it failed:** Never merged into `componentBreakdown`
**User saw:** Still "—"

### Attempt 2: "Fixed" - Merged into componentBreakdown
**What we did:** Added `annual_savings: financialData.annual_savings` (line 1290)
**Why it failed:** Data contract silently dropped it during transformation
**User saw:** Still "—"

### Attempt 3: "Fixed" - Added to data contract
**What we did:** Added `annual_savings` to contract (line 1008)
**Why it might work:** Transformation won't drop it anymore
**User will see:** TBD (testing now)

---

## 🔥 THE COMPLEXITY TRAP

**Before Data Contract:**
```javascript
// Simple, direct
component.annual_savings = 38250;
return component;  // Frontend gets it
```

**After Data Contract:**
```javascript
// 1. Calculate
financialData.annual_savings = 38250;

// 2. Merge
component.annual_savings = financialData.annual_savings;

// 3. Transform (check contract)
if (COMPONENT_DATA_CONTRACT.fields['annual_savings']) {
  apiComponent.annual_savings = transform(component.annual_savings);
} else {
  // SILENTLY DROP ← Bug happens here
}

// 4. Frontend
// Gets undefined because it was dropped
```

**Lines of code:**
- Before: 2 lines
- After: 50+ lines + 1,200-line contract file
- Bug risk: 100x higher

---

## 📊 WHAT THE USER SEES

**Week 1 - Oct 21:**
```
| Component | Annual Savings |
|-----------|----------------|
| Microprocessor | — |
```

**Week 2 - Oct 28 (after "fix #1"):**
```
| Component | Annual Savings |
|-----------|----------------|
| Microprocessor | — |
```

**Week 3 - Oct 28 (after "fix #2"):**
```
| Component | Annual Savings |
|-----------|----------------|
| Microprocessor | — |
```

**Week 3 - Oct 28 (after "fix #3" - contract updated):**
```
| Component | Annual Savings |
|-----------|----------------|
| Microprocessor | $1,041,250 ??? (testing...)
```

---

## 🎓 LESSONS LEARNED

1. **Simplicity wins** - snake_case everywhere beats "smart" transformations
2. **Silent failures are evil** - Should have thrown error, not silently dropped
3. **Question complexity** - 1,200-line contract file is a red flag
4. **Test the actual flow** - Don't assume transformations preserve data
5. **Trust the user** - When they say "still broken", believe them

---

## 🔧 BETTER ALTERNATIVE

**Option 1: Remove data contract entirely**
- Use snake_case everywhere
- Direct assignment, no transformation
- Explicit errors if field doesn't exist

**Option 2: Make contract fail loudly**
```javascript
Object.entries(component).forEach(([key, value]) => {
  if (!COMPONENT_DATA_CONTRACT.fields[key]) {
    throw new Error(`Unknown field: ${key} - Add to contract or remove from code`);
  }
});
```

**Option 3: Keep contract but don't silently drop**
```javascript
// Copy ALL fields, not just contract fields
return {
  ...component,  // Preserve everything
  // Then apply transformations to known fields
};
```

---

## 🚨 IMMEDIATE ACTION

**For this session:**
- ✅ Added `annual_savings` to contract (line 1008)
- ⏳ Testing if Annual Savings now appears

**For future:**
- Consider removing data contract entirely
- Use simple snake_case everywhere
- Follow CLAUDE.md naming convention (already specifies snake_case)

---

**Status:** Testing fix #3 (contract updated)
**User patience:** Exhausted (rightfully so)
**Lesson:** Complexity is the enemy of reliability
