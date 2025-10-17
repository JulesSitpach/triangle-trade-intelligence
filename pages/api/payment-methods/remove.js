import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue';

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
    const userId = req.user.id;
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
        await logDevIssue({
          type: 'validation_error',
          severity: 'high',
          component: 'payment_methods',
          message: 'User attempted to remove payment method that does not belong to them',
          data: {
            userId,
            payment_method_id,
            paymentMethodCustomer: paymentMethod.customer,
            userCustomerId: user.stripe_customer_id
          }
        });
        throw new ApiError('Payment method does not belong to this customer', 403);
      }

      // Detach payment method from customer
      await stripe.paymentMethods.detach(payment_method_id);

      return res.status(200).json({
        success: true,
        message: 'Payment method removed successfully'
      });
    } catch (error) {
      await DevIssue.apiError('payment_methods', '/api/payment-methods/remove', error, {
        userId: req.user.id,
        payment_method_id: req.body.payment_method_id
      });
      console.error('Error removing payment method:', error);
      throw new ApiError('Failed to remove payment method', 500, {
        error: error.message
      });
    }
  }
});
