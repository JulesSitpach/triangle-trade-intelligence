/**
 * PERSONALIZED USMCA 2026 DISPLAY
 *
 * Shows analysis of how USMCA 2026 renegotiation affects THIS user's supply chain
 * - Their component exposure in dollars
 * - Specific risks to their components
 * - Strategic considerations for their situation
 * - What we're monitoring for them
 */

import React, { useState, useEffect } from 'react';

export default function PersonalizedUSMCA2026Display({ data, onClose }) {
  const getInitialData = () => {
    try {
      const stored = localStorage.getItem('personalized_usmca_2026_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🎯 PersonalizedUSMCA2026Display loaded:', parsed);
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
      console.log('🎯 PersonalizedUSMCA2026Display updating with new data');
      setDisplayData(data);
      try {
        localStorage.setItem('personalized_usmca_2026_analysis', JSON.stringify(data));
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
            USMCA 2026 Renegotiation: Your Supply Chain Impact
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            Personalized analysis based on your components, origins, and exposure
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

        {/* Executive Summary - PROMINENT AT TOP */}
        {displayData.executive_summary && (
          <div style={{
            marginBottom: '2.5rem',
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '4px'
          }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              margin: '0 0 1rem 0',
              color: '#92400e'
            }}>
              BOTTOM LINE FOR LEADERSHIP
            </h4>
            <p style={{
              margin: 0,
              color: '#78350f',
              lineHeight: '1.8',
              fontSize: '1.025rem',
              fontWeight: 500
            }}>
              {displayData.executive_summary}
            </p>
          </div>
        )}

        {/* Exposure Summary (fallback for older format) */}
        {!displayData.executive_summary && displayData.exposure_summary && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Your Renegotiation Exposure
            </h4>
            <p style={{ margin: 0, color: '#374151', lineHeight: '1.7' }}>
              {displayData.exposure_summary}
            </p>
          </div>
        )}

        {/* Component Risks */}
        {displayData.component_risks && displayData.component_risks.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Component Risk Breakdown
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
              {displayData.component_risks.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.75rem' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategic Considerations */}
        {displayData.strategic_considerations && displayData.strategic_considerations.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Strategic Considerations for Your Situation
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
              {displayData.strategic_considerations.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.75rem' }}>
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
              What We're Monitoring for You
            </h4>
            <p style={{ margin: 0, color: '#374151', lineHeight: '1.7', fontStyle: 'italic' }}>
              {displayData.monitoring_focus}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
