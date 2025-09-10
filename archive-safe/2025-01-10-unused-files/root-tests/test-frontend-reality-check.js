/**
 * FRONTEND REALITY CHECK
 * Test if backend improvements actually reach real users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runFrontendRealityCheck() {
  console.log('🔍 FRONTEND REALITY CHECK - Do Users Actually See Real Rates?');
  console.log('============================================================\n');

  const baseUrl = 'http://localhost:3001';
  
  // Test 1: Consistency Check - Same product multiple times
  console.log('📋 TEST 1: CONSISTENCY CHECK');
  console.log('Same product description tested 3 times - should get identical results\n');
  
  const testProduct = "CMOS image sensor chips for digital cameras, 12-megapixel resolution";
  const testPayload = {
    productDescription: testProduct,
    businessContext: {
      companyType: "Electronics Manufacturing",
      tradeVolume: "$8.5M annually",
      primarySupplier: "Taiwan"
    }
  };
  
  const consistencyResults = [];
  
  for (let i = 1; i <= 3; i++) {
    console.log(`   Attempt ${i}/3...`);
    try {
      const response = await fetch(`${baseUrl}/api/ai-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      const data = await response.json();
      if (data.success && data.results?.length > 0) {
        const result = {
          hsCode: data.results[0].hsCode,
          mfnRate: data.results[0].mfnRate,
          usmcaRate: data.results[0].usmcaRate,
          confidence: data.results[0].confidence
        };
        consistencyResults.push(result);
        console.log(`   ✅ HS: ${result.hsCode}, MFN: ${result.mfnRate}%, Confidence: ${result.confidence}%`);
      } else {
        console.log(`   ❌ Failed: ${data.error || 'No results'}`);
        consistencyResults.push({ failed: true });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      consistencyResults.push({ failed: true });
    }
  }
  
  // Analyze consistency
  const validResults = consistencyResults.filter(r => !r.failed);
  if (validResults.length >= 2) {
    const firstResult = validResults[0];
    const isConsistent = validResults.every(r => 
      r.hsCode === firstResult.hsCode && 
      r.mfnRate === firstResult.mfnRate &&
      r.confidence === firstResult.confidence
    );
    
    if (isConsistent) {
      console.log('\n✅ CONSISTENCY TEST PASSED: Same product returns identical results');
    } else {
      console.log('\n❌ CONSISTENCY TEST FAILED: Same product returns different results');
      console.log('This indicates the system is not reliable for users');
    }
  } else {
    console.log('\n❌ CONSISTENCY TEST FAILED: Too many failed requests');
  }

  // Test 2: Edge Cases - Unusual Products
  console.log('\n\n📋 TEST 2: EDGE CASE HANDLING');
  console.log('Unusual products not typically in AI training data\n');
  
  const edgeCases = [
    {
      name: "Obscure Industrial Component",
      description: "Rare earth neodymium magnetic coupling assemblies for industrial centrifuge applications"
    },
    {
      name: "Specialized Medical Device",
      description: "Biocompatible titanium cranial fixation plates with osteointegration surface treatment"
    },
    {
      name: "Novel Technology Product",
      description: "Quantum dot enhanced photovoltaic cells with perovskite tandem architecture"
    }
  ];
  
  for (const edgeCase of edgeCases) {
    console.log(`Testing: ${edgeCase.name}`);
    console.log(`Product: ${edgeCase.description}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/ai-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: edgeCase.description,
          businessContext: { companyType: "Manufacturing" }
        })
      });
      
      const data = await response.json();
      if (data.success && data.results?.length > 0) {
        const result = data.results[0];
        console.log(`   ✅ Classification: ${result.hsCode} (${result.confidence}% confidence)`);
        console.log(`   📊 Tariff: MFN ${result.mfnRate}%, USMCA ${result.usmcaRate}%`);
        
        if (result.mfnRate > 0 || result.confidence > 70) {
          console.log('   ✅ Reasonable result for edge case');
        } else {
          console.log('   ⚠️  Low confidence/zero rates - may need improvement');
        }
      } else {
        console.log(`   ❌ Failed to classify: ${data.error || 'No results'}`);
      }
    } catch (error) {
      console.log(`   ❌ Request error: ${error.message}`);
    }
    console.log('');
  }

  // Test 3: Frontend Dropdown API Check
  console.log('\n📋 TEST 3: FRONTEND DROPDOWN DATA CHECK');
  console.log('Testing if dropdown APIs work (needed for user interface)\n');
  
  const dropdownAPIs = [
    '/api/simple-dropdown-options',
    '/api/admin/users',
    '/api/system-status'
  ];
  
  for (const apiPath of dropdownAPIs) {
    try {
      const response = await fetch(`${baseUrl}${apiPath}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${apiPath}: Working`);
        if (apiPath === '/api/simple-dropdown-options') {
          const hasData = data.businessTypes?.length > 0 && data.countries?.length > 0;
          console.log(`   Data available: ${hasData ? 'Yes' : 'No'}`);
        }
      } else {
        console.log(`❌ ${apiPath}: Failed (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${apiPath}: Error - ${error.message}`);
    }
  }

  // Test 4: Classification Accuracy Spot Check
  console.log('\n\n📋 TEST 4: CLASSIFICATION ACCURACY SPOT CHECK');
  console.log('Products with known correct classifications\n');
  
  const knownProducts = [
    {
      description: "smartphone mobile phone with touch screen",
      expectedChapter: "85", // Electronics chapter
      expectedNonZeroRate: false // Smartphones typically duty-free
    },
    {
      description: "cotton t-shirt men's apparel",
      expectedChapter: "61", // Textile chapter
      expectedNonZeroRate: true // Textiles typically have tariffs
    },
    {
      description: "automotive brake pads for cars",
      expectedChapter: "87", // Vehicle parts
      expectedNonZeroRate: true // Auto parts typically have tariffs
    }
  ];
  
  let accurateClassifications = 0;
  
  for (const known of knownProducts) {
    try {
      const response = await fetch(`${baseUrl}/api/ai-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: known.description,
          businessContext: { companyType: "Manufacturing" }
        })
      });
      
      const data = await response.json();
      if (data.success && data.results?.length > 0) {
        const result = data.results[0];
        const actualChapter = result.hsCode.substring(0, 2);
        const hasNonZeroRate = result.mfnRate > 0;
        
        console.log(`Product: ${known.description}`);
        console.log(`   Classification: ${result.hsCode} (Chapter ${actualChapter})`);
        console.log(`   Tariff: ${result.mfnRate}% MFN`);
        
        const chapterMatch = actualChapter === known.expectedChapter;
        const rateExpectationMet = hasNonZeroRate === known.expectedNonZeroRate;
        
        console.log(`   Chapter correct: ${chapterMatch ? '✅' : '❌'} (Expected: ${known.expectedChapter})`);
        console.log(`   Rate expectation: ${rateExpectationMet ? '✅' : '❌'} (Expected non-zero: ${known.expectedNonZeroRate})`);
        
        if (chapterMatch && rateExpectationMet) {
          accurateClassifications++;
        }
      } else {
        console.log(`❌ Failed to classify: ${known.description}`);
      }
    } catch (error) {
      console.log(`❌ Error testing: ${known.description} - ${error.message}`);
    }
    console.log('');
  }
  
  console.log(`📊 ACCURACY SUMMARY: ${accurateClassifications}/${knownProducts.length} classifications met expectations`);
  
  // Overall Assessment
  console.log('\n\n🎯 OVERALL FRONTEND REALITY ASSESSMENT');
  console.log('=====================================');
  
  const hasConsistency = validResults.length >= 2 && validResults.every(r => r.hsCode === validResults[0].hsCode);
  const hasRealRates = validResults.some(r => r.mfnRate > 0);
  const hasGoodAccuracy = accurateClassifications >= 2;
  
  console.log(`✅ Backend API Responding: ${validResults.length > 0 ? 'Yes' : 'No'}`);
  console.log(`✅ Consistent Results: ${hasConsistency ? 'Yes' : 'No'}`);
  console.log(`✅ Real Tariff Rates: ${hasRealRates ? 'Yes' : 'No'}`);
  console.log(`✅ Reasonable Accuracy: ${hasGoodAccuracy ? 'Yes' : 'No'}`);
  
  const overallSuccess = validResults.length > 0 && hasConsistency && hasRealRates && hasGoodAccuracy;
  
  if (overallSuccess) {
    console.log('\n🎉 FRONTEND REALITY CHECK: PASSED');
    console.log('Backend improvements are reaching users with reliable results');
  } else {
    console.log('\n⚠️  FRONTEND REALITY CHECK: NEEDS ATTENTION');
    console.log('Backend improvements may not be translating to reliable user experience');
  }
}

// Run the reality check
runFrontendRealityCheck().catch(error => {
  console.error('Reality check failed:', error);
  process.exit(1);
});