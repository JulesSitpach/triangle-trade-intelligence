import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify Stripe checkout session and get subscription details
 * GET /api/stripe/verify-session?session_id=xxx
 *
 * CRITICAL: This also updates user_profiles.subscription_tier as a fallback
 * in case webhooks don't fire (common in test mode).
 */
export default protectedApiHandler({
  GET: async (req, res) => {
    const { session_id } = req.query;

    if (!session_id) {
      await DevIssue.missingData('verify_session', 'session_id', { query: req.query });
      throw new ApiError('Session ID is required', 400, {
        field: 'session_id'
      });
    }

    try {
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (!session) {
        await logDevIssue({
          type: 'missing_data',
          severity: 'high',
          component: 'verify_session',
          message: 'Stripe session not found',
          data: { session_id, userId: req.user.id }
        });
        throw new ApiError('Session not found', 404);
      }

      // 🚨 CRITICAL FALLBACK: Update user_profiles tier if payment succeeded
      // This ensures tier updates even when webhooks don't fire (test mode)
      if (session.payment_status === 'paid' && session.mode === 'subscription') {
        const tier = session.metadata?.tier;
        const userId = session.metadata?.user_id || req.user.id;

        if (tier && userId) {
          // Capitalize tier name (starter → Starter)
          const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              subscription_tier: tierName,
              status: 'active',
              trial_ends_at: null,
              stripe_customer_id: session.customer,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

          if (updateError) {
            await logDevIssue({
              type: 'api_error',
              severity: 'critical',
              component: 'verify_session',
              message: 'CRITICAL: Failed to update subscription tier on success page - user paid but tier not updated',
              data: {
                userId,
                tier: tierName,
                sessionId: session_id,
                error: updateError.message
              }
            });
            console.error('Failed to update tier:', updateError);
          } else {
            console.log(`✅ Subscription tier updated to ${tierName} for user ${userId} (fallback)`);
          }
        }
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
      await DevIssue.apiError('verify_session', '/api/stripe/verify-session', stripeError, {
        session_id,
        userId: req.user.id,
        stripeErrorType: stripeError.type,
        stripeErrorCode: stripeError.code
      });
      console.error('Stripe session verification error:', stripeError);
      throw new ApiError('Failed to verify session', 500, {
        message: stripeError.message,
        type: stripeError.type
      });
    }
  }
});
