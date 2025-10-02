import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Set default payment method
 * POST /api/payment-methods/set-default
 *
 * Body:
 * - payment_method_id: string
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.userId;
    const { payment_method_id } = req.body;

    validateRequiredFields(req.body, ['payment_method_id']);

    try {
      // Get user's Stripe customer ID
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError || !user || !user.stripe_customer_id) {
        throw new ApiError('Customer not found', 404);
      }

      // Update default payment method in Stripe
      await stripe.customers.update(user.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: payment_method_id
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Default payment method updated successfully'
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new ApiError('Failed to set default payment method', 500, {
        error: error.message
      });
    }
  }
});
