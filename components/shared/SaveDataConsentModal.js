/**
 * SaveDataConsentModal - ULTRA MINIMAL - ZERO CSS INTERFERENCE
 * Uses !important inline styles to override ALL CSS
 * Unique ID to prevent any class conflicts
 * Wrapped in React.memo to prevent unnecessary re-renders
 */

import React, { useState } from 'react';

function SaveDataConsentModal({ isOpen, onContinue }) {
  const [choice, setChoice] = useState('save');

  // DEBUG: Log when modal renders
  console.log('🎯 SaveDataConsentModal RENDER - isOpen:', isOpen, 'Returning:', !isOpen ? 'NULL (not showing)' : 'MODAL JSX');

  if (!isOpen) {
    console.log('❌ Modal isOpen=false, returning null');
    return null;
  }

  console.log('✅ Modal isOpen=true, rendering modal JSX');

  return (
    <div
      id="consent-modal-overlay-unique"
      style={{
        position: 'fixed !important',
        top: '0 !important',
        left: '0 !important',
        width: '100vw !important',
        height: '100vh !important',
        backgroundColor: 'rgba(0,0,0,0.7) !important',
        zIndex: '999999 !important',
        overflow: 'auto !important',
        display: 'block !important',
        margin: '0 !important',
        padding: '0 !important',
        border: 'none !important',
        transform: 'none !important',
        transition: 'none !important',
        animation: 'none !important'
      }}
    >
      <div
        id="consent-modal-card-unique"
        style={{
          position: 'absolute !important',
          top: '100px !important',
          left: '50% !important',
          transform: 'translateX(-50%) !important',
          width: '500px !important',
          maxWidth: '90vw !important',
          backgroundColor: '#ffffff !important',
          padding: '40px !important',
          borderRadius: '8px !important',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3) !important',
          margin: '0 !important',
          transition: 'none !important',
          animation: 'none !important'
        }}
      >
        <h2 style={{
          margin: '0 0 30px 0 !important',
          fontSize: '24px !important',
          fontWeight: 'bold !important',
          color: '#1f2937 !important',
          transition: 'none !important'
        }}>
          Save to Dashboard?
        </h2>

        <div style={{ marginBottom: '30px !important' }}>
          {/* SAVE Option */}
          <div
            onClick={() => setChoice('save')}
            style={{
              padding: '20px !important',
              border: choice === 'save' ? '3px solid blue !important' : '1px solid #ccc !important',
              marginBottom: '15px !important',
              cursor: 'pointer !important',
              backgroundColor: choice === 'save' ? '#e3f2fd !important' : 'white !important',
              borderRadius: '4px !important',
              transition: 'none !important',
              animation: 'none !important',
              transform: 'none !important'
            }}
          >
            <div style={{ marginBottom: '10px !important', fontWeight: 'bold !important', color: '#1f2937 !important' }}>
              <input
                type="radio"
                checked={choice === 'save'}
                onChange={() => setChoice('save')}
                style={{ marginRight: '10px !important', cursor: 'pointer !important' }}
              />
              SAVE - Enable alerts and services
            </div>
            <div style={{ marginLeft: '30px !important', fontSize: '14px !important', color: '#4b5563 !important' }}>
              • Get trade alerts<br/>
              • Access professional services<br/>
              • View history in dashboard
            </div>
          </div>

          {/* DON'T SAVE Option */}
          <div
            onClick={() => setChoice('dont-save')}
            style={{
              padding: '20px !important',
              border: choice === 'dont-save' ? '3px solid blue !important' : '1px solid #ccc !important',
              cursor: 'pointer !important',
              backgroundColor: choice === 'dont-save' ? '#e3f2fd !important' : 'white !important',
              borderRadius: '4px !important',
              transition: 'none !important',
              animation: 'none !important',
              transform: 'none !important'
            }}
          >
            <div style={{ marginBottom: '10px !important', fontWeight: 'bold !important', color: '#1f2937 !important' }}>
              <input
                type="radio"
                checked={choice === 'dont-save'}
                onChange={() => setChoice('dont-save')}
                style={{ marginRight: '10px !important', cursor: 'pointer !important' }}
              />
              DON'T SAVE - View only
            </div>
            <div style={{ marginLeft: '30px !important', fontSize: '14px !important', color: '#4b5563 !important' }}>
              • No alerts<br/>
              • No services<br/>
              • No storage
            </div>
          </div>
        </div>

        {/* CONFIRM BUTTON */}
        <button
          onClick={() => {
            console.log('CLICKED BUTTON - Choice:', choice);
            onContinue(choice === 'save');
          }}
          style={{
            width: '100% !important',
            padding: '15px !important',
            backgroundColor: '#2563eb !important',
            color: 'white !important',
            border: 'none !important',
            borderRadius: '4px !important',
            fontSize: '18px !important',
            fontWeight: 'bold !important',
            cursor: 'pointer !important',
            transition: 'none !important',
            animation: 'none !important',
            transform: 'none !important'
          }}
        >
          CONFIRM {choice === 'save' ? 'SAVE' : 'DON\'T SAVE'}
        </button>

        <p style={{
          marginTop: '20px !important',
          fontSize: '12px !important',
          textAlign: 'center !important',
          color: '#666 !important'
        }}>
          Legal: You can delete your data anytime
        </p>
      </div>
    </div>
  );
}

// Export WITHOUT React.memo to allow re-renders
export default SaveDataConsentModal;
