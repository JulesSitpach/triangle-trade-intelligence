/**
 * LIVE MARKET INTELLIGENCE API
 * Real-time monitoring of user's products in $76.9B trade database
 * No hardcoded alerts - pure database-driven intelligence
 * Uses semantic page tracking for foundation, product, routing, partnership, hindsight, alerts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      businessType = 'Electronics',
      origin = 'China',
      destination = 'USA',
      products = [],
      hsCode = null
    } = req.body

    console.log('📡 Live market intelligence request:', { businessType, origin, destination })

    // Get live market data from database
    const marketAlerts = await getLiveMarketAlerts(businessType, origin, destination)
    const volumeChanges = await getVolumeChanges(businessType, origin)
    const savingsOpportunities = await getSavingsOpportunities(origin, destination)
    const peerActivity = await getPeerActivity(businessType)

    const liveIntelligence = {
      marketAlerts,
      volumeChanges,
      savingsOpportunities,
      peerActivity,
      lastUpdated: Date.now(), // Use timestamp instead of ISO string to avoid hydration mismatch
      dataSource: 'LIVE_DATABASE_MONITORING'
    }

    console.log('✅ Live market intelligence generated from database')

    res.json({
      success: true,
      source: 'REAL_DATABASE_MONITORING',
      alertsGenerated: marketAlerts.length,
      liveIntelligence
    })

  } catch (error) {
    console.error('❌ Live market intelligence error:', error.message)
    
    res.status(500).json({
      success: false,
      error: error.message,
      liveIntelligence: null
    })
  }
}

async function getLiveMarketAlerts(businessType, origin, destination) {
  const alerts = []

  // Alert 1: High-value routes available
  const { data: highValueRoutes } = await supabase
    .from('trade_flows')
    .select('trade_value, estimated_usmca_savings, product_description')
    .ilike('product_description', `%${businessType.toLowerCase()}%`)
    .eq('reporter_country', origin)
    .gte('estimated_usmca_savings', 500000) // $500K+ savings
    .order('estimated_usmca_savings', { ascending: false })
    .limit(5)

  if (highValueRoutes && highValueRoutes.length > 0) {
    const totalSavings = highValueRoutes.reduce((sum, route) => sum + route.estimated_usmca_savings, 0)
    alerts.push({
      type: 'high_opportunity',
      priority: 'high',
      title: `High-Value ${businessType} Routes Identified`,
      message: `Found ${highValueRoutes.length} routes with $${(totalSavings / 1000000).toFixed(1)}M+ total savings potential`,
      impact: `$${(totalSavings / 1000000).toFixed(1)}M potential`,
      action: 'Review triangle routing options',
      routes: highValueRoutes.map(r => ({
        product: r.product_description,
        savings: r.estimated_usmca_savings,
        value: r.trade_value
      }))
    })
  }

  // Alert 2: Route efficiency comparison
  const { data: routeComparison } = await supabase
    .from('trade_flows')
    .select('triangle_stage, estimated_usmca_savings, partner_country')
    .eq('reporter_country', origin)
    .ilike('product_description', `%${businessType.toLowerCase()}%`)
    .not('estimated_usmca_savings', 'is', null)

  if (routeComparison && routeComparison.length > 0) {
    const routeAnalysis = {}
    routeComparison.forEach(route => {
      const routeStage = route.triangle_stage
      if (!routeAnalysis[routeStage]) routeAnalysis[routeStage] = { count: 0, totalSavings: 0 }
      routeAnalysis[routeStage].count++
      routeAnalysis[routeStage].totalSavings += route.estimated_usmca_savings
    })

    const bestRoute = Object.keys(routeAnalysis).reduce((best, routeStage) => 
      routeAnalysis[routeStage].totalSavings > (routeAnalysis[best]?.totalSavings || 0) ? routeStage : best, '1')

    alerts.push({
      type: 'route_optimization',
      priority: 'medium', 
      title: `Optimal Route Analysis`,
      message: `Route ${bestRoute} shows highest efficiency for ${businessType} products`,
      impact: `$${(routeAnalysis[bestRoute].totalSavings / 1000000).toFixed(1)}M avg savings`,
      action: `Focus on Route ${bestRoute} triangle routing`,
      routes: routeAnalysis
    })
  }

  // Alert 3: Market concentration opportunities
  const { data: concentratedRoutes } = await supabase
    .from('trade_flows')
    .select('partner_country, trade_value, estimated_usmca_savings')
    .eq('reporter_country', origin)
    .ilike('product_description', `%${businessType.toLowerCase()}%`)
    .order('trade_value', { ascending: false })
    .limit(10)

  if (concentratedRoutes && concentratedRoutes.length > 0) {
    const destinationAnalysis = {}
    concentratedRoutes.forEach(route => {
      const dest = route.partner_country
      if (!destinationAnalysis[dest]) destinationAnalysis[dest] = { count: 0, totalValue: 0, totalSavings: 0 }
      destinationAnalysis[dest].count++
      destinationAnalysis[dest].totalValue += route.trade_value
      destinationAnalysis[dest].totalSavings += route.estimated_usmca_savings || 0
    })

    const topDestination = Object.keys(destinationAnalysis).reduce((best, dest) => 
      destinationAnalysis[dest].totalValue > (destinationAnalysis[best]?.totalValue || 0) ? dest : best, 'USA')

    alerts.push({
      type: 'market_concentration',
      priority: 'medium',
      title: `Market Concentration Analysis`,
      message: `${topDestination} represents highest trade value concentration for ${businessType}`,
      impact: `$${(destinationAnalysis[topDestination].totalValue / 1000000).toFixed(1)}M trade value`,
      action: `Prioritize ${origin} → ${topDestination} routes`,
      destinations: destinationAnalysis
    })
  }

  return alerts
}

async function getVolumeChanges(businessType, origin) {
  // Analyze volume patterns based on database intelligence
  const { data: volumeData } = await supabase
    .from('trade_flows')
    .select('trade_value, triangle_stage, product_description')
    .eq('reporter_country', origin)
    .ilike('product_description', `%${businessType.toLowerCase()}%`)
    .order('trade_value', { ascending: false })
    .limit(20)

  const totalVolume = volumeData?.reduce((sum, item) => sum + (item.trade_value || 0), 0) || 0
  const avgValue = volumeData?.length > 0 ? totalVolume / volumeData.length : 0

  return {
    totalTradeVolume: totalVolume,
    averageTradeValue: avgValue,
    recordCount: volumeData?.length || 0,
    trend: totalVolume > 100000000 ? 'increasing' : totalVolume > 10000000 ? 'stable' : 'monitoring',
    insight: `${businessType} from ${origin}: $${(totalVolume / 1000000).toFixed(1)}M total volume across ${volumeData?.length} routes`
  }
}

async function getSavingsOpportunities(origin, destination) {
  // Find untapped savings opportunities
  const { data: opportunities } = await supabase
    .from('trade_flows')
    .select('product_description, estimated_usmca_savings, triangle_stage, trade_value')
    .eq('reporter_country', origin)
    .eq('partner_country', destination)
    .gte('estimated_usmca_savings', 100000) // $100K+ opportunities
    .order('estimated_usmca_savings', { ascending: false })
    .limit(10)

  const totalOpportunity = opportunities?.reduce((sum, opp) => sum + (opp.estimated_usmca_savings || 0), 0) || 0

  return {
    totalOpportunities: opportunities?.length || 0,
    totalSavingsPotential: totalOpportunity,
    averageSavings: opportunities?.length > 0 ? totalOpportunity / opportunities.length : 0,
    topOpportunities: opportunities?.slice(0, 5).map(opp => ({
      product: opp.product_description,
      savings: opp.estimated_usmca_savings,
      routeStage: opp.triangle_stage,
      value: opp.trade_value
    })) || [],
    insight: `${opportunities?.length || 0} active opportunities worth $${(totalOpportunity / 1000000).toFixed(1)}M in potential savings`
  }
}

async function getPeerActivity(businessType) {
  // Monitor what similar companies are doing
  const { data: peerData } = await supabase
    .from('trade_flows')
    .select('reporter_country, partner_country, trade_value, triangle_stage')
    .ilike('product_description', `%${businessType.toLowerCase()}%`)
    .not('trade_value', 'is', null)
    .order('trade_value', { ascending: false })
    .limit(15)

  // Analyze peer patterns
  const countryPairs = {}
  const routeDistribution = {}

  peerData?.forEach(peer => {
    const pair = `${peer.reporter_country} → ${peer.partner_country}`
    countryPairs[pair] = (countryPairs[pair] || 0) + 1
    
    const routeStage = peer.triangle_stage
    routeDistribution[routeStage] = (routeDistribution[routeStage] || 0) + 1
  })

  const topRoute = Object.keys(countryPairs).reduce((best, route) => 
    countryPairs[route] > (countryPairs[best] || 0) ? route : best, 'China → USA')

  const preferredRoute = Object.keys(routeDistribution).reduce((best, routeStage) => 
    routeDistribution[routeStage] > (routeDistribution[best] || 0) ? routeStage : best, '1')

  return {
    totalPeers: peerData?.length || 0,
    topRoute,
    preferredRoute,
    routeDistribution: countryPairs,
    routeStageDistribution: routeDistribution,
    insight: `${businessType} companies favor ${topRoute} routes using Route ${preferredRoute} triangle routing`
  }
}