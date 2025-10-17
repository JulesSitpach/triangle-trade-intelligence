import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    await DevIssue.validationError('auth_api', 'HTTP method', req.method, {
      endpoint: '/api/auth/reset-password',
      allowedMethod: 'POST'
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, password } = req.body;

  if (!token || !password) {
    await DevIssue.missingData('auth_api', 'token or password', {
      endpoint: '/api/auth/reset-password',
      hasToken: !!token,
      hasPassword: !!password
    });
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (password.length < 8) {
    await DevIssue.validationError('auth_api', 'password length', password.length, {
      endpoint: '/api/auth/reset-password',
      minLength: 8
    });
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
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
        message: 'Invalid password reset token',
        data: {
          endpoint: '/api/auth/reset-password',
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
        message: 'Expired password reset token',
        data: {
          endpoint: '/api/auth/reset-password',
          userId: user.id,
          email: user.email,
          expiry: expiry.toISOString(),
          now: now.toISOString()
        }
      });
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      await DevIssue.apiError('auth_api', '/api/auth/reset-password', updateError, {
        userId: user.id,
        email: user.email
      });
      return res.status(500).json({ error: 'Failed to update password' });
    }

    console.log('Password successfully reset for user:', user.email);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    await DevIssue.apiError('auth_api', '/api/auth/reset-password', error, {});
    return res.status(500).json({ error: 'Internal server error' });
  }
}
