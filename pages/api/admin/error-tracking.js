/**
 * ADMIN API: Error Tracking
 * GET /api/admin/error-tracking - Returns real error monitoring data
 * Database-driven error tracking with no hardcoded values
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
    // Get timeframe from query params
    const { timeframe = '24hours', severity = 'all' } = req.query;
    const hoursBack = getHoursFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursBack);

    // Query error logs from database
    const errorData = await getErrorLogs(startDate, severity);

    // Query system errors and exceptions
    const systemErrors = await getSystemErrors(startDate);

    // Analyze error patterns
    const errorAnalysis = analyzeErrorPatterns(errorData, systemErrors);

    const response = {
      timestamp: new Date().toISOString(),
      timeframe,
      date_range: {
        start: startDate.toISOString(),
        end: new Date().toISOString()
      },
      recent_errors: errorData,
      system_errors: systemErrors,
      error_analysis: errorAnalysis,
      status: 'success'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error tracking API error:', error);
    res.status(500).json({
      error: 'Failed to load error tracking data',
      message: error.message
    });
  }
}

/**
 * Get error logs from database tables
 */
async function getErrorLogs(startDate, severityFilter) {
  try {
    const errors = [];

    // Check for API performance logs with errors
    const { data: apiErrors, error: apiError } = await supabase
      .from('api_performance_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .gte('status_code', 400)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!apiError && apiErrors) {
      apiErrors.forEach(log => {
        errors.push({
          id: `api_${log.id}`,
          type: 'API Error',
          severity: log.status_code >= 500 ? 'high' : 'medium',
          message: `${log.method} ${log.endpoint} returned ${log.status_code}`,
          details: {
            endpoint: log.endpoint,
            method: log.method,
            status_code: log.status_code,
            response_time: log.response_time_ms,
            user_agent: log.user_agent || 'Unknown',
            error_message: log.error_message || 'HTTP Error'
          },
          timestamp: log.created_at,
          resolved: false
        });
      });
    }

    // Check for workflow completion errors
    const { data: workflowErrors, error: workflowError } = await supabase
      .from('workflow_completions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!workflowError && workflowErrors) {
      workflowErrors.forEach(workflow => {
        errors.push({
          id: `workflow_${workflow.id}`,
          type: 'Workflow Error',
          severity: 'medium',
          message: `USMCA workflow failed: ${workflow.error_message || 'Unknown error'}`,
          details: {
            workflow_id: workflow.id,
            user_id: workflow.user_id,
            step_failed: workflow.failed_step,
            error_message: workflow.error_message,
            completion_time: workflow.completion_time_seconds
          },
          timestamp: workflow.created_at,
          resolved: false
        });
      });
    }

    // Filter by severity if specified
    let filteredErrors = errors;
    if (severityFilter !== 'all') {
      filteredErrors = errors.filter(error => error.severity === severityFilter);
    }

    return filteredErrors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  } catch (error) {
    console.error('Error fetching error logs:', error);
    return [];
  }
}

/**
 * Get system-level errors and exceptions
 */
