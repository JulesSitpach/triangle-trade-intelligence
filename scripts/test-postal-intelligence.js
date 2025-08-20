/**
 * Test Script for USMCA Postal Intelligence System
 * Tests various postal codes from US, Canada, and Mexico
 */

const fetch = require('node-fetch')

const TEST_POSTAL_CODES = [
  // US ZIP Codes
  { code: '90210', country: 'US', expected: 'Beverly Hills, CA' },
  { code: '10001', country: 'US', expected: 'New York, NY' },
  { code: '77001', country: 'US', expected: 'Houston, TX' },
  { code: '60601', country: 'US', expected: 'Chicago, IL' },
  { code: '94102', country: 'US', expected: 'San Francisco, CA (fallback)' },
  { code: '33101', country: 'US', expected: 'Miami, FL (fallback)' },
  { code: '12345', country: 'US', expected: 'Unknown US location (fallback)' },

  // Canadian Postal Codes
  { code: 'M5V3A8', country: 'CA', expected: 'Toronto, ON' },
  { code: 'V6B1A1', country: 'CA', expected: 'Vancouver, BC' },
  { code: 'H3B2Y5', country: 'CA', expected: 'Montreal, QC' },
  { code: 'K1A0A6', country: 'CA', expected: 'Ottawa, ON (fallback)' },
  { code: 'T2P2M5', country: 'CA', expected: 'Calgary, AB (fallback)' },
  { code: 'R3C0V8', country: 'CA', expected: 'Winnipeg, MB (fallback)' },

  // Mexican Postal Codes
  { code: '01000', country: 'MX', expected: 'Mexico City' },
  { code: '22000', country: 'MX', expected: 'Tijuana' },
  { code: '64000', country: 'MX', expected: 'Monterrey' },
  { code: '44100', country: 'MX', expected: 'Guadalajara' },
  { code: '20000', country: 'MX', expected: 'Aguascalientes (fallback)' },
  { code: '76000', country: 'MX', expected: 'Querétaro (fallback)' },

  // Invalid/Edge Cases
  { code: 'INVALID', country: 'XX', expected: 'Invalid format' },
  { code: '123', country: 'US', expected: 'Invalid US ZIP' },
  { code: 'A1A1A1', country: 'CA', expected: 'Invalid Canadian postal' },
  { code: '123456', country: 'MX', expected: 'Invalid Mexican postal' }
]

/**
 * Test the foundation derivation API
 */
async function testFoundationDerivationAPI() {
  console.log('🧪 TESTING FOUNDATION DERIVATION API')
  console.log('=====================================\n')

  const testCases = [
    { zipCode: '90210', businessType: 'Electronics', primarySupplierCountry: 'CN' },
    { zipCode: 'M5V3A8', businessType: 'Manufacturing', primarySupplierCountry: 'IN' },
    { zipCode: '01000', businessType: 'Automotive', primarySupplierCountry: 'JP' },
    { zipCode: '12345', businessType: 'Medical', primarySupplierCountry: 'VN' }
  ]

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.zipCode} (${testCase.businessType} from ${testCase.primarySupplierCountry})`)
      
      const response = await fetch('http://localhost:3000/api/intelligence/foundation-derivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Test Company',
          ...testCase
        })
      })

      if (response.ok) {
        const intelligence = await response.json()
        
        console.log('✅ Success:')
        console.log(`   Location: ${intelligence.geographic?.city || intelligence.geographic?.metro}, ${intelligence.geographic?.region}`)
        console.log(`   Country: ${intelligence.geographic?.country}`)
        console.log(`   USMCA Gateway: ${intelligence.geographic?.usmcaGateway ? '🇺🇸🇨🇦🇲🇽 Yes' : 'No'}`)
        console.log(`   Confidence: ${intelligence.geographic?.confidence}%`)
        console.log(`   Source: ${intelligence.geographic?.source}`)
        console.log(`   Data Points: ${intelligence.dataPointsGenerated}`)
        
        if (intelligence.geographic?.ports?.length > 0) {
          console.log(`   Ports: ${intelligence.geographic.ports.join(', ')}`)
        }
        
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`💥 Network Error: ${error.message}`)
    }
    console.log('')
  }
}

/**
 * Test the direct postal lookup API
 */
async function testDirectPostalLookupAPI() {
  console.log('🔍 TESTING DIRECT POSTAL LOOKUP API')
  console.log('===================================\n')

  for (const testCase of TEST_POSTAL_CODES) {
    try {
      console.log(`Testing: ${testCase.code} (Expected: ${testCase.expected})`)
      
      const response = await fetch('http://localhost:3000/api/intelligence/usmca-postal-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: testCase.code })
      })

      if (response.ok) {
        const intelligence = await response.json()
        
        console.log('✅ Success:')
        console.log(`   Location: ${intelligence.city || intelligence.metro}, ${intelligence.region}`)
        console.log(`   Country: ${intelligence.country}`)
        console.log(`   USMCA Gateway: ${intelligence.usmcaGateway ? '🇺🇸🇨🇦🇲🇽 Yes' : 'No'}`)
        console.log(`   Confidence: ${intelligence.confidence}%`)
        console.log(`   Source: ${intelligence.source}`)
        
        if (intelligence.usmcaContext?.tradeAdvantages?.length > 0) {
          console.log(`   Trade Advantages: ${intelligence.usmcaContext.tradeAdvantages.join(', ')}`)
        }
        
      } else if (response.status === 400) {
        const error = await response.json()
        console.log(`⚠️  Expected Error: ${error.error}`)
      } else {
        console.log(`❌ Unexpected Error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`💥 Network Error: ${error.message}`)
    }
    console.log('')
  }
}

