/**
 * ExecutiveSummaryDisplay - Simple executive advisory for Results page
 * Focuses on the user's specific business case and actionable recommendations
 */

import React, { useState, useEffect } from 'react';

export default function ExecutiveSummaryDisplay({ data, onClose }) {
  const [displayData, setDisplayData] = useState(null);

  useEffect(() => {
    // BYPASS props - read directly from localStorage
    try {
      const stored = localStorage.getItem('usmca_workflow_results');
      if (stored) {
        const parsed = JSON.parse(stored);
        const executive = parsed.detailed_analysis;
        console.log('🎯 ExecutiveSummaryDisplay reading from localStorage:', executive);
        setDisplayData(executive);
      } else if (data) {
        console.log('🎯 ExecutiveSummaryDisplay using props:', data);
        setDisplayData(data);
      }
    } catch (e) {
      console.error('Failed to read executive summary:', e);
      setDisplayData(data);
    }
  }, [data]);

  if (!displayData) {
    console.log('❌ ExecutiveSummaryDisplay: No data available');
    return null;
  }

  console.log('🎯 ExecutiveSummaryDisplay rendering with:', displayData);

  return (
    <div style={{
      marginTop: '1.5rem',
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
            Executive Trade Advisory
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Strategic analysis for your supply chain
          </p>
        </div>

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
      </div>

      {/* Executive Letter Content */}
      <div style={{
        fontSize: '1.0625rem',
        lineHeight: '1.75',
        color: '#1f2937',
        fontFamily: 'Georgia, "Times New Roman", serif'
      }}>
        {/* Situation Brief */}
        {displayData?.situation_brief && (
          <p style={{marginBottom: '1.75rem'}}>
            {displayData.situation_brief}
          </p>
        )}

        {/* The Problem */}
        {displayData?.problem && (
          <p style={{marginBottom: '1.75rem'}}>
            <strong>The Problem:</strong> {displayData.problem}
          </p>
        )}

        {/* Root Cause */}
        {displayData?.root_cause && (
          <p style={{marginBottom: '1.75rem'}}>
            <strong>Root Cause:</strong> {displayData.root_cause}
          </p>
        )}

        {/* Annual Impact */}
        {displayData?.annual_impact && (
          <p style={{marginBottom: '1.75rem'}}>
            <strong>Annual Impact:</strong> {displayData.annual_impact}
          </p>
        )}

        {/* Why Act Now */}
        {displayData?.why_now && (
          <p style={{marginBottom: '1.75rem'}}>
            <strong>Why Act Now:</strong> {displayData.why_now}
          </p>
        )}

        {/* Financial Details Box */}
        {(displayData?.current_burden || displayData?.potential_savings || displayData?.payback_period) && (
          <div style={{
            marginTop: '2rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f0f9ff',
            border: '2px solid #3b82f6',
            borderRadius: '8px'
          }}>
            {displayData.current_burden && (
              <p style={{marginBottom: '0.75rem', fontSize: '1rem'}}>
                <strong>Current Burden:</strong> {displayData.current_burden}
              </p>
            )}
            {displayData.potential_savings && (
              <p style={{marginBottom: '0.75rem', fontSize: '1rem'}}>
                <strong>Potential Savings:</strong> {displayData.potential_savings}
              </p>
            )}
            {displayData.payback_period && (
              <p style={{marginBottom: 0, fontSize: '1rem'}}>
                <strong>Payback Period:</strong> {displayData.payback_period}
              </p>
            )}
          </div>
        )}

        {/* Recommended Actions */}
        {displayData?.action_items && displayData.action_items.length > 0 && (
          <div style={{marginBottom: '1.75rem'}}>
            <p style={{marginBottom: '0.75rem', fontWeight: 600}}>
              Recommended Actions:
            </p>
            {displayData.action_items.map((item, i) => (
              <p key={i} style={{marginBottom: '0.5rem', paddingLeft: '1.5rem'}}>
                {i + 1}. {item}
              </p>
            ))}
          </div>
        )}

        {/* Strategic Roadmap */}
        {displayData?.strategic_roadmap && displayData.strategic_roadmap.length > 0 && (
          <div style={{marginBottom: '1.75rem'}}>
            <p style={{marginBottom: '0.75rem', fontWeight: 600}}>
              Strategic Roadmap:
            </p>
            {displayData.strategic_roadmap.map((phase, i) => (
              <div key={i} style={{marginBottom: '1rem', paddingLeft: '1.5rem'}}>
                <strong>{phase.phase}</strong><br/>
                <span style={{fontSize: '0.9375rem'}}>{phase.why}</span><br/>
                <span style={{fontSize: '0.875rem', color: '#6b7280'}}>
                  Actions: {phase.actions?.join(', ')}
                </span><br/>
                <span style={{fontSize: '0.875rem', color: '#059669'}}>
                  Impact: {phase.impact}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Broker Insights */}
        {displayData?.broker_insights && (
          <p style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderLeft: '4px solid #3b82f6',
            marginBottom: '1.75rem'
          }}>
            <strong>From Your Trade Advisor:</strong> {displayData.broker_insights}
          </p>
        )}

        {/* Professional Disclaimer */}
        {displayData?.professional_disclaimer && (
          <p style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.875rem',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            <strong>Disclaimer:</strong> {displayData.professional_disclaimer}
          </p>
        )}
      </div>
    </div>
  );
}
