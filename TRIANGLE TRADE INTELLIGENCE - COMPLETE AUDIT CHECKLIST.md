# TRIANGLE TRADE INTELLIGENCE - COMPLETE AUDIT CHECKLIST

**What to look for to get everything correct**

---

## PART 0: CRITICAL BUGS ALREADY FOUND (Verify All Fixed)

### 0.1 LINE 245 BUG - Section 232 Script Defaulting

**Issue Found:** `populate-section-232-overlay.js` line 245
```javascript
// ❌ WRONG (found Nov 20)
const existingSection301 = existing.section_301 !== undefined ? existing.section_301 : 0;

// ✅ FIXED
const existingSection301 = existing.section_301 !== undefined ? existing.section_301 : null;
```

**What to audit:**
- [ ] Line 245 fixed in populate-section-232-overlay.js
- [ ] Reverse bug fixed in populate-section-301-overlay.js (line 189)
- [ ] All other populate scripts checked for same pattern
- [ ] No `|| 0` defaults in ANY populate script
- [ ] All default to `null` instead of `0`

**Why it matters:** Created 233 corrupted Chapter 73 codes with section_301 = 0 instead of researched rate

---

### 0.2 HS CODE NORMALIZATION MISMATCH

**Issue Found:** Database queries failing due to code format mismatch
```
Database has: 732690 (6-digit parent code)
Query tries: 73269070 (8-digit normalized)
Result: No match → Default to 0% (WRONG)
```

**What to audit:**
- [ ] All HS codes normalized to 8-digit BEFORE querying
- [ ] Normalization function exists and is used everywhere
- [ ] No queries with mixed formats (6-digit + 8-digit)
- [ ] Prefix matching implemented as fallback
- [ ] Query logic: 8-digit → 6-digit → 4-digit → prefix → null

**Why it matters:** Caused the $41,667 error (2x the actual cost). Queries couldn't find rates so defaulted to 0%

---

### 0.3 HARDCODED 0% RETURNS

**Issue Found:** Multiple locations returning 0% without database lookup
```javascript
// ❌ EXAMPLES FOUND:
if (!isUSMCAOrigin) { return 0; }  // Assumes USMCA = 0%
return 0;  // After failed lookup
= 0;  // Default assignment
|| 0  // Default operator
```

**What to audit:**
- [ ] Search codebase: `grep -r "return 0;" --include="*.js"`
- [ ] Search codebase: `grep -r "|| 0" --include="*.js"`
- [ ] Search codebase: `grep -r ": 0" --include="*.js" | grep -i tariff`
- [ ] For EACH result: Is 0% intentional or a bug?
- [ ] Tariff-related 0%: Verify source/reason documented
- [ ] Failed lookups: Return null with error, not 0%

**Why it matters:** Hidden throughout codebase, causing wrong tariff calculations

---

### 0.4 TARIFF CACHE CORRUPTION (998 Records)

**Issue Found:** November 2025 population corrupted Section 301 rates
```
Before: section_301 populated for 79 Chapter 73 codes
After: section_232 script set section_301 = 0 for 233 NEW codes
Result: 233 codes with wrong rate (0 instead of 0.25)
```

**What to audit:**
- [ ] Chapter 73 baseline measurement taken (before repopulation)
- [ ] Section 301 script run: `populate-section-301-overlay.js --chapter=73`
- [ ] Validation: All 312 Chapter 73 codes now have section_301 ≠ 0
- [ ] Section 232 script run: `populate-section-232-overlay.js --chapter=73`
- [ ] Post-validation: No codes lost, all tariffs preserved
- [ ] Remaining 12 chapters repopulated same way
- [ ] Database backup taken before repopulation
- [ ] Metrics: Before/after comparison documented

**Why it matters:** Entire system was giving wrong tariff rates for steel products

---

### 0.5 MISSING TARIFF CACHE QUERIES

**Issue Found:** API not querying policy_tariffs_cache at all
```
pages/api/ai-usmca-complete-analysis.js:
- Line 897: Found 6-digit parent code (732690) via prefix fallback
- Line 982: Tried to query with different code (73269070)
- Result: Query failed, returned 0% instead
```

**What to audit:**
- [ ] All tariff queries explicitly reference policy_tariffs_cache
- [ ] No hardcoded rate mappings (old tariff_intelligence_master)
- [ ] All API endpoints that show tariff rates query database
- [ ] All calculations source rates from database
- [ ] Grep for any reference to old hardcoded tables
- [ ] Verify enrichment code uses policy_tariffs_cache not cached objects

**Why it matters:** System was showing rates that didn't match the actual database

---

### 0.6 USMCA RATE ASSUMPTIONS

