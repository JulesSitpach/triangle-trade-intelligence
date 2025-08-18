/**
 * 🚢 SHIPPO SHIPPING API
 * Real-time shipping rates and transit times
 * Restored original working version
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { origin, destination, weight, dimensions } = req.body
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Missing origin or destination' })
    }
    
    console.log('🚢 SHIPPO API: Fetching shipping rates', { origin, destination, weight })
    
    // Check if we should use real API or fallback
    const useRealAPI = process.env.SHIPPO_API_KEY && process.env.USE_MOCK_APIS !== 'true' && process.env.USE_MOCK !== 'true'
    
    if (useRealAPI) {
      // Make real Shippo API call
      const addressFrom = normalizeAddress(origin)
      const addressTo = normalizeAddress(destination)
      const shipmentData = {
        address_from: addressFrom,
        address_to: addressTo,
        parcels: [{
          length: dimensions?.length || '10',
          width: dimensions?.width || '10', 
          height: dimensions?.height || '10',
          distance_unit: 'in',
          weight: weight || '1',
          mass_unit: 'lb'
        }],
        async: false
      }
      
      console.log('📡 Making real Shippo API call...')
      console.log('📦 Shippo request data:', JSON.stringify(shipmentData, null, 2))
      
      const shippoResponse = await fetch('https://api.goshippo.com/shipments/', {
        method: 'POST',
        headers: {
          'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipmentData),
        timeout: 10000 // 10 second timeout
      })
      
      if (!shippoResponse.ok) {
        throw new Error(`Shippo API error: ${shippoResponse.status}`)
      }
      
      const shippoData = await shippoResponse.json()
      console.log('📦 Raw Shippo response:', JSON.stringify(shippoData, null, 2))
      
      // Process Shippo response
      const shippingOptions = processShippoRates(shippoData.rates || [])
      
      console.log('✅ Real Shippo data retrieved', { origin, destination, options: shippingOptions.length, rawRates: shippoData.rates?.length || 0 })
      
      return res.status(200).json({
        success: true,
        source: 'SHIPPO_API',
        origin: origin,
        destination: destination,
        shippingOptions: shippingOptions,
        transitAnalysis: analyzeTransitOptions(shippingOptions, origin, destination),
        timestamp: new Date().toISOString(),
        cacheFor: 14400000 // 4 hour cache
      })
      
    } else {
      // Use fallback shipping data
      console.log('📊 Using fallback shipping data (API disabled)')
      
      const fallbackRates = generateFallbackShippingRates(origin, destination, weight)
      
      return res.status(200).json({
        success: true,
        source: 'FALLBACK_DATA',
        origin: origin,
        destination: destination,
        shippingOptions: fallbackRates,
        transitAnalysis: analyzeTransitOptions(fallbackRates, origin, destination),
        timestamp: new Date().toISOString(),
        cacheFor: 14400000, // 4 hour cache
        note: 'Using fallback data - enable SHIPPO_API_KEY for live rates'
      })
    }
    
  } catch (error) {
    console.error('❌ Shipping API error:', error)
    
    // Return emergency fallback
    const emergencyRates = [{
      carrier: 'ESTIMATED',
      service: 'Standard',
      rate: '2500.00',
      currency: 'USD',
      transitTime: '14-21 days',
      reliability: 'ESTIMATED'
    }]
    
    return res.status(200).json({
      success: false,
      error: error.message,
      fallback: emergencyRates,
      source: 'EMERGENCY_FALLBACK',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Normalize address for Shippo API
 */
function normalizeAddress(location) {
  // Handle common location formats
  if (typeof location === 'string') {
    const locationMap = {
      // Asian origins
      'CN': { country: 'CN', city: 'Shanghai' },
      'China': { country: 'CN', city: 'Shanghai' },
      'IN': { country: 'IN', city: 'Mumbai' },
      'India': { country: 'IN', city: 'Mumbai' },
      'VN': { country: 'VN', city: 'Ho Chi Minh City' },
      'Vietnam': { country: 'VN', city: 'Ho Chi Minh City' },
      'KR': { country: 'KR', city: 'Seoul' },
      'Korea': { country: 'KR', city: 'Seoul' },
      'JP': { country: 'JP', city: 'Tokyo' },
      'Japan': { country: 'JP', city: 'Tokyo' },
      
      // USMCA partners
      'MX': { country: 'MX', city: 'Mexico City' },
      'Mexico': { country: 'MX', city: 'Mexico City' },
      'CA': { country: 'CA', city: 'Toronto' },
      'Canada': { country: 'CA', city: 'Toronto' },
      
      // US destinations
      'US': { country: 'US', city: 'Los Angeles', state: 'CA', zip: '90210' },
      'USA': { country: 'US', city: 'Los Angeles', state: 'CA', zip: '90210' }
    }
    
    return locationMap[location] || { country: location, city: 'Unknown' }
  }
  
  return location // Already an object
}

/**
 * Process Shippo rates into standardized format
 */
