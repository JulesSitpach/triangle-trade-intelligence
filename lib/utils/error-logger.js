/**
 * Error Logger Utility
 * Logs user-facing errors to dev_issues table for admin monitoring
 *
 * Usage:
 * import { logUserError } from '@/lib/utils/error-logger';
 *
 * // In catch blocks:
 * logUserError(error, { context: 'component_name', userId: user.id });
 *
 * // For API errors:
 * logUserError(new Error('API failed'), {
 *   context: 'api_endpoint',
 *   userId: req.userId,
 *   requestData: req.body
 * });
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Log error to dev_issues table
 * @param {Error|string} error - Error object or message
 * @param {Object} metadata - Additional context
 * @param {string} metadata.context - Where error occurred (component/API name)
 * @param {string} metadata.userId - User ID (if available)
 * @param {string} metadata.severity - 'critical' | 'high' | 'medium' | 'low'
 * @param {Object} metadata.data - Additional data (request body, state, etc.)
 */
export async function logUserError(error, metadata = {}) {
  try {
    const {
      context = 'unknown',
      userId = null,
      severity = 'medium',
      data = {}
    } = metadata;

    // Extract error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    const errorName = error instanceof Error ? error.name : 'Error';

    // Determine severity based on error type if not provided
    let finalSeverity = severity;
    if (severity === 'medium') {
      if (errorMessage.includes('403') || errorMessage.includes('401')) {
        finalSeverity = 'high';
      } else if (errorMessage.includes('500') || errorMessage.includes('database')) {
        finalSeverity = 'critical';
      } else if (errorMessage.includes('404') || errorMessage.includes('validation')) {
        finalSeverity = 'medium';
      }
    }

    // Categorize error type
    let errorType = 'unknown_error';
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      errorType = 'authorization_error';
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorType = 'authentication_error';
    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      errorType = 'not_found_error';
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      errorType = 'validation_error';
    } else if (errorMessage.includes('database') || errorMessage.includes('query')) {
      errorType = 'database_error';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = 'network_error';
    } else if (errorMessage.includes('AI') || errorMessage.includes('classification')) {
      errorType = 'ai_error';
    }

    // Build issue data (matches dev_issues table schema)
    const issueData = {
      issue_type: errorType,
      severity: finalSeverity,
      component: context,
      message: errorMessage,
      context_data: {
        error_name: errorName,
        stack: errorStack,
        timestamp: new Date().toISOString(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        ...data
      },
      user_id: userId,
      resolved: false
    };

    // Insert into dev_issues
    const { error: dbError } = await supabase
      .from('dev_issues')
      .insert([issueData]);

    if (dbError) {
      console.error('[ERROR-LOGGER] Failed to log error to dev_issues:', dbError);
    } else {
      console.log(`[ERROR-LOGGER] ✅ Logged ${finalSeverity} error from ${context}: ${errorMessage}`);
    }

  } catch (loggingError) {
    // Don't throw - just console.error so we don't break user flow
    console.error('[ERROR-LOGGER] Failed to log error:', loggingError);
  }
}

/**
 * Log API error with request context
 * @param {Error|string} error - Error object or message
 * @param {Object} req - Next.js API request object
 * @param {string} severity - Error severity level
 */
export async function logApiError(error, req, severity = 'medium') {
  const userId = req.userId || req.body?.user_id || null;
  const endpoint = req.url || 'unknown_endpoint';

  await logUserError(error, {
    context: endpoint,
    userId,
    severity,
    data: {
      method: req.method,
      body: req.body,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      }
    }
  });
}

/**
 * Log component error with React context
 * @param {Error|string} error - Error object or message
 * @param {string} componentName - Name of React component
 * @param {Object} componentState - Component state at time of error
 * @param {string} userId - User ID (if available)
 */
export async function logComponentError(error, componentName, componentState = {}, userId = null) {
  await logUserError(error, {
    context: `component:${componentName}`,
    userId,
    severity: 'medium',
    data: {
      component_state: componentState,
      react_version: typeof window !== 'undefined' ? window.React?.version : null
    }
  });
}

/**
 * Log validation error with field context
 * @param {string} message - Validation error message
 * @param {string} fieldName - Form field that failed validation
 * @param {*} fieldValue - Value that failed validation
 * @param {string} userId - User ID (if available)
 */
export async function logValidationError(message, fieldName, fieldValue, userId = null) {
  await logUserError(message, {
    context: 'validation',
    userId,
    severity: 'low',
    data: {
      field_name: fieldName,
      field_value: fieldValue,
      validation_rule: message
    }
  });
}

/**
 * Log network/fetch error
 * @param {Error|string} error - Error object or message
 * @param {string} url - URL that failed
 * @param {Object} requestOptions - Fetch options used
 * @param {string} userId - User ID (if available)
 */
export async function logNetworkError(error, url, requestOptions = {}, userId = null) {
  await logUserError(error, {
    context: 'network',
    userId,
    severity: 'high',
    data: {
      url,
      method: requestOptions.method || 'GET',
      request_body: requestOptions.body
    }
  });
}

/**
 * Log authentication/authorization errors
 * @param {Error|string} error - Error object or message
 * @param {string} action - What user was trying to do
 * @param {string} userId - User ID (if available)
 */
export async function logAuthError(error, action, userId = null) {
  await logUserError(error, {
    context: 'authentication',
    userId,
    severity: 'high',
    data: {
      action,
      attempted_at: new Date().toISOString()
    }
  });
}

/**
 * Wrapper for catching and logging errors in async functions
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context/component name
 * @param {string} userId - User ID (optional)
 * @returns {Function} Wrapped function that logs errors
 */
export function withErrorLogging(fn, context, userId = null) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      await logUserError(error, { context, userId });
      throw error; // Re-throw so component can handle it
    }
  };
}
