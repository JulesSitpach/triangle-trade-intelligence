/**
 * Validation Status Panel Component
 *
 * Displays comprehensive validation results with errors, warnings, and confidence
 */
export default function ValidationStatusPanel({ validationResult, expertRecommendation }) {
  if (!validationResult || !validationResult.data) return null;

  const { valid, confidence, errors, warnings, acceptanceProbability } = validationResult.data;
  const isReady = valid && confidence >= 85;

  return (
    <div className={`validation-panel ${isReady ? 'validation-success' : 'validation-warning'}`}>
      <div className="validation-header">
        <h3 className="validation-title">
          {isReady ? '✅ Certificate Ready' : '⚠️ Issues Detected'}
        </h3>
        <div className="validation-confidence">
          Confidence: {confidence}%
        </div>
      </div>

      <div className="validation-body">
        {isReady ? (
          <div className="validation-success-message">
            <p className="success-text">
              Your certificate is ready to submit with {acceptanceProbability || confidence}% acceptance probability!
            </p>
          </div>
        ) : (
          <>
            {errors && errors.length > 0 && (
              <div className="validation-errors">
                <h4 className="error-title">Critical Issues ({errors.length})</h4>
                <ul className="error-list">
                  {errors.map((error, idx) => (
                    <li key={idx} className="error-item">
                      <span className="error-icon">❌</span>
                      <div className="error-content">
                        <strong>{error.field}:</strong> {error.message}
                        {error.suggestion && (
                          <div className="error-suggestion">
                            💡 {error.suggestion}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings && warnings.length > 0 && (
              <div className="validation-warnings">
                <h4 className="warning-title">Warnings ({warnings.length})</h4>
                <ul className="warning-list">
                  {warnings.map((warning, idx) => (
                    <li key={idx} className="warning-item">
                      <span className="warning-icon">⚠️</span>
                      <div className="warning-content">
                        <strong>{warning.field}:</strong> {warning.message}
                        {warning.suggestion && (
                          <div className="warning-suggestion">
                            {warning.suggestion}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {expertRecommendation && expertRecommendation.recommended && (
          <div className="expert-recommendation">
            <div className="recommendation-header">
              <span className="recommendation-icon">👨‍💼</span>
              <h4 className="recommendation-title">Expert Assistance Available</h4>
            </div>
            <p className="recommendation-reason">{expertRecommendation.reason}</p>
            <div className="recommendation-details">
              <span className="service-type">
                {expertRecommendation.service === 'expert_completion' ? 'Expert Completion' : 'Expert Review'}
              </span>
              <span className="service-price">${expertRecommendation.price}</span>
              <span className={`urgency-badge urgency-${expertRecommendation.urgency}`}>
                {expertRecommendation.urgency} urgency
              </span>
            </div>
            <button className="btn-action btn-expert">
              Get Expert Help - ${expertRecommendation.price}
            </button>
          </div>
        )}
      </div>

      {isReady && (
        <div className="validation-footer">
          <button className="btn-action btn-success btn-lg">
            Submit Certificate
          </button>
        </div>
      )}
    </div>
  );
}