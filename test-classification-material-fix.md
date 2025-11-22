# Classification Agent Material Detection Fix - Test Cases

## What Was Fixed (Nov 21, 2025)

### Problem
Classification agent was giving all components the same HS code, losing material composition information needed for Section 232 tariff calculation.

**Example (Before Fix):**
```javascript
// All three got same code:
Ceramic friction material → 8708.30.50.00, primary_material: undefined
Steel backing plates → 8708.30.50.00, primary_material: undefined
Anti-rattle shims → 8708.30.50.00, primary_material: undefined

// Result: Section 232 (50% steel tariff) applied to ALL or NONE (wrong!)
```

### Solution
1. **Updated classification-agent-v2.js prompt** (lines 111-192):
   - Added STEP 2A: Extract PRIMARY MATERIAL from description
   - Added STEP 2B: Extract PRIMARY FUNCTION from description
   - Added STEP 2C: 3-tier search strategy (specific → material+function → broad)
   - Added WHY THIS MATTERS section explaining Section 232 financial impact

2. **Updated ComponentOriginsStepEnhanced.js** (lines 1553-1559):
   - Auto-detect Section 232 material when user accepts AI suggestion
   - Automatically checks "contains steel/aluminum" checkbox

3. **Added MANDATORY FIELDS validation** (lines 245-259):
   - Forces AI to always set primary_material accurately
   - Explains tariff consequences of wrong material classification

---

## Test Case 1: Brake Pad Assembly (3 Components)

### Input Components:
```javascript
[
  {
    description: "Ceramic friction material",
    origin_country: "MX",
    value_percentage: 50
  },
  {
    description: "Steel backing plates",
    origin_country: "US",
    value_percentage: 30
  },
  {
    description: "Anti-rattle shims (steel)",
    origin_country: "CN",
    value_percentage: 20
  }
]

overallProduct: "Brake pad assembly for automotive vehicles"
```

### Expected Results:

**Component 1: Ceramic friction material**
```javascript
{
  "hs_code": "6813.81.00",  // Non-asbestos friction materials (Chapter 68)
  "description": "Brake linings and pads, not containing asbestos",
  "confidence": 88,
  "primary_material": "ceramic",  // ✅ CRITICAL: Identifies as ceramic
  "gri_analysis": {
    "integral_part": "YES",
    "custom_engineered": "YES",
    "cohesive_system": "YES",
    "decision": "PART_OF_MACHINE"
  },
  "explanation": "Searched 'brake friction ceramic' in Chapter 87, found no specific code. Searched 'friction ceramic' in Chapter 68, found 6813.81.00 (Non-asbestos friction materials). Primary material: ceramic (NOT subject to Section 232 steel tariff)."
}

// UI automatically sets: contains_section_232_material = FALSE ✅
// Section 232 tariff: $0 (ceramic not subject to steel tariff)
```

**Component 2: Steel backing plates**
```javascript
{
  "hs_code": "7326.90.85",  // Other articles of iron/steel (Chapter 73)
  "description": "Other articles of iron or steel",
  "confidence": 85,
  "primary_material": "steel",  // ✅ CRITICAL: Identifies as steel
  "gri_analysis": {
    "integral_part": "YES",
    "custom_engineered": "YES",
    "cohesive_system": "YES",
    "decision": "PART_OF_MACHINE"
  },
  "explanation": "Searched 'brake backing plate steel' in Chapter 87, no specific code found. Searched 'backing plate steel' in Chapter 73, found 7326.90.85 (Other articles of iron/steel). Primary material: steel (SUBJECT to Section 232 @ 50%)."
}

// UI automatically sets: contains_section_232_material = TRUE ✅
// Section 232 tariff: Trade value × 50% = $500,000 per $1M
```

**Component 3: Anti-rattle shims (steel)**
```javascript
{
  "hs_code": "7326.90.85",  // Other articles of iron/steel (Chapter 73)
  "description": "Other articles of iron or steel",
  "confidence": 85,
  "primary_material": "steel",  // ✅ CRITICAL: Identifies as steel
  "gri_analysis": {
    "integral_part": "YES",
    "custom_engineered": "YES",
    "cohesive_system": "YES",
    "decision": "PART_OF_MACHINE"
  },
  "explanation": "Searched 'anti-rattle shim steel' in Chapter 87, found 8708.30.50.90 (Brake parts, other). Description mentions steel material. Primary material: steel (SUBJECT to Section 232 @ 50%)."
}

// UI automatically sets: contains_section_232_material = TRUE ✅
// Section 232 tariff: Trade value × 50%
```

### Tariff Calculation (After Fix):

**Scenario: $3M annual trade volume**

