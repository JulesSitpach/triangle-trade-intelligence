import rateLimit from 'express-rate-limit';

/**
 * Rate Limiters for Different Endpoint Types
 * Protects against brute force attacks and API abuse
 */

// Authentication endpoints (login, register) - strict limits
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }
});

// General API endpoints - moderate limits
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.'
    });
  }
});

// Strict limiter for expensive operations (AI analysis, PDF generation, etc.)
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for this resource. Please try again later.'
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
