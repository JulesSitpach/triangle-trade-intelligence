/**
 * security.js - Production security middleware and utilities
 * Provides CSRF protection, input sanitization, and security headers
 * Prevents common security vulnerabilities in production
 */

import { validateAPIRequest, sanitizeText, sanitizeSearchTerm } from '../utils/validation';

// CSRF Token management
class CSRFTokenManager {
  constructor() {
    this.tokens = new Map();
    this.tokenTTL = 60 * 60 * 1000; // 1 hour
  }

  generateToken() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    this.tokens.set(token, Date.now() + this.tokenTTL);
    return token;
  }

  validateToken(token) {
    if (!token || !this.tokens.has(token)) {
      return false;
    }

    const expiry = this.tokens.get(token);
    if (Date.now() > expiry) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, expiry] of this.tokens.entries()) {
      if (now > expiry) {
        this.tokens.delete(token);
      }
    }
  }
}

export const csrfTokenManager = new CSRFTokenManager();

// Clean up expired tokens every 10 minutes
setInterval(() => {
  csrfTokenManager.cleanupExpiredTokens();
}, 10 * 60 * 1000);

// Security headers for API responses
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';"
  };
};

// Input sanitization middleware
export const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return sanitizeText(data);
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[sanitizeText(key)] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
};

// API request validation middleware
export const withSecurityValidation = (handler) => {
  return async (req, res) => {
    try {
      // Apply security headers
      const headers = getSecurityHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Validate HTTP method
      const validation = validateAPIRequest(req.method, req.url, req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid request',
          details: validation.errors
        });
      }

      // CSRF protection for state-changing requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'];
        if (!csrfToken || !csrfTokenManager.validateToken(csrfToken)) {
          return res.status(403).json({
            error: 'Invalid CSRF token'
          });
        }
      }

      // Sanitize request body
      if (req.body) {
        req.body = sanitizeInput(req.body);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = sanitizeInput(req.query);
      }

      // Call the actual handler
      return await handler(req, res);

    } catch (error) {
      console.error('Security middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  };
};

// Rate limiting for API endpoints
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = 60 * 1000; // 1 minute
    this.maxRequests = 100; // requests per window
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create request history for this identifier
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const requests = this.requests.get(identifier);

    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    this.requests.set(identifier, recentRequests);

    // Check if within rate limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    return true;
  }

  getRemainingRequests(identifier) {
    const requests = this.requests.get(identifier) || [];
    const windowStart = Date.now() - this.windowMs;
    const recentRequests = requests.filter(time => time > windowStart);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

// Rate limiting middleware
export const withRateLimit = (handler, customLimits = {}) => {
  const limiter = new RateLimiter();
  Object.assign(limiter, customLimits);

  return async (req, res) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';

    if (!limiter.isAllowed(identifier)) {
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + limiter.windowMs).toISOString());

      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.setHeader('X-RateLimit-Remaining', limiter.getRemainingRequests(identifier).toString());
    res.setHeader('X-RateLimit-Limit', limiter.maxRequests.toString());

    return await handler(req, res);
  };
};

// Authentication middleware
export const withAuthentication = (handler, options = {}) => {
  return async (req, res) => {
    try {
      // Check for API key or session token
      const apiKey = req.headers['x-api-key'];
      const sessionToken = req.headers['authorization']?.replace('Bearer ', '');

      if (!apiKey && !sessionToken) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      // Validate API key (implement your validation logic)
      if (apiKey && !isValidAPIKey(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key'
        });
      }

      // Validate session token (implement your validation logic)
      if (sessionToken && !isValidSessionToken(sessionToken)) {
        return res.status(401).json({
          error: 'Invalid session token'
        });
      }

      // Add user context to request
      req.user = await getUserFromToken(sessionToken || apiKey);

      return await handler(req, res);

    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({
        error: 'Authentication failed'
      });
    }
  };
};

// Simple API key validation (replace with your implementation)
const isValidAPIKey = (apiKey) => {
  // In production, validate against database or external service
  return apiKey && apiKey.length >= 32;
};

// Simple session token validation (replace with your implementation)
const isValidSessionToken = (token) => {
  // In production, validate JWT or session token
  return token && token.length >= 20;
};

// Get user from token (replace with your implementation)
const getUserFromToken = async (token) => {
  // In production, decode JWT or query user from database
  return {
    id: 'user-id',
    role: 'admin',
    permissions: ['read', 'write']
  };
};

// Combined security middleware
export const withFullSecurity = (handler, options = {}) => {
  return withRateLimit(
    withSecurityValidation(
      withAuthentication(handler, options)
    ),
    options.rateLimits
  );
};

// Security audit logging
export const auditLog = (action, details, req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    ip: req?.ip || req?.socket?.remoteAddress,
    userAgent: req?.headers['user-agent'],
    user: req?.user?.id || 'anonymous'
  };

  // In production, send to logging service
  console.log('🔒 Security Audit:', logEntry);

  // Store critical security events
  if (action.includes('FAILED') || action.includes('BLOCKED')) {
    // In production, store in database or send alert
    console.warn('🚨 Security Alert:', logEntry);
  }
};

// Environment security check
export const validateSecurityConfig = () => {
  const issues = [];

  // Check for development environment in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      issues.push('Production environment using localhost database');
    }

    if (!process.env.OPENROUTER_API_KEY?.startsWith('sk-')) {
      issues.push('Invalid or missing OpenRouter API key format');
    }
  }

  // Check for insecure configurations
  if (process.env.NODE_ENV !== 'development') {
    if (process.env.DEBUG === 'true') {
      issues.push('Debug mode enabled in non-development environment');
    }
  }

  if (issues.length > 0) {
    console.error('🔒 Security Configuration Issues:', issues);
    return {
      isSecure: false,
      issues
    };
  }

  return {
    isSecure: true,
    issues: []
  };
};

// Initialize security checks
if (typeof window === 'undefined') {
  // Server-side initialization
  const securityCheck = validateSecurityConfig();
  if (!securityCheck.isSecure) {
    console.error('❌ Security validation failed. Fix issues before production deployment.');
  }
}