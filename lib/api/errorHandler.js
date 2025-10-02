/**
 * API Error Handling Utilities
 * Standardized error handling for all API routes
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Get user-friendly error message based on status code
 */
export function getUserFriendlyMessage(statusCode, originalMessage = '') {
  const friendlyMessages = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Authentication required. Please sign in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This action conflicts with existing data.',
    422: 'The provided data could not be processed.',
    429: 'Too many requests. Please try again later.',
    500: 'An internal server error occurred. Our team has been notified.',
    503: 'Service temporarily unavailable. Please try again later.',
  };

  // In production, use friendly messages. In development, allow original messages through
  if (process.env.NODE_ENV === 'production') {
    return friendlyMessages[statusCode] || 'An unexpected error occurred.';
  }

  // In development, prefer original message if available
  return originalMessage || friendlyMessages[statusCode] || 'An unexpected error occurred.';
}

/**
 * Handle API errors with standardized response format
 */
export function handleApiError(error, req, res) {
  // Log error with context
  console.error('[API Error]', {
    method: req.method,
    url: req.url,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Get user-friendly message
  const message = getUserFriendlyMessage(statusCode, error.message);

  // Build response object
  const response = {
    success: false,
    error: message,
  };

  // Include technical details only in development
  if (process.env.NODE_ENV !== 'production' && error.details) {
    response.details = error.details;
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
}

/**
 * Validate required fields in request data
 */
export function validateRequiredFields(data, requiredFields) {
  const missingFields = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      { missingFields }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    throw new ApiError(
      'Invalid email address format',
      400,
      { field: 'email', value: email }
    );
  }
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhone(phone) {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // US/Canada phone numbers should have 10 digits (excluding country code)
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    throw new ApiError(
      'Invalid phone number format. Must be 10-11 digits.',
      400,
      { field: 'phone', value: phone }
    );
  }
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove script tags
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
}

/**
 * Validate numeric value
 */
export function validateNumber(value, fieldName, options = {}) {
  const num = parseFloat(value);

  if (isNaN(num)) {
    throw new ApiError(
      `${fieldName} must be a valid number`,
      400,
      { field: fieldName, value }
    );
  }

  if (options.min !== undefined && num < options.min) {
    throw new ApiError(
      `${fieldName} must be at least ${options.min}`,
      400,
      { field: fieldName, value, min: options.min }
    );
  }

  if (options.max !== undefined && num > options.max) {
    throw new ApiError(
      `${fieldName} must be at most ${options.max}`,
      400,
      { field: fieldName, value, max: options.max }
    );
  }

  return num;
}

/**
 * Validate string length
 */
export function validateStringLength(value, fieldName, options = {}) {
  if (typeof value !== 'string') {
    throw new ApiError(
      `${fieldName} must be a string`,
      400,
      { field: fieldName, value }
    );
  }

  const length = value.trim().length;

  if (options.minLength !== undefined && length < options.minLength) {
    throw new ApiError(
      `${fieldName} must be at least ${options.minLength} characters`,
      400,
      { field: fieldName, length, minLength: options.minLength }
    );
  }

  if (options.maxLength !== undefined && length > options.maxLength) {
    throw new ApiError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      400,
      { field: fieldName, length, maxLength: options.maxLength }
    );
  }

  return value.trim();
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, message?: string }
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  // Optional: check for special characters
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   return { valid: false, message: 'Password must contain at least one special character' };
  // }

  return { valid: true };
}

/**
 * Log error with context for production monitoring
 * @param {Error} error - Error object
 * @param {Object} context - Additional context (url, method, userId, etc.)
 * @returns {Object} - Error log object
 */
export function logError(error, context = {}) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error Log:', errorLog);
  }

  // In production, you would send this to an error monitoring service
  // Example with Sentry:
  // if (process.env.NODE_ENV === 'production' && typeof Sentry !== 'undefined') {
  //   Sentry.captureException(error, { extra: context });
  // }

  return errorLog;
}