**Issue Found:** Code assumes USMCA always = 0%
```javascript
// ❌ WRONG
if (isUSMCAQualified) { return 0; }

// ✅ RIGHT
if (isUSMCAQualified && isUSMCAOrigin) {
  return rates.usmca_rate;  // Query database, not 0%
}
```

**What to audit:**
- [ ] All USMCA rate logic queries database
- [ ] USMCA rates are NOT hardcoded to 0%
- [ ] Some products have 2.5%, 5%, etc USMCA rates
- [ ] Calculation distinguishes: qualified vs origin vs rate
- [ ] USMCA column exists in policy_tariffs_cache
- [ ] Each HS code has actual USMCA rate, not assumed

**Why it matters:** Showing customers fake USMCA savings when rate isn't actually 0%

---

## PART 1: DATA INTEGRITY (The Foundation)

### 1.1 HS CODE FORMAT CONSISTENCY

**What to check:**
```
Policy_tariffs_cache table:
├─ Are ALL hs_code values 8-digit format? (XXXXXXXX)
├─ Are there any 6-digit codes? (XXXXXX) 
├─ Are there any 10-digit codes? (XXXXXXXXXX)
├─ Are there any with periods? (XX.XX.XX.XX)
└─ Are there any mixed formats in same table?

Expected: 
  ALL codes should be 8-digit (73269070, not 732690, not 73.26.90.70)
  EXCEPT: Keep 6-digit parent codes for category-level tariffs
          (These are legitimate, different tariff levels)
```

**How to audit:**
```sql
SELECT DISTINCT LENGTH(hs_code), COUNT(*)
FROM policy_tariffs_cache
GROUP BY LENGTH(hs_code)
ORDER BY LENGTH(hs_code);

-- Should show:
-- 8 digits: 10,000+ codes
-- 6 digits: 500-1,000 codes (legitimate category rates)
-- Anything else: INVESTIGATE
```

### 1.2 TARIFF RATE DATA TYPES

**What to check:**
```
For EVERY tariff column (section_301, section_232, section_201, ieepa_rate):

1. Data Type:
   ├─ Must be: DECIMAL(5,4) or NUMERIC(5,4)
   ├─ NOT: INTEGER
   ├─ NOT: FLOAT
   └─ NOT: VARCHAR

2. Values:
   ├─ Stored as: 0.25 (means 25%)
   ├─ NOT: 25 (would mean 2500%)
   ├─ NOT: 0 (unless explicitly duty-free with source)
   └─ Can be: NULL (means "not researched" or "not applicable")

3. Range:
   ├─ Should be: 0.00 to 1.00 (0% to 100%)
   ├─ Anything > 1.0: INVESTIGATE (maybe stored as integer?)
   └─ Anything < 0: DEFINITELY WRONG
```

**How to audit:**
```sql
-- Check data types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'policy_tariffs_cache'
AND column_name IN ('section_301', 'section_232', 'section_201', 'ieepa_rate');

-- Check value ranges
SELECT 
  section_301, COUNT(*) as count,
  MIN(section_301) as min_val,
  MAX(section_301) as max_val
FROM policy_tariffs_cache
WHERE section_301 IS NOT NULL
GROUP BY section_301
ORDER BY section_301;

-- Should show values like: 0.0, 0.075, 0.25, 0.50, etc
-- NOT: 0, 7.5, 25, 50
```

### 1.4 DATABASE CONSTRAINTS & INDEXES

**What to check:**
```
Policy_tariffs_cache constraints:
  ├─ PRIMARY KEY: (hs_code, origin_country, tariff_type)
  │  └─ Prevents duplicates with conflicting rates
  ├─ UNIQUE INDEX: hs_code + origin_country
  │  └─ Ensures only one rate per code per origin
  ├─ CHECK: section_301 >= 0 AND section_301 <= 1.0 (if not null)
  │  └─ Prevents negative or >100% rates
  ├─ CHECK: All tariff fields DECIMAL(5,4)
  │  └─ Enforces correct data type at DB level
  └─ NOT NULL: hs_code, origin_country, verified_source, verified_date
     └─ Prevents incomplete records

Foreign keys:
  ├─ If separate hs_codes table: policy_tariffs_cache.hs_code → hs_codes.code
  └─ Ensures HS codes are valid
```

**How to audit:**
```sql
-- Check constraints exist
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'policy_tariffs_cache';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'policy_tariffs_cache';

-- Verify CHECK constraints
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE table_name = 'policy_tariffs_cache';

-- Should have:
-- PRIMARY KEY or UNIQUE on (hs_code, origin_country)
-- CHECK constraints on tariff ranges
-- NOT NULL on critical fields
```

**Why it matters:** Database constraints catch bad data BEFORE it's stored

---

### 1.5 DATA MIGRATION & BACKUP

