// Test API to debug triangle routing database queries

import { getSupabaseClient } from '../../lib/supabase-client.js'

const supabase = getSupabaseClient()

export default async function handler(req, res) {
  console.log('🧪 TEST ROUTES API: Testing triangle routing queries')
  
  try {
    // Test 1: Get all triangle routing opportunities
    console.log('📊 Test 1: Fetching all triangle routing opportunities')
    const { data: allRoutes, error: allError } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .limit(5)
    
    console.log('📊 All routes result:', { found: allRoutes?.length || 0, error: allError })
    
    // Test 2: Try with specific business type
    console.log('📊 Test 2: Querying by Electronics business type')
    const { data: electronicsRoutes, error: electronicsError } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .ilike('business_type', '%Electronics%')
      .limit(5)
    
    console.log('📊 Electronics routes result:', { found: electronicsRoutes?.length || 0, error: electronicsError })
    
    // Test 3: Try with HS code
    console.log('📊 Test 3: Querying by HS code 8504.40')
    const { data: hsRoutes, error: hsError } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .eq('hs_code', '8504.40')
      .limit(5)
    
    console.log('📊 HS code routes result:', { found: hsRoutes?.length || 0, error: hsError })
    
    // Test 4: Get table structure
    const { data: sampleRoute } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .limit(1)
      .single()
    
    console.log('📊 Sample route structure:', sampleRoute)
    
    return res.status(200).json({
      success: true,
      tests: {
        allRoutes: { count: allRoutes?.length || 0, error: allError?.message },
        electronicsRoutes: { count: electronicsRoutes?.length || 0, error: electronicsError?.message },
        hsRoutes: { count: hsRoutes?.length || 0, error: hsError?.message },
        sampleRoute: sampleRoute
      }
    })
    
  } catch (error) {
    console.error('❌ Test routes API failed:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}