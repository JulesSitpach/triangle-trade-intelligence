/**
 * Test Fresh Canadian and Mexico-Focused RSS Feeds for Partnership Intelligence
 * Testing immediately after news broke 30 minutes ago
 */

const freshFeeds = {
  // FREE CANADIAN BUSINESS FEEDS
  financial_post_canada: 'https://financialpost.com/feed',
  globe_and_mail_business: 'https://www.theglobeandmail.com/business/?service=rss',
  cbc_business: 'https://www.cbc.ca/cmlink/rss-business',

  // MEXICO-FOCUSED FEEDS
  cpkc_investor_relations: 'https://investor.cpkc.com/news/default.aspx?RssMode=True',
  tc_energy_news: 'https://www.tcenergy.com/news-and-events/?format=rss',
  scotiabank_news: 'https://www.scotiabank.com/ca/en/about/investors-shareholders/quarterly-reports.html?format=rss',

  // MEXICAN BUSINESS SOURCES
  mexico_business_news: 'https://www.mexicobusiness.news/feed',
  el_economista_mexico: 'https://www.eleconomista.com.mx/rss/economia.xml',
  expansión_mexico: 'https://expansion.mx/rss',

  // CANADIAN CHAMBER & GOVERNMENT
  canadian_chamber: 'https://chamber.ca/news/feed/',
  global_affairs_canada: 'https://www.international.gc.ca/rss/newsroom.xml',

  // ALTERNATIVE REUTERS/FINANCIAL
  yahoo_finance_canada: 'https://ca.finance.yahoo.com/rss/topstories',
  marketwatch_international: 'https://feeds.marketwatch.com/marketwatch/international/',

  // YOUR KNOWN WORKING FEEDS (for comparison)
  bloomberg_markets: 'https://feeds.bloomberg.com/markets/news.rss',
  bloomberg_economics: 'https://feeds.bloomberg.com/economics/news.rss'
};

async function testFreshFeeds() {
  console.log('🚨 TESTING FRESH FEEDS FOR BREAKING CANADA-MEXICO PARTNERSHIP NEWS');
  console.log('⏰ Testing immediately after news broke 30 minutes ago');
  console.log('='.repeat(75));

  const results = {
    working: [],
    broken: [],
    highRelevance: [],
    freshContent: []
  };

  for (const [feedName, feedUrl] of Object.entries(freshFeeds)) {
    const result = await testSingleFreshFeed(feedName, feedUrl);

    if (result.success) {
      results.working.push({name: feedName, ...result});

      if (result.partnershipRelevance >= 2) {
        results.highRelevance.push({name: feedName, ...result});
      }

      if (result.hasFreshContent) {
        results.freshContent.push({name: feedName, ...result});
      }
    } else {
      results.broken.push({name: feedName, error: result.error});
    }

    // Respectful delay
    await new Promise(resolve => setTimeout(resolve, 2500));
  }

  console.log('\n🏆 FRESH FEED TESTING SUMMARY:');
  console.log('='.repeat(75));

  console.log(`✅ Working feeds: ${results.working.length}/${Object.keys(freshFeeds).length}`);
  console.log(`🎯 High partnership relevance: ${results.highRelevance.length}`);
  console.log(`⚡ Fresh content detected: ${results.freshContent.length}`);
  console.log(`❌ Broken feeds: ${results.broken.length}`);

  if (results.highRelevance.length > 0) {
    console.log('\n🎯 HIGH PARTNERSHIP RELEVANCE FEEDS:');
    results.highRelevance.forEach(feed => {
      console.log(`   ${feed.name}: ${feed.partnershipKeywords.join(', ')}`);
    });
  }

  if (results.freshContent.length > 0) {
    console.log('\n⚡ FEEDS WITH FRESH CONTENT (Last 24 hours):');
    results.freshContent.forEach(feed => {
      console.log(`   ${feed.name}: ${feed.recentItems} recent items`);
    });
  }

  if (results.broken.length > 0) {
    console.log('\n❌ BROKEN FEEDS TO AVOID:');
    results.broken.forEach(feed => {
      console.log(`   ${feed.name}: ${feed.error}`);
    });
  }

  console.log('\n📋 RECOMMENDATION:');
  if (results.working.length >= 8) {
    console.log('✅ EXCELLENT: Multiple working feeds for comprehensive coverage');
  } else if (results.working.length >= 5) {
    console.log('✅ GOOD: Sufficient working feeds for partnership intelligence');
  } else {
    console.log('⚠️  LIMITED: Few working feeds, focus on Bloomberg + top performers');
  }

  return results;
}