**What to check:**
```
Before any repopulation:
  ├─ [ ] Full database backup taken
  ├─ [ ] Baseline metrics recorded
  │  ├─ Total codes by length
  │  ├─ Count of each tariff type
  │  ├─ Count of null vs populated rates
  │  └─ Data quality issues identified
  └─ [ ] Rollback plan documented

After repopulation:
  ├─ [ ] Metrics compared to baseline
  ├─ [ ] Data corruption detected and fixed
  ├─ [ ] Validation queries passed
  └─ [ ] Results documented
```

**Example metrics to track:**
```sql
-- Before/After comparison
SELECT 'BEFORE' as phase, COUNT(*) as total, 
  SUM(CASE WHEN section_301 IS NOT NULL THEN 1 ELSE 0 END) as section_301_populated
FROM backup_policy_tariffs_cache;

SELECT 'AFTER' as phase, COUNT(*) as total,
  SUM(CASE WHEN section_301 IS NOT NULL THEN 1 ELSE 0 END) as section_301_populated
FROM policy_tariffs_cache;
```

**Why it matters:** Know exactly what changed and can rollback if needed

---

---

## PART 2: QUERY LOGIC (The Accuracy)

### 2.1 TARIFF LOOKUP FALLBACK HIERARCHY

**What to check:**
```
When code queries tariff rates, it should:

Level 1: Try EXACT 8-digit match
  └─ Query: WHERE hs_code = '73269070' AND origin_country = 'CN'
  └─ If FOUND: Use this rate (confidence: 100)

Level 2: Try 6-digit PARENT (category-level)
  └─ Query: WHERE hs_code = '732690' AND origin_country = 'CN'
  └─ If FOUND: Use this rate (confidence: 85, note why)

Level 3: Try 4-digit HEADING (rare fallback)
  └─ Query: WHERE hs_code = '7326XX' AND origin_country = 'CN'
  └─ If FOUND: Use this rate (confidence: 70, note why)

Level 4: Try PREFIX MATCH (last resort)
  └─ Query: WHERE hs_code LIKE '732%' AND origin_country = 'CN'
  └─ If FOUND: Use best match (confidence: 50, note why)

Level 5: NOT FOUND
  └─ Return: { rate: null, confidence: 0, message: "Needs research" }
  └─ NEVER return 0% by default
```

**How to audit:**
```javascript
// Search for all tariff lookup queries
grep -r "policy_tariffs_cache" --include="*.js" .
grep -r "WHERE.*hs_code" --include="*.js" .

// For each query, verify:
// 1. Does it try 8-digit first?
// 2. Does it fall back to 6-digit?
// 3. Does it handle "not found" correctly?
// 4. Does it return confidence level?
```

### 2.2 USMCA RATE LOOKUP

**What to check:**
```
When determining USMCA rates:

WRONG:
  └─ if (isUSMCAQualified) return 0;  ❌ Assumes all USMCA = 0%

RIGHT:
  ├─ if (isUSMCAQualified && isUSMCAOrigin):
  │  └─ return rates.usmca_rate from database  ✅
  ├─ Else:
  │  └─ return rates.base_mfn_rate from database  ✅
  └─ If no rate found:
     └─ return null (needs research)  ✅
```

**How to audit:**
```bash
grep -r "isUSMCAQualified" --include="*.js" .
grep -r "USMCA" --include="*.js" .

# For each result: Check if it queries database or hardcodes rate
```

### 2.3 SECTION 301 / 232 / 201 TARIFF APPLICATION

**What to check:**
```
When applying tariffs, the calculation should:

1. GET BASE RATE (from policy_tariffs_cache)
   ├─ MFN rate or USMCA rate
   └─ From database, not hardcoded

2. ADD SECTION 301 (if applicable)
   ├─ China → 25% (or from database)
   ├─ Look up: WHERE hs_code = '8-digit' AND origin = 'CN'
   └─ If not found: Try 6-digit parent

3. ADD SECTION 232 (if applicable)
   ├─ Steel/aluminum → 50% (as of June 2025)
   ├─ Look up: WHERE hs_code = '8-digit' AND origin = 'CN'
   └─ If not found: Try 6-digit parent

4. ADD SECTION 201, IEEPA, etc
   └─ Same pattern: Query database, don't hardcode

5. STACK THEM (NO REPLACEMENT, only addition)
   └─ Total duty = base + 301 + 232 + 201 + IEEPA
   └─ NOT: "Use 301 instead of MFN"
```

**How to audit:**
```javascript
// Find tariff calculation functions
grep -r "calculateTariff\|getTariff" --include="*.js" .

// Verify each tariff is queried from database
// NOT hardcoded or defaulted
```

---

## PART 3: HS CODE CLASSIFICATION (The Accuracy)

