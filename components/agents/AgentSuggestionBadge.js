/**
 * Agent Suggestion Badge Component
 *
 * Displays real-time agent suggestions with confidence scores
 */
export default function AgentSuggestionBadge({ suggestion, onAccept, onDismiss }) {
  if (!suggestion || !suggestion.data) return null;

  const confidence = suggestion.data.confidence || suggestion.confidence || 0;
  const confidenceColor = confidence >= 85 ? 'green' : confidence >= 70 ? 'yellow' : 'red';

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

        {(suggestion.data.explanation || suggestion.data.reason) && (
          <div className="suggestion-explanation">
            {suggestion.data.explanation || suggestion.data.reason}
          </div>
        )}

        {suggestion.data.source && (
          <div className="suggestion-source">
            Source: {suggestion.data.source}
          </div>
        )}

        {suggestion.data.alternativeCodes && suggestion.data.alternativeCodes.length > 0 && (
          <div className="suggestion-alternatives">
            <strong>Alternatives:</strong>
            {suggestion.data.alternativeCodes.map((alt, idx) => (
              <div key={idx} className="alternative-option">
                {alt.code} ({alt.confidence}% - {alt.reason})
              </div>
            ))}
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