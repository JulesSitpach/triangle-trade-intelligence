# 🔴 CRITICAL: Tariff Database Corruption - Complete Fix Guide

**Date**: November 20, 2025
**Status**: 🔴 CRITICAL - 1,807 HS codes have corrupted tariff data
**Root Cause**: Default-to-zero pattern in populate scripts
**Impact**: Users seeing 0% tariff rates when they should see 25%

---

## 📊 CORRUPTION SUMMARY

| Chapter | Description | Total Codes | Missing Section 232 | Missing Section 301 |
|---------|-------------|-------------|---------------------|---------------------|
| **73** | Steel articles | 392 | **391 (99.7%)** 🔴 | 0 ✅ |
| **85** | Electronics | 755 | **755 (100%)** 🔴 | 0 ✅ |
| **72** | Raw steel | 516 | 212 (41%) 🔴 | **304 (59%)** 🔴 |
| **76** | Aluminum | 114 | 31 (27%) 🔴 | **82 (72%)** 🔴 |
| **TOTAL** | **All** | **1,807** | **1,389** 🔴 | **386** 🔴 |

---

## 🔍 ROOT CAUSE ANALYSIS

### The Bug (2 locations):

**File 1**: `scripts/populate-section-232-overlay.js` **Line 245**:
```javascript
// ❌ WRONG: Defaults missing Section 301 to 0%
const existingSection301 = existing.section_301 !== undefined ? existing.section_301 : 0;
```

**File 2**: `scripts/populate-section-301-overlay.js` **Line 189**:
```javascript
// ❌ WRONG: Defaults missing Section 232 to 0%
section_232: result.section_232 || 0,
```

### How It Happened:

```
1. Section 301 script runs FIRST on Chapter 73
   ↓ Creates 392 records with section_232 = 0 (line 189 bug)
   ↓
2. Section 232 script runs SECOND
   ↓ Sees records already exist
   ↓ Updates section_232 to correct value (0.25)
   ↓ BUT: Line 245 preserves existing section_301 = 0 (never gets corrected!)
   ↓
3. Result: 391 of 392 codes have section_232 = 0 forever
```

**This violates your AI-first architecture rule:**
> "Never assume tariffs are 0% - default to null means 'needs investigation'"

---

## ✅ THE COMPLETE FIX (3 Steps)

### STEP 1: Fix Both Scripts (2 minutes)

**Edit populate-section-232-overlay.js line 245:**
```javascript
// BEFORE:
const existingSection301 = existing.section_301 !== undefined ? existing.section_301 : 0;

// AFTER:
const existingSection301 = existing.section_301 !== undefined ? existing.section_301 : null;
```

**Edit populate-section-301-overlay.js line 189:**
```javascript
// BEFORE:
section_232: result.section_232 || 0,

// AFTER:
section_232: result.section_232 || null,
```

### STEP 2: Validate Script Fixes (30 seconds)

Run validation script with code checking:
```bash
node scripts/validate-tariff-cache.js --fix-scripts
```

**Expected output:**
```
✅ No dangerous code patterns found in scripts.
```

If you see violations, fix them before proceeding to Step 3.

### STEP 3: Re-populate Database (15 minutes)

Run these commands **IN ORDER** to fix all 1,807 corrupted records:

```bash
# Chapter 73 (Steel articles) - 392 codes
node scripts/populate-section-301-overlay.js --chapter=73
node scripts/populate-section-232-overlay.js --chapter=73 --origin-country=CN

# Chapter 85 (Electronics) - 755 codes
node scripts/populate-section-301-overlay.js --chapter=85
node scripts/populate-section-232-overlay.js --chapter=85 --origin-country=CN

# Chapter 72 (Raw steel) - 516 codes
node scripts/populate-section-301-overlay.js --chapter=72
node scripts/populate-section-232-overlay.js --chapter=72 --origin-country=CN

# Chapter 76 (Aluminum) - 114 codes
node scripts/populate-section-301-overlay.js --chapter=76
node scripts/populate-section-232-overlay.js --chapter=76 --origin-country=CN
```

**IMPORTANT**: Always run Section 301 BEFORE Section 232 for each chapter.

### STEP 4: Verify Fix (30 seconds)

```bash
node scripts/validate-tariff-cache.js
```

