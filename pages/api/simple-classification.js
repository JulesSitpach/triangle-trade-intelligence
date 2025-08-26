// Simple business-type to HS code mapping
// Replaces the broken 1,090-line HS classifier with basic mapping
// CRITICAL: Classification is country-independent - same product gets same HS code regardless of supplier country

const BUSINESS_TYPE_HS_CODES = {
  'Electronics': [
    { code: '851712', description: 'Smartphones and mobile phones', confidence: 90 },
    { code: '847130', description: 'Portable computers and laptops', confidence: 88 },
    { code: '852872', description: 'Television receivers', confidence: 85 },
    { code: '851762', description: 'USB devices and accessories', confidence: 82 },
    { code: '847160', description: 'Computer keyboards and mice', confidence: 80 }
  ],
  
  'Manufacturing': [
    { code: '847989', description: 'Industrial machinery parts', confidence: 85 },
    { code: '730820', description: 'Steel structures and parts', confidence: 83 },
    { code: '848340', description: 'Industrial gears and transmissions', confidence: 80 },
    { code: '731815', description: 'Metal bolts, nuts, and fasteners', confidence: 78 },
    { code: '847950', description: 'Manufacturing equipment parts', confidence: 75 }
  ],
  
  'Medical': [
    { code: '901890', description: 'Medical instruments and devices', confidence: 92 },
    { code: '300490', description: 'Pharmaceutical preparations', confidence: 90 },
    { code: '401511', description: 'Medical gloves', confidence: 88 },
    { code: '902110', description: 'Orthopedic appliances', confidence: 85 },
    { code: '901819', description: 'Medical equipment and accessories', confidence: 82 }
  ],
  
  'Automotive': [
    { code: '870894', description: 'Automotive steering wheels and columns', confidence: 88 },
    { code: '870810', description: 'Car bumpers', confidence: 85 },
    { code: '851220', description: 'Car lighting equipment', confidence: 83 },
    { code: '870829', description: 'Car body parts', confidence: 80 },
    { code: '870899', description: 'Other automotive parts', confidence: 78 }
  ],
  
  'Textiles': [
    { code: '610910', description: 'T-shirts and tank tops', confidence: 90 },
    { code: '620520', description: 'Men\'s cotton shirts', confidence: 88 },
    { code: '611030', description: 'Cotton pullovers and sweaters', confidence: 85 },
    { code: '620342', description: 'Cotton trousers (men\'s)', confidence: 82 },
    { code: '630790', description: 'Other textile articles', confidence: 80 }
  ],
  
  'Food': [
    { code: '210690', description: 'Food preparations', confidence: 85 },
    { code: '190590', description: 'Bread and bakery products', confidence: 83 },
    { code: '220290', description: 'Non-alcoholic beverages', confidence: 80 },
    { code: '160100', description: 'Meat preparations', confidence: 78 },
    { code: '200799', description: 'Fruit preparations', confidence: 75 }
  ],
  
  'Construction': [
    { code: '730890', description: 'Steel construction materials', confidence: 85 },
    { code: '680291', description: 'Stone construction materials', confidence: 83 },
    { code: '681091', description: 'Prefabricated building elements', confidence: 80 },
    { code: '732690', description: 'Construction hardware', confidence: 78 },
    { code: '847982', description: 'Construction machinery parts', confidence: 75 }
  ],
  
  'Energy': [
    { code: '854140', description: 'Solar cells and modules', confidence: 88 },
    { code: '850231', description: 'Wind generator parts', confidence: 85 },
    { code: '271019', description: 'Energy products', confidence: 83 },
    { code: '847989', description: 'Energy equipment parts', confidence: 80 },
    { code: '854370', description: 'Energy transmission equipment', confidence: 78 }
  ],
  
  'Chemicals': [
    { code: '390799', description: 'Chemical products and polymers', confidence: 85 },
    { code: '380894', description: 'Industrial chemical preparations', confidence: 83 },
    { code: '290545', description: 'Chemical compounds', confidence: 80 },
    { code: '392690', description: 'Plastic products', confidence: 78 },
    { code: '340219', description: 'Chemical cleaning products', confidence: 75 }
  ],
  
  'Retail': [
    { code: '950300', description: 'Consumer toys and games', confidence: 85 },
    { code: '392690', description: 'Consumer plastic products', confidence: 83 },
    { code: '630260', description: 'Consumer household textiles', confidence: 80 },
    { code: '961900', description: 'Consumer personal items', confidence: 78 },
    { code: '890790', description: 'Consumer goods', confidence: 75 }
  ]
}

