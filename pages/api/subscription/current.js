import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get current user subscription
 * GET /api/subscription/current
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.userId;

    try {
      // Get subscription from database
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new ApiError('Database error', 500, { error: error.message });
      }

      if (!subscription) {
        return res.status(200).json({
          success: true,
          subscription: null,
          message: 'No active subscription'
        });
      }

      // Get latest subscription details from Stripe
      let stripeSubscription = null;
      if (subscription.stripe_subscription_id) {
        try {
          stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripe_subscription_id
          );
        } catch (stripeError) {
          console.error('Error retrieving Stripe subscription:', stripeError);
        }
      }

      return res.status(200).json({
        success: true,
        subscription: {
          id: subscription.id,
          tier: subscription.tier,
          billing_period: subscription.billing_period,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          canceled_at: subscription.canceled_at,
          stripe_subscription_id: subscription.stripe_subscription_id,
          created_at: subscription.created_at,
          // Include Stripe data if available
          stripe: stripeSubscription ? {
            latest_invoice: stripeSubscription.latest_invoice,
            default_payment_method: stripeSubscription.default_payment_method,
            items: stripeSubscription.items?.data
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw new ApiError('Failed to get subscription', 500, {
        error: error.message
      });
    }
  }
});
