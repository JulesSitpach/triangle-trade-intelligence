/**
 * POST /api/stripe/validate-downgrade
 *
 * Validate whether a user can downgrade their subscription
 * Returns error if within lock period, allowing frontend to show blocked UI
 *
 * Subscription lock rules:
 * - Unlimited (Premium): 60-day lock
 * - Professional: 30-day lock
 * - Starter: No lock
 * - Trial: No lock
 */

import { createClient } from '@supabase/supabase-js';
import { protectedApiHandler } from '../../lib/api/apiHandler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const { newTier } = req.body;

    // Validate downgrade tier is provided
    if (!newTier) {
      return res.status(400).json({
        error: 'Missing newTier parameter',
        hint: 'Specify which tier you want to downgrade to'
      });
    }

    try {
      // Get current subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('tier_name, locked_until, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        // PGRST116 = not found
        console.error('[DOWNGRADE-VALIDATE] Error fetching subscription:', subError);
        return res.status(500).json({
          error: 'Failed to validate downgrade',
          details: subError.message
        });
      }

      if (!subscription) {
        // No subscription - allow downgrade
        return res.status(200).json({
          allowed: true,
          message: 'No active subscription to downgrade'
        });
      }

      // Determine if this is actually a downgrade
      const tierOrder = {
        'Trial': 0,
        'Starter': 1,
        'Professional': 2,
        'Premium': 3
      };

      const currentTierLevel = tierOrder[subscription.tier_name] || 0;
      const newTierLevel = tierOrder[newTier] || 0;
      const isDowngrade = newTierLevel < currentTierLevel;

      // If upgrading, allow it (no lock applies to upgrades)
      if (!isDowngrade) {
        return res.status(200).json({
          allowed: true,
          message: 'Upgrades are always allowed'
        });
      }

      // Check if lock period has expired
      const now = new Date();
      const lockedUntil = subscription.locked_until ? new Date(subscription.locked_until) : null;

      if (!lockedUntil || now >= lockedUntil) {
        // Lock period has expired or never existed
        return res.status(200).json({
          allowed: true,
          message: 'Lock period has ended. You can now downgrade.'
        });
      }

      // User is in lock period and trying to downgrade
      const daysRemaining = Math.ceil((lockedUntil - now) / (1000 * 60 * 60 * 24));
      const unlockDate = lockedUntil.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return res.status(403).json({
        allowed: false,
        error: 'Subscription locked during commitment period',
        tier: subscription.tier_name,
        locked_until: subscription.locked_until,
        days_remaining: daysRemaining,
        unlock_date: unlockDate,
        message: `Your ${subscription.tier_name} plan is locked until ${unlockDate} (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining)`,
        hint: 'Commitment periods ensure stable compliance workflows. Contact support if you need to make urgent changes.'
      });

    } catch (error) {
      console.error('[DOWNGRADE-VALIDATE] Exception:', error);
      return res.status(500).json({
        error: 'Failed to validate downgrade',
        message: error.message
      });
    }
  }
});
