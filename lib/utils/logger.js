/**
 * Production-Safe Logger
 *
 * Conditional logging based on environment:
 * - Development: Full logging with colors
 * - Production: Errors/warnings only, info silenced
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.info('Debug info');      // Silent in production
 *   logger.warn('Warning');          // Always shown
 *   logger.error('Error', error);   // Always shown
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Format log messages with timestamp and context
 */
function formatMessage(level, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  return [prefix, ...args];
}

/**
 * Logger object with conditional methods
 */
export const logger = {
  /**
   * Info logs - only in development
   * Use for: debug info, flow tracking, non-critical data
   */
  info: (...args) => {
    if (!IS_PRODUCTION) {
      console.log(...formatMessage('INFO', ...args));
    }
  },

  /**
   * Success logs - only in development
   * Use for: successful operations, confirmations
   */
  success: (...args) => {
    if (!IS_PRODUCTION) {
      console.log(...formatMessage('SUCCESS', '✅', ...args));
    }
  },

  /**
   * Warning logs - always shown
   * Use for: potential issues, deprecations, non-critical problems
   */
  warn: (...args) => {
    console.warn(...formatMessage('WARN', '⚠️', ...args));
  },

  /**
   * Error logs - always shown
   * Use for: errors, exceptions, critical issues
   */
  error: (...args) => {
    console.error(...formatMessage('ERROR', '❌', ...args));
  },

  /**
   * Debug logs - only in development
   * Use for: detailed debugging, verbose output
   */
  debug: (...args) => {
    if (!IS_PRODUCTION && process.env.DEBUG) {
      console.log(...formatMessage('DEBUG', '🔍', ...args));
    }
  },

  /**
   * Security logs - always shown (for audit trail)
   * Use for: auth events, permission checks, security-related actions
   */
  security: (...args) => {
    console.log(...formatMessage('SECURITY', '🛡️', ...args));
  },

  /**
   * API logs - conditional
   * Use for: API requests, responses, timing
   */
  api: (method, path, statusCode, duration) => {
    const message = `${method} ${path} - ${statusCode} (${duration}ms)`;
    if (!IS_PRODUCTION) {
      console.log(...formatMessage('API', '🌐', message));
    } else if (statusCode >= 400) {
      // Log errors in production
      console.error(...formatMessage('API', '🌐', message));
    }
  }
};

/**
 * Sanitize sensitive data from logs
 * Remove passwords, API keys, tokens, etc.
 */
export function sanitizeForLog(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sensitiveKeys = [
    'password',
    'password_hash',
    'api_key',
    'apiKey',
    'token',
    'accessToken',
    'secret',
    'privateKey',
    'creditCard',
    'ssn'
  ];

  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Example usage:
 *
 * // Development: logs everything
 * logger.info('Processing order', { orderId: 123 });
 * logger.success('Order completed');
 * logger.error('Failed to process', error);
 *
 * // Production: only errors/warnings
 * logger.info('This is silent'); // Not logged
 * logger.error('Critical error'); // Logged
 *
 * // Sanitize sensitive data
 * const userData = { email: 'user@example.com', password: 'secret123' };
 * logger.info('User data:', sanitizeForLog(userData));
 * // Logs: { email: 'user@example.com', password: '[REDACTED]' }
 */
