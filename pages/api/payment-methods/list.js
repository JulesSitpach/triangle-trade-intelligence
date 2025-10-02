import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user's payment methods
 * GET /api/payment-methods/list
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.userId;

    try {
      // Get user's Stripe customer ID
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new ApiError('User not found', 404);
      }

      if (!user.stripe_customer_id) {
        return res.status(200).json({
          success: true,
          payment_methods: [],
          default_payment_method: null
        });
      }

      // Get payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripe_customer_id,
        type: 'card'
      });

      // Get customer to find default payment method
      const customer = await stripe.customers.retrieve(user.stripe_customer_id);

      // Format payment methods for response
      const formattedMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year
        },
        is_default: customer.invoice_settings?.default_payment_method === pm.id,
        created: pm.created
      }));

      return res.status(200).json({
        success: true,
        payment_methods: formattedMethods,
        default_payment_method: customer.invoice_settings?.default_payment_method || null
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw new ApiError('Failed to fetch payment methods', 500, {
        error: error.message
      });
    }
  }
});
