/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Validates that requests are coming from allowed origins
 */

/**
 * Verify CSRF token by checking request origin
 * @param {Object} req - Next.js request object
 * @returns {boolean} - True if valid origin, false otherwise
 */
export function verifyCsrfToken(req) {
  const origin = req.headers.origin || req.headers.referer;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000', // Development
    'http://localhost:3001', // Alternative development port
    'https://triangle-simple.vercel.app', // Vercel preview
  ].filter(Boolean); // Remove undefined values

  if (!origin) {
    // Allow requests without origin (e.g., Postman, server-to-server)
    // In production, you might want to be more strict
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Request without origin header blocked in production');
      return false;
    }
    return true;
  }

  // Check if origin matches any allowed origin
  const isAllowed = allowedOrigins.some(allowed => {
    if (!allowed) return false;
    try {
      const originUrl = new URL(origin);
      const allowedUrl = new URL(allowed);
      return originUrl.origin === allowedUrl.origin;
    } catch (error) {
      console.error('Error parsing origin URLs:', error);
      return false;
    }
  });

  if (!isAllowed) {
    console.warn(`🛡️ Blocked request from unauthorized origin: ${origin}`);
  }

  return isAllowed;
}

/**
 * Middleware to apply CSRF protection to API routes
 * Use this for state-changing operations (POST, PUT, DELETE, PATCH)
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {boolean} - True if CSRF check passed, false otherwise
 */
export function applyCsrfProtection(req, res) {
  // Only check for state-changing methods
  const methodsToProtect = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (!methodsToProtect.includes(req.method)) {
    return true; // GET and HEAD requests don't need CSRF protection
  }

  if (!verifyCsrfToken(req)) {
    res.status(403).json({
      success: false,
      error: 'Invalid request origin. CSRF validation failed.'
    });
    return false;
  }

  return true;
}

/**
 * Example usage in API route:
 *
 * import { applyCsrfProtection } from '@/lib/security/csrf';
 *
 * export default async function handler(req, res) {
 *   // Apply CSRF protection
 *   if (!applyCsrfProtection(req, res)) {
 *     return; // Response already sent with 403 error
 *   }
 *
 *   // Rest of your handler logic...
 * }
 */
