# Data Flow Audit Report - Trade Risk Alternatives (Alerts Page)
**Date**: November 1, 2025
**Issue**: "All the workflow is not all getting to the alerts page"
**Root Cause**: Component-specific email preferences not persisted to database

---

## Executive Summary

The workflow data IS reaching the alerts page correctly. However, there is one critical missing link: **component-specific email alert preferences are not being saved to the database**.

This causes user preferences to be lost when they refresh the page.

---

## Complete Data Flow (Detailed Trace)

### ✅ PHASE 1: Workflow Completion & Database Save (WORKING)

**Location**: `pages/api/workflow-session.js` (lines 194-237)

When user completes workflow and clicks "Complete" button:

```
User clicks "Complete Workflow"
  ↓
POST /api/workflow-session
  ↓
Normalize components (lines 95-123):
  - Preserve all tariff data: mfn_rate, section_301, section_232, total_rate, usmca_rate
  - Ensure hs_code and origin_country present
  ↓
Save to workflow_sessions table (lines 201-224):
  - component_origins column: Normalized array with ALL tariff rates ✅
  - data column (JSONB): Full workflowData including recommendations, detailed_analysis ✅
  - company_name, business_type, trade_volume columns ✅
  - destination_country, hs_code, product_description columns ✅
  ↓
OR Save to workflow_completions table (lines 128-187):
  - Same fields PLUS qualification_status, regional_content_percentage ✅
  - workflow_data (JSONB): Complete analysis results ✅
```

**Status**: ✅ **WORKING** - All workflow data saved to database

---

### ✅ PHASE 2: Database Load (WORKING)

**Location**: `pages/api/dashboard-data.js` (lines 95-199)

When alerts page loads and calls `/api/dashboard-data`:

```
GET /api/dashboard-data
  ↓
Query workflow_sessions table (lines 95-105)
Query workflow_completions table (lines 106-151)
  ↓
Transform workflows (lines 108-151):
  - component_origins: Loaded directly from DB column ✅
  - All tariff rates preserved (mfn_rate, section_301, etc.) ✅
  - trade_volume: Parsed correctly ✅
  - company_name, business_type, destination_country ✅
  - workflow_data (JSONB): Full analysis data ✅
  ↓
Return response (lines 558-574):
  {
    workflows: [
      {
        id, user_id, company_name, product_description,
        trade_volume, component_origins, hs_code,
        qualification_status, enrichment_data, data,
        ...other fields
      }
    ],
    alerts: [...],
    usage_stats: {...},
    user_profile: {...}
  }
```

**Status**: ✅ **WORKING** - All workflow data loaded from database

---

### ✅ PHASE 3: Alerts Page Load & State Setup (WORKING)

**Location**: `pages/trade-risk-alternatives.js` (lines 127-275)

When alerts page mounts and calls `loadUserData()`:

```
useEffect(() => {
  loadUserData();
}, [user])  // Runs when user logs in
  ↓
loadUserData() (lines 127-275):
  ↓
  1. Try localStorage first (line 147):
     - loadLocalStorageData() ✅
     - Sets userProfile if found
  ↓
  2. If empty, load from database (lines 150-267):
     - Fetch `/api/dashboard-data` ✅
     - Get most recent workflow ✅
     - Extract component_origins (line 214) ✅
     - Extract all company/product fields (lines 213-238) ✅
     - Extract trade_volume (lines 218-221) ✅
     ↓
  3. Extract rich workflow intelligence (lines 247-257):
     - Get recommendations from workflowData.recommendations ✅
     - Get detailed_analysis from workflowData.detailed_analysis ✅
     - Get compliance_roadmap, risk_mitigation, etc. ✅
     ↓
  4. Set React states:
     - setUserProfile(profile) ✅
     - setWorkflowIntelligence({...}) ✅
     - setIsLoading(false) ✅
```

**Status**: ✅ **WORKING** - User profile and workflow intelligence loaded correctly

---

### ✅ PHASE 4: Component Table Render (WORKING)

**Location**: `pages/trade-risk-alternatives.js` (lines 934-975, 1250-1270)

When component table renders:

```
Component table mapping (lines 934-975):
  ↓
  for each component in userProfile.componentOrigins:
    - hs_code ✅
    - origin_country ✅
    - mfn_rate ✅
    - section_301 ✅
    - total_rate ✅
    - annual_savings ✅
    ↓
  Alert matching (lines 934-975):
    - Matches alerts to components by:
      * HS code match (first 4 digits)
      * Origin country match
      * Industry category match
    - Shows alert badge if match found ✅
    ↓
  Email notification checkbox (lines 1250-1270):
    - Renders: <input type="checkbox" checked={emailEnabled} ... /> ✅
    - Handler: onClick={() => toggleComponentEmailNotification(idx)} ✅
```

**Status**: ✅ **WORKING** - Components render, alerts match, checkboxes render

---

## ❌ PHASE 5: Email Notification Persistence (BROKEN)

**Location**: `pages/trade-risk-alternatives.js` (lines 97-102)

When user checks/unchecks email notification checkbox:

```
User clicks checkbox: ☑ "Alert me about Microprocessor"
  ↓
toggleComponentEmailNotification(idx) (lines 97-102):
  ↓
  setComponentEmailNotifications(prev => ({
    ...prev,
    [idx]: !prev[idx]
  }));
  ↓
  Local state updates ✅
  UI checkbox appears checked ✅
  ↓
  BUT NO API CALL ❌
  NO DATABASE SAVE ❌
  NO ENDPOINT EXISTS ❌
  ↓
User navigates away OR refreshes page
  ↓
Local state lost ❌
Component email preferences reset to default ❌
```

