/**
 * RSS Feed Testing Script for Canada-Mexico Partnership Data
 * Tests feed availability, response times, and content relevance
 */

const feeds = {
  // US FEEDS
  cbp_rulings_cross: 'https://rulings.cbp.gov/rulings/rss',
  cbp_news: 'https://www.cbp.gov/newsroom/national-media-release/feed',
  usitc_tariff_news: 'https://www.usitc.gov/press_room/news_release/news_release.xml',
  federal_register_cbp: 'https://www.federalregister.gov/api/v1/articles.rss?conditions[agencies][]=u-s-customs-and-border-protection&conditions[type][]=rule',
  ita_trade_news: 'https://www.trade.gov/rss.xml',

  // CANADA FEEDS
  cbsa_news: 'https://www.cbsa-asfc.gc.ca/news-nouvelles/rss-eng.xml',
  canada_gazette_part2: 'https://www.gazette.gc.ca/rss/part2-e.xml',
  global_affairs_canada: 'https://www.international.gc.ca/rss/newsroom.xml',

  // MEXICO FEEDS
  dof_official: 'https://www.dof.gob.mx/rss.php',
  secretaria_economia: 'https://www.gob.mx/se/prensa/rss',

  // INTERNATIONAL
  wto_news: 'https://www.wto.org/english/news_e/news_e.rss',
  eu_trade: 'https://policy.trade.ec.europa.eu/rss_en'
};

async function testFeed(name, url) {
  const startTime = Date.now();
  try {
    console.log(`\nTesting ${name}:`);
    console.log(`   URL: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Triangle Intelligence Test/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      console.log(`   ERROR: HTTP ${response.status} ${response.statusText} (${responseTime}ms)`);
      return false;
    }

    const content = await response.text();
    const contentLength = content.length;

    // Basic RSS/XML validation
    const hasRSS = content.includes('<rss') || content.includes('<feed');
    const hasItems = content.includes('<item') || content.includes('<entry');
    const itemMatches = content.match(/<item/g) || content.match(/<entry/g) || [];
    const itemCount = itemMatches.length;

    console.log(`   SUCCESS: ${response.status} (${responseTime}ms)`);
    console.log(`   Content: ${(contentLength/1024).toFixed(1)}KB`);
    console.log(`   Format: ${hasRSS ? 'Valid RSS/XML' : 'Invalid format'}`);
    console.log(`   Items: ${itemCount} entries found`);

    // Check for Canada-Mexico partnership keywords
    const partnershipKeywords = ['canada', 'mexico', 'usmca', 'nafta', 'cpkc', 'tc energy', 'scotiabank'];
    const foundKeywords = partnershipKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      console.log(`   Partnership Relevance: Found ${foundKeywords.length} keywords: ${foundKeywords.join(', ')}`);
    } else {
      console.log(`   Partnership Relevance: No Canada-Mexico keywords found`);
    }

    return {
      success: true,
      responseTime,
      contentLength,
      itemCount,
      hasValidFormat: hasRSS && hasItems,
      partnershipRelevance: foundKeywords.length,
      foundKeywords
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`   FAILED: ${error.message} (${responseTime}ms)`);
    return false;
  }
}

async function testAllFeeds() {
  console.log('TESTING RSS FEEDS FOR CANADA-MEXICO PARTNERSHIP DATA');
  console.log('='.repeat(60));

  const results = {};

  for (const [name, url] of Object.entries(feeds)) {
    const result = await testFeed(name, url);
    results[name] = result;

    // Small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\nTEST SUMMARY:');
  console.log('='.repeat(60));

  const working = Object.entries(results).filter(([name, result]) => result && result.success);
  const broken = Object.entries(results).filter(([name, result]) => !result || !result.success);
  const relevant = working.filter(([name, result]) => result.partnershipRelevance > 0);

  console.log(`Working feeds: ${working.length}/${Object.keys(feeds).length}`);
  console.log(`Broken feeds: ${broken.length}/${Object.keys(feeds).length}`);
  console.log(`Partnership relevant: ${relevant.length}/${working.length}`);

  if (working.length > 0) {
    console.log('\nWORKING FEEDS:');
    working.forEach(([name, result]) => {
      const relevantStatus = result.partnershipRelevance > 0 ? 'Relevant' : 'Generic';
      console.log(`   ${name}: ${result.itemCount} items, ${result.responseTime}ms, ${relevantStatus}`);
    });
  }

  if (broken.length > 0) {
    console.log('\nBROKEN FEEDS:');
    broken.forEach(([name, result]) => {
      console.log(`   ${name}: Failed`);
    });
  }

  if (relevant.length > 0) {
    console.log('\nPARTNERSHIP RELEVANT FEEDS:');
    relevant.forEach(([name, result]) => {
      console.log(`   ${name}: Keywords found: ${result.foundKeywords.join(', ')}`);
    });
  }

  console.log('\nRECOMMENDATION:');
  if (working.length >= Object.keys(feeds).length * 0.7) {
    console.log('Feed quality is GOOD - most feeds are working');
  } else if (working.length >= Object.keys(feeds).length * 0.5) {
    console.log('Feed quality is MIXED - some feeds need attention');
  } else {
    console.log('Feed quality is POOR - many feeds are broken');
  }

  // Return results for further analysis
  return { working, broken, relevant, results };
}

// Run the tests
testAllFeeds().catch(console.error);