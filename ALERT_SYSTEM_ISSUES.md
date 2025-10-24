# Alert System Issues - Comprehensive Audit

**Date**: October 23, 2025
**Status**: 5 critical issues identified across alert pipeline
**Impact**: Broken field names, styling violations, data loss in alert flow

---

## 🚨 CRITICAL ISSUES

### 1. **Field Name Mismatch in Alert API** 🔴 HIGH
**File**: `pages/api/generate-personalized-alerts.js` (Line 96)

**Issue**:
```javascript
// WRONG - uses camelCase variant
Annual Trade Volume: $${userProfile.tradeVolume || 'unknown'}
```

**Problem**: API endpoint uses `tradeVolume` (camelCase) but receives `trade_volume` (snake_case) from form. This causes `undefined` values in AI prompts.

**Fix Required**:
```javascript
// CORRECT - use canonical field name
Annual Trade Volume: $${userProfile.trade_volume || 'unknown'}
```

**Impact**: AI generates generic alerts because trade_volume is missing from context

---

### 2. **Trade Volume Field Name Inconsistency in Trade Risk Dashboard** 🔴 HIGH
**File**: `pages/trade-risk-alternatives.js`

**Multiple Issues**:

#### Issue 2a: Line 96 - Wrong field name in localStorage parsing
```javascript
// WRONG - uses camelCase
const tradeVolume = profile.tradeVolume || profile.annual_trade_volume || 0;
```

#### Issue 2b: Line 109 - Wrong field name from crisis alerts
```javascript
// WRONG - reads non-existent field
tradeVolume: alert.annual_trade_volume || 0,
```

#### Issue 2c: Line 226 - Wrong field name from localStorage
```javascript
// WRONG - multiple wrong variants
const rawTradeVolume = userData.company?.annual_trade_volume || userData.company?.trade_volume || 0;
```

**Impact**: Trade volume shows as `0` or `undefined` throughout alert dashboard, breaking cost calculations

---

### 3. **Inline Styles Violate Tailwind-Only CSS Rules** 🟡 MEDIUM
**File**: `components/alerts/USMCAIntelligenceDisplay.js`

**Violations**:
- Line 39: `style={{ marginBottom: '1rem' }}` - Should use `mb-4` class
- Line 42-47: Multiple inline styles for card styling
- Line 64-65: Inline flex styles
- Line 144-159: Inline styles for savings section
- Line 202-207: Inline styles for strategic insights section
- **Total**: 15+ instances of inline `style={{}}` objects

**CLAUDE.md Rule**:
```
✅ Use existing CSS classes from `styles/globals.css`
❌ NO inline styles (`style={{}}`)
❌ NO Tailwind CSS (custom CSS only)
```

**Impact**: Styling inconsistency, maintenance burden, violates project guidelines

---

### 4. **Missing Component Intelligence in Trade Risk Page** 🟡 MEDIUM
**File**: `pages/trade-risk-alternatives.js` (Line 99-102)

**Issue**:
```javascript
// Components loaded from crisis alert, but missing tariff enrichment
const profile = {
  // ... other fields
  componentOrigins: components,  // Missing mfn_rate, section_301, usmca_rate!
};
```

**Problem**: When loading alerts from dashboard, components lose their tariff enrichment data (mfn_rate, section_301, total_rate, savings_percentage). Component table tries to display these fields but gets `undefined`.

**Symptom**: Component table shows dashes (`—`) instead of tariff rates

---

### 5. **Alert Consolidation Doesn't Validate Trade Volume** 🟡 MEDIUM
**File**: `pages/api/consolidate-alerts.js` (Line 313)

**Current Implementation**:
```javascript
// Uses profile.trade_volume but doesn't validate before passing to AI
const prompt = `...
Annual Trade Volume: $${userProfile.trade_volume || 'unknown (not provided in workflow)'}
...`;
```

**Issue**: When `trade_volume` is `0` or missing, AI gets "unknown" and generates percentage-based analysis instead of dollar amounts. This breaks cost calculations in consolidated alerts.

---

## 📊 Alert Flow Data Loss Map

