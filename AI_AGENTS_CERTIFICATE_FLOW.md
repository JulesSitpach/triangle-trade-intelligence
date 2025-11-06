# 🤖 AI Agents in Certificate Generation - Complete Flow

**Last Updated:** November 6, 2025
**Status:** Complete documentation of all AI agents and data sources

---

## 🎯 Overview: 3 AI Agents + 2 Data Sources

Your certificate generation uses **3 AI agents** with a **hybrid database-first approach**:

1. **ClassificationAgent** - HS code classification for components
2. **TariffResearchAgent** (inline) - Tariff rates for missing HS codes
3. **USMCAQualificationAgent** (inline) - Final qualification determination

**Data Sources:**
- **Database (Primary)**: `tariff_intelligence_master` (12,118 HS codes from USITC 2025)
- **AI (Fallback)**: OpenRouter → Anthropic for missing data

---

## 📊 Complete Flow: User Input → Certificate PDF

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Component HS Code Classification                             │
│ API: /api/agents/classification                                      │
│ Agent: ClassificationAgent (lib/agents/classification-agent.js)      │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ INPUT: Component description + origin + product context
         ↓
    ┌─────────────────────────────────────┐
    │ ClassificationAgent.suggestHSCode() │
    │ - Model: anthropic/claude-haiku-4.5 │
    │ - Cost: ~$0.01 per component        │
    │ - Speed: ~1-2 seconds               │
    └─────────────────────────────────────┘
         │
         │ AI PROMPT INCLUDES:
         │ - Component description
         │ - Origin country (US/MX/CA/CN/etc)
         │ - Final product context (industry)
         │ - Previously classified components (prevent duplicates)
         │ - CBP General Rule of Interpretation (GRI)
         │
         │ OUTPUT: {
         │   hs_code: "8542.31.00",
         │   description: "Electronic integrated circuits: processors",
         │   confidence: "high",
         │   alternative_classification: {...} // If ambiguous
         │ }
         ↓
    ✅ Component now has HS code

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Tariff Rate Enrichment (Hybrid: Database → AI Fallback)     │
│ API: /api/ai-usmca-complete-analysis                                 │
│ Function: getTariffRatesForComponents() (inline)                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ INPUT: Components with HS codes + destination country
         ↓
    ┌──────────────────────────────────────┐
    │ Query tariff_intelligence_master DB  │
    │ - 12,118 USITC 2025 HTS codes        │
    │ - Includes MFN, Section 301, 232     │
    │ - Response time: 100-200ms           │
    └──────────────────────────────────────┘
         │
         │ DATABASE HIT (95% of requests)?
         ├─YES─► Use database rates (FAST + FREE)
         │
         └─NO──► Missing rates for some components
                 │
                 ↓
            ┌──────────────────────────────────────┐
            │ Call TariffResearchAgent (AI inline) │
            │ - Model: anthropic/claude-haiku-4.5  │
            │ - Cost: ~$0.02 per batch             │
            │ - Speed: ~2-3 seconds                │
            └──────────────────────────────────────┘
                 │
                 │ AI PROMPT INCLUDES:
                 │ - HS code + origin + destination
                 │ - Product description
                 │ - Request: MFN rate, Section 301, Section 232, USMCA rate
                 │
                 │ TIER 1: Try OpenRouter (with retry on 429/529)
                 │ TIER 2: Fallback to Anthropic Direct if OpenRouter fails
                 │ TIER 3: Return empty if both fail (use DB rates only)
                 │
                 │ OUTPUT: [
                 │   {
                 │     hs_code: "8542.31.00",
                 │     mfn_rate: 0.0,
                 │     section_301_rate: 0.25,
                 │     section_232_rate: 0.0,
                 │     total_rate: 0.25,
                 │     usmca_rate: 0.0,
                 │     data_source: "ai_fallback",
                 │     confidence: "medium"
                 │   }
                 │ ]
                 ↓
            ✅ All components have tariff rates

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: USMCA Qualification Determination                            │
│ API: /api/ai-usmca-complete-analysis                                 │
│ Function: buildComprehensiveUSMCAPrompt() → OpenRouter              │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ INPUT: All components + rates + company info + destination
         ↓
    ┌──────────────────────────────────────┐
    │ Get Industry Threshold from Database │
    │ Function: getIndustryThreshold()     │
    │ - Query: industry_thresholds table   │
    │ - Source: STATIC DATABASE VALUES     │
    │ - NOT AI-verified for 2025           │
    └──────────────────────────────────────┘
         │
         │ ⚠️ CURRENT ISSUE: These are hardcoded Oct 2024 values
         │ - Automotive: 75% RVC (static)
         │ - Electronics: 65% RVC (static)
         │ - Other: "General" 60% RVC (static)
         │ - NOT fetched from current USMCA treaty
         ↓
    ┌──────────────────────────────────────┐
    │ Build USMCA Qualification Prompt     │
    │ - Industry threshold (from DB)       │
    │ - Component breakdown with rates     │
    │ - Manufacturing location             │
    │ - Labor credit calculation           │
    │ - Section 301 policy context         │
    └──────────────────────────────────────┘
         │
         │ AI PROMPT INCLUDES:
         │ - "Industry: Electronics (Threshold: 65% RVC per A)" ← FROM DATABASE
         │ - "Manufacturing: MX (Labor credit: 0%)"
         │ - "Trade Flow: CN→US | Annual Volume: $5M"
         │ - "COMPONENTS:
         │    - PCB (25% from CN, MFN: 0%, 301: 25%, Total: 25%)
         │    - Enclosure (15% from MX, MFN: 5.7%, Total: 5.7%)"
         │ - "Regional Content Calculation:
         │    - USMCA Components: 75%
         │    - Manufacturing Labor Credit: 0%
         │    - Total North American Content: 75%
         │    - Required Threshold: 65%"
         │ - "QUALIFIED FOR USMCA?: YES - Meets RVC requirement"
         ↓
    ┌──────────────────────────────────────┐
    │ Call OpenRouter with Retry           │
    │ - Model: anthropic/claude-haiku-4.5  │
    │ - Cost: ~$0.02 per analysis          │
    │ - Speed: ~2-3 seconds                │
    │ - Retries: 3 attempts with backoff   │
    └──────────────────────────────────────┘
         │
         │ OUTPUT: {
         │   usmca: {
         │     qualified: true,
         │     north_american_content: 75,
         │     threshold_applied: 65,
         │     preference_criterion: "B",  // RVC-based
         │     reason: "Qualified with 75% RVC (threshold 65%)"
         │   }
         │ }
         ↓
    ✅ Certificate qualification determined

┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Certificate PDF Generation                                   │
│ Library: lib/utils/usmca-certificate-pdf-generator.js                │
│ Tech: jsPDF (server-side)                                            │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ INPUT: Complete analysis result + user edits
         ↓
    ┌──────────────────────────────────────┐
    │ Generate Official USMCA Form D PDF   │
    │ - NO AI involved (template-based)    │
    │ - Uses jsPDF library                 │
    │ - Matches CBP official format        │
    └──────────────────────────────────────┘
         │
         │ PDF INCLUDES:
         │ - Field 1: Certifier (IMPORTER/EXPORTER/PRODUCER)
         │ - Field 2-4: Exporter/Producer info
         │ - Field 5: Importer info
         │ - Field 6: Product description + HS code
         │ - Field 7: Preference Criterion (A/B/C/D)
         │ - Field 8: Producer info
         │ - Trial watermark (if free user)
         ↓
    ✅ Certificate PDF ready for download
```

---

## 🚨 Current Issues with AI Agents

### 1. **Industry Thresholds are NOT 2025-Current**

**Problem:**
- `getIndustryThreshold()` queries **static database table** (`industry_thresholds`)
- Values like 75% (Automotive), 65% (Electronics), 60% (General) are **hardcoded from Oct 2024**
- **NO AI agent** fetches current 2025 USMCA thresholds from USTR/CBP

**What User Expected:**
- AI agent queries USTR Annex 4-B tables for current RVC thresholds
- Threshold varies by specific HS code (not just industry category)
- Example: Medical Devices (HS 9018) may have different threshold than Toys (HS 9503)

**Current Behavior:**
- "Other" industry → Maps to "General" → 60% RVC (static)
- Medical devices, furniture, toys all get same 60% threshold
- AI is told "Threshold: 60% RVC" and uses that (doesn't verify)

---

### 2. **"Other" Industry Mapping is Broken**

**Problem:**
- Dropdown shows "Other" (from `usmca_qualification_rules` table)
- `industry_thresholds` table has "General", NOT "Other"
- Mapping function returns "Other" as-is (no mapping)
- Database query fails: `No active threshold found for industry_key: Other`

**Impact:**
- 8 out of 15 test cases use "Other"
- All will fail with database error

**Fix Options:**
1. Add "Other" → "General" mapping (quick fix)
2. Create AI agent to fetch HS-specific threshold (correct fix)

---

### 3. **AI Agents Do NOT Fetch Volatile Policy Data**

**What AI Currently Does:**
- ✅ Classifies HS codes (AI-driven, good)
- ✅ Fetches tariff rates if DB missing (AI fallback, good)
- ❌ Uses static DB thresholds (NOT 2025-current)

**What AI SHOULD Do:**
- Fetch current USMCA RVC thresholds from USTR
- Check for 2025 policy updates (USMCA 2026 renegotiation)
- Return HS-specific thresholds, not industry-category guesses

---

## 💡 Recommended AI Agent Architecture

### **New Agent: USMCAThresholdAgent**

```javascript
class USMCAThresholdAgent extends BaseAgent {
  async getCurrentThreshold(hsCode, productCategory) {
    const prompt = `
      You are a USMCA trade policy expert with access to current treaty text.

      TASK: Determine the Regional Value Content (RVC) threshold for:
      - HS Code: ${hsCode}
      - Product Category: ${productCategory}

      DATA SOURCES TO CHECK:
      1. USMCA Annex 4-B (Product-Specific Rules of Origin)
      2. USMCA Chapter 4 (Rules of Origin)
      3. Recent USTR Federal Register notices (2024-2025)

      RETURN JSON:
      {
        "hs_code": "${hsCode}",
        "rvc_threshold_percent": 65,
        "preference_criterion": "B",
        "treaty_article": "Annex 4-B Art. 4.7",
        "calculation_method": "Transaction Value",
        "source": "USMCA Annex 4-B",
        "last_updated": "2025-01-15",
        "confidence": "high"
      }

      If HS code not in Annex 4-B, use default: 62.5% RVC (Article 4.2)
    `;

    // Call AI with retry
    const result = await this.execute(prompt);

    // Cache result in database with timestamp
    await this.cacheThreshold(result);

    return result;
  }

