// Enhanced HS code suggestions with confidence scoring and smart fallback
// Integrates with existing Triangle Intelligence architecture
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function getEnhancedHSSuggestions(productDescription, businessType) {
  console.log(`🔍 Enhanced HS suggestions for: "${productDescription}" (${businessType})`)
  
  try {
    // Step 1: Search comtrade_reference database (our 5.6K enhanced codes)
    let suggestions = await searchComtradeReference(productDescription, businessType)
    
    // Step 2: Calculate confidence scores for database matches
    suggestions = suggestions.map(s => ({
      ...s,
      confidence: calculateConfidence(productDescription, s.product_description, businessType),
      source: 'database_enhanced'
    }))
    
    // Step 3: If confidence is low, add smart fallback suggestions
    const bestMatch = suggestions[0]
    if (!bestMatch || bestMatch.confidence < 60) {
      console.log('🔧 Low confidence database match, adding smart fallbacks...')
      const smartSuggestions = getSmartFallbacks(productDescription, businessType)
      suggestions = [...smartSuggestions, ...suggestions]
    }
    
    // Step 4: Sort by confidence and limit to top 5
    suggestions.sort((a, b) => b.confidence - a.confidence)
    const topSuggestions = suggestions.slice(0, 5)
    
    console.log(`✅ Returning ${topSuggestions.length} enhanced suggestions, best: ${topSuggestions[0]?.confidence || 0}%`)
    return topSuggestions
    
  } catch (error) {
    console.error('❌ Enhanced HS suggestions error:', error)
    // Fallback to smart suggestions only
    return getSmartFallbacks(productDescription, businessType)
  }
}

// Calculate confidence based on industry match and keyword overlap
function calculateConfidence(userInput, description, businessType) {
  if (!userInput || !description) return 0
  
  const userWords = userInput.toLowerCase().split(/\s+/)
  const descWords = description.toLowerCase().split(/\s+/)
  let score = 0
  
  // Industry-specific bonuses (aligned with our business types)
  if (businessType === 'Automotive') {
    if (description.includes('motor') || description.includes('vehicle') || description.includes('automotive')) score += 30
    if (description.includes('brake') || description.includes('engine') || description.includes('transmission')) score += 20
  }
  
  if (businessType === 'Electronics') {
    if (description.includes('electronic') || description.includes('semiconductor') || description.includes('circuit')) score += 30
    if (description.includes('battery') || description.includes('display') || description.includes('component')) score += 20
  }
  
  if (businessType === 'Energy & Solar') {
    if (description.includes('solar') || description.includes('photovoltaic') || description.includes('energy')) score += 30
    if (description.includes('inverter') || description.includes('battery') || description.includes('panel')) score += 20
  }
  
  if (businessType === 'Manufacturing') {
    if (description.includes('machined') || description.includes('precision') || description.includes('component')) score += 25
    if (description.includes('steel') || description.includes('metal') || description.includes('part')) score += 15
  }
  
  // Word matching with fuzzy logic
  userWords.forEach(word => {
    if (word.length < 3) return // Skip short words
    
    descWords.forEach(descWord => {
      // Exact match
      if (descWord === word) score += 20
      // Contains match
      else if (descWord.includes(word) || word.includes(descWord)) score += 10
      // Similar words (basic similarity)
      else if (calculateWordSimilarity(word, descWord) > 0.7) score += 5
    })
  })
  
  // Penalty for obvious mismatches
  const userLower = userInput.toLowerCase()
  const descLower = description.toLowerCase()
  
  if (userLower.includes('machined') && descLower.includes('wood')) score -= 40
  if (userLower.includes('electronic') && descLower.includes('animal')) score -= 40
  if (userLower.includes('cnc') && descLower.includes('plant')) score -= 40
  if (userLower.includes('automotive') && descLower.includes('textile')) score -= 30
  
  return Math.max(0, Math.min(100, score))
}

// Simple word similarity calculation
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

