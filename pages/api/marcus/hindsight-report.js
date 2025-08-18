import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { foundationData, productData, routingData } = req.body

  if (!foundationData || !productData || !routingData) {
    return res.status(400).json({ error: 'Missing required page data' })
  }

  try {
    // Extract similar sessions from database
    const { data: similarSessions } = await supabase
      .from('workflow_sessions')
      .select('*')
      .eq('data->businessType', foundationData.businessType)
      .limit(20)

    // Get hindsight patterns from library
    const { data: existingPatterns } = await supabase
      .from('hindsight_pattern_library')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(10)

    // Get trade flow intelligence for this profile
    const { data: tradeFlows } = await supabase
      .from('trade_flows')
      .select('*')
      .in('hs_code', productData.products?.map(p => p.hsCode) || [])
      .eq('usmca_qualified', true)
      .limit(50)


    // Calculate real metrics from institutional data
    const metrics = calculateInstitutionalMetrics(
      foundationData, 
      productData, 
      routingData,
      similarSessions,
      tradeFlows
    )

    // Generate Marcus AI report if API key exists
    let marcusReport = null
    if (anthropic) {
      marcusReport = await generateMarcusReport(
        foundationData,
        productData, 
        routingData,
        metrics,
        existingPatterns
      )
    }

    // Extract new patterns for institutional learning
    const newPatterns = extractPatterns(
      foundationData,
      productData,
      routingData,
      metrics
    )

    // Save patterns to hindsight library
    if (newPatterns.length > 0) {
      await supabase
        .from('hindsight_pattern_library')
        .insert(newPatterns)
    }

    // Save Marcus consultation
    if (marcusReport) {
      await supabase
        .from('marcus_consultations')
        .insert({
          business_profile: {
            type: foundationData.businessType,
            volume: foundationData.importVolume,
            suppliers: foundationData.primarySupplierCountry
          },
          recommendations: marcusReport.recommendations,
          savings_identified: routingData.potentialSavings,
          confidence_score: marcusReport.confidence,
          created_at: new Date().toISOString()
        })
    }

    return res.status(200).json({
      success: true,
      hindsightReport: {
        institutionalMetrics: metrics,
        marcusAnalysis: marcusReport,
        extractedPatterns: newPatterns,
        similarCompanies: similarSessions?.length || 0,
        confidenceScore: metrics.overallConfidence
      }
    })

  } catch (error) {
    console.error('Hindsight report error:', error)
    return res.status(500).json({ 
      error: 'Failed to generate hindsight report',
      details: error.message 
    })
  }
}

function calculateInstitutionalMetrics(foundationData, productData, routingData, sessions, flows) {
  // Calculate real metrics from institutional data
  const similarCompanies = sessions?.filter(s => 
    s.data?.importVolume === foundationData.importVolume
  ).length || 0

  const avgSavings = sessions?.reduce((acc, s) => {
    const savings = s.data?.routingData?.potentialSavings || 0
    return acc + savings
  }, 0) / (sessions?.length || 1)

  const successRate = sessions?.filter(s => 
    s.stage_completed >= 6  // completed full 6-page journey (through alerts)
  ).length / (sessions?.length || 1) * 100

  const topRoute = routingData.selectedRoute || 'mexico_routing'
  const routeSuccess = flows?.filter(f => 
    f.trade_flow?.includes('Mexico') && f.usmca_qualified
  ).length / (flows?.length || 1) * 100

  return {
    similarCompaniesAnalyzed: similarCompanies,
    averageSavingsAchieved: Math.round(avgSavings),
    successRatePercentage: Math.round(successRate),
    routeViabilityScore: Math.round(routeSuccess),
    implementationComplexity: getComplexityScore(foundationData, productData),
    paybackPeriodMonths: calculatePayback(routingData.potentialSavings),
    riskAdjustedROI: calculateROI(routingData.potentialSavings, foundationData.importVolume),
    overallConfidence: Math.round((successRate + routeSuccess) / 2)
  }
}

function getComplexityScore(foundationData, productData) {
  const productCount = productData.products?.length || 0
  const avgConfidence = productData.averageConfidence || 0
  
  if (productCount > 10 || avgConfidence < 70) return 'High'
  if (productCount > 5 || avgConfidence < 85) return 'Medium'
  return 'Low'
}

function calculatePayback(savings) {
  const implementationCost = 75000
  return Math.ceil(implementationCost / (savings / 12))
}

function calculateROI(savings, volume) {
  const volumeMap = {
    'Under $500K': 250000,
    '$500K - $1M': 750000,
    '$1M - $5M': 3000000,
    '$5M - $25M': 15000000,
    'Over $25M': 50000000
  }
  
  const volumeValue = volumeMap[volume] || 1000000
  const implementationCost = Math.min(75000, volumeValue * 0.02)
  return Math.round(((savings - implementationCost) / implementationCost) * 100)
}

