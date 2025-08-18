/**
 * 🤖 CLAUDE API TEST
 * Test Anthropic Claude API key and connection
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    console.log('🤖 Testing Claude API connection...')
    
    // Check if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
        note: 'Add your Anthropic API key to environment variables'
      })
    }
    
    console.log('✅ API key found, testing connection...')
    
    // Import and test the Marcus Claude API
    const { generateClaudeAnalysis } = await import('../../lib/marcus-claude-api.js')
    
    // Test data
    const testCompanyData = {
      companyName: 'Test Electronics Corp',
      businessType: 'Electronics',
      importVolume: '$2M-$5M',
      supplierCountry: 'CN'
    }
    
    const testIntelligence = {
      profile: testCompanyData,
      benchmarks: { count: 47 },
      patterns: ['test1', 'test2', 'test3'],
      triangleOpportunities: {
        annualSavings: 250000,
        recommendedRoute: 'China → Mexico → USA'
      }
    }
    
    console.log('📡 Making Claude API call...')
    
    const analysis = await generateClaudeAnalysis(
      testCompanyData,
      testIntelligence,
      { focus: 'API test' }
    )
    
    console.log('✅ Claude API call successful!')
    
    return res.status(200).json({
      success: true,
      message: 'Claude API is working correctly',
      apiKeyConfigured: true,
      testResults: {
        analysisGenerated: !!analysis,
        analysisLength: analysis ? JSON.stringify(analysis).length : 0,
        hasExecutiveSummary: !!(analysis?.executiveSummary),
        hasRecommendations: !!(analysis?.strategicRecommendations)
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Claude API test failed:', error)
    
    // Check specific error types
    let errorType = 'unknown'
    let suggestion = 'Check server logs for details'
    
    if (error.message.includes('API key')) {
      errorType = 'authentication'
      suggestion = 'Verify your ANTHROPIC_API_KEY is valid'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'network'
      suggestion = 'Check internet connection and Anthropic API status'
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      errorType = 'quota'
      suggestion = 'API rate limit reached or quota exceeded'
    }
    
    return res.status(500).json({
      success: false,
      error: error.message,
      errorType,
      suggestion,
      apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY
    })
  }
}