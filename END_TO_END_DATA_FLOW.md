# TRIANGLE COMPLETE DATA FLOW - VISUAL

## 🚀 THE JOURNEY: User Input → PDF Download

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STEP 1: USER SUBMITS FORM                               │
│                    (components/workflow/CompanyInformationStep.js)               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FORM DATA                                                                       │
│  ├─ company_name: "TechFlow Electronics"                                        │
│  ├─ destination_country: "US"                                                   │
│  ├─ trade_volume: "$8,500,000"                                                  │
│  └─ component_origins: [                                                        │
│      { description: "Microprocessor", origin_country: "CN", value_percentage: 35 } │
│      { description: "Capacitors", origin_country: "US", value_percentage: 30 }  │
│      { description: "Connectors", origin_country: "MX", value_percentage: 35 }  │
│    ]                                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                    ⏱️  POSTED TO API: /api/ai-usmca-complete-analysis
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│              STEP 2: ENRICHMENT - ADD TARIFF RATES FROM DATABASE                │
│            (Line 346-427 in ai-usmca-complete-analysis.js)                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ enrichComponentsWithFreshRates()  → Query tariff_rates_cache for each component  │
│                                                                                   │
│ INPUT: 3 components (no tariff rates yet)                                        │
│                                                                                   │
│ FOR EACH COMPONENT:                                                              │
│  1. Check if HS code exists → "8542.31.00" ✓                                    │
│  2. Query: SELECT mfn_rate, section_301, section_232 FROM tariff_rates_cache   │
│     WHERE hs_code='8542.31.00' AND destination_country='US'                     │
│  3. Get result: {                                                                │
│       mfn_rate: 2.5,                                                             │
│       section_301: 25.0,          ← CHINA TARIFF                                │
│       section_232: 0,                                                            │
│       usmca_rate: 0                                                              │
│     }                                                                             │
│                                                                                   │
│ OUTPUT: enrichedComponents (3 components with rates added) ✅                    │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 3: PRE-CALCULATE FINANCIAL DATA                               │
│            (Lines 449-518 in ai-usmca-complete-analysis.js)                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Calculate BEFORE sending to AI (saves AI tokens):                                │
│                                                                                   │
│ Trade Volume: $8,500,000                                                         │
│                                                                                   │
│ Component-Level Financials:                                                      │
│  ├─ Microprocessor (CN, 35%):                                                   │
│  │   Component Value: $8.5M × 35% = $2,975,000                                  │
│  │   MFN Cost: $2,975,000 × 2.5% = $74,375                                      │
│  │   Section 301 Cost: $2,975,000 × 25% = $743,750                              │
│  │   Subtotal: $818,125/year                                                    │
│  │                                                                                │
│  ├─ Capacitors (US, 30%):                                                       │
│  │   Component Value: $8.5M × 30% = $2,550,000                                  │
│  │   MFN Cost: $2,550,000 × 0% = $0                                             │
│  │   Section 301 Cost: $0 (US origin)                                            │
│  │   Subtotal: $0/year                                                           │
│  │                                                                                │
│  └─ Connectors (MX, 35%):                                                       │
│      Component Value: $8.5M × 35% = $2,975,000                                  │
│      MFN Cost: $2,975,000 × 1.2% = $35,700                                      │
│      Section 301 Cost: $0 (MX origin)                                            │
│      Subtotal: $35,700/year                                                     │
│                                                                                   │
│ TOTALS:                                                                          │
│  ├─ Total Annual MFN Cost: $110,075                                              │
│  ├─ Total Section 301 Burden: $743,750                                           │
│  └─ Total Annual Savings (if qualified): $110,075 × USMCA rates = TBD           │
│                                                                                   │
│ OUTPUT: preCalculatedFinancials = {                                              │
│   trade_volume: 8500000,                                                         │
│   annual_tariff_savings: 0,  ← Will be calculated in AI based on USMCA rates   │
│   section_301_exposure: {                                                        │
│     is_exposed: true,                                                            │
│     annual_cost_burden: 743750,  ← SECTION 301 BURDEN                           │
│     affected_components: ["Microprocessor (CN)"]                                │
│   }                                                                               │
│ }                                                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 4: BUILD AI PROMPT & SEND TO OPENROUTER                       │
│        (Lines 521-565 in ai-usmca-complete-analysis.js)                         │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ buildComprehensiveUSMCAPrompt() creates prompt with:                             │
│                                                                                   │
│ PROMPT CONTENTS:                                                                 │
│  ├─ Industry & Thresholds                                                        │
│  │  └─ Electronics: 65% RVC required                                             │
│  │                                                                                │
│  ├─ Enriched Components (WITH TARIFF RATES):                                    │
│  │  ├─ Microprocessor (8542.31.00) - CN, 35%                                    │
│  │  │  └─ MFN: 2.5%, Section 301: 25%, USMCA: 0%                               │
│  │  ├─ Capacitors (US) - US, 30%                                                 │
│  │  │  └─ MFN: 0%, Section 301: 0%, USMCA: 0%                                   │
│  │  └─ Connectors (MX) - MX, 35%                                                 │
│  │     └─ MFN: 1.2%, Section 301: 0%, USMCA: 0%                                │
│  │                                                                                │
│  ├─ Pre-calculated Regional Content:                                             │
│  │  ├─ USMCA Component %: 65% (US 30% + MX 35%)                                 │
│  │  ├─ Manufacturing Labor: 8%                                                   │
│  │  └─ Total NA Content: 73% ✅ MEETS 65% THRESHOLD                              │
│  │                                                                                │
│  └─ Financial Impact (from pre-calculation):                                     │
│     ├─ Section 301 exposure: $743,750/year ⚠️                                    │
│     ├─ Affected: Microprocessor (Chinese origin)                                │
│     └─ Strategic Option: Mexico nearshoring ($3,500/year cost, 3-month payback)│
│                                                                                   │
│ AI TASK:                                                                         │
│  → Verify: Does product qualify? (73% >= 65%?)                                  │
│  → Determine: Preference Criterion (A/B/C/D)                                    │
│  → Classify: Product HS code (finished product, not components)                 │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                        📤 SEND PROMPT TO OPENROUTER
                        Model: claude-haiku-4.5
                        Max Tokens: 2000
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 5: PARSE AI RESPONSE                                           │
│            (Lines 579-687 in ai-usmca-complete-analysis.js)                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ AI Returns (valid JSON):                                                         │
│ {                                                                                 │
│   "product": {                                                                   │
│     "hs_code": "8517.62.00",  ← Finished product classification                 │
│     "description": "Electronic control units",                                   │
│     "confidence_score": 0.92                                                     │
│   },                                                                              │
│   "usmca": {                                                                     │
│     "qualified": true,              ✅ QUALIFIED!                                │
│     "north_american_content": 73,   ✅ 73% >= 65% THRESHOLD                     │
│     "threshold_applied": 65,        ✅ Electronics industry standard              │
│     "preference_criterion": "B",    ✅ RVC-based (most common)                   │
│     "reason": "Qualified with 73% RVC (Electronics threshold: 65%)"              │
│   }                                                                               │
│ }                                                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 6: ENRICH COMPONENTS & BUILD FINAL RESPONSE                   │
│        (Lines 750-1030 in ai-usmca-complete-analysis.js)                        │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ enrichComponentsWithTariffRates() - Extract rates from AI calculation_detail     │
│                                                                                   │
│ FOR EACH COMPONENT, search AI's calculation_detail for:                          │
│  "1. Microprocessor (8542.31.00, 35%) ... MFN rate: 2.5% ... Section 301: 25%"  │
│   ↓                                                                               │
│  Extract: mfn_rate=2.5, section_301=25, usmca_rate=0                            │
│   ↓                                                                               │
│  Add to component: {                                                              │
│    description: "Microprocessor",                                                │
│    mfn_rate: 2.5,         ← EXTRACTED FROM AI                                   │
│    section_301: 25,       ← EXTRACTED FROM AI                                   │
│    usmca_rate: 0,         ← EXTRACTED FROM AI                                   │
│    total_rate: 27.5,      ← CALCULATED (2.5 + 25 + 0)                           │
│    savings_percentage: 0  ← CALCULATED (no USMCA rate available yet)            │
│  }                                                                                │
│                                                                                   │
│ Result: enrichedComponents (WITH ALL TARIFF FIELDS) ✅                          │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 7: TRANSFORM COMPONENTS FOR FRONTEND                          │
│      (Lines 784-830 in ai-usmca-complete-analysis.js)                           │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ transformAPIToFrontend() converts percentage format to decimal:                  │
│                                                                                   │
│ INPUT (Percentages from AI/Database):                                            │
│  mfn_rate: 2.5                ← percentage                                       │
│  section_301: 25              ← percentage                                       │
│                                                                                   │
│ OUTPUT (Decimals for Frontend):                                                  │
│  mfnRate: 0.025               ← decimal (dividing by 100)                       │
│  section301: 0.25             ← decimal (dividing by 100)                       │
│                                                                                   │
│ WHY? Frontend does: tariff_cost = componentValue × mfnRate                      │
│  If mfnRate = 2.5 (wrong): cost = 1,000,000 × 2.5 = $2,500,000 ❌              │
│  If mfnRate = 0.025 (right): cost = 1,000,000 × 0.025 = $25,000 ✅             │
│                                                                                   │
│ Result: transformedComponents (CORRECT FORMAT FOR FRONTEND) ✅                  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 8: BUILD FINAL RESPONSE JSON                                   │
│        (Lines 833-1062 in ai-usmca-complete-analysis.js)                        │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ FINAL API RESPONSE STRUCTURE:                                                    │
│                                                                                   │
│ {                                                                                 │
│   "success": true,                                                               │
│   "company": {                                                                   │
│     "name": "TechFlow Electronics",                                              │
│     "country": "US",                  ← CRITICAL FOR CERTIFICATE!                │
│     "destination_country": "US",                                                 │
│     "tax_id": "12-3456789"                                                       │
│   },                                                                              │
│   "usmca": {                                                                     │
│     "qualified": true,                ✅ QUALIFIED                               │
│     "north_american_content": 73,                                                │
│     "threshold_applied": 65,                                                     │
│     "preference_criterion": "B",      ✅ REQUIRED FOR CERTIFICATE                │
│     "component_breakdown": [          ← ENRICHED COMPONENTS WITH RATES          │
│       {                                                                           │
│         "description": "Microprocessor",                                         │
│         "hs_code": "8542.31.00",                                                │
│         "origin_country": "CN",                                                 │
│         "mfnRate": 0.025,             ← DECIMAL FORMAT FOR FRONTEND              │
│         "section301": 0.25,           ← DECIMAL FORMAT FOR FRONTEND              │
│         "usmcaRate": 0,                                                          │
│         "rate_source": "ai_extracted",                                           │
│         "stale": false                                                           │
│       },                                                                          │
│       { ... 2 more components ... }                                              │
│     ]                                                                             │
│   },                                                                              │
│   "savings": {                        ← FINANCIAL IMPACT                         │
│     "annual_savings": 110075,                                                    │
│     "monthly_savings": 9173,                                                     │
│     "savings_percentage": 1.29,                                                  │
│     "section_301_exposure": {         ← POLICY RISK                              │
│       "is_exposed": true,                                                        │
│       "annual_cost_burden": 743750,   ← POLICY TARIFF (separate from USMCA)     │
│       "affected_components": ["Microprocessor (CN)"]                            │
│     }                                                                             │
│   },                                                                              │
│   "certificate": {                    ← ONLY IF QUALIFIED                        │
│     "qualified": true,                                                           │
│     "preference_criterion": "B",                                                 │
│     "blanket_start": "2025-10-27",                                               │
│     "blanket_end": "2026-10-27"                                                  │
│   }                                                                               │
│ }                                                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                            📊 RESPONSE SENT TO FRONTEND
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 9: FRONTEND DISPLAYS RESULTS                                   │
│         (components/workflow/WorkflowResults.js)                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ DISPLAYS:                                                                        │
│                                                                                   │
│ ✅ QUALIFIED FOR USMCA PREFERENTIAL TREATMENT                                    │
│                                                                                   │
│ Component Breakdown:                                                              │
│  ├─ Microprocessor (CN, 35%): 2.5% MFN, 25% Section 301 → $818,125/year        │
│  ├─ Capacitors (US, 30%): 0% MFN → $0/year                                      │
│  └─ Connectors (MX, 35%): 1.2% MFN → $35,700/year                               │
│                                                                                   │
│ RVC Analysis: 73% (exceeds 65% threshold by 8%)                                  │
│                                                                                   │
│ Financial Impact:                                                                 │
│  ├─ Annual Tariff Savings: $110,075 (USMCA vs MFN)                              │
│  └─ ⚠️ Section 301 Burden: $743,750/year (CANNOT be eliminated by USMCA)       │
│                                                                                   │
│ Strategic Option:                                                                 │
│  Mexico nearshoring eliminates Section 301 (3-month payback)                    │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 10: USER REVIEWS & DOWNLOADS CERTIFICATE                      │
│       (components/workflow/EditableCertificatePreview.js)                        │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ EDITABLE CERTIFICATE PREVIEW:                                                    │
│                                                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐          │
│ │         CERTIFICATE OF ORIGIN - USMCA FORM D                         │          │
│ ├─────────────────────────────────────────────────────────────────────┤          │
│ │ Box 1: TechFlow Electronics (EDITABLE)                              │          │
│ │ Box 2: Importer (EDITABLE)                                          │          │
│ │ Box 3: Product: Electronic control units (EDITABLE)                │          │
│ │ Box 4: Description: HS Code 8517.62.00 (EDITABLE)                 │          │
│ │                                                                      │          │
│ │ Components:                                                          │          │
│ │  [+] Microprocessor | 8542.31.00 | CN | 35% | [DELETE] (EDITABLE)  │          │
│ │  [+] Capacitors | ... (EDITABLE)                                    │          │
│ │  [+] Connectors | ... (EDITABLE)                                    │          │
│ │                                                                      │          │
│ │ Box 17: Certification:                                              │          │
│ │  I certify that the information provided is accurate ☑              │          │
│ │  I accept responsibility for accuracy ☑                             │          │
│ │                                                                      │          │
│ │ ⚠️ WARNING: You are responsible for accuracy. Platform provides     │          │
│ │    tools only. Consult trade attorney if uncertain.                 │          │
│ └─────────────────────────────────────────────────────────────────────┘          │
│                                                                                   │
│ User edits all fields to match their records ✏️                                 │
│ User checks both responsibility boxes ☑️                                         │
│ User clicks "Download Certificate"                                               │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│              STEP 11: CLIENT-SIDE PDF GENERATION                                │
│         (html2pdf.js library in browser)                                         │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ handleDownloadPDF():                                                              │
│                                                                                   │
│ 1. Capture DOM: Get <div id="certificate-preview-for-pdf">                      │
│    ↓                                                                              │
│ 2. Convert HTML → PDF using html2pdf.js library                                 │
│    ↓                                                                              │
│ 3. Apply options:                                                                │
│    - Margin: 10mm                                                                │
│    - Format: Letter (8.5" × 11")                                                 │
│    - Orientation: Portrait                                                       │
│    - Quality: JPEG 0.98                                                          │
│    ↓                                                                              │
│ 4. Save as: USMCA-Certificate-2025-10-27.pdf                                   │
│    ↓                                                                              │
│ 5. Browser downloads file to user's computer ⬇️                                 │
│                                                                                   │
│ ✅ PDF MATCHES PREVIEW EXACTLY                                                   │
│ ✅ ALL USER EDITS INCLUDED                                                       │
│ ✅ READY FOR CUSTOMS BROKER                                                      │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                       📥 USER HAS CERTIFICATE PDF
                            (Ready for shipment)
