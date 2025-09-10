/**
 * Test Script: China → Mexico Transition
 * Verifies the critical UX fix works correctly
 */

// Test scenario 1: China-dominant components (should NOT qualify)
const chinaScenario = {
  component: {
    description: "modular circuits",
    origin_country: "CN", 
    value_percentage: 80
  },
  allComponents: [
    {description: "modular circuits", origin_country: "CN", value_percentage: 80},
    {description: "plastic housing", origin_country: "MX", value_percentage: 20}
  ],
  businessContext: {
    type: "Electronics",
    manufacturing_location: "MX",
    trade_volume: "$1M - $5M"
  }
};

// Test scenario 2: Mexico-dominant components (should QUALIFY)
const mexicoScenario = {
  component: {
    description: "modular circuits",
    origin_country: "MX", 
    value_percentage: 80
  },
  allComponents: [
    {description: "modular circuits", origin_country: "MX", value_percentage: 80},
    {description: "plastic housing", origin_country: "CN", value_percentage: 20}
  ],
  businessContext: {
    type: "Electronics",
    manufacturing_location: "MX",
    trade_volume: "$1M - $5M"
  }
};

async function testScenario(scenario, scenarioName) {
  console.log(`\n🧪 Testing ${scenarioName}...`);
  console.log(`Components: ${scenario.allComponents.map(c => `${c.origin_country} (${c.value_percentage}%)`).join(', ')}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/integrated-usmca-classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario)
    });

    if (!response.ok) {
      console.error(`❌ ${scenarioName} failed:`, response.status, await response.text());
      return;
    }

    const result = await response.json();
    
    console.log(`📊 Results for ${scenarioName}:`);
    console.log(`   HS Code: ${result.component?.hs_code}`);
    console.log(`   Qualified: ${result.qualification?.qualified ? '✅ YES' : '❌ NO'}`);
    console.log(`   North American Content: ${result.qualification?.north_american_content?.toFixed(1)}%`);
    console.log(`   Threshold Required: ${result.qualification?.threshold_required}%`);
    console.log(`   MFN Rate: ${result.tariff_impact?.mfn_rate}%`);
    console.log(`   USMCA Rate: ${result.tariff_impact?.usmca_rate}%`);
    console.log(`   Annual Savings: $${result.tariff_impact?.annual_savings?.toLocaleString()}`);
    console.log(`   Qualification Reason: ${result.qualification?.reason}`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ ${scenarioName} error:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting China → Mexico Transition Test');
  console.log('This test verifies the critical UX fix: country changes should affect USMCA qualification');
  
  const chinaResult = await testScenario(chinaScenario, 'China-Dominant Scenario');
  const mexicoResult = await testScenario(mexicoScenario, 'Mexico-Dominant Scenario');
  
  console.log('\n🎯 CRITICAL TEST RESULT:');
  
  if (chinaResult && mexicoResult) {
    const chinaQualified = chinaResult.qualification?.qualified;
    const mexicoQualified = mexicoResult.qualification?.qualified;
    const chinaSavings = chinaResult.tariff_impact?.annual_savings || 0;
    const mexicoSavings = mexicoResult.tariff_impact?.annual_savings || 0;
    
    if (!chinaQualified && mexicoQualified && mexicoSavings > chinaSavings) {
      console.log('✅ SUCCESS: China → Mexico transition shows different results!');
      console.log(`   China scenario: NOT qualified, $${chinaSavings.toLocaleString()} savings`);
      console.log(`   Mexico scenario: QUALIFIED, $${mexicoSavings.toLocaleString()} savings`);
      console.log('✅ The critical UX flaw has been FIXED!');
    } else {
      console.log('❌ FAILURE: China → Mexico transition shows same results');
      console.log('❌ The UX issue is NOT fixed - country changes don\'t affect qualification');
    }
  } else {
    console.log('❌ FAILURE: Could not complete both test scenarios');
  }
}

// Run the tests
runTests().catch(console.error);