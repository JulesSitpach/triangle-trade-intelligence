/**
 * ADMIN API: Performance Analytics
 * GET /api/admin/performance-analytics - Returns system performance metrics
 * Provides data for analytics dashboard performance monitoring
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication check
    
    // Get timeframe from query params
    const { timeframe = '30days' } = req.query;
    const daysBack = getDaysFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Query API performance logs
    const { data: performanceLogs, error: logsError } = await supabase
      .from('api_performance_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (logsError && logsError.code !== 'PGRST116') { // Table doesn't exist
      console.error('Error fetching performance logs:', logsError);
      return res.status(500).json({ error: 'Failed to fetch performance data' });
    }

    // Query workflow completions for timing data
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflow_completions')
      .select('completion_time_seconds, completed_at')
      .gte('completed_at', startDate.toISOString());

    if (workflowsError && workflowsError.code !== 'PGRST116') {
      console.error('Error fetching workflow data:', workflowsError);
    }

    // If tables don't exist, return empty state
    const logsData = performanceLogs || [];
    const workflowData = workflows || [];

    // Calculate performance analytics
    const analytics = calculatePerformanceAnalytics(logsData, workflowData, daysBack);

    return res.status(200).json({
      ...analytics,
      timeframe,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      data_status: {
        performance_logs_available: logsData.length > 0,
        workflow_data_available: workflowData.length > 0,
        total_performance_records: logsData.length,
        total_workflow_records: workflowData.length
      }
    });

  } catch (error) {
    console.error('Performance analytics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Calculate comprehensive performance analytics
 */
function calculatePerformanceAnalytics(performanceLogs, workflows, daysBack) {
  // API Performance Metrics
  const apiMetrics = calculateApiMetrics(performanceLogs);
  
  // Workflow Performance Metrics  
  const workflowMetrics = calculateWorkflowMetrics(workflows);
  
  // System Health Indicators
  const systemHealth = calculateSystemHealth(performanceLogs, workflows);
  
  // Performance Trends
  const performanceTrends = calculatePerformanceTrends(performanceLogs, daysBack);
  
  // Endpoint Performance Analysis
  const endpointAnalysis = calculateEndpointAnalysis(performanceLogs);

  return {
    // Core performance metrics
    avg_workflow_time: workflowMetrics.avg_completion_time_minutes,
    api_success_rate: apiMetrics.success_rate,
    page_load_speed: apiMetrics.avg_page_load_time,
    error_rate: apiMetrics.error_rate,
    
    // Detailed metrics
    api_metrics: apiMetrics,
    workflow_metrics: workflowMetrics,
    system_health: systemHealth,
    performance_trends: performanceTrends,
    endpoint_analysis: endpointAnalysis,
    
    // Summary indicators
    overall_performance_score: calculateOverallPerformanceScore(apiMetrics, workflowMetrics),
    performance_status: getPerformanceStatus(apiMetrics, workflowMetrics),
    
    // Recommendations
    recommendations: generatePerformanceRecommendations(apiMetrics, workflowMetrics, systemHealth)
  };
}

/**
 * Calculate API performance metrics
 */
function calculateApiMetrics(performanceLogs) {
  if (performanceLogs.length === 0) {
    return {
      avg_response_time: 0,
      success_rate: 0,
      error_rate: 0,
      total_requests: 0,
      avg_page_load_time: 0,
      cache_hit_rate: 0
    };
  }

  const totalRequests = performanceLogs.length;
  const successfulRequests = performanceLogs.filter(log => log.status_code < 400).length;
  const errorRequests = performanceLogs.filter(log => log.status_code >= 400).length;
  
  const avgResponseTime = performanceLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / totalRequests;
  const successRate = (successfulRequests / totalRequests) * 100;
  const errorRate = (errorRequests / totalRequests) * 100;
  
  // Cache metrics
  const cacheableRequests = performanceLogs.filter(log => log.cache_hit !== null);
  const cacheHits = performanceLogs.filter(log => log.cache_hit === true).length;
  const cacheHitRate = cacheableRequests.length > 0 ? (cacheHits / cacheableRequests.length) * 100 : 0;
  
  // Database performance
  const logsWithDbTime = performanceLogs.filter(log => log.database_query_time_ms);
  const avgDbTime = logsWithDbTime.length > 0 ?
    logsWithDbTime.reduce((sum, log) => sum + log.database_query_time_ms, 0) / logsWithDbTime.length : 0;

  return {
    avg_response_time: Math.round(avgResponseTime * 100) / 100,
    success_rate: Math.round(successRate * 100) / 100,
    error_rate: Math.round(errorRate * 100) / 100,
    total_requests: totalRequests,
    avg_page_load_time: Math.round(avgResponseTime / 1000 * 100) / 100, // Convert to seconds
    cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
    avg_database_time: Math.round(avgDbTime * 100) / 100,
    requests_per_day: Math.round((totalRequests / 30) * 100) / 100 // Assuming 30-day period
  };
}

