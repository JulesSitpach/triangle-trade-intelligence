/**
 * AlertImpactAnalysisDisplay - Professional strategic impact assessment display
 * Shows how new alerts impact existing strategic plan with USMCA 2026 scenarios
 */

import React, { useState, useEffect } from 'react';

export default function AlertImpactAnalysisDisplay({ data, consolidatedAlertsCount, onClose }) {
  // Load data IMMEDIATELY from localStorage or props
  const getInitialData = () => {
    try {
      const stored = localStorage.getItem('alert_impact_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🎯 AlertImpactAnalysisDisplay INITIAL load from localStorage:', parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    console.log('🎯 AlertImpactAnalysisDisplay using props:', data);
    return data;
  };

  const [displayData, setDisplayData] = useState(getInitialData);

  useEffect(() => {
    if (data && data !== displayData) {
      console.log('🎯 AlertImpactAnalysisDisplay updating with new props:', data);
      setDisplayData(data);

      // Save to localStorage when data changes
      try {
        localStorage.setItem('alert_impact_analysis', JSON.stringify(data));
        console.log('💾 Saved alert impact analysis to localStorage');
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }, [data, displayData]);

  if (!displayData) {
    console.log('❌ AlertImpactAnalysisDisplay: No data available');
    return null;
  }

  console.log('🎯 AlertImpactAnalysisDisplay rendering with:', displayData);

  return (
    <div style={{
      marginTop: '2rem',
      padding: '2.5rem',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      maxWidth: '900px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h4 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            margin: '0 0 0.5rem 0',
            color: '#111827',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Strategic Impact Assessment
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Based on {consolidatedAlertsCount || 0} active alert{consolidatedAlertsCount !== 1 ? 's' : ''} affecting your trade profile
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#374151',
              cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        fontSize: '1.0625rem',
        lineHeight: '1.75',
        color: '#1f2937',
        fontFamily: 'Georgia, "Times New Roman", serif'
      }}>
        {/* Alert Impact Summary */}
        {displayData.alert_impact_summary && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: '#92400e',
              marginBottom: '0.75rem'
            }}>
              ⚠️ How Alerts Change Your Strategic Priorities
            </p>
            <p style={{ margin: 0, fontSize: '1rem', color: '#78350f' }}>
              {displayData.alert_impact_summary}
            </p>
          </div>
        )}

        {/* Updated Priorities */}
        {displayData.updated_priorities && displayData.updated_priorities.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
              Revised Action Priorities:
            </p>
            {displayData.updated_priorities.map((priority, idx) => {
              const isUrgent = priority.includes('[URGENT]');
              const isNew = priority.includes('[NEW]');
              const cleanPriority = priority.replace(/\[URGENT\]|\[NEW\]/g, '').trim();

              return (
                <div key={idx} style={{
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  backgroundColor: isUrgent ? '#fef2f2' : '#f0f9ff',
                  border: `2px solid ${isUrgent ? '#ef4444' : '#3b82f6'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {isUrgent ? '🚨' : isNew ? '✨' : '📋'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      color: isUrgent ? '#dc2626' : '#1e40af',
                      marginBottom: '0.25rem',
                      fontSize: '0.9375rem'
                    }}>
                      {isUrgent ? '[URGENT]' : isNew ? '[NEW]' : ''} Priority {idx + 1}
                    </div>
                    <div style={{ fontSize: '0.9375rem', color: '#374151' }}>
                      {cleanPriority}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Critical Deadlines */}
        {displayData.updated_timeline && displayData.updated_timeline.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
              Critical Deadlines:
            </p>
            {displayData.updated_timeline.map((item, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #f59e0b',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '0.9375rem', color: '#374151', fontWeight: 500 }}>
                  📅 {item}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USMCA 2026 Contingency Scenarios */}
        {displayData.contingency_scenarios && displayData.contingency_scenarios.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '1.125rem' }}>
              USMCA 2026 Renegotiation Scenarios:
            </p>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Contingency planning for July 2026 USMCA review
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayData.contingency_scenarios.map((scenario, idx) => (
                <div key={idx} style={{
                  padding: '1.25rem',
                  backgroundColor: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>
                      Scenario {scenario.scenario}: {scenario.name}
                    </div>
                    <span style={{
                      backgroundColor: scenario.probability >= 50 ? '#dcfce7' : '#fef3c7',
                      color: scenario.probability >= 50 ? '#15803d' : '#b45309',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {scenario.probability}%
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                    {scenario.description}
                  </p>

                  <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    <strong>Your Action:</strong> {scenario.your_action}
                  </p>

                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                    <strong>Cost Impact:</strong> {scenario.cost_impact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Step This Week - Prominent CTA */}
        {displayData.next_step_this_week && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: '8px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: '#1e40af',
              marginBottom: '0.75rem'
            }}>
              🎯 Recommended Next Step (This Week)
            </p>
            <p style={{ margin: 0, fontSize: '1rem', color: '#1e3a8a' }}>
              {displayData.next_step_this_week}
            </p>
          </div>
        )}

        {/* Professional Disclaimer */}
        <p style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          fontSize: '0.875rem',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          <strong>Note:</strong> This strategic impact assessment is based on current government policy data and your specific trade profile. Policy changes occur with minimal notice. Consult with a licensed customs broker or trade attorney before making business decisions.
        </p>
      </div>
    </div>
  );
}
