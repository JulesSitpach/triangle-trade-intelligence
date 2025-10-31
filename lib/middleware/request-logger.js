/**
 * 🚨 API REQUEST LOGGER MIDDLEWARE
 *
 * Logs all API requests on the server side to catch phantom calls
 *
 * Usage in API routes:
 *
 * import { logRequest } from '../../lib/middleware/request-logger';
 *
 * export default function handler(req, res) {
 *   logRequest(req);
 *   // Your API logic...
 * }
 */

export function logRequest(req) {
  const timestamp = new Date().toISOString();

  console.log('🚨 API REQUEST:', {
    timestamp,
    path: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'] || '(no referer)',
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
    query: Object.keys(req.query || {}).length > 0 ? req.query : '(no query)',
    hasBody: req.method === 'POST' || req.method === 'PUT' ? 'YES' : 'NO'
  });
}

/**
 * Wrapper to automatically log requests in API routes
 *
 * Usage:
 * export default withRequestLogging(async function handler(req, res) {
 *   // Your API logic...
 * });
 */
export function withRequestLogging(handler) {
  return async function(req, res) {
    logRequest(req);
    return handler(req, res);
  };
}
