/**
 * Real Web Search using Puppeteer
 * FREE Google search scraping - no API costs
 */

import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, product, requirements } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[PUPPETEER SEARCH] Scraping Google for: "${query}"`);

    const results = await scrapeGoogleSearch(query);

    if (!results || results.length === 0) {
      return res.status(200).json({
        success: true,
        results: [],
        query: query,
        total: 0,
        source: 'puppeteer_google_scrape'
      });
    }

    // Process results into supplier format
    const suppliers = results.map((result, index) => ({
      name: extractCompanyName(result.title, result.snippet),
      location: extractLocation(result.snippet),
      capabilities: extractCapabilities(result.snippet, product),
      extractedEmail: extractEmail(result.snippet),
      extractedPhone: extractPhone(result.snippet),
      website: result.url,
      confidence: Math.max(0.6, 0.9 - (index * 0.05)),
      match_reason: `Found via Google search: ${result.title.substring(0, 100)}`
    })).filter(supplier => supplier.name && supplier.name !== 'Unknown Company');

    console.log(`[PUPPETEER SEARCH] Found ${suppliers.length} suppliers`);

    return res.status(200).json({
      success: true,
      results: suppliers,
      query: query,
      total: suppliers.length,
      source: 'puppeteer_google_scrape'
    });

  } catch (error) {
    console.error('[PUPPETEER SEARCH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Web scraping failed',
      message: error.message
    });
  }
}

async function scrapeGoogleSearch(query) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log(`[PUPPETEER] Navigating to: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // Extract search results
    const results = await page.evaluate(() => {
      const searchResults = [];

      // Google search result selectors
      const resultElements = document.querySelectorAll('.g');

      resultElements.forEach((element, index) => {
        if (index >= 10) return; // Limit to 10 results

        const titleElement = element.querySelector('h3');
        const linkElement = element.querySelector('a');
        const snippetElement = element.querySelector('.VwiC3b, .s3v9rd, .hgKElc');

        if (titleElement && linkElement) {
          searchResults.push({
            title: titleElement.textContent.trim(),
            url: linkElement.href,
            snippet: snippetElement ? snippetElement.textContent.trim() : ''
          });
        }
      });

      return searchResults;
    });

    console.log(`[PUPPETEER] Scraped ${results.length} results from Google`);
    return results;

  } catch (error) {
    console.error('[PUPPETEER] Scraping error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper functions to extract supplier information from search results
function extractCompanyName(title, snippet) {
  // Look for company patterns in title first
  const titleMatch = title.match(/^([^-|]+(?:Ltd|Inc|Corp|Company|LLC|S\.A\.|de C\.V\.|Group|Industries))/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Look for company patterns in snippet
  const snippetMatch = snippet.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+(?:Ltd|Inc|Corp|Company|LLC|S\.A\.|de C\.V\.|Group|Industries))?)/);
  if (snippetMatch) {
    return snippetMatch[1].trim();
  }

  // Fallback to cleaned title
  const cleaned = title.split('-')[0].split('|')[0].trim();
  return cleaned || 'Unknown Company';
}

function extractLocation(snippet) {
  // Look for Mexico locations
  const locationMatch = snippet.match(/(Tijuana|Guadalajara|Monterrey|Ciudad Juárez|Mexico City|Puebla|León|Mérida|Cancún|Juárez)[,\s]*(?:Mexico|México)?/i);
  if (locationMatch) {
    return `${locationMatch[1]}, Mexico`;
  }

  // General Mexico mention
  if (snippet.toLowerCase().includes('mexico') || snippet.toLowerCase().includes('méxico')) {
    return 'Mexico';
  }

  return 'Location not specified';
}

function extractCapabilities(snippet, productType) {
  const capabilities = [];
  const text = snippet.toLowerCase();

  // Extract actual capabilities mentioned
  if (text.includes('manufacturer') || text.includes('manufacturing')) {
    capabilities.push('Manufacturing');
  }
  if (text.includes('export') || text.includes('exporter')) {
    capabilities.push('Export Services');
  }
  if (text.includes('iso') || text.includes('certified') || text.includes('quality')) {
    capabilities.push('Quality Certified');
  }
  if (text.includes('supply chain') || text.includes('logistics')) {
    capabilities.push('Supply Chain Management');
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

function extractEmail(content) {
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : null;
}

function extractPhone(content) {
  // Mexican phone numbers
  const phoneMatch = content.match(/\+?52[\s.-]?\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{4}|\+?1[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : null;
}