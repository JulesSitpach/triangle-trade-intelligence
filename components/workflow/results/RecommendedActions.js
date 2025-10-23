/**
 * RecommendedActions - Next steps and recommendations display
 * Shows professional recommendations based on results
 */

import React from 'react';

export default function RecommendedActions({ results }) {
  const isQualified = results?.usmca?.qualified;
  const showRecommendations = (isQualified && results?.savings && (results.savings?.annual_savings || 0) > 0) ||
                             (!isQualified && results?.recommendations && results.recommendations.length > 0);

  const hasTriangleOpportunities = results?.triangle_opportunities && results.triangle_opportunities.length > 0;
  const hasBusinessIntelligence = results?.business_intelligence && results.business_intelligence.length > 0;
  const hasAIRecommendations = !isQualified && results?.recommendations && results.recommendations.length > 0;

  // Get trade volume for calculations
  const tradeVolume = results?.company?.trade_volume;
  if (!tradeVolume) {
    console.error('❌ [FORM SCHEMA] Missing company.trade_volume in RecommendedActions');
  }

  if (!showRecommendations) return null;

  return (
    <div className="element-spacing">
      {/* AI-Generated Recommendations for NOT QUALIFIED */}
      {hasAIRecommendations && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">🤖 AI-Powered Recommendations</h4>
            <p className="text-body">Product-specific strategies to achieve USMCA qualification</p>
          </div>
          <div className="element-spacing">
            {results.recommendations.map((recommendation, index) => (
              <div key={index} className="status-card warning">
                <div className="header-actions">
                  <span className="status-value warning">{index + 1}</span>
                  <span className="text-body">{recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Qualified Product Recommendations */}
      {isQualified && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Recommended Next Steps</h4>
          </div>
          <div className="element-spacing">
            <div className="status-card success">
              <div className="header-actions">
                <span className="status-value success">✓</span>
                <span className="text-body">Download and complete the certificate template</span>
              </div>
            </div>
          <div className="status-card success">
            <div className="header-actions">
              <span className="status-value success">✓</span>
              <span className="text-body">Gather required documentation</span>
            </div>
          </div>
          <div className="status-card success">
            <div className="header-actions">
              <span className="status-value success">✓</span>
              <span className="text-body">Consult with customs broker for implementation</span>
            </div>
          </div>
          <div className="status-card success">
            <div className="header-actions">
              <span className="status-value success">✓</span>
              <span className="text-body">Set up supplier compliance procedures</span>
            </div>
          </div>
          {hasTriangleOpportunities && (
            <div className="status-card info">
              <div className="header-actions">
                <span className="status-value info">🍁🇲🇽</span>
                <span className="text-body">Explore triangle routing opportunities for additional savings</span>
              </div>
            </div>
          )}
          {hasBusinessIntelligence && (
            <div className="status-card info">
              <div className="header-actions">
                <span className="status-value info">💡</span>
                <span className="text-body">Review strategic recommendations for your industry</span>
              </div>
            </div>
          )}
          {results?.trust_assessment?.expert_validation_required && (
            <div className="status-card info">
              <div className="header-actions">
                <span className="status-value info">✓</span>
                <span className="text-body">Consider expert validation for high-value transactions</span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Triangle Routing Opportunities */}
      {hasTriangleOpportunities && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">🍁🇲🇽 Triangle Routing Opportunities</h4>
            <p className="text-body">Additional savings through Canada-Mexico routing</p>
          </div>
          <div className="element-spacing">
            {results.triangle_opportunities.map((opportunity, index) => {
              // Calculate annual savings if not provided
              const annualSavings = opportunity.annual_savings ||
                (tradeVolume > 0 && opportunity.savings_percent
                  ? Math.round(tradeVolume * (opportunity.savings_percent / 100))
                  : null);

              return (
                <div key={index} className="status-card success">
                  <div className="header-actions">
                    <div>
                      <div className="text-bold">{opportunity.route}</div>
                      <div className="text-body">
                        {opportunity.savings_percent}% savings
                        {annualSavings && ` • $${annualSavings.toLocaleString()} annually`}
                      </div>
                      <div className="text-body">{opportunity.benefits}</div>
                      {opportunity.timeline && (
                        <div className="text-small">Timeline: {opportunity.timeline}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Business Intelligence Recommendations */}
      {hasBusinessIntelligence && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">💡 Strategic Recommendations</h4>
            <p className="text-body">Industry-specific USMCA insights</p>
          </div>
          <div className="element-spacing">
            {results.business_intelligence.map((intel, index) => {
              // Calculate savings potential if not provided and we have a savings percentage
              const savingsPotential = intel.savings_potential ||
                (tradeVolume > 0 && intel.savings_percent
                  ? Math.round(tradeVolume * (intel.savings_percent / 100))
                  : null);

              return (
                <div key={index} className={`status-card ${intel.priority === 'high' ? 'urgent' : 'info'}`}>
                  <div className="header-actions">
                    <div>
                      <div className="text-bold">{intel.recommendation}</div>
                      <div className="text-body">
                        Priority: {intel.priority}
                        {savingsPotential && ` • Potential: $${savingsPotential.toLocaleString()}`}
                      </div>
                      {intel.timeline && (
                        <div className="text-small">Timeline: {intel.timeline}</div>
                      )}
                      {intel.implementation_steps && intel.implementation_steps.length > 0 && (
                        <div className="text-small">
                          Next steps: {intel.implementation_steps.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}