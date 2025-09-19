/**
 * Test Existing RSS Feeds (Bloomberg, Reuters) for Canada-Mexico Partnership Data
 */

const existingFeeds = {
  // YOUR EXISTING FEEDS (found in archived SQL files)
  reuters_trade: 'https://feeds.reuters.com/reuters/businessNews',
  bloomberg_trade: 'https://feeds.bloomberg.com/markets/news.rss',

  // ADDITIONAL FINANCIAL/PARTNERSHIP FEEDS TO TEST
  bank_of_canada: 'https://www.bankofcanada.ca/rss-feeds/press-releases/',
  reuters_canada: 'https://feeds.reuters.com/reuters/CATopGenNews',
  bloomberg_economics: 'https://feeds.bloomberg.com/economics/news.rss'
};

async function testExistingFeeds() {
  console.log('TESTING YOUR EXISTING BLOOMBERG & REUTERS FEEDS FOR CANADA-MEXICO DATA');
  console.log('='.repeat(70));

  for (const [feedName, feedUrl] of Object.entries(existingFeeds)) {
    await testSingleFeed(feedName, feedUrl);

    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function testSingleFeed(name, url) {
  console.log(`\nTesting ${name}:`);
  console.log(`URL: ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Triangle Intelligence Partnership Monitor/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now();

    if (!response.ok) {
      console.log(`   ERROR: ${response.status} ${response.statusText}`);
      return;
    }

    const content = await response.text();
    console.log(`   SUCCESS: ${response.status} (${(content.length/1024).toFixed(1)}KB)`);

    // Check for RSS/XML format
    const hasValidFormat = content.includes('<rss') || content.includes('<feed') || content.includes('<?xml');
    const itemMatches = content.match(/<item/gi) || content.match(/<entry/gi) || [];
    console.log(`   Format: ${hasValidFormat ? 'Valid RSS/XML' : 'Invalid format'}`);
    console.log(`   Items: ${itemMatches.length} entries found`);

    // Canada-Mexico Partnership Keywords
    const partnershipKeywords = [
      'canada', 'mexico', 'usmca', 'nafta', 'cpkc', 'tc energy',
      'scotiabank', 'keith creel', 'françois poirier', 'scott thomson',
      'canadian pacific', 'mexican partnership', 'trilateral',
      'north america', 'trade corridor', 'rail network'
    ];

    const contentLower = content.toLowerCase();
    const foundKeywords = partnershipKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    );

    console.log(`   Partnership Keywords: ${foundKeywords.length} found`);
    if (foundKeywords.length > 0) {
      console.log(`   Found: ${foundKeywords.slice(0, 5).join(', ')}${foundKeywords.length > 5 ? '...' : ''}`);
    }

    // Financial/Business Keywords
    const businessKeywords = [
      'investment', 'billion', 'million', 'partnership', 'acquisition',
      'merger', 'trade', 'export', 'import', 'energy', 'pipeline',
      'railway', 'infrastructure', 'manufacturing'
    ];

    const foundBusinessKeywords = businessKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    );

    console.log(`   Business Keywords: ${foundBusinessKeywords.length} found`);

    // Extract sample headlines if available
    const titleMatches = content.match(/<title[^>]*>([^<]+)<\/title>/gi) || [];
    if (titleMatches.length > 1) { // Skip channel title
      console.log(`   Sample Headlines:`);
      titleMatches.slice(1, 4).forEach((title, index) => {
        const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
        if (cleanTitle && cleanTitle !== 'Untitled') {
          console.log(`     ${index + 1}. ${cleanTitle.substring(0, 80)}${cleanTitle.length > 80 ? '...' : ''}`);
        }
      });
    }

    // Assessment
    const isUseful = hasValidFormat && itemMatches.length > 0 &&
                    (foundKeywords.length > 0 || foundBusinessKeywords.length > 3);

    console.log(`   Assessment: ${isUseful ? 'USEFUL for partnership intelligence' : 'LIMITED partnership relevance'}`);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`   TIMEOUT: Feed took too long to respond`);
    } else {
      console.log(`   ERROR: ${error.message}`);
    }
  }
}

testExistingFeeds().catch(console.error);