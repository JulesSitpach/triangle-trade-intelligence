import { useState, useEffect, useCallback } from 'react'

export function useSubscription(userId) {
  const [subscriptionData, setSubscriptionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/subscriptions/status?userId=${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setSubscriptionData(data)
      } else {
        setError(data.error || 'Failed to fetch subscription status')
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [fetchSubscriptionStatus])

  // Helper functions
  const hasFeature = (feature) => {
    return subscriptionData?.features?.[feature] || false
  }

  const checkUsageLimit = (usageType) => {
    return subscriptionData?.limits?.[usageType] || { allowed: false, limit: 0, remaining: 0 }
  }

  const canUseFeature = (usageType) => {
    const limit = checkUsageLimit(usageType)
    return limit.allowed && limit.remaining > 0
  }

  const trackUsage = async (usageType, amount = 1) => {
    if (!userId) return false

    try {
      const response = await fetch('/api/subscriptions/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          usageType,
          amount
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh subscription status after tracking usage
        await fetchSubscriptionStatus()
        return true
      } else {
        console.error('Usage tracking failed:', data.error)
        return false
      }
    } catch (error) {
      console.error('Error tracking usage:', error)
      return false
    }
  }

  const isActive = subscriptionData?.hasSubscription && 
                   subscriptionData?.subscription?.status === 'active'

  const tier = subscriptionData?.subscription?.tier || 'FREE'

  return {
    subscriptionData,
    loading,
    error,
    isActive,
    tier,
    hasFeature,
    checkUsageLimit,
    canUseFeature,
    trackUsage,
    refreshStatus: fetchSubscriptionStatus
  }
}

// Higher-order component for subscription gating
export function withSubscriptionGate(WrappedComponent, requiredFeature) {
  return function GatedComponent(props) {
    const { userId } = props
    const { hasFeature, loading, subscriptionData } = useSubscription(userId)

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (requiredFeature && !hasFeature(requiredFeature)) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5.196a4 4 0 11.196-2.196M16 13v-2a4 4 0 10-8 0v2m8 0H8s-2 0-2 2v6c0 2 2 2 2 2h8s2 0 2-2v-6c0-2-2-2-2-2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Upgrade Required</h3>
          <p className="text-gray-600 mb-6">
            This feature requires a {getRequiredTier(requiredFeature)} subscription or higher.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/subscription'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Subscription Plans
            </button>
            {subscriptionData?.hasSubscription && (
              <p className="text-sm text-gray-500">
                Current Plan: {subscriptionData.subscription.tier}
              </p>
            )}
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}

// Usage limit gate component
export function UsageLimitGate({ 
  children, 
  userId, 
  usageType, 
  fallbackComponent = null,
  showUpgradePrompt = true 
}) {
  const { canUseFeature, checkUsageLimit, loading, tier } = useSubscription(userId)

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
    )
  }

  const limit = checkUsageLimit(usageType)

  if (!canUseFeature(usageType)) {
    if (fallbackComponent) {
      return fallbackComponent
    }

    if (!showUpgradePrompt) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">Usage limit reached for this billing period.</p>
        </div>
      )
    }

    return (
      <div className="bg-white border-2 border-yellow-200 rounded-lg p-6 text-center">
        <div className="mb-4">
          <svg className="w-12 h-12 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Limit Reached</h3>
        <p className="text-gray-600 mb-4">
          You've used {limit.usage || 0} of {limit.limit} {usageType.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} this month.
        </p>
        {tier === 'FREE' ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Upgrade to get more usage allowances.</p>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Subscription Plans
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Usage will reset on your next billing cycle or upgrade for higher limits.
            </p>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        )}
      </div>
    )
  }

  return children
}

// Helper function to determine required tier for a feature
function getRequiredTier(feature) {
  const featureTiers = {
    'marcus_ai': 'Professional',
    'beast_master': 'Enterprise',
    'unlimited_analyses': 'Enterprise',
    'custom_api': 'Enterprise',
    'priority_support': 'Professional',
    'real_time_alerts': 'Professional'
  }

  return featureTiers[feature] || 'Professional'
}