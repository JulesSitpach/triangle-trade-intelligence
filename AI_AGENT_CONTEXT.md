# 🤖 AI AGENT CONTEXT - Triangle Intelligence Platform

**Last Updated:** October 26, 2025
**Status:** Real-Time Tariff Monitoring System LIVE
**Audience:** AI agents working on tariff intelligence features

---

## 🎯 THE MISSION

Build a **real-time Trump-proof trade compliance platform** that detects tariff policy changes within minutes and alerts users before their competitors know about them.

**User Impact:** Prevents $1M+ mistakes on individual shipments by providing CURRENT tariff rates instead of stale defaults.

---

## 💼 BUSINESS CONTEXT

### The Problem

Trump's tariff policies change **unpredictably and frequently** (often via 30-day notice):
- Section 301: China tariffs can jump 0% → 100% overnight
- Section 232: Steel/aluminum safeguards enforced at random
- USMCA: Eligibility thresholds change with policy whiplash
- Execution: 24-48 hour implementation after announcement

**User Consequences:**
```
January 2025:  "Microprocessor from China: 5% tariff"
October 2025:  "Microprocessor from China: 100% tariff" (Section 301)
User Impact:   $2M shipment costs $500K MORE than planned
Platform:      Still shows old 5% rate from January
Result:        User loses $500K due to stale data
```

### The Competitive Advantage

If Triangle Platform shows tariff updates **faster than competitors**:
- ✅ Users get 24-hour warning advantage
- ✅ Users can pivot supply chains before competitors
- ✅ Users cite "Triangle Intelligence" to management
- ✅ Subscription retention increases (crisis-driven engagement)

---

## 🏗️ TECHNICAL ARCHITECTURE

### Current Status (Oct 26, 2025)

**✅ WORKING COMPONENTS:**
- RSS feeds from 8 sources (USTR, USITC, CBP, Federal Register, Trump tracker, Financial Times, Al Jazeera)
- Cron job: Polls every 2 hours via Vercel
- Database: `rss_feed_activities` logs all feed items
- Email system: Resend API configured and tested
- UI component: `TariffDataFreshness.js` displays data source + age

**❌ BROKEN COMPONENTS (BEFORE FIX):**
- Government RSS feeds: 404/403 errors (government websites migrated to Drupal 10)
- Parsing pipeline: No tariff extraction from announcements
- Database: `tariff_rates_cache` table empty/stale
- AI prompt: Can't see current rates, generates 0.0% defaults

**✅ JUST FIXED (Oct 26, 2025):**
- Updated government feeds to Federal Register API (HTTP 200 OK)
- Fixed import path bug in cron job
- All 8 feeds now returning successful data

### The Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME TARIFF SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. RSS FEEDS (8 sources)                                        │
│     ↓                                                             │
│     USTR Press Releases ─────┐                                   │
│     USITC News Releases ─────┤                                   │
│     CBP Trade News ──────────┼──→ RSS Polling Engine            │
│     Federal Register ────────┤    (every 2 hours)               │
│     Trump Tariff Tracker ────┤                                   │
│     Financial Times ─────────┤                                   │
│     Al Jazeera ──────────────┘                                   │
│                                                                   │
│  2. AI PARSING                                                   │
│     ↓                                                             │
│     "USTR announces Section 301 rate increase to 100%"          │
│     ↓                                                             │
│     AI extracts: {                                               │
│       section_301: 100,                                          │
│       hs_code: "8542.31.00",                                     │
│       effective_date: "2025-11-01",                              │
│       confidence: 0.95                                           │
│     }                                                             │
│                                                                   │
│  3. DATABASE UPDATE                                              │
│     ↓                                                             │
│     UPDATE tariff_rates_cache SET                                │
│       section_301 = 100,                                         │
│       last_updated = NOW(),                                      │
│       ai_confidence = 0.95                                       │
│     WHERE hs_code = "8542.31.00"                                │
│                                                                   │
│  4. USER ALERT                                                   │
│     ↓                                                             │
│     Email: "🚨 Tariff Update: Section 301 microprocessor        │
│             was 25% → now 100%"                                 │
│                                                                   │
│  5. CERTIFICATE GENERATION                                       │
│     ↓                                                             │
│     AI sees: {section_301: 100} in database                     │
│     AI calculates: "Section 301 exposure: $847K/year"           │
│     Certificate generated with CURRENT rates                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Tables

