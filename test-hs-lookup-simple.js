/**
 * Simple HS Lookup API Test
 * Tests the HS code lookup functionality directly
 */

async function testHSLookup() {
  console.log('🧪 Testing HS Code Lookup API...');
  
  const testData = {
    product_description: 'Electronic circuit board with microprocessor',
    business_type: 'electronics'
  };
  
  try {
    console.log('📡 Calling /api/simple-classification...');
    console.log('📝 Test data:', testData);
    
    const response = await fetch('http://localhost:3000/api/simple-classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📊 API Response:');
    console.log('- Success:', result.success);
    console.log('- Results count:', result.results?.length || 0);
    console.log('- Method:', result.method);
    
    if (result.results && result.results.length > 0) {
      console.log('\n🎯 Top 3 HS Code Suggestions:');
      result.results.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. HS Code: ${item.hs_code}`);
        console.log(`   Description: ${item.description || item.product_description}`);
        console.log(`   Confidence: ${item.confidence}%`);
        console.log(`   MFN Rate: ${item.mfn_rate || item.mfn_tariff_rate}%`);
        console.log('');
      });
      
      console.log('✅ HS Code Lookup is WORKING!');
      return true;
    } else {
      console.log('❌ No HS code results returned');
      console.log('Full response:', JSON.stringify(result, null, 2));
      return false;
    }
    
  } catch (error) {
    console.error('❌ HS Lookup Test Failed:', error.message);
    return false;
  }
}

// Test different product types
async function runMultipleTests() {
  console.log('🚀 Running Multiple HS Lookup Tests...\n');
  
  const testCases = [
    {
      product_description: 'Cotton t-shirt 100% cotton',
      business_type: 'textiles'
    },
    {
      product_description: 'Electronic circuit board with components',
      business_type: 'electronics'
    },
    {
      product_description: 'Car brake pads automotive parts',
      business_type: 'automotive'
    }
  ];
  
  let passed = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    console.log(`\n=== Test ${i + 1}/3: ${testCases[i].product_description} ===`);
    const success = await testHSLookup(testCases[i]);
    if (success) passed++;
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🏁 Test Results: ${passed}/${testCases.length} tests passed`);
  
  if (passed === testCases.length) {
    console.log('🎉 All HS Lookup tests PASSED!');
    console.log('✅ Your HS lookup system is working correctly');
  } else {
    console.log('⚠️ Some tests failed - check the issues above');
  }
}

// Helper function for individual test case
async function testHSLookup(testData = {
  product_description: 'Electronic circuit board with microprocessor',
  business_type: 'electronics'
}) {
  try {
    const response = await fetch('http://localhost:3000/api/simple-classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      return false;
    }
    
    const result = await response.json();
    
    if (result.success && result.results && result.results.length > 0) {
      const topResult = result.results[0];
      console.log(`✅ Found HS Code: ${topResult.hs_code}`);
      console.log(`📝 Description: ${topResult.description || topResult.product_description}`);
      console.log(`🎯 Confidence: ${topResult.confidence}%`);
      return true;
    } else {
      console.log('❌ No results found');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// Run the tests
runMultipleTests().catch(console.error);