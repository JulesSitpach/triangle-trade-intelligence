/**
 * Trump Crisis-Specific Alert Monitor API
 * Integrates with trade-alert-monitor.js for Trump administration trade announcements
 * Connects crisis alerts to Mexican partnership lead generation pipeline
 */

import tradeMonitor from '../../../lib/trade-alert-monitor.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚨 Starting Trump crisis-specific alert monitoring...')
    
    // Use the existing trade monitor system
    const allAlerts = await tradeMonitor.checkAllFeeds()
    
    // Filter for Trump crisis-specific content
    const trumpCrisisAlerts = filterTrumpCrisisAlerts(allAlerts)
    
    // Enhance with partnership opportunity context
    const enhancedAlerts = await enhanceWithPartnershipContext(trumpCrisisAlerts)
    
    // Generate crisis response recommendations
    const crisisResponse = generateCrisisResponseStrategy(enhancedAlerts)
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      monitoring: {
        totalFeeds: Object.keys(tradeMonitor.governmentFeeds).length,
        trumpCrisisAlerts: enhancedAlerts.length,
        partnershipOpportunities: crisisResponse.partnershipOpportunities.length,
        urgentActions: crisisResponse.urgentActions.length
      },
      trumpCrisisAlerts: enhancedAlerts,
      crisisResponse,
      partnershipPipeline: {
        mexicanManufacturing: crisisResponse.mexicanOpportunities,
        canadianRegulatory: crisisResponse.canadianOpportunities,
        emergencyPartnerships: crisisResponse.emergencyContacts
      }
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Trump crisis monitoring error:', error)
    return res.status(500).json({
      success: false,
      error: 'Crisis monitoring failed',
      message: error.message
    })
  }
}

/**
 * Filter alerts for Trump crisis-specific content
 */
function filterTrumpCrisisAlerts(allAlerts) {
  const trumpKeywords = [
    'trump', 'president trump', 'administration', 
    'threatens', 'considers', 'reviewing', 'terminate',
    'canada', 'mexico', 'china', 'tariff', 'trade war',
    'usmca', 'nafta', 'renegotiate', 'withdraw'
  ]

  return allAlerts.filter(alert => {
    const text = `${alert.title} ${alert.content}`.toLowerCase()
    
    // Must contain Trump reference AND trade/country reference
    const hasTrump = ['trump', 'administration'].some(keyword => text.includes(keyword))
    const hasTradeCountry = ['canada', 'mexico', 'china', 'tariff', 'trade', 'usmca'].some(keyword => text.includes(keyword))
    
    return hasTrump && hasTradeCountry && alert.relevanceScore > 30
  }).map(alert => ({
    ...alert,
    crisisType: determineCrisisType(alert),
    urgencyLevel: determineUrgencyLevel(alert),
    partnershipOpportunity: assessPartnershipOpportunity(alert),
    businessImpact: assessBusinessImpact(alert)
  }))
}

/**
 * Determine the type of Trump crisis
 */
function determineCrisisType(alert) {
  const text = `${alert.title} ${alert.content}`.toLowerCase()
  
  if (text.includes('china')) return 'CHINA_TRADE_WAR'
  if (text.includes('canada')) return 'CANADA_RELATIONSHIP'
  if (text.includes('mexico')) return 'MEXICO_BORDER'
  if (text.includes('usmca') || text.includes('nafta')) return 'USMCA_THREAT'
  
  return 'GENERAL_TRADE_DISRUPTION'
}

/**
 * Determine urgency level based on content
 */
function determineUrgencyLevel(alert) {
  const text = `${alert.title} ${alert.content}`.toLowerCase()
  
  if (text.includes('immediately') || text.includes('emergency') || text.includes('terminate')) {
    return 'CRITICAL'
  }
  if (text.includes('threatens') || text.includes('considers') || text.includes('warning')) {
    return 'HIGH'
  }
  if (text.includes('reviewing') || text.includes('studying')) {
    return 'MEDIUM'
  }
  
  return 'MONITOR'
}

/**
 * Assess partnership opportunity from crisis
 */
function assessPartnershipOpportunity(alert) {
  const opportunities = []
  
  if (alert.crisisType === 'CHINA_TRADE_WAR') {
    opportunities.push({
      type: 'MEXICO_ALTERNATIVE',
      description: 'Position Mexico manufacturing as China alternative',
      revenue_potential: '$1.2M - $3.8M additional annual revenue',
      timeline: 'Immediate - capitalize on crisis'
    })
  }
  
  if (alert.crisisType === 'CANADA_RELATIONSHIP') {
    opportunities.push({
      type: 'MEXICO_BACKUP',
      description: 'Mexico partnership as Canada backup strategy',
      revenue_potential: '$800K - $2.1M crisis arbitrage revenue',
      timeline: '2-4 weeks to establish backup routes'
    })
  }
  
  return opportunities
}

/**
 * Assess business impact severity
 */