/**
 * Calculate workflow performance metrics
 */
function calculateWorkflowMetrics(workflows) {
  if (workflows.length === 0) {
    return {
      avg_completion_time_minutes: 0,
      fastest_completion: 0,
      slowest_completion: 0,
      completion_rate_trend: 0
    };
  }

  const completionTimes = workflows.map(w => w.completion_time_seconds).filter(time => time > 0);
  
  if (completionTimes.length === 0) {
    return {
      avg_completion_time_minutes: 0,
      fastest_completion: 0,
      slowest_completion: 0,
      completion_rate_trend: 0
    };
  }

  const avgCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  const fastestCompletion = Math.min(...completionTimes);
  const slowestCompletion = Math.max(...completionTimes);

  return {
    avg_completion_time_minutes: Math.round((avgCompletionTime / 60) * 100) / 100,
    fastest_completion: Math.round((fastestCompletion / 60) * 100) / 100,
    slowest_completion: Math.round((slowestCompletion / 60) * 100) / 100,
    total_workflows_completed: workflows.length,
    completion_rate_trend: calculateCompletionTrend(workflows)
  };
}

/**
 * Calculate system health indicators
 */
function calculateSystemHealth(performanceLogs, workflows) {
  const currentTime = new Date();
  const recentLogs = performanceLogs.filter(log => 
    (currentTime - new Date(log.created_at)) < (60 * 60 * 1000) // Last hour
  );

  const healthIndicators = {
    recent_errors: recentLogs.filter(log => log.status_code >= 500).length,
    recent_slow_requests: recentLogs.filter(log => log.response_time_ms > 1000).length,
    system_load: recentLogs.length, // Proxy for system load
    database_health: calculateDatabaseHealth(performanceLogs),
    uptime_percentage: calculateUptimePercentage(performanceLogs)
  };

  // Overall health score (0-100)
  let healthScore = 100;
  
  if (healthIndicators.recent_errors > 10) healthScore -= 20;
  if (healthIndicators.recent_slow_requests > 5) healthScore -= 15;
  if (healthIndicators.database_health < 80) healthScore -= 25;
  if (healthIndicators.uptime_percentage < 99) healthScore -= 30;
  
  healthIndicators.overall_health_score = Math.max(0, healthScore);
  healthIndicators.health_status = getHealthStatus(healthScore);

  return healthIndicators;
}

/**
 * Calculate performance trends over time
 */
function calculatePerformanceTrends(performanceLogs, daysBack) {
  const trends = [];
  
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayLogs = performanceLogs.filter(log => 
      log.created_at.split('T')[0] === dateStr
    );
    
    const avgResponseTime = dayLogs.length > 0 ?
      dayLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / dayLogs.length : 0;
    
    const successRate = dayLogs.length > 0 ?
      (dayLogs.filter(log => log.status_code < 400).length / dayLogs.length) * 100 : 0;
    
    trends.push({
      date: dateStr,
      avg_response_time: Math.round(avgResponseTime * 100) / 100,
      success_rate: Math.round(successRate * 100) / 100,
      total_requests: dayLogs.length,
      error_count: dayLogs.filter(log => log.status_code >= 400).length
    });
  }
  
  return trends;
}

/**
 * Calculate endpoint-specific analysis
 */
function calculateEndpointAnalysis(performanceLogs) {
  const endpointStats = {};
  
  performanceLogs.forEach(log => {
    const endpoint = log.endpoint;
    if (!endpointStats[endpoint]) {
      endpointStats[endpoint] = {
        endpoint,
        total_requests: 0,
        avg_response_time: 0,
        success_rate: 0,
        error_count: 0,
        response_times: []
      };
    }
    
    endpointStats[endpoint].total_requests++;
    endpointStats[endpoint].response_times.push(log.response_time_ms);
    if (log.status_code >= 400) {
      endpointStats[endpoint].error_count++;
    }
  });
  
  // Calculate averages for each endpoint
  Object.values(endpointStats).forEach(stats => {
    stats.avg_response_time = stats.response_times.length > 0 ?
      Math.round((stats.response_times.reduce((sum, time) => sum + time, 0) / stats.response_times.length) * 100) / 100 : 0;
    stats.success_rate = stats.total_requests > 0 ?
      Math.round(((stats.total_requests - stats.error_count) / stats.total_requests) * 10000) / 100 : 0;
    delete stats.response_times; // Clean up
  });
  
  return Object.values(endpointStats).sort((a, b) => b.total_requests - a.total_requests);
}

