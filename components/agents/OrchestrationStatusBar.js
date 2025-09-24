/**
 * Orchestration Status Bar Component
 *
 * Shows overall orchestration progress and confidence
 */
export default function OrchestrationStatusBar({
  isOrchestrating,
  overallConfidence,
  readyToSubmit,
  userGuidance
}) {
  if (isOrchestrating) {
    return (
      <div className="orchestration-status orchestration-loading">
        <div className="status-icon">🔄</div>
        <div className="status-message">AI agents analyzing your certificate...</div>
      </div>
    );
  }

  if (!userGuidance) return null;

  const statusClass = `orchestration-status orchestration-${userGuidance.status}`;
  const statusIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={statusClass}>
      <div className="status-icon">{statusIcons[userGuidance.status]}</div>
      <div className="status-content">
        <div className="status-message">{userGuidance.message}</div>
        <div className="status-next-step">{userGuidance.nextStep}</div>
      </div>
      {overallConfidence > 0 && (
        <div className="status-confidence">
          <div className="confidence-label">Overall Confidence</div>
          <div className="confidence-value">{overallConfidence}%</div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${overallConfidence}%`,
                backgroundColor:
                  overallConfidence >= 85 ? '#16a34a' :
                  overallConfidence >= 70 ? '#eab308' :
                  '#dc2626'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}