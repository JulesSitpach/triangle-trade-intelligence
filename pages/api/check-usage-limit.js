/**
 * Check Usage Limit API
 *
 * Pre-flight check endpoint for UI to validate if user can start a workflow
 * Returns usage stats and component limits without incrementing counters
 *
 * Called by:
 * - Workflow start button (disable if limit reached)
 * - Component add button (prevent exceeding tier limit)
 * - Dashboard usage widget (show current stats)
 */

import { protectedApiHandler } from '../../lib/api/apiHandler.js';
import { createClient } from '@supabase/supabase-js';
import { checkAnalysisLimit } from '../../lib/services/usage-tracking-service.js';
import { getTierLimits } from '../../config/subscription-tier-limits.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // Get user's subscription tier
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_tier, trial_end_date')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('[CHECK-USAGE] Error fetching user profile:', profileError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch user profile'
        });
      }

      // ✅ Normalize tier name to match centralized config (capitalized)
      const subscriptionTier = userProfile?.subscription_tier || 'Trial';
      const normalizedTier = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1).toLowerCase();
      const tierLimits = getTierLimits(normalizedTier);

      // Check current usage
      const usageStatus = await checkAnalysisLimit(userId, subscriptionTier);

      // Check trial expiration (if applicable)
      let trialExpired = false;
      let daysRemaining = null;

      if (subscriptionTier === 'trial' && userProfile.trial_end_date) {
        const trialEnd = new Date(userProfile.trial_end_date);
        const now = new Date();
        trialExpired = now > trialEnd;

        if (!trialExpired) {
          const msRemaining = trialEnd - now;
          daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
        }
      }

      // Determine if user can start workflow
      const canStartWorkflow = !usageStatus.limitReached && !trialExpired;

      return res.status(200).json({
        success: true,
        can_start_workflow: canStartWorkflow,
        usage: {
          current_count: usageStatus.currentCount,
          limit: usageStatus.tierLimit,
          remaining: usageStatus.remaining,
          limit_reached: usageStatus.limitReached
        },
        limits: {
          analyses_per_month: tierLimits.analyses_per_month,
          max_components: tierLimits.max_components
        },
        tier: {
          name: subscriptionTier,
          display_name: tierLimits.display_name
        },
        trial: {
          is_trial: subscriptionTier === 'trial',
          expired: trialExpired,
          days_remaining: daysRemaining
        },
        upgrade_required: usageStatus.limitReached || trialExpired,
        upgrade_url: '/pricing'
      });

    } catch (error) {
      console.error('[CHECK-USAGE] Error checking usage limit:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check usage limit',
        message: error.message
      });
    }
  }
});