### 3.1 HS CODE SOURCE

**What to check:**
```
When HS code is classified:

Must come from:
  ├─ USITC HTS database (official source)
  ├─ User input (if broker provides it)
  └─ AI research (Claude) as fallback

MUST NOT come from:
  ├─ Hardcoded mapping
  ├─ Guessing based on product name
  ├─ User's supplier's code (often wrong)
  └─ Assumptions
```

**How to audit:**
```bash
grep -r "hs_code.*=" --include="*.js" .

# For each assignment: Where does it come from?
# Is it queried or hardcoded?
```

### 3.2 HS CODE CONFIDENCE SCORING

**What to check:**
```
Every HS code returned should have confidence:

100% confidence:
  └─ Matched against USITC HTS (verified)

85% confidence:
  └─ AI-researched, user confirmed

50% confidence:
  └─ AI-researched, not confirmed

0% confidence:
  └─ User provided code, unverified

The UI should SHOW THIS:
  ✅ "HS 73269070 - 95% confidence (USITC verified)"
  ✅ "HS 85078000 - 78% confidence (AI-researched)"
  ❌ "HS 73269070" (no confidence indicator)
```

**How to audit:**
```javascript
// Search for HS code output
grep -r "hsCode" --include="*.js" .
grep -r "hs_code" --include="*.js" .

// For each result: Is confidence level returned?
// Is user shown why this code was chosen?
```

### 3.3 HS CODE NORMALIZATION

**What to check:**
```
When HS code is used:

MUST normalize before:
  ├─ Storing in database
  ├─ Querying database
  ├─ Displaying to user
  ├─ Passing to calculations
  └─ Any other use

Normalization = Convert to 8-digit HTS format:
  ├─ Remove all non-digits
  ├─ Pad 6-digit to 8-digit (add 00)
  ├─ Trim 10-digit to 8-digit (remove stat suffix)
  └─ Reject invalid lengths
```

**How to audit:**
```bash
# Check if normalizeToHTS8 function exists
grep -r "normalizeToHTS8" --include="*.js" .

# Check if it's used EVERYWHERE HS codes are handled
# If missing from any tariff query: BUG

# Verify it handles all formats:
normalizeToHTS8('732690') → '73269000' ✅
normalizeToHTS8('73.26.90.70') → '73269070' ✅
normalizeToHTS8('73269070') → '73269070' ✅
normalizeToHTS8('7326907000') → '73269070' ✅
```

### 3.3a SCRIPT EXECUTION ORDER (Critical Dependency Issue)

**Issue Found:** Scripts running in wrong order, causing data corruption
```
WRONG order:
1. Section 232 script runs → Creates cache records
2. Section 301 script runs later → Sees record exists, skips update
3. Result: section_301 never populated, stays at default (0)

RIGHT order:
1. Section 301 script runs FIRST → Populates baseline 25% rate
2. Section 232 script runs SECOND → Adds 50% on top, preserves 301
3. Result: Both rates populated, correct values
```

**What to audit:**
- [ ] Master orchestration script exists: `sync-all-tariff-overlays.js`
- [ ] Scripts run in this order:
  1. [ ] populate-section-301-overlay.js (FIRST)
  2. [ ] populate-section-232-overlay.js (SECOND)
  3. [ ] populate-section-201-overlay.js (THIRD)
  4. [ ] populate-ieepa-overlay.js (FOURTH)
  5. [ ] populate-base-rates.js (FIFTH)
- [ ] NO scripts run independently (always through master)
- [ ] Each script preserves previous data:
  - [ ] Section 232 doesn't overwrite section_301
  - [ ] Section 201 doesn't overwrite earlier values
  - [ ] Each script checks: `existing.previous_field` before setting
- [ ] Cron job only calls master script, not individual scripts
- [ ] Manual execution only allowed through master script

**Why it matters:** Dependencies between scripts caused 233 corrupted records. Without order enforcement, happens again.

---

---

## PART 4: CALCULATION ACCURACY (The Math)

### 4.1 TARIFF STACKING LOGIC

**What to check:**
```
Calculation formula MUST be:

Total Duty Rate = 
  base_mfn_rate 
  + section_301 (if China)
  + section_232 (if steel/aluminum)
  + section_201 (if applicable)
  + ieepa_rate (if applicable)
  + reciprocal_tariff (if applicable)
  - usmca_rate (if qualified & origin is USMCA)
  - exclusions (if applicable)

Example: Chinese steel component
  = 3.5% (base MFN)
  + 25% (Section 301)
  + 50% (Section 232)
  + 20% (IEEPA)
  + 10% (reciprocal)
  = 108.5% total

NOT:
  ❌ "Use Section 301 instead of MFN"
  ❌ "Section 232 replaces base rate"
  ❌ "Apply only the highest tariff"
```

