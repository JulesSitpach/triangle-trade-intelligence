/**
 * Test Protected Route
 * Use this to verify authentication middleware is working
 *
 * Test commands:
 *
 * 1. While logged in (should succeed):
 *    fetch('http://localhost:3000/api/test-protected', {credentials: 'include'})
 *      .then(r => r.json()).then(console.log)
 *
 * 2. While logged out (should fail with 401):
 *    fetch('http://localhost:3000/api/test-protected')
 *      .then(r => r.json()).then(console.log)
 */

import { withAuth } from '../../lib/middleware/auth-middleware';

async function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Authentication successful! 🎉',
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
}

export default withAuth(handler);