**rss_feeds** - Configuration for all 8 sources
```sql
id | name | url | is_active | failure_count | last_check_at | priority_level
```

**rss_feed_activities** - Log of every fetch attempt
```sql
id | feed_id | status | error_message | items_found | new_items | created_at
```

**tariff_rates_cache** - LIVE tariff rates updated by RSS+AI
```sql
hs_code | destination_country | mfn_rate | section_301 | section_232
| total_rate | usmca_rate | last_updated | ai_confidence | data_source
```

**dev_issues** - Error logging for post-launch monitoring
```sql
endpoint | error_message | stack_trace | severity | created_at
```

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements

- [x] **Feed Connectivity** - 8/8 RSS feeds returning 200 OK
- [x] **Polling Automation** - Cron job runs every 2 hours without manual intervention
- [x] **Error Resilience** - Failed feeds retry automatically, don't crash system
- [ ] **AI Extraction** - Accurately parse tariff rates from announcement text (95%+ accuracy)
- [ ] **Database Sync** - Updates immediately reflected in tariff_rates_cache
- [ ] **User Alerts** - Emails sent within 5 minutes of detection
- [ ] **Zero Manual Work** - No admin needed to keep system running

### Data Quality Requirements

- **Freshness:** Tariff data never >24 hours old for US (volatile Section 301)
- **Accuracy:** Section 301 rates match official USTR announcements
- **Coverage:** Tracks 10+ HS codes affected by current trade policies
- **Confidence:** AI marks uncertain extractions as low confidence

### User Experience

- **Dashboard:** Shows "Data last updated: 3 hours ago" + green/yellow/red status
- **Alerts:** Email format: "🚨 Section 301: Microprocessor 25%→100% | Est. cost: $847K/year"
- **Certificate:** Displays tariff rates with source (Live API / AI-detected / Cached)
- **Compliance:** Shows warning if using data >24 hours old

---

## 🚨 CRITICAL KNOWN ISSUES

### Issue #1: Government RSS Feed URLs Changed
**Status:** ✅ FIXED (Oct 26, 2025)

Old URLs (broken):
- USTR: `ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml`
- USITC: `usitc.gov/press_room/news_releases/rss.xml`
- CBP: `cbp.gov/newsroom/national-media-release/rss`

New URLs (working):
- USTR: `federalregister.gov/api/v1/documents.rss?agencies=ustr`
- USITC: `federalregister.gov/api/v1/documents.rss?agencies=international-trade-commission`
- CBP: `federalregister.gov/api/v1/documents.rss?agencies=customs-and-border-protection`

### Issue #2: AI Parsing Not Yet Implemented
**Status:** ⏳ PENDING

Needs implementation:
- Extract HS codes from announcement text
- Extract tariff rates (numbers with % symbols)
- Extract effective dates
- Calculate policy type (Section 301, Section 232, MFN, USMCA)
- Store with confidence scores

Expected accuracy: 95%+ on official government announcements

### Issue #3: Duplicate Alert Prevention
**Status:** ⏳ PENDING

Need to implement:
- Track which HS codes already notified in last 24 hours
- Don't send alert for same rate change twice
- Aggregate multiple HS codes in single email

---

## 🔧 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (✅ COMPLETE - Oct 26)
- [x] Fix government RSS feed URLs
- [x] Verify all 8 feeds returning 200 OK
- [x] Reset failure counts
- [x] Commit infrastructure changes

