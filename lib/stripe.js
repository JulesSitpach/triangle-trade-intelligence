import Stripe from 'stripe'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
})

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  STARTER: {
    name: 'Starter',
    price: 97,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_97',
    description: 'Essential triangle routing intelligence for growing businesses',
    features: [
      'Basic triangle routing analysis',
      'Up to 50 product classifications',
      'Standard market alerts',
      'Email support'
    ],
    limits: {
      monthlyAnalyses: 50,
      savedRoutes: 10,
      alertChannels: 1
    }
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 297,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_297',
    description: 'Advanced intelligence with Marcus AI consultation and priority support',
    features: [
      'Advanced triangle routing with confidence scoring',
      'Unlimited product classifications',
      'Marcus AI consultation system',
      'Real-time market alerts',
      'Priority support',
      'Custom reporting'
    ],
    limits: {
      monthlyAnalyses: 500,
      savedRoutes: 100,
      alertChannels: 5
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 897,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_897',
    description: 'Full Triangle Intelligence platform with dedicated support and custom integrations',
    features: [
      'Complete Triangle Intelligence suite',
      'Unlimited analyses and classifications',
      'Beast Master compound intelligence',
      'Custom API integrations',
      'Dedicated account manager',
      'White-label options',
      'SLA guarantees'
    ],
    limits: {
      monthlyAnalyses: -1, // Unlimited
      savedRoutes: -1,     // Unlimited
      alertChannels: -1    // Unlimited
    }
  }
}

// Stripe client-side utilities
export const getStripePublishableKey = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable')
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
}

// Format price for display
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price)
}

// Get tier by price ID
export const getTierByPriceId = (priceId) => {
  return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.priceId === priceId)
}

// Check if user has access to feature based on tier
export const hasFeatureAccess = (userTier, feature) => {
  if (!userTier) return false
  
  const tierConfig = SUBSCRIPTION_TIERS[userTier.toUpperCase()]
  if (!tierConfig) return false
  
  // Enterprise has access to everything
  if (userTier.toUpperCase() === 'ENTERPRISE') return true
  
  // Feature-specific access checks
  const featureMap = {
    'marcus_ai': ['PROFESSIONAL', 'ENTERPRISE'],
    'beast_master': ['ENTERPRISE'],
    'unlimited_analyses': ['ENTERPRISE'],
    'custom_api': ['ENTERPRISE'],
    'priority_support': ['PROFESSIONAL', 'ENTERPRISE'],
    'real_time_alerts': ['PROFESSIONAL', 'ENTERPRISE']
  }
  
  return featureMap[feature]?.includes(userTier.toUpperCase()) || false
}

// Check usage limits
export const checkUsageLimit = (userTier, usageType, currentUsage) => {
  if (!userTier) return { allowed: false, limit: 0, remaining: 0 }
  
  const tierConfig = SUBSCRIPTION_TIERS[userTier.toUpperCase()]
  if (!tierConfig) return { allowed: false, limit: 0, remaining: 0 }
  
  const limit = tierConfig.limits[usageType]
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 }
  }
  
  const remaining = Math.max(0, limit - currentUsage)
  return {
    allowed: remaining > 0,
    limit,
    remaining,
    usage: currentUsage
  }
}