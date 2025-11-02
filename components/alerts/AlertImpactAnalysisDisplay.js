/**
 * AlertImpactAnalysisDisplay - Holistic Portfolio Intelligence Report
 * Shows strategic portfolio assessment with 6 integrated sections:
 * 1. Executive Summary - Big picture assessment
 * 2. Portfolio Health Check - Current status, risk, opportunity
 * 3. Cross-Component Analysis - How components fit together
 * 4. Policy Environment - Trade landscape context
 * 5. Strategic Roadmap - Action plan by timeframe
 * 6. Opportunity Spotlight - Growth opportunities
 * 7. What We Monitor - Retention mechanism
 * 8. Trade Advisor Perspective - Broker insights
 */

import React, { useState, useEffect } from 'react';

export default function AlertImpactAnalysisDisplay({ data, consolidatedAlertsCount, onClose }) {
  const getInitialData = () => {
    try {
      const stored = localStorage.getItem('alert_impact_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🎯 AlertImpactAnalysisDisplay loading from localStorage:', parsed);
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

  const renderArrayItems = (items) => {
    if (!items) return null;
    return (
      <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9375rem', color: '#374151' }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '0.5rem' }}>
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
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
            color: '#111827'
          }}>
            Portfolio Intelligence Report
          </h4>
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
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f3f4f6',
            border: '2px solid #6b7280',
            borderRadius: '8px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.75rem'
            }}>
              Executive Summary
            </p>
            <p style={{ margin: 0, fontSize: '1rem', color: '#374151', lineHeight: '1.7' }}>
              {displayData.executive_summary}
            </p>
          </div>
        )}

        {/* Portfolio Health Check */}
        {displayData.portfolio_health_check && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
              Portfolio Health Check
            </p>
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '8px'
            }}>
              {displayData.portfolio_health_check.current_status && (
                <p style={{ margin: 0, marginBottom: '0.75rem', fontSize: '0.9375rem', color: '#374151' }}>
                  <strong>Current Status:</strong> {displayData.portfolio_health_check.current_status}
                </p>
              )}
              {displayData.portfolio_health_check.risk_level && (
                <p style={{ margin: 0, marginBottom: '0.75rem', fontSize: '0.9375rem', color: '#374151' }}>
                  <strong>Risk Level:</strong> {displayData.portfolio_health_check.risk_level}
                </p>
              )}
              {displayData.portfolio_health_check.opportunity_value && (
                <p style={{ margin: 0, marginBottom: '0.75rem', fontSize: '0.9375rem', color: '#374151' }}>
                  <strong>Opportunity Value:</strong> {displayData.portfolio_health_check.opportunity_value}
                </p>
              )}
              {displayData.portfolio_health_check.strategic_position && (
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  <strong>Strategic Position:</strong> {displayData.portfolio_health_check.strategic_position}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cross-Component Analysis */}
        {displayData.cross_component_analysis && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
              Cross-Component Analysis
            </p>
            {displayData.cross_component_analysis.component_breakdown && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                  Component Breakdown
                </p>
                {renderArrayItems(displayData.cross_component_analysis.component_breakdown)}
              </div>
            )}
            {displayData.cross_component_analysis.common_themes && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                  Common Themes
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.cross_component_analysis.common_themes}
                </p>
              </div>
            )}
            {displayData.cross_component_analysis.diversification_need && (
              <div>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                  Diversification Strategy
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.cross_component_analysis.diversification_need}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Policy Environment */}
        {displayData.policy_environment && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
              Trade Policy Environment
            </p>
            {displayData.policy_environment.active_developments && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                  Active Developments
                </p>
                {renderArrayItems(displayData.policy_environment.active_developments)}
              </div>
            )}
            {displayData.policy_environment.trade_landscape && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#e0f2fe',
                border: '1px solid #0ea5e9',
                borderRadius: '6px'
              }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.policy_environment.trade_landscape}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Strategic Roadmap */}
        {displayData.strategic_roadmap && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
              Strategic Roadmap
            </p>

            {displayData.strategic_roadmap.immediate_30_days && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fee2e2',
                  border: '2px solid #ef4444',
                  borderRadius: '6px'
                }}>
                  <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem', color: '#dc2626' }}>
                    Immediate (This Month)
                  </p>
                  {renderArrayItems(displayData.strategic_roadmap.immediate_30_days)}
                </div>
              </div>
            )}

            {displayData.strategic_roadmap.next_90_days && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fef3c7',
                  border: '2px solid #f59e0b',
                  borderRadius: '6px'
                }}>
                  <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem', color: '#b45309' }}>
                    Short-term (Next 90 Days)
                  </p>
                  {renderArrayItems(displayData.strategic_roadmap.next_90_days)}
                </div>
              </div>
            )}

            {displayData.strategic_roadmap['2026_preparation'] && (
              <div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#dbeafe',
                  border: '2px solid #3b82f6',
                  borderRadius: '6px'
                }}>
                  <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem', color: '#1e40af' }}>
                    2026 Preparation
                  </p>
                  {renderArrayItems(displayData.strategic_roadmap['2026_preparation'])}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opportunity Spotlight */}
        {displayData.opportunity_spotlight && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f0fdf4',
            border: '2px solid #10b981',
            borderRadius: '8px'
          }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem', color: '#065f46' }}>
              Opportunity Spotlight
            </p>

            {displayData.opportunity_spotlight.nearshoring_potential && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ margin: 0, marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9375rem', color: '#047857' }}>
                  Nearshoring Potential
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.opportunity_spotlight.nearshoring_potential}
                </p>
              </div>
            )}

            {displayData.opportunity_spotlight.supplier_gaps && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ margin: 0, marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9375rem', color: '#047857' }}>
                  Supplier Opportunities
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.opportunity_spotlight.supplier_gaps}
                </p>
              </div>
            )}

            {displayData.opportunity_spotlight.competitive_edge && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ margin: 0, marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9375rem', color: '#047857' }}>
                  Competitive Advantage
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.opportunity_spotlight.competitive_edge}
                </p>
              </div>
            )}

            {displayData.opportunity_spotlight.hidden_opportunities && (
              <div>
                <p style={{ margin: 0, marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.9375rem', color: '#047857' }}>
                  Additional Opportunities
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.opportunity_spotlight.hidden_opportunities}
                </p>
              </div>
            )}
          </div>
        )}

        {/* What We Monitor */}
        {displayData.what_we_monitor_for_you && (
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.125rem' }}>
              What We Monitor for You
            </p>
            {displayData.what_we_monitor_for_you.tracking_sources && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                  Data Sources Tracked
                </p>
                {renderArrayItems(displayData.what_we_monitor_for_you.tracking_sources)}
              </div>
            )}
            {displayData.what_we_monitor_for_you.next_alert_triggers && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                  Next Alert Triggers
                </p>
                {renderArrayItems(displayData.what_we_monitor_for_you.next_alert_triggers)}
              </div>
            )}
            {displayData.what_we_monitor_for_you.retention_message && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #0284c7',
                borderRadius: '6px'
              }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151', fontStyle: 'italic' }}>
                  {displayData.what_we_monitor_for_you.retention_message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* From Your Trade Advisor */}
        {displayData.from_your_trade_advisor && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f8f5f0',
            border: '2px solid #92400e',
            borderRadius: '8px',
            borderLeft: '6px solid #d97706'
          }}>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 600,
              color: '#92400e',
              marginBottom: '1rem'
            }}>
              From Your Trade Advisor
            </p>

            {displayData.from_your_trade_advisor.situation_assessment && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{
                  margin: 0,
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#65a30d',
                  textTransform: 'uppercase'
                }}>
                  Situation Assessment
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.from_your_trade_advisor.situation_assessment}
                </p>
              </div>
            )}

            {displayData.from_your_trade_advisor.immediate_action && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{
                  margin: 0,
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#65a30d',
                  textTransform: 'uppercase'
                }}>
                  Immediate Action
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.from_your_trade_advisor.immediate_action}
                </p>
              </div>
            )}

            {displayData.from_your_trade_advisor.strategic_insight && (
              <div>
                <p style={{
                  margin: 0,
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#65a30d',
                  textTransform: 'uppercase'
                }}>
                  Strategic Insight
                </p>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#374151' }}>
                  {displayData.from_your_trade_advisor.strategic_insight}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
