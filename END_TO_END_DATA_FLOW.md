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
│         STEP 2: HYBRID ENRICHMENT - DATABASE-FIRST + AI FALLBACK               │
│   PHASE 1 (Lines 429-496): Database lookup for all components                  │
│   PHASE 2 (Lines 661-681): Validation checkpoint 1 - detect missing rates      │
│   PHASE 3 (Lines 454-481): AI fallback for components missing database data    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: enrichComponentsWithFreshRates() - FAST DATABASE LOOKUP (~100ms)       │
│                                                                                   │
│ INPUT: 3 components (no tariff rates yet)                                        │
│                                                                                   │
│ FOR EACH COMPONENT:                                                              │
│  1. Check if HS code exists → "8542.31.00" ✓                                    │
│  2. Query: SELECT mfn_rate, section_301, section_232 FROM tariff_rates_cache   │
│     WHERE hs_code='8542.31.00' AND destination_country='US'                     │
│  3. Result scenarios:                                                            │
│     ✅ FOUND: {mfn_rate: 2.5, section_301: 25, stale: false}                   │
│     ⚠️  MISS: {mfn_rate: 0, rate_source: 'database_fallback', stale: true}     │
│                                                                                   │
│ OUTPUT: enrichedComponents (some with rates, some with 0 rates)                 │
│                                                                                   │
│ Expected: 95% of components found in database ✅                                │
│ Fallback: 5% will have mfn_rate === 0 and need Phase 3 AI lookup               │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ VALIDATION CHECKPOINT 1: Verify enrichedComponents have rates (Lines 661-681)│
│                                                                                   │
│ CHECK: Filter components with mfn_rate === 0 or stale === true                 │
│                                                                                   │
│ SCENARIOS:                                                                       │
│ ✅ Fast Path (95%): missingRates.length === 0                                   │
│    → Skip Phase 3, use database rates                                            │
│    → Continue to pre-calculation                                                 │
│                                                                                   │
│ ⚠️  Slow Path (5%): missingRates.length > 0                                     │
│    → Log which components are missing                                            │
│    → Proceed to Phase 3 for AI fallback                                          │
│                                                                                   │
│ LOG OUTPUT:                                                                      │
│   ✅ [PHASE 1] Database enrichment complete: {with_rates: 3, missing_rates: 0}  │
│   ⏱️  [PHASE 2] Identifying missing rates: 0 components need AI lookup          │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                   (IF missingRates.length > 0, proceed to Phase 3)
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: getAIRatesForMissingComponents() - AI FALLBACK (~2000ms, only if needed)│
│                                                                                   │
│ INPUT: Only components with mfn_rate === 0 (e.g., 0-5 components out of 3)    │
│                                                                                   │
│ PROCESS:                                                                         │
│  1. Build compact batch prompt with ONLY missing components                      │
│  2. Call OpenRouter (Tier 1) with 2-tier fallback to Anthropic (Tier 2)        │
│  3. Extract tariff rates from AI response                                        │
│  4. Normalize to percentages (match database format)                             │
│  5. Return results                                                               │
│                                                                                   │
│ MERGE BACK:                                                                      │
│  For each component with mfn_rate === 0:                                         │
│    enrichedComponents[i] = {                                                     │
│      ...enrichedComponents[i],                                                   │
│      ...aiResult,                  ← Overwrite with AI rates                     │
│      rate_source: 'ai_fallback',  ← Track that AI filled the gap                │
│      stale: false                 ← Fresh from AI                                │
│    }                                                                              │
│                                                                                   │
│ OUTPUT: enrichedComponents (now ALL have rates, 100% complete)                  │
│                                                                                   │
│ LOG OUTPUT (only if Phase 3 runs):                                               │
│   🤖 [PHASE 3] Calling AI for 1 missing components...                           │
│   ✅ [MERGE] Filled missing rates for 8542.31.00: MFN 2.5%, Section 301 25%     │
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

### **Point 5: Component Enrichment FROM AI (Line 332-444)**
```
🛡️ VALIDATION CHECKPOINT 2: Only use AI rates if database rates are missing

INPUT:  enrichedComponents (already has rates from DB)
        + AI response (may or may not have calculation_detail with rates)
   ↓
VALIDATE: Check if component already has mfn_rate > 0
   ↓
SCENARIOS:
   ✅ SKIP (if has DB rate): Keep database rate, skip extraction
      → log: "[FALLBACK-SKIP] Component already has database rate"

   ⚠️  EXTRACT (if missing): Try to pull mfn_rate, section_301 from AI
      → log: "[FALLBACK-EXTRACT] Extracting rates..."
   ↓
EXTRACTION:
   ✅ SUCCESS: Extracted mfn_rate, section_301 from AI response
      → log: "[FALLBACK-SUCCESS] Filled missing rates"
      → Set rate_source: 'ai_fallback'

   ❌ MISS: Could not extract rates from AI response
      → log: "[FALLBACK-MISS] Could not extract rates"
      → Keep existing 0 rates (component remains incomplete)
   ↓
RESULT: enrichedComponents with rates ONLY from successful sources
```

