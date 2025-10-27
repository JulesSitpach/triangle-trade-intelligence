/**
 * Get Current User from Cookie Session
 * Returns authenticated user data if valid session exists
 */

import { parse } from 'cookie';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('CRITICAL: JWT_SECRET environment variable must be configured');
      logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'auth_api',
        message: 'JWT_SECRET environment variable not configured',
        data: { endpoint: '/api/auth/me' }
      });
      return null;
    }

    // Convert data object to string for HMAC verification
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');

    if (sig !== expectedSig) {
      logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'auth_api',
        message: 'Session signature verification failed',
        data: { endpoint: '/api/auth/me' }
      });
      return null;
    }

    // Parse the data string to get the session object (if it's a string)
    const sessionData = typeof data === 'string' ? JSON.parse(data) : data;

    // Check expiration (7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionData.timestamp > sevenDaysMs) {
      logDevIssue({
        type: 'validation_error',
        severity: 'medium',
        component: 'auth_api',
        message: 'Session expired',
        data: {
          endpoint: '/api/auth/me',
          sessionAge: Date.now() - sessionData.timestamp,
          userId: sessionData.userId
        }
      });
      return null;
    }

    return sessionData;
  } catch (error) {
    logDevIssue({
      type: 'api_error',
      severity: 'high',
      component: 'auth_api',
      message: 'Session verification error',
      data: {
        endpoint: '/api/auth/me',
        error: error.message,
        stack: error.stack
      }
    });
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const sessionCookie = cookies.triangle_session;

    // EXPECTED BEHAVIOR: Unauthenticated users don't have session cookies
    // Only log if we have OTHER cookies but not triangle_session (indicates session loss)
    if (!sessionCookie) {
      const hasOtherCookies = Object.keys(cookies).length > 0;

      // Only log as DevIssue if user HAD cookies but lost triangle_session
      // This indicates potential session corruption, not normal unauthenticated access
      if (hasOtherCookies) {
        await DevIssue.missingData('auth_api', 'triangle_session cookie', {
          endpoint: '/api/auth/me',
          otherCookiesPresent: Object.keys(cookies).join(', '),
          suspectedIssue: 'Session cookie lost but other cookies present'
        });
      }

      // Return 401 without logging for normal unauthenticated access
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'No session found'
      });
    }

    const session = verifySession(sessionCookie);

    if (!session) {
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'auth_api',
        message: 'Session verification failed',
        data: { endpoint: '/api/auth/me' }
      });
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Invalid session'
      });
    }

    // Fetch user profile from database to get subscription tier and trial expiration
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, trial_ends_at')
      .eq('user_id', session.userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
      await DevIssue.apiError('auth_api', '/api/auth/me', profileError, {
        userId: session.userId,
        errorCode: profileError.code
      });
    }

    // ✅ DEBUG: Log what we're getting from database
    console.log('📊 [AUTH-ME] Profile lookup for user', session.userId, ':', {
      profile_found: !!profile,
      subscription_tier: profile?.subscription_tier,
      trial_ends_at: profile?.trial_ends_at,
      profile_error: profileError?.message
    });

    // Calculate if trial has expired
    const subscriptionTier = profile?.subscription_tier || 'Trial';
    const trialEndsAt = profile?.trial_ends_at;
    const isTrialExpired = subscriptionTier === 'Trial' && trialEndsAt && new Date(trialEndsAt) < new Date();

    // 🚨 CRITICAL: Prevent browser caching of subscription tier data
    // Without this, tier updates don't appear until manual cache clear
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        isAdmin: session.isAdmin,
        company_name: session.companyName,
        subscription_tier: subscriptionTier,
        trial_ends_at: trialEndsAt,
        trial_expired: isTrialExpired
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    await DevIssue.apiError('auth_api', '/api/auth/me', error, {});
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Server error'
    });
  }
}
