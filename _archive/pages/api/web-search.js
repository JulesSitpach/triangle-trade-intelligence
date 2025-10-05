import { WebSearch } from '../../lib/utils/web-search-integration.js';
import {
  blockFakeData,
  enforceRealWebSearch,
  DataIntegrityViolation
} from '../../lib/data-integrity-enforcer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, region, product, requirements } = req.body;

    console.log(`[WEB-SEARCH] Performing REAL web search for: ${query}`);

    // 🔒 CRITICAL: Use actual WebSearch tool - NO template data generation
    const searchResults = await WebSearch({
      query: `${query} ${region || 'Mexico'} suppliers manufacturers`,
      allowed_domains: ['*.gov', '*.org', '*.mx', '*.com'],
      blocked_domains: ['reddit.com', 'facebook.com', 'twitter.com']
    });

    if (!searchResults || searchResults.length === 0) {
      throw new DataIntegrityViolation(
        'No real web search results found. Refusing to generate template data for $500 paid service.',
        'NO_REAL_SEARCH_RESULTS',
        { query, region, product }
      );
    }

    // 🔒 ENFORCE: Block any template data before delivery
    try {
      enforceRealWebSearch(searchResults, query);
      console.log('✅ [WEB SEARCH INTEGRITY] Real search results verified');
    } catch (integrityError) {
      console.error('❌ [WEB SEARCH INTEGRITY] Fake data detected:', integrityError.message);
      return res.status(503).json({
        success: false,
        error: 'Data integrity violation',
        message: 'Cannot provide template data for paid service. Real web search required.',
        violation_type: integrityError.violationType,
        blocked_reason: integrityError.message
      });
    }

    // Process search results into supplier format with contact extraction
    const processedSuppliers = await processWebSearchResults(searchResults, product, requirements);

    console.log(`[WEB-SEARCH] Verified ${processedSuppliers.length} real suppliers`);

    return res.status(200).json({
      success: true,
      results: processedSuppliers,
      query: query,
      total: processedSuppliers.length,
      source: 'real_web_search_verified'
    });

  } catch (error) {
    console.error('[WEB-SEARCH] Error:', error);

    if (error instanceof DataIntegrityViolation) {
      return res.status(503).json({
        success: false,
        error: 'Data integrity violation',
        message: 'Real web search required for $500 supplier sourcing service. Cannot provide template data.',
        violation_type: error.violationType,
        details: error.data
      });
    }

    return res.status(503).json({
      success: false,
      error: 'Web search service unavailable',
      message: 'Real web search capability required for supplier discovery. Service temporarily unavailable.'
    });
  }
}

// ⛔ ALL TEMPLATE DATA GENERATION FUNCTIONS REMOVED
// This file now ONLY uses real WebSearch tool or fails explicitly
// NO hardcoded regions, NO template emails, NO fake data generation

// Real web search result processing (extracts contact info from actual search results)
async function processWebSearchResults(searchResults, product, requirements) {
  const suppliers = [];

  for (const result of searchResults) {
    // Extract real contact information from web search snippets/content
    const supplier = {
      name: extractCompanyName(result.title, result.snippet),
      location: extractLocation(result.snippet, result.url),
      capabilities: extractCapabilities(result.snippet, product),
      extractedEmail: extractEmailFromContent(result.snippet),
      extractedPhone: extractPhoneFromContent(result.snippet),
      website: result.url,
      confidence: calculateConfidenceScore(result, product),
      match_reason: `Found via web search for "${product}" - ${result.snippet.substring(0, 100)}...`
    };

    // Only include suppliers with real extracted data
    if (supplier.name && supplier.name !== 'No company name found') {
      suppliers.push(supplier);
    }
  }

  return suppliers.slice(0, 7); // Limit to 7 results
}

// Extract real company name from search result title
function extractCompanyName(title, snippet) {
  // Look for company patterns in title first
  const titleCompanyMatch = title.match(/^([^-|]+(?:Ltd|Inc|Corp|Company|LLC|S\.A\.|de C\.V\.))/i);
  if (titleCompanyMatch) {
    return titleCompanyMatch[1].trim();
  }

  // Look for company patterns in snippet
  const snippetCompanyMatch = snippet.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s(?:Ltd|Inc|Corp|Company|LLC|S\.A\.|de C\.V\.))?)/);
  if (snippetCompanyMatch) {
    return snippetCompanyMatch[1].trim();
  }

  // Fallback to cleaned title
  return title.split('-')[0].split('|')[0].trim() || 'No company name found';
}

// Extract location information from search content
function extractLocation(snippet, url) {
  // Look for Mexico locations in snippet
  const locationMatch = snippet.match(/(Tijuana|Guadalajara|Monterrey|Ciudad Juárez|Mexico City|Puebla|León|Mérida)[,\s]*(?:Mexico|México)?/i);
  if (locationMatch) {
    return `${locationMatch[1]}, Mexico`;
  }

  // Check URL for location indicators
  const urlLocationMatch = url.match(/\.(mx|mexico)/);
  if (urlLocationMatch) {
    return 'Mexico';
  }

  return 'Location not specified';
}

// Extract capabilities from search content based on actual text
function extractCapabilities(snippet, productType) {
  const capabilities = [];
  const text = snippet.toLowerCase();

  // Extract actual capabilities mentioned in the content
  if (text.includes('manufacturer') || text.includes('manufacturing')) {
    capabilities.push('Manufacturing');
  }
  if (text.includes('export') || text.includes('exporter')) {
    capabilities.push('Export Services');
  }
  if (text.includes('iso') || text.includes('certified') || text.includes('quality')) {
    capabilities.push('Quality Certified');
  }
  if (text.includes('custom') || text.includes('oem')) {
    capabilities.push('Custom Manufacturing');
  }

  // Add product type if mentioned
  if (productType && text.includes(productType.toLowerCase())) {
    capabilities.push(productType);
  }

  return capabilities.length > 0 ? capabilities.join(', ') : 'Manufacturing services';
}

// Extract real email addresses from search content
function extractEmailFromContent(content) {
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : null;
}

// Extract real phone numbers from search content
function extractPhoneFromContent(content) {
  const phoneMatch = content.match(/\+?52[\s.-]?\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{4}|\+?1[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : null;
}

// Calculate confidence based on real content match quality
function calculateConfidenceScore(result, productType) {
  let score = result.relevance || 0.5;

  // Boost for actual contact information
  if (extractEmailFromContent(result.snippet) || extractPhoneFromContent(result.snippet)) {
    score += 0.2;
  }

  // Boost for product type match
  if (productType && result.snippet.toLowerCase().includes(productType.toLowerCase())) {
    score += 0.15;
  }

  // Boost for manufacturing keywords
  if (result.snippet.toLowerCase().includes('manufacturer') || result.snippet.toLowerCase().includes('supplier')) {
    score += 0.1;
  }

  return Math.min(score, 0.95);
}