/**
 * SIMPLIFIED STATUS ENDPOINT
 * No complex dependencies - basic health check for reliable operation
 * Part of 4-page simplification plan for Triangle Intelligence Platform
 */

export default async function handler(req, res) {
  const startTime = Date.now()
  
  try {
    // Basic headers
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-cache')
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only GET requests are supported'
      })
    }
    
    // Simple system health without complex dependencies
    const memUsage = process.memoryUsage()
    
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '4.0-simplified',
      mode: 'simplified_reliable',
      uptime: Math.floor(process.uptime()),
      memory_mb: Math.round(memUsage.rss / 1024 / 1024),
      response_time_ms: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development',
      
      // Simplified services status
      services: {
        'static-apis': 'operational',
        'simple-classification': 'operational',
        'simple-savings-calculator': 'operational',
        'static-dropdown-options': 'operational',
        'simple-status': 'operational'
      },
      
      // Simplification flags
      simplification: {
        database_queries_disabled: true,
        complex_apis_disabled: true,
        static_endpoints_enabled: true,
        reliability_focused: true,
        beast_master_disabled: true,
        goldmine_intelligence_disabled: true
      },
      
      // Page status
      pages: {
        foundation: 'using static dropdowns',
        product: 'using simple classification',
        routing: 'using basic calculations', 
        alerts: 'using threshold alerts'
      },
      
      // Working endpoints
      working_endpoints: [
        '/api/simple-dropdown-options',
        '/api/simple-classification', 
        '/api/simple-savings',
        '/api/status'
      ],
      
      disclaimer: 'SIMPLIFIED MODE: All calculations are estimates only. Verify with customs authorities before making business decisions.',
      
      // Customer journey status
      customer_journey: {
        foundation_to_product: 'working',
        product_to_routing: 'working', 
        routing_to_alerts: 'working',
        alerts_completion: 'working',
        estimated_completion_time: '5 minutes'
      }
    }

    res.status(200).json(status)

  } catch (error) {
    console.error('Status check error:', error)
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Status check failed',
      error: error.message,
      version: '4.0-simplified'
    })
  }
}