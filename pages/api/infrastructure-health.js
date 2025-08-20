/**
 * Triangle Intelligence Platform - Infrastructure Health Monitoring
 * Real-time comprehensive system health dashboard
 */

import { getSupabaseClient, getConnectionStats } from '../../lib/supabase-client.js'
import { checkRedisHealth } from '../../lib/redis-client.js'
import { RSSTrigger } from '../../lib/background-services/rss-comtrade-trigger.js'
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js'

export default async function handler(req, res) {
  const startTime = Date.now()
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET']
    })
  }
  
  try {
    logInfo('Starting comprehensive infrastructure health check')
    
    // Gather all health metrics in parallel for maximum efficiency
    const [
      databaseHealth,
      redisHealth,
      rssHealth,
      connectionStats,
      performanceMetrics,
      dataQualityMetrics,
      systemResources
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkRSSHealth(),
      getConnectionStats(),
      checkPerformanceMetrics(),
      checkDataQualityMetrics(),
      checkSystemResources()
    ])
    
    // Calculate overall system health score
    const overallHealth = calculateOverallHealth({
      databaseHealth,
      redisHealth,
      rssHealth,
      performanceMetrics,
      dataQualityMetrics
    })
    
    const totalDuration = Date.now() - startTime
    logPerformance('infrastructure_health_check', totalDuration, overallHealth)
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      healthCheck: {
        overall: overallHealth,
        components: {
          database: databaseHealth,
          redis: redisHealth,
          rss: rssHealth,
          connections: connectionStats,
          performance: performanceMetrics,
          dataQuality: dataQualityMetrics,
          system: systemResources
        },
        alerts: generateHealthAlerts({
          databaseHealth,
          redisHealth,
          rssHealth,
          performanceMetrics,
          connectionStats
        }),
        recommendations: generateRecommendations({
          databaseHealth,
          redisHealth,
          rssHealth,
          performanceMetrics,
          connectionStats
        })
      },
      execution: {
        duration: `${totalDuration}ms`,
        checksPerformed: 7,
        parallelExecution: true
      }
    })
    
  } catch (error) {
    logError('Infrastructure health check failed', { error: error.message })
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      healthCheck: {
        overall: {
          status: 'critical',
          score: 0,
          message: 'Health check system failure'
        }
      }
    })
  }
}

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth() {
  const startTime = Date.now()
  
  try {
    const supabase = getSupabaseClient()
    
    // Test basic connectivity
    const { data: testData, error: testError } = await supabase
      .from('translations')
      .select('id')
      .limit(1)
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`)
    }
    
    // Test critical table access and get row counts
    const [
      { count: tradeFlowsCount },
      { count: comtradeCount },
      { count: workflowCount },
      { count: alertsCount }
    ] = await Promise.all([
      supabase.from('trade_flows').select('*', { count: 'exact', head: true }),
      supabase.from('comtrade_reference').select('*', { count: 'exact', head: true }),
      supabase.from('workflow_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('current_market_alerts').select('*', { count: 'exact', head: true })
    ])
    
    const duration = Date.now() - startTime
    
    // Assess database health based on response time and data availability
    let status = 'healthy'
    let score = 100
    
    if (duration > 2000) {
      status = 'degraded'
      score = 60
    } else if (duration > 1000) {
      status = 'warning'
      score = 80
    }
    
    if (tradeFlowsCount < 100000) {
      status = 'warning'
      score = Math.min(score, 75)
    }
    
    return {
      status,
      score,
      responseTime: `${duration}ms`,
      connectivity: 'connected',
      tables: {
        trade_flows: { count: tradeFlowsCount, status: tradeFlowsCount > 100000 ? 'healthy' : 'warning' },
        comtrade_reference: { count: comtradeCount, status: comtradeCount > 10000 ? 'healthy' : 'warning' },
        workflow_sessions: { count: workflowCount, status: 'healthy' },
        market_alerts: { count: alertsCount, status: 'healthy' }
      },
      performance: {
        responseTime: duration,
        classification: duration < 500 ? 'excellent' : duration < 1000 ? 'good' : duration < 2000 ? 'acceptable' : 'poor'
      }
    }
    
  } catch (error) {
    return {
      status: 'critical',
      score: 0,
      responseTime: 'timeout',
      connectivity: 'failed',
      error: error.message,
      performance: {
        classification: 'failed'
      }
    }
  }
}

/**
 * Check RSS monitoring system health
 */
async function checkRSSHealth() {
  try {
    const healthCheck = await RSSTrigger.healthCheck()
    
    let score = 100
    if (healthCheck.status === 'degraded') score = 60
    else if (healthCheck.status === 'unhealthy') score = 20
    
    return {
      status: healthCheck.status,
      score,
      rssFeeds: healthCheck.rssFeeds,
      database: healthCheck.database,
      lastCheck: healthCheck.timestamp,
      monitoring: {
        feedsActive: healthCheck.rssFeeds === 'connected',
        databaseConnected: healthCheck.database === 'connected',
        overallStatus: healthCheck.status
      }
    }
    
  } catch (error) {
    return {
      status: 'critical',
      score: 0,
      error: error.message,
      monitoring: {
        feedsActive: false,
        databaseConnected: false,
        overallStatus: 'failed'
      }
    }
  }
}

/**
 * Check performance metrics across the platform
 */
async function checkPerformanceMetrics() {
  const startTime = Date.now()
  
  try {
    const supabase = getSupabaseClient()
    
    // Test query performance on critical tables
    const queryStartTime = Date.now()
    const { data: sampleData } = await supabase
      .from('trade_flows')
      .select('id, reporter_country, partner_country, trade_value')
      .limit(50)
    
    const queryDuration = Date.now() - queryStartTime
    
    // Test API endpoint performance
    const apiStartTime = Date.now()
    const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/status`)
    const apiDuration = Date.now() - apiStartTime
    
    const totalDuration = Date.now() - startTime
    
    return {
      status: totalDuration < 1000 ? 'excellent' : totalDuration < 2000 ? 'good' : 'degraded',
      score: totalDuration < 1000 ? 100 : totalDuration < 2000 ? 80 : 50,
      metrics: {
        totalResponseTime: `${totalDuration}ms`,
        databaseQuery: `${queryDuration}ms`,
        apiEndpoint: `${apiDuration}ms`,
        recordsFetched: sampleData?.length || 0
      },
      thresholds: {
        excellent: '< 1000ms',
        good: '1000-2000ms',
        degraded: '> 2000ms'
      },
      classification: totalDuration < 1000 ? 'excellent' : totalDuration < 2000 ? 'good' : 'needs_optimization'
    }
    
  } catch (error) {
    return {
      status: 'critical',
      score: 0,
      error: error.message,
      classification: 'failed'
    }
  }
}

