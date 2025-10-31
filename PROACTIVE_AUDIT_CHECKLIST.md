# 🔍 Proactive Audit Checklist

**Purpose:** Catch issues BEFORE the user discovers them
**When to run:** After major changes, before commits, weekly maintenance
**Last Updated:** Oct 31, 2025

---

## ✅ Quick 5-Minute Audit (Run Before Every Commit)

### 1. Database Schema vs Code Alignment
```sql
-- Check for JSONB columns where data might be "hidden"
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND data_type = 'jsonb';
```

**Red flags:**
- ❌ Code queries top-level columns (e.g., `row.company_name`) but data is in JSONB
- ❌ Code doesn't have fallback logic: `row.field || jsonbData.field`

### 2. Missing Column Errors
```bash
# Check recent dev_issues for column not found errors
grep -rn "column.*does not exist" lib/ pages/ components/
```

**Action:** If found → Add column to database OR fix code to use correct column name

### 3. Null Field Warnings
```bash
# Check for fields that are always NULL in database
grep -rn "|| 'Unknown'\||| 'Not specified'" pages/api/
```

**Red flag:** Silent fallbacks hide data problems. Should fail loud or fix data source.

### 4. Data Contract Violations
```sql
-- Check if critical fields are NULL when they shouldn't be
SELECT
  table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN company_name IS NULL THEN 1 END) as null_company_name,
  COUNT(CASE WHEN trade_volume IS NULL THEN 1 END) as null_trade_volume
FROM (
  SELECT 'workflow_sessions' as table_name, company_name, trade_volume FROM workflow_sessions
  UNION ALL
  SELECT 'workflow_completions', company_name, trade_volume FROM workflow_completions
) subquery
GROUP BY table_name;
```

**Expected:** <10% NULL rate for critical fields
**If >50% NULL:** Data is likely trapped in JSONB → Add fallback logic

---

## 🔬 Deep 30-Minute Audit (Weekly Maintenance)

### 1. End-to-End Data Flow Trace
**For each critical user journey (e.g., USMCA workflow):**

#### Step 1: User Input → API
```bash
# Verify API receives all fields
grep -A20 "formData\|req.body" pages/api/ai-usmca-complete-analysis.js | head -40
```

**Check:**
- ✅ All form fields are read from request
- ✅ Field names match frontend form

#### Step 2: API → Database Save
```bash
# Find database INSERT/UPDATE statements
grep -A10 "\.insert\|\.update" pages/api/ai-usmca-complete-analysis.js
```

**Check:**
- ✅ All fields are saved (not just some)
- ✅ Saving to correct columns (not all to JSONB)

#### Step 3: Database → API Read
```bash
# Find database SELECT statements
grep -A10 "\.select\|\.from" pages/api/dashboard-data.js
```

**Check:**
- ✅ SELECT includes JSONB columns: `.select('*, workflow_data')`
- ✅ Code extracts from JSONB if top-level is NULL

#### Step 4: API → Frontend Display
```bash
# Check if frontend expects correct field names
grep -rn "userProfile\.trade_volume\|workflow\.company_name" pages/ components/
```

**Check:**
- ✅ Frontend field names match API response
- ✅ No `undefined` errors in browser console

### 2. JSONB Data Extraction Audit

**For each table with JSONB columns:**

```sql
-- Example: Check workflow_completions
SELECT
  id,
  -- Top-level columns
  company_name as top_level_name,
  trade_volume as top_level_volume,
  -- JSONB extractions
  workflow_data->>'company'->>'company_name' as jsonb_name,
  workflow_data->>'company'->>'trade_volume' as jsonb_volume
FROM workflow_completions
LIMIT 5;
```

**Red flags:**
- ❌ Top-level = NULL, JSONB = has data → Need fallback logic
- ❌ Both NULL → Data not being saved at all → Fix save logic

### 3. API Endpoint Required Fields Audit

**For each API that reads workflow data:**

```bash
# List all APIs that query workflows
grep -l "workflow_sessions\|workflow_completions" pages/api/*.js
```

**For each file found, check:**
1. Does it query JSONB columns? (`select('*, workflow_data')`)
2. Does it extract from JSONB? (`const workflowData = row.workflow_data || {}`)
3. Does it have fallbacks? (`row.field || workflowData.nested.field`)

**Template for fixes:**
```javascript
// ❌ BAD: Only reads top-level (fails if NULL)
company_name: row.company_name

// ✅ GOOD: Fallback to JSONB
company_name: row.company_name || workflowData.company?.company_name
```

### 4. Frontend-Backend Contract Validation

