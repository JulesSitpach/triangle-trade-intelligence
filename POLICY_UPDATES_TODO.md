# POLICY UPDATES - IMPLEMENT AFTER TABLE DISPLAY FIX

**Status:** Postponed until table display is correct
**Priority:** P2 (After component table shows correct MFN rates)

---

## 🔔 Alert Push Service - COMPLETED ✅

- ✅ `lib/services/alert-push-service.js` created
- ✅ Finds affected users from workflow_sessions
- ✅ Calculates financial impact per user
- ✅ Pushes alerts to `dashboard_notifications` table
- ✅ Tier gating (free vs paid users)
- ✅ Duplicate prevention (last 7 days)
- ✅ Severity levels (critical/high/medium/low)
- ✅ What-if scenarios (Mexico sourcing savings)

---

## 📋 TODO: Complete Policy Update Flow

### 1. Create `lib/tariff/policy-parser.js`
**Purpose:** AI parses RSS announcements to extract structured policy changes

```javascript
/**
 * Parse RSS announcement to extract tariff policy changes
 * Example: "Section 301 on semiconductors (HS 8542.xx) increased to 70%"
 *
 * Returns:
 * {
 *   policy_type: "section_301",
 *   hs_codes_affected: ["8542.31.00", "8542.32.00"],
 *   old_rate: 0.60,
 *   new_rate: 0.70,
 *   effective_date: "2025-11-15",
 *   confidence: 0.95
 * }
 */
export async function parsePolicyChange(announcement) {
  // Use OpenRouter AI to extract structured data
  // Prompt: Extract policy type, HS codes, old/new rates, effective date
  // Return JSON with confidence score
}
```

---

### 2. Create `lib/tariff/database-sync.js`
**Purpose:** Update tariff_intelligence_master when policy changes

```javascript
/**
 * Update database with new policy rates
 * Updates: section_301, section_232, mfn_ad_val_rate, column_2_ad_val_rate
 */
export async function syncPolicyChange(policyChange) {
  const { policy_type, hs_codes_affected, new_rate } = policyChange;

  // Determine column to update
  const columnName = {
    'section_301': 'section_301',
    'section_232': 'section_232',
    'mfn_rate': 'mfn_ad_val_rate',
    'column_2': 'column_2_ad_val_rate'
  }[policy_type];

  // Update tariff_intelligence_master
  await supabase
    .from('tariff_intelligence_master')
    .update({
      [columnName]: new_rate,
      last_updated: new Date().toISOString(),
      data_source: 'policy_update_2025'
    })
    .in('hts8', normalizedHSCodes);

  return { updated_codes: hs_codes_affected.length };
}
```

---

### 3. Update `pages/api/cron/rss-polling.js`
**Purpose:** Integrate all 3 services (parse → sync → alert)

```javascript
// After detecting policy change in RSS feed:
if (isPolicyChangeAnnouncement(feedItem)) {
  // 1. Parse announcement
  const policyChange = await parsePolicyChange(feedItem.content);

  if (policyChange.confidence > 0.8) {
    // 2. Update database
    await syncPolicyChange(policyChange);

    // 3. Find affected users
    const affectedUsers = await findAffectedUsers(policyChange);

    // 4. Push alerts
    await pushPolicyChangeAlert(policyChange, affectedUsers);

    console.log(`✅ Policy update complete: ${affectedUsers.length} users notified`);
  } else {
    // Low confidence - flag for manual review
    await logDevIssue('policy_change_low_confidence', policyChange);
  }
}
```

---

### 4. Build Alert UI Components
**Purpose:** Display alerts on `/trade-risk-alternatives` page

**Components Needed:**
- `PolicyChangeAlertCard.js` - Individual alert card with financial impact
- `AlertsList.js` - List of all alerts sorted by severity
- `UpgradePromptCard.js` - Free users see "Upgrade to view details"

**Features:**
- Severity color coding (red/orange/yellow/blue)
- Financial impact display (old cost → new cost)
- What-if scenario (Mexico sourcing savings)
- Dismiss/mark as read functionality
- Policy details (HS codes, effective date, announcement link)

---

## 📊 Database Schema Addition

**Table:** `dashboard_notifications` (may already exist)

```sql
CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Alert metadata
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Financial impact
  cost_impact NUMERIC,
  old_cost NUMERIC,
  new_cost NUMERIC,

  -- Policy details
  policy_type TEXT,
  hs_codes_affected TEXT[],
  old_rate NUMERIC,
  new_rate NUMERIC,
  effective_date DATE,

  -- What-if scenarios
  mexico_sourcing_savings NUMERIC,

  -- Metadata
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_dashboard_notifications_user_id ON dashboard_notifications(user_id);
CREATE INDEX idx_dashboard_notifications_severity ON dashboard_notifications(severity);
```

---

## 🎯 Expected Behavior (After Implementation)

### Scenario: Section 301 Increases to 70%

**Day 1 - Nov 1, 2025 10:00 AM:**
```
RSS Polling detects: "Section 301 on semiconductors increased to 70%"
  ↓
AI parses: { policy_type: "section_301", hs_codes: ["8542.31.00"], new_rate: 0.70 }
  ↓
Database updated: tariff_intelligence_master.section_301 = 0.70
  ↓
Find affected users: 48 users with microprocessors
  ↓
Create alerts: 35 paid users (13 free users skipped)
```

**Day 1 - Nov 1, 2025 10:05 AM:**
```
TechFlow Electronics (Professional tier) logs in
  ↓
Dashboard shows: "⚠️ 1 New Alert"
  ↓
Clicks Alerts page
  ↓
Sees:
┌─────────────────────────────────────────────────────┐
│ 🚨 Section 301 Tariffs Increased                   │
│                                                      │
│ Your cost: $1.78M → $2.08M (+$297K/year)           │
│                                                      │
│ What-If: Mexico sourcing saves $2.08M/year         │
│                                                      │
│ Section 301: 60% → 70%                              │
│ Effective: Nov 15, 2025                             │
│ Affected: Microprocessor (8542.31.00)              │
└─────────────────────────────────────────────────────┘
```

**Day 2 - Nov 2, 2025:**
```
New user submits microprocessor analysis
  ↓
Database lookup: section_301 = 0.70 (UPDATED!) ✅
  ↓
Shows correct cost: $2.08M/year (not stale $1.78M)
```

---

## 🚀 Implementation Priority

1. **FIRST:** Fix component table display (MFN rates showing 0.0% instead of 35.0%)
2. **THEN:** Implement policy-parser.js
3. **THEN:** Implement database-sync.js
4. **THEN:** Update RSS polling cron
5. **FINALLY:** Build Alert UI components

---

**Estimated Time:** 4-6 hours after table display fix
**Dependencies:** alert-push-service.js (✅ DONE)
**Blocked By:** Component table showing incorrect MFN rates

---

**Reference Files:**
- ✅ `lib/services/alert-push-service.js` - Alert push service (DONE)
- ✅ `lib/examples/policy-update-integration-example.js` - Integration example (DONE)
- ⏳ `lib/tariff/policy-parser.js` - TODO
- ⏳ `lib/tariff/database-sync.js` - TODO
- ⏳ `pages/api/cron/rss-polling.js` - Update needed
- ⏳ `components/alerts/PolicyChangeAlertCard.js` - TODO
