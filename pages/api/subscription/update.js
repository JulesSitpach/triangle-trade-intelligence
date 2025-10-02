import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe, STRIPE_PRICES } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

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
    const userId = req.user.userId;
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

      // Update database
      await supabase
        .from('subscriptions')
        .update({
          tier: tier,
          billing_period: newBillingPeriod,
          status: updatedSubscription.status,
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
