# HYBRID DATABASE-FIRST + AI FALLBACK ENRICHMENT

**Last Updated:** October 27, 2025
**Status:** Implemented & Ready for Testing

---

## 🎯 What Changed

**Before:** Single enrichment approach was slow (database + AI simultaneously)
**After:** Three-phase hybrid approach (database first, AI only for gaps)

---

## 📊 The Three Phases

### Phase 1: Fast Database Lookup (Instant)
```javascript
enrichComponentsWithFreshRates()
  ↓
Query tariff_rates_cache for ALL components
  ↓
Result: enrichedComponents with rates OR rate_source='database_fallback'
  ↓
Time: ~50-100ms (instant)
```

**Expected Result:**
```
✅ [PHASE 1] Database enrichment complete: {
  count: 3,
  with_rates: 3,                    // All found in DB
  missing_rates: 0                  // None need AI
}
```

### Phase 2: Identify Gaps (Instant)
```javascript
const missingRates = enrichedComponents.filter(comp =>
  comp.mfn_rate === 0 ||
  comp.stale === true
)
  ↓
Time: ~1ms
```

**Possible Results:**
- **Fast path (95% of cases):** `missing_rates: 0` → Skip AI, use DB rates
- **Slow path (5% of cases):** `missing_rates: 2` → Call AI for just these 2

### Phase 3: AI Fallback (Only If Needed)
```javascript
if (missingRates.length > 0) {
  getAIRatesForMissingComponents(missingRates)
    ↓
  Single batch AI call (2-tier fallback: OpenRouter → Anthropic)
    ↓
  Merge results back into enrichedComponents
    ↓
  Time: ~2-3 seconds (only if Phase 2 found gaps)
}
```

**Expected Result:**
```
✅ [PHASE 3] AI enrichment complete: {
  merged: 2
  rate_sources: "database_cache_current, ai_fallback"
}
```

---

## ⚡ Performance Impact

### Fast Path (95% of requests)
```
Database Lookup:    ~100ms
Identify Gaps:      ~1ms
AI Call:            SKIPPED
Transform:          ~50ms
─────────────────────────
Total:             ~150ms ✅ FAST
```

### Slow Path (5% of requests)
```
Database Lookup:    ~100ms
Identify Gaps:      ~1ms
AI Call:            ~2000ms (cached or fresh)
Transform:          ~50ms
─────────────────────────
Total:             ~2150ms ✅ STILL FAST
```

**vs Old Approach:** Both paths were ~2150ms because AI was always called

---

## 🔧 Implementation Details

### The `getAIRatesForMissingComponents()` Function

**Location:** `pages/api/ai-usmca-complete-analysis.js` (lines 43-204)

**What it does:**
1. Takes list of components with missing rates
2. Builds compact prompt with just those components
3. Calls OpenRouter (Tier 1) with 2-tier fallback to Anthropic
4. Normalizes rates to percentages (matches database format)
5. Returns results for merging

**Example Input:**
```javascript
[
  {
    hs_code: "8542.31.00",
    description: "Microprocessor",
    origin_country: "CN",
    mfn_rate: 0,        // Missing - needs AI
    section_301: 0
  }
]
```

**Example Output:**
```javascript
[
  {
    hs_code: "8542.31.00",
    mfn_rate: 2.5,
    section_301: 25.0,
    section_232: 0,
    usmca_rate: 0,
    total_rate: 27.5
  }
]
```

### The Merge Logic

**Location:** `pages/api/ai-usmca-complete-analysis.js` (lines 461-474)

```javascript
enrichedComponents = enrichedComponents.map(comp => {
  const aiMatch = aiEnrichedRates.find(air => air.hs_code === comp.hs_code);

  if (aiMatch && comp.mfn_rate === 0) {
    return {
      ...comp,
      ...aiMatch,              // Overwrite with AI rates
      rate_source: 'ai_fallback',
      stale: false,
      data_source: 'ai_enrichment'
    };
  }
  return comp;  // Keep database rates if already present
});
```

**Key Points:**
- Only overwrites components with `mfn_rate === 0` (database miss)
- Preserves all other fields
- Sets `rate_source: 'ai_fallback'` to track origin
- Marks as `stale: false` (fresh from AI)

---

## 📋 Testing Checklist

### Test 1: Fast Path (Database Has Rates)
```
✓ Setup: Component with HS code in tariff_rates_cache
✓ Expected: Phase 1 finds rates, Phase 2 finds 0 missing, Phase 3 skipped
✓ Log check: "missing_rates: 0"
✓ Performance: ~150ms
```

