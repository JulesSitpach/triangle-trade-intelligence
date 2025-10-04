import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Reactivate a subscription that's set to cancel at period end
 * POST /api/subscription/reactivate
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;

    try {
      // Get user's subscription
      const { data: subscription, error: dbError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbError || !subscription) {
        throw new ApiError('No subscription found', 404);
      }

      if (!subscription.stripe_subscription_id) {
        throw new ApiError('Invalid subscription - missing Stripe ID', 400);
      }

      if (!subscription.cancel_at_period_end) {
        return res.status(200).json({
          success: true,
          message: 'Subscription is already active',
          subscription: {
            id: subscription.id,
            tier: subscription.tier,
            status: subscription.status
          }
        });
      }

      // Reactivate subscription in Stripe
      const reactivatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: false
        }
      );

      // Update database
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      return res.status(200).json({
        success: true,
        message: 'Subscription reactivated successfully',
        subscription: {
          id: subscription.id,
          tier: subscription.tier,
          status: reactivatedSubscription.status,
          cancel_at_period_end: false,
          current_period_end: new Date(reactivatedSubscription.current_period_end * 1000).toISOString()
        }
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw new ApiError('Failed to reactivate subscription', 500, {
        error: error.message
      });
    }
  }
});
