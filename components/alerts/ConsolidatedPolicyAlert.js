/**
 * ConsolidatedPolicyAlert Component
 * Shows intelligent consolidated alerts with calibrated urgency
 * Skips obvious advice, focuses on specific actionable insights
 */

import { useState } from 'react';

export default function ConsolidatedPolicyAlert({ consolidatedAlert, userProfile }) {
  const [showDetails, setShowDetails] = useState(false);

  // Map urgency to alert class
  const alertClass = consolidatedAlert.urgency === 'URGENT' ? 'alert-error' :
                    consolidatedAlert.urgency === 'HIGH' ? 'alert-warning' :
                    consolidatedAlert.urgency === 'MEDIUM' ? 'alert-info' :
                    'alert-info';

  return (
    <div className={`alert ${alertClass}`}>
      <div className="alert-content">
        {/* Title with Consolidation Badge */}
        <div className="alert-title">
          {consolidatedAlert.title}
          {consolidatedAlert.original_alert_count > 1 && (
            <span
              className="form-help"
              style={{ marginLeft: '8px', color: '#059669' }}
            >
              • Consolidated from {consolidatedAlert.original_alert_count} related policies
            </span>
          )}
        </div>

        {/* Urgency Level with Reasoning */}
        <div className="element-spacing">
          <div className="status-card" style={{
            backgroundColor: consolidatedAlert.urgency === 'URGENT' ? '#fee2e2' :
                            consolidatedAlert.urgency === 'HIGH' ? '#fef3c7' :
                            '#e0f2fe',
            borderLeft: `4px solid ${
              consolidatedAlert.urgency === 'URGENT' ? '#dc2626' :
              consolidatedAlert.urgency === 'HIGH' ? '#f59e0b' :
              '#3b82f6'
            }`
          }}>
            <div className="status-label">Urgency Level</div>
            <div className="status-value" style={{ fontWeight: 'bold' }}>
              {consolidatedAlert.urgency}
            </div>
            {consolidatedAlert.urgency_reasoning && (
              <div className="form-help" style={{ marginTop: '0.5rem' }}>
                {consolidatedAlert.urgency_reasoning}
              </div>
            )}
          </div>
        </div>

        {/* Consolidated Explanation */}
        {consolidatedAlert.explanation && (
          <div className="text-body" style={{ marginTop: '1rem', fontWeight: 500 }}>
            <strong>Impact on {userProfile.companyName}:</strong>
            <p style={{ marginTop: '0.5rem' }}>{consolidatedAlert.explanation}</p>
          </div>
        )}

        {/* Affected Components */}
        {consolidatedAlert.affected_components && consolidatedAlert.affected_components.length > 0 && (
          <div className="element-spacing">
            <div className="text-body">
              <strong>Your Affected Components:</strong>
            </div>
            <div className="status-grid" style={{ marginTop: '0.5rem' }}>
              {consolidatedAlert.affected_components.map((comp, idx) => (
                <div key={idx} className="status-card">
                  <div className="status-label">{comp.component}</div>
                  <div className="status-value">
                    {comp.percentage}% from {comp.origin}
                  </div>
                  {comp.hs_code && (
                    <div className="form-help">HS {comp.hs_code}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consolidated Financial Impact - THE MONEY SHOT */}
        {consolidatedAlert.consolidated_impact && (
          <div className="element-spacing">
            <div className="alert alert-warning" style={{ backgroundColor: '#fef3c7' }}>
              <div className="alert-content">
                <div className="alert-title" style={{ fontSize: '1.1rem' }}>
                  💰 Total Financial Impact (All Related Policies)
                </div>
                <div className="text-body" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginTop: '0.5rem' }}>
                  {consolidatedAlert.consolidated_impact.total_annual_cost}
                </div>
                {consolidatedAlert.consolidated_impact.breakdown && (
                  <div className="form-help" style={{ marginTop: '0.5rem' }}>
                    <strong>Breakdown:</strong> {consolidatedAlert.consolidated_impact.breakdown}
                  </div>
                )}
                {consolidatedAlert.consolidated_impact.stack_explanation && (
                  <div className="form-help" style={{ marginTop: '0.5rem' }}>
                    <strong>How costs stack:</strong> {consolidatedAlert.consolidated_impact.stack_explanation}
                  </div>
                )}
                <div className="form-help" style={{ marginTop: '0.5rem' }}>
                  Confidence: {consolidatedAlert.consolidated_impact.confidence || 'medium'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What You Might NOT Know (The Real Value) */}
        {consolidatedAlert.what_you_might_not_know && consolidatedAlert.what_you_might_not_know.length > 0 && (
          <div className="element-spacing">
            <div className="text-body">
              <strong>💡 What You Might NOT Know:</strong>
            </div>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              {consolidatedAlert.what_you_might_not_know.map((insight, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specific Action Items (Not Generic) */}
        {consolidatedAlert.specific_action_items && consolidatedAlert.specific_action_items.length > 0 && (
          <div className="element-spacing">
            <div className="text-body">
              <strong>✅ Specific Actions for You:</strong>
            </div>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              {consolidatedAlert.specific_action_items.map((action, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {action}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Toggle Details - Show what you probably already know */}
        <div className="hero-buttons" style={{ marginTop: '1rem' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-secondary"
          >
            {showDetails ? '▲ Hide' : '▼ Show'} Related Policies & Generic Advice
          </button>
          <button
            onClick={() => window.location.href = '/services/request-form'}
            className="btn-primary"
          >
            🎯 Get Expert Help
          </button>
        </div>

        {/* Details Section (what you probably already know) */}
        {showDetails && (
          <div className="element-spacing" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            {/* What you probably already know */}
            {consolidatedAlert.what_you_know && consolidatedAlert.what_you_know.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="text-body">
                  <strong>What You Probably Already Know:</strong>
                </div>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#6b7280' }}>
                  {consolidatedAlert.what_you_know.map((known, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                      {known}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related alerts consolidated */}
            {consolidatedAlert.related_alerts && consolidatedAlert.related_alerts.length > 0 && (
              <div>
                <div className="text-body">
                  <strong>Related Policy Changes Included:</strong>
                </div>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#6b7280' }}>
                  {consolidatedAlert.related_alerts.map((alertTitle, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                      {alertTitle}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
