/**
 * PERSONALIZED MONITORING API
 * Uses Stage 8 hindsight intelligence to create targeted Stage 9 alerts
 * Smart pipeline: User journey → Database patterns → Personalized alerts
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
      userProfile,        // From Stage 8 hindsight analysis
      hindsightInsights,  // Patterns found in Stage 8
      monitoringPrefs = {}
    } = req.body

    console.log('🎯 Personalized monitoring request:', { 
      businessType: userProfile?.businessType,
      origin: userProfile?.origin,
      products: userProfile?.products?.length || 0
    })

    // Build user-specific alert criteria from hindsight analysis
    const alertCriteria = buildAlertCriteria(userProfile, hindsightInsights)
    
    // Generate personalized alerts using criteria
    const personalizedAlerts = await generatePersonalizedAlerts(alertCriteria)
    
    // Priority ranking based on user's specific situation
    const rankedAlerts = rankAlertsByRelevance(personalizedAlerts, userProfile, hindsightInsights)
    
    // Ongoing monitoring setup
    const monitoringPlan = createMonitoringPlan(userProfile, hindsightInsights)

    const personalizedIntelligence = {
      alertCriteria,
      personalizedAlerts: rankedAlerts,
      monitoringPlan,
      relevanceScore: calculateRelevanceScore(rankedAlerts, userProfile),
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ Personalized monitoring intelligence generated')

    res.json({
      success: true,
      source: 'PERSONALIZED_DATABASE_MONITORING',
      personalizedAlerts: rankedAlerts.length,
      personalizedIntelligence
    })

  } catch (error) {
    console.error('❌ Personalized monitoring error:', error.message)
    
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

function buildAlertCriteria(userProfile, hindsightInsights) {
  const criteria = {
    // Product-specific monitoring
    productPatterns: [],
    routePatterns: [],
    savingsThresholds: {},
    priorityFactors: []
  }

  // Extract product patterns from user profile
  if (userProfile?.products) {
    userProfile.products.forEach(product => {
      criteria.productPatterns.push({
        hsCode: product.hsCode,
        description: product.description,
        category: product.category,
        searchTerms: [
          product.description?.toLowerCase(),
          product.category?.toLowerCase(),
          `hs ${product.hsCode}`
        ].filter(Boolean)
      })
    })
  }

  // Extract successful route patterns from hindsight
  if (hindsightInsights?.successPatterns?.topSavers) {
    hindsightInsights.successPatterns.topSavers.forEach(saver => {
      criteria.routePatterns.push({
        origin: saver.reporter_country,
        destination: saver.partner_country,
        stage: saver.triangle_stage,
        minSavings: saver.estimated_usmca_savings * 0.1 // 10% of top saver as threshold
      })
    })
  }

  // Set savings thresholds based on peer benchmarks
  if (hindsightInsights?.peerBenchmarks?.averageSavings) {
    criteria.savingsThresholds = {
      high: hindsightInsights.peerBenchmarks.averageSavings * 2,
      medium: hindsightInsights.peerBenchmarks.averageSavings,
      low: hindsightInsights.peerBenchmarks.averageSavings * 0.5
    }
  } else {
    criteria.savingsThresholds = { high: 1000000, medium: 500000, low: 100000 }
  }

  // Priority factors based on user journey
  criteria.priorityFactors = [
    userProfile?.businessType && `business_${userProfile.businessType.toLowerCase()}`,
    userProfile?.origin && `origin_${userProfile.origin.toLowerCase()}`,
    userProfile?.importVolume && `volume_${userProfile.importVolume}`,
    hindsightInsights?.actualSavings?.bestStage && `stage_${hindsightInsights.actualSavings.bestStage}`
  ].filter(Boolean)

  return criteria
}

async function generatePersonalizedAlerts(criteria) {
  const alerts = []

  // Alert 1: Product-specific opportunities
  for (const productPattern of criteria.productPatterns) {
    const { data: productOpportunities } = await supabase
      .from('trade_flows')
      .select('product_description, trade_value, estimated_usmca_savings, reporter_country, partner_country, triangle_stage')
      .or(productPattern.searchTerms.map(term => `product_description.ilike.%${term}%`).join(','))
      .gte('estimated_usmca_savings', criteria.savingsThresholds.medium)
      .order('estimated_usmca_savings', { ascending: false })
      .limit(5)

    if (productOpportunities && productOpportunities.length > 0) {
      const totalSavings = productOpportunities.reduce((sum, opp) => sum + (opp.estimated_usmca_savings || 0), 0)
      
      alerts.push({
        type: 'product_opportunity',
        priority: totalSavings >= criteria.savingsThresholds.high ? 'high' : 'medium',
        category: 'YOUR_PRODUCTS',
        title: `${productPattern.description} Optimization Opportunities`,
        message: `Found ${productOpportunities.length} high-value routes for your specific products`,
        impact: `$${(totalSavings / 1000000).toFixed(1)}M potential savings`,
        relevanceScore: 95, // High relevance - user's actual products
        action: `Review ${productPattern.description} triangle routing options`,
        data: productOpportunities,
        personalizedFor: productPattern
      })
    }
  }

  // Alert 2: Route-specific intelligence  
  for (const routePattern of criteria.routePatterns) {
    const { data: routeIntelligence } = await supabase
      .from('trade_flows')
      .select('product_description, trade_value, estimated_usmca_savings, triangle_stage')
      .eq('reporter_country', routePattern.origin)
      .eq('partner_country', routePattern.destination)
      .gte('estimated_usmca_savings', routePattern.minSavings)
      .order('estimated_usmca_savings', { ascending: false })
      .limit(10)

    if (routeIntelligence && routeIntelligence.length > 0) {
      const avgSavings = routeIntelligence.reduce((sum, intel) => sum + (intel.estimated_usmca_savings || 0), 0) / routeIntelligence.length
      
      alerts.push({
        type: 'route_intelligence',
        priority: avgSavings >= criteria.savingsThresholds.high ? 'high' : 'medium',
        category: 'YOUR_ROUTES',
        title: `${routePattern.origin} → ${routePattern.destination} Route Activity`,
        message: `${routeIntelligence.length} active opportunities on your preferred route`,
        impact: `$${(avgSavings / 1000000).toFixed(1)}M average opportunity size`,
        relevanceScore: 90, // High relevance - user's successful route
        action: `Monitor ${routePattern.origin} → ${routePattern.destination} developments`,
        data: routeIntelligence,
        personalizedFor: routePattern
      })
    }
  }

  // Alert 3: Peer benchmark changes
  const { data: peerActivity } = await supabase
    .from('trade_flows')
    .select('reporter_country, partner_country, trade_value, estimated_usmca_savings, triangle_stage, product_description')
    .in('reporter_country', criteria.routePatterns.map(r => r.origin))
    .gte('estimated_usmca_savings', criteria.savingsThresholds.low)
    .order('trade_value', { ascending: false })
    .limit(15)

  if (peerActivity && peerActivity.length > 0) {
    const totalPeerValue = peerActivity.reduce((sum, peer) => sum + (peer.trade_value || 0), 0)
    
    alerts.push({
      type: 'peer_benchmarking',
      priority: 'medium',
      category: 'MARKET_INTELLIGENCE',
      title: 'Similar Companies Activity',
      message: `Companies with your profile show $${(totalPeerValue / 1000000).toFixed(1)}M in recent activity`,
      impact: `${peerActivity.length} peer opportunities to analyze`,
      relevanceScore: 75, // Medium relevance - similar companies
      action: 'Review peer activity patterns',
      data: peerActivity,
      personalizedFor: criteria.priorityFactors
    })
  }

  return alerts
}

function rankAlertsByRelevance(alerts, userProfile, hindsightInsights) {
  return alerts
    .sort((a, b) => {
      // Primary: Priority level
      const priorityScore = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Secondary: Relevance score
      return b.relevanceScore - a.relevanceScore
    })
    .map((alert, index) => ({
      ...alert,
      rank: index + 1,
      displayOrder: index + 1
    }))
}

function createMonitoringPlan(userProfile, hindsightInsights) {
  return {
    monitoringFocus: [
      userProfile?.businessType && `${userProfile.businessType} industry trends`,
      userProfile?.origin && `${userProfile.origin} trade developments`,
      hindsightInsights?.actualSavings?.bestStage && `Stage ${hindsightInsights.actualSavings.bestStage} route opportunities`
    ].filter(Boolean),
    
    alertFrequency: {
      high_priority: 'daily',
      medium_priority: 'weekly', 
      low_priority: 'monthly'
    },
    
    keyMetrics: [
      'Product-specific savings opportunities',
      'Route performance changes',
      'Peer benchmark shifts',
      'Market concentration updates'
    ],
    
    customization: {
      productFocus: userProfile?.products?.map(p => p.category) || [],
      routeFocus: hindsightInsights?.routePerformance?.topDestination || 'USA',
      savingsThreshold: hindsightInsights?.peerBenchmarks?.averageSavings || 500000
    }
  }
}

function calculateRelevanceScore(alerts, userProfile) {
  if (!alerts.length) return 0
  
  const avgRelevance = alerts.reduce((sum, alert) => sum + (alert.relevanceScore || 50), 0) / alerts.length
  const highPriorityCount = alerts.filter(a => a.priority === 'high').length
  const personalizedCount = alerts.filter(a => a.category?.includes('YOUR_')).length
  
  return Math.round(avgRelevance + (highPriorityCount * 5) + (personalizedCount * 10))
}