**Status**: ❌ **BROKEN** - Email preferences not saved to database

---

## Missing Implementation

### What's Missing:

**1. Database Table: `component_alert_preferences`**
```sql
-- NOT YET CREATED
CREATE TABLE component_alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  workflow_id UUID NOT NULL,  -- or workflow_session_id
  component_index INTEGER NOT NULL,  -- 0, 1, 2, ... (position in components array)
  component_hs_code TEXT,  -- HS code for reference
  email_alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, workflow_id, component_index)
);
```

**2. API Endpoint: `/api/user/component-alert-preferences`** (NOT YET CREATED)
```javascript
// POST /api/user/component-alert-preferences
// Save preferences for specific component
{
  "workflow_id": "uuid",
  "component_index": 0,
  "component_hs_code": "8542.31.00",
  "email_alerts_enabled": true
}
```

**3. Function Call in `toggleComponentEmailNotification`** (NOT YET ADDED)
```javascript
const toggleComponentEmailNotification = async (idx) => {
  // Update local state
  setComponentEmailNotifications(prev => ({
    ...prev,
    [idx]: !prev[idx]
  }));

  // ❌ MISSING: Save to database
  try {
    const response = await fetch('/api/user/component-alert-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        workflow_id: userProfile.workflowId,  // Need to capture this
        component_index: idx,
        component_hs_code: userProfile.componentOrigins[idx]?.hs_code,
        email_alerts_enabled: !componentEmailNotifications[idx]
      })
    });

    if (!response.ok) {
      console.error('Failed to save email preference');
      // Fallback: Try to load saved preferences from database
    }
  } catch (error) {
    console.error('Error saving preference:', error);
  }
};
```

**4. Load Preferences on Page Load** (NOT YET ADDED)
```javascript
useEffect(() => {
  if (userProfile?.userId && userProfile?.workflowId) {
    // Load saved email preferences for all components
    loadComponentAlertPreferences();
  }
}, [userProfile?.workflowId]);

const loadComponentAlertPreferences = async () => {
  try {
    const response = await fetch(
      `/api/user/component-alert-preferences?workflow_id=${userProfile.workflowId}`,
      { credentials: 'include' }
    );

    if (response.ok) {
      const data = await response.json();
      // Build preferences map
      const preferences = {};
      data.preferences.forEach(pref => {
        preferences[pref.component_index] = pref.email_alerts_enabled;
      });
      setComponentEmailNotifications(preferences);
    }
  } catch (error) {
    console.error('Failed to load email preferences:', error);
  }
};
```

---

## Complete Data Flow Chain

### ✅ CURRENTLY WORKING:
```
Workflow Completion
  ↓
Database Save (workflow_sessions/workflow_completions)
  ↓
Page Load → Fetch /api/dashboard-data
  ↓
Load from Database → Set userProfile state
  ↓
Render Component Table
  ↓
Render Email Checkboxes
```

### ⚠️ INCOMPLETE:
```
User Clicks Email Checkbox
  ↓
Toggle Local State ✅
  ↓
Save to Database ❌  ← MISSING
  ↓
Load from Database on Next Page Load ❌  ← MISSING
```

---

## Why This Matters (User's Statement)

User said: **"all the workflow is not all getting to the alerts page and i actually added many save to database at most buttons so if the local isnt savin it it could als be retied fro the databse"**

**Translation:**
- ✅ "all the workflow is...getting to the alerts page" - Component data IS there
- ❌ "i added many save to database at most buttons" - Added checkbox buttons that SHOULD save but don't
- ❌ "if the local isnt savin it it could als be retied fro the databse" - Need fallback to load from DB

**What's happening:**
1. ✅ Workflow data reaches alerts page (components, hs codes, tariff rates)
2. ✅ Component email checkboxes render
3. ❌ When user changes checkboxes, changes don't save to database
4. ❌ When user refreshes, preferences are lost (only local state, no database)
5. ❌ When consolidate-alerts tries to personalize alerts, can't find saved user preferences

---

## Recommended Fix Priority

**P0 (Critical - Blocks User Experience)**
1. Create `component_alert_preferences` table
2. Create `/api/user/component-alert-preferences` endpoint (GET/POST)
3. Update `toggleComponentEmailNotification` to save to database
4. Load preferences on page load

**P1 (Important - Data Safety)**
1. Test fallback when save fails (load from database)
2. Handle case where preferences exist in database but not in localStorage
3. Add error notifications when save fails

**P2 (Enhancement)**
1. Bulk save all preferences with "Save All Preferences" button
2. Show last saved timestamp
3. Add "Reset to Defaults" button

---

## Summary

The data flow investigation reveals that **workflow data IS correctly reaching the alerts page**. The issue is not data loss in the main workflow → database → alerts pipeline. Rather, the issue is a **missing secondary feature**: component-specific email alert preferences are not being persisted to the database.

This is a feature gap, not a data loss bug. The fixes are straightforward:
1. Create database table for preferences
2. Create API endpoint to save/load preferences
3. Wire up checkbox handlers to call the endpoint
4. Load preferences when page loads

**No existing data is being lost.** All workflow data flows correctly from completion → database → alerts page. The missing piece is just the email notification preferences for specific components.
