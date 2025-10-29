# TRIANGLE DATA FLOW - AGENT QUICK REFERENCE

**Updated Oct 28, 2025** - Hybrid Database-First Architecture

---

## 🧭 PLATFORM PHILOSOPHY (Read This First)

**We are a discovery tool like TurboTax, NOT a legal compliance service.**

### What We Do:
- ✅ Help SMBs **discover** if they might qualify for USMCA preferential treatment
- ✅ Show **what-if scenarios**: "What if I sourced from Mexico instead of China?"
- ✅ Calculate **estimated savings** based on current tariff data
- ✅ Provide **best-effort analysis** with 12K+ HS codes from USITC 2025

### What We DON'T Do:
- ❌ Guarantee legal compliance (users verify accuracy themselves)
- ❌ Replace customs brokers or trade attorneys
- ❌ Predict future tariff changes (policy changes unpredictably)
- ❌ Certify that certificates will be accepted by customs

### Our Approach:
- **Best effort, not perfect**: Tariff policy changes with 30-day notice (Section 301, etc.)
- **User empowerment**: Show the math, let users decide if it's worth pursuing
- **Discovery focus**: "You might save $340/month - here's how"
- **What-if planning**: "If you nearshore to Mexico, you'd eliminate Section 301 and qualify for USMCA"

**Think TurboTax for USMCA: We help you understand the rules and run the numbers, you verify accuracy and make the final call.**

---

## 🎯 QUICK REFERENCE (Database & Architecture)

### Database: tariff_intelligence_master (Self-Learning)
- **Total HS codes:** 12,118 (USITC 2025 Harmonized Tariff Schedule)
- **MFN rates:** 6,482 (53%) - WTO countries (US, CA, MX, EU)
- **USMCA rates:** 12,118 (100%) - Complete treaty coverage
- **Column 2 rates:** 10,034 (83%) - Non-WTO (China, Russia, Cuba)
- **🔄 SELF-LEARNING:** AI-discovered rates saved back to database (coverage grows automatically)

### Origin-Aware Rate Selection (CRITICAL FIX - Oct 28, 2025)
```javascript
// ✅ CORRECT: Use origin_country to select correct rate column
if (origin_country === 'CN' || origin_country === 'China') {
  mfn_rate = column_2_ad_val_rate;  // 35% for China (non-WTO)
} else {
  mfn_rate = mfn_ad_val_rate;  // 0-5% for WTO countries
}

// Section 301 is ADDITIONAL on top of base rate:
total_rate = mfn_rate + section_301 + section_232;
// Example: China microprocessor = 35% (Column 2) + 60% (Section 301) = 95% total
```

### Performance (Self-Learning System)
- **Fast Path (95%):** Database lookup only → ~100ms response, $0 cost
- **Slow Path (5%):** Database + AI fallback → ~2s response, ~$0.02 cost
  - **BONUS:** AI results saved to database for next time
  - Same HS code = Fast path on 2nd request (100ms, $0)
- **Cost Trajectory:** Decreases over time as database learns from users

### Validation Flags
- ✅ `mfn_rate === 0` is **VALID** (Free tariff) - don't treat as missing!
- ✅ Use `stale === true` to detect missing data (not rate === 0)
- ✅ `rate_source` tracks provenance: "tariff_intelligence_master" or "ai_fallback"

---

## 📊 THE FAST PATH (What Actually Happens - 95% of Requests)

```
USER SUBMITS (3 components with HS codes)
    ↓
[PHASE 1] enrichFromDatabase() → tariff_intelligence_master (~50ms)
    ├─ Query: SELECT mfn_ad_val_rate, column_2_ad_val_rate, section_301, usmca_ad_val_rate
    ├─ Origin-aware: China uses Column 2 (35%), WTO uses MFN (0-5%)
    └─ Result: enrichedComponents with all tariff rates ✅
    ↓
[CHECKPOINT 1] Validation: missingFromDatabase.length === 0? (Lines 786-821)
    ├─ Fast Path (95%): All found → Skip Phase 3 ✅
    └─ Slow Path (5%): Missing rates → Proceed to Phase 3
    ↓
[PHASE 2] Pre-calculate financials (~10ms)
    ├─ Calculate: Component costs (MFN, Section 301, Column 2)
    ├─ Calculate: Total annual tariff burden
    └─ Output: preCalculatedFinancials
    ↓
[PHASE 3 - SKIP] AI fallback not needed (database had all rates)
    ↓
[SLOW] Call OpenRouter for qualification check (~2000ms)
    ├─ AI Task: "Is 73% >= 65% threshold? Qualified?"
    └─ AI Returns: {qualified: true, preference_criterion: "B"}
    ↓
[FAST] Transform to frontend format (~10ms)
    ├─ Convert percentages → decimals (divide by 100)
    └─ Add rate_source and stale flags
    ↓
RETURN: Complete API response with enriched components
    ↓
Total Time: ~2.2 seconds (mostly waiting for AI qualification check)
```

