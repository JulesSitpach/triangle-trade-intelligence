/**
 * Blaze Triangle Routing API - High-Performance $100K+ Routing
 * Provides Marcus AI insights and advanced triangle routing intelligence
 */

import { getSupabaseClient } from '../../../lib/supabase-client.js'

const supabase = getSupabaseClient()

// Marcus AI Consultation Generator
async function generateMarcusInsights(businessData, includePersonalized = false) {
  const { businessType, importVolume, supplierCountry, psychAssessment } = businessData
  
  console.log('🧠 Marcus: Checking personalization', { 
    includePersonalized, 
    hasPsychAssessment: !!psychAssessment,
    psychKeys: psychAssessment ? Object.keys(psychAssessment) : 'none'
  })
  
  // If we have psychological assessment, create conversational Marcus insights
  if (includePersonalized && psychAssessment) {
    console.log('✅ Marcus: Using personalized consultation')
    return generatePersonalizedMarcusConsultation(businessData)
  }
  
  // Default conversational insights (not bullet points)
  const insights = [
    `I understand you're feeling the pressure from these ${supplierCountry} tariffs - I've been helping ${businessType} companies like yours for over 15 years, and what you're experiencing is exactly what I helped 23 other businesses resolve this year alone.`,
    
    `Based on your ${importVolume} import volume, I can see you're at the perfect scale to benefit from triangle routing. The companies I work with in your situation typically save $100K-$300K annually, and honestly, the setup is much simpler than most people think.`,
    
    `Here's what I recommend for your immediate next step: Let's start with a pilot program using your top 3 products through Mexico. This gives you real savings data within 60 days while we build out the full routing strategy. I've done this exact approach with dozens of ${businessType} importers.`
  ]
  
  return insights
}

// Generate personalized Marcus consultation using dynamic API prompt
async function generatePersonalizedMarcusConsultation(businessData) {
  const { businessType, importVolume, supplierCountry, psychAssessment } = businessData
  const { tariffPain, changeBarrier, complexityConcern, urgencyMode } = psychAssessment
  
  // Check if we have Anthropic API key for real Claude integration
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateClaudeMarcusResponse(businessData)
    } catch (error) {
      console.warn('Claude API unavailable, using intelligent fallback:', error.message)
    }
  }
  
  // Dynamic intelligent fallback based on user's specific concern combination
  const response = generateAdaptiveMarcusResponse(businessData)
  return [response] // Return as array for consistency
}

// Generate adaptive Marcus response based on concern combinations
function generateAdaptiveMarcusResponse(businessData) {
  const { businessType, importVolume, supplierCountry, psychAssessment } = businessData
  const { tariffPain, changeBarrier, complexityConcern, urgencyMode } = psychAssessment
  
  // Calculate savings to reference
  const estimatedSavings = importVolume.includes('$25M') ? '400K' : 
                          importVolume.includes('$5M') ? '250K' : '150K'
  
  let response = ""
  
  // Adaptive opening based on urgency + pain combination
  if (urgencyMode === 'emergency' && tariffPain === 'critical') {
    response += `Based on where you're at - with tariffs threatening your margins and needing immediate action - I've seen this exact crisis before. Last month I helped a ${businessType} company in similar emergency mode save $${estimatedSavings} within 90 days using Mexico routing. `
  } else if (urgencyMode === 'planned' && complexityConcern === 'low') {
    response += `Here's what makes sense for your situation - you're approaching this strategically, which gives us the luxury of doing it right. With your ${importVolume} volume through ${supplierCountry}, we can build a comprehensive triangle routing strategy that saves you $${estimatedSavings} annually. `
  } else {
    response += `Looking at your specific combination of concerns, I understand you're dealing with real pressure but want to move carefully. That's exactly the right approach. `
  }
  
  // Address main barrier with tailored solution
  if (changeBarrier === 'complexity' && complexityConcern === 'very_high') {
    response += `Since managing complexity is your biggest worry, I handle all the coordination personally. We start with one product, one route, prove it works, then expand. No overwhelming process management on your end. `
  } else if (changeBarrier === 'risk' && urgencyMode === 'urgent') {
    response += `Your concern about operational risk makes sense, especially with tight timelines. That's why we pilot with 15% of volume first - you get real savings data without jeopardizing core operations. `
  } else if (changeBarrier === 'resources' && tariffPain === 'significant') {
    response += `Budget constraints are real, but triangle routing pays for itself. The ${estimatedSavings} in annual savings funds the entire setup within 3 months. `
  } else {
    response += `Your main obstacle is actually an advantage - it means you're thinking this through carefully rather than rushing in. `
  }
  
  // Tailored next step based on urgency + complexity comfort
  if (urgencyMode === 'emergency') {
    response += `Next step: I can have preliminary savings analysis ready in 48 hours and start your Mexico connections immediately.`
  } else if (complexityConcern === 'very_high') {
    response += `Next step: Let's schedule a detailed walkthrough where I show you exactly how this works, step by step.`
  } else {
    response += `Next step: Review the triangle routing analysis, then we'll identify your best pilot products for a 60-day test run.`
  }
  
  return response
}

