import { apiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default apiHandler({
  POST: async (req, res) => {
    // Allow both authenticated (req.user) and non-authenticated (guest) users
    const userId = req.user?.id || null;
    const { session_id } = req.body;

    try {
      // Verify Stripe session
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== 'paid') {
        throw new ApiError('Payment not completed', 400);
      }

      // Get service_request_id from Stripe metadata
      const service_request_id = session.metadata.service_request_id;

      if (!service_request_id) {
        throw new ApiError('Service request ID not found in session', 400);
      }

      // Fetch service request
      // For subscribers: match user_id
      // For non-subscribers: user_id will be null
      let query = supabase
        .from('service_requests')
        .select('*')
        .eq('id', service_request_id);

      // If user is authenticated, verify it matches their user_id
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Non-subscriber: verify user_id is null
        query = query.is('user_id', null);
      }

      const { data: service, error } = await query.single();

      if (error || !service) {
        throw new ApiError('Service request not found', 404);
      }

      // Update service status to 'paid' (was pending_payment)
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({ status: 'pending' })
        .eq('id', service_request_id);

      if (updateError) {
        console.error('Failed to update service status:', updateError);
      }

      return res.status(200).json({
        success: true,
        service
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      throw new ApiError(error.message || 'Failed to verify payment', 500);
    }
  }
});
