# CODEBASE AUDIT MATRIX - QUICK REFERENCE
**Generated:** November 20, 2025
**Status:** Current state of systematic patterns

---

## COMPLETE MATRIX

| # | Area | Check | Status | Evidence | Priority | Action Required |
|---|------|-------|--------|----------|----------|-----------------|
| 1 | Data Types | All tariff fields DECIMAL(5,4) | ✅ PASS | schema.prisma verified | P3 | None - maintain |
| 2 | Defaults | No tariff defaults to 0% | ❌ FAIL | 26 violations found | **P0** | Replace `\|\| 0` with `?? null` |
| 3 | Format | All HS codes normalized 8-digit | ⚠️ PARTIAL | Function exists, usage needs audit | **P1** | Audit 2,057 instances |
| 4 | Scripts | Execute in correct order | ❌ FAIL | No master orchestrator | **P0** | Create sync-all script |
| 5 | Queries | Use fallback hierarchy | ✅ PASS | Most implement 8→6→4→prefix | P2 | Document pattern |
| 6 | USMCA | Queries DB, not hardcoded | ⚠️ PARTIAL | 1 violation (line 1420) | **P1** | Fix assumption bug |
| 7 | Validation | Pre-storage validation | ❌ FAIL | Not implemented | **P0** | Create validation fn |
| 8 | Validation | Post-storage checks | ❌ FAIL | Not implemented | **P0** | Create health check |
| 9 | Confidence | Rates returned with confidence | ✅ PASS | 13 UI locations | P3 | None - excellent |
| 10 | Errors | Helpful error messages | ⚠️ PARTIAL | Mixed quality | **P1** | Standardize messages |
| 11 | RSS | Feeds monitored & fresh | ⚠️ UNKNOWN | Workflow exists, status unclear | P2 | Verify status |
| 12 | Freshness | Data <24h for volatile | ⚠️ UNKNOWN | Need database verification | P2 | Run SQL checks |

---

## SCORE SUMMARY

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 3 | 25% |
| ⚠️ PARTIAL/UNKNOWN | 6 | 50% |
| ❌ FAIL | 3 | 25% |

**Overall Grade:** D+ (58/100)

---

## P0 CRITICAL ISSUES (Must Fix First)

### Issue 1: No Tariff Defaults to 0%
**Status:** ❌ FAIL (26 violations)
**Files:**
- `pages/api/ai-usmca-complete-analysis.js` (Lines 745-749, 941-945, 977, 1034-1035)
- `lib/services/crisis-calculator-service.js` (Line 229)

**Fix:**
```javascript
// ❌ BEFORE:
const section301 = component.section_301 || 0;

// ✅ AFTER:
const section301 = component.section_301 ?? null;
if (section301 === null) {
  throw new TariffDataMissingError(`Section 301 rate not found for ${hsCode}`);
}
```

---

### Issue 2: Script Execution Order Not Enforced
**Status:** ❌ FAIL (No master script)

**Create:** `scripts/sync-all-tariff-overlays.js`
```javascript
async function syncAllTariffOverlays(chapter) {
  console.log('🔄 Starting tariff overlay sync...');

  // ✅ CORRECT ORDER (dependencies enforced):
  await populateSection301(chapter);  // FIRST - baseline 25%
  await populateSection232(chapter);  // SECOND - adds 50% on top
  await populateSection201(chapter);  // THIRD - adds if applicable
  await populateIEEPA(chapter);       // FOURTH - adds if applicable
  await populateBaseRates(chapter);   // FIFTH - fills remaining

  console.log('✅ All overlays synced in correct order');
}
```

---

### Issue 3: Pre-Storage Validation Missing
**Status:** ❌ FAIL (Not implemented)

**Create:** `lib/validation/tariff-cache-validation.js`
```javascript
export function validateBeforeInsert(record) {
  const errors = [];

  // HS code format
  if (!/^\d{6}$|^\d{8}$/.test(record.hs_code)) {
    errors.push(`Invalid HS code format: ${record.hs_code}`);
  }

  // Tariff ranges
  ['section_301', 'section_232'].forEach(field => {
    if (record[field] !== null && record[field] !== undefined) {
      if (record[field] < 0 || record[field] > 1.0) {
        errors.push(`${field} out of range: ${record[field]}`);
      }
      if (record[field] === 0 && !record.verified_source?.includes('duty-free')) {
        errors.push(`${field} = 0 without documentation`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}
```

---

