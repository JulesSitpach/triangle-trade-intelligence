/**
 * AlertImpactAnalysisDisplay - Portfolio Intelligence Report
 * Clean, simple display matching results page style (no boxes)
 */

import React, { useState, useEffect } from 'react';

export default function AlertImpactAnalysisDisplay({ data, consolidatedAlertsCount, onClose }) {
  const getInitialData = () => {
    try {
      const stored = localStorage.getItem('alert_impact_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🎯 AlertImpactAnalysisDisplay loaded:', parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    return data;
  };

  const [displayData, setDisplayData] = useState(getInitialData);

  useEffect(() => {
    if (data && data !== displayData) {
      console.log('🎯 AlertImpactAnalysisDisplay updating with new props');
      setDisplayData(data);
      try {
        localStorage.setItem('alert_impact_analysis', JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  }, [data, displayData]);

  if (!displayData) {
    return null;
  }

  return (
    <div style={{
      padding: '2.5rem',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            margin: '0 0 0.5rem 0',
            color: '#111827'
          }}>
            Portfolio Intelligence Report
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            Holistic assessment of your trade position and strategic opportunities
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
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Main Content */}
      <div style={{
        fontSize: '1rem',
        lineHeight: '1.6',
        color: '#1f2937'
      }}>

        {/* Executive Summary */}
        {displayData.executive_summary && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Executive Summary
            </h4>
            <p style={{ margin: 0, color: '#374151', lineHeight: '1.7' }}>
              {displayData.executive_summary}
            </p>
          </div>
        )}

        {/* Portfolio Risks */}
        {displayData.portfolio_risks && displayData.portfolio_risks.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Portfolio Risks
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
              {displayData.portfolio_risks.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategic Opportunities */}
        {displayData.portfolio_opportunities && displayData.portfolio_opportunities.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Strategic Opportunities
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
              {displayData.portfolio_opportunities.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Immediate Actions */}
        {displayData.immediate_actions && displayData.immediate_actions.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Immediate Actions (Next 30 Days)
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
              {displayData.immediate_actions.map((item, idx) => (
                <li key={idx} className="mb-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Monitoring Focus */}
        {displayData.monitoring_focus && (
          <div style={{ marginBottom: '0' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              What We Monitor for You
            </h4>
            <p style={{ margin: 0, color: '#374151', lineHeight: '1.7' }}>
              {displayData.monitoring_focus}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
