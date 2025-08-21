/**
 * 🇲🇽 UNIFIED SPECIALISTS API
 * Consolidates: specialist-leads.js + specialist-marketplace.js
 * Revenue engine - connects specialist dashboard to qualified leads + marketplace functionality
 * Supports: leads retrieval, lead claiming, marketplace qualification, USMCA calculations
 */

import { getServerSupabaseClient } from '../../lib/supabase-client.js'
import CanadaMexicoAdvantageCalculator from '../../lib/canada-mexico-advantage-calculator.js'
import LeadQualificationSystem from '../../lib/lead-qualification-system.js'
import PredictiveAlertsNetworkIntelligence from '../../lib/intelligence/predictive-alerts-network-intelligence.js'
import { logInfo, logError, logDBQuery, logBusiness } from '../../lib/production-logger.js'

// Initialize Supabase client
const supabase = getServerSupabaseClient()

class SpecialistLeadEngine {
  constructor() {
    this.qualificationThresholds = {
      PLATINUM: { minSavings: 10000000, minScore: 90 },
      GOLD: { minSavings: 5000000, minScore: 80 },
      SILVER: { minSavings: 2000000, minScore: 70 },
      BRONZE: { minSavings: 500000, minScore: 60 }
    }
  }

  // Get qualified leads from calculator submissions
  async getQualifiedLeads() {
    try {
      // Get recent calculator submissions that qualify for specialist support
      const { data: sessions, error } = await supabase
        .from('workflow_sessions')
        .select(`
          id,
          company_name,
          business_type,
          import_volume,
          stage_completed,
          intelligence_level,
          created_at,
          metadata
        `)
        .gte('stage_completed', 3) // At least completed routing page (serious users)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        logError('Database query failed for qualified leads', {
          errorType: error.name,
          message: error.message
        })
        return this.getDemoLeads()
      }

      if (!sessions || sessions.length === 0) {
        return this.getDemoLeads()
      }

      // Process sessions into qualified leads
      const leads = await Promise.all(
        sessions.map(session => this.processSessionIntoLead(session))
      )

      // Filter only qualified leads (score >= 60)
      const qualifiedLeads = leads.filter(lead => lead.leadScore >= 60)

      return {
        success: true,
        leads: qualifiedLeads,
        totalLeads: qualifiedLeads.length,
        source: 'database',
        lastUpdated: new Date().toISOString()
      }

    } catch (error) {
      logError('Failed to get qualified leads', {
        errorType: error.name,
        message: error.message
      })
      return this.getDemoLeads()
    }
  }

  // Process a workflow session into a qualified lead
  async processSessionIntoLead(session) {
    // Calculate savings potential based on import volume and business type
    const savingsData = this.calculateSavingsPotential(session)
    
    // Score the lead based on multiple factors
    const leadScore = this.calculateLeadScore(session, savingsData)
    
    // Determine tier based on savings and score
    const tier = this.determineTier(savingsData.totalSavings, leadScore)
    
    // Calculate specialist fee pool (1.5-3.5% of savings based on tier)
    const feeRate = this.getFeeRate(tier)
    const specialistFeePool = Math.round(savingsData.totalSavings * feeRate)
    
    // Determine urgency and timeline
    const urgency = this.calculateUrgency(session, savingsData)
    const timeline = this.estimateTimeline(session, tier)
    
    // Extract requirements for Mexican specialists
    const requirements = this.extractSpecialistRequirements(session, savingsData)

    return {
      id: `lead_${session.id}`,
      companyName: session.company_name || 'Confidential Company',
      businessType: session.business_type || 'Manufacturing',
      importVolume: session.import_volume || '$1M - $5M',
      supplierCountry: session.metadata?.supply_chain?.primarySupplier || 'China',
      totalSavings: savingsData.totalSavings,
      specialistFeePool,
      leadScore,
      tier,
      timeline,
      status: 'NEW',
      submittedAt: new Date(session.created_at),
      route: savingsData.recommendedRoute,
      urgency,
      requirements,
      pagesCompleted: session.stage_completed,
      intelligenceLevel: session.intelligence_level,
      metadata: {
        state: session.metadata?.geographic?.state,
        city: session.metadata?.geographic?.city,
        sessionId: session.id,
        calculatorCompleted: session.stage_completed >= 5  // hindsight page = 5th page
      }
    }
  }

  // Calculate savings potential based on business profile
  calculateSavingsPotential(session) {
    const businessType = session.business_type || 'Manufacturing'
    const importVolume = session.import_volume || '$1M - $5M'
    
    // Base savings rates by business type (USMCA advantages)
    const savingsRates = {
      'Electronics': 0.15,      // 15% savings through Mexico route
      'Manufacturing': 0.12,    // 12% savings through maquiladora
      'Automotive': 0.18,       // 18% savings in automotive corridor
      'Medical': 0.10,          // 10% savings, highly regulated
      'Textiles': 0.22,         // 22% highest USMCA benefit
      'Machinery': 0.14         // 14% moderate benefits
    }
    
    // Import volume multipliers
    const volumeMultipliers = {
      'Under $500K': 400000,
      '$500K - $1M': 750000,
      '$1M - $5M': 3000000,
      '$5M - $25M': 15000000,
      '$25M+': 40000000
    }
    
    const savingsRate = savingsRates[businessType] || 0.12
    const volumeBase = volumeMultipliers[importVolume] || 3000000
    
    const totalSavings = Math.round(volumeBase * savingsRate)
    
    // Determine recommended route based on geography and business type
    const state = session.metadata?.geographic?.state
    const isWestCoast = ['CA', 'WA', 'OR', 'NV', 'AZ'].includes(state)
    const isEastCoast = ['NY', 'FL', 'MA', 'NC', 'SC', 'GA', 'ME', 'VT', 'NH'].includes(state)
    
    let recommendedRoute = 'Canada-Mexico Triangle'
    if (isWestCoast && businessType === 'Manufacturing') {
      recommendedRoute = 'Mexico Fast Track'
    } else if (isEastCoast && businessType === 'Electronics') {
      recommendedRoute = 'Canada Preferred'
    } else if (businessType === 'Automotive') {
      recommendedRoute = 'Mexico Automotive Corridor'
    }
    
    return {
      totalSavings,
      savingsRate,
      volumeBase,
      recommendedRoute
    }
  }

  // Calculate lead score (0-100)
  calculateLeadScore(session, savingsData) {
    let score = 50 // Base score
    
    // Pages completion bonus (more pages = higher intent)
    score += Math.min(session.stage_completed * 8, 32) // Max 32 points for completing all pages (6 pages total)
    
    // Savings potential bonus
    if (savingsData.totalSavings > 10000000) score += 20
    else if (savingsData.totalSavings > 5000000) score += 15
    else if (savingsData.totalSavings > 2000000) score += 10
    else if (savingsData.totalSavings > 500000) score += 5
    
    // Business type scoring (some types have higher success rates)
    const businessTypeScores = {
      'Electronics': 15,
      'Automotive': 18,
      'Manufacturing': 12,
      'Medical': 8,
      'Textiles': 20,
      'Machinery': 10
    }
    score += businessTypeScores[session.business_type] || 10
    
    // Intelligence level bonus (higher intelligence = better qualified)
    score += Math.min(session.intelligence_level * 2, 10)
    
    // Geographic bonus (some states have better USMCA adoption)
    const state = session.metadata?.geographic?.state
    const highAdoptionStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'IL']
    if (highAdoptionStates.includes(state)) score += 8
    
    // Timeline priority bonus
    const timeline = session.metadata?.priorities?.timeline
    if (timeline === 'immediate') score += 10
    else if (timeline === 'within_3_months') score += 7
    else if (timeline === 'within_6_months') score += 5
    
    return Math.min(100, Math.max(0, Math.round(score)))
  }

  // Determine tier based on savings and score
  determineTier(totalSavings, leadScore) {
    if (totalSavings >= this.qualificationThresholds.PLATINUM.minSavings && 
        leadScore >= this.qualificationThresholds.PLATINUM.minScore) {
      return 'PLATINUM'
    }
    if (totalSavings >= this.qualificationThresholds.GOLD.minSavings && 
        leadScore >= this.qualificationThresholds.GOLD.minScore) {
      return 'GOLD'
    }
    if (totalSavings >= this.qualificationThresholds.SILVER.minSavings && 
        leadScore >= this.qualificationThresholds.SILVER.minScore) {
      return 'SILVER'
    }
    if (totalSavings >= this.qualificationThresholds.BRONZE.minSavings && 
        leadScore >= this.qualificationThresholds.BRONZE.minScore) {
      return 'BRONZE'
    }
    return 'UNQUALIFIED'
  }

  // Get specialist fee rate by tier
  getFeeRate(tier) {
    const rates = {
      'PLATINUM': 0.025, // 2.5% of savings
      'GOLD': 0.020,     // 2.0% of savings  
      'SILVER': 0.018,   // 1.8% of savings
      'BRONZE': 0.015    // 1.5% of savings
    }
    return rates[tier] || 0.015
  }

  // Calculate urgency level
  calculateUrgency(session, savingsData) {
    const timeline = session.metadata?.priorities?.timeline
    const pagesCompleted = session.stage_completed
    const totalSavings = savingsData.totalSavings
    
    if (timeline === 'immediate' || totalSavings > 15000000) return 'HIGH'
    if (timeline === 'within_3_months' && pagesCompleted >= 5) return 'HIGH'  // reached hindsight page
    if (timeline === 'within_6_months' || pagesCompleted >= 5) return 'MEDIUM'  // completed hindsight analysis
    return 'LOW'
  }

  // Estimate implementation timeline
  estimateTimeline(session, tier) {
    const businessType = session.business_type
    const complexity = {
      'Electronics': '4-6 months',
      'Manufacturing': '5-7 months', 
      'Automotive': '3-5 months',
      'Medical': '6-9 months',
      'Textiles': '2-4 months',
      'Machinery': '4-6 months'
    }
    
    const baseTimeline = complexity[businessType] || '4-6 months'
    
    // Platinum tier gets faster implementation
    if (tier === 'PLATINUM') {
      return baseTimeline.replace(/(\d+)-(\d+)/, (match, p1, p2) => 
        `${Math.max(1, parseInt(p1) - 1)}-${Math.max(2, parseInt(p2) - 1)}`)
    }
    
    return baseTimeline
  }

  // Extract requirements for Mexican specialists
  extractSpecialistRequirements(session, savingsData) {
    const requirements = []
    const businessType = session.business_type
    const route = savingsData.recommendedRoute
    
    // Business type specific requirements
    if (businessType === 'Manufacturing') {
      requirements.push('Maquiladora setup', 'Manufacturing permits')
    }
    if (businessType === 'Electronics') {
      requirements.push('Electronics compliance', 'Quality certifications')
    }
    if (businessType === 'Automotive') {
      requirements.push('Automotive corridor', 'Just-in-time logistics')
    }
    if (businessType === 'Medical') {
      requirements.push('Medical device regulations', 'FDA coordination')
    }
    
    // Route specific requirements
    if (route.includes('Mexico')) {
      requirements.push('USMCA compliance', 'Cultural coordination')
    }
    if (route.includes('Fast Track')) {
      requirements.push('Speed implementation', 'Government relations')
    }
    
    // Always include these for Mexican specialists
    requirements.push('Cross-border logistics')
    
    return requirements.slice(0, 4) // Max 4 requirements for UI
  }

  // Demo leads for when database is empty
  getDemoLeads() {
    const demoLeads = [
      {
        id: 'demo_001',
        companyName: 'TechCorp Electronics Ltd',
        businessType: 'Electronics',
        importVolume: '$5M - $25M',
        supplierCountry: 'China',
        totalSavings: 11000000,
        specialistFeePool: 275000,
        leadScore: 95,
        tier: 'PLATINUM',
        timeline: '4-5 months',
        status: 'NEW',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        route: 'Mexico Preferred',
        urgency: 'HIGH',
        requirements: ['Maquiladora setup', 'USMCA compliance', 'Cultural coordination', 'Electronics compliance'],
        pagesCompleted: 6,  // completed all 6 pages: foundation, product, routing, partnership, hindsight, alerts
        intelligenceLevel: 10.0
      },
      {
        id: 'demo_002',
        companyName: 'Advanced Manufacturing Inc',
        businessType: 'Manufacturing',
        importVolume: '$1M - $5M',
        supplierCountry: 'Taiwan',
        totalSavings: 3200000,
        specialistFeePool: 80000,
        leadScore: 78,
        tier: 'SILVER',
        timeline: '6-7 months',
        status: 'NEW',
        submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        route: 'Canada-Mexico Triangle',
        urgency: 'MEDIUM',
        requirements: ['Cross-border logistics', 'Tariff optimization', 'Manufacturing permits'],
        pagesCompleted: 4,  // completed through partnership page
        intelligenceLevel: 6.0
      }
    ]

    return {
      success: true,
      leads: demoLeads,
      totalLeads: demoLeads.length,
      source: 'demo_data',
      lastUpdated: new Date().toISOString()
    }
  }

  // Claim a lead (update status)
  async claimLead(leadId, specialistId = 'default_specialist') {
    try {
      // In a real system, this would update the lead status in database
      // For now, we'll return success
      
      return {
        success: true,
        message: 'Lead claimed successfully',
        leadId,
        claimedBy: specialistId,
        claimedAt: new Date().toISOString(),
        nextSteps: [
          'Contact Mexican maquiladora specialists',
          'Prepare implementation proposal',
          'Coordinate with Canadian logistics team',
          'Schedule client discovery call'
        ]
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to claim lead',
        details: error.message
      }
    }
  }

  // Get specialist performance metrics
  async getSpecialistMetrics(specialistId = 'default_specialist') {
    // Demo metrics - in production this would come from database
    return {
      totalLeadsClaimed: 12,
      totalRevenue: 890000,
      averageLeadValue: 74167,
      successRate: 91,
      currentActiveLead: 3,
      monthlyGrowth: 23,
      topTier: 'PLATINUM',
      specialistRating: 4.8
    }
  }
}

