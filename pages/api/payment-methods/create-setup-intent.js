import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { stripe, getOrCreateStripeCustomer } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create setup intent for adding payment method
 * POST /api/payment-methods/create-setup-intent
 *
 * Returns client_secret for Stripe Elements
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;

    try {
      // Get user from database
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new ApiError('User not found', 404);
      }

      // Get or create Stripe customer
      const customerId = await getOrCreateStripeCustomer(user, supabase);

      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
          user_id: userId
        }
      });

      return res.status(200).json({
        success: true,
        client_secret: setupIntent.client_secret,
        setup_intent_id: setupIntent.id
      });
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw new ApiError('Failed to create setup intent', 500, {
        error: error.message
      });
    }
  }
});