function processShippoRates(rates) {
  return rates.map(rate => ({
    carrier: rate.provider || 'Unknown',
    service: rate.servicelevel?.name || 'Standard',
    rate: rate.amount || '0.00',
    currency: rate.currency || 'USD',
    transitTime: rate.estimated_days ? `${rate.estimated_days} days` : 'Unknown',
    reliability: 'API_VERIFIED',
    shippoRateId: rate.object_id
  }))
}

/**
 * Generate fallback shipping rates
 */
function generateFallbackShippingRates(origin, destination, weight) {
  const routes = {
    'CN-US': [
      { carrier: 'Ocean', service: 'Standard', base: 2200, transit: '18-25 days' },
      { carrier: 'Ocean', service: 'Express', base: 2800, transit: '12-16 days' },
      { carrier: 'Air', service: 'Standard', base: 4500, transit: '5-7 days' },
      { carrier: 'Air', service: 'Express', base: 6200, transit: '2-3 days' }
    ],
    'CN-MX': [
      { carrier: 'Ocean', service: 'Standard', base: 1900, transit: '16-22 days' },
      { carrier: 'Ocean', service: 'Express', base: 2400, transit: '10-14 days' },
      { carrier: 'Air', service: 'Standard', base: 3800, transit: '4-6 days' }
    ],
    'CN-CA': [
      { carrier: 'Ocean', service: 'Standard', base: 2100, transit: '17-24 days' },
      { carrier: 'Ocean', service: 'Express', base: 2700, transit: '11-15 days' },
      { carrier: 'Air', service: 'Standard', base: 4200, transit: '4-6 days' }
    ],
    'IN-US': [
      { carrier: 'Ocean', service: 'Standard', base: 2400, transit: '20-28 days' },
      { carrier: 'Ocean', service: 'Express', base: 3000, transit: '14-18 days' },
      { carrier: 'Air', service: 'Standard', base: 4800, transit: '6-8 days' }
    ],
    'VN-US': [
      { carrier: 'Ocean', service: 'Standard', base: 2000, transit: '16-23 days' },
      { carrier: 'Ocean', service: 'Express', base: 2500, transit: '10-14 days' },
      { carrier: 'Air', service: 'Standard', base: 4200, transit: '4-6 days' }
    ]
  }
  
  const routeKey = `${origin}-${destination}`
  const routeData = routes[routeKey] || routes['CN-US'] // Default fallback
  
  return routeData.map(option => ({
    carrier: option.carrier,
    service: option.service,
    rate: (option.base * (weight || 1) * (1 + Math.random() * 0.2)).toFixed(2), // Add 0-20% variation
    currency: 'USD',
    transitTime: option.transit,
    reliability: 'ESTIMATED',
    fuelSurcharge: (option.base * 0.15).toFixed(2),
    totalWithSurcharges: ((option.base * (weight || 1)) * 1.25).toFixed(2)
  }))
}

/**
 * Analyze transit options for routing intelligence
 */
function analyzeTransitOptions(shippingOptions, origin, destination) {
  const analysis = {
    fastestOption: null,
    cheapestOption: null,
    recommendedOption: null,
    routingAdvice: [],
    seasonalFactors: []
  }
  
  if (shippingOptions && shippingOptions.length > 0) {
    // Find fastest (shortest transit time)
    analysis.fastestOption = shippingOptions.reduce((fastest, current) => {
      const currentDays = extractTransitDays(current.transitTime)
      const fastestDays = extractTransitDays(fastest.transitTime)
      return currentDays < fastestDays ? current : fastest
    })
    
    // Find cheapest
    analysis.cheapestOption = shippingOptions.reduce((cheapest, current) => {
      return parseFloat(current.rate) < parseFloat(cheapest.rate) ? current : cheapest
    })
    
    // Find recommended (balance of cost and speed)
    analysis.recommendedOption = shippingOptions.find(option => 
      option.service.toLowerCase().includes('express') && 
      option.carrier.toLowerCase().includes('ocean')
    ) || shippingOptions[1] || shippingOptions[0]
  }
  
  // Generate routing advice
  if (origin.includes('CN') || origin.includes('China')) {
    analysis.routingAdvice.push('China routes benefit from West Coast ports (LA/Long Beach)')
    analysis.routingAdvice.push('Consider Mexico routing for 25% tariff savings vs direct import')
  }
  
  if (destination.includes('US')) {
    analysis.routingAdvice.push('USMCA triangle routing can save 15-25% on total landed costs')
    analysis.seasonalFactors.push('Q4 capacity constraints increase rates 20-30%')
  }
  
  return analysis
}

/**
 * Extract transit days from transit time string
 */
function extractTransitDays(transitTime) {
  if (!transitTime) return 999
  
  const match = transitTime.match(/(\d+)-?(\d+)?/)
  if (match) {
    return parseInt(match[1]) // Use first number (minimum days)
  }
  
  return 999 // Unknown = worst case
}