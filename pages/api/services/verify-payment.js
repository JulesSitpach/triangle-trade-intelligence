import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { ApiError } from '../../../lib/api/errorHandler';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const { session_id, service_request_id } = req.body;

    try {
      // Verify Stripe session
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status !== 'paid') {
        throw new ApiError('Payment not completed', 400);
      }

      // Fetch service request
      const { data: service, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', service_request_id)
        .eq('user_id', userId)
        .single();

      if (error || !service) {
        throw new ApiError('Service request not found', 404);
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
