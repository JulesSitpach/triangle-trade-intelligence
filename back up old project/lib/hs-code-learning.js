// Machine Learning Feedback Loop for HS Code Intelligence
// Uses 597K+ trade_flows data + user selections for continuous improvement
import { createClient } from '@supabase/supabase-js'
import { getEnhancedHSSuggestions } from './hs-code-suggestions.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Capture user selections to improve future suggestions
export async function captureUserSelection(userInput, selectedHSCode, businessType, rejectedSuggestions = []) {
  try {
    console.log(`🧠 ML Learning: Capturing selection "${userInput}" → ${selectedHSCode} (${businessType})`)
    
    // Store the learning data in our institutional memory
    const { data, error } = await supabase
      .from('hs_code_learning')
      .insert({
        product_description: userInput.toLowerCase().trim(),
        selected_hs_code: selectedHSCode,
        business_type: businessType,
        company_name: null, // Will be updated if available
        user_session_id: 'anonymous',
        confidence_score: null, // Will be calculated during next suggestion
        timestamp: new Date(),
        learning_source: 'user_selection_ml',
        rejected_suggestions: rejectedSuggestions.length > 0 ? JSON.stringify(rejectedSuggestions) : null,
        pattern_keywords: extractKeywords(userInput),
        industry_context: businessType
      })

    if (error) {
      console.warn('Database learning failed:', error.message)
      // Store in localStorage as backup
      storeLocalLearning(userInput, selectedHSCode, businessType, rejectedSuggestions)
    } else {
      console.log('✅ ML Learning: Selection stored in database')
      
      // Immediately analyze patterns with our 597K trade flows
      await analyzeTradeFlowPatterns(userInput, selectedHSCode, businessType)
    }

  } catch (error) {
    console.error('❌ ML Learning capture failed:', error)
    // Always have a backup learning method
    storeLocalLearning(userInput, selectedHSCode, businessType, rejectedSuggestions)
  }
}

// Analyze patterns using our massive 597K trade flows dataset
async function analyzeTradeFlowPatterns(userInput, selectedHSCode, businessType) {
  try {
    console.log(`🔍 ML Analysis: Cross-referencing with 597K+ trade flows for ${selectedHSCode}`)
    
    // Find matching trade flows for this HS code
    const { data: tradeFlows, error } = await supabase
      .from('trade_flows')
      .select('hs_code, product_description, trade_value_usd, triangle_savings_realized, success_probability, reporter_country, partner_country, product_category')
      .eq('hs_code', selectedHSCode.substring(0, 2)) // Use 2-digit chapter for broader analysis
      .not('trade_value_usd', 'is', null)
      .order('trade_value_usd', { ascending: false })
      .limit(50)

    if (!error && tradeFlows.length > 0) {
      const patterns = extractSuccessPatterns(userInput, tradeFlows, businessType)
      await storePatternLearning(patterns, selectedHSCode, businessType)
      
      console.log(`📊 ML Analysis: Found ${patterns.length} success patterns from ${tradeFlows.length} trade flows`)
    } else {
      console.log('📋 ML Analysis: Limited trade flow data for pattern analysis')
    }

  } catch (error) {
    console.error('❌ ML Analysis failed:', error)
  }
}

// Extract success patterns from trade flow data
function extractSuccessPatterns(userInput, tradeFlows, businessType) {
  const userWords = extractKeywords(userInput)
  const patterns = []

  tradeFlows.forEach(flow => {
    // Skip generic descriptions
    if (!flow.product_description || flow.product_description === 'Product description not available') {
      return
    }

    const flowWords = extractKeywords(flow.product_description)
    const commonWords = userWords.filter(word => 
      flowWords.some(flowWord => 
        flowWord.includes(word) || 
        word.includes(flowWord) || 
        calculateWordSimilarity(word, flowWord) > 0.8
      )
    )

    if (commonWords.length > 0) {
      patterns.push({
        user_keywords: userWords,
        flow_keywords: flowWords,
        common_keywords: commonWords,
        hs_code: flow.hs_code,
        trade_value_usd: flow.trade_value_usd,
        success_probability: flow.success_probability || 0.75,
        triangle_savings: flow.triangle_savings_realized,
        business_type: businessType,
        confidence_boost: calculatePatternBoost(commonWords, flow),
        countries: `${flow.reporter_country} → ${flow.partner_country}`,
        product_category: flow.product_category
      })
    }
  })

  return patterns.sort((a, b) => b.confidence_boost - a.confidence_boost)
}

