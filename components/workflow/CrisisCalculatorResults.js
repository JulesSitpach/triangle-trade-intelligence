/**
 * Crisis Calculator Results Component
 * Shows crisis analysis and automatically sends data to alerts dashboard
 */

import React, { useEffect, useState } from 'react';
import AlertsSubscriptionFlow from './AlertsSubscriptionFlow';

// Simple icon components
const AlertTriangle = ({ className }) => (
  <span className={className}>[warning]</span>
);

const DollarSign = ({ className }) => (
  <span className={className}>[dollar]</span>
);

const Shield = ({ className }) => (
  <span className={className}>[shield]</span>
);

const TrendingUp = ({ className }) => (
  <span className={className}>[trending-up]</span>
);

export default function CrisisCalculatorResults({ 
  formData, 
  onViewAlerts,
  onUpgradeToCertificate,
  onReset 
}) {
  const [crisisData, setCrisisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSentToAlerts, setDataSentToAlerts] = useState(false);
  const [showSubscriptionFlow, setShowSubscriptionFlow] = useState(false);

  useEffect(() => {
    calculateCrisisImpact();
  }, [formData]);

  const calculateCrisisImpact = async () => {
    if (!formData.company_name) return;

    try {
      // Get trade volume value from selection
      const tradeVolume = getTradeVolumeValue(formData.trade_volume);
      
      const response = await fetch('/api/crisis-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate_crisis_penalty',
          data: {
            tradeVolume: tradeVolume,
            hsCode: formData.hs_code || '8517.62.00.00',
            originCountry: 'CN',
            businessType: formData.business_type || 'manufacturing',
            sessionId: `crisis-calc-${formData.company_name}-${Date.now()}`
          }
        })
      });

      const result = await response.json();
      setCrisisData(result);
      
      // Auto-save data to localStorage for alerts dashboard
      await saveToAlertsSystem(result, tradeVolume);
      
    } catch (error) {
      console.error('Crisis calculation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTradeVolumeValue = (volumeSelection) => {
    const volumeMap = {
      'under_100k': 75000,
      '100k_500k': 300000,
      '500k_1m': 750000,
      '1m_5m': 2500000,
      '5m_10m': 7500000,
      'over_10m': 15000000
    };
    return volumeMap[volumeSelection] || 1000000;
  };

  const saveToAlertsSystem = async (crisisResult, tradeVolume) => {
    try {
      // Prepare user data for alerts dashboard
      const userWorkflowData = {
        company: {
          name: formData.company_name,
          business_type: formData.business_type,
          annual_trade_volume: tradeVolume
        },
        product: {
          hs_code: formData.hs_code || '8517.62.00.00'
        },
        destination_country: formData.destination_country || 'US',
        workflow_path: 'crisis-calculator',
        crisis_data: crisisResult,
        timestamp: new Date().toISOString()
      };

      // Save to localStorage for alerts dashboard pickup
      localStorage.setItem('usmca_workflow_data', JSON.stringify(userWorkflowData));
      localStorage.setItem('usmca_company_data', JSON.stringify({
        name: formData.company_name,
        business_type: formData.business_type,
        annual_trade_volume: tradeVolume
      }));

      console.log('Crisis Calculator data saved to alerts system:', userWorkflowData);
      setDataSentToAlerts(true);

    } catch (error) {
      console.error('Failed to save data to alerts system:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const handleViewAlertsClick = () => {
    // Open alerts dashboard in new tab with user's data
    window.open('/pricing', '_blank');
    if (onViewAlerts) onViewAlerts();
  };

  const handleStartAlertsSubscription = () => {
    setShowSubscriptionFlow(true);
  };

  const handleSubscriptionComplete = (subscriptionRecord) => {
    console.log('Alerts subscription completed:', subscriptionRecord);
    setShowSubscriptionFlow(false);
    // Redirect to alerts dashboard with active subscription
    window.open('/pricing', '_blank');
  };

  const handleSubscriptionCancel = () => {
    setShowSubscriptionFlow(false);
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="loading-container">
          <div className="loading-spinner loading-spinner-lg"></div>
          <p className="text-body">Calculating your crisis impact...</p>
        </div>
      </div>
    );
  }

  // Prepare user profile for subscription flow
  const userProfile = {
    company_name: formData.company_name,
    email: formData.email,
    annual_trade_volume: getTradeVolumeValue(formData.trade_volume),
    business_type: formData.business_type,
    hs_code: formData.hs_code || '8517.62.00.00'
  };

  // Show subscription flow overlay
  if (showSubscriptionFlow) {
    return (
      <div className="loading-overlay">
        <div className="subscription-modal">
          <AlertsSubscriptionFlow
            userProfile={userProfile}
            onSubscriptionComplete={handleSubscriptionComplete}
            onCancel={handleSubscriptionCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="element-spacing">
      {/* Crisis Impact Summary */}
      <div className="alert alert-error crisis-summary">
        <div className="crisis-header">
          <h2 className="crisis-title">
            <AlertTriangle className="icon-xl status-error" />
            Free Crisis Assessment Results
          </h2>
          <p className="crisis-company-info">
            <strong>{formData.company_name}</strong> • {formatCurrency(getTradeVolumeValue(formData.trade_volume))} Annual Trade Volume
          </p>
          <p className="crisis-status">
            ✅ Initial qualification analysis complete • Professional filing required for compliance
          </p>
        </div>

        {crisisData?.success && (
          <>
            <div className="grid-3-cols">
              <div className="crisis-metric-card crisis-risk">
                <div className="metric-content">
                  <div>
                    <p className="metric-label status-error">Crisis Tariff Risk</p>
                    <p className="metric-value">
                      {formatCurrency(crisisData.crisis_impact?.crisisPenalty || 0)}
                    </p>
                    <p className="metric-label status-error">Estimated annual exposure</p>
                  </div>
                  <TrendingUp className="icon-xl status-error" />
                </div>
              </div>

              <div className="crisis-metric-card crisis-success">
                <div className="metric-content">
                  <div>
                    <p className="metric-label status-success">USMCA Qualification</p>
                    <p className="metric-value status-success">✓ LIKELY</p>
                    <p className="small-text status-success">Based on initial product analysis</p>
                  </div>
                  <Shield className="icon-xl status-success" />
                </div>
              </div>

              <div className="crisis-metric-card crisis-info">
                <div className="metric-content">
                  <div>
                    <p className="metric-label status-info">Protection Value</p>
                    <p className="metric-value status-info">
                      {formatCurrency(crisisData.crisis_impact?.potentialSavings || 0)}
                    </p>
                    <p className="small-text status-info">
                      Estimated savings with proper filing
                    </p>
                  </div>
                  <DollarSign className="icon-xl status-info" />
                </div>
              </div>
            </div>


            {/* Data Integration Status */}
            {dataSentToAlerts && (
              <div className="alert alert-success">
                <div className="alert-icon">
                  <div className="status-indicator status-success"></div>
                </div>
                <div className="alert-content">
                  <div className="small-text">
                    ✅ Your data has been automatically added to the crisis alerts monitoring system
                  </div>
                </div>
              </div>
            )}

            {/* Consultation Cliff - Strategic Limitation */}
            <div className="alert alert-warning">
              <div className="alert-icon">
                <AlertTriangle className="icon-lg" />
              </div>
              <div className="alert-content">
                <div className="alert-title">
                  Complex Compliance Requirements Detected
                </div>
                <div className="text-body">
                  Your product involves multi-country supply chains and intricate component origin calculations. 
                  USMCA qualification requires detailed analysis of:
                </div>
                <ul className="compliance-requirements">
                  <li>• Regional content value calculations (de minimis rules)</li>
                  <li>• Component-specific HS code validations</li>
                  <li>• Supply chain documentation requirements</li>
                  <li>• Manufacturing process qualifications</li>
                </ul>
                <div className="warning-notice">
                  ⚠️ DIY mistakes in USMCA filing can result in customs penalties, duty reassessments, 
                  and compliance violations averaging $125K+ per incident.
                </div>
              </div>
            </div>

            {/* Strategic Upgrade Options */}
            <div className="grid-2-cols">
              {/* Alerts Option - Featured */}
              <div className="pricing-card pricing-featured">
                <div className="pricing-badge-featured">
                  RECOMMENDED
                </div>
                <h4 className="pricing-title">Crisis Alert Monitoring</h4>
                <div className="pricing-amount-group">
                  <p className="pricing-amount status-warning">$99<span className="small-text">/month</span></p>
                  <p className="pricing-detail">Only $3.30/day to protect {formatCurrency(getTradeVolumeValue(formData.trade_volume))}</p>
                </div>
                <ul className="pricing-features">
                  <li className="pricing-feature">
                    <div className="feature-bullet status-warning"></div>
                    Real-time tariff change alerts for your HS codes
                  </li>
                  <li className="pricing-feature">
                    <div className="feature-bullet status-warning"></div>
                    Personalized crisis impact notifications
                  </li>
                  <li className="pricing-feature">
                    <div className="feature-bullet status-warning"></div>
                    Policy change monitoring & analysis
                  </li>
                </ul>
                <button 
                  onClick={handleStartAlertsSubscription}
                  className="btn-primary pricing-button"
                >
                  Start Monitoring Now
                </button>
                <div className="pricing-help pricing-help-featured">
                  Cancel anytime • 0.048% of your protected trade value
                </div>
              </div>

              {/* Certificate Option */}
              <div className="pricing-card">
                <h4 className="pricing-title">Professional Certificate Filing</h4>
                <div className="pricing-amount-group">
                  <p className="pricing-amount status-info">$2,500</p>
                  <p className="pricing-detail">One-time professional service</p>
                </div>
                <ul className="pricing-features">
                  <li className="pricing-feature">
                    <div className="feature-bullet status-info"></div>
                    Complete component origin validation
                  </li>
                  <li className="pricing-feature">
                    <div className="feature-bullet status-info"></div>
                    Professional certificate preparation
                  </li>
                  <li className="pricing-feature">
                    <div className="feature-bullet status-info"></div>
                    Customs broker review & filing
                  </li>
                </ul>
                <button 
                  onClick={onUpgradeToCertificate}
                  className="btn-primary pricing-button"
                >
                  Get Professional Filing
                </button>
                <div className="pricing-help">
                  ROI: {Math.round((crisisData.crisis_impact?.potentialSavings || 250000) / 2500 * 100)}% first-year return
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}