# Triangle Intelligence Platform - Pricing & Subscription Limits
**Last Updated:** November 3, 2025
**Source of Truth:** This document consolidates all pricing from code, database, and documentation

---

## 📊 ACTUAL PRICING (From pages/pricing.js)

| Tier | Monthly Price | Annual Price | Annual Savings |
|------|---------------|--------------|----------------|
| **Free Trial** | $0 | $0 | 7 days only |
| **Starter** | $99 | $950 | $238/year (20%) |
| **Professional** | $299 | $2,850 | $738/year (21%) |
| **Premium** | $599 | $5,750 | $1,438/year (20%) |

---

## 🔢 SUBSCRIPTION LIMITS (From lib/services/usage-tracking-service.js)

### USMCA Analyses Per Month

| Tier | Analyses/Month | Cost per Analysis | Notes |
|------|----------------|-------------------|-------|
| **Trial** | 1 | $0 | 3 components max |
| **Starter** | 10 | $9.90 | 10 components max |
| **Professional** | 100 | $2.99 | 15 components max |
| **Premium** | 500 | $1.20 | 20 components max |

**Important:** Premium limit was recently changed from 999,999 to 500 to prevent AI cost abuse.

### Portfolio Briefings Per Month

**Current Implementation Status:** Portfolio briefing limits are NOT enforced in code yet.

**Recommended Limits** (based on AI cost analysis):

| Tier | Briefings/Month | AI Cost | Net Margin | Use Case |
|------|-----------------|---------|------------|----------|
| **Trial** | 3 | $0.12 | -$0.12 | Loss leader to show value |
| **Starter** | 50 | $2.00 | $97 (98%) | 1-2/day monitoring |
| **Professional** | 200 | $8.00 | $291 (97%) | 6-7/day monitoring |
| **Premium** | 1,000 | $40.00 | $559 (93%) | 33/day - high volume |

**AI Cost Calculation:**
- Each portfolio briefing costs **$0.04** (OpenRouter Claude 3.5 Haiku)
- 2-tier fallback (OpenRouter → Anthropic) maintains same cost
- Database fallback is FREE but STALE (last updated Jan 2025)

---

## 💰 PROFIT MARGIN ANALYSIS

### With Current Limits

| Tier | Price | Analyses Cost | Briefings Cost | Total Cost | Net Profit | Margin |
|------|-------|---------------|----------------|------------|------------|--------|
| Trial | $0 | $0.04 (AI) | $0.12 | $0.16 | -$0.16 | Loss leader |
| Starter | $99 | $0.40 | $2.00 | $2.40 | $96.60 | **98%** ✅ |
| Professional | $299 | $4.00 | $8.00 | $12.00 | $287.00 | **96%** ✅ |
| Premium | $599 | $20.00 | $40.00 | $60.00 | $539.00 | **90%** ✅ |

**Key Insight:** Even with generous limits, margins remain excellent (90%+) due to high pricing vs low AI costs.

---

## 🚨 ABUSE PREVENTION

### Rate Limiting (Not Yet Implemented)

**Recommended Implementation:**
- 100 requests/minute per user on tariff endpoints
- 10 portfolio briefings/hour (prevents spam)
- Exponential backoff for repeated failures

### Commitment Periods (From pricing.js)

| Tier | Lock Period | Purpose |
|------|-------------|---------|
| Starter | None | Easy trial for SMBs |
| Professional | 30 days | Prevents churn, ensures stable workflow |
| Premium | 60 days | Protects high-volume discounts |

**Downgrade Rules:**
- Cannot downgrade during lock period
- Can upgrade anytime (prorated credit)
- Cancel anytime after lock expires

---

## 📈 FEATURE COMPARISON

### Free Trial (7 Days)
- ✅ 1 USMCA analysis (max 3 components)
- ✅ Certificate preview (watermarked)
- ✅ View crisis alerts dashboard
- ✅ AI HS code suggestions
- ❌ No email alerts
- ❌ No PDF downloads

### Starter ($99/month)
- ✅ 10 USMCA analyses/month
- ✅ 10 components per analysis
- ✅ Basic trade alerts
- ✅ Certificate generation (PDF)
- ✅ AI HS code suggestions
- ✅ Email alerts enabled

### Professional ($299/month) - **Most Popular**
- ✅ 100 USMCA analyses/month
- ✅ 15 components per analysis
- ✅ Real-time crisis alerts with AI impact scoring
- ✅ Detailed AI-powered compliance guidance
- ✅ Portfolio briefing reports
- ✅ Email alerts enabled
- ⚠️ 30-day commitment

### Premium ($599/month)
- ✅ 500 USMCA analyses/month
- ✅ 20 components per analysis
- ✅ Real-time crisis alerts with AI impact scoring
- ✅ Advanced portfolio briefing reports
- ✅ Priority AI analysis queue
- ✅ Email alerts enabled
- ⚠️ 60-day commitment

---

## 🔧 IMPLEMENTATION STATUS

### ✅ Fully Implemented
- [x] Stripe payment processing
- [x] Subscription tier enforcement
- [x] USMCA analysis limits (1/10/100/500)
- [x] Component count limits (3/10/15/20)
- [x] PDF watermark for Trial users
- [x] Invoice tracking in database