async function testSingleFreshFeed(name, url) {
  const startTime = Date.now();

  try {
    console.log(`\n🔍 Testing ${name}:`);
    console.log(`   URL: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Triangle Intelligence Fresh News Monitor/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      console.log(`   ❌ ERROR: ${response.status} ${response.statusText} (${responseTime}ms)`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const content = await response.text();
    const contentSize = (content.length / 1024).toFixed(1);

    console.log(`   ✅ SUCCESS: ${response.status} (${responseTime}ms, ${contentSize}KB)`);

    // Format validation
    const hasValidFormat = content.includes('<rss') || content.includes('<feed') || content.includes('<?xml');
    const itemMatches = content.match(/<item/gi) || content.match(/<entry/gi) || [];

    console.log(`   📄 Format: ${hasValidFormat ? 'Valid RSS/XML' : 'Invalid format'}`);
    console.log(`   📊 Items: ${itemMatches.length} entries found`);

    // Canada-Mexico Partnership Keywords (Enhanced)
    const partnershipKeywords = [
      'canada', 'mexico', 'usmca', 'nafta', 'cpkc', 'tc energy', 'scotiabank',
      'keith creel', 'françois poirier', 'scott thomson', 'canadian pacific',
      'mexican partnership', 'trilateral', 'north america', 'trade corridor',
      'rail network', 'pipeline', 'energy corridor', 'automotive triangle',
      'critical minerals', 'strategic partnership', 'bilateral trade',
      'carney', 'sheinbaum', 'prime minister', 'president mexico'
    ];

    const contentLower = content.toLowerCase();
    const foundPartnershipKeywords = partnershipKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    );

    console.log(`   🎯 Partnership: ${foundPartnershipKeywords.length} keywords found`);
    if (foundPartnershipKeywords.length > 0) {
      console.log(`   Keywords: ${foundPartnershipKeywords.slice(0, 4).join(', ')}${foundPartnershipKeywords.length > 4 ? '...' : ''}`);
    }

    // Check for fresh content (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Extract dates from RSS items
    const dateMatches = content.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/gi) ||
                       content.match(/<published[^>]*>([^<]+)<\/published>/gi) || [];

    let recentItems = 0;
    dateMatches.forEach(dateMatch => {
      const dateStr = dateMatch.replace(/<[^>]*>/g, '').trim();
      const itemDate = new Date(dateStr);
      if (itemDate > yesterday && !isNaN(itemDate.getTime())) {
        recentItems++;
      }
    });

    const hasFreshContent = recentItems > 0;
    console.log(`   ⚡ Fresh content: ${recentItems} items from last 24 hours`);

    // Business relevance
    const businessKeywords = [
      'investment', 'billion', 'million', 'partnership', 'acquisition',
      'merger', 'trade', 'export', 'import', 'energy', 'infrastructure',
      'manufacturing', 'announcement', 'agreement', 'deal', 'expansion'
    ];

    const foundBusinessKeywords = businessKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    );

    console.log(`   💼 Business: ${foundBusinessKeywords.length} keywords found`);

    // Extract sample headlines for breaking news
    const titleMatches = content.match(/<title[^>]*>([^<]+)<\/title>/gi) || [];
    if (titleMatches.length > 1) {
      console.log(`   📰 Headlines sample:`);
      titleMatches.slice(1, 3).forEach((title, index) => {
        const cleanTitle = title.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim();
        if (cleanTitle && cleanTitle.length > 10 && !cleanTitle.includes('http')) {
          console.log(`     • ${cleanTitle.substring(0, 65)}${cleanTitle.length > 65 ? '...' : ''}`);
        }
      });
    }

    // Assessment
    const isHighValue = hasValidFormat && itemMatches.length > 0 &&
                       (foundPartnershipKeywords.length >= 2 ||
                        (foundPartnershipKeywords.length >= 1 && hasFreshContent));

    console.log(`   🏆 Assessment: ${isHighValue ? 'HIGH VALUE for partnership intelligence' : 'Standard business feed'}`);

    return {
      success: true,
      responseTime,
      contentSize: parseFloat(contentSize),
      itemCount: itemMatches.length,
      hasValidFormat,
      partnershipRelevance: foundPartnershipKeywords.length,
      partnershipKeywords: foundPartnershipKeywords,
      businessRelevance: foundBusinessKeywords.length,
      hasFreshContent,
      recentItems,
      isHighValue
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    let errorMsg = error.message;

    if (error.name === 'AbortError') {
      errorMsg = 'Timeout (15s limit)';
    } else if (errorMsg.includes('fetch failed')) {
      errorMsg = 'Connection failed';
    }

    console.log(`   ❌ FAILED: ${errorMsg} (${responseTime}ms)`);
    return { success: false, error: errorMsg };
  }
}

// Run the fresh feed test
testFreshFeeds().catch(console.error);