/**
 * Check data quality metrics
 */
async function checkDataQualityMetrics() {
  try {
    const supabase = getSupabaseClient()
    
    // Check for data freshness and completeness
    const [
      { data: recentTradeFlows },
      { data: recentAlerts },
      { data: recentSessions }
    ] = await Promise.all([
      supabase
        .from('trade_flows')
        .select('id, created_at, last_analyzed')
        .not('last_analyzed', 'is', null)
        .order('last_analyzed', { ascending: false })
        .limit(10),
      
      supabase
        .from('current_market_alerts')
        .select('id, alert_date')
        .order('alert_date', { ascending: false })
        .limit(5),
      
      supabase
        .from('workflow_sessions')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
    ])
    
    // Analyze data quality
    const dataQuality = {
      tradeFlowsFreshness: recentTradeFlows?.length > 0 ? 'good' : 'stale',
      alertsActivity: recentAlerts?.length > 0 ? 'active' : 'inactive',
      userActivity: recentSessions?.length > 0 ? 'active' : 'low'
    }
    
    const qualityScore = Object.values(dataQuality).filter(status => 
      status === 'good' || status === 'active'
    ).length * 33.33
    
    return {
      status: qualityScore > 80 ? 'excellent' : qualityScore > 60 ? 'good' : 'degraded',
      score: Math.round(qualityScore),
      metrics: dataQuality,
      analysis: {
        recentDataPoints: recentTradeFlows?.length || 0,
        recentAlerts: recentAlerts?.length || 0,
        recentSessions: recentSessions?.length || 0
      }
    }
    
  } catch (error) {
    return {
      status: 'critical',
      score: 0,
      error: error.message
    }
  }
}

/**
 * Check system resources and memory usage
 */
async function checkSystemResources() {
  try {
    const memUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    // Calculate memory usage percentages (rough estimates)
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const memoryUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    
    let memoryStatus = 'healthy'
    if (memoryUsagePercent > 85) memoryStatus = 'critical'
    else if (memoryUsagePercent > 70) memoryStatus = 'warning'
    
    return {
      status: memoryStatus,
      score: memoryUsagePercent < 70 ? 100 : memoryUsagePercent < 85 ? 70 : 30,
      memory: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        usagePercent: `${memoryUsagePercent}%`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        status: memoryStatus
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: formatUptime(uptime)
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        nodeEnv: process.env.NODE_ENV
      }
    }
    
  } catch (error) {
    return {
      status: 'critical',
      score: 0,
      error: error.message
    }
  }
}

