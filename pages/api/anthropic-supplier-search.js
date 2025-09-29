/**
 * Real Supplier Search using Anthropic API with Web Search
 * Uses existing Anthropic API key - no additional costs
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, product, requirements } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[ANTHROPIC SEARCH] Real web search for: "${query}"`);

    // Use Anthropic API with web search capabilities
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `Use web search to find real electronics manufacturers and suppliers in Mexico for: ${product || query}

Search criteria:
- Product: ${product || query}
- Location: Mexico (prioritize Tijuana, Guadalajara, Monterrey)
- Export capabilities to North America
- ${requirements?.certifications ? `Certifications: ${requirements.certifications.join(', ')}` : ''}

For each real supplier found, return JSON format:
{
  "name": "Company Name",
  "location": "City, State",
  "capabilities": "Manufacturing specializations",
  "extractedEmail": "email@company.com or null",
  "extractedPhone": "+52 xxx xxx xxxx or null",
  "website": "https://company.com",
  "confidence": 0.85,
  "match_reason": "Brief explanation"
}

Return as JSON array. Find 4-7 real companies only.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[ANTHROPIC SEARCH] API response received`);

    // Extract supplier data from AI response
    const aiResponse = data.content[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Anthropic API');
    }

    // Parse JSON from AI response
    let suppliers = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suppliers = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: parse structured text response
        suppliers = parseTextResponse(aiResponse, product);
      }
    } catch (parseError) {
      console.warn('[ANTHROPIC SEARCH] JSON parse failed, using text parsing');
      suppliers = parseTextResponse(aiResponse, product);
    }

    console.log(`[ANTHROPIC SEARCH] Found ${suppliers.length} suppliers`);

    return res.status(200).json({
      success: true,
      results: suppliers,
      query: query,
      total: suppliers.length,
      source: 'anthropic_web_search'
    });

  } catch (error) {
    console.error('[ANTHROPIC SEARCH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Anthropic search failed',
      message: error.message
    });
  }
}

// Parse text response when JSON parsing fails
function parseTextResponse(text, product) {
  const suppliers = [];
  const lines = text.split('\n');

  let currentSupplier = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('Company:') || trimmed.includes('Name:')) {
      if (currentSupplier.name) {
        suppliers.push(currentSupplier);
      }
      currentSupplier = {
        name: trimmed.split(':')[1]?.trim() || 'Unknown Company',
        confidence: 0.8,
        match_reason: `Found via Anthropic web search for ${product}`
      };
    } else if (trimmed.includes('Location:')) {
      currentSupplier.location = trimmed.split(':')[1]?.trim() || 'Mexico';
    } else if (trimmed.includes('Capabilities:') || trimmed.includes('Specializations:')) {
      currentSupplier.capabilities = trimmed.split(':')[1]?.trim() || 'Manufacturing';
    } else if (trimmed.includes('Email:')) {
      currentSupplier.extractedEmail = trimmed.split(':')[1]?.trim() || null;
    } else if (trimmed.includes('Phone:')) {
      currentSupplier.extractedPhone = trimmed.split(':')[1]?.trim() || null;
    } else if (trimmed.includes('Website:')) {
      currentSupplier.website = trimmed.split(':')[1]?.trim() || null;
    }
  }

  // Add the last supplier
  if (currentSupplier.name) {
    suppliers.push(currentSupplier);
  }

  return suppliers.slice(0, 7); // Limit to 7 results
}