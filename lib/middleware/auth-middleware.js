/**
 * Authentication Middleware for Triangle Intelligence
 * Handles admin vs user permissions and API route protection
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if user is authenticated
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Attach user to request
    req.user = user;

    if (next) {
      return next();
    }

    return { user };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Check if user has admin role
 */
export async function requireAdmin(req, res, next) {
  try {
    // First check authentication
    const authResult = await requireAuth(req, res);

    if (!authResult?.user) {
      return; // Response already sent by requireAuth
    }

    const user = authResult.user;

    // Check admin role in user metadata
    const isAdmin = user.app_metadata?.role === 'admin' ||
                    user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      // Also check in user_profiles table for admin flag
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    req.user = user;
    req.isAdmin = true;

    if (next) {
      return next();
    }

    return { user, isAdmin: true };
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ error: 'Authorization error' });
  }
}

/**
 * Wrapper for API routes requiring authentication
 */
export function withAuth(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      req.user = user;
      return handler(req, res);
    } catch (error) {
      console.error('Auth wrapper error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}

/**
 * Wrapper for API routes requiring admin access
 */
export function withAdmin(handler) {
  return async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      // Check admin role
      const isAdmin = user.app_metadata?.role === 'admin' ||
                      user.user_metadata?.role === 'admin';

      if (!isAdmin) {
        // Check database for admin flag
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!profile?.is_admin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      }

      req.user = user;
      req.isAdmin = true;
      return handler(req, res);
    } catch (error) {
      console.error('Admin wrapper error:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
}

/**
 * Check user's subscription status and limits
 */
export async function checkSubscriptionLimits(userId) {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return {
        hasAccess: false,
        reason: 'No active subscription'
      };
    }

    // Check if trial expired
    if (subscription.is_trial) {
      const trialExpired = new Date() > new Date(subscription.trial_expires_at);
      if (trialExpired) {
        return {
          hasAccess: false,
          reason: 'Trial period expired',
          upgradeRequired: true
        };
      }
    }

    // Check usage limits
    const usageExceeded = subscription.used_classifications >= subscription.included_classifications;
    if (usageExceeded) {
      return {
        hasAccess: false,
        reason: 'Monthly classification limit reached',
        upgradeRequired: true,
        usage: {
          used: subscription.used_classifications,
          included: subscription.included_classifications
        }
      };
    }

    return {
      hasAccess: true,
      subscription,
      remaining: subscription.included_classifications - subscription.used_classifications
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
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return { role: 'user', permissions: [] };
    }

    const isAdmin = user.app_metadata?.role === 'admin';

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