/**
 * Comprehensive USMCA qualification testing
 * Test all business types and threshold scenarios from Phase 3 audit
 */

require('dotenv').config({ path: '.env.local' });

async function testQualificationScenario(testName, testData, expectedQualified) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${testName}`);
  console.log(`Expected: qualified = ${expectedQualified}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/simple-usmca-compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const result = await response.json();
    const actualQualified = result.qualification?.qualified;
    const actualContent = result.qualification?.regional_content_actual;
    const threshold = result.qualification?.regional_content_threshold;
    
    console.log(`📊 Result: qualified = ${actualQualified}`);
    console.log(`📊 Regional Content: ${actualContent}% (threshold: ${threshold}%)`);
    console.log(`📊 Reason: ${result.qualification?.reason}`);
    
    if (actualQualified === expectedQualified) {
      console.log('✅ PASS - Qualification logic correct');
    } else {
      console.log('❌ FAIL - Qualification logic incorrect');
    }

    return { passed: actualQualified === expectedQualified, result };
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function runAllQualificationTests() {
  console.log('🚀 COMPREHENSIVE USMCA QUALIFICATION TESTING');
  console.log('Testing all business types and threshold scenarios from Phase 3 audit\n');

  const testResults = [];

  // Electronics Tests (65% threshold)
  testResults.push(await testQualificationScenario(
    'Electronics - 40% USMCA Content (Below Threshold)',
    {
      action: 'check_qualification',
      data: {
        hs_code: '8517130000',
        business_type: 'Electronics',
        component_origins: [
          { description: 'semiconductors', origin_country: 'Mexico', value_percentage: 40 },
          { description: 'assembly components', origin_country: 'China', value_percentage: 60 }
        ],
        manufacturing_location: 'Mexico'
      }
    },
    false // Should NOT qualify - 40% + 15% manufacturing = 55% < 65%
  ));

  testResults.push(await testQualificationScenario(
    'Electronics - 65% USMCA Content (Exact Threshold)',
    {
      action: 'check_qualification',
      data: {
        hs_code: '8517130000',
        business_type: 'Electronics',
        component_origins: [
          { description: 'semiconductors', origin_country: 'Mexico', value_percentage: 50 },
          { description: 'assembly components', origin_country: 'China', value_percentage: 35 }
        ],
        manufacturing_location: 'Mexico' // 85% components + 15% manufacturing = 100%, so 50/85 = 58.8% + manufacturing boost
      }
    },
    true // Should qualify - meets 65% threshold with manufacturing
  ));

  testResults.push(await testQualificationScenario(
    'Electronics - 70% USMCA Content (Above Threshold)',
    {
      action: 'check_qualification',
      data: {
        hs_code: '8517130000',
        business_type: 'Electronics',
        component_origins: [
          { description: 'semiconductors', origin_country: 'Canada', value_percentage: 70 },
          { description: 'assembly components', origin_country: 'China', value_percentage: 30 }
        ],
        manufacturing_location: 'US'
      }
    },
    true // Should qualify - 70% > 65%
  ));

  // Automotive Tests (75% threshold)
  testResults.push(await testQualificationScenario(
    'Automotive - 0% USMCA Content (China 100%)',
    {
      action: 'check_qualification',
      data: {
        hs_code: '8708100000', // Automotive parts
        business_type: 'Automotive',
        component_origins: [
          { description: 'automotive brake pads', origin_country: 'China', value_percentage: 100 }
        ],
        manufacturing_location: 'China'
      }
    },
    false // Should NOT qualify - 0% < 75%
  ));

  testResults.push(await testQualificationScenario(
    'Automotive - 77% USMCA Content (Above Threshold)',
    {
      action: 'check_qualification',
      data: {
        hs_code: '8708100000',
        business_type: 'Automotive',
        component_origins: [
          { description: 'engine components', origin_country: 'US', value_percentage: 60 },
          { description: 'brake systems', origin_country: 'Mexico', value_percentage: 20 },
          { description: 'electronics', origin_country: 'China', value_percentage: 20 }
        ],
        manufacturing_location: 'Mexico' // 80% + 15% = 95%, but caps at threshold check
      }
    },
    true // Should qualify - 80% > 75%
  ));

  // Edge case: No components provided
  testResults.push(await testQualificationScenario(
    'No Component Data Provided',
    {
      action: 'check_qualification',
      data: {
        hs_code: '8517130000',
        business_type: 'Electronics',
        component_origins: [],
        manufacturing_location: 'Mexico'
      }
    },
    false // Should NOT qualify - no component data
  ));

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${(passedTests/totalTests*100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! USMCA qualification logic is working correctly across all scenarios.');
    console.log('✅ Platform ready for Phase 4 customer experience validation.');
  } else {
    console.log(`\n⚠️ ${failedTests} tests failed. Review qualification logic.`);
  }

  return { totalTests, passedTests, failedTests };
}

runAllQualificationTests().catch(console.error);