### **Point 6: Transform to Frontend Format (Line 1017-1056)**
```
🛡️ VALIDATION CHECKPOINT 3: Verify rates are percentages before transformation

INPUT:  componentBreakdown (should be percentages: 2.5, 25, 0)
   ↓
VALIDATE: Check if rates look like decimals (0.025, 0.25) instead of percentages
   ↓
CHECK LOGIC:
   IF rate > 0 AND rate < 1:
      → Likely a decimal (WRONG FORMAT - should be 25, not 0.25)
      → log: "⚠️  [VALIDATION] unexpected rate format"
      → Log to DevIssue for investigation
   ↓
TRANSFORM: If format is correct, divide by 100 → decimals (0.025, 0.25, 0)
   ↓
OUTPUT: transformedComponents (decimals ready for frontend)
   ↓
VALIDATION: Both required fields present after transformation?
   ├─ rate_source: "ai_extracted", "database_cache", or "ai_fallback" ✅
   └─ stale: true/false ✅

WHY THIS MATTERS:
   Frontend calculates: tariff_cost = componentValue × mfnRate
   If mfnRate = 2.5 (wrong):  cost = 1,000,000 × 2.5 = $2,500,000 ❌ 100x too large!
   If mfnRate = 0.025 (right): cost = 1,000,000 × 0.025 = $25,000 ✅ Correct
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

## 🚨 AREAS OF CONCERN & CRITICAL FAILURE POINTS

### **CONCERN 1: Database Cache Dependency (PHASE 1 - Lines 429-496)**
**Risk Level:** 🔴 **HIGH** - Single point of failure for 95% of requests

**Problem:**
- System expects tariff_rates_cache to have current 2025 rates
- 95% of requests succeed ONLY if database has data
- If database is stale or empty, Phase 1 returns components with mfn_rate=0
- Fallback to Phase 3 AI adds 2+ seconds to response

**Current Status:**
- ✅ Phase 1 validates database lookup success
- ✅ Phase 3 AI fallback exists for cache misses
- ⚠️ RSS feeds update database (need verification: are they running?)
- ⚠️ No automatic cache refresh if older than 24 hours

**Action Required:**
- [ ] Verify RSS polling cron job is running (`pages/api/cron/email-crisis-check.js`)
- [ ] Check tariff_rates_cache table last_updated timestamps
- [ ] If cache older than 24 hours → trigger manual update

---

### **CONCERN 2: AI Extraction from Vague Responses (STEP 6 - Lines 332-444)**
**Risk Level:** 🟡 **MEDIUM** - AI response format might change

**Problem:**
- enrichComponentsWithTariffRates() uses regex to extract rates from AI's calculation_detail
- If AI changes response format, extraction fails silently
- Components stay with 0 rates instead of failing loudly
- Frontend shows incomplete data without warning

**Current Status:**
- ✅ Validation Checkpoint 2 detects missing rates after extraction
- ✅ Logs show [FALLBACK-SKIP] vs [FALLBACK-EXTRACT] tracking
- ⚠️ Regex patterns are fragile (depends on AI wording)
- ⚠️ No test coverage for extraction accuracy

**Example of Format Dependency:**
```
AI must say: "MFN rate: 25%"
If AI says: "Tariff: 25% (MFN)" → Extraction fails ❌
If AI says: "Duties before USMCA: 25%" → Extraction fails ❌
```

**Action Required:**
- [ ] Test AI extraction with various response formats
- [ ] Add unit tests for extractComponentRate() function
- [ ] Consider switching to structured AI responses (JSON only, no text)

---

### **CONCERN 3: Hybrid Enrichment Merge Logic (PHASE 3 - Lines 461-474)**
**Risk Level:** 🟡 **MEDIUM** - Complex state management

**Problem:**
- Phase 1 returns components with some rates from DB, some zeros
- Phase 3 merges AI results back with exact logic: `if (mfnRate === 0) overwrite`
- If component has mfn_rate: 0.01 (from malformed DB entry), merge won't happen
- Multiple data sources (DB + AI) create data consistency issues

**Current Status:**
- ✅ Merge logic is explicit (only overwrites when mfn_rate === 0)
- ✅ rate_source field tracks which rates come from which source
- ⚠️ No validation that merged rates are sensible (could be AI hallucinations)
- ⚠️ No atomic transaction (could fail between phase 1 and phase 3)

**Action Required:**
- [ ] Add post-merge validation (rates within expected ranges)
- [ ] Add test case: 1 component from DB + 1 from AI + 1 with 0 rates
- [ ] Monitor rate_source distribution in production logs

---

### **CONCERN 4: Rate Format Validation (VALIDATION CHECKPOINT 3 - Lines 1017-1046)**
**Risk Level:** 🟡 **MEDIUM** - Silent 100x calculation errors

**Problem:**
- If rates accidentally get converted to decimals early (0.025 instead of 2.5)
- Validation catches the error but transformation still proceeds
- Frontend receives wrong format, calculates 100x too large
- 🛡️ **Checkpoint 3 now detects this** but doesn't auto-fix

**Current Status:**
- ✅ Validation Checkpoint 3 detects format anomalies
- ✅ Logs warn when rates look like decimals
- ✅ DevIssue logged for investigation
- ⚠️ Workflow doesn't BLOCK on format errors (just warns)
- ⚠️ Frontend has no validation of received rates

**Example:**
```
Component arrives at frontend with:
  mfnRate: 2.5        ← Expected (percentage)
  mfnRate: 0.025      ← WRONG (decimal)

