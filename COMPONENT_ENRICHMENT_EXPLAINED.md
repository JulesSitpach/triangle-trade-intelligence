# 🔍 Component Enrichment - What It Does

**Last Updated:** November 6, 2025
**Purpose:** Explain how components get tariff rates (NOT an AI agent, it's a database lookup function)

---

## ❌ Common Misconception

**There is NO "Enrichment Agent"** - this is a database lookup function, not an AI agent.

The term "enrichment" refers to **adding tariff rate data** to components that only have basic info (description, origin, HS code).

---

## 🎯 What Is Component Enrichment?

Component enrichment is the process of taking a **basic component** and adding **complete tariff rate data** to it.

### **BEFORE Enrichment** (User Input):
```javascript
{
  description: "PCB Board",
  origin_country: "CN",
  hs_code: "8542.31.00",
  value_percentage: 25
}
```

### **AFTER Enrichment** (Ready for AI Analysis):
```javascript
{
  description: "PCB Board",
  origin_country: "CN",
  hs_code: "8542.31.00",
  value_percentage: 25,

  // ✅ ADDED BY ENRICHMENT:
  mfn_rate: 0.0,              // Most Favored Nation base rate (from USITC database)
  base_mfn_rate: 0.0,         // Original MFN before policy adjustments
  section_301: 0.25,          // China tariffs (25%)
  section_232: 0.0,           // Steel/aluminum tariffs (0% for electronics)
  total_rate: 0.25,           // Sum of all tariffs
  usmca_rate: 0.0,            // Rate if USMCA-qualified (duty-free)
  savings_amount: 125000,     // Annual savings if qualified ($500K × 25%)
  rate_source: "tariff_intelligence_master",  // Where data came from
  data_source: "tariff_intelligence_master"
}
```

---

## 🔄 How Enrichment Works (3-Phase Hybrid System)

### **Phase 1: Database Lookup (95% of components)**

```javascript
async function enrichComponentsWithFreshRates(components, destinationCountry) {
  // For each component with HS code:

  // 1. Query tariff_intelligence_master table (12,118 USITC codes)
  const { data: rateData } = await supabase
    .from('tariff_intelligence_master')
    .select('*')
    .eq('hs_code', normalizedHSCode)
    .single();

  if (rateData) {
    // ✅ DATABASE HIT - Use these rates (FREE, <100ms)
    return {
      mfn_rate: rateData.mfn_ad_val_rate,
      section_301: rateData.section_301,
      section_232: rateData.section_232,
      // ... etc
    };
  }

  // 2. If not in master table, check tariff_rates_cache (user-generated cache)
  const { data: cacheData } = await supabase
    .from('tariff_rates_cache')
    .select('*')
    .eq('hs_code', normalizedHSCode)
    .single();

  if (cacheData) {
    // ✅ CACHE HIT - Use these rates (FREE, <100ms)
    return { ...cacheData };
  }

  // ❌ DATABASE MISS - Mark component as needing AI lookup
  return {
    mfn_rate: 0,
    stale: true,  // Flag for Phase 2 AI fallback
    data_source: 'no_data'
  };
}
```

### **Phase 2: AI Fallback (5% of components)**

If component missing from database:

```javascript
const missingFromDatabase = enrichedComponents.filter(c => c.stale === true);

if (missingFromDatabase.length > 0) {
  // Call TariffResearchAgent (inline AI function)
  const aiRates = await getTariffRatesForComponents(missingFromDatabase, destination);

  // AI returns:
  // [{
  //   hs_code: "9999.99.99",
  //   mfn_rate: 0.057,
  //   section_301: 0.25,
  //   confidence: "medium"
  // }]

  // Merge AI rates back into components
  enrichedComponents = enrichedComponents.map(c => {
    const aiRate = aiRates.find(r => r.hs_code === c.hs_code);
    return aiRate ? { ...c, ...aiRate, rate_source: 'ai_fallback' } : c;
  });
}
```

### **Phase 3: USMCA Qualification AI**

Once all components have rates, send to final AI for qualification:

```javascript
// Build prompt with enriched components
const prompt = buildComprehensiveUSMCAPrompt(formData, enrichedComponents);

// AI receives:
// "COMPONENTS:
//  - PCB Board (25% from CN, MFN: 0%, 301: 25%, Total: 25%)
//  - Enclosure (15% from MX, MFN: 5.7%, Total: 5.7%)"

// AI returns qualification decision
```

---

## 📊 Enrichment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER INPUT: Component with HS code                                   │
│ { description: "PCB", origin: "CN", hs_code: "8542.31.00" }         │
└─────────────────────────────────────────────────────────────────────┘
         │
         ↓
    ┌────────────────────────────────────────┐
    │ Phase 1: Database Enrichment           │
    │ Function: enrichComponentsWithFreshRates│
    └────────────────────────────────────────┘
         │
         ├─ Query tariff_intelligence_master (12,118 codes)
         │  ↓
         │  DATABASE HIT? (95% of requests)
         │  ↓ YES
         │  Return: {
         │    mfn_rate: 0.0,
         │    section_301: 0.25,
         │    section_232: 0.0,
         │    usmca_rate: 0.0,
         │    rate_source: "tariff_intelligence_master"
         │  }
         │  ↓
         │  ✅ ENRICHMENT COMPLETE (FREE, <100ms)
         │
         ├─ Query tariff_rates_cache (user-generated)
         │  ↓
         │  CACHE HIT?
         │  ↓ YES
         │  Return cached rates
         │  ↓
         │  ✅ ENRICHMENT COMPLETE (FREE, <100ms)
         │
         └─ DATABASE MISS? (5% of requests)
            ↓ YES
            Mark: { stale: true, data_source: "no_data" }
            ↓
       ┌────────────────────────────────────────┐
       │ Phase 2: AI Fallback                   │
       │ Function: getTariffRatesForComponents  │
       └────────────────────────────────────────┘
            │
            ├─ Call OpenRouter (Tier 1)
            │  Model: claude-haiku-4.5
            │  Prompt: "Return current 2025 tariff rates for HS 8542.31.00"
            │  Cost: ~$0.02
            │  ↓
            │  SUCCESS?
            │  ↓ YES
            │  Return: {
            │    mfn_rate: 0.0,
            │    section_301: 0.25,
            │    confidence: "high",
            │    rate_source: "ai_fallback"
            │  }
            │  ↓
            │  ✅ ENRICHMENT COMPLETE (~$0.02, 2-3s)
            │
            ├─ Fallback to Anthropic Direct (Tier 2)
            │  If OpenRouter fails
            │  ↓
            │  SUCCESS?
            │  ↓ YES
            │  ✅ ENRICHMENT COMPLETE (~$0.02, 2-3s)
            │
            └─ Both AI Failed? (Tier 3)
               ↓
               Return: { mfn_rate: 0, rate_source: "fallback_failed" }
               ⚠️ ENRICHMENT INCOMPLETE (but workflow continues)
```

---

## 🗂️ Data Sources for Enrichment

### **1. tariff_intelligence_master (Primary)**
- **Size:** 12,118 HS codes from USITC 2025
- **Covers:** ~95% of common imports
- **Freshness:** Updated quarterly from USITC official schedule
- **Speed:** <100ms (database query)
- **Cost:** FREE

**What It Contains:**
```sql
SELECT
  hs_code,
  mfn_ad_val_rate,        -- Base MFN duty rate
  section_301,            -- China tariffs (25%)
  section_232,            -- Steel/aluminum tariffs
  usmca_ad_val_rate,      -- USMCA preferential rate
  hts_description         -- Official HTS description
FROM tariff_intelligence_master
WHERE hs_code = '8542.31.00';
```

### **2. tariff_rates_cache (Secondary)**
- **Size:** User-generated (grows over time)
- **Covers:** HS codes not in master table but requested by users
- **Freshness:** Varies (cached from AI calls)
- **Speed:** <100ms (database query)
- **Cost:** FREE (using cached AI result)

### **3. policy_tariffs_cache (Volatile Overrides)**
- **Size:** Small (<100 codes)
- **Purpose:** Override Section 301/232 rates when policies change
- **Freshness:** 7-30 days (AI-verified)
- **Use Case:** China tariffs change frequently, need fresh values

### **4. AI Fallback (OpenRouter → Anthropic)**
- **Covers:** HS codes missing from all database tables (~5%)
- **Freshness:** Current 2025 rates (queried from AI knowledge)
- **Speed:** 2-3 seconds
- **Cost:** ~$0.02 per component

---

## 💡 Why Enrichment Matters

### **Without Enrichment:**
```javascript
// Component sent to AI:
"PCB Board (25% from CN)"

// AI has to guess:
// - What's the MFN rate? (unknown)
// - Is there Section 301? (unknown)
// - What are savings? (can't calculate)
```

### **With Enrichment:**
```javascript
// Component sent to AI:
"PCB Board (25% from CN, MFN: 0%, Section 301: 25%, Total: 25%)"

// AI knows exactly:
// - Base rate: 0% (duty-free electronics)
// - Policy adjustment: +25% (China origin)
// - Total exposure: 25%
// - Savings if USMCA: $125K ($500K × 25%)
```

---

## 🎯 Key Takeaways

1. **Enrichment is NOT an AI agent** - it's a database lookup function
2. **95% enrichment is FREE** - from database (tariff_intelligence_master)
3. **5% enrichment costs $0.02** - AI fallback for missing HS codes
4. **Result: Complete tariff data** - AI can calculate accurate savings
5. **Hybrid approach** - Database-first with AI fallback (best of both)

---

## 🔗 Related Documentation

- `AI_AGENTS_CERTIFICATE_FLOW.md` - See "STEP 2: Tariff Rate Enrichment"
- `pages/api/ai-usmca-complete-analysis.js:670` - enrichComponentsWithFreshRates() function
- `pages/api/ai-usmca-complete-analysis.js:54` - getTariffRatesForComponents() AI fallback

---

**Bottom Line:** Enrichment adds tariff rates to components so the AI can calculate accurate USMCA qualification and savings. It's 95% database lookups (FREE + fast) with 5% AI fallback for missing codes.
