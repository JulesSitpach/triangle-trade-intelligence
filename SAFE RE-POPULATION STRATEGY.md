# SAFE RE-POPULATION STRATEGY - Chapter 73 Steel/Iron

**Goal:** Fix corrupted tariff cache WITHOUT causing new problems  
**Risk Level:** LOW (validation at each step)  
**Timeline:** 2-3 minutes for Chapter 73

---

## PHASE 1: PRE-FLIGHT CHECK (1 minute)

### Current State - How Bad Is It?

```bash
# Run this FIRST to see the damage
psql your_database << 'SQL'
SELECT 
  COUNT(*) as total_ch73,
  SUM(CASE WHEN section_301 = 0 THEN 1 ELSE 0 END) as corrupted_301,
  SUM(CASE WHEN section_232 = 0 THEN 1 ELSE 0 END) as corrupted_232
FROM policy_tariffs_cache
WHERE chapter_id = 73 AND origin_country = 'CN';
SQL
```

**Expected result:**
```
total_ch73 | corrupted_301 | corrupted_232
-----------|---------------|---------------
   312     |      233      |       0
```

**Document this output.** You'll compare after repopulation.

---

## PHASE 2: REPOPULATE CHAPTER 73 (2 minutes)

### Step 1: Section 301 First (Baseline Tariffs)

```bash
# This establishes the baseline 25% China tariff rates
node scripts/populate-section-301-overlay.js --chapter=73

# Output should show:
# ✅ Researched X codes
# ✅ Upserted X records
# ✅ section_301 populated for Chapter 73
```

**Verify immediately:**
```bash
psql your_database << 'SQL'
SELECT COUNT(*) as section_301_populated
FROM policy_tariffs_cache
WHERE chapter_id = 73 AND section_301 IS NOT NULL AND section_301 > 0;
SQL
```

**Expected:** 312 records (all Chapter 73 codes now have section_301)

---

### Step 2: Section 232 Second (Overlay on Top)

```bash
# This adds 50% steel tariffs WITHOUT overwriting section_301
node scripts/populate-section-232-overlay.js --chapter=73

# Output should show:
# ✅ Updated X records with section_232
# ✅ Preserved existing section_301 values
```

**Verify immediately:**
```bash
psql your_database << 'SQL'
SELECT COUNT(*) as both_populated
FROM policy_tariffs_cache
WHERE chapter_id = 73 
  AND section_301 IS NOT NULL 
  AND section_232 IS NOT NULL;
SQL
```

**Expected:** 312 records (both fields populated, none at 0)

---

## PHASE 3: VALIDATION CHECKPOINT (1 minute)

### Post-Population State - Did It Work?

```bash
psql your_database << 'SQL'
SELECT 
  COUNT(*) as total_ch73,
  SUM(CASE WHEN section_301 = 0 THEN 1 ELSE 0 END) as still_corrupted_301,
  SUM(CASE WHEN section_232 = 0 THEN 1 ELSE 0 END) as still_corrupted_232,
  SUM(CASE WHEN section_301 IS NOT NULL THEN 1 ELSE 0 END) as fixed_301
FROM policy_tariffs_cache
WHERE chapter_id = 73 AND origin_country = 'CN';
SQL
```

**Expected AFTER fix:**
```
total_ch73 | still_corrupted_301 | still_corrupted_232 | fixed_301
-----------|---------------------|--------------------|----------
   312     |         0           |         0           |    312
```

### Compare Before & After

| Metric | Before Fix | After Fix | Status |
|--------|-----------|-----------|--------|
| Total CH73 codes | 312 | 312 | ✅ Same |
| section_301 = 0 | 233 | 0 | ✅ Fixed |
| section_301 populated | 79 | 312 | ✅ Fixed |
| section_232 populated | 312 | 312 | ✅ Same |

---

## PHASE 4: SPOT CHECK (30 seconds)

### Verify Specific Codes

```bash
psql your_database << 'SQL'
-- Check the exact codes from your demo
SELECT hs_code, section_301, section_232, section_201, verified_date
FROM policy_tariffs_cache
WHERE hs_code IN ('73182900', '73269085', '7326907000')
AND origin_country = 'CN';
SQL
```

**Expected:**
```
hs_code    | section_301 | section_232 | verified_date
-----------|-------------|-------------|---------------
73182900   |    0.25     |    0.50     | 2025-11-20
73269085   |    0.25     |    0.50     | 2025-11-20
7326907000 |    0.25     |    0.50     | 2025-11-20
```

---

## PHASE 5: DECISION POINT

### If Chapter 73 Validation Passes ✅

```
All checks passed? → Proceed to remaining 12 chapters
Corrupted records fixed? → Ready for bulk repopulation
```

**Then run the full repopulation:**
```bash
# Run this script (agent will create it)
node scripts/repopulate-all-chapters.js
```

### If Anything Fails ❌

**STOP.** Don't proceed to other chapters.
- Check error logs
- Verify script fixes were applied correctly
- Contact agent for debugging

---

## IMPORTANT SAFETY RULES

1. **Never skip Section 301** - It must run FIRST
2. **Don't run scripts independently** - Use orchestration script
3. **Always validate after each chapter** - Catch errors early
4. **Document baseline before repopulating** - You need before/after metrics
5. **Chapter 73 is your test case** - If it works here, it works everywhere

---

## ROLLBACK PLAN (If Something Goes Wrong)

```bash
# If you need to undo Chapter 73 repopulation:
psql your_database << 'SQL'
-- Backup first
CREATE TABLE policy_tariffs_cache_backup AS 
SELECT * FROM policy_tariffs_cache 
WHERE chapter_id = 73;

-- Then if needed, restore:
DELETE FROM policy_tariffs_cache WHERE chapter_id = 73;
INSERT INTO policy_tariffs_cache 
SELECT * FROM policy_tariffs_cache_backup;
SQL
```

---

## EXECUTION COMMAND SUMMARY

```bash
# Run these in order:

# 1. Check current state
psql your_database << 'SQL'
SELECT COUNT(*), SUM(CASE WHEN section_301 = 0 THEN 1 ELSE 0 END) 
FROM policy_tariffs_cache 
WHERE chapter_id = 73 AND origin_country = 'CN';
SQL

# 2. Repopulate Section 301 (baseline)
node scripts/populate-section-301-overlay.js --chapter=73

# 3. Repopulate Section 232 (overlay)
node scripts/populate-section-232-overlay.js --chapter=73

# 4. Validate fix
psql your_database << 'SQL'
SELECT COUNT(*), SUM(CASE WHEN section_301 = 0 THEN 1 ELSE 0 END) 
FROM policy_tariffs_cache 
WHERE chapter_id = 73 AND origin_country = 'CN';
SQL

# 5. If validation passes, spot check critical codes
psql your_database << 'SQL'
SELECT hs_code, section_301, section_232 
FROM policy_tariffs_cache 
WHERE hs_code IN ('73182900', '73269085', '7326907000');
SQL
```

---

## NEXT STEPS

✅ **Phase 1:** Document baseline (1 min)  
✅ **Phase 2:** Repopulate Chapter 73 (2 min)  
✅ **Phase 3:** Validate fixes (1 min)  
✅ **Phase 4:** Spot check (30 sec)  
👉 **Phase 5:** Decide on remaining 12 chapters  

**Total time: ~5 minutes for Chapter 73**

Once validated, remaining 12 chapters should take ~15 minutes total.