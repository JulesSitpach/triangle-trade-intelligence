/**
 * WebSearch Tool Integration for Triangle Intelligence Platform
 * Uses Claude Code's WebSearch MCP tool for real web search
 */

export async function WebSearch({ query, allowed_domains = [], blocked_domains = [] }) {
  try {
    console.log(`[WebSearch] Performing real web search for: "${query}"`);

    // Call the Next.js API route that uses WebSearch MCP tool
    const response = await fetch('/api/mcp-web-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        allowed_domains,
        blocked_domains
      })
    });

    if (!response.ok) {
      throw new Error(`WebSearch API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'WebSearch failed');
    }

    console.log(`[WebSearch] Found ${data.results?.length || 0} results`);
    return formatSearchResults(data.results || []);

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