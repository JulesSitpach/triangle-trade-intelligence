/**
 * CLEAN PRODUCT SEARCH API
 * Direct database search - no classification complexity
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
    const { q = '' } = req.query // Simple query parameter

    console.log('🔍 Clean product search:', q)

    if (!q.trim()) {
      // Return popular products when no search
      const { data: popular, error } = await supabase
        .from('trade_flows')
        .select('product_description, trade_value')
        .order('trade_value', { ascending: false })
        .limit(20)

      if (error) throw error

      return res.json({
        success: true,
        query: '',
        type: 'popular',
        results: popular || []
      })
    }

    // Direct text search - no complex matching
    const { data: products, error } = await supabase
      .from('trade_flows')
      .select(`
        product_description,
        hs_code,
        trade_value,
        reporter_country,
        partner_country
      `)
      .ilike('product_description', `%${q}%`)
      .order('trade_value', { ascending: false })
      .limit(15)

    if (error) throw error

    // Simple response
    res.json({
      success: true,
      query: q,
      type: 'search',
      results: products || []
    })

    console.log('✅ Found products:', products?.length || 0)

  } catch (error) {
    console.error('❌ Product search error:', error.message)
    
    res.status(500).json({
      success: false,
      error: error.message,
      results: []
    })
  }
}