**How to audit:**
```javascript
// Find calculation function
grep -r "totalDuty\|tariffCost\|dutyCost" --include="*.js" .

// Verify it ADDS all rates, doesn't REPLACE
// Verify rates come from database, not hardcoded
// Verify final result is NOT assumed to be certain value
```

### 4.2 COMPONENT VALUE CALCULATION

**What to check:**
```
When calculating per-component cost:

Must know:
  1. Component annual value ($X)
  2. Total applicable duty rate (as decimal)
  3. Calculation = component_value * duty_rate

Example:
  Component value: $500,000
  Duty rate: 1.085 (108.5%)
  Annual cost: $500,000 × 1.085 = $542,500
  Monthly cost: $542,500 ÷ 12 = $45,208

The $41,667 error came from:
  ❌ Using 0.50 when should use 1.085
  ❌ Querying wrong code (8-digit vs 6-digit mismatch)
  ❌ Not falling back to parent rate
```

**How to audit:**
```javascript
// Find calculation functions
grep -r "componentValue.*rate\|value.*tariff" --include="*.js" .

// Verify:
// 1. Component value is accurate
// 2. Duty rate is from database (not hardcoded)
// 3. Math is correct: value × rate = cost
// 4. Monthly calculation: cost ÷ 12
```

### 4.3 USMCA SAVINGS CALCULATION

**What to check:**
```
When showing USMCA savings:

Must compare:
  1. Cost with China tariffs
  2. Cost with USMCA rates (if qualified)
  3. Difference = Savings

Example:
  China route: $500K × 1.085 = $542,500 annually
  USMCA route: $500K × 0.035 = $17,500 annually
  Savings: $542,500 - $17,500 = $525,000 annually

NOT:
  ❌ Assume USMCA = 0% (might be 2.5%, 5%, etc)
  ❌ Calculate savings without verifying rates
  ❌ Show savings without confidence level
```

**How to audit:**
```javascript
grep -r "savings\|USMCA.*cost\|comparison" --include="*.js" .

// For each calculation: Does it query actual USMCA rates?
// Does it show confidence on those rates?
```

---

## PART 5: DATA FRESHNESS (The Monitoring)

### 5.1 TARIFF CACHE AGE

**What to check:**
```
policy_tariffs_cache should have:

Column: verified_date
  ├─ Volatile tariffs (Section 301, 232): <24 hours old ✅
  ├─ Stable tariffs (base rates): <90 days old ✅
  └─ Anything older: FLAG FOR RE-VERIFICATION

Column: expires_at
  ├─ Set for volatile tariffs
  ├─ Triggers automatic refresh
  └─ Alerts if past expiration
```

**How to audit:**
```sql
-- Check data freshness
SELECT 
  COUNT(*) as total_codes,
  COUNT(CASE WHEN verified_date > NOW() - INTERVAL '1 day' THEN 1 END) as updated_24h,
  COUNT(CASE WHEN verified_date > NOW() - INTERVAL '90 day' THEN 1 END) as updated_90d,
  COUNT(CASE WHEN verified_date <= NOW() - INTERVAL '90 day' THEN 1 END) as stale
FROM policy_tariffs_cache;

-- Should show:
-- Section 301/232: Most updated in last 24h
-- Base rates: Most updated in last 90d
-- Stale: Should be <5% of total
```

### 5.2 RSS FEED MONITORING

**What to check:**
```
RSS feeds should be monitored:

Sources:
  ├─ USTR (Section 301 changes)
  ├─ White House (Section 232 proclamations)
  ├─ CBP (Implementation notices)
  └─ Reuters/Politico (Policy news)

Health check:
  ├─ Last polled: <24 hours ago
  ├─ Errors logged: Check error log
  ├─ Parsed correctly: Verify alerts triggered
  └─ Processing: Next update scheduled
```

**How to audit:**
```bash
# Check RSS polling logs
grep -r "RSS\|feed\|poll" logs/

# Verify each source:
# 1. Was polled in last 24h?
# 2. Any errors?
# 3. New items processed?
```

### 5.2a RSS FEED FAILURES (Currently Broken)

**Issue Found:** RSS Feed Polling workflow failing
```
GitHub Actions workflow: .github/workflows/rss-polling.yml
Status: ALL JOBS HAVE FAILED
Duration: 1 minute 3 seconds (timeout likely)
Last success: [NEED TO CHECK]
```

**What to audit:**
- [ ] RSS polling workflow exists and is enabled
- [ ] Workflow file syntax is correct
- [ ] All 4 feed URLs are accessible
- [ ] Workflow has proper permissions (GITHUB_TOKEN)
- [ ] Error logs show why it's failing:
  - [ ] Feed URL returns 404?
  - [ ] Feed format changed?
  - [ ] Network timeout?
  - [ ] Rate limiting?
  - [ ] XML parsing error?
