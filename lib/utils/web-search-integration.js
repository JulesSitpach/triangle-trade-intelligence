/**
 * WebSearch Tool Integration for Triangle Intelligence Platform
 * Connects to the actual WebSearch tool available in this environment
 */

export async function WebSearch({ query, allowed_domains = [], blocked_domains = [] }) {
  try {
    // Use the Claude WebSearch function directly
    // This makes an actual web search using the available WebSearch tool

    const webSearchPromise = new Promise((resolve, reject) => {
      // Make request to the web search proxy with full URL
      fetch('http://localhost:3001/api/internal/web-search-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          allowed_domains,
          blocked_domains
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          resolve(data.results);
        } else {
          reject(new Error(data.error || 'WebSearch failed'));
        }
      })
      .catch(error => reject(error));
    });

    const results = await webSearchPromise;
    return formatSearchResults(results);

  } catch (error) {
    console.error('[WebSearch Integration] Error:', error);
    throw new Error(`WebSearch integration failed: ${error.message}`);
  }
}

// Helper function to validate and format search results
export function formatSearchResults(rawResults) {
  if (!Array.isArray(rawResults)) {
    return [];
  }

  return rawResults.map(result => ({
    title: result.title || 'Untitled',
    snippet: result.snippet || result.description || result.content || '',
    url: result.url || result.link || '#',
    relevance: result.relevance || result.score || 0.5
  })).filter(result => result.title && result.url !== '#');
}

export default WebSearch;