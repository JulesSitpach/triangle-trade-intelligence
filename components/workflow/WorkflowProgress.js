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
    { step: 2, label: 'Product Details', icon: 'PD' },
    { step: 3, label: 'Supply Chain', icon: 'SC' },
    { step: 4, label: 'Authorization', icon: 'AU' },
    { step: 5, label: 'Review & Generate', icon: 'RG' }
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
                  {/* Step Circle */}
                  <div className="workflow-step-indicator">
                    {isComplete ? '✓' : item.step}
                  </div>
                  
                  {/* Step Label */}
                  <div className="workflow-step-label">
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