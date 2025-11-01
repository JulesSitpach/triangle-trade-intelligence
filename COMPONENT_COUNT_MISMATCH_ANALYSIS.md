# Component Count Mismatch Analysis

**Date:** October 31, 2025
**Issue:** False positive security alerts for component count mismatches
**Severity:** LOW (Not a security issue - logic inconsistency)

---

## The Error

```
[SECURITY] used_components_count mismatch for user 570206c8-b431-4936-81e8-8186ea4065f0:
  client=5, actual=1

⚠️ DEV ISSUE [HIGH]: Component count mismatch - possible manipulation attempt
  userId: 570206c8-b431-4936-81e8-8186ea4065f0
  clientSentCount: 5
  actualLockedCount: 1
  usedComponentCount: 5
```

---

## Root Cause: Logic Inconsistency (NOT Malicious Activity)

The client and server are using **different counting logic** for the same purpose:

### Client-Side Logic (ComponentOriginsStepEnhanced.js:83-91)

```javascript
const [usedComponentsCount, setUsedComponentsCount] = useState(() => {
  if (formData.component_origins && formData.component_origins.length > 0) {
    // ✅ FIX: Count components that are locked OR have HS codes
    return formData.component_origins.filter(c =>
      c.is_locked || (c.hs_code && c.hs_code.length >= 6)  // ← Counts BOTH
    ).length;
  }
  return 0;
});
```

**Client counts:** `is_locked: true` **OR** has valid HS code (≥6 chars)

### Server-Side Logic (ai-usmca-complete-analysis.js:443)

```javascript
const actualLockedCount = formData.component_origins?.filter(c => c.is_locked).length || 0;
```

**Server counts:** ONLY `is_locked: true` (ignores HS code presence)

---

## Why This Happens (Legitimate Scenarios)

### Scenario 1: Old Data Migration
- User created workflow before auto-lock logic was added
- 5 components have HS codes from prior lookups
- But `is_locked` flag was never set (old data format)
- **Client sees:** 5 components (counts HS codes)
- **Server sees:** 1 component (only explicit locks)

### Scenario 2: Manual Data Entry
- User manually entered HS codes without clicking "Lookup" button
- Components have `hs_code` but never triggered lock mechanism
- **Client sees:** 5 components (counts HS codes)
- **Server sees:** 1 component (only explicit locks)

### Scenario 3: Data Restoration
- Components restored from localStorage or database
- `normalizeComponent()` function (line 35) auto-locks components with HS codes:
  ```javascript
  const shouldBeLocked = component?.is_locked ?? (hasHSCode ? true : false);
  ```
