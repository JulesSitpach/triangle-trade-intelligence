import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import TriangleLayout from '../../components/TriangleLayout'

export default function SubscriptionSuccess() {
  const router = useRouter()
  const { session_id } = router.query
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session_id) {
      // Optional: Verify session and get subscription details
      // For now, we'll just show a success message
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }, [session_id])

  const handleContinue = () => {
    // Redirect to dashboard or main app
    router.push('/dashboard-hub')
  }

  if (loading) {
    return (
      <TriangleLayout title="Processing Subscription - Triangle Intelligence">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Processing your subscription...</h2>
            <p className="text-gray-600 mt-2">Please wait while we set up your account.</p>
          </div>
        </div>
      </TriangleLayout>
    )
  }

  return (
    <TriangleLayout title="Subscription Successful - Triangle Intelligence">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Triangle Intelligence!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your subscription has been successfully activated. You now have access to powerful trade optimization tools.
            </p>
          </div>

          {/* What's Next */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">What&apos;s Next?</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Explore Your Dashboard</h3>
                  <p className="text-gray-600">
                    Access real-time intelligence, triangle routing analysis, and market insights from your executive dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Set Up Your First Route</h3>
                  <p className="text-gray-600">
                    Use our 6-page intelligence journey to analyze your products and discover triangle routing opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Get AI Consultation</h3>
                  <p className="text-gray-600">
                    Chat with Marcus AI for personalized trade optimization recommendations based on your business profile.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-blue-600 mb-4">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Intelligence</h3>
              <p className="text-gray-600 text-sm">
                Access 500K+ trade flows and real-time market alerts for optimal decision making.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-green-600 mb-4">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Proven Savings</h3>
              <p className="text-gray-600 text-sm">
                Save $100K-$300K+ annually through strategic USMCA triangle routing.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-purple-600 mb-4">
                <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Marcus AI Assistant</h3>
              <p className="text-gray-600 text-sm">
                Get intelligent recommendations and market insights from our AI consultation system.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/subscription" className="text-blue-600 hover:text-blue-800">
                Manage Subscription
              </Link>
              <a href="mailto:support@triangleintelligence.com" className="text-blue-600 hover:text-blue-800">
                Contact Support
              </a>
              <Link href="/foundation" className="text-blue-600 hover:text-blue-800">
                Start Analysis
              </Link>
            </div>
          </div>

          {/* Receipt Information */}
          {session_id && (
            <div className="mt-12 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt Information</h3>
              <p className="text-gray-600 text-sm">
                A receipt for your subscription has been sent to your email. 
                Session ID: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{session_id}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </TriangleLayout>
  )
}