- [ ] Fallback: Can feeds be accessed manually?
  ```bash
  curl -I https://ustr.gov/rss.xml  # Check if accessible
  curl -I https://whitehouse.gov/feed/  # Check if accessible
  ```
- [ ] Error notifications set up (Slack, email)
- [ ] Manual override process documented

**Why it matters:** If RSS feeds aren't working, you're not getting policy updates. System becomes stale.

**Recommended Fix Priority:**
1. [ ] Get RSS polling working (critical path blocker)
2. [ ] Set up alerts if polling fails
3. [ ] Document 4 RSS feed sources
4. [ ] Establish daily monitoring routine

---

---

## PART 6: VALIDATION CHECKPOINTS (The Safety)

### 6.1 PRE-STORAGE VALIDATION

**What to check:**
```
Before saving to database, VALIDATE:

For every record:
  ├─ HS code is 8-digit format ✅
  ├─ HS code is not null ✅
  ├─ Origin country is valid (CN, US, MX, CA, etc) ✅
  ├─ Each tariff field:
  │  ├─ Is NULL (not yet researched) OR
  │  ├─ Is decimal 0.0-1.0 (0%-100%)
  │  └─ Is NOT 0% without source documentation
  ├─ If section_301 is null: Explain why
  ├─ If section_232 is null: Explain why
  ├─ verified_source is documented ✅
  ├─ verified_date is today or recent ✅
  └─ confidence_level is set (100, 50, etc) ✅

REJECT if:
  ❌ HS code is 6-digit or 10-digit or has periods
  ❌ Tariff is 0% without source
  ❌ No verified_source field
  ❌ Confidence level missing
```

**How to audit:**
```bash
# Look for validation function
grep -r "validate.*tariff\|validateCache" --include="*.js" .

# If missing: This is a gap
# If present: Verify it's called BEFORE every insert/update
```

### 6.2 POST-STORAGE VALIDATION

**What to check:**
```
After inserting records, VALIDATE:

Corruption check:
  ├─ No records with section_301 = 0 (unless excluded)
  ├─ No records with section_232 = 0 (unless excluded)
  ├─ No records with both NULL tariffs (ghost codes)
  ├─ China codes ALL have section_301 populated
  ├─ Steel codes ALL have section_232 (or documented null)
  └─ Confidence levels reasonable (100, 85, 50, 0 - not random)

Coverage check:
  ├─ Chapter 73 codes: 300+
  ├─ Total codes: 12,000+
  ├─ China rates: 90%+ populated
  └─ Stale rates: <5%
```

**How to audit:**
```sql
-- Run validation checks after each population

-- Check 1: No zero rates
SELECT COUNT(*) FROM policy_tariffs_cache 
WHERE section_301 = 0 OR section_232 = 0;
-- Should return 0

-- Check 2: China has section_301
SELECT COUNT(*) FROM policy_tariffs_cache 
WHERE origin_country = 'CN' AND section_301 IS NULL;
-- Should be 0 (or small, with documented reason)

-- Check 3: Steel has section_232
SELECT COUNT(*) FROM policy_tariffs_cache 
WHERE chapter_id = 73 AND section_232 IS NULL;
-- Should be 0 (or small, with documented reason)
```

---

## PART 7: USER-FACING ACCURACY (The Display)

### 7.1 CONFIDENCE LEVELS SHOWN

**What to check:**
```
Every rate shown to user should have confidence:

100% "Verified USITC"
  ├─ Source: Government database
  ├─ Age: <24 hours
  └─ Example: "73269070 - Section 301 25% (USITC Verified)"

85% "Category Rate"
  ├─ Source: Parent code (6-digit) from government
  ├─ Note: "Using category rate (product not specifically classified)"
  └─ Example: "Section 301 25% (category-level rate)"

50% "AI-Researched"
  ├─ Source: Claude research
  ├─ Confidence: "Should be verified by customs broker"
  └─ Example: "HS 73269070 - 78% confidence (AI-researched)"

0% "Needs Research"
  ├─ Source: None found
  ├─ Action: "Contact customs broker"
  └─ Example: "No rate found for this code"
```

**How to audit:**
```javascript
// Check all tariff displays
grep -r "section_301\|tariff\|rate" pages/ --include="*.js"

// For each display: Is confidence level shown?
// Are users told why this confidence level?
```

### 7.2 ERROR MESSAGES

