import React from 'react'
import { useSubscription, withSubscriptionGate, UsageLimitGate } from '../hooks/useSubscription'
import SubscriptionManager from './SubscriptionManager'

// Beast Master Intelligence is Enterprise-only
export const BeastMasterSection = withSubscriptionGate(
  ({ children }) => children,
  'beast_master'
)

// Marcus AI requires Professional or higher
export const MarcusAISection = withSubscriptionGate(
  ({ children }) => children,
  'marcus_ai'
)

// Advanced analytics for Professional+
export const AdvancedAnalytics = withSubscriptionGate(
  ({ children }) => children,
  'real_time_alerts'
)

// Usage-gated analysis component
export function GatedAnalysisSection({ userId, children, usageType = 'monthlyAnalyses' }) {
  return (
    <UsageLimitGate
      userId={userId}
      usageType={usageType}
      fallbackComponent={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-8.5-2a7.5 7.5 0 1115 0"></path>
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Limit Reached</h3>
            <p className="text-gray-600 mb-4">
              You&apos;ve reached your monthly analysis limit. Upgrade for unlimited access.
            </p>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      }
    >
      {children}
    </UsageLimitGate>
  )
}

// Subscription status indicator for dashboard
export function SubscriptionStatusIndicator({ userId }) {
  const { subscriptionData, tier, isActive, loading } = useSubscription(userId)

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg px-3 py-1">
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    )
  }

  if (!isActive) {
    return (
      <div className="bg-yellow-100 rounded-lg px-3 py-1 flex items-center">
        <svg className="w-4 h-4 text-yellow-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <span className="text-yellow-800 text-sm font-medium">Free Tier</span>
        <button
          onClick={() => window.location.href = '/subscription'}
          className="ml-2 text-xs text-yellow-700 underline hover:text-yellow-900"
        >
          Upgrade
        </button>
      </div>
    )
  }

  const tierColors = {
    STARTER: 'bg-green-100 text-green-800',
    PROFESSIONAL: 'bg-blue-100 text-blue-800', 
    ENTERPRISE: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className={`rounded-lg px-3 py-1 flex items-center ${tierColors[tier] || 'bg-gray-100 text-gray-800'}`}>
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span className="text-sm font-medium">{tier}</span>
      {subscriptionData?.subscription?.cancelAtPeriodEnd && (
        <span className="ml-1 text-xs opacity-75">(Ending)</span>
      )}
    </div>
  )
}

// Usage metrics component
export function UsageMetrics({ userId }) {
  const { subscriptionData, loading } = useSubscription(userId)

  if (loading || !subscriptionData?.hasSubscription) {
    return null
  }

  const { limits, usage } = subscriptionData

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Monthly Usage</h3>
      <div className="space-y-3">
        {Object.entries(limits).map(([key, limit]) => {
          const usageAmount = usage?.[key] || 0
          const percentage = limit.limit === -1 ? 0 : (usageAmount / limit.limit) * 100
          
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-gray-900 font-medium">
                  {limit.limit === -1 ? 'Unlimited' : `${usageAmount}/${limit.limit}`}
                </span>
              </div>
              {limit.limit !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage > 90 ? 'bg-red-500' :
                      percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Feature access indicator
export function FeatureAccessBadge({ feature, userId }) {
  const { hasFeature } = useSubscription(userId)
  
  const isAllowed = hasFeature(feature)
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isAllowed 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-600'
    }`}>
      {isAllowed ? (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      ) : (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      )}
      {feature.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

// Subscription upgrade prompt
export function UpgradePrompt({ feature, currentTier = 'FREE' }) {
  const requiredTier = getRequiredTier(feature)
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Unlock {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          <p className="text-gray-600 mt-1">
            This feature requires a {requiredTier} subscription or higher. 
            {currentTier !== 'FREE' && ` Upgrade from your current ${currentTier} plan.`}
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => window.location.href = '/subscription'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Plans
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="text-blue-600 hover:text-blue-800 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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