  async cacheThreshold(thresholdData) {
    // Save to database: industry_thresholds_cache table
    // Include timestamp, source, confidence
    // Mark as stale after 30 days
  }
}
```

**Usage:**
```javascript
// BEFORE (static DB)
const threshold = await getIndustryThreshold('Other');
// Returns: { rvc: 60, source: 'database', lastUpdated: 'Oct 2024' }

// AFTER (AI-verified)
const threshold = await USMCAThresholdAgent.getCurrentThreshold('9018.32.00', 'Medical Devices');
// Returns: { rvc: 60, source: 'USMCA Annex 4-B', lastUpdated: 'Jan 2025', confidence: 'high' }
```

---

## 📋 Summary: How Each AI Works

| AI Agent | When It Runs | Input | Output | Cost | Speed |
|----------|-------------|-------|--------|------|-------|
| **ClassificationAgent** | Step 2: Component origins | Component description + context | HS code + confidence | ~$0.01 | 1-2s |
| **TariffResearchAgent** | Step 3: Missing rates | HS code + origin + destination | Tariff rates (MFN/301/232) | ~$0.02 | 2-3s |
| **USMCAQualificationAgent** | Step 4: Final analysis | All data + threshold | Qualification result | ~$0.02 | 2-3s |
| **USMCAThresholdAgent** | ❌ MISSING | HS code + category | Current RVC threshold | ~$0.01 | 1-2s |

**Current Total AI Cost per Certificate:** ~$0.03-$0.05
**With USMCAThresholdAgent:** ~$0.04-$0.06

---

## 🎯 Action Items

1. **Immediate Fix:** Map "Other" → "General" in `mapIndustryToKey()` function
2. **Short-term:** Build `USMCAThresholdAgent` to fetch current 2025 thresholds
3. **Long-term:** Add 30-day cache staleness alerts for admin dashboard

---

**Does this clarify how the AI agents work? Ready to build the USMCAThresholdAgent?**
