/**
 * Transparent HS Classifier with Fallback Intelligence
 * Strategy: Show fallback results + let users improve accuracy
 */

import { logInfo, logWarn } from './production-logger.js'

// Industry classification patterns with confidence scoring
const INDUSTRY_PATTERNS = {
  Electronics: {
    keywords: [
      'electronic', 'electronics', 'phone', 'smartphone', 'computer', 'laptop', 'tablet',
      'circuit', 'semiconductor', 'processor', 'memory', 'storage', 'cable', 'wire',
      'television', 'tv', 'monitor', 'display', 'screen', 'speaker', 'headphone',
      'microphone', 'camera', 'battery', 'charger', 'adapter', 'inverter', 'sensor',
      'led', 'lcd', 'oled', 'chip', 'microchip', 'integrated', 'pcb', 'component'
    ],
    hsCodeRange: '84xx-85xx',
    fallbackHS: '8517', // Telecommunications equipment
    tradeValue: 9800000000, // $9.8B from our data
    description: 'Electronic equipment and telecommunications'
  },
  
  Medical: {
    keywords: [
      'medical', 'pharmaceutical', 'medicine', 'drug', 'vaccine', 'surgical', 'hospital',
      'diagnostic', 'therapy', 'treatment', 'instrument', 'device', 'equipment',
      'syringe', 'needle', 'bandage', 'gauze', 'stethoscope', 'thermometer',
      'x-ray', 'ultrasound', 'mri', 'ct', 'scanner', 'monitor', 'ventilator',
      'defibrillator', 'pacemaker', 'implant', 'prosthetic', 'wheelchair'
    ],
    hsCodeRange: '30xx, 90xx',
    fallbackHS: '3004', // Pharmaceutical preparations
    tradeValue: 850000000, // Estimated
    description: 'Medical equipment and pharmaceuticals'
  },
  
  Automotive: {
    keywords: [
      'automotive', 'car', 'vehicle', 'auto', 'truck', 'motorcycle', 'engine', 'motor',
      'transmission', 'brake', 'tire', 'wheel', 'battery', 'alternator', 'starter',
      'radiator', 'exhaust', 'muffler', 'suspension', 'shock', 'strut', 'bearing',
      'clutch', 'gear', 'axle', 'differential', 'carburetor', 'fuel', 'oil', 'filter'
    ],
    hsCodeRange: '87xx',
    fallbackHS: '8708', // Vehicle parts
    tradeValue: 2580000000, // $2.58B from our data
    description: 'Automotive vehicles and parts'
  },
  
  Textiles: {
    keywords: [
      'textile', 'fabric', 'clothing', 'apparel', 'garment', 'shirt', 'pants', 'dress',
      'jacket', 'coat', 'sweater', 't-shirt', 'jeans', 'shorts', 'skirt', 'blouse',
      'cotton', 'polyester', 'wool', 'silk', 'linen', 'denim', 'leather', 'synthetic',
      'thread', 'yarn', 'fiber', 'material', 'cloth', 'woven', 'knit', 'embroidered'
    ],
    hsCodeRange: '50xx-63xx',
    fallbackHS: '6203', // Men\'s clothing
    tradeValue: 2510000000, // $2.51B from our data
    description: 'Textiles and apparel'
  },
  
  Steel: {
    keywords: [
      'steel', 'iron', 'metal', 'alloy', 'stainless', 'carbon', 'aluminum', 'copper',
      'brass', 'bronze', 'zinc', 'nickel', 'titanium', 'rod', 'bar', 'sheet', 'plate',
      'pipe', 'tube', 'wire', 'coil', 'beam', 'angle', 'channel', 'structural',
      'reinforcement', 'rebar', 'mesh', 'fastener', 'bolt', 'nut', 'screw', 'nail'
    ],
    hsCodeRange: '72xx-76xx',
    fallbackHS: '7208', // Steel sheets
    tradeValue: 2750000000, // $2.75B from our data
    description: 'Steel and metal products'
  },
  
  Machinery: {
    keywords: [
      'machinery', 'machine', 'equipment', 'tool', 'pump', 'compressor', 'generator',
      'turbine', 'conveyor', 'crane', 'forklift', 'excavator', 'bulldozer', 'tractor',
      'drill', 'lathe', 'mill', 'press', 'cutting', 'welding', 'grinding', 'polishing',
      'industrial', 'manufacturing', 'production', 'assembly', 'packaging', 'printing'
    ],
    hsCodeRange: '84xx',
    fallbackHS: '8481', // Industrial machinery
    tradeValue: 1200000000, // Estimated
    description: 'Industrial machinery and equipment'
  },
  
  Chemicals: {
    keywords: [
      'chemical', 'polymer', 'plastic', 'resin', 'compound', 'solution', 'acid', 'base',
      'solvent', 'catalyst', 'adhesive', 'coating', 'paint', 'dye', 'pigment', 'ink',
      'fertilizer', 'pesticide', 'herbicide', 'fungicide', 'cleaning', 'detergent',
      'soap', 'cosmetic', 'perfume', 'essential', 'oil', 'wax', 'gel', 'cream'
    ],
    hsCodeRange: '28xx-39xx',
    fallbackHS: '3901', // Polymer products
    tradeValue: 900000000, // Estimated
    description: 'Chemicals and plastics'
  },
  
  Consumer: {
    keywords: [
      'furniture', 'home', 'household', 'kitchen', 'bedroom', 'living', 'office',
      'chair', 'table', 'desk', 'bed', 'sofa', 'cabinet', 'shelf', 'mattress',
      'appliance', 'refrigerator', 'washing', 'dryer', 'dishwasher', 'microwave',
      'vacuum', 'fan', 'heater', 'air', 'conditioning', 'toy', 'game', 'sport',
      'luggage', 'bag', 'backpack', 'suitcase', 'wallet', 'purse', 'watch', 'jewelry'
    ],
    hsCodeRange: '94xx, 42xx, 71xx',
    fallbackHS: '9404', // Furniture and bedding
    tradeValue: 500000000, // Estimated
    description: 'Consumer goods and furniture'
  }
}

