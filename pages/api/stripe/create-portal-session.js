/**
 * CREATE STRIPE CUSTOMER PORTAL SESSION
 * Allows subscribers to manage their subscription (cancel, update payment, view invoices)
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;

    try {
      console.log('🔄 Creating Stripe Customer Portal session for user:', userId);

      // Get user's Stripe customer ID from user_profiles table
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.stripe_customer_id) {
        console.error('❌ No Stripe customer found for user:', userId);
        await DevIssue.missingData('customer_portal', 'stripe_customer_id', {
          userId,
          error: profileError?.message
        });
        return res.status(404).json({
          error: 'No active subscription found',
          message: 'You must have an active subscription to access the customer portal'
        });
      }

      const stripeCustomerId = profile.stripe_customer_id;
      console.log('✅ Found Stripe customer ID:', stripeCustomerId);

      // Create Stripe Customer Portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?portal=success`,
      });

      console.log('✅ Customer Portal session created:', session.id);

      return res.status(200).json({
        url: session.url
      });

    } catch (error) {
      console.error('❌ Error creating Customer Portal session:', error);
      await DevIssue.apiError('customer_portal', '/api/stripe/create-portal-session', error, {
        userId
      });
      return res.status(500).json({
        error: 'Failed to create portal session',
        message: error.message
      });
    }
  }
});
