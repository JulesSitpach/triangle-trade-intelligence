/**
 * Triangle Intelligence Platform - Batch Query Test
 * Simple demonstration of batch query optimization
 */

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
    logInfo('Testing batch query optimization')
    
    const supabase = getSupabaseClient()
    const businessTypes = ['Electronics', 'Automotive', 'Textiles']
    
    // N+1 Query Approach (BAD)
    const n1StartTime = Date.now()
    let n1QueryCount = 0
    const n1Results = []
    
    for (const businessType of businessTypes) {
      n1QueryCount++
      const { data: tradeFlows } = await supabase
        .from('trade_flows')
        .select('id, product_category, trade_value')
        .eq('product_category', businessType)
        .limit(10)
      
      n1QueryCount++
      const { data: comtrade } = await supabase
        .from('comtrade_reference')
        .select('hs_code, product_category')
        .eq('product_category', businessType)
        .limit(5)
      
      n1Results.push({
        businessType,
        tradeFlowsFound: tradeFlows?.length || 0,
        comtradeFound: comtrade?.length || 0
      })
    }
    const n1Duration = Date.now() - n1StartTime
    
    // Batch Query Approach (GOOD)
    const batchStartTime = Date.now()
    let batchQueryCount = 0
    
    // Single query for all business types
    batchQueryCount++
    const { data: allTradeFlows } = await supabase
      .from('trade_flows')
      .select('id, product_category, trade_value')
      .in('product_category', businessTypes)
      .limit(30)
    
    batchQueryCount++
    const { data: allComtrade } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_category')
      .in('product_category', businessTypes)
      .limit(15)
    
    // Group results by business type
    const batchResults = businessTypes.map(businessType => ({
      businessType,
      tradeFlowsFound: allTradeFlows.filter(tf => tf.product_category === businessType).length,
      comtradeFound: allComtrade.filter(c => c.product_category === businessType).length
    }))
    
    const batchDuration = Date.now() - batchStartTime
    
    // Performance comparison
    const improvement = {
      timeReduction: Math.round(((n1Duration - batchDuration) / n1Duration) * 100),
      queryReduction: Math.round(((n1QueryCount - batchQueryCount) / n1QueryCount) * 100),
      efficiency: Math.round((n1Duration / batchDuration) * 100)
    }
    
    const totalDuration = Date.now() - startTime
    logPerformance('batch_query_test', totalDuration, improvement)
    
    return res.status(200).json({
      success: true,
      message: 'Batch query optimization test completed',
      timestamp: new Date().toISOString(),
      results: {
        n1Approach: {
          duration: `${n1Duration}ms`,
          queryCount: n1QueryCount,
          results: n1Results
        },
        batchApproach: {
          duration: `${batchDuration}ms`,
          queryCount: batchQueryCount,
          results: batchResults
        },
        improvement: {
          timeReduction: `${improvement.timeReduction}%`,
          queryReduction: `${improvement.queryReduction}%`,
          efficiency: `${improvement.efficiency}% of original time`
        },
        recommendations: [
          {
            priority: 'high',
            recommendation: improvement.timeReduction > 50 ? 
              'Implement batch queries immediately for 50%+ performance gain' :
              'Batch queries provide moderate performance improvement',
            impact: `${improvement.timeReduction}% faster, ${improvement.queryReduction}% fewer queries`
          },
          {
            priority: 'implementation',
            recommendation: 'Use IN clauses and Promise.all() for batching',
            impact: 'Supports higher concurrent user loads'
          },
          {
            priority: 'infrastructure',
            recommendation: 'Consider database indexes for further optimization',
            impact: 'Additional 50-80% performance gains possible'
          }
        ]
      },
      executionTime: `${totalDuration}ms`
    })
    
  } catch (error) {
    logError('Batch query test failed', { error: error.message })
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Batch query optimization test failed'
    })
  }
}