# WEEK 1 P0 ACTION PLAN - CRITICAL FIXES
**Start Date:** [To be determined by owner]
**Estimated Time:** 15 hours
**Priority:** 🔴 CRITICAL

---

## DAY 1-2: PRE-STORAGE VALIDATION (6 hours)

### Task 1.1: Create Validation Function (2 hours)

**Create:** `lib/validation/tariff-cache-validation.js`

```javascript
/**
 * TARIFF CACHE VALIDATION
 * Prevents corrupt data from being inserted into policy_tariffs_cache
 */

export function validateBeforeInsert(record) {
  const errors = [];

  // 1. HS CODE FORMAT
  if (!record.hs_code) {
    errors.push('HS code is required');
  } else if (!/^\d{6}$|^\d{8}$/.test(record.hs_code)) {
    errors.push(`Invalid HS code format: ${record.hs_code} (must be 6 or 8 digits)`);
  }

  // 2. TARIFF RANGE VALIDATION
  const tariffFields = ['section_301', 'section_232', 'section_201', 'ieepa_rate'];

  tariffFields.forEach(field => {
    const value = record[field];

    // Skip if null/undefined (acceptable - means "needs research")
    if (value === null || value === undefined) {
      return;
    }

    // Check range (0.0 to 1.0)
    if (typeof value !== 'number') {
      errors.push(`${field} must be a number, got: ${typeof value}`);
    } else if (value < 0 || value > 1.0) {
      errors.push(`${field} out of range (0-1.0): ${value}`);
    }

    // If 0%, require documentation
    if (value === 0 && !record.verified_source?.toLowerCase().includes('duty-free')) {
      errors.push(`${field} = 0 requires 'duty-free' in verified_source`);
    }
  });

  // 3. REQUIRED FIELDS
  if (!record.verified_source) {
    errors.push('verified_source is required');
  }
  if (!record.verified_date) {
    errors.push('verified_date is required');
  }

  // 4. ORIGIN COUNTRY (if applicable)
  if (record.origin_country && !/^[A-Z]{2}$/.test(record.origin_country)) {
    errors.push(`Invalid origin_country format: ${record.origin_country} (must be 2-letter code)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    record
  };
}

/**
 * Validate multiple records at once
 */
export function validateBatch(records) {
  const results = records.map((record, index) => ({
    index,
    ...validateBeforeInsert(record)
  }));

  const failures = results.filter(r => !r.valid);

  return {
    allValid: failures.length === 0,
    failures,
    validCount: results.length - failures.length,
    totalCount: results.length
  };
}
```

**Test with:**
```javascript
// test-validation.js
import { validateBeforeInsert } from './lib/validation/tariff-cache-validation.js';

const testCases = [
  // ✅ Valid
  {
    hs_code: '73269070',
    section_301: 0.25,
    verified_source: 'USTR List 3',
    verified_date: new Date().toISOString()
  },

  // ❌ Invalid - HS code format
  {
    hs_code: '73.26.90.70',  // Has periods
    section_301: 0.25
  },

  // ❌ Invalid - Rate out of range
  {
    hs_code: '73269070',
    section_301: 25  // Should be 0.25, not 25
  },

  // ❌ Invalid - Zero without documentation
  {
    hs_code: '73269070',
    section_301: 0,  // No 'duty-free' in source
    verified_source: 'USTR'
  }
];

testCases.forEach((test, i) => {
  const result = validateBeforeInsert(test);
  console.log(`Test ${i + 1}:`, result.valid ? '✅' : '❌', result.errors);
});
```

---

### Task 1.2: Add Validation to Populate Scripts (4 hours)

**Update ALL 7 scripts:**
1. `scripts/populate-section-301-overlay.js`
2. `scripts/populate-section-232-overlay.js`
3. `scripts/populate-section-201-overlay.js` (if exists)
4. `scripts/populate-ieepa-overlay.js` (if exists)
5. `scripts/populate-base-rates.js` (if exists)
6. `scripts/populate-complete-test-data.js`
7. `scripts/populate-realistic-tariff-data.js`

**Pattern to add:**
```javascript
// At top of file:
import { validateBeforeInsert } from '../lib/validation/tariff-cache-validation.js';

// Before .insert() or .upsert():
const recordsToInsert = results.map(r => ({
  hs_code: r.hs_code,
  section_301: r.section_301,
  verified_source: r.data_source,
  verified_date: r.verified_date,
  // ... other fields
}));

// ✅ VALIDATE BEFORE INSERT:
const validation = validateBatch(recordsToInsert);

if (!validation.allValid) {
  console.error(`❌ Validation failed for ${validation.failures.length} records:`);
  validation.failures.forEach(f => {
    console.error(`  Record ${f.index}:`, f.errors.join(', '));
  });
  throw new Error('Aborting insert - validation failures detected');
}

