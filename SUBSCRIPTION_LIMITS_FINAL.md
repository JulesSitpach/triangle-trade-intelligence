# Triangle Intelligence - Final Subscription Limits

**Last Updated:** November 3, 2025
**Status:** ✅ Implemented in code

---

## 📊 FINAL TIER LIMITS

| Tier | Price | Workflows/Month | Components/Workflow | Briefings/Month | PDF Downloads |
|------|-------|-----------------|---------------------|-----------------|---------------|
| **Trial** | $0 (7 days) | 1 | 3 | 3 | Unlimited (watermarked) |
| **Starter** | $99/month | **15** | 10 | 50 | Unlimited |
| **Professional** | $299/month | 100 | 15 | 200 | Unlimited |
| **Premium** | $599/month | 500 | 20 | 1,000 | Unlimited |

---

## 💰 VALUE ANALYSIS

### Cost Per Workflow

| Tier | Cost/Workflow | Comparison |
|------|---------------|------------|
| Starter | $6.60 | Good entry point |
| Professional | $2.99 | **55% cheaper** than Starter ⭐ |
| Premium | $1.20 | **60% cheaper** than Professional ⭐⭐ |

### Cost Per Component

| Tier | Total Components | Cost/Component | Value |
|------|------------------|----------------|-------|
| Starter | 150 (15 × 10) | $0.66 | Good |
| Professional | 1,500 (100 × 15) | $0.20 | **70% cheaper** ⭐⭐ |
| Premium | 10,000 (500 × 20) | $0.06 | **70% cheaper** ⭐⭐⭐ |

---

## 🎯 TARGET USERS

### Starter ($99/month) - Small Importers
**Profile:**
- 10-20 products
- Single supplier relationship
- $100k-500k annual trade volume
- Occasional compliance checks

**What They Get:**
- 15 workflows (analyze all products monthly)
- 150 total components
- 50 briefings (1-2/day monitoring)

**ROI:** 5-10x savings vs customs broker

---

### Professional ($299/month) - Medium Manufacturers
**Profile:**
- 50-100 products with complex BOMs
- Multiple suppliers across USMCA region
- $1M-10M annual trade volume
- Daily compliance monitoring

**What They Get:**
- 100 workflows (re-analyze products as needed)
- 1,500 total components (15 per product)
- 200 briefings (6-7/day monitoring)

**ROI:** 30-50x savings vs professional services

---

### Premium ($599/month) - Large Enterprises
**Profile:**
- 200+ products
- Global supply chain (10+ countries)
- $10M+ annual trade volume
- Continuous monitoring + scenario planning

**What They Get:**
- 500 workflows (test multiple scenarios)
- 10,000 total components (20 per product)
- 1,000 briefings (33/day continuous monitoring)

**ROI:** 100-200x savings vs full-time compliance team

---

## 📋 WHAT COUNTS AS USAGE

### ✅ COUNTS TOWARD LIMITS

1. **USMCA Workflow Analysis** (uses 1 analysis credit)
   - Creating new workflow with components
   - Re-running analysis after component changes
   - Tracked in `monthly_usage_tracking.analysis_count`

2. **Portfolio Briefing** (uses 1 briefing credit)
   - Clicking "Get Portfolio Briefing" button
   - Generates AI analysis of components vs crisis alerts
   - Tracked in `monthly_usage_tracking.briefing_count`

### ❌ DOES NOT COUNT TOWARD LIMITS

3. **Viewing Results** - FREE
   - Viewing workflow results after creation
   - Viewing component table
   - No additional API call (data already stored)

4. **Certificate PDF Download** - FREE
   - Downloading USMCA Certificate of Origin
   - No AI cost (just PDF rendering)
   - Trial users get watermarked version

5. **Viewing Crisis Alerts** - FREE
   - Viewing alerts dashboard
   - Just database query (no AI cost)
   - Alert badge display on components

---

## 🔄 USAGE TRACKING

### Database Table: `monthly_usage_tracking`

