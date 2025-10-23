# Dashboard → Alerts Flow: Programmatic Analysis Report

## Status Summary
🔴 **Critical Issues Found**: 2 data format mismatches that will cause UI bugs without manual intervention

---

## API Data Contract (pages/api/dashboard-data.js)

### Workflows Response
Each workflow object contains:
```javascript
{
  id: UUID,
  source: 'session' | 'completion',
  company_name: string,
  business_type: string,
  product_description: string,
  hs_code: string,
  qualification_status: 'QUALIFIED' | 'NOT QUALIFIED' | string,
  regional_content_percentage: number,      // parseFloat(row.regional_content_percentage) || 0
  required_threshold: number,                // parseFloat(row.required_threshold) || 60
  trade_volume: number,                      // parseFloat(...) || 0
  estimated_annual_savings: 0,               // ⚠️ HARDCODED TO ZERO
  component_origins: Array<{                 // Contains component data
    origin_country: string | null,
    country: string | null,
    value_percentage: number | null,
    percentage: number | null
  }>,
  completed_at: ISO date string,
  manufacturing_location: string,
  certificate_data: object | null,
  certificate_generated: boolean,
  workflow_data: object                      // Full workflow context
}
```

**Workflow List**: Returns array of objects sorted by completed_at (line 136-137)

---

### Alerts Response
Each alert object contains (lines 246-291):
```javascript
{
  id: UUID,
  source: 'crisis_alert',
  company_name: string,
  business_type: string,
  hs_code: string,
  product_description: string,
  annual_trade_volume: number,
  qualification_status: string,
  component_origins: Array,
  analyzed_at: ISO date string,               // From alert.created_at
  alert_type: 'rss_crisis',
  severity_level: string,                     // ❌ Component expects 'overall_risk_level'
  primary_vulnerabilities: [                  // ✓ Component can use this
    {
      title: string,
      severity: string,
      description: string,
      impact: string
    }
  ],
  alerts: [                                   // ✓ Component can use this
    {
      title: string,
      severity: string,
      description: string,
      potential_impact: string,
      recommended_action: string,
      monitoring_guidance: string,
      affected_components: Array,
      alert_triggers: Array
    }
  ],
  recommendations: {                          // ❌ Component expects .immediate_actions, API provides .diversification_strategies
    diversification_strategies: Array<string>
  }
}
```

**Alert List**: Returns array of alerts (max 5) filtered by user's HS codes and destination (line 242)

---

## Component Expectations (components/UserDashboard.js)

### Workflow Display (lines 361-404)

| Usage | Line | Expected Type | API Provides | Status |
|-------|------|---------------|--------------|--------|
| `{w.product_description}` | 371 | string | ✓ product_description: string | ✅ OK |
| `{w.qualification_status}` | 371 | string | ✓ qualification_status: string | ✅ OK |
| `new Date(w.completed_at)` | 371 | Date string | ✓ completed_at: ISO string | ✅ OK |
| `{selectedWorkflow.regional_content_percentage}` | 387 | number | ✓ number \|\| 'N/A' | ✅ OK |
| `{selectedWorkflow.required_threshold}` | 387 | number | ✓ number \|\| 60 | ✅ OK |
| `{selectedWorkflow.hs_code}` | 390 | string | ✓ hs_code: string | ✅ OK |
| `{selectedWorkflow.estimated_annual_savings.toLocaleString()}` | 394 | **number** | **0 (hardcoded)** | ⚠️ **Always shows $0** |
| `c.origin_country \|\| c.country` | 400 | string | ✓ origin_country or country | ✅ OK |
| `c.value_percentage \|\| c.percentage` | 400 | number | ✓ value_percentage or percentage | ✅ OK |

**Verdict**: ✅ Workflows render without errors, but estimated savings always shows $0

---

### Alert Display (lines 558-612)

| Usage | Line | Expected Field | API Provides | Status |
|-------|------|-----------------|--------------|--------|
| `{a.product_description \|\| a.company_name}` | 568 | string | ✓ both present | ✅ OK |
| `{a.overall_risk_level}` | **568** | string | ❌ **severity_level** | 🔴 **MISMATCH** |
| `new Date(a.analyzed_at)` | 568 | Date string | ✓ analyzed_at: ISO string | ✅ OK |
| `{selectedAlert.overall_risk_level}` | **582-586** | string | ❌ **severity_level** | 🔴 **MISMATCH** |
| CSS color logic (line 582-586) | 582-586 | 'HIGH'\|'MODERATE'\|'LOW' | ❓ Unknown (severity_level varies) | ⚠️ **POTENTIAL BUG** |
| `{selectedAlert.risk_score}` | **590** | number | ❌ **Missing entirely** | 🔴 **MISSING** |
| `{selectedAlert.alert_count}` | **590** | number | ❌ **Missing entirely** | 🔴 **MISSING** |
| `selectedAlert.primary_vulnerabilities` | 596-598 | Array with .description | ✓ Provided as array | ✅ OK |
| `selectedAlert.recommendations.immediate_actions` | **606-608** | Array | ❌ **diversification_strategies** | 🔴 **MISMATCH** |

**Verdict**: 🔴 **Critical UI bugs** - Alert display will have undefined values and styling failures

---

## Programmatically Verifiable Issues

### ✅ Can Be Verified Without Manual Testing

1. **Component-API Contract Mismatches**
   - Alert field names: `overall_risk_level` vs `severity_level` (line 568, 582-586)
   - Recommendations structure: `immediate_actions` vs `diversification_strategies` (line 606-608)
   - Missing fields: `risk_score`, `alert_count`
   - **Impact**: Lines 568, 590, 606-608 will render undefined/missing data

