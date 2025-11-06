/**
 * ENHANCED PRODUCTION LOGGER
 * Logs to BOTH console (dev mode) AND dev_issues table (production monitoring)
 *
 * Usage:
 * import { logger } from '@/lib/utils/enhanced-production-logger';
 * logger.info('User logged in', { userId, email });
 * logger.error('API call failed', { endpoint, error });
 * logger.sales('New subscription', { userId, tier, amount });
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Environment configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const ENABLE_CONSOLE = process.env.ENABLE_CONSOLE_LOGS !== 'false';
const ENABLE_DB_LOGGING = process.env.ENABLE_DB_LOGGING !== 'false';

// Log levels hierarchy
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Map log severity to dev_issues severity
 */
function mapToDevIssueSeverity(level) {
  switch (level) {
    case 'error': return 'critical';
    case 'warn': return 'high';
    case 'info': return 'medium';
    case 'debug': return 'low';
    default: return 'medium';
  }
}

/**
 * Check if log level should be output
 */
function shouldLog(level) {
  const currentLevelValue = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;
  const messageLevelValue = LOG_LEVELS[level] || LOG_LEVELS.info;
  return messageLevelValue <= currentLevelValue;
}

/**
 * Get emoji for log level
 */
function getEmoji(level, category) {
  if (category === 'sales') return '💰';
  if (category === 'analytics') return '📊';
  if (category === 'security') return '🔒';
  if (category === 'performance') return '⚡';

  switch (level) {
    case 'error': return '❌';
    case 'warn': return '⚠️';
    case 'info': return 'ℹ️';
    case 'debug': return '🔍';
    default: return 'ℹ️';
  }
}

/**
 * Save log to dev_issues table for admin dashboard monitoring
 */
async function saveToDatabase(level, message, metadata = {}) {
  if (!ENABLE_DB_LOGGING) return;

  // Only log warn/error to database in production (reduce noise)
  if (IS_PRODUCTION && !['error', 'warn'].includes(level)) return;

  try {
    const issueType = metadata.category || (level === 'error' ? 'api_error' : 'info');

    await supabase.from('dev_issues').insert({
      issue_type: issueType,
      severity: mapToDevIssueSeverity(level),
      component: metadata.component || 'system',
      message: message,
      context_data: {
        level,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      user_id: metadata.userId || null,
      certificate_number: metadata.certificateNumber || null,
      resolved: false
    });
  } catch (error) {
    // Don't crash if database logging fails
    if (ENABLE_CONSOLE) {
      console.error('Failed to log to database:', error.message);
    }
  }
}

/**
 * Core logging function
 */
async function log(level, message, metadata = {}) {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const emoji = getEmoji(level, metadata.category);
  const component = metadata.component || 'app';

  // Console logging (always in dev, configurable in production)
  if (ENABLE_CONSOLE) {
    const logEntry = `${emoji} [${timestamp}] [${level.toUpperCase()}] [${component}] ${message}`;
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

    if (Object.keys(metadata).length > 0) {
      logMethod(logEntry, metadata);
    } else {
      logMethod(logEntry);
    }
  }

  // Database logging (production monitoring)
  await saveToDatabase(level, message, metadata);
}

/**
 * Main logger exports
 */
export const logger = {
  /**
   * Error logging - Critical issues that need immediate attention
   */
  error: (message, metadata = {}) => log('error', message, { ...metadata, category: metadata.category || 'error' }),

  /**
   * Warning logging - Issues that should be reviewed but not critical
   */
  warn: (message, metadata = {}) => log('warn', message, { ...metadata, category: metadata.category || 'warning' }),

  /**
   * Info logging - General application flow
   */
  info: (message, metadata = {}) => log('info', message, { ...metadata, category: metadata.category || 'info' }),

  /**
   * Debug logging - Detailed debugging information
   */
  debug: (message, metadata = {}) => log('debug', message, { ...metadata, category: metadata.category || 'debug' }),

  /**
   * Sales tracking - Track revenue events for analytics
   */
  sales: (message, metadata = {}) => log('info', message, { ...metadata, component: 'sales', category: 'sales' }),

  /**
   * Analytics tracking - Track user behavior and system metrics
   */
  analytics: (message, metadata = {}) => log('info', message, { ...metadata, component: 'analytics', category: 'analytics' }),

  /**
   * Security events - Authentication, authorization, suspicious activity
   */
  security: (message, metadata = {}) => log('warn', message, { ...metadata, component: 'security', category: 'security' }),

  /**
   * Performance monitoring - Track slow operations
   */
  performance: (message, duration, metadata = {}) => log('info', message, {
    ...metadata,
    component: 'performance',
    category: 'performance',
    duration_ms: duration
  }),

  /**
   * API request logging
   */
  request: (method, url, statusCode, responseTime, metadata = {}) => log('info', `${method} ${url}`, {
    ...metadata,
    component: 'api',
    status_code: statusCode,
    response_time_ms: responseTime
  }),

  /**
   * Database operation logging
   */
  database: (operation, table, duration, success, metadata = {}) => {
    const level = success ? 'info' : 'error';
    return log(level, `DB ${operation} on ${table}`, {
      ...metadata,
      component: 'database',
      duration_ms: duration,
      success,
      table
    });
  }
};

/**
 * Backwards compatibility with production-logger.js
 */
export const logError = logger.error;
export const logWarn = logger.warn;
export const logInfo = logger.info;
export const logDebug = logger.debug;
export const logPerformance = (operation, startTime, metadata = {}) => {
  const duration = Date.now() - startTime;
  return logger.performance(operation, duration, metadata);
};
export const logRequest = logger.request;
export const logDatabase = logger.database;

export default logger;
