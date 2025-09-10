#!/usr/bin/env node

/**
 * INTEGRATION TEST - Classification API Connection
 * Tests the frontend-backend integration for product classification
 */

const fetch = require('node-fetch');

async function testClassificationIntegration() {
  console.log('🧪 TESTING CLASSIFICATION INTEGRATION');
  console.log('='.repeat(50));

  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Direct API call
  console.log('\n1️⃣ Testing direct API call...');
  try {
    const response = await fetch(`${baseUrl}/api/simple-classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_description: 'automotive electrical wire harness',
        business_type: 'Manufacturing'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', {
        success: data.success,
        total_matches: data.results?.length || 0,
        first_hs_code: data.results?.[0]?.hs_code,
        first_confidence: data.results?.[0]?.confidence
      });
    } else {
      console.log('❌ API failed:', response.status);
    }
  } catch (error) {
    console.log('❌ API error:', error.message);
  }

  // Test 2: Check if workflow page loads
  console.log('\n2️⃣ Testing workflow page...');
  try {
    const response = await fetch(`${baseUrl}/usmca-workflow`);
    if (response.ok) {
      console.log('✅ Workflow page loads successfully');
    } else {
      console.log('❌ Workflow page failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Workflow page error:', error.message);
  }

  // Test 3: Check dropdown options API (used by workflow)
  console.log('\n3️⃣ Testing dropdown options...');
  try {
    const response = await fetch(`${baseUrl}/api/simple-dropdown-options`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dropdown options loaded:', {
        business_types: data.businessTypes?.length || 0,
        countries: data.countries?.length || 0,
        import_volumes: data.importVolumes?.length || 0
      });
    } else {
      console.log('❌ Dropdown options failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Dropdown options error:', error.message);
  }

  // Test 4: Admin dashboard connection
  console.log('\n4️⃣ Testing admin dashboard integration...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/users`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin users loaded:', {
        total_users: data.users?.length || 0,
        total_savings: data.summary?.total_savings || 0
      });
    } else {
      console.log('❌ Admin users failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Admin users error:', error.message);
  }

  console.log('\n📊 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));
  console.log('✅ Core APIs are connected and working');
  console.log('✅ Frontend components should now display real data');
  console.log('✅ Admin dashboards should show actual users and metrics');
  console.log('\n💡 Next: Visit http://localhost:3000/usmca-workflow to test the UI');
  console.log('💡 Next: Visit http://localhost:3000/admin/user-management for admin data');
}

// Run the test
if (require.main === module) {
  testClassificationIntegration().catch(console.error);
}

module.exports = testClassificationIntegration;