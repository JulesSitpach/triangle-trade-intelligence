/**
 * USITC HTS API Integration
 * Official source for US Harmonized Tariff Schedule base rates
 *
 * DATA SOURCES:
 * - Base MFN rates: USITC HTS Database (https://hts.usitc.gov/)
 * - USMCA rates: USITC special program rates
 * - Section 301/232: NOT in USITC (use AI research)
 *
 * HYBRID APPROACH:
 * 1. Get official base rate from USITC
 * 2. Use AI to research Section 301/232 additions
 * 3. Combine for total effective rate
 */

/**
 * USITC HTS Lookup via Web Scraping
 * (USITC doesn't provide a public REST API, so we scrape their search results)
 *
 * @param {string} htsCode - 8-10 digit HTS code (e.g., "7326.90.85")
 * @returns {Object|null} Official tariff data or null if not found
 */
export async function lookupUSITCRate(htsCode) {
  try {
    // Normalize HTS code (remove dots, spaces, dashes)
    const normalizedCode = htsCode.replace(/[\.\s\-]/g, '');

    console.log(`🔍 USITC Lookup: Searching for HTS ${htsCode} (normalized: ${normalizedCode})`);

    // USITC HTS database search URL
    const searchUrl = `https://hts.usitc.gov/current`;

    // Try to fetch HTS data
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Triangle Trade Intelligence Platform (https://triangle-trade-intelligence.vercel.app)',
        'Accept': 'text/html,application/json'
      }
    });

    if (!response.ok) {
      console.log(`⚠️ USITC API unavailable (${response.status}). Falling back to AI research.`);
      return null;
    }

    // For now, return null and use AI
    // TODO: Implement actual HTML parsing or find API endpoint
    console.log('⚠️ USITC web scraping not yet implemented. Using AI research.');
    return null;

  } catch (error) {
    console.error('❌ USITC lookup failed:', error.message);
    return null;
  }
}

/**
 * ALTERNATIVE: Use USITC DataWeb API (requires registration)
 * https://dataweb.usitc.gov/
 *
 * To enable:
 * 1. Register at https://dataweb.usitc.gov/
 * 2. Get API key
 * 3. Add USITC_API_KEY to .env.local
 * 4. Uncomment this function
 */
export async function lookupUSITCDataWeb(htsCode) {
  const apiKey = process.env.USITC_API_KEY;

  if (!apiKey) {
    console.log('⚠️ USITC_API_KEY not configured. Skipping DataWeb lookup.');
    return null;
  }

  try {
    const normalizedCode = htsCode.replace(/[\.\s\-]/g, '');

    // USITC DataWeb API endpoint
    const apiUrl = `https://api.usitc.gov/dataweb/tariff/hts/${normalizedCode}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`⚠️ USITC DataWeb API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      source: 'USITC DataWeb',
      hts_code: htsCode,
      base_mfn_rate: parseFloat(data.general_rate) || 0,
      usmca_rate: parseFloat(data.ca_mx_rate) || 0,
      description: data.description,
      unit: data.unit_of_quantity,
      last_updated: data.effective_date,
      confidence: 'official',
      verification_status: 'verified'
    };

  } catch (error) {
    console.error('❌ USITC DataWeb API error:', error.message);
    return null;
  }
}

/**
 * ❌ HARDCODED HTS RATES REMOVED (Nov 21, 2025)
 *
 * Deleted: COMMON_HTS_RATES const with 5 hardcoded HS codes
 * Deleted: getStaticHTSRate() function that returned stale Oct 19 data
 *
 * Why removed: Manually verified rates from Oct 19, 2025 are now stale (>30 days old)
 * Old approach: Return hardcoded 2.5% or 0% from static mapping (outdated)
 * New approach: Database lookup → If miss: Return null and trigger AI research
 *
 * This forces fresh tariff data instead of returning 32-day-old rates.
 */

/**
 * Query HTS Official 2025 database table
 * This is populated via scripts/import-hts-2025.js
 *
 * @param {string} htsCode - HTS code to lookup
 * @returns {Object|null} Official HTS data from database
 */
export async function queryHTSDatabase(htsCode, supabaseClient) {
  try {
    // Normalize HTS code for lookup (try both with and without dots)
    const normalizedCode = htsCode.replace(/[\.\s\-]/g, '');
    const formattedCode = htsCode; // Keep original format

    const { data, error } = await supabaseClient
      .from('hts_official_2025')
      .select('*')
      .or(`hts_code.eq.${normalizedCode},hts_code.eq.${formattedCode},hts_code_formatted.eq.${formattedCode}`)
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      source: 'USITC HTS 2025 Database',
      hts_code: htsCode,
      base_mfn_rate: data.mfn_rate || 0,
      usmca_rate: data.usmca_rate !== null ? data.usmca_rate : 0,
      description: data.description,
      unit: data.unit_of_quantity,
      last_updated: data.effective_date,
      revision: data.revision,
      confidence: 'official',
      verification_status: 'verified'
    };
  } catch (error) {
    console.error('❌ HTS database query error:', error.message);
    return null;
  }
}

/**
 * HYBRID LOOKUP: Try Database → DataWeb API → Static mapping → Return null (AI will research)
 *
 * @param {string} htsCode - HTS code to lookup
 * @param {Object} supabaseClient - Supabase client instance (optional)
 * @returns {Object|null} Base rate data from USITC or null if unavailable
 */
export async function getOfficialBaseRate(htsCode, supabaseClient = null) {
  // PRIORITY 1: Query HTS Official 2025 database (if available)
  if (supabaseClient) {
    const dbResult = await queryHTSDatabase(htsCode, supabaseClient);
    if (dbResult) {
      console.log(`✅ USITC Database: ${htsCode} = ${dbResult.base_mfn_rate}% MFN (${dbResult.revision})`);
      return dbResult;
    }
  }

  // PRIORITY 2: Try USITC DataWeb API (if configured)
  const dataWebResult = await lookupUSITCDataWeb(htsCode);
  if (dataWebResult) {
    console.log(`✅ USITC DataWeb: ${htsCode} = ${dataWebResult.base_mfn_rate}% MFN`);
    return dataWebResult;
  }

  // PRIORITY 3: Fall back to static mapping (for common codes)
  const staticResult = getStaticHTSRate(htsCode);
  if (staticResult) {
    return staticResult;
  }

  // All methods failed - return null (AI will research)
  console.log(`⚠️ No USITC data for ${htsCode}. AI will research base rate.`);
  return null;
}
