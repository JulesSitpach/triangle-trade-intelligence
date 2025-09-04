/**
 * PERFORMANCE METRICS API
 * Enterprise monitoring and metrics tracking
 */

import { getConnectionStats } from '../../lib/database/optimized-supabase-client.js';
import { cacheStats } from '../../lib/cache/redis-cache.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connectionStats = getConnectionStats();
    const cacheMetrics = cacheStats();
    
    // Calculate performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        connections: connectionStats.connectionCount,
        queries: connectionStats.queryCount,
        avgQueryTime: Math.round(connectionStats.averageQueryTime),
        totalQueryTime: connectionStats.totalQueryTime
      },
      cache: {
        size: cacheMetrics.size,
        maxSize: cacheMetrics.maxSize,
        hitRate: Math.round(cacheMetrics.hitRate * 100),
        efficiency: cacheMetrics.hitRate > 0.8 ? 'Excellent' : 
                   cacheMetrics.hitRate > 0.6 ? 'Good' : 
                   cacheMetrics.hitRate > 0.4 ? 'Fair' : 'Poor'
      },
      performance: {
        status: connectionStats.averageQueryTime < 400 ? 'Enterprise Ready' : 'Needs Optimization',
        rating: connectionStats.averageQueryTime < 200 ? 'Excellent' :
                connectionStats.averageQueryTime < 400 ? 'Good' :
                connectionStats.averageQueryTime < 800 ? 'Fair' : 'Poor'
      },
      enterprise: {
        readiness: calculateEnterpriseReadiness(connectionStats, cacheMetrics),
        concurrent_capacity: estimateConcurrentCapacity(connectionStats.averageQueryTime),
        sla_compliance: connectionStats.averageQueryTime < 400 ? '✅ SLA Met' : '❌ SLA Breach'
      }
    };

    return res.status(200).json(metrics);

  } catch (error) {
    console.error('Metrics error:', error);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

function calculateEnterpriseReadiness(dbStats, cacheStats) {
  let score = 0;
  
  // Database performance (40% weight)
  if (dbStats.averageQueryTime < 200) score += 40;
  else if (dbStats.averageQueryTime < 400) score += 30;
  else if (dbStats.averageQueryTime < 800) score += 15;
  
  // Cache efficiency (30% weight) 
  if (cacheStats.hitRate > 0.8) score += 30;
  else if (cacheStats.hitRate > 0.6) score += 20;
  else if (cacheStats.hitRate > 0.4) score += 10;
  
  // Query volume handling (30% weight)
  if (dbStats.queryCount > 100) score += 30;
  else if (dbStats.queryCount > 50) score += 20;
  else if (dbStats.queryCount > 10) score += 10;
  
  return `${score}% (${score >= 85 ? 'Enterprise Ready' : score >= 70 ? 'Near Enterprise' : 'Needs Work'})`;
}

function estimateConcurrentCapacity(avgQueryTime) {
  // Estimate based on response time
  if (avgQueryTime < 100) return '50+ concurrent users';
  if (avgQueryTime < 200) return '25-50 concurrent users'; 
  if (avgQueryTime < 400) return '10-25 concurrent users';
  if (avgQueryTime < 800) return '5-10 concurrent users';
  return '1-5 concurrent users';
}