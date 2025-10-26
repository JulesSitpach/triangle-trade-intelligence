// Quick API test
const testPayload = {
  company_name: 'TestCorp',
  company_country: 'US',
  destination_country: 'US',
  supplier_country: 'CN',
  manufacturing_location: 'MX',
  industry_sector: 'Electronics',
  trade_volume: 5000000,
  component_origins: [
    { description: 'Microchip', hs_code: '8542.31.00', origin_country: 'CN', value_percentage: 50 },
    { description: 'Housing', hs_code: '3916.90.50', origin_country: 'MX', value_percentage: 50 }
  ]
};

const startTime = Date.now();
console.log('🚀 Testing API at http://localhost:3000/api/ai-usmca-complete-analysis');
console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

fetch('http://localhost:3000/api/ai-usmca-complete-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testPayload)
})
  .then(r => {
    const elapsed = Date.now() - startTime;
    console.log(`⏱️  Response in ${elapsed}ms - Status: ${r.status}`);
    return r.json();
  })
  .then(data => {
    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Total time: ${elapsed}ms`);

    if (data.error) {
      console.log('❌ Error:', data.error);
      console.log('📋 Details:', data.message || data);
    } else {
      console.log('✅ Success!');
      console.log('Qualified:', data.result?.usmca?.qualified);
      console.log('RVC:', data.result?.usmca?.north_american_content + '%');
      console.log('Threshold:', data.result?.usmca?.threshold_applied + '%');
      if (data.result?.detailed_analysis?.qualification_reasoning) {
        console.log('Summary:', data.result.detailed_analysis.qualification_reasoning.substring(0, 150) + '...');
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Request failed:', err.message);
    process.exit(1);
  });

setTimeout(() => {
  console.log('❌ Timeout - no response after 180 seconds');
  process.exit(1);
}, 180000);