**Test each critical API endpoint:**

```bash
# Example: Test dashboard-data API
curl http://localhost:3001/api/dashboard-data -H "Cookie: ..." | jq .

# Check response has all expected fields:
# - company_name (not null)
# - trade_volume (number, not null)
# - business_type (not null)
```

**Red flags:**
- ❌ Field is null when it shouldn't be
- ❌ Field is missing from response
- ❌ Field has wrong type (string when should be number)

---

## 🚨 Critical Issues Found (Oct 31, 2025 Audit)

### Issue #1: Data Trapped in JSONB
**Affected Tables:** `workflow_completions`, `workflow_sessions`
**Problem:** 100% of rows have NULL in top-level columns (company_name, trade_volume, business_type)
**Root Cause:** Data is saved to JSONB `workflow_data` column, but some code reads top-level columns
**Fix Applied:**
- ✅ `pages/trade-risk-alternatives.js` - Added fallback logic (lines 204-226)
- ✅ `pages/api/dashboard-data.js` - Added fallback logic (lines 127-150)
- ✅ `lib/services/alert-impact-analysis-service.js` - Made trade_volume optional (lines 167-171)

### Issue #2: Missing Column (`email_confirmed_at`)
**Affected API:** `/api/ai-usmca-complete-analysis`
**Problem:** API queried non-existent column → returned NULL → defaulted to Trial tier → blocked user
**Fix Applied:**
- ✅ Added `email_confirmed_at` column to `user_profiles` table

### Issue #3: Client-Side AI Call (401 Unauthorized)
**Affected Feature:** "Generate Strategic Analysis" button
**Problem:** Client tried to call AI with `process.env.OPENROUTER_API_KEY` (undefined in browser)
**Fix Applied:**
- ✅ Created server-side API endpoint `/api/alert-impact-analysis`
- ✅ Updated client to call server endpoint instead of direct service

---

## 📋 Proactive Audit Schedule

**Daily (Before Commits):**
- ✅ Run Quick 5-Minute Audit
- ✅ Check browser console for errors
- ✅ Verify new API endpoints return expected data

**Weekly:**
- ✅ Run Deep 30-Minute Audit
- ✅ Check database for NULL fields that shouldn't be NULL
- ✅ Test complete user journey end-to-end

**Before Major Releases:**
- ✅ Run all audits
- ✅ Query database to verify data contracts
- ✅ Test with real user data (not just test data)
- ✅ Check Vercel logs for 500 errors

---

## 🎯 How to Answer: "Why Not Just Fix the Data Storage?"

**Option A: Fix Code (Fallbacks)**
- ✅ **Pros:** Works immediately, no data migration needed, handles both old and new data
- ❌ **Cons:** Code complexity (fallback logic everywhere)

**Option B: Fix Database (Flatten JSONB to Top-Level)**
- ✅ **Pros:** Cleaner code, better query performance
- ❌ **Cons:** Data migration required, risk of data loss, downtime

**Current Decision:** Option A (Fallbacks)
- Reason: Faster to implement, zero risk of data loss, works for all existing workflows
- Future: Consider migration after validating fallback logic works perfectly

---

## 🔧 Tools for Automation

**1. Pre-Commit Hook**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for common anti-patterns
grep -rn "|| 'Unknown'\||| 'Not specified'" pages/api/ && echo "⚠️  Silent fallbacks found - use explicit fallback logic" && exit 1

# Check for missing column patterns
grep -rn "\.email_confirmed_at" pages/ && echo "✅ Column usage found - verify it exists in database"

exit 0
```

**2. Weekly Cron Job (Local)**
```bash
# Add to crontab: 0 9 * * 1 (Every Monday 9am)
cd /path/to/triangle-simple && \
  node scripts/audit-database-schema.js && \
  node scripts/check-api-contracts.js
```

---

## 📝 Checklist Summary

**Before Every Commit:**
- [ ] No silent fallbacks (`|| 'Unknown'`)
- [ ] No hardcoded data
- [ ] Browser console has no errors
- [ ] API responses match frontend expectations

**Before Every PR:**
- [ ] Run Quick 5-Minute Audit
- [ ] Test affected user journeys end-to-end
- [ ] Check database for NULL fields
- [ ] Verify JSONB fallback logic if querying workflow data

**Before Every Release:**
- [ ] Run Deep 30-Minute Audit
- [ ] Test with production-like data
- [ ] Check Vercel logs for 500 errors
- [ ] Verify all critical fields have data

---

**Remember:** The database is the source of truth. Always query it to verify assumptions!
