/**
 * Legal Disclaimer Component
 * Displays service scope and legal boundaries
 * To be used on all marketing and sales pages
 */

import React from 'react';

export default function LegalDisclaimer({ variant = 'default' }) {
  if (variant === 'compact') {
    // Compact version for service pages
    return (
      <div className="alert alert-info">
        <div className="alert-content">
          <div className="alert-title">⚖️ Important Disclaimer</div>
          <div className="text-body">
            <strong>What We Provide:</strong> Self-serve software platform for USMCA certificate generation and tariff analysis.
            <br />
            <strong>Your Responsibility:</strong> You verify all data accuracy. We provide tools, you own compliance. Consult licensed customs brokers for official certifications.
          </div>
        </div>
      </div>
    );
  }

  // Default full version for homepage, pricing, services overview
  return (
    <div className="alert alert-info">
      <div className="alert-content">
        <div className="alert-title">⚖️ Platform Disclaimer</div>
        <div className="text-body">
          <p style={{marginBottom: '0.75rem'}}>
            <strong>What We Provide:</strong> Self-serve SaaS platform for USMCA certificate generation, HS code classification,
            regional content calculations, and tariff savings analysis. AI-powered tools to automate compliance workflows.
          </p>
          <p style={{marginBottom: '0.75rem'}}>
            <strong>What We Don't Provide:</strong> We do not provide consulting, professional services, or legal advice.
            We are a software platform only. You are responsible for verifying all data accuracy and compliance decisions.
          </p>
          <p style={{marginBottom: '0'}}>
            <strong>User Responsibility:</strong> All certificate data, tariff calculations, and compliance analysis must be
            independently verified by you or licensed customs brokers before submission to authorities. By using this platform,
            you acknowledge sole responsibility for accuracy and compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
