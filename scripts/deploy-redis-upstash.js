/**
 * Deploy Redis via Upstash for Triangle Intelligence Platform
 * Provides immediate Redis deployment for production readiness
 */

import https from 'https'
import { logInfo, logError, logWarn } from '../lib/utils/production-logger.js'

/**
 * Upstash Redis Deployment Guide and Setup
 * This script provides instructions and validation for Redis deployment
 */
class UpstashRedisDeployer {
  constructor() {
    this.apiEndpoint = 'api.upstash.com'
    this.region = 'us-east-1' // Default region for lowest latency
  }

  /**
   * Display deployment instructions for Upstash Redis
   */
  displayDeploymentInstructions() {
    const instructions = `
🚀 TRIANGLE INTELLIGENCE PLATFORM - REDIS DEPLOYMENT

IMMEDIATE ACTION REQUIRED FOR PRODUCTION READINESS:

1. CREATE UPSTASH ACCOUNT (FREE TIER - 500K COMMANDS/MONTH):
   - Visit: https://upstash.com/
   - Sign up with your email
   - Click "Create Database"
   - Select "Global" region for best performance
   - Choose "Free" tier (perfect for development/testing)

2. GET REDIS CONNECTION DETAILS:
   After creating database, copy these values:
   - REDIS_URL: redis://:PASSWORD@HOST:PORT
   - UPSTASH_REDIS_REST_URL: https://HOST.upstash.io
   - UPSTASH_REDIS_REST_TOKEN: Your auth token

3. UPDATE ENVIRONMENT VARIABLES (.env.local):
   Add these lines to your .env.local file:
   
   # Redis Configuration (Upstash)
   REDIS_URL=redis://:your-password@your-host.upstash.io:6379
   UPSTASH_REDIS_REST_URL=https://your-host.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   
   # Enable Redis rate limiting
   ENABLE_REDIS_RATE_LIMITING=true
   SKIP_RATE_LIMIT=false

4. RESTART YOUR APPLICATION:
   npm run dev
   
5. VERIFY DEPLOYMENT:
   curl http://localhost:3006/api/infrastructure-test

EXPECTED RESULTS:
- Cache backend should change from "MEMORY_FALLBACK" to "REDIS"
- Production readiness score should improve to 75%+
- Response times should remain <500ms

ALTERNATIVE: Railway Redis (if Upstash doesn't work):
   - Visit: https://railway.app/
   - Create project, add Redis service
   - Copy connection string to REDIS_URL

PRODUCTION DEPLOYMENT (AFTER TESTING):
   - Upgrade to Upstash Pro if needed (unlimited requests)
   - Set up monitoring alerts
   - Configure backups (automatic with Upstash)
   - Update Vercel environment variables for production

COST ANALYSIS:
- Free Tier: 500K commands/month (covers most development)
- Pro Tier: $20/month for unlimited (production)
- Alternative: Railway $5/month for basic Redis

SECURITY NOTES:
- Never commit Redis URLs to git
- Use different databases for dev/staging/production  
- Enable TLS in production (Upstash provides this automatically)

=================================================================
NEXT STEPS AFTER REDIS DEPLOYMENT:
1. Run infrastructure test: /api/infrastructure-test
2. Test routing performance: Should be <500ms consistently
3. Verify rate limiting: /api/redis-rate-limit-test
4. Deploy to production with Vercel environment variables
=================================================================
`

    console.log(instructions)
    logInfo('Redis deployment instructions displayed')
    
    return instructions
  }

