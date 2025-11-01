# RSS Feed Failure Analysis - Alert System Not Working

**Date:** October 31, 2025 (Updated: November 1, 2025)
**Severity:** CRITICAL → ✅ **RESOLVED**
**Impact:** Users not receiving new tariff policy alerts despite system running

---

## The Problem

User reported: "All week no change to alerts even though I saw changes in the news"

**Root Cause Found:**
- RSS polling cron IS running on Vercel production (last_check_at: Nov 1, 2025 00:31)
- **6 out of 10 critical government feeds were FAILING** (57 consecutive failures each)
- **Actual Cause:** Government agencies changed RSS feed URLs without notice (404/403/406 errors)
- **NOT network blocking** - no "x-deny-reason: host_not_allowed" in database logs

---

## Feed Status

### ❌ FAILING (57 consecutive failures)

| Feed | URL | Last Success | Failure Count |
|------|-----|--------------|---------------|
| **CBP Newsroom** | https://www.cbp.gov/newsroom/spotlights/feed | NULL | 57 |
| **USITC News** | https://www.usitc.gov/press_room/news_releases/rss.xml | NULL | 57 |
| **USTR Press** | https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml | NULL | 57 |
| **CBP Customs Bulletin** | https://www.cbp.gov/document/bulletins/weekly-bulletin-rss | NULL | 57 |
| **Commerce ITA** | https://www.trade.gov/rss/ita_press_releases.xml | NULL | 57 |
| **WTO News** | https://www.wto.org/library/rss/latest_news_e.xml | NULL | 57 |

### ✅ WORKING

| Feed | URL | Last Success | Failure Count |
|------|-----|--------------|---------------|
| **Federal Register** | https://www.federalregister.gov/api/v1/documents.rss... | Nov 1, 2025 | 0 |
| **Financial Times** | https://www.ft.com/rss/trump-tariffs | Nov 1, 2025 | 0 |
| **JOC** | https://www.joc.com/api/rssfeed | Nov 1, 2025 | 0 |
| **PBS NewsHour** | https://www.pbs.org/newshour/feeds/rss/headlines | Nov 1, 2025 | 0 |

---

## Why This Matters

The **FAILING** feeds are the MOST CRITICAL for detecting actual tariff policy changes:

1. **USTR Press Releases** - Official Section 301 announcements
2. **USITC News** - Antidumping, countervailing duty determinations
3. **CBP Newsroom** - Customs rulings, USMCA updates, port procedures
4. **Commerce ITA** - Trade remedy final determinations
5. **WTO News** - International trade dispute rulings

Without these feeds, the system is essentially blind to real policy changes.

---

## Possible Causes

### 1. RSS Feed URLs Changed/Deprecated
Government agencies frequently update their RSS feed URLs without notice.

**Solution:** Manually test each URL and update if redirected

### 2. Rate Limiting / Bot Detection
Government sites may be blocking automated RSS polling.

**Solution:**
- Add User-Agent headers to RSS parser
- Increase poll intervals
- Add retry logic with exponential backoff

### 3. SSL/TLS Certificate Issues
Some government sites have strict certificate validation.

**Solution:** Update rss-parser library, verify Node.js SSL support

### 4. Feed Format Changed
Some feeds may have changed their XML structure.

**Solution:** Add error logging to see actual parsing errors

### 5. Network/Firewall Issues
Vercel's network might be blocked by government firewalls.

**Solution:** Test from different regions, consider proxy

---

## Immediate Actions Needed

### Action 1: Add Error Logging (30 minutes)
**File:** `lib/services/rss-polling-engine.js`

```javascript
async pollFeed(feed, useAI = false) {
  try {
    const rssData = await this.parser.parseURL(feed.url);
    // ... existing code ...
  } catch (error) {
    // ✅ ADD: Log actual error details
    console.error(`❌ RSS Feed Failed: ${feed.name}`, {
      url: feed.url,
      error: error.message,
      stack: error.stack,
      errorType: error.constructor.name
    });

    // ✅ ADD: Save to dev_issues table
    await this.supabase.from('dev_issues').insert({
      issue_type: 'rss_feed_failure',
      severity: 'high',
      component: 'rss_polling',
      message: `Feed ${feed.name} failed: ${error.message}`,
      context_data: {
        feed_name: feed.name,
        feed_url: feed.url,
        error_type: error.constructor.name,
        failure_count: feed.failure_count + 1
      }
    });

    throw error;
  }
}
```

### Action 2: Test Each Feed Manually (1 hour)
Run curl commands to see which URLs are broken:

```bash
# Test CBP Newsroom
curl -I https://www.cbp.gov/newsroom/spotlights/feed

# Test USITC
curl -I https://www.usitc.gov/press_room/news_releases/rss.xml

# Test USTR
curl -I https://ustr.gov/about-us/policy-offices/press-office/press-releases/rss.xml

# Check if redirected (301/302)
# Check if blocked (403/429)
# Check if not found (404)
```

### Action 3: Add Fallback Alert Sources (2 hours)
If government feeds continue failing, add backup sources:

1. **Trade News Aggregators:**
   - Reuters Trade News
   - Bloomberg Trade Policy
   - Politico Trade

2. **Alternative Government Sources:**
   - CBP's Twitter/X API
   - USITC case search API
   - Federal Register API (not RSS)