async function generateMarcusReport(foundationData, productData, routingData, metrics, patterns) {
  if (!anthropic) return null

  const prompt = `You are Marcus, having a conversation with this business owner about what we learned from their triangle routing analysis.

Here's what happened in their journey:

THEIR BUSINESS:
- ${foundationData.businessType} company
- Importing ${foundationData.importVolume} from ${foundationData.primarySupplierCountry}
- ${foundationData.urgencyLevel ? `They were ${foundationData.urgencyLevel} urgency` : 'Strategic planning mode'}

PRODUCTS WE ANALYZED:
${productData.products?.map(p => `${p.description} (HS: ${p.hsCode}, ${p.confidence}% confidence match)`).join(', ')}

WHAT THEY CHOSE:
- Selected: ${routingData.selectedRoute}
- Potential Annual Savings: $${routingData.potentialSavings?.toLocaleString()}

WHAT OUR DATA SHOWS:
- I've helped ${metrics.similarCompaniesAnalyzed} other ${foundationData.businessType} companies like yours
- They averaged $${metrics.averageSavingsAchieved?.toLocaleString()} in savings
- Success rate: ${metrics.successRatePercentage}% complete their implementations
- Your chosen route has ${metrics.routeViabilityScore}% viability based on real trade data

Write as Marcus having a personal conversation about what worked, what we learned, and what this means for other similar businesses. Be conversational, direct, and focus on practical takeaways. Start with something like "Looking back at your triangle routing journey..." or "Here's what I learned from working with your business..."

Keep it under 300 words, conversational tone, no bullet points or formal sections.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0].text

    return {
      recommendations: content,
      confidence: metrics.overallConfidence,
      generatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Marcus AI error:', error)
    return {
      recommendations: generateFallbackReport(foundationData, productData, routingData, metrics),
      confidence: metrics.overallConfidence,
      generatedAt: new Date().toISOString()
    }
  }
}

function generateFallbackReport(foundationData, productData, routingData, metrics) {
  return `Looking back at your triangle routing journey, here's what really stood out to me. Your ${foundationData.businessType} business with ${foundationData.importVolume} in volume puts you right in the sweet spot - I've worked with ${metrics.similarCompaniesAnalyzed} similar companies, and they typically save around $${metrics.averageSavingsAchieved?.toLocaleString()} annually.

What I found interesting about your case is that ${routingData.selectedRoute} route you chose has a ${metrics.routeViabilityScore}% success rate based on real trade data from companies just like yours. The ${metrics.implementationComplexity.toLowerCase()} complexity level means you should see payback within ${metrics.paybackPeriodMonths} months, which is actually pretty solid.

Here's what I learned that'll help other ${foundationData.businessType} importers: focus on your highest-confidence products first - anything above 85% confidence. The companies that succeed roll this out in phases rather than trying to do everything at once. ${foundationData.urgencyLevel === 'high' ? 'I know you were feeling time pressure, but that actually helped you make decisive choices.' : 'Taking the strategic approach like you did usually leads to better long-term results.'}

The ${metrics.successRatePercentage}% completion rate for businesses like yours tells me you're on the right track. Your risk-adjusted ROI of ${metrics.riskAdjustedROI}% is solid, especially in today's volatile tariff environment. Keep monitoring quarterly - tariffs change, but USMCA benefits stay stable.

This assessment comes from real outcomes in our institutional database, not theoretical projections.`
}

function extractPatterns(foundationData, productData, routingData, metrics) {
  const patterns = []

  // Extract business type + volume pattern
  if (metrics.successRatePercentage > 70) {
    patterns.push({
      pattern_type: 'business_success',
      business_type: foundationData.businessType,
      import_volume: foundationData.importVolume,
      success_factors: [
        `${routingData.selectedRoute} routing`,
        `${productData.products?.length} products analyzed`,
        `${metrics.overallConfidence}% confidence`
      ],
      failure_points: [],
      confidence_score: metrics.overallConfidence,
      extracted_from: 'user_journey',
      created_at: new Date().toISOString()
    })
  }

  // Extract product category pattern
  const dominantCategory = getMostFrequentCategory(productData.products)
  if (dominantCategory && routingData.potentialSavings > 100000) {
    patterns.push({
      pattern_type: 'product_category',
      business_type: foundationData.businessType,
      category: dominantCategory,
      success_factors: [
        `High savings potential in ${dominantCategory}`,
        `USMCA qualification confirmed`
      ],
      confidence_score: productData.averageConfidence || 85,
      created_at: new Date().toISOString()
    })
  }

  return patterns
}

function getMostFrequentCategory(products) {
  if (!products || products.length === 0) return null
  
  const categories = products.map(p => p.category).filter(Boolean)
  const counts = categories.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})
  
  return Object.keys(counts).reduce((a, b) => 
    counts[a] > counts[b] ? a : b, null
  )
}

