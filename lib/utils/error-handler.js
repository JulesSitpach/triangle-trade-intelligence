/**
 * API Error Handler
 *
 * Sanitizes error messages for production
 * Logs detailed errors server-side only
 * Returns safe error messages to client
 */

import { logger } from './logger';

/**
 * Standard error responses for common scenarios
 */
export const ErrorMessages = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You must be logged in to access this resource',
  FORBIDDEN: 'You do not have permission to access this resource',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',

  // Validation
  VALIDATION_ERROR: 'Invalid request data',
  MISSING_REQUIRED_FIELDS: 'Required fields are missing',
  INVALID_EMAIL: 'Invalid email address',
  WEAK_PASSWORD: 'Password does not meet security requirements',

  // Database
  DATABASE_ERROR: 'An error occurred while processing your request',
  RECORD_NOT_FOUND: 'The requested resource was not found',
  DUPLICATE_ENTRY: 'A record with this information already exists',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'An external service is temporarily unavailable',
  PAYMENT_ERROR: 'Payment processing failed. Please try again',
  AI_SERVICE_ERROR: 'AI analysis temporarily unavailable',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down and try again later',

  // Generic
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later',
  NOT_FOUND: 'Resource not found',
  METHOD_NOT_ALLOWED: 'Method not allowed'
};

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  VALIDATION: 'validation',
  AUTH: 'authentication',
  DATABASE: 'database',
  EXTERNAL: 'external_service',
  RATE_LIMIT: 'rate_limit',
  INTERNAL: 'internal'
};

/**
 * Production-safe error handler
 *
 * @param {Error} error - Original error object
 * @param {Object} context - Additional context (userId, endpoint, etc.)
 * @param {string} safeMessage - Safe message to return to client
 * @returns {Object} - Sanitized error response
 */
export function handleApiError(error, context = {}, safeMessage = ErrorMessages.INTERNAL_ERROR) {
  // Log full error details server-side
  logger.error('API Error:', {
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString()
  });

  // Return sanitized error to client
  return {
    success: false,
    error: safeMessage,
    ...(process.env.NODE_ENV === 'development' && {
      // Include stack trace only in development
      debug: {
        message: error.message,
        stack: error.stack
      }
    })
  };
}

/**
 * Standardized error response helper
 *
 * @param {Response} res - Next.js response object
 * @param {number} statusCode - HTTP status code
 * @param {Error|string} error - Error object or message
 * @param {Object} context - Additional context
 */
export function sendErrorResponse(res, statusCode, error, context = {}) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const safeMessage = getSafeErrorMessage(statusCode, errorMessage);

  // Log error with context
  if (error instanceof Error) {
    logger.error(`[${statusCode}] ${context.endpoint || 'API'}:`, {
      error: errorMessage,
      context
    });
  }

  // Send response
  return res.status(statusCode).json({
    success: false,
    error: safeMessage,
    ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
      debug: {
        message: error.message,
        stack: error.stack
      }
    })
  });
}

/**
 * Get safe error message based on status code
 */
function getSafeErrorMessage(statusCode, originalMessage) {
  // In production, use generic messages
  if (process.env.NODE_ENV === 'production') {
    switch (statusCode) {
      case 400:
        return ErrorMessages.VALIDATION_ERROR;
      case 401:
        return ErrorMessages.UNAUTHORIZED;
      case 403:
        return ErrorMessages.FORBIDDEN;
      case 404:
        return ErrorMessages.NOT_FOUND;
      case 429:
        return ErrorMessages.RATE_LIMIT_EXCEEDED;
      case 500:
      case 503:
        return ErrorMessages.INTERNAL_ERROR;
      default:
        return ErrorMessages.INTERNAL_ERROR;
    }
  }

  // In development, return original message
  return originalMessage || ErrorMessages.INTERNAL_ERROR;
}

/**
 * Validate required fields
 *
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object|null} - Validation error or null if valid
 */
export function validateRequiredFields(data, requiredFields) {
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: process.env.NODE_ENV === 'development'
        ? `Missing required fields: ${missingFields.join(', ')}`
        : ErrorMessages.MISSING_REQUIRED_FIELDS,
      missingFields
    };
  }

  return { valid: true };
}

/**
 * Example usage in API routes:
 *
 * import { sendErrorResponse, validateRequiredFields, ErrorMessages } from '@/lib/utils/error-handler';
 *
 * export default async function handler(req, res) {
 *   try {
 *     // Validate required fields
 *     const validation = validateRequiredFields(req.body, ['email', 'password']);
 *     if (!validation.valid) {
 *       return sendErrorResponse(res, 400, validation.error, { endpoint: 'login' });
 *     }
 *
 *     // Your logic here...
 *
 *   } catch (error) {
 *     return sendErrorResponse(res, 500, error, { endpoint: 'login', userId: user?.id });
 *   }
 * }
 */
