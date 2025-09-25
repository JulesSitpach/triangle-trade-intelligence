/**
 * Test Classification System Comparison
 * Compares NEW agent system vs EXISTING AI API
 */

const testProducts = [
  "Food-grade packaging materials",
  "Quick-frozen mango chunks for food service",
  "Automotive wire harness assemblies",
  "Cotton t-shirts with printed graphics",
  "Electronic circuit boards for smartphones"
];

async function testClassification(productDescription) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: "${productDescription}"`);
  console.log('='.repeat(80));

  try {
    // Test NEW agent system
    console.log('\n🆕 NEW Agent System (/api/agents/classification):');
    const newAgentStart = Date.now();
    const newResponse = await fetch('http://localhost:3001/api/agents/classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'suggest_hs_code',
        productDescription,
        componentOrigins: []
      })
    });
    const newResult = await newResponse.json();
    const newAgentTime = Date.now() - newAgentStart;

    console.log('  Status:', newResponse.status);
    console.log('  Response Time:', newAgentTime + 'ms');
    if (newResult.success && newResult.data) {
      console.log('  HS Code:', newResult.data.hsCode);
      console.log('  Confidence:', newResult.data.adjustedConfidence || newResult.data.confidence);
      console.log('  Explanation:', newResult.data.explanation?.substring(0, 100) + '...');
    } else {
      console.log('  Error:', newResult.error || 'No data returned');
    }

    // Test EXISTING AI system
    console.log('\n📦 EXISTING AI System (/api/ai-classification):');
    const existingStart = Date.now();
    const existingResponse = await fetch('http://localhost:3001/api/ai-classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productDescription,
        businessContext: {}
      })
    });
    const existingResult = await existingResponse.json();
    const existingTime = Date.now() - existingStart;

    console.log('  Status:', existingResponse.status);
    console.log('  Response Time:', existingTime + 'ms');
    if (existingResult.success && existingResult.results?.[0]) {
      const firstResult = existingResult.results[0];
      console.log('  HS Code:', firstResult.hsCode);
      console.log('  Confidence:', firstResult.confidence);
      console.log('  Explanation:', firstResult.reasoning?.substring(0, 100) + '...');
    } else {
      console.log('  Error:', existingResult.error || 'No results returned');
    }

    // Comparison
    console.log('\n📊 Comparison:');
    const newHsCode = newResult.data?.hsCode;
    const existingHsCode = existingResult.results?.[0]?.hsCode;

    if (newHsCode && existingHsCode) {
      const match = newHsCode === existingHsCode;
      console.log('  HS Code Match:', match ? '✅ YES' : '❌ NO');
      console.log('  NEW:', newHsCode);
      console.log('  EXISTING:', existingHsCode);
      console.log('  Speed Difference:', (newAgentTime - existingTime) + 'ms');
      return { match, newHsCode, existingHsCode };
    } else {
      console.log('  ⚠️ Could not compare - missing data');
      return { match: false, newHsCode, existingHsCode };
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    return { match: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Classification System Comparison');
  console.log('Testing', testProducts.length, 'products...\n');

  const results = [];

  for (const product of testProducts) {
    const result = await testClassification(product);
    results.push({ product, ...result });

    // Wait 2 seconds between tests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📈 FINAL SUMMARY');
  console.log('='.repeat(80));

  const matches = results.filter(r => r.match).length;
  const total = results.length;
  const accuracy = ((matches / total) * 100).toFixed(1);

  console.log(`\nAccuracy: ${matches}/${total} (${accuracy}%)`);
  console.log('\nResults:');
  results.forEach(r => {
    const status = r.match ? '✅' : '❌';
    console.log(`  ${status} ${r.product.substring(0, 50)}...`);
    if (!r.match && r.newHsCode && r.existingHsCode) {
      console.log(`     NEW: ${r.newHsCode} | EXISTING: ${r.existingHsCode}`);
    }
  });

  console.log('\n💡 Recommendation:');
  if (accuracy >= 80) {
    console.log('  ✅ Systems are equivalent - SAFE TO MIGRATE');
  } else if (accuracy >= 60) {
    console.log('  ⚠️ Systems differ - REVIEW before migrating');
  } else {
    console.log('  ❌ Systems are different - DO NOT migrate yet');
  }

  console.log('\n');
}

// Run tests
runAllTests().catch(console.error);