```

---

## 🔴 CRITICAL DATA FLOW POINTS

### **Point 1: Database Enrichment (Line 346-427)**
```
INPUT:  3 components (NO tariff rates)
   ↓
QUERY: tariff_rates_cache for MFN, Section 301, Section 232
   ↓
OUTPUT: enrichedComponents (WITH tariff rates)
   ↓
PURPOSE: Get current 2025 rates BEFORE calling AI
```

### **Point 2: Financial Pre-Calculation (Line 449-518)**
```
INPUT:  enrichedComponents (with rates)
   ↓
CALCULATE: Component-level costs (MFN cost, Section 301 burden, etc)
   ↓
OUTPUT: preCalculatedFinancials (annual savings, policy exposure)
   ↓
PURPOSE: Send AI pre-calculated numbers (saves tokens + faster response)
```

### **Point 3: AI Prompt Construction (Line 521-533)**
```
INPUT:  enrichedComponents + preCalculatedFinancials
   ↓
BUILD:  Comprehensive prompt with ALL tariff data visible to AI
   ↓
OUTPUT: Prompt that says "73% >= 65% QUALIFIED" (AI verifies, doesn't calculate)
   ↓
PURPOSE: AI just confirms qualification, doesn't do heavy math
```

### **Point 4: AI Response (Line 579-687)**
```
INPUT:  AI response (JSON)
   ↓
PARSE:  Extract {qualified, preference_criterion, north_american_content}
   ↓
OUTPUT: analysis object
   ↓
PURPOSE: Get YES/NO + criterion + product classification from AI
```

### **Point 5: Component Enrichment FROM AI (Line 750-778)**
```
⚠️ CRITICAL BUG LOCATION!

INPUT:  enrichedComponents (already has rates from DB)
        + AI response (may or may not have calculation_detail with rates)
   ↓
EXTRACT: Try to pull mfn_rate, section_301 from AI's calculation_detail
   ↓
PROBLEM: If AI calculation_detail is vague, extraction FAILS
   ↓
RESULT: enrichedComponents stays with DB rates ✅ (GOOD - has backup data)
         OR tries to merge AI rates (RISKY - might override DB data)
```

### **Point 6: Transform to Frontend Format (Line 784-830)**
```
INPUT:  enrichedComponents (percentages: 2.5, 25, 0)
   ↓
TRANSFORM: Divide by 100 → decimals (0.025, 0.25, 0)
   ↓
OUTPUT: transformedComponents (decimals ready for frontend)
   ↓
VALIDATION: Both required fields present?
   ├─ rate_source: "ai_extracted" or "database_cache" ✅
   └─ stale: true/false ✅
```

### **Point 7: Final Response Assembly (Line 833-1030)**
```
INPUT:  transformedComponents + AI analysis + preCalculatedFinancials
   ↓
COMBINE:
   ├─ company (from form)
   ├─ usmca (from AI + DB)
   ├─ savings (from pre-calculation + AI)
   ├─ component_origins (from enrichment)
   └─ certificate (template for download)
   ↓
OUTPUT: Complete API response sent to frontend
   ↓
FRONTEND RECEIVES: Everything needed to:
   ├─ Display component table with tariff rates
   ├─ Calculate savings
   ├─ Populate certificate form
   └─ Enable PDF download
```

---

## 🎯 WHERE DATA IS CREATED, USED, AND LOST

| Data Field | Created | Source | Used | Lost? |
|---|---|---|---|---|
| `mfn_rate` | enrichedComponents | `tariff_rates_cache` | Component breakdown, savings calc | ❌ Preserved |
| `section_301` | enrichedComponents | `tariff_rates_cache` | Policy warnings, financial impact | ❌ Preserved |
| `usmca_rate` | enrichedComponents | `tariff_rates_cache` | Savings calculation | ⚠️ Sometimes 0 |
| `rate_source` | enrichedComponents | Code: "database_cache" | Track data provenance | ✅ Included in response |
| `stale` | enrichedComponents | Code: `!rateData` | Show staleness warnings | ✅ Included in response |
| `preference_criterion` | AI response | OpenRouter | Certificate form | ❌ Preserved |
| `north_american_content` | AI response | OpenRouter | RVC display | ❌ Preserved |
| `component_breakdown` | transformedComponents | enrichedComponents + transform | API response | ❌ Preserved |

---

## ⚡ THE FAST PATH (What Actually Happens)

```
USER SUBMITS
    ↓
[FAST] Database lookup: tariff_rates_cache (instant)
    ↓
[FAST] Pre-calculate financials (local math, no AI)
    ↓
[SLOW] Call OpenRouter: "Is this qualified? Yes/No"
    ↓
[FAST] Extract response + build result object
    ↓
[FAST] Transform + return to frontend
    ↓
Total Time: ~2-3 seconds (mostly waiting for OpenRouter)
```

**Why fast?** No enrichComponentsWithTariffIntelligence() second AI call. Database handles it.

---

## 🚨 WHAT CAN BREAK THIS FLOW

1. **Database tariff_rates_cache is empty or stale**
   - Result: enrichedComponents has 0 rates
   - Fix: RSS feeds should update this every 2 hours

2. **AI says "qualified" but no preference_criterion**
   - Result: Cannot generate certificate (validation error on line 706-720)
   - Fix: AI prompt ensures criterion is returned

3. **transformedComponents is empty**
   - Result: Frontend shows "No tariff data available"
   - Fix: enrichedComponents must populate before transform

4. **company.country is NULL**
   - Result: Certificate generation fails (required field)
   - Fix: Form validation on line 281-313 prevents this

5. **mfn_rate is percentage (2.5) instead of decimal (0.025)**
   - Result: Frontend calculates savings 100x too large
   - Fix: transformAPIToFrontend() divides by 100

