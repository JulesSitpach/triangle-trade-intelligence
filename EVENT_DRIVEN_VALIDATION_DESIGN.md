# Event-Driven Tariff Rate Validation System
**Created:** November 21, 2025
**Status:** Design Phase → Implementation Week 1

## Problem Statement

**Current Issue:**
- RSS polling detects policy changes → creates alerts → NO VALIDATION
- System logs "HS code 8542.31.00 changed from 15% → 25%" based on AI parsing
- Rate is NEVER validated against government sources or cross-checked
- Users see potentially incorrect rates in their workflows

**Risk:**
- AI misreads "proposed 25%" as "effective 25%"
- Stale database cache shows 15% while real rate is 25%
- Users generate certificates with wrong rates → CBP penalties ($5,000+)

## Solution: Event-Driven Validation Trigger

**New Flow:**
```
RSS Detects Policy Change
  → AI parses announcement → Logs to tariff_changes_log
  → 🆕 IMMEDIATELY triggers RateValidationAgent (Haiku 4.5)
  → 🆕 Cross-validates with multiple sources
  → 🆕 Updates policy_tariffs_cache if confidence ≥ 80%
  → 🆕 Logs validation to rate_validation_log
  → 🆕 Marks tariff_changes_log.is_validated = true
```

**Cost:** ~$0.02-0.04 per validation (Haiku 4.5 is cheap)
**Speed:** <2 seconds typical (Haiku is fast)
**Value:** Prevents $5,000+ CBP penalties

---

## Architecture Components

### 1. RateValidationAgent (NEW)
**File:** `lib/agents/rate-validation-agent.js`

**Purpose:** AI-powered cross-validation of tariff rate changes

**Features:**
- Uses Claude Haiku 4.5 (cost-effective for validation)
- Multi-source validation (AI + Database + USITC when available)
- Source weighting hierarchy:
  - Federal Register: 100% weight (official)
  - USITC API: 100% weight (official)
  - Database cache <7 days: 80% weight
  - Database cache >7 days: 20% weight
  - AI research: 60% weight
- Returns confidence score (0.0-1.0)

**Validation Logic:**
```javascript
// Weighted agreement threshold: 150%
Federal Register (100%) + AI (60%) = 160% ✅ VALID
Database stale (20%) + AI (60%) = 80% ❌ INVALID (needs manual review)
USITC (100%) + Database fresh (80%) = 180% ✅ VALID
```

**API:**
```javascript
await rateValidationAgent.validateRate({
  hs_code: '8542.31.00',
  origin_country: 'CN',
  detected_rate: 0.25,
  current_cached_rate: 0.15,
  source: 'rss_polling',
  announcement_url: 'https://ustr.gov/...'
});

// Returns:
{
  is_valid: true,
  confidence: 0.92,
  validated_rate: 0.25,
  sources_checked: ['federal_register', 'database', 'ai_research'],
  source_weights: { federal_register: 100, database: 80, ai_research: 60 },
  agreement_score: 180,  // Needs ≥150 to auto-update
  reasoning: "Federal Register confirms 25% effective Nov 15, 2025",
  should_update_cache: true,
  validation_timestamp: '2025-11-21T10:30:00Z'
}
```

### 2. Database Schema (NEW)
**Table:** `rate_validation_log`

```sql
CREATE TABLE rate_validation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hs_code VARCHAR(10) NOT NULL,
  origin_country VARCHAR(2),
  detected_rate DECIMAL(5,4),
  validated_rate DECIMAL(5,4),
  confidence DECIMAL(3,2),
  sources_checked TEXT[],
  agreement_score INTEGER,
  validation_status VARCHAR(20), -- 'auto_approved', 'needs_review', 'rejected'
  reasoning TEXT,
  change_id UUID REFERENCES tariff_changes_log(id),
  validated_at TIMESTAMP DEFAULT NOW(),
  validated_by VARCHAR(50) DEFAULT 'rate_validation_agent'
);

CREATE INDEX idx_validation_hs_code ON rate_validation_log(hs_code);
CREATE INDEX idx_validation_status ON rate_validation_log(validation_status);
```

**Table:** Update `tariff_changes_log`
```sql
ALTER TABLE tariff_changes_log ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE tariff_changes_log ADD COLUMN IF NOT EXISTS validation_confidence DECIMAL(3,2);
ALTER TABLE tariff_changes_log ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;
```

### 3. Event-Driven Trigger Integration
**File:** `lib/services/tariff-change-detector.js` (MODIFY existing)

**Current code (line 73-88):**
```javascript
// 4. ✅ FIX (Nov 7): Log specific rate changes to tariff_changes_log
if (policyData.rate_changes && policyData.rate_changes.length > 0) {
  for (const change of policyData.rate_changes) {
    await this.supabase.from('tariff_changes_log').insert({
      change_type: policyData.policy_type || 'tariff_update',
      hs_code: change.hs_code,
      old_rate: change.current_rate || 0,
      new_rate: change.new_rate,
      effective_date: policyData.effective_date || null,
      confidence: policyData.confidence_score || 0.85,
      source: item.source_url || item.title,
      is_processed: false
    });
  }
}
```

