/**
 * Secure Login with httpOnly Cookies + Supabase Auth
 * Properly validates passwords using Supabase Auth
 *
 * Security: Rate limited to 5 attempts per 15 minutes
 */

import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';
import crypto from 'crypto';
import { applyRateLimit, authLimiter } from '../../../lib/security/rateLimiter';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';
import { logger } from '../../../lib/utils/enhanced-production-logger.js';

// Admin client for user profile lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Auth client for password verification
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Secure session signing - NO FALLBACK
// Store stringified data to avoid JSON.stringify order issues
function signSession(sessionData) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logDevIssue({
      type: 'api_error',
      severity: 'critical',
      component: 'auth_api',
      message: 'JWT_SECRET environment variable not configured',
      data: { endpoint: '/api/auth/login' }
    });
    throw new Error('CRITICAL: JWT_SECRET environment variable must be configured');
  }

  // Stringify once and sign the string (not the object)
  const dataString = JSON.stringify(sessionData);
  const signature = crypto.createHmac('sha256', secret)
    .update(dataString)
    .digest('hex');

  // Store the string and signature
  return Buffer.from(JSON.stringify({ data: dataString, sig: signature })).toString('base64');
}

export default async function handler(req, res) {
  // Apply rate limiting FIRST
  try {
    await applyRateLimit(authLimiter)(req, res);
  } catch (error) {
    logger.security('Rate limit exceeded for login attempt', {
      component: 'auth_api',
      endpoint: '/api/auth/login',
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    return res.status(429).json({
      success: false,
      error: 'Too many failed login attempts. Please try again in 15 minutes.'
    });
  }

  if (req.method !== 'POST') {
    await DevIssue.validationError('auth_api', 'HTTP method', req.method, {
      endpoint: '/api/auth/login',
      allowedMethod: 'POST'
    });
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    await DevIssue.missingData('auth_api', 'email or password', {
      endpoint: '/api/auth/login',
      hasEmail: !!email,
      hasPassword: !!password
    });
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    logger.info('Login attempt', { component: 'auth_api', email });
    const startTime = Date.now();

    // Step 1: Verify password using Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    // Step 2: Always query user profile (even if auth failed) to prevent timing attacks
    let user = null;
    let profileError = null;

    if (!authError && authData.user) {
      const profileResult = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, company_name, subscription_tier, status, full_name, is_admin, role')
        .eq('email', email.toLowerCase())
        .single();
      user = profileResult.data;
      profileError = profileResult.error;
    }

    // ✅ TIMING ATTACK PREVENTION: Ensure consistent response time
    // All failed login attempts should take the same amount of time
    const elapsed = Date.now() - startTime;
    const minDelay = 200; // Minimum 200ms response time
    if (elapsed < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
    }

    // Now check results and return appropriate error
    if (authError || !authData.user) {
      logger.security('Failed login attempt - invalid credentials', {
        component: 'auth_api',
        endpoint: '/api/auth/login',
        email,
        errorMessage: authError?.message
      });
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    logger.info('Password verified', { component: 'auth_api', email });

    if (profileError || !user) {
      logger.error('User profile not found after successful auth', {
        component: 'auth_api',
        endpoint: '/api/auth/login',
        email,
        authUserId: authData.user.id,
        profileError: profileError?.message
      });
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Note: last_login tracking removed (column doesn't exist in user_profiles)

    // Create session data
    const sessionData = {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin === true || user.role === 'admin',
      companyName: user.company_name,
      timestamp: Date.now()
    };

    // Sign and encode session
    const sessionToken = signSession(sessionData);

    // Set httpOnly cookie (secure in production!)
    res.setHeader('Set-Cookie', serialize('triangle_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    }));

    logger.sales('Successful login', {
      component: 'auth_api',
      email,
      isAdmin: sessionData.isAdmin,
      subscription_tier: user.subscription_tier
    });

    // Return user data
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        subscription_tier: user.subscription_tier,
        status: user.status,
        full_name: user.full_name,
        isAdmin: sessionData.isAdmin
      }
    });

  } catch (error) {
    logger.error('Login error', {
      component: 'auth_api',
      endpoint: '/api/auth/login',
      email: req.body?.email,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
}
