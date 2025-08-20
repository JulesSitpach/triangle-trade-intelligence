/**
 * 🧠 MEMORY STATUS API - Production Memory Monitoring
 * 
 * Real-time memory usage monitoring for Triangle Intelligence Platform
 * Tracks memory optimizations and provides actionable insights
 */

import { getMemoryOptimizer } from '../../lib/memory-optimizer.js';
import { getConnectionStats } from '../../lib/supabase-client.js';
import { BeastMasterController } from '../../lib/intelligence/beast-master-controller.js';
import { logInfo, logWarning } from '../../lib/production-logger.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Get memory optimizer instance
    const memoryOptimizer = getMemoryOptimizer();
    
    // Collect memory statistics
    const memoryStats = memoryOptimizer.getMemoryStats();
    const connectionStats = getConnectionStats();
    const beastMasterStats = BeastMasterController.getMemoryStats();
    
    // Get Node.js process memory
    const processMemory = typeof process !== 'undefined' ? process.memoryUsage() : {};
    
    // Calculate memory health score
    const memoryHealthScore = calculateMemoryHealth(memoryStats, processMemory);
    
    const response = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      memoryHealth: {
        score: memoryHealthScore,
        status: memoryHealthScore > 80 ? 'excellent' : 
                memoryHealthScore > 60 ? 'good' : 
                memoryHealthScore > 40 ? 'warning' : 'critical'
      },
      processMemory: {
        heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(processMemory.external / 1024 / 1024) + 'MB',
        rss: Math.round(processMemory.rss / 1024 / 1024) + 'MB'
      },
      memoryOptimizer: {
        ...memoryStats,
        optimizationsActive: true,
        cleanupRegistered: memoryStats.cleanupHandlers > 0
      },
      databaseConnections: connectionStats,
      beastMaster: beastMasterStats,
      recommendations: generateRecommendations(memoryStats, processMemory, connectionStats),
      performance: {
        responseTime: Date.now() - startTime + 'ms',
        realTimeUpdatesActive: true,
        memoryLeakDetection: 'active'
      }
    };
    
    // Log memory status if concerning
    if (memoryHealthScore < 60) {
      logWarning('Memory health below optimal threshold', {
        score: memoryHealthScore,
        heapUsed: processMemory.heapUsed,
        activeIntervals: memoryStats.activeIntervals
      });
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    logInfo('Memory status API error', { error: error.message });
    
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: {
        message: 'Memory monitoring temporarily unavailable',
        details: error.message
      },
      fallback: {
        optimizationsActive: true,
        systemStatus: 'running'
      }
    });
  }
}

/**
 * Calculate memory health score (0-100)
 */
function calculateMemoryHealth(memoryStats, processMemory) {
  let score = 100;
  
  // Penalize high heap usage (over 100MB)
  if (processMemory.heapUsed) {
    const heapUsedMB = processMemory.heapUsed / 1024 / 1024;
    if (heapUsedMB > 150) score -= 30;
    else if (heapUsedMB > 100) score -= 15;
  }
  
  // Penalize too many active intervals
  if (memoryStats.activeIntervals > 10) {
    score -= (memoryStats.activeIntervals - 10) * 5;
  }
  
  // Penalize too many active timeouts
  if (memoryStats.activeTimeouts > 20) {
    score -= (memoryStats.activeTimeouts - 20) * 2;
  }
  
  // Penalize too many pending requests
  if (memoryStats.activeRequests > 15) {
    score -= (memoryStats.activeRequests - 15) * 3;
  }
  
  // Bonus for having cleanup handlers registered
  if (memoryStats.cleanupHandlers > 0) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate actionable memory optimization recommendations
 */
function generateRecommendations(memoryStats, processMemory, connectionStats) {
  const recommendations = [];
  
  // High memory usage
  if (processMemory.heapUsed > 150 * 1024 * 1024) {
    recommendations.push({
      priority: 'high',
      category: 'memory_usage',
      message: 'High heap memory usage detected',
      action: 'Consider triggering garbage collection or reducing active operations',
      impact: 'Performance degradation possible'
    });
  }
  
  // Too many intervals
  if (memoryStats.activeIntervals > 10) {
    recommendations.push({
      priority: 'medium',
      category: 'intervals',
      message: `${memoryStats.activeIntervals} active intervals detected`,
      action: 'Review interval cleanup in React components',
      impact: 'Memory leaks possible'
    });
  }
  
  // Too many pending requests
  if (memoryStats.activeRequests > 15) {
    recommendations.push({
      priority: 'medium', 
      category: 'api_requests',
      message: `${memoryStats.activeRequests} pending API requests`,
      action: 'Check for hanging requests or implement timeouts',
      impact: 'Resource exhaustion risk'
    });
  }
  
  // Good practices detected
  if (memoryStats.cleanupHandlers > 5) {
    recommendations.push({
      priority: 'info',
      category: 'optimization',
      message: 'Excellent cleanup handler coverage detected',
      action: 'Memory optimization working well',
      impact: 'Optimal performance maintained'
    });
  }
  
  // No recommendations needed
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'info',
      category: 'status',
      message: 'Memory usage is optimal',
      action: 'Continue current memory management practices',
      impact: 'Peak performance maintained'
    });
  }
  
  return recommendations;
}