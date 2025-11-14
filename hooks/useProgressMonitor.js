/**
 * Progress Monitor Hook
 * Tracks API request progress and shows estimated completion time
 * Updates progress as different steps complete (validation → classification → qualification → etc.)
 */

import { useState, useEffect, useCallback } from 'react';

// Define progress milestones with time estimates (in milliseconds)
// Realistic timing: typical analysis takes 5-10 seconds
const PROGRESS_MILESTONES = [
  { step: 'validating', label: '🔍 Validating input data...', targetTime: 200, percentage: 5 },
  { step: 'classifying', label: '🏷️ Classifying components...', targetTime: 1000, percentage: 15 },
  { step: 'enriching', label: '📊 Loading tariff rates...', targetTime: 2000, percentage: 30 },
  { step: 'checking', label: '🌍 Checking USMCA qualification...', targetTime: 4000, percentage: 50 },
  { step: 'calculating', label: '💰 Calculating tariff savings...', targetTime: 6000, percentage: 70 },
  { step: 'finalizing', label: '📜 Finalizing analysis...', targetTime: 8000, percentage: 85 },
  { step: 'wrapping', label: '⏳ Almost done...', targetTime: 9000, percentage: 95 }
];

export function useProgressMonitor() {
  const [progress, setProgress] = useState({
    currentStep: 'idle',
    percentage: 0,
    message: '',
    elapsedTime: 0,
    estimatedTimeRemaining: 0,
    isComplete: false
  });

  // Start monitoring progress
  const startMonitoring = useCallback((expectedDurationMs = 10000) => {
    setProgress({
      currentStep: 'processing',
      percentage: 0,
      message: 'Starting USMCA analysis...',
      elapsedTime: 0,
      estimatedTimeRemaining: expectedDurationMs,
      isComplete: false
    });

    const startTime = Date.now();
    let currentMilestoneIndex = 0;

    const updateProgress = () => {
      const elapsedMs = Date.now() - startTime;
      const totalMs = expectedDurationMs;

      // Find which milestone we're at based on elapsed time
      let nextMilestoneIndex = currentMilestoneIndex;
      for (let i = 0; i < PROGRESS_MILESTONES.length; i++) {
        if (elapsedMs >= PROGRESS_MILESTONES[i].targetTime) {
          nextMilestoneIndex = i;
        } else {
          break;
        }
      }

      // Update milestone if we've progressed
      if (nextMilestoneIndex !== currentMilestoneIndex) {
        currentMilestoneIndex = nextMilestoneIndex;
      }

      const currentMilestone = PROGRESS_MILESTONES[currentMilestoneIndex];

      // Calculate percentage based on milestone + interpolation
      let percentage = currentMilestone.percentage;
      if (currentMilestoneIndex < PROGRESS_MILESTONES.length - 1) {
        const currentTargetTime = currentMilestone.targetTime;
        const nextTargetTime = PROGRESS_MILESTONES[currentMilestoneIndex + 1].targetTime;
        const timeBetweenMilestones = nextTargetTime - currentTargetTime;
        const timeIntoMilestone = Math.min(elapsedMs - currentTargetTime, timeBetweenMilestones);
        const progressInMilestone = (timeIntoMilestone / timeBetweenMilestones) * 10; // Each milestone is ~10%
        percentage = Math.min(currentMilestone.percentage + progressInMilestone, 95);
      }

      const estimatedRemaining = Math.max(0, totalMs - elapsedMs);

      setProgress({
        currentStep: currentMilestone.step,
        percentage: Math.round(percentage),
        message: currentMilestone.label,
        elapsedTime: elapsedMs,
        estimatedTimeRemaining: estimatedRemaining,
        isComplete: false
      });

      // Continue monitoring if not complete
      if (elapsedMs < totalMs) {
        setTimeout(updateProgress, 200); // Update every 200ms
      }
    };

    updateProgress();
  }, []);

  // Mark as complete
  const completeMonitoring = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      percentage: 100,
      message: '✅ Analysis complete!',
      estimatedTimeRemaining: 0,
      isComplete: true
    }));
  }, []);

  // Reset progress
  const reset = useCallback(() => {
    setProgress({
      currentStep: 'idle',
      percentage: 0,
      message: '',
      elapsedTime: 0,
      estimatedTimeRemaining: 0,
      isComplete: false
    });
  }, []);

  return {
    progress,
    startMonitoring,
    completeMonitoring,
    reset
  };
}
