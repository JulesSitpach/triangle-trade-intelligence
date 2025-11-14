/**
 * WorkflowLoading - Enhanced loading overlay with real-time progress tracking
 * Shows progress bar, percentage, and estimated time remaining
 * Uses useProgressMonitor hook for accurate time estimation
 */

import React, { useEffect } from 'react';
import { useProgressMonitor } from '../../hooks/useProgressMonitor';
import ProgressDisplay from './ProgressDisplay';
import styles from './styles/workflow-loading-overlay.module.css';

export default function WorkflowLoading({ isVisible }) {
  const { progress, startMonitoring, completeMonitoring, reset } = useProgressMonitor();

  // Start monitoring when component becomes visible
  useEffect(() => {
    if (isVisible) {
      startMonitoring(10000); // Realistic estimate: 5-10 seconds for typical USMCA analysis
    } else {
      reset();
    }
  }, [isVisible, startMonitoring, reset]);

  if (!isVisible) return null;

  return (
    <div className={styles['workflow-loading-overlay']}>
      <div className={styles['workflow-loading-content']}>
        <ProgressDisplay progress={progress} />
      </div>
    </div>
  );
}