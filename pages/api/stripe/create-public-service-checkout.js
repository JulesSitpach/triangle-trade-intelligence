import { apiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { stripe } from '../../../lib/stripe/server';

/**
 * Service base prices for non-subscribers (in cents)
 * Subscribers get 15% (Professional) or 25% (Premium) discount
 * Trade Health Check and Crisis Navigator have no subscriber discounts
 */
const NON_SUBSCRIBER_PRICES = {
  'trade-health-check': 9900,              // $99 (no discounts)
  'usmca-advantage': 17500,                // $175 (Pro: $149, Premium: $131)
  'supply-chain-optimization': 27500,      // $275 (Pro: $234, Premium: $206)
  'pathfinder': 35000,                     // $350 (Pro: $298, Premium: $263)
  'supply-chain-resilience': 45000,        // $450 (Pro: $383, Premium: $338)
  'crisis-navigator': 20000                // $200/month (no discounts)
};

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
 * Create Stripe checkout session for non-subscriber service payment
 * No authentication required - for public form submissions
 * POST /api/stripe/create-public-service-checkout
 *
 * Body:
 * - service_id: Service identifier (e.g., 'usmca-certificate')
 * - service_request_data: Form data from non-subscriber
 */
export default apiHandler({
  POST: async (req, res) => {
    const { service_id, service_request_data } = req.body;

    // Validate required fields
    validateRequiredFields(req.body, ['service_id', 'service_request_data']);

    // Validate service ID
    if (!NON_SUBSCRIBER_PRICES[service_id]) {
      throw new ApiError('Invalid service ID', 400, {
        field: 'service_id',
        provided: service_id,
        validServices: Object.keys(NON_SUBSCRIBER_PRICES)
      });
    }

    const servicePrice = NON_SUBSCRIBER_PRICES[service_id];
    const serviceName = SERVICE_NAMES[service_id];

    // Validate required form fields
    const requiredFields = ['company_name', 'contact_name', 'product_description'];
    for (const field of requiredFields) {
      if (!service_request_data[field]) {
        throw new ApiError(`Missing required field: ${field}`, 400, {
          field,
          message: `${field} is required for service request`
        });
      }
    }

    try {
      // Create Stripe checkout session WITHOUT customer ID (guest checkout)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${serviceName}`,
                description: `Professional service: ${serviceName} - Base price (subscribers get 15-25% discount)`
              },
              unit_amount: servicePrice
            },
            quantity: 1
          }
        ],
        mode: 'payment', // One-time payment
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/confirmation?session_id={CHECKOUT_SESSION_ID}&service=${service_id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/request-form?cancelled=true`,
        customer_email: service_request_data.contact_email || undefined,
        metadata: {
          service_id: service_id,
          service_name: serviceName,
          company_name: service_request_data.company_name,
          contact_name: service_request_data.contact_name,
          is_subscriber: 'false',
          environment: process.env.NODE_ENV,
          // Store service request data as JSON string for webhook processing
          service_request_data: JSON.stringify(service_request_data)
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true
        }
      });

      console.log('✅ Public checkout session created:', {
        service: serviceName,
        price: servicePrice / 100,
        company: service_request_data.company_name,
        session_id: session.id
      });

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
        service_id: service_id,
        service_name: serviceName,
        price: servicePrice / 100 // Return price in dollars
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
