/**
 * PRODUCTION LOGGER UTILITY
 * Configuration-based logging system
 * NO HARDCODED LOG LEVELS OR FORMATS
 */


// Get logging configuration from environment
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FORMAT = process.env.LOG_FORMAT || 'json';
const ENABLE_CONSOLE = process.env.ENABLE_CONSOLE_LOGS !== 'false';

/**
 * Log levels hierarchy
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Check if log level should be output
 */
function shouldLog(level) {
  const currentLevelValue = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;
  const messageLevelValue = LOG_LEVELS[level] || LOG_LEVELS.info;
  return messageLevelValue <= currentLevelValue;
}

/**
 * Format log message
 */
function formatMessage(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...metadata
  };

  if (LOG_FORMAT === 'plain') {
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : ''}`;
  }
  
  return JSON.stringify(logEntry);
}

/**
 * Generic log function
 */
function log(level, message, metadata = {}) {
  if (!shouldLog(level)) return;

  const formattedMessage = formatMessage(level, message, metadata);
  
  if (ENABLE_CONSOLE) {
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  // In production, you might send logs to external service
  // This would be configured via environment variables
  if (process.env.LOG_SERVICE_URL && level === 'error') {
    // Send critical errors to external logging service
    // Implementation would depend on your logging service
  }
}

/**
 * Exported logging functions
 */
export function logError(message, metadata = {}) {
  log('error', message, metadata);
}

export function logWarn(message, metadata = {}) {
  log('warn', message, metadata);
}

export function logInfo(message, metadata = {}) {
  log('info', message, metadata);
}

export function logDebug(message, metadata = {}) {
  log('debug', message, metadata);
}

/**
 * Performance logging
 */
export function logPerformance(operation, startTime, metadata = {}) {
  const duration = Date.now() - startTime;
  logInfo(`Performance: ${operation}`, {
    duration_ms: duration,
    ...metadata
  });
}

/**
 * Request logging
 */
export function logRequest(method, url, statusCode, responseTime, metadata = {}) {
  logInfo(`Request: ${method} ${url}`, {
    status_code: statusCode,
    response_time_ms: responseTime,
    ...metadata
  });
}

/**
 * Database operation logging
 */
export function logDatabase(operation, table, duration, success, metadata = {}) {
  const level = success ? 'info' : 'error';
  log(level, `Database: ${operation} on ${table}`, {
    duration_ms: duration,
    success,
    ...metadata
  });
}

export const ProductionLogger = {
  logError,
  logWarn,
  logInfo,
  logDebug,
  logPerformance,
  logRequest,
  logDatabase,
  // Add aliases for common usage patterns
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug
};

const productionLoggerExports = {
  logError,
  logWarn,
  logInfo,
  logDebug,
  logPerformance,
  logRequest,
  logDatabase
};

export default productionLoggerExports;