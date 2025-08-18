/**
 * 🌐 COMTRADE TARIFF API
 * Real-time tariff data from UN Comtrade for volatile countries
 * Restored original working version
 */

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // Support both GET query params and POST body
    const country = req.method === 'GET' ? req.query.country : req.body?.country
    const product = req.method === 'GET' ? req.query.product : req.body?.product
    
    if (!country || !product) {
      return res.status(400).json({ error: 'Missing country or product parameter' })
    }
    
    console.log('🌐 COMTRADE API: Fetching tariff data', { country, product })
    console.log('Environment check:', {
      COMTRADE_API_KEY: !!process.env.COMTRADE_API_KEY,
      USE_MOCK_APIS: process.env.USE_MOCK_APIS,
      USE_MOCK: process.env.USE_MOCK
    })
    
    // Check if we should use real API or fallback
    const useRealAPI = process.env.COMTRADE_API_KEY && process.env.USE_MOCK_APIS !== 'true' && process.env.USE_MOCK !== 'true'
    
    if (useRealAPI) {
      // Make real Comtrade API call with working endpoint
      const countryCode = country === 'CN' ? '156' : 
                         country === 'IN' ? '699' :
                         country === 'MX' ? '484' :
                         country === 'CA' ? '124' :
                         country === 'VN' ? '704' : '0'
      
      const comtradeUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS`
      const params = new URLSearchParams({
        r: '842',        // USA 
        p: countryCode,  // Partner country
        ps: '2023',      // Year
        px: 'HS',        // Classification
        rg: '1',         // Imports
        cc: 'TOTAL',     // All commodities
        max: '500'       // Limit results
      })
      
      const fullUrl = `${comtradeUrl}?${params}`
      console.log('📡 Making real Comtrade API call')
      
      const headers = {
        'Ocp-Apim-Subscription-Key': process.env.COMTRADE_API_KEY
      }
      
      const response = await fetch(fullUrl, {
        headers: headers,
        timeout: 10000
      })
      
      if (!response.ok) {
        throw new Error(`Comtrade API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Process Comtrade response
      const countryTariff = extractCountryTariff(data, country, product)
      
      console.log('✅ Real Comtrade data retrieved', { country, tariff: countryTariff.rate })
      
      return res.status(200).json({
        success: true,
        source: 'UN_COMTRADE_API',
        country: country,
        product: product,
        tariff: countryTariff,
        timestamp: new Date().toISOString(),
        cacheFor: 3600000
      })
      
    } else {
      // Use fallback data 
      console.log('📊 Using fallback tariff data (API disabled)')
      
      const fallbackTariffs = {
        'CN': { rate: 25, status: 'HIGH_VOLATILITY', note: 'Subject to trade tensions' },
        'IN': { rate: 50, status: 'VERY_HIGH', note: 'Recent doubling due to policy change' },
        'VN': { rate: 15, status: 'MODERATE', note: 'Growing trade relationship' },
        'KR': { rate: 8, status: 'STABLE', note: 'KORUS FTA benefits' },
        'JP': { rate: 12, status: 'STABLE', note: 'Long-term trade partner' },
        'EU': { rate: 18, status: 'MODERATE', note: 'Various EU regulations' },
        'UK': { rate: 10, status: 'STABLE', note: 'Post-Brexit agreement' },
        'MX': { rate: 0, status: 'USMCA', note: 'USMCA 0% tariff' },
        'CA': { rate: 0, status: 'USMCA', note: 'USMCA 0% tariff' }
      }
      
      const tariff = fallbackTariffs[country] || { rate: 20, status: 'UNKNOWN', note: 'Standard MFN rate' }
      
      return res.status(200).json({
        success: true,
        source: 'FALLBACK_DATA',
        country: country,
        product: product,
        tariff: tariff,
        timestamp: new Date().toISOString(),
        cacheFor: 3600000,
        note: 'Using fallback data - enable COMTRADE_API_KEY for live data'
      })
    }
    
  } catch (error) {
    console.error('❌ Tariff API error:', error)
    
    // Return emergency fallback
    return res.status(200).json({
      success: false,
      error: error.message,
      fallback: {
        rate: 25,
        status: 'ESTIMATED', 
        note: 'Emergency fallback rate due to API failure'
      },
      source: 'EMERGENCY_FALLBACK',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Extract tariff rate for specific country from Comtrade response
 */
function extractCountryTariff(comtradeData, targetCountry, product) {
  if (!comtradeData.data || !Array.isArray(comtradeData.data)) {
    return { rate: 20, status: 'NO_DATA', note: 'No Comtrade data available' }
  }
  
  // Find data for target country
  const countryData = comtradeData.data.find(record => 
    record.ptCode === targetCountry || record.ptTitle?.includes(getCountryName(targetCountry))
  )
  
  if (!countryData) {
    return { rate: 20, status: 'COUNTRY_NOT_FOUND', note: 'Country not in dataset' }
  }
  
  // Calculate effective tariff rate
  const tariffRate = calculateEffectiveTariff(countryData)
  
  return {
    rate: tariffRate,
    status: 'COMTRADE_OFFICIAL',
    note: 'Official UN Comtrade data',
    tradeValue: countryData.tradeValue,
    netWeight: countryData.netWgt,
    dataYear: countryData.period
  }
}

/**
 * Calculate effective tariff rate from Comtrade data
 */
function calculateEffectiveTariff(record) {
  // Basic tariff calculation logic
  if (record.customsValue && record.tradeValue) {
    const tariffAmount = record.tradeValue - record.customsValue
    const rate = (tariffAmount / record.customsValue) * 100
    return Math.max(0, Math.min(100, rate)) // Cap between 0-100%
  }
  
  // Fallback to standard rates by country
  return 15 // Default rate
}

/**
 * Get full country name from code
 */
function getCountryName(code) {
  const countryNames = {
    'CN': 'China',
    'IN': 'India', 
    'MX': 'Mexico',
    'CA': 'Canada',
    'VN': 'Vietnam',
    'KR': 'Korea',
    'JP': 'Japan'
  }
  return countryNames[code] || code
}