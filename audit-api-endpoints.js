const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAPIEndpoint(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      timeout: 10000,
      ...options
    });
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      endpoint,
      status: response.status,
      ok: response.ok,
      data: typeof data === 'string' ? data.substring(0, 200) + '...' : data,
      contentType
    };
  } catch (error) {
    return {
      endpoint,
      status: 'ERROR',
      ok: false,
      error: error.message
    };
  }
}

async function auditAPIEndpoints() {
  console.log('🔍 TRIANGLE INTELLIGENCE API ENDPOINTS AUDIT');
  console.log('============================================\n');
  
  // Core system endpoints
  const systemEndpoints = [
    '/api/status',
    '/api/status?simple=true', 
    '/api/database-structure-test',
    '/api/dropdown-options'
  ];
  
  // Intelligence endpoints
  const intelligenceEndpoints = [
    '/api/intelligence/routing',
    '/api/intelligence/hs-codes',
    '/api/intelligence/tariffs',
    '/api/dashboard-hub-intelligence'
  ];
  
  // Business critical endpoints
  const businessEndpoints = [
    '/api/trade-intelligence-chat',
    '/api/marcus-intelligence-dashboard',
    '/api/canada-mexico-advantage'
  ];
  
  const allEndpoints = [
    ...systemEndpoints,
    ...intelligenceEndpoints, 
    ...businessEndpoints
  ];
  
  console.log('🔧 TESTING SYSTEM ENDPOINTS:');
  for (const endpoint of systemEndpoints) {
    const result = await testAPIEndpoint(endpoint);
    const statusIcon = result.ok ? '✅' : '❌';
    console.log(`${statusIcon} ${endpoint}: ${result.status} ${result.error ? '- ' + result.error : ''}`);
    
    if (result.ok && result.data && typeof result.data === 'object') {
      if (result.data.status) {
        console.log(`   Status: ${result.data.status}`);
      }
      if (result.data.database) {
        console.log(`   Database: ${result.data.database}`);
      }
    }
  }
  
  console.log('\n🧠 TESTING INTELLIGENCE ENDPOINTS:');
  for (const endpoint of intelligenceEndpoints) {
    const method = endpoint.includes('routing') || endpoint.includes('hs-codes') ? 'POST' : 'GET';
    const body = method === 'POST' ? JSON.stringify({
      origin: 'CN',
      destination: 'US',
      products: ['electronics'],
      businessProfile: {
        businessType: 'Manufacturing',
        importVolume: '$1M - $5M'
      }
    }) : undefined;
    
    const options = method === 'POST' ? {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    } : {};
    
    const result = await testAPIEndpoint(endpoint, options);
    const statusIcon = result.ok ? '✅' : '❌';
    console.log(`${statusIcon} ${method} ${endpoint}: ${result.status} ${result.error ? '- ' + result.error : ''}`);
  }
  
  console.log('\n💼 TESTING BUSINESS ENDPOINTS:');
  for (const endpoint of businessEndpoints) {
    const method = endpoint.includes('chat') ? 'POST' : 'GET';
    const body = method === 'POST' ? JSON.stringify({
      question: 'What are the triangle routing opportunities for electronics from China?',
      sessionId: 'audit-test'
    }) : undefined;
    
    const options = method === 'POST' ? {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    } : {};
    
    const result = await testAPIEndpoint(endpoint, options);
    const statusIcon = result.ok ? '✅' : '❌';
    console.log(`${statusIcon} ${method} ${endpoint}: ${result.status} ${result.error ? '- ' + result.error : ''}`);
  }
  
  // Summary
  const results = await Promise.all(
    allEndpoints.map(async endpoint => {
      const method = endpoint.includes('routing') || endpoint.includes('hs-codes') || endpoint.includes('chat') ? 'POST' : 'GET';
      const body = method === 'POST' ? JSON.stringify({test: true}) : undefined;
      const options = method === 'POST' ? {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body
      } : {};
      
      return await testAPIEndpoint(endpoint, options);
    })
  );
  
  const workingEndpoints = results.filter(r => r.ok);
  const brokenEndpoints = results.filter(r => !r.ok);
  
  console.log('\n📊 API ENDPOINTS AUDIT SUMMARY:');
  console.log(`✅ Working: ${workingEndpoints.length}/${allEndpoints.length}`);
  console.log(`❌ Broken: ${brokenEndpoints.length}/${allEndpoints.length}`);
  console.log(`📈 API Health: ${Math.round((workingEndpoints.length / allEndpoints.length) * 100)}%`);
  
  if (brokenEndpoints.length > 0) {
    console.log('\n🚨 CRITICAL API ISSUES:');
    brokenEndpoints.forEach(endpoint => {
      console.log(`  - ${endpoint.endpoint}: ${endpoint.error || endpoint.status}`);
    });
  }
  
  console.log('\n🎯 BUSINESS IMPACT:');
  const criticalEndpoints = ['/api/status', '/api/intelligence/routing', '/api/trade-intelligence-chat'];
  const criticalWorking = criticalEndpoints.filter(endpoint => 
    workingEndpoints.find(w => w.endpoint === endpoint)
  );
  
  if (criticalWorking.length === criticalEndpoints.length) {
    console.log('✅ All business-critical APIs operational');
    console.log('💰 $100K-$300K savings features: AVAILABLE');
  } else {
    console.log('🚨 BUSINESS CRITICAL APIs broken');
    console.log('💔 Triangle routing features: COMPROMISED');
  }
}

auditAPIEndpoints().catch(console.error);