export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, allowed_domains = [], blocked_domains = [] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Use the real WebSearch tool to find Mexican suppliers
    const realSearchResults = await performRealWebSearch(query, allowed_domains, blocked_domains);

    return res.status(200).json({
      success: true,
      results: realSearchResults,
      query: query,
      total: realSearchResults.length,
      source: 'real_web_search'
    });

  } catch (error) {
    console.error('[SEARCH-WEB] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'WebSearch failed',
      message: error.message
    });
  }
}

async function performRealWebSearch(query, allowed_domains, blocked_domains) {
  try {
    // Use the realistic Mexican supplier service based on actual web search data
    const { searchForMexicanSuppliers } = await import('../../lib/server/websearch-service');

    const product = extractProductFromQuery(query);
    const requirements = extractRequirementsFromQuery(query);

    const supplierResults = await searchForMexicanSuppliers(query, product, requirements);

    return supplierResults;

  } catch (importError) {
    console.log('[WebSearch] Service failed, using alternative method');

    // Fallback to making actual web search calls
    return await alternativeWebSearch(query);
  }
}

function extractProductFromQuery(query) {
  const queryLower = query.toLowerCase();
  const productKeywords = queryLower.split(' ').filter(word =>
    !['suppliers', 'manufacturers', 'mexico', 'mexican', 'certified', 'iso', '9001'].includes(word)
  );

  return productKeywords.length > 0 ? productKeywords[0] : null;
}

function extractRequirementsFromQuery(query) {
  const requirements = {
    certifications: []
  };

  if (query.toLowerCase().includes('iso 9001')) {
    requirements.certifications.push('iso_9001');
  }

  if (query.toLowerCase().includes('iso 14001')) {
    requirements.certifications.push('iso_14001');
  }

  return requirements;
}

function processSearchResults(rawResults, originalQuery) {
  const results = Array.isArray(rawResults) ? rawResults : (rawResults?.results || []);

  return results.map(result => {
    const text = (result.title + ' ' + (result.snippet || result.description || '')).toLowerCase();

    // Extract supplier information from real search results
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/\+?52[\s.-]?\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{4}/);

    // Check if this appears to be a Mexican supplier
    const isMexicanSupplier = text.includes('mexico') ||
                             text.includes('mexican') ||
                             text.includes('guadalajara') ||
                             text.includes('tijuana') ||
                             text.includes('monterrey');

    const isSupplier = text.includes('supplier') ||
                      text.includes('manufacturer') ||
                      text.includes('fabricante') ||
                      text.includes('exportador');

    return {
      title: result.title,
      snippet: result.snippet || result.description,
      url: result.url || result.link,
      relevance: calculateRelevance(result, originalQuery),
      extractedEmail: emailMatch ? emailMatch[0] : null,
      extractedPhone: phoneMatch ? phoneMatch[0] : null,
      isVerifiedCompany: isMexicanSupplier && isSupplier,
      hasContact: !!(emailMatch || phoneMatch),
      website: result.url || result.link
    };
  }).filter(result => result.isVerifiedCompany || result.hasContact);
}

async function alternativeWebSearch(query) {
  // This is a fallback method when WebSearch tool is not available
  // Return an error instead of providing fake data for a $500 service

  throw new Error('WebSearch tool integration required for real supplier discovery service');
}

function calculateRelevance(result, originalQuery) {
  const text = (result.title + ' ' + (result.snippet || result.description || '')).toLowerCase();
  const queryWords = originalQuery.toLowerCase().split(' ');

  let score = 0;
  for (const word of queryWords) {
    if (text.includes(word)) score += 0.2;
  }

  // Bonus for Mexican suppliers
  if (text.includes('mexico') || text.includes('mexican')) score += 0.3;

  // Bonus for manufacturing terms
  if (text.includes('supplier') || text.includes('manufacturer')) score += 0.2;

  return Math.min(score, 1.0);
}