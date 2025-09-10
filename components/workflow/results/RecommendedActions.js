/**
 * RecommendedActions - Next steps and recommendations display
 * Shows professional recommendations based on results
 */

import React from 'react';

export default function RecommendedActions({ results }) {
  const showRecommendations = results?.usmca?.qualified && 
                             results?.savings && 
                             (results.savings?.annual_savings || 0) > 0;

  if (!showRecommendations) return null;

  return (
    <div className="element-spacing">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Recommended Next Steps</h4>
        </div>
        <div className="element-spacing">
          <div className="status-card success">
            <div className="header-actions">
              <span className="status-value success">✓</span>
              <span className="text-body">Download and complete the certificate template</span>
            </div>
          </div>
          <div className="status-card success">
            <div className="header-actions">
              <span className="status-value success">✓</span>
              <span className="text-body">Gather required documentation</span>
            </div>
          </div>
          <div className="status-card success">
            <div className="header-actions">
              <span className="status-value success">✓</span>
              <span className="text-body">Consult with customs broker for implementation</span>
            </div>
          </div>
          <div className="status-card success">
            <div className="header-actions">
              <span className="status-value success">✓</span>
              <span className="text-body">Set up supplier compliance procedures</span>
            </div>
          </div>
          {results?.trust_assessment?.expert_validation_required && (
            <div className="status-card info">
              <div className="header-actions">
                <span className="status-value info">✓</span>
                <span className="text-body">Consider expert validation for high-value transactions</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}