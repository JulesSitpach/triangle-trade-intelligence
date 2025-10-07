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
    <div className="card-content">
      {/* Annual Savings Highlight */}
      <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f0fdf4', borderRadius: '4px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '0.5rem' }}>Estimated Annual Savings</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#15803d', marginBottom: '0.5rem' }}>
          ${annual_savings.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#166534' }}>
          {savings_percentage.toFixed(1)}% tariff savings through USMCA qualification
        </div>
      </div>

      {/* Tariff Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Without USMCA</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{mfn_rate}%</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>With USMCA</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{usmca_rate !== undefined ? usmca_rate : 0}%</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Monthly Savings</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>${monthly_savings.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}