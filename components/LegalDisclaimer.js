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
          <div className="alert-title">⚖️ Legal Scope</div>
          <div className="text-body">
            <strong>What We Provide:</strong> Trade consulting, USMCA assessment guidance, and strategic recommendations.
            <br />
            <strong>What We Don't Provide:</strong> We are not trade compliance experts. Official customs declarations and legal certifications require licensed professionals.
          </div>
        </div>
      </div>
    );
  }

  // Default full version for homepage, pricing, services overview
  return (
    <div className="alert alert-info">
      <div className="alert-content">
        <div className="alert-title">⚖️ Service Scope & Legal Notice</div>
        <div className="text-body">
          <p style={{marginBottom: '0.75rem'}}>
            <strong>What We Provide:</strong> Trade process consulting, USMCA qualification assessment and optimization guidance,
            logistics planning recommendations, supply chain analysis, and market entry strategy support.
          </p>
          <p style={{marginBottom: '0.75rem'}}>
            <strong>What We Don't Provide:</strong> We are not trade compliance experts. Official customs declarations,
            legal USMCA certifications, and formal compliance documents require partnership with licensed professionals.
          </p>
          <p style={{marginBottom: '0'}}>
            <strong>Partnership Model:</strong> For official customs broker services and legal certifications, we partner
            with licensed professionals (separate fees apply). Our services provide expert guidance and assessment to help
            you make informed decisions about your trade operations.
          </p>
        </div>
      </div>
    </div>
  );
}
