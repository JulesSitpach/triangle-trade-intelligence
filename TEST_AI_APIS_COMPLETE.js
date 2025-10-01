/**
 * Test AI APIs with COMPLETE business intelligence data
 * This test sends the same rich data that real dashboard workflows provide
 */

const COMPLETE_TEST_DATA = {
  original_request: {
    id: 'test-123',
    company_name: 'ABC Electronics Inc.',
    contact_name: 'John Smith',
    email: 'john@abcelectronics.com',
    phone: '+1-555-0100',
    industry: 'Electronics Manufacturing',
    trade_volume: 2000000,
    subscriber_data: {
      company_name: 'ABC Electronics Inc.',
      business_type: 'Manufacturer',
      product_description: 'Printed circuit boards (PCBs) for consumer electronics',
      product_category: 'Electronics Components',
      manufacturing_location: 'Shenzhen, China',
      trade_volume: 2000000,
      qualification_status: 'NOT_QUALIFIED',
      component_origins: [
        { country: 'China', percentage: 80, description: 'PCB manufacturing', component_type: 'Circuit boards' },
        { country: 'Taiwan', percentage: 15, description: 'Semiconductors', component_type: 'Chips' },
        { country: 'Japan', percentage: 5, description: 'Capacitors', component_type: 'Passive components' }
      ],
      annual_tariff_cost: 50000,
      potential_usmca_savings: 35000,
      compliance_gaps: [
        'No regional value content tracking',
        'Missing certificate of origin documentation'
      ],
      vulnerability_factors: [
        'High supplier concentration in China (80%)',
        'Single manufacturing location risk'
      ],
      regulatory_requirements: [
        'HTS code 8534.00.00 compliance',
        'FCC certification required'
      ]
    },
    service_details: {
      company_name: 'ABC Electronics Inc.',
      business_type: 'Manufacturer',
      industry: 'Electronics Manufacturing',
      contact_email: 'john@abcelectronics.com',
      product_description: 'Printed circuit boards (PCBs)',
      product_category: 'Electronics Components',
      manufacturing_location: 'Shenzhen, China',
      supplier_country: 'China',
      target_markets: ['United States', 'Canada'],
      trade_volume: 2000000,
      qualification_status: 'NOT_QUALIFIED',
      component_origins: [
        { country: 'China', percentage: 80, description: 'PCB manufacturing' }
      ],
      annual_tariff_cost: 50000,
      potential_usmca_savings: 35000
    }
  }
};

const testAllAPIs = async () => {
  console.log('🧪 TESTING ALL AI APIS WITH COMPLETE DATA\n');
  console.log('='.repeat(80));

  const results = { working: [], failing: [] };

  // Test 1: Crisis Response Analysis
  console.log('\n1️⃣ Crisis Response Analysis API...');
  try {
    const response = await fetch('http://localhost:3000/api/crisis-response-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_request: COMPLETE_TEST_DATA.original_request,
        crisis_assessment: {
          crisis_type: 'Sudden 25% tariff increase',
          timeline: 'Effective in 30 days',
          current_impact: '$500k cost increase, margins eliminated',
          immediate_concerns: 'Need alternatives by end of month'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ai_analysis && data.ai_analysis.crisis_severity !== 'UNABLE TO ASSESS') {
        console.log(`   ✅ WORKING - ${data.ai_analysis.crisis_severity} severity`);
        results.working.push('Crisis Response Analysis');
      } else {
        console.log('   ❌ FAILING - Returns generic "UNABLE TO ASSESS"');
        results.failing.push('Crisis Response Analysis - generic response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      const error = await response.text();
      console.log(`   Error: ${error.substring(0, 200)}`);
      results.failing.push(`Crisis Response Analysis (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`Crisis Response Analysis (${error.message})`);
  }

  // Test 2: Manufacturing Feasibility Analysis
  console.log('\n2️⃣ Manufacturing Feasibility Analysis API...');
  try {
    const response = await fetch('http://localhost:3000/api/manufacturing-feasibility-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_request: COMPLETE_TEST_DATA.original_request,
        manufacturing_context: {
          product_to_manufacture: 'Printed circuit boards (PCBs)',
          monthly_volume: '10000 units',
          timeline: '3-6 months to start production',
          quality_requirements: 'ISO 9001 certified, IPC Class 2 standards',
          target_locations: 'Mexico (preferably near border)',
          current_challenges: 'High costs in China, need USMCA compliance'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   Response keys:', Object.keys(data));
      console.log('   Feasibility analysis:', JSON.stringify(data.feasibility_analysis || data).substring(0, 200));

      if (data.ai_analysis && !JSON.stringify(data.ai_analysis).includes('UNABLE TO ASSESS')) {
        console.log(`   ✅ WORKING - Feasibility score: ${data.ai_analysis.feasibility_score || 'N/A'}/10`);
        results.working.push('Manufacturing Feasibility Analysis');
      } else {
        console.log('   ❌ FAILING - Returns generic response');
        results.failing.push('Manufacturing Feasibility - generic response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 300)}`);
      results.failing.push(`Manufacturing Feasibility (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`Manufacturing Feasibility (${error.message})`);
  }

  // Test 3: Market Entry Analysis
  console.log('\n3️⃣ Market Entry Analysis API...');
  try {
    const response = await fetch('http://localhost:3000/api/market-entry-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_request: COMPLETE_TEST_DATA.original_request,
        market_strategy: {
          target_market: 'Mexico',
          products_for_market: 'Printed circuit boards for Mexican electronics manufacturers',
          current_market_presence: 'None - no Mexico customers yet',
          entry_timeline: 'Short-term (3-6 months)',
          budget_range: '$50,000 - $100,000',
          priority_level: 'High',
          key_challenges: 'No relationships, language barrier, unknown regulations'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   Response keys:', Object.keys(data));
      console.log('   Market analysis:', JSON.stringify(data.market_analysis || data).substring(0, 200));

      if (data.ai_analysis && !JSON.stringify(data.ai_analysis).includes('UNABLE TO ASSESS')) {
        console.log('   ✅ WORKING - Returns market analysis');
        results.working.push('Market Entry Analysis');
      } else {
        console.log('   ❌ FAILING - Returns generic response');
        results.failing.push('Market Entry - generic response');
      }
    } else {
      console.log(`   ❌ FAILING - Status ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 300)}`);
      results.failing.push(`Market Entry (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ FAILING - ${error.message}`);
    results.failing.push(`Market Entry (${error.message})`);
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS\n');

  console.log(`✅ WORKING (${results.working.length}):`);
  if (results.working.length === 0) {
    console.log('   None');
  } else {
    results.working.forEach(api => console.log(`   ✓ ${api}`));
  }

  console.log(`\n❌ FAILING (${results.failing.length}):`);
  if (results.failing.length === 0) {
    console.log('   None - All APIs working!');
  } else {
    results.failing.forEach(api => console.log(`   ✗ ${api}`));
  }

  console.log('\n' + '='.repeat(80));

  const totalTested = results.working.length + results.failing.length;
  const successRate = totalTested > 0 ? (results.working.length / totalTested * 100).toFixed(1) : 0;
  console.log(`\n📈 Success Rate: ${successRate}% (${results.working.length}/${totalTested})`);

  if (results.failing.length > 0) {
    console.log('\n❌ ACTION REQUIRED: Fix failing APIs');
    process.exit(1);
  } else {
    console.log('\n✅ All tested APIs working with complete data!');
    process.exit(0);
  }
};

testAllAPIs().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