---

## 🔴 CRITICAL DATA FLOW CHECKPOINTS

### CHECKPOINT 1: Database Enrichment (Lines 535-759)
```
INPUT: 3 components (with HS codes from components page)
  ↓
QUERY: tariff_intelligence_master
  WHERE hts8 = normalize_hs_code(component.hs_code)
  ↓
ORIGIN-AWARE SELECTION:
  if (origin_country === 'CN'):
    mfn_rate = column_2_ad_val_rate  // 35% for China
  else:
    mfn_rate = mfn_ad_val_rate       // 0-5% for WTO countries
  ↓
  section_301 = (origin === 'CN' && destination === 'US') ? 0.60 : 0
  ↓
OUTPUT: enrichedComponents with rates from database
  {
    hs_code: '8542.31.00',
    mfn_rate: 0.35,           // Column 2 rate for China
    section_301: 0.60,        // Policy tariff for CN→US
    usmca_rate: 0,            // Free under USMCA
    rate_source: 'tariff_intelligence_master',
    stale: false
  }
```

**Validation (Lines 786-821):**
```javascript
// ✅ BEST EFFORT: Check stale flag, not mfn_rate === 0
const missingFromDatabase = enrichedComponents.filter(c =>
  c.stale === true || c.rate_source === 'no_data'
);

// ❌ WRONG: Don't check mfn_rate === 0 (Free is valid!)
// const missingFromDatabase = enrichedComponents.filter(c => c.mfn_rate === 0);
```

**Expected:** 95%+ found in database (current Oct 2025 data), <5% need AI fallback

**Note:** Tariff rates change with policy (Section 301 can change with 30-day notice). We use best available data at time of analysis.

---

### CHECKPOINT 2: AI Fallback + Self-Learning Database (Lines 676-860)
```
IF (missingFromDatabase.length > 0):
  ↓
  Call OpenRouter/Anthropic for missing components only (~2s)
  ↓
  Extract: mfn_rate, section_301, section_232, usmca_rate from AI response
  ↓
  💾 SAVE TO DATABASE: Upsert tariff_intelligence_master (grow coverage)
  ↓
  Merge back: enrichedComponents[i] = { ...dbRate, ...aiRate }
  ↓
  Set rate_source: 'ai_research_2025'
  ↓
  NEXT REQUEST: Same HS code hits database (100ms, free!) instead of AI
```

**Self-Learning Behavior (NEW - Oct 28):**
- AI discovers rates for missing HS codes
- Rates automatically saved to tariff_intelligence_master
- Future requests for same HS code hit database (no AI needed)
- **Result:** Database coverage grows from 83% → 100% over time
- **Cost optimization:** AI fallback becomes rarer as users add more products

**Destination-Aware Validation:**
- **US/CA:** Return 400 error if any rates still missing (volatile tariffs)
- **Mexico:** Warn but continue (database cache is reliable)

---

### CHECKPOINT 3: Rate Format Transformation (Lines 1017-1056)
```
INPUT: componentBreakdown (percentages: 35, 60, 0)
  ↓
VALIDATE: Are rates already decimals? (0.35 vs 35)
  if (rate > 0 && rate < 1):
    log "⚠️ Unexpected format - should be percentage"
  ↓
TRANSFORM: Divide by 100 → decimals (0.35, 0.60, 0)
  ↓
OUTPUT: transformedComponents for frontend
  {
    mfnRate: 0.35,    // Decimal format
    section301: 0.60,  // Decimal format
    rate_source: 'tariff_intelligence_master',
    stale: false
  }
```