// Calculate confidence boost based on pattern strength
function calculatePatternBoost(commonWords, flow) {
  let boost = commonWords.length * 5 // Base boost for keyword matches

  // Trade value bonus (higher value trades = more confidence)
  if (flow.trade_value_usd > 50000000) boost += 15 // $50M+ trades
  else if (flow.trade_value_usd > 10000000) boost += 10 // $10M+ trades
  else if (flow.trade_value_usd > 1000000) boost += 5 // $1M+ trades

  // Success probability bonus
  boost += (flow.success_probability || 0.75) * 10

  // Triangle savings bonus (proven USMCA success)
  if (flow.triangle_savings_realized > 0) boost += 8

  return Math.min(25, boost) // Cap at 25 points
}

// Store pattern learning for future use
async function storePatternLearning(patterns, selectedHSCode, businessType) {
  if (patterns.length === 0) return

  try {
    const learningData = {
      selected_hs_code: selectedHSCode,
      business_type: businessType,
      pattern_strength: patterns.length,
      top_keywords: patterns[0]?.common_keywords?.join(', ') || '',
      avg_trade_value: patterns.reduce((sum, p) => sum + (p.trade_value_usd || 0), 0) / patterns.length,
      avg_success_rate: patterns.reduce((sum, p) => sum + p.success_probability, 0) / patterns.length,
      total_patterns: patterns.length,
      created_at: new Date()
    }

    // Store aggregated patterns for faster future lookup
    await supabase
      .from('hs_pattern_intelligence')
      .upsert(learningData, { 
        onConflict: 'selected_hs_code,business_type',
        ignoreDuplicates: false 
      })

    console.log('✅ ML Patterns: Stored pattern intelligence for future suggestions')

  } catch (error) {
    console.warn('⚠️ ML Patterns: Failed to store patterns:', error.message)
  }
}

// Get ML-enhanced suggestions using learned patterns and 597K trade validation
export async function getMLEnhancedSuggestions(productDescription, businessType) {
  console.log(`🤖 ML Suggestions: Getting enhanced suggestions for "${productDescription}" (${businessType})`)

  try {
    // Step 1: Get base suggestions from our enhanced system
    let suggestions = await getEnhancedHSSuggestions(productDescription, businessType)

    // Step 2: Apply machine learning boosts from user patterns
    const learnedBoosts = await getLearnedBoosts(productDescription, businessType)
    
    // Step 3: Cross-reference with 597K trade_flows for validation
    const tradeValidated = await validateWithTradeFlows(suggestions, productDescription)

    // Step 4: Combine and rerank with ML intelligence
    const mlEnhanced = reRankWithML(suggestions, learnedBoosts, tradeValidated)

    console.log(`🎯 ML Enhanced: Returning ${mlEnhanced.length} suggestions with ML boosts`)
    return mlEnhanced

  } catch (error) {
    console.error('❌ ML Enhancement failed, falling back to base suggestions:', error)
    
    // Graceful degradation to base system
    return await getEnhancedHSSuggestions(productDescription, businessType)
  }
}

// Get learned pattern boosts from institutional memory
async function getLearnedBoosts(productDescription, businessType) {
  try {
    const userWords = extractKeywords(productDescription)
    
    // Query our learning database for similar patterns
    const { data: learningData, error } = await supabase
      .from('hs_code_learning')
      .select('product_description, selected_hs_code, business_type, pattern_keywords')
      .eq('business_type', businessType)
      .not('pattern_keywords', 'is', null)
      .limit(100)

    if (error || !learningData?.length) return {}

    const boosts = {}
    
    learningData.forEach(learning => {
      const learningWords = learning.pattern_keywords?.split(',') || []
      const commonWords = userWords.filter(word => 
        learningWords.some(lWord => lWord.trim().includes(word) || word.includes(lWord.trim()))
      )

      if (commonWords.length > 0) {
        const hsCode = learning.selected_hs_code
        const boost = commonWords.length * 12 // 12 points per matching keyword
        boosts[hsCode] = (boosts[hsCode] || 0) + boost
      }
    })

    console.log(`🧠 ML Boosts: Found learned patterns for ${Object.keys(boosts).length} HS codes`)
    return boosts

  } catch (error) {
    console.error('❌ ML Boosts failed:', error)
    return {}
  }
}

