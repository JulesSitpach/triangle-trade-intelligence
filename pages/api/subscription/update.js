import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe, STRIPE_PRICES } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { DevIssue } from '../../../lib/utils/logDevIssue';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Update (upgrade/downgrade) user subscription
 * POST /api/subscription/update
 *
 * Body:
 * - tier: 'professional' | 'business' | 'enterprise'
 * - billing_period: 'monthly' | 'annual' (optional)
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const { tier, billing_period } = req.body;

    // Validate required fields
    validateRequiredFields(req.body, ['tier']);

    // Validate tier
    if (!['professional', 'business', 'enterprise'].includes(tier)) {
      throw new ApiError('Invalid subscription tier', 400, {
        field: 'tier',
        provided: tier
      });
    }

    // Validate billing period if provided
    if (billing_period && !['monthly', 'annual'].includes(billing_period)) {
      throw new ApiError('Invalid billing period', 400, {
        field: 'billing_period',
        provided: billing_period
      });
    }

    try {
      // Get user's current subscription
      const { data: subscription, error: dbError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbError || !subscription) {
        throw new ApiError('No active subscription found', 404);
      }

      if (!subscription.stripe_subscription_id) {
        throw new ApiError('Invalid subscription - missing Stripe ID', 400);
      }

      // 🔒 COMMITMENT PERIOD ENFORCEMENT - Prevent downgrade gaming
      // Check if this is a downgrade and if user is in lock period
      const tierOrder = {
        'starter': 1,
        'professional': 2,
        'unlimited': 3,
        'premium': 3 // Alias for unlimited
      };

      const currentTierLevel = tierOrder[subscription.tier_id?.toLowerCase()] || 0;
      const newTierLevel = tierOrder[tier.toLowerCase()] || 0;
      const isDowngrade = newTierLevel < currentTierLevel;

      if (isDowngrade && subscription.locked_until) {
        const now = new Date();
        const lockedUntil = new Date(subscription.locked_until);

        if (now < lockedUntil) {
          // User is trying to downgrade during lock period
          const daysRemaining = Math.ceil((lockedUntil - now) / (1000 * 60 * 60 * 24));
          const unlockDate = lockedUntil.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          // 🚨 Security event: Log attempt to bypass commitment period
          await DevIssue.securityEvent('subscription_update', 'commitment_period_bypass_attempt', {
            userId,
            currentTier: subscription.tier_id,
            attemptedTier: tier,
            daysRemaining,
            lockedUntil: subscription.locked_until,
            message: 'User attempted to downgrade during commitment lock period'
          });

          throw new ApiError('Subscription locked during commitment period', 403, {
            tier: subscription.tier_name || subscription.tier_id,
            locked_until: subscription.locked_until,
            days_remaining: daysRemaining,
            unlock_date: unlockDate,
            message: `Your ${subscription.tier_name || subscription.tier_id} plan is locked until ${unlockDate} (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining)`,
            hint: 'Commitment periods ensure stable compliance workflows. Contact support if you need to make urgent changes.'
          });
        }
      }

      // Determine new billing period (use current if not specified)
      const newBillingPeriod = billing_period || subscription.billing_period || 'monthly';

      // Get new price ID
      const newPriceId = STRIPE_PRICES[tier]?.[newBillingPeriod];

      if (!newPriceId) {
        throw new ApiError('Subscription plan not available', 400, {
          tier,
          billing_period: newBillingPeriod
        });
      }

      // Get current Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Get the subscription item ID
      const subscriptionItemId = stripeSubscription.items.data[0]?.id;

      if (!subscriptionItemId) {
        throw new ApiError('Subscription item not found', 400);
      }

      // Update subscription in Stripe
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          items: [
            {
              id: subscriptionItemId,
              price: newPriceId
            }
          ],
          proration_behavior: 'create_prorations', // Prorate the charges
          metadata: {
            tier: tier,
            billing_period: newBillingPeriod
          }
        }
      );

      // 🔒 COMMITMENT PERIOD: Reset lock period for upgrades
      // When upgrading, user commits to NEW tier's lock period
      const isUpgrade = newTierLevel > currentTierLevel;
      let lockedUntil = subscription.locked_until; // Keep existing lock for same-tier changes

      if (isUpgrade) {
        // Reset lock period based on new tier
        const lockDays = {
          'unlimited': 60,
          'premium': 60,
          'professional': 30,
          'starter': 0
        }[tier.toLowerCase()] || 0;

        if (lockDays > 0) {
          const newLockDate = new Date();
          newLockDate.setDate(newLockDate.getDate() + lockDays);
          lockedUntil = newLockDate.toISOString();
          console.log(`🔒 Upgrade detected: Resetting lock period to ${lockDays} days (until ${newLockDate.toDateString()})`);
        } else {
          lockedUntil = null; // Starter has no lock
        }
      }

      // Update database
      await supabase
        .from('subscriptions')
        .update({
          tier: tier,
          tier_id: tier,
          billing_period: newBillingPeriod,
          status: updatedSubscription.status,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      return res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        subscription: {
          id: subscription.id,
          tier: tier,
          billing_period: newBillingPeriod,
          status: updatedSubscription.status,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new ApiError('Failed to update subscription', 500, {
        error: error.message
      });
    }
  }
});
