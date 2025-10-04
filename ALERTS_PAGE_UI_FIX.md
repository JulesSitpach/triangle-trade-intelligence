# Trade Risk & Alternatives Page - Complete UI/UX Fix

## 🎯 How This Page SHOULD Work

### User Journey
1. **User completes USMCA workflow** → Gets results showing:
   - Company name: "Industrial Hydraulics Mexico"
   - Product: "High-pressure hydraulic pumps"
   - Component origins: e.g., Germany 35%, Taiwan 45%, Mexico 20%
   - Qualification status: QUALIFIED or NOT QUALIFIED

2. **User sees prominent CTA on results page:**
   - "🚨 Set Up Trade Alerts" button
   - Explains: "AI will analyze your component origins for vulnerabilities"
   - Shows: "We'll monitor your Germany 35%, Taiwan 45% dependencies"

3. **User clicks button → Navigates to /trade-risk-alternatives**
   - Data saved to localStorage with component origins
   - Page loads and reads that data
   - AI analysis starts automatically

4. **Alerts page shows:**
   - **Company profile** (from workflow data)
   - **AI vulnerability analysis** (component-specific risks)
   - **Specific alerts** like:
     - "Your 35% German steel components face EU tariff risk"
     - "Taiwan 45% dependency - monitor China-Taiwan tensions"
   - **Professional services CTAs** (Jorge/Cristina can help)

## 🚨 Current Issues

### Issue 1: Alert CTA Button Not Visible
**Problem:** CSS classes don't exist
- `alert-cta-card`, `alert-cta-content`, `alert-cta-icon` → Don't exist in globals.css
- Button renders but looks broken

**Fix:** ✅ DONE - Replaced with existing `card`, `card-header`, `card-description` classes

### Issue 2: AI Analysis Section Not Showing
**Problem:** Multiple CSS issues
- `ai-analysis-summary`, `ai-badge`, `ai-powered-badge` → Don't exist
- `vulnerability-list`, `vulnerability-item` → Don't exist
- Section renders but styling is broken

**Fix:** ✅ DONE - Replaced with existing CSS classes

### Issue 3: Data Flow Broken
**Problem:** Component origins not reaching alerts page
- WorkflowResults saves to localStorage: ✅ Correct
- Key: `usmca_workflow_results` ✅ Correct
- Structure includes `component_origins` ✅ Correct
- BUT: Alerts page might not be reading it correctly

**Need to verify:**
- [ ] Does `results` object have component_origins?
- [ ] Is localStorage data persisting?
- [ ] Is AI API being called?

### Issue 4: Generic Risks Showing Instead of AI Risks
**Problem:** User sees "Supply Chain Concentration Risk" (generic)
**Should see:** "Your 35% German steel components face EU tariff increases"

**Root cause:** AI analysis not replacing generic risks

## 🔧 Required Fixes

### 1. Verify Data Flow (CRITICAL)
```javascript
// In WorkflowResults.js - handleSetUpAlerts should save:
{
  component_origins: [
    { country: 'Germany', percentage: 35, description: 'Steel components' },
    { country: 'Taiwan', percentage: 45, description: 'Electronics' },
    { country: 'Mexico', percentage: 20, description: 'Assembly' }
  ]
}

// In trade-risk-alternatives.js - should read and use:
const workflowData = localStorage.getItem('usmca_workflow_results');
const parsed = JSON.parse(workflowData);
// parsed.component_origins should have array above
```

### 2. Fix AI Analysis Display
- ✅ Remove non-existent CSS classes
- ✅ Use existing classes (card, card-header, status-grid)
- [ ] Ensure AI analysis actually runs
- [ ] Verify alerts replace generic risks

### 3. Debug Console Logs
Add these checks:
```javascript
// In handleSetUpAlerts (WorkflowResults.js)
console.log('🚨 Alert Data:', {
  component_origins: alertData.component_origins,
  length: alertData.component_origins?.length
});

// In generateDynamicContent (trade-risk-alternatives.js)
console.log('📥 Workflow data loaded:', {
  has_data: !!resultsData,
  has_components: !!(workflowResults?.component_origins)
});

// In generateAIVulnerabilityAlerts
console.log('🤖 AI Analysis Response:', aiAnalysis);
```

