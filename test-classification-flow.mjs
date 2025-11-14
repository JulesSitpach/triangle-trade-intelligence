import { ClassificationAgent } from './lib/agents/classification-agent.js';

(async () => {
  console.log('🧪 Testing classification flow with both tools...\n');

  const agent = new ClassificationAgent();

  const result = await agent.suggestHSCode(
    'Titanium bolts M10x1.5, cadmium plated, Grade 5',
    [{
      description: 'Titanium bolts',
      origin_country: 'US',
      value_percentage: 100
    }],
    {
      overallProduct: 'Aircraft assembly',
      industryContext: 'Aerospace',
      destinationCountry: 'US',
      substantialTransformation: false
    }
  );

  console.log('\n========== CLASSIFICATION RESULT ==========');
  console.log(JSON.stringify(result, null, 2));
  console.log('===========================================\n');

  if (result.success) {
    console.log('✅ Classification successful');
    console.log(`   HS Code: ${result.data.hs_code}`);
    console.log(`   Confidence: ${result.data.confidence}%`);
    console.log(`   Explanation: ${result.data.explanation?.substring(0, 100)}...`);
  } else {
    console.log('❌ Classification failed');
  }
})();