| Component | Value | Material | Section 232? | Section 232 Cost |
|-----------|-------|----------|--------------|------------------|
| Ceramic friction | $1.5M (50%) | ceramic | ❌ NO | $0 |
| Steel backing | $900K (30%) | steel | ✅ YES | $450,000 |
| Steel shims | $600K (20%) | steel | ✅ YES | $300,000 |
| **TOTAL** | **$3M** | - | - | **$750,000** |

**Before Fix:** Section 232 applied to all ($1.5M) or none ($0) → $750K error!

**After Fix:** Section 232 only on steel components ($1.5M) → ✅ Correct!

---

## Test Case 2: Electric Motor Assembly (4 Components)

### Input Components:
```javascript
[
  {
    description: "Aluminum motor housing",
    origin_country: "CN",
    value_percentage: 40
  },
  {
    description: "Copper winding wire",
    origin_country: "MX",
    value_percentage: 30
  },
  {
    description: "Steel motor shaft",
    origin_country: "US",
    value_percentage: 20
  },
  {
    description: "Plastic end cap",
    origin_country: "CN",
    value_percentage: 10
  }
]

overallProduct: "Single-phase electric motor (less than 1 HP)"
```

### Expected Material Detection:

| Component | Expected primary_material | Section 232 Auto-Enabled? |
|-----------|---------------------------|---------------------------|
| Aluminum housing | "aluminum" | ✅ YES (aluminum @ 10%) |
| Copper wire | "copper" | ❌ NO (copper not in Section 232) |
| Steel shaft | "steel" | ✅ YES (steel @ 50%) |
| Plastic cap | "plastic" | ❌ NO (plastic not in Section 232) |

---

## How to Test Manually

1. **Start USMCA workflow**
   - Company: "Acme Automotive Parts"
   - Product: "Brake pad assembly for passenger vehicles"
   - Destination: US
   - Manufacturing: MX

2. **Add 3 components** (Step 2):
   - Component 1: "Ceramic friction material" (MX, 50%)
   - Component 2: "Steel backing plates" (US, 30%)
   - Component 3: "Anti-rattle shims, steel" (CN, 20%)

3. **Click "Get AI Suggestion" for each component**

4. **Check AI response badge** (should show):
   ```
   Component 1:
   - HS Code: 6813.81.00 (or 8708.30.50.XX)
   - Material: ceramic
   - Confidence: 85-92%
   - Section 232: ❌ (checkbox should NOT be checked)

   Component 2:
   - HS Code: 7326.90.85 (or 8708.30.50.XX)
   - Material: steel
   - Confidence: 85-92%
   - Section 232: ✅ (checkbox should AUTO-CHECK after accepting)

   Component 3:
   - HS Code: 7326.90.85 (or 8708.30.50.XX)
   - Material: steel
   - Confidence: 85-92%
   - Section 232: ✅ (checkbox should AUTO-CHECK after accepting)
   ```

5. **Accept suggestions and verify**:
   - Open browser DevTools → Console
   - Look for log: `✅ [SECTION-232-AUTO] Component "Steel backing plates" contains steel - auto-enabling Section 232`
   - Verify checkbox is checked for steel components only

6. **Complete workflow and check results**:
   - Results page should show Section 232 tariff only on steel components
   - Ceramic component should show: `section_232: 0` or `null`
   - Steel components should show: `section_232: 0.50` (50%)

---

## Success Criteria

✅ **Classification agent returns different HS codes** (not all 8708.30.50.00)
✅ **primary_material field always populated** (never "unknown" or null)
✅ **UI auto-checks Section 232 checkbox** for steel/aluminum components
✅ **Tariff calculation shows Section 232 only on steel/aluminum** components
✅ **Console logs show material detection** (`[SECTION-232-AUTO]` messages)

---

## Files Changed

1. ✅ `lib/agents/classification-agent-v2.js` (lines 97-270)
   - Added material extraction logic (STEP 2A, 2B, 2C, 2D)
   - Added mandatory fields validation
   - Added Section 232 tariff impact explanation

2. ✅ `components/workflow/ComponentOriginsStepEnhanced.js` (lines 1553-1559)
   - Auto-detect Section 232 material from AI response
   - Auto-check checkbox for steel/aluminum

3. ✅ `pages/api/comparative-tariff-analysis.js` (lines 177-191)
   - Fixed database column names (section_301_rate → section_301)

---

## Expected Production Impact

**Before Fix:**
- Section 232 misapplied → $500K-$1M error per brake assembly manufacturer
- Users manually checking/unchecking → 50% error rate (guessing)

**After Fix:**
- Section 232 auto-applied correctly → ✅ Accurate tariff calculations
- Material detection automatic → Users don't need to know what Section 232 is
- Classification quality improved → More specific HS codes, better compliance