Frontend does: $1M × 0.025 = $25K ✅ Correct
Frontend does: $1M × 2.5 = $2.5M ❌ 100x error

Checkpoint 3 would catch: mfnRate is between 0-1, log warning
But workflow continues anyway
```

**Action Required:**
- [ ] Frontend should validate rates are >= 0 (reject values like 2.5 if expecting decimals)
- [ ] Add unit test: component with wrong rate format should be caught
- [ ] Consider failing loud instead of just warning

---

### **CONCERN 5: Missing Data After Enrichment (VALIDATION CHECKPOINT 1 - Lines 665-726)**
**Risk Level:** 🔴 **HIGH** - Data loss prevention with destination-aware strategy
**Status:** ✅ **FIXED (Oct 27, 2025 - Commit 3116f51)**

**Problem (Original):**
- Checkpoint 1 detects if components have missing rates AFTER Phase 1
- But workflow continues even with missing rates
- Components with mfn_rate=0 proceed to pre-calculation
- Financial calculations happen with 0 rates (costs all show $0)
- Users might not realize data is incomplete

**Solution Implemented:**
Added **destination-aware validation logic** that:
1. **US/CA destinations (STRICT)**: Return 400 error if any rates missing
   - Reason: Volatile tariffs change with policy (Section 301, etc.)
   - Error includes: missing HS codes, recovery instructions, retry guidance
   - Log: `[P0-BLOCKER] Cannot proceed without tariff data for US/CA destination`

2. **Mexico destination (LENIENT)**: Warn but continue
   - Reason: Database cache is reliable for Mexico (stable rates)
   - Log: `[P0-WARNING] Mexico destination - continuing with N components`
   - Workflow proceeds normally with whatever data available

**Code Changes (Lines 679-725):**
```javascript
// Destination-aware error handling
const isUSDestination = formData.destination_country === 'US';
const isCADestination = formData.destination_country === 'CA';
const isMXDestination = formData.destination_country === 'MX';

// STRICT: US/CA markets require current tariff data
if ((isUSDestination || isCADestination) && missingRatesAfterPhase3.length > 0) {
  return res.status(400).json({
    success: false,
    error: 'tariff_data_unavailable',
    message: `Unable to retrieve current tariff rates for ${count} component(s).`,
    details: {
      missing_components: [{ hs_code, description, action: 'Verify HS code format (10-digit)' }],
      suggestion: 'Check internet connection and try again in a few minutes.'
    }
  });
}

// LENIENT: Mexico workflow continues (cache is reliable)
if (isMXDestination && missingRatesAfterPhase3.length > 0) {
  console.warn(`⚠️ Mexico destination - continuing with ${count} components`);
}
```

**Current Status (After Fix):**
- ✅ Checkpoint 1 detects missing rates
- ✅ Destination-aware validation (strict vs lenient)
- ✅ Returns 400 error with actionable recovery steps for US/CA
- ✅ User-facing error message included
- ✅ Missing HS codes shown for verification
- ✅ All scenarios logged to DevIssue dashboard

**Tested Scenarios:**
```
Fast Path (95%): missingRates.length === 0 ✅
  → All rates available, continue normally

