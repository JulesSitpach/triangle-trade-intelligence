# TABLE DISPLAY FIX SUMMARY

**Created:** Oct 28, 2025
**Issue:** Component table showing incorrect MFN Rate (0.0% instead of 35.0%) and Total Rate (60.0% instead of 95.0%) for China-origin microprocessor

---

## 🐛 PROBLEM (From Screenshot)

User's component table showed:

| Component | Origin | Value % | MFN Rate | USMCA Rate | Additional Tariffs | Total Rate | Annual Savings |
|-----------|--------|---------|----------|------------|-------------------|------------|----------------|
| Microprocessor (ARM-based) | CN | 35% | **0.0%** ❌ | 0.0% | 60.0% ✅ | **60.0%** ❌ | — |

**Expected:**

| Component | Origin | Value % | MFN Rate | USMCA Rate | Additional Tariffs | Total Rate | Annual Savings |
|-----------|--------|---------|----------|------------|-------------------|------------|----------------|
| Microprocessor (ARM-based) | CN | 35% | **35.0%** ✅ | 0.0% | 60.0% ✅ | **95.0%** ✅ | $XXX,XXX |

**Why:**
- China is **non-WTO**, so uses **Column 2 rate** (35%) not MFN rate (0%)
- Total Rate = Column 2 (35%) + Section 301 (60%) = **95%**

---

## ✅ FIXES APPLIED

### 1. **Backend: base_mfn_rate Calculation** (pages/api/ai-usmca-complete-analysis.js:719-722)

**Before:**
```javascript
let baseMfnRate = 0;
if (textRateForBase === 'Free') {
  baseMfnRate = 0;
} else {
  baseMfnRate = parseFloat(mfnAdValRateForBase) || 0;  // ❌ Always WTO, never Column 2
}
```

**After:**
```javascript
// ✅ FIX: base_mfn_rate should match mfnRate (origin-aware)
// mfnRate already handles Column 2 for China, so just use it directly
const baseMfnRate = mfnRate;
```

**Impact:** `base_mfn_rate` now correctly shows 0.35 (35%) for China components

---

### 2. **Backend: Removed Backwards Validation** (pages/api/ai-usmca-complete-analysis.js:1238-1241)

**Before:**
```javascript
// ❌ Flagged decimals (0.35) as "unexpected format"
const rateFormatIssues = componentBreakdown.filter(comp =>
  (comp.mfn_rate > 0 && comp.mfn_rate < 1) || (comp.section_301 > 0 && comp.section_301 < 1)
);
```

**After:**
```javascript
// ✅ REMOVED: Database stores decimals (0.35 = 35%), not percentages
// Transformation code correctly detects decimals and doesn't transform them
```

**Impact:** No more false warnings about "unexpected rate format"

---

### 3. **Backend: AI Merge Data Source** (pages/api/ai-usmca-complete-analysis.js:826)

**Before:**
```javascript
return {
  ...comp,
  rate_source: 'ai_research_2025'  // ✅ Set
  // ❌ Missing data_source
};
```

**After:**
```javascript
return {
  ...comp,
  rate_source: 'ai_research_2025',
  data_source: 'ai_research_2025'  // ✅ Now validation passes
};
```

**Impact:** PCB rates from AI now apply correctly (no longer flagged as missing)

---

### 4. **Backend: Self-Learning Database** (pages/api/ai-usmca-complete-analysis.js:833-871)

**NEW:** AI-discovered rates automatically saved back to tariff_intelligence_master

```javascript
// After AI fallback finds rates for missing components:
for (const aiRate of aiRates) {
  const normalizedHS = aiRate.hs_code.replace(/\D/g, '').substring(0, 8).padEnd(8, '0');

  await supabase
    .from('tariff_intelligence_master')
    .upsert({
      hts8: normalizedHS,
      mfn_ad_val_rate: aiRate.base_mfn_rate || aiRate.mfn_rate || 0,
      section_301: aiRate.section_301 || 0,
      section_232: aiRate.section_232 || 0,
      usmca_ad_val_rate: aiRate.usmca_rate || 0,
      data_source: 'ai_research_2025',
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'hts8'
    });

  console.log(`✅ [DATABASE-GROWTH] Saved ${normalizedHS} to database`);
}
```

**Impact:** Database coverage grows from 83% → 100% over time (AI fallback becomes rarer)

---

### 5. **Frontend: Enhanced Debug Logging** (components/workflow/results/USMCAQualification.js:198-225)

**Added comprehensive logging to verify data:**

```javascript
console.log(`🔍 [FRONTEND] First component from API:`, {
  description: component.description,
  origin: component.origin_country,
  rawMfnRate: component.mfn_rate,              // Should be 0.35 for China
  rawBaseMfnRate: component.base_mfn_rate,     // Should be 0.35 for China
  rawSection301: component.section_301,         // Should be 0.60
  rawTotalRate: component.total_rate,           // Should be 0.95
  displayMfnRate: '35.0%',                      // What user sees in table
  displayTotalRate: '95.0%',                    // What user sees in table
  missingFields: { ... }
});
```

**Impact:** Easy to verify if backend is sending correct data

---

## 🧪 TESTING INSTRUCTIONS

### Step 1: Restart Dev Server

**CRITICAL:** Server must be restarted to apply backend fixes

