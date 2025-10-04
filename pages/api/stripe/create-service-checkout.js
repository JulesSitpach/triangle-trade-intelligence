import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe, getOrCreateStripeCustomer } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Service base prices (in cents) - before subscriber discounts
 */
const SERVICE_PRICES = {
  'usmca-certificate': 25000, // $250
  'hs-classification': 20000, // $200
  'crisis-response': 50000,   // $500
  'supplier-sourcing': 45000, // $450
  'manufacturing-feasibility': 65000, // $650
  'market-entry': 55000       // $550
};

/**
 * Subscription tier discounts
 */
const TIER_DISCOUNTS = {
  'Starter': 0,      // No discount
  'Professional': 0.15, // 15% off
  'Premium': 0.25    // 25% off
};

/**
 * Service names for display
 */
const SERVICE_NAMES = {
  'usmca-certificate': 'USMCA Certificate Generation',
  'hs-classification': 'HS Code Classification',
  'crisis-response': 'Crisis Response Management',
  'supplier-sourcing': 'Supplier Sourcing',
  'manufacturing-feasibility': 'Manufacturing Feasibility Analysis',
  'market-entry': 'Market Entry Strategy'
};

/**
 * Create Stripe checkout session for one-time service payment
 * POST /api/stripe/create-service-checkout
 *
 * Body:
 * - service_id: Service identifier (e.g., 'usmca-certificate')
 * - service_request_data: Service request data to save after payment
 */
export default protectedApiHandler({
  POST: async (req, res) => {
    const { service_id, service_request_data, price_override } = req.body;
    const userId = req.user.id;

    // Validate required fields
    validateRequiredFields(req.body, ['service_id']);

    // Validate service ID
    if (!SERVICE_PRICES[service_id]) {
      throw new ApiError('Invalid service ID', 400, {
        field: 'service_id',
        provided: service_id,
        validServices: Object.keys(SERVICE_PRICES)
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

    // Calculate price with subscriber discount
    const basePrice = SERVICE_PRICES[service_id];
    const userTier = user.subscription_tier || 'Trial';
    const discount = TIER_DISCOUNTS[userTier] || 0;

    // Apply discount to base price
    let servicePrice = basePrice;
    if (discount > 0) {
      servicePrice = Math.round(basePrice * (1 - discount));
    }

    // Allow price_override to override calculated price (for special cases)
    if (price_override) {
      servicePrice = price_override;
    }

    const serviceName = SERVICE_NAMES[service_id];
    const discountPercentage = discount * 100;

    try {
      // Create Stripe checkout session for one-time payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: serviceName,
                description: `Professional service: ${serviceName}`
              },
              unit_amount: servicePrice
            },
            quantity: 1
          }
        ],
        mode: 'payment', // One-time payment, not subscription
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/confirmation?session_id={CHECKOUT_SESSION_ID}&service=${service_id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/logistics-support?cancelled=true`,
        metadata: {
          user_id: userId,
          service_id: service_id,
          service_name: serviceName,
          environment: process.env.NODE_ENV,
          // Store service request data as JSON string for webhook processing
          service_request_data: JSON.stringify(service_request_data || {})
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        automatic_tax: {
          enabled: true
        }
      });

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
        service_id: service_id,
        service_name: serviceName,
        price: servicePrice / 100, // Return price in dollars
        discount_applied: discountPercentage,
        base_price: basePrice / 100,
        subscriber_tier: userTier
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
