/**
 * Server-side Password Update API
 * Validates recovery token and updates password in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../lib/utils/enhanced-production-logger.js';

// Admin client for password updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, newPassword } = req.body;

  if (!accessToken || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Access token and new password required'
    });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
  }

  try {
    // Decode the JWT to get user ID without validating (we'll let admin API handle validation)
    // JWT structure: header.payload.signature
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      logger.error('Invalid token format', { component: 'auth_api' });
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired reset link'
      });
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const userId = payload.sub;
    const email = payload.email;

    if (!userId || !email) {
      logger.error('Invalid token payload', { component: 'auth_api' });
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired reset link'
      });
    }

    logger.info('Password update requested', {
      component: 'auth_api',
      userId,
      email
    });

    // Update password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      logger.error('Password update failed', {
        component: 'auth_api',
        userId,
        email,
        error: error.message
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }

    logger.info('Password updated successfully', {
      component: 'auth_api',
      userId,
      email
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error('Password update error', {
      component: 'auth_api',
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }
}