Slow Path (5%): missingRates.length > 0 after Phase 3
  US/CA: Returns 400 error ✅ Prevents silent data loss
  Mexico: Warns but continues ✅ Allows workflow to proceed
```

**Impact:**
- ✅ Eliminates silent data loss on volatile markets (US tariffs)
- ✅ Clear error messaging for users (not silent 0% fallback)
- ✅ Mexico operations unaffected (can proceed with cache)
- ✅ All edge cases logged for monitoring

**Remaining Actions:**
- [ ] Monitor P0-BLOCKER and P0-WARNING logs in production
- [ ] Track how often users hit the 400 error (should be <1%)
- [ ] If >1%: indicates cache needs updating, RSS polling issue

---

### **CONCERN 6: AI Fallback (PHASE 3) Timeout/Failure (Lines 43-204)**
**Risk Level:** 🟡 **MEDIUM** - API dependency

**Problem:**
- Phase 3 calls OpenRouter (Tier 1) with 2-second timeout
- If OpenRouter fails, falls back to Anthropic Direct
- If both fail, returns empty array and continues
- No maximum timeout - could hang indefinitely if both APIs down

**Current Status:**
- ✅ 2-tier fallback exists (OpenRouter → Anthropic)
- ✅ Error is caught and logged
- ⚠️ No timeout specified for Anthropic fallback
- ⚠️ No circuit breaker (could retry immediately after failure)
- ⚠️ If both APIs unavailable, requests slow down but don't fail clearly

**Action Required:**
- [ ] Add 5-second timeout for Anthropic fallback
- [ ] Implement exponential backoff if both fail (don't retry Phase 3 for 60s)
- [ ] Return explicit error if Phase 3 is needed but both AI endpoints fail
- [ ] Add monitoring: track Phase 3 success rate (should be >99%)

---

### **CONCERN 7: Rate Source Tracking (Throughout - rate_source field)**
**Risk Level:** 🟢 **LOW** - Well-tracked but needs monitoring

**Problem:**
- Components can have different rate_source values: database_cache, ai_fallback, incomplete
- Frontend needs to understand what each means
- No documentation visible to users

**Current Status:**
- ✅ rate_source clearly logged at each step
- ✅ Validation checkpoints track transitions
- ✅ DevIssue logs anomalies
- ⚠️ Frontend doesn't display data provenance
- ⚠️ Users don't know if rates are fresh or stale

**Action Required:**
- [ ] Add data freshness badge to component table (e.g., "From database" vs "From AI")
- [ ] Display staleness warning if stale === true
- [ ] Document what each rate_source means for users

---

### **CONCERN 8: Form Validation (Before API Call - Lines 281-331)**
**Risk Level:** 🟢 **LOW** - Well-defended but depends on frontend

**Problem:**
- API validates required fields, but frontend sends form
- If frontend validation broken, API catches it
- Missing company_country would break certificate generation

**Current Status:**
- ✅ API validates 14 required fields
- ✅ Clear error messages returned
- ✅ Frontend should also validate (belt-and-suspenders)
- ⚠️ Unclear which validation is primary (frontend vs API)

**Action Required:**
- [ ] Document validation split: frontend (UX) vs API (security)
- [ ] Add test: submit form without company_country, verify API error

---

## 📊 QUICK RISK MATRIX

| Area | Risk | Impact | Status | Fix Priority |
|------|------|--------|--------|--------------|
| Database Cache | 🔴 HIGH | 95% of requests slow | ⚠️ Depends on RSS | P0 |
| AI Extraction | 🟡 MEDIUM | Data loss if format changes | ⚠️ Detectable | P1 |
| Merge Logic | 🟡 MEDIUM | Data inconsistency | ✅ Tracked | P2 |
| Rate Format | 🟡 MEDIUM | 100x calculation errors | ✅ Detected | P1 |
| Missing Data | 🔴 HIGH | Silent data loss to users | ✅ **FIXED** (Oct 27) | ✅ DONE |
| AI Timeout | 🟡 MEDIUM | Slow response | ⚠️ No timeout | P1 |
| Rate Source | 🟢 LOW | Opacity to users | ⚠️ Not visible | P2 |
| Form Validation | 🟢 LOW | Broken certificates | ✅ Validated | P3 |

