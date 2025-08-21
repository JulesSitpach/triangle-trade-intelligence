import React from 'react'
import { formatPrice, SUBSCRIPTION_TIERS } from '../lib/stripe'

export default function SubscriptionCard({ 
  tier, 
  isCurrentTier = false, 
  isPopular = false, 
  onSelect,
  loading = false 
}) {
  const tierConfig = SUBSCRIPTION_TIERS[tier]
  
  if (!tierConfig) {
    return null
  }

  const handleSelect = () => {
    if (!loading && !isCurrentTier && onSelect) {
      onSelect(tier)
    }
  }

  return (
    <div className={`
      relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200 hover:shadow-xl
      ${isCurrentTier ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
      ${isPopular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
    `}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      {isCurrentTier && (
        <div className="absolute -top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Current Plan
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{tierConfig.name}</h3>
          <div className="mt-2">
            <span className="text-4xl font-bold text-gray-900">
              {formatPrice(tierConfig.price)}
            </span>
            <span className="text-gray-500">/month</span>
          </div>
          <p className="mt-2 text-gray-600 text-sm">{tierConfig.description}</p>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Features Included
          </h4>
          <ul className="space-y-2">
            {tierConfig.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Usage Limits */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Usage Limits
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Monthly Analyses:</span>
              <span className="font-medium">
                {tierConfig.limits.monthlyAnalyses === -1 ? 'Unlimited' : tierConfig.limits.monthlyAnalyses}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Saved Routes:</span>
              <span className="font-medium">
                {tierConfig.limits.savedRoutes === -1 ? 'Unlimited' : tierConfig.limits.savedRoutes}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Alert Channels:</span>
              <span className="font-medium">
                {tierConfig.limits.alertChannels === -1 ? 'Unlimited' : tierConfig.limits.alertChannels}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSelect}
          disabled={loading || isCurrentTier}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200
            ${isCurrentTier 
              ? 'bg-green-100 text-green-700 cursor-not-allowed' 
              : loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : tier === 'ENTERPRISE'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : tier === 'PROFESSIONAL'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : isCurrentTier ? (
            'Current Plan'
          ) : (
            `Subscribe to ${tierConfig.name}`
          )}
        </button>

        {/* Trial Info */}
        {!isCurrentTier && (tier === 'STARTER' || tier === 'PROFESSIONAL') && (
          <p className="mt-3 text-center text-xs text-gray-500">
            {tier === 'STARTER' ? '14-day' : '7-day'} free trial included
          </p>
        )}
      </div>
    </div>
  )
}