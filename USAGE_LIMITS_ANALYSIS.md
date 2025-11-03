# Usage Limits Analysis - What Needs Tracking

**Last Updated:** November 3, 2025
**Purpose:** Figure out which features need usage limits and how to track them

---

## 🎯 FEATURE BREAKDOWN

### 1. ✅ USMCA Workflow Analysis (ALREADY LIMITED)

**API:** `/api/ai-usmca-complete-analysis`
**Current Status:** ✅ Fully implemented and working

**What it does:**
- User enters company info + components
- AI analyzes USMCA qualification
- Returns tariff analysis + certificate data

**Usage Logic:**
- **1 workflow = 1 analysis** (regardless of how many components)
- Tracked in `monthly_usage_tracking.analysis_count`
- Limits enforced via `lib/services/usage-tracking-service.js`

**Current Limits:**
| Tier | Analyses/Month | Status |
|------|----------------|--------|
| Trial | 1 | ✅ Working |
| Starter | 10 | ✅ Working |
| Professional | 100 | ✅ Working |
| Premium | 500 | ✅ Working |

**Recommendation:** ✅ **No changes needed** - working correctly

---

### 2. ❌ PORTFOLIO BRIEFING (WRONG LIMITS)

**API:** `/api/generate-portfolio-briefing`
**Current Status:** ⚠️ Has limits but they're WRONG

**What it does:**
- User clicks "Get Portfolio Briefing" on alerts page
- AI analyzes their components against current crisis alerts
- Returns strategic briefing with recommendations

**Current (WRONG) Limits in Code:**
```javascript
const TIER_LIMITS = {
  'Trial': 0,           // ❌ Should be 3
  'Starter': 2,         // ❌ Should be 50
  'Professional': 5,    // ❌ Should be 200
  'Premium': 500        // ✅ Correct
};
```

**Why User Needs Multiple Briefings:**
- New crisis alert announced → User wants briefing to understand impact
- Component origins changed → User wants updated briefing
- Supplier changed → User wants to see new risk assessment
- USMCA rules updated → User wants to check compliance status

**Usage Logic Decision:**
- ✅ **Track per month** (NOT per workflow)
- User can request briefing anytime they see new alerts
- Briefing is time-sensitive (policies change daily)
- Not tied to workflow creation (user may check old workflow against new alerts)

**Recommended Limits:**
| Tier | Briefings/Month | AI Cost | Use Case |
|------|-----------------|---------|----------|
| Trial | 3 | $0.12 | Try feature, see value |
| Starter | 50 | $2.00 | 1-2/day monitoring |
| Professional | 200 | $8.00 | 6-7/day monitoring |
| Premium | 1,000 | $40.00 | 33/day for high-volume |

**Tracking:**
- Add `briefing_count` column to `monthly_usage_tracking` table
- Increment on each briefing request
- Reset monthly (same as analysis_count)

**Recommendation:** 🔧 **Fix limits and add proper tracking**

---

### 3. ✅ USMCA ANALYSIS RESULTS (NO LIMIT NEEDED)

**What it is:**
- The results page after workflow completion
- Shows qualification status, tariff rates, savings
- Shows component table with tariff intelligence

**Usage Logic:**
- Results are **tied to the workflow** that created them
- User already paid 1 analysis credit when they created workflow
- Viewing results again = FREE (no additional API call)
- Results are **static** unless user edits components

**Why No Separate Limit:**
1. Results are stored in `workflow_completions` table
2. No AI API call when viewing stored results
3. No incremental cost to show results page
4. User can view results unlimited times after paying 1 analysis credit

**Recommendation:** ✅ **No limit needed** - viewing stored results is free

---

### 4. ✅ COMPONENT EDITING (COUNTS AS NEW ANALYSIS)

**What happens:**
- User edits component origin or percentage
- Must re-run analysis to get new results
- This uses 1 analysis credit

**Current Behavior:**
- When user clicks "Re-analyze" after editing → uses 1 analysis credit
- Tracked in `monthly_usage_tracking.analysis_count`
- Already enforced correctly

**Recommendation:** ✅ **Already working correctly** - no changes needed

---

### 5. ❓ EXECUTIVE TRADE ALERT (DEPRECATED?)

**API:** `/api/executive-trade-alert`
**Status:** 🤔 Not sure if this is still used

**What it does:**
- Deep dive analysis of specific policy change
- Provides 3-phase strategic roadmap
- CBP Form 29 guidance

**Questions:**
- Is this still being used in the UI?
- Or was it replaced by Portfolio Briefing?

**If Still Used:**
- Should share the same limit as Portfolio Briefing
- Both are "strategic analysis" features
- Both cost $0.04 AI per request

**Recommendation:** 🔍 **Need to verify if this is still used**

---

### 6. ✅ CERTIFICATE PDF GENERATION (NO LIMIT NEEDED)

**What it is:**
- Download PDF of USMCA Certificate of Origin
- Based on workflow results
- Trial users get watermarked version

**Usage Logic:**
- Certificate data already created during workflow analysis
- PDF generation is just formatting (no AI cost)
- Tracked in `monthly_usage_tracking.certificate_count`

**Current Behavior:**
- Trial users: Watermarked PDF (unlimited downloads)
- Paid users: Clean PDF (unlimited downloads)

