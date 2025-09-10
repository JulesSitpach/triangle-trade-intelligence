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
    <div className="element-spacing">
      {/* Prominent Annual Savings Highlight */}
      <div className="alert alert-success">
        <div className="alert-content">
          <div className="alert-title">
            <DollarSign className="icon-sm" />
            Potential Annual Tariff Savings
          </div>
          <div className="calculator-metric-value success">
            ${annual_savings.toLocaleString()}
          </div>
          <div className="text-body">
            Through USMCA qualification ({savings_percentage.toFixed(1)}% savings rate)
          </div>
        </div>
      </div>

      {/* Detailed Analysis Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tariff Rate Comparison</h3>
        </div>
        <div className="status-grid">
          <div className="status-card">
            <div className="status-label">Standard MFN Rate</div>
            <div className="status-value warning">{mfn_rate}%</div>
          </div>
          <div className="status-card success">
            <div className="status-label">USMCA Preferential Rate</div>
            <div className="status-value success">{usmca_rate !== undefined ? usmca_rate : 0}%</div>
          </div>
          <div className="status-card">
            <div className="status-label">Monthly Savings</div>
            <div className="status-value">${monthly_savings.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}