- But this normalization happens AFTER `usedComponentsCount` is calculated
- **Client sees:** 5 components (pre-normalization count)
- **Server sees:** 1 component (doesn't use same normalization logic)

---

## Why This is NOT a Security Issue

1. **System still enforces limits correctly:**
   - Uses `Math.max(actualLockedCount, clientSentCount)` - takes the HIGHER value
   - Even if client sends lower count, server uses actual locked count
   - User cannot bypass limits by manipulating client state

2. **Warning triggers on ANY mismatch:**
   - Triggers when `clientSentCount > actualLockedCount` (expected behavior)
   - **Also triggers when `clientSentCount > actualLockedCount`** ← This is the false positive
   - Current code flags ALL discrepancies as "possible manipulation"

3. **DevTools manipulation already prevented:**
   - Server recalculates from actual `component_origins` array
   - Client-sent count is only used as fallback/validation
   - Actual enforcement uses server-side data

---

## The Fix: Align Client and Server Logic

### Option 1: Server Should Match Client Logic (Recommended)

**Change:** `ai-usmca-complete-analysis.js:443`

```javascript
// BEFORE (only counts explicit locks)
const actualLockedCount = formData.component_origins?.filter(c => c.is_locked).length || 0;

// AFTER (matches client logic - counts locks OR HS codes)
const actualLockedCount = formData.component_origins?.filter(c =>
  c.is_locked || (c.hs_code && c.hs_code.length >= 6)
).length || 0;
```

**Why:** This matches the client-side logic and handles old data correctly.

### Option 2: Only Warn on Suspicious Mismatches

**Change:** `ai-usmca-complete-analysis.js:451-458`

```javascript
// BEFORE (warns on ANY mismatch)
if (clientSentCount > 0 && actualLockedCount !== clientSentCount) {
  console.warn(`[SECURITY] mismatch...`);
}

// AFTER (only warns if client sent LOWER count - possible manipulation)
if (clientSentCount > 0 && clientSentCount < actualLockedCount) {
  console.warn(`[SECURITY] Client sent LOWER count than actual - possible manipulation attempt`);
  // Log to dev_issues...
}
```

**Why:** Only flags when client tries to undercount (actual manipulation), not overcounting (false positive).

---

## Recommended Solution

**Implement BOTH fixes:**

1. **Align counting logic** (Option 1) - ensures consistency
2. **Only warn on suspicious patterns** (Option 2) - reduces false positives

### Updated Code (ai-usmca-complete-analysis.js:443-459)

```javascript
// Check 3: Component limit (prevent complex analyses on lower tiers)
// 🔒 SERVER-SIDE VALIDATION: Don't trust client-sent used_components_count
// Recalculate from actual locked components to prevent DevTools manipulation

// ✅ FIX: Match client logic - count locked OR has valid HS code
const actualLockedCount = formData.component_origins?.filter(c =>
  c.is_locked || (c.hs_code && c.hs_code.length >= 6)
).length || 0;

const clientSentCount = formData.used_components_count || 0;
const currentComponentCount = formData.component_origins?.length || 0;

// Use the HIGHER of the two values (prevents client from lying about lower count)
const usedComponentCount = Math.max(actualLockedCount, clientSentCount);

// ✅ FIX: Only log if client sent LOWER count (actual manipulation attempt)
if (clientSentCount > 0 && clientSentCount < actualLockedCount) {
  console.warn(`[SECURITY] Client undercount detected for user ${userId}: client=${clientSentCount}, actual=${actualLockedCount}`);
  await DevIssue.unexpectedBehavior('ai_usmca_analysis', 'Component count manipulation - client sent lower count than actual', {
    userId,
    clientSentCount,
    actualLockedCount,
    usedComponentCount
  });
}
```

---

## Impact Assessment

### Current Behavior
- ✅ Limits enforced correctly (no bypass possible)
- ❌ False positive alerts filling dev_issues table
- ❌ Support team distracted by non-issues

### After Fix
- ✅ Limits still enforced correctly
- ✅ No false positives for legitimate data migrations
- ✅ Only alerts on actual manipulation attempts
- ✅ Cleaner dev_issues logs

---

## Testing Verification

### Test Case 1: Old Data Migration
**Setup:**
```javascript
// Simulate old workflow data (no is_locked flags)
const oldData = {
  component_origins: [
    { description: "CPU", hs_code: "8542310000", is_locked: false },
    { description: "RAM", hs_code: "8473301100", is_locked: false },
    { description: "SSD", hs_code: "8523511000", is_locked: false },
    { description: "PSU", hs_code: "8504401400", is_locked: false },
    { description: "Case", hs_code: "7326909800", is_locked: false }
  ],
  used_components_count: 5
};
```

**Expected After Fix:**
- `actualLockedCount` = 5 (counts HS codes)
- `clientSentCount` = 5
- **No warning** (counts match)

### Test Case 2: Actual Manipulation Attempt
**Setup:**
```javascript
// User tries to bypass limit by sending lower count
const manipulatedData = {
  component_origins: [
    { description: "CPU", hs_code: "8542310000", is_locked: true },
    { description: "RAM", hs_code: "8473301100", is_locked: true },
    { description: "SSD", hs_code: "8523511000", is_locked: true }
  ],
  used_components_count: 1  // ← Lying about actual count
};
```

**Expected After Fix:**
- `actualLockedCount` = 3 (counts locks + HS codes)
- `clientSentCount` = 1 (suspicious)
- **⚠️ WARNING TRIGGERED** (client sent lower count)

---

## Conclusion

This is **NOT a security vulnerability** - it's a **false positive** caused by inconsistent counting logic between client and server. The fix is straightforward and improves code quality without affecting security enforcement.

**Priority:** P2 (Low urgency - limits still enforced correctly)
**Effort:** 5 minutes (2 line changes)
**Risk:** None (makes validation more accurate)