// Smart fallback suggestions based on keywords and business type
function getSmartFallbacks(productDescription, businessType) {
  const keywords = productDescription.toLowerCase()
  const suggestions = []
  
  // Automotive Industry - Enhanced with our 38 new codes
  if (businessType === 'Automotive') {
    if (keywords.includes('brake')) {
      suggestions.push({ 
        hs_code: '870830', 
        product_description: 'Brakes and servo-brakes; parts thereof', 
        confidence: 90, 
        source: 'smart_match_automotive' 
      })
    }
    if (keywords.includes('engine')) {
      suggestions.push({ 
        hs_code: '840790', 
        product_description: 'Spark-ignition reciprocating piston engines, parts', 
        confidence: 85, 
        source: 'smart_match_automotive' 
      })
    }
    if (keywords.includes('machined') || keywords.includes('cnc') || keywords.includes('precision')) {
      suggestions.push({ 
        hs_code: '870899', 
        product_description: 'Other parts and accessories of motor vehicles', 
        confidence: 85, 
        source: 'smart_match_cnc' 
      })
    }
    if (keywords.includes('transmission') || keywords.includes('gearbox')) {
      suggestions.push({ 
        hs_code: '870840', 
        product_description: 'Gear boxes and parts thereof', 
        confidence: 90, 
        source: 'smart_match_automotive' 
      })
    }
    if (keywords.includes('steering')) {
      suggestions.push({ 
        hs_code: '870894', 
        product_description: 'Steering wheels, columns and boxes', 
        confidence: 90, 
        source: 'smart_match_automotive' 
      })
    }
    if (keywords.includes('suspension') || keywords.includes('shock')) {
      suggestions.push({ 
        hs_code: '870880', 
        product_description: 'Suspension shock-absorbers', 
        confidence: 90, 
        source: 'smart_match_automotive' 
      })
    }
    if (keywords.includes('radiator') || keywords.includes('cooling')) {
      suggestions.push({ 
        hs_code: '870891', 
        product_description: 'Radiators and parts thereof', 
        confidence: 85, 
        source: 'smart_match_automotive' 
      })
    }
    if (keywords.includes('clutch')) {
      suggestions.push({ 
        hs_code: '870893', 
        product_description: 'Clutches and parts thereof', 
        confidence: 90, 
        source: 'smart_match_automotive' 
      })
    }
  }
  
  // Electronics Industry
  if (businessType === 'Electronics') {
    if (keywords.includes('semiconductor') || keywords.includes('chip')) {
      suggestions.push({ 
        hs_code: '854140', 
        product_description: 'Photosensitive semiconductor devices, including photovoltaic cells', 
        confidence: 95, 
        source: 'smart_match_electronics' 
      })
    }
    if (keywords.includes('circuit') || keywords.includes('pcb')) {
      suggestions.push({ 
        hs_code: '853400', 
        product_description: 'Printed circuits', 
        confidence: 90, 
        source: 'smart_match_electronics' 
      })
    }
    if (keywords.includes('battery') || keywords.includes('lithium')) {
      suggestions.push({ 
        hs_code: '850760', 
        product_description: 'Lithium-ion accumulators', 
        confidence: 90, 
        source: 'smart_match_electronics' 
      })
    }
    if (keywords.includes('display') || keywords.includes('monitor')) {
      suggestions.push({ 
        hs_code: '852850', 
        product_description: 'Monitors and projectors, not incorporating television reception apparatus', 
        confidence: 85, 
        source: 'smart_match_electronics' 
      })
    }
    if (keywords.includes('cable') || keywords.includes('wire')) {
      suggestions.push({ 
        hs_code: '854420', 
        product_description: 'Coaxial cable and other coaxial electric conductors', 
        confidence: 80, 
        source: 'smart_match_electronics' 
      })
    }
  }
  
  // Energy & Solar Industry
  if (businessType === 'Energy & Solar') {
    if ((keywords.includes('solar') && keywords.includes('panel')) || keywords.includes('photovoltaic')) {
      suggestions.push({ 
        hs_code: '854140', 
        product_description: 'Photosensitive semiconductor devices, including photovoltaic cells', 
        confidence: 95, 
        source: 'smart_match_solar' 
      })
    }
    if ((keywords.includes('battery') && keywords.includes('management')) || keywords.includes('bms')) {
      suggestions.push({ 
        hs_code: '850760', 
        product_description: 'Lithium-ion accumulators', 
        confidence: 90, 
        source: 'smart_match_solar' 
      })
    }
    if (keywords.includes('inverter')) {
      suggestions.push({ 
        hs_code: '850440', 
        product_description: 'Static converters', 
        confidence: 95, 
        source: 'smart_match_solar' 
      })
    }
    if (keywords.includes('wind') && keywords.includes('turbine')) {
      suggestions.push({ 
        hs_code: '850231', 
        product_description: 'Wind-powered generating sets', 
        confidence: 95, 
        source: 'smart_match_wind' 
      })
    }
  }
  
  // Manufacturing & Industrial
  if (businessType === 'Manufacturing' || keywords.includes('industrial')) {
    if (keywords.includes('steel') && keywords.includes('machined')) {
      suggestions.push({ 
        hs_code: '732690', 
        product_description: 'Other articles of iron or steel', 
        confidence: 75, 
        source: 'smart_match_manufacturing' 
      })
    }
    if (keywords.includes('aluminum') && keywords.includes('machined')) {
      suggestions.push({ 
        hs_code: '761690', 
        product_description: 'Other articles of aluminum', 
        confidence: 75, 
        source: 'smart_match_manufacturing' 
      })
    }
    if (keywords.includes('bearing')) {
      suggestions.push({ 
        hs_code: '848210', 
        product_description: 'Ball bearings', 
        confidence: 90, 
        source: 'smart_match_manufacturing' 
      })
    }
    if (keywords.includes('valve')) {
      suggestions.push({ 
        hs_code: '848180', 
        product_description: 'Other taps, cocks, valves and similar appliances', 
        confidence: 85, 
        source: 'smart_match_manufacturing' 
      })
    }
  }
  
  console.log(`🎯 Generated ${suggestions.length} smart fallback suggestions for ${businessType}`)
  return suggestions
}

// Search our enhanced comtrade_reference database
async function searchComtradeReference(productDescription, businessType) {
  try {
    console.log('🔍 Searching comtrade_reference database...')
    
    // Multi-strategy database search
    const searchTerms = productDescription.toLowerCase().split(/\s+/).filter(term => term.length > 2)
    
    // Strategy 1: Direct text search
    const { data: directMatches, error: directError } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, product_category')
      .or(searchTerms.map(term => `product_description.ilike.%${term}%`).join(','))
      .limit(10)
    
    if (directError) {
      console.error('Direct search error:', directError)
    }
    
    // Strategy 2: Category-based search for business type
    let categoryMatches = []
    if (businessType === 'Automotive') {
      const { data, error } = await supabase
        .from('comtrade_reference')
        .select('hs_code, product_description, product_category')
        .like('hs_code', '87%')
        .limit(15)
      
      if (!error && data) categoryMatches = data
    }
    
    // Combine and deduplicate results
    const allMatches = [...(directMatches || []), ...categoryMatches]
    const uniqueMatches = allMatches.reduce((acc, current) => {
      const exists = acc.find(item => item.hs_code === current.hs_code)
      if (!exists) acc.push(current)
      return acc
    }, [])
    
    console.log(`📊 Database search found ${uniqueMatches.length} matches`)
    return uniqueMatches
    
  } catch (error) {
    console.error('❌ Database search failed:', error)
    return []
  }
}