/**
 * Calculate overall system health score
 */
function calculateOverallHealth(components) {
  const weights = {
    databaseHealth: 0.35,    // Most critical
    redisHealth: 0.20,       // Important for scaling
    rssHealth: 0.15,         // Market intelligence
    performanceMetrics: 0.20, // User experience
    dataQualityMetrics: 0.10  // Data reliability
  }
  
  let totalScore = 0
  let totalWeight = 0
  
  Object.entries(weights).forEach(([component, weight]) => {
    if (components[component] && typeof components[component].score === 'number') {
      totalScore += components[component].score * weight
      totalWeight += weight
    }
  })
  
  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
  
  let status = 'critical'
  if (overallScore >= 90) status = 'excellent'
  else if (overallScore >= 75) status = 'healthy'
  else if (overallScore >= 60) status = 'warning'
  else if (overallScore >= 30) status = 'degraded'
  
  return {
    status,
    score: overallScore,
    message: getHealthMessage(status, overallScore),
    components: Object.keys(weights).length,
    readiness: {
      production: overallScore >= 80,
      scaling: overallScore >= 75,
      monitoring: true
    }
  }
}

/**
 * Generate health alerts based on system status
 */
function generateHealthAlerts(components) {
  const alerts = []
  
  // Database alerts
  if (components.databaseHealth.score < 70) {
    alerts.push({
      severity: 'high',
      component: 'database',
      message: `Database performance degraded: ${components.databaseHealth.responseTime}`,
      action: 'Check database indexes and connection pool'
    })
  }
  
  // Redis alerts
  if (components.redisHealth.status === 'unhealthy') {
    alerts.push({
      severity: 'medium',
      component: 'redis',
      message: 'Redis unavailable - using memory fallback',
      action: 'Setup Redis instance for production scaling'
    })
  }
  
  // RSS alerts
  if (components.rssHealth.score < 60) {
    alerts.push({
      severity: 'medium',
      component: 'rss',
      message: 'RSS monitoring degraded',
      action: 'Check RSS feed connectivity and database access'
    })
  }
  
  // Performance alerts
  if (components.performanceMetrics.score < 70) {
    alerts.push({
      severity: 'medium',
      component: 'performance',
      message: 'API response times degraded',
      action: 'Optimize queries and implement caching'
    })
  }
  
  // Connection pool alerts
  if (components.connectionStats.utilizationPercent > 80) {
    alerts.push({
      severity: 'high',
      component: 'connections',
      message: `Connection pool utilization high: ${components.connectionStats.utilizationPercent}%`,
      action: 'Scale connection pool or optimize query patterns'
    })
  }
  
  return alerts
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(components) {
  const recommendations = []
  
  if (components.databaseHealth.score < 90) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      recommendation: 'Implement database indexes for 500K+ trade_flows table',
      impact: 'Up to 85% faster query times',
      effort: 'low'
    })
  }
  
  if (components.redisHealth.status !== 'healthy') {
    recommendations.push({
      priority: 'high',
      category: 'scaling',
      recommendation: 'Setup production Redis instance',
      impact: 'Enable horizontal scaling and rate limiting',
      effort: 'medium'
    })
  }
  
  if (components.performanceMetrics.score < 80) {
    recommendations.push({
      priority: 'medium',
      category: 'optimization',
      recommendation: 'Implement batch query patterns',
      impact: '70%+ reduction in API response times',
      effort: 'medium'
    })
  }
  
  recommendations.push({
    priority: 'maintenance',
    category: 'monitoring',
    recommendation: 'Setup automated health monitoring alerts',
    impact: 'Proactive issue detection and resolution',
    effort: 'low'
  })
  
  return recommendations
}

/**
 * Helper functions
 */
function getHealthMessage(status, score) {
  switch (status) {
    case 'excellent': return `System operating at peak performance (${score}/100)`
    case 'healthy': return `System healthy and production-ready (${score}/100)`
    case 'warning': return `System operational with minor issues (${score}/100)`
    case 'degraded': return `System degraded - optimization recommended (${score}/100)`
    case 'critical': return `System critical - immediate attention required (${score}/100)`
    default: return `System status unknown (${score}/100)`
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}