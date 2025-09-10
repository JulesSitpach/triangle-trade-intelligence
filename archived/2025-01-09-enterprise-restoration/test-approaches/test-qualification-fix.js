/**
 * Test the USMCA qualification bug fix
 * Recreate exact test cases from Phase 3 audit report
 */

require('dotenv').config({ path: '.env.local' });

async function testQualificationFix() {
  console.log('🧪 Testing USMCA Qualification Logic Fix\n');

  try {
    // Test the fixed API endpoint with exact test case from audit report
    const testCase = {
      action: 'check_qualification',
      data: {
        hs_code: '8517130000',
        business_type: 'Electronics',
        component_origins: [
          {
            description: 'smartphone components',
            origin_country: 'China',
            value_percentage: 100
          }
        ],
        manufacturing_location: 'China'
      }
    };

    console.log('📋 Test Case: 100% Chinese content (should be NOT qualified)');
    console.log('Input:', JSON.stringify(testCase, null, 2));

    const response = await fetch('http://localhost:3000/api/simple-usmca-compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n📊 FIXED RESPONSE:');
    console.log('Qualified:', result.qualification?.qualified);
    console.log('Reason:', result.qualification?.reason);
    console.log('Regional Content:', result.qualification?.regional_content_actual + '%');
    console.log('Threshold Required:', result.qualification?.regional_content_threshold + '%');
    console.log('Gap Analysis:', result.qualification?.gap_analysis);
    
    if (result.qualification?.remediation_strategies) {
      console.log('\n🔧 REMEDIATION STRATEGIES:');
      result.qualification.remediation_strategies.forEach((strategy, i) => {
        console.log(`${i + 1}. ${strategy}`);
      });
    }
    
    if (result.qualification?.mexico_opportunities) {
      console.log('\n🇲🇽 MEXICO OPPORTUNITIES:');
      result.qualification.mexico_opportunities.forEach((opp, i) => {
        console.log(`${i + 1}. ${opp.strategy}: ${opp.description}`);
        console.log(`   Impact: ${opp.estimated_impact}, Timeframe: ${opp.timeframe}`);
      });
    }

    // Validation
    const expectedResult = false; // Should NOT be qualified with 0% USMCA content
    const actualResult = result.qualification?.qualified;
    
    console.log('\n✅ VALIDATION:');
    console.log(`Expected: qualified = ${expectedResult}`);
    console.log(`Actual: qualified = ${actualResult}`);
    
    if (actualResult === expectedResult) {
      console.log('🎉 BUG FIX SUCCESSFUL! Qualification logic now works correctly.');
    } else {
      console.log('❌ BUG STILL EXISTS! Qualification logic still broken.');
    }

    // Test a qualifying scenario
    console.log('\n🧪 Testing QUALIFYING scenario (75% Mexico content)...');
    
    const qualifyingTest = {
      action: 'check_qualification',
      data: {
        hs_code: '8517130000',
        business_type: 'Electronics',
        component_origins: [
          {
            description: 'smartphone components from Mexico',
            origin_country: 'Mexico',
            value_percentage: 75
          },
          {
            description: 'smartphone components from China',
            origin_country: 'China', 
            value_percentage: 25
          }
        ],
        manufacturing_location: 'Mexico'
      }
    };

    const qualifyingResponse = await fetch('http://localhost:3000/api/simple-usmca-compliance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qualifyingTest)
    });

    const qualifyingResult = await qualifyingResponse.json();
    
    console.log('Qualified:', qualifyingResult.qualification?.qualified);
    console.log('Regional Content:', qualifyingResult.qualification?.regional_content_actual + '%');
    console.log('Reason:', qualifyingResult.qualification?.reason);

  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testQualificationFix();