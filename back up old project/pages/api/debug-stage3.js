// Debug API to test Stage 3 routing logic server-side

import { getSupabaseClient } from '../../lib/supabase-client.js'

const supabase = getSupabaseClient()

export default async function handler(req, res) {
  console.log('🧪 DEBUG STAGE 3: Testing routing logic server-side')
  
  try {
    // Simulate the Stage 3 data
    const testStage1Data = {
      companyName: 'Test Company',
      businessType: 'Electronics',
      zipCode: 'M5V 3A8',
      primarySupplierCountry: 'CN',
      importVolume: '$5M - $25M'
    }
    
    const testStage2Data = {
      products: [{ description: 'Solar panel microinverters', hsCode: '8504.40', confidence: 103 }],
      hsCodes: ['8504.40'],
      businessType: 'Electronics'
    }
    
    console.log('📊 Testing getDatabaseTriangleRoutes logic...')
    
    // Test the database query
    const { data: allRoutes, error: allError } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .order('success_rate', { ascending: false, nullsLast: true })
      .limit(10)
    
    console.log('📊 Database query result:', { found: allRoutes?.length || 0, error: allError })
    
    if (allRoutes && allRoutes.length > 0) {
      // Process the routes like Stage 3 does
      const processedRoutes = allRoutes.map((route, index) => {
        const routeMapping = {
          'via_mexico': `${route.origin_country || 'China'} → Mexico → USA`,
          'via_canada': `${route.origin_country || 'China'} → Canada → USA`
        }
        const routeName = routeMapping[route.optimal_route] || route.optimal_route || 'Unknown Route'
        
        return {
          id: `db_route_${index}`,
          name: routeName,
          description: route.product_description ? 
            `${route.product_description} via USMCA triangle routing` :
            `Triangle routing optimization via ${route.optimal_route === 'via_mexico' ? 'Mexico' : 'Canada'}`,
          transitTime: route.avg_implementation_time || '28-35 days',
          complexity: route.implementation_complexity || 'Medium',
          savings: `Up to $${Math.round(route.max_savings_amount / 1000)}K annually`,
          recommended: index === 0,
          tariffRate: `${route.max_savings_percentage}% → 0% (USMCA)`,
          successRate: route.success_rate || 75
        }
      })
      
      console.log('✅ Processed routes:', processedRoutes.length)
      
      return res.status(200).json({
        success: true,
        message: 'Triangle routing logic working',
        foundationData: testStage1Data,
        productData: testStage2Data,
        rawRoutes: allRoutes.length,
        processedRoutes: processedRoutes
      })
    } else {
      return res.status(200).json({
        success: false,
        message: 'No routes found in database',
        foundationData: testStage1Data,
        productData: testStage2Data,
        rawRoutes: 0,
        processedRoutes: []
      })
    }
    
  } catch (error) {
    console.error('❌ Debug Stage 3 failed:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}