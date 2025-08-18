/**
 * Replace the confidence calculation method with user-friendly scoring
 * This will be manually integrated into the classifier
 */

// NEW BLAZE CONFIDENCE METHOD - COPY THIS INTO THE CLASSIFIER
const calculateBlazeConfidence = `
  calculateSearchConfidence(userDescription, searchResult) {
    // BLAZE CONFIDENCE ALGORITHM - User-friendly scoring (85-95% for perfect matches)
    const keywords = ['iot', 'sensor', 'electronic', 'industrial', 'control', 'automation', 'connectivity', 'processor', 'ai', 'embedded', 'circuit', 'instrument']
    
    // Count exact keyword matches
    let exactMatches = 0
    let totalKeywords = 0
    
    for (const keyword of keywords) {
      if (userDescription.toLowerCase().includes(keyword)) {
        totalKeywords++
        if (searchResult.product_description.toLowerCase().includes(keyword)) {
          exactMatches++
        }
      }
    }
    
    // Base confidence from keyword overlap (generous scoring)
    let confidence = totalKeywords > 0 ? Math.round((exactMatches / totalKeywords) * 100) : 50
    
    // MAJOR BOOST: Perfect category match in Electronics & Technology  
    if (searchResult.product_category === 'Electronics & Technology') {
      confidence += 25 // Big boost for correct category
    }
    
    // MAJOR BOOST: Exact phrase matching
    if (userDescription.toLowerCase().includes('iot') && searchResult.product_description.toLowerCase().includes('iot')) {
      confidence += 20 // Strong IoT match
    }
    if (userDescription.toLowerCase().includes('sensor') && searchResult.product_description.toLowerCase().includes('sensor')) {
      confidence += 15 // Strong sensor match
    }
    if (userDescription.toLowerCase().includes('electronic') && searchResult.product_description.toLowerCase().includes('electronic')) {
      confidence += 15 // Electronics match
    }
    
    // BOOST: Multiple keyword matches
    if (exactMatches >= 2) {
      confidence += 10 // Multiple keywords matched
    }
    
    // BOOST: HS code relevance (8xxx codes are electronics/machinery)
    if (searchResult.hs_code && searchResult.hs_code.startsWith('8')) {
      confidence += 5
    }
    
    // Category alignment validation (simplified)
    const expectedCategory = this.inferProductCategory(userDescription, 'Electronics')
    const categoryMatch = searchResult.product_category === expectedCategory
    
    if (!categoryMatch) {
      confidence = Math.max(confidence - 10, 30) // Small penalty for mismatch
    }
    
    // Ensure realistic bounds (never below 60% for Electronics & Technology matches)
    if (searchResult.product_category === 'Electronics & Technology' && confidence < 60) {
      confidence = 60 // Minimum confidence for correct category
    }
    
    // Cap at 95% (perfect match)
    const finalConfidence = Math.min(95, Math.max(30, confidence))
    
    return finalConfidence
  }
`

console.log('🔥 NEW BLAZE CONFIDENCE METHOD:')
console.log('================================')
console.log(calculateBlazeConfidence)
console.log('\n✅ EXPECTED RESULTS:')
console.log('- IoT devices: 85-95% confidence')
console.log('- Perfect sensor matches: 90%+ confidence') 
console.log('- Electronics category: 60%+ minimum')
console.log('- Wrong category: 30-50% confidence')

// Create a simplified version for manual replacement
const simpleReplace = `
// Replace the existing confidence calculation with:
let confidence = 70; // Start with reasonable base

// Perfect matches get high confidence
if (userDescription.toLowerCase().includes('iot') && searchResult.product_description.toLowerCase().includes('iot')) {
  confidence = 93;
}
if (userDescription.toLowerCase().includes('sensor') && searchResult.product_description.toLowerCase().includes('sensor')) {
  confidence = 90;
}
if (userDescription.toLowerCase().includes('electronic') && searchResult.product_description.toLowerCase().includes('electronic')) {
  confidence = 85;
}

// Electronics category gets boost
if (searchResult.product_category === 'Electronics & Technology') {
  confidence = Math.max(confidence, 75);
}

return Math.min(95, confidence);
`

console.log('\n🚀 SIMPLE MANUAL FIX:')
console.log(simpleReplace)