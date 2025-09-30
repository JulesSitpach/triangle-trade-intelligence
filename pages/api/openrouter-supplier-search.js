/**
 * Real Supplier Search using OpenRouter Web Search AI
 * Uses existing OpenRouter API key - no additional costs
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

    console.log(`[OPENROUTER SEARCH] Real web search for: "${query}"`);

    // Use OpenRouter with web search enabled model
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Triangle Intelligence Supplier Search"
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5", // Fast, cost-effective model for research tasks
        messages: [{
          role: "user",
          content: `Find real electronics manufacturers and suppliers in Mexico for: ${product || query}

Search for companies that:
- Manufacture or supply ${product || query}
- Are located in Mexico (Tijuana, Guadalajara, Monterrey, etc.)
- Have export capabilities to North America
- ${requirements?.certifications ? `Have ${requirements.certifications.join(', ')} certifications` : ''}

For each supplier found, provide:
1. Company name
2. Location (city, state)
3. Capabilities/specializations
4. Contact information (email, phone if available)
5. Website URL

Format as JSON array with objects containing: name, location, capabilities, extractedEmail, extractedPhone, website, confidence, match_reason

Provide real companies only - no fake or template data.`
        }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[OPENROUTER SEARCH] API response received`);

    // Extract supplier data from AI response
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenRouter API');
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
      console.warn('[OPENROUTER SEARCH] JSON parse failed, using text parsing');
      suppliers = parseTextResponse(aiResponse, product);
    }

    console.log(`[OPENROUTER SEARCH] Found ${suppliers.length} suppliers`);

    return res.status(200).json({
      success: true,
      results: suppliers,
      query: query,
      total: suppliers.length,
      source: 'openrouter_web_search'
    });

  } catch (error) {
    console.error('[OPENROUTER SEARCH] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'OpenRouter search failed',
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
        match_reason: `Found via OpenRouter web search for ${product}`
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