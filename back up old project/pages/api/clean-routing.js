/**
 * CLEAN TRIANGLE ROUTING API
 * No agent complexity - direct database queries only
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
    // Simple, direct parameters - no complex mapping
    const { 
      product,           // "bluetooth headphones"  
      origin = 'China',  // "China", "India", "Vietnam"
      destination = 'USA' // Always USA for now
    } = req.body

    console.log('🎯 Clean routing request:', { product, origin, destination })

    // Direct database query - no complex logic
    const { data: routes, error } = await supabase
      .from('trade_flows')
      .select(`
        reporter_country,
        partner_country, 
        product_description,
        trade_value,
        triangle_stage,
        estimated_usmca_savings,
        route_recommendation
      `)
      .ilike('product_description', `%${product}%`)
      .order('trade_value', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    // Group routes by triangle stage
    const triangleRoutes = routes?.filter(r => r.triangle_stage === '1' || r.triangle_stage === 1) || []
    const finalRoutes = routes?.filter(r => r.triangle_stage === '2' || r.triangle_stage === 2) || []
    const directRoutes = routes?.filter(r => r.triangle_stage === 'direct') || []

    // Calculate total savings
    const totalSavings = routes?.reduce((sum, route) => {
      return sum + (route.estimated_usmca_savings || 0)
    }, 0) || 0

    // Simple response - no complex objects
    const response = {
      success: true,
      query: { product, origin, destination },
      results: {
        total: routes?.length || 0,
        triangleRoutes: triangleRoutes.length,
        finalRoutes: finalRoutes.length, 
        directRoutes: directRoutes.length,
        totalSavings,
        routes: routes || []
      }
    }

    console.log('✅ Clean routing response:', {
      total: response.results.total,
      savings: totalSavings
    })

    res.json(response)

  } catch (error) {
    console.error('❌ Clean routing error:', error.message)
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database query failed'
    })
  }
}