# USMCA Workflow Architecture - AI vs Local Calculation

## ❌ MISCONCEPTION: "AI does USMCA analysis"

**WRONG:** You do NOT send USMCA qualification to OpenRouter
**CORRECT:** USMCA qualification is calculated locally using math

---

## ✅ ACTUAL ARCHITECTURE

### Step 1: Product Classification (Optional - can use AI)
- **File:** `handleProductClassificationStep()`
- **Method:** Can use AI for HS code lookup
- **Input:** Product description
- **Output:** HS code

### Step 2: USMCA Qualification ⭐ **NO AI - LOCAL CALCULATION**
- **File:** `lib/core/database-driven-usmca-engine.js`
- **Method:** Mathematical calculation using config file
- **Logic:**

```javascript
// Step 2A: Get threshold from config file (NOT AI)
const { getUSMCAThreshold } = await import('../../config/usmca-thresholds.js');
const thresholdData = await getUSMCAThreshold(businessType, hsCode);
// Returns: 55% for Textiles, 60% for Machinery, 65% for Electronics, 75% for Automotive

// Step 2B: Calculate regional content (NOT AI)
function calculateRegionalContent(componentOrigins, usmcaCountries, rules) {
  // 1. Calculate total value
  const totalValue = componentOrigins.reduce((sum, comp) =>
    sum + (comp.value_percentage || 0), 0
  );

  // 2. Calculate North American value
  const northAmericanValue = componentOrigins
    .filter(comp => usmcaCountries.includes(comp.origin_country))  // MX, US, CA
    .reduce((sum, comp) => sum + (comp.value_percentage || 0), 0);

  // 3. Calculate percentage
  const northAmericanPercentage = (northAmericanValue / totalValue) * 100;

  // 4. Compare to threshold
  const threshold = rules.regional_content_threshold;
  const qualified = northAmericanPercentage >= threshold;

  return { qualified, northAmericanPercentage, threshold };
}
```

### Step 3: Tariff Savings Calculation **NO AI - LOCAL CALCULATION**
- **File:** `handleTariffSavingsStep()`
- **Method:** Database lookup for tariff rates
- **Logic:** `(MFN_rate - USMCA_rate) × trade_volume`

### Step 4: Generate Recommendations ⭐ **ONLY AI STEP**
- **File:** `generateWorkflowRecommendations()`
- **Method:** OpenRouter API call
- **When:** ONLY if `usmca.qualified === false`
- **Purpose:** Generate product-specific remediation advice

---

## 🤖 THE ONLY AI PROMPT (For Recommendations Only)

**Location:** `pages/api/database-driven-usmca-compliance.js` line 759

**Prompt Structure:**
```javascript
const prompt = `You are a USMCA compliance expert. Generate 3-4 specific, actionable recommendations for this company to achieve USMCA qualification.

COMPANY CONTEXT:
- Business Type: ${formData.business_type || 'Unknown'}
- Product: ${formData.product_description || 'Unknown product'}
- HS Code: ${product.hs_code || 'Not classified'}
- Manufacturing Location: ${formData.manufacturing_location || 'Unknown'}

CURRENT STATUS:
- USMCA Qualified: NO
- North American Content: ${usmca.north_american_content?.toFixed(1) || 0}%
- Required Threshold: ${usmca.threshold_applied || 0}%
- Gap: ${(usmca.threshold_applied - usmca.north_american_content)?.toFixed(1) || 0}% short

COMPONENT BREAKDOWN:
${componentBreakdown}

INSTRUCTIONS:
- Be specific to this product type (don't give generic advice)
- Identify which specific non-USMCA components to replace
- Suggest specific USMCA countries or regions for sourcing
- If textiles: mention yarn-forward rule and fabric sourcing
- If electronics: mention specific component manufacturers in Mexico/US
- If automotive: mention specific automotive supplier hubs
- Keep each recommendation under 15 words
- Return ONLY the recommendations as a JSON array of strings, no other text

Example output format:
["Replace India fabric supplier with Mexico textile mills", "Source cotton from US or Canadian suppliers", "Consider yarn-forward rule compliance for textiles"]`;
```

**IMPORTANT:** This prompt is ONLY called AFTER:
1. ✅ Threshold already determined (from config file)
2. ✅ Regional content already calculated (locally)
3. ✅ Qualification already determined (qualified = true/false)
4. ✅ Gap already calculated (threshold - current content)

**AI does NOT calculate anything. It only suggests how to close the gap.**

---

## 🔍 WHERE YOUR BUG ACTUALLY IS

Since USMCA qualification is calculated locally, the bug is in one of these places:

### Option 1: Config File Returns Wrong Threshold
**File:** `config/usmca-thresholds.js`
**Check:** Does `getUSMCAThreshold('Machinery & Equipment')` return 60%?

### Option 2: Component Data Not Reaching Calculation
**File:** `handleUSMCAQualificationStep()`
**Check:** Is `formData.component_origins` being passed correctly?

### Option 3: USMCA Countries Array Wrong
**File:** `database-driven-usmca-engine.js`
**Check:** Does `usmcaCountries.includes('MX')` return true?

### Option 4: Calculation Logic Error
**File:** `calculateRegionalContent()`
**Check:** Is the math correct? Is the >= comparison backwards?

---

## 🎯 WHAT YOU SHOULD SEE IN CONSOLE

When you run the workflow, the debug logging will show:

```
✅ ========== USMCA QUALIFICATION STEP ==========
Input to USMCA engine: {
  hsCode: "8471.30",
  businessType: "Machinery & Equipment",
  componentOrigins: [
    { origin_country: "CN", value_percentage: 60 },
    { origin_country: "MX", value_percentage: 40 }
  ]
}

🧮 ========== CALCULATING REGIONAL CONTENT ==========
📦 Component Origins received: [
  { index: 1, origin_country: "CN", value_percentage: 60, is_usmca: false },
  { index: 2, origin_country: "MX", value_percentage: 40, is_usmca: true }
]
➕ Total value percentage: 100
🇺🇸🇲🇽🇨🇦 North American value: 40
📊 North American percentage: 40.00%
🎯 Threshold from config file: 60%    <-- THIS IS THE KEY!
✓ Qualified? false

📊 USMCA Qualification Result: {
  qualified: false,
  threshold_applied: 60,
  north_american_content: 40,
  rule: "Regional Value Content (60% required)",
  reason: "Product does not meet required 60% North American content threshold."
}
```

**If the threshold shows 62.5% instead of 60%, the config file is not being read correctly.**

---

## ❌ THERE IS NO "AI PROMPT FOR USMCA ANALYSIS"

You asked: "Show me the EXACT prompt sent to OpenRouter for USMCA analysis"

**Answer:** There isn't one. USMCA qualification is calculated locally using:
1. Config file for threshold (fixed values)
2. Math for regional content calculation
3. Simple comparison (content >= threshold)

The ONLY AI call is for generating remediation recommendations AFTER the local calculation determines the product is not qualified.

---

## 🔧 NEXT STEP

Run your workflow and **send me the console output** showing:
1. `🎯 Threshold from config file:` - Is it 60% for Machinery?
2. `📦 Component Origins received:` - Are components categorized correctly?
3. `📊 North American percentage:` - Is the math correct?
4. `✓ Qualified?` - Is the comparison logic correct?

One of those 4 things is wrong, and the console will show which one.
