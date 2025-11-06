/**
 * PRICING CONFIGURATION
 * Centralized pricing for all subscription tiers
 * Prices in cents (e.g., 4900 = $49.00)
 *
 * WARNING: Changes here will affect:
 * - Stripe checkout session creation
 * - MRR calculations
 * - Sales analytics
 * - Pricing page display
 */

export const SUBSCRIPTION_TIERS = {
  Trial: {
    name: 'Trial',
    price_cents: 0,
    price_display: '$0',
    monthly_analyses: 1,
    features: [
      '1 USMCA analysis',
      'Certificate preview only (no download)',
      'Email not verified required',
      'Expires after 30 days'
    ]
  },
  Starter: {
    name: 'Starter',
    price_cents: 4900,
    price_display: '$49/month',
    monthly_analyses: 15,
    stripe_price_id: process.env.STRIPE_PRICE_ID_STARTER,
    features: [
      '15 USMCA analyses per month',
      'PDF certificate downloads',
      'Tariff policy alerts',
      'Email support'
    ]
  },
  Professional: {
    name: 'Professional',
    price_cents: 9900,
    price_display: '$99/month',
    monthly_analyses: 50,
    stripe_price_id: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
    features: [
      '50 USMCA analyses per month',
      'PDF certificate downloads',
      'Real-time tariff alerts',
      'Priority email support',
      'Advanced analytics'
    ]
  },
  Premium: {
    name: 'Premium',
    price_cents: 19900,
    price_display: '$199/month',
    monthly_analyses: 999999, // Unlimited
    stripe_price_id: process.env.STRIPE_PRICE_ID_PREMIUM,
    features: [
      'Unlimited USMCA analyses',
      'PDF certificate downloads',
      'Real-time tariff alerts',
      '24/7 priority support',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager'
    ]
  }
};

/**
 * Get tier configuration by name
 */
export function getTierConfig(tierName) {
  return SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS.Trial;
}

/**
 * Get price in cents for a tier
 */
export function getTierPrice(tierName) {
  return getTierConfig(tierName).price_cents;
}

/**
 * Get monthly analysis limit for a tier
 */
export function getTierLimit(tierName) {
  return getTierConfig(tierName).monthly_analyses;
}

/**
 * Calculate MRR from array of tier names
 */
export function calculateMRR(tierNames) {
  return tierNames.reduce((sum, tierName) => {
    const price = getTierPrice(tierName);
    return sum + price;
  }, 0);
}

/**
 * Validate tier name
 */
export function isValidTier(tierName) {
  return tierName in SUBSCRIPTION_TIERS;
}

export default SUBSCRIPTION_TIERS;