```
User USMCA Workflow
    ↓ (trade_volume captured correctly in form)
API: /api/ai-usmca-complete-analysis
    ↓ (saves to database correctly)
database: workflow_sessions.trade_volume = 1000000
    ↓
Page: /api/dashboard-data
    ↓ (retrieves correct trade_volume)
Component: trade-risk-alternatives.js
    ↓ (LOSS HERE - line 226 uses wrong field names)
State: userProfile.tradeVolume = 0  ❌
    ↓
API: /api/generate-personalized-alerts
    ↓ (receives userProfile.tradeVolume = 0)
Prompt: "Annual Trade Volume: $0" ❌
    ↓
Result: Generic alerts without cost impact
```

---

## 🔧 Remediation Plan

### Phase 1: Fix Field Names (IMMEDIATE)
1. **generate-personalized-alerts.js**: Line 96 - Change `userProfile.tradeVolume` → `userProfile.trade_volume`
2. **trade-risk-alternatives.js**: Lines 96, 109, 226 - Normalize all references to canonical `trade_volume`

### Phase 2: Fix Styling (HIGH)
3. **USMCAIntelligenceDisplay.js**: Replace all `style={{}}` with CSS classes from `styles/globals.css`
   - Remove inline margin/padding/background styles
   - Use existing `.card`, `.alert`, `.form-section-title` classes
   - Create new CSS classes if needed (must be in globals.css, not inline)

### Phase 3: Restore Component Tariff Data (HIGH)
4. **trade-risk-alternatives.js** Line 99-116:
   - Ensure components loaded from both sources (workflow_sessions and crisis_alerts) include full tariff enrichment
   - Component table expects: `mfn_rate`, `section_301`, `total_rate`, `usmca_rate`, `savings_percentage`, `ai_confidence`

### Phase 4: Improve Trade Volume Validation (MEDIUM)
5. **consolidate-alerts.js** & **generate-personalized-alerts.js**:
   - Log warning if `trade_volume <= 0` or `null`
   - Use fallback percentage-based analysis with clear messaging
   - Mark alerts with `⚠️ Volume not provided` badge

---

## 📝 Files Requiring Changes

| File | Issues | Priority | Lines |
|------|--------|----------|-------|
| `pages/api/generate-personalized-alerts.js` | tradeVolume field name | HIGH | 96 |
| `pages/trade-risk-alternatives.js` | tradeVolume field names (3 places) | HIGH | 96, 109, 226 |
| `components/alerts/USMCAIntelligenceDisplay.js` | Inline styles (15+) | MEDIUM | 39-284 |
| `pages/api/consolidate-alerts.js` | Trade volume validation | MEDIUM | 313 |
| `pages/trade-risk-alternatives.js` | Component data enrichment | MEDIUM | 99-116 |

---

## ✅ Testing Checklist

After fixes:
- [ ] Alert page loads with correct trade volume displayed
- [ ] Component table shows tariff rates (not dashes)
- [ ] Consolidated alerts show dollar amounts (not "unknown")
- [ ] AI-generated alerts are relevant to user's components
- [ ] All styling uses CSS classes (no inline styles)
- [ ] Console shows no field name warnings
- [ ] Responsive design works on mobile

---

## 🔍 Root Cause Analysis

**Why is the alert system a mess?**

1. **Field Name Proliferation**: 5 different field name variants (`trade_volume`, `tradeVolume`, `annual_trade_volume`, `annual_volume`, `annualTradeVolume`) were used across components without standardization

2. **Incomplete Data Hydration**: Components loaded from different sources (workflows vs crisis alerts) have different field structures, causing missing tariff data

3. **CSS Styling Inconsistency**: Early development used inline styles for rapid iteration, but CLAUDE.md requires CSS class-based styling only

4. **No Data Validation**: Alert API endpoints accept data without checking required fields (trade_volume, component origins) before passing to AI

5. **Silent Failures**: Missing data silently defaults to 0 or empty, masking bugs instead of logging warnings

---

## Business Impact

**Current State**:
- ❌ Alert page shows $0 trade volume (wrong)
- ❌ Component tariff data missing (shows dashes)
- ❌ Alerts are generic (not relevant to user's actual trade profile)
- ❌ Styling inconsistent (inline vs CSS classes)

**After Fixes**:
- ✅ Correct trade volume displayed
- ✅ Component costs visible
- ✅ Alerts personalized to actual trade profile
- ✅ Consistent professional styling

---

**Next Action**: Begin Phase 1 field name fixes