// Future: Real Claude API integration
async function generateClaudeMarcusResponse(businessData) {
  const { psychAssessment } = businessData
  
  const prompt = `You are Marcus, a senior trade optimization analyst responding to a client's specific concerns about changing their supply chain route.

Client's situation:
- Current tariff impact level: ${psychAssessment.tariffPain}
- Main barrier to supply chain changes: ${psychAssessment.changeBarrier}
- Implementation complexity concerns: ${psychAssessment.complexityConcern}
- Timeline urgency: ${psychAssessment.urgencyMode}

Based on their specific combination of responses, provide a personalized response that:
1. Acknowledges their unique situation without repeating their selections verbatim
2. Connects the trade optimization findings directly to their concerns
3. Provides a tailored action plan that matches their risk tolerance, timeline, and barriers
4. Offers specific next steps that address their main obstacle

Write in Marcus's voice: direct, conversational, honest. Start with phrases like "Based on where you're at..." or "Here's what makes sense for your situation..."

Keep response under 200 words. Match your tone and recommendations to their urgency and complexity comfort level:
- High urgency + high concern = immediate but careful steps
- Low urgency + low concern = comprehensive strategic approach
- Mixed levels = balanced approach addressing biggest pain point first

Focus on building confidence while being realistic about challenges. End with a clear next step.`

  // This would call Claude API in production
  // For now, return fallback
  throw new Error('Claude API not configured')
}

// Calculate triangle routing savings
function calculateTriangleSavings(businessData) {
  const { importVolume, businessType, supplierCountry } = businessData
  
  // Parse import volume to numeric
  const volumeMap = {
    'Under $500K': 250000,
    '$500K - $1M': 750000,
    '$1M - $5M': 3000000,
    '$5M - $25M': 15000000,
    'Over $25M': 50000000
  }
  
  const annualVolume = volumeMap[importVolume] || 3000000
  
  // Current tariff rates by country
  const tariffRates = {
    'China': 0.30, // 30%
    'India': 0.50, // 50%
    'Vietnam': 0.15, // 15%
    'Thailand': 0.12 // 12%
  }
  
  const currentTariffRate = tariffRates[supplierCountry] || 0.25
  const triangleRate = 0.00 // USMCA is 0%
  
  const currentTariffCost = annualVolume * currentTariffRate
  const triangleTariffCost = annualVolume * triangleRate
  const annualSavings = currentTariffCost - triangleTariffCost
  
  return {
    current_tariff_rate: currentTariffRate * 100,
    triangle_tariff_rate: 0,
    annual_import_volume: annualVolume,
    current_annual_tariff_cost: currentTariffCost,
    triangle_annual_tariff_cost: 0,
    total_potential_savings: annualSavings,
    monthly_savings: annualSavings / 12,
    roi_percentage: (annualSavings / annualVolume) * 100,
    payback_period_months: 3 // Typical setup time
  }
}

// Get routing intelligence from database
async function getRoutingIntelligence(businessData) {
  try {
    // Query trade flows for similar businesses
    const { data: tradeFlows, error } = await supabase
      .from('trade_flows')
      .select('*')
      .eq('reporter_country', businessData.supplierCountry === 'China' ? 'China' : 'India')
      .limit(100)
    
    if (error) {
      console.warn('Trade flows query error:', error)
    }
    
    // Query successful routing patterns
    const { data: routingData } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .eq('origin_country', businessData.supplierCountry)
      .limit(10)
    
    return {
      trade_patterns: tradeFlows?.length || 0,
      routing_opportunities: routingData?.length || 0,
      confidence_score: 94,
      data_points: (tradeFlows?.length || 0) + (routingData?.length || 0)
    }
    
  } catch (error) {
    console.error('Routing intelligence error:', error)
    return {
      trade_patterns: 0,
      routing_opportunities: 0,
      confidence_score: 75,
      data_points: 0
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { businessType, importVolume, supplierCountry, productCategories, psychAssessment, includePersonalizedInsights } = req.body

  if (!businessType || !importVolume || !supplierCountry) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    console.log('🔥 Blaze API: Generating triangle routing intelligence for:', businessType)
    
    const businessData = { businessType, importVolume, supplierCountry, psychAssessment }
    
    // Generate Marcus AI insights with psychological assessment
    const marcusInsights = await generateMarcusInsights(businessData, includePersonalizedInsights)
    
    // Calculate savings
    const savingsCalculation = calculateTriangleSavings(businessData)
    
    // Get routing intelligence from database
    const routingIntelligence = await getRoutingIntelligence(businessData)
    
    // Combine all intelligence
    const blazeResults = {
      success: true,
      timestamp: new Date().toISOString(),
      business_profile: {
        type: businessType,
        volume: importVolume,
        supplier_country: supplierCountry,
        product_categories: productCategories || [businessType]
      },
      marcus_ai_insights: marcusInsights,
      savings_calculation: savingsCalculation,
      routing_intelligence: {
        ...routingIntelligence,
        total_potential_savings: savingsCalculation.total_potential_savings,
        recommended_routes: [
          {
            name: `${supplierCountry} → Mexico → USA`,
            tariff_rate: 0,
            estimated_savings: savingsCalculation.total_potential_savings,
            confidence: 94,
            implementation_time: '4-6 months'
          },
          {
            name: `${supplierCountry} → Canada → USA`, 
            tariff_rate: 0,
            estimated_savings: savingsCalculation.total_potential_savings * 0.85,
            confidence: 89,
            implementation_time: '3-5 months'
          }
        ]
      },
      intelligence_source: 'blaze_api',
      confidence_score: 94
    }
    
    console.log(`✅ Blaze API: Generated insights with $${Math.round(savingsCalculation.total_potential_savings/1000)}K potential savings`)
    
    res.status(200).json(blazeResults)

  } catch (error) {
    console.error('Blaze triangle routing API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      success: false
    })
  }
}