function assessBusinessImpact(alert) {
  const impact = {
    severity: 'MEDIUM',
    affectedSectors: [],
    timeframe: 'unknown',
    businessResponse: []
  }
  
  const text = `${alert.title} ${alert.content}`.toLowerCase()
  
  // Determine severity
  if (text.includes('immediately') || text.includes('terminate')) {
    impact.severity = 'CRITICAL'
  } else if (text.includes('threatens') || text.includes('substantial')) {
    impact.severity = 'HIGH'
  }
  
  // Identify affected sectors
  if (text.includes('electronics')) impact.affectedSectors.push('Electronics')
  if (text.includes('automotive')) impact.affectedSectors.push('Automotive')  
  if (text.includes('medical')) impact.affectedSectors.push('Medical')
  if (text.includes('agriculture')) impact.affectedSectors.push('Agriculture')
  
  // Business response recommendations
  if (alert.crisisType === 'CHINA_TRADE_WAR') {
    impact.businessResponse.push('Activate Mexico manufacturing partnerships')
    impact.businessResponse.push('Expedite triangle routing implementation')
  }
  
  if (alert.crisisType === 'CANADA_RELATIONSHIP') {
    impact.businessResponse.push('Establish Mexico backup routes')
    impact.businessResponse.push('Diversify away from Canada-only strategies')
  }
  
  return impact
}

/**
 * Enhance alerts with partnership opportunity context
 */
async function enhanceWithPartnershipContext(crisisAlerts) {
  return crisisAlerts.map(alert => ({
    ...alert,
    partnershipContext: {
      mexicanManufacturing: {
        opportunity: alert.crisisType === 'CHINA_TRADE_WAR' ? 'HIGH' : 'MEDIUM',
        contacts: generateMexicanContacts(alert),
        implementation: 'Family-owned manufacturing network ready for immediate partnership'
      },
      canadianRegulatory: {
        opportunity: alert.crisisType === 'CANADA_RELATIONSHIP' ? 'HIGH' : 'LOW',
        expertise: 'Canadian regulatory expertise for complex compliance scenarios',
        implementation: 'Husband\'s regulatory background provides immediate access'
      },
      emergencyResponse: {
        timeline: alert.urgencyLevel === 'CRITICAL' ? '24-48 hours' : '1-2 weeks',
        capacity: 'Emergency partnership activation available',
        support: 'Crisis response consulting included'
      }
    }
  }))
}

/**
 * Generate Mexican manufacturing contacts based on crisis type
 */
function generateMexicanContacts(alert) {
  const baseContacts = [
    'Tijuana Electronics Manufacturing Hub',
    'Juarez Automotive Assembly Network', 
    'Guadalajara Medical Device Partners',
    'Monterrey Industrial Alliance'
  ]
  
  if (alert.crisisType === 'CHINA_TRADE_WAR') {
    return [
      ...baseContacts,
      'China Alternative Manufacturing Coalition',
      'Asia-Mexico Manufacturing Bridge Partners'
    ]
  }
  
  return baseContacts
}

/**
 * Generate comprehensive crisis response strategy
 */
function generateCrisisResponseStrategy(trumpAlerts) {
  const response = {
    urgentActions: [],
    partnershipOpportunities: [],
    mexicanOpportunities: [],
    canadianOpportunities: [],
    emergencyContacts: [],
    businessImpactMitigation: []
  }
  
  trumpAlerts.forEach(alert => {
    // Urgent actions based on crisis type
    if (alert.urgencyLevel === 'CRITICAL') {
      response.urgentActions.push({
        action: `Immediate response to ${alert.crisisType}`,
        timeline: '24 hours',
        description: alert.businessImpact.businessResponse[0] || 'Activate emergency protocols',
        impact: alert.businessImpact.severity
      })
    }
    
    // Partnership opportunities
    alert.partnershipOpportunity.forEach(opp => {
      response.partnershipOpportunities.push({
        crisis: alert.crisisType,
        opportunity: opp.type,
        description: opp.description,
        revenue: opp.revenue_potential,
        timeline: opp.timeline
      })
    })
    
    // Mexican manufacturing opportunities
    if (alert.crisisType === 'CHINA_TRADE_WAR' || alert.crisisType === 'CANADA_RELATIONSHIP') {
      response.mexicanOpportunities.push({
        crisisDriver: alert.crisisType,
        manufacturingType: 'Emergency Alternative Production',
        capacity: 'Immediate capacity available through family network',
        advantage: 'USMCA 0% tariff benefits + political stability',
        contactMethod: 'Crisis hotline: Mexican manufacturing partnerships'
      })
    }
    
    // Canadian regulatory opportunities  
    if (alert.crisisType === 'CANADA_RELATIONSHIP') {
      response.canadianOpportunities.push({
        expertise: 'Canadian Regulatory Compliance',
        value: 'Maintain Canada access despite political tensions',
        implementation: 'Regulatory expertise through husband\'s background',
        timeline: 'Immediate consultation available'
      })
    }
  })
  
  // Emergency contacts
  response.emergencyContacts = [
    {
      type: 'Mexican Manufacturing Emergency Line',
      contact: 'Family manufacturing network',
      availability: '24/7 crisis response',
      specialization: 'China alternative production'
    },
    {
      type: 'Canadian Regulatory Emergency Support', 
      contact: 'Regulatory compliance expertise',
      availability: 'Business hours + emergency consultation',
      specialization: 'Complex compliance scenarios'
    }
  ]
  
  return response
}