/**
 * SaveDataConsentModal.js - Privacy-first data storage consent
 * Gives users explicit choice: Save for alerts/services OR Erase after viewing
 * NO HARDCODING: Uses system configuration and user preferences
 * NO INLINE STYLES: Uses only existing CSS classes from globals.css
 */

import React from 'react';

const SaveDataConsentModal = ({ isOpen, onSave, onErase, userProfile }) => {
  if (!isOpen) return null;

  return (
    <div className="workflow-modal-overlay">
      <div className="workflow-modal-content">
        <div className="workflow-modal-header">
          <h2>💾 Save Your Trade Analysis?</h2>
          <p className="text-body">Choose how you want to handle your data</p>
        </div>

        <div className="card consent-option-card">
          <div className="card-header">
            <h3 className="card-title">Option 1: Save for Ongoing Value</h3>
          </div>
          <div className="card-description">
            <p><strong>✅ What you get:</strong></p>
            <ul>
              <li>🚨 <strong>Trade Alerts:</strong> Get notified when policy changes affect your supply chain</li>
              <li>👨‍💼 <strong>Professional Services:</strong> Jorge &amp; Cristina can help with your actual data</li>
              <li>📜 <strong>Certificate History:</strong> Regenerate USMCA certificates anytime</li>
              <li>📊 <strong>Dashboard Access:</strong> View your analysis history</li>
            </ul>

            <p><strong>What we'll save:</strong></p>
            <ul>
              <li>Company name and trade profile</li>
              <li>Component origins: {userProfile?.componentOrigins?.length || 0} components</li>
              <li>HS codes and product descriptions</li>
              <li>USMCA qualification status</li>
            </ul>

            <p><strong>🔒 Security:</strong></p>
            <p className="text-body">
              Your data is stored securely using enterprise-grade encryption and authentication.
              We use Supabase, a trusted platform that encrypts data both in storage and transmission.
              Only you can access your company information through secure login.
            </p>
          </div>
        </div>

        <div className="card consent-option-card">
          <div className="card-header">
            <h3 className="card-title">Option 2: Erase After Viewing</h3>
          </div>
          <div className="card-description">
            <p><strong>🔒 Privacy-first approach:</strong></p>
            <ul>
              <li>View your results now</li>
              <li>Download or print for your records</li>
              <li>All data deleted after this session</li>
              <li>No ongoing alerts or services available</li>
            </ul>

            <p className="text-body">
              Note: Without saved data, we cannot send you alerts about policy changes
              affecting your specific supply chain or provide professional services.
            </p>
          </div>
        </div>

        <div className="workflow-modal-actions">
          <button
            onClick={onSave}
            className="btn-primary btn-large"
          >
            ✅ Save My Analysis - Enable Alerts &amp; Services
          </button>

          <button
            onClick={onErase}
            className="btn-secondary"
          >
            🔒 Erase After Viewing - Privacy First
          </button>
        </div>

        <p className="text-body consent-footer">
          You can request deletion of your data anytime from your account settings.
          We don't sell or share your data with third parties.
        </p>
      </div>
    </div>
  );
};

export default SaveDataConsentModal;
