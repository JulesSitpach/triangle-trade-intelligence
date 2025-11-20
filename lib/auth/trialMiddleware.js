import { ApiError } from '../api/errorHandler';
import { getSupabaseServiceClient } from '../database/supabase-client.js';

// ✅ FIX: Use singleton service client to prevent multiple GoTrueClient instances
const supabase = getSupabaseServiceClient();

/**
 * Check if user has active subscription or valid trial
 * @param {string} userId - User ID from user_profiles table
 * @returns {Promise<Object>} Access status with type (subscription|trial|expired)
 */
export async function checkTrialStatus(userId) {
  const { data: user, error } = await supabase
    .from('user_profiles')
    .select('subscription_tier, status, trial_end_date, trial_used')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Trial status check error:', error);
    throw new ApiError('Failed to check user status', 500);
  }

  // If user has active subscription, they have access
  if (user.status === 'active' && ['professional', 'business', 'enterprise'].includes(user.subscription_tier)) {
    return { hasAccess: true, type: 'subscription', tier: user.subscription_tier };
  }

  // Check trial status
  if (!user.trial_end_date) {
    // User has no trial set (shouldn't happen with migration, but handle gracefully)
    return { hasAccess: false, type: 'no_trial' };
  }

  const now = new Date();
  const trialEnd = new Date(user.trial_end_date);

  if (!user.trial_used && now <= trialEnd) {
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    return {
      hasAccess: true,
      type: 'trial',
      daysRemaining,
      trialEndDate: user.trial_end_date
    };
  }

  // Trial expired and no subscription
  return { hasAccess: false, type: 'expired', trialEndDate: user.trial_end_date };
}

/**
 * Middleware to protect routes that require subscription or trial
 * Wraps an API handler to check trial/subscription status before execution
 *
 * @param {Function} handler - API route handler function
 * @returns {Function} Wrapped handler with trial checking
 *
 * @example
 * export default protectedApiHandler({
 *   GET: requireActiveAccess(async (req, res) => {
 *     // req.accessStatus will contain trial/subscription info
 *     return res.json({ data: '...' });
 *   })
 * });
 */
export function requireActiveAccess(handler) {
  return async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    try {
      const accessStatus = await checkTrialStatus(userId);

      if (!accessStatus.hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Trial expired. Please subscribe to continue.',
          requiresUpgrade: true,
          trialEndDate: accessStatus.trialEndDate
        });
      }

      // Attach trial info to request for handler to use
      req.accessStatus = accessStatus;

      return handler(req, res);
    } catch (error) {
      console.error('Access check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify access'
      });
    }
  };
}
