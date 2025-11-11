/**
 * WorkflowProgress - Progress indicator for workflow steps
 * Visual step indicator with trust indicators
 * Now using professional enterprise design system
 */

import React, { useState, useEffect } from 'react';

export default function WorkflowProgress({
  currentStep,
  onStepClick,
  trustIndicators,
  isStepClickable = false,
  viewMode = 'normal' // 'normal', 'read-only', 'edit', or 'refresh'
}) {
  const [mounted, setMounted] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if certificate was actually generated
    if (typeof window !== 'undefined') {
      const certGenerated = sessionStorage.getItem('certificate_generated');
      setCertificateGenerated(certGenerated === 'true');
    }
  }, []);

  const steps = [
    { step: 1, label: 'Company Information', icon: '1' },
    { step: 2, label: 'Product & Component\nAnalysis', icon: '2' },
    { step: 3, label: 'Results', icon: '3' },
    { step: 4, label: 'Generate Certificate', icon: '4' }
  ];

  const handleStepClick = (step) => {
    if (isStepClickable && onStepClick) {
      onStepClick(step);
    }
  };

  const getStepStatus = (step) => {
    if (!mounted) return 'inactive'; // Prevent hydration mismatch

    // ✅ READ-ONLY MODE: Show all completed steps as green checkmarks, disable clicking
    if (viewMode === 'read-only') {
      // Steps 1-3 are complete (workflow is done), step 4 is inactive (cert not generated from view)
      if (step <= 3) return 'complete';
      return 'inactive';
    }

    // Special handling for Step 4 (Generate Certificate)
    // Always show blue (active) when on step 4, never green
    if (step === 4) {
      if (currentStep === 4) return 'active';  // Blue when ON certificate page
      return 'inactive';  // Gray when on steps 1-3 (not available yet)
    }

    // For steps 1-3, mark complete if past them
    if (step < currentStep) return 'complete';
    if (step === currentStep) return 'active';
    return 'inactive';
  };

  return (
    <div className="workflow-progress">
      {/* Step Indicators */}
      {steps.map((item, index) => {
        const status = getStepStatus(item.step);
        const isActive = status === 'active';
        const isComplete = status === 'complete';

        return (
          <div
            key={item.step}
            onClick={isStepClickable ? () => handleStepClick(item.step) : undefined}
            className={`workflow-step ${status} ${isStepClickable ? 'clickable' : ''}`}
            style={{ cursor: isStepClickable ? 'pointer' : 'default' }}
          >
            {/* Step Indicator - Compact circle design */}
            <div className="workflow-step-indicator">
              {isComplete ? '✓' : item.step}
            </div>

            {/* Step Label - Slim text below */}
            <div className="workflow-step-label">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}