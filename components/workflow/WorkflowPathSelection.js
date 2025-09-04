/**
 * Workflow Path Selection Component
 * Shows pricing options after users have provided all product data
 * Free Analysis vs $99/month Alerts vs $2,500 Certificate
 */

import React from 'react';

// Simple icon components
const CalculatorIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="9" y2="18"/>
    <line x1="12" y1="18" x2="16" y2="18"/>
  </svg>
);

const AlertIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

export default function WorkflowPathSelection({ 
  formData, 
  onSelectFreeAnalysis, 
  onSelectAlertsSubscription,
  onSelectCertificate 
}) {
  // Calculate estimated trade volume for messaging
  const getTradeVolumeDisplay = () => {
    const volumeMap = {
      'under_100k': '$75K',
      '100k_500k': '$300K', 
      '500k_1m': '$750K',
      '1m_5m': '$2.5M',
      '5m_10m': '$7.5M',
      'over_10m': '$15M+'
    };
    return volumeMap[formData.trade_volume] || '$1M';
  };

  const tradeVolume = getTradeVolumeDisplay();

  return (
    <div className="bg-white rounded-xl p-10 shadow-lg mb-5">
      <div className="text-center mb-8">
        <h2 className="section-title">
          Choose Your Protection Level
        </h2>
        <p className="text-lg text-gray-700">
          You've provided all the data we need for <strong>{formData.company_name}</strong>
        </p>
        <p className="text-gray-600">
          Annual Trade Volume: <span className="font-semibold text-blue-600">{tradeVolume}</span> • 
          Product: <span className="font-semibold text-blue-600">{formData.product_description || 'Product Analysis'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Free Analysis */}
        <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-colors relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
            FREE
          </div>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalculatorIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Crisis Risk Analysis</h3>
            <p className="metric-value text-green-600">$0</p>
            <p className="text-gray-600 text-sm">One-time assessment</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm">Crisis penalty calculation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm">USMCA savings estimate</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm">Tariff risk breakdown</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm">Basic recommendations</span>
            </li>
          </ul>

          <button
            onClick={onSelectFreeAnalysis}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Get Free Analysis
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Perfect for understanding your risk
          </p>
        </div>

        {/* Alerts Subscription - FEATURED */}
        <div className="border-2 border-orange-400 rounded-xl p-6 hover:border-orange-500 transition-colors relative bg-orange-50">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
            MOST POPULAR
          </div>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Crisis Alert Monitoring</h3>
            <div className="mb-2">
              <p className="metric-value text-orange-600">$99<span className="text-sm text-gray-600">/month</span></p>
              <p className="text-sm text-orange-700 font-medium">Only $3.30/day</p>
            </div>
            <p className="text-gray-600 text-sm">Ongoing protection</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">Everything in Free Analysis</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Real-time tariff change alerts</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Personalized crisis dashboard</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Policy change notifications</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm">HS code specific monitoring</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm">Cancel anytime</span>
            </li>
          </ul>

          <button
            onClick={onSelectAlertsSubscription}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Start Alert Monitoring
          </button>
          
          <p className="text-xs text-orange-700 text-center mt-3 font-medium">
            Never miss a trade policy change again
          </p>
        </div>

        {/* Professional Certificate */}
        <div className="border-2 border-blue-300 rounded-xl p-6 hover:border-blue-400 transition-colors relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
            PROFESSIONAL
          </div>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">USMCA Certificate</h3>
            <p className="metric-value text-blue-600">$2,500</p>
            <p className="text-gray-600 text-sm">One-time professional service</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold">Everything in Alert Monitoring</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Component origin validation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Professional certificate creation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Customs broker review</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Ready-to-file documentation</span>
            </li>
          </ul>

          <button
            onClick={onSelectCertificate}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Professional Certificate
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Complete compliance solution
          </p>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="mt-12 p-6 bg-gray-50 rounded-xl">
        <h4 className="text-lg font-bold text-gray-900 mb-3 text-center">
          Why Companies Choose Alert Monitoring
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
          <div className="text-center">
            <div className="font-semibold text-orange-600 mb-1">Policy Changes Daily</div>
            <p>Trade policies change constantly. New tariffs, USMCA modifications, and regulatory updates happen weekly.</p>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600 mb-1">$99 vs $250K Risk</div>
            <p>Pay just 0.48% of your protected value. Most business insurance costs 1-3% of protected assets.</p>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600 mb-1">Peace of Mind</div>
            <p>Sleep well knowing we're watching for changes that could cost your business hundreds of thousands.</p>
          </div>
        </div>
      </div>
    </div>
  );
}