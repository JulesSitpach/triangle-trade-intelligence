/**
 * WorkflowLoading - Loading overlay for workflow processing
 * Professional loading indicator with processing steps
 */

import React from 'react';

export default function WorkflowLoading({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50}}>
      <div style={{backgroundColor: 'white', borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center', maxWidth: '28rem', width: '91.666667%'}}>
        <div style={{width: '2.5rem', height: '2.5rem', border: '4px solid #e8e9ea', borderTopColor: 'var(--blue-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.25rem'}}></div>
        <h3 className="section-title">Processing USMCA Compliance</h3>
        <div style={{textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          <div className="text-body">🔍 Classifying product...</div>
          <div className="text-body">🌍 Checking USMCA qualification...</div>
          <div className="text-body">💰 Calculating tariff savings...</div>
          <div className="text-body">📜 Generating certificate...</div>
        </div>
      </div>
    </div>
  );
}