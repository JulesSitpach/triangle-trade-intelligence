// Test supplier matching with real client
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

(async () => {
  console.log('🔍 PROOF: Testing supplier matching with real client');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get a real supplier sourcing client
  const { data: clients, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('service_type', 'Supplier Sourcing')
    .limit(1);

  if (error || !clients || clients.length === 0) {
    console.log('❌ No real supplier sourcing clients found');
    return;
  }

  const realClient = clients[0];
  console.log('✅ Found real client:', realClient.company_name);
  console.log('Client ID:', realClient.id);
  console.log('Product needs:', realClient.service_details?.goals || realClient.service_details?.product_description);

  // Test supplier discovery API with real client data
  try {
    const response = await fetch('http://localhost:3001/api/supplier-sourcing-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: realClient.id,
        service_details: realClient.service_details,
        sourcing_requirements: {
          monthly_volume: '25000',
          certifications: ['iso_9001'],
          timeline: 'immediate'
        }
      })
    });

    if (!response.ok) {
      console.log('❌ SUPPLIER MATCHING FAILED:', response.status, response.statusText);
      return;
    }

    const result = await response.json();
    console.log('✅ SUPPLIER MATCHING SUCCESS');
    console.log('Suppliers found for', realClient.company_name + ':', result.suppliers ? result.suppliers.length : 0);

    if (result.suppliers && result.suppliers.length > 0) {
      console.log('Sample matches:');
      result.suppliers.slice(0, 2).forEach((supplier, index) => {
        console.log(`[${index + 1}] ${supplier.name} | ${supplier.location} | Confidence: ${supplier.confidence || 'N/A'}`);
      });
    }

  } catch (error) {
    console.log('❌ SUPPLIER MATCHING TEST FAILED:', error.message);
  }
})();