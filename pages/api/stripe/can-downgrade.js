/**
 * GET /api/stripe/can-downgrade
 *
 * Check if user can downgrade their subscription
 * Returns lock status and remaining lock period
 *
 * Prevents subscription gaming with commitment locks:
 * - Unlimited: 60-day lock
 * - Professional: 30-day lock
 * - Starter: No lock
 */

import { createClient } from '@supabase/supabase-js';
import { protectedApiHandler } from '../../../lib/api/apiHandler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // Get current subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('tier_name, locked_until, current_period_end')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        // PGRST116 = not found
        console.error('[DOWNGRADE-CHECK] Error fetching subscription:', subError);
        return res.status(500).json({
          error: 'Failed to check downgrade eligibility',
          details: subError.message
        });
      }

      if (!subscription) {
        // No subscription found - user can downgrade (no restriction)
        return res.status(200).json({
          canDowngrade: true,
          reason: 'No active subscription',
          locked_until: null,
          days_remaining: 0,
          tier: null
        });
      }

      // Check if lock period has expired
      const now = new Date();
      const lockedUntil = subscription.locked_until ? new Date(subscription.locked_until) : null;
      const canDowngrade = !lockedUntil || now >= lockedUntil;

      let daysRemaining = 0;
      if (lockedUntil && now < lockedUntil) {
        daysRemaining = Math.ceil((lockedUntil - now) / (1000 * 60 * 60 * 24));
      }

      if (canDowngrade) {
        return res.status(200).json({
          canDowngrade: true,
          reason: 'Commitment period has ended',
          locked_until: null,
          days_remaining: 0,
          tier: subscription.tier_name,
          message: `You can now modify your ${subscription.tier_name} subscription`
        });
      } else {
        return res.status(200).json({
          canDowngrade: false,
          reason: `${subscription.tier_name} plans require ${subscription.tier_name === 'Unlimited' ? '60' : '30'}-day commitment`,
          locked_until: subscription.locked_until,
          days_remaining: daysRemaining,
          tier: subscription.tier_name,
          message: `You can modify your subscription on ${lockedUntil.toLocaleDateString()} (${daysRemaining} days remaining)`
        });
      }

    } catch (error) {
      console.error('[DOWNGRADE-CHECK] Exception:', error);
      return res.status(500).json({
        error: 'Failed to check downgrade eligibility',
        message: error.message
      });
    }
  }
});
