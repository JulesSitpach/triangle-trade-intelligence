/**
 * Alerts Subscription Flow Component
 * Handles $99/month subscription signup with crisis alert monitoring
 * Strategic conversion funnel with urgency messaging
 */

import React, { useState, useEffect } from 'react';

// Simple icon components
const AlertTriangle = ({ className }) => (
  <span className={className}>[warning]</span>
);

const CreditCard = ({ className }) => (
  <span className={className}>[credit-card]</span>
);

const Shield = ({ className }) => (
  <span className={className}>[shield]</span>
);

const CheckIcon = ({ className }) => (
  <span className={className}>[check]</span>
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
  const tradeVolume = userProfile?.trade_volume || 1000000;
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
      <div className="form-section">
        <div className="dashboard-header">
          <div className="content-card-icon certificates">
            <AlertTriangle className="icon-lg" />
          </div>
          <h1 className="dashboard-title">
            Crisis Alert Monitoring
          </h1>
          <p className="text-body">
            Protect your <strong>{formatCurrency(tradeVolume)}</strong> trade volume for just <strong>$3.30/day</strong>
          </p>
        </div>

        {/* Urgency Messaging */}
        <div className="alert alert-error">
          <div className="alert-icon">
            <AlertTriangle className="icon-md" />
          </div>
          <div className="alert-content">
            <div className="alert-title">Crisis Escalation Warning</div>
            <div className="text-body">
              Tariff announcements are increasing 300% month-over-month. Companies without 
              monitoring are discovering changes weeks after implementation, losing thousands in preventable costs.
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="grid-2-cols">
          <div className="element-spacing">
            <h4 className="card-title">What You Get:</h4>
            <ul className="pricing-features">
              <li className="pricing-feature">
                <CheckIcon className="icon-sm status-success" />
                <span className="small-text">Real-time alerts for your specific HS codes</span>
              </li>
              <li className="pricing-feature">
                <CheckIcon className="icon-sm status-success" />
                <span className="small-text">Crisis impact calculations for your trade volume</span>
              </li>
              <li className="pricing-feature">
                <CheckIcon className="icon-sm status-success" />
                <span className="small-text">Policy change analysis and recommendations</span>
              </li>
              <li className="pricing-feature">
                <CheckIcon className="icon-sm status-success" />
                <span className="small-text">Personalized dashboard with your company data</span>
              </li>
            </ul>
          </div>

          <div className="alert alert-success">
            <div className="alert-content">
              <div className="alert-title">Cost Protection Analysis:</div>
              <div className="small-text element-spacing">
                <p>Daily Protection Cost: <strong>$3.30</strong></p>
                <p>Annual Trade Volume: <strong>{formatCurrency(tradeVolume)}</strong></p>
                <p>Protection Ratio: <strong>{protectionRatio.toFixed(3)}%</strong></p>
                <p className="status-success">
                  Industry average insurance: 1-3% of protected value
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="alert alert-warning">
          <div className="pricing-header">
            <h4 className="pricing-title">Crisis Alert Monitoring</h4>
            <div className="pricing-amount-group">
              <p className="pricing-amount status-warning">$99<span className="small-text">/month</span></p>
              <p className="pricing-detail">7-day free trial</p>
            </div>
          </div>
          <p className="text-body">
            Cancel anytime. No long-term contracts. First alert typically pays for 6+ months of service.
          </p>
          <div className="pricing-feature">
            <Shield className="icon-sm" />
            <span className="status-success">30-day money-back guarantee if not satisfied</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="dashboard-actions">
          <button
            onClick={() => setCurrentStep(2)}
            className="btn-primary"
          >
            Start 7-Day Free Trial
          </button>
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Maybe Later
          </button>
        </div>

        <div className="form-help">
          By continuing, you agree to receive crisis alerts and can cancel anytime
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="form-section">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Setup Your Crisis Alert Monitoring
          </h1>
          <p className="text-body">
            7-day free trial • $99/month after trial • Cancel anytime
          </p>
        </div>

        <div className="element-spacing">
          {/* Contact Information */}
          <div className="form-section">
            <h4 className="form-section-title">Contact Information</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label required">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={subscriptionData.email}
                  onChange={(e) => updateSubscriptionData('email', e.target.value)}
                  placeholder="alerts@yourcompany.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={subscriptionData.phone}
                  onChange={(e) => updateSubscriptionData('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Company Confirmation */}
          <div className="form-section">
            <h4 className="form-section-title">Company Confirmation</h4>
            <input
              type="text"
              className="form-input"
              value={subscriptionData.company_name}
              onChange={(e) => updateSubscriptionData('company_name', e.target.value)}
              placeholder="Company name"
            />
          </div>

          {/* Trial Information */}
          <div className="alert alert-success">
            <div className="alert-content">
              <div className="alert-title">Your 7-Day Free Trial Includes:</div>
              <ul className="small-text element-spacing">
                <li>• Immediate access to personalized crisis dashboard</li>
                <li>• Real-time monitoring setup for your HS codes</li>
                <li>• First week of alerts and analysis</li>
                <li>• Full platform features without restrictions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trial Terms */}
        <div className="alert alert-info">
          <div className="alert-content">
            <div className="text-body">
              <strong>Trial Terms:</strong> Your 7-day trial starts immediately. No charge during trial period. 
              After trial, $99/month unless cancelled. Cancel anytime via dashboard or email. 
              Full refund if cancelled within 30 days of first charge.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="dashboard-actions">
          <button
            onClick={handleStartSubscription}
            disabled={!subscriptionData.email || isProcessing}
            className="btn-primary"
          >
            {isProcessing ? (
              <>
                <div className="loading-spinner"></div>
                Setting Up Trial...
              </>
            ) : (
              <>
                <Shield className="icon-md" />
                Start Free Trial
              </>
            )}
          </button>
          <button
            onClick={() => setCurrentStep(1)}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}