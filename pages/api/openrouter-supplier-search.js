/**
 * AI-Powered Supplier Recommendations (OpenRouter)
 *
 * NOTE: This generates AI-powered supplier recommendations based on product requirements,
 * NOT real web search. These are plausible Mexico suppliers the AI recommends researching.
 *
 * Jorge validates and supplements these with his CCVIAL network contacts.
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

    console.log(`[AI SUPPLIER RECOMMENDATIONS] Generating suggestions for: "${query}"`);

    // Call OpenRouter for AI-generated supplier recommendations
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Triangle Trade Intelligence Supplier Recommendations"
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        messages: [{
          role: "user",
          content: `Based on the search query "${query}" for ${product || 'manufacturing'}, suggest 5-7 plausible Mexico-based suppliers that Jorge should research and validate using his CCVIAL network.

Requirements: ${JSON.stringify(requirements || {})}

For each supplier, provide:
1. A realistic company name (typical Mexico manufacturing company naming patterns)
2. Likely location (Tijuana, Guadalajara, Monterrey, etc.)
3. Expected capabilities based on the product type
4. General contact format (no fake emails/phones - just indicate "Contact via company website" or "Requires Jorge's network introduction")

Format as JSON array with objects containing: name, location, capabilities, contact_method, confidence (0-1), match_reason

IMPORTANT: These are research starting points, NOT verified suppliers. Label them as "Recommended for Jorge's validation"`
        }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenRouter API');
    }

    // Parse JSON from AI response
    let suppliers = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suppliers = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn('[AI SUPPLIER RECOMMENDATIONS] JSON parse failed');
      suppliers = [];
    }

    console.log(`[AI SUPPLIER RECOMMENDATIONS] Generated ${suppliers.length} recommendations`);

    return res.status(200).json({
      success: true,
      results: suppliers,
      query: query,
      total: suppliers.length,
      source: 'ai_recommendations',
      disclaimer: 'These are AI-generated research starting points. Jorge validates using CCVIAL network.'
    });

  } catch (error) {
    console.error('[AI SUPPLIER RECOMMENDATIONS] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI recommendations failed',
      message: error.message
    });
  }
}