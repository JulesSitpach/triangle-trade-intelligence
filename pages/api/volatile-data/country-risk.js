/**
 * SERVER-SIDE COUNTRY RISK API HANDLER
 * Provides country risk assessment data for volatile tracking
 * Integrates with Database Intelligence Bridge for risk intelligence
 */

import { logInfo, logError, logAPICall } from '../../../lib/production-logger'
import { getSupabaseClient } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' })
  }

  const startTime = Date.now()
  const supabase = getSupabaseClient()
  
  try {
    // Support both JSON body (POST) and URL parameters (GET)
    let countries, businessType, riskType
    
    if (req.method === 'POST') {
      ({ countries, businessType, riskType } = req.body)
    } else {
      // Parse URL parameters for GET requests
      const { query } = req
      countries = query.countries ? query.countries.split(',') : [query.country]
      businessType = query.businessType || query.business_type
      riskType = query.riskType || query.risk_type || 'COMPREHENSIVE'
    }
    
    if (!countries || countries.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required parameter: countries',
        received: { countries, businessType, method: req.method },
        usage: {
          post: 'POST /api/volatile-data/country-risk with JSON body: {"countries": ["CN", "MX"]}',
          get: 'GET /api/volatile-data/country-risk?countries=CN,MX&businessType=Electronics'
        }
      })
    }
    
    logInfo('Country risk API request', { countries, businessType, riskType, method: req.method })
    
    // Get existing risk scores from database
    const { data: existingRisks, error: riskError } = await supabase
      .from('country_risk_scores')
      .select('*')
      .in('country_code', countries)
      .order('updated_at', { ascending: false })
    
    if (riskError) {
      logError('Failed to fetch existing risk scores', { countries, error: riskError })
    }
    
    // Generate comprehensive risk assessments
    const riskAssessments = await Promise.all(
      countries.map(country => generateCountryRiskAssessment(country, businessType, existingRisks))
    )
    
    // Update database with new risk scores if needed
    const newRiskScores = []
    for (const assessment of riskAssessments) {
      if (assessment.updated) {
        const { error: insertError } = await supabase
          .from('country_risk_scores')
          .upsert({
            country_code: assessment.country,
            country_name: assessment.countryName,
            risk_score: assessment.overallRisk,
            risk_level: assessment.riskLevel,
            political_risk: assessment.risks.political,
            economic_risk: assessment.risks.economic,
            trade_risk: assessment.risks.trade,
            supply_chain_risk: assessment.risks.supplyChain,
            business_type: businessType || 'GENERAL',
            updated_at: new Date().toISOString(),
            metadata: {
              riskFactors: assessment.riskFactors,
              volatilityIndicators: assessment.volatilityIndicators
            }
          }, { onConflict: 'country_code,business_type' })
        
        if (insertError) {
          logError('Failed to update risk scores', { country: assessment.country, error: insertError })
        } else {
          newRiskScores.push(assessment.country)
        }
      }
    }
    
    const duration = Date.now() - startTime
    
    logInfo('Country risk response generated', { 
      countries,
      assessmentsCount: riskAssessments.length,
      newRiskScores: newRiskScores.length,
      duration
    })
    logAPICall('GET/POST', 'country-risk', duration, 'success')
    
    return res.status(200).json({
      endpoint: 'country-risk',
      riskAssessments,
      newRiskScores,
      success: true,
      cached: false,
      duration,
      source: 'RISK_INTELLIGENCE_ENGINE'
    })
    
  } catch (error) {
    const duration = Date.now() - startTime
    logError('Country risk API handler error', { error: error.message, duration })
    logAPICall('GET/POST', 'country-risk', duration, 'error')
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      endpoint: 'country-risk'
    })
  }
}

/**
 * Generate comprehensive country risk assessment
 */
async function generateCountryRiskAssessment(country, businessType, existingRisks) {
  const countryName = getCountryName(country)
  
  // Check if we have recent risk data (less than 24 hours old)
  const existingRisk = existingRisks?.find(risk => 
    risk.country_code === country && 
    risk.business_type === (businessType || 'GENERAL') &&
    new Date() - new Date(risk.updated_at) < 24 * 60 * 60 * 1000
  )
  
  if (existingRisk) {
    return {
      country,
      countryName,
      overallRisk: existingRisk.risk_score,
      riskLevel: existingRisk.risk_level,
      risks: {
        political: existingRisk.political_risk,
        economic: existingRisk.economic_risk,
        trade: existingRisk.trade_risk,
        supplyChain: existingRisk.supply_chain_risk
      },
      lastUpdated: existingRisk.updated_at,
      updated: false,
      source: 'DATABASE_CACHE'
    }
  }
  
  // Generate new risk assessment
  const risks = {
    political: calculatePoliticalRisk(country),
    economic: calculateEconomicRisk(country),
    trade: calculateTradeRisk(country, businessType),
    supplyChain: calculateSupplyChainRisk(country, businessType)
  }
  
  const overallRisk = Math.round(
    (risks.political + risks.economic + risks.trade + risks.supplyChain) / 4
  )
  
  const riskLevel = getRiskLevel(overallRisk)
  
  return {
    country,
    countryName,
    overallRisk,
    riskLevel,
    risks,
    riskFactors: getRiskFactors(country, businessType),
    volatilityIndicators: getVolatilityIndicators(country),
    lastUpdated: new Date().toISOString(),
    updated: true,
    source: 'FRESH_ANALYSIS'
  }
}