// Validate suggestions against 597K+ trade flows for real-world performance
async function validateWithTradeFlows(suggestions, productDescription) {
  const validationScores = {}
  
  for (const suggestion of suggestions.slice(0, 5)) { // Limit to top 5 for performance
    try {
      // Check how this HS code performs in our massive trade dataset
      const { data: flows, error } = await supabase
        .from('trade_flows')
        .select('trade_value_usd, triangle_savings_realized, success_probability, usmca_qualified')
        .eq('hs_code', suggestion.hs_code)
        .not('trade_value_usd', 'is', null)
        .order('trade_value_usd', { ascending: false })
        .limit(10)

      if (!error && flows.length > 0) {
        const totalTradeValue = flows.reduce((sum, f) => sum + (f.trade_value_usd || 0), 0)
        const avgSavings = flows.reduce((sum, f) => sum + (f.triangle_savings_realized || 0), 0) / flows.length
        const avgSuccess = flows.reduce((sum, f) => sum + (f.success_probability || 0.75), 0) / flows.length
        const usmcaCount = flows.filter(f => f.usmca_qualified).length
        
        // Calculate validation score based on real trade performance
        validationScores[suggestion.hs_code] = {
          trade_volume_score: Math.min(20, totalTradeValue / 10000000), // Max 20 points for $100M+ trades
          savings_score: Math.min(15, avgSavings / 500000), // Max 15 points for $5M+ savings
          success_score: avgSuccess * 15, // Max 15 points for 100% success
          usmca_score: (usmcaCount / flows.length) * 10, // Max 10 points for 100% USMCA qualified
          trade_count: flows.length,
          total_trade_value: totalTradeValue,
          avg_triangle_savings: avgSavings
        }
      }
    } catch (error) {
      console.warn(`⚠️ Trade validation failed for ${suggestion.hs_code}:`, error.message)
    }
  }

  console.log(`💰 Trade Validation: Validated ${Object.keys(validationScores).length} suggestions against trade flows`)
  return validationScores
}

// Rerank suggestions with ML intelligence and trade validation
function reRankWithML(suggestions, learnedBoosts, tradeValidation) {
  return suggestions.map(suggestion => {
    let finalConfidence = suggestion.confidence || 0
    const mlData = {}
    
    // Add learned pattern boost
    if (learnedBoosts[suggestion.hs_code]) {
      const boost = Math.min(20, learnedBoosts[suggestion.hs_code]) // Cap at 20
      finalConfidence += boost
      mlData.ml_boost = boost
      mlData.pattern_learned = true
    }
    
    // Add trade flow validation boost
    if (tradeValidation[suggestion.hs_code]) {
      const validation = tradeValidation[suggestion.hs_code]
      const tradeBoost = validation.trade_volume_score + validation.savings_score + 
                        validation.success_score + validation.usmca_score
      finalConfidence += tradeBoost
      
      mlData.trade_validation = validation
      mlData.trade_boost = tradeBoost
      mlData.proven_by_trades = true
    }
    
    return {
      ...suggestion,
      confidence: Math.min(100, Math.max(0, finalConfidence)),
      ml_data: mlData,
      source: suggestion.source + (mlData.pattern_learned ? '_ml_enhanced' : '')
    }
  }).sort((a, b) => b.confidence - a.confidence)
}

// Helper functions
function extractKeywords(text) {
  if (!text) return []
  
  return text.toLowerCase()
    .split(/[\s,.-]+/)
    .filter(word => word.length > 2 && !isStopWord(word))
    .map(word => word.trim())
}

function isStopWord(word) {
  const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use']
  return stopWords.includes(word)
}

function calculateWordSimilarity(word1, word2) {
  const longer = word1.length > word2.length ? word1 : word2
  const shorter = word1.length > word2.length ? word2 : word1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Backup learning storage when database fails
function storeLocalLearning(userInput, selectedHSCode, businessType, rejectedSuggestions) {
  if (typeof window === 'undefined') return

  try {
    const learningData = {
      userInput,
      selectedHSCode,
      businessType,
      rejectedSuggestions,
      timestamp: new Date().toISOString()
    }

    const existingLearning = JSON.parse(localStorage.getItem('triangle-ml-learning') || '[]')
    existingLearning.push(learningData)
    
    // Keep only latest 100 entries to avoid storage bloat
    localStorage.setItem('triangle-ml-learning', JSON.stringify(existingLearning.slice(-100)))
    
    console.log('✅ ML Learning: Stored locally as backup')
  } catch (error) {
    console.warn('⚠️ Local learning storage failed:', error)
  }
}