import { useState, useEffect } from 'react';
import IntakeFormModal from '../shared/IntakeFormModal';
import { getIntakeFormByService } from '../../config/service-intake-forms';

export default function USMCACertificatesTab() {
  // Simple mock subscription context
  const useSubscription = () => ({
    subscription: { plan: 'Professional', plan_name: 'Professional Plan' },
    user: { id: 'demo-user-id', email: 'triangleintel@gmail.com' }
  });
  const { subscription, user } = useSubscription();

  const [certificateRequests, setCertificateRequests] = useState([]);
  const [intakeFormModal, setIntakeFormModal] = useState({
    isOpen: false,
    clientInfo: null
  });

  // Certificate Workflow Modal State
  const [certificateModal, setCertificateModal] = useState({
    isOpen: false,
    request: null,
    currentStage: 1,
    formData: {},
    collectedData: {
      clientForm: null,
      draftCertificate: null,
      finalCertificate: null,
      emailSent: false
    }
  });

  useEffect(() => {
    loadCertificateRequests();
  }, []);

  const loadCertificateRequests = async () => {
    try {
      console.log('📊 Loading USMCA certificate service requests...');

      const response = await fetch('/api/admin/service-requests');
      const data = await response.json();

      if (data.success && data.requests) {
        // Filter for USMCA certificate requests
        const certificateRequests = data.requests.filter(req => 
          req.service_type === 'usmca_certificate' || 
          req.service_type === 'usmca-certificate' ||
          (req.service_details && req.service_details.goals && 
           req.service_details.goals.toLowerCase().includes('certificate'))
        );

        setCertificateRequests(certificateRequests);
        console.log(`✅ Loaded ${certificateRequests.length} USMCA certificate requests`);
      } else {
        console.log('📋 No certificate requests found, using sample data');
        // Sample data for demo purposes
        setCertificateRequests([
          {
            id: 'cert_demo_001',
            client_name: 'Demo Electronics Corp',
            email: 'procurement@demo-electronics.com',
            phone: '+1 (555) 123-4567',
            service_type: 'usmca_certificate',
            status: 'pending',
            priority: 'high',
            created_date: new Date().toISOString(),
            service_details: {
              product_description: 'Electronic circuit boards and components',
              goals: 'Need USMCA Certificate of Origin for customs compliance'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading certificate requests:', error);
      setCertificateRequests([
        {
          id: 'cert_fallback',
          client_name: 'Sample Client',
          email: 'client@example.com',
          service_type: 'usmca_certificate',
          status: 'pending',
          priority: 'medium',
          created_date: new Date().toISOString(),
          service_details: { goals: 'USMCA Certificate needed' }
        }
      ]);
    }
  };

  const openIntakeForm = () => {
    const formConfig = getIntakeFormByService('usmca-certificate');
    console.log('🔍 USMCA Form Config:', formConfig);
    console.log('🔍 Form Title:', formConfig?.title);
    setIntakeFormModal({
      isOpen: true,
      clientInfo: null
    });
  };

  const closeIntakeForm = () => {
    setIntakeFormModal({
      isOpen: false,
      clientInfo: null
    });
  };

  const handleIntakeSubmit = async (formData) => {
    console.log('📋 USMCA Certificate intake submitted:', formData);
    closeIntakeForm();
    await loadCertificateRequests();
  };

  const openCertificateWorkflow = (request) => {
    setCertificateModal({
      isOpen: true,
      request,
      currentStage: 1,
      formData: {},
      collectedData: {
        clientForm: null,
        clientFormData: null,
        validationResults: null,
        generatedCertificate: null
      }
    });
  };

  const nextStage = () => {
    setCertificateModal(prev => ({
      ...prev,
      currentStage: Math.min(prev.currentStage + 1, 3)
    }));
  };

  const updateCertificateFormData = (field, value) => {
    setCertificateModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  };


  const sendClientForm = async () => {
    console.log('📧 Sending USMCA certificate intake form to client...');

    try {
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_intake_form',
          clientEmail: certificateModal.request?.email || 'triangleintel@gmail.com',
          clientName: certificateModal.request?.client_name || 'Test Client',
          projectId: certificateModal.request?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ USMCA intake form sent successfully:', data.formUrl);
        setCertificateModal(prev => ({
          ...prev,
          collectedData: {
            ...prev.collectedData,
            formSent: true,
            formSentAt: new Date().toISOString(),
            projectId: data.projectId,
            formUrl: data.formUrl
          }
        }));
      } else {
        console.error('❌ Failed to send form:', data.error);
        alert('Failed to send form: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending form:', error);
      alert('Error sending form: ' + error.message);
    }
  };

  const handleSendFormToClient = async (formInfo) => {
    console.log('📧 Sending USMCA certificate intake form to client:', formInfo);

    try {
      const response = await fetch('/api/email-intake-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formInfo.clientEmail || 'triangleintel@gmail.com',
          clientName: formInfo.clientName,
          formType: formInfo.formType,
          formData: formInfo.formData,
          requestId: certificateModal.request?.id
        })
      });

      if (response.ok) {
        console.log('✅ Email sent successfully');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }

    setCertificateModal(prev => ({
      ...prev,
      collectedData: {
        ...prev.collectedData,
        clientForm: 'sent'
      }
    }));

    setIntakeFormModal({ isOpen: false, clientInfo: null });
  };

  const handleUploadClientResponse = async (responseData) => {
    console.log('📄 Processing USMCA certificate client response:', responseData);

    // Simulate processing the client response
    setCertificateModal(prev => ({
      ...prev,
      collectedData: {
        ...prev.collectedData,
        clientForm: 'completed',
        clientFormData: responseData.responseData
      }
    }));

    setIntakeFormModal({ isOpen: false, clientInfo: null });
  };

  const handleExpertDecision = (decision) => {
    console.log(`👩‍💼 Cristina's expert decision: ${decision}`);

    setCertificateModal(prev => ({
      ...prev,
      collectedData: {
        ...prev.collectedData,
        expertReview: {
          decision: decision,
          timestamp: new Date().toISOString(),
          notes: prev.expertNotes || '',
          reviewer: 'Cristina Martinez'
        },
        validationResults: decision === 'approve' ? prev.collectedData.aiAnalysis : null
      }
    }));
  };

  const validateUSMCACompliance = async () => {
    try {
      console.log('🔍 Starting AI USMCA compliance analysis...');
      setCertificateModal(prev => ({...prev, aiValidating: true}));

      const certificateData = certificateModal.collectedData?.clientDocumentation || {};

      // Calculate USMCA content totals
      const usContent = parseFloat(certificateData.components_us) || 0;
      const caContent = parseFloat(certificateData.components_canada) || 0;  
      const mxContent = parseFloat(certificateData.components_mexico) || 0;
      const totalUSMCA = usContent + caContent + mxContent;

      // Determine required threshold based on HS code
      let requiredThreshold = 62.5; // Default
      if (certificateData.hs_code) {
        if (certificateData.hs_code.startsWith('85')) requiredThreshold = 65.0; // Electronics
        else if (certificateData.hs_code.startsWith('87')) requiredThreshold = 75.0; // Automotive
      }

      const qualifies = totalUSMCA >= requiredThreshold;
      const originCriterion = qualifies ? 'A' : 'B';

      const analysisResult = {
        qualifies,
        total_percentage: Math.round(totalUSMCA),
        required_threshold: requiredThreshold,
        origin_criterion: originCriterion,
        ai_notes: qualifies 
          ? `Product qualifies for USMCA benefits. ${totalUSMCA.toFixed(1)}% USMCA content exceeds ${requiredThreshold}% threshold.`
          : `Product does not qualify. ${totalUSMCA.toFixed(1)}% USMCA content below ${requiredThreshold}% threshold.`,
        calculation_breakdown: {
          us_content: `${usContent}%`,
          canada_content: `${caContent}%`, 
          mexico_content: `${mxContent}%`,
          non_usmca: `${parseFloat(certificateData.components_other) || 0}%`
        },
        analysis_timestamp: new Date().toISOString()
      };

      setCertificateModal(prev => ({
        ...prev,
        collectedData: {
          ...prev.collectedData,
          aiAnalysis: analysisResult
        },
        aiValidating: false
      }));
    } catch (error) {
      console.error('❌ AI validation error:', error);
      setCertificateModal(prev => ({...prev, aiValidating: false}));
    }
  };

  const generateFinalCertificate = async () => {
    try {
      console.log('📜 Generating final USMCA Certificate...');
      setCertificateModal(prev => ({...prev, generating: true}));

      // Generate final certificate using real workflow API
      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_final',
          projectId: certificateModal.collectedData?.projectId || 'demo-project'
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Final certificate generated:', result.certificate);
        setCertificateModal(prev => ({
          ...prev,
          collectedData: {
            ...prev.collectedData,
            generatedCertificate: {
              ...result.certificate,
              generated_at: new Date().toISOString()
            }
          },
          generating: false
        }));
      } else {
        console.error('Final certificate generation failed:', result.error);
        setCertificateModal(prev => ({...prev, generating: false}));
      }
    } catch (error) {
      console.error('Final certificate generation error:', error);
      setCertificateModal(prev => ({...prev, generating: false}));
    }
  };

  const emailCertificateToClient = async () => {
    try {
      console.log('📧 Emailing certificate to client...');

      const response = await fetch('/api/real-usmca-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'email_to_client',
          projectId: certificateModal.collectedData?.projectId || 'demo-project'
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Certificate emailed to client');
        alert('Certificate has been emailed to the client successfully!');
      } else {
        console.error('Email failed:', result.error);
        alert('Failed to email certificate: ' + result.error);
      }
    } catch (error) {
      console.error('Email error:', error);
      alert('Error sending email: ' + error.message);
    }
  };

  return (
    <div>
      {/* Service Summary */}
      <div className="summary-grid">
        <div className="summary-stat">
          <div className="stat-number">{certificateRequests.length}</div>
          <div className="stat-label">Certificate Requests</div>
        </div>
        <div className="summary-stat">
          <div className="stat-number">
            {certificateRequests.filter(r => r.status === 'completed').length}
          </div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="summary-stat">
          <div className="stat-number">
            {certificateRequests.filter(r => r.status === 'in_progress').length}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-primary" onClick={openIntakeForm}>
          ➕ New Certificate Request
        </button>
      </div>

      {/* Service Requests Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Product</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificateRequests.map((request, index) => (
              <tr key={index}>
                <td><strong>{request.client_name || 'Unknown Client'}</strong></td>
                <td>{request.description || request.product_description || 'Certificate Request'}</td>
                <td>
                  <span className={`status-badge ${request.status === 'completed' ? 'completed' :
                    request.status === 'in_progress' ? 'in-progress' : 'pending'}`}>
                    {request.status}
                  </span>
                </td>
                <td>
                  <span className={`priority-badge ${request.priority}`}>
                    {request.priority || 'medium'}
                  </span>
                </td>
                <td>{new Date(request.created_date || Date.now()).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-action btn-primary"
                    onClick={() => openCertificateWorkflow(request)}
                  >
                    📜 Generate Certificate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Intake Form Modal */}
      {intakeFormModal.isOpen && (
        <IntakeFormModal
          isOpen={intakeFormModal.isOpen}
          onClose={closeIntakeForm}
          formConfig={{
            title: 'USMCA Certificate - Document Requirements',
            service_price: 200,
            description: 'Comprehensive USMCA certificate generation requirements',
            sections: [
              {
                title: 'Product Information',
                fields: [
                  {
                    id: 'product_description',
                    label: 'Complete Product Description',
                    type: 'textarea',
                    required: true,
                    rows: 3,
                    placeholder: 'Detailed description of product for USMCA certification'
                  },
                  {
                    id: 'hs_code',
                    label: 'HS Code (if known)',
                    type: 'text',
                    required: false,
                    placeholder: 'e.g., 8517.62.00'
                  },
                  {
                    id: 'product_value',
                    label: 'Product Value (USD)',
                    type: 'text',
                    required: true,
                    placeholder: 'e.g., $125.00 per unit'
                  }
                ]
              },
              {
                title: 'Manufacturing Details',
                fields: [
                  {
                    id: 'manufacturing_process',
                    label: 'Manufacturing Process Description',
                    type: 'textarea',
                    required: true,
                    rows: 3,
                    placeholder: 'Describe how the product is manufactured'
                  },
                  {
                    id: 'production_facility',
                    label: 'Production Facility Location(s)',
                    type: 'text',
                    required: true,
                    placeholder: 'City, State/Province, Country'
                  }
                ]
              },
              {
                title: 'Component Sourcing',
                fields: [
                  {
                    id: 'components_us',
                    label: 'US-Sourced Components (% of value)',
                    type: 'text',
                    required: true,
                    placeholder: 'e.g., 45%'
                  },
                  {
                    id: 'components_canada',
                    label: 'Canada-Sourced Components (% of value)',
                    type: 'text',
                    required: true,
                    placeholder: 'e.g., 20%'
                  },
                  {
                    id: 'components_mexico',
                    label: 'Mexico-Sourced Components (% of value)',
                    type: 'text',
                    required: true,
                    placeholder: 'e.g., 25%'
                  },
                  {
                    id: 'components_other',
                    label: 'Non-USMCA Components (% of value)',
                    type: 'text',
                    required: true,
                    placeholder: 'e.g., 10%'
                  },
                  {
                    id: 'component_details',
                    label: 'Component Breakdown Details',
                    type: 'textarea',
                    required: true,
                    rows: 4,
                    placeholder: 'List major components with origin country and value/percentage'
                  }
                ]
              },
              {
                title: 'Submission Details',
                fields: [
                  {
                    id: 'urgency_level',
                    label: 'Urgency Level',
                    type: 'select',
                    required: true,
                    options: [
                      { value: '', label: 'Select urgency' },
                      { value: 'standard', label: 'Standard (5-7 business days)' },
                      { value: 'expedited', label: 'Expedited (2-3 business days)' },
                      { value: 'rush', label: 'Rush (24-48 hours)' }
                    ]
                  },
                  {
                    id: 'submission_deadline',
                    label: 'Required Completion Date',
                    type: 'date',
                    required: true
                  }
                ]
              }
            ]
          }}
          clientInfo={intakeFormModal.clientInfo}
          onSendForm={handleSendFormToClient}
          onUploadResponse={handleUploadClientResponse}
        />
      )}

      {/* Certificate Generation Workflow Modal */}
      {certificateModal.isOpen && (
        <div className="workflow-modal-overlay">
          <div className="workflow-modal-content">
            <div className="workflow-modal-header">
              <h2 className="workflow-modal-title">📜 USMCA Certificate Generation Workflow</h2>
              <button
                className="workflow-modal-close"
                onClick={() => setCertificateModal({ isOpen: false, request: null, currentStage: 1, formData: {}, collectedData: {} })}
              >
                ×
              </button>
            </div>

            <div className="workflow-progress">
              <div className="workflow-progress-steps">
                <div className={`workflow-step ${certificateModal.currentStage >= 1 ? 'active' : ''}`}>1. Product Documentation</div>
                <div className={`workflow-step ${certificateModal.currentStage >= 2 ? 'active' : ''}`}>2. Expert Validation</div>
                <div className={`workflow-step ${certificateModal.currentStage >= 3 ? 'active' : ''}`}>3. Certificate Generation</div>
              </div>
            </div>

            <div className="workflow-form">
              <h3 className="workflow-stage-title">
                Stage {certificateModal.currentStage}: {
                  certificateModal.currentStage === 1 ? 'Product Documentation & USMCA Requirements' :
                  certificateModal.currentStage === 2 ? 'AI Analysis Review & Expert Validation' :
                  'Final Certificate Generation & Delivery'
                }
              </h3>

              {certificateModal.currentStage === 1 && (
                <div className="document-collection-grid">
                  <h4>📧 Stage 1 - Send Certificate Requirements Form to Client</h4>
                  <p className="workflow-stage-description">
                    Review client contact information and send comprehensive USMCA certificate intake form.
                  </p>

                  {/* Client Contact Review */}
                  <div className="workflow-form-group">
                    <label className="workflow-form-label">Client Contact Information</label>
                    <div className="client-contact-review">
                      <div><strong>Company:</strong> {certificateModal.request?.client_name || 'Not specified'}</div>
                      <div><strong>Email:</strong> {certificateModal.request?.email || 'Not specified'}</div>
                      <div><strong>Phone:</strong> {certificateModal.request?.phone || 'Not available'}</div>
                      <div><strong>Request:</strong> {certificateModal.request?.service_details?.goals || 'USMCA Certificate needed'}</div>
                    </div>
                  </div>

                  {/* Email Draft Preview */}
                  <div className="workflow-form-group">
                    <label className="workflow-form-label">📧 Email Draft Preview</label>
                    <div className="email-draft-preview">
                      <div className="email-header">
                        <div><strong>To:</strong> {certificateModal.request?.email}</div>
                        <div><strong>From:</strong> Cristina Martinez &lt;cristina@triangleintelligence.com&gt;</div>
                        <div><strong>Subject:</strong> USMCA Certificate Requirements - Action Required</div>
                      </div>
                      <div className="email-body">
                        <p>Hello {certificateModal.request?.client_name?.split(' ')[0] || 'there'},</p>
                        <p>Thank you for requesting USMCA Certificate of Origin services. To complete your certificate, please fill out our comprehensive data collection form.</p>
                        <p><strong>Required Information:</strong></p>
                        <p>• Company information and registration details</p>
                        <p>• Product description and HS classification</p>
                        <p>• Manufacturing location and process details</p>
                        <p>• Component origins with percentages and values</p>
                        <p>• Trade volume and destination information</p>
                        <p><strong>Secure Form Link:</strong> [Will be generated when sent]</p>
                        <p>Once completed, we'll analyze your data and generate your certificate within 24-48 hours.</p>
                        <p>Best regards,<br/>Cristina Martinez<br/>Triangle Intelligence Team</p>
                      </div>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <button
                      className="btn-action btn-primary"
                      onClick={sendClientForm}
                      disabled={certificateModal?.collectedData?.clientDocumentation}
                    >
                      📧 Send Form to Client
                    </button>
                  </div>

                  <div className="summary-grid">
                    <div className="summary-stat">
                      <div className="stat-number">
                        {certificateModal?.collectedData?.clientDocumentation ? '✅' :
                         certificateModal?.collectedData?.formSent ? '📧' : '⏳'}
                      </div>
                      <div className="stat-label">
                        {certificateModal?.collectedData?.clientDocumentation ? 'Client Response Received' :
                         certificateModal?.collectedData?.formSent ? 'Form Sent to Client' : 'Ready to Send'}
                      </div>
                    </div>
                    {certificateModal?.collectedData?.formSent && (
                      <div className="summary-stat">
                        <div className="stat-number">⏰</div>
                        <div className="stat-label">Sent {new Date(certificateModal.collectedData.formSentAt).toLocaleTimeString()}</div>
                      </div>
                    )}
                  </div>

                  {certificateModal?.collectedData?.formSent && !certificateModal?.collectedData?.clientDocumentation && (
                    <div className="workflow-status-card workflow-status-info">
                      <p className="workflow-status-info-text">
                        📧 USMCA certificate form sent to client. Waiting for product specifications, origin certificates, and exporter details.
                      </p>
                      <button
                        className="btn-action btn-secondary"
                        onClick={async () => {
                          // Simulate client filling out the real USMCA intake form
                          const sampleClientData = {
                            // Company Information
                            company_name: certificateModal.request?.client_name || 'North American Electronics Inc.',
                            company_address: '123 Industrial Ave, Toronto, ON M1P 3E4, Canada',
                            tax_id: 'CA123456789',
                            contact_person: 'John Smith',
                            contact_email: certificateModal.request?.email || 'triangleintel@gmail.com',
                            contact_phone: '+1 (416) 555-0123',

                            // Product Information
                            product_description: 'Electronic circuit boards and components for telecommunications equipment',
                            hs_code: '8534.00.00',
                            product_value: '125000',

                            // Manufacturing Information
                            manufacturing_location: 'Toronto, Ontario, Canada',
                            manufacturing_process: 'PCB assembly with SMT component placement and wave soldering',

                            // Component Origins
                            component_origins: [
                              { component: 'Microprocessors', country: 'United States', value: '43750', percentage: '35' },
                              { component: 'Capacitors', country: 'Canada', value: '31250', percentage: '25' },
                              { component: 'Resistors', country: 'Canada', value: '6250', percentage: '5' },
                              { component: 'PCB Substrate', country: 'China', value: '25000', percentage: '20' },
                              { component: 'Plastic Housing', country: 'Mexico', value: '6250', percentage: '5' },
                              { component: 'Assembly Labor', country: 'Canada', value: '12500', percentage: '10' }
                            ],

                            // Trade Information
                            destination_country: 'United States',
                            annual_trade_volume: '1500000',
                            primary_markets: 'US telecommunications companies, Canadian electronics distributors'
                          };

                          // Process client data through real workflow API
                          try {
                            const response = await fetch('/api/real-usmca-workflow', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'process_client_data',
                                projectId: certificateModal.collectedData?.projectId || 'demo-project',
                                clientData: sampleClientData
                              })
                            });

                            const result = await response.json();

                            if (result.success) {
                              console.log('✅ Client data processed successfully');
                              setCertificateModal(prev => ({
                                ...prev,
                                collectedData: {
                                  ...prev.collectedData,
                                  clientDocumentation: sampleClientData,
                                  responseReceivedAt: new Date().toISOString()
                                }
                              }));
                            }
                          } catch (error) {
                            console.error('Error processing client data:', error);
                            // Still update UI for demo
                            setCertificateModal(prev => ({
                              ...prev,
                              collectedData: {
                                ...prev.collectedData,
                                clientDocumentation: sampleClientData,
                                responseReceivedAt: new Date().toISOString()
                              }
                            }));
                          }
                        }}
                      >
                        📄 Simulate Client Response (Demo)
                      </button>
                    </div>
                  )}

                  {certificateModal?.collectedData?.clientDocumentation && (
                    <div className="workflow-form-group">
                      <label className="workflow-form-label">📋 Client Documentation Received</label>
                      <div className="workflow-status-card workflow-status-success">
                        <p className="workflow-status-success-text">✅ USMCA Certificate requirements received from client</p>
                        <p className="workflow-status-success-details">Complete data ready for AI analysis and expert validation.</p>
                      </div>

                      <div className="workflow-client-context">
                        <div className="workflow-client-context-title">Certificate Data Summary:</div>
                        <div className="workflow-client-context-item">
                          <strong>Product:</strong> {certificateModal.collectedData.clientDocumentation?.product_description}
                        </div>
                        <div className="workflow-client-context-item">
                          <strong>HS Code:</strong> {certificateModal.collectedData.clientDocumentation?.hs_code}
                        </div>
                        <div className="workflow-client-context-item">
                          <strong>Production:</strong> {certificateModal.collectedData.clientDocumentation?.production_facility}
                        </div>
                        <div className="workflow-client-context-item">
                          <strong>USMCA Content:</strong>
                          {(() => {
                            const components = certificateModal.collectedData.clientDocumentation?.component_origins || [];
                            const usmcaCountries = ['United States', 'Canada', 'Mexico'];
                            const totalValue = components.reduce((sum, comp) => sum + parseInt(comp.value || 0), 0);
                            const usmcaValue = components
                              .filter(comp => usmcaCountries.some(country => comp.country.includes(country)))
                              .reduce((sum, comp) => sum + parseInt(comp.value || 0), 0);
                            const percentage = totalValue > 0 ? Math.round((usmcaValue / totalValue) * 100) : 0;
                            return ` ${percentage}% (Total: $${totalValue.toLocaleString()})`;
                          })()
                          }
                        </div>
                        <div className="workflow-client-context-item">
                          <strong>Exporter:</strong> {certificateModal.collectedData.clientDocumentation?.company_name}
                        </div>
                        <div className="workflow-client-context-item">
                          <strong>Destination:</strong> {certificateModal.collectedData.clientDocumentation?.destination_country}
                        </div>
                        <div className="workflow-client-context-item">
                          <strong>Trade Volume:</strong> ${parseInt(certificateModal.collectedData.clientDocumentation?.annual_trade_volume || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage 2: Expert Validation */}
              {certificateModal.currentStage === 2 && (
                <div>
                  <p className="workflow-stage-description">
                    AI analyzes USMCA compliance → Cristina validates and approves results
                  </p>

                  {/* Client Data Context */}
                  {certificateModal?.collectedData?.clientFormData && (
                    <div className="client-context-card" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>📋 Client Certificate Request</h4>
                      <div className="client-data-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.9rem' }}>
                        <div><strong>Product:</strong> {certificateModal.collectedData.clientFormData.product_description || 'Not specified'}</div>
                        <div><strong>HS Code:</strong> {certificateModal.collectedData.clientFormData.hs_code || 'Not specified'}</div>
                        <div><strong>Origin:</strong> {certificateModal.collectedData.clientFormData.country_of_origin || 'Not specified'}</div>
                        <div><strong>US Content:</strong> {certificateModal.collectedData.clientFormData.components_us || 'Not specified'}</div>
                        <div><strong>Mexico Content:</strong> {certificateModal.collectedData.clientFormData.components_mexico || 'Not specified'}</div>
                        <div><strong>Canada Content:</strong> {certificateModal.collectedData.clientFormData.components_canada || 'Not specified'}</div>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis Section */}
                  <div className="ai-analysis-section" style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>🤖 AI Analysis & Calculations</h4>

                    {!certificateModal.collectedData?.aiAnalysis ? (
                      <button
                        className="btn-action btn-primary"
                        onClick={validateUSMCACompliance}
                        disabled={certificateModal.aiValidating}
                        style={{ marginBottom: '15px' }}
                      >
                        {certificateModal.aiValidating ? '🔄 AI Analyzing...' : '🤖 Run AI Analysis'}
                      </button>
                    ) : (
                      <div className="ai-results-card" style={{ padding: '15px', backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px', marginBottom: '15px' }}>
                        <div className="ai-results-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h5 style={{ margin: 0, color: '#0369a1' }}>🤖 AI Analysis Complete</h5>
                          <button className="btn-link" onClick={validateUSMCACompliance} style={{ padding: '4px 8px', fontSize: '0.85rem' }}>🔄 Re-analyze</button>
                        </div>

                        <div className="ai-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                          <div className="ai-result-item">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>USMCA Qualification:</label>
                            <div className={`ai-result-value ${certificateModal.collectedData.aiAnalysis.qualifies ? 'success' : 'warning'}`} style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '500', backgroundColor: certificateModal.collectedData.aiAnalysis.qualifies ? '#d1fae5' : '#fef3c7', color: certificateModal.collectedData.aiAnalysis.qualifies ? '#065f46' : '#92400e' }}>
                              {certificateModal.collectedData.aiAnalysis.qualifies ? '✅ Qualifies' : '⚠️ Does Not Qualify'}
                            </div>
                          </div>

                          <div className="ai-result-item">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Total USMCA Content:</label>
                            <div className="ai-result-value" style={{ padding: '6px 10px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '500' }}>
                              {certificateModal.collectedData.aiAnalysis.total_percentage || 'N/A'}%
                            </div>
                          </div>

                          <div className="ai-result-item">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Industry Threshold:</label>
                            <div className="ai-result-value" style={{ padding: '6px 10px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '500' }}>
                              {certificateModal.collectedData.aiAnalysis.required_threshold || 'N/A'}%
                            </div>
                          </div>

                          <div className="ai-result-item">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Origin Criterion:</label>
                            <div className="ai-result-value" style={{ padding: '6px 10px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '500' }}>
                              {certificateModal.collectedData.aiAnalysis.origin_criterion || 'Not determined'}
                            </div>
                          </div>
                        </div>

                        {certificateModal.collectedData.aiAnalysis.ai_notes && (
                          <div className="ai-notes" style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.9rem' }}>
                            <strong>🤖 AI Notes:</strong>
                            <p style={{ margin: '5px 0 0 0' }}>{certificateModal.collectedData.aiAnalysis.ai_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expert Validation Section */}
                  {certificateModal.collectedData?.aiAnalysis && (
                    <div className="expert-validation-section" style={{ padding: '15px', backgroundColor: '#fef7ff', border: '1px solid #a855f7', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#7c2d12' }}>👩‍💼 Cristina's Expert Review</h4>

                      <div className="expert-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                        <button
                          className="btn-action btn-success"
                          onClick={() => handleExpertDecision('approve')}
                          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        >
                          ✅ Approve AI Analysis
                        </button>

                        <button
                          className="btn-action btn-warning"
                          onClick={() => handleExpertDecision('flag')}
                          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        >
                          ⚠️ Flag for Review
                        </button>

                        <button
                          className="btn-action btn-secondary"
                          onClick={() => handleExpertDecision('edit')}
                          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                        >
                          ✏️ Edit Calculations
                        </button>
                      </div>

                      {certificateModal.collectedData?.expertReview && (
                        <div className="expert-review-card" style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '15px' }}>
                          <h5 style={{ margin: '0 0 8px 0', color: '#374151' }}>👩‍💼 Expert Decision: {certificateModal.collectedData.expertReview.decision}</h5>
                          {certificateModal.collectedData.expertReview.notes && (
                            <div className="expert-notes">
                              <strong>Expert Notes:</strong>
                              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>{certificateModal.collectedData.expertReview.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="expert-notes-input">
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Expert Notes (Optional):</label>
                        <textarea
                          placeholder="Add any expert observations, corrections, or special considerations..."
                          rows="3"
                          style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem' }}
                          value={certificateModal.expertNotes || ''}
                          onChange={(e) => setCertificateModal(prev => ({ ...prev, expertNotes: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage 3: Certificate Generation */}
              {certificateModal.currentStage === 3 && (
                <div>
                  <p className="workflow-stage-description">Generate official USMCA Certificate of Origin with validated data</p>

                  {certificateModal.collectedData?.validationResults ? (
                    <>
                      <div className="workflow-form-group">
                        <label className="workflow-form-label">📋 Certificate Preview</label>
                        <div className="workflow-status-card workflow-status-info">
                          <p className="workflow-status-info-text">USMCA Certificate of Origin</p>
                          <div className="workflow-status-info-details">
                            <strong>Product:</strong> {certificateModal.collectedData?.clientFormData?.product_description || 'Not specified'}<br/>
                            <strong>HS Code:</strong> {certificateModal.collectedData?.clientFormData?.hs_code || 'Not specified'}<br/>
                            <strong>Origin:</strong> {certificateModal.collectedData?.clientFormData?.country_of_origin || 'Not specified'}<br/>
                            ✅ Validated by Cristina Rodriguez, Licensed Customs Broker
                          </div>
                        </div>
                      </div>

                      <div className="workflow-form-group">
                        <label className="workflow-form-label">🤖 AI Certificate Generation</label>
                        <button
                          className="btn-action btn-primary workflow-full-width-button"
                          onClick={generateFinalCertificate}
                          disabled={certificateModal.generating}
                        >
                          {certificateModal.generating ? '🔄 Generating Final Certificate...' : '📜 Generate Final USMCA Certificate'}
                        </button>
                      </div>

                      {certificateModal.collectedData?.generatedCertificate && (
                        <div className="workflow-form-group">
                          <label className="workflow-form-label">✅ Certificate Generated Successfully</label>
                          <div className="workflow-status-card workflow-status-success">
                            <p className="workflow-status-success-text">Official USMCA Certificate of Origin Generated</p>
                            <div className="workflow-report-actions">
                              <button
                                className="btn-action btn-primary"
                                onClick={() => window.open(certificateModal.collectedData?.generatedCertificate?.certificate_url || '#', '_blank')}
                              >
                                📥 Download PDF
                              </button>
                              <button
                                className="btn-action btn-secondary"
                                onClick={emailCertificateToClient}
                              >
                                📧 Email to Client
                              </button>
                              <button
                                className="btn-action btn-outline"
                                onClick={() => window.open(certificateModal.collectedData?.generatedCertificate?.certificate_url || '#', '_blank')}
                              >
                                👁️ Preview Certificate
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="workflow-status-card workflow-status-warning">
                      <p className="workflow-status-warning-text">
                        Please complete Stage 2 validation before generating certificate
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="workflow-modal-actions">
              <div className="workflow-action-group">
                <button
                  className="btn-secondary"
                  onClick={() => setCertificateModal(prev => ({...prev, currentStage: Math.max(prev.currentStage - 1, 1)}))}
                  disabled={certificateModal.currentStage === 1}
                >
                  ← Previous Stage
                </button>
              </div>

              <div className="workflow-action-group">
                {certificateModal.currentStage < 3 ? (
                  <button
                    className="btn-primary"
                    onClick={nextStage}
                    disabled={
                      (certificateModal.currentStage === 1 && !certificateModal.collectedData?.clientDocumentation) ||
                      (certificateModal.currentStage === 2 && !certificateModal.collectedData?.expertReview)
                    }
                  >
                    Next Stage →
                  </button>
                ) : (
                  <button
                    className="btn-success"
                    onClick={() => setCertificateModal({ isOpen: false, request: null, currentStage: 1, formData: {}, collectedData: {} })}
                  >
                    Complete Workflow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}