/**
 * ConsolidatedPolicyAlert Component
 * Shows intelligent consolidated alerts with calibrated urgency
 * Skips obvious advice, focuses on specific actionable insights
 */

import { useState } from 'react';

export default function ConsolidatedPolicyAlert({ consolidatedAlert, userProfile, userTier = 'Trial' }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBrokerSummary, setShowBrokerSummary] = useState(true);
  const [showConfidenceTooltip, setShowConfidenceTooltip] = useState(false);
  const [expandedScenarios, setExpandedScenarios] = useState(
    consolidatedAlert.mitigation_scenarios?.reduce((acc, scenario, idx) => {
      acc[idx] = scenario.recommended; // Expand recommended by default
      return acc;
    }, {}) || {}
  );
  const [completedActions, setCompletedActions] = useState({});

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

        {/* Urgency Box - Unified with Icons */}
        <div className="element-spacing">
          <div className="status-card" style={{
            backgroundColor: consolidatedAlert.urgency === 'URGENT' ? '#fee2e2' :
                            consolidatedAlert.urgency === 'HIGH' ? '#fef3c7' : '#e0f2fe',
            borderLeft: `4px solid ${consolidatedAlert.urgency === 'URGENT' ? '#dc2626' :
                                      consolidatedAlert.urgency === 'HIGH' ? '#f59e0b' : '#3b82f6'}`,
            padding: '1rem'
          }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem',
                         color: consolidatedAlert.urgency === 'URGENT' ? '#991b1b' :
                               consolidatedAlert.urgency === 'HIGH' ? '#92400e' : '#0c4a6e' }}>
              {consolidatedAlert.urgency === 'URGENT' ? '🔴' : consolidatedAlert.urgency === 'HIGH' ? '🟠' : '🔵'} {consolidatedAlert.urgency} URGENCY
            </div>
            {consolidatedAlert.timeline && (
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>⏰</span>
                <span className="text-body"><strong>Act within:</strong> {consolidatedAlert.timeline}</span>
              </div>
            )}
            {consolidatedAlert.effective_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>📅</span>
                <span className="text-body"><strong>Effective:</strong> {consolidatedAlert.effective_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Consolidated Financial Impact - THE MONEY SHOT */}
        {consolidatedAlert.consolidated_impact && (
          <div className="element-spacing">
            <div className="alert alert-warning" style={{ backgroundColor: '#fef3c7' }}>
              <div className="alert-content">
                <div className="alert-title" style={{ fontSize: '1.1rem' }}>
                  💰 FINANCIAL IMPACT
                </div>
                <div className="text-body" style={{ fontSize: '48px', fontWeight: 'bold', color: '#dc2626', marginTop: '0.5rem', lineHeight: '1.1' }}>
                  {consolidatedAlert.consolidated_impact.total_annual_cost}
                </div>
                <div className="form-help" style={{ marginTop: '0.25rem', marginBottom: '1rem' }}>
                  annually
                </div>

                {/* Visual Tree Breakdown */}
                {consolidatedAlert.consolidated_impact.breakdown && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Cost Breakdown:</div>
                    {consolidatedAlert.consolidated_impact.breakdown.split(',').map((item, idx, arr) => (
                      <div key={idx} style={{ paddingLeft: '1rem' }}>
                        {idx < arr.length - 1 ? '├─ ' : '└─ '}{item.trim()}
                      </div>
                    ))}
                  </div>
                )}

                {/* Compact Confidence with Tooltip */}
                {consolidatedAlert.consolidated_impact.confidence_explanation && (
                  <div style={{ marginTop: '1rem', position: 'relative' }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                      onMouseEnter={() => setShowConfidenceTooltip(true)}
                      onMouseLeave={() => setShowConfidenceTooltip(false)}
                      onClick={() => setShowConfidenceTooltip(!showConfidenceTooltip)}
                    >
                      Confidence: {consolidatedAlert.consolidated_impact.confidence || 'medium'} ⓘ
                    </button>
                    {showConfidenceTooltip && (
                      <div className="status-card" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '0.5rem',
                        backgroundColor: '#f0fdf4',
                        padding: '0.75rem',
                        maxWidth: '400px',
                        zIndex: 10,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        <div className="text-body" style={{ fontSize: '0.875rem', color: '#166534' }}>
                          <strong>Based on:</strong><br/>
                          {consolidatedAlert.consolidated_impact.confidence_explanation}
                        </div>
                      </div>
                    )}
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

        {/* Progress Tracker for Action Items */}
        {consolidatedAlert.specific_action_items && consolidatedAlert.specific_action_items.length > 0 && (
          <div className="element-spacing">
            <div className="text-body" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              <strong>📋 Your Progress:</strong>
            </div>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}>
              {consolidatedAlert.specific_action_items.map((action, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: idx < consolidatedAlert.specific_action_items.length - 1 ? '0.75rem' : 0,
                  paddingBottom: idx < consolidatedAlert.specific_action_items.length - 1 ? '0.75rem' : 0,
                  borderBottom: idx < consolidatedAlert.specific_action_items.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={completedActions[idx] || false}
                    onChange={() => setCompletedActions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    style={{ marginTop: '0.25rem', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div className="text-body" style={{
                      textDecoration: completedActions[idx] ? 'line-through' : 'none',
                      color: completedActions[idx] ? '#6b7280' : '#1f2937'
                    }}>
                      {action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mitigation Scenarios - Collapsible with Recommended Expanded */}
        {consolidatedAlert.mitigation_scenarios && consolidatedAlert.mitigation_scenarios.length > 0 && (
          <div className="element-spacing">
            <div className="text-body" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              <strong>🔄 YOUR OPTIONS</strong>
            </div>
            {consolidatedAlert.mitigation_scenarios.map((scenario, idx) => (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                <div
                  className="status-card"
                  style={{
                    backgroundColor: scenario.recommended ? '#f0fdf4' : '#f9fafb',
                    border: scenario.recommended ? '3px solid #10b981' : '1px solid #e5e7eb',
                    padding: '1rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedScenarios(prev => ({ ...prev, [idx]: !prev[idx] }))}
                >
                  {/* Scenario Header - Always Visible */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                        {scenario.recommended && <span style={{ color: '#10b981' }}>⭐ RECOMMENDED - </span>}
                        {scenario.title}
                      </div>
                      {scenario.cost_impact && (
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          💰 {scenario.cost_impact} | ⏰ {scenario.timeline || 'See details'}
                        </div>
                      )}
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                      {expandedScenarios[idx] ? '▲ Hide' : '▼ View Details'}
                    </button>
                  </div>

                  {/* Scenario Details - Collapsible */}
                  {expandedScenarios[idx] && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      {/* Cost Impact */}
                      {scenario.cost_impact && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div className="form-help" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            Cost Impact
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e' }}>
                            {scenario.cost_impact}
                          </div>
                        </div>
                      )}

                      {/* Benefit */}
                      {scenario.benefit && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div className="form-help" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            Result
                          </div>
                          <div className="text-body" style={{ color: '#166534' }}>
                            ✓ {scenario.benefit}
                          </div>
                        </div>
                      )}

                      {/* Tradeoffs */}
                      {scenario.tradeoffs && scenario.tradeoffs.length > 0 && (
                        <div>
                          <div className="form-help" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            ⚠ Consider:
                          </div>
                          <ul style={{ fontSize: '0.875rem', paddingLeft: '1.25rem', margin: 0 }}>
                            {scenario.tradeoffs.map((tradeoff, tIdx) => (
                              <li key={tIdx} style={{ marginBottom: '0.25rem', color: '#6b7280' }}>
                                {tradeoff}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Section (what you probably already know) - removed toggle, always hidden */}
        {false && (
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
