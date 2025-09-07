/**
 * Test Dashboard Loading - Check if dashboards actually display data
 */

async function testDashboardActualDisplay() {
  console.log('🧪 Testing if dashboards actually display data to users...\n');
  
  const BASE_URL = 'http://localhost:3000';
  
  // Test 1: Check if APIs work
  console.log('1. Testing API responses:');
  try {
    const userResponse = await fetch(BASE_URL + '/api/admin/users');
    const userData = await userResponse.json();
    console.log(`   ✅ Users API: ${userData.users?.length || 0} users returned`);
    
    const supplierResponse = await fetch(BASE_URL + '/api/admin/suppliers');
    const supplierData = await supplierResponse.json();
    console.log(`   ✅ Suppliers API: ${supplierData.suppliers?.length || 0} suppliers returned`);
    
  } catch (error) {
    console.log(`   ❌ API Error: ${error.message}`);
  }
  
  // Test 2: Check if dashboard pages load completely (not stuck in loading)
  console.log('\n2. Testing dashboard page completion:');
  
  const dashboards = [
    '/admin/user-management',
    '/admin/supplier-management', 
    '/admin/crisis-management',
    '/admin/analytics'
  ];
  
  for (const dashboard of dashboards) {
    try {
      const response = await fetch(BASE_URL + dashboard);
      const html = await response.text();
      
      const isStuckLoading = html.includes('Loading user management system') || 
                           html.includes('Loading supplier management') ||
                           html.includes('Loading crisis management') ||
                           html.includes('Loading analytics');
      
      const hasActualContent = html.includes('Add User') || 
                              html.includes('Add Supplier') ||
                              html.includes('Manual Check') ||
                              html.includes('Export');
      
      console.log(`   ${dashboard}:`);
      console.log(`     Loading state: ${isStuckLoading ? '❌ Stuck loading' : '✅ Not loading'}`);
      console.log(`     Has buttons: ${hasActualContent ? '✅ Yes' : '❌ No'}`);
      
    } catch (error) {
      console.log(`   ❌ ${dashboard}: ${error.message}`);
    }
  }
  
  // Test 3: Check if specific UI elements exist
  console.log('\n3. Testing for expected UI elements:');
  
  try {
    const userMgmtResponse = await fetch(BASE_URL + '/admin/user-management');
    const userMgmtHtml = await userMgmtResponse.text();
    
    const hasAddUserBtn = userMgmtHtml.includes('Add User');
    const hasExportBtn = userMgmtHtml.includes('Export Users');
    const hasUserList = userMgmtHtml.includes('User Accounts');
    
    console.log('   User Management Dashboard:');
    console.log(`     "Add User" button: ${hasAddUserBtn ? '✅' : '❌'}`);
    console.log(`     "Export Users" button: ${hasExportBtn ? '✅' : '❌'}`);
    console.log(`     User list section: ${hasUserList ? '✅' : '❌'}`);
    
  } catch (error) {
    console.log(`   ❌ UI test error: ${error.message}`);
  }
  
  console.log('\n📊 Summary:');
  console.log('If dashboards are "stuck loading", the React components aren\'t completing their useEffect hooks.');
  console.log('If buttons are missing, the server-rendered HTML doesn\'t include them (JavaScript hasn\'t run).');
  console.log('This helps distinguish between server-side and client-side rendering issues.');
}

testDashboardActualDisplay().catch(console.error);