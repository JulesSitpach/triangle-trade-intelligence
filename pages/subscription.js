import React, { useState } from 'react'
import { useRouter } from 'next/router'
import TriangleLayout from '../components/TriangleLayout'
import SubscriptionManager from '../components/SubscriptionManager'

export default function SubscriptionPage() {
  const router = useRouter()
  const [subscriptionData, setSubscriptionData] = useState(null)
  
  // Mock user data - in real app, get from auth context
  const userId = 'user-123' // Replace with actual user ID from authentication
  const userEmail = 'user@example.com' // Replace with actual user email

  const handleSubscriptionChange = (data) => {
    setSubscriptionData(data)
  }

  return (
    <TriangleLayout 
      title="Subscription Plans - Triangle Intelligence"
      description="Choose the perfect plan for your triangle routing needs"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700 mr-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Triangle Intelligence Subscriptions
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                {subscriptionData?.hasSubscription && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {subscriptionData.subscription.tier} Plan Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <SubscriptionManager
            userId={userId}
            userEmail={userEmail}
            onSubscriptionChange={handleSubscriptionChange}
          />
        </main>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What is triangle routing?
              </h3>
              <p className="text-gray-600">
                Triangle routing is a trade strategy that routes goods through USMCA countries (Mexico/Canada) 
                to take advantage of 0% tariff rates, avoiding higher bilateral tariffs from countries like China (30%) or India (50%).
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How much can I save?
              </h3>
              <p className="text-gray-600">
                Our clients typically save $100K-$300K+ annually through strategic triangle routing. 
                Savings depend on your import volume and product categories.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time through your account portal. 
                Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What is Marcus AI?
              </h3>
              <p className="text-gray-600">
                Marcus AI is our intelligent consultation system that provides personalized trade optimization 
                recommendations based on your business profile and market conditions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer custom enterprise solutions?
              </h3>
              <p className="text-gray-600">
                Yes, our Enterprise plan includes custom API integrations, dedicated support, and white-label options. 
                Contact us for custom pricing and implementation.
              </p>
            </div>
          </div>
        </section>
      </div>
    </TriangleLayout>
  )
}