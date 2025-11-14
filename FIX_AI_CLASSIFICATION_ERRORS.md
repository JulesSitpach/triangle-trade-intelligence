# Fix AI Classification Errors - Nov 13, 2025

## 🔍 The Problem

**AI classifies components with HS codes that don't exist:**
- AI returns: 8542.31.00.00 (PCB assembly)
- System truncates to: 85423100 (correct)
- Database lookup: **NO MATCH** (code doesn't exist in tariff schedule)
- System fallback: AI invents 6.5% rate ❌

**Database Reality:**
- 8542.32 (memories) = 0.0%
- 8542.33 (amplifiers) = 0.0%
- 8542.39 (other ICs) = 0.0%
- 8542.31 = **DOES NOT EXIST**

---

## ✅ Solution: 3-Tier Fallback with Fuzzy Matching

### Current Flow (Broken):
```
1. Try exact match: 85423100
2. Not found → AI invents rate (6.5%) ❌
```

### Fixed Flow (Smart Fallback):
```
1. Try exact match: 85423100
2. Not found → Try fuzzy prefix match: 8542.3X
3. Still not found → Use AI alternative codes
4. Still not found → Ask AI to research (stale: true)
```

---

## 🔧 Implementation Plan

### Option A: Fuzzy Matching (RECOMMENDED - 15 minutes)

**File:** `pages/api/ai-usmca-complete-analysis.js`
**Location:** Line 845 (after exact match fails)

```javascript
// ✅ STEP 1: Try exact match (already exists)
const { data: exactMatch } = await supabase
  .from('tariff_intelligence_master')
  .select('...')
  .or(`hts8.eq.${normalizedHsCode},hts8.eq.${hsCodeWithPeriods}`)
  .limit(1);

if (exactMatch && exactMatch.length > 0) {
  // Use exact match (existing code)
  enriched.push({ ...baseComponent, ... });
  continue;
}

// ✅ STEP 2: Try fuzzy prefix match (6-digit)
console.log(`⚠️ [FUZZY-MATCH] Exact match failed for ${normalizedHsCode}, trying prefix match...`);

const sixDigitPrefix = normalizedHsCode.substring(0, 6); // 854231
const { data: fuzzyMatches } = await supabase
  .from('tariff_intelligence_master')
  .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate')
  .like('hts8', `${sixDigitPrefix}%`)  // Find all 854231**
  .limit(10);

if (fuzzyMatches && fuzzyMatches.length > 0) {
  console.log(`✅ [FUZZY-MATCH] Found ${fuzzyMatches.length} matches for prefix ${sixDigitPrefix}:`,
    fuzzyMatches.map(m => m.hts8));

  // Use first match (they're all the same rate for semiconductors)
  const match = fuzzyMatches[0];

  enriched.push({
    ...baseComponent,
    mfn_rate: parseFloat(match.mfn_ad_val_rate || 0),
    base_mfn_rate: parseFloat(match.mfn_ad_val_rate || 0),
    usmca_rate: parseFloat(match.usmca_ad_val_rate || 0),
    rate_source: 'database_fuzzy',
    data_source: `fuzzy_match_${sixDigitPrefix}`,
    stale: false,
    fuzzy_match_warning: `Exact code ${normalizedHsCode} not found. Using ${match.hts8} (${match.brief_description}) from same 6-digit family.`,
    last_verified: new Date().toISOString()
  });
  continue; // Success - skip AI fallback
}

// ✅ STEP 3: Try AI alternative codes (if provided)
if (component.alternative_hs_codes && component.alternative_hs_codes.length > 0) {
  console.log(`🔄 [ALTERNATIVE-CODES] Trying AI alternatives:`, component.alternative_hs_codes);

  for (const altCode of component.alternative_hs_codes) {
    const normalizedAlt = altCode.replace(/\./g, '').substring(0, 8);
    const { data: altMatch } = await supabase
      .from('tariff_intelligence_master')
      .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate')
      .eq('hts8', normalizedAlt)
      .limit(1);

    if (altMatch && altMatch.length > 0) {
      console.log(`✅ [ALTERNATIVE-MATCH] Found match with alternative ${altCode}`);
      enriched.push({
        ...baseComponent,
        mfn_rate: parseFloat(altMatch[0].mfn_ad_val_rate || 0),
        base_mfn_rate: parseFloat(altMatch[0].mfn_ad_val_rate || 0),
        usmca_rate: parseFloat(altMatch[0].usmca_ad_val_rate || 0),
        rate_source: 'database_alternative',
        data_source: `alternative_${altCode}`,
        stale: false,
        alternative_code_used: true,
        last_verified: new Date().toISOString()
      });
      continue; // Success
    }
  }
}

// ✅ STEP 4: Last resort - mark for AI research (existing code)
console.log(`❌ [DATABASE-MISS] No match for ${normalizedHsCode}, marking for AI research`);
enriched.push({
  ...baseComponent,
  mfn_rate: 0,
  usmca_rate: 0,
  rate_source: 'requires_ai_research',
  stale: true,  // ← This triggers AI fallback
  data_source: 'database_miss'
});
```

---

### Option B: Validate AI Codes BEFORE Lookup (20 minutes)

**File:** `lib/agents/classification-agent.js`
**Location:** After AI returns HS code

```javascript
async classifyComponent(componentDescription) {
  // ... AI classification call ...
  const aiResponse = JSON.parse(completion.content);

  // ✅ VALIDATE: Check if primary code exists in database
  const primaryCode = aiResponse.hs_code.replace(/\./g, '').substring(0, 8);
  const { data: validation } = await supabase
    .from('tariff_intelligence_master')
    .select('hts8')
    .eq('hts8', primaryCode)
    .limit(1);

  if (!validation || validation.length === 0) {
    console.warn(`⚠️ [VALIDATION] Primary code ${primaryCode} not in database, trying alternatives...`);

    // Try each alternative code
    for (const altCode of aiResponse.alternative_codes || []) {
      const normalizedAlt = altCode.hs_code.replace(/\./g, '').substring(0, 8);
      const { data: altValidation } = await supabase
        .from('tariff_intelligence_master')
        .select('hts8')
        .eq('hts8', normalizedAlt)
        .limit(1);

      if (altValidation && altValidation.length > 0) {
        console.log(`✅ [VALIDATION] Using alternative ${altCode.hs_code} instead of ${aiResponse.hs_code}`);
        // Swap primary with validated alternative
        return {
          hs_code: altCode.hs_code,
          confidence: altCode.confidence,
          reasoning: `Original code ${aiResponse.hs_code} not in database. Using validated alternative.`,
          original_code: aiResponse.hs_code
        };
      }
    }

    // None of the codes validate - return with warning
    return {
      ...aiResponse,
      validation_warning: `Code ${primaryCode} not found in tariff schedule. May require manual verification.`
    };
  }

  return aiResponse; // Primary code validated ✅
}
```

---

### Option C: Expand Database with ALL Valid Codes (LONG-TERM)

**Problem:** Database only has 12,118 codes
**USITC has:** ~17,000 HTS codes

**Solution:** Import complete USITC tariff schedule
- Download: https://hts.usitc.gov/
- Import all codes (even rare ones)
- Never have "code doesn't exist" problem again

---

## 🎯 Recommended Immediate Fix

**Use Option A (Fuzzy Matching)** - 15 minutes, highest impact:

1. Add fuzzy prefix matching after exact match fails
2. Use 6-digit prefix (854231) to find all related codes
3. Pick first match (they all have same rate for semiconductors)
4. Log what happened for transparency

**Why this works:**
- Within same 6-digit family, rates are usually identical
- 8542.31 doesn't exist, but 8542.32/33/39 all = 0.0%
- Fuzzy match will find one of those valid codes
- User gets correct 0.0% instead of hallucinated 6.5%

---

## 📊 Expected Impact

### Before Fix:
- PCB (8542.31): 6.5% ❌ (hallucinated)
- Savings: $438,750 (overstated)

### After Fix:
- PCB (8542.32/33/39 fuzzy match): 0.0% ✅ (correct)
- Savings: $0 (accurate - duty-free semiconductors)

**Net correction:** -$438,750 in false savings (38% reduction)

---

## 🚀 Deployment

1. Add fuzzy matching code to `pages/api/ai-usmca-complete-analysis.js` (line ~850)
2. Test with results.md data (8542310000 should fuzzy match to 85423200)
3. Git commit: "fix: Add fuzzy prefix matching for invalid AI HS codes"
4. Git push (auto-deploys to Vercel)

**Time:** 15 minutes
**Risk:** Low (only activates when exact match fails)
**Benefit:** Eliminates hallucinated tariff rates

---

## 🔍 Testing

```bash
# Test fuzzy matching locally
node test-fuzzy-hs-matching.js
```

**Test cases:**
- 85423100 → Should match 85423200/33/39 (0.0%)
- 76109000 → Should match exact (5.7%)
- 85287200 → Should match exact (0.0%)

---

**Want me to implement Option A (fuzzy matching) now?**
