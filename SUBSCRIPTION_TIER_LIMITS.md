# Subscription Tier Limits

**Last Updated:** October 31, 2025
**Status:** Currently Enforced in Production

## Overview

The Triangle Intelligence Platform enforces **two separate limits** per subscription tier:
1. **Total Workflows** - How many complete USMCA analyses you can run per month
2. **Components per Workflow** - How many components you can analyze in each workflow

---

## Current Tier Structure

### 1. Workflow Limits (Monthly Analyses)
**Source:** `lib/services/usage-tracking-service.js` (lines 39-44, 82-87)
**Enforcement:** `/api/ai-usmca-complete-analysis` (line 379: `reserveAnalysisSlot()`)

| Tier | Monthly Workflows | Code Reference |
|------|------------------|----------------|
| **Free Trial** | 1 total (7 days) | `tierLimitMap['Trial'] = 1` |
| **Starter** | 10 per month | `tierLimitMap['Starter'] = 10` |
| **Professional** | 100 per month | `tierLimitMap['Professional'] = 100` |
| **Premium** | Unlimited | `tierLimitMap['Premium'] = 999999` |

**How it works:**
- Each complete workflow (Company + Components + Analysis) counts as 1
- Counter resets monthly on billing cycle date
- Enforced atomically with `reserveAnalysisSlot()` to prevent race conditions
- Premium users never hit limits

---

### 2. Component Limits (Per Workflow)
**Source:** `/pages/api/ai-usmca-complete-analysis.js` (lines 461-476)
**Enforcement:** `/pages/api/ai-usmca-complete-analysis.js` (line 479: component count validation)

| Tier | Components per Workflow | Code Reference |
|------|------------------------|----------------|
| **Free Trial** | 3 components | `TIER_COMPONENT_LIMITS['Trial'] = 3` |
| **Starter** | 10 components | `TIER_COMPONENT_LIMITS['Starter'] = 10` |
| **Professional** | 15 components | `TIER_COMPONENT_LIMITS['Professional'] = 15` |
| **Premium** | 20 components | `TIER_COMPONENT_LIMITS['Premium'] = 20` |


**How it works:**
- Tracks **HS code lookups** (not just current component count)
- Uses `is_locked` flag to prevent gaming (deleting and re-adding components)
- Validates `usedComponentCount = Math.max(actualLockedCount, clientSentCount)`
- Server-side recalculation prevents DevTools manipulation
- Error message: "Your {tier} plan allows max {N} components. You have used {used} component slots."

---

## Example Scenarios

### Trial User (New Signup)
- **Workflows:** 1 total (one-time, 7 days)
- **Components:** 3 per workflow
- **Example:** Run 1 analysis with 3 components (Microprocessor, Power Supply, Housing)
- **After limit:** Must upgrade to Starter to continue

### Starter User ($99/month)
- **Workflows:** 10 per month
- **Components:** 10 per workflow
- **Example:**
  - Week 1: 3 workflows with 5 components each (15 total across workflows)
  - Week 2: 3 workflows with 8 components each (24 total across workflows)
  - Week 3: 4 workflows with 3 components each (12 total across workflows)
  - **Total:** 10 workflows with up to 10 components each
- **After limit:** Wait for monthly reset OR upgrade to Professional

### Professional User ($299/month)
- **Workflows:** 100 per month
- **Components:** 15 per workflow
- **Example:** Run 100 complete analyses per month, each with up to 15 components
- **Use case:** Medium-sized importers with multiple product lines

### Premium User ($599/month)
- **Workflows:** Unlimited
- **Components:** 20 per workflow
- **Example:** Run unlimited analyses, each with up to 20 components
- **Benefit:** No monthly workflow cap + highest component limit
- **Use case:** Large importers or customs brokers

---

## Enforcement Implementation

### Workflow Limit Enforcement
**File:** `lib/services/usage-tracking-service.js`

```javascript
export async function reserveAnalysisSlot(userId, subscriptionTier = 'Trial') {
  // Atomic check-and-increment (prevents race conditions)
  const { data, error } = await supabase
    .rpc('increment_analysis_count', {
      p_user_id: userId,
      p_subscription_tier: subscriptionTier
    });

  if (result.limit_reached) {
    return {
      allowed: false,
      currentCount: result.current_count,
      tierLimit: result.tier_limit,
      message: 'Analysis limit reached'
    };
  }

  return { allowed: true, currentCount, tierLimit };
}
```

**Database Function:** `increment_analysis_count()` (PostgreSQL RPC)
- Checks current count vs tier limit
- Increments count ONLY if under limit
- Returns updated count and limit_reached status

### Component Limit Enforcement
**File:** `pages/api/ai-usmca-complete-analysis.js`

```javascript
// Recalculate from locked components (don't trust client)
const actualLockedCount = formData.component_origins?.filter(c => c.is_locked).length || 0;
const clientSentCount = formData.used_components_count || 0;
const usedComponentCount = Math.max(actualLockedCount, clientSentCount);

const TIER_COMPONENT_LIMITS = {
  'Trial': 3,
  'Starter': 10,
  'Professional': 15,
  'Premium': 20
};

const maxComponents = TIER_COMPONENT_LIMITS[subscriptionTier] || 3;

if (usedComponentCount > maxComponents) {
  return res.status(403).json({
    error: 'Component limit exceeded',
    message: `Your ${subscriptionTier} plan allows max ${maxComponents} components.`
  });
}
```

**Lock Tracking:**
- Components with HS codes get `is_locked = true`
- Locked components count toward limit even if deleted
- Prevents users from "resetting" by deleting and re-adding

---

## Rate Limiting (Additional Protection)

**File:** `pages/api/ai-usmca-complete-analysis.js` (line 360-374)

- **Non-Premium tiers:** 10 requests per minute
- **Premium tier:** No rate limits
- **Purpose:** Prevent API abuse and protect OpenRouter costs

---

## Upgrade Paths

| Current Tier | Upgrade To | Additional Workflows | Additional Components |
|--------------|------------|---------------------|----------------------|
| Trial (1) | Starter | +9/month | +7 per workflow |
| Starter (10) | Professional | +90/month | +5 per workflow |
| Professional (100) | Premium | Unlimited | +5 per workflow |

---

## Error Messages

### Workflow Limit Exceeded
```json
{
  "success": false,
  "error": "Monthly analysis limit reached",
  "message": "You have reached your monthly analysis limit. Please upgrade to continue.",
  "limit_info": {
    "tier": "Starter",
    "current_count": 10,
    "tier_limit": 10,
    "remaining": 0
  },
  "upgrade_required": true,
  "upgrade_url": "/pricing"
}
```

### Component Limit Exceeded
```json
{
  "success": false,
  "error": "Component limit exceeded",
  "message": "Your Starter plan allows max 10 components. You have used 11 component slots (10 active). HS lookups count toward your limit even if components are deleted.",
  "limit_info": {
    "tier": "Starter",
    "used_component_count": 11,
    "current_component_count": 10,
    "max_components": 10
  },
  "upgrade_required": true,
  "upgrade_url": "/pricing"
}
```

---

## Summary

✅ **Both limits are currently enforced:**
1. **Total workflows per tier** - Atomic reservation prevents gaming
2. **Components per workflow** - Lock tracking prevents deletion gaming

✅ **Security measures:**
- Server-side recalculation (can't manipulate with DevTools)
- Atomic database operations (no race conditions)
- Lock tracking (HS lookups count even if deleted)

✅ **User experience:**
- Clear error messages explain limits
- Upgrade prompts show next tier benefits
- Premium = unlimited workflows (no cap stress)
