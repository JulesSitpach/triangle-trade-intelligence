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
  isStepClickable = false
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

    // Special handling for Step 4 (Generate Certificate)
    // Only mark active/complete when user is ACTUALLY on step 4
    if (step === 4) {
      if (currentStep === 4 && certificateGenerated) return 'complete';  // Green checkmark when certificate generated
      if (currentStep === 4) return 'active';  // Blue/active only when ON certificate page
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
            onClick={() => handleStepClick(item.step)}
            className={`workflow-step ${status} ${isStepClickable ? 'clickable' : ''}`}
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