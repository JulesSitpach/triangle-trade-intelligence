/**
 * ENHANCED CLASSIFICATION API
 * Uses improved database connectivity and field mapping
 * Addresses core alignment issues for better reliability
 */

import enhancedDatabaseClient from '../../lib/database/enhanced-database-client.js';

export default async function handler(req, res) {
  const startTime = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  try {
    const { product_description, business_type } = req.body;

    // Validate input
    if (!product_description || typeof product_description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'product_description is required and must be a string'
      });
    }

    // Check database health before processing
    const healthStatus = await enhancedDatabaseClient.getHealthStatus();
    
    // Search using enhanced database client
    const searchResult = await enhancedDatabaseClient.searchProducts(
      product_description.trim(),
      business_type,
      10
    );

    const processingTime = Date.now() - startTime;

    // Return enhanced response with health indicators
    return res.status(200).json({
      success: searchResult.success,
      results: searchResult.results || [],
      totalMatches: searchResult.totalMatches || 0,
      method: searchResult.method || 'enhanced_classification',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      
      // Health and reliability indicators
      healthIndicators: {
        databaseHealthy: healthStatus.isHealthy,
        connectionRetries: healthStatus.connectionRetries,
        responseTime: processingTime
      },
      
      // Data quality indicators
      dataQuality: searchResult.results && searchResult.results.length > 0 ? {
        hasRequiredFields: searchResult.results[0].hs_code && 
                          searchResult.results[0].description &&
                          searchResult.results[0].mfn_rate !== undefined &&
                          searchResult.results[0].usmca_rate !== undefined,
        averageConfidence: searchResult.results.reduce((acc, r) => acc + (r.confidence || 0), 0) / searchResult.results.length,
        fieldCompleteness: searchResult.results[0] ? Object.keys(searchResult.results[0]).length : 0
      } : null,
      
      // Include error details if search failed
      ...(searchResult.error && { 
        error: searchResult.error,
        troubleshooting: {
          checkDatabaseConnection: !healthStatus.isHealthy,
          checkEnvironmentVariables: !healthStatus.environment.hasSupabaseUrl || !healthStatus.environment.hasServiceKey,
          retryRecommended: healthStatus.connectionRetries < 3
        }
      })
    });

  } catch (error) {
    console.error('Enhanced classification API error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Classification service temporarily unavailable',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
      
      // Include diagnostic information for debugging
      diagnostic: {
        errorType: error.name,
        hasEnvironmentConfig: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                 (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)),
        nodeEnvironment: process.env.NODE_ENV || 'unknown'
      }
    });
  }
}