console.log(`✅ Validation passed for ${validation.validCount}/${validation.totalCount} records`);

// Now safe to insert:
const { data, error } = await supabase
  .from('policy_tariffs_cache')
  .upsert(recordsToInsert);
```

**Test Each Script:**
```bash
# Dry run with validation (don't actually insert)
node scripts/populate-section-301-overlay.js --chapter=73 --dry-run

# If validation passes, run for real
node scripts/populate-section-301-overlay.js --chapter=73

# Verify no errors
# ✅ Expected: "Validation passed for 312/312 records"
```

---

## DAY 3: MASTER ORCHESTRATION SCRIPT (2 hours)

### Task 2.1: Create Master Script

**Create:** `scripts/sync-all-tariff-overlays.js`

```javascript
/**
 * MASTER TARIFF OVERLAY SYNC
 * Enforces correct execution order for all populate scripts
 *
 * CRITICAL: Scripts MUST run in this order due to dependencies:
 * 1. Section 301 (creates baseline 25% for China)
 * 2. Section 232 (adds 50% on top, preserves Section 301)
 * 3. Section 201 (adds if applicable, preserves 301+232)
 * 4. IEEPA (adds if applicable, preserves previous)
 * 5. Base MFN rates (fills remaining gaps)
 */

import { execSync } from 'child_process';

