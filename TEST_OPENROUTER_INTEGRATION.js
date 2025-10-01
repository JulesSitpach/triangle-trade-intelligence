/**
 * OpenRouter Integration Test
 * Run this to verify if OpenRouter is actually being called
 */

const testOpenRouterIntegration = async () => {
  console.log('🔍 Testing OpenRouter Integration...\n');

  const apiKey = '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';

  console.log('1️⃣ Testing direct OpenRouter API call...');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Triangle Intelligence Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{
          role: 'user',
          content: 'You are a Mexico supplier expert. Company ABC manufactures electronics. Recommend 3 Mexico suppliers with actual company names.'
        }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API call failed:', response.status, errorText);
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('✅ OpenRouter API Response:');
    console.log(aiResponse);
    console.log('\n📊 Token Usage:', data.usage);

    // Check if response is generic/placeholder
    if (aiResponse.includes('Supplier 1') || aiResponse.includes('Company A') || aiResponse.includes('generic')) {
      console.warn('⚠️  WARNING: Response appears generic - not specific company names');
    } else {
      console.log('✅ Response contains specific information');
    }

  } catch (error) {
    console.error('❌ Error testing OpenRouter:', error.message);
  }

  console.log('\n2️⃣ Testing supplier-sourcing-discovery.js API...');

  try {
    const testPayload = {
      request_id: 'test-123',
      subscriber_data: {
        company_name: 'ABC Electronics',
        product_description: 'electronic components',
        trade_volume: 2000000,
        manufacturing_location: 'China',
        qualification_status: 'NOT_QUALIFIED',
        component_origins: [
          { country: 'China', percentage: 80, description: 'Circuit boards' },
          { country: 'Taiwan', percentage: 20, description: 'Semiconductors' }
        ]
      },
      sourcing_requirements: {
        monthly_volume: '10,000 units',
        certifications: ['iso_9001'],
        payment_terms: 'Net 30',
        timeline: 'immediate'
      }
    };

    console.log('Calling /api/supplier-sourcing-discovery...');

    const apiResponse = await fetch('http://localhost:3000/api/supplier-sourcing-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ API call failed:', apiResponse.status, errorText);
      return;
    }

    const apiData = await apiResponse.json();

    console.log('✅ API Response received');
    console.log('Suppliers found:', apiData.suppliers?.length || 0);
    console.log('AI Analysis present:', !!apiData.ai_analysis);

    if (apiData.ai_analysis) {
      console.log('AI Analysis keys:', Object.keys(apiData.ai_analysis));
    } else {
      console.warn('⚠️  WARNING: No AI analysis in response - OpenRouter call may have failed silently');
    }

    if (apiData.suppliers?.length > 0) {
      console.log('\nFirst supplier:', apiData.suppliers[0]);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
};

// Run if executed directly
if (require.main === module) {
  testOpenRouterIntegration()
    .then(() => {
      console.log('\n✅ Integration test complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Integration test failed:', error);
      process.exit(1);
    });
}

module.exports = { testOpenRouterIntegration };
