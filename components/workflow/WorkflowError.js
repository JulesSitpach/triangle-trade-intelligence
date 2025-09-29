/**
 * WorkflowError - Error display component for workflow failures
 * Professional error handling with recovery options
 * CSS COMPLIANT - Using existing classes only
 */

import React from 'react';

export default function WorkflowError({ error, onDismiss, onRetry }) {
  if (!error) return null;

  return (
    <div className="error-container">
      <h3 className="error-title">
        ⚠️ Processing Error
      </h3>
      <p className="error-message">{error}</p>
      <div className="error-actions">
        <button
          onClick={onDismiss}
          className="btn-secondary"
        >
          Dismiss
        </button>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary"
          >
            Try Again
          </button>
        )}
      </div>
      <div className="error-support">
        <p className="text-body">
          <strong>Professional Support Available:</strong> If this error persists,
          consider consulting with a licensed customs broker for manual classification.
        </p>
      </div>
    </div>
  );
}