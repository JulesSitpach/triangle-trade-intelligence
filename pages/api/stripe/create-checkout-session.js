import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe, STRIPE_PRICES, getOrCreateStripeCustomer } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create Stripe checkout session for subscription
 * POST /api/stripe/create-checkout-session
 *
 * Body:
 * - tier: 'starter' | 'professional' | 'premium'
 * - billing_period: 'monthly' | 'annual'
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const { tier, billing_period } = req.body;
    const userId = req.user.id;

    // Validate required fields
    validateRequiredFields(req.body, ['tier', 'billing_period']);

    // Validate tier
    if (!['starter', 'professional', 'premium'].includes(tier)) {
      throw new ApiError('Invalid subscription tier. Must be: starter, professional, or premium', 400, {
        field: 'tier',
        provided: tier
      });
    }

    // Validate billing period
    if (!['monthly', 'annual'].includes(billing_period)) {
      throw new ApiError('Invalid billing period. Must be: monthly or annual', 400, {
        field: 'billing_period',
        provided: billing_period
      });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new ApiError('User not found', 404, {
        userId,
        error: userError?.message
      });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user, supabase);

    // Get price ID from configuration
    const priceId = STRIPE_PRICES[tier]?.[billing_period];

    if (!priceId) {
      throw new ApiError('Subscription plan not available', 400, {
        tier,
        billing_period,
        message: 'Price ID not configured in Stripe settings'
      });
    }

    try {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
        metadata: {
          user_id: userId,
          tier: tier,
          billing_period: billing_period,
          environment: process.env.NODE_ENV
        },
        // Enable customer to update payment method
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        // Tax calculation
        automatic_tax: {
          enabled: true
        }
      });

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
        tier: tier,
        billing_period: billing_period
      });
    } catch (stripeError) {
      console.error('Stripe checkout session creation error:', stripeError);
      throw new ApiError('Failed to create checkout session', 500, {
        message: stripeError.message,
        type: stripeError.type
      });
    }
  }
});
