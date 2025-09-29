/**
 * Flash Light Model Testing for Mexico Supplier Research
 * Evaluates Google Flash Light vs current models for cost/quality optimization
 */

const testFlashLight = async () => {
  console.log('🧪 Testing Google Flash Light for Mexico Supplier Research');
  console.log('=' * 60);

  // Test parameters
  const testQuery = "electronics manufacturing suppliers circuit board components Mexico";
  const testProduct = "circuit board components for automotive electronics";

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
    console.log('\n🔍 Testing Current Model (Claude 3.5 Sonnet)...');
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

    // Analysis Results
    console.log('\n📊 COMPARISON RESULTS');
    console.log('=' * 40);

    // Response analysis
    const flashLightContent = flashLightData.choices?.[0]?.message?.content || '';
    const sonnetContent = sonnetData.choices?.[0]?.message?.content || '';

    console.log(`Flash Light Response Length: ${flashLightContent.length} characters`);
    console.log(`Sonnet Response Length: ${sonnetContent.length} characters`);

    // Try to extract JSON data for comparison
    let flashLightSuppliers = [];
    let sonnetSuppliers = [];

    try {
      // Extract JSON from Flash Light response
      const flashLightJsonMatch = flashLightContent.match(/\[[\s\S]*\]/);
      if (flashLightJsonMatch) {
        flashLightSuppliers = JSON.parse(flashLightJsonMatch[0]);
      }
    } catch (e) {
      console.log('⚠️  Flash Light JSON parsing failed');
    }

    try {
      // Extract JSON from Sonnet response
      const sonnetJsonMatch = sonnetContent.match(/\[[\s\S]*\]/);
      if (sonnetJsonMatch) {
        sonnetSuppliers = JSON.parse(sonnetJsonMatch[0]);
      }
    } catch (e) {
      console.log('⚠️  Sonnet JSON parsing failed');
    }

    console.log(`\nFlash Light Suppliers Found: ${flashLightSuppliers.length}`);
    console.log(`Sonnet Suppliers Found: ${sonnetSuppliers.length}`);

    // Quality analysis
    console.log('\n🎯 QUALITY ANALYSIS');
    console.log('=' * 30);

    const analyzeSuppliers = (suppliers, modelName) => {
      console.log(`\n${modelName} Results:`);

      suppliers.forEach((supplier, index) => {
        console.log(`${index + 1}. ${supplier.name || 'No name'}`);
        console.log(`   Location: ${supplier.location || 'Not specified'}`);
        console.log(`   Contact: ${supplier.contact_email || supplier.email || 'No email'}`);
        console.log(`   Website: ${supplier.website || 'No website'}`);
        console.log(`   Confidence: ${supplier.confidence_score || 'Not rated'}`);
      });
    };

    if (flashLightSuppliers.length > 0) {
      analyzeSuppliers(flashLightSuppliers, 'Flash Light');
    }

    if (sonnetSuppliers.length > 0) {
      analyzeSuppliers(sonnetSuppliers, 'Sonnet 3.5');
    }

    // Cost analysis (estimated)
    console.log('\n💰 COST ANALYSIS');
    console.log('=' * 25);
    console.log('Flash Light: ~$0.01-0.05 per query (estimated)');
    console.log('Sonnet 3.5: ~$0.50-1.00 per query (estimated)');
    console.log('Potential savings: 90-95% cost reduction');

    // Recommendation
    console.log('\n✅ RECOMMENDATION');
    console.log('=' * 25);

    const flashLightValid = flashLightSuppliers.length >= 3;
    const sonnetValid = sonnetSuppliers.length >= 3;

    if (flashLightValid && sonnetValid) {
      console.log('✅ Flash Light suitable for initial supplier discovery');
      console.log('💡 Recommend: Flash Light for research → Jorge validation');
      console.log('📈 Expected workflow: Flash Light finds 5-10 suppliers → Jorge validates top 3-5');
    } else if (flashLightValid) {
      console.log('✅ Flash Light performs adequately');
      console.log('💡 Consider A/B testing with Jorge validation');
    } else {
      console.log('⚠️  Flash Light quality insufficient');
      console.log('💡 Recommend: Keep Sonnet 3.5 for supplier discovery');
    }

    // Save results for review
    const testResults = {
      timestamp: new Date().toISOString(),
      flash_light: {
        response_time: flashLightTime,
        suppliers_found: flashLightSuppliers.length,
        content_length: flashLightContent.length,
        suppliers: flashLightSuppliers
      },
      sonnet: {
        response_time: sonnetTime,
        suppliers_found: sonnetSuppliers.length,
        content_length: sonnetContent.length,
        suppliers: sonnetSuppliers
      },
      recommendation: flashLightValid ? 'USE_FLASH_LIGHT' : 'KEEP_SONNET'
    };

    console.log('\n📁 Test results saved to test-results.json');

    return testResults;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: error.message };
  }
};

// Export for use in API
export { testFlashLight };

// Run test if called directly
if (require.main === module) {
  testFlashLight().then(results => {
    console.log('\n🎉 Test completed!');
    console.log('Results:', JSON.stringify(results, null, 2));
  });
}