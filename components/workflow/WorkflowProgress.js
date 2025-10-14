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

  useEffect(() => {
    setMounted(true);
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
    // Should only be complete if user actually generated certificate (step 5+)
    if (step === 4) {
      if (currentStep > 4) return 'complete';  // Actually completed certificate generation
      if (currentStep === 4) return 'active';  // Currently on certificate step
      return 'inactive';  // Haven't reached certificate yet
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