/**
 * SUBSCRIPTION GUARD MIDDLEWARE
 *
 * Centralized subscription limit enforcement for ALL protected endpoints.
 *
 * WHEN TO USE:
 * - Any endpoint that creates new workflows/analyses
 * - Any endpoint that generates certificates/downloads
 * - Any endpoint that sends emails/alerts (paid feature)
 *
 * HOW IT WORKS:
 * 1. Checks user's current usage vs subscription tier limit
 * 2. Returns 429 with upgrade message if limit exceeded
 * 3. Blocks ALL actions for over-limit users (no exceptions)
 *
 * WHAT IT BLOCKS:
 * - Trial users: After 1st workflow completion
 * - Starter users: After 15 analyses/month
 * - Professional users: After 100 analyses/month
 * - Premium users: After 500 analyses/month
 */

import { createClient } from '@supabase/supabase-js';
import { ANALYSIS_LIMITS } from '../../config/subscription-tier-limits.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if user has exceeded their subscription limit
 *
 * @param {string} userId - User ID from auth token
 * @returns {Object} { allowed: boolean, limitReached: boolean, usage: object, error?: string }
 */
export async function checkSubscriptionLimit(userId) {
  try {
    // Get user profile with subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, analyses_this_month')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[SUBSCRIPTION-GUARD] Profile lookup failed:', profileError);
      return {
        allowed: false,
        limitReached: false,
        error: 'User profile not found'
      };
    }

    // ✅ Centralized tier limits (from config/subscription-tier-limits.js)
    const tier = profile.subscription_tier || 'Trial';
    const limit = ANALYSIS_LIMITS[tier] || ANALYSIS_LIMITS['Trial'];
    const used = profile.analyses_this_month || 0;
    const remaining = Math.max(0, limit - used);
    const percentage = Math.round((used / limit) * 100);

    // ✅ CRITICAL: Block only when OVER limit (allow equal)
    // Trial: Allow count=1, block at count=2
    // Starter: Allow count=15, block at count=16
    const limitReached = used >= limit;

    console.log('[SUBSCRIPTION-GUARD] Usage check:', {
      userId,
      tier,
      used,
      limit,
      remaining,
      percentage,
      limitReached
    });

    return {
      allowed: !limitReached,
      limitReached,
      usage: {
        tier,
        used,
        limit,
        remaining,
        percentage,
        is_unlimited: false
      }
    };

  } catch (error) {
    console.error('[SUBSCRIPTION-GUARD] Unexpected error:', error);
    return {
      allowed: false,
      limitReached: false,
      error: 'Subscription check failed'
    };
  }
}

/**
 * Middleware wrapper for API endpoints that need subscription protection
 *
 * Usage in API endpoint:
 * ```javascript
 * import { requireSubscription } from '@/lib/middleware/subscription-guard';
 *
 * export default async function handler(req, res) {
 *   const limitCheck = await requireSubscription(req, res);
 *   if (!limitCheck.allowed) return; // Response already sent
 *
 *   // Proceed with protected action...
 * }
 * ```
 */
export async function requireSubscription(req, res) {
  // Extract user ID from Authorization header (JWT token)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return { allowed: false };
  }

  // Decode JWT to get user ID
  const token = authHeader.replace('Bearer ', '');
  let userId;

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId || decoded.id;
  } catch (jwtError) {
    console.error('[SUBSCRIPTION-GUARD] JWT decode failed:', jwtError);
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
    return { allowed: false };
  }

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'User ID not found in token'
    });
    return { allowed: false };
  }

  // Check subscription limit
  const limitCheck = await checkSubscriptionLimit(userId);

  if (!limitCheck.allowed) {
    const tier = limitCheck.usage?.tier || 'Trial';
    const used = limitCheck.usage?.used || 0;
    const limit = limitCheck.usage?.limit || 1;

    console.log('[SUBSCRIPTION-GUARD] 🚫 Access blocked:', {
      userId,
      tier,
      used,
      limit,
      reason: limitCheck.error || 'Limit reached'
    });

    res.status(429).json({
      success: false,
      error: 'Monthly analysis limit reached',
      errorCode: 'LIMIT_REACHED',
      details: {
        tier,
        used,
        limit,
        message: `You've used ${used} of ${limit} analyses this month. Upgrade to continue.`,
        upgrade_url: '/pricing'
      },
      actions: [
        {
          label: 'Upgrade Now',
          url: '/pricing',
          primary: true
        },
        {
          label: 'View Dashboard',
          url: '/dashboard',
          primary: false
        }
      ]
    });

    return { allowed: false, limitCheck };
  }

  console.log('[SUBSCRIPTION-GUARD] ✅ Access allowed:', {
    userId,
    tier: limitCheck.usage.tier,
    used: limitCheck.usage.used,
    limit: limitCheck.usage.limit
  });

  return { allowed: true, limitCheck };
}

/**
 * Lightweight check - just returns boolean, doesn't send response
 * Use this when you want to check limit without blocking the response
 */
export async function isOverLimit(userId) {
  const check = await checkSubscriptionLimit(userId);
  return check.limitReached;
}
