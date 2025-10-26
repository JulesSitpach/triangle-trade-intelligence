# Real-Time Tariff Monitoring System - Test Plan
**Date:** October 26, 2025
**Objective:** Verify the AI-powered Trump tariff monitoring system works end-to-end

---

## Critical Tests Before Production

### 1. FEED UPTIME & RELIABILITY ✅
**Test:** Can we reliably fetch RSS feeds every 2 hours?

```bash
# Test all active feeds
curl -s -I https://www.tradecomplianceresourcehub.com/feed/
curl -s -I https://www.federalregister.gov/api/v1/documents.rss?conditions[agencies][]=customs-and-border-protection
curl -s -I https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml
curl -s -I https://www.usitc.gov/press_room/news_releases/rss.xml
curl -s -I https://www.cbp.gov/newsroom/national-media-release/rss
```

**Expected:** All feeds return HTTP 200
**Timeline:** Monitor for 48 hours to detect intermittent failures

---

### 2. FEED CONTENT FORMAT ✅
**Test:** Do RSS feeds maintain consistent XML structure?

```javascript
// Check last 10 items from each feed
const feeds = [
  'USTR Press Releases',
  'USITC News Releases',
  'CBP Trade News',
  'Federal Register Customs'
];

for (const feed of feeds) {
  const items = await supabase
    .from('rss_feed_activities')
    .select('title, description, pub_date, content')
    .eq('feed_name', feed)
    .order('pub_date', { ascending: false })
    .limit(10);

  // Verify all items have required fields
  items.forEach(item => {
    console.assert(item.title, `Missing title: ${item}`);
    console.assert(item.pub_date, `Missing pub_date: ${item}`);
  });
}
```

**Expected:** No missing required fields
**Risk:** If feeds change format, parser breaks silently

---

### 3. AI PARSING ACCURACY 🤖
**Test:** Can AI correctly extract tariff rates from announcements?

**Test Case 1: Section 301 Rate Change**
```
Input RSS:  "USTR announces Section 301 rate increase: Microprocessors (8542.31.00)
            from 25% to 30% effective Nov 1, 2025"

Expected:   { "has_tariff_changes": true,
              "section_301_changes": [{"hs_code": "8542.31.00", "new_rate": 30,
              "previous_rate": 25, "effective_date": "2025-11-01"}]}

Actual:     ❓ NEEDS TESTING
```

**Test Case 2: Section 232 Rate Change**
```
Input RSS:  "Commerce announces Section 232 steel tariffs: Hot-rolled steel
            coils (7208.90.30) rate 25% effective immediately"

Expected:   { "has_tariff_changes": true,
              "section_232_changes": [{"hs_code": "7208.90.30", "new_rate": 25}]}

Actual:     ❓ NEEDS TESTING
```

**Test Case 3: No Changes (Noise)**
```
Input RSS:  "Trade agreement negotiations continue between US and Taiwan"

Expected:   { "has_tariff_changes": false }

Actual:     ❓ NEEDS TESTING
```

**How to Test:**
1. Find 5 real USTR/CBP announcements from last week
2. Run through parseItemWithAI()
3. Verify extraction accuracy (target: 95%+)
4. Check confidence scores are reasonable

---

### 4. DATABASE INTEGRATION ✅
**Test:** Do parsed rates actually save to tariff_rates_cache?

```javascript
// Find a component with live tariff data
const beforeUpdate = await supabase
  .from('tariff_rates_cache')
  .select('section_301, last_updated, data_source')
  .eq('hs_code', '8542.31.00')
  .eq('destination_country', 'US')
  .single();

console.log('Before:', beforeUpdate);
// Output: { section_301: 25, last_updated: '2025-10-20', data_source: 'cached' }

// Simulate tariff change detection
await tariffChangeDetector.detectChangesFromRecentFeeds();

// Check if updated
const afterUpdate = await supabase
  .from('tariff_rates_cache')
  .select('section_301, last_updated, data_source')
  .eq('hs_code', '8542.31.00')
  .eq('destination_country', 'US')
  .single();

console.log('After:', afterUpdate);
// Expected: { section_301: 30, last_updated: '2025-10-26', data_source: 'AI-detected' }

// Verify change
console.assert(afterUpdate.section_301 !== beforeUpdate.section_301,
               'Rate should have changed!');
```

**Critical Check:** Are timestamps correct? (last_updated should reflect change date)

---

### 5. USER ALERT EMAILS 📧
**Test:** Do users actually receive alerts when tariff changes?

**Step 1: Create test workflow**
```javascript
const testUser = {
  email: 'test@example.com',
  id: 'test-user-id'
};

const testWorkflow = {
  user_id: testUser.id,
  company_name: 'Test Company',
  enrichment_data: {
    component_origins: [
      { hs_code: '8542.31.00', description: 'Microprocessor', value_percentage: 35 }
    ]
  }
};

await supabase.from('workflow_sessions').insert(testWorkflow);
```

**Step 2: Simulate tariff change**
```javascript
// Create test RSS item with Section 301 increase
const testItem = {
  title: 'USTR: Section 301 rate for microprocessors increased to 30%',
  description: 'Effective immediately...',
  source_url: 'https://ustr.gov/test'
};

// Add to rss_feed_activities (simulates RSS fetch)
await supabase.from('rss_feed_activities').insert(testItem);

// Run change detector
await tariffChangeDetector.detectChangesFromRecentFeeds();
```