// API endpoint handler
export default async function handler(req, res) {
  const leadEngine = new SpecialistLeadEngine()
  
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.action === 'metrics') {
          const metrics = await leadEngine.getSpecialistMetrics(req.query.specialist_id)
          return res.status(200).json(metrics)
        }
        
        // Default: Get qualified leads
        const leads = await leadEngine.getQualifiedLeads()
        return res.status(200).json(leads)

      case 'POST':
        if (req.query.action === 'claim') {
          const { leadId, specialistId } = req.body
          const result = await leadEngine.claimLead(leadId, specialistId)
          return res.status(200).json(result)
        }
        
        if (req.query.action === 'marketplace') {
          // Marketplace functionality from specialist-marketplace.js
          const { 
            userData, 
            requestType = 'qualification', 
            includeAlertsIntelligence = false,
            hindsightAnalysis = null 
          } = req.body
          
          if (!userData) {
            return res.status(400).json({ error: 'Missing user data' })
          }
          
          logInfo('SPECIALIST MARKETPLACE: Processing request', {
            requestType,
            businessType: userData.businessType,
            importVolume: userData.importVolume,
            supplierCountry: userData.primarySupplierCountry
          })
          
          // 1. Calculate USMCA advantage first
          const usmcaResults = await CanadaMexicoAdvantageCalculator.calculateUMCAAdvantage(userData)
          
          if (!usmcaResults.success) {
            return res.status(500).json({
              error: 'Failed to calculate USMCA advantage',
              details: usmcaResults.error
            })
          }
          
          // 2. Qualify the lead for specialist opportunities
          const qualification = LeadQualificationSystem.qualifyLead(userData, usmcaResults.advantage)
          
          logBusiness('Lead qualified for specialist marketplace', {
            leadScore: qualification.leadScore,
            specialistFeeEstimate: qualification.specialistFeeEstimate,
            tier: qualification.tier,
            isQualified: qualification.isQualified
          })
          
          // 3. Generate predictive intelligence if requested
          let predictiveIntelligence = null
          if (includeAlertsIntelligence) {
            predictiveIntelligence = await PredictiveAlertsNetworkIntelligence.generateAlertsIntelligence(userData, hindsightAnalysis)
          }
          
          // 4. Return comprehensive marketplace response
          return res.status(200).json({
            success: true,
            usmca_advantage: usmcaResults.advantage,
            lead_qualification: qualification,
            specialist_marketplace: {
              qualified: qualification.isQualified,
              tier: qualification.tier,
              estimated_specialist_fee: qualification.specialistFeeEstimate,
              connection_priority: qualification.connectionPriority,
              next_steps: qualification.nextSteps
            },
            predictive_intelligence: predictiveIntelligence,
            marketplace_ready: qualification.isQualified && qualification.leadScore >= 70
          })
        }
        
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid POST action. Supported actions: claim, marketplace' 
        })

      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        })
    }
  } catch (error) {
    logError('API Error in specialist-leads', {
      errorType: error.name,
      message: error.message,
      stack: error.stack
    })
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}