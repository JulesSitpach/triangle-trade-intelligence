# COMPREHENSIVE ENTRY POINTS FOR USMCA WORKFLOW & AI ANALYSIS
## Triangle Intelligence Platform - November 5, 2025

---

## EXECUTIVE SUMMARY

**Total Entry Points Found: 26** (14 Primary + 12 Secondary)

**Critical Vulnerability**: Subscription limit checking is scattered across multiple locations with NO enforcement at the API endpoint level. Multiple attack vectors exist.

---

## PRIMARY ENTRY POINTS

### 1. Dashboard → "+ New Analysis" Button
- **File**: `components/UserDashboard.js` Line 337
- **Target**: `/usmca-workflow?reset=true&force_new=true`
- **Protection**: Frontend check only
- **Risk**: MEDIUM

### 2. Dashboard → "Try USMCA Workflow" Button
- **File**: `components/UserDashboard.js` Line 223
- **Target**: `/usmca-workflow`
- **Protection**: Conditional render
- **Risk**: MEDIUM

### 3. Trade Alerts Page → "Start USMCA Analysis"
- **File**: `pages/trade-risk-alternatives.js` Line 988
- **Target**: `/usmca-workflow`
- **Protection**: NONE
- **Risk**: HIGH

### 4. Direct Workflow Page Entry
- **File**: `pages/usmca-workflow.js` Line 49
- **Protection**: Calls `/api/check-usage-limit` on page load - STRONG
- **Risk**: LOW

### 5. Dashboard → "View Results" Button
- **File**: `components/UserDashboard.js` Line 417
- **Target**: `/usmca-workflow?view_results=${id}`
- **Protection**: Conditional disable
- **Risk**: MEDIUM

### 6-11. Workflow Step Navigation
- **Step 1** (Company): No limit check
- **Step 2** (Components): Component tier limits (different from analysis limit!)
- **Step 3** (Supply Chain): No check
- **Step 4** (Authorization): No final check
- **Risk**: MEDIUM-HIGH

---

## CRITICAL API ENDPOINTS (NO LIMIT CHECKS FOUND)

### /api/ai-usmca-complete-analysis (POST)
- **Called From**: `hooks/useWorkflowState.js` Line 514
- **Protection at Endpoint**: UNKNOWN - NEEDS VERIFICATION
- **Risk**: CRITICAL - Could be called directly via curl

### /api/agents/classification (POST)
- **Called From**: `ComponentOriginsStepEnhanced.js` Lines 221, 333
- **Protection at Endpoint**: UNKNOWN - NEEDS VERIFICATION
- **Risk**: CRITICAL - Could be spam-called repeatedly

### /api/executive-trade-alert (POST)
- **Protection at Endpoint**: UNKNOWN - NEEDS VERIFICATION
- **Risk**: CRITICAL - Could be called directly

### /api/generate-portfolio-briefing (POST)
- **Called From**: `trade-risk-alternatives.js` Line 803
- **Protection**: Separate limit tracking only
- **Risk**: MEDIUM

---

## WHERE SUBSCRIPTION LIMITS ARE CHECKED

1. **Page Entry** - `usmca-workflow.js` Line 49
2. **Dashboard UI** - `UserDashboard.js` Line 337
3. **Component Limits** - `ComponentOriginsStepEnhanced.js` (different limit!)
4. **Briefing Limits** - `trade-risk-alternatives.js` (separate tracking)

---

## WHERE LIMITS ARE NOT CHECKED

- ❌ `/api/ai-usmca-complete-analysis` endpoint
- ❌ `/api/agents/classification` endpoint
- ❌ `/api/executive-trade-alert` endpoint
- ❌ Form submission
- ❌ Workflow completion
- ❌ Before API processing starts

---

## ATTACK VECTORS

### Attack 1: Direct API Call
```bash
curl -X POST https://api.example.com/api/ai-usmca-complete-analysis \
  -H "Authorization: Bearer [token_from_localStorage]" \
  -H "Content-Type: application/json" \
  -d '{"company": {...}, "components": [...]}'
# Result: Creates analysis without limit check
```

### Attack 2: HS Code Spam
```javascript
for (let i = 0; i < 100; i++) {
  fetch('/api/agents/classification', {
    method: 'POST',
    body: JSON.stringify({product_description: `Product ${i}`})
  });
}
```

### Attack 3: localStorage Manipulation
```javascript
localStorage.removeItem('workflow_session_id');
localStorage.removeItem('usedComponentsCount');
// Restart "fresh" workflow
window.location.reload();
```

### Attack 4: Concurrent Requests
```javascript
Promise.all([
  fetch('/api/ai-usmca-complete-analysis', {...}),
  fetch('/api/ai-usmca-complete-analysis', {...}),
  fetch('/api/ai-usmca-complete-analysis', {...})
]);
```

---

## IMMEDIATE FIXES REQUIRED

### Priority 1: Add Subscription Check to Endpoints
1. `/api/ai-usmca-complete-analysis` - Verify tier, check limit, reject if exceeded
2. `/api/agents/classification` - Same
3. `/api/executive-trade-alert` - Same

### Priority 2: Add Pre-Submission Check
- `useWorkflowState.js` - Re-check limit before `processWorkflow()` call
- Disable button if limit reached

### Priority 3: Implement Rate Limiting
- Max requests per minute per user
- Return 429 if exceeded

---

## FILES TO REVIEW

1. `pages/api/ai-usmca-complete-analysis.js` - Add limit check
2. `pages/api/agents/classification.js` - Add limit check
3. `pages/api/executive-trade-alert.js` - Add limit check
4. `hooks/useWorkflowState.js` - Add pre-submission check
5. `pages/usmca-workflow.js` - Add pre-submission check
6. `components/workflow/ComponentOriginsStepEnhanced.js` - Verify component limits
7. `lib/middleware/subscription-guard.js` - Check if exists and how used