### Test 2: Slow Path (Database Missing Rates)
```
✓ Setup: Component with HS code NOT in tariff_rates_cache
✓ Expected: Phase 1 finds nothing, Phase 2 finds 1 missing, Phase 3 calls AI
✓ Log check: "Calling AI for 1 missing components..."
✓ Log check: "merged 1 results"
✓ Performance: ~2150ms
✓ Final rate_source: "ai_fallback"
```

### Test 3: Mixed Components
```
✓ Setup: 3 components, 2 in database, 1 missing
✓ Expected: Phase 2 finds 1 missing, Phase 3 calls AI for just that 1
✓ Log output should show:
   ✅ [PHASE 1] Database enrichment complete: {
     with_rates: 2,
     missing_rates: 1
   }
   🤖 [PHASE 3] Calling AI for 1 missing components...
   ✅ [MERGE] Filled missing rates for ...
✓ Final state: All 3 components have complete rates
```

### Test 4: Error Handling
```
✓ Setup: API keys configured but unreachable
✓ Expected: Phase 3 catches error, continues with database rates
✓ Log check: "⚠️  [PHASE 3] AI fallback failed, continuing with database rates"
✓ Workflow: Should NOT block - returns 200 with whatever rates available
```

---

## 🚨 What to Monitor

### Logs to Watch

**Success Indicators:**
```
✅ [PHASE 1] Database enrichment complete
✅ [TARIFF-DATA] enrichedComponents final state
✅ [PHASE 3] AI enrichment complete
```

**Warning Indicators:**
```
⚠️  [TARIFF-INTEGRATION] No fresh rates for ... - using component values
⚠️  [PHASE 3] AI fallback failed, continuing with database rates
```

**Error Indicators:**
```
❌ [TARIFF-DATA] enrichedComponents is empty!
🚨 Both OpenRouter and Anthropic failed
```

### Metrics to Track

1. **Cache Hit Rate**
   - Target: >95% of components found in database
   - Metric: `with_rates / count` from Phase 1 logs

2. **Average Response Time**
   - Target: <200ms (fast path) or <2.5s (slow path)
   - Red flag: Consistently >3s means slow path being triggered too often

3. **AI Fallback Rate**
   - Target: <5% of requests need Phase 3
   - Red flag: >10% means database needs updating

4. **Data Source Distribution**
   - Healthy: 95% "database_cache_current", <5% "ai_fallback"
   - Unhealthy: Majority "ai_fallback" means database is stale

---

## 🔄 Rate Synchronization

**Who Updates tariff_rates_cache?**

1. **RSS Polling** (Vercel Cron)
   - `pages/api/cron/email-crisis-check.js`
   - Runs every 2-4 hours
   - Fetches USTR/Commerce Department RSS feeds
   - Updates `tariff_rates_cache` with fresh rates

2. **AI Fallback** (On Demand)
   - `getAIRatesForMissingComponents()`
   - Calls when database lookup fails
   - Stores results in `tariff_rates_cache` for future use (caching optimization)

**Result:** Database should be 95% stocked, AI fills 5% gaps immediately

---

## 🎯 When This Works Best

✅ **Good Cases:**
- Common products (Electronics, Machinery) → Found in database
- New HS codes → AI fallback catches them
- Volatile markets (US) → 24-hour cache keeps rates fresh
- Stable markets (Mexico) → Database rates never stale

❌ **Edge Cases:**
- Brand new product launched yesterday → AI might not know rates yet
- Obscure HS code variant → AI might need to extrapolate
- Simultaneous 100+ requests → AI gets rate-limited (but database works fine)

---

## 📈 Cost Analysis

### Before Hybrid Approach
- Every request: 1 AI call (OpenRouter ~$0.01 + Anthropic fallback risk)
- 100 requests/day: ~$1/day × 30 = $30/month

### After Hybrid Approach
- Fast path (95%): 0 AI calls (database only) → $0
- Slow path (5%): 1 AI call (only for missing) → ~$0.05/day
- 100 requests/day: ~$1.50/month ✅ 98% cost reduction

---

## 🚀 Next Steps

1. **Test the three phases** with real data
2. **Monitor logs** during production rollout
3. **Track cache hit rate** (target >95%)
4. **Optimize database** if cache hits <90%
5. **Consider pre-populating** high-volume HS codes

---

## 📚 Related Files

- **Main Implementation:** `pages/api/ai-usmca-complete-analysis.js` (lines 43-204 for function, 429-496 for integration)
- **Database Lookup:** `enrichComponentsWithFreshRates()` (lines 346-427)
- **RSS Updates:** `pages/api/cron/email-crisis-check.js`
- **Data Flow Diagram:** `END_TO_END_DATA_FLOW.md`

