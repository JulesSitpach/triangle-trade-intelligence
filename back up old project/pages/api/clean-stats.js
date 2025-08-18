/**
 * CLEAN DATABASE STATS API  
 * Show the $73B intelligence directly - no fluff
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Loading clean database stats')

    // Direct parallel queries - no complex calculations
    const [
      { count: totalRecords },
      { data: tradeValues },
      { data: topCountries },
      { data: topProducts },
      { data: triangleStats }
    ] = await Promise.all([
      // Total records
      supabase
        .from('trade_flows')
        .select('*', { count: 'exact', head: true }),
      
      // Trade values for total calculation
      supabase
        .from('trade_flows')
        .select('trade_value')
        .not('trade_value', 'is', null),
      
      // Top countries by trade volume
      supabase
        .from('trade_flows')
        .select('reporter_country, trade_value')
        .not('trade_value', 'is', null)
        .order('trade_value', { ascending: false })
        .limit(5),
      
      // Top products by trade value
      supabase
        .from('trade_flows')  
        .select('product_description, trade_value')
        .not('trade_value', 'is', null)
        .order('trade_value', { ascending: false })
        .limit(5),
      
      // Triangle routing distribution
      supabase
        .from('trade_flows')
        .select('triangle_stage')
        .not('triangle_stage', 'is', null)
    ])

    // Simple calculations - no complex logic
    const totalTradeValue = tradeValues?.reduce((sum, row) => {
      return sum + (parseFloat(row.trade_value) || 0)
    }, 0) || 0

    // Count triangle stages
    const stageCount = {}
    triangleStats?.forEach(row => {
      const stage = row.triangle_stage
      stageCount[stage] = (stageCount[stage] || 0) + 1
    })

    // Clean response - just the facts
    const stats = {
      database: {
        totalRecords: totalRecords || 0,
        totalTradeValue: Math.round(totalTradeValue),
        lastUpdated: new Date().toISOString()
      },
      
      triangleRouting: {
        stage1: stageCount['1'] || 0,
        stage2: stageCount['2'] || 0, 
        direct: stageCount['direct'] || 0
      },
      
      topCountries: topCountries?.map(row => ({
        country: row.reporter_country,
        tradeValue: Math.round(parseFloat(row.trade_value) || 0)
      })) || [],
      
      topProducts: topProducts?.map(row => ({
        product: row.product_description?.substring(0, 50) + '...',
        tradeValue: Math.round(parseFloat(row.trade_value) || 0)
      })) || []
    }

    console.log('✅ Stats loaded:', {
      records: stats.database.totalRecords,
      value: `$${(stats.database.totalTradeValue / 1000000000).toFixed(1)}B`
    })

    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('❌ Stats error:', error.message)
    
    res.status(500).json({
      success: false,
      error: error.message,
      stats: null
    })
  }
}