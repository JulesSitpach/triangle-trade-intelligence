/**
 * Progress Display Component
 * Shows real-time progress while API request runs
 * Displays: progress message, progress bar, percentage, estimated time remaining
 */

import React from 'react';
import styles from './styles/progress-display.module.css';

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
    <div className={styles['progress-display-container']}>
      <div className={styles['progress-header']}>
        <h2>Processing USMCA Compliance Analysis</h2>
      </div>

      {/* Progress Message */}
      <div className={styles['progress-message']}>
        <p className={styles['progress-text']}>{message}</p>
      </div>

      {/* Progress Bar */}
      <div className={styles['progress-bar-container']}>
        <div className={styles['progress-bar-track']}>
          <div
            className={styles['progress-bar-fill']}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Progress Details */}
      <div className={styles['progress-details']}>
        <div className={styles['progress-percentage']}>
          <span className={styles['percentage-value']}>{percentage}%</span>
        </div>
        {!isComplete && estimatedTimeRemaining > 0 && (
          <div className={styles['progress-eta']}>
            <span className={styles['eta-label']}>Estimated time:</span>
            <span className={styles['eta-value']}>{formatTimeRemaining(estimatedTimeRemaining)}</span>
          </div>
        )}
        {isComplete && (
          <div className={styles['progress-complete']}>
            <span className={styles['complete-checkmark']}>✓</span>
            <span className={styles['complete-text']}>Complete</span>
          </div>
        )}
      </div>

      {/* Animated dots for visual feedback */}
      {!isComplete && (
        <div className={styles['progress-spinner']}>
          <div className={styles['spinner-dot']}></div>
          <div className={styles['spinner-dot']}></div>
          <div className={styles['spinner-dot']}></div>
        </div>
      )}
    </div>
  );
}