**What to check:**
```
When data is missing or questionable:

GOOD error messages:
  ✅ "No tariff rate found for HS 73269070. Contact a customs broker."
  ✅ "Using category-level rate (6-digit parent): 25%"
  ✅ "HS code 95% confidence (AI-researched, should verify with broker)"
  ✅ "Section 301 rate for China: 25% (25-year-old trade policy)"

BAD error messages:
  ❌ "Error loading data"
  ❌ Silent failure (returns 0% without explanation)
  ❌ "Not found" (no guidance on what to do)
  ❌ Returning hardcoded value without warning
```

**How to audit:**
```bash
grep -r "error\|Error\|ERROR" pages/ --include="*.js"

# For each error: Is it user-friendly?
# Does it explain what happened?
# Does it suggest what to do?
```

---

## PART 8: SYSTEMATIC PATTERN AUDIT (Find Hidden Bugs)

**New Section: Systematic Issues Found Throughout**

### 8.1 THE "ISOLATED FIX" PROBLEM

**Issue Found:** Julie keeps finding isolated bugs, but they're actually systematic patterns
```
Example 1: Line 245 bug in Section 232 script
  ├─ Found at: populate-section-232-overlay.js line 245
  ├─ Pattern: const existingSection301 = ... ? ... : 0;
  ├─ Question: Does populate-section-301-overlay.js have reverse bug?
  └─ Answer: YES! Line 189 has same pattern for section_232

Example 2: Hardcoded 0% returns
  ├─ Found at: One place returns 0 if USMCA
  ├─ Pattern: return 0; in tariff context
  ├─ Question: How many other places do this?
  └─ Answer: Unknown - need full codebase search

Example 3: HS code format mismatch
  ├─ Found at: One API endpoint queries 8-digit
  ├─ Pattern: hs_code query format inconsistency
  ├─ Question: Are OTHER endpoints also mismatched?
  └─ Answer: Unknown - need to check all endpoints
```

**The Right Approach:**
```
❌ WRONG: Fix the one bug you found
  └─ Other instances still broken

✅ RIGHT: Fix the entire PATTERN
  ├─ Search codebase for all instances
  ├─ Fix every instance
  ├─ Add test to catch recurrence
  └─ Document the pattern rule
```

**What to audit:**
- [ ] For EVERY bug found, ask: "Is this pattern elsewhere?"
- [ ] Search entire codebase for similar pattern
- [ ] Fix ALL instances, not just the one found
- [ ] Add lint rule or test to prevent recurrence
- [ ] Document why this pattern is wrong

---

### 8.2 SYSTEMATIC SEARCH QUERIES

**What to check - Run ALL of these:**

```bash
# 1. ALL defaults to 0%
grep -rn "|| 0\|? 0 :\|: 0,\|: 0}" --include="*.js" pages/ scripts/ lib/
# For each: Is it intentional, or a tariff bug?

# 2. ALL hardcoded returns
grep -rn "return 0;" --include="*.js" pages/ scripts/ lib/
# For each: Is it intentional, or a tariff bug?

# 3. ALL tariff assignments
grep -rn "section_301\|section_232\|section_201\|ieepa_rate" --include="*.js" pages/ scripts/ lib/
# For each: Does it query database or hardcode?

# 4. ALL HS code handling
grep -rn "hs_code\|hsCode\|normalizeToHTS" --include="*.js" pages/ scripts/ lib/
# For each: Is it normalized before use?

# 5. ALL tariff cache queries
grep -rn "policy_tariffs_cache" --include="*.js" pages/
# For each: Does it use fallback hierarchy?

# 6. ALL USMCA logic
grep -rn "USMCA\|isUSMCAQualified\|usmca_rate" --include="*.js" pages/
# For each: Does it query database, not hardcode?

# 7. ALL error handling for tariffs
grep -rn "error\|null\|undefined" --include="*.js" pages/ | grep -i tariff
# For each: Does it default to 0% or null?

# 8. ALL rate calculations
grep -rn "tariff.*\*\|duty.*\*\|rate.*\*" --include="*.js" pages/
# For each: Are the rates from database?
```

---

### 8.3 CRITICAL PATTERN RULES

**What to enforce - Add to code review checklist:**

```
RULE 1: No Tariff Defaults to 0%
❌ return 0;
❌ || 0 (in tariff context)
❌ if (!rate) return 0;
✅ return null;
✅ ?? null;
✅ throw new Error("Rate not found");

RULE 2: All HS Codes Must Be Normalized
❌ Query with .eq('hs_code', userInput)
❌ Store with .insert({ hs_code: value })
✅ const normalized = normalizeToHTS8(input);
✅ .eq('hs_code', normalized)

RULE 3: Script Execution Order Enforced
❌ Run populate-section-232-overlay.js directly
❌ Manual population without order
✅ Always use: sync-all-tariff-overlays.js
✅ Cron job calls master script only

RULE 4: Database Lookup, Not Hardcoded
❌ if (USMCA) return 0;
❌ const rate = 0.25; // Fixed
✅ const rate = await getRate(hsCode);
✅ const rates = await db.policy_tariffs_cache.findUnique(...);

RULE 5: All Queries Use Fallback Hierarchy
❌ .eq('hs_code', exactCode)  // Only tries exact match
✅ Try 8-digit, then 6-digit, then 4-digit, then prefix, then null

RULE 6: Confidence Levels Returned
❌ return { rate: 0.25 };
✅ return { rate: 0.25, confidence: 100, source: 'USTR' };

RULE 7: Data Validation Before Storage
❌ Insert without validation
✅ Validate then insert, reject if invalid
```

