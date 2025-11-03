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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TIER_LIMITS = {
  'trial': {
    analyses_per_month: 1,
    max_components: 3,
    display_name: 'Free Trial'
  },
  'free': {
    analyses_per_month: 1,
    max_components: 3,
    display_name: 'Free'
  },
  'starter': {
    analyses_per_month: 10,
    max_components: 10,
    display_name: 'Starter ($99/month)'
  },
  'professional': {
    analyses_per_month: 100,
    max_components: 15,
    display_name: 'Professional ($299/month)'
  },
  'premium': {
    analyses_per_month: 500,  // ✅ FIXED: Was 100, now 500 to match other configs
    max_components: 20,
    display_name: 'Premium ($599/month)'  // ✅ FIXED: Was $499, actual price is $599
  },
  'enterprise': {
    analyses_per_month: 9999, // Unlimited (not available to new users)
    max_components: 50,
    display_name: 'Enterprise'
  }
};

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

      const subscriptionTier = (userProfile?.subscription_tier || 'trial').toLowerCase();
      const tierLimits = TIER_LIMITS[subscriptionTier] || TIER_LIMITS.trial;

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