**Why This Matters (Discovery & What-If Scenarios):**
```javascript
// Frontend shows estimated savings to help SMBs make sourcing decisions:
//
// Example: China component with 95% tariff (35% Column 2 + 60% Section 301)
// Current cost: $1M × 0.95 = $950K/year in tariffs
//
// What-if Mexico sourcing: $1M × 0% (USMCA) = $0/year
// Potential savings: $950K/year
//
// User decides: "Is it worth switching suppliers to save $950K?"
//
// If mfnRate format wrong (35 instead of 0.35): Shows $35M ❌ User gets bad data
// If mfnRate format right (0.35): Shows $350K ✅ User sees real opportunity
```

---

## 📋 DATA FIELD REFERENCE

| Field | Source | Format | Used For | Notes |
|-------|--------|--------|----------|-------|
| `mfn_rate` | tariff_intelligence_master | Decimal (0.35) | Tariff calculation | **China uses Column 2** (35%), WTO uses MFN (0-5%) |
| `column_2_ad_val_rate` | tariff_intelligence_master | Decimal (0.35) | Non-WTO countries | China, Russia, Cuba (83% coverage) |
| `section_301` | tariff_intelligence_master | Decimal (0.60) | Policy warnings | **ADDITIONAL** tariff on top of base (60% for semiconductors) |
| `usmca_rate` | tariff_intelligence_master | Decimal (0.00) | Savings calculation | 100% coverage, mostly Free (0%) |
| `rate_source` | Code | String | Track provenance | "tariff_intelligence_master" or "ai_fallback" |
| `stale` | Code | Boolean | Missing data flag | `true` = missing, `false` = has data (✅ Use this, not `rate === 0`) |
| `preference_criterion` | AI | String (A/B/C/D) | Certificate | Required for qualified products |

---

## 🚨 RISK MATRIX (Oct 28, 2025)

| Area | Risk | Impact | Status | Priority |
|------|------|--------|--------|----------|
| **Database Coverage** | 🟢 LOW | 95%+ fast path | ✅ 12K+ codes + self-learning | ✅ DONE |
| **Origin-Aware Logic** | 🟢 LOW | China uses Column 2 | ✅ Fixed Oct 28 | ✅ DONE |
| **Missing Data Validation** | 🟢 LOW | Destination-aware | ✅ Fixed Oct 27 | ✅ DONE |
| **AI Extraction** | 🟡 MEDIUM | Format dependency | ⚠️ Detectable | P1 |
| **Rate Format** | 🟡 MEDIUM | 100x calc errors | ⚠️ Detected | P1 |
| **AI Timeout** | 🟡 MEDIUM | Slow response (5%) | ⚠️ No timeout | P1 |
| **Rate Source Tracking** | 🟢 LOW | User opacity | ⚠️ Not visible | P2 |
| **Form Validation** | 🟢 LOW | Certificate errors | ✅ Validated | P3 |

---

## 🔧 CRITICAL FIXES APPLIED (Oct 28, 2025)

### Fix 1: Origin-Aware Rate Selection (Lines 622-667)
**Problem:** All components used MFN rate (0%), even China components that should use Column 2 (35%)

**Fix:**
```javascript
// ✅ AFTER: Check origin country first
const isChineseOrigin = component.origin_country === 'CN';
if (isChineseOrigin && column2AdValRate) {
  return parseFloat(column2AdValRate);  // 35% for China
}
return parseFloat(mfnAdValRate);  // 0-5% for WTO
```

**Impact:** China components now show correct 35% base rate + 60% Section 301 = 95% total

---

### Fix 2: Validation Logic (Lines 786-821)
**Problem:** Treated FREE tariffs (0%) as missing data

**Fix:**
```javascript
// ❌ BEFORE: if (mfn_rate === 0) → Thought Free = missing
// ✅ AFTER: if (stale === true) → Correctly identifies missing
const missingFromDatabase = enrichedComponents.filter(c => c.stale === true);
```

**Impact:** Free tariffs (0%) no longer trigger AI fallback

---

### Fix 3: Destination-Aware Error Handling (Lines 679-725)
**Problem:** Silent data loss when rates unavailable