// Product description to HS code matching
const PRODUCT_KEYWORDS = {
  // Electronics
  'smartphone': { code: '851712', description: 'Smartphones and mobile phones', confidence: 95 },
  'phone': { code: '851712', description: 'Mobile phones', confidence: 90 },
  'laptop': { code: '847130', description: 'Portable computers', confidence: 92 },
  'computer': { code: '847130', description: 'Computers and parts', confidence: 88 },
  'television': { code: '852872', description: 'Television receivers', confidence: 90 },
  'tv': { code: '852872', description: 'Television equipment', confidence: 88 },
  'usb': { code: '851762', description: 'USB devices and accessories', confidence: 85 },
  'keyboard': { code: '847160', description: 'Computer keyboards', confidence: 85 },
  'mouse': { code: '847160', description: 'Computer mice', confidence: 85 },
  
  // Medical
  'medical': { code: '901890', description: 'Medical instruments', confidence: 90 },
  'pharmaceutical': { code: '300490', description: 'Pharmaceutical preparations', confidence: 92 },
  'gloves': { code: '401511', description: 'Medical/protective gloves', confidence: 88 },
  'surgical': { code: '901890', description: 'Surgical instruments', confidence: 90 },
  
  // Automotive
  'bumper': { code: '870810', description: 'Car bumpers', confidence: 90 },
  'steering': { code: '870894', description: 'Steering components', confidence: 88 },
  'car': { code: '870899', description: 'Automotive parts', confidence: 85 },
  'automotive': { code: '870899', description: 'Automotive components', confidence: 85 },
  
  // Textiles
  'shirt': { code: '620520', description: 'Men\'s cotton shirts', confidence: 92 },
  't-shirt': { code: '610910', description: 'T-shirts and tank tops', confidence: 88 },
  'pants': { code: '620342', description: 'Cotton trousers (men\'s)', confidence: 85 },
  'trousers': { code: '620342', description: 'Cotton trousers (men\'s)', confidence: 85 },
  'sweater': { code: '611030', description: 'Cotton pullovers and sweaters', confidence: 85 },
  'cotton': { code: '620520', description: 'Cotton apparel', confidence: 88 },
  'fabric': { code: '630790', description: 'Other textile articles', confidence: 82 },
  
  // Manufacturing
  'machinery': { code: '847989', description: 'Industrial machinery parts', confidence: 85 },
  'steel': { code: '730820', description: 'Steel products', confidence: 83 },
  'metal': { code: '731815', description: 'Metal products', confidence: 80 },
  'industrial': { code: '847989', description: 'Industrial equipment', confidence: 82 }
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { businessType, productDescription, supplierCountry } = req.body
    
    // Simple validation
    if (!businessType) {
      return res.status(400).json({ error: 'Business type is required' })
    }
    
    // NOTE: supplierCountry is intentionally ignored for classification
    // HS codes are determined solely by product characteristics, not origin country
    
    let classification = null
    let source = 'business_type_mapping'
    
    // First try to match by product description keywords
    if (productDescription && productDescription.length > 3) {
      const lowerDescription = productDescription.toLowerCase()
      
      for (const [keyword, hsData] of Object.entries(PRODUCT_KEYWORDS)) {
        if (lowerDescription.includes(keyword)) {
          classification = {
            hsCode: hsData.code,
            description: hsData.description,
            confidence: hsData.confidence
          }
          source = 'product_keyword_matching'
          break
        }
      }
    }
    
    // Fallback to business type mapping
    if (!classification) {
      const businessTypeCodes = BUSINESS_TYPE_HS_CODES[businessType]
      
      if (businessTypeCodes && businessTypeCodes.length > 0) {
        // Return the first (highest confidence) code for this business type
        const topCode = businessTypeCodes[0]
        classification = {
          hsCode: topCode.code,
          description: topCode.description,
          confidence: topCode.confidence
        }
      } else {
        // Generic fallback
        classification = {
          hsCode: '847989',
          description: 'General manufactured products',
          confidence: 70
        }
        source = 'generic_fallback'
      }
    }
    
    // Add disclaimer
    const disclaimer = 'ESTIMATE - NOT VERIFIED DATA. Verify with customs authorities.'
    
    const response = {
      classification: {
        ...classification,
        disclaimer
      },
      businessType,
      productDescription,
      source,
      allSuggestions: BUSINESS_TYPE_HS_CODES[businessType] || [],
      timestamp: new Date().toISOString()
    }
    
    res.status(200).json(response)
    
  } catch (error) {
    console.error('Simple classification error:', error)
    
    // Fallback response
    res.status(200).json({
      classification: {
        hsCode: '847989',
        description: 'General manufactured products (system fallback)',
        confidence: 60,
        disclaimer: 'ESTIMATE - NOT VERIFIED DATA. Verify with customs authorities.'
      },
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    })
  }
}