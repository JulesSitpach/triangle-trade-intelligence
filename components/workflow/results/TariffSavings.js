/**
 * TariffSavings - Tariff savings analysis display
 * Shows potential savings from USMCA qualification
 */

import React from 'react';

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
    <div className="mb-8">
      <h3 className="card-title">Tariff Savings Analysis</h3>
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="metric-value-large text-green-800">
              ${annual_savings.toLocaleString()}
            </div>
            <div className="metric-label font-medium">Annual Savings USD</div>
          </div>
          <div className="text-center">
            <div className="metric-value text-green-700">
              ${monthly_savings.toLocaleString()}
            </div>
            <div className="metric-label font-medium">Monthly Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700 mb-2">
              {savings_percentage.toFixed(2)}%
            </div>
            <div className="text-sm font-medium text-gray-600">Savings Rate</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">MFN Tariff Rate:</span>
            <span className="font-bold text-red-600">{mfn_rate}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">USMCA Rate:</span>
            <span className="font-bold text-green-600">
              {usmca_rate !== undefined ? usmca_rate : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}