/**
 * PersonalizedAlerts - Phase 3 Enhancement
 * Displays policy alerts filtered and scored by relevance to user's products
 * Calls generate-personalized-alerts API
 */

import React, { useState, useEffect } from 'react';

export default function PersonalizedAlerts({ results }) {
  const [personalizedAlerts, setPersonalizedAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertError, setAlertError] = useState(null);

  useEffect(() => {
    // Load personalized alerts based on user profile
    if (results?.company) {
      loadPersonalizedAlerts();
    }
  }, [results]);

  const loadPersonalizedAlerts = async () => {
    setLoadingAlerts(true);
    try {
      // ✅ Validate destination_country BEFORE API call (fail loudly)
      if (!results.company?.destination_country) {
        throw new Error('destination_country is required for personalized alerts. Expected: US, CA, or MX');
      }

      const response = await fetch('/api/generate-personalized-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_profile: {
            industry_sector: results.company?.industry_sector || 'General Manufacturing',
            destination_country: results.company.destination_country,  // ✅ No fallback - validated above
            supplier_country: results.company?.supplier_country,
            component_origins: results.usmca?.component_breakdown || []
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalizedAlerts(data.alerts || []);
        console.log('✅ Personalized alerts loaded:', data);
      }
    } catch (error) {
      console.error('⚠️ Failed to load personalized alerts:', error);
      setAlertError(error.message);
    } finally {
      setLoadingAlerts(false);
    }
  };

  if (!personalizedAlerts || personalizedAlerts.length === 0) {
    return null;
  }

  // Color-code based on relevance score
  const getRelevanceColor = (score) => {
    if (score >= 80) return '#10b981'; // Green - highly relevant
    if (score >= 60) return '#f59e0b'; // Amber - moderately relevant
    return '#6b7280'; // Gray - somewhat relevant
  };

  const getRelevanceLabel = (score) => {
    if (score >= 80) return 'High Impact';
    if (score >= 60) return 'Moderate Impact';
    return 'Informational';
  };

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">🚨 Policy Alerts Affecting Your Products</h4>
        <p className="text-body">
          {personalizedAlerts.length} alert{personalizedAlerts.length !== 1 ? 's' : ''} tailored to your industry, suppliers, and products
        </p>
      </div>
      <div className="element-spacing">
        {personalizedAlerts.map((alert, idx) => {
          const relevanceColor = getRelevanceColor(alert.relevance_score);
          const relevanceLabel = getRelevanceLabel(alert.relevance_score);

          return (
            <div key={idx} style={{
              border: `1px solid ${relevanceColor}`,
              borderRadius: '4px',
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: relevanceColor === '#10b981' ? '#f0fdf4' :
                               relevanceColor === '#f59e0b' ? '#fffbeb' : '#f9fafb'
            }}>
              {/* Alert Header with Relevance Score */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '0.25rem'
                  }}>
                    {alert.theme || alert.headline}
                  </div>
                  {alert.headline && alert.headline !== alert.theme && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      {alert.headline}
                    </div>
                  )}
                </div>

                {/* Relevance Score Badge */}
                <div style={{
                  backgroundColor: relevanceColor,
                  color: '#ffffff',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  marginLeft: '1rem',
                  textAlign: 'center'
                }}>
                  <div>{alert.relevance_score || 0}%</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                    {relevanceLabel}
                  </div>
                </div>
              </div>

              {/* Situation */}
              {alert.situation && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  padding: '0.75rem',
                  borderRadius: '3px',
                  marginBottom: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  borderLeft: `3px solid ${relevanceColor}`
                }}>
                  {alert.situation}
                </div>
              )}

              {/* Why It's Relevant */}
              {alert.reason_relevant && (
                <div style={{
                  fontSize: '0.8rem',
                  color: relevanceColor,
                  fontWeight: '600',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>✓</span>
                  <span>{alert.reason_relevant}</span>
                </div>
              )}

              {/* Financial Impact */}
              {alert.financial_impact && (
                <div style={{
                  backgroundColor: '#f3f4f6',
                  padding: '0.75rem',
                  borderRadius: '3px',
                  marginBottom: '0.75rem',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    Financial Impact:
                  </div>
                  <div style={{ color: '#374151' }}>
                    {alert.financial_impact}
                  </div>
                </div>
              )}

              {/* Strategic Roadmap */}
              {alert.strategic_roadmap && alert.strategic_roadmap.length > 0 && (
                <div style={{
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    What to Do:
                  </div>
                  {alert.strategic_roadmap.map((roadmap, i) => (
                    <div key={i} style={{
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '3px',
                      marginBottom: '0.5rem',
                      borderLeft: `3px solid ${relevanceColor}`,
                      color: '#374151'
                    }}>
                      <div style={{ fontWeight: '600' }}>
                        {roadmap.phase}
                      </div>
                      {roadmap.actions && roadmap.actions.length > 0 && (
                        <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: 0 }}>
                          {roadmap.actions.map((action, j) => (
                            <li key={j} style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                              {action}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {alert.actions && alert.actions.length > 0 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '0.75rem',
                  borderRadius: '3px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    Recommended Actions:
                  </div>
                  <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                    {alert.actions.map((action, i) => (
                      <li key={i} style={{ color: '#374151', marginBottom: '0.25rem' }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #fcd34d',
        padding: '0.75rem',
        borderRadius: '4px',
        marginTop: '1rem',
        fontSize: '0.8rem',
        color: '#78350f'
      }}>
        <strong>⚠️ Important:</strong> These alerts are informational and tailored to your submitted data.
        For regulatory changes that may affect your operations, consult with a trade compliance advisor.
      </div>
    </div>
  );
}
