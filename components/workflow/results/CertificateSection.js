/**
 * CertificateSection - Certificate of Origin display and interactive form
 * Now includes digital form wizard for proper certificate completion
 */

import React from 'react';

export default function CertificateSection({ results, onDownloadCertificate }) {
  
  if (!results?.certificate) return null;

  const certificate = results.certificate;


  return (
    <div className="element-spacing">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Certificate of Origin</h3>
        </div>
        
        <div className="element-spacing">
          <div className="alert alert-info">
            <div className="alert-content">
              <div className="alert-title">USMCA Certificate Ready</div>
              <div className="text-body">
                Your USMCA Certificate of Origin is ready. Complete the digital form to generate a professional certificate.
              </div>
            </div>
          </div>
          
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Valid From</div>
              <div className="status-value">
                {new Date(certificate.blanket_start).toLocaleDateString()}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Valid Until</div>
              <div className="status-value">
                {new Date(certificate.blanket_end).toLocaleDateString()}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Preference Criterion</div>
              <div className="status-value">{certificate.preference_criterion}</div>
            </div>
          </div>
        </div>
        
        <div className="hero-buttons">
          <button 
            onClick={() => {
              // Save workflow results to localStorage instead of URL
              localStorage.setItem('usmca_workflow_results', JSON.stringify(results));
              
              // Navigate with clean URL
              window.location.href = '/usmca-certificate-completion';
            }}
            className="btn-primary"
          >
            📝 Complete Digital Form
          </button>
          
          <button 
            onClick={onDownloadCertificate}
            className="btn-secondary"
          >
            📄 Download Template (.txt)
          </button>
        </div>
        
        <div className="alert alert-warning">
          <div className="alert-content">
            <div className="alert-title">Recommended</div>
            <div className="text-body">
              Use the digital form to complete all required fields and generate a 
              professional certificate. The template download is a basic text file for reference only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}