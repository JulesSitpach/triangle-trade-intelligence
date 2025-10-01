/**
 * Test a single API to see exact OpenRouter response
 */

const testSingleAPI = async () => {
  console.log('🧪 Testing Crisis Response Analysis API\n');

  // COMPLETE subscriber data matching real workflow structure
  const testData = {
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
          { country: 'China', percentage: 80, description: 'PCB manufacturing and assembly', component_type: 'Circuit boards' },
          { country: 'Taiwan', percentage: 15, description: 'Semiconductors and ICs', component_type: 'Chips' },
          { country: 'Japan', percentage: 5, description: 'Capacitors and resistors', component_type: 'Passive components' }
        ],
        annual_tariff_cost: 50000,
        potential_usmca_savings: 35000,
        compliance_gaps: [
          'No regional value content tracking',
          'Missing certificate of origin documentation',
          'Supplier declarations not obtained'
        ],
        vulnerability_factors: [
          'High supplier concentration in China (80%)',
          'Single manufacturing location risk',
          'No alternative sourcing strategy'
        ],
        regulatory_requirements: [
          'HTS code 8534.00.00 compliance',
          'FCC certification required',
          'RoHS compliance mandatory'
        ]
      },
      service_details: {
        company_name: 'ABC Electronics Inc.',
        business_type: 'Manufacturer',
        industry: 'Electronics Manufacturing',
        contact_email: 'john@abcelectronics.com',
        contact_phone: '+1-555-0100',
        product_description: 'Printed circuit boards (PCBs) for consumer electronics',
        product_category: 'Electronics Components',
        manufacturing_location: 'Shenzhen, China',
        supplier_country: 'China',
        target_markets: ['United States', 'Canada', 'Mexico'],
        import_frequency: 'Weekly',
        trade_volume: 2000000,
        qualification_status: 'NOT_QUALIFIED',
        component_origins: [
          { country: 'China', percentage: 80, description: 'PCB manufacturing and assembly', component_type: 'Circuit boards' },
          { country: 'Taiwan', percentage: 15, description: 'Semiconductors and ICs', component_type: 'Chips' },
          { country: 'Japan', percentage: 5, description: 'Capacitors and resistors', component_type: 'Passive components' }
        ],
        annual_tariff_cost: 50000,
        potential_usmca_savings: 35000,
        compliance_gaps: [
          'No regional value content tracking',
          'Missing certificate of origin documentation',
          'Supplier declarations not obtained'
        ],
        vulnerability_factors: [
          'High supplier concentration in China (80%)',
          'Single manufacturing location risk',
          'No alternative sourcing strategy'
        ],
        regulatory_requirements: [
          'HTS code 8534.00.00 compliance',
          'FCC certification required',
          'RoHS compliance mandatory'
        ]
      }
    },
    crisis_assessment: {
      crisis_type: 'Sudden 25% tariff increase on Chinese electronics',
      timeline: 'Announced yesterday, effective in 30 days',
      current_impact: '$500k annual cost increase, margins eliminated, customer contracts at risk',
      immediate_concerns: 'Need alternative sourcing by end of month or face 50% cost increase. Current inventory only covers 2 weeks.'
    }
  };

  try {
    console.log('Calling /api/crisis-response-analysis...\n');

    const response = await fetch('http://localhost:3000/api/crisis-response-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);

    const text = await response.text();
    console.log('\nRaw Response Length:', text.length);
    console.log('\nFirst 500 chars of response:');
    console.log(text.substring(0, 500));

    try {
      const data = JSON.parse(text);
      console.log('\n📊 Parsed JSON Response:');
      console.log(JSON.stringify(data, null, 2));

      if (data.ai_analysis) {
        console.log('\n✅ Has ai_analysis field');
        console.log('Keys:', Object.keys(data.ai_analysis));
        console.log('\n🔍 AI Analysis Content:');
        console.log('Crisis Severity:', data.ai_analysis.crisis_severity);
        console.log('Immediate Impact:', data.ai_analysis.immediate_impact);
        console.log('Risk Factors:', data.ai_analysis.risk_factors);
        console.log('\n📋 Action Plan:');
        console.log(JSON.stringify(data.ai_analysis.action_plan, null, 2));
      } else {
        console.log('\n❌ Missing ai_analysis field');
      }
    } catch (e) {
      console.log('\n❌ Response is not valid JSON');
    }

  } catch (error) {
    console.error('\n💥 Request failed:', error.message);
  }
};

testSingleAPI()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test crashed:', err);
    process.exit(1);
  });