**NEW code (add after line 88):**
```javascript
// 5. 🆕 IMMEDIATELY validate rate change (event-driven)
if (policyData.rate_changes && policyData.rate_changes.length > 0) {
  const RateValidationAgent = (await import('../agents/rate-validation-agent.js')).default;

  for (const change of policyData.rate_changes) {
    try {
      console.log(`  🔍 Validating rate change: ${change.hs_code} (${change.current_rate} → ${change.new_rate})`);

      const validation = await RateValidationAgent.validateRate({
        hs_code: change.hs_code,
        origin_country: policyData.affected_countries?.[0] || 'CN',
        detected_rate: change.new_rate,
        current_cached_rate: change.current_rate || 0,
        source: 'rss_polling',
        announcement_url: item.source_url
      });

      if (validation.should_update_cache && validation.confidence >= 0.80) {
        // Auto-update policy_tariffs_cache
        await this.updatePolicyCacheWithValidation(change.hs_code, validation);
        console.log(`  ✅ Cache updated: ${change.hs_code} = ${validation.validated_rate} (confidence: ${validation.confidence})`);
      } else if (validation.confidence < 0.80) {
        console.log(`  ⚠️ Low confidence (${validation.confidence}), flagged for manual review`);
      }

      // Mark as validated in tariff_changes_log
      await this.supabase.from('tariff_changes_log')
        .update({
          is_validated: true,
          validation_confidence: validation.confidence,
          validated_at: new Date().toISOString()
        })
        .eq('hs_code', change.hs_code)
        .eq('new_rate', change.new_rate)
        .is('validated_at', null);

    } catch (validationError) {
      console.error(`  ❌ Validation failed for ${change.hs_code}:`, validationError.message);
    }
  }
}
```

### 4. Confidence Thresholds
```javascript
if (confidence >= 0.95) → Auto-update + mark as "government_verified"
if (confidence >= 0.80) → Auto-update + mark as "ai_validated"
if (confidence >= 0.60) → Flag for review + update with warning
if (confidence < 0.60) → Block update + manual review required
```

---

## Implementation Plan - Week 1

### Day 1: Database Setup (30 min)
- [ ] Create `rate_validation_log` table
- [ ] Add validation columns to `tariff_changes_log`
- [ ] Test database migrations locally

### Day 2: RateValidationAgent Core (3-4 hours)
- [ ] Create `lib/agents/rate-validation-agent.js`
- [ ] Implement Haiku 4.5 integration (use BaseAgent pattern)
- [ ] Implement source weighting algorithm
- [ ] Write validation prompt for AI
- [ ] Test with sample HS codes (8542.31.00, 7616.99.50)

### Day 3: Integration (2-3 hours)
- [ ] Modify `tariff-change-detector.js` to trigger validation
- [ ] Add cache update logic with validation
- [ ] Test end-to-end: RSS → Detection → Validation → Cache Update
- [ ] Add error handling and retry logic

### Day 4: Testing & Monitoring (2 hours)
- [ ] Test with real RSS feed items
- [ ] Verify validation logs are created
- [ ] Check policy_tariffs_cache updates
- [ ] Monitor costs (should be ~$0.02-0.04 per validation)

### Day 5: Documentation & Deploy (1 hour)
- [ ] Update CLAUDE.md with new validation flow
- [ ] Add monitoring dashboard query
- [ ] Deploy to Vercel production
- [ ] Monitor first 24h of validations

**Total Estimated Time:** 8-10 hours over 5 days

---

## Cost Analysis

**Current System:**
- RSS polling: $0 (no validation)
- Risk: Users use stale rates → $5,000+ CBP penalty

**New System:**
- Haiku 4.5 validation: $0.02-0.04 per event
- Typical events per day: ~5-10 (policy announcements are rare)
- Daily cost: $0.10-0.40 (~$3-12/month)
- Value: Prevents $5,000+ penalties

**ROI:** $12/month investment to prevent $5,000+ legal risk = **417x ROI**

---

## Success Metrics

**Week 1 (Immediate):**
- [ ] All detected rate changes are validated within 2 seconds
- [ ] Validation confidence ≥ 80% for auto-updates
- [ ] Zero manual reviews needed for high-confidence validations

**Week 2-4 (Ongoing):**
- [ ] 95%+ validation success rate
- [ ] <5% false positives (incorrect validations)
- [ ] Average validation time <2 seconds
- [ ] Cost per validation <$0.05

**Month 2 (Optimization):**
- [ ] Add USITC API integration (when available) for 100% accuracy
- [ ] Implement tiered validation (Tier 1 daily, Tier 2 weekly, Tier 3 monthly)
- [ ] Build admin dashboard for manual review queue

---

## Rollback Plan

If event-driven validation causes issues:
1. **Disable trigger:** Comment out validation code in `tariff-change-detector.js` (5 min)
2. **Revert database:** Validation logs are separate, won't affect existing data
3. **Manual review:** Fall back to weekly cron validation instead of event-driven

**Risk:** Low - validation is additive, doesn't break existing flow

---

## Next Steps

1. Get approval to proceed with Week 1 implementation
2. Start with Day 1 (database setup)
3. Implement RateValidationAgent with Haiku 4.5
4. Test with sample data before production deployment

**Ready to start?** Let me know and I'll create the RateValidationAgent implementation.
