/**
 * Agent Suggestion Badge Component
 *
 * Displays real-time agent suggestions with confidence scores
 * Enhanced to show explanation, alternative codes, and tariff comparison
 */
import { useState } from 'react';

export default function AgentSuggestionBadge({ suggestion, onAccept, onDismiss }) {
  const [showDetails, setShowDetails] = useState(false);

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

        {/* Expandable Details Section */}
        {(hasExplanation || hasAlternatives) && (
          <div className="suggestion-details">
            <button
              className="btn-link"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '▼ Hide Details' : '▶ View Full Analysis'}
            </button>

            {showDetails && (
              <div className="details-content">
                {/* Full Explanation */}
                {hasExplanation && (
                  <div className="explanation-section">
                    <h4 className="section-title">Classification Reasoning:</h4>
                    <p className="text-body">{suggestion.data.explanation}</p>
                  </div>
                )}

                {/* Alternative Codes */}
                {hasAlternatives && (
                  <div className="alternatives-section">
                    <h4 className="section-title">Alternative HS Codes:</h4>
                    <ul className="alternatives-list">
                      {suggestion.data.alternativeCodes.map((alt, idx) => (
                        <li key={idx} className="alternative-item">
                          <div className="alt-code">
                            <strong>{alt.code}</strong>
                            <span className={`confidence-badge confidence-${alt.confidence >= 70 ? 'yellow' : 'red'}`}>
                              {alt.confidence}%
                            </span>
                          </div>
                          <div className="alt-reason">{alt.reason}</div>
                        </li>
                      ))}
                    </ul>
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