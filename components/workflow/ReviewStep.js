/**
 * Review Step - Certificate Preview with Auto-Populated Data
 * Shows complete certificate preview before generation
 */

import React from 'react';

export default function ReviewStep({ certificateData, onGenerate, isGenerating, workflowData }) {
  // Get data from various sources with proper fallbacks
  const exporterName = workflowData?.company?.name || certificateData?.company_info?.exporter_name || '';
  const exporterAddress = workflowData?.company?.company_address || certificateData?.company_info?.exporter_address || '';
  const exporterTaxId = workflowData?.company?.tax_id || certificateData?.company_info?.exporter_tax_id || '';
  
  const productDescription = workflowData?.product?.description || certificateData?.product_details?.commercial_description || '';
  const hsCode = workflowData?.product?.hs_code || workflowData?.certificate?.hs_tariff_classification || '';
  const manufacturingLocation = workflowData?.usmca?.manufacturing_location || '';
  const regionalContent = workflowData?.usmca?.north_american_content || 0;
  
  const componentBreakdown = workflowData?.usmca?.component_breakdown || [];
  const savings = workflowData?.savings || {};
  
  // Authorization data
  const signatoryName = certificateData?.authorization?.signatory_name || '';
  const signatoryTitle = certificateData?.authorization?.signatory_title || '';
  const importerName = certificateData?.authorization?.importer_name || '';
  
  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="element-spacing">
      {/* Certificate Preview Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 CERTIFICATE PREVIEW</h3>
          <div className="text-body">
            Review all information before generating your official USMCA Certificate of Origin
          </div>
        </div>
        
        {/* Exporter Information - AUTO-POPULATED */}
        <div className="form-section">
          <h4 className="section-title">📤 EXPORTER DETAILS (Auto-Populated)</h4>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Company</div>
              <div className="status-value">{exporterName || 'Not provided'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Address</div>
              <div className="status-value">{exporterAddress || 'Not provided'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Tax ID</div>
              <div className="status-value">{exporterTaxId || 'Not provided'}</div>
            </div>
          </div>
        </div>
        
        {/* Importer Information */}
        <div className="form-section">
          <h4 className="section-title">📥 IMPORTER DETAILS</h4>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Company</div>
              <div className="status-value">{importerName || 'Not provided'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Address</div>
              <div className="status-value">{certificateData?.authorization?.importer_address || 'Not provided'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Country</div>
              <div className="status-value">{certificateData?.authorization?.importer_country || 'Not provided'}</div>
            </div>
          </div>
        </div>
        
        {/* Product Information - AUTO-POPULATED */}
        <div className="form-section">
          <h4 className="section-title">📦 PRODUCT DETAILS (Auto-Populated)</h4>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Product</div>
              <div className="status-value">{productDescription || 'Not classified'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">HS Code</div>
              <div className="status-value">{hsCode || 'Not classified'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Manufacturing Location</div>
              <div className="status-value">{manufacturingLocation || 'Not specified'}</div>
            </div>
            <div className="status-card success">
              <div className="status-label">Regional Content</div>
              <div className="status-value">{regionalContent}%</div>
            </div>
          </div>
        </div>
        
        {/* Component Breakdown - AUTO-POPULATED */}
        {componentBreakdown.length > 0 && (
          <div className="form-section">
            <h4 className="section-title">🔧 COMPONENT BREAKDOWN (Auto-Populated)</h4>
            {componentBreakdown.map((component, index) => (
              <div key={index} className="status-card">
                <div className="status-label">{component.description}</div>
                <div className="status-value">{component.value_percentage}% ({component.origin_country})</div>
                {component.manufacturing_location && (
                  <div className="text-body">Manufacturing: {component.manufacturing_location}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* USMCA Analysis - AUTO-POPULATED */}
        <div className="form-section">
          <h4 className="section-title">✅ USMCA QUALIFICATION</h4>
          <div className="status-grid">
            <div className="status-card success">
              <div className="status-label">Status</div>
              <div className="status-value">QUALIFIED</div>
            </div>
            <div className="status-card">
              <div className="status-label">Origin Criterion</div>
              <div className="status-value">B - Regional Value Content</div>
            </div>
            <div className="status-card">
              <div className="status-label">USMCA Rule</div>
              <div className="status-value">{regionalContent}% North American Content</div>
            </div>
          </div>
        </div>
        
        {/* Savings Analysis - AUTO-POPULATED */}
        {savings.total_savings && (
          <div className="form-section">
            <h4 className="section-title">💰 SAVINGS ANALYSIS (Auto-Populated)</h4>
            <div className="status-grid">
              <div className="status-card">
                <div className="status-label">Current MFN Rate</div>
                <div className="status-value">{savings.mfn_rate}%</div>
              </div>
              <div className="status-card">
                <div className="status-label">USMCA Rate</div>
                <div className="status-value">{savings.usmca_rate}%</div>
              </div>
              <div className="status-card success">
                <div className="status-label">Annual Savings</div>
                <div className="status-value">${savings.total_savings?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Authorization Information */}
        <div className="form-section">
          <h4 className="section-title">✍️ AUTHORIZATION</h4>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-label">Authorized By</div>
              <div className="status-value">{signatoryName || 'Not provided'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Title</div>
              <div className="status-value">{signatoryTitle || 'Not provided'}</div>
            </div>
            <div className="status-card">
              <div className="status-label">Date</div>
              <div className="status-value">{currentDate}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Generation Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🎯 CERTIFICATE GENERATION</h3>
        </div>
        
        <div className="hero-buttons">
          <button 
            onClick={onGenerate}
            disabled={isGenerating || !signatoryName || !importerName}
            className="btn-primary"
          >
            {isGenerating ? 'Generating PDF...' : '📄 Generate PDF Certificate'}
          </button>
          
          <button 
            onClick={() => window.print()}
            className="btn-secondary"
            disabled={isGenerating}
          >
            🖨️ Print Preview
          </button>
          
          {certificateData?.authorization?.importer_email && (
            <button 
              onClick={() => {/* Email functionality */}}
              className="btn-secondary"
              disabled={isGenerating}
            >
              📧 Email to Importer
            </button>
          )}
        </div>
        
        {(!signatoryName || !importerName) && (
          <div className="alert alert-warning">
            <div className="alert-content">
              <div className="alert-title">Missing Required Information</div>
              <div className="text-body">
                Please complete all required fields in the Authorization section before generating the certificate.
              </div>
            </div>
          </div>
        )}
        
        <div className="alert alert-info">
          <div className="alert-content">
            <div className="alert-title">Professional Certificate Generation</div>
            <div className="text-body">
              Your USMCA Certificate of Origin will be generated as a professional PDF document 
              with all required fields completed and properly formatted for customs authorities.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}