async function syncAllTariffOverlays(chapter = null) {
  const startTime = Date.now();

  console.log('🔄 Starting tariff overlay sync...');
  console.log(`Chapter: ${chapter || 'ALL'}`);
  console.log('=' .repeat(60));

  const chapterArg = chapter ? `--chapter=${chapter}` : '';

  try {
    // Step 1: Section 301 (FIRST - baseline)
    console.log('\n1️⃣ Populating Section 301 (China 25% baseline)...');
    execSync(`node scripts/populate-section-301-overlay.js ${chapterArg}`, { stdio: 'inherit' });
    console.log('✅ Section 301 complete');

    // Step 2: Section 232 (SECOND - adds on top)
    console.log('\n2️⃣ Populating Section 232 (Steel/Aluminum 50%)...');
    execSync(`node scripts/populate-section-232-overlay.js ${chapterArg}`, { stdio: 'inherit' });
    console.log('✅ Section 232 complete');

    // Step 3: Section 201 (THIRD - if applicable)
    console.log('\n3️⃣ Populating Section 201 (if applicable)...');
    try {
      execSync(`node scripts/populate-section-201-overlay.js ${chapterArg}`, { stdio: 'inherit' });
      console.log('✅ Section 201 complete');
    } catch (err) {
      console.log('⚠️ Section 201 script not found or failed - skipping');
    }

    // Step 4: IEEPA (FOURTH - if applicable)
    console.log('\n4️⃣ Populating IEEPA (if applicable)...');
    try {
      execSync(`node scripts/populate-ieepa-overlay.js ${chapterArg}`, { stdio: 'inherit' });
      console.log('✅ IEEPA complete');
    } catch (err) {
      console.log('⚠️ IEEPA script not found or failed - skipping');
    }

    // Step 5: Base MFN Rates (FIFTH - fills gaps)
    console.log('\n5️⃣ Populating base MFN rates (fills remaining)...');
    try {
      execSync(`node scripts/populate-base-rates.js ${chapterArg}`, { stdio: 'inherit' });
      console.log('✅ Base rates complete');
    } catch (err) {
      console.log('⚠️ Base rates script not found or failed - skipping');
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ ALL OVERLAYS SYNCED SUCCESSFULLY`);
    console.log(`Total time: ${Math.round((Date.now() - startTime) / 1000)}s`);

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error.message);
    console.error('Aborting remaining steps to prevent data corruption');
    process.exit(1);
  }
}

// CLI execution
const chapterArg = process.argv.find(arg => arg.startsWith('--chapter='));
const chapter = chapterArg ? chapterArg.split('=')[1] : null;

syncAllTariffOverlays(chapter);
```

**Test:**
```bash
# Test with Chapter 73 only (small, fast)
node scripts/sync-all-tariff-overlays.js --chapter=73

# ✅ Expected output:
# 1️⃣ Section 301... ✅
# 2️⃣ Section 232... ✅
# 3️⃣ Section 201... ⚠️ (if not exists)
# 4️⃣ IEEPA... ⚠️ (if not exists)
# 5️⃣ Base rates... ✅
# ✅ ALL OVERLAYS SYNCED SUCCESSFULLY
```

---

### Task 2.2: Update Cron Jobs

**Before:**
```yaml
# .github/workflows/populate-tariffs.yml
# ❌ WRONG ORDER - scripts run independently
- cron: '0 2 * * *'
  run: node scripts/populate-section-232-overlay.js

- cron: '0 3 * * *'
  run: node scripts/populate-section-301-overlay.js  # Too late!
```

**After:**
```yaml
# .github/workflows/populate-tariffs.yml
# ✅ CORRECT - master script enforces order
- cron: '0 2 * * *'
  run: node scripts/sync-all-tariff-overlays.js  # Runs all in order
```

**Also update Vercel cron (if applicable):**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/sync-tariff-overlays",
    "schedule": "0 2 * * *"
  }]
}
```

---

## DAY 4: DAILY HEALTH CHECKS (3 hours)

### Task 3.1: Create Health Check Script

**Create:** `scripts/health-check-tariff-cache.js`

```javascript
/**
 * DAILY TARIFF CACHE HEALTH CHECK
 * Detects data corruption after population
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNoZeroWithoutSource() {
  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code, section_301, section_232, verified_source')
    .or('section_301.eq.0,section_232.eq.0');

  if (error) throw error;

  const violations = data.filter(row =>
    !row.verified_source?.toLowerCase().includes('duty-free')
  );

  return {
    name: 'No Zero Rates Without Documentation',
    passed: violations.length === 0,
    violations: violations.length,
    details: violations.slice(0, 5).map(v =>
      `HS ${v.hs_code}: ${v.section_301 === 0 ? 'Section 301' : 'Section 232'} = 0 without duty-free source`
    )
  };
}

async function checkChinaHasSection301() {
  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code')
    .eq('origin_country', 'CN')
    .is('section_301', null);

  if (error) throw error;

  return {
    name: 'All China Codes Have Section 301',
    passed: data.length === 0,
    violations: data.length,
    details: data.slice(0, 5).map(v => `HS ${v.hs_code}: Missing Section 301`)
  };
}

async function checkSteelHasSection232() {
  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code')
    .like('hs_code', '73%')
    .is('section_232', null);

  if (error) throw error;

  return {
    name: 'All Steel Codes Have Section 232',
    passed: data.length === 0,
    violations: data.length,
    details: data.slice(0, 5).map(v => `HS ${v.hs_code}: Missing Section 232`)
  };
}

async function checkDataFreshness() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .lt('verified_date', sevenDaysAgo.toISOString())
    .or('section_301.gt.0,section_232.gt.0');

  if (error) throw error;

  const { count: total } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true });

  const stalePercent = total > 0 ? (count / total) * 100 : 0;

  return {
    name: 'Data Freshness (<7 days for volatile tariffs)',
    passed: stalePercent < 5,
    violations: count,
    details: [`${count}/${total} volatile tariff codes are >7 days old (${stalePercent.toFixed(1)}%)`]
  };
}

async function runHealthCheck() {
  console.log('🏥 Running Tariff Cache Health Check...\n');

  const checks = [
    await checkNoZeroWithoutSource(),
    await checkChinaHasSection301(),
    await checkSteelHasSection232(),
    await checkDataFreshness()
  ];

  console.log('Results:');
  console.log('='.repeat(60));

  const failures = [];

  checks.forEach((check, i) => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${check.name}`);

    if (!check.passed) {
      console.log(`   Violations: ${check.violations}`);
      check.details.forEach(d => console.log(`   - ${d}`));
      failures.push(check);
    }
  });

  console.log('='.repeat(60));

  if (failures.length === 0) {
    console.log('✅ All health checks passed!');
  } else {
    console.error(`❌ ${failures.length}/${checks.length} checks failed`);

    // Log to dev_issues table
    await supabase.from('dev_issues').insert({
      issue_type: 'tariff_cache_health',
      severity: 'high',
      details: { failures },
      created_at: new Date().toISOString()
    });

    process.exit(1);
  }
}

runHealthCheck();
```

**Test:**
```bash
node scripts/health-check-tariff-cache.js

# ✅ Expected (if data is good):
# 1. ✅ No Zero Rates Without Documentation
# 2. ✅ All China Codes Have Section 301
# 3. ✅ All Steel Codes Have Section 232
# 4. ✅ Data Freshness (<7 days for volatile tariffs)
# ✅ All health checks passed!
```

---

### Task 3.2: Add to Daily Cron

**GitHub Actions:**
```yaml
# .github/workflows/daily-health-check.yml
name: Daily Tariff Cache Health Check

on:
  schedule:
    - cron: '0 8 * * *'  # 8 AM UTC daily

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node scripts/health-check-tariff-cache.js
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## DAY 5: FIX 26 `|| 0` VIOLATIONS (4 hours)

### Task 4.1: Fix Main API (2 hours)

**File:** `pages/api/ai-usmca-complete-analysis.js`

**Location 1 (Lines 745-749):**
```javascript
// ❌ BEFORE:
mfn_rate: component.mfn_rate || 0,
base_mfn_rate: component.base_mfn_rate || component.mfn_rate || 0,
section_301: component.section_301 || 0,
section_232: component.section_232 || 0,
usmca_rate: component.usmca_rate || 0,

// ✅ AFTER:
mfn_rate: component.mfn_rate ?? null,
base_mfn_rate: component.base_mfn_rate ?? component.mfn_rate ?? null,
section_301: component.section_301 ?? null,
section_232: component.section_232 ?? null,
usmca_rate: component.usmca_rate ?? null,
```

**Location 2 (Lines 941-945):**
```javascript
// ❌ BEFORE:
mfn_rate: parseFloat(cachedRate.mfn_rate) || 0,
base_mfn_rate: parseFloat(cachedRate.mfn_rate) || 0,
section_301: parseFloat(cachedRate.section_301) || 0,
section_232: parseFloat(cachedRate.section_232) || 0,
usmca_rate: parseFloat(cachedRate.usmca_rate) || 0,

// ✅ AFTER:
mfn_rate: parseFloat(cachedRate.mfn_rate) || null,
base_mfn_rate: parseFloat(cachedRate.mfn_rate) || null,
section_301: parseFloat(cachedRate.section_301) || null,
section_232: parseFloat(cachedRate.section_232) || null,
usmca_rate: parseFloat(cachedRate.usmca_rate) || null,
```

**Location 3 (Line 977):**
```javascript
// ❌ BEFORE:
let policyRates = {
  section_301: rateData?.section_301 || 0,
  section_232: rateData?.section_232 || 0
};

// ✅ AFTER:
let policyRates = {
  section_301: rateData?.section_301 ?? null,
  section_232: rateData?.section_232 ?? null
};
```

**Location 4 (Lines 1034-1035):**
```javascript
// ❌ BEFORE:
policyRates.section_301 = policyCache.section_301 || 0;
policyRates.section_232 = policyCache.section_232 || 0;

// ✅ AFTER:
policyRates.section_301 = policyCache.section_301 ?? null;
policyRates.section_232 = policyCache.section_232 ?? null;
```

---

### Task 4.2: Fix Crisis Calculator (1 hour)

**File:** `lib/services/crisis-calculator-service.js`

**Location (Line 229):**
```javascript
// ❌ BEFORE (EXTREMELY DANGEROUS):
return 0; // Default to duty-free on error

// ✅ AFTER:
throw new Error(`Unable to determine Section 301 rate for ${hsCode} - manual verification required`);
// OR if you must return a value:
console.error(`Missing Section 301 rate for ${hsCode}`);
return null;  // null = needs research, not 0%
```

---

### Task 4.3: Test All Changes (1 hour)

```bash
# Test with real workflow
curl -X POST http://localhost:3001/api/ai-usmca-complete-analysis \
  -H "Content-Type: application/json" \
  -d @test-data/steel-component-workflow.json

# Verify response:
# - No rates should be 0 unless documented as duty-free
# - Null rates should trigger warnings in console
# - User shown "needs research" message, not 0%
```

---

## COMPLETION CHECKLIST

### End of Week 1:
- [ ] `lib/validation/tariff-cache-validation.js` created and tested
- [ ] All 7 populate scripts use validation before insert
- [ ] `scripts/sync-all-tariff-overlays.js` created and tested
- [ ] Cron jobs updated to call master script only
- [ ] `scripts/health-check-tariff-cache.js` created and tested
- [ ] Daily health check cron job configured
- [ ] All 26 `|| 0` violations fixed in tariff contexts
- [ ] Main API tested with real workflow data
- [ ] No new violations introduced (grep search clean)

### Success Criteria:
- [ ] Health check runs without failures
- [ ] Chapter 73 repopulation completes with 0 validation errors
- [ ] All tests pass
- [ ] No regression in existing functionality

---

## IF SOMETHING GOES WRONG

### Rollback Plan:
1. Restore database from backup (taken before Week 1 starts)
2. Revert code changes: `git revert <commit-hash>`
3. Document what failed and why
4. Adjust plan before retrying

### Getting Help:
- Review detailed findings: `AUDIT_PARTS_6_7_8_FINDINGS.md`
- Check audit matrix: `CODEBASE_AUDIT_MATRIX.md`
- Read executive summary: `AUDIT_PARTS_6_7_8_EXECUTIVE_SUMMARY.md`

---

**Start Week 1 when ready. Good luck! 🚀**
