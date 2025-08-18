const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 Testing Dashboard Hub Intelligence API directly...\n');
  
  try {
    console.log('Making request to http://localhost:3001/api/dashboard-hub-intelligence');
    
    const response = await fetch('http://localhost:3001/api/dashboard-hub-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dashboardView: 'executive',
        mockUserProfile: {
          businessType: 'Electronics',
          primarySupplierCountry: 'China',
          importVolume: '$1M - $5M',
          companyName: 'Test Company',
          timelinePriority: 'COST'
        }
      })
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Success! Response data keys:', Object.keys(data));
    console.log('Intelligence data structure:', data.intelligence ? Object.keys(data.intelligence) : 'No intelligence data');
    
    if (data.intelligence) {
      console.log('Metrics:', data.intelligence.metrics);
      console.log('Beast Master Status keys:', Object.keys(data.intelligence.beastMasterStatus || {}));
      console.log('Compound insights count:', data.intelligence.compoundInsights?.length || 0);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testAPI();