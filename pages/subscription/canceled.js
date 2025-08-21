import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import TriangleLayout from '../../components/TriangleLayout'

export default function SubscriptionCanceled() {
  const router = useRouter()

  const handleTryAgain = () => {
    router.push('/subscription')
  }

  const handleContinueFree = () => {
    router.push('/foundation')
  }

  return (
    <TriangleLayout title="Subscription Canceled - Triangle Intelligence">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {/* Canceled Icon */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100 mb-6">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Subscription Canceled
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your subscription process was canceled. No payment has been processed.
            </p>
          </div>

          {/* What Happened */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Happened?</h2>
            <p className="text-gray-600 mb-6">
              You canceled the subscription process before completing payment. This is completely normal and happens for various reasons:
            </p>
            
            <ul className="space-y-2 text-gray-600 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path>
                </svg>
                You wanted to review the features and pricing again
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path>
                </svg>
                You need approval from your team or organization
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"></path>
                </svg>
                You&apos;d like to explore the platform first with free features
              </li>
            </ul>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>No worries!</strong> You can subscribe at any time, and your data and progress will be preserved.
              </p>
            </div>
          </div>

          {/* Free Features Available */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Continue with Free Features</h2>
            <p className="text-gray-600 mb-6">
              You can still explore Triangle Intelligence with our free tier features:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="text-green-600 mr-3 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Basic Triangle Analysis</h3>
                  <p className="text-gray-600 text-sm">5 product analyses per month</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-green-600 mr-3 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">HS Code Classification</h3>
                  <p className="text-gray-600 text-sm">Product classification assistance</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-green-600 mr-3 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Basic Tariff Information</h3>
                  <p className="text-gray-600 text-sm">Current tariff rates and USMCA benefits</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="text-green-600 mr-3 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Educational Resources</h3>
                  <p className="text-gray-600 text-sm">Learn about triangle routing strategies</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <div className="space-x-4">
              <button
                onClick={handleTryAgain}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Subscription Plans
              </button>
              
              <button
                onClick={handleContinueFree}
                className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Continue with Free
              </button>
            </div>
            
            <div className="flex justify-center space-x-6 text-sm">
              <a href="mailto:support@triangleintelligence.com" className="text-blue-600 hover:text-blue-800">
                Contact Support
              </a>
              <Link href="/foundation" className="text-blue-600 hover:text-blue-800">
                Start Free Analysis
              </Link>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Back to Home
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-12 bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help Deciding?</h3>
            <p className="text-gray-600 mb-4">
              Our team is here to help you choose the right plan and understand how Triangle Intelligence can benefit your business.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📧 Email: support@triangleintelligence.com</p>
              <p>📞 Phone: 1-800-TRIANGLE</p>
              <p>💬 Schedule a consultation to discuss your specific needs</p>
            </div>
          </div>
        </div>
      </div>
    </TriangleLayout>
  )
}