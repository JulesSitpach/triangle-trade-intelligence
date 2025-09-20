/**
 * Authorization Step - Step 4: Authorization and Certificate Generation
 * Collects authorized signatory information and importer details
 */

import React, { useState, useEffect } from 'react';

export default function AuthorizationStep({ formData, updateFormData, workflowData, certificateData, onGenerateCertificate, onPreviewCertificate, onDownloadCertificate, onEmailToImporter, previewData, generatedPDF }) {
  const [authData, setAuthData] = useState({
    // Authorized Signatory Information (NEW DATA COLLECTION)
    signatory_name: '',
    signatory_title: '',
    signatory_email: '',
    signatory_phone: '',
    
    // Authorization checkboxes
    accuracy_certification: false,
    authority_certification: false,
    ...formData
  });

  // Update parent when authData changes
  useEffect(() => {
    Object.keys(authData).forEach(key => {
      updateFormData(key, authData[key]);
    });
  }, [authData]);

  // Auto-check certification boxes when certificate is generated
  useEffect(() => {
    if (previewData && previewData.professional_certificate) {
      // Automatically check both certification boxes once certificate is successfully generated
      if (!authData.accuracy_certification || !authData.authority_certification) {
        setAuthData(prev => ({
          ...prev,
          accuracy_certification: true,
          authority_certification: true
        }));
      }
    }
  }, [previewData]);

  const handleFieldChange = (field, value) => {
    setAuthData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const titleOptions = [
    'President',
    'Export Manager', 
    'Compliance Officer',
    'Trade Director',
    'Supply Chain Manager',
    'Operations Manager',
    'General Manager',
    'Director of Trade',
    'Customs Manager'
  ];

  // Get company name from workflow data for certification text
  const companyName = workflowData?.company?.name || 'this company';

  return (
    <div className="element-spacing">
      {/* 1. Authorization Section - NEW DATA COLLECTION */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📝 CERTIFICATE AUTHORIZATION</h3>
        </div>
        
        <div className="form-section">
          <h4 className="section-title">Authorized Signatory Information</h4>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={authData.signatory_name}
                onChange={(e) => handleFieldChange('signatory_name', e.target.value)}
                placeholder="Enter full name of authorized signatory"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Title/Position *</label>
              <select
                className="form-input"
                value={authData.signatory_title}
                onChange={(e) => handleFieldChange('signatory_title', e.target.value)}
                required
              >
                <option value="">Select title/position</option>
                {titleOptions.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={authData.signatory_email}
                onChange={(e) => handleFieldChange('signatory_email', e.target.value)}
                placeholder="signatory@company.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                type="tel"
                className="form-input"
                value={authData.signatory_phone}
                onChange={(e) => handleFieldChange('signatory_phone', e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Importer Information - NEW DATA COLLECTION */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📥 IMPORTER DETAILS</h3>
          <div className="text-body">
            Information about your customer (the importing company)
          </div>
        </div>
        
        <div className="form-section">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-input"
                value={authData.importer_name || ''}
                onChange={(e) => handleFieldChange('importer_name', e.target.value)}
                placeholder="Enter importing company name"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Address *</label>
              <textarea
                className="form-input"
                value={authData.importer_address || ''}
                onChange={(e) => handleFieldChange('importer_address', e.target.value)}
                placeholder="Complete address including street, city, state/province, postal code"
                rows="3"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Tax ID/EIN *</label>
              <input
                type="text"
                className="form-input"
                value={authData.importer_tax_id || ''}
                onChange={(e) => handleFieldChange('importer_tax_id', e.target.value)}
                placeholder="Enter importer's tax identification number"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={authData.importer_contact_person || ''}
                onChange={(e) => handleFieldChange('importer_contact_person', e.target.value)}
                placeholder="Primary contact at importing company"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={authData.importer_phone || ''}
                onChange={(e) => handleFieldChange('importer_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={authData.importer_email || ''}
                onChange={(e) => handleFieldChange('importer_email', e.target.value)}
                placeholder="contact@importer.com"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Country *</label>
              <select
                className="form-input"
                value={authData.importer_country || ''}
                onChange={(e) => handleFieldChange('importer_country', e.target.value)}
                required
              >
                <option value="">Select country</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Certificate Preview - Shows data from previous steps */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">📋 CERTIFICATE PREVIEW</h3>
            <div className="text-body">
              Review the information that will appear on your USMCA Certificate of Origin
            </div>
          </div>
          <button 
            className="btn-primary"
            disabled={!authData.importer_name}
            onClick={() => onPreviewCertificate && onPreviewCertificate(authData)}
          >
            📄 Generate & Preview Certificate
          </button>
        </div>
        
        <div className="form-section">
          {/* Certificate Preview Window - Shows professional certificate when generated */}
          {previewData && previewData.professional_certificate ? (
            <div className="element-spacing">
              <div className="alert alert-success">
                <div className="alert-content">
                  <div className="alert-title">✅ Official USMCA Certificate Generated</div>
                  <div className="text-body">
                    Certificate #{previewData.professional_certificate.certificate_number} | Trust Score: {(previewData.professional_certificate.trust_verification?.overall_trust_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Full Certificate Display */}
              <div style={{border: '2px solid #2563eb', padding: '20px', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif'}}>
                <div style={{textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px'}}>
                  <h3 style={{margin: '0', fontSize: '16px', fontWeight: 'bold'}}>UNITED STATES-MEXICO-CANADA AGREEMENT</h3>
                  <h4 style={{margin: '5px 0', fontSize: '14px', fontWeight: 'bold'}}>CERTIFICATE OF ORIGIN</h4>
                  <div style={{fontSize: '12px', marginTop: '10px'}}>
                    Certificate No: {previewData.professional_certificate.certificate_number} | 
                    Date: {new Date(previewData.professional_certificate.generation_info?.generated_date).toLocaleDateString()}
                  </div>
                </div>

                {/* FIELD 1 - EXPORTER */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 1 - EXPORTER INFORMATION
                  </div>
                  <div><strong>Company:</strong> {previewData.professional_certificate.exporter?.name}</div>
                  <div><strong>Address:</strong> {previewData.professional_certificate.exporter?.address}</div>
                  <div><strong>Country:</strong> {previewData.professional_certificate.exporter?.country}</div>
                  <div><strong>Tax ID:</strong> {previewData.professional_certificate.exporter?.tax_id}</div>
                </div>

                {/* FIELD 2 - CERTIFIER */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 2 - CERTIFIER INFORMATION
                  </div>
                  <div><strong>Certifier Type:</strong> {previewData.professional_certificate.certifier?.type || 'Exporter'}</div>
                  <div><strong>Company:</strong> {previewData.professional_certificate.certifier?.name}</div>
                  <div><strong>Address:</strong> {previewData.professional_certificate.certifier?.address}</div>
                  <div><strong>Country:</strong> {previewData.professional_certificate.certifier?.country}</div>
                </div>

                {/* FIELD 3 - PRODUCER */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 3 - PRODUCER INFORMATION
                  </div>
                  <div><strong>Producer:</strong> {previewData.professional_certificate.producer?.name}</div>
                  <div><strong>Address:</strong> {previewData.professional_certificate.producer?.address}</div>
                  <div><strong>Country:</strong> {previewData.professional_certificate.producer?.country}</div>
                  <div><strong>Same as Exporter:</strong> {previewData.professional_certificate.producer?.same_as_exporter ? 'Yes' : 'No'}</div>
                </div>

                {/* FIELD 4 - IMPORTER */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 4 - IMPORTER INFORMATION
                  </div>
                  <div><strong>Company:</strong> {previewData.professional_certificate.importer?.name}</div>
                  <div><strong>Address:</strong> {previewData.professional_certificate.importer?.address}</div>
                  <div><strong>Country:</strong> {previewData.professional_certificate.importer?.country}</div>
                  <div><strong>Tax ID:</strong> {previewData.professional_certificate.importer?.tax_id}</div>
                </div>

                {/* FIELD 5 - DESCRIPTION OF GOOD(S) */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 5 - DESCRIPTION OF GOOD(S)
                  </div>
                  <div><strong>HS Code:</strong> {previewData.professional_certificate.hs_classification?.code}</div>
                  <div><strong>Description:</strong> {previewData.professional_certificate.product?.description}</div>
                  <div><strong>Manufacturing Location:</strong> {previewData.professional_certificate.country_of_origin}</div>
                </div>

                {/* FIELD 6 - PREFERENCE CRITERION */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 6 - PREFERENCE CRITERION
                  </div>
                  <div><strong>Criterion:</strong> {previewData.professional_certificate.preference_criterion}</div>
                  <div><strong>Explanation:</strong> {previewData.professional_certificate.criterion_explanation}</div>
                  <div><strong>Regional Value Content:</strong> {previewData.professional_certificate.regional_value_content}</div>
                </div>

                {/* FIELD 7 - PRODUCER DECLARATION */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 7 - PRODUCER DECLARATION
                  </div>
                  <div><strong>Is Producer:</strong> {previewData.professional_certificate.producer_declaration?.is_producer ? 'YES' : 'NO'}</div>
                  <div><strong>Declaration:</strong> {previewData.professional_certificate.producer_declaration?.declaration}</div>
                </div>

                {/* FIELD 8 - HS CLASSIFICATION */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 8 - HS CLASSIFICATION
                  </div>
                  <div><strong>HS Code:</strong> {previewData.professional_certificate.hs_classification?.code}</div>
                  <div><strong>Verified:</strong> {previewData.professional_certificate.hs_classification?.verified ? 'Yes' : 'No'}</div>
                  <div><strong>Source:</strong> {previewData.professional_certificate.hs_classification?.verification_source}</div>
                </div>

                {/* FIELD 9 - METHOD OF QUALIFICATION */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 9 - METHOD OF QUALIFICATION
                  </div>
                  <div><strong>Method:</strong> {previewData.professional_certificate.qualification_method?.method}</div>
                  <div><strong>Description:</strong> {previewData.professional_certificate.qualification_method?.description}</div>
                </div>

                {/* FIELD 10 - COUNTRY OF ORIGIN */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 10 - COUNTRY OF ORIGIN
                  </div>
                  <div><strong>Country:</strong> {previewData.professional_certificate.country_of_origin}</div>
                  <div><strong>Manufacturing Location:</strong> {previewData.professional_certificate.country_of_origin}</div>
                </div>

                {/* FIELD 11 - BLANKET PERIOD */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 11 - BLANKET PERIOD
                  </div>
                  <div><strong>Start Date:</strong> {previewData.professional_certificate.blanket_period?.start_date}</div>
                  <div><strong>End Date:</strong> {previewData.professional_certificate.blanket_period?.end_date}</div>
                </div>

                {/* FIELD 12 - AUTHORIZED SIGNATURE */}
                <div style={{margin: '15px 0', padding: '10px', border: '1px solid #ddd', backgroundColor: 'white'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    FIELD 12 - AUTHORIZED SIGNATURE
                  </div>
                  <div><strong>Signatory Name:</strong> {previewData.professional_certificate.authorization?.signatory_name}</div>
                  <div><strong>Title:</strong> {previewData.professional_certificate.authorization?.signatory_title}</div>
                  <div><strong>Date:</strong> {new Date(previewData.professional_certificate.authorization?.signature_date).toLocaleDateString()}</div>
                  <div><strong>Declaration Accepted:</strong> {previewData.professional_certificate.authorization?.declaration_accepted ? 'Yes' : 'No'}</div>
                </div>

                {/* TRUST VERIFICATION */}
                {previewData.professional_certificate.trust_verification && (
                  <div style={{margin: '15px 0', padding: '10px', border: '2px solid #2563eb', backgroundColor: '#eff6ff'}}>
                    <div style={{fontWeight: 'bold', backgroundColor: '#2563eb', color: 'white', padding: '5px', marginBottom: '10px'}}>
                      🛡️ TRUST VERIFICATION
                    </div>
                    <div><strong>Trust Score:</strong> {(previewData.professional_certificate.trust_verification.overall_trust_score * 100).toFixed(1)}%</div>
                    <div><strong>Trust Level:</strong> {previewData.professional_certificate.trust_verification.trust_level?.toUpperCase()}</div>
                    <div><strong>Verification Status:</strong> {previewData.professional_certificate.trust_verification.verification_status}</div>
                  </div>
                )}

                {/* AUTHORIZED SIGNATURE SECTION */}
                <div style={{marginTop: '20px', borderTop: '2px solid #000', paddingTop: '15px'}}>
                  <div style={{fontWeight: 'bold', backgroundColor: '#e5e7eb', padding: '5px', marginBottom: '10px'}}>
                    AUTHORIZED SIGNATURE
                  </div>
                  <div><strong>Signatory:</strong> {previewData.professional_certificate.authorization?.signatory_name}</div>
                  <div><strong>Title:</strong> {previewData.professional_certificate.authorization?.signatory_title}</div>
                  <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                  
                  <div style={{marginTop: '15px', fontSize: '12px'}}>
                    <strong>CERTIFICATION:</strong> I certify that the information on this document is true and accurate 
                    and I assume the responsibility for proving such representations. I further certify that the good(s) 
                    qualify as originating under the USMCA.
                  </div>
                </div>

                <div style={{marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '10px'}}>
                  Generated by Triangle Intelligence Platform with Trust Verification
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="text-body">
                  ℹ️ If any information above is incorrect, go back to previous steps to make changes before finalizing the certificate.
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>


      {/* 3. Digital Signature & Certification */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">✍️ DIGITAL SIGNATURE</h3>
        </div>
        
        <div className="form-section">
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={authData.accuracy_certification}
                onChange={(e) => handleFieldChange('accuracy_certification', e.target.checked)}
                required
              />
              <span className="checkbox-text">
                I certify that the information provided is true and accurate
              </span>
            </label>
            
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={authData.authority_certification}
                onChange={(e) => handleFieldChange('authority_certification', e.target.checked)}
                required
              />
              <span className="checkbox-text">
                I am authorized to sign this certificate on behalf of {companyName}
              </span>
            </label>
          </div>
          
          <div className="alert alert-info">
            <div className="alert-content">
              <div className="alert-title">Certification Statement</div>
              <div className="text-body">
                "I certify that the goods described in this certificate qualify as originating goods 
                under the USMCA and that the information contained herein is true and accurate."
              </div>
            </div>
          </div>

          {/* Certificate Generation Status & Actions */}
          <div className="element-spacing">
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{fontSize: '10px', color: '#666', marginBottom: '10px'}}>
                Debug: previewData: {previewData ? 'YES' : 'NO'}, generatedPDF: {generatedPDF ? 'YES' : 'NO'}
              </div>
            )}
            
            {/* Certificate Generation Success - Clean display */}
            {previewData && previewData.professional_certificate && (
              <div className="alert alert-success">
                <div className="alert-content">
                  <div className="alert-title">✅ Certificate Generated Successfully</div>
                  <div className="text-body">
                    Certificate #{previewData.certificate_number} | Trust Score: {previewData.professional_certificate.trust_verification ? 
                    (previewData.professional_certificate.trust_verification.overall_trust_score * 100).toFixed(1) + '%' : 'Calculating...'} | 
                    HS Code: {previewData.professional_certificate.hs_classification?.code || workflowData?.product?.hs_code || 'Not specified'}
                  </div>
                </div>
              </div>
            )}

            {/* Download/Email Actions - Show when certificate is generated */}
            {(previewData && previewData.professional_certificate) && (
              <div className="hero-buttons">
                <button 
                  className="btn-primary"
                  onClick={() => onDownloadCertificate && onDownloadCertificate()}
                  disabled={!authData.accuracy_certification || !authData.authority_certification}
                >
                  💾 Download PDF Certificate
                </button>
                
                <button
                  className="btn-secondary"
                  onClick={() => onEmailToImporter && onEmailToImporter(authData)}
                  disabled={!authData.importer_email || !authData.accuracy_certification || !authData.authority_certification}
                >
                  ✉️ Email to Importer
                </button>

                <button
                  className="btn-primary"
                  onClick={() => window.location.href = '/pricing'}
                >
                  🚨 Subscribe for Crisis Alerts
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => window.location.href = '/services/mexico-trade-services'}
                >
                  🇲🇽 Need Mexico Suppliers?
                </button>
              </div>
            )}
            
            {/* Certification Required Warning */}
            {(previewData && previewData.professional_certificate) && (!authData.accuracy_certification || !authData.authority_certification) && (
              <div className="alert alert-warning">
                <div className="alert-content">
                  <div className="alert-title">📝 Certification Required</div>
                  <div className="text-body">
                    Check both certification boxes above to enable download and email options.
                  </div>
                </div>
              </div>
            )}
            
            {/* Initial Instructions */}
            {!previewData && (
              <div className="text-body" style={{textAlign: 'center'}}>
                Use "📄 Generate & Preview Certificate" button above to create your certificate
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}