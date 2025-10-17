import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe, getOrCreateStripeCustomer } from '../../../lib/stripe/server';
import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Service base prices (in cents) - before subscriber discounts
 */
const SERVICE_PRICES = {
  'trade-health-check': 9900,              // $99 (no discount)
  'usmca-advantage': 17500,                // $175 base
  'supply-chain-optimization': 27500,      // $275 base
  'pathfinder': 35000,                     // $350 base
  'supply-chain-resilience': 45000,        // $450 base
  'crisis-navigator': 20000                // $200/month
};

/**
 * Subscription tier discounts (Trade Health Check gets no discount)
 */
const TIER_DISCOUNTS = {
  'Starter': 0,         // No discount
  'Professional': 0.15, // 15% off
  'Premium': 0.25       // 25% off
};

/**
 * Services that don't get subscriber discounts
 */
const NO_DISCOUNT_SERVICES = ['trade-health-check', 'crisis-navigator'];

/**
 * Service names for display
 */
const SERVICE_NAMES = {
  'trade-health-check': 'Trade Health Check',
  'usmca-advantage': 'USMCA Advantage Sprint',
  'supply-chain-optimization': 'Supply Chain Optimization',
  'pathfinder': 'Pathfinder Market Entry',
  'supply-chain-resilience': 'Supply Chain Resilience',
  'crisis-navigator': 'Crisis Navigator'
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
      await DevIssue.validationError('service_checkout', 'service_id', service_id, {
        userId,
        provided: service_id,
        validServices: Object.keys(SERVICE_PRICES)
      });
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
      await logDevIssue({
        type: 'missing_data',
        severity: 'critical',
        component: 'service_checkout',
        message: 'User not found in database during service checkout',
        data: { userId, service_id, error: userError?.message }
      });
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

    // Apply discount to base price (unless service is excluded from discounts)
    let servicePrice = basePrice;
    if (discount > 0 && !NO_DISCOUNT_SERVICES.includes(service_id)) {
      servicePrice = Math.round(basePrice * (1 - discount));
    }

    // Allow price_override to override calculated price (for special cases)
    if (price_override) {
      servicePrice = price_override;
    }

    const serviceName = SERVICE_NAMES[service_id];
    const discountPercentage = discount * 100;

    // Create service request in database first (status: pending_payment)
    // This avoids Stripe metadata 500-character limit
    let serviceRequestId = null;
    if (service_request_data) {
      const { data: serviceRequest, error: requestError } = await supabase
        .from('service_requests')
        .insert({
          user_id: userId,
          service_type: service_id,
          status: 'pending_payment',
          company_name: service_request_data.company_name || 'Unknown',
          price: servicePrice / 100, // Store price in dollars
          subscriber_data: service_request_data
        })
        .select()
        .single();

      if (requestError) {
        await logDevIssue({
          type: 'api_error',
          severity: 'critical',
          component: 'service_checkout',
          message: 'Failed to create service request in database before payment',
          data: {
            userId,
            service_id,
            servicePrice: servicePrice / 100,
            error: requestError.message,
            service_request_data
          }
        });
        console.error('Failed to create service request:', requestError);
        throw new ApiError('Failed to save service request', 500, {
          error: requestError.message
        });
      }

      serviceRequestId = serviceRequest.id;
    }

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
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/logistics-support?cancelled=true`,
        metadata: {
          user_id: userId,
          service_id: service_id,
          service_name: serviceName,
          environment: process.env.NODE_ENV,
          // Store only the service_request ID (not the full data - avoids 500 char limit)
          service_request_id: serviceRequestId || ''
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto'  // Save address from checkout to customer
        }
        // Automatic tax disabled - requires pre-existing customer address
        // automatic_tax: {
        //   enabled: true
        // }
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
      await DevIssue.apiError('service_checkout', '/api/stripe/create-service-checkout', stripeError, {
        userId,
        service_id,
        servicePrice: servicePrice / 100,
        basePrice: basePrice / 100,
        userTier,
        discount,
        serviceRequestId,
        stripeErrorType: stripeError.type,
        stripeErrorCode: stripeError.code
      });
      console.error('Stripe checkout session creation error:', stripeError);
      throw new ApiError('Failed to create checkout session', 500, {
        message: stripeError.message,
        type: stripeError.type
      });
    }
  }
});
