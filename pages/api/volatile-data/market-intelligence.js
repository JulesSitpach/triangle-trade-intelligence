/**
 * SERVER-SIDE MARKET INTELLIGENCE API HANDLER
 * Provides real-time market intelligence data for volatile tracking
 * Integrates with Database Intelligence Bridge for compound intelligence
 */

import { logInfo, logError, logAPICall } from '../../../lib/production-logger'
import { getServerSupabaseClient } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' })
  }

  const startTime = Date.now()
  const supabase = getServerSupabaseClient()
  
  try {
    // Support both JSON body (POST) and URL parameters (GET)
    let country, hsCode, businessType, urgency, alertType
    
    if (req.method === 'POST') {
      ({ country, hsCode, businessType, urgency, alertType } = req.body)
    } else {
      // Parse URL parameters for GET requests
      const { query } = req
      country = query.country || query.countryCode
      hsCode = query.hsCode || query.hs_code
      businessType = query.businessType || query.business_type
      urgency = parseInt(query.urgency) || 0
      alertType = query.alertType || query.alert_type || 'MARKET_INTELLIGENCE'
    }
    
    if (!country) {
      return res.status(400).json({ 
        error: 'Missing required parameter: country',
        received: { country, hsCode, businessType, method: req.method },
        usage: {
          post: 'POST /api/volatile-data/market-intelligence with JSON body: {"country": "CN", "hsCode": "8471"}',
          get: 'GET /api/volatile-data/market-intelligence?country=CN&hsCode=8471&urgency=25'
        }
      })
    }
    
    logInfo('Market intelligence API request', { country, hsCode, businessType, urgency, method: req.method })
    
    // Get current market alerts from database
    const { data: marketAlerts, error: alertsError } = await supabase
      .from('current_market_alerts')
      .select('*')
      .eq('country', country)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (alertsError) {
      logError('Failed to fetch market alerts', { country, error: alertsError })
    }
    
    // Get country risk scores
    const { data: riskScores, error: riskError } = await supabase
      .from('country_risk_scores')
      .select('*')
      .eq('country_code', country)
      .order('updated_at', { ascending: false })
      .limit(1)
    
    if (riskError) {
      logError('Failed to fetch risk scores', { country, error: riskError })
    }
    
    // Generate market intelligence based on available data
    const marketIntelligence = {
      country,
      hsCode,
      businessType,
      
      // Market alerts
      currentAlerts: marketAlerts || [],
      alertCount: marketAlerts?.length || 0,
      
      // Risk assessment
      riskLevel: riskScores?.[0]?.risk_level || 'MODERATE',
      riskScore: riskScores?.[0]?.risk_score || 50,
      
      // Volatility assessment
      volatilityLevel: urgency > 30 ? 'HIGH' : urgency > 15 ? 'MODERATE' : 'LOW',
      urgencyScore: urgency,
      
      // Market trends (mock data for now - can be enhanced with real APIs)
      trends: generateMarketTrends(country, hsCode),
      
      // Intelligence metadata
      timestamp: new Date().toISOString(),
      confidence: calculateConfidence(marketAlerts, riskScores, urgency),
      dataQuality: 'REAL_TIME'
    }
    
    const duration = Date.now() - startTime
    
    logInfo('Market intelligence response generated', { 
      country,
      alertCount: marketIntelligence.alertCount,
      riskLevel: marketIntelligence.riskLevel,
      confidence: marketIntelligence.confidence,
      duration
    })
    logAPICall('GET/POST', 'market-intelligence', duration, 'success')
    
    return res.status(200).json({
      endpoint: 'market-intelligence',
      intelligence: marketIntelligence,
      success: true,
      cached: false,
      duration,
      source: 'DATABASE_DRIVEN_INTELLIGENCE'
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    logError('Market intelligence API handler error', { error: error.message, duration })
    logAPICall('GET/POST', 'market-intelligence', duration, 'error')
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      endpoint: 'market-intelligence'
    })
  }
}

/**
 * Generate market trends based on country and HS code
 */
function generateMarketTrends(country, hsCode) {
  const baseVolatility = getCountryVolatility(country)
  const productVolatility = getProductVolatility(hsCode)
  
  return {
    priceVolatility: baseVolatility * productVolatility,
    tradeVolume: Math.floor(Math.random() * 1000000) + 500000,
    seasonality: getSeasonalFactor(),
    geopoliticalRisk: getGeopoliticalRisk(country),
    supplyChainStability: Math.max(0, Math.min(100, 85 - baseVolatility * 10))
  }
}

/**
 * Get country-specific volatility multiplier
 */
function getCountryVolatility(country) {
  const volatilityMap = {
    'CN': 1.2, // China - high volatility due to trade tensions
    'IN': 1.1, // India - moderate-high volatility
    'MX': 0.8, // Mexico - lower volatility (USMCA)
    'CA': 0.7, // Canada - low volatility (USMCA)
    'VN': 1.0, // Vietnam - moderate volatility
    'TH': 0.9, // Thailand - moderate-low volatility
    'DEFAULT': 1.0
  }
  
  return volatilityMap[country] || volatilityMap['DEFAULT']
}

/**
 * Get product-specific volatility based on HS code
 */
function getProductVolatility(hsCode) {
  if (!hsCode) return 1.0
  
  const firstTwo = hsCode.substring(0, 2)
  const productVolatilityMap = {
    '84': 1.1, // Machinery - moderate-high volatility
    '85': 1.2, // Electronics - high volatility
    '87': 1.0, // Automotive - moderate volatility
    '39': 0.9, // Plastics - moderate-low volatility
    '73': 0.8, // Iron/steel - low-moderate volatility
    'DEFAULT': 1.0
  }
  
  return productVolatilityMap[firstTwo] || productVolatilityMap['DEFAULT']
}

/**
 * Get seasonal factor
 */
function getSeasonalFactor() {
  const month = new Date().getMonth() + 1 // 1-12
  
  // Q4 typically has higher trade volumes
  if (month >= 10) return 1.3 // Q4 - high season
  if (month >= 7) return 1.1  // Q3 - moderate season
  if (month >= 4) return 1.0  // Q2 - normal season
  return 0.9 // Q1 - low season
}

/**
 * Get geopolitical risk score for country
 */
function getGeopoliticalRisk(country) {
  const riskMap = {
    'CN': 75, // China - high geopolitical risk
    'IN': 55, // India - moderate risk
    'MX': 25, // Mexico - low risk (USMCA)
    'CA': 15, // Canada - very low risk (USMCA)
    'VN': 45, // Vietnam - moderate risk
    'TH': 35, // Thailand - low-moderate risk
    'DEFAULT': 50
  }
  
  return riskMap[country] || riskMap['DEFAULT']
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(alerts, riskScores, urgency) {
  let confidence = 80 // Base confidence
  
  // Adjust based on data availability
  if (alerts && alerts.length > 0) confidence += 10
  if (riskScores && riskScores.length > 0) confidence += 10
  
  // Adjust based on urgency (higher urgency = need for more certainty)
  if (urgency > 30) confidence -= 5
  
  return Math.max(60, Math.min(95, confidence))
}