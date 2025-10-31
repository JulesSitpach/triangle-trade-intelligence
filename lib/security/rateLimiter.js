import rateLimit from 'express-rate-limit';

/**
 * Rate Limiters for Different Endpoint Types
 * Protects against brute force attacks and API abuse
 */

// Authentication endpoints (login, register) - strict limits
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 failed attempts per window (increased from 5 for usability)
  message: 'Too many failed login attempts. Please try again in 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipFailedRequests: false,
  skipSuccessfulRequests: true, // Don't count successful logins toward limit
  // Fix for Next.js - use custom key generator that doesn't rely on req.get()
  keyGenerator: (req) => {
    return req.headers?.['x-forwarded-for'] ||
           req.headers?.['x-real-ip'] ||
           req.socket?.remoteAddress ||
           'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

// General API endpoints - moderate limits
// 🔒 USER-BASED: Uses user ID when authenticated, falls back to IP
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Priority: User ID > IP address (prevents VPN bypassing)
    const userId = req.user?.id || req.body?.userId || req.query?.userId;
    if (userId && userId !== 'anonymous') {
      return `user:${userId}`;
    }
    // Fallback to IP
    return `ip:${req.headers?.['x-forwarded-for'] ||
                 req.headers?.['x-real-ip'] ||
                 req.socket?.remoteAddress ||
                 'unknown'}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.',
      retry_after: 60
    });
  }
});

// Strict limiter for expensive operations (AI analysis, PDF generation, etc.)
// 🔒 USER-BASED: Uses user ID when authenticated, falls back to IP for anonymous requests
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Priority: User ID (from auth) > User ID (from body/query) > IP address
    // This prevents VPN/proxy bypassing by tying limits to user accounts
    const userId = req.user?.id || req.body?.userId || req.query?.userId;
    if (userId && userId !== 'anonymous') {
      return `user:${userId}`;
    }
    // Fallback to IP for unauthenticated requests
    const ip = req.headers?.['x-forwarded-for'] ||
               req.headers?.['x-real-ip'] ||
               req.socket?.remoteAddress ||
               'unknown';
    return `ip:${ip}`;
  },
  handler: (req, res) => {
    const userId = req.user?.id || req.body?.userId || req.query?.userId;
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for this resource. Please try again later.',
      limited_by: userId ? 'user_account' : 'ip_address',
      retry_after: 60
    });
  }
});

/**
 * Helper to apply rate limiter to Next.js API routes
 * Next.js doesn't use Express middleware directly, so we wrap it
 *
 * @param {Object} limiter - Rate limiter instance from express-rate-limit
 * @returns {Function} - Async function that applies rate limiting
 */
export function applyRateLimit(limiter) {
  return (req, res) => {
    return new Promise((resolve, reject) => {
      limiter(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
  };
}

/**
 * Example usage in API route:
 *
 * import { applyRateLimit, authLimiter } from '@/lib/security/rateLimiter';
 *
 * export default async function handler(req, res) {
 *   try {
 *     await applyRateLimit(authLimiter)(req, res);
 *   } catch (error) {
 *     return res.status(429).json({
 *       success: false,
 *       error: 'Too many requests'
 *     });
 *   }
 *
 *   // Rest of your handler logic...
 * }
 */
