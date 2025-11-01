/**
 * RSS PROXY - Workaround for blocked government RSS feeds
 *
 * Uses a third-party RSS-to-JSON service to bypass network restrictions
 * Falls back to direct fetch if proxy fails
 */

import Parser from 'rss-parser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { feedUrl, feedName } = req.body;

  if (!feedUrl) {
    return res.status(400).json({ error: 'feedUrl required' });
  }

  try {
    // Try Method 1: RSS2JSON proxy service (free tier allows government domains)
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;

    console.log(`📡 Fetching via proxy: ${feedName || feedUrl}`);

    const proxyResponse = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'TriangleIntelligence/1.0'
      },
      timeout: 15000
    });

    if (!proxyResponse.ok) {
      throw new Error(`Proxy returned ${proxyResponse.status}`);
    }

    const proxyData = await proxyResponse.json();

    if (proxyData.status !== 'ok') {
      throw new Error(`Proxy error: ${proxyData.message || 'Unknown error'}`);
    }

    // Convert RSS2JSON format to standard RSS parser format
    const items = proxyData.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      content: item.content || item.description || '',
      description: item.description || item.content || '',
      contentSnippet: item.description?.substring(0, 200) || '',
      guid: item.guid || item.link,
      categories: item.categories || [],
      author: item.author || ''
    }));

    return res.status(200).json({
      success: true,
      method: 'proxy',
      feedUrl,
      feedName: proxyData.feed?.title || feedName || 'Unknown Feed',
      items,
      itemCount: items.length
    });

  } catch (proxyError) {
    console.warn(`⚠️ Proxy method failed, trying direct fetch:`, proxyError.message);

    // Method 2: Try direct fetch (will likely fail due to network restrictions, but worth trying)
    try {
      const parser = new Parser({
        timeout: 15000,
        headers: {
          'User-Agent': 'TriangleIntelligence/1.0 (Trade Compliance; +https://triangle-trade-intelligence.vercel.app)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      const feed = await parser.parseURL(feedUrl);

      return res.status(200).json({
        success: true,
        method: 'direct',
        feedUrl,
        feedName: feed.title || feedName || 'Unknown Feed',
        items: feed.items || [],
        itemCount: feed.items?.length || 0
      });

    } catch (directError) {
      console.error(`❌ Both proxy and direct fetch failed for ${feedUrl}:`, {
        proxyError: proxyError.message,
        directError: directError.message
      });

      return res.status(500).json({
        success: false,
        error: 'Both proxy and direct fetch failed',
        proxyError: proxyError.message,
        directError: directError.message,
        feedUrl,
        suggestion: 'Network restrictions may be blocking this feed. Consider manual alert entry or whitelisting domains.'
      });
    }
  }
}
