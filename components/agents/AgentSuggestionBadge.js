/**
 * Agent Suggestion Badge Component
 *
 * Displays real-time agent suggestions with confidence scores
 * Enhanced to show explanation, alternative codes, and tariff comparison
 */
import { useState } from 'react';

export default function AgentSuggestionBadge({ suggestion, onAccept, onDismiss }) {
  // ✅ START COLLAPSED - User can expand if they want details
  const [showDetails, setShowDetails] = useState(false);

  if (!suggestion || !suggestion.data) return null;

  // ✅ SAFETY: Normalize all values to prevent React "object as child" errors
  const confidence = Number(suggestion.data.confidence || suggestion.confidence || 0);
  const confidenceColor = confidence >= 85 ? 'green' : confidence >= 70 ? 'yellow' : 'red';

  const hsCode = String(suggestion.data.suggestion || suggestion.data.value || suggestion.data.hsCode || '');
  const description = String(suggestion.data.description || '');

  // ✅ SAFETY: Use JSON.stringify for objects (String(object) produces "[object Object]")
  const rawExplanation = suggestion.data.explanation || '';
  const explanation = typeof rawExplanation === 'string'
    ? rawExplanation
    : JSON.stringify(rawExplanation);

  const hasAlternatives = suggestion.data.alternativeCodes?.length > 0;
  const hasExplanation = explanation.length > 0;

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
          {hsCode}
        </div>
        {description && (
          <div className="suggestion-explanation">
            {description}
          </div>
        )}

        {/* ✅ REMOVED: Tariff rates (shown later in enrichment)
                      REMOVED: Documentation (shown in final results)
            Focus: Just HS code classification */}

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
                      {explanation}
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
                      {suggestion.data.alternativeCodes.map((alt, idx) => {
                        // ✅ SAFETY: Ensure code and reason are always strings (AI might return objects)
                        const safeCode = typeof alt.code === 'string' ? alt.code : String(alt.code || '');
                        const safeReason = typeof alt.reason === 'string' ? alt.reason : (alt.reason?.status || 'Alternative classification option');
                        const safeConfidence = Number(alt.confidence) || 0;

                        return (
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
                              <strong style={{ fontFamily: 'monospace', color: '#78350f' }}>{safeCode}</strong>
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '12px',
                                backgroundColor: safeConfidence >= 70 ? '#fef3c7' : '#fee2e2',
                                color: safeConfidence >= 70 ? '#92400e' : '#991b1b'
                              }}>
                                {safeConfidence}% match
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#92400e' }}>{safeReason}</div>
                          </div>
                        );
                      })}
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