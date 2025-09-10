/**
 * Test AI Classification After Hardcoding Removal
 * Verify that the system now produces different results for different products
 */

const testProducts = [
  {
    name: 'CMOS Image Sensor Chips',
    description: 'CMOS image sensor chips for digital cameras, 12-megapixel resolution with advanced low-light performance',
    expectedDifference: 'Should classify differently from optical lenses'
  },
  {
    name: 'Precision Optical Lenses',
    description: 'Precision optical lenses for camera systems, multi-coated glass elements with anti-reflective coating',
    expectedDifference: 'Should classify differently from CMOS sensors'
  },
  {
    name: 'Automotive Wire Harnesses',
    description: 'Automotive electrical wire harnesses for vehicle wiring systems, copper conductors with PVC insulation',
    expectedDifference: 'Should be different from both sensors and lenses'
  }
];

async function testAIClassification() {
  console.log('🧪 Testing AI Classification After Hardcoding Removal');
  console.log('====================================================\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const results = {};
  
  try {
    for (const product of testProducts) {
      console.log(`\n🔍 Testing: ${product.name}`);
      console.log(`Description: ${product.description}`);
      
      const response = await fetch(`${baseUrl}/api/ai-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: product.description,
          businessContext: {
            companyType: 'Electronics Manufacturing'
          },
          userProfile: {
            companyRole: 'compliance manager',
            businessType: 'electronics'
          }
        })
      });
      
      if (!response.ok) {
        console.error(`❌ API Error for ${product.name}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      results[product.name] = data;
      
      if (data.success && data.results?.length > 0) {
        const topResult = data.results[0];
        console.log(`✅ Top Result:`);
        console.log(`   HS Code: ${topResult.hsCode}`);
        console.log(`   Description: ${topResult.description}`);
        console.log(`   Confidence: ${topResult.confidence}%`);
        console.log(`   Method: ${data.approach || data.method || 'unknown'}`);
        console.log(`   Processing Time: ${data.processingTime}ms`);
        
        // Check if we're getting real tariff rates
        if (topResult.mfnRate && topResult.mfnRate > 0) {
          console.log(`   MFN Rate: ${topResult.mfnRate}%`);
          console.log(`   USMCA Rate: ${topResult.usmcaRate}%`);
        }
      } else {
        console.log(`❌ No results for ${product.name}`);
        if (data.error) {
          console.log(`   Error: ${data.error}`);
        }
      }
    }
    
    // Analyze differences
    console.log('\n\n🔄 ANALYSIS: Are results different?');
    console.log('=====================================');
    
    const productNames = Object.keys(results);
    let allDifferent = true;
    
    for (let i = 0; i < productNames.length; i++) {
      for (let j = i + 1; j < productNames.length; j++) {
        const product1 = productNames[i];
        const product2 = productNames[j];
        
        const result1 = results[product1];
        const result2 = results[product2];
        
        if (result1.success && result2.success && 
            result1.results?.length > 0 && result2.results?.length > 0) {
          
          const hsCode1 = result1.results[0].hsCode;
          const hsCode2 = result2.results[0].hsCode;
          const confidence1 = result1.results[0].confidence;
          const confidence2 = result2.results[0].confidence;
          
          console.log(`\n${product1} vs ${product2}:`);
          console.log(`   HS Codes: ${hsCode1} vs ${hsCode2}`);
          console.log(`   Confidence: ${confidence1}% vs ${confidence2}%`);
          
          if (hsCode1 === hsCode2 && Math.abs(confidence1 - confidence2) < 5) {
            console.log(`   ❌ PROBLEM: Results are too similar!`);
            allDifferent = false;
          } else {
            console.log(`   ✅ GOOD: Results are different`);
          }
        }
      }
    }
    
    console.log('\n\n📊 OVERALL ASSESSMENT');
    console.log('====================');
    
    if (allDifferent) {
      console.log('✅ SUCCESS: AI Classification is producing different results for different products');
      console.log('✅ Hardcoding removal appears successful');
    } else {
      console.log('❌ WARNING: System may still have hardcoded patterns');
      console.log('❌ Need to investigate further');
    }
    
    // Check for AI analysis quality
    const hasAIAnalysis = Object.values(results).some(result => 
      result.aiAnalysis || result.approach === 'ai_semantic' || result.method === 'pure_ai_semantic'
    );
    
    if (hasAIAnalysis) {
      console.log('✅ AI Semantic Analysis: Active');
    } else {
      console.log('⚠️  AI Semantic Analysis: May not be fully active');
    }
    
    // Check confidence scores
    const confidenceScores = Object.values(results)
      .filter(r => r.success && r.results?.length > 0)
      .map(r => r.results[0].confidence);
      
    if (confidenceScores.length > 0) {
      const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
      console.log(`📈 Average Confidence: ${avgConfidence.toFixed(1)}%`);
      
      if (avgConfidence > 75) {
        console.log('✅ High confidence scores achieved');
      } else {
        console.log('⚠️  Confidence scores could be improved');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAIClassification();