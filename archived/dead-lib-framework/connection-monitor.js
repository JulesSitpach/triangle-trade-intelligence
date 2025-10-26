// Database Connection Pool Monitor
// Tracks connection health, pool usage, and performance metrics

import { createClient } from '@supabase/supabase-js';

class ConnectionMonitor {
  constructor() {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      failedConnections: 0,
      avgResponseTime: 0,
      connectionAttempts: [],
      lastHealthCheck: null,
      poolStatus: 'healthy'
    };

    this.healthCheckInterval = null;
  }

  // Start monitoring
  startMonitoring() {
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    console.log('Database connection monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('Database connection monitoring stopped');
  }

  // Track connection attempt
  trackConnectionAttempt(success, responseTime) {
    this.metrics.totalConnections++;

    if (success) {
      this.metrics.activeConnections++;
      this.metrics.connectionAttempts.push({
        timestamp: Date.now(),
        success: true,
        responseTime
      });

      // Update average response time
      const recentAttempts = this.metrics.connectionAttempts
        .filter(a => a.success)
        .slice(-100); // Last 100 successful attempts

      this.metrics.avgResponseTime = recentAttempts.reduce((sum, a) =>
        sum + a.responseTime, 0) / recentAttempts.length;
    } else {
      this.metrics.failedConnections++;
      this.metrics.connectionAttempts.push({
        timestamp: Date.now(),
        success: false,
        responseTime: null
      });
    }

    // Keep only last 1000 attempts
    if (this.metrics.connectionAttempts.length > 1000) {
      this.metrics.connectionAttempts = this.metrics.connectionAttempts.slice(-1000);
    }

    this.updatePoolStatus();
  }

  // Release connection
  releaseConnection() {
    if (this.metrics.activeConnections > 0) {
      this.metrics.activeConnections--;
      this.metrics.idleConnections++;
    }
  }

  // Perform health check
  async performHealthCheck() {
    const startTime = Date.now();

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Simple query to check connection
      const { error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (!error) {
        this.trackConnectionAttempt(true, responseTime);
        this.metrics.lastHealthCheck = {
          timestamp: Date.now(),
          status: 'healthy',
          responseTime
        };
      } else {
        this.trackConnectionAttempt(false, null);
        this.metrics.lastHealthCheck = {
          timestamp: Date.now(),
          status: 'unhealthy',
          error: error.message
        };
      }
    } catch (error) {
      this.trackConnectionAttempt(false, null);
      this.metrics.lastHealthCheck = {
        timestamp: Date.now(),
        status: 'error',
        error: error.message
      };
    }
  }

  // Update pool status based on metrics
  updatePoolStatus() {
    const failureRate = this.metrics.failedConnections / this.metrics.totalConnections;
    const avgResponseTime = this.metrics.avgResponseTime;

    if (failureRate > 0.1 || avgResponseTime > 5000) {
      this.metrics.poolStatus = 'unhealthy';
    } else if (failureRate > 0.05 || avgResponseTime > 2000) {
      this.metrics.poolStatus = 'degraded';
    } else {
      this.metrics.poolStatus = 'healthy';
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      uptime: this.healthCheckInterval ? 'monitoring active' : 'monitoring inactive',
      recommendedActions: this.getRecommendations()
    };
  }

  // Get recommendations based on metrics
  getRecommendations() {
    const recommendations = [];

    if (this.metrics.poolStatus === 'unhealthy') {
      recommendations.push('Consider increasing connection pool size');
      recommendations.push('Check database server resources');
    }

    if (this.metrics.avgResponseTime > 2000) {
      recommendations.push('Optimize database queries');
      recommendations.push('Consider adding indexes');
    }

    if (this.metrics.failedConnections > 10) {
      recommendations.push('Review connection timeout settings');
      recommendations.push('Check network stability');
    }

    if (this.metrics.activeConnections > 50) {
      recommendations.push('High connection usage detected');
      recommendations.push('Consider connection pooling optimization');
    }

    return recommendations.length > 0 ? recommendations : ['System operating normally'];
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      failedConnections: 0,
      avgResponseTime: 0,
      connectionAttempts: [],
      lastHealthCheck: null,
      poolStatus: 'healthy'
    };
  }
}

// Singleton instance
let monitorInstance = null;

export function getConnectionMonitor() {
  if (!monitorInstance) {
    monitorInstance = new ConnectionMonitor();
  }
  return monitorInstance;
}

// Middleware wrapper for API routes
export function withConnectionMonitoring(handler) {
  return async (req, res) => {
    const monitor = getConnectionMonitor();
    const startTime = Date.now();

    try {
      // Execute the handler
      const result = await handler(req, res);

      // Track successful connection
      const responseTime = Date.now() - startTime;
      monitor.trackConnectionAttempt(true, responseTime);

      return result;
    } catch (error) {
      // Track failed connection
      monitor.trackConnectionAttempt(false, null);
      throw error;
    } finally {
      // Release connection
      monitor.releaseConnection();
    }
  };
}

export default ConnectionMonitor;