---

### 8.4 CODEBASE AUDIT MATRIX

**Create this spreadsheet and fill it out:**

| Area | Check | Status | Location | Notes |
|------|-------|--------|----------|-------|
| Data Types | All tariff fields DECIMAL(5,4) | ✅/❌ | schema.prisma | Check DB schema |
| Defaults | No tariff defaults to 0% | ✅/❌ | [location] | Search: `\|\| 0` |
| Format | All HS codes normalized 8-digit | ✅/❌ | [location] | Check before query |
| Scripts | Execute in correct order | ✅/❌ | sync script | Master orchestrator |
| Queries | Use fallback hierarchy | ✅/❌ | api/tariff | 8→6→4→prefix→null |
| USMCA | Queries database, not hardcoded | ✅/❌ | api/usmca | Check all endpoints |
| Validation | Pre-storage validation exists | ✅/❌ | lib/validate | Check exists + used |
| Validation | Post-storage checks run | ✅/❌ | cron/health | Daily health check |
| Confidence | All rates returned with confidence | ✅/❌ | api/response | Include in output |
| Errors | Helpful error messages | ✅/❌ | api/errors | No "Error loading data" |
| RSS | Feeds monitored & fresh | ✅/❌ | .github/workflows | Polling working |
| Fresh | Data <24h for volatile tariffs | ✅/❌ | database | Verified date check |

**Completion Target: All ✅ by launch**

---

### 8.5 PATTERN PREVENTION CHECKLIST

**To prevent these issues from happening again:**

- [ ] Code review template includes "Check for tariff defaults" question
- [ ] Linter rule: Flag `|| 0` in tariff-related code
- [ ] Linter rule: Flag hardcoded rates (constants in tariff functions)
- [ ] Unit tests: Verify all rate queries return confidence levels
- [ ] Unit tests: Verify normalization handles all formats
- [ ] Unit tests: Verify fallback hierarchy (8→6→4→prefix)
- [ ] Unit tests: Verify no defaults to 0%
- [ ] Database constraints: CHECK constraints on rate ranges
- [ ] Documentation: Script execution order documented in README
- [ ] Documentation: Pattern rules added to CONTRIBUTING.md
- [ ] CI/CD: Validation queries run on every deploy
- [ ] CI/CD: Health checks alert on tariff cache corruption
- [ ] Monitoring: Daily report of data freshness
- [ ] Monitoring: Alert if RSS polling fails

---

Print this and check off each:

### Data Integrity
- [ ] All HS codes in cache are 8-digit format (or 6-digit parent codes)
- [ ] All tariff rates are DECIMAL(5,4), stored as 0.25 not 25
- [ ] No hardcoded 0% rates (except explicitly documented)
- [ ] No rates default to 0% (default to NULL instead)

### Query Logic
- [ ] Tariff lookups try 8-digit, then 6-digit, then 4-digit
- [ ] Returns confidence level (100, 85, 70, 50, 0)
- [ ] USMCA rates queried from database, not assumed 0%
- [ ] All tariffs are queried, not hardcoded

### HS Code Classification
- [ ] All HS codes normalized to 8-digit format
- [ ] HS code source documented (USITC, user, AI)
- [ ] Confidence level returned with each code
- [ ] Invalid codes rejected with clear error

### Calculations
- [ ] All tariffs STACKED (added), not replaced
- [ ] Component value accurate
- [ ] Duty rates from database
- [ ] Math verified: value × rate = cost

### Data Freshness
- [ ] Verified dates <24 hours for volatile tariffs
- [ ] Verified dates <90 days for stable rates
- [ ] RSS feeds monitoring for changes
- [ ] Alerts if data stale

### Validation
- [ ] Pre-storage validation runs before insert
- [ ] Post-storage validation runs after population
- [ ] Corruption detection active
- [ ] Health checks daily

### User Display
- [ ] Confidence levels shown with all rates
- [ ] Sources documented (USITC, parent code, AI, etc)
- [ ] Error messages helpful and actionable
- [ ] No silent failures

**Check all 40+ items. If any is NO: You have a bug to fix.**