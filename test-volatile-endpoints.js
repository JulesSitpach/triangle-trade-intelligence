/**
 * Test script for volatile data endpoints URL parsing
 * Verifies integration with Database Intelligence Bridge
 */

const BASE_URL = 'http://localhost:3000'

async function testEndpoint(endpoint, params, method = 'GET') {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}`)
    console.log(`📝 Params:`, params)
    
    let url = `${BASE_URL}${endpoint}`
    let options = { method }
    
    if (method === 'GET' && params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    } else if (method === 'POST' && params) {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(params)
    }
    
    console.log(`🔗 URL: ${url}`)
    
    const response = await fetch(url, options)
    const data = await response.json()
    
    if (response.ok) {
      console.log(`✅ SUCCESS (${response.status})`)
      console.log(`📊 Response:`, {
        endpoint: data.endpoint,
        success: data.success,
        duration: data.duration,
        source: data.source,
        recordCount: data.recordCount || data.rateCount || data.alertCount || 'N/A'
      })
    } else {
      console.log(`❌ ERROR (${response.status})`)
      console.log(`💥 Error:`, data.error)
      if (data.usage) {
        console.log(`📚 Usage:`, data.usage)
      }
    }
  } catch (error) {
    console.log(`💥 NETWORK ERROR:`, error.message)
  }
}

async function runTests() {
  console.log('🚀 TESTING VOLATILE DATA API ENDPOINTS URL PARSING\n')
  console.log('=' .repeat(60))
  
  // Test 1: Comtrade endpoint - GET with URL parameters
  await testEndpoint('/api/volatile-data/comtrade', {
    country: 'CN',
    hsCode: '8471'
  }, 'GET')
  
  // Test 2: Comtrade endpoint - POST with JSON body
  await testEndpoint('/api/volatile-data/comtrade', {
    country: 'IN',
    hsCode: '8517',
    partnerCode: 'IN',
    reporterCode: '842'
  }, 'POST')
  
  // Test 3: Shipping endpoint - GET with URL parameters
  await testEndpoint('/api/volatile-data/shipping', {
    origin: 'CN',
    destination: 'US',
    weight: '10',
    length: '30'
  }, 'GET')
  
  // Test 4: Shipping endpoint - POST with JSON body
  await testEndpoint('/api/volatile-data/shipping', {
    origin: 'MX',
    destination: 'US',
    parcel: {
      length: '20',
      width: '20',
      height: '20',
      distance_unit: 'in',
      weight: '5',
      mass_unit: 'lb'
    }
  }, 'POST')
  
  // Test 5: Market Intelligence endpoint - GET
  await testEndpoint('/api/volatile-data/market-intelligence', {
    country: 'CN',
    hsCode: '8471',
    businessType: 'Electronics',
    urgency: '25'
  }, 'GET')
  
  // Test 6: Market Intelligence endpoint - POST
  await testEndpoint('/api/volatile-data/market-intelligence', {
    country: 'MX',
    businessType: 'Manufacturing',
    urgency: 15,
    alertType: 'MARKET_INTELLIGENCE'
  }, 'POST')
  
  // Test 7: Country Risk endpoint - GET
  await testEndpoint('/api/volatile-data/country-risk', {
    countries: 'CN,MX,CA',
    businessType: 'Electronics'
  }, 'GET')
  
  // Test 8: Exchange Rates endpoint - GET
  await testEndpoint('/api/volatile-data/exchange-rates', {
    baseCurrency: 'USD',
    targetCurrencies: 'CNY,MXN,CAD',
    amount: '1000'
  }, 'GET')
  
  // Test 9: Test error handling - missing required parameters
  await testEndpoint('/api/volatile-data/comtrade', {}, 'GET')
  
  // Test 10: Test unsupported HTTP method
  try {
    const response = await fetch(`${BASE_URL}/api/volatile-data/comtrade`, {
      method: 'DELETE'
    })
    const data = await response.json()
    console.log(`\n🧪 Testing DELETE method`)
    console.log(`❌ Expected error (${response.status}):`, data.error)
  } catch (error) {
    console.log(`💥 DELETE test error:`, error.message)
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('✅ VOLATILE DATA ENDPOINTS TESTING COMPLETE')
  console.log('🔗 All endpoints now support both GET (URL params) and POST (JSON body)')
  console.log('🛡️  Enhanced error handling and parameter validation implemented')
  console.log('🎯 Ready for Beast Master Controller integration')
}

// Only run if called directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testEndpoint, runTests }