/**
 * Helper functions
 */
function calculateOverallPerformanceScore(apiMetrics, workflowMetrics) {
  let score = 100;
  
  // API performance factors
  if (apiMetrics.avg_response_time > 500) score -= 15;
  if (apiMetrics.success_rate < 95) score -= 20;
  if (apiMetrics.error_rate > 5) score -= 25;
  
  // Workflow performance factors
  if (workflowMetrics.avg_completion_time_minutes > 10) score -= 10;
  
  return Math.max(0, score);
}

function getPerformanceStatus(apiMetrics, workflowMetrics) {
  const score = calculateOverallPerformanceScore(apiMetrics, workflowMetrics);
  
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

function calculateDatabaseHealth(performanceLogs) {
  const logsWithDbTime = performanceLogs.filter(log => log.database_query_time_ms);
  if (logsWithDbTime.length === 0) return 100;
  
  const avgDbTime = logsWithDbTime.reduce((sum, log) => sum + log.database_query_time_ms, 0) / logsWithDbTime.length;
  
  // Consider healthy if avg DB time < 100ms
  if (avgDbTime < 100) return 100;
  if (avgDbTime < 200) return 80;
  if (avgDbTime < 500) return 60;
  return 40;
}

function calculateUptimePercentage(performanceLogs) {
  if (performanceLogs.length === 0) return 100;
  
  const totalRequests = performanceLogs.length;
  const serverErrors = performanceLogs.filter(log => log.status_code >= 500).length;
  
  return Math.round(((totalRequests - serverErrors) / totalRequests) * 10000) / 100;
}

function getHealthStatus(healthScore) {
  if (healthScore >= 90) return 'healthy';
  if (healthScore >= 70) return 'warning';
  return 'critical';
}

function calculateCompletionTrend(workflows) {
  // Simple trend calculation - could be enhanced
  if (workflows.length < 2) return 0;
  
  const recent = workflows.slice(-Math.min(10, Math.floor(workflows.length / 2)));
  const older = workflows.slice(0, -Math.min(10, Math.floor(workflows.length / 2)));
  
  const recentAvg = recent.reduce((sum, w) => sum + (w.completion_time_seconds || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, w) => sum + (w.completion_time_seconds || 0), 0) / older.length;
  
  if (olderAvg === 0) return 0;
  
  return Math.round(((olderAvg - recentAvg) / olderAvg) * 10000) / 100; // Positive = improvement
}

function generatePerformanceRecommendations(apiMetrics, workflowMetrics, systemHealth) {
  const recommendations = [];
  
  if (apiMetrics.avg_response_time > 500) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'API response times are above optimal threshold. Consider optimizing database queries or adding caching.',
      metric: `Current: ${apiMetrics.avg_response_time}ms, Target: <500ms`
    });
  }
  
  if (apiMetrics.error_rate > 5) {
    recommendations.push({
      type: 'reliability',
      priority: 'critical',
      message: 'Error rate is higher than acceptable. Review error logs and implement fixes.',
      metric: `Current: ${apiMetrics.error_rate}%, Target: <5%`
    });
  }
  
  if (workflowMetrics.avg_completion_time_minutes > 10) {
    recommendations.push({
      type: 'workflow',
      priority: 'medium',
      message: 'Workflow completion times could be improved. Consider optimizing the workflow steps.',
      metric: `Current: ${workflowMetrics.avg_completion_time_minutes} min, Target: <10 min`
    });
  }
  
  if (systemHealth.database_health < 80) {
    recommendations.push({
      type: 'database',
      priority: 'high',
      message: 'Database performance needs attention. Consider query optimization or scaling.',
      metric: `Current health: ${systemHealth.database_health}%`
    });
  }
  
  return recommendations;
}

function getDaysFromTimeframe(timeframe) {
  switch (timeframe) {
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    case '1year': return 365;
    default: return 30;
  }
}