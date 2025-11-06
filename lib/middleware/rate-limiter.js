/**
 * RATE LIMITING MIDDLEWARE
 *
 * Prevents abuse of AI endpoints that cost money.
 * Uses in-memory storage (simple but works for single-server Vercel deployments).
 *
 * LIMITS:
 * - AI endpoints: 10 requests per minute per user
 * - General endpoints: 60 requests per minute per user
 *
 * For multi-server production, upgrade to Redis/Upstash.
 */

// In-memory storage (resets on server restart, but that's fine for basic protection)
const requestCounts = new Map();

/**
 * Rate limiter middleware
 * @param {number} maxRequests - Maximum requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds (default: 1 minute)
 */
export function rateLimiter(maxRequests = 60, windowMs = 60000) {
  return async (req, res, next) => {
    // Get user identifier (prefer user ID, fallback to IP)
    const userId = req.user?.id;
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress;
    const identifier = userId || ip;

    if (!identifier) {
      // Allow if we can't identify (shouldn't happen)
      return next();
    }

    const now = Date.now();
    const userKey = `${identifier}:${req.url}`;

    // Get or initialize request history
    let requestHistory = requestCounts.get(userKey);
    if (!requestHistory) {
      requestHistory = [];
      requestCounts.set(userKey, requestHistory);
    }

    // Remove expired requests from history
    requestHistory = requestHistory.filter(timestamp => now - timestamp < windowMs);
    requestCounts.set(userKey, requestHistory);

    // Check if limit exceeded
    if (requestHistory.length >= maxRequests) {
      const oldestRequest = requestHistory[0];
      const resetTime = Math.ceil((oldestRequest + windowMs - now) / 1000);

      console.log(`[RATE-LIMIT] 🚫 User ${identifier} exceeded limit on ${req.url}`);

      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${resetTime} seconds.`,
        retry_after: resetTime,
        limit_info: {
          max_requests: maxRequests,
          window_seconds: windowMs / 1000,
          requests_made: requestHistory.length
        }
      });
    }

    // Add current request to history
    requestHistory.push(now);
    requestCounts.set(userKey, requestHistory);

    // Clean up old entries periodically (prevent memory leak)
    if (Math.random() < 0.01) { // 1% chance on each request
      cleanupOldEntries(windowMs);
    }

    // Allow request
    next();
  };
}

/**
 * Cleanup old entries to prevent memory leak
 */
function cleanupOldEntries(windowMs) {
  const now = Date.now();
  for (const [key, history] of requestCounts.entries()) {
    const validRequests = history.filter(timestamp => now - timestamp < windowMs);
    if (validRequests.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, validRequests);
    }
  }
}

/**
 * Preset rate limiters for common use cases
 */
export const rateLimiters = {
  // AI endpoints (expensive - strict limits)
  ai: rateLimiter(10, 60000), // 10 requests per minute

  // Authentication endpoints (prevent brute force)
  auth: rateLimiter(5, 60000), // 5 requests per minute

  // General API endpoints
  api: rateLimiter(60, 60000), // 60 requests per minute

  // Public endpoints (more lenient)
  public: rateLimiter(100, 60000) // 100 requests per minute
};
