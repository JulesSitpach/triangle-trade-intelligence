/**
 * Password Reset Request API
 * Sends password reset email via Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../../../lib/utils/enhanced-production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    logger.info('Password reset requested', { component: 'auth_api', email });

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`
    });

    if (error) {
      logger.error('Password reset failed', {
        component: 'auth_api',
        email,
        error: error.message
      });

      // Don't reveal if email exists or not (security best practice)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.'
      });
    }

    logger.info('Password reset email sent', { component: 'auth_api', email });

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    logger.error('Password reset error', {
      component: 'auth_api',
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
}
