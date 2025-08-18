/**
 * 🔮 ALERTS SPECIALIST CONNECTION API
 * Connects predictive intelligence to live specialist marketplace
 * Final integration of institutional learning with monetization
 */

import PredictiveAlertsNetworkIntelligence from '../../lib/predictive-alerts-network-intelligence.js'
import LeadQualificationSystem from '../../lib/lead-qualification-system.js'
import HindsightInstitutionalLearning from '../../lib/hindsight-institutional-learning.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { 
      userData, 
      journeyResults, 
      hindsightAnalysis,
      requestType = 'full_intelligence',
      specialistId = null 
    } = req.body
    
    if (!userData || !journeyResults) {
      return res.status(400).json({ error: 'Missing user data or journey results' })
    }
    
    console.log('🔮 ALERTS SPECIALIST CONNECTION: Processing request')
    console.log(`🎯 Request Type: ${requestType}`)
    console.log('📊 Journey Results:', {
      totalSavings: journeyResults.totalFinancialBenefit,
      businessType: userData.businessType
    })
    
    // Generate comprehensive alerts intelligence
    const predictiveIntelligence = await PredictiveAlertsNetworkIntelligence.generatePredictiveIntelligence(
      userData,
      journeyResults,
      hindsightAnalysis || {}
    )
    
    if (!predictiveIntelligence.success) {
      return res.status(500).json({
        error: 'Failed to generate predictive intelligence',
        details: predictiveIntelligence.error
      })
    }
    
    // Enhanced lead qualification with network intelligence
    const enhancedQualification = LeadQualificationSystem.qualifyLead(userData, journeyResults)
    
    // Add alerts network intelligence scoring
    enhancedQualification.networkIntelligenceScore = calculateNetworkIntelligenceScore(
      predictiveIntelligence.predictiveIntelligence
    )
    enhancedQualification.liveOpportunityValue = predictiveIntelligence.predictiveIntelligence.specialistMatching?.liveOpportunityValue || journeyResults.totalFinancialBenefit
    
    console.log(`🔮 PREDICTIVE INTELLIGENCE: Generated with ${predictiveIntelligence.predictiveIntelligence.predictiveAlerts?.length} alerts`)
    console.log(`💰 LIVE OPPORTUNITY VALUE: $${enhancedQualification.liveOpportunityValue.toLocaleString()}`)
    console.log(`🌐 NETWORK STRENGTH: ${predictiveIntelligence.predictiveIntelligence.networkIntelligence?.networkStrength}%`)
    
    // Handle different request types
    if (requestType === 'full_intelligence') {
      // Complete alerts response with all intelligence
      return res.status(200).json({
        success: true,
        message: 'Alerts intelligence generated successfully',
        
        // Core predictive intelligence
        predictiveIntelligence: predictiveIntelligence.predictiveIntelligence,
        
        // Enhanced lead qualification
        enhancedQualification: {
          ...enhancedQualification,
          alertsBonus: {
            networkIntelligenceScore: enhancedQualification.networkIntelligenceScore,
            liveOpportunityValue: enhancedQualification.liveOpportunityValue,
            familyNetworkMultiplier: 1.25, // 25% bonus for family network
            institutionalLearningComplete: true
          }
        },
        
        // Live network status
        liveNetworkStatus: predictiveIntelligence.liveNetworkStatus,
        
        // Specialist marketplace integration
        specialistMarketplace: {
          availableSpecialists: predictiveIntelligence.predictiveIntelligence.networkIntelligence?.optimalMatches || [],
          immediateConnections: predictiveIntelligence.predictiveIntelligence.specialistMatching?.immediateActions || [],
          familyNetworkBonus: predictiveIntelligence.predictiveIntelligence.specialistMatching?.familyNetworkBonus || {},
          totalFeePool: enhancedQualification.specialistFeeEstimate * 1.25, // 25% bonus for alerts page completion
          platformRevenue: Math.round(enhancedQualification.specialistFeeEstimate * 1.25 * 0.15) // 15% platform fee
        },
        
        // Institutional contribution summary
        institutionalContribution: {
          intelligenceQuality: 10.0,
          patternsContributed: 'Your journey adds to institutional learning for future users',
          networkStrength: predictiveIntelligence.predictiveIntelligence.networkIntelligence?.networkStrength || 85,
          communityImpact: 'Helps optimize Canada-Mexico trade for similar businesses'
        }
      })
      
    } else if (requestType === 'specialist_match') {
      // Focus on specialist matching
      const topSpecialists = predictiveIntelligence.predictiveIntelligence.networkIntelligence?.optimalMatches?.slice(0, 3) || []
      
      return res.status(200).json({
        success: true,
        message: 'Specialist matching completed',
        
        specialists: topSpecialists,
        matchingCriteria: {
          businessType: userData.businessType,
          complexity: enhancedQualification.complexityLevel,
          urgency: enhancedQualification.urgencyScore,
          networkScore: enhancedQualification.networkIntelligenceScore
        },
        
        recommendations: {
          primaryMatch: topSpecialists[0] || null,
          alternativeMatches: topSpecialists.slice(1) || [],
          recommendedAction: enhancedQualification.leadScore >= 80 ? 'IMMEDIATE_CONNECTION' : 'SCHEDULED_CONSULTATION'
        }
      })
      
    } else if (requestType === 'connect_specialist' && specialistId) {
      // Handle specific specialist connection
      const specialist = predictiveIntelligence.predictiveIntelligence.networkIntelligence?.optimalMatches?.find(
        s => s.id === specialistId
      )
      
      if (!specialist) {
        return res.status(404).json({ error: 'Specialist not found' })
      }
      
      // Simulate connection process
      const connectionResult = await initiateSpecialistConnection(
        userData,
        journeyResults,
        specialist,
        enhancedQualification
      )
      
      return res.status(200).json({
        success: true,
        message: 'Specialist connection initiated',
        connection: connectionResult,
        nextSteps: [
          'Specialist will receive your connection request within 1 hour',
          'Discovery call will be scheduled within 24-48 hours',
          'Implementation planning begins after discovery call',
          'Family network coordination activated for cultural bridge support'
        ]
      })
      
    } else {
      return res.status(400).json({
        error: 'Invalid request type',
        validTypes: ['full_intelligence', 'specialist_match', 'connect_specialist']
      })
    }
    
  } catch (error) {
    console.error('❌ Alerts Specialist Connection API Error:', error)
    
    res.status(500).json({
      error: 'Alerts specialist connection failed',
      details: error.message
    })
  }
}

