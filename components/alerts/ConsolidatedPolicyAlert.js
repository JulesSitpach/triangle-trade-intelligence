/**
 * ConsolidatedPolicyAlert Component
 * Shows intelligent consolidated alerts with calibrated urgency
 * Skips obvious advice, focuses on specific actionable insights
 */

import { useState } from 'react';

export default function ConsolidatedPolicyAlert({ consolidatedAlert, userProfile }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBrokerSummary, setShowBrokerSummary] = useState(true);

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

        {/* BROKER SUMMARY - Conversational Plain-English Summary */}
        {consolidatedAlert.broker_summary && (
          <div className="element-spacing">
            <div className="status-card" style={{
              backgroundColor: '#f0f9ff',
              borderLeft: '4px solid #3b82f6',
              cursor: 'pointer'
            }} onClick={() => setShowBrokerSummary(!showBrokerSummary)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="text-body" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  💬 BROKER SUMMARY
                </div>
                <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                  {showBrokerSummary ? '▼ Hide' : '▶ Show'}
                </button>
              </div>
              {showBrokerSummary && (
                <div className="text-body" style={{
                  marginTop: '1rem',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#1f2937',
                  whiteSpace: 'pre-wrap'
                }}>
                  {consolidatedAlert.broker_summary}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Urgency Level with Timeline and Effective Date */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div>
                <div className="status-label">Urgency Level</div>
                <div className="status-value" style={{ fontWeight: 'bold' }}>
                  {consolidatedAlert.urgency}
                </div>
              </div>
              {consolidatedAlert.timeline && (
                <div>
                  <div className="status-label">Timeline</div>
                  <div className="status-value" style={{ fontWeight: 'bold' }}>
                    {consolidatedAlert.timeline}
                  </div>
                </div>
              )}
              {consolidatedAlert.effective_date && (
                <div>
                  <div className="status-label">Effective Date</div>
                  <div className="status-value" style={{ fontWeight: 'bold', color: '#dc2626' }}>
                    {consolidatedAlert.effective_date}
                  </div>
                </div>
              )}
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
                {consolidatedAlert.consolidated_impact.confidence_explanation && (
                  <div className="status-card" style={{ marginTop: '0.75rem', backgroundColor: '#f0fdf4', padding: '0.75rem' }}>
                    <div className="form-help" style={{ fontSize: '0.875rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                      Confidence: {consolidatedAlert.consolidated_impact.confidence || 'medium'}
                    </div>
                    <div className="text-body" style={{ fontSize: '0.875rem', color: '#166534' }}>
                      {consolidatedAlert.consolidated_impact.confidence_explanation}
                    </div>
                  </div>
                )}
                {!consolidatedAlert.consolidated_impact.confidence_explanation && (
                  <div className="form-help" style={{ marginTop: '0.5rem' }}>
                    Confidence: {consolidatedAlert.consolidated_impact.confidence || 'medium'}
                  </div>
                )}
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

        {/* Mitigation Scenarios - Strategic Options Comparison */}
        {consolidatedAlert.mitigation_scenarios && consolidatedAlert.mitigation_scenarios.length > 0 && (
          <div className="element-spacing">
            <div className="text-body" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              <strong>🎯 Your Options (Side-by-Side Comparison):</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {consolidatedAlert.mitigation_scenarios.map((scenario, idx) => (
                <div key={idx} className="status-card" style={{
                  backgroundColor: scenario.recommended ? '#f0fdf4' : '#f9fafb',
                  border: scenario.recommended ? '2px solid #10b981' : '1px solid #e5e7eb',
                  padding: '1rem'
                }}>
                  {/* Scenario Header */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div className="status-label" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Option {idx + 1}
                    </div>
                    <div className="status-value" style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {scenario.title}
                      {scenario.recommended && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#10b981', fontWeight: 'normal' }}>
                          ⭐ Recommended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cost Impact */}
                  {scenario.cost_impact && (
                    <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '4px' }}>
                      <div className="form-help" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Cost Impact
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#92400e' }}>
                        {scenario.cost_impact}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {scenario.timeline && (
                    <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#e0f2fe', borderRadius: '4px' }}>
                      <div className="form-help" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Timeline
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                        {scenario.timeline}
                      </div>
                    </div>
                  )}

                  {/* Benefit */}
                  {scenario.benefit && (
                    <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f0fdf4', borderRadius: '4px' }}>
                      <div className="form-help" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Benefit
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#166534' }}>
                        {scenario.benefit}
                      </div>
                    </div>
                  )}

                  {/* Tradeoffs */}
                  {scenario.tradeoffs && scenario.tradeoffs.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="form-help" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        Consider:
                      </div>
                      <ul style={{ fontSize: '0.8125rem', paddingLeft: '1.25rem', margin: 0 }}>
                        {scenario.tradeoffs.map((tradeoff, tIdx) => (
                          <li key={tIdx} style={{ marginBottom: '0.25rem', color: '#6b7280' }}>
                            {tradeoff}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
