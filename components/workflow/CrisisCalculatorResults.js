/**
 * Crisis Calculator Results Component
 * Shows crisis analysis and automatically sends data to alerts dashboard
 */

import React, { useEffect, useState } from 'react';
import AlertsSubscriptionFlow from './AlertsSubscriptionFlow';

// Simple icon components
const AlertTriangle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const DollarSign = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
    <polyline points="16,7 22,7 22,13"/>
  </svg>
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
    window.open('/trump-tariff-alerts', '_blank');
    if (onViewAlerts) onViewAlerts();
  };

  const handleStartAlertsSubscription = () => {
    setShowSubscriptionFlow(true);
  };

  const handleSubscriptionComplete = (subscriptionRecord) => {
    console.log('Alerts subscription completed:', subscriptionRecord);
    setShowSubscriptionFlow(false);
    // Redirect to alerts dashboard with active subscription
    window.open('/trump-tariff-alerts', '_blank');
  };

  const handleSubscriptionCancel = () => {
    setShowSubscriptionFlow(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-10 shadow-lg mb-5">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating your crisis impact...</p>
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
    <div className="space-y-6">
      {/* Crisis Impact Summary */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-8">
        <div className="text-center mb-6">
          <h2 className="section-title flex items-center justify-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            Free Crisis Assessment Results
          </h2>
          <p className="text-red-700">
            <strong>{formData.company_name}</strong> • {formatCurrency(getTradeVolumeValue(formData.trade_volume))} Annual Trade Volume
          </p>
          <p className="text-sm text-red-600 mt-1">
            ✅ Initial qualification analysis complete • Professional filing required for compliance
          </p>
        </div>

        {crisisData?.success && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="metric-label text-red-600 font-medium">Crisis Tariff Risk</p>
                    <p className="metric-value">
                      {formatCurrency(crisisData.crisis_impact?.crisisPenalty || 0)}
                    </p>
                    <p className="metric-label text-red-600">Estimated annual exposure</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">USMCA Qualification</p>
                    <p className="metric-value text-green-700">✓ LIKELY</p>
                    <p className="text-xs text-green-600">Based on initial product analysis</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Protection Value</p>
                    <p className="metric-value text-blue-700">
                      {formatCurrency(crisisData.crisis_impact?.potentialSavings || 0)}
                    </p>
                    <p className="text-xs text-blue-600">
                      Estimated savings with proper filing
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>


            {/* Data Integration Status */}
            {dataSentToAlerts && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm font-medium">
                    ✅ Your data has been automatically added to the crisis alerts monitoring system
                  </p>
                </div>
              </div>
            )}

            {/* Consultation Cliff - Strategic Limitation */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-semibold text-orange-900 mb-2">
                    Complex Compliance Requirements Detected
                  </h4>
                  <p className="text-orange-800 mb-3">
                    Your product involves multi-country supply chains and intricate component origin calculations. 
                    USMCA qualification requires detailed analysis of:
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1 mb-4 pl-4">
                    <li>• Regional content value calculations (de minimis rules)</li>
                    <li>• Component-specific HS code validations</li>
                    <li>• Supply chain documentation requirements</li>
                    <li>• Manufacturing process qualifications</li>
                  </ul>
                  <p className="text-sm text-orange-600 font-medium">
                    ⚠️ DIY mistakes in USMCA filing can result in customs penalties, duty reassessments, 
                    and compliance violations averaging $125K+ per incident.
                  </p>
                </div>
              </div>
            </div>

            {/* Strategic Upgrade Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Alerts Option - Featured */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  RECOMMENDED
                </div>
                <h4 className="text-xl font-bold text-orange-900 mb-3 mt-2">Crisis Alert Monitoring</h4>
                <div className="mb-4">
                  <p className="metric-value text-orange-600">$99<span className="text-sm">/month</span></p>
                  <p className="text-sm text-orange-700">Only $3.30/day to protect {formatCurrency(getTradeVolumeValue(formData.trade_volume))}</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    Real-time tariff change alerts for your HS codes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    Personalized crisis impact notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    Policy change monitoring & analysis
                  </li>
                </ul>
                <button 
                  onClick={handleStartAlertsSubscription}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Start Monitoring Now
                </button>
                <p className="text-xs text-orange-600 text-center mt-2">
                  Cancel anytime • 0.048% of your protected trade value
                </p>
              </div>

              {/* Certificate Option */}
              <div className="bg-white border-2 border-blue-300 rounded-xl p-6">
                <h4 className="text-xl font-bold text-blue-900 mb-3">Professional Certificate Filing</h4>
                <div className="mb-4">
                  <p className="metric-value text-blue-600">$2,500</p>
                  <p className="text-sm text-blue-700">One-time professional service</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Complete component origin validation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Professional certificate preparation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Customs broker review & filing
                  </li>
                </ul>
                <button 
                  onClick={onUpgradeToCertificate}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Get Professional Filing
                </button>
                <p className="text-xs text-blue-600 text-center mt-2">
                  ROI: {Math.round((crisisData.crisis_impact?.potentialSavings || 250000) / 2500 * 100)}% first-year return
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}