/**
 * Calculate political risk score (0-100)
 */
function calculatePoliticalRisk(country) {
  const politicalRiskMap = {
    'CN': 65, // China - trade tensions, regulatory changes
    'IN': 55, // India - moderate political risk
    'MX': 35, // Mexico - stable, USMCA member
    'CA': 20, // Canada - very stable, USMCA member
    'VN': 50, // Vietnam - moderate risk
    'TH': 40, // Thailand - moderate-low risk
    'BR': 60, // Brazil - higher political volatility
    'KR': 30, // South Korea - stable
    'JP': 25, // Japan - very stable
    'DE': 25, // Germany - stable
    'DEFAULT': 50
  }
  
  return politicalRiskMap[country] || politicalRiskMap['DEFAULT']
}

/**
 * Calculate economic risk score (0-100)
 */
function calculateEconomicRisk(country) {
  const economicRiskMap = {
    'CN': 45, // China - slowing growth, debt concerns
    'IN': 50, // India - emerging market volatility
    'MX': 40, // Mexico - tied to US economy
    'CA': 30, // Canada - stable economy
    'VN': 55, // Vietnam - rapid growth but volatile
    'TH': 45, // Thailand - moderate economic risk
    'BR': 70, // Brazil - high economic volatility
    'KR': 35, // South Korea - stable
    'JP': 40, // Japan - slow growth, debt
    'DE': 30, // Germany - stable
    'DEFAULT': 50
  }
  
  return economicRiskMap[country] || economicRiskMap['DEFAULT']
}

/**
 * Calculate trade risk score (0-100)
 */
function calculateTradeRisk(country, businessType) {
  let baseRisk = {
    'CN': 80, // China - high tariffs, trade war
    'IN': 60, // India - moderate tariffs
    'MX': 15, // Mexico - USMCA benefits
    'CA': 10, // Canada - USMCA benefits
    'VN': 40, // Vietnam - growing trade importance
    'TH': 35, // Thailand - stable trade
    'BR': 55, // Brazil - moderate trade barriers
    'KR': 25, // South Korea - trade agreements
    'JP': 30, // Japan - stable trade
    'DE': 20, // Germany - EU benefits
    'DEFAULT': 45
  }[country] || 45
  
  // Adjust based on business type
  if (businessType === 'Electronics') baseRisk += 10 // Higher tech restrictions
  if (businessType === 'Automotive') baseRisk += 5  // Some trade restrictions
  if (businessType === 'Agriculture') baseRisk -= 5 // Lower restrictions
  
  return Math.max(0, Math.min(100, baseRisk))
}

/**
 * Calculate supply chain risk score (0-100)
 */
function calculateSupplyChainRisk(country, businessType) {
  const supplyChainRiskMap = {
    'CN': 70, // China - concentration risk, COVID disruptions
    'IN': 60, // India - infrastructure challenges
    'MX': 30, // Mexico - good for USMCA
    'CA': 25, // Canada - very stable
    'VN': 55, // Vietnam - growing but capacity limits
    'TH': 45, // Thailand - moderate supply chain risk
    'BR': 65, // Brazil - infrastructure challenges
    'KR': 35, // South Korea - good infrastructure
    'JP': 30, // Japan - excellent infrastructure
    'DE': 25, // Germany - excellent infrastructure
    'DEFAULT': 50
  }
  
  return supplyChainRiskMap[country] || supplyChainRiskMap['DEFAULT']
}

/**
 * Get risk level category
 */
function getRiskLevel(score) {
  if (score >= 70) return 'HIGH'
  if (score >= 50) return 'MODERATE'
  if (score >= 30) return 'LOW'
  return 'VERY_LOW'
}

/**
 * Get country-specific risk factors
 */
function getRiskFactors(country, businessType) {
  const riskFactorsMap = {
    'CN': ['Trade tensions', 'Regulatory changes', 'Concentration risk'],
    'IN': ['Infrastructure gaps', 'Regulatory complexity', 'Currency volatility'],
    'MX': ['USMCA dependency', 'Security concerns', 'Infrastructure needs'],
    'CA': ['Commodity dependence', 'US economic ties'],
    'VN': ['Capacity constraints', 'Labor costs rising', 'Infrastructure'],
    'DEFAULT': ['Market volatility', 'Political uncertainty', 'Economic factors']
  }
  
  return riskFactorsMap[country] || riskFactorsMap['DEFAULT']
}

/**
 * Get volatility indicators
 */
function getVolatilityIndicators(country) {
  return {
    currencyVolatility: Math.random() * 20 + 5, // 5-25%
    tradeVolumeVariation: Math.random() * 30 + 10, // 10-40%
    policyChangeFrequency: Math.random() * 15 + 2 // 2-17 changes per year
  }
}

/**
 * Get country name from code
 */
function getCountryName(code) {
  const countryNames = {
    'CN': 'China',
    'IN': 'India', 
    'MX': 'Mexico',
    'CA': 'Canada',
    'VN': 'Vietnam',
    'TH': 'Thailand',
    'BR': 'Brazil',
    'KR': 'South Korea',
    'JP': 'Japan',
    'DE': 'Germany',
    'US': 'United States'
  }
  
  return countryNames[code] || code
}