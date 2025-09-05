/**
 * TariffSavings - Tariff savings analysis display
 * Shows potential savings from USMCA qualification
 */

import React from 'react';
import { DollarSign } from '../../Icons';

export default function TariffSavings({ results }) {
  if (!results?.savings) return null;

  const {
    annual_savings = 0,
    monthly_savings = 0,
    savings_percentage = 0,
    mfn_rate = 0,
    usmca_rate = 0
  } = results.savings;

  return (
    <div className="form-section">
      <div className="section-header">
        <DollarSign className="icon-sm" />
        <h3 className="form-section-title">Tariff Savings Analysis</h3>
      </div>
      <div className="savings-summary-card">
        <div className="savings-metrics-grid">
          <div className="savings-metric-card primary">
            <div className="metric-value success">
              ${annual_savings.toLocaleString()}
            </div>
            <div className="metric-label">Annual Savings USD</div>
          </div>
          <div className="savings-metric-card">
            <div className="metric-value">
              ${monthly_savings.toLocaleString()}
            </div>
            <div className="metric-label">Monthly Savings</div>
          </div>
          <div className="savings-metric-card">
            <div className="metric-value success">
              {savings_percentage.toFixed(2)}%
            </div>
            <div className="metric-label">Savings Rate</div>
          </div>
        </div>
        
        <div className="tariff-rates-comparison">
          <div className="rate-comparison-item">
            <span className="rate-label">MFN Tariff Rate:</span>
            <span className="rate-value warning">{mfn_rate}%</span>
          </div>
          <div className="rate-comparison-item">
            <span className="rate-label">USMCA Rate:</span>
            <span className="rate-value success">
              {usmca_rate !== undefined ? usmca_rate : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}