2. **Workflow Data Integrity**
   - `estimated_annual_savings` hardcoded to 0 (pages/api/dashboard-data.js line 97)
   - Component calls `.toLocaleString()` on this value (line 394)
   - **Impact**: All workflows show $0 savings regardless of actual USMCA calculations

3. **Component Array Rendering**
   - Component maps 122 workflows into select options (line 369)
   - With dropdown having 122 items, browser rendering will slow but not crash
   - **Impact**: Performance is degraded but UI works

4. **Error Handling Analysis**
   - Workflows: Has fallbacks for missing fields (lines 69, 387, 400)
   - Alerts: Depends on hardcoded structure (no fallback for severity_level vs overall_risk_level)
   - **Impact**: Alerts section will display incorrectly, workflows section will display

---

## Issues That REQUIRE Code Fixes (Not Manual Testing)

### 🔴 Issue #1: Alert Field Name Mismatch
**Location**: pages/api/dashboard-data.js, line 260
**Problem**: API returns `severity_level`, but UserDashboard expects `overall_risk_level`
**Symptom**:
- Alert dropdown shows undefined in risk level column (line 568)
- Alert detail card has undefined styling (line 582-586)
- Lines 582-584 color logic based on undefined value
```javascript
// Current (BROKEN):
severity_level: alert.severity_level
// Expected by component:
overall_risk_level: alert.severity_level  // Should map this field
```

### 🔴 Issue #2: Missing Alert Fields
**Location**: pages/api/dashboard-data.js, lines 242-291
**Problem**: API doesn't provide `risk_score` or `alert_count`
**Symptom**:
- Line 590 renders as: `Impact: Risk Score undefined/100 • undefined alerts detected`
```javascript
// Add to alert transformation (line 290):
risk_score: alert.crisis_score || 0,      // Use existing crisis_score
alert_count: (alert.alerts || []).length  // Count alerts array
```

### 🔴 Issue #3: Recommendations Structure Mismatch
**Location**: pages/api/dashboard-data.js, line 286
**Problem**: API returns `diversification_strategies` but component expects `immediate_actions`
**Symptom**:
- Line 606-608 loop over undefined array, renders nothing
```javascript
// Current (BROKEN):
recommendations: {
  diversification_strategies: alert.recommended_actions ? [alert.recommended_actions] : []
}
// Expected by component:
recommendations: {
  immediate_actions: alert.recommended_actions ? [alert.recommended_actions] : []
}
```

### ⚠️ Issue #4: Estimated Savings Always Zero
**Location**: pages/api/dashboard-data.js, line 97
**Problem**: `estimated_annual_savings: 0` hardcoded in all workflows
**Symptom**:
- Line 394 shows: `Annual Savings: $0` for all workflows, even qualified ones
- This data should come from qualification_result.savings_calculation
```javascript
// Current (BROKEN):
estimated_annual_savings: 0
// Should be:
estimated_annual_savings: qualificationResult.savings_calculation || 0
```

---

## What Happens If NOT Fixed

### Without Manual Testing, These Will Happen:
1. **Alert dropdown rendering**:
   ```
   ❌ Product Name - undefined - Oct 23, 2024
   ```

2. **Alert detail card**:
   ```
   Risk Level: undefined        ← No color styling applied
   Impact: Risk Score undefined/100 • undefined alerts detected
   ```

3. **Recommendations section**:
   ```
   [Empty list - no recommended actions displayed]
   ```

4. **Workflow savings**:
   ```
   Annual Savings: $0    ← Shown for all, even qualified products
   ```

---

## What Requires Manual Browser Testing

After fixing the above 4 issues, these items require actual browser testing:

✅ **Actually Need Manual Testing**:
1. Alert dropdown CSS styling and layout (responsive on mobile/tablet)
2. Alert detail card color gradients based on risk level
3. Dropdown scroll performance with 122 workflows
4. Browser zoom/responsive behavior
5. Trial expired lock-down UI behavior
6. Certificate download PDF generation
7. Delete cascade (delete alert → refreshes list correctly)

❌ **Do NOT Need Manual Testing**:
- Data rendering logic (can verify programmatically)
- Error handling paths (can verify with console logs)
- Field name mismatches (can verify by comparing API response vs component code)
- Missing data fields (can verify by reading both files)
- Math calculations (can verify programmatically)

---

## Recommended Next Steps

### Phase 3a (Code Fixes - BEFORE Manual Testing)
1. Fix Issue #1: Map `severity_level` → `overall_risk_level`
2. Fix Issue #2: Add missing `risk_score` and `alert_count` fields
3. Fix Issue #3: Change `diversification_strategies` → `immediate_actions`
4. Fix Issue #4: Use actual savings instead of hardcoded 0

### Phase 3b (Programmatic Verification After Fixes)
1. Run test-dashboard-api.js again to verify new fields are returned
2. Inspect API response structure matches component expectations
3. Check component code doesn't have other mismatches

### Phase 3c (Manual Browser Testing)
1. Load dashboard in browser
2. Verify workflows dropdown shows correct data
3. Verify alert dropdown shows correct data with proper styling
4. Click alert → verify navigation works
5. Test on mobile/tablet for responsive behavior

---

## Summary

**Current Status**: Dashboard API works, but component has 4 critical bugs that will render undefined values without code fixes.

**Can Test Programmatically**: ✅ Yes - all 4 issues identified through code analysis
**Requires Manual Testing**: ⏳ After fixes are applied (UI styling, PDF generation, responsive behavior)

**Time to Fix**: ~15 minutes (4 simple field mapping changes)
**Estimated Manual Testing Time**: ~30 minutes (after fixes)