3. **Manual Alert Entry:**
   - Admin UI to manually add critical alerts
   - Users can submit alerts they find in news

### Action 4: Improve Parser Resilience (1 hour)
```javascript
this.parser = new Parser({
  timeout: 30000,  // Increase from 10s to 30s
  headers: {
    'User-Agent': 'TriangleIntelligence/1.0 (Trade Compliance; +https://triangle-trade-intelligence.vercel.app)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  },
  customFields: {
    item: ['pubDate', 'content', 'summary', 'description', 'dc:date']
  },
  // ✅ ADD: Follow redirects
  maxRedirects: 5
});
```

---

## Testing Plan

### Step 1: Enable Debug Logging
Temporarily add console.log to see actual errors:

```javascript
// In pollFeed() catch block:
console.log('=== RSS FEED ERROR DEBUG ===');
console.log('Feed Name:', feed.name);
console.log('Feed URL:', feed.url);
console.log('Error Type:', error.constructor.name);
console.log('Error Message:', error.message);
console.log('Error Stack:', error.stack);
console.log('==========================');
```

### Step 2: Re-enable Cron with Longer Interval
```json
// vercel.json - Test with weekly runs first
{
  "path": "/api/cron/rss-polling",
  "schedule": "0 10 * * 1"  // Mondays only
}
```

### Step 3: Monitor for 1 Week
Check `dev_issues` table for RSS errors:
```sql
SELECT * FROM dev_issues
WHERE component = 'rss_polling'
ORDER BY created_at DESC;
```

### Step 4: Fix Broken URLs
Update `rss_feeds` table with working URLs based on test results.

---

## Long-Term Solutions

### Option A: Switch to Government APIs
Instead of RSS feeds (unreliable), use official APIs:

1. **Federal Register API**
   - More reliable than RSS
   - JSON format (easier parsing)
   - Better error handling

2. **USITC DataWeb API**
   - Official tariff rate data
   - Real-time updates
   - Structured data

3. **CBP Automated Broker Interface (ABI)**
   - Direct customs data feed
   - Requires special access

### Option B: Third-Party Trade Intelligence
Partner with established trade intelligence providers:

1. **Descartes Datamyne**
2. **Panjiva (S&P Global)**
3. **ImportGenius**

These services monitor government sources 24/7 and provide cleaned data via API.

### Option C: Hybrid Approach (Recommended)
- Use working RSS feeds (FT, JOC, PBS) for news
- Use Federal Register API for official government updates
- Add manual alert entry UI for critical announcements
- Partner with trade intelligence provider for comprehensive coverage

---

## Success Metrics

### Before Fix:
- 6/10 feeds failing (60% failure rate)
- 0 new alerts detected in past week
- User seeing stale data

### After Fix (Target):
- 9/10 feeds working (90% success rate)
- At least 2-5 new alerts per week (during active policy periods)
- User sees current alerts within 24 hours of announcement

---

## Next Steps

1. **IMMEDIATE:** Add error logging (commit today)
2. **THIS WEEK:** Manually test all feed URLs
3. **THIS WEEK:** Re-enable cron with weekly schedule
4. **NEXT WEEK:** Monitor error logs and fix broken URLs
5. **MONTH 1:** Implement fallback sources

---

## Notes

- RSS feeds disabled TODAY (Oct 31) because cron was running too frequently (every 2 hours)
- But problem existed BEFORE that - feeds were failing for weeks
- 57 consecutive failures suggests URLs have been broken for ~2 months (57 × 2 hours = 114 hours = ~5 days assuming every-2-hour polling)
- User is right to complain - system fundamentally not working as designed

---

## ✅ RESOLUTION (November 1, 2025)

### What We Fixed
1. **Investigated Database** - Checked actual error messages (404/403/406, NOT network blocking)
2. **Researched New URLs** - Found updated RSS feed URLs from government agencies
3. **Updated Database** - Fixed 3 broken URLs, disabled 3 deprecated feeds
4. **Tested All Feeds** - Verified all working feeds return data

### Database Updates Applied
```sql
-- Fixed URLs
CBP Newsroom: https://www.cbp.gov/rss/newsroom/media-releases ✅
USTR Press: https://ustr.gov/rss.xml ✅
WTO News: http://www.wto.org/library/rss/latest_news_e.xml ✅ (HTTP not HTTPS)

-- Disabled (feeds discontinued by agencies)
CBP Customs Bulletin ❌
Commerce ITA Press ❌
USITC News Releases ❌
```

### Results After Fix
- **Before:** 4/10 feeds working (40% success rate)
- **After:** 7/10 feeds working (70% success rate)
- **Disabled:** 3 feeds marked inactive (government discontinued them)

### Next Automatic Test
- **When:** Monday, November 4, 2025 at 10:00 AM (next scheduled cron run)
- **Expected:** All 7 active feeds will successfully fetch new articles
- **Monitor:** Supabase `rss_feed_activities` table for new entries with `status='success'`

### Cost Impact
- Weekly cron schedule: 4 calls/month = $0.08/month (down from $7.20/month)
- RSS proxy (rss2json.com): Free tier covers all feeds
- Database storage: Negligible (~100KB/week)

**Status:** ✅ Ready for production monitoring
