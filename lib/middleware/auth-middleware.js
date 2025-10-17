/**
 * Authentication Middleware for Triangle Trade Intelligence
 * Uses httpOnly cookie-based sessions
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { parse } from 'cookie';
import { DevIssue } from '../utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify and decode session cookie
 */
function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    // Decode base64
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    // Verify signature
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(data) // data is already a string from login.js
      .digest('hex');

    if (sig !== expectedSig) {
      console.log('❌ Invalid session signature');
      return null;
    }

    // Check expiration (7 days from timestamp)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > sevenDaysMs) {
      console.log('❌ Session expired');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Wrapper for API routes requiring authentication
 */
export function withAuth(handler) {
  return async (req, res) => {
    try {
      // Read cookie
      const cookies = parse(req.headers.cookie || '');
      const sessionCookie = cookies.triangle_session;

      if (!sessionCookie) {
        DevIssue.validationError('auth_middleware', 'session_cookie', 'missing', {
          endpoint: req.url,
          method: req.method,
          hasHeaders: !!req.headers.cookie
        });
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Verify session
      const session = verifySession(sessionCookie);

      if (!session) {
        DevIssue.validationError('auth_middleware', 'session_verification', 'failed', {
          endpoint: req.url,
          method: req.method,
          reason: 'Invalid signature or expired session'
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session'
        });
      }

      // Attach user to request
      req.user = {
        id: session.userId,
        email: session.email,
        role: session.isAdmin ? 'admin' : 'user',
        isAdmin: session.isAdmin,
        companyName: session.companyName
      };

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      DevIssue.apiError('auth_middleware', 'withAuth', error, {
        endpoint: req.url,
        method: req.method
      });
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  };
}

/**
 * Wrapper for API routes requiring admin access
 */
export function withAdmin(handler) {
  return async (req, res) => {
    try {
      // Read cookie
      const cookies = parse(req.headers.cookie || '');
      const sessionCookie = cookies.triangle_session;

      if (!sessionCookie) {
        DevIssue.validationError('admin_middleware', 'session_cookie', 'missing', {
          endpoint: req.url,
          method: req.method,
          hasHeaders: !!req.headers.cookie
        });
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Verify session
      const session = verifySession(sessionCookie);

      if (!session) {
        DevIssue.validationError('admin_middleware', 'session_verification', 'failed', {
          endpoint: req.url,
          method: req.method,
          reason: 'Invalid signature or expired session'
        });
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session'
        });
      }

      if (!session.isAdmin) {
        DevIssue.validationError('admin_middleware', 'admin_access', 'denied', {
          endpoint: req.url,
          method: req.method,
          userId: session.userId,
          isAdmin: session.isAdmin
        });
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      req.user = {
        id: session.userId,
        email: session.email,
        role: 'admin',
        isAdmin: true,
        companyName: session.companyName
      };

      return handler(req, res);
    } catch (error) {
      console.error('Admin middleware error:', error);
      DevIssue.apiError('admin_middleware', 'withAdmin', error, {
        endpoint: req.url,
        method: req.method
      });
      return res.status(500).json({
        success: false,
        error: 'Authorization error'
      });
    }
  };
}

/**
 * Check user's subscription status and limits
 */
export async function checkSubscriptionLimits(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier, trial_ends_at, subscription_ends_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {
        hasAccess: false,
        reason: 'No subscription found'
      };
    }

    // Check if trial expired
    if (profile.subscription_tier === 'trial') {
      const trialExpired = new Date() > new Date(profile.trial_ends_at);
      if (trialExpired) {
        return {
          hasAccess: false,
          reason: 'Trial period expired',
          upgradeRequired: true
        };
      }
    }

    return {
      hasAccess: true,
      subscription: profile
    };
  } catch (error) {
    console.error('Subscription check error:', error);
    return {
      hasAccess: false,
      reason: 'Error checking subscription'
    };
  }
}

/**
 * Track API usage for rate limiting
 */
export async function trackApiUsage(userId, endpoint, method = 'GET') {
  try {
    // Simple rate limiting check - last 1 minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    const { data: recentUsage, error: countError } = await supabase
      .from('api_usage_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', oneMinuteAgo);

    if (!countError && recentUsage && recentUsage.length > 10) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded (10 requests per minute)'
      };
    }

    // Log the usage
    const { error: insertError } = await supabase
      .from('api_usage_logs')
      .insert({
        user_id: userId,
        endpoint,
        method,
        status_code: 200,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error tracking API usage:', insertError);
    }

    return { allowed: true };
  } catch (error) {
    console.error('API tracking error:', error);
    return { allowed: true }; // Allow on error to not block users
  }
}

/**
 * Get user's role and permissions
 */
export async function getUserPermissions(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('is_admin, role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { role: 'user', permissions: [] };
    }

    const isAdmin = profile.is_admin === true || profile.role === 'admin';

    const permissions = isAdmin ? [
      'admin.dashboard.view',
      'admin.users.manage',
      'admin.settings.modify',
      'admin.analytics.view',
      'admin.notifications.send',
      'api.unlimited'
    ] : [
      'user.dashboard.view',
      'user.workflow.create',
      'user.certificate.generate',
      'api.limited'
    ];

    return {
      role: isAdmin ? 'admin' : 'user',
      permissions
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return { role: 'user', permissions: [] };
  }
}
