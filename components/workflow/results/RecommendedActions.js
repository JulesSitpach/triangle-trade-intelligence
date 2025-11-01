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

  // Get trade volume for calculations (gracefully handle missing value)
  const tradeVolume = results?.company?.trade_volume || 0;

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
          const data = await response.json();
          // ✅ FIX: subscription_tier is nested inside 'user' object in response
          const tier = data.user?.subscription_tier || 'trial';
          setUserSubscriptionTier(tier);
          console.log('✅ User subscription tier:', tier, '(from data.user.subscription_tier)');
        }
      } catch (error) {
        console.error('⚠️ Failed to fetch user subscription tier:', error);
        setUserSubscriptionTier('trial');
      }
    };

    fetchUserSubscriptionTier();
  }, []);

  // ❌ DISABLED (Oct 30, 2025): Auto-trigger removed to prevent unwanted AI costs (~$0.02 per page load)
  // User must click "📊 Generate Business Impact Summary" button to trigger AI call
  // useEffect(() => {
  //   if (isQualified && results?.company && !loadingAlert && userSubscriptionTier) {
  //     loadExecutiveTradeAlert();
  //   }
  // }, [isQualified, results, userSubscriptionTier]);

  const saveExecutiveAlertToDatabase = async (alertData) => {
    try {
      console.log('💾 [SAVE] Starting saveExecutiveAlertToDatabase with alertData:', alertData);

      // Save executive alert detailed_analysis to localStorage first (immediate)
      const workflowResults = JSON.parse(localStorage.getItem('usmca_workflow_results') || '{}');
      console.log('💾 [SAVE] Existing workflowResults.detailed_analysis BEFORE merge:', workflowResults.detailed_analysis);

      workflowResults.detailed_analysis = {
        ...workflowResults.detailed_analysis,  // Keep existing detailed_analysis fields
        ...alertData  // Merge executive alert fields (situation_brief, broker_insights, etc.)
      };

      console.log('💾 [SAVE] workflowResults.detailed_analysis AFTER merge:', workflowResults.detailed_analysis);
      console.log('💾 [SAVE] Merged has situation_brief?', !!workflowResults.detailed_analysis.situation_brief);

      localStorage.setItem('usmca_workflow_results', JSON.stringify(workflowResults));
      console.log('💾 [SAVE] Saved to localStorage successfully');

      // Update database workflow_data (if user is logged in and workflow exists)
      const response = await fetch('/api/workflow-session/update-executive-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          detailed_analysis: alertData
        })
      });

      if (response.ok) {
        console.log('✅ Executive alert saved to database');
      } else {
        console.warn('⚠️ Failed to save executive alert to database (will use localStorage)');
      }
    } catch (error) {
      console.error('❌ Error saving executive alert:', error);
    }
  };

  const loadExecutiveTradeAlert = async () => {
    setLoadingAlert(true);
    try {
      // ✅ Validate destination_country BEFORE API call (fail loudly)
      if (!results.company?.destination_country) {
        throw new Error('destination_country is required for executive trade alert. Expected: US, CA, or MX');
      }

      // ✅ DEBUG: Log what we're sending to the API
      console.log('📤 [RECOMMENDED-ACTIONS] Calling executive-trade-alert with:', {
        industry_sector: results.company?.industry_sector,
        destination_country: results.company.destination_country,
        supplier_country: results.company?.supplier_country,
        subscription_tier: userSubscriptionTier,
        userSubscriptionTier_type: typeof userSubscriptionTier,
        userSubscriptionTier_value: userSubscriptionTier
      });

      const response = await fetch('/api/executive-trade-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_profile: {
            company_name: results.company?.name || null,  // ✅ FIXED: Use correct field name
            industry_sector: results.company?.industry_sector || 'General Manufacturing',
            destination_country: results.company.destination_country,  // ✅ No fallback - validated above
            supplier_country: results.company?.supplier_country,
            company_country: results.company?.company_country || null,
            business_type: results.company?.business_type || null,
            contact_person: results.company?.contact_person || null,
            subscription_tier: userSubscriptionTier  // ✅ CRITICAL: Pass subscription tier for tier gating
          },
          workflow_intelligence: {
            components: results.usmca?.component_breakdown || [],
            north_american_content: results.usmca?.north_american_content || 0,
            trade_volume: tradeVolume ? parseFloat(tradeVolume) : 0,
            // ✅ Add critical context for holistic AI analysis
            usmca_qualified: results.usmca?.qualified || false,
            preference_criterion: results.usmca?.preference_criterion || null,
            threshold_applied: results.usmca?.threshold_applied || 65,
            current_annual_savings: results.savings?.annual_savings || 0,
            monthly_savings: results.savings?.monthly_savings || 0,
            product_description: results.company?.product_description || null,
            strategic_insights: results.detailed_analysis?.strategic_insights || null
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExecutiveAlert(data);
        console.log('✅ Executive trade alert loaded:', data);

        // ✅ CRITICAL FIX: Save executive alert detailed_analysis to database
        // This ensures alert impact analysis service can access rich workflow intelligence
        if (data.data) {
          await saveExecutiveAlertToDatabase(data.data);
          console.log('✅ Saving executive alert to localStorage and database:', data.data);
        }
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
            <h4 className="card-title">Qualification Improvement Recommendations</h4>
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
            <h4 className="card-title">Strategic Implementation Roadmap</h4>
            <p className="text-body">Three-phase plan to optimize USMCA benefits and mitigate tariff policy risks</p>
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

          {/* Professional Disclaimer */}
          {executiveAlert?.alert?.professional_disclaimer && (
            <div style={{
              backgroundColor: '#fffbeb',
              padding: '1rem',
              borderRadius: '4px',
              borderLeft: '4px solid #f59e0b',
              marginTop: '1.5rem'
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                Professional Advisory Recommendation
              </div>
              <div style={{ fontSize: '0.875rem', color: '#78350f', lineHeight: '1.6' }}>
                {executiveAlert.alert.professional_disclaimer}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: CBP Compliance Checklist from Executive Trade Alert */}
      {isQualified && executiveAlert?.cbp_compliance_strategy && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">CBP Compliance Requirements</h4>
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

      {/* Triangle Routing Opportunities */}
      {hasTriangleOpportunities && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Alternative Trade Routes</h4>
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
            <h4 className="card-title">Strategic Opportunities</h4>
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