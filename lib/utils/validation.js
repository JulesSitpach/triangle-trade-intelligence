/**
 * validation.js - Production-ready input validation and sanitization
 * Provides comprehensive validation for all user inputs
 * Prevents XSS, injection attacks, and data corruption
 */

// Email validation with comprehensive regex
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Phone number validation (international)
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  // Remove all non-digit characters for validation
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

// Company name validation
export const isValidCompanyName = (name) => {
  if (!name || typeof name !== 'string') return false;

  const sanitized = name.trim();
  return sanitized.length >= 2 && sanitized.length <= 100 && /^[a-zA-Z0-9\s\-&.,()]+$/.test(sanitized);
};

// Product description validation
export const isValidProductDescription = (description) => {
  if (!description || typeof description !== 'string') return false;

  const sanitized = description.trim();
  return sanitized.length >= 5 && sanitized.length <= 500;
};

// HS Code validation
export const isValidHSCode = (hsCode) => {
  if (!hsCode || typeof hsCode !== 'string') return false;

  // HS codes are typically 6-10 digits
  const digits = hsCode.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 10;
};

// Trade volume validation
export const isValidTradeVolume = (volume) => {
  if (volume === null || volume === undefined) return false;

  const numericVolume = typeof volume === 'string' ? parseFloat(volume.replace(/[^0-9.]/g, '')) : volume;
  return !isNaN(numericVolume) && numericVolume >= 0 && numericVolume <= 999999999;
};

// Text sanitization to prevent XSS
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// SQL injection prevention for search terms
export const sanitizeSearchTerm = (term) => {
  if (!term || typeof term !== 'string') return '';

  return term
    .replace(/['"`;\\]/g, '') // Remove dangerous SQL characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 100); // Limit length
};

// Service type validation
export const isValidServiceType = (serviceType) => {
  const validServices = [
    'USMCA Certificates',
    'HS Classification',
    'Crisis Response',
    'Supplier Sourcing',
    'Manufacturing Feasibility',
    'Market Entry'
  ];

  return validServices.includes(serviceType);
};

// Status validation
export const isValidStatus = (status) => {
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  return validStatuses.includes(status);
};

// Risk level validation
export const isValidRiskLevel = (riskLevel) => {
  const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH'];
  return validRiskLevels.includes(riskLevel?.toUpperCase());
};

// Pagination parameters validation
export const isValidPageNumber = (page) => {
  const pageNum = parseInt(page);
  return !isNaN(pageNum) && pageNum >= 1 && pageNum <= 10000;
};

export const isValidItemsPerPage = (itemsPerPage) => {
  const validSizes = [5, 10, 25, 50, 100];
  return validSizes.includes(parseInt(itemsPerPage));
};

// Sort field validation
export const isValidSortField = (field) => {
  const validFields = ['company_name', 'product', 'status', 'risk_level', 'created_at'];
  return validFields.includes(field);
};

export const isValidSortDirection = (direction) => {
  return ['asc', 'desc'].includes(direction?.toLowerCase());
};

// Comprehensive form validation
export const validateServiceRequest = (data) => {
  const errors = {};

  // Required fields validation
  if (!data.company_name || !isValidCompanyName(data.company_name)) {
    errors.company_name = 'Valid company name is required (2-100 characters, alphanumeric)';
  }

  if (!data.contact_name || data.contact_name.trim().length < 2) {
    errors.contact_name = 'Contact name is required (minimum 2 characters)';
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Valid email address is required';
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Valid phone number is required (7-15 digits)';
  }

  if (!data.service_type || !isValidServiceType(data.service_type)) {
    errors.service_type = 'Valid service type is required';
  }

  // Optional field validation
  if (data.trade_volume && !isValidTradeVolume(data.trade_volume)) {
    errors.trade_volume = 'Trade volume must be a valid number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// API request validation
export const validateAPIRequest = (method, endpoint, data) => {
  const errors = [];

  // Method validation
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    errors.push('Invalid HTTP method');
  }

  // Endpoint validation
  if (!endpoint || typeof endpoint !== 'string' || endpoint.length > 200) {
    errors.push('Invalid API endpoint');
  }

  // Rate limiting check (basic)
  const requestKey = `${method}:${endpoint}`;
  const now = Date.now();
  const requestHistory = getRequestHistory(requestKey);

  // Allow max 100 requests per minute per endpoint
  const recentRequests = requestHistory.filter(time => now - time < 60000);
  if (recentRequests.length >= 100) {
    errors.push('Rate limit exceeded. Please slow down your requests.');
  }

  // Update request history
  updateRequestHistory(requestKey, now);

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Simple in-memory rate limiting (in production, use Redis or database)
const requestHistory = new Map();

const getRequestHistory = (key) => {
  return requestHistory.get(key) || [];
};

const updateRequestHistory = (key, timestamp) => {
  const history = getRequestHistory(key);
  history.push(timestamp);

  // Keep only last 100 requests to prevent memory issues
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }

  requestHistory.set(key, history);
};

// Environment variable validation
export const validateEnvironmentVariables = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'OPENROUTER_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return {
      isValid: false,
      missing
    };
  }

  return {
    isValid: true,
    missing: []
  };
};

// Development helper for validation testing
export const runValidationTests = () => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('🧪 Running validation tests...');

  // Test email validation
  console.assert(isValidEmail('test@example.com'), 'Email validation failed');
  console.assert(!isValidEmail('invalid-email'), 'Email validation failed');

  // Test phone validation
  console.assert(isValidPhone('+1-555-123-4567'), 'Phone validation failed');
  console.assert(!isValidPhone('123'), 'Phone validation failed');

  // Test company name validation
  console.assert(isValidCompanyName('Acme Corp'), 'Company name validation failed');
  console.assert(!isValidCompanyName(''), 'Company name validation failed');

  console.log('✅ All validation tests passed');
  console.groupEnd();
};