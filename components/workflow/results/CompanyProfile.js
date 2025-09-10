/**
 * CompanyProfile - Company summary display component
 * Clean, focused display of company information
 */

import React from 'react';

export default function CompanyProfile({ results }) {
  if (!results?.company) return null;

  return (
    <div className="element-spacing">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Company Profile</h3>
        </div>
        <div className="status-grid">
          <div className="header-actions">
            <span className="form-label">Company:</span>
            <span className="status-value">{results.company.name}</span>
          </div>
          <div className="header-actions">
            <span className="form-label">Business Type:</span>
            <span className="status-value">{results.company.business_type}</span>
          </div>
          <div className="header-actions">
            <span className="form-label">Trade Volume:</span>
            <span className="status-value">{results.company.trade_volume}</span>
          </div>
        </div>
      </div>
    </div>
  );
}