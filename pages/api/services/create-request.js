import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError, validateRequiredFields } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Service pricing configuration
const SERVICE_PRICING = {
  'usmca-certificates': { price: 250, name: 'USMCA Certificate Generation' },
  'hs-classification': { price: 200, name: 'HS Code Classification' },
  'crisis-response': { price: 500, name: 'Crisis Response Service' },
  'supplier-sourcing': { price: 450, name: 'Mexico Supplier Sourcing' },
  'manufacturing-feasibility': { price: 650, name: 'Manufacturing Feasibility Analysis' },
  'market-entry': { price: 550, name: 'Mexico Market Entry Strategy' }
};

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const { service_type, subscriber_data } = req.body;

    // Validation
    validateRequiredFields({ service_type, subscriber_data }, ['service_type', 'subscriber_data']);

    if (!SERVICE_PRICING[service_type]) {
      throw new ApiError('Invalid service type', 400);
    }

    const servicePricing = SERVICE_PRICING[service_type];

    try {
      // Create service request in database (PENDING until payment confirmed)
      const { data: serviceRequest, error: dbError } = await supabase
        .from('service_requests')
        .insert({
          user_id: userId,
          client_company: subscriber_data.company_name || 'Unknown',
          service_type: service_type,
          status: 'pending_payment',
          price: servicePricing.price,
          subscriber_data: subscriber_data
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new ApiError('Failed to create service request', 500);
      }

      // Create Stripe Checkout session for service purchase
      const session = await stripe.checkout.sessions.create({
        customer_email: req.user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: servicePricing.name,
                description: `Professional ${servicePricing.name} service`,
              },
              unit_amount: servicePricing.price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/confirmation?session_id={CHECKOUT_SESSION_ID}&service_request_id=${serviceRequest.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/services/logistics-support`,
        metadata: {
          user_id: userId,
          service_request_id: serviceRequest.id,
          service_type: service_type,
          type: 'service_purchase'
        }
      });

      return res.status(200).json({
        success: true,
        checkout_url: session.url,
        service_request_id: serviceRequest.id
      });

    } catch (error) {
      console.error('Service purchase error:', error);
      throw new ApiError(error.message || 'Failed to create service purchase', 500);
    }
  }
});
