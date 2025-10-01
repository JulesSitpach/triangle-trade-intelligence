/**
 * Test All AI API Calls
 * Tests every OpenRouter integration to identify which ones work
 */

const testAllAIAPIs = async () => {
  console.log('🧪 TESTING ALL AI API INTEGRATIONS\n');
  console.log('=' .repeat(80));

  const results = {
    working: [],
    failing: [],
    warnings: []
  };

  const apiKey = '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';

  // Test payload - minimal real data
  const testSubscriberData = {
    company_name: 'Test Electronics Inc',
    product_description: 'electronic circuit boards',
    trade_volume: 2000000,
    manufacturing_location: 'China',
    qualification_status: 'NOT_QUALIFIED',
    component_origins: [
      { country: 'China', percentage: 80, description: 'Circuit boards' },
      { country: 'Taiwan', percentage: 20, description: 'Semiconductors' }
    ],
    annual_tariff_cost: 50000,
    potential_usmca_savings: 35000
  };

  const testStage3Data = {
    certificate_validation: 'Test validation',
    compliance_risk_assessment: 'Test risk assessment',
    audit_defense_strategy: 'Test audit strategy'
  };

  // Test 1: USMCA Compliance Risk Analysis
  console.log('\n1️⃣ Testing USMCA Compliance Risk Analysis API...');
  try {
    const response = await fetch('http://localhost:3000/api/usmca-compliance-risk-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_data: testSubscriberData
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.risk_analysis && data.risk_analysis.risk_level) {
        console.log('   ✅ WORKING - Returns risk analysis');
        results.working.push('USMCA Compliance Risk Analysis');
      } else {
        console.log('   ⚠️  WARNING - Returns empty analysis');
        results.warnings.push('USMCA Compliance Risk Analysis - empty response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      results.failing.push(`USMCA Compliance Risk Analysis (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`USMCA Compliance Risk Analysis (${error.message})`);
  }

  // Test 2: HS Classification Validation
  console.log('\n2️⃣ Testing HS Classification Validation API...');
  try {
    const response = await fetch('http://localhost:3000/api/validate-hs-classification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_request_id: 'test-123',
        subscriber_data: testSubscriberData,
        hs_code: '8534.00.00'
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.validation_result) {
        console.log('   ✅ WORKING - Returns validation');
        results.working.push('HS Classification Validation');
      } else {
        console.log('   ⚠️  WARNING - Returns empty validation');
        results.warnings.push('HS Classification Validation - empty response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      results.failing.push(`HS Classification Validation (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`HS Classification Validation (${error.message})`);
  }

  // Test 3: Crisis Response Analysis
  console.log('\n3️⃣ Testing Crisis Response Analysis API...');
  try {
    const response = await fetch('http://localhost:3000/api/crisis-response-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceRequestId: 'test-123',
        crisis_type: 'supplier_disruption',
        subscriber_data: testSubscriberData
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.crisis_analysis) {
        console.log('   ✅ WORKING - Returns crisis analysis');
        results.working.push('Crisis Response Analysis');
      } else {
        console.log('   ⚠️  WARNING - Returns empty analysis');
        results.warnings.push('Crisis Response Analysis - empty response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      results.failing.push(`Crisis Response Analysis (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`Crisis Response Analysis (${error.message})`);
  }

  // Test 4: Manufacturing Feasibility Analysis
  console.log('\n4️⃣ Testing Manufacturing Feasibility Analysis API...');
  try {
    const response = await fetch('http://localhost:3000/api/manufacturing-feasibility-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceRequestId: 'test-123',
        subscriber_data: testSubscriberData,
        requirements: {
          monthly_volume: '10000',
          timeline: 'immediate'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.feasibility_analysis) {
        console.log('   ✅ WORKING - Returns feasibility analysis');
        results.working.push('Manufacturing Feasibility Analysis');
      } else {
        console.log('   ⚠️  WARNING - Returns empty analysis');
        results.warnings.push('Manufacturing Feasibility Analysis - empty response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      results.failing.push(`Manufacturing Feasibility Analysis (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`Manufacturing Feasibility Analysis (${error.message})`);
  }

  // Test 5: Market Entry Analysis
  console.log('\n5️⃣ Testing Market Entry Analysis API...');
  try {
    const response = await fetch('http://localhost:3000/api/market-entry-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceRequestId: 'test-123',
        subscriber_data: testSubscriberData,
        market_goals: {
          target_market: 'Mexico',
          timeline: 'Short-term'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.market_analysis) {
        console.log('   ✅ WORKING - Returns market analysis');
        results.working.push('Market Entry Analysis');
      } else {
        console.log('   ⚠️  WARNING - Returns empty analysis');
        results.warnings.push('Market Entry Analysis - empty response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      results.failing.push(`Market Entry Analysis (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`Market Entry Analysis (${error.message})`);
  }

  // Test 6: Direct OpenRouter Call (baseline)
  console.log('\n6️⃣ Testing Direct OpenRouter API (baseline)...');
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{
          role: 'user',
          content: 'Test: What is 2+2? Answer only with the number.'
        }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;
      if (answer && answer.includes('4')) {
        console.log('   ✅ WORKING - OpenRouter API key is valid');
        results.working.push('OpenRouter Direct API');
      } else {
        console.log('   ⚠️  WARNING - Unexpected response:', answer);
        results.warnings.push('OpenRouter Direct API - unexpected response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      results.failing.push(`OpenRouter Direct API (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`OpenRouter Direct API (${error.message})`);
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY\n');

  console.log(`✅ WORKING (${results.working.length}):`);
  if (results.working.length === 0) {
    console.log('   None - ALL APIs FAILING!');
  } else {
    results.working.forEach(api => console.log(`   ✓ ${api}`));
  }

  console.log(`\n❌ FAILING (${results.failing.length}):`);
  if (results.failing.length === 0) {
    console.log('   None - All APIs working!');
  } else {
    results.failing.forEach(api => console.log(`   ✗ ${api}`));
  }

  console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
  if (results.warnings.length === 0) {
    console.log('   None');
  } else {
    results.warnings.forEach(warning => console.log(`   ! ${warning}`));
  }

  console.log('\n' + '='.repeat(80));

  return results;
};

// Run if executed directly
if (require.main === module) {
  testAllAIAPIs()
    .then(results => {
      const totalTested = results.working.length + results.failing.length;
      const successRate = (results.working.length / totalTested * 100).toFixed(1);

      console.log(`\n📈 Success Rate: ${successRate}% (${results.working.length}/${totalTested})`);

      if (results.failing.length > 0) {
        console.log('\n🚨 ACTION REQUIRED: Fix failing APIs before launch');
        process.exit(1);
      } else if (results.warnings.length > 0) {
        console.log('\n⚠️  Review warnings before launch');
        process.exit(0);
      } else {
        console.log('\n✅ All AI APIs working - Ready for launch');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { testAllAIAPIs };
