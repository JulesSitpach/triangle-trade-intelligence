# Debug Logging Added - Complete Data Flow Trace

**Status:** ✅ Comprehensive logging added at all 8 critical points

---

## What Was Added

I've added detailed console logging to trace the complete data flow from user input to AI analysis. Here's what you'll see in your browser console when you run the workflow:

### 1. **Step 2 Submit (ComponentOriginsStepEnhanced)**
```
🚀 ========== STEP 2 SUBMIT: COMPONENT DATA ==========
📦 Component Data Being Submitted: {
  component_count: 3,
  components: [
    { index: 1, description: "...", origin_country: "...", value_percentage: ..., hs_code: "..." },
    { index: 2, description: "...", origin_country: "...", value_percentage: ..., hs_code: "..." },
    { index: 3, description: "...", origin_country: "...", value_percentage: ..., hs_code: "..." }
  ],
  total_percentage: 100
}
🏢 Company Data from formData: {
  company_name: "...",
  business_type: "...",
  trade_volume: "...",
  product_description: "...",
  manufacturing_location: "..."
}
```

### 2. **Workflow State (useWorkflowState)**
```
⚙️ ========== PROCESS WORKFLOW CALLED ==========
📋 formData received by useWorkflowState: {
  company_name: "...",
  business_type: "...",
  component_origins_count: 3,
  component_origins: [...]
}
✅ Validation passed, calling workflow service...
```

### 3. **Service Layer (workflow-service.js)**
```
🌐 ========== WORKFLOW SERVICE: API REQUEST ==========
📤 Data being sent to API: {
  company_name: "...",
  business_type: "...",
  component_origins_count: 3,
  component_origins: [...]
}
```

### 4. **API Endpoint Receives Request**
```
🔥 ========== API ENDPOINT: RECEIVED REQUEST ==========
📥 Received formData: {
  company_name: "...",
  business_type: "...",
  component_origins_count: 3,
  component_origins_details: [
    { index: 1, description: "...", origin_country: "...", value_percentage: ... },
    { index: 2, description: "...", origin_country: "...", value_percentage: ... },
    { index: 3, description: "...", origin_country: "...", value_percentage: ... }
  ]
}
```

### 5. **USMCA Qualification Step**
```
✅ ========== USMCA QUALIFICATION STEP ==========
Input to USMCA engine: {
  hsCode: "...",
  businessType: "...",
  manufacturingLocation: "...",
  componentOrigins_count: 3,
  componentOrigins: [...]
}
```

### 6. **Regional Content Calculation (THE CRITICAL STEP)**
```
🧮 ========== CALCULATING REGIONAL CONTENT ==========
📦 Component Origins received: [
  { index: 1, origin_country: "IN", value_percentage: 60, is_usmca: false },
  { index: 2, origin_country: "MX", value_percentage: 40, is_usmca: true }
]
➕ Total value percentage: 100
🇺🇸🇲🇽🇨🇦 North American value: 40
📊 North American percentage: 40.00%
🎯 Threshold from config file: 55%    <-- THIS IS THE KEY!
✓ Qualified? false
```

### 7. **AI Prompt Construction**
```
🤖 ========== AI RECOMMENDATIONS: STARTING ==========
Input data for AI: {
  qualified: false,
  north_american_content: 40,
  threshold_applied: 55,
  business_type: "Textiles & Apparel",
  product_description: "Cotton t-shirts",
  component_origins_count: 2
}
📝 Component breakdown for AI:
- 60% from IN (Cotton fabric)
- 40% from MX (Assembly labor)

🎯 ========== EXACT AI PROMPT SENT TO OPENROUTER ==========
[Full prompt text will be displayed here]
========== END AI PROMPT ==========
```

### 8. **Raw AI Response**
```
🔮 ========== RAW AI RESPONSE FROM OPENROUTER ==========
Raw response text: ["Replace India fabric supplier with Mexico textile mills", ...]
========== END RAW AI RESPONSE ==========
✅ Parsed AI recommendations: [...]
```

### 9. **Final API Response**
```
📥 ========== API RESPONSE RECEIVED ==========
API Response: {
  success: true,
  has_company: true,
  has_usmca: true,
  usmca_qualified: false,
  usmca_threshold: 55,
  north_american_content: 40,
  recommendation_count: 4
}
```

---

## How to Use This Debug Output

### **Run Your Textile Example:**
1. Open browser console (F12)
2. Navigate to http://localhost:3000/usmca-workflow
3. Fill in Step 1:
   - Company: "Fashion Forward Apparel"
   - Business Type: "Textiles & Apparel"
   - Trade Volume: "$1M - $5M"