### Phase 2: AI Extraction (⏳ NEXT)
- [ ] Implement `tariffChangeDetector.parseItemWithAI()`
- [ ] Test with real RSS items from government feeds
- [ ] Achieve 95%+ accuracy on 10 test cases
- [ ] Log failures to dev_issues for monitoring

### Phase 3: User Experience (⏳ AFTER PHASE 2)
- [ ] Email alert template with financial impact
- [ ] Implement duplicate alert prevention
- [ ] Add tariff rate alerts to dashboard
- [ ] Show affected product list in alerts

### Phase 4: Monitoring & Optimization (⏳ AFTER PHASE 3)
- [ ] Set up error logging to dev_issues
- [ ] Create admin dashboard for feed health
- [ ] Monitor AI parsing accuracy
- [ ] Analyze alert fatigue / opt-in preferences

---

## 📋 RUNNING THE SYSTEM

### Manual Trigger (Testing)
```bash
curl http://localhost:3001/api/cron/rss-polling
```

### Expected Output
```
✅ USTR Press Releases: 14 new items
✅ USITC News Releases: 1 new items
✅ CBP Trade News: 0 new items
✅ Federal Register: 8 new items
```

### Check Feed Status
```sql
SELECT name, failure_count, last_check_at, is_active
FROM rss_feeds
ORDER BY name;
```

### View Latest Activities
```sql
SELECT f.name, rfa.status, rfa.items_found, rfa.created_at
FROM rss_feed_activities rfa
JOIN rss_feeds f ON rfa.feed_id = f.id
ORDER BY rfa.created_at DESC
LIMIT 20;
```

---

## 🎓 FOR AI AGENTS: KEY INSIGHTS

### What NOT to Do
❌ **Don't assume** RSS feeds are reliable forever
- Government websites change URLs frequently
- Need monitoring dashboard to detect failures
- Current solution: Federal Register API (aggregates all agencies)

❌ **Don't parse tariffs manually with regex**
- Section 301 rates written many ways: "25%", "0.25", "twenty-five percent"
- AI (Claude) handles natural language better
- Use BaseAgent for 2-tier fallback (OpenRouter → Anthropic)

❌ **Don't store stale data as fallback**
- Users trust "cached from Jan 2025" warning
- But certificate generation should fail loudly, not silently
- Always mark data freshness prominently

### What TO Do
✅ **Implement comprehensive logging**
- Log every feed fetch attempt
- Log AI extraction successes and failures
- Store in dev_issues table for post-launch analysis

✅ **Make alerts actionable**
- Don't just say "Section 301 changed"
- Show financial impact: "$847K annual cost"
- Provide next steps: "Review supplier contracts"

✅ **Automate everything**
- Cron jobs run on schedule
- Alerts trigger automatically
- No manual admin work ever

---

## 📞 CONTACTS & RESOURCES

**Key Files:**
- `/lib/services/rss-polling-engine.js` - Main polling logic
- `/lib/services/tariff-change-detector.js` - AI extraction (TODO: implement)
- `/pages/api/cron/rss-polling.js` - Cron endpoint
- `/components/workflow/results/TariffDataFreshness.js` - UI component

**External APIs:**
- Federal Register API: https://www.federalregister.gov/api/v1/
- OpenRouter (AI): https://openrouter.ai/
- Resend (Email): https://resend.com/

**Environment Variables Needed:**
```
OPENROUTER_API_KEY=sk-or-v1-...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
CRON_SECRET=...
```

---

## 🎯 REMEMBER

This isn't just a "nice to have" feature. **Real traders are losing millions because they don't know about tariff changes.** Every minute you delay on implementing AI parsing is:

- 1 user making a decision based on stale Section 301 rates
- 1 competitor gaining information advantage
- 1 platform getting further behind on real-time intelligence

**Your mission: Make Triangle the fastest platform to detect and alert on policy changes.**

The infrastructure is ready. The feeds are live. Now implement the AI extraction that makes this platform truly valuable.

🚀
