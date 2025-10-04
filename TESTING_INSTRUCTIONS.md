# Testing Instructions - Trade Alerts Integration

## ✅ What I Fixed

### 1. CSS Classes Fixed
- ✅ **WorkflowResults.js** - Replaced non-existent CSS classes with existing ones:
  - `alert-cta-card` → `card`
  - `alert-cta-content` → `card-header` + `card-description`
  - `btn-large` → `btn-primary` (btn-large doesn't exist)

- ✅ **trade-risk-alternatives.js** - Fixed AI analysis display:
  - `ai-analysis-summary` → `card`
  - `ai-badge` → `card-subtitle`
  - `ai-powered-badge` → Plain `<span>`
  - `vulnerability-list` → `<ul>` with `card-description`

### 2. Added Comprehensive Debug Logging
- ✅ **WorkflowResults.js** - Logs when "Set Up Alerts" is clicked:
  - Shows if `results` object has component_origins
  - Shows what's saved to localStorage
  - Shows component count and data structure

- ✅ **trade-risk-alternatives.js** - Logs when page loads:
  - Shows if localStorage has workflow data
  - Shows if component_origins exist
  - Shows if AI analysis is triggered

### 3. Privacy Consent System
- ✅ Created SaveDataConsentModal
- ✅ Removed automatic database saving
- ✅ User now controls data storage

## 🧪 How to Test

### Step 1: Run the Workflow
1. Go to http://localhost:3000
2. Navigate to USMCA Workflow
3. **IMPORTANT:** Complete BOTH steps:
   - Step 1: Company information
   - Step 2: Component origins (THIS IS CRITICAL)

**Example Component Origins:**
```
Component 1: Steel brackets - Germany - 35%
Component 2: Electronic sensors - Taiwan - 45%
Component 3: Assembly - Mexico - 20%
```

### Step 2: View Results
1. Workflow completes → Shows results page
2. **Look for:** "🚨 AI-Powered Trade Risk Monitoring" card
3. **Should show:**
   - "AI analyzes your X component origins" (X should be 3 if you entered 3)
   - List of benefits
   - "🚨 Set Up Trade Alerts" button

### Step 3: Open Browser Console
1. Press F12 (Windows) or Cmd+Option+I (Mac)
2. Go to "Console" tab
3. **KEEP THIS OPEN** - you'll see important logs

### Step 4: Click "Set Up Trade Alerts"
1. Click the button
2. **Watch console** - should see:
   ```
   🚨 ========== SETTING UP TRADE ALERTS ==========
   📊 Results object structure: {
     has_component_origins: true,
     component_origins_length: 3,
     component_origins_data: [...]
   }
   ✅ Alert data prepared and saved to localStorage: {
     component_origins_count: 3,
     component_origins: [...]
   }
   🔄 Navigating to /trade-risk-alternatives...
   ```

### Step 5: Alerts Page Loads
1. Page navigates to /trade-risk-alternatives
2. **Watch console** - should see:
   ```
   📥 ========== LOADING WORKFLOW DATA FOR ALERTS ==========
   localStorage keys: [...usmca_workflow_results, ...]
   usmca_workflow_results exists: true
   📊 Workflow data parsed: {
     has_component_origins: true,
     component_origins_length: 3
   }
   🤖 ========== AI VULNERABILITY ANALYSIS STARTING ==========
   Component origins found, requesting AI vulnerability analysis...
   ```

### Step 6: AI Analysis Runs
1. **Watch console** - should see:
   ```
   📤 Sending workflow data to AI vulnerability endpoint...
   ✅ AI vulnerability analysis received: {
     alert_count: X,
     risk_level: "HIGH" | "MODERATE" | "LOW",
     confidence: 85
   }
   ```

2. **Watch UI** - should see:
   - "🤖 AI Analyzing Your Supply Chain..." (briefly)
   - Then: "🤖 AI Vulnerability Analysis" card appears
   - Shows: Risk level, score, alert count, confidence
   - Shows: Primary vulnerabilities with affected components
   - Alerts section shows: "(AI-Powered)"

### Step 7: Verify AI Alerts
1. Look at "🚨 Current Threats to Your Trade" section
2. **Should show:**
   - "(AI-Powered)" indicator
   - Component-specific alerts like:
     - "Your 35% German steel components face EU tariff risk"
     - "Taiwan 45% dependency - monitor China-Taiwan tensions"

3. **Should NOT show:**
   - Generic "Supply Chain Concentration Risk"
   - Vague alerts without component references

## 🐛 Troubleshooting

### Issue 1: "Set Up Alerts" Button Not Visible
**Check:**
- [ ] Did you complete Step 2 of workflow (component origins)?
- [ ] Look in console for errors
- [ ] Refresh page and try again

**Debug:**
```javascript
// In browser console:
console.log('Results:', results);
console.log('Component origins:', results?.component_origins);
```

### Issue 2: No AI Analysis Showing
**Check console for:**
- `⚠️ No component origins found` → Go back and enter component origins in workflow
- `⚠️ No workflow results data in localStorage` → Click "Set Up Alerts" button again
- API error → Check network tab for 500 errors

**Debug:**
```javascript
// In browser console on alerts page:
const data = localStorage.getItem('usmca_workflow_results');
console.log('Storage data:', JSON.parse(data));
```

### Issue 3: Generic Alerts Still Showing
**Possible causes:**
1. Component origins array is empty: `[]`
2. AI API failed (check network tab)
3. AI response didn't include alerts

**Debug:**
```javascript
// Check if AI state is set:
console.log('AI analysis:', aiVulnerabilityAnalysis);
```

## ✅ Success Criteria

### You know it's working when:

**On Results Page:**
- [x] "🚨 AI-Powered Trade Risk Monitoring" card is visible
- [x] Shows "AI analyzes your X component origins" with correct count
- [x] Button is styled correctly (blue, clickable)

**On Alerts Page:**
- [x] "🤖 AI Vulnerability Analysis" card appears
- [x] Shows risk metrics (level, score, alerts, confidence)
- [x] Lists primary vulnerabilities with affected components
- [x] Alerts section shows "(AI-Powered)"
- [x] Specific alerts reference your actual components (e.g., "35% German steel")

**Console Logs Show:**
- [x] Component origins saved to localStorage (with data)
- [x] Workflow data loaded successfully
- [x] AI analysis API called and responded
- [x] AI alerts replaced generic risks

## 📊 Expected vs. Current State

### Expected (After Fixes):
```
USMCA Results:
├── Company Profile ✅
├── Product Classification ✅
├── USMCA Qualification ✅
├── [NEW] 🚨 AI-Powered Trade Risk Monitoring Card ✅
│   ├── Explanation text ✅
│   ├── Benefits list ✅
│   └── "Set Up Trade Alerts" button ✅
├── Tariff Savings ✅
└── Certificate Section ✅

↓ Click Button ↓

Trade Risk & Alternatives:
├── Your Trade Profile ✅
├── [NEW] 🤖 AI Vulnerability Analysis ✅
│   ├── Risk Level: HIGH/MODERATE/LOW ✅
│   ├── Risk Score: 0-100 ✅
│   ├── Alerts Generated: X ✅
│   ├── AI Confidence: 85% ✅
│   └── Primary Vulnerabilities List ✅
├── 🚨 Current Threats (AI-Powered) ✅
│   └── Component-specific alerts ✅
├── Trade Alternatives ✅
└── Professional Services CTAs ✅
```

## 📝 Report Back

After testing, please share:

1. **Console logs** - Copy all logs starting with 🚨, 📥, 🤖
2. **Screenshot** of results page showing alert CTA
3. **Screenshot** of alerts page showing AI analysis
4. **Any errors** - Red text in console or network tab
5. **What you see** vs **what you expected**

This will help me pinpoint any remaining issues!
