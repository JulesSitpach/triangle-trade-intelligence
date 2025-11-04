# DATA FLOW AUDIT - Dashboard Display Issues

**Date:** November 4, 2025  
**Issue:** Dashboard shows "Product with HS undefined" and empty risk_level/risk_score  
**Status:** ROOT CAUSES IDENTIFIED

---

## CRITICAL FINDINGS

### Issue 1: "Product with HS undefined" in Certificate Display

**What User Sees:**
```
Product with HS undefined - QUALIFIED - 11/4/2025
```

**Root Cause:** Database contains the LITERAL STRING "Product with HS undefined"

**Evidence from Database:**
```sql
SELECT product_description, hs_code FROM workflow_completions LIMIT 1;
-- Result: 
-- product_description: "Product with HS undefined"
-- hs_code: "8517622090" (actually exists!)
```

**Where This Gets Created:**
File: pages/api/workflow-session.js Line 143-147

THE BUG: Template literal uses workflowData.classified_hs_code but should check if it exists first!

**What Happens:**
1. User completes workflow
2. API creates workflow_completion record
3. workflowData.classified_hs_code is undefined
4. Template literal evaluates to: "Product with HS undefined"
5. This gets saved to database as product_description
6. Dashboard reads it and displays exactly what is in database

**Fix Required:**
Change precedence of ternary operator to prevent undefined in template literal.

---

### Issue 2: "Risk Level: " (Empty) in Trade Alerts

**What User Sees:**
```
Risk Level: 
Impact: Risk Score 0/100
```

**Root Cause:** crisis_alerts table does NOT have severity_level field

**Database Schema (crisis_alerts table):**
- severity (text) - EXISTS
- severity_level - DOES NOT EXIST

**Where This Breaks:**
File: pages/api/dashboard-data.js Line 485-489

Code tries to access:
- alert.severity_level (undefined - field does not exist)
- alert.crisis_score (undefined - field does not exist)

**What Happens:**
1. API queries crisis_alerts table
2. Tries to access alert.severity_level → undefined
3. Tries to access alert.crisis_score → undefined
4. Sends undefined to dashboard
5. Dashboard displays empty string for risk_level

**Fix Required:**
Use correct field name alert.severity instead of alert.severity_level

---

## COMPLETE DATA FLOW

### WORKFLOW COMPLETION FLOW

1. USER COMPLETES WORKFLOW
2. pages/usmca-workflow.js calls saveWorkflowState(workflowData, 'complete')
3. POST /api/workflow-session
4. Database workflow_completions table SAVES data
5. Dashboard loads via GET /api/dashboard-data
6. UserDashboard.js displays data

### ALERT DISPLAY FLOW

1. RSS SYSTEM CREATES ALERTS via /api/cron/rss-polling
2. Database crisis_alerts table stores alerts
3. Dashboard queries via GET /api/dashboard-data
4. API transforms alert data (BUG HERE - wrong field names)
5. UserDashboard.js displays transformed data

---

## FIXES REQUIRED

### Fix 1: Product Description Bug
**File:** pages/api/workflow-session.js
**Line:** 143-147

**Current Code:**
```javascript
product_description:
  workflowData.product?.description ||
  workflowData.product_description ||
  workflowData.classified_hs_code ? \`Product with HS \${workflowData.classified_hs_code}\` : 'USMCA Analysis',
```

**Fixed Code:**
```javascript
product_description:
  workflowData.product?.description ||
  workflowData.product_description ||
  (workflowData.classified_hs_code 
    ? \`Product with HS \${workflowData.classified_hs_code}\` 
    : (workflowData.product?.hs_code 
        ? \`Product with HS \${workflowData.product.hs_code}\`
        : 'USMCA Analysis')),
```

---

### Fix 2: Alert Risk Level Bug
**File:** pages/api/dashboard-data.js
**Line:** 485-489

**Current Code:**
```javascript
severity_level: alert.severity_level,
overall_risk_level: alert.severity_level,
risk_score: alert.crisis_score || 0,
alert_count: 1,
```

**Fixed Code:**
```javascript
severity_level: alert.severity || 'MEDIUM',
overall_risk_level: alert.severity || 'MEDIUM',
risk_score: calculateRiskScore(alert.severity) || 75,
alert_count: 1,
```

**Helper Function to Add:**
```javascript
const calculateRiskScore = (severity) => {
  const severityMap = {
    'CRITICAL': 95,
    'HIGH': 80,
    'high': 80,
    'MEDIUM': 60,
    'medium': 60,
    'LOW': 30,
    'low': 30
  };
  return severityMap[severity] || 60;
};
```

---

## AFFECTED FILES SUMMARY

| File | Line | Issue | Priority |
|------|------|-------|----------|
| pages/api/workflow-session.js | 143-147 | Product description template literal | P0 |
| pages/api/dashboard-data.js | 485-489 | Wrong field names for alerts | P0 |
| components/UserDashboard.js | 576, 590-598 | Displays undefined values | Works once API fixed |

---

## SUMMARY

**Root Cause 1:** Template literal in workflow-session.js creates "Product with HS undefined" string when classified_hs_code is undefined. Needs parentheses around ternary operator.

**Root Cause 2:** API tries to access alert.severity_level and alert.crisis_score but crisis_alerts table only has severity field. Need to use correct field name and calculate risk_score from severity.

**Impact:** User sees confusing "undefined" text and empty risk levels in dashboard.

**Effort to Fix:** 30 minutes coding + testing. Both fixes are simple field name corrections.

**Risk:** Low - fixes improve display only, no business logic changes.