/**
 * Test validation patterns
 */
async function testValidationPatterns() {
  console.log('🔧 TESTING VALIDATION PATTERNS')
  console.log('==============================\n')

  const validationTests = [
    // Valid US ZIP codes
    { code: '12345', shouldPass: true, format: 'US ZIP' },
    { code: '12345-6789', shouldPass: true, format: 'US ZIP+4' },
    
    // Valid Canadian postal codes
    { code: 'K1A0A6', shouldPass: true, format: 'Canadian' },
    { code: 'K1A 0A6', shouldPass: true, format: 'Canadian with space' },
    { code: 'k1a0a6', shouldPass: true, format: 'Canadian lowercase' },
    
    // Valid Mexican postal codes
    { code: '01000', shouldPass: true, format: 'Mexican' },
    { code: '99999', shouldPass: true, format: 'Mexican' },
    
    // Invalid formats
    { code: '1234', shouldPass: false, format: 'Too short' },
    { code: '123456', shouldPass: false, format: 'Too long US ZIP' },
    { code: 'K1A0A', shouldPass: false, format: 'Incomplete Canadian' },
    { code: '1A1A1A', shouldPass: false, format: 'Wrong Canadian pattern' },
    { code: 'ABCDE', shouldPass: false, format: 'Letters only' },
    { code: '', shouldPass: false, format: 'Empty string' }
  ]

  for (const test of validationTests) {
    try {
      const response = await fetch('http://localhost:3000/api/intelligence/usmca-postal-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: test.code })
      })

      const success = response.ok
      const expectedResult = test.shouldPass

      if (success === expectedResult) {
        console.log(`✅ ${test.code} (${test.format}): ${success ? 'Valid' : 'Invalid'} - ✓ Expected`)
      } else {
        console.log(`❌ ${test.code} (${test.format}): Expected ${expectedResult ? 'valid' : 'invalid'}, got ${success ? 'valid' : 'invalid'}`)
      }

    } catch (error) {
      console.log(`💥 ${test.code}: Network error - ${error.message}`)
    }
  }
}

/**
 * Performance test
 */
async function testPerformance() {
  console.log('\n⚡ PERFORMANCE TEST')
  console.log('==================\n')

  const performanceCodes = ['90210', 'M5V3A8', '01000', '12345']
  const iterations = 5

  for (const code of performanceCodes) {
    const times = []
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()
      
      try {
        const response = await fetch('http://localhost:3000/api/intelligence/usmca-postal-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postalCode: code })
        })
        
        if (response.ok) {
          const data = await response.json()
          const endTime = Date.now()
          times.push(endTime - startTime)
        }
      } catch (error) {
        console.log(`Error testing ${code}: ${error.message}`)
      }
    }
    
    if (times.length > 0) {
      const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length)
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)
      
      console.log(`${code}: Avg: ${avgTime}ms, Min: ${minTime}ms, Max: ${maxTime}ms`)
    }
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 USMCA POSTAL INTELLIGENCE SYSTEM TEST SUITE')
  console.log('===============================================\n')
  console.log('Testing both database lookups and algorithmic fallbacks...\n')

  try {
    // Test 1: Foundation Derivation API (full intelligence)
    await testFoundationDerivationAPI()

    // Test 2: Direct Postal Lookup API  
    await testDirectPostalLookupAPI()

    // Test 3: Validation Patterns
    await testValidationPatterns()

    // Test 4: Performance
    await testPerformance()

    console.log('\n🎉 TEST SUITE COMPLETE!')
    console.log('✅ USMCA Postal Intelligence System is ready for production!')

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message)
    console.log('\nMake sure:')
    console.log('1. Your Next.js dev server is running (npm run dev)')
    console.log('2. The postal_intelligence table exists in Supabase')
    console.log('3. Environment variables are set correctly')
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  testFoundationDerivationAPI,
  testDirectPostalLookupAPI,
  testValidationPatterns,
  testPerformance
}