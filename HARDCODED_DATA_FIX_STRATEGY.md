# Hardcoded Misleading Data - Systematic Fix Strategy

## Crisis Summary
**189 instances of hardcoded misleading data** found in production code.
This is not a bug - this is a **data integrity crisis at scale**.

### Severity Breakdown
- **85 CRITICAL** - Users making $300K+ decisions based on fake data
- **21 HIGH** - Claiming data currency without timestamps
- **83 MEDIUM** - False "real-time" claims with cached data

---

## Priority 1: CRITICAL UI-Facing (Fix Immediately)

### 🚨 Most Dangerous: User-Facing Display Components

**Already Fixed (Nov 6, 2025):**
✅ `components/workflow/results/USMCAQualification.js:196-254`
   - Replaced hardcoded "Section 301: +7.5% to +25%" range with actual AI rate
   - Added verification timestamps
   - Added cache expiry warnings

**Still Broken:**

#### 1. **Hardcoded Savings in AI Prompts** (executive-trade-alert.js:592, 539)
```javascript
// WRONG (Current):
"potential_savings": "e.g., $743,750/year if all Chinese components moved to Mexico"

// RIGHT (Fix):
potential_savings: `$${calculateNearshoring Savings(workflow_intelligence)}/year`
```
**Impact:** AI learns from fake examples → generates fake savings claims → users make sourcing decisions based on fabricated numbers.

**Data Source Contract:**
```javascript
function calculateNearshoringSavings(workflow) {
  const {
    trade_volume,        // From user input (Step 1)
    component_origins,   // From AI classification (Step 2)
    section_301_rates    // From AI tariff lookup (ai-usmca-complete-analysis)
  } = workflow;

  // Calculate: Only components that would move from China → Mexico
  const chinaComponents = component_origins.filter(c => c.origin_country === 'CN');
  const chinaValue = chinaComponents.reduce((sum, c) => sum + (c.value_percentage / 100), 0);
  const section301Burden = chinaComponents.reduce((sum, c) =>
    sum + (trade_volume * (c.value_percentage / 100) * (c.section_301 || 0)), 0
  );

  return section301Burden; // Actual savings, not example "$743,750"
}
```

**Lock Down Source of Truth:**
- ✅ trade_volume: user_profiles.trade_volume (user-submitted, NOT estimated)
- ✅ component origins: workflow_sessions.workflow_data.component_origins (AI-classified)
- ✅ section_301: policy_tariffs_cache OR tariff_intelligence_master (AI-fetched with timestamp)
- ❌ DO NOT use examples, typical values, or averages

---

#### 2. **"Real-Time" False Claims** (56 instances)

**Most Critical Locations:**
- `pages/api/cron/send-daily-tariff-digest.js:282, 295`
  - Email claims "Real-time tariff monitoring"
  - Actually: Daily digest of cached changes (24-hour delay minimum)

```javascript
// WRONG (Current):
textBody += `Real-time tariff monitoring for USMCA compliance\n`;

// RIGHT (Fix):
textBody += `Daily tariff monitoring (updates detected within 24 hours)\n`;
textBody += `Last checked: ${new Date().toLocaleString()}\n`;
```

- `pages/api/dashboard-data.js:5`
  - Comment claims "Real-time crisis alerts"
  - Actually: RSS polling every N hours → cached in crisis_alerts table

```javascript
// WRONG:
* 2. Real-time crisis alerts from RSS monitoring

// RIGHT:
* 2. Crisis alerts from RSS monitoring (polled every 6 hours, cached in crisis_alerts table)
```

**Fix Pattern:**
1. Search: `real-time|Real-time|real time`
2. Determine actual update frequency:
   - RSS polling: Every 6 hours
   - Tariff cache: 7-30 day TTL
   - AI calls: On-demand (2-5 second latency)
3. Replace with honest claim + timestamp

---

#### 3. **Hardcoded Section 301 Rates** (15 instances)

**Most Dangerous:**
- `pages/api/ai-usmca-complete-analysis.js:102`
  ```javascript
  // WRONG:
  - Section 301: 50% (current Chinese semiconductor policy)

  // RIGHT:
  - Section 301: ${aiRates.section_301 * 100}% (verified ${aiRates.verified_date})
  ```

**Fix Pattern:**
1. Find AI prompt examples with hardcoded rates
2. Replace with template variables pulling from actual API response
3. Add null handling: `${aiRates.section_301 ?? 'calculating...'}%`

---

## Priority 2: CRITICAL Backend Logic (Fix Before Scaling)

### Data Contract Violations

#### **Hardcoded Rate Ranges** (3 instances)
These hide the specific value users need:

```javascript
// WRONG (lib/agents/section301-agent.js:106-107):
- Some List 3 increased from 7.5% to 25%
- Some List 4A increased from 15% to 25%

// RIGHT:
- List 3 current rate: ${list3Rate}% (USTR verified ${verifiedDate})
- List 4A current rate: ${list4ARate}% (USTR verified ${verifiedDate})
```

**Why This Matters:**
User asks: "What's my Section 301 rate for HS 8542.31.00?"
- WRONG: "Between 7.5% and 25%" → User can't file customs docs
- RIGHT: "25% (USTR List 4A, verified 11/6/2025)" → Audit-ready answer

