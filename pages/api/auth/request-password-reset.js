import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    await DevIssue.validationError('auth_api', 'HTTP method', req.method, {
      endpoint: '/api/auth/request-password-reset',
      allowedMethod: 'POST'
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    await DevIssue.missingData('auth_api', 'email', {
      endpoint: '/api/auth/request-password-reset'
    });
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success even if user doesn't exist (security best practice)
    if (userError || !user) {
      console.log('User not found, but returning success for security');
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a reset link has been sent'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error storing reset token:', updateError);
      await DevIssue.apiError('auth_api', '/api/auth/request-password-reset', updateError, {
        userId: user.id,
        email: user.email
      });
      return res.status(500).json({ error: 'Failed to generate reset link' });
    }

    // Generate reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    // For now, we'll log it (in production, use SendGrid/Resend/etc.)
    console.log('='.repeat(80));
    console.log('PASSWORD RESET REQUEST');
    console.log('='.repeat(80));
    console.log('User:', user.email);
    console.log('Name:', user.full_name);
    console.log('Reset Link:', resetLink);
    console.log('Expires:', resetTokenExpiry.toISOString());
    console.log('='.repeat(80));

    // In production, send actual email here
    // await sendResetEmail(user.email, user.full_name, resetLink);

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent',
      // Remove these in production - only for development
      ...(process.env.NODE_ENV === 'development' && {
        resetLink,
        token: resetToken
      })
    });

  } catch (error) {
    console.error('Error in password reset:', error);
    await DevIssue.apiError('auth_api', '/api/auth/request-password-reset', error, {
      email: req.body?.email
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