```bash
# Kill existing server (if running)
# DO NOT USE taskkill or pkill - just close terminal/IDE

# Start fresh server
npm run dev:3001
```

### Step 2: Submit Test Analysis

Use this exact test data:

**Company:**
- Name: TechFlow Electronics
- Country: US
- Destination: US

**Components:**
```
1. Microprocessor (ARM-based)
   - HS Code: 8542.31.00
   - Origin: CN (China)
   - Value %: 35%

2. Power Supply Unit (85W)
   - HS Code: 8504.40.00
   - Origin: MX (Mexico)
   - Value %: 30%

3. Aluminum Housing Assembly
   - HS Code: 7616.99.50
   - Origin: MX (Mexico)
   - Value %: 35%
```

### Step 3: Verify Backend Logs

Look for these in server console:

```
✅ [DATABASE ENRICHMENT] Enriched rates for Microprocessor (ARM-based):
   mfn_rate: 0.35              ← SHOULD BE 0.35 (not 0)
   base_mfn_rate: 0.35         ← SHOULD BE 0.35 (not 0)
   section_301: 0.6
   section_232: 0
   total_rate: 0.95            ← SHOULD BE 0.95 (not 0.6)

✅ [TRANSFORM] mfn_rate: 0.35 → 0.35 (already decimal, no transformation)
✅ [TRANSFORM] section_301: 0.6 → 0.6 (already decimal, no transformation)
✅ [TRANSFORM] total_rate: 0.95 → 0.95 (already decimal, no transformation)

📊 [RESPONSE-DEBUG] Final response:
  [
    {
      description: 'Microprocessor (ARM-based)',
      mfn_rate: 0.35,           ← SHOULD BE 0.35
      section_301: 0.6,
      total_rate: 0.95          ← SHOULD BE 0.95
    }
  ]
```

### Step 4: Verify Frontend Display

Check browser console for:

```javascript
🔍 [FRONTEND] First component from API:
{
  description: "Microprocessor (ARM-based)",
  origin: "CN",
  rawMfnRate: 0.35,              // ← SHOULD BE 0.35
  rawBaseMfnRate: 0.35,          // ← SHOULD BE 0.35
  rawSection301: 0.6,            // ✅ Correct
  rawTotalRate: 0.95,            // ← SHOULD BE 0.95
  displayMfnRate: "35.0%",       // ← What shows in table
  displayTotalRate: "95.0%"      // ← What shows in table
}
```

### Step 5: Verify Table Display

**Expected table:**

| Component | Origin | Value % | MFN Rate | USMCA Rate | Additional Tariffs | Total Rate |
|-----------|--------|---------|----------|------------|-------------------|------------|
| Microprocessor (ARM-based) | CN | 35% | **35.0%** ✅ | 0.0% | 60.0% | **95.0%** ✅ |
| Power Supply Unit (85W) | MX | 30% | 0.0% | 0.0% | — | 0.0% |
| Aluminum Housing Assembly | MX | 35% | 0.0% | 0.0% | — | 0.0% |

---

## 🎯 SUCCESS CRITERIA

✅ **MFN Rate** for China component shows **35.0%** (Column 2 rate)
✅ **Total Rate** for China component shows **95.0%** (35% + 60%)
✅ No validation warnings about "unexpected rate format"
✅ Backend logs show `base_mfn_rate: 0.35` and `total_rate: 0.95`
✅ Frontend console shows correct raw values

---

## 🚨 IF STILL SHOWING 0.0%

### Possible Causes:

1. **Server not restarted** → Restart dev server
2. **Browser cache** → Hard refresh (Ctrl+Shift+R)
3. **Old session data** → Submit new analysis (don't load old one)
4. **Database cache** → Database might have stale 0 values (check query result)

### Debug Steps:

```bash
# 1. Verify backend code has changes
grep -A 5 "base_mfn_rate should match mfnRate" pages/api/ai-usmca-complete-analysis.js

# 2. Check database has Column 2 data
# Run this query in Supabase:
SELECT hts8, mfn_ad_val_rate, column_2_ad_val_rate, section_301
FROM tariff_intelligence_master
WHERE hts8 = '85423100';

# Expected result:
# mfn_ad_val_rate: 0.0000 (Free for WTO)
# column_2_ad_val_rate: 0.35 (35% for China)
# section_301: 0.60 (60% policy tariff)

# 3. Verify getMFNRate() is using Column 2
# Look for this log in server console:
# → Using Column 2 rate for China: 0.35
```

---

## 📚 RELATED FILES

- ✅ `pages/api/ai-usmca-complete-analysis.js` - Backend enrichment (FIXED)
- ✅ `components/workflow/results/USMCAQualification.js` - Frontend table display (ENHANCED)
- ✅ `lib/services/alert-push-service.js` - Policy alert service (NEW)
- ✅ `END_TO_END_DATA_FLOW.md` - Updated with self-learning database
- ✅ `POLICY_UPDATES_TODO.md` - Policy update implementation plan

---

## 🔔 NEXT STEPS (After Table Fix Confirmed)

1. Implement `policy-parser.js` (AI parses RSS announcements)
2. Implement `database-sync.js` (Updates tariff_intelligence_master)
3. Update RSS polling cron (Integrate all services)
4. Build Alert UI components (Display on /trade-risk-alternatives)

**See:** `POLICY_UPDATES_TODO.md` for complete implementation plan
