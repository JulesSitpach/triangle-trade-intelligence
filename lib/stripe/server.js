import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

/**
 * Stripe server-side instance
 * Only use this in API routes, never on the client
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: false
});

/**
 * Stripe price IDs for each subscription tier
 *
 * IMPORTANT: Replace these placeholder IDs with actual Stripe price IDs
 * Create these in Stripe Dashboard → Products → Pricing
 *
 * SMB-Focused Pricing Structure:
 * - Starter: $99/month or $950/year (10 analyses/month)
 * - Professional: $299/month or $2,850/year (unlimited, 15% service discount)
 * - Premium: $599/month or $5,750/year (unlimited, 25% service discount, quarterly calls)
 */
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || 'price_starter_annual'
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
    annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || 'price_professional_annual'
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
    annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || 'price_premium_annual'
  }
};

/**
 * Get or create Stripe customer for a user
 * @param {Object} user - User object from database
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<string>} Stripe customer ID
 */
export async function getOrCreateStripeCustomer(user, supabase) {
  // If user already has Stripe customer ID, return it
  if (user.stripe_customer_id) {
    try {
      // Verify customer still exists in Stripe
      await stripe.customers.retrieve(user.stripe_customer_id);
      return user.stripe_customer_id;
    } catch (error) {
      console.warn('Stripe customer not found, creating new one:', error.message);
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.full_name || user.company_name || user.email,
    metadata: {
      user_id: user.id,
      environment: process.env.NODE_ENV
    }
  });

  // Save Stripe customer ID to user record
  const { error } = await supabase
    .from('user_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to save Stripe customer ID to database:', error);
  }

  return customer.id;
}

/**
 * Get readable subscription tier name
 * @param {string} tier - Tier identifier
 * @returns {string} Readable tier name
 */
export function getSubscriptionTierName(tier) {
  const names = {
    starter: 'Starter',
    professional: 'Professional',
    premium: 'Premium'
  };
  return names[tier] || tier;
}

/**
 * Get readable billing period name
 * @param {string} period - Billing period identifier
 * @returns {string} Readable period name
 */
export function getBillingPeriodName(period) {
  const names = {
    monthly: 'Monthly',
    annual: 'Annual'
  };
  return names[period] || period;
}