### ⚠️ Partially Implemented
- [ ] Portfolio briefing limits (API exists, limits not enforced)
- [ ] Rate limiting (100 req/min recommendation)
- [ ] Cross-tab usage sync
- [ ] Overage warnings (when approaching limit)

### ❌ Not Implemented
- [ ] Overage fees ($0.10/analysis beyond limit)
- [ ] Enterprise tier ($500+/month custom limits)
- [ ] Commitment period enforcement (relies on Stripe)
- [ ] Usage analytics dashboard

---

## 📝 DATABASE SCHEMA

### monthly_usage_tracking
```sql
CREATE TABLE monthly_usage_tracking (
  user_id UUID REFERENCES auth.users(id),
  month_year VARCHAR(7),  -- Format: "2025-11"
  analysis_count INTEGER DEFAULT 0,
  certificate_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, month_year)
);
```

### user_profiles
```sql
CREATE TABLE user_profiles (
  user_id UUID REFERENCES auth.users(id),
  subscription_tier VARCHAR(50),  -- 'Trial', 'Starter', 'Professional', 'Premium'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 NEXT STEPS (Priority Order)

### P0 - Critical (Do Now)
1. **Enforce portfolio briefing limits**
   - Add limit check in `/api/generate-portfolio-briefing.js`
   - Return 429 error when limit exceeded
   - Show remaining count in UI

2. **Add usage warnings**
   - Alert user at 80% usage (80 analyses for Professional)
   - Show usage count in dashboard
   - Email notification at 90% usage

3. **Implement rate limiting**
   - 100 req/min per user on tariff endpoints
   - 10 briefings/hour to prevent spam
   - Redis or database-based rate limiter

### P1 - Important (Do This Week)
4. **Usage analytics dashboard**
   - Show current month usage vs limit
   - Historical usage chart (last 6 months)
   - Export usage report for accounting

5. **Overage handling**
   - Soft limit: Warn user at 100% usage
   - Hard limit: Block requests at 110% usage
   - Overage fees: $0.10/analysis beyond limit

### P2 - Nice to Have (Do Later)
6. **Enterprise tier**
   - Custom pricing ($500+/month)
   - 1,000+ analyses/month
   - Dedicated account manager
   - Custom integrations

7. **Usage optimization**
   - Batch analysis API (analyze 10 products at once)
   - Cached results for repeat queries
   - Bulk upload CSV for high-volume users

---

## 💡 BUSINESS INSIGHTS

### Customer Value Proposition

**Small Importer (Starter $99/mo):**
- Analyzes 10 products/month
- Saves $10k-20k/year vs customs broker
- ROI: **100x+** (saves $20k, pays $1,188/year)

**Medium Importer (Professional $299/mo):**
- Analyzes 100 products/month
- Saves $50k-100k/year vs customs broker
- ROI: **30x+** (saves $100k, pays $3,588/year)

**Large Importer (Premium $599/mo):**
- Analyzes 500 products/month
- Saves $200k-500k/year vs full-time trade team
- ROI: **40x+** (saves $300k, pays $7,188/year)

### Cost Structure

**Fixed Costs:**
- Supabase: $25/month (Pro plan)
- Vercel: $20/month (Pro plan)
- Stripe: 2.9% + $0.30 per transaction
- Total: ~$50/month fixed

**Variable Costs:**
- AI classification: $0.04/analysis (OpenRouter)
- Portfolio briefing: $0.04/briefing (OpenRouter)
- Email delivery: $0.001/email (SendGrid)
- Total: ~$0.05/user/month at median usage

**Break-Even Analysis:**
- Need ~2 Starter users to cover fixed costs
- Every additional user is 90%+ profit margin
- At 100 users: $50 fixed + $5 variable = $55 total cost, $10k revenue = **99.5% margin**

---

## 🔗 RELATED FILES

- **Pricing Page:** `pages/pricing.js` (680 lines)
- **Usage Tracking:** `lib/services/usage-tracking-service.js` (300+ lines)
- **Subscription Enforcement:** `pages/api/ai-usmca-complete-analysis.js` (checks tier limits)
- **Payment Webhooks:** `pages/api/stripe/webhook.js` (updates subscription status)
- **User Profile:** `user_profiles` table in Supabase

---

## ⚠️ IMPORTANT NOTES

1. **Premium limit changed Oct 2025:** Was 999,999 analyses/month (unlimited), now 500 to prevent AI cost abuse
2. **Portfolio briefing limits NOT enforced yet:** API exists, but no limit check in code
3. **Commitment periods enforced by Stripe:** No downgrade API implemented yet
4. **Trial users see watermarked PDFs:** Actual implementation is in `lib/utils/usmca-certificate-pdf-generator.js`
5. **Usage resets monthly:** Based on `month_year` column in `monthly_usage_tracking` table

---

**Last Verified:** November 3, 2025
**Verified Against:**
- `pages/pricing.js` (actual pricing display)
- `lib/services/usage-tracking-service.js` (tier limit map)
- Supabase database schema (monthly_usage_tracking, user_profiles)
- OpenRouter pricing (Claude 3.5 Haiku = $0.04/request)