**Fix:**
```javascript
// US/CA: Return 400 error if missing rates (volatile tariffs)
if ((isUSDestination || isCADestination) && missingRates.length > 0) {
  return res.status(400).json({ error: 'tariff_data_unavailable' });
}

// Mexico: Warn but continue (cache is reliable)
if (isMXDestination && missingRates.length > 0) {
  console.warn('⚠️ Mexico destination - continuing');
}
```

**Impact:** No silent data loss on US/CA destinations

---

## 📐 EXAMPLE: Discovery Scenario - Microprocessor from China → USA

**SMB Question:** "I import microprocessors from China. Should I consider USMCA qualification?"

**Our Tool Shows:**

```javascript
// Component Input (Current State - China Sourcing)
{
  description: "Microprocessor",
  hs_code: "8542.31.00",
  origin_country: "CN",
  value_percentage: 35,
  trade_volume: 8500000
}

// Database Lookup Result (tariff_intelligence_master)
{
  hts8: "85423100",
  mfn_ad_val_rate: "0.0000",        // Free for WTO (not applicable for China)
  column_2_ad_val_rate: "0.35",     // 35% for China (non-WTO)
  section_301: "0.60",              // 60% policy tariff for CN→US
  usmca_ad_val_rate: "0.0000"       // Free under USMCA
}

// Origin-Aware Selection (getMFNRate function)
mfn_rate = 0.35  // Uses column_2_ad_val_rate (China origin)

// Financial Calculation
component_value = $8.5M × 35% = $2,975,000
column_2_cost = $2,975,000 × 35% = $1,041,250
section_301_cost = $2,975,000 × 60% = $1,785,000
total_annual_cost = $2,826,250 (95% effective tariff!)

// API Response (transformed for frontend)
{
  description: "Microprocessor",
  hs_code: "8542.31.00",
  origin_country: "CN",
  mfnRate: 0.35,              // Decimal format for frontend
  section301: 0.60,           // Decimal format for frontend
  usmcaRate: 0,
  rate_source: "tariff_intelligence_master",
  stale: false
}

// ===== DISCOVERY INSIGHT =====
// Current annual tariff burden: $2,826,250 (95% effective rate)
//
// What-If Scenario: Source from Mexico instead
// - Mexico USMCA rate: 0% (Free)
// - Section 301: 0% (not applicable for Mexico origin)
// - Estimated annual savings: $2,826,250
//
// User Decision: "Is it worth finding a Mexico supplier to save $2.8M/year?"
// ===== END DISCOVERY INSIGHT =====
```

**Note:** We provide estimated savings based on current tariff data (Oct 2025). User verifies accuracy with customs broker before making sourcing decisions.

---

## 🎯 AGENT CHECKLIST - When Modifying Enrichment Code

**Remember: We're a discovery tool (like TurboTax), not a compliance guarantee.**

### Technical Correctness (Best Effort):
- [ ] **Never assume** database schema - query information_schema.columns first
- [ ] **Use origin-aware logic** - China uses Column 2, WTO uses MFN
- [ ] **Check stale flag** - not `rate === 0` (Free is valid!)
- [ ] **Validate destination** - US/CA strict, Mexico lenient
- [ ] **Track rate_source** - "tariff_intelligence_master" or "ai_fallback"
- [ ] **Transform to decimals** - divide by 100 before sending to frontend

### Discovery & What-If Focus:
- [ ] **Show estimated savings** - Help users see financial opportunity ($X/month, $Y/year)
- [ ] **Enable scenarios** - "What if I sourced from Mexico?" comparisons
- [ ] **Communicate uncertainty** - Tariff policy changes unpredictably (Section 301, etc.)
- [ ] **Empower decisions** - Give users the data, let them verify and decide

### Testing:
- [ ] **Test with China origin** - verify Column 2 rate is used (non-WTO)
- [ ] **Test with Free tariff** - verify 0% is preserved (not flagged as missing)
- [ ] **Test what-if scenario** - verify Mexico sourcing shows USMCA rate (0%)
- [ ] **Test savings display** - verify dollar amounts make sense ($340/month, not $340K)

---

## 📚 FULL DETAILS (If Needed)

For step-by-step visual journey and detailed concerns, see git history:
- **Previous version:** Comprehensive 927-line guide (before Oct 28, 2025)
- **This version:** Condensed agent quick reference (300 lines)

**Philosophy:** Agents need fast lookups, not exhaustive documentation. Details available on request.
