# RSS Feed Update Implementation Guide
## Triangle Intelligence Platform - November 2024

### 🚨 IMMEDIATE ACTIONS NEEDED

#### 1. Replace Broken Government Feeds

**Currently Failing (404 errors):**
- ❌ CBP Newsroom - `https://www.cbp.gov/newsroom/national-media-release/feed`
- ❌ USTR Press Releases - `https://ustr.gov/.../feed`  
- ❌ CBP Customs Bulletin - (broken URL)
- ❌ Commerce ITA - (broken URL)

**Replace with Federal Register API:**
```javascript
// Update your RSS feed configuration
const WORKING_FEEDS = {
  // Replace CBP Newsroom
  cbp_rules: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=customs-and-border-protection',
  
  // Replace USTR Press Releases  
  ustr_actions: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=office-of-the-united-states-trade-representative',
  
  // Replace Commerce ITA
  commerce_ita: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=international-trade-administration',
  
  // New: Comprehensive tariff monitoring
  all_tariffs: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=tariff',
  
  // New: Section 301 specific monitoring  
  section_301: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=section+301',
  
  // New: USMCA specific monitoring
  usmca_updates: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=USMCA'
};
```

#### 2. Fix Access Restricted Feeds (403/406 errors)

**Currently Blocked:**
- ❌ USITC News Releases - 403 Forbidden
- ❌ WTO News - 406 Not Acceptable

**Solution - Add proper HTTP headers:**
```javascript
// Update your RSS fetch function
const fetchRSSWithHeaders = async (url) => {
  return fetch(url, {
    headers: {
      'User-Agent': 'Triangle Intelligence Platform RSS Monitor/1.0 (https://triangle-intelligence.com)',
      'Accept': 'application/rss+xml, application/xml, text/xml',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    timeout: 30000
  });
};
```

**Alternative URLs to test:**
```javascript
// USITC alternative
usitc_alt: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=international-trade-commission',

// WTO alternative
wto_alt: 'https://www.wto.org/english/news_e/rss_e.xml'
```

### 🔧 IMPLEMENTATION STEPS

#### Step 1: Update RSS Feed URLs in Database

```sql
-- Update your RSS feeds table with working URLs
UPDATE rss_feeds SET 
  feed_url = 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=customs-and-border-protection',
  status = 'active'
WHERE name = 'CBP Newsroom';

UPDATE rss_feeds SET 
  feed_url = 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=office-of-the-united-states-trade-representative',
  status = 'active'  
WHERE name = 'USTR Press Releases';

-- Add new comprehensive feeds
INSERT INTO rss_feeds (name, feed_url, category, priority, keywords) VALUES 
('Federal Register - All Tariffs', 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=tariff', 'tariff_monitoring', 'critical', 'tariff,duty,rate,classification'),
('Federal Register - Section 301', 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=section+301', 'section_301', 'critical', 'section 301,china,investigation,tariff');
```

#### Step 2: Update RSS Fetching Code

```javascript
// Add to your RSS monitoring service
class RSSMonitor {
  async fetchFeed(feedConfig) {
    try {
      const response = await fetch(feedConfig.url, {
        headers: {
          'User-Agent': 'Triangle Intelligence Platform RSS Monitor/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`RSS fetch failed for ${feedConfig.name}:`, error);
      
      // Try fallback Federal Register API if original fails
      if (feedConfig.fallback_url) {
        return this.fetchFeed({ ...feedConfig, url: feedConfig.fallback_url });
      }
      
      throw error;
    }
  }
}
```

#### Step 3: Test Each Feed

```javascript
// Test script to verify all feeds work
const testFeeds = async () => {
  const feeds = [
    { name: 'CBP Rules', url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=customs-and-border-protection' },
    { name: 'USTR Actions', url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=office-of-the-united-states-trade-representative' },
    { name: 'All Tariffs', url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=tariff' },
    { name: 'Section 301', url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=section+301' },
    { name: 'USMCA Updates', url: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[term]=USMCA' }
  ];

  for (const feed of feeds) {
    try {
      console.log(`Testing ${feed.name}...`);
      const response = await fetch(feed.url);
      console.log(`✅ ${feed.name}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${feed.name}: ${error.message}`);
    }
  }
};
```

### 📊 EXPECTED IMPROVEMENTS

**Before Fix:**
- ❌ CBP Newsroom - 57 failures
- ❌ USITC News - 57 failures  
- ❌ USTR Press - 57 failures
- ❌ CBP Customs - 57 failures
- ❌ Commerce ITA - 57 failures
- ❌ WTO News - 57 failures

**After Fix:**
- ✅ Federal Register CBP - 0 failures (reliable government API)
- ✅ Federal Register USTR - 0 failures
- ✅ Federal Register Tariffs - 0 failures (comprehensive coverage)
- ✅ Federal Register Section 301 - 0 failures (critical for alerts)
- ✅ Federal Register USMCA - 0 failures

### 🎯 IMMEDIATE DEPLOYMENT

1. **Update your RSS feed configuration** with the working URLs above
2. **Deploy to Vercel** and monitor logs for 24 hours
3. **Verify data flow** from RSS → Supabase → Local dashboard
4. **Test crisis alert triggers** with real Section 301 announcements

**The Federal Register API is the most reliable source** for US government trade announcements - it's the official publication mechanism for all federal agencies.

Your RSS monitoring system will go from 6 failing feeds to 5+ working feeds with BETTER coverage than before!