**Expected output:**
```
✅ STATUS: ALL CHECKS PASSED - Database is healthy
Total corrupted: 0
```

---

## 🧪 VERIFICATION QUERIES

### Check Your Test Case (Chapter 73, HS 7326.90.70):

```sql
SELECT hs_code, section_301, section_232, verified_date, data_source
FROM policy_tariffs_cache
WHERE hs_code LIKE '7326%'
LIMIT 5;
```

**Expected after fix:**
```
hs_code      | section_301 | section_232 | verified_date | data_source
7326907000   | 0.25        | 0.25        | 2025-11-20    | Section 301 List 1/2/3 | Section 232 steel/aluminum
```

### Count Total Corruption (should be 0 after fix):

```sql
SELECT
  SUM(CASE WHEN section_301 = 0 AND section_232 > 0 THEN 1 ELSE 0 END) as corrupted_301,
  SUM(CASE WHEN section_232 = 0 AND section_301 > 0 THEN 1 ELSE 0 END) as corrupted_232
FROM policy_tariffs_cache;
```

**Expected after fix:**
```
corrupted_301 | corrupted_232
0             | 0
```

---

## 🚨 NEVER-AGAIN SAFEGUARDS

### 1. Pre-Commit Hook (Add to `.git/hooks/pre-commit`):

```bash
#!/bin/bash

# Check for dangerous default-to-zero pattern in populate scripts
if git diff --cached --name-only | grep -q "scripts/populate-.*\.js"; then
  echo "🔍 Checking populate scripts for dangerous patterns..."

  if git diff --cached scripts/populate-*.js | grep -E "(section_301|section_232).*:\s*0[,;]" > /dev/null; then
    echo "❌ COMMIT BLOCKED: Found default-to-zero pattern in populate scripts"
    echo "   Never default section_301 or section_232 to 0"
    echo "   Use null instead: section_301 || null"
    exit 1
  fi

  echo "✅ No dangerous patterns found"
fi
```

### 2. Add to npm test script:

```json
{
  "scripts": {
    "test:tariffs": "node scripts/validate-tariff-cache.js --fix-scripts",
    "pretest": "npm run test:tariffs"
  }
}
```

### 3. Add Cron Job Validation (runs weekly):

```javascript
// In your cron job scheduler
import { exec } from 'child_process';

// Every Monday at 9 AM
cron.schedule('0 9 * * 1', () => {
  exec('node scripts/validate-tariff-cache.js', (error, stdout, stderr) => {
    if (error) {
      // Send alert to Slack/email
      console.error('🔴 TARIFF CACHE CORRUPTION DETECTED!');
      console.error(stdout);
    }
  });
});
```

---

## 📝 LESSONS LEARNED

### What Went Wrong:

1. **Hidden Dependencies**: Scripts looked independent but had ordering requirements
2. **Silent Data Loss**: 0 looked valid, but meant "never researched"
3. **No Validation**: No checks to catch corruption before production
4. **Helpful Defaults Backfired**: "I'll use 0 to help" → wrong data forever

### Architecture Changes Required:

1. ✅ **Fix default values**: null (needs research) vs 0 (researched, duty-free)
2. ✅ **Master orchestration**: Single script enforces correct order
3. ✅ **Validation gates**: Block corrupt data at script/commit/deploy levels
4. ✅ **Data contracts**: Test expected relationships (if 301>0 then 232 should not be 0)

### New Development Rule:

> **"Never default tariff fields to 0 in scripts. Use null."**
>
> - 0 means "researched, confirmed duty-free" (rare)
> - null means "needs AI research" (correct default)

---

## 🎯 IMMEDIATE ACTION REQUIRED

1. **Run validation**: `node scripts/validate-tariff-cache.js --fix-scripts`
2. **Fix both scripts** (lines 245 and 189)
3. **Re-run populate scripts** for chapters 73, 85, 72, 76
4. **Verify fix**: Validation should show 0 corrupted codes

**Estimated time**: 20 minutes total

**Your test case (HS 7326.90.70 from China) will show:**
- Section 301: 25% (was 0%)
- Section 232: 25% (was 0%)
- Total: 50% (was 0% or wrong)

---

**Ready to run the fix? Start with:**
```bash
node scripts/validate-tariff-cache.js --fix-scripts
```
