/**
 * CHECK STRIPE SUBSCRIPTION STATUS
 * Returns whether user has an active Stripe subscription
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // Check if user has a Stripe subscription record
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id, status')
        .eq('user_id', userId)
        .single();

      const hasSubscription = !error && !!subscription?.stripe_subscription_id;

      return res.status(200).json({
        hasSubscription,
        status: subscription?.status || null
      });

    } catch (error) {
      console.error('Error checking subscription:', error);
      return res.status(200).json({
        hasSubscription: false,
        status: null
      });
    }
  }
});
