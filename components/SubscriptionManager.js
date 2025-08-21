import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { getStripePublishableKey, SUBSCRIPTION_TIERS } from '../lib/stripe'
import SubscriptionCard from './SubscriptionCard'

const stripePromise = loadStripe(getStripePublishableKey())

export default function SubscriptionManager({ userId, userEmail, onSubscriptionChange }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(null)

  // Load subscription status
  useEffect(() => {
    if (userId) {
      fetchSubscriptionStatus()
    }
  }, [userId])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/subscriptions/status?userId=${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        setSubscriptionStatus(data)
        if (onSubscriptionChange) {
          onSubscriptionChange(data)
        }
      } else {
        console.error('Failed to fetch subscription status:', data.error)
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (tier) => {
    if (!userId || !userEmail) {
      alert('Please sign in to subscribe')
      return
    }

    setCheckoutLoading(tier)

    try {
      // Create checkout session
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tier,
          email: userEmail,
          userId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/canceled`
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Stripe checkout
        const stripe = await stripePromise
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        })

        if (error) {
          console.error('Stripe redirect error:', error)
          alert('Failed to redirect to checkout. Please try again.')
        }
      } else {
        console.error('Checkout creation failed:', data.error)
        alert('Failed to create checkout session. Please try again.')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!userId) return

    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          returnUrl: window.location.href
        })
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = data.portalUrl
      } else {
        console.error('Portal creation failed:', data.error)
        alert('Failed to open subscription management. Please try again.')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">
          Choose Your Triangle Intelligence Plan
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Scale your trade optimization with the power of triangle routing
        </p>
        
        {subscriptionStatus?.hasSubscription && (
          <div className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-blue-800 font-medium">
              Current Plan: {subscriptionStatus.subscription.tier} ({subscriptionStatus.subscription.status})
            </span>
            <button
              onClick={handleManageSubscription}
              className="ml-4 text-blue-600 hover:text-blue-800 underline"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </div>

      {/* Usage Overview */}
      {subscriptionStatus?.hasSubscription && subscriptionStatus.usage && (
        <div className="mb-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(subscriptionStatus.limits).map(([key, limit]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {limit.limit === -1 ? '∞' : `${limit.usage || 0}/${limit.limit}`}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                {limit.limit !== -1 && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (limit.usage || 0) / limit.limit > 0.8 ? 'bg-red-500' : 
                        (limit.usage || 0) / limit.limit > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(((limit.usage || 0) / limit.limit) * 100, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(SUBSCRIPTION_TIERS).map(([tier, config]) => (
          <SubscriptionCard
            key={tier}
            tier={tier}
            isCurrentTier={subscriptionStatus?.subscription?.tier === tier}
            isPopular={tier === 'PROFESSIONAL'}
            onSelect={handleSubscribe}
            loading={checkoutLoading === tier}
          />
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-12 text-center">
        <div className="bg-gray-50 rounded-lg p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Why Triangle Intelligence?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="text-blue-600 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Proven Savings</h4>
              <p className="text-gray-600 text-sm">
                $100K-$300K+ annual savings through USMCA triangle routing
              </p>
            </div>
            <div>
              <div className="text-blue-600 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Market Volatility Protection</h4>
              <p className="text-gray-600 text-sm">
                USMCA rates stay 0% while bilateral tariffs fluctuate wildly
              </p>
            </div>
            <div>
              <div className="text-blue-600 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Enterprise Intelligence</h4>
              <p className="text-gray-600 text-sm">
                500K+ trade flows with Marcus AI consultation system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Information */}
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>
          Need help choosing the right plan? 
          <a href="mailto:support@triangleintelligence.com" className="text-blue-600 hover:text-blue-800 ml-1">
            Contact our team
          </a>
        </p>
        <p className="mt-2">
          All plans include secure payments, instant activation, and can be canceled anytime.
        </p>
      </div>
    </div>
  )
}