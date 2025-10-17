/**
 * Agent Suggestion Badge Component
 *
 * Displays real-time agent suggestions with confidence scores
 * Enhanced to show explanation, alternative codes, and tariff comparison
 */
import { useState } from 'react';

export default function AgentSuggestionBadge({ suggestion, onAccept, onDismiss }) {
  // EDUCATIONAL: Start EXPANDED so users see reasoning immediately
  const [showDetails, setShowDetails] = useState(true);

  if (!suggestion || !suggestion.data) return null;

  const confidence = suggestion.data.confidence || suggestion.confidence || 0;
  const confidenceColor = confidence >= 85 ? 'green' : confidence >= 70 ? 'yellow' : 'red';

  const hasAlternatives = suggestion.data.alternativeCodes?.length > 0;
  const hasTariffData = suggestion.data.mfnRate || suggestion.data.usmcaRate;
  const hasExplanation = suggestion.data.explanation;

  return (
    <div className={`agent-suggestion-badge agent-${confidenceColor}`}>
      <div className="agent-header">
        <span className="agent-icon">🤖</span>
        <span className="agent-label">AI Suggestion</span>
        <span className={`confidence-badge confidence-${confidenceColor}`}>
          {confidence}% confidence
        </span>
      </div>

      <div className="agent-content">
        <div className="suggestion-value">
          {suggestion.data.suggestion || suggestion.data.value || suggestion.data.hsCode}
        </div>
        {suggestion.data.description && (
          <div className="suggestion-explanation">
            {suggestion.data.description}
          </div>
        )}

        {/* Tariff Comparison */}
        {hasTariffData && (
          <div className="tariff-comparison">
            <strong>Tariff Rates:</strong>
            {suggestion.data.mfnRate && suggestion.data.mfnRate !== 'Not available' && (
              <span className="tariff-item">MFN: {suggestion.data.mfnRate}</span>
            )}
            {suggestion.data.usmcaRate && suggestion.data.usmcaRate !== 'Not available' ? (
              <>
                <span className="tariff-item">USMCA: {suggestion.data.usmcaRate}</span>
                {suggestion.data.qualifiesForUSMCA && (
                  <span className="qualification-badge">✅ Qualifies for USMCA</span>
                )}
              </>
            ) : (
              suggestion.data.mfnRate && suggestion.data.mfnRate !== 'Not available' && (
                <span className="tariff-note">Complete workflow for USMCA qualification analysis</span>
              )
            )}
          </div>
        )}

        {/* EDUCATIONAL: Required Documentation - PROACTIVE DISPLAY */}
        {suggestion.data.requiredDocumentation && suggestion.data.requiredDocumentation.length > 0 && (
          <div className="documentation-section" style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            backgroundColor: '#eff6ff',
            borderRadius: '4px',
            borderLeft: '3px solid #3b82f6'
          }}>
            <h4 className="section-title" style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
              📄 Required Customs Documentation:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#1e3a8a' }}>
              {suggestion.data.requiredDocumentation.map((doc, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{doc}</li>
              ))}
            </ul>
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#3730a3', fontStyle: 'italic' }}>
              💡 Prepare these documents before customs filing to avoid delays
            </div>
          </div>
        )}

        {/* Expandable Details Section */}
        {(hasExplanation || hasAlternatives) && (
          <div className="suggestion-details">
            <button
              className="btn-link"
              onClick={() => setShowDetails(!showDetails)}
              style={{ fontSize: '0.8125rem', color: '#3b82f6', marginTop: '0.5rem' }}
            >
              {showDetails ? '▲ Hide AI Analysis' : '▼ Show AI Analysis'}
            </button>

            {showDetails && (
              <div className="details-content">
                {/* Full Explanation - EDUCATIONAL FORMAT */}
                {hasExplanation && (
                  <div className="explanation-section" style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '4px',
                    borderLeft: '3px solid #0ea5e9'
                  }}>
                    <h4 className="section-title" style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#075985', marginBottom: '0.5rem' }}>
                      🧠 Why We Classified This Way:
                    </h4>
                    <p className="text-body" style={{ fontSize: '0.8125rem', color: '#0c4a6e', lineHeight: '1.6', margin: 0 }}>
                      {suggestion.data.explanation}
                    </p>
                  </div>
                )}

                {/* Alternative Codes - EDUCATIONAL FORMAT */}
                {hasAlternatives && (
                  <div className="alternatives-section" style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '4px',
                    borderLeft: '3px solid #f59e0b'
                  }}>
                    <h4 className="section-title" style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                      🔄 Other Options to Consider:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {suggestion.data.alternativeCodes.map((alt, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#ffffff',
                            borderRadius: '4px',
                            border: '1px solid #fde68a'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <strong style={{ fontFamily: 'monospace', color: '#78350f' }}>{alt.code}</strong>
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '12px',
                              backgroundColor: alt.confidence >= 70 ? '#fef3c7' : '#fee2e2',
                              color: alt.confidence >= 70 ? '#92400e' : '#991b1b'
                            }}>
                              {alt.confidence}% match
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#92400e' }}>{alt.reason}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#92400e', fontStyle: 'italic' }}>
                      💡 Consider these if your product specs change or for different use cases
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="agent-actions">
        {onAccept && (
          <button
            className="btn-action btn-primary btn-sm"
            onClick={() => onAccept(suggestion.data.suggestion || suggestion.data.hsCode)}
          >
            Use This
          </button>
        )}
        {onDismiss && (
          <button
            className="btn-action btn-secondary btn-sm"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}