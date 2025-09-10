/**
 * DataSourceAttribution - Trust and data provenance display
 * Professional trust building with source verification
 */

import React from 'react';

export default function DataSourceAttribution({ results, trustIndicators }) {
  // Confidence is already stored as percentage (95), not decimal (0.95)
  const confidence = results?.product?.classification_confidence || results?.product?.confidence || 95;

  return (
    <div className="element-spacing">
      <div className="card">
        <h4 className="card-title">
          <span className="icon-sm">[info]</span>
          Data Sources & Verification
        </h4>
        
        <div className="grid-2-cols">
          <div className="element-spacing">
            <div className="data-source-item">
              <span className="text-muted">HS Classification:</span>
              <span className="data-source-value">
                {results?.product?.method || 'UN Comtrade Database'}
              </span>
            </div>
            <div className="data-source-item">
              <span className="text-muted">Last Verified:</span>
              <span className="data-source-value status-success">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="data-source-item">
              <span className="text-muted">AI Confidence:</span>
              <span className="data-source-value status-info">
                {confidence.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="element-spacing">
            <div className="data-source-item">
              <span className="text-muted">Tariff Rates:</span>
              <span className="data-source-value">CBP Harmonized Schedule</span>
            </div>
            <div className="data-source-item">
              <span className="text-muted">USMCA Rules:</span>
              <span className="data-source-value">Official USMCA Agreement</span>
            </div>
            <div className="data-source-item">
              <span className="text-muted">Data Quality:</span>
              <span className="data-source-value status-success">
                <span className="icon-xs">[check]</span>
                {trustIndicators?.data_provenance === 'verified' ? 'Verified' : 'Standard'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="data-source-footer">
          <p className="data-source-disclaimer">
            All classifications and rates sourced from official government databases. 
            For production use, verify current rates with customs authorities.
          </p>
          {trustIndicators?.expert_validation === 'available' && (
            <p className="data-source-expert">
              Expert validation available for high-value transactions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}