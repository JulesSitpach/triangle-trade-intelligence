/**
 * 💰 LEAD QUALIFICATION & SPECIALIST MATCHING SYSTEM
 * Converts USMCA calculations into qualified specialist opportunities
 * Built for Canada-Mexico trade specialists to monetize expertise
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mrwitpgbcaxgnirqtavt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yd2l0cGdiY2F4Z25pcnF0YXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjUxMzQsImV4cCI6MjA2NTQwMTEzNH0.5g-eaUIwy4VQD2YfNC2sFNoZYF1HdUzVTNJZvtuVSI8'
)

export class LeadQualificationSystem {
  
  /**
   * 💎 Qualify leads based on USMCA savings calculations
   */
  static qualifyLead(userData, usmcaResults) {
    console.log('💰 LEAD QUALIFICATION: Analyzing specialist opportunity value')
    
    const qualification = {
      // Lead value scoring
      leadScore: this.calculateLeadScore(userData, usmcaResults),
      
      // Revenue potential for specialists
      specialistFeeEstimate: this.calculateSpecialistFee(usmcaResults.totalFinancialBenefit),
      
      // Urgency indicators
      urgencyScore: this.assessUrgency(userData),
      
      // Implementation complexity
      complexityLevel: this.assessComplexity(userData, usmcaResults),
      
      // Geographic specialization needs
      geographicNeeds: this.identifyGeographicNeeds(userData),
      
      // Specialist type recommendations
      requiredSpecialists: this.identifyRequiredSpecialists(userData, usmcaResults),
      
      // Revenue tier classification
      revenueTier: this.classifyRevenueTier(usmcaResults.totalFinancialBenefit)
    }
    
    console.log(`💰 LEAD QUALIFIED: Score ${qualification.leadScore}/100`)
    console.log(`💎 SPECIALIST FEE POTENTIAL: $${qualification.specialistFeeEstimate.toLocaleString()}`)
    console.log(`🎯 REVENUE TIER: ${qualification.revenueTier}`)
    
    return qualification
  }
  
  /**
   * 🎯 Calculate lead score (0-100)
   */
  static calculateLeadScore(userData, usmcaResults) {
    let score = 0
    
    // Volume scoring (40 points max)
    const savings = usmcaResults.totalFinancialBenefit
    if (savings >= 10000000) score += 40        // $10M+ = Platinum
    else if (savings >= 5000000) score += 35    // $5M+ = Gold  
    else if (savings >= 1000000) score += 30    // $1M+ = Silver
    else if (savings >= 500000) score += 25     // $500K+ = Bronze
    else if (savings >= 100000) score += 20     // $100K+ = Qualified
    else score += 10                            // <$100K = Low priority
    
    // Business type complexity (20 points max)
    const complexityScores = {
      'Electronics': 20,     // High-value, complex
      'Automotive': 18,      // Regulatory complexity
      'Manufacturing': 16,   // Good volume potential
      'Medical': 15,         // Regulatory but smaller
      'Machinery': 14,       // Technical complexity
      'Textiles': 12         // Lower complexity
    }
    score += complexityScores[userData.businessType] || 10
    
    // Geographic advantages (15 points max)
    if (userData.primarySupplierCountry === 'CN') score += 15 // Max USMCA benefit
    else if (['TW', 'KR'].includes(userData.primarySupplierCountry)) score += 12
    else if (['VN', 'TH'].includes(userData.primarySupplierCountry)) score += 8
    else score += 5
    
    // Timeline urgency (15 points max)
    if (userData.timelinePriority === 'SPEED') score += 15
    else if (userData.timelinePriority === 'CULTURAL') score += 12 // Values our expertise
    else if (userData.timelinePriority === 'BALANCED') score += 10
    else score += 8
    
    // Implementation readiness (10 points max)
    if (userData.companyName && userData.companyName.length > 3) score += 5 // Real company
    if (userData.timelinePriority) score += 5 // Clear priorities
    
    return Math.min(100, score)
  }
  
  /**
   * 💰 Calculate specialist fee estimate (% of savings)
   */
  static calculateSpecialistFee(totalSavings) {
    // Fee structure based on savings tier
    if (totalSavings >= 10000000) {
      return Math.round(totalSavings * 0.015) // 1.5% for $10M+
    } else if (totalSavings >= 5000000) {
      return Math.round(totalSavings * 0.02)  // 2% for $5M+
    } else if (totalSavings >= 1000000) {
      return Math.round(totalSavings * 0.025) // 2.5% for $1M+
    } else if (totalSavings >= 500000) {
      return Math.round(totalSavings * 0.03)  // 3% for $500K+
    } else {
      return Math.round(totalSavings * 0.035) // 3.5% for smaller deals
    }
  }
  
  /**
   * ⚡ Assess urgency based on market factors
   */
  static assessUrgency(userData) {
    let urgencyScore = 50 // Base score
    
    // Timeline priority impact
    if (userData.timelinePriority === 'SPEED') urgencyScore += 30
    else if (userData.timelinePriority === 'BALANCED') urgencyScore += 15
    
    // China supplier = higher urgency (tariff risk)
    if (userData.primarySupplierCountry === 'CN') urgencyScore += 20
    
    // High volume = more urgent (more at stake)
    if (userData.importVolume === 'Over $25M') urgencyScore += 15
    else if (userData.importVolume === '$5M - $25M') urgencyScore += 10
    
    return Math.min(100, urgencyScore)
  }
  
  /**
   * 🔧 Assess implementation complexity
   */
  static assessComplexity(userData, usmcaResults) {
    const complexityFactors = {
      businessType: {
        'Medical': 5,        // Regulatory complexity
        'Automotive': 4,     // Technical + regulatory  
        'Electronics': 4,    // Technical complexity
        'Manufacturing': 3,  // Moderate complexity
        'Machinery': 3,      // Technical documentation
        'Textiles': 2        // Lower complexity
      },
      volume: {
        'Over $25M': 4,      // Enterprise complexity
        '$5M - $25M': 3,     // Mid-market complexity
        '$1M - $5M': 2,      // Standard complexity
        '$500K - $1M': 2,    // Standard complexity
        'Under $500K': 1     // Simple implementation
      },
      supplier: {
        'CN': 3,             // High complexity (tariffs)
        'TW': 2,             // Moderate complexity
        'KR': 2,             // Moderate complexity
        'VN': 1,             // Lower complexity
        'TH': 1,             // Lower complexity
        'MY': 1              // Lower complexity
      }
    }
    
    const complexity = 
      (complexityFactors.businessType[userData.businessType] || 2) +
      (complexityFactors.volume[userData.importVolume] || 2) +
      (complexityFactors.supplier[userData.primarySupplierCountry] || 1)
    
    if (complexity >= 10) return 'very_high'
    if (complexity >= 8) return 'high'
    if (complexity >= 6) return 'medium'
    if (complexity >= 4) return 'low'
    return 'very_low'
  }
  
  /**
   * 🌍 Identify geographic specialization needs
   */
  static identifyGeographicNeeds(userData) {
    const needs = {
      canadaRoute: [],
      mexicoRoute: [],
      crossBorder: []
    }
    
    // Canada route needs
    if (['Electronics', 'Medical'].includes(userData.businessType)) {
      needs.canadaRoute.push('Vancouver port logistics')
      needs.canadaRoute.push('Health Canada compliance')
    }
    
    if (userData.importVolume.includes('$25M')) {
      needs.canadaRoute.push('Enterprise customs processing')
    }
    
    // Mexico route needs  
    if (['Manufacturing', 'Automotive', 'Textiles'].includes(userData.businessType)) {
      needs.mexicoRoute.push('Maquiladora setup')
      needs.mexicoRoute.push('US border crossing optimization')
    }
    
    // Cross-border needs
    if (userData.timelinePriority === 'CULTURAL') {
      needs.crossBorder.push('Bilingual project management')
      needs.crossBorder.push('Cultural bridge coordination')
    }
    
    needs.crossBorder.push('USMCA documentation')
    needs.crossBorder.push('Multi-country logistics coordination')
    
    return needs
  }
  
  /**
   * 👥 Identify required specialist types
   */
  static identifyRequiredSpecialists(userData, usmcaResults) {
    const specialists = []
    
    // Primary specialist based on business type
    const primarySpecialistMap = {
      'Electronics': 'Electronics Trade Specialist',
      'Automotive': 'Automotive Logistics Expert', 
      'Manufacturing': 'Industrial Trade Consultant',
      'Medical': 'Medical Device Trade Expert',
      'Machinery': 'Heavy Machinery Logistics Specialist',
      'Textiles': 'Textile Industry Trade Consultant'
    }
    
    specialists.push({
      type: primarySpecialistMap[userData.businessType] || 'General Trade Specialist',
      priority: 'primary',
      estimatedFee: Math.round(this.calculateSpecialistFee(usmcaResults.totalFinancialBenefit) * 0.6)
    })
    
    // Geographic specialists
    if (usmcaResults.canadaRoute) {
      specialists.push({
        type: 'Canada Customs & Logistics Specialist',
        priority: 'geographic',
        estimatedFee: Math.round(this.calculateSpecialistFee(usmcaResults.totalFinancialBenefit) * 0.25)
      })
    }
    
    if (usmcaResults.mexicoRoute) {
      specialists.push({
        type: 'Mexico Maquiladora Specialist', 
        priority: 'geographic',
        estimatedFee: Math.round(this.calculateSpecialistFee(usmcaResults.totalFinancialBenefit) * 0.25)
      })
    }
    
    // Regulatory specialist for complex cases
    if (['Medical', 'Automotive'].includes(userData.businessType)) {
      specialists.push({
        type: 'USMCA Regulatory Compliance Expert',
        priority: 'regulatory',
        estimatedFee: Math.round(this.calculateSpecialistFee(usmcaResults.totalFinancialBenefit) * 0.15)
      })
    }
    
    return specialists
  }
  
  /**
   * 🏆 Classify revenue tier for specialist matching
   */
  static classifyRevenueTier(totalSavings) {
    if (totalSavings >= 10000000) return 'PLATINUM' // $10M+
    if (totalSavings >= 5000000) return 'GOLD'      // $5M+  
    if (totalSavings >= 1000000) return 'SILVER'    // $1M+
    if (totalSavings >= 500000) return 'BRONZE'     // $500K+
    if (totalSavings >= 100000) return 'QUALIFIED'  // $100K+
    return 'BASIC'                                  // <$100K
  }
  
  /**
   * 💾 Save qualified lead to specialist marketplace
   */
  static async saveQualifiedLead(userData, usmcaResults, qualification) {
    try {
      const leadData = {
        // Lead information
        company_name: userData.companyName,
        business_type: userData.businessType,
        import_volume: userData.importVolume,
        supplier_country: userData.primarySupplierCountry,
        timeline_priority: userData.timelinePriority,
        
        // Qualification scores
        lead_score: qualification.leadScore,
        urgency_score: qualification.urgencyScore,
        complexity_level: qualification.complexityLevel,
        revenue_tier: qualification.revenueTier,
        
        // Financial projections
        total_savings_potential: usmcaResults.totalFinancialBenefit,
        specialist_fee_estimate: qualification.specialistFeeEstimate,
        
        // Specialist requirements
        required_specialists: qualification.requiredSpecialists,
        geographic_needs: qualification.geographicNeeds,
        
        // Status tracking
        lead_status: 'qualified',
        created_at: new Date().toISOString(),
        qualification_date: new Date().toISOString(),
        
        // Source tracking
        source: 'CANADA_MEXICO_USMCA_CALCULATOR',
        qualification_method: 'AUTOMATED_SAVINGS_ANALYSIS'
      }
      
      const { data, error } = await supabase
        .from('qualified_leads')
        .insert(leadData)
        .select()
      
      if (error) throw error
      
      console.log(`💰 QUALIFIED LEAD SAVED: ${qualification.revenueTier} tier`)
      console.log(`💎 SPECIALIST OPPORTUNITY: $${qualification.specialistFeeEstimate.toLocaleString()}`)
      
      return {
        success: true,
        leadId: data[0]?.id,
        qualification: qualification
      }
      
    } catch (error) {
      console.error('❌ Failed to save qualified lead:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * 🎯 Get specialist matching recommendations
   */
  static getSpecialistRecommendations(qualification) {
    return {
      primary: qualification.requiredSpecialists.find(s => s.priority === 'primary'),
      geographic: qualification.requiredSpecialists.filter(s => s.priority === 'geographic'),
      regulatory: qualification.requiredSpecialists.find(s => s.priority === 'regulatory'),
      
      totalFeePool: qualification.specialistFeeEstimate,
      revenueTier: qualification.revenueTier,
      leadScore: qualification.leadScore,
      
      recommendedAction: qualification.leadScore >= 80 ? 'IMMEDIATE_SPECIALIST_CONTACT' :
                        qualification.leadScore >= 60 ? 'QUALIFIED_SPECIALIST_OUTREACH' :
                        'NURTURE_AND_QUALIFY_FURTHER'
    }
  }
}

export default LeadQualificationSystem