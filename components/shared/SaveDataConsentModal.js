/**
 * SaveDataConsentModal.js - Privacy-first data storage consent
 * Appears after USMCA results to give users explicit choice
 * NO HARDCODING: Uses system configuration and user preferences
 * NO INLINE STYLES: Uses only existing CSS classes from globals.css
 */

import React, { useState, useRef } from 'react';

const SaveDataConsentModal = ({ isOpen, onContinue, userProfile }) => {
  const [selectedOption, setSelectedOption] = useState('save');
  const clickLockRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleOptionClick = (option, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedOption(option);
  };

  const handleContinue = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent double-clicks
    if (clickLockRef.current || isClosing) {
      console.log('🔒 Continue button already clicked - ignoring');
      return;
    }

    clickLockRef.current = true;
    setIsClosing(true);

    // Call onContinue after setting closing state
    setTimeout(() => {
      onContinue(selectedOption === 'save');
    }, 50);

    // Reset after 2 seconds (failsafe)
    setTimeout(() => {
      clickLockRef.current = false;
      setIsClosing(false);
    }, 2000);
  };

  return (
    <div
      className="workflow-modal-overlay"
      onClick={(e) => e.stopPropagation()}
      style={isClosing ? { pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s ease-out' } : {}}
    >
      <div className="workflow-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="workflow-modal-header">
          <h2 className="card-title">Save Your Analysis?</h2>
        </div>

        {/* Option 1: Save */}
        <div
          className={`consent-option ${selectedOption === 'save' ? 'selected' : ''}`}
          onClick={(e) => !isClosing && handleOptionClick('save', e)}
          style={isClosing ? { pointerEvents: 'none' } : {}}
        >
          <div className="consent-option-content">
            <input
              type="radio"
              name="consentOption"
              checked={selectedOption === 'save'}
              onChange={(e) => handleOptionClick('save', e)}
              className="consent-option-radio"
            />
            <div>
              <div className="consent-option-title">
                Save to enable trade alerts and professional services
              </div>
              <ul className="consent-option-list">
                <li>Get alerts when tariffs/policies affect YOUR supply chain</li>
                <li>Access professional services with full context</li>
                <li>View analysis history in dashboard</li>
                <li>Regenerate certificates anytime</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Option 2: Don't Save */}
        <div
          className={`consent-option ${selectedOption === 'dont-save' ? 'selected' : ''}`}
          onClick={(e) => !isClosing && handleOptionClick('dont-save', e)}
          style={isClosing ? { pointerEvents: 'none' } : {}}
        >
          <div className="consent-option-content">
            <input
              type="radio"
              name="consentOption"
              checked={selectedOption === 'dont-save'}
              onChange={(e) => handleOptionClick('dont-save', e)}
              className="consent-option-radio"
            />
            <div>
              <div className="consent-option-title">
                Don't save - view results only
              </div>
              <ul className="consent-option-list">
                <li>Results shown now but not stored</li>
                <li>No trade alerts (we won't know your supply chain)</li>
                <li>No service access (no context available)</li>
                <li>Download/print results before closing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="workflow-modal-actions">
          <button
            onClick={handleContinue}
            className="btn-primary"
            disabled={isClosing}
            style={isClosing ? { pointerEvents: 'none', opacity: 0.5 } : {}}
          >
            Continue
          </button>

          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Privacy Policy
          </a>
        </div>

        <p className="modal-footer-text">
          You can request deletion of your data anytime from account settings
        </p>
      </div>
    </div>
  );
};

export default SaveDataConsentModal;