---

## Priority 3: HIGH - Timestamp Violations (21 instances)

### Hardcoded Dates Claiming Currency

**Pattern:**
```javascript
// WRONG:
"as of May 2, 2025"
"verified August 29, 2025"
"effective December 30, 2024"

// RIGHT:
`as of ${data.verified_date || 'unknown'}`
`verified ${new Date(data.last_updated).toLocaleDateString()}`
`effective ${policy.effective_date} (cached ${policy.cache_expires_at})`
```

**Database Schema Check:**
```sql
-- Ensure these timestamp columns exist:
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('policy_tariffs_cache', 'tariff_intelligence_master', 'crisis_alerts')
AND column_name IN ('verified_date', 'expires_at', 'last_updated', 'created_at');
```

---

## Priority 4: MEDIUM - "Current" Claims Without Proof (83 instances)

### Pattern to Fix:
```javascript
// WRONG:
"Verify current rates before shipment"
"Current rate is 25%"
"Latest Section 301 policy"

// RIGHT:
`Verify rates before shipment (last verified: ${component.verified_date})`
`Current rate: ${component.total_rate * 100}% (expires ${component.expires_at})`
`Section 301 policy (USTR updated ${policy.last_ustr_check})`
```

---

## Implementation Plan

### Phase 1: Stop the Bleeding (This Week)
1. ✅ **DONE:** Fix USMCAQualification.js tariff range display
2. **TODO:** Fix executive-trade-alert.js savings calculations
3. **TODO:** Remove/correct all 56 "real-time" false claims
4. **TODO:** Add timestamps to all "current rate" UI displays

### Phase 2: Data Contract Enforcement (Next Week)
1. Create `lib/contracts/savings-calculator.js` - Single source of truth
2. Create `lib/contracts/tariff-rate-formatter.js` - Standardized display with timestamps
3. Audit all AI prompts - remove hardcoded example values
4. Add TypeScript interfaces for all tariff rate objects

### Phase 3: CI/CD Prevention (Week 3)
1. Add `npm run audit:misleading-data` to pre-commit hooks
2. Block merges if CRITICAL findings > 0
3. Add Vercel build check: `node scripts/hardcoded-misleading-data-audit.js`
4. Create dashboard: Track findings over time (should trend to 0)

---

## Success Metrics

**Before (Nov 6, 2025):**
- ❌ 189 instances of misleading hardcoded data
- ❌ Users see "7.5% to 25%" ranges instead of their specific 25% rate
- ❌ "$743,750 savings" fabricated in AI prompts
- ❌ "Real-time" claims for 24-hour cached data

**After (Target: Nov 13, 2025):**
- ✅ 0 CRITICAL findings in UI components
- ✅ All rates show verification timestamps
- ✅ All savings calculated from user's actual trade_volume
- ✅ Honest cache freshness claims ("updated daily", not "real-time")
- ✅ CI blocks deployments with hardcoded misleading data

---

## Sub-Agent Task Assignments

### Agent 1: Savings Calculator Refactor
**Files:**
- `pages/api/executive-trade-alert.js` (lines 539, 592)
- `components/workflow/results/*` (any savings display)

**Task:** Replace all hardcoded savings examples with actual calculations from:
```javascript
{
  trade_volume: user_profiles.trade_volume,
  component_value_percentages: workflow_sessions.component_origins[].value_percentage,
  section_301_rates: component_origins[].section_301,
  verified_dates: component_origins[].verified_date
}
```

### Agent 2: "Real-Time" Claims Cleanup
**Files:** 56 files (see audit report)

**Task:**
1. Determine actual update frequency for each claim
2. Replace "real-time" with honest interval ("updated daily", "checked hourly")
3. Add last-checked timestamps where data is displayed

### Agent 3: Timestamp Infrastructure
**Files:** All UI components displaying tariff rates

**Task:**
1. Add `verified_date` and `expires_at` to all rate displays
2. Create visual freshness indicators:
   - ✅ Fresh (< 7 days old)
   - ⚠️ Aging (7-30 days old)
   - 🔴 Stale (> 30 days old)
3. Add "last verified" tooltips to all rate numbers

---

## Compliance & Legal Risk

**Current State:**
- Users filing CBP Form 434 (USMCA Certificate) with rates from our platform
- If rate is wrong (because hardcoded/stale), CBP can:
  - Assess back duties ($50K-$500K typical)
  - Impose 40% penalty for "lack of reasonable care"
  - Blacklist importer for 2+ years

**Our Liability:**
- Terms of Service say "Users verify accuracy"
- BUT: Showing "Section 301: 25% (verified 11/6/2025)" creates reasonable reliance
- Showing "Section 301: 7.5% to 25%" with no date = negligent misrepresentation

**Fix Priority:**
1. Remove all hardcoded rates from certificate-generating paths
2. Add timestamps to ALL tariff displays
3. Add disclaimer: "Rates subject to change - verify with CBP before filing"

---

## Next Action
Run: `node scripts/hardcoded-misleading-data-audit.js`
Review: `hardcoded-misleading-data-report.json`
Fix: Start with Priority 1 (UI-facing CRITICAL findings)
