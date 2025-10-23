/**
 * ExecutiveSummary - Rich AI Analysis Summary
 * Displays key insights, metrics, and strategic recommendations from API
 * NO duplication - consolidates all AI analysis in one view
 */

import React from 'react';

export default function ExecutiveSummary({ results }) {
  if (!results) return null;

  const {
    company,
    usmca,
    savings,
    detailed_analysis,
    recommendations
  } = results;

  return (
    <div className="executive-summary">
      {/* KEY METRICS GRID */}
      <div className="summary-section">
        <h3 className="summary-section-title">💼 Analysis Summary</h3>
        <div className="metrics-grid-extended">
          <div className="metric-card extended">
            <div className="metric-label">Qualification Status</div>
            <div className="metric-value" style={{color: usmca?.qualified ? '#10b981' : '#ef4444'}}>
              {usmca?.qualified ? '✓ QUALIFIED' : '✗ NOT QUALIFIED'}
            </div>
          </div>
          <div className="metric-card extended">
            <div className="metric-label">Regional Content</div>
            <div className="metric-value">{(usmca?.north_american_content || 0).toFixed(1)}%</div>
            <div className="metric-detail">
              {usmca?.qualified
                ? `+${(usmca.north_american_content - (usmca.threshold_applied || 60)).toFixed(0)}% above threshold`
                : `${((usmca?.threshold_applied || 60) - (usmca?.north_american_content || 0)).toFixed(0)}% below threshold`}
            </div>
          </div>
          <div className="metric-card extended">
            <div className="metric-label">Annual Savings</div>
            <div className="metric-value" style={{color: '#059669'}}>
              ${(savings?.annual_savings || 0).toLocaleString()}
            </div>
            <div className="metric-detail">
              {savings?.monthly_savings ? `$${(savings.monthly_savings).toLocaleString()}/month` : 'N/A'}
            </div>
          </div>
          <div className="metric-card extended">
            <div className="metric-label">Threshold Applied</div>
            <div className="metric-value">{usmca?.threshold_applied || 60}%</div>
            <div className="metric-detail">{usmca?.rule || 'RVC Method'}</div>
          </div>
        </div>
      </div>

      {/* STRATEGIC INSIGHTS */}
      {detailed_analysis?.strategic_insights && (
        <div className="summary-section">
          <h3 className="summary-section-title">💡 Strategic Insights</h3>
          <div className="insight-box">
            <p className="text-body">
              {typeof detailed_analysis.strategic_insights === 'string'
                ? detailed_analysis.strategic_insights
                : JSON.stringify(detailed_analysis.strategic_insights)}
            </p>
          </div>
        </div>
      )}

      {/* KEY RECOMMENDATIONS */}
      {recommendations && recommendations.length > 0 && (
        <div className="summary-section">
          <h3 className="summary-section-title">🎯 Top {Math.min(4, recommendations.length)} Actions</h3>
          <div className="recommendations-grid">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div key={idx} className="recommendation-card">
                <div className="recommendation-number">{idx + 1}</div>
                <div className="recommendation-text">{rec}</div>
              </div>
            ))}
          </div>
          {recommendations.length > 4 && (
            <p className="text-muted" style={{marginTop: '0.75rem', fontSize: '0.875rem'}}>
              +{recommendations.length - 4} more recommendations below
            </p>
          )}
        </div>
      )}

      {/* FINANCIAL BREAKDOWN */}
      {savings && (
        <div className="summary-section">
          <h3 className="summary-section-title">💰 Financial Impact</h3>
          <div className="financial-breakdown">
            <div className="breakdown-row">
              <span className="breakdown-label">Annual Trade Volume:</span>
              <span className="breakdown-value">
                ${(() => {
                  const volume = company?.trade_volume;
                  if (!volume) {
                    console.error('❌ [FORM SCHEMA] Missing company.trade_volume in ExecutiveSummary');
                    return '0';
                  }
                  const num = typeof volume === 'string' ? parseFloat(volume.replace(/[^0-9.-]+/g, '')) : volume;
                  return (isNaN(num) ? 0 : num).toLocaleString();
                })()}
              </span>
            </div>
            {savings.annual_savings > 0 && (
              <>
                <div className="breakdown-row highlight-row">
                  <span className="breakdown-label">Annual Savings (USMCA):</span>
                  <span className="breakdown-value" style={{color: '#10b981', fontWeight: '600'}}>
                    +${(savings.annual_savings).toLocaleString()}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Savings Rate:</span>
                  <span className="breakdown-value">{(savings.savings_percentage || 0).toFixed(2)}% of volume</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ANALYSIS DETAILS - COMPACT VIEW */}
      {detailed_analysis && (
        <div className="summary-section">
          <h3 className="summary-section-title">📊 Analysis Details</h3>
          <div className="analysis-details-grid">
            {detailed_analysis.threshold_research && (
              <details className="analysis-detail-item">
                <summary className="analysis-summary-header">
                  🔍 Treaty Rule Analysis
                </summary>
                <div className="analysis-detail-content">
                  {typeof detailed_analysis.threshold_research === 'string'
                    ? detailed_analysis.threshold_research
                    : JSON.stringify(detailed_analysis.threshold_research)}
                </div>
              </details>
            )}

            {detailed_analysis.calculation_breakdown && (
              <details className="analysis-detail-item">
                <summary className="analysis-summary-header">
                  🧮 Regional Content Calculation
                </summary>
                <div className="analysis-detail-content">
                  {typeof detailed_analysis.calculation_breakdown === 'string'
                    ? detailed_analysis.calculation_breakdown
                    : JSON.stringify(detailed_analysis.calculation_breakdown)}
                </div>
              </details>
            )}

            {detailed_analysis.qualification_reasoning && (
              <details className="analysis-detail-item">
                <summary className="analysis-summary-header">
                  {usmca?.qualified ? '✅ Qualification Validation' : '❌ Qualification Assessment'}
                </summary>
                <div className="analysis-detail-content">
                  {typeof detailed_analysis.qualification_reasoning === 'string'
                    ? detailed_analysis.qualification_reasoning
                    : JSON.stringify(detailed_analysis.qualification_reasoning)}
                </div>
              </details>
            )}

            {detailed_analysis.savings_analysis && (
              <details className="analysis-detail-item">
                <summary className="analysis-summary-header">
                  💰 Financial Impact Analysis
                </summary>
                <div className="analysis-detail-content">
                  {typeof detailed_analysis.savings_analysis === 'string'
                    ? detailed_analysis.savings_analysis
                    : JSON.stringify(detailed_analysis.savings_analysis)}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
