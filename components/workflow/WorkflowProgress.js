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
    { step: 2, label: 'Product & Components', icon: 'PC' },
    { step: 3, label: 'Results & Certificate', icon: 'RC' }
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
        {/* Professional status indicators */}
        {trustIndicators && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="hero-badge" style={{ marginRight: '0.5rem' }}>Data Verified</div>
            <div className="hero-badge" style={{ marginRight: '0.5rem' }}>System Operational</div>
            <div className="hero-badge">Expert Network Active</div>
          </div>
        )}

        {/* Professional Progress Bar */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            marginBottom: '1rem'
          }}>
            {/* Progress Line Background */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '2rem',
              right: '2rem',
              height: '4px',
              background: 'var(--gray-200)',
              borderRadius: '2px',
              transform: 'translateY(-50%)',
              zIndex: 1
            }} />
            
            {/* Active Progress Line */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '2rem',
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              maxWidth: 'calc(100% - 4rem)',
              height: '4px',
              background: 'linear-gradient(90deg, var(--blue-500) 0%, var(--blue-600) 100%)',
              borderRadius: '2px',
              transform: 'translateY(-50%)',
              zIndex: 2,
              transition: 'width 0.3s ease'
            }} />

            {/* Step Indicators */}
            {steps.map((item, index) => {
              const status = getStepStatus(item.step);
              const isActive = status === 'active';
              const isComplete = status === 'complete';
              
              return (
                <div 
                  key={item.step}
                  onClick={() => handleStepClick(item.step)}
                  style={{ 
                    cursor: isStepClickable ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 3,
                    position: 'relative',
                    flex: 1
                  }}
                >
                  {/* Step Circle */}
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    background: isComplete ? 'linear-gradient(135deg, var(--green-500) 0%, var(--green-600) 100%)' : 
                               isActive ? 'linear-gradient(135deg, var(--blue-500) 0%, var(--blue-600) 100%)' : 
                               'var(--gray-300)',
                    color: isActive || isComplete ? 'white' : 'var(--gray-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    boxShadow: isActive || isComplete ? 'var(--shadow-md)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {isComplete ? '✓' : item.step}
                  </div>
                  
                  {/* Step Label */}
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isActive || isComplete ? 'var(--navy-700)' : 'var(--gray-600)',
                    marginBottom: '0.25rem',
                    textAlign: 'center'
                  }}>
                    {item.label}
                  </div>
                  
                  {/* Step Number */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)',
                    textAlign: 'center'
                  }}>
                    Step {item.step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}