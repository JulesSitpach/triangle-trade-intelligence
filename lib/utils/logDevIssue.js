/**
 * Helper utility to log development issues
 * Makes it easy to capture bugs, missing data, and errors throughout the codebase
 *
 * Usage:
 * import { logDevIssue } from '../lib/utils/logDevIssue';
 *
 * logDevIssue({
 *   type: 'missing_data',
 *   severity: 'high',
 *   component: 'workflow',
 *   message: 'Component HS code missing',
 *   data: { component, workflow }
 * });
 */

/**
 * Log a development issue to the admin dashboard
 * @param {Object} params
 * @param {string} params.type - 'missing_data', 'validation_error', 'api_error', 'null_value', 'unexpected_behavior'
 * @param {string} params.severity - 'critical', 'high', 'medium', 'low'
 * @param {string} params.component - 'pdf_generator', 'certificate_api', 'workflow', 'database', 'ai_classification', etc.
 * @param {string} params.message - Human-readable description
 * @param {Object} params.data - Full context object
 * @param {string} params.userId - Optional user ID
 * @param {string} params.certificateNumber - Optional certificate number
 */
export async function logDevIssue({
  type,
  severity,
  component,
  message,
  data = {},
  userId = null,
  certificateNumber = null
}) {
  try {
    // Log to console immediately for developer visibility
    const emoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '⚡' : 'ℹ️';
    console.error(`${emoji} DEV ISSUE [${severity.toUpperCase()}]: ${component} - ${message}`, data);

    // Determine base URL for server-side vs client-side
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '';

    // Log to admin dashboard (non-blocking)
    fetch(`${baseUrl}/api/admin/log-dev-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue_type: type,
        severity,
        component,
        message,
        data,
        user_id: userId,
        certificate_number: certificateNumber
      })
    }).catch(err => {
      console.error('Failed to log to admin dashboard:', err);
    });

    return true;
  } catch (error) {
    console.error('logDevIssue failed:', error);
    return false;
  }
}

/**
 * Quick helpers for common scenarios
 */
export const DevIssue = {
  missingData: (component, field, data) => logDevIssue({
    type: 'missing_data',
    severity: 'high',
    component,
    message: `Missing required field: ${field}`,
    data
  }),

  nullValue: (component, field, data) => logDevIssue({
    type: 'null_value',
    severity: 'medium',
    component,
    message: `Unexpected null value for: ${field}`,
    data
  }),

  apiError: (component, endpoint, error, data) => logDevIssue({
    type: 'api_error',
    severity: 'critical',
    component,
    message: `API call failed: ${endpoint} - ${error.message}`,
    data: { ...data, error: error.message, stack: error.stack }
  }),

  validationError: (component, field, value, data) => logDevIssue({
    type: 'validation_error',
    severity: 'medium',
    component,
    message: `Validation failed for ${field}: ${value}`,
    data
  }),

  unexpectedBehavior: (component, description, data) => logDevIssue({
    type: 'unexpected_behavior',
    severity: 'high',
    component,
    message: description,
    data
  })
};