### 4. Ensure Results Object Has Component Origins
**Check:** Where does `results` object come from in WorkflowResults?
- From USMCA workflow completion
- Should include component_origins from Step 2
- If missing, data flow is broken earlier in workflow

## 🎨 UI/UX Requirements

### Alerts CTA on Results Page
**Current (broken CSS):**
```html
<div className="card alert-cta-card"> <!-- Doesn't exist -->
```

**Fixed (existing CSS):**
```html
<div className="card">
  <div className="card-header">
    <h3 className="card-title">🚨 AI-Powered Trade Risk Monitoring</h3>
  </div>
  <div className="card-description">
    <p>Protect your supply chain...</p>
    <ul>
      <li>✓ AI analyzes your X component origins</li>
    </ul>
    <button className="btn-primary">🚨 Set Up Trade Alerts</button>
  </div>
</div>
```

### AI Analysis Display on Alerts Page
**Current (broken CSS):**
```html
<div className="card ai-analysis-summary"> <!-- Doesn't exist -->
  <div className="ai-badge">...</div> <!-- Doesn't exist -->
```

**Fixed (existing CSS):**
```html
<div className="card">
  <div className="card-header">
    <h3 className="card-title">🤖 AI Vulnerability Analysis</h3>
    <p className="card-subtitle">Powered by Claude 3.5 Sonnet</p>
  </div>
  <div className="status-grid">
    <!-- Risk metrics -->
  </div>
  <div className="card-description">
    <h4>Primary Vulnerabilities:</h4>
    <ul>
      <li>Component-specific risks...</li>
    </ul>
  </div>
</div>
```

## ✅ What's Fixed So Far

1. ✅ WorkflowResults alert CTA uses existing CSS classes
2. ✅ AI analysis section uses existing CSS classes
3. ✅ Removed btn-large (doesn't exist)
4. ✅ SaveDataConsentModal uses existing CSS classes

## 🔍 What Still Needs Verification

1. [ ] Open browser console
2. [ ] Run workflow with component origins
3. [ ] Click "Set Up Trade Alerts"
4. [ ] Verify console logs:
   - "🚨 Alert data prepared: {components: X}"
   - "📥 Workflow data loaded: {has_components: true}"
   - "🤖 AI Analysis Response: {alerts: [...]}"
5. [ ] Check if AI analysis card appears
6. [ ] Check if generic risks are replaced with AI risks

## 🎯 Expected Final State

**Results Page:**
- ✅ Shows prominent "Set Up Trade Alerts" card
- ✅ Button works and navigates to alerts
- ✅ Data saved with component origins

**Alerts Page:**
- ✅ Shows company profile
- ✅ Shows "AI Analyzing..." message while loading
- ✅ Shows AI vulnerability analysis card with:
  - Overall risk level
  - Risk score
  - Alert count
  - Primary vulnerabilities listing affected components
- ✅ Shows component-specific alerts like:
  - "Your 35% German steel faces EU tariff risk"
  - NOT generic "Supply Chain Concentration Risk"
- ✅ Shows services CTAs with context

## 🐛 Debugging Steps

If AI analysis still doesn't show:

1. **Check localStorage:**
   ```javascript
   const data = localStorage.getItem('usmca_workflow_results');
   console.log('Storage data:', JSON.parse(data));
   ```

2. **Check API call:**
   - Open Network tab
   - Look for POST to `/api/ai-vulnerability-alerts`
   - Check if it's called
   - Check response

3. **Check state:**
   ```javascript
   console.log('AI state:', aiVulnerabilityAnalysis);
   ```

4. **Check component origins in results:**
   ```javascript
   // In WorkflowResults
   console.log('Results object:', {
     has_component_origins: !!(results.component_origins),
     has_components: !!(results.components),
     length: (results.component_origins || results.components || []).length
   });
   ```