**Why No Limit:**
- No AI API cost (just PDF rendering)
- Certificate is derived from workflow (already paid for)
- User may need to download multiple times (printing, sharing, customs)

**Recommendation:** ✅ **No limit needed** - PDF generation is free after workflow

---

### 7. ✅ CRISIS ALERTS VIEWING (NO LIMIT NEEDED)

**API:** `/api/get-crisis-alerts`
**What it does:**
- Fetches current crisis alerts from database
- Shows which alerts match user's components

**Usage Logic:**
- Just a database query (no AI cost)
- Alerts are **read-only** (fetched from `crisis_alerts` table)
- No incremental cost per view

**Recommendation:** ✅ **No limit needed** - viewing alerts is free

---

## 📊 SUMMARY: WHAT NEEDS LIMITS

| Feature | Needs Limit? | Current Status | Action Needed |
|---------|--------------|----------------|---------------|
| USMCA Workflow Analysis | ✅ Yes | ✅ Working | None |
| Portfolio Briefing | ✅ Yes | ❌ Wrong limits | Fix limits, add tracking |
| View Results | ❌ No | ✅ Free | None |
| Component Editing | ✅ Yes | ✅ Working | None (counts as new analysis) |
| Executive Trade Alert | ❓ Maybe | 🤔 Unknown | Check if still used |
| Certificate PDF | ❌ No | ✅ Free | None |
| View Crisis Alerts | ❌ No | ✅ Free | None |

---

## 🔧 REQUIRED CHANGES

### 1. Add Briefing Tracking to Database

```sql
-- Add briefing_count column to monthly_usage_tracking
ALTER TABLE monthly_usage_tracking
ADD COLUMN briefing_count INTEGER DEFAULT 0;
```

### 2. Fix Portfolio Briefing Limits

**File:** `pages/api/generate-portfolio-briefing.js`

**Current (WRONG):**
```javascript
const TIER_LIMITS = {
  'Trial': 0,
  'Starter': 2,
  'Professional': 5,
  'Premium': 500
};
```

**Should Be:**
```javascript
const BRIEFING_LIMITS = {
  'Trial': 3,
  'Starter': 50,
  'Professional': 200,
  'Premium': 1000
};
```

**Also Change:**
- Use `monthly_usage_tracking.briefing_count` instead of `user_profiles.analyses_this_month`
- Keep analysis_count separate (they're different features)

### 3. Update Usage Tracking Service

**File:** `lib/services/usage-tracking-service.js`

Add new functions:
```javascript
export async function checkBriefingLimit(userId, subscriptionTier = 'Trial') {
  // Check briefing_count against tier limit
}

export async function incrementBriefingCount(userId, subscriptionTier = 'Trial') {
  // Increment briefing_count in monthly_usage_tracking
}
```

---

## 💡 KEY INSIGHTS

### Why Portfolio Briefing Needs Its Own Limit

**User Story:**
1. User creates 1 workflow in January (uses 1 analysis credit)
2. February: New Section 301 tariff announced affecting China components
3. User wants briefing to understand impact (uses 1 briefing credit)
4. March: Another alert on Mexico labor rules
5. User wants another briefing (uses another briefing credit)

**Total Usage:**
- 1 workflow analysis (tracked in `analysis_count`)
- 2 portfolio briefings (tracked in `briefing_count`)

**Without Separate Tracking:**
- User would need 3 analysis credits to understand 2 alerts
- That's wasteful - they don't need new workflow analysis, just policy impact analysis

**With Separate Tracking:**
- User uses 1 analysis credit (workflow)
- User uses 2 briefing credits (alerts)
- More fair pricing model

---

## 📋 RECOMMENDED TIER LIMITS (FINAL)

| Tier | Analyses/Month | Briefings/Month | Components/Analysis | PDF Downloads |
|------|----------------|-----------------|---------------------|---------------|
| **Trial** | 1 | 3 | 3 | Unlimited (watermarked) |
| **Starter** | 10 | 50 | 10 | Unlimited |
| **Professional** | 100 | 200 | 15 | Unlimited |
| **Premium** | 500 | 1,000 | 20 | Unlimited |

**Cost Analysis:**
- Trial: $0.04 (1 analysis) + $0.12 (3 briefings) = **$0.16 cost**
- Starter: $0.40 + $2.00 = **$2.40 cost** (97.6% margin on $99)
- Professional: $4.00 + $8.00 = **$12.00 cost** (96% margin on $299)
- Premium: $20.00 + $40.00 = **$60.00 cost** (90% margin on $599)

**Still Excellent Margins!** 90%+ even with generous briefing limits.

---

## 🎯 NEXT STEPS

1. ✅ Add `briefing_count` column to database
2. ✅ Fix limits in `/api/generate-portfolio-briefing.js`
3. ✅ Add briefing tracking functions to usage service
4. ✅ Update UI to show briefing usage counter
5. ❓ Check if Executive Trade Alert is still used (may need same limits)

---

**Decision Required:**
Should we track briefings **per workflow** or **per month**?

**Recommendation: Per Month** because:
- User may want briefing for old workflow when new alerts appear
- Briefing is about current policy landscape, not workflow creation date
- More flexible for user (can check multiple times as policies change)
- Easier to implement (same pattern as analysis_count)
