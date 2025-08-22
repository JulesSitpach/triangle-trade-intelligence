/**
 * Test Supabase via REST API to verify credentials and connectivity
 */

async function testSupabaseREST() {
  console.log('🌐 TESTING SUPABASE VIA REST API');
  console.log('================================\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Environment Check:');
  console.log(`  URL: ${baseUrl || 'MISSING'}`);
  console.log(`  Key: ${serviceKey ? 'SET (' + serviceKey.length + ' chars)' : 'MISSING'}\n`);
  
  if (!baseUrl || !serviceKey) {
    console.error('❌ Missing environment variables');
    return false;
  }
  
  try {
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const testUrl = `${baseUrl}/rest/v1/`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
    
    console.log('✅ Basic connectivity successful\n');
    
    // Test 2: Check if comtrade_reference table exists
    console.log('2. Checking comtrade_reference table...');
    const tableUrl = `${baseUrl}/rest/v1/comtrade_reference?select=count&limit=1`;
    
    const tableResponse = await fetch(tableUrl, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${tableResponse.status} ${tableResponse.statusText}`);
    
    if (tableResponse.status === 404) {
      console.log('❌ Table does not exist or no access');
      return false;
    }
    
    if (!tableResponse.ok) {
      const errorText = await tableResponse.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
    
    const tableData = await tableResponse.json();
    console.log(`   Response: ${JSON.stringify(tableData)}`);
    console.log('✅ Table access successful\n');
    
    // Test 3: Try to insert a test record
    console.log('3. Testing insert capability...');
    const insertUrl = `${baseUrl}/rest/v1/comtrade_reference`;
    const testRecord = {
      hs_code: 'TEST123',
      product_description: 'REST API Test Product',
      product_category: 'Test'
    };
    
    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testRecord)
    });
    
    console.log(`   Insert Status: ${insertResponse.status} ${insertResponse.statusText}`);
    
    if (insertResponse.ok) {
      console.log('✅ Insert successful');
      
      // Clean up test record
      const deleteUrl = `${baseUrl}/rest/v1/comtrade_reference?hs_code=eq.TEST123`;
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      });
      console.log('✅ Test record cleaned up');
    } else {
      const insertError = await insertResponse.text();
      console.log(`   Insert Error: ${insertError}`);
    }
    
    console.log('\n🎉 REST API tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('💥 REST API test failed:', error.message);
    return false;
  }
}

// Run the test
testSupabaseREST().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test crashed:', error);
  process.exit(1);
});