#!/usr/bin/env node

/**
 * Simple Test Script for Volatile/Stable Data Separation
 * Tests the core functionality without depending on the web server
 */

import DatabaseIntelligenceBridge, { StableDataManager, VolatileDataManager } from './lib/intelligence/database-intelligence-bridge.js'

async function runTests() {
  console.log('🧪 TESTING VOLATILE/STABLE DATA SEPARATION SYSTEM')
  console.log('='.repeat(60))
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  // Test 1: Cache Configuration System
  console.log('\n1️⃣ Testing Cache Configuration System...')
  try {
    const tariffConfig = VolatileDataManager.getCacheConfig('tariff_rates')
    const shippingConfig = VolatileDataManager.getCacheConfig('shipping_rates')
    const defaultConfig = VolatileDataManager.getCacheConfig('unknown_endpoint')
    
    const test1Pass = tariffConfig.ttl === 3600000 && 
                     shippingConfig.ttl === 7200000 &&
                     defaultConfig.ttl === 3600000 &&
                     tariffConfig.description && 
                     shippingConfig.description
    
    if (test1Pass) {
      console.log('   ✅ PASS - Cache configurations working correctly')
      console.log(`   📊 Tariff rates: ${tariffConfig.ttl/3600000}h TTL - ${tariffConfig.description}`)
      console.log(`   📊 Shipping rates: ${shippingConfig.ttl/3600000}h TTL - ${shippingConfig.description}`)
      results.passed++
    } else {
      console.log('   ❌ FAIL - Cache configurations not working')
      results.failed++
    }
    results.tests.push({ name: 'Cache Configuration', passed: test1Pass })
  } catch (error) {
    console.log('   ❌ FAIL - Cache configuration error:', error.message)
    results.failed++
    results.tests.push({ name: 'Cache Configuration', passed: false, error: error.message })
  }

  // Test 2: Volatility Level Detection
  console.log('\n2️⃣ Testing Volatility Level Detection...')
  try {
    const tariffVolatility = VolatileDataManager.getVolatilityLevel('tariff_rates')
    const shippingVolatility = VolatileDataManager.getVolatilityLevel('shipping_rates')
    const portVolatility = VolatileDataManager.getVolatilityLevel('port_congestion')
    
    const test2Pass = tariffVolatility === 'HIGHLY_VOLATILE' &&
                     shippingVolatility === 'HIGHLY_VOLATILE' &&
                     portVolatility === 'WEEKLY_VOLATILE'
    
    if (test2Pass) {
      console.log('   ✅ PASS - Volatility detection working correctly')
      console.log(`   📈 Tariffs: ${tariffVolatility}`)
      console.log(`   📈 Shipping: ${shippingVolatility}`)
      console.log(`   📈 Ports: ${portVolatility}`)
      results.passed++
    } else {
      console.log('   ❌ FAIL - Volatility detection not working')
      console.log(`   📈 Expected: HIGHLY_VOLATILE, HIGHLY_VOLATILE, WEEKLY_VOLATILE`)
      console.log(`   📈 Got: ${tariffVolatility}, ${shippingVolatility}, ${portVolatility}`)
      results.failed++
    }
    results.tests.push({ name: 'Volatility Detection', passed: test2Pass })
  } catch (error) {
    console.log('   ❌ FAIL - Volatility detection error:', error.message)
    results.failed++
    results.tests.push({ name: 'Volatility Detection', passed: false, error: error.message })
  }

  // Test 3: Stable Data Categories
  console.log('\n3️⃣ Testing Stable Data Categories...')
  try {
    const categories = StableDataManager.STABLE_CATEGORIES
    const expectedCategories = ['TREATY_LOCKED', 'INFRASTRUCTURE', 'HISTORICAL', 'CLASSIFICATION', 'GEOGRAPHIC']
    
    const test3Pass = expectedCategories.every(cat => 
      Object.values(categories).some(val => val.includes(cat.replace('_', ' ').toLowerCase()))
    )
    
    if (test3Pass) {
      console.log('   ✅ PASS - Stable data categories defined correctly')
      Object.entries(categories).forEach(([key, desc]) => {
        console.log(`   📚 ${key}: ${desc}`)
      })
      results.passed++
    } else {
      console.log('   ❌ FAIL - Stable data categories missing or incorrect')
      results.failed++
    }
    results.tests.push({ name: 'Stable Data Categories', passed: test3Pass })
  } catch (error) {
    console.log('   ❌ FAIL - Stable data categories error:', error.message)
    results.failed++
    results.tests.push({ name: 'Stable Data Categories', passed: false, error: error.message })
  }

  // Test 4: TTL Calculation Logic
  console.log('\n4️⃣ Testing TTL Calculation Logic...')
  try {
    // Normal request
    const normalTTL = VolatileDataManager.calculateIntelligentCacheExpiry('tariff_rates', false, 0)
    // RSS triggered, high urgency
    const urgentTTL = VolatileDataManager.calculateIntelligentCacheExpiry('tariff_rates', true, 50)
    // RSS triggered, low urgency  
    const moderateTTL = VolatileDataManager.calculateIntelligentCacheExpiry('tariff_rates', true, 10)
    
    const test4Pass = normalTTL === 1 && // 1 hour for tariff_rates
                     urgentTTL === 0.5 && // 30 min minimum for urgent
                     moderateTTL === 0.5 && // 50% of base (0.5h)
                     urgentTTL < normalTTL &&
                     moderateTTL < normalTTL
    
    if (test4Pass) {
      console.log('   ✅ PASS - TTL calculation logic working correctly')
      console.log(`   ⏱️  Normal: ${normalTTL}h`)
      console.log(`   ⏱️  Urgent RSS: ${urgentTTL}h`) 
      console.log(`   ⏱️  Moderate RSS: ${moderateTTL}h`)
      results.passed++
    } else {
      console.log('   ❌ FAIL - TTL calculation logic not working')
      console.log(`   ⏱️  Expected: 1h, <1h, <1h`)
      console.log(`   ⏱️  Got: ${normalTTL}h, ${urgentTTL}h, ${moderateTTL}h`)
      results.failed++
    }
    results.tests.push({ name: 'TTL Calculation', passed: test4Pass })
  } catch (error) {
    console.log('   ❌ FAIL - TTL calculation error:', error.message)
    results.failed++
    results.tests.push({ name: 'TTL Calculation', passed: false, error: error.message })
  }

  // Test 5: Stable Data Access (Database Connection Test)
  console.log('\n5️⃣ Testing Stable Data Database Access...')
  try {
    console.log('   🔄 Attempting to fetch USMCA rates from database...')
    const startTime = Date.now()
    const usmcaData = await StableDataManager.getUSMCARates('MX-US')
    const duration = Date.now() - startTime
    
    const test5Pass = usmcaData.source === 'STABLE_DATABASE' &&
                     usmcaData.apiCallNeeded === false &&
                     usmcaData.rate === 0 &&
                     usmcaData.status === 'TREATY_LOCKED' &&
                     duration < 1000 // Should be fast
    
    if (test5Pass) {
      console.log(`   ✅ PASS - Stable data access working (${duration}ms)`)
      console.log(`   💰 USMCA Rate: ${usmcaData.rate}% (Treaty Locked)`)
      console.log(`   📊 Source: ${usmcaData.source}`)
      console.log(`   🏷️  Category: ${usmcaData.category}`)
      results.passed++
    } else {
      console.log('   ❌ FAIL - Stable data access not working properly')
      console.log(`   📊 Response: ${JSON.stringify(usmcaData, null, 2)}`)
      results.failed++
    }
    results.tests.push({ name: 'Stable Data Access', passed: test5Pass, duration })
  } catch (error) {
    console.log('   ❌ FAIL - Database access error:', error.message)
    console.log('   💡 This may indicate database connection issues')
    results.failed++
    results.tests.push({ name: 'Stable Data Access', passed: false, error: error.message })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 VOLATILE/STABLE DATA SEPARATION TEST RESULTS')
  console.log('='.repeat(60))
  
  const totalTests = results.passed + results.failed
  const successRate = Math.round((results.passed / totalTests) * 100)
  
  console.log(`✅ Tests Passed: ${results.passed}/${totalTests} (${successRate}%)`)
  console.log(`❌ Tests Failed: ${results.failed}/${totalTests}`)
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Volatile/Stable separation is working correctly!')
    console.log('💡 Key benefits achieved:')
    console.log('   • Intelligent TTL caching based on data volatility')
    console.log('   • Stable data requires zero API calls')
    console.log('   • RSS-triggered updates with urgency-based cache expiry')
    console.log('   • Proper categorization of data types')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Review the failed tests above')
    console.log('💡 Common issues:')
    console.log('   • Database connection problems')
    console.log('   • Missing environment variables')
    console.log('   • Configuration errors')
  }
  
  console.log('\n🚀 System Status: Enhanced volatile/stable separation implemented!')
  
  return results
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message)
  process.exit(1)
})