  /**
   * Validate current Redis configuration
   */
  async validateRedisConfig() {
    const issues = []
    const recommendations = []

    // Check environment variables
    const requiredVars = [
      'REDIS_URL',
      'ENABLE_REDIS_RATE_LIMITING'
    ]

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        issues.push(`Missing environment variable: ${varName}`)
      }
    }

    // Check optional but recommended vars
    const recommendedVars = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ]

    for (const varName of recommendedVars) {
      if (!process.env[varName]) {
        recommendations.push(`Consider adding: ${varName} for REST API access`)
      }
    }

    return {
      configured: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * Test Redis connection without importing the full client
   */
  async testConnection() {
    const validation = await this.validateRedisConfig()
    
    if (!validation.configured) {
      logError('Redis configuration incomplete', { issues: validation.issues })
      return {
        success: false,
        error: 'Configuration incomplete',
        issues: validation.issues
      }
    }

    try {
      // Try to load the Redis client
      const { getRedisClient } = await import('../lib/redis-client.js')
      const client = await getRedisClient()
      
      // Test basic operations
      const testKey = 'deployment_test_' + Date.now()
      await client.set(testKey, 'success', 'EX', 60)
      const result = await client.get(testKey)
      await client.del(testKey)
      
      logInfo('Redis connection test successful', { testKey, result })
      
      return {
        success: true,
        result: result === 'success',
        message: 'Redis connected and operational'
      }
    } catch (error) {
      logError('Redis connection test failed', { error: error.message })
      return {
        success: false,
        error: error.message,
        recommendation: 'Check REDIS_URL format and network connectivity'
      }
    }
  }

  /**
   * Generate Redis performance optimization recommendations
   */
  getPerformanceOptimizations() {
    return {
      caching: {
        strategy: 'Aggressive caching for stable data (USMCA rates, HS codes)',
        ttl: {
          stable: '24 hours or more',
          volatile: '5-15 minutes',
          api_responses: '1-4 hours'
        }
      },
      rateLimiting: {
        api_requests: '100 requests per minute per IP',
        database_queries: '50 queries per minute per user',
        burst_allowance: '200 requests per minute for authenticated users'
      },
      monitoring: {
        metrics: ['connection_pool_size', 'response_times', 'cache_hit_ratio'],
        alerts: ['memory_usage_80%', 'connection_failures', 'slow_queries']
      }
    }
  }
}

/**
 * Main deployment function
 */
export async function deployRedis(options = {}) {
  const deployer = new UpstashRedisDeployer()
  
  console.log('🚀 TRIANGLE INTELLIGENCE REDIS DEPLOYMENT\n')
  
  // Display instructions
  deployer.displayDeploymentInstructions()
  
  // Validate current configuration
  const validation = await deployer.validateRedisConfig()
  
  if (validation.configured) {
    console.log('\n✅ REDIS CONFIGURATION FOUND - Testing connection...\n')
    
    const connectionTest = await deployer.testConnection()
    
    if (connectionTest.success) {
      console.log('🎉 REDIS DEPLOYMENT SUCCESSFUL!')
      console.log('   - Connection: ✅ Connected')
      console.log('   - Operations: ✅ Working')
      console.log('   - Status: 🟢 Production Ready')
      
      logInfo('Redis deployment validation successful')
      
      return {
        success: true,
        status: 'DEPLOYED',
        message: 'Redis is connected and operational'
      }
    } else {
      console.log('❌ REDIS CONNECTION FAILED')
      console.log('   - Error:', connectionTest.error)
      console.log('   - Recommendation:', connectionTest.recommendation || 'Check configuration')
      
      return {
        success: false,
        status: 'CONFIGURATION_ERROR',
        error: connectionTest.error
      }
    }
  } else {
    console.log('\n⚠️  REDIS NOT CONFIGURED')
    console.log('   - Issues:', validation.issues.join(', '))
    console.log('   - Follow instructions above to configure Redis\n')
    
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      issues: validation.issues,
      recommendations: validation.recommendations
    }
  }
}

// Export the deployer class and main function
export default UpstashRedisDeployer
export { UpstashRedisDeployer }

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployRedis()
    .then(result => {
      console.log('\n📊 DEPLOYMENT RESULT:', result)
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('\n💥 DEPLOYMENT FAILED:', error)
      process.exit(1)
    })
}