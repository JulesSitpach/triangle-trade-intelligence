// Test chat system with minimal context vs full foundation context

const testChatWithContext = async (question, context = {}) => {
  try {
    const response = await fetch('http://localhost:3000/api/trade-intelligence-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        sessionId: `test_${Date.now()}`,
        language: context.language || 'en',
        ...context
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        response: data.response,
        confidence: data.confidence,
        source: data.dataSource
      }
    } else {
      return { success: false, error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const runTests = async () => {
  console.log('🔍 TESTING CHAT SYSTEM: MINIMAL VS FULL CONTEXT\n')

  // Test 1: Minimal context (no foundation data)
  console.log('📋 TEST 1: MINIMAL CONTEXT (No Foundation Data)')
  console.log('Question: "What is the HS code for smartphones?"')
  const minimal = await testChatWithContext('What is the HS code for smartphones?')
  console.log('Result:', minimal)
  console.log('')

  // Test 2: With business context  
  console.log('📋 TEST 2: WITH BUSINESS CONTEXT')
  console.log('Question: "What is the HS code for smartphones?"')
  console.log('Context: Electronics business, $1M-$5M volume')
  const withContext = await testChatWithContext('What is the HS code for smartphones?', {
    businessType: 'Electronics',
    importVolume: '$1M-$5M'
  })
  console.log('Result:', withContext)
  console.log('')

  // Test 3: Different product
  console.log('📋 TEST 3: DIFFERENT PRODUCT (Minimal Context)')
  console.log('Question: "HS code for leather boots"')
  const boots = await testChatWithContext('HS code for leather boots')
  console.log('Result:', boots)
  console.log('')

  // Test 4: Complex product description
  console.log('📋 TEST 4: COMPLEX PRODUCT (Minimal Context)')
  console.log('Question: "What is the HS code for electronic circuit boards with integrated processors?"')
  const complex = await testChatWithContext('What is the HS code for electronic circuit boards with integrated processors?')
  console.log('Result:', complex)
  console.log('')

  // Analysis
  console.log('🎯 ANALYSIS:')
  console.log('- Does chat need foundation data for HS codes?', minimal.success === withContext.success ? 'NO' : 'YES')
  console.log('- Are results similar without context?', minimal.confidence === withContext.confidence ? 'YES' : 'DIFFERENT')
  console.log('- Product-only queries work?', boots.success && complex.success ? 'YES' : 'NO')
}

runTests().catch(console.error)