async function getSystemErrors(startDate) {
  try {
    const systemErrors = [];

    // Check for database connection issues
    try {
      const { error: dbTestError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (dbTestError) {
        systemErrors.push({
          id: 'db_connection_error',
          type: 'Database Connection',
          severity: 'high',
          message: 'Database connection test failed',
          details: {
            error_code: dbTestError.code,
            error_message: dbTestError.message,
            hint: dbTestError.hint
          },
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    } catch (dbError) {
      systemErrors.push({
        id: 'db_system_error',
        type: 'Database System',
        severity: 'critical',
        message: 'Critical database system error',
        details: {
          error_message: dbError.message,
          stack: dbError.stack
        },
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Check for environment configuration issues
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NODE_ENV'
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        systemErrors.push({
          id: `env_${envVar.toLowerCase()}`,
          type: 'Configuration Error',
          severity: 'high',
          message: `Missing required environment variable: ${envVar}`,
          details: {
            environment_variable: envVar,
            current_env: process.env.NODE_ENV || 'undefined'
          },
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    });

    return systemErrors;

  } catch (error) {
    console.error('Error checking system errors:', error);
    return [{
      id: 'system_check_error',
      type: 'System Check Failed',
      severity: 'critical',
      message: 'Unable to perform system error check',
      details: {
        error_message: error.message
      },
      timestamp: new Date().toISOString(),
      resolved: false
    }];
  }
}

/**
 * Analyze error patterns and trends
 */
function analyzeErrorPatterns(errorData, systemErrors) {
  const allErrors = [...errorData, ...systemErrors];

  if (allErrors.length === 0) {
    return {
      total_errors: 0,
      error_rate_trend: 'stable',
      most_common_error_type: 'None',
      severity_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
      recommendations: []
    };
  }

  // Count errors by type
  const errorTypes = {};
  const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };

  allErrors.forEach(error => {
    errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    severityCounts[error.severity] = (severityCounts[error.severity] || 0) + 1;
  });

  const mostCommonType = Object.keys(errorTypes).reduce((a, b) =>
    errorTypes[a] > errorTypes[b] ? a : b, 'None'
  );

  // Calculate error rate trend (simplified)
  const recentErrors = allErrors.filter(error =>
    (new Date() - new Date(error.timestamp)) < (2 * 60 * 60 * 1000) // Last 2 hours
  );
  const olderErrors = allErrors.filter(error =>
    (new Date() - new Date(error.timestamp)) >= (2 * 60 * 60 * 1000)
  );

  let trend = 'stable';
  if (recentErrors.length > olderErrors.length) {
    trend = 'increasing';
  } else if (recentErrors.length < olderErrors.length) {
    trend = 'decreasing';
  }

  // Generate recommendations
  const recommendations = generateErrorRecommendations(allErrors, errorTypes, severityCounts);

  return {
    total_errors: allErrors.length,
    error_rate_trend: trend,
    most_common_error_type: mostCommonType,
    error_types_breakdown: errorTypes,
    severity_distribution: severityCounts,
    critical_issues_count: severityCounts.critical,
    high_priority_issues_count: severityCounts.high,
    recommendations
  };
}

/**
 * Generate recommendations based on error patterns
 */
function generateErrorRecommendations(errors, errorTypes, severityCounts) {
  const recommendations = [];

  // Critical and high severity recommendations
  if (severityCounts.critical > 0) {
    recommendations.push({
      priority: 'critical',
      type: 'immediate_action',
      message: `${severityCounts.critical} critical system errors require immediate attention`,
      action: 'Review system errors and fix database/configuration issues'
    });
  }

  if (severityCounts.high > 5) {
    recommendations.push({
      priority: 'high',
      type: 'error_investigation',
      message: `High number of high-severity errors (${severityCounts.high})`,
      action: 'Investigate error patterns and implement fixes'
    });
  }

  // API-specific recommendations
  const apiErrors = errors.filter(e => e.type === 'API Error');
  if (apiErrors.length > 10) {
    recommendations.push({
      priority: 'medium',
      type: 'api_optimization',
      message: `${apiErrors.length} API errors detected`,
      action: 'Review API error logs and optimize endpoint performance'
    });
  }

  // Workflow-specific recommendations
  const workflowErrors = errors.filter(e => e.type === 'Workflow Error');
  if (workflowErrors.length > 3) {
    recommendations.push({
      priority: 'medium',
      type: 'workflow_improvement',
      message: `${workflowErrors.length} workflow failures detected`,
      action: 'Review USMCA workflow logic and error handling'
    });
  }

  // Configuration recommendations
  const configErrors = errors.filter(e => e.type === 'Configuration Error');
  if (configErrors.length > 0) {
    recommendations.push({
      priority: 'high',
      type: 'configuration',
      message: `${configErrors.length} configuration issues found`,
      action: 'Fix missing environment variables and configuration settings'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      type: 'maintenance',
      message: 'System appears healthy with minimal errors',
      action: 'Continue monitoring and maintain current error handling practices'
    });
  }

  return recommendations;
}

/**
 * Convert timeframe to hours
 */
function getHoursFromTimeframe(timeframe) {
  switch (timeframe) {
    case '1hour': return 1;
    case '6hours': return 6;
    case '24hours': return 24;
    case '7days': return 24 * 7;
    case '30days': return 24 * 30;
    default: return 24;
  }
}