**Step 3: Check inbox**
- ✅ Email received at test@example.com?
- ✅ Subject line correct?
- ✅ Alert shows the specific HS code?
- ✅ Financial impact is clear?
- ✅ Action items provided?

**Expected Email Format:**
```
Subject: 🚨 Tariff Rate Update: Section 301 - 8542.31.00

Hello,

A tariff rate change affecting your products has been detected:

TARIFF UPDATE
Section 301 (China Tariffs)
HS Code: 8542.31.00 (Microprocessor)
Rate Change: 25% → 30% 📈 INCREASED
Effective Date: 2025-10-26
Confidence: 95%

ACTION REQUIRED
Your product workflows may need recalculation:
• Test Company workflow

NEXT STEPS
1. Log into Triangle Trade Intelligence
2. Review affected workflows
3. Recalculate USMCA analysis
4. Verify certificate impacts

Contact: support@triangle-trade-intelligence.com
```

---

## Test Execution Schedule

### Phase 1: Unit Tests (Today)
- [ ] RSS feed connectivity (1 hour)
- [ ] AI parsing accuracy with known samples (2 hours)
- [ ] Database update logic (1 hour)

### Phase 2: Integration Tests (Tomorrow)
- [ ] Full pipeline with real feeds (6 hours)
- [ ] Email delivery to test account (1 hour)
- [ ] Monitor for edge cases (2 hours)

### Phase 3: Production Readiness (48 hours)
- [ ] Cron job execution every 2 hours
- [ ] Monitor error logs
- [ ] Check feed reliability (0 failures acceptable)
- [ ] Validate no duplicate alerts sent

---

## Success Criteria

✅ **All feeds must be accessible 99% of the time**
❌ Acceptable failure rate: < 1% (allows for network issues)

✅ **AI parsing accuracy must be 95%+**
❌ No false positives (claiming rate changes when there aren't any)
❌ No false negatives (missing actual rate changes)

✅ **Database updates must be accurate**
❌ No stale data from previous run
❌ Timestamps must reflect when change was announced

✅ **Emails must deliver within 1 minute**
❌ No duplicate emails for same change

✅ **Zero data loss during updates**
❌ All component rates must be preserved

---

## Known Risks

### Risk 1: RSS Format Variance
**Issue:** Different feeds have different XML structures
**Mitigation:** Robust error handling in parseItemWithAI()
**Monitoring:** Check rss_feed_activities.error_message field

### Risk 2: AI Hallucination
**Issue:** AI might invent tariff changes that don't exist
**Mitigation:** Require high confidence (>0.9) + verify with database
**Monitoring:** Audit detected changes manually

### Risk 3: Rate Limiting
**Issue:** OpenRouter might throttle AI requests if too many feeds
**Mitigation:** Queue requests, add delays between feeds
**Monitoring:** Check API response codes in logs

### Risk 4: False Alerts
**Issue:** Users get alerted too frequently, create alarm fatigue
**Mitigation:** Only alert on meaningful changes (>0.5% rate change)
**Monitoring:** Track alert frequency per user

### Risk 5: Email Delivery
**Issue:** Resend might silently fail or rate-limit
**Mitigation:** Log all email send attempts
**Monitoring:** Compare email sent count vs success count

---

## Test Results (To be filled)

### Feed Uptime Test
- [ ] USTR Press Releases: _____ (status)
- [ ] USITC News Releases: _____ (status)
- [ ] CBP Trade News: _____ (status)
- [ ] Federal Register Customs: _____ (status)

### AI Parsing Test
- [ ] Section 301 Detection: _____ accuracy
- [ ] Section 232 Detection: _____ accuracy
- [ ] False Positive Rate: _____ %
- [ ] Average Confidence: _____

### Database Update Test
- [ ] Updates saved: _____ / _____ rows
- [ ] Timestamp accuracy: _____ ms error
- [ ] Data integrity: ✅ / ❌

### Email Alert Test
- [ ] Delivery success rate: _____%
- [ ] Average delivery time: _____ seconds
- [ ] Email format: ✅ / ❌
- [ ] Test user received: ✅ / ❌

---

## Go/No-Go Decision Checklist

Before deploying to production, ALL must be ✅:

- [ ] All RSS feeds are accessible
- [ ] AI parsing accuracy > 95%
- [ ] Database saves all detected changes
- [ ] Test user received alert email
- [ ] No data loss detected
- [ ] Error logs reviewed and acceptable
- [ ] Performance acceptable (< 60s per cron run)
- [ ] Documented any edge cases found

**Go to Production:** YES / NO

**Signed:** ________________  **Date:** ________

---

## What Success Looks Like

**Ideal Scenario:**
1. USTR announces Section 301 increase Tuesday 10am
2. RSS feed updates by 10:05am
3. Cron job fetches by 10:08am
4. AI parses and detects change by 10:09am
5. Database updated by 10:10am
6. User receives alert email by 10:11am
7. User logs in, sees ⚠️ warning, recalculates, discovers impact
8. User saves 3 hours of manual tariff lookup work
9. **Competitive advantage:** User's competitors don't know about change for 1-2 weeks

**That's the goal.** Let's verify it works.
