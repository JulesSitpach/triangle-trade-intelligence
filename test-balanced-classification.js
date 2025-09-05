/**
 * TEST BALANCED CLASSIFICATION APPROACH
 * Testing if the new approach finds relevant products first, then applies business context
 */

async function testBalancedClassification() {
  console.log('🧪 TESTING BALANCED CLASSIFICATION APPROACH');
  console.log('===========================================');
  
  const testCases = [
    {
      description: 'Copper electrical wire 18-22 AWG',
      businessType: 'automotive',
      expectedCategory: '8544', // Cables/conductors
      shouldAvoid: '8501' // Motors
    },
    {
      description: 'Molded plastic electrical connectors',
      businessType: 'automotive', 
      expectedCategory: '8536', // Electrical connectors
      shouldAvoid: '8529' // TV equipment
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: "${testCase.description}"`);
    console.log(`Business Context: ${testCase.businessType}`);
    console.log(`Expected: ${testCase.expectedCategory} series (not ${testCase.shouldAvoid})`);
    console.log('---');
    
    try {
      const response = await fetch('http://localhost:3000/api/simple-classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_description: testCase.description,
          business_type: testCase.businessType
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.results) {
        console.log(`📊 Results (${result.results.length} found):`);
        
        let foundExpected = false;
        let foundWrongCategory = false;
        
        result.results.slice(0, 3).forEach((item, index) => {
          const subcategory = item.hs_code.substring(0, 4);
          const isExpected = subcategory === testCase.expectedCategory;
          const isWrong = subcategory === testCase.shouldAvoid;
          
          if (isExpected) foundExpected = true;
          if (isWrong) foundWrongCategory = true;
          
          const status = isExpected ? '✅ EXPECTED' : (isWrong ? '❌ WRONG CATEGORY' : '⚠️ OTHER');
          const businessIcon = item.business_context_applied ? '🏭' : '📦';
          
          console.log(`   ${index + 1}. ${businessIcon} ${item.hs_code} (${subcategory}) - ${status}`);
          console.log(`      ${item.description?.substring(0, 70)}...`);
          console.log(`      Confidence: ${(item.confidence * 100).toFixed(1)}% | MFN: ${item.mfn_tariff_rate}% | Match: ${item.matchedTerm}`);
        });
        
        // Analysis
        console.log('\n🎯 ANALYSIS:');
        if (foundExpected && !foundWrongCategory) {
          console.log('✅ SUCCESS: Found expected category, avoided wrong category');
        } else if (foundExpected && foundWrongCategory) {
          console.log('🟡 MIXED: Found expected category but also wrong category');
        } else if (!foundExpected && foundWrongCategory) {
          console.log('❌ FAILED: Did not find expected category, found wrong category');
        } else {
          console.log('⚠️ UNCLEAR: Results in unexpected categories');
        }
        
      } else {
        console.log('❌ No results found');
      }
      
    } catch (error) {
      console.error(`💥 Error:`, error.message);
    }
  }
  
  console.log('\n===========================================');
  console.log('🧪 BALANCED CLASSIFICATION TEST COMPLETE');
}

testBalancedClassification().catch(console.error);