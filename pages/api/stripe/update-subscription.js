/**
 * UPDATE STRIPE SUBSCRIPTION
 * Allows existing subscribers to upgrade/downgrade plans with proration
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TIER_MAPPING = {
  'starter': 'Starter',
  'professional': 'Professional',
  'premium': 'Premium'
};

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const { priceId, tier } = req.body;

    try {
      console.log('🔄 Updating subscription for user:', userId, 'to tier:', tier);

      // Get user's Stripe subscription ID from subscriptions table
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (subError || !subscription?.stripe_subscription_id) {
        console.error('❌ No Stripe subscription found for user:', userId);
        await DevIssue.missingData('update_subscription', 'stripe_subscription_id', {
          userId,
          error: subError?.message
        });
        return res.status(404).json({
          error: 'No active subscription found',
          message: 'You must have an active subscription to change plans'
        });
      }

      const stripeSubscriptionId = subscription.stripe_subscription_id;
      console.log('✅ Found Stripe subscription ID:', stripeSubscriptionId);

      // Get the subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // Update the subscription with the new price (Stripe handles proration automatically)
      const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations', // Automatically prorate the difference
      });

      console.log('✅ Subscription updated in Stripe:', updatedSubscription.id);

      // Update user_profiles table with new tier
      const tierName = TIER_MAPPING[tier] || tier;
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: tierName,
          status: 'active'
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Failed to update user profile:', updateError);
        await DevIssue.apiError('update_subscription', 'user profile update', updateError, {
          userId,
          tier: tierName
        });
        // Don't fail - Stripe subscription is updated successfully
      }

      console.log('✅ User profile updated to tier:', tierName);

      return res.status(200).json({
        success: true,
        subscription: updatedSubscription,
        tier: tierName,
        message: `Successfully switched to ${tierName} plan`
      });

    } catch (error) {
      console.error('❌ Error updating subscription:', error);
      await DevIssue.apiError('update_subscription', '/api/stripe/update-subscription', error, {
        userId,
        tier,
        priceId
      });
      return res.status(500).json({
        error: 'Failed to update subscription',
        message: error.message
      });
    }
  }
});
