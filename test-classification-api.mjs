// Test classification via API endpoint to see the flow
const testPayload = {
  productDescription: 'Titanium bolts M10x1.5, cadmium plated, Grade 5',
  componentOrigins: [{
    description: 'Titanium bolts',
    origin_country: 'US',
    value_percentage: 100
  }],
  additionalContext: {
    overallProduct: 'Aircraft assembly',
    industryContext: 'Aerospace',
    destinationCountry: 'US',
    substantialTransformation: false
  }
};

(async () => {
  console.log('🧪 Testing classification API flow...\n');
  console.log('📤 Request payload:', JSON.stringify(testPayload, null, 2));

  const response = await fetch('http://localhost:3001/api/agents/classification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'auth-token=test-token' // Dummy auth for testing
    },
    body: JSON.stringify(testPayload)
  });

  const result = await response.json();

  console.log('\n========== API RESPONSE ==========');
  console.log(JSON.stringify(result, null, 2));
  console.log('==================================\n');

  if (result.success) {
    console.log('✅ Classification successful');
    console.log(`   HS Code: ${result.hs_code}`);
    console.log(`   Confidence: ${result.confidence}%`);
    console.log(`   Explanation: ${result.explanation?.substring(0, 150)}...`);
  } else {
    console.log('❌ Classification failed:', result.error);
  }
})();
