import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Cancel user subscription
 * POST /api/subscription/cancel
 *
 * Body:
 * - immediate: boolean (optional, default false - cancel at period end)
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.userId;
    const { immediate = false } = req.body;

    try {
      // Get user's subscription
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

      // Cancel subscription in Stripe
      let canceledSubscription;
      if (immediate) {
        // Cancel immediately
        canceledSubscription = await stripe.subscriptions.cancel(
          subscription.stripe_subscription_id
        );
      } else {
        // Cancel at period end
        canceledSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: true
          }
        );
      }

      // Update database
      const updateData = {
        cancel_at_period_end: !immediate,
        updated_at: new Date().toISOString()
      };

      if (immediate) {
        updateData.status = 'canceled';
        updateData.canceled_at = new Date().toISOString();
      }

      await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscription.id);

      return res.status(200).json({
        success: true,
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will cancel at the end of the billing period',
        subscription: {
          id: subscription.id,
          tier: subscription.tier,
          status: canceledSubscription.status,
          cancel_at_period_end: canceledSubscription.cancel_at_period_end,
          current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString()
        }
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new ApiError('Failed to cancel subscription', 500, {
        error: error.message
      });
    }
  }
});