// Helper function to calculate network intelligence score
function calculateNetworkIntelligenceScore(predictiveIntelligence) {
  let score = 0
  
  // Market intelligence quality
  if (predictiveIntelligence.marketIntelligence) {
    score += 25
    if (predictiveIntelligence.marketIntelligence.tradRelationshipStatus?.momentum === 'POSITIVE') {
      score += 10
    }
  }
  
  // Predictive alerts quality
  if (predictiveIntelligence.predictiveAlerts?.length > 0) {
    score += 20
    score += Math.min(15, predictiveIntelligence.predictiveAlerts.length * 3)
  }
  
  // Network intelligence strength
  if (predictiveIntelligence.networkIntelligence) {
    score += predictiveIntelligence.networkIntelligence.networkStrength * 0.3
  }
  
  // Live opportunities
  if (predictiveIntelligence.liveOpportunities?.length > 0) {
    score += 15
  }
  
  // Family network bonus
  if (predictiveIntelligence.networkIntelligence?.familyNetworkAdvantage) {
    score += 10
  }
  
  return Math.min(100, Math.round(score))
}

// Helper function to initiate specialist connection
async function initiateSpecialistConnection(userData, journeyResults, specialist, qualification) {
  const connectionData = {
    // Connection details
    specialistId: specialist.id,
    specialistName: specialist.name,
    clientCompany: userData.companyName,
    connectionTimestamp: new Date().toISOString(),
    
    // Project overview
    projectOverview: {
      businessType: userData.businessType,
      importVolume: userData.importVolume,
      supplierCountry: userData.primarySupplierCountry,
      potentialSavings: journeyResults.totalFinancialBenefit,
      estimatedTimeline: specialist.estimatedTimeline,
      complexity: qualification.complexityLevel
    },
    
    // Specialist information
    specialistDetails: {
      specialization: specialist.specialization,
      experience: specialist.experience,
      matchScore: specialist.matchScore,
      estimatedFee: specialist.estimatedFee,
      availability: specialist.availability
    },
    
    // Next steps
    nextSteps: {
      discoveryCall: 'Schedule within 24-48 hours',
      needsAssessment: 'Complete project requirements analysis',
      proposal: 'Detailed implementation proposal with timeline',
      familyNetworkIntro: 'Introduction to Canadian-Mexican cultural bridge support'
    },
    
    // Connection status
    status: 'CONNECTION_INITIATED',
    priority: qualification.leadScore >= 80 ? 'HIGH' : 'MEDIUM',
    
    // Revenue projections
    revenueProjection: {
      specialistFee: specialist.estimatedFee,
      platformCommission: Math.round(specialist.estimatedFee * 0.15),
      projectValue: journeyResults.totalFinancialBenefit
    }
  }
  
  // In production, this would save to database and trigger notifications
  console.log('🤝 SPECIALIST CONNECTION INITIATED:', connectionData)
  
  return connectionData
}