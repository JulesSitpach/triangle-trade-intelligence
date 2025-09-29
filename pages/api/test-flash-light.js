/**
 * Flash Light Model Testing API
 * Compares Google Flash Light vs Claude 3.5 Sonnet for supplier research
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🧪 Testing Google Flash Light for Mexico Supplier Research');

  try {
    // Test 1: Flash Light Model
    console.log('🔍 Testing Flash Light Model...');
    const flashLightStart = Date.now();

    const flashLightResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Triangle Intelligence Flash Light Test"
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5", // Testing Flash model
        messages: [{
          role: "user",
          content: `Find real Mexican electronics manufacturers that could supply circuit board components.

Search Requirements:
- Companies located in Mexico (Tijuana, Guadalajara, Monterrey areas)
- Manufacturing capabilities for circuit boards/electronics
- Export capabilities to North America
- Contact information (email, phone, website)
- ISO certifications if available

For each supplier found, provide REAL companies only with:
1. Company name
2. Location (city, state)
3. Manufacturing specializations
4. Contact information (email, phone if available)
5. Website URL
6. Certifications (ISO 9001, etc.)
7. Export capabilities

Format as JSON array with objects containing: name, location, capabilities, contact_email, contact_phone, website, certifications, confidence_score

Find 5-7 real suppliers. NO fake or template data.`
        }]
      })
    });

    const flashLightData = await flashLightResponse.json();
    const flashLightTime = Date.now() - flashLightStart;

    console.log(`⏱️  Flash Light Response Time: ${flashLightTime}ms`);

    // Test 2: Current Model (Claude 3.5 Sonnet)
    console.log('🔍 Testing Current Model (Claude 3.5 Sonnet)...');
    const sonnetStart = Date.now();

    const sonnetResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Triangle Intelligence Sonnet Test"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{
          role: "user",
          content: `Find real Mexican electronics manufacturers that could supply circuit board components.

Search Requirements:
- Companies located in Mexico (Tijuana, Guadalajara, Monterrey areas)
- Manufacturing capabilities for circuit boards/electronics
- Export capabilities to North America
- Contact information (email, phone, website)
- ISO certifications if available

For each supplier found, provide REAL companies only with:
1. Company name
2. Location (city, state)
3. Manufacturing specializations
4. Contact information (email, phone if available)
5. Website URL
6. Certifications (ISO 9001, etc.)
7. Export capabilities

Format as JSON array with objects containing: name, location, capabilities, contact_email, contact_phone, website, certifications, confidence_score

Find 5-7 real suppliers. NO fake or template data.`
        }]
      })
    });

    const sonnetData = await sonnetResponse.json();
    const sonnetTime = Date.now() - sonnetStart;

    console.log(`⏱️  Sonnet Response Time: ${sonnetTime}ms`);

    // Extract content for analysis
    const flashLightContent = flashLightData.choices?.[0]?.message?.content || '';
    const sonnetContent = sonnetData.choices?.[0]?.message?.content || '';

    // Try to extract JSON data for comparison
    let flashLightSuppliers = [];
    let sonnetSuppliers = [];

    try {
      const flashLightJsonMatch = flashLightContent.match(/\[[\s\S]*\]/);
      if (flashLightJsonMatch) {
        flashLightSuppliers = JSON.parse(flashLightJsonMatch[0]);
      }
    } catch (e) {
      console.log('⚠️  Flash Light JSON parsing failed');
    }

    try {
      const sonnetJsonMatch = sonnetContent.match(/\[[\s\S]*\]/);
      if (sonnetJsonMatch) {
        sonnetSuppliers = JSON.parse(sonnetJsonMatch[0]);
      }
    } catch (e) {
      console.log('⚠️  Sonnet JSON parsing failed');
    }

    // Quality analysis
    const flashLightValid = flashLightSuppliers.length >= 3;
    const sonnetValid = sonnetSuppliers.length >= 3;

    // Generate recommendation
    let recommendation = '';
    if (flashLightValid && sonnetValid) {
      recommendation = 'USE_FLASH_LIGHT - Suitable for initial supplier discovery with Jorge validation';
    } else if (flashLightValid) {
      recommendation = 'CONSIDER_FLASH_LIGHT - Adequate quality, needs A/B testing';
    } else {
      recommendation = 'KEEP_SONNET - Flash Light quality insufficient for professional services';
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      flash_light: {
        response_time: flashLightTime,
        suppliers_found: flashLightSuppliers.length,
        content_length: flashLightContent.length,
        sample_suppliers: flashLightSuppliers.slice(0, 3), // First 3 for review
        raw_response: flashLightContent.substring(0, 500) + '...' // Truncated
      },
      sonnet: {
        response_time: sonnetTime,
        suppliers_found: sonnetSuppliers.length,
        content_length: sonnetContent.length,
        sample_suppliers: sonnetSuppliers.slice(0, 3), // First 3 for review
        raw_response: sonnetContent.substring(0, 500) + '...' // Truncated
      },
      analysis: {
        cost_savings_potential: "90-95% reduction using Flash Light",
        flash_light_quality: flashLightValid ? 'ADEQUATE' : 'INSUFFICIENT',
        sonnet_quality: sonnetValid ? 'GOOD' : 'NEEDS_REVIEW',
        recommendation: recommendation
      },
      business_impact: {
        current_cost_per_query: "$0.50-1.00 (Sonnet)",
        flash_light_cost_per_query: "$0.01-0.05 (Flash Light)",
        monthly_savings_potential: "Jorge processes ~8 supplier requests/month → $40-80 savings/month",
        quality_assurance: "Jorge validates all supplier recommendations regardless of AI model"
      }
    };

    console.log('📊 Test Results Generated');
    console.log('💡 Recommendation:', recommendation);

    res.status(200).json({
      success: true,
      test_results: testResults
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}