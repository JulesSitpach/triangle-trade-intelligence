import { getSupabaseClient } from './supabase-client'

/**
 * Subscription middleware for API routes
 * Checks subscription status and usage limits
 */
export async function withSubscriptionCheck(handler, options = {}) {
  return async (req, res) => {
    const { 
      requiredFeature = null,
      trackUsage = null,
      requireSubscription = false 
    } = options

    // Extract user ID from request (adjust based on your auth implementation)
    const userId = req.body?.userId || req.query?.userId || req.headers['x-user-id']

    if (!userId && requireSubscription) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    let subscriptionData = null

    if (userId) {
      // Get subscription status
      try {
        subscriptionData = await getSubscriptionStatus(userId)
      } catch (error) {
        console.error('Error checking subscription:', error)
        if (requireSubscription) {
          return res.status(500).json({ error: 'Failed to verify subscription' })
        }
      }

      // Check if subscription is required but not active
      if (requireSubscription && !subscriptionData?.hasSubscription) {
        return res.status(403).json({ 
          error: 'Active subscription required',
          upgradeUrl: '/subscription'
        })
      }

      // Check feature access
      if (requiredFeature && !hasFeatureAccess(subscriptionData, requiredFeature)) {
        return res.status(403).json({ 
          error: `Feature '${requiredFeature}' requires subscription upgrade`,
          upgradeUrl: '/subscription',
          currentTier: subscriptionData?.subscription?.tier || 'FREE'
        })
      }

      // Check and track usage
      if (trackUsage) {
        const canUse = await checkAndTrackUsage(userId, trackUsage)
        if (!canUse) {
          return res.status(429).json({ 
            error: `Usage limit exceeded for ${trackUsage}`,
            upgradeUrl: '/subscription'
          })
        }
      }
    }

    // Add subscription data to request object
    req.subscription = subscriptionData

    // Call the original handler
    return handler(req, res)
  }
}

/**
 * Get subscription status for a user
 */
async function getSubscriptionStatus(userId) {
  const supabase = getSupabaseClient()

  // Get subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (subError && subError.code !== 'PGRST116') {
    throw subError
  }

  // Get usage
  let usage = null
  if (subscription) {
    const { data: usageData } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', userId)
      .lte('current_period_start', 'now()')
      .gte('current_period_end', 'now()')
      .single()

    usage = usageData
  }

  // Return structured data
  if (!subscription) {
    return {
      hasSubscription: false,
      tier: 'FREE',
      status: 'inactive'
    }
  }

  return {
    hasSubscription: true,
    subscription: {
      id: subscription.id,
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
    },
    usage: usage ? {
      monthlyAnalyses: usage.monthly_analyses || 0,
      savedRoutes: usage.saved_routes || 0,
      alertChannels: usage.alert_channels || 0,
      marcusConsultations: usage.marcus_consultations || 0
    } : null
  }
}

/**
 * Check if user has access to a feature
 */
function hasFeatureAccess(subscriptionData, feature) {
  if (!subscriptionData?.hasSubscription) return false
  
  const tier = subscriptionData.subscription.tier
  
  // Enterprise has access to everything
  if (tier === 'ENTERPRISE') return true
  
  const featureMap = {
    'marcus_ai': ['PROFESSIONAL', 'ENTERPRISE'],
    'beast_master': ['ENTERPRISE'],
    'unlimited_analyses': ['ENTERPRISE'],
    'custom_api': ['ENTERPRISE'],
    'priority_support': ['PROFESSIONAL', 'ENTERPRISE'],
    'real_time_alerts': ['PROFESSIONAL', 'ENTERPRISE']
  }
  
  return featureMap[feature]?.includes(tier) || false
}

/**
 * Check usage limit and track usage
 */
async function checkAndTrackUsage(userId, usageType) {
  const supabase = getSupabaseClient()

  try {
    // Use the database function to check and increment usage
    const { data, error } = await supabase.rpc('increment_usage', {
      user_uuid: userId,
      usage_type: usageType.replace('_', ''), // Convert to camelCase
      increment_amount: 1
    })

    if (error) {
      console.error('Usage tracking error:', error)
      return false
    }

    return data === true // Function returns true if usage was successful
  } catch (error) {
    console.error('Error in usage tracking:', error)
    return false
  }
}

/**
 * Subscription decorator for API routes
 */
export function requireSubscription(tier = null, feature = null) {
  return (handler) => {
    return withSubscriptionCheck(handler, {
      requireSubscription: true,
      requiredFeature: feature
    })
  }
}

/**
 * Usage tracking decorator
 */
export function trackUsage(usageType) {
  return (handler) => {
    return withSubscriptionCheck(handler, {
      trackUsage: usageType
    })
  }
}

/**
 * Combined decorator for feature gating with usage tracking
 */
export function requireFeatureAndTrackUsage(feature, usageType) {
  return (handler) => {
    return withSubscriptionCheck(handler, {
      requiredFeature: feature,
      trackUsage: usageType
    })
  }
}

// Example usage:
/*
// In an API route:
import { requireSubscription, trackUsage, requireFeatureAndTrackUsage } from '../../lib/subscription-middleware'

// Require any active subscription
export default requireSubscription()(async function handler(req, res) {
  // Handler code here
})

// Require Professional tier for Marcus AI and track consultation usage
export default requireFeatureAndTrackUsage('marcus_ai', 'marcusConsultations')(async function handler(req, res) {
  // Handler code here
  // req.subscription contains subscription data
})

// Just track usage without requiring subscription
export default trackUsage('monthlyAnalyses')(async function handler(req, res) {
  // Handler code here
})
*/