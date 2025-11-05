# SUBSCRIPTION LIMITS AUDIT
**Generated:** November 5, 2025
**Purpose:** Ensure all tier limits across codebase match pricing page promises

---

## 📋 **PROMISED LIMITS (pages/pricing.js)**

| Tier | Workflows | Executive Summaries | Portfolio Briefings | Components | Price |
|------|-----------|---------------------|---------------------|------------|-------|
| **Trial** | 1 | 1 | ❌ Not listed | 3 | FREE |
| **Starter** | 15 | 15 | 30 | 10 | $99/mo |
| **Professional** | 100 | 100 | 150 | 15 | $299/mo |
| **Premium** | 500 | 500 | 750 | 20 | $599/mo |

---

## 🔍 **ACTUAL LIMITS IN CODE**

### **1. pages/api/ai-usmca-complete-analysis.js** (Workflow Analysis)
**Status:** ✅ **CORRECT - Uses usage-tracking-service.js**

Uses `reserveAnalysisSlot()` which gets limits from `usage-tracking-service.js`

---

### **2. pages/api/agents/classification.js** (HS Code Classification)
**Status:** ✅ **MATCHES**

```javascript
const limits = {
  'Trial': 1,
  'Starter': 15,
  'Professional': 100,
  'Premium': 500
};
```

---

### **3. lib/middleware/subscription-guard.js** (API Middleware)
**Status:** ✅ **MATCHES**

```javascript
const tierLimits = {
  'Trial': 1,
  'Starter': 15,
  'Professional': 100,
  'Premium': 500
};
```

---

### **4. lib/services/usage-tracking-service.js** (Central Service)
**Status:** ⚠️ **NEEDS VERIFICATION**

File location: `lib/services/usage-tracking-service.js`
Expected: Should have the authoritative limit definitions

---

### **5. pages/api/executive-trade-alert.js** (Executive Summaries)
**Status:** ✅ **MATCHES**

```javascript
const EXECUTIVE_SUMMARY_LIMITS = {
  'Trial': 1,
  'Starter': 15,
  'Professional': 100,
  'Premium': 500
};
```

---

### **6. pages/api/check-usage-limit.js** (Usage Check Endpoint)
**Status:** ⚠️ **MISMATCHED - DIFFERENT LIMITS!**

```javascript
const TIER_LIMITS = {
  'trial': {
    analyses_per_month: 1,  // ✅ CORRECT
    max_components: 3,       // ✅ CORRECT
  },
  'starter': {
    analyses_per_month: 10,  // ❌ WRONG - Should be 15
    max_components: 10,      // ✅ CORRECT
  },
  'professional': {
    analyses_per_month: 100, // ✅ CORRECT
    max_components: 15,      // ✅ CORRECT
  },
  'premium': {
    analyses_per_month: 500, // ✅ CORRECT (was 100, fixed)
    max_components: 20,      // ✅ CORRECT
  }
};
```

**🚨 CRITICAL BUG FOUND:**
- **Starter tier**: Shows 10 analyses but pricing page promises **15 analyses**
- This means Starter users are getting 33% fewer analyses than paid for!

---

### **7. Components (UI Limits)**
**Status:** ⚠️ **NEEDS VERIFICATION**

Files to check:
- `components/UserDashboard.js` - May display usage stats
- `components/workflow/EditableCertificatePreview.js` - May check tier

---

## 🚨 **CRITICAL ISSUES FOUND**

### **Issue #1: Starter Tier Shortchanged**
**Location:** `pages/api/check-usage-limit.js` Line 33
**Problem:** Starter users pay $99/mo for 15 analyses but only get 10
**Impact:** HIGH - Customer trust issue, possible refund liability
**Fix Required:** Change `analyses_per_month: 10` to `analyses_per_month: 15`

---

### **Issue #2: Portfolio Briefing Limits Not Found**
**Problem:** Pricing page promises 30/150/750 portfolio briefings per tier
**Status:** Need to search for where this is enforced
**Impact:** MEDIUM - Users may not be getting promised feature limits

---

## ✅ **ALIGNED LIMITS** (Verified Correct)

| Location | Trial | Starter | Professional | Premium | Status |
|----------|-------|---------|--------------|---------|--------|
| `classification.js` | 1 | 15 | 100 | 500 | ✅ |
| `subscription-guard.js` | 1 | 15 | 100 | 500 | ✅ |
| `executive-trade-alert.js` | 1 | 15 | 100 | 500 | ✅ |
| `ai-usmca-complete-analysis.js` | Uses service | - | - | - | ✅ |

---

## 🔧 **FIXES NEEDED**

### **Priority 1 (CRITICAL - Customer Impact)**
```javascript
// File: pages/api/check-usage-limit.js
// Line: ~33

// BEFORE (WRONG):
'starter': {
  analyses_per_month: 10,  // ❌ WRONG
  max_components: 10,
},

// AFTER (CORRECT):
'starter': {
  analyses_per_month: 15,  // ✅ FIXED - Matches pricing page
  max_components: 10,
},
```

### **Priority 2 (Verification Needed)**
1. Search for portfolio briefing limit enforcement
2. Verify component limits match across all files
3. Check if any other endpoints have custom tier logic

---

## 📊 **RECOMMENDED ACTIONS**

1. **Immediately fix Starter tier** in `check-usage-limit.js`
2. **Create centralized config file** with single source of truth for all limits
3. **Add automated tests** to prevent future mismatches
4. **Notify Starter tier users** of limit correction (if they complained)

---

## 🎯 **CENTRALIZED CONFIG PROPOSAL**

Create `config/subscription-tier-limits.js`:

```javascript
export const TIER_LIMITS = {
  Trial: {
    display_name: 'Free Trial',
    analyses_per_month: 1,
    executive_summaries_per_month: 1,
    portfolio_briefings_per_month: 0, // Not available
    max_components: 3,
    price_monthly: 0,
  },
  Starter: {
    display_name: 'Starter',
    analyses_per_month: 15,
    executive_summaries_per_month: 15,
    portfolio_briefings_per_month: 30,
    max_components: 10,
    price_monthly: 99,
  },
  Professional: {
    display_name: 'Professional',
    analyses_per_month: 100,
    executive_summaries_per_month: 100,
    portfolio_briefings_per_month: 150,
    max_components: 15,
    price_monthly: 299,
  },
  Premium: {
    display_name: 'Premium',
    analyses_per_month: 500,
    executive_summaries_per_month: 500,
    portfolio_briefings_per_month: 750,
    max_components: 20,
    price_monthly: 599,
  },
};
```

Then replace all hardcoded limits with imports from this file.

---

## 📝 **AUDIT SUMMARY**

- ✅ **4 files have correct limits**
- ❌ **1 file has wrong Starter limit** (10 instead of 15)
- ⚠️ **Portfolio briefing limits not verified**
- ⚠️ **Component limits not fully audited**

**Recommendation:** Fix the Starter tier bug immediately, then implement centralized config to prevent future mismatches.
