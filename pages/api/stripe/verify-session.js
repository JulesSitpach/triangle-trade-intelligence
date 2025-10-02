import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';

/**
 * Verify Stripe checkout session and get subscription details
 * GET /api/stripe/verify-session?session_id=xxx
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const { session_id } = req.query;

    if (!session_id) {
      throw new ApiError('Session ID is required', 400, {
        field: 'session_id'
      });
    }

    try {
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (!session) {
        throw new ApiError('Session not found', 404);
      }

      // Get subscription details if available
      let subscription = null;
      if (session.subscription) {
        subscription = await stripe.subscriptions.retrieve(session.subscription);
      }

      return res.status(200).json({
        success: true,
        session: {
          id: session.id,
          status: session.status,
          customer: session.customer,
          plan: session.metadata?.tier || 'Unknown',
          billing_period: session.metadata?.billing_period || 'monthly',
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status
        },
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end
        } : null
      });
    } catch (stripeError) {
      console.error('Stripe session verification error:', stripeError);
      throw new ApiError('Failed to verify session', 500, {
        message: stripeError.message,
        type: stripeError.type
      });
    }
  }
});