4. Fill in Step 2:
   - Product: "Cotton t-shirts"
   - Component 1: 60% India (Cotton fabric)
   - Component 2: 40% Mexico (Assembly labor)
5. Click "Continue to USMCA Analysis"
6. **Watch the console output**

### **What to Check:**

#### ✅ **Step 1: Data Collection (Lines 1-4)**
**Question:** Is component data being collected correctly?
- Check `component_count` = number of components you entered
- Check each component has: description, origin_country, value_percentage
- Check `total_percentage` = 100

**If wrong:** Data not being captured in Step 2

#### ✅ **Step 2: Data Flow (Lines 5-9)**
**Question:** Is component data making it through the workflow state?
- Check `component_origins_count` matches Step 1
- Check `component_origins` array has all your data

**If wrong:** useWorkflowState not receiving/storing data properly

#### ✅ **Step 3: API Request (Lines 10-13)**
**Question:** Is complete data being sent to API?
- Check `component_origins` array is present
- Check array has all component details

**If wrong:** workflow-service not passing data correctly

#### ✅ **Step 4: Regional Content Calculation (Lines 14-22)** ⭐ **MOST IMPORTANT**
**Question:** Is the threshold correct and calculation working?
- Check `🎯 Threshold from config file:` shows correct value:
  - Textiles → 55%
  - Electronics → 65%
  - Automotive → 75%
- Check `📊 North American percentage:` calculation is correct
- Check `is_usmca` flag for each component (MX, US, CA should be true)

**If wrong:** Either:
- Config file not being read correctly
- Component origins not being categorized as USMCA members
- Math calculation error

#### ✅ **Step 5: AI Prompt (Lines 23-26)**
**Question:** Is the AI receiving the correct context?
- Check `COMPONENT BREAKDOWN:` section shows all your components
- Check `Business Type:` and `Product:` are correct
- Check threshold and gap percentages are correct

**If wrong:** Prompt construction not using formData correctly

#### ✅ **Step 6: AI Response (Lines 27-29)**
**Question:** What is AI actually returning?
- Check `Raw response text:` for exact AI output
- Check if recommendations are product-specific or generic

**If wrong:** Either:
- Prompt is bad (AI doesn't understand what we want)
- AI response format is wrong (not JSON array)
- Parsing error

---

## Finding the Bug

### **Scenario A: Wrong Threshold Shown**
**Symptoms:** Console shows threshold as 62.5% but should be 55% for textiles

**Look for:**
```
🎯 Threshold from config file: 62.5%   <-- WRONG!
```

**Root cause:** Config file not being read correctly, or wrong business type mapping

---

### **Scenario B: Correct Threshold, Wrong Qualification**
**Symptoms:** Shows 55% threshold but still says qualified when shouldn't be

**Look for:**
```
📊 North American percentage: 40.00%
🎯 Threshold from config file: 55%
✓ Qualified? true   <-- WRONG! Should be false
```

**Root cause:** Qualification logic error (>= check backwards?)

---

### **Scenario C: Components Not Being Counted**
**Symptoms:** Shows 0% North American content when you entered Mexico components

**Look for:**
```
📦 Component Origins received: [
  { index: 1, origin_country: "MX", value_percentage: 40, is_usmca: false }  <-- WRONG!
]
```

**Root cause:** USMCA countries array doesn't include "MX"

---

### **Scenario D: AI Gets Wrong Data**
**Symptoms:** Recommendations are generic or wrong for product type

**Look for:**
```
COMPONENT BREAKDOWN:
- undefined% from undefined (undefined)   <-- WRONG!
```

**Root cause:** formData.component_origins not being passed to AI function

---

## Next Steps

1. **Run the workflow** with your textile example
2. **Copy the entire console output** and share it with me
3. I'll identify exactly where the data flow breaks
4. We'll fix the specific issue

The logging shows **EVERY** piece of data at **EVERY** step, so we'll find the bug immediately.

---

**Files Modified:**
- `components/workflow/ComponentOriginsStepEnhanced.js` - Added Step 2 submit logging
- `hooks/useWorkflowState.js` - Added workflow state logging
- `lib/services/workflow-service.js` - Added API request/response logging
- `pages/api/database-driven-usmca-compliance.js` - Added endpoint and AI logging
- `lib/core/database-driven-usmca-engine.js` - Added calculation logging

**All logging uses emoji prefixes for easy scanning:**
- 🚀 = User action
- ⚙️ = System processing
- 📦 = Component data
- 🏢 = Company data
- ✅ = Validation/Success
- 🧮 = Calculation
- 🎯 = Threshold
- 🤖 = AI processing
- 🔮 = AI response
- 📥 = Received data
- 📤 = Sent data
