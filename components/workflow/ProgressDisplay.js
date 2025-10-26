/**
 * Progress Display Component
 * Shows real-time progress while API request runs
 * Displays: progress message, progress bar, percentage, estimated time remaining
 */

import React from 'react';
import '../styles/progress-display.css';

export default function ProgressDisplay({ progress }) {
  const { message, percentage, estimatedTimeRemaining, isComplete } = progress;

  // Format time remaining (ms to human readable)
  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return '...';
    if (ms < 1000) return '<1s';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="progress-display-container">
      <div className="progress-header">
        <h2>Processing USMCA Compliance Analysis</h2>
      </div>

      {/* Progress Message */}
      <div className="progress-message">
        <p className="progress-text">{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Progress Details */}
      <div className="progress-details">
        <div className="progress-percentage">
          <span className="percentage-value">{percentage}%</span>
        </div>
        {!isComplete && estimatedTimeRemaining > 0 && (
          <div className="progress-eta">
            <span className="eta-label">Estimated time:</span>
            <span className="eta-value">{formatTimeRemaining(estimatedTimeRemaining)}</span>
          </div>
        )}
        {isComplete && (
          <div className="progress-complete">
            <span className="complete-checkmark">✓</span>
            <span className="complete-text">Complete</span>
          </div>
        )}
      </div>

      {/* Animated dots for visual feedback */}
      {!isComplete && (
        <div className="progress-spinner">
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
        </div>
      )}
    </div>
  );
}
