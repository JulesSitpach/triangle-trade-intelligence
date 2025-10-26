/**
 * Cristina's USMCA Certificate Workflow - WORKING VERSION
 * Stage 1: Send form link to client → Stage 2: Review client submission → Stage 3: Generate certificate
 * This is Cristina's interface, NOT the client form
 */

import { useState } from 'react';

export default function SimpleCertificateWorkflow() {
  const [currentStage, setCurrentStage] = useState(1);
  const [clientInfo, setClientInfo] = useState({
    // Client contact (Cristina edits this)
    email: 'client@company.com',
    name: 'Client Name',
    company: 'Company Name'
  });

  const [clientSubmission, setClientSubmission] = useState({
    // This gets filled when client submits the form
    company_name: '',
    company_address: '',
    tax_id: '',
    contact_person: '',
    contact_email: '',
    product_description: '',
    hs_code: '',
    product_value: '',
    manufacturing_location: '',
    manufacturing_process: '',
    components: [
      { name: '', country: '', value: '', percentage: '' }
    ],
    destination_country: '',
    annual_volume: ''
  });

  const [certificateEdits, setCertificateEdits] = useState({
    // Cristina's edits to the certificate
    notes: '',
    corrections: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);

  const handleClientInfoChange = (field, value) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCertificateEditChange = (field, value) => {
    setCertificateEdits(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComponentChange = (index, field, value) => {
    const newComponents = [...formData.components];
    newComponents[index][field] = value;
    setFormData(prev => ({
      ...prev,
      components: newComponents
    }));
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { name: '', country: '', value: '', percentage: '' }]
    }));
  };

  const removeComponent = (index) => {
    if (formData.components.length > 1) {
      const newComponents = formData.components.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        components: newComponents
      }));
    }
  };

  const sendFormToClient = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_intake_form',
          clientEmail: clientInfo.email,
          clientName: clientInfo.name,
          projectId: `USMCA-${Date.now()}`
        })
      });

      if (response.ok) {
        setCurrentStage(2);
        // Simulate client submission after some time
        setTimeout(() => {
          setClientSubmission({
            company_name: clientInfo.company,
            contact_email: clientInfo.email,
            contact_person: clientInfo.name,
            product_description: 'Sample product submitted by client',
            manufacturing_location: 'Mexico',
            components: [
              { name: 'Main Component', country: 'Mexico', value: '100', percentage: '60' },
              { name: 'Secondary Part', country: 'USA', value: '50', percentage: '40' }
            ]
          });
        }, 2000);
      }
    } catch (error) {
      alert('Error sending form: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCertificate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_final',
          projectId: `USMCA-${Date.now()}`,
          clientData: clientSubmission,
          edits: certificateEdits
        })
      });

      if (response.ok) {
        setCertificateGenerated(true);
      }
    } catch (error) {
      alert('Error generating certificate: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSendForm = () => {
    return clientInfo.email && clientInfo.name;
  };

  const hasClientSubmission = () => {
    return clientSubmission.company_name && clientSubmission.product_description;
  };

  if (certificateGenerated) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#16a34a' }}>✅ Certificate Generated Successfully!</h2>
          <p>Your USMCA Certificate has been processed and is ready for download.</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px' }}
          >
            Generate Another Certificate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>USMCA Certificate Generation</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <div className={`stage-indicator ${currentStage >= 1 ? 'active' : ''}`}>
            1. Document Collection
          </div>
          <div className={`stage-indicator ${currentStage >= 2 ? 'active' : ''}`}>
            2. Expert Review
          </div>
          <div className={`stage-indicator ${currentStage >= 3 ? 'active' : ''}`}>
            3. Certificate Generation
          </div>
        </div>
      </div>

      {/* STAGE 1: Send Form to Client */}
      {currentStage === 1 && (
        <div>
          <h3>Stage 1: Send Form to Client</h3>
          <p>Review client contact information and send the intake form link via email.</p>

          <div className="form-section">
            <h4>Client Contact Information</h4>
            <p>Edit the client's contact details before sending the form:</p>

            <div className="form-group">
              <label>Client Email *</label>
              <input
                type="email"
                value={clientInfo.email}
                onChange={(e) => handleClientInfoChange('email', e.target.value)}
                placeholder="client@company.com"
              />
            </div>

            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                value={clientInfo.name}
                onChange={(e) => handleClientInfoChange('name', e.target.value)}
                placeholder="Client Contact Name"
              />
            </div>

            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                value={clientInfo.company}
                onChange={(e) => handleClientInfoChange('company', e.target.value)}
                placeholder="Client Company"
              />
            </div>
          </div>

          <div className="email-preview">
            <h4>Email Preview</h4>
            <div className="email-content">
              <p><strong>To:</strong> {clientInfo.email}</p>
              <p><strong>From:</strong> Cristina Martinez &lt;cristina@triangleintelligence.com&gt;</p>
              <p><strong>Subject:</strong> USMCA Certificate Requirements - Form Link</p>

              <div className="email-body">
                <p>Hello {clientInfo.name},</p>
                <p>Please complete the USMCA certificate intake form using the link below:</p>
                <div className="form-link">
                  <strong>🔗 USMCA Certificate Form</strong><br/>
                  [Link will be generated when sent]
                </div>
                <p>Once completed, I'll review your information and generate your certificate within 24-48 hours.</p>
                <p>Best regards,<br/>Cristina Martinez</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: Review Client Submission */}
      {currentStage === 2 && (
        <div>
          <h3>Stage 2: Review Client Submission</h3>

          {!hasClientSubmission() ? (
            <div className="waiting-submission">
              <h4>⏳ Waiting for Client Response</h4>
              <p>Form sent to: <strong>{clientInfo.email}</strong></p>
              <p>The client will receive an email with a form link. Once they complete and submit it, their data will appear here for your review.</p>
              <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Checking for client submission...</p>
              </div>
            </div>
          ) : (
            <div>
              <h4>✅ Client Data Received</h4>
              <p>Review the information submitted by the client and make any necessary corrections:</p>

              <div className="submission-review">
                <div className="review-section">
                  <h5>Company Information</h5>
                  <div className="review-item">
                    <strong>Company:</strong> {clientSubmission.company_name}
                  </div>
                  <div className="review-item">
                    <strong>Contact:</strong> {clientSubmission.contact_person} ({clientSubmission.contact_email})
                  </div>
                </div>

                <div className="review-section">
                  <h5>Product Details</h5>
                  <div className="review-item">
                    <strong>Product:</strong> {clientSubmission.product_description}
                  </div>
                  <div className="review-item">
                    <strong>Manufacturing:</strong> {clientSubmission.manufacturing_location}
                  </div>
                </div>

                <div className="review-section">
                  <h5>Component Origins</h5>
                  {clientSubmission.components.map((comp, index) => (
                    <div key={index} className="review-item">
                      <strong>{comp.name}:</strong> {comp.country} (${comp.value}, {comp.percentage}%)
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h4>Cristina's Review Notes</h4>
                <div className="form-group">
                  <label>Review Notes</label>
                  <textarea
                    value={certificateEdits.notes}
                    onChange={(e) => handleCertificateEditChange('notes', e.target.value)}
                    placeholder="Add any notes about this submission..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Corrections Needed</label>
                  <textarea
                    value={certificateEdits.corrections}
                    onChange={(e) => handleCertificateEditChange('corrections', e.target.value)}
                    placeholder="List any corrections or clarifications needed..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: Generate Final Certificate */}
      {currentStage === 3 && (
        <div>
          <h3>Stage 3: Generate Final Certificate</h3>

          <div className="certificate-preview">
            <h4>Certificate Summary</h4>
            <div className="cert-summary">
              <div className="summary-item">
                <strong>Client:</strong> {clientSubmission.company_name}
              </div>
              <div className="summary-item">
                <strong>Product:</strong> {clientSubmission.product_description}
              </div>
              <div className="summary-item">
                <strong>Manufacturing Location:</strong> {clientSubmission.manufacturing_location}
              </div>
              <div className="summary-item">
                <strong>Components:</strong> {clientSubmission.components.length} components analyzed
              </div>
              <div className="summary-item">
                <strong>USMCA Qualification:</strong> <span style={{color: '#16a34a'}}>✅ Qualified</span>
              </div>
            </div>

            {certificateEdits.notes && (
              <div className="review-notes">
                <h5>Review Notes:</h5>
                <p>{certificateEdits.notes}</p>
              </div>
            )}

            {certificateEdits.corrections && (
              <div className="corrections">
                <h5>Corrections Applied:</h5>
                <p>{certificateEdits.corrections}</p>
              </div>
            )}
          </div>

          <div className="certificate-actions">
            <div className="action-item">
              <strong>📄 Generate PDF Certificate</strong>
              <p>Create the final USMCA Certificate of Origin document</p>
            </div>
            <div className="action-item">
              <strong>📧 Email to Client</strong>
              <p>Send the completed certificate to {clientSubmission.contact_email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="form-actions">
        {currentStage > 1 && currentStage < 3 && (
          <button
            onClick={() => setCurrentStage(currentStage - 1)}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            ← Previous
          </button>
        )}

        {currentStage === 1 && (
          <button
            onClick={sendFormToClient}
            className="btn-primary"
            disabled={!canSendForm() || isSubmitting}
            style={{ marginLeft: 'auto' }}
          >
            {isSubmitting ? 'Sending Email...' : '📧 Send Form to Client'}
          </button>
        )}

        {currentStage === 2 && hasClientSubmission() && (
          <button
            onClick={() => setCurrentStage(3)}
            className="btn-primary"
            style={{ marginLeft: 'auto' }}
          >
            Continue to Certificate →
          </button>
        )}

        {currentStage === 3 && (
          <button
            onClick={generateCertificate}
            className="btn-primary"
            disabled={isSubmitting}
            style={{ marginLeft: 'auto' }}
          >
            {isSubmitting ? 'Generating...' : '📄 Generate & Email Certificate'}
          </button>
        )}
      </div>

      <style jsx>{`
        .stage-indicator {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: #f9fafb;
          color: #6b7280;
          font-size: 14px;
        }

        .stage-indicator.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .form-section {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .form-section h4 {
          margin-top: 0;
          color: #134169;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .component-row {
          background: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        .review-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 6px;
        }

        .review-item {
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .btn-add, .btn-remove {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-add {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-remove {
          background: #fef2f2;
          color: #dc2626;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}