```sql
CREATE TABLE monthly_usage_tracking (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  month_year TEXT,  -- Format: "2025-11"

  -- Usage counters
  analysis_count INTEGER DEFAULT 0,      -- Workflow analyses
  briefing_count INTEGER DEFAULT 0,      -- Portfolio briefings
  certificate_count INTEGER DEFAULT 0,   -- PDF downloads (tracked but not limited)

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Reset Logic

- Usage resets **automatically** on the 1st of each month
- New record created with `month_year` = "YYYY-MM"
- Previous months' data retained for history/analytics

---

## ⚠️ LIMIT ENFORCEMENT

### API Endpoints with Limits

1. **`/api/ai-usmca-complete-analysis`**
   - Checks `analysis_count` vs tier limit
   - Returns 403 if limit exceeded
   - Increments counter after successful analysis

2. **`/api/generate-portfolio-briefing`**
   - Checks `briefing_count` vs tier limit
   - Returns 403 if limit exceeded
   - Increments counter after successful briefing

### Error Response Example

```json
{
  "success": false,
  "error": "Monthly briefing limit reached",
  "tier": "Starter",
  "limit": 50,
  "current_usage": 50,
  "message": "You've used 50 of 50 portfolio briefings this month. Upgrade to Professional for more briefings.",
  "upgrade_required": true
}
```

---

## 💡 KEY CHANGES (Nov 3, 2025)

### 1. Starter Tier Increased
- **Before:** 10 workflows/month
- **After:** 15 workflows/month (+50%)
- **Reason:** Small businesses with 10-20 products need headroom to analyze full catalog

### 2. Portfolio Briefing Limits Added
- **Database:** Added `briefing_count` column to `monthly_usage_tracking`
- **Tracking:** Separate from workflow analysis count
- **Limits:** 3/50/200/1,000 per month (Trial/Starter/Professional/Premium)

### 3. Premium Limit Reduced
- **Before:** 999,999 workflows/month (unlimited)
- **After:** 500 workflows/month
- **Reason:** Prevent AI cost abuse (was costing $40k/month at max usage)

---

## 🚀 IMPLEMENTATION FILES

### Code Files Updated
- ✅ `lib/services/usage-tracking-service.js` - All tier limits updated to 15
- ✅ `pages/pricing.js` - Display updated to show "15 USMCA analyses"
- ✅ `monthly_usage_tracking` table - Added `briefing_count` column

### Database Changes
```sql
-- Already executed
ALTER TABLE monthly_usage_tracking
ADD COLUMN briefing_count INTEGER DEFAULT 0;
```

---

## 📈 PROFIT MARGINS

| Tier | Price | Total AI Cost | Net Profit | Margin |
|------|-------|---------------|------------|--------|
| Trial | $0 | $0.16 | -$0.16 | Loss leader |
| Starter | $99 | $3.00 | $96.00 | **97%** ✅ |
| Professional | $299 | $12.00 | $287.00 | **96%** ✅ |
| Premium | $599 | $60.00 | $539.00 | **90%** ✅ |

**AI Cost Breakdown:**
- Workflow analysis: $0.04 each (OpenRouter Claude Haiku)
- Portfolio briefing: $0.04 each (same model)
- Database fallback: $0 (stale but free)

**Even at maximum usage, margins remain excellent (90%+)**

---

## ✅ FINAL RECOMMENDATION

**Current tier structure is excellent:**
- ✅ Clear value scaling (55-60% cheaper per tier)
- ✅ Starter tier now has breathing room (15 workflows)
- ✅ Component capacity scales appropriately (10/15/20)
- ✅ Briefing limits match user monitoring needs
- ✅ 90%+ profit margins maintained

**No further changes recommended.**

---

**Implemented:** November 3, 2025
**Verified Against:**
- `lib/services/usage-tracking-service.js` (all 4 occurrences updated)
- `pages/pricing.js` (display updated)
- Supabase database schema (briefing_count column added)
