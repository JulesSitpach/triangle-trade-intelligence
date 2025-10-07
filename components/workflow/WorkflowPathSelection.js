/**
 * Workflow Path Selection Component
 * Shows pricing options after users have provided all product data
 * Free Analysis vs $99/month Alerts vs $2,500 Certificate
 */

import React from 'react';

// Icons removed - no longer using icon placeholders

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
    <div className="form-section">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Choose Your Protection Level
        </h1>
        <p className="text-body">
          You've provided all the data we need for <strong>{formData.company_name}</strong>
        </p>
        <p className="text-muted">
          Annual Trade Volume: <span className="status-info">{tradeVolume}</span> • 
          Product: <span className="status-info">{formData.product_description || 'Product Analysis'}</span>
        </p>
      </div>

      <div className="grid-3-cols">
        
        {/* Free Analysis */}
        <div className="content-card analysis">
          <div className="pricing-badge-free">
            FREE
          </div>
          
          <div className="pricing-header">
            <div className="content-card-icon analysis">
            </div>
            <h3 className="content-card-title">Crisis Risk Analysis</h3>
            <p className="pricing-amount status-success">$0</p>
            <p className="small-text">One-time assessment</p>
          </div>

          <ul className="pricing-features">
            <li className="pricing-feature">
              <span className="small-text">Crisis penalty calculation</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">USMCA savings estimate</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Tariff risk breakdown</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Basic recommendations</span>
            </li>
          </ul>

          <button
            onClick={onSelectFreeAnalysis}
            className="btn-primary pricing-button"
          >
            Get Free Analysis
          </button>
          
          <div className="pricing-help">
            Perfect for understanding your risk
          </div>
        </div>

        {/* Alerts Subscription - FEATURED */}
        <div className="content-card certificates pricing-featured">
          <div className="pricing-badge-featured">
            MOST POPULAR
          </div>
          
          <div className="pricing-header">
            <div className="content-card-icon certificates">
            </div>
            <h3 className="content-card-title">Crisis Alert Monitoring</h3>
            <div className="pricing-amount-group">
              <p className="pricing-amount status-warning">$99<span className="small-text">/month</span></p>
              <p className="pricing-detail">Only $3.30/day</p>
            </div>
            <p className="small-text">Ongoing protection</p>
          </div>

          <ul className="pricing-features">
            <li className="pricing-feature">
              <span className="small-text pricing-feature-highlight">Everything in Free Analysis</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Real-time tariff change alerts</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Personalized crisis dashboard</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Policy change notifications</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">HS code specific monitoring</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Cancel anytime</span>
            </li>
          </ul>

          <button
            onClick={onSelectAlertsSubscription}
            className="btn-primary pricing-button"
          >
            Start Alert Monitoring
          </button>
          
          <div className="pricing-help pricing-help-featured">
            Never miss a trade policy change again
          </div>
        </div>

        {/* Professional Certificate */}
        <div className="content-card compliance">
          <div className="pricing-badge-professional">
            PROFESSIONAL
          </div>
          
          <div className="pricing-header">
            <div className="content-card-icon compliance">
            </div>
            <h3 className="content-card-title">USMCA Certificate</h3>
            <p className="pricing-amount status-info">$2,500</p>
            <p className="small-text">One-time professional service</p>
          </div>

          <ul className="pricing-features">
            <li className="pricing-feature">
              <span className="small-text pricing-feature-highlight">Everything in Alert Monitoring</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Component origin validation</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Professional certificate creation</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Customs broker review</span>
            </li>
            <li className="pricing-feature">
              <span className="small-text">Ready-to-file documentation</span>
            </li>
          </ul>

          <button
            onClick={onSelectCertificate}
            className="btn-primary pricing-button"
          >
            Get Professional Certificate
          </button>
          
          <div className="pricing-help">
            Complete compliance solution
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="alert alert-info">
        <div className="alert-content">
          <div className="alert-title">
            Why Companies Choose Alert Monitoring
          </div>
        </div>
        <div className="grid-3-cols">
          <div className="value-prop">
            <div className="value-prop-title">Policy Changes Daily</div>
            <p className="text-body">Trade policies change constantly. New tariffs, USMCA modifications, and regulatory updates happen weekly.</p>
          </div>
          <div className="value-prop">
            <div className="value-prop-title">$99 vs $250K Risk</div>
            <p className="text-body">Pay just 0.48% of your protected value. Most business insurance costs 1-3% of protected assets.</p>
          </div>
          <div className="value-prop">
            <div className="value-prop-title">Peace of Mind</div>
            <p className="text-body">Sleep well knowing we're watching for changes that could cost your business hundreds of thousands.</p>
          </div>
        </div>
      </div>
    </div>
  );
}