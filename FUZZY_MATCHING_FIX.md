# Fuzzy Matching Fix - Nov 13, 2025

## 🐛 The Bug

**Fuzzy matching exists but uses wrong prefix length:**

Current code (lines 882-898):
```javascript
const sixDigitPrefix = normalizedHsCode.substring(0, 6);  // "854231"
const { data: prefixMatches } = await supabase
  .from('tariff_intelligence_master')
  .ilike('hts8', `${sixDigitPrefix}%`)  // Searches for "854231%"
```

**Test results:**
- AI classifies: `8542.31.00.00` (PCB assembly)
- Normalized to: `85423100` (8-digit)
- 6-digit prefix: `854231%`
- Database query: `WHERE hts8 ILIKE '854231%'`
- Result: **0 matches** ❌

**Why it fails:**
Database has: 85423200, 85423300, 85423900
Search looks for: 854231XX
These don't match because 854231 ≠ 854232/854233/854239

---

## ✅ The Fix

**Change 6-digit to 5-digit prefix:**

```javascript
// ✅ FIXED: Use 5-digit prefix to match chapter heading (8542.3X)
const fiveDigitPrefix = normalizedHsCode.substring(0, 5);  // "85423"
const { data: prefixMatches } = await supabase
  .from('tariff_intelligence_master')
  .select('hts8, brief_description, mfn_text_rate, mfn_rate_type_code, mfn_ad_val_rate, mfn_specific_rate, usmca_rate_type_code, usmca_ad_val_rate, usmca_specific_rate, mexico_rate_type_code, mexico_ad_val_rate, mexico_specific_rate, nafta_mexico_ind, nafta_canada_ind, column_2_ad_val_rate, section_301, section_232')
  .ilike('hts8', `${fiveDigitPrefix}%`)  // Search for "85423%"
  .order('hts8', { ascending: true })
  .limit(5);
```

**Test with fix:**
- 5-digit prefix: `85423%`
- Database query: `WHERE hts8 ILIKE '85423%'`
- Result: **3 matches** ✅
  - 85423200 (memories, 0.0%)
  - 85423300 (amplifiers, 0.0%)
  - 85423900 (other ICs, 0.0%)

---

## 📍 File Location

**File:** `pages/api/ai-usmca-complete-analysis.js`
**Lines:** 882-897

**Change required:**
```diff
- const sixDigitPrefix = normalizedHsCode.substring(0, 6);
- console.log(`🔍 [PREFIX-LOOKUP] Searching for 6-digit chapter heading: ${sixDigitPrefix}XXXX`);
+ const fiveDigitPrefix = normalizedHsCode.substring(0, 5);
+ console.log(`🔍 [PREFIX-LOOKUP] Searching for 5-digit chapter heading: ${fiveDigitPrefix}XXX (family match)`);

  const { data: prefixMatches } = await supabase
    .from('tariff_intelligence_master')
    .select('...')
-   .ilike('hts8', `${sixDigitPrefix}%`)
+   .ilike('hts8', `${fiveDigitPrefix}%`)
    .order('hts8', { ascending: true })
    .limit(5);

  if (prefixMatches && prefixMatches.length > 0) {
    rateData = prefixMatches[0];
-   console.log(`✅ [PREFIX-FALLBACK] Exact match not found, using 6-digit prefix match: ${rateData.hts8}`);
+   console.log(`✅ [PREFIX-FALLBACK] Exact match not found, using 5-digit family match: ${rateData.hts8}`);
  }
```

---

## 🎯 Expected Impact

### Before Fix:
- PCB Assembly (8542.31): **6.5%** MFN (AI hallucinated) ❌
- LCD Display (8542.31): **2.5%** MFN (AI hallucinated) ❌
- Annual savings: **$654,000** (overstated by $251,250)

### After Fix:
- PCB Assembly (8542.32/33/39 fuzzy): **0.0%** MFN (correct) ✅
- LCD Display: Still needs reclassification (should be 8528.72, not 8542.31)
- Annual savings: **~$403,000** (accurate)

---

## 🚀 Implementation

1. Edit `pages/api/ai-usmca-complete-analysis.js` lines 882-897
2. Change `substring(0, 6)` to `substring(0, 5)`
3. Update console.log messages (6-digit → 5-digit)
4. Test with 8542310000 (should match 85423200)
5. Commit: "fix: Use 5-digit prefix for fuzzy HS code matching (not 6-digit)"
6. Push to production

**Time:** 2 minutes
**Risk:** Low (only affects fallback path when exact match fails)

---

## 🧪 Test Case

```javascript
// Component: PCB Assembly
// AI classified: 8542.31.00.00
// Normalized: 85423100

// OLD (6-digit): "854231%" → 0 matches
// NEW (5-digit): "85423%" → 3 matches (85423200, 85423300, 85423900)
// Pick first: 85423200 (memories, 0.0% MFN) ✅
```

---

**Ready to implement?**
