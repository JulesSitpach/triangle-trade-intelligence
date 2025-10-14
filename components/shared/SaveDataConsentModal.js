/**
 * SaveDataConsentModal - ULTRA MINIMAL - ZERO CSS INTERFERENCE
 * Uses !important inline styles to override ALL CSS
 * Unique ID to prevent any class conflicts
 * Enhanced with clear data saving notification and opt-out options
 */

import React, { useState } from 'react';

function SaveDataConsentModal({ isOpen, onContinue, onSave, onErase, context = 'general' }) {
  const [choice, setChoice] = useState('save');

  // Support both old API (onContinue) and new API (onSave/onErase)
  const handleConfirm = () => {
    console.log('CLICKED BUTTON - Choice:', choice);

    if (onSave && onErase) {
      // New API - separate handlers
      if (choice === 'save') {
        onSave();
      } else {
        onErase();
      }
    } else if (onContinue) {
      // Old API - single handler with boolean
      onContinue(choice === 'save');
    }
  };

  // DEBUG: Log when modal renders
  console.log('🎯 SaveDataConsentModal RENDER - isOpen:', isOpen, 'Context:', context);

  if (!isOpen) {
    console.log('❌ Modal isOpen=false, returning null');
    return null;
  }

  console.log('✅ Modal isOpen=true, rendering modal JSX');

  // Context-specific messaging
  const getTitle = () => {
    if (context === 'alerts') return '🔔 Set Up Trade Alerts - Save Your Data?';
    if (context === 'certificate') return '📄 Generate Certificate - Save Your Data?';
    return 'Save to Dashboard?';
  };

  const getNotification = () => {
    if (context === 'alerts') {
      return 'To receive personalized trade alerts, we need to save your workflow data. You can opt out and skip alerts.';
    }
    if (context === 'certificate') {
      return 'To save your certificate to the dashboard, we need to store your workflow data. You can opt out and just download once.';
    }
    return 'Choose how to handle your workflow data:';
  };

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
          top: '80px !important',
          left: '50% !important',
          transform: 'translateX(-50%) !important',
          width: '550px !important',
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
          margin: '0 0 15px 0 !important',
          fontSize: '24px !important',
          fontWeight: 'bold !important',
          color: '#1f2937 !important',
          transition: 'none !important'
        }}>
          {getTitle()}
        </h2>

        {/* Clear notification about data saving */}
        <div style={{
          marginBottom: '25px !important',
          padding: '15px !important',
          backgroundColor: '#f0f9ff !important',
          border: '2px solid #0ea5e9 !important',
          borderRadius: '6px !important',
          fontSize: '14px !important',
          color: '#0c4a6e !important',
          lineHeight: '1.5 !important'
        }}>
          <strong style={{ display: 'block !important', marginBottom: '8px !important' }}>
            📋 Data Notification:
          </strong>
          {getNotification()}
        </div>

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

          {/* DON'T SAVE Option - More prominent */}
          <div
            onClick={() => setChoice('dont-save')}
            style={{
              padding: '20px !important',
              border: choice === 'dont-save' ? '3px solid #dc2626 !important' : '2px solid #e5e7eb !important',
              cursor: 'pointer !important',
              backgroundColor: choice === 'dont-save' ? '#fef2f2 !important' : 'white !important',
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
              🚫 DON'T SAVE - Skip this feature
            </div>
            <div style={{ marginLeft: '30px !important', fontSize: '14px !important', color: '#4b5563 !important' }}>
              {context === 'alerts' ? (
                <>
                  • Skip trade alerts setup<br/>
                  • No data will be stored<br/>
                  • Return to dashboard<br/>
                  • You can always set up alerts later
                </>
              ) : (
                <>
                  • No data saved to dashboard<br/>
                  • One-time use only<br/>
                  • Data cleared after session<br/>
                  • Must redo workflow later
                </>
              )}
            </div>
          </div>
        </div>

        {/* CONFIRM BUTTON */}
        <button
          onClick={handleConfirm}
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
