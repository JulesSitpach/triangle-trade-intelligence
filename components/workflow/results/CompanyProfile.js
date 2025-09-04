/**
 * CompanyProfile - Company summary display component
 * Clean, focused display of company information
 */

import React from 'react';

export default function CompanyProfile({ results }) {
  if (!results?.company) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Company Profile</h3>
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Company:</span>
            <span className="font-semibold text-gray-900">{results.company.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Business Type:</span>
            <span className="font-semibold text-gray-900">{results.company.business_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Trade Volume:</span>
            <span className="font-semibold text-gray-900">{results.company.trade_volume}</span>
          </div>
        </div>
      </div>
    </div>
  );
}