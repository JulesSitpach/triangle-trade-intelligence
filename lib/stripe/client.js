import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

/**
 * Get Stripe.js client instance
 * @returns {Promise} Stripe.js instance
 */
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
      return null;
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};
