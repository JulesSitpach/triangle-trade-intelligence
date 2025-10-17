import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    await DevIssue.validationError('auth_api', 'HTTP method', req.method, {
      endpoint: '/api/auth/verify-reset-token',
      allowedMethod: 'POST'
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    await DevIssue.missingData('auth_api', 'token', {
      endpoint: '/api/auth/verify-reset-token'
    });
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Find user with this reset token
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, reset_token_expiry')
      .eq('reset_token', token)
      .single();

    if (userError || !user) {
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'auth_api',
        message: 'Invalid reset token during verification',
        data: {
          endpoint: '/api/auth/verify-reset-token',
          tokenProvided: !!token,
          error: userError?.message
        }
      });
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Check if token has expired
    const now = new Date();
    const expiry = new Date(user.reset_token_expiry);

    if (now > expiry) {
      await logDevIssue({
        type: 'validation_error',
        severity: 'medium',
        component: 'auth_api',
        message: 'Expired reset token during verification',
        data: {
          endpoint: '/api/auth/verify-reset-token',
          userId: user.id,
          email: user.email,
          expiry: expiry.toISOString(),
          now: now.toISOString()
        }
      });
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Error verifying reset token:', error);
    await DevIssue.apiError('auth_api', '/api/auth/verify-reset-token', error, {});
    return res.status(500).json({ error: 'Internal server error' });
  }
}
