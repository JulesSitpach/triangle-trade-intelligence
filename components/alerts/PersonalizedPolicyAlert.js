/**
 * PersonalizedPolicyAlert Component
 * Shows policy alerts with AI-powered personalized impact analysis
 * Explains exactly how each policy affects THIS SPECIFIC USER
 */

import { useState, useEffect } from 'react';

export default function PersonalizedPolicyAlert({ alert, userProfile }) {
  const [personalizedAnalysis, setPersonalizedAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Automatically analyze impact when component mounts
  useEffect(() => {
    if (alert && userProfile && !personalizedAnalysis) {
      analyzeImpact();
    }
  }, [alert, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const analyzeImpact = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/personalized-alert-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_alert: alert,
          user_profile: userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.analysis) {
        setPersonalizedAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to analyze impact:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Don't show if not relevant to user (score < 4)
  if (personalizedAnalysis && personalizedAnalysis.relevance_score < 4) {
    return null;
  }

  return (
    <div
      className={`alert alert-${
        // ✅ FIX (Nov 7): Database stores lowercase severity values
        (alert.severity || '').toLowerCase() === 'critical' ? 'error' :
        (alert.severity || '').toLowerCase() === 'high' ? 'warning' :
        'info'
      }`}
    >
      <div className="alert-content">
        {/* Title with Relevance Badge */}
        <div className="alert-title">
          {alert.title}
          {personalizedAnalysis && (
            <span
              className="form-help"
              style={{
                marginLeft: '8px',
                color: personalizedAnalysis.relevance_score >= 8 ? '#dc2626' : '#f59e0b'
              }}
            >
              • {personalizedAnalysis.relevance_score}/10 relevance to your business
            </span>
          )}
        </div>

        {/* AI is analyzing indicator */}
        {isAnalyzing && (
          <div className="text-body" style={{ marginTop: '0.5rem' }}>
            <span className="spinner-inline"></span> Analyzing impact on your business...
          </div>
        )}

        {/* Personalized Explanation (the KEY value-add) */}
        {personalizedAnalysis && personalizedAnalysis.explanation && (
          <div className="text-body" style={{ marginTop: '0.5rem', fontWeight: 500 }}>
            <strong>Impact on {userProfile.companyName}:</strong>
            <p style={{ marginTop: '0.5rem' }}>{personalizedAnalysis.explanation}</p>
          </div>
        )}

        {/* Generic description (fallback if AI hasn't finished) */}
        {!personalizedAnalysis && !isAnalyzing && (
          <div className="text-body" style={{ marginTop: '0.5rem' }}>
            {alert.description}
          </div>
        )}

        {/* Affected Components (specific to user) */}
        {personalizedAnalysis && personalizedAnalysis.affected_components && personalizedAnalysis.affected_components.length > 0 && (
          <div className="element-spacing">
            <div className="text-body">
              <strong>Your Affected Components:</strong>
            </div>
            <div className="status-grid" style={{ marginTop: '0.5rem' }}>
              {personalizedAnalysis.affected_components.map((comp, idx) => (
                <div key={idx} className="status-card">
                  <div className="status-label">{comp.component}</div>
                  <div className="status-value">
                    {comp.percentage}% from {comp.origin}
                  </div>
                  <div className="form-help">{comp.impact}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dollar Impact (the money shot) */}
        {personalizedAnalysis && personalizedAnalysis.dollar_impact && (
          <div className="element-spacing">
            <div className="alert alert-warning" style={{ backgroundColor: '#fef3c7' }}>
              <div className="alert-content">
                <div className="alert-title" style={{ fontSize: '1.1rem' }}>
                  💰 Estimated Financial Impact
                </div>
                <div className="text-body" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginTop: '0.5rem' }}>
                  {personalizedAnalysis.dollar_impact.estimate}
                </div>
                {personalizedAnalysis.dollar_impact.explanation && (
                  <div className="form-help" style={{ marginTop: '0.5rem' }}>
                    {personalizedAnalysis.dollar_impact.explanation}
                  </div>
                )}
                <div className="form-help" style={{ marginTop: '0.5rem' }}>
                  Confidence: {personalizedAnalysis.dollar_impact.confidence || 'medium'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Items (specific to user) */}
        {personalizedAnalysis && personalizedAnalysis.action_items && personalizedAnalysis.action_items.length > 0 && (
          <div className="element-spacing">
            <div className="text-body">
              <strong>Recommended Actions for You:</strong>
            </div>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              {personalizedAnalysis.action_items.map((action, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                  {action}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Urgency Level */}
        {personalizedAnalysis && personalizedAnalysis.urgency && (
          <div className="element-spacing">
            <div className="status-card" style={{
              backgroundColor: personalizedAnalysis.urgency === 'URGENT' ? '#fee2e2' :
                              personalizedAnalysis.urgency === 'HIGH' ? '#fef3c7' :
                              '#e0f2fe',
              borderLeft: `4px solid ${
                personalizedAnalysis.urgency === 'URGENT' ? '#dc2626' :
                personalizedAnalysis.urgency === 'HIGH' ? '#f59e0b' :
                '#3b82f6'
              }`
            }}>
              <div className="status-label">Urgency Level</div>
              <div className="status-value" style={{ fontWeight: 'bold' }}>
                {personalizedAnalysis.urgency}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Details Button */}
        <div className="hero-buttons" style={{ marginTop: '1rem' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-secondary"
          >
            {showDetails ? '▲ Hide' : '▼ Show'} Policy Details
          </button>
          <button
            onClick={() => window.location.href = '/services/request-form'}
            className="btn-primary"
          >
            🎯 Get Expert Help
          </button>
        </div>

        {/* Generic Policy Details (shown on demand) */}
        {showDetails && (
          <div className="element-spacing" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div className="status-grid">
              {alert.category && (
                <div className="status-card">
                  <div className="status-label">Policy Type</div>
                  <div className="status-value">{alert.category}</div>
                </div>
              )}

              {alert.effective_date && (
                <div className="status-card">
                  <div className="status-label">Effective Date</div>
                  <div className="status-value">
                    {new Date(alert.effective_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}

              {alert.tariff_adjustment && (
                <div className="status-card">
                  <div className="status-label">Tariff Change</div>
                  <div className="status-value" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                    {alert.tariff_adjustment}
                  </div>
                </div>
              )}
            </div>

            {/* Affected Countries */}
            {alert.affected_countries && alert.affected_countries.length > 0 && (
              <div className="text-body" style={{ marginTop: '1rem' }}>
                <strong>Affected Countries:</strong>{' '}
                {alert.affected_countries.join(', ')}
              </div>
            )}

            {/* Source Link */}
            {alert.source_url && (
              <div className="text-body" style={{ marginTop: '1rem' }}>
                <strong>Official Source:</strong>{' '}
                <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="nav-link">
                  {alert.source_feed || 'View Government Announcement'} →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
