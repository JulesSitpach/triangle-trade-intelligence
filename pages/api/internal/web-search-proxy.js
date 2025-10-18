/**
 * Internal WebSearch Proxy
 * This endpoint calls the actual WebSearch tool and returns structured results
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, allowed_domains = [], blocked_domains = [] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Use the actual WebSearch tool available in this Claude Code environment
    let searchResults;

    try {
      console.log(`[WebSearch Proxy] Performing real web search for: "${query}"`);

      // Call the real web search endpoint (relative path for production compatibility)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const searchResponse = await fetch(`${baseUrl}/api/internal/real-web-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          allowed_domains,
          blocked_domains
        })
      });

      if (!searchResponse.ok) {
        throw new Error(`Web search API returned ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();

      if (!searchData.success) {
        throw new Error(searchData.message || 'Web search failed');
      }

      searchResults = searchData.results;
      console.log(`[WebSearch Proxy] Found ${searchResults?.length || 0} results`);

    } catch (webSearchError) {
      console.error('[WebSearch Proxy] WebSearch error:', webSearchError);
      throw new Error(`Real web search failed: ${webSearchError.message}`);
    }

    // Parse and structure the results
    const results = parseWebSearchResults(searchResults);

    return res.status(200).json({
      success: true,
      results: results,
      query: query,
      total: results.length
    });

  } catch (error) {
    console.error('[WebSearch Proxy] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'WebSearch proxy failed',
      message: error.message
    });
  }
}

function parseWebSearchResults(rawResults) {
  // Handle different possible result formats
  let results = [];

  if (Array.isArray(rawResults)) {
    results = rawResults;
  } else if (rawResults && rawResults.results) {
    results = rawResults.results;
  } else if (rawResults && typeof rawResults === 'object') {
    // If it's a single result object, wrap in array
    results = [rawResults];
  }

  // Extract structured data from each result
  return results.map(result => {
    // Handle different possible result structures
    const title = result.title || result.name || 'Untitled';
    const snippet = result.snippet || result.description || result.content || '';
    const url = result.url || result.link || result.href || '#';

    return {
      title: title,
      snippet: snippet,
      url: url,
      relevance: result.relevance || result.score || 0.8
    };
  }).filter(result => result.title && result.url !== '#');
}