/**
 * Classify product with transparent fallback approach
 */
export function classifyProductWithFallback(productDescription, businessType = null) {
  logInfo('Classifying product with fallback approach', { 
    product: productDescription?.substring(0, 50),
    businessType 
  })
  
  if (!productDescription) {
    return createFallbackResult('Electronics', 'low', 'No product description provided')
  }
  
  const cleanDescription = productDescription.toLowerCase().trim()
  let bestMatch = null
  let highestScore = 0
  let matchedKeywords = []
  
  // Score each industry based on keyword matches
  for (const [industryName, industry] of Object.entries(INDUSTRY_PATTERNS)) {
    let score = 0
    let keywords = []
    
    for (const keyword of industry.keywords) {
      if (cleanDescription.includes(keyword.toLowerCase())) {
        score += 1
        keywords.push(keyword)
        
        // Boost score for exact matches
        if (cleanDescription === keyword.toLowerCase()) {
          score += 3
        }
        
        // Boost score for word boundary matches
        const wordBoundary = new RegExp(`\\b${keyword.toLowerCase()}\\b`)
        if (wordBoundary.test(cleanDescription)) {
          score += 1
        }
      }
    }
    
    // Business type alignment bonus
    if (businessType && businessType.toLowerCase().includes(industryName.toLowerCase())) {
      score += 2
      keywords.push(`business_type:${businessType}`)
    }
    
    if (score > highestScore) {
      highestScore = score
      bestMatch = industryName
      matchedKeywords = keywords
    }
  }
  
  // Determine confidence level
  let confidence = 'low'
  if (highestScore >= 5) confidence = 'high'
  else if (highestScore >= 3) confidence = 'medium'
  
  // If no good match, default to Electronics (largest trade volume)
  if (!bestMatch || highestScore === 0) {
    logWarn('No industry match found, defaulting to Electronics', { 
      product: productDescription,
      score: highestScore 
    })
    return createFallbackResult('Electronics', 'low', 'No clear industry match - defaulting to largest category')
  }
  
  const industry = INDUSTRY_PATTERNS[bestMatch]
  logInfo('Product classified', {
    industry: bestMatch,
    confidence,
    score: highestScore,
    keywords: matchedKeywords.slice(0, 5)
  })
  
  return {
    industry: bestMatch,
    confidence,
    hsCode: industry.fallbackHS,
    hsCodeRange: industry.hsCodeRange,
    description: industry.description,
    tradeValue: industry.tradeValue,
    matchedKeywords: matchedKeywords.slice(0, 10),
    score: highestScore,
    fallbackReason: null,
    userCanImprove: true,
    message: confidence === 'high' 
      ? `Classified as ${bestMatch} with high confidence`
      : `Classified as ${bestMatch} (fallback - you can improve this)`
  }
}

function createFallbackResult(industry, confidence, reason) {
  const industryData = INDUSTRY_PATTERNS[industry]
  return {
    industry,
    confidence,
    hsCode: industryData.fallbackHS,
    hsCodeRange: industryData.hsCodeRange,
    description: industryData.description,
    tradeValue: industryData.tradeValue,
    matchedKeywords: [],
    score: 0,
    fallbackReason: reason,
    userCanImprove: true,
    message: `Classified as ${industry} (fallback) - please help us improve`
  }
}

/**
 * Store user correction for future learning
 */
export async function storeUserCorrection(originalProduct, classifiedIndustry, userHSCode, userIndustry = null) {
  logInfo('User correction received', {
    product: originalProduct?.substring(0, 50),
    classified: classifiedIndustry,
    userHS: userHSCode,
    userIndustry
  })
  
  // TODO: Store in learning database for future improvements
  // For now, just log for analysis
  
  return {
    success: true,
    message: 'Thank you for improving our classification accuracy!'
  }
}

/**
 * Get fallback trade intelligence for industry
 */
export function getFallbackTradeData(industry) {
  const industryData = INDUSTRY_PATTERNS[industry]
  if (!industryData) return null
  
  return {
    industry,
    hsCode: industryData.fallbackHS,
    tradeValue: industryData.tradeValue,
    description: industryData.description,
    routes: [
      `China → Mexico → USA (${industry})`,
      `India → Mexico → USA (${industry})`,
      `Vietnam → Mexico → USA (${industry})`
    ],
    savingsPotential: Math.round(industryData.tradeValue * 0.25), // 25% tariff savings
    confidence: 'estimated'
  }
}

export default { classifyProductWithFallback, storeUserCorrection, getFallbackTradeData }