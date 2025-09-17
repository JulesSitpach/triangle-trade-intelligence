/**
 * WorkflowProgress - Progress indicator for workflow steps
 * Visual step indicator with trust indicators
 * Now using professional enterprise design system
 */

import React from 'react';

export default function WorkflowProgress({ 
  currentStep, 
  onStepClick,
  trustIndicators,
  isStepClickable = false 
}) {
  const steps = [
    { step: 1, label: 'Company Information', icon: 'CO' },
    { step: 2, label: 'Product & Component Analysis', icon: 'PC' },
    { step: 3, label: 'USMCA Results Review', icon: 'RR' },
    { step: 4, label: 'Certificate Authorization', icon: 'CA' }
  ];

  const handleStepClick = (step) => {
    if (isStepClickable && onStepClick) {
      onStepClick(step);
    }
  };

  const getStepStatus = (step) => {
    if (step < currentStep) return 'complete';
    if (step === currentStep) return 'active';
    return 'inactive';
  };

  return (
    <section className="main-content">
      <div className="container-app">

        {/* Professional Progress Bar */}
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
                  {/* Step Badge - Using existing hero-badge style for consistency */}
                  <div className={`hero-badge ${isComplete ? 'completed' : isActive ? 'active' : 'inactive'}`}>
                    {isComplete ? '✓' : item.step}
                  </div>

                  {/* Step Label */}
                  <div className="text-body">
                    {item.label}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}