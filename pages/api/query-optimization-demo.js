/**
 * Triangle Intelligence Platform - Query Optimization Demo
 * Demonstrates the performance difference between N+1 queries and batch queries
 */

import { BatchQueryOptimizer } from '../../lib/database/batch-query-optimizer.js'
import { getSupabaseClient } from '../../lib/supabase-client.js'
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET']
    })
  }
  
  try {
    logInfo('Starting query optimization demonstration')
    
    const demoProfiles = [
      { businessType: 'Electronics', importVolume: '$1M - $5M annually' },
      { businessType: 'Automotive', importVolume: '$5M - $10M annually' },
      { businessType: 'Textiles', importVolume: '$500K - $1M annually' }
    ]
    
    // Simulate old N+1 query approach
    const n1Results = await demonstrateN1Queries(demoProfiles)
    
    // Demonstrate optimized batch approach
    const batchResults = await demonstrateBatchQueries(demoProfiles)
    
    // Compare performance
    const performanceComparison = {
      n1Approach: {
        totalTime: n1Results.totalTime,
        queryCount: n1Results.queryCount,
        avgQueryTime: Math.round(n1Results.totalTime / n1Results.queryCount)
      },
      batchApproach: {
        totalTime: batchResults.totalTime,
        queryCount: batchResults.queryCount,
        avgQueryTime: Math.round(batchResults.totalTime / batchResults.queryCount)
      },
      improvement: {
        timeReduction: Math.round(((n1Results.totalTime - batchResults.totalTime) / n1Results.totalTime) * 100),
        queryReduction: Math.round(((n1Results.queryCount - batchResults.queryCount) / n1Results.queryCount) * 100),
        efficiency: Math.round((n1Results.totalTime / batchResults.totalTime) * 100)
      }
    }
    
    const totalDuration = Date.now() - startTime
    logPerformance('query_optimization_demo', totalDuration, performanceComparison)
    
    return res.status(200).json({
      success: true,
      message: 'Query optimization demonstration completed',
      timestamp: new Date().toISOString(),
      demonstration: {
        profilesTested: demoProfiles.length,
        n1Results: n1Results.results,
        batchResults: batchResults.results,
        performanceComparison,
        recommendations: generateOptimizationRecommendations(performanceComparison)
      },
      execution: {
        totalDuration: `${totalDuration}ms`,
        n1Time: `${n1Results.totalTime}ms`,
        batchTime: `${batchResults.totalTime}ms`
      }
    })
    
  } catch (error) {
    logError('Query optimization demo failed', { error: error.message })
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Demonstrate N+1 query pattern (the problematic approach)
 */
async function demonstrateN1Queries(profiles) {
  const startTime = Date.now()
  const supabase = getSupabaseClient()
  let queryCount = 0
  const results = []
  
  // This simulates the N+1 pattern: one query per profile
  for (const profile of profiles) {
    queryCount++
    const { data: sessions } = await supabase
      .from('workflow_sessions')
      .select('id, user_id, data, state')
      .limit(10)
    
    queryCount++
    const { data: tradeFlows } = await supabase
      .from('trade_flows')
      .select('id, reporter_country, partner_country, product_category, trade_value')
      .eq('product_category', profile.businessType)
      .limit(20)
    
    queryCount++
    const { data: comtrade } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_category, product_description, usmca_eligible')
      .eq('product_category', profile.businessType)
      .limit(15)
    
    results.push({
      profile,
      sessionsCount: sessions?.length || 0,
      tradeFlowsCount: tradeFlows?.length || 0,
      comtradeCount: comtrade?.length || 0
    })
  }
  
  const totalTime = Date.now() - startTime
  
  return { totalTime, queryCount, results }
}

/**
 * Demonstrate optimized batch query approach
 */
async function demonstrateBatchQueries(profiles) {
  const startTime = Date.now()
  let queryCount = 0
  
  // Extract unique business types for batch querying
  const businessTypes = [...new Set(profiles.map(p => p.businessType))]
  
  // Single batch query for workflow sessions
  queryCount++
  const sessionsBatch = await BatchQueryOptimizer.getWorkflowSessionsByBusinessTypes(businessTypes)
  
  // Single batch query for trade flows
  queryCount++
  const tradeFlowsBatch = await BatchQueryOptimizer.getTradeFlowsBatch({
    countries: ['China', 'India', 'Vietnam'],
    limit: 100
  })
  
  // Filter trade flows by business type (could be optimized further with product category index)
  const tradeFlowsByCategory = {}
  businessTypes.forEach(type => {
    tradeFlowsByCategory[type] = tradeFlowsBatch.filter(flow => 
      flow.product_category === type
    ).slice(0, 20)
  })
  
  // Single batch query for comtrade reference
  queryCount++
  const { data: comtradeBatch } = await BatchQueryOptimizer.getComtradeReferenceBatch(
    [...new Set(tradeFlowsBatch.map(f => f.hs_code).filter(Boolean))].slice(0, 50)
  )
  
  // Group comtrade data by product category
  const comtradeByCategory = {}
  businessTypes.forEach(type => {
    comtradeByCategory[type] = comtradeBatch.filter(item => 
      item.product_category === type
    ).slice(0, 15)
  })
  
  // Assemble results for each profile
  const results = profiles.map(profile => ({
    profile,
    sessionsCount: sessionsBatch[profile.businessType]?.length || 0,
    tradeFlowsCount: tradeFlowsByCategory[profile.businessType]?.length || 0,
    comtradeCount: comtradeByCategory[profile.businessType]?.length || 0
  }))
  
  const totalTime = Date.now() - startTime
  
  return { totalTime, queryCount, results }
}

/**
 * Generate optimization recommendations based on performance comparison
 */
function generateOptimizationRecommendations(comparison) {
  const recommendations = []
  
  if (comparison.improvement.timeReduction > 50) {
    recommendations.push({
      priority: 'high',
      recommendation: 'Implement batch query optimization immediately',
      impact: `${comparison.improvement.timeReduction}% faster response times`,
      effort: 'medium'
    })
  }
  
  if (comparison.improvement.queryReduction > 60) {
    recommendations.push({
      priority: 'high',
      recommendation: 'Reduce database load with batch operations',
      impact: `${comparison.improvement.queryReduction}% fewer database queries`,
      effort: 'low'
    })
  }
  
  if (comparison.batchApproach.totalTime < 500) {
    recommendations.push({
      priority: 'medium',
      recommendation: 'Database performance is excellent with batch queries',
      impact: 'Ready for production scaling',
      effort: 'complete'
    })
  }
  
  if (comparison.improvement.efficiency > 300) {
    recommendations.push({
      priority: 'critical',
      recommendation: 'Batch queries are 3x+ more efficient',
      impact: 'Can support 3x more concurrent users',
      effort: 'implementation required'
    })
  }
  
  recommendations.push({
    priority: 'optimization',
    recommendation: 'Consider implementing database indexes for further improvements',
    impact: 'Additional 50-80% performance gains possible',
    effort: 'low'
  })
  
  return recommendations
}