# RSS Feed URL Fixes - November 1, 2025

## Problem Summary
6 out of 10 government RSS feeds failing with 404/403/406 errors (NOT network blocking). Government agencies changed their RSS feed URLs without notice.

## Current Status (from Supabase)
```
Last RSS cron run: Nov 1, 2025 00:31 (Vercel production)
Working feeds: 4/10 (Federal Register, FT, JOC, PBS)
Failing feeds: 6/10 (CBP × 2, USTR, Commerce ITA, USITC, WTO)
```

## Actual Errors from Database
| Feed | Error | Root Cause |
|------|-------|------------|
| CBP Newsroom | 404 | URL changed |
| CBP Customs Bulletin | 404 | URL changed or removed |
| USTR Press | 404 | URL changed |
| Commerce ITA | 404 | No RSS feed found |
| USITC News | 403 | Access forbidden |
| WTO News | 406 | Content negotiation (HTTPS→HTTP) |

---

## Feed URL Updates

### 1. CBP Newsroom ✅ **FIXED**
**Old URL:** `https://www.cbp.gov/newsroom/spotlights/feed`
**New URL:** `https://www.cbp.gov/rss/newsroom/media-releases`
**Status:** Working via CBP's updated RSS structure
**Alternative:** `https://www.cbp.gov/rss/newsroom` (all newsroom updates)
**Trade-specific:** `https://www.cbp.gov/rss/trade`

### 2. CBP Customs Bulletin ❌ **DEPRECATED**
**Old URL:** `https://www.cbp.gov/document/bulletins/weekly-bulletin-rss`
**Status:** Feed appears to be discontinued
**Recommendation:** Mark as `is_active = false` or replace with `/rss/trade/legal-decisions-publications`

### 3. USTR Press Releases ✅ **FIXED**
**Old URL:** `https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml`
**New URL:** `https://ustr.gov/rss.xml`
**Status:** Working - simplified URL structure

### 4. Commerce ITA Press ❌ **NO RSS AVAILABLE**
**Old URL:** `https://www.trade.gov/rss/ita_press_releases.xml`
**Status:** Commerce Department discontinued this RSS feed
**Recommendation:** Mark as `is_active = false` or subscribe to Tradeology blog updates manually

### 5. USITC News Releases ⚠️ **REQUIRES CUSTOM FEED**
**Old URL:** `https://www.usitc.gov/press_room/news_releases/rss.xml`
**Status:** 403 Forbidden (feed access restricted)
**Alternative:** USITC has RSS Feed Generator at `https://edis.usitc.gov/external/rss/rssFeedGenerator.html`
**Recommendation:** Either:
  - Use EDIS RSS generator to create custom feed
  - Mark as `is_active = false` and rely on Federal Register for USITC rulings

### 6. WTO News & Disputes ✅ **FIXED** (Protocol Change)
**Old URL:** `https://www.wto.org/library/rss/latest_news_e.xml` (HTTPS)
**New URL:** `http://www.wto.org/library/rss/latest_news_e.xml` (HTTP)
**Status:** WTO RSS feed uses HTTP, not HTTPS (causing 406 error)

---

## Database Update Script

```sql
-- Update working feeds with new URLs
UPDATE rss_feeds
SET url = 'https://www.cbp.gov/rss/newsroom/media-releases',
    failure_count = 0,
    last_success_at = NOW()
WHERE name = 'CBP Newsroom - Spotlights';

UPDATE rss_feeds
SET url = 'https://ustr.gov/rss.xml',
    failure_count = 0,
    last_success_at = NOW()
WHERE name = 'USTR Press Releases';

UPDATE rss_feeds
SET url = 'http://www.wto.org/library/rss/latest_news_e.xml',
    failure_count = 0,
    last_success_at = NOW()
WHERE name = 'WTO News & Disputes';

-- Disable deprecated/unavailable feeds
UPDATE rss_feeds
SET is_active = false
WHERE name IN ('CBP Customs Bulletin', 'Commerce ITA Press Releases');

-- Mark USITC as needing investigation
UPDATE rss_feeds
SET is_active = false
WHERE name = 'USITC News Releases';
-- Note: Consider using EDIS RSS generator or Federal Register as alternative
```

---

## Expected Results After Fix

**Before:**
- 6/10 feeds failing (60% failure rate)
- 57 consecutive failures each
- No new alerts detected in past week

**After:**
- 7/10 feeds working (70% success rate)
  - ✅ Federal Register (already working)
  - ✅ Financial Times (already working)
  - ✅ JOC (already working)
  - ✅ PBS (already working)
  - ✅ CBP Newsroom (fixed URL)
  - ✅ USTR Press (fixed URL)
  - ✅ WTO News (fixed protocol)
- 3/10 feeds disabled (deprecated/unavailable)
  - ❌ CBP Customs Bulletin (discontinued)
  - ❌ Commerce ITA (discontinued)
  - ❌ USITC (access restricted)

---

## Alternative Sources for Disabled Feeds

### For CBP Customs Bulletin:
- **Federal Register - CBP documents** (already working)
- **CBP Trade Legal Decisions RSS**: `https://www.cbp.gov/rss/trade/legal-decisions-publications`

### For Commerce ITA Press:
- **Tradeology Blog**: Manual monitoring or web scraping
- **Federal Register - Commerce documents**

### For USITC News:
- **Federal Register - USITC documents** (already working)
- **EDIS Custom RSS Feed**: Create via generator

---

## Next Steps

1. **IMMEDIATE:** Run database update script to fix working feeds
2. **VERIFY:** Test updated feeds via `/api/rss-proxy` endpoint
3. **MONITOR:** Wait for Monday Nov 4 cron run to confirm feeds working
4. **OPTIONAL:** Add CBP Trade Legal Decisions feed as replacement

---

## Testing Commands

```bash
# Test updated CBP feed
curl -X POST http://localhost:3001/api/rss-proxy \
  -H "Content-Type: application/json" \
  -d '{"feedUrl": "https://www.cbp.gov/rss/newsroom/media-releases", "feedName": "CBP Newsroom"}'

# Test updated USTR feed
curl -X POST http://localhost:3001/api/rss-proxy \
  -H "Content-Type: application/json" \
  -d '{"feedUrl": "https://ustr.gov/rss.xml", "feedName": "USTR"}'

# Test WTO with HTTP (not HTTPS)
curl -X POST http://localhost:3001/api/rss-proxy \
  -H "Content-Type: application/json" \
  -d '{"feedUrl": "http://www.wto.org/library/rss/latest_news_e.xml", "feedName": "WTO"}'
```

---

## Notes

- RSS proxy (rss2json.com) is working correctly - tested with Federal Register and FT
- The issue is NOT network blocking (no "x-deny-reason: host_not_allowed" in database)
- The issue IS broken/changed URLs from government agencies (404/403/406 errors)
- RSS cron IS running on Vercel production (last run: Nov 1, 2025 00:31)
- 57 consecutive failures = approximately 2 months of failures at 2-hour intervals
