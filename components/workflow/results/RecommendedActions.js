/**
 * RecommendedActions - Next steps and recommendations display
 * Enhanced Phase 3: Now includes Strategic Roadmap, CBP Compliance, and Financial Scenarios
 * Calls executive-trade-alert API for consulting-grade advisory
 */

import React, { useState, useEffect } from 'react';

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

  // Phase 3 Enhancement: Load executive trade alert for strategic roadmap
  const [executiveAlert, setExecutiveAlert] = useState(null);
  const [loadingAlert, setLoadingAlert] = useState(false);
  const [alertError, setAlertError] = useState(null);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState(null);

  // Fetch user's subscription tier first
  useEffect(() => {
    const fetchUserSubscriptionTier = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setUserSubscriptionTier(userData.subscription_tier || 'trial');
          console.log('✅ User subscription tier:', userData.subscription_tier);
        }
      } catch (error) {
        console.error('⚠️ Failed to fetch user subscription tier:', error);
        setUserSubscriptionTier('trial');
      }
    };

    fetchUserSubscriptionTier();
  }, []);

  useEffect(() => {
    // Load executive trade alert with strategic roadmap if qualified and subscription tier is loaded
    if (isQualified && results?.company && !loadingAlert && userSubscriptionTier) {
      loadExecutiveTradeAlert();
    }
  }, [isQualified, results, userSubscriptionTier]);

  const loadExecutiveTradeAlert = async () => {
    setLoadingAlert(true);
    try {
      // ✅ Validate destination_country BEFORE API call (fail loudly)
      if (!results.company?.destination_country) {
        throw new Error('destination_country is required for executive trade alert. Expected: US, CA, or MX');
      }

      const response = await fetch('/api/executive-trade-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_profile: {
            industry_sector: results.company?.industry_sector || 'General Manufacturing',
            destination_country: results.company.destination_country,  // ✅ No fallback - validated above
            supplier_country: results.company?.supplier_country,
            subscription_tier: userSubscriptionTier  // ✅ CRITICAL: Pass subscription tier for tier gating
          },
          workflow_intelligence: {
            components: results.usmca?.component_breakdown || [],
            north_american_content: results.usmca?.north_american_content || 0,
            annual_trade_volume: tradeVolume ? parseFloat(tradeVolume) : 0
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExecutiveAlert(data);
        console.log('✅ Executive trade alert loaded:', data);
      } else if (response.status === 403) {
        // User doesn't have paid subscription - show graceful message
        const errorData = await response.json();
        console.log('⚠️ Executive trade alert requires paid subscription:', errorData.message);
        setAlertError(errorData.message || 'Real-time crisis alerts require a paid subscription');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load executive trade alert');
      }
    } catch (error) {
      console.error('⚠️ Failed to load executive trade alert:', error);
      setAlertError(error.message);
    } finally {
      setLoadingAlert(false);
    }
  };

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

      {/* PHASE 3: Strategic Roadmap from Executive Trade Alert */}
      {isQualified && executiveAlert?.strategic_roadmap && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">📋 3-Phase Strategic Roadmap</h4>
            <p className="text-body">Implementation plan to lock in USMCA benefits and eliminate policy risks</p>
          </div>
          <div className="element-spacing">
            {executiveAlert.strategic_roadmap.map((phase, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  backgroundColor: idx === 0 ? '#fef3c7' : idx === 1 ? '#dbeafe' : '#dcfce7',
                  padding: '1rem',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${idx === 0 ? '#d97706' : idx === 1 ? '#0284c7' : '#16a34a'}`
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    Phase {idx + 1}: {phase.phase} ({phase.timeline})
                  </div>
                  {phase.actions && phase.actions.length > 0 && (
                    <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
                      {phase.actions.map((action, i) => (
                        <li key={i} style={{ color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          {action}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 3: CBP Compliance Checklist from Executive Trade Alert */}
      {isQualified && executiveAlert?.cbp_compliance_strategy && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">📋 CBP Compliance Checklist</h4>
            <p className="text-body">Immediate actions to prevent duty assessment and audit risks</p>
          </div>
          <div className="element-spacing">
            {/* Immediate Actions */}
            {executiveAlert.cbp_compliance_strategy.immediate_actions && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.75rem' }}>
                  ⚡ Immediate Actions (Next 7 Days)
                </div>
                {executiveAlert.cbp_compliance_strategy.immediate_actions.map((action, idx) => (
                  <div key={idx} className="status-card urgent" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#7f1d1d', marginBottom: '0.5rem' }}>
                        {action.action}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#5f2f2f', marginBottom: '0.5rem' }}>
                        {action.why}
                      </div>
                      {action.timeline && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          ⏱️ Timeline: {action.timeline}
                        </div>
                      )}
                      {action.required_docs && action.required_docs.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          📄 Required: {action.required_docs.slice(0, 2).join(', ')}{action.required_docs.length > 2 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Short-term Strategy */}
            {executiveAlert.cbp_compliance_strategy.short_term_strategy && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0284c7', marginBottom: '0.75rem' }}>
                  📅 Short-term Strategy (30 Days)
                </div>
                {executiveAlert.cbp_compliance_strategy.short_term_strategy.map((strategy, idx) => (
                  <div key={idx} className="status-card info" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0c4a6e', marginBottom: '0.5rem' }}>
                        {strategy.action}
                      </div>
                      {strategy.requirement && (
                        <div style={{ fontSize: '0.8rem', color: '#164e63', marginBottom: '0.25rem' }}>
                          {strategy.requirement}
                        </div>
                      )}
                      {strategy.cost && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          💰 Cost: {strategy.cost}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CBP Contact Info */}
            {executiveAlert.cbp_compliance_strategy.contacts && (
              <div style={{
                backgroundColor: '#f3f4f6',
                padding: '1rem',
                borderRadius: '4px',
                marginTop: '1rem'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                  📞 CBP Contact Information
                </div>
                {Object.entries(executiveAlert.cbp_compliance_strategy.contacts).map(([key, contact]) => (
                  <div key={key} style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '600', color: '#374151' }}>{contact.office}</div>
                    <div style={{ color: '#6b7280' }}>
                      📞 {contact.phone} | 📧 {contact.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
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