/**
 * Alerts Subscription Flow Component
 * Handles $99/month subscription signup with crisis alert monitoring
 * Strategic conversion funnel with urgency messaging
 */

import React, { useState, useEffect } from 'react';

// Simple icon components
const AlertTriangle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CreditCard = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

export default function AlertsSubscriptionFlow({ 
  userProfile, 
  onSubscriptionComplete, 
  onCancel 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    email: userProfile?.email || '',
    company_name: userProfile?.company_name || '',
    phone: '',
    payment_method: 'credit_card',
    billing_frequency: 'monthly'
  });

  // Calculate protection value messaging
  const tradeVolume = userProfile?.annual_trade_volume || 1000000;
  const dailyCost = 99 / 30.4; // Monthly cost divided by average days per month
  const protectionRatio = (dailyCost / tradeVolume * 365) * 100;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const updateSubscriptionData = (field, value) => {
    setSubscriptionData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartSubscription = async () => {
    setIsProcessing(true);
    
    try {
      // Step 1: Validate and setup subscription
      const subscriptionPayload = {
        action: 'create_alerts_subscription',
        subscription_data: {
          ...subscriptionData,
          user_profile: userProfile,
          plan: 'alerts_monitoring',
          monthly_price: 99,
          features: [
            'real_time_tariff_alerts',
            'personalized_crisis_notifications', 
            'policy_change_monitoring',
            'hs_code_specific_tracking',
            'risk_impact_analysis'
          ],
          start_date: new Date().toISOString(),
          trial_days: 7 // 7-day trial
        }
      };

      console.log('Creating alerts subscription:', subscriptionPayload);

      // Simulate subscription creation (replace with actual payment processing)
      setTimeout(() => {
        // Save subscription data to localStorage for alerts dashboard
        const subscriptionRecord = {
          subscription_id: `ALERTS-${Date.now()}`,
          user_profile: userProfile,
          plan: 'alerts_monitoring',
          status: 'active',
          monthly_cost: 99,
          next_billing: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        };

        localStorage.setItem('usmca_alerts_subscription', JSON.stringify(subscriptionRecord));
        localStorage.setItem('user_subscription_status', 'alerts_active');

        setIsProcessing(false);
        onSubscriptionComplete?.(subscriptionRecord);
      }, 2000);

    } catch (error) {
      console.error('Subscription creation failed:', error);
      setIsProcessing(false);
    }
  };

  if (currentStep === 1) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="section-title">
            Crisis Alert Monitoring
          </h2>
          <p className="text-lg text-gray-700">
            Protect your <strong>{formatCurrency(tradeVolume)}</strong> trade volume for just <strong>$3.30/day</strong>
          </p>
        </div>

        {/* Urgency Messaging */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Crisis Escalation Warning</h4>
              <p className="text-sm text-red-800">
                Tariff announcements are increasing 300% month-over-month. Companies without 
                monitoring are discovering changes weeks after implementation, losing thousands in preventable costs.
              </p>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">What You Get:</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm">Real-time alerts for your specific HS codes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm">Crisis impact calculations for your trade volume</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm">Policy change analysis and recommendations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm">Personalized dashboard with your company data</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-bold text-green-900 mb-2">Cost Protection Analysis:</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>Daily Protection Cost: <strong>$3.30</strong></p>
              <p>Annual Trade Volume: <strong>{formatCurrency(tradeVolume)}</strong></p>
              <p>Protection Ratio: <strong>{protectionRatio.toFixed(3)}%</strong></p>
              <p className="pt-2 border-t border-green-200 font-semibold">
                Industry average insurance: 1-3% of protected value
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-orange-900">Crisis Alert Monitoring</h4>
            <div className="text-right">
              <p className="metric-value text-orange-600">$99<span className="text-sm">/month</span></p>
              <p className="text-sm text-orange-700">7-day free trial</p>
            </div>
          </div>
          <p className="text-sm text-orange-800 mb-4">
            Cancel anytime. No long-term contracts. First alert typically pays for 6+ months of service.
          </p>
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <Shield className="w-4 h-4" />
            <span>30-day money-back guarantee if not satisfied</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentStep(2)}
            className="flex-1 bg-orange-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-orange-700 transition-colors"
          >
            Start 7-Day Free Trial
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          By continuing, you agree to receive crisis alerts and can cancel anytime
        </p>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="section-title">
            Setup Your Crisis Alert Monitoring
          </h2>
          <p className="text-gray-600">
            7-day free trial • $99/month after trial • Cancel anytime
          </p>
        </div>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  value={subscriptionData.email}
                  onChange={(e) => updateSubscriptionData('email', e.target.value)}
                  placeholder="alerts@yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  value={subscriptionData.phone}
                  onChange={(e) => updateSubscriptionData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Company Confirmation */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Company Confirmation</h4>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none bg-gray-50"
              value={subscriptionData.company_name}
              onChange={(e) => updateSubscriptionData('company_name', e.target.value)}
              placeholder="Company name"
            />
          </div>

          {/* Trial Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Your 7-Day Free Trial Includes:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Immediate access to personalized crisis dashboard</li>
              <li>• Real-time monitoring setup for your HS codes</li>
              <li>• First week of alerts and analysis</li>
              <li>• Full platform features without restrictions</li>
            </ul>
          </div>
        </div>

        {/* Trial Terms */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Trial Terms:</strong> Your 7-day trial starts immediately. No charge during trial period. 
            After trial, $99/month unless cancelled. Cancel anytime via dashboard or email. 
            Full refund if cancelled within 30 days of first charge.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleStartSubscription}
            disabled={!subscriptionData.email || isProcessing}
            className="flex-1 bg-orange-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Setting Up Trial...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Start Free Trial
              </>
            )}
          </button>
          <button
            onClick={() => setCurrentStep(1)}
            className="px-6 py-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}