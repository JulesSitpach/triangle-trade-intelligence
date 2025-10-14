/**
 * Admin Intelligence Metrics Component
 * Displays enhanced data from vulnerability analyses for Cristina and Jorge
 * Helps prioritize high-value service opportunities
 */

import React from 'react';

export default function AdminIntelligenceMetrics({ adminIntelligence }) {
  if (!adminIntelligence || adminIntelligence.total_with_analysis === 0) {
    return null;
  }

  const {
    total_with_analysis,
    low_confidence_hs_codes,
    high_tariff_exposure_count,
    total_tariff_opportunity,
    rvc_optimization_opportunities,
    top_opportunities
  } = adminIntelligence;

  return (
    <div className="form-section">
      <h2 className="form-section-title">📊 Client Opportunity Intelligence</h2>
      <p className="text-body">
        AI-powered insights from {total_with_analysis} client workflow analyses
      </p>

      {/* Opportunity Metrics Grid */}
      <div className="status-grid">
        {/* Cristina's Specialty - Low Confidence HS Codes */}
        {low_confidence_hs_codes > 0 && (
          <div className="status-card">
            <div className="status-label">⚠️ HS Validation Needed</div>
            <div className="status-value" style={{ color: '#f59e0b' }}>
              {low_confidence_hs_codes} {low_confidence_hs_codes === 1 ? 'client' : 'clients'}
            </div>
            <div className="status-help">Professional HS classification review recommended</div>
          </div>
        )}

        {/* Jorge's Specialty - High Tariff Exposure */}
        {high_tariff_exposure_count > 0 && (
          <div className="status-card">
            <div className="status-label">💰 Mexico Sourcing Opportunity</div>
            <div className="status-value" style={{ color: '#059669' }}>
              {high_tariff_exposure_count} {high_tariff_exposure_count === 1 ? 'client' : 'clients'}
            </div>
            <div className="status-help">
              Total opportunity: ${total_tariff_opportunity.toLocaleString()}/year
            </div>
          </div>
        )}

        {/* RVC Optimization Opportunities */}
        {rvc_optimization_opportunities > 0 && (
          <div className="status-card">
            <div className="status-label">📈 RVC Optimization</div>
            <div className="status-value" style={{ color: '#3b82f6' }}>
              {rvc_optimization_opportunities} {rvc_optimization_opportunities === 1 ? 'client' : 'clients'}
            </div>
            <div className="status-help">Qualified but close to threshold - increase safety margin</div>
          </div>
        )}

        {/* Total Analyzed */}
        <div className="status-card">
          <div className="status-label">🤖 AI Analyses Complete</div>
          <div className="status-value">{total_with_analysis}</div>
          <div className="status-help">Clients with complete vulnerability analysis</div>
        </div>
      </div>

      {/* Top Opportunities Table */}
      {top_opportunities && top_opportunities.length > 0 && (
        <div className="element-spacing">
          <h3 className="card-title">🎯 Top Client Opportunities</h3>
          <p className="text-body">Prioritized by tariff savings potential</p>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Company</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>HS Validation</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Mexico Sourcing</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem' }}>Tariff Savings</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>RVC Optimize</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {top_opportunities.map((opp, index) => (
                  <tr key={opp.request_id || index}>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                      {opp.company_name}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                      {opp.low_confidence ? (
                        <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>⚠️</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                      {opp.high_tariff ? (
                        <span style={{ color: '#059669', fontSize: '1.25rem' }}>💰</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.75rem', color: '#059669', fontWeight: '600' }}>
                      {opp.tariff_opportunity > 0
                        ? `$${opp.tariff_opportunity.toLocaleString()}/yr`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                      {opp.rvc_optimization ? (
                        <span style={{ color: '#3b82f6', fontSize: '1.25rem' }}>📈</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                      <span
                        style={{
                          color: opp.risk_score > 70 ? '#dc2626' : opp.risk_score > 50 ? '#f59e0b' : '#059669'
                        }}
                      >
                        {opp.risk_score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="element-spacing">
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">Opportunity Legend</div>
                <div className="text-body">
                  <strong>⚠️ HS Validation:</strong> AI confidence &lt; 80% - Professional HS classification review recommended (Cristina's specialty)<br />
                  <strong>💰 Mexico Sourcing:</strong> High tariff exposure (>5%) on non-USMCA components - Mexico supplier sourcing opportunity (Jorge's specialty)<br />
                  <strong>📈 RVC Optimize:</strong> QUALIFIED but close to threshold - Increase safety margin with better sourcing (Team collaboration)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
