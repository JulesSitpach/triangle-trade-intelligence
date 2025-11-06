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
      // Note: stripe_subscription_id column doesn't exist, removed from query
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id, subscription_tier, email')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        await DevIssue.apiError('customer_portal', 'profile lookup', profileError, {
          userId
        });
        return res.status(500).json({
          error: 'Failed to fetch user profile',
          message: profileError.message
        });
      }

      // ✅ FIX: Allow dev accounts (Premium tier) and users with stripe_customer_id to access portal
      // Dev accounts can access portal to manage billing settings even without Stripe setup
      const isDev = profile?.subscription_tier === 'Premium';
      let stripeCustomerId = profile?.stripe_customer_id;

      // If no Stripe customer ID, create one (for dev accounts or new users)
      if (!stripeCustomerId) {
        if (isDev) {
          console.log('🔧 Creating Stripe customer for dev account:', userId);

          const customer = await stripe.customers.create({
            email: profile.email,
            metadata: {
              user_id: userId,
              subscription_tier: profile.subscription_tier,
              is_dev_account: 'true'
            }
          });

          stripeCustomerId = customer.id;

          // Save to database
          await supabase
            .from('user_profiles')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('user_id', userId);

          console.log('✅ Created Stripe customer ID:', stripeCustomerId);
        } else {
          console.log('❌ No Stripe customer found for user:', userId);
          await DevIssue.missingData('customer_portal', 'stripe_customer_id', {
            userId,
            tier: profile?.subscription_tier
          });
          return res.status(404).json({
            error: 'No active subscription found',
            message: 'You must have an active subscription to access the customer portal'
          });
        }
      }

      console.log('✅ Stripe customer ID:', stripeCustomerId);
      console.log('✅ User tier:', profile.subscription_tier);

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
