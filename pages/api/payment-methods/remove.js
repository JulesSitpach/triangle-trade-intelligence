import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Remove payment method
 * POST /api/payment-methods/remove
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

      // Get payment method to verify ownership
      const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

      if (paymentMethod.customer !== user.stripe_customer_id) {
        throw new ApiError('Payment method does not belong to this customer', 403);
      }

      // Detach payment method from customer
      await stripe.paymentMethods.detach(payment_method_id);

      return res.status(200).json({
        success: true,
        message: 'Payment method removed successfully'
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new ApiError('Failed to remove payment method', 500, {
        error: error.message
      });
    }
  }
});
