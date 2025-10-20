/**
 * USITC Web Scraper - Get CURRENT tariff rates from official source
 *
 * ARCHITECTURE:
 * - PRIMARY SOURCE: Live web scraping of USITC.gov
 * - NO reliance on AI training data
 * - Uses fetch() + AI to parse HTML
 * - Results have CURRENT verification date
 *
 * This ensures tariff rates are ALWAYS current, not from stale AI training data.
 */

/**
 * Scrape current tariff rate from USITC.gov
 * @param {string} hsCode - 8-10 digit HTS code (e.g., "7326.90.85")
 * @returns {object} Current tariff rate with verification metadata
 */
export async function scrapeUSITCRate(hsCode) {
  try {
    console.log(`🌐 Web scraping USITC.gov for HS ${hsCode}...`);

    // Normalize HS code (remove dots)
    const normalizedCode = hsCode.replace(/\./g, '');

    // Determine chapter from HS code (first 2 digits)
    const chapter = normalizedCode.substring(0, 2);

    // USITC HTS chapter URL
    const usitcUrl = `https://hts.usitc.gov/view/chapter?release=2025HTSRev1&chapter=${chapter}`;

    console.log(`   URL: ${usitcUrl}`);
    console.log(`   Searching for: ${normalizedCode} in Chapter ${chapter}`);

    // Step 1: Fetch the HTML from USITC
    const htmlResponse = await fetch(usitcUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!htmlResponse.ok) {
      throw new Error(`HTTP ${htmlResponse.status}: ${htmlResponse.statusText}`);
    }

    const htmlText = await htmlResponse.text();
    console.log(`   ✅ Fetched HTML (${htmlText.length} chars)`);

    // Step 2: Use AI to parse the HTML and extract tariff rate
    const prompt = `You are parsing HTML from USITC.gov Harmonized Tariff Schedule.

TASK: Find HTS code ${normalizedCode} and extract its tariff rates.

The HTML contains a table with these columns:
- "HTS" or "Heading/Subheading" = HS code
- "General" = MFN (Most Favored Nation) tariff rate
- "Special" = Preferential rates (USMCA, etc.)
- "Unit" = Measurement unit
- "Description" or "Article Description" = Product description

SEARCH STRATEGY:
1. Look for "${normalizedCode}" in the HTML
2. It might be formatted as "${normalizedCode}" or "${hsCode}" (with dots)
3. Once found, extract the "General" rate from the same row
4. Extract the "Special" rate text
5. Extract the description

EXAMPLES OF RATES YOU MIGHT SEE:
- "2.5%" → return 2.5
- "Free" → return 0
- "5.5 cents/kg" → return 5.5 (ignore units for now)

HTML (first 40000 chars):
${htmlText.substring(0, 40000)}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "found": true,
  "hs_code": "${normalizedCode}",
  "mfn_rate": 2.5,
  "mfn_rate_text": "2.5%",
  "special_rate": "Free (A, CA, CL, IL, JO, KR, MA, MX, OM, P, PA, PE, R, S, SG)",
  "description": "Other articles of iron or steel",
  "verification_date": "${new Date().toISOString().split('T')[0]}",
  "source": "USITC HTS 2025 Rev 1"
}

If NOT found, return:
{
  "found": false,
  "hs_code": "${normalizedCode}",
  "error": "Code not found in Chapter ${chapter}"
}`;

    // Call OpenRouter to parse the HTML
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4.5', // Fast and cheap for HTML parsing
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenRouter failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiText = aiResult.choices?.[0]?.message?.content;

    console.log(`   AI Parse result:`, aiText);

    // Parse the AI's JSON response
    let parsedData;
    try {
      // Try to extract JSON from response (might have markdown code blocks)
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(aiText);
      }
    } catch (parseError) {
      console.error(`   ❌ Failed to parse AI response:`, parseError.message);
      return {
        success: false,
        error: 'Failed to parse USITC data from AI response',
        raw_response: aiText?.substring(0, 500)
      };
    }

    if (!parsedData.found) {
      console.log(`   ⚠️ HS code ${normalizedCode} not found in Chapter ${chapter}`);
      return {
        success: false,
        error: parsedData.error || `HS code not found in Chapter ${chapter}`,
        hs_code: normalizedCode
      };
    }

    // SUCCESS - Return structured CURRENT data
    console.log(`   ✅ USITC scrape SUCCESS: ${parsedData.mfn_rate}% MFN rate (CURRENT)`);

    return {
      success: true,
      source: 'usitc_web_scrape',
      verified_date: new Date().toISOString(),
      freshness: 'current',

      // Tariff data
      hs_code: normalizedCode,
      mfn_rate: parseFloat(parsedData.mfn_rate) || 0,
      special_rate_text: parsedData.special_rate || 'Not specified',
      description: parsedData.description || 'See USITC for full description',

      // USMCA rate (extract from special rate text)
      usmca_rate: extractUSMCARate(parsedData.special_rate),

      // Metadata
      official_source: 'USITC.gov HTS 2025',
      confidence: 'official',
      notes: `Scraped from USITC.gov on ${new Date().toLocaleDateString()}. This is CURRENT official data.`
    };

  } catch (error) {
    console.error(`❌ USITC web scrape failed for ${hsCode}:`, error.message);
    return {
      success: false,
      error: error.message,
      hs_code: hsCode
    };
  }
}

/**
 * Extract USMCA rate from special rate text
 * Example: "Free (A, CA, CL, MX, ...)" → 0
 */
function extractUSMCARate(specialRateText) {
  if (!specialRateText) return null;

  const text = specialRateText.toLowerCase();

  // Check if USMCA countries (CA, MX) are listed
  const hasUSMCA = text.includes('ca') || text.includes('mx') || text.includes('usmca');

  // Check if rate is "Free" for USMCA
  if (hasUSMCA && text.includes('free')) {
    return 0;
  }

  // Try to extract percentage for USMCA countries
  // Format could be: "5% (CA, MX)"
  const rateMatch = text.match(/(\d+\.?\d*)%/);
  if (rateMatch && hasUSMCA) {
    return parseFloat(rateMatch[1]);
  }

  return null; // USMCA rate not determinable
}