### Issue 4: Post-Storage Health Checks Missing
**Status:** ❌ FAIL (Not implemented)

**Create:** `scripts/health-check-tariff-cache.js`
```javascript
async function dailyHealthCheck() {
  const checks = [
    checkNoZeroWithoutSource(),
    checkChinaHasSection301(),
    checkSteelHasSection232(),
    checkDataFreshness()
  ];

  const results = await Promise.all(checks);
  const failures = results.filter(r => !r.passed);

  if (failures.length > 0) {
    await alertTeam(failures);
    await logToDevIssues('tariff_cache_health', failures);
  }

  return { passed: failures.length === 0, failures };
}
```

---

## P1 IMPORTANT ISSUES (Fix This Week)

### Issue 5: HS Code Normalization Audit Needed
**Status:** ⚠️ PARTIAL (Function exists, usage unknown)
**Instances:** 2,057 found

**Action:** Run full audit
```bash
# Check all instances normalize before query
grep -rn "\.eq('hs_code'\|\.eq('hts8'" --include="*.js" pages/ lib/
# For each: Verify normalization happens BEFORE query
```

---

### Issue 6: Error Messages Not User-Friendly
**Status:** ⚠️ PARTIAL (Mixed quality)

**Create:** `lib/utils/user-error-messages.js`
```javascript
export const USER_ERRORS = {
  HS_CODE_NOT_FOUND: (hsCode) => ({
    title: 'Tariff Rate Not Available',
    message: `No rate found for HS code ${hsCode}`,
    actions: [
      'Verify HS code with customs broker',
      'Try again in 24 hours',
      'Contact support if persists'
    ]
  })
};
```

---

### Issue 7: USMCA Rate Hardcoded Assumption
**Status:** ⚠️ PARTIAL (1 violation found)
**Location:** `pages/api/ai-usmca-complete-analysis.js:1420`

**Fix:**
```javascript
// ❌ BEFORE:
const usmcaRate = isUSMCAOrigin ? 0 : (aiResult.usmca_rate || 0);

// ✅ AFTER:
const usmcaRate = await lookupUSMCARate(hsCode, destinationCountry);
// Some USMCA rates are 2.5%, 5%, etc - not always 0%
```

---

## VALIDATION SQL QUERIES

### Run These Daily:

```sql
-- 1. No zero rates without documentation
SELECT COUNT(*) FROM policy_tariffs_cache
WHERE (section_301 = 0 OR section_232 = 0)
  AND verified_source NOT LIKE '%duty-free%';
-- Expected: 0

-- 2. China has section_301
SELECT COUNT(*) FROM policy_tariffs_cache
WHERE origin_country = 'CN'
  AND section_301 IS NULL;
-- Expected: 0

-- 3. Steel has section_232
SELECT COUNT(*) FROM policy_tariffs_cache
WHERE hs_code LIKE '73%'
  AND section_232 IS NULL;
-- Expected: 0

-- 4. Data freshness
SELECT COUNT(*) FROM policy_tariffs_cache
WHERE verified_date < NOW() - INTERVAL '7 days'
  AND (section_301 > 0 OR section_232 > 0);
-- Expected: <5% of total
```

---

## LINTER RULES TO ADD

### ESLint Configuration:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Flag || 0 in tariff contexts
    'no-restricted-syntax': [
      'error',
      {
        selector: "BinaryExpression[operator='||'][right.value=0]",
        message: 'Avoid defaulting tariff values to 0. Use ?? null instead.'
      }
    ],

    // Flag hardcoded return 0 in tariff functions
    'no-return-zero-tariff': 'error',

    // Require confidence level with all rate returns
    'require-confidence-level': 'warn'
  }
};
```

---

## MONITORING CHECKLIST

**Daily:**
- [ ] RSS feed polling status
- [ ] Tariff cache corruption check (SQL queries above)
- [ ] Error rate for tariff APIs
- [ ] Data freshness verification

**Weekly:**
- [ ] Full HS code normalization spot check (10 random queries)
- [ ] Review dev_issues table for tariff-related errors
- [ ] Verify all populate scripts ran successfully

**Monthly:**
- [ ] Full codebase audit for new `|| 0` violations
- [ ] Review and update validation rules
- [ ] Update confidence level explanations if needed

---

## NEXT AUDIT DATE

**Recommended:** After P0 fixes implemented (within 1 week)
**Next Full Audit:** December 1, 2025

---

**Last Updated:** November 20, 2025
