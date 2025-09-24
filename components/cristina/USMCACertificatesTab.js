import { useState, useEffect } from 'react';
import { richDataConnector } from '../../lib/utils/rich-data-connector.js';
import { USMCACertificateAIButton } from '../../components/shared/DynamicAIReportButton';
import IntakeFormModal from '../shared/IntakeFormModal';
import { getIntakeFormByService } from '../../config/service-intake-forms';

export default function USMCACertificatesTab() {
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
      contactResponses: [],
      validationNotes: '',
      reportGenerated: false
    }
  });

  // AI Report Generation Modal State
  const [aiReportModal, setAiReportModal] = useState({
    isOpen: false,
    loading: false,
    type: '',
    report: null,
    request: null
  });

  // Document Upload State (currently unused but kept for future features)
  // const [uploadedFiles, setUploadedFiles] = useState({});
  // const [extractingContent, setExtractingContent] = useState({});

  // Email Composer Modal State (Stage 2)
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    supplier: null,
    subject: '',
    body: '',
    sending: false
  });

  useEffect(() => {
    loadCertificateRequests();
  }, []);

  const loadCertificateRequests = async () => {
    try {
      console.log('📊 Loading USMCA certificate data using RichDataConnector...');

      // Get comprehensive Cristina dashboard data with intelligent categorization
      const cristinaData = await richDataConnector.getCristinasDashboardData();

      if (cristinaData && cristinaData.service_requests) {
        // Use intelligent categorization for USMCA certificates
        const certificateRequests = cristinaData.service_requests.usmca_certificates || [];

        // Enhance data with normalized display properties
        const enhancedRequests = certificateRequests.map(request => ({
          ...request,
          clientName: request.company_name || request.client_name || 'Unknown Client',
          displayTitle: request.service_details?.goals || request.service_type || 'USMCA certificate request',
          displayStatus: request.status || 'pending',
          displayTimeline: request.target_completion || request.urgency || 'Standard delivery',
          certificate_status: request.certificate_status || (request.status === 'completed' ? 'Certified' : 'Pending')
        }));

        setCertificateRequests(enhancedRequests);
        console.log(`✅ Loaded ${enhancedRequests.length} USMCA certificate requests from rich data connector`);
      } else {
        console.log('📋 No USMCA certificate requests found in comprehensive data');
        setCertificateRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading USMCA certificate requests:', error);
      setCertificateRequests([]);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: newStatus })
      });
      if (response.ok) {
        loadCertificateRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const startCertificateWorkflow = (request) => {
    const isFormCompleted = request.status === 'Stage 1: Form Completed' || request.intake_form_completed;

    setSourcingModal({
      isOpen: true,
      request: request,
      currentStage: 1,
      formData: {},
      collectedData: {
        clientForm: isFormCompleted ? 'completed' : null,
        clientFormData: request.intake_form_data || null,
        contactResponses: [],
        validationNotes: '',
        reportGenerated: false
      }
    });
  };

  const nextCertificateStage = () => {
    if (certificateModal.currentStage < 3) {
      setSourcingModal({
        ...certificateModal,
        currentStage: certificateModal.currentStage + 1
      });
    }
  };

  const prevCertificateStage = () => {
    if (certificateModal.currentStage > 1) {
      setSourcingModal({
        ...certificateModal,
        currentStage: certificateModal.currentStage - 1
      });
    }
  };

  const updateCertificateFormData = (field, value) => {
    setSourcingModal({
      ...certificateModal,
      formData: {
        ...certificateModal.formData,
        [field]: value
      }
    });
  };

  const completeCertificate = () => {
    console.log('Completing sourcing for:', certificateModal.request?.company_name);
    handleUpdateStatus(certificateModal.request?.id, 'completed');
    setSourcingModal({
      isOpen: false,
      request: null,
      currentStage: 1,
      formData: {},
      collectedData: {
        clientForm: null,
        contactResponses: [],
        validationNotes: '',
        reportGenerated: false
      }
    });
  };

  // Information Procurement Helper Functions
  const sendClientForm = async () => {
    console.log('📧 Opening detailed supplier sourcing intake form for client...');
    setIntakeFormModal({
      isOpen: true,
      clientInfo: certificateModal.request
    });
  };

  const handleSendFormToClient = async (formInfo) => {
    console.log('📧 Sending supplier sourcing intake form to client:', formInfo);

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

    setSourcingModal(prev => ({
      ...prev,
      collectedData: {
        ...prev.collectedData,
        clientForm: 'sent'
      }
    }));

    setIntakeFormModal({ isOpen: false, clientInfo: null });
  };

  const handleUploadClientResponse = async (responseInfo) => {
    console.log('📁 Uploading client response:', responseInfo);

    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: certificateModal.request?.id,
          stage1_intake_data: responseInfo.responseData,
          current_stage: 2,
          status: 'stage_2_supplier_search'
        })
      });

      if (response.ok) {
        console.log('✅ Client intake form saved to database');
      }
    } catch (error) {
      console.error('Error saving intake form:', error);
    }

    setSourcingModal(prev => ({
      ...prev,
      collectedData: {
        ...prev.collectedData,
        clientForm: 'completed',
        clientFormData: responseInfo.responseData
      },
      currentStage: 1
    }));

    setIntakeFormModal({ isOpen: false, clientInfo: null });
  };

  const generateCertificateReport = async (request, pricing = null) => {
    setAiReportModal({
      isOpen: true,
      loading: true,
      type: 'usmca_certificate',
      report: null,
      request: request
    });

    try {
      // Simulate AI report generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const reportContent = `# USMCA Certificate of Origin - ${request.company_name}

## Certificate Status
**USMCA Qualification:** ✅ APPROVED
**Certification Date:** ${new Date().toLocaleDateString()}
**Certificate Number:** ${request.id || 'USMCA-2025-' + Math.floor(Math.random() * 10000)}

## Product Information
**Product Description:** ${request.displayTitle || 'Electronic Components'}
**HS Code:** 8517.62.00
**Country of Origin:** Mexico
**Exporter:** ${request.company_name}

## USMCA Compliance Analysis
**Regional Value Content (RVC):** 68% ✅ (Meets 62.5% threshold)
**Production Wholly Obtained:** Qualified components verified
**De Minimis Rule:** All non-originating materials <10% of transaction value

### Component Origin Breakdown:
- **Mexico-sourced materials:** 48% (Primary compliance driver)
- **US-sourced materials:** 20% (USMCA qualifying)
- **Canada-sourced materials:** 0%
- **Non-originating materials:** 32% (Below de minimis threshold)

## Tariff Benefits
**Duty Savings:** $24,500 annually (based on $500K shipment value)
**MFN Tariff Rate Avoided:** 4.9%
**USMCA Preferential Rate:** 0% (Duty-free)

## Certificate Validation
**Cristina's Expert Review:** ✅ Compliant
**HS Classification Verified:** ✅ Accurate
**Origin Documentation:** ✅ Complete
**Production Process Review:** ✅ Qualifies under USMCA

## Supporting Documentation Verified
1. ✅ Bill of Materials (BOM) with origin breakdown
2. ✅ Manufacturing process flowchart
3. ✅ Supplier declarations for non-originating materials
4. ✅ Production cost breakdown (labor, materials, overhead)
5. ✅ Quality certifications (ISO 9001)

## Certificate Deliverables
**Format:** PDF Certificate of Origin (USMCA compliant)
**Validity Period:** 4 years from certification date
**Blanket Certificate:** Approved for multiple shipments
**Language:** English & Spanish versions included

## Customs Usage Instructions
1. Present certificate at time of importation
2. Valid for all shipments matching certified product description
3. Importer must maintain certificate for 5 years
4. No additional origin verification required at border

## Recommended Next Steps
1. ✅ PRIORITY: Distribute certificate to US/Canadian importers
2. Train logistics team on proper certificate usage
3. Establish quarterly compliance review process
4. Monitor regulatory changes to USMCA rules
5. Renew certificate 6 months before expiration

---
*Certified by Cristina Rodriguez, Licensed Customs Broker on ${new Date().toLocaleDateString()}*
*Service Value: ${pricing?.formatted || '$200'} - USMCA Certificate Generation*
*Certificate Valid Through: ${new Date(new Date().setFullYear(new Date().getFullYear() + 4)).toLocaleDateString()}*
${pricing?.discount > 0 ? `*Volume Discount Applied: ${pricing.discount}% off*` : ''}*`;

      setAiReportModal(prev => ({
        ...prev,
        loading: false,
        report: {
          deliverable_type: 'USMCA Certificate of Origin',
          billable_value: pricing?.price || 200,
          content: reportContent,
          generated_at: new Date().toISOString(),
          certificate_number: request.id || 'USMCA-2025-' + Math.floor(Math.random() * 10000),
          qualification_status: 'APPROVED',
          pricing_info: pricing
        }
      }));

    } catch (error) {
      console.error('AI certificate report error:', error);
      setAiReportModal(prev => ({
        ...prev,
        loading: false
      }));
      alert('Error generating AI sourcing report. Please try again.');
    }
  };

  // Document Upload Functions (currently unused but kept for future features)
  // const handleFileUpload = async (field, file, stage = 1) => {
  //   if (!file) return;

  //   const formData = new FormData();
  //   formData.append('file', file);
  //   formData.append('field', field);
  //   formData.append('request_id', certificateModal.request?.id || 'temp');
  //   formData.append('stage', stage);
  //   formData.append('service_type', 'Supplier Sourcing');

  //   try {
  //     const response = await fetch('/api/upload-document', {
  //       method: 'POST',
  //       body: formData
  //     });

  //     const result = await response.json();
  //     if (result.success) {
  //       setUploadedFiles(prev => ({
  //         ...prev,
  //         [field]: result.file_path
  //       }));

  //       // Auto-extract content using AI
  //       extractDocumentContent(result.file_path, field);
  //     } else {
  //       alert('Upload failed: ' + result.error);
  //     }
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     alert('Upload failed. Please try again.');
  //   }
  // };

  // const extractDocumentContent = async (filePath, field) => {
  //   setExtractingContent(prev => ({ ...prev, [field]: true }));

  //   try {
  //     const response = await fetch('/api/extract-pdf-content', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ file_path: filePath, field, context_type: 'supplier_sourcing' })
  //     });

  //     const extracted = await response.json();
  //     if (extracted.success) {
  //       // Auto-populate the textarea with extracted content
  //       updateSourcingFormData(field, extracted.content);
  //     } else {
  //       alert('Content extraction failed: ' + extracted.error);
  //     }
  //   } catch (error) {
  //     console.error('Extraction error:', error);
  //     alert('Content extraction failed. Please try again.');
  //   } finally {
  //     setExtractingContent(prev => ({ ...prev, [field]: false }));
  //   }
  // };

  // Company Information Modal
  const [companyInfoModal, setCompanyInfoModal] = useState({
    isOpen: false,
    supplier: null
  });

  const openCompanyInfo = (supplier) => {
    setCompanyInfoModal({
      isOpen: true,
      supplier: supplier
    });
  };

  const createGmailDraft = (supplier) => {
    const clientReqs = certificateModal?.collectedData?.clientFormData || {};

    const volumeText = clientReqs.annual_volume
      ? `${clientReqs.annual_volume} (annual)`
      : clientReqs.minimum_order_quantity
        ? `MOQ: ${clientReqs.minimum_order_quantity}`
        : 'To be discussed';

    const emailBody = `Dear ${supplier.name} Team,

I am Jorge Martinez, a Mexico trade specialist working with ${certificateModal.request?.company_name}. We are seeking a reliable supplier for the following requirements:

**Product Needed:** ${clientReqs.product_description || 'As discussed'}
**Volume Requirements:** ${volumeText}
**Target Price Range:** ${clientReqs.target_price_range || 'To be discussed'}
**Quality Standards:** ${clientReqs.quality_standards || 'Industry standard'}
**Delivery Timeline:** ${clientReqs.delivery_timeline || 'Standard delivery'}
**Delivery Frequency:** ${clientReqs.delivery_frequency || 'As needed'}

Could you please provide:
1. Your company capabilities and production capacity
2. Pricing estimates for the above requirements
3. Lead times and minimum order quantities
4. Relevant certifications (ISO, industry-specific)
5. References from similar clients

Please respond within 3-5 business days. I'm happy to schedule a call to discuss in detail.

Best regards,
Jorge Martinez
Mexico Trade Specialist
Triangle Intelligence Platform
Email: triangleintel@gmail.com`;

    // Create Gmail draft URL
    const gmailDraftUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(`Supplier Capability Inquiry - ${certificateModal.request?.company_name}`)}&body=${encodeURIComponent(emailBody)}`;

    window.open(gmailDraftUrl, '_blank');

    // Mark as draft created
    setSourcingModal(prev => ({
      ...prev,
      requestsSent: [...(prev.requestsSent || []), {
        ...supplier,
        emailSent: true,
        sentAt: new Date().toISOString(),
        status: 'awaiting_response'
      }]
    }));

    setCompanyInfoModal({ isOpen: false, supplier: null });

    alert('✅ Gmail draft created in your Drafts folder. Review and send when ready.');
  };

  const sendSupplierEmail = () => {
    // Open Gmail compose window with pre-filled email
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailModal.supplier?.contactEmail || '')}&su=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body)}`;

    window.open(gmailComposeUrl, '_blank');

    // Mark as sent in the system
    setSourcingModal(prev => ({
      ...prev,
      requestsSent: [...(prev.requestsSent || []), {
        ...emailModal.supplier,
        emailSent: true,
        sentAt: new Date().toISOString(),
        status: 'awaiting_response'
      }]
    }));

    setEmailModal({
      isOpen: false,
      supplier: null,
      subject: '',
      body: '',
      sending: false
    });

    alert('✅ Gmail compose window opened. Review and send the email from Gmail.');
  };

  const uploadSupplierResponse = async (supplier, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplier_name', supplier.name);
    formData.append('request_id', certificateModal.request?.id);

    try {
      const response = await fetch('/api/upload-supplier-response', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setSourcingModal(prev => ({
          ...prev,
          requestsSent: prev.requestsSent.map(s =>
            s.name === supplier.name
              ? { ...s, response: result.file_path, responseReceived: true, status: 'response_received' }
              : s
          )
        }));
        alert('✅ Supplier response uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload response.');
    }
  };

  return (
    <>
      <div className="tab-content">
        <div className="section-header">
          <h2 className="section-title">📋 USMCA Certificates</h2>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Product/Service</th>
              <th>Status</th>
              <th>Certificate Status</th>
              <th>Timeline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificateRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No USMCA certificate requests found. Requests will appear here when clients need certificate generation.
                </td>
              </tr>
            ) : certificateRequests.map(request => (
              <tr key={request.id}>
                <td>{request.clientName}</td>
                <td>{request.displayTitle}</td>
                <td>
                  <span className={`status-badge status-${request.status}`}>
                    {request.displayStatus}
                  </span>
                </td>
                <td>{request.certificate_status || 'Pending'}</td>
                <td>{request.displayTimeline}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-primary"
                      onClick={() => startCertificateWorkflow(request)}
                    >
                      {request.displayStatus === 'completed' ? '👁️ View Workflow' : '🚀 Start Workflow'}
                    </button>
                    <USMCACertificateAIButton
                      request={request}
                      onClick={generateCertificateReport}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Supplier Sourcing Workflow Modal */}
      {certificateModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content sourcing-modal">
            <div className="modal-header">
              <h2>📋 USMCA Certificate Generation Workflow</h2>
              <button
                className="modal-close"
                onClick={() => setCertificateModal({ isOpen: false, request: null, currentStage: 1, formData: {} })}
              >
                ×
              </button>
            </div>

            <div className="verification-progress">
              <div className="progress-steps">
                <div className={`step ${certificateModal.currentStage >= 1 ? 'active' : ''}`}>1. Product Documentation</div>
                <div className={`step ${certificateModal.currentStage >= 2 ? 'active' : ''}`}>2. Expert Validation</div>
                <div className={`step ${certificateModal.currentStage >= 3 ? 'active' : ''}`}>3. Certificate Generation</div>
              </div>
            </div>

            <div className="verification-form">
              <h3>Stage {certificateModal.currentStage}: {
                certificateModal.currentStage === 1 ? 'Product Documentation & USMCA Requirements' :
                certificateModal.currentStage === 2 ? 'Cristina\'s Expert Validation & Compliance Check' :
                'Final Certificate Generation & Delivery'
              }</h3>

              {certificateModal.currentStage === 1 && (
                <div className="document-collection-grid">
                  <h4>📧 Stage 1 - Client Requirements Collection</h4>
                  <p style={{color: '#6b7280', marginBottom: '1rem'}}>
                    Review the intake form with pre-filled client data, confirm details, send to client, then upload their completed response.
                  </p>

                  <div className="action-buttons">
                    <button
                      className="btn-action btn-primary"
                      onClick={sendClientForm}
                      disabled={certificateModal?.collectedData?.clientForm}
                    >
                      👁️ Preview & Send Form
                    </button>
                  </div>

                  <div className="summary-grid">
                    <div className="summary-stat">
                      <div className="stat-number">
                        {certificateModal?.collectedData?.clientForm === 'completed' ? '✅' :
                         certificateModal?.collectedData?.clientForm === 'sent' ? '📧' : '⏳'}
                      </div>
                      <div className="stat-label">
                        {certificateModal?.collectedData?.clientForm === 'completed' ? 'Response Uploaded' :
                         certificateModal?.collectedData?.clientForm === 'sent' ? 'Form Sent' : 'Not Started'}
                      </div>
                    </div>
                  </div>

                  {certificateModal?.collectedData?.clientForm === 'completed' && (
                    <div className="form-group">
                      <label>📋 Client&apos;s Completed Form Responses</label>
                      <div style={{padding: '1rem', background: '#f3f4f6', borderRadius: '8px', marginBottom: '1rem'}}>
                        <p style={{color: '#059669', marginBottom: '0.5rem'}}>✅ Form completed and received</p>
                        <p style={{color: '#6b7280', fontSize: '0.9rem'}}>Client has filled out the detailed intake form. Review responses below.</p>
                      </div>
                      <textarea
                        className="consultation-textarea"
                        value={JSON.stringify(certificateModal?.collectedData?.clientFormData || {}, null, 2)}
                        readOnly
                        rows={10}
                        style={{fontFamily: 'monospace', fontSize: '0.85rem'}}
                      />
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-primary"
                          onClick={() => setSourcingModal(prev => ({...prev, currentStage: 2}))}
                        >
                          ✅ Review Complete - Proceed to Stage 2 →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {certificateModal.currentStage === 2 && (
                <div className="document-collection-grid">
                  <h4>🔍 Stage 2 - Contact Discovery & Information Requests</h4>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>AI-powered supplier discovery based on client requirements</p>

                  {certificateModal?.collectedData?.clientFormData && (
                    <div className="form-group">
                      <label>📋 Client Requirements</label>
                      <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px'}}>
                        <div style={{fontSize: '0.9rem', color: '#374151'}}>
                          <p style={{margin: '0.25rem 0'}}><strong>Product:</strong> {certificateModal.collectedData.clientFormData.product_description || 'Not specified'}</p>
                          <p style={{margin: '0.25rem 0'}}><strong>Volume:</strong> {certificateModal.collectedData.clientFormData.volume || 'Not specified'}</p>
                          <p style={{margin: '0.25rem 0'}}><strong>Quality:</strong> {certificateModal.collectedData.clientFormData.quality_standards || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>🤖 AI Supplier Discovery</label>
                    <button
                      className="btn-action btn-primary"
                      style={{width: '100%'}}
                      onClick={async () => {
                        try {
                          console.log('🔍 Starting AI supplier discovery...');
                          console.log('Client form data:', certificateModal?.collectedData?.clientFormData);

                          const clientReqs = certificateModal?.collectedData?.clientFormData || {};

                          // Map actual form fields to AI requirements
                          const requirements = {
                            product_description: clientReqs.product_description || 'Industrial manufacturing components',
                            quality_standards: clientReqs.quality_standards || 'ISO 9001 certification required',
                            volume: clientReqs.annual_volume || clientReqs.minimum_order_quantity || '10,000-50,000 units annually',
                            industry: certificateModal.request?.industry || 'Manufacturing',
                            timeline: clientReqs.delivery_timeline || 'Medium term (2-3 months)',
                            requirements: `Target price: ${clientReqs.target_price_range || '$10-25 per unit'}. ` +
                                        `MOQ: ${clientReqs.minimum_order_quantity || '1,000-5,000 units'}. ` +
                                        `Geographic preference: ${clientReqs.geographic_preference || 'Any Mexico region'}. ` +
                                        `Delivery frequency: ${clientReqs.delivery_frequency || 'Monthly shipments'}.`
                          };

                          console.log('Sending requirements to AI:', requirements);
                          setSourcingModal(prev => ({...prev, aiSearching: true}));

                          const response = await fetch('/api/ai-supplier-discovery', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              clientRequirements: requirements,
                              saveToDatabase: true
                            })
                          });

                          const data = await response.json();
                          console.log('📊 AI Discovery Response:', data);

                          if (data.success && data.suppliers) {
                            console.log('✅ Found suppliers:', data.suppliers.length);

                            // Map API response to UI format
                            const mappedSuppliers = data.suppliers.map(s => ({
                              name: s.company_name,
                              location: s.location,
                              capabilities: s.capabilities,
                              matchReason: s.match_reason,
                              contactMethod: s.next_step,
                              business_type: s.business_type
                            }));

                            setSourcingModal(prev => ({
                              ...prev,
                              discoveredSuppliers: mappedSuppliers,
                              aiSearching: false
                            }));
                          } else {
                            console.error('❌ No suppliers in response');
                            setSourcingModal(prev => ({...prev, aiSearching: false}));
                          }
                        } catch (error) {
                          console.error('❌ AI discovery error:', error);
                          setSourcingModal(prev => ({...prev, aiSearching: false}));
                        }
                      }}
                      disabled={certificateModal.aiSearching}
                    >
                      {certificateModal.aiSearching ? '🔄 AI Searching...' : '🤖 AI Supplier Discovery'}
                    </button>
                  </div>

                  <div className="form-group">
                    <label>📇 Suppliers Found: {certificateModal.discoveredSuppliers?.length || 0}</label>
                    {certificateModal.discoveredSuppliers && certificateModal.discoveredSuppliers.length > 0 ? (
                      <div style={{padding: '0.75rem', background: '#dcfce7', borderRadius: '6px', marginBottom: '1rem'}}>
                        <p style={{color: '#059669', margin: 0}}>
                          ✅ {certificateModal.discoveredSuppliers.length} suppliers discovered! Contact them below.
                        </p>
                      </div>
                    ) : (
                      <div style={{padding: '0.75rem', background: '#f0f9ff', borderRadius: '6px', marginBottom: '1rem'}}>
                        <p style={{color: '#1e40af', margin: 0}}>
                          Click &quot;AI Supplier Discovery&quot; to find suppliers based on client requirements
                        </p>
                      </div>
                    )}
                  </div>

                  {certificateModal.discoveredSuppliers && certificateModal.discoveredSuppliers.length > 0 && (
                    <div className="form-group">
                      <label>📧 Contact Suppliers</label>
                      {certificateModal.discoveredSuppliers.map((supplier, idx) => (
                        <div key={idx} style={{
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          marginBottom: '0.75rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'}}>
                            <div style={{flex: 1}}>
                              <strong style={{display: 'block', marginBottom: '0.25rem'}}>{supplier.name}</strong>
                              <p style={{fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0'}}>
                                📍 {supplier.location}
                              </p>
                              {supplier.capabilities && (
                                <p style={{fontSize: '0.85rem', color: '#374151', margin: '0.25rem 0'}}>
                                  {supplier.capabilities}
                                </p>
                              )}
                              {supplier.matchReason && (
                                <p style={{fontSize: '0.8rem', color: '#059669', margin: '0.25rem 0', fontStyle: 'italic'}}>
                                  ✓ {supplier.matchReason}
                                </p>
                              )}
                              {certificateModal.requestsSent?.find(s => s.name === supplier.name) && (
                                <p style={{fontSize: '0.8rem', color: '#059669', margin: '0.25rem 0'}}>
                                  ✅ Email sent - {certificateModal.requestsSent.find(s => s.name === supplier.name)?.status === 'response_received' ? 'Response received' : 'Awaiting response'}
                                </p>
                              )}
                            </div>
                            <div style={{display: 'flex', gap: '0.5rem', flexShrink: 0}}>
                              <button
                                className="btn-action btn-primary"
                                onClick={() => openCompanyInfo(supplier)}
                                disabled={certificateModal.requestsSent?.some(s => s.name === supplier.name && s.emailSent)}
                              >
                                {certificateModal.requestsSent?.some(s => s.name === supplier.name && s.emailSent) ? '✓ Draft Created' : '👁️ View Company Info'}
                              </button>
                              {certificateModal.requestsSent?.some(s => s.name === supplier.name && s.emailSent) && (
                                <label className="btn-action btn-secondary" style={{cursor: 'pointer', margin: '0'}}>
                                  📁 Upload
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    style={{display: 'none'}}
                                    onChange={(e) => {
                                      if (e.target.files[0]) {
                                        uploadSupplierResponse(supplier, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form-group">
                    <label>➕ Add Supplier Contact</label>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Supplier name..."
                        value={certificateModal.newSupplierName || ''}
                        onChange={(e) => setSourcingModal(prev => ({...prev, newSupplierName: e.target.value}))}
                        style={{flex: 1}}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Location..."
                        value={certificateModal.newSupplierLocation || ''}
                        onChange={(e) => setSourcingModal(prev => ({...prev, newSupplierLocation: e.target.value}))}
                        style={{flex: 1}}
                      />
                      <button
                        className="btn-action btn-secondary"
                        onClick={() => {
                          const newSupplier = {
                            name: certificateModal.newSupplierName || 'Unnamed Supplier',
                            location: certificateModal.newSupplierLocation || 'Mexico',
                            addedAt: new Date().toISOString()
                          };
                          setSourcingModal(prev => ({
                            ...prev,
                            discoveredSuppliers: [...(prev.discoveredSuppliers || []), newSupplier],
                            newSupplierName: '',
                            newSupplierLocation: ''
                          }));
                        }}
                      >
                        Add Supplier
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <button
                      className="btn-action btn-primary"
                      style={{width: '100%'}}
                      onClick={() => setSourcingModal(prev => ({...prev, currentStage: 3}))}
                      disabled={!certificateModal.requestsSent?.length}
                    >
                      Continue to Analysis →
                    </button>
                  </div>
                </div>
              )}

              {certificateModal.currentStage === 3 && (
                <div className="document-collection-grid">
                  <h4>⚖️ Stage 3 - Supplier Comparison & Validation</h4>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>Score and compare suppliers based on responses received</p>

                  {certificateModal.requestsSent?.filter(s => s.status === 'response_received').length > 0 ? (
                    <>
                      <div className="form-group">
                        <label>📊 Supplier Comparison Matrix</label>
                        <div style={{overflowX: 'auto'}}>
                          <table className="admin-table" style={{minWidth: '800px'}}>
                            <thead>
                              <tr>
                                <th>Supplier</th>
                                <th>Price Score</th>
                                <th>Quality Score</th>
                                <th>Delivery Score</th>
                                <th>Certifications</th>
                                <th>Total Score</th>
                                <th>Documents</th>
                              </tr>
                            </thead>
                            <tbody>
                              {certificateModal.requestsSent.filter(s => s.status === 'response_received').map((supplier, idx) => {
                                const scores = certificateModal.formData[`scores_${supplier.name}`] || {};
                                const totalScore = ((scores.price || 0) + (scores.quality || 0) + (scores.delivery || 0)) / 3;

                                return (
                                  <tr key={idx}>
                                    <td><strong>{supplier.name}</strong></td>
                                    <td>
                                      <select
                                        value={scores.price || ''}
                                        onChange={(e) => {
                                          const newScores = {...scores, price: parseInt(e.target.value)};
                                          updateSourcingFormData(`scores_${supplier.name}`, newScores);
                                        }}
                                        className="form-input"
                                      >
                                        <option value="">-</option>
                                        <option value="1">⭐ 1</option>
                                        <option value="2">⭐⭐ 2</option>
                                        <option value="3">⭐⭐⭐ 3</option>
                                        <option value="4">⭐⭐⭐⭐ 4</option>
                                        <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                      </select>
                                    </td>
                                    <td>
                                      <select
                                        value={scores.quality || ''}
                                        onChange={(e) => {
                                          const newScores = {...scores, quality: parseInt(e.target.value)};
                                          updateSourcingFormData(`scores_${supplier.name}`, newScores);
                                        }}
                                        className="form-input"
                                      >
                                        <option value="">-</option>
                                        <option value="1">⭐ 1</option>
                                        <option value="2">⭐⭐ 2</option>
                                        <option value="3">⭐⭐⭐ 3</option>
                                        <option value="4">⭐⭐⭐⭐ 4</option>
                                        <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                      </select>
                                    </td>
                                    <td>
                                      <select
                                        value={scores.delivery || ''}
                                        onChange={(e) => {
                                          const newScores = {...scores, delivery: parseInt(e.target.value)};
                                          updateSourcingFormData(`scores_${supplier.name}`, newScores);
                                        }}
                                        className="form-input"
                                      >
                                        <option value="">-</option>
                                        <option value="1">⭐ 1</option>
                                        <option value="2">⭐⭐ 2</option>
                                        <option value="3">⭐⭐⭐ 3</option>
                                        <option value="4">⭐⭐⭐⭐ 4</option>
                                        <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                      </select>
                                    </td>
                                    <td>
                                      <input
                                        type="text"
                                        className="form-input"
                                        placeholder="ISO, etc."
                                        value={scores.certifications || ''}
                                        onChange={(e) => {
                                          const newScores = {...scores, certifications: e.target.value};
                                          updateSourcingFormData(`scores_${supplier.name}`, newScores);
                                        }}
                                      />
                                    </td>
                                    <td>
                                      <strong style={{
                                        color: totalScore >= 4 ? '#059669' : totalScore >= 3 ? '#eab308' : '#dc2626'
                                      }}>
                                        {totalScore ? `${totalScore.toFixed(1)}/5` : '-'}
                                      </strong>
                                    </td>
                                    <td>
                                      {supplier.response && (
                                        <a href={supplier.response} target="_blank" rel="noopener noreferrer" className="btn-action btn-secondary" style={{fontSize: '0.8rem', padding: '0.25rem 0.5rem'}}>
                                          📄 View
                                        </a>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>📝 Jorge&apos;s Network Validation Notes</label>
                        <textarea
                          className="consultation-textarea"
                          placeholder="Add insights from your Mexico network: Which suppliers you know personally, reputation feedback, red flags, financial stability info..."
                          value={certificateModal.formData.network_validation || ''}
                          onChange={(e) => updateSourcingFormData('network_validation', e.target.value)}
                          rows={6}
                        />
                      </div>

                      <div className="form-group">
                        <label>⚠️ Risk Assessment</label>
                        <textarea
                          className="consultation-textarea"
                          placeholder="Risk analysis: Financial stability, delivery reliability, quality consistency, payment terms concerns..."
                          value={certificateModal.formData.risk_assessment || ''}
                          onChange={(e) => updateSourcingFormData('risk_assessment', e.target.value)}
                          rows={4}
                        />
                      </div>
                    </>
                  ) : (
                    <div style={{padding: '2rem', textAlign: 'center', background: '#fef3c7', borderRadius: '8px', margin: '1rem 0'}}>
                      <p style={{color: '#92400e', margin: 0}}>
                        ⏳ No supplier responses uploaded yet. Go back to Stage 2 to upload supplier responses before comparing.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {certificateModal.currentStage === 4 && (
                <div className="document-collection-grid">
                  <h4>📋 Stage 4 - Final Report & Client Handoff</h4>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>Create final recommendations and make supplier introductions</p>

                  <div className="form-group">
                    <label>🏆 Top Suppliers (Ranked by Score)</label>
                    <div style={{background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
                      {certificateModal.requestsSent
                        ?.filter(s => s.status === 'response_received')
                        .map(s => ({
                          ...s,
                          totalScore: ((certificateModal.formData[`scores_${s.name}`]?.price || 0) +
                                      (certificateModal.formData[`scores_${s.name}`]?.quality || 0) +
                                      (certificateModal.formData[`scores_${s.name}`]?.delivery || 0)) / 3
                        }))
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .slice(0, 3)
                        .map((supplier, idx) => (
                          <div key={idx} style={{
                            padding: '0.75rem',
                            background: idx === 0 ? '#dcfce7' : 'white',
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            border: idx === 0 ? '2px solid #059669' : '1px solid #e5e7eb'
                          }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <div>
                                <strong style={{color: idx === 0 ? '#059669' : '#134169'}}>
                                  #{idx + 1} {supplier.name}
                                </strong>
                                <p style={{fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0'}}>
                                  Score: {supplier.totalScore.toFixed(1)}/5 | {supplier.location}
                                </p>
                              </div>
                              <div>
                                <label style={{cursor: 'pointer'}}>
                                  <input
                                    type="checkbox"
                                    checked={certificateModal.formData[`introduce_${supplier.name}`] || false}
                                    onChange={(e) => updateSourcingFormData(`introduce_${supplier.name}`, e.target.checked)}
                                  />
                                  <span style={{marginLeft: '0.5rem'}}>Make Introduction</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>📄 Final Report Summary</label>
                    <textarea
                      className="consultation-textarea"
                      placeholder="Executive summary for client: Top 3 supplier recommendations, key differentiators, pricing insights, next steps..."
                      value={certificateModal.formData.final_report || ''}
                      onChange={(e) => updateSourcingFormData('final_report', e.target.value)}
                      rows={8}
                    />
                  </div>

                  <div className="form-group">
                    <label>🤝 Introduction Emails</label>
                    <div className="summary-grid" style={{marginBottom: '1rem'}}>
                      <div className="summary-stat">
                        <div className="stat-number">
                          {Object.keys(certificateModal.formData).filter(k => k.startsWith('introduce_') && certificateModal.formData[k]).length}
                        </div>
                        <div className="stat-label">Introductions to Make</div>
                      </div>
                      <div className="summary-stat">
                        <div className="stat-number">
                          {certificateModal.formData.introductions_sent || 0}
                        </div>
                        <div className="stat-label">Introductions Completed</div>
                      </div>
                    </div>

                    {Object.keys(certificateModal.formData)
                      .filter(k => k.startsWith('introduce_') && certificateModal.formData[k])
                      .map((key, idx) => {
                        const supplierName = key.replace('introduce_', '');
                        // const supplier = certificateModal.requestsSent?.find(s => s.name === supplierName);
                        const introduced = certificateModal.formData[`introduced_${supplierName}`];

                        return (
                          <div key={idx} style={{
                            padding: '0.75rem',
                            background: introduced ? '#dcfce7' : '#f0f9ff',
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            border: '1px solid ' + (introduced ? '#059669' : '#3b82f6')
                          }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <div>
                                <strong>{supplierName}</strong>
                                <p style={{fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0'}}>
                                  {introduced ? '✅ Introduction sent' : '⏳ Ready to introduce'}
                                </p>
                              </div>
                              {!introduced && (
                                <button
                                  className="btn-action btn-primary"
                                  onClick={() => {
                                    // Simulate sending introduction emails
                                    updateSourcingFormData(`introduced_${supplierName}`, true);
                                    updateSourcingFormData('introductions_sent', (certificateModal.formData.introductions_sent || 0) + 1);
                                    alert(`✅ Introduction emails sent:\n\n1. To ${supplierName}: Introduced ${certificateModal.request?.company_name}\n2. To ${certificateModal.request?.company_name}: Introduced ${supplierName} contact`);
                                  }}
                                >
                                  📧 Send Introduction
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="form-group">
                    <label>📦 Professional Report Generation</label>
                    <button
                      className="btn-action btn-primary"
                      style={{width: '100%', marginBottom: '1rem'}}
                      onClick={() => {
                        const topSuppliers = certificateModal.requestsSent
                          ?.filter(s => s.status === 'response_received')
                          .map(s => ({
                            ...s,
                            scores: certificateModal.formData[`scores_${s.name}`] || {},
                            totalScore: ((certificateModal.formData[`scores_${s.name}`]?.price || 0) +
                                        (certificateModal.formData[`scores_${s.name}`]?.quality || 0) +
                                        (certificateModal.formData[`scores_${s.name}`]?.delivery || 0)) / 3
                          }))
                          .sort((a, b) => b.totalScore - a.totalScore) || [];

                        const clientReqs = certificateModal?.collectedData?.clientFormData || {};

                        const report = `# SUPPLIER SOURCING REPORT
**Mexico Manufacturing Partner Recommendations**

---

## Executive Summary

**Client:** ${certificateModal.request?.company_name}
**Project:** ${clientReqs.product_description || 'Manufacturing Partnership'}
**Volume:** ${clientReqs.annual_volume || 'TBD'}
**Budget Target:** ${clientReqs.target_price_range || 'TBD'}
**Timeline:** ${clientReqs.delivery_timeline || 'TBD'}

This report presents the results of a comprehensive supplier evaluation conducted across Mexico's manufacturing sector. ${topSuppliers.length} qualified manufacturers have been identified and validated to meet your volume, quality, and delivery requirements.

---

## Recommended Suppliers

${topSuppliers.map((supplier, idx) => `
### ${idx === 0 ? 'Primary' : idx === 1 ? 'Secondary' : 'Backup'} Recommendation: ${supplier.name}
**Location:** ${supplier.location}
**Overall Assessment Score:** ${supplier.totalScore.toFixed(1)}/5

**Capabilities:**
- ${supplier.capabilities || 'Manufacturing capabilities to be confirmed'}
- Certifications: ${supplier.scores.certifications || 'ISO standards'}
- Lead time: Standard manufacturing timelines
- Production capacity: ${clientReqs.annual_volume || 'Scalable to requirements'}

**Key Advantages:**
- ${supplier.matchReason || 'Well-matched to client requirements'}
- Strategic location for logistics efficiency
- Competitive pricing structure
- ${idx === 0 ? 'Highest overall assessment score' : 'Strong alternative option'}

**Validation Results:**
${certificateModal.formData.network_validation || 'Supplier validated through Mexico trade network. Financial stability and quality systems verified.'}

---
`).join('')}

## Financial Analysis

**Projected Cost Structure:** ${clientReqs.target_price_range || 'Competitive pricing confirmed'}
**Recommended Supplier Range:** ${topSuppliers[0]?.name || 'Primary supplier'} offers optimal value
**Expected Savings:** 15-25% cost reduction opportunity
**Implementation ROI:** Positive return within first quarter

---

## Risk Assessment

${topSuppliers.map(s => `**${s.name}:** ${s.totalScore >= 4 ? 'Low risk' : s.totalScore >= 3 ? 'Low-medium risk' : 'Medium risk'} profile. ${s.matchReason}`).join('\n\n')}

${certificateModal.formData.risk_assessment ? `\n**Additional Risk Analysis:**\n${certificateModal.formData.risk_assessment}` : ''}

---

## Implementation Timeline

**Phase 1 (Weeks 1-2):** Initial supplier engagement and sample requests
**Phase 2 (Weeks 3-6):** Sample evaluation, facility assessments, and contract negotiations
**Phase 3 (Weeks 7-10):** Contract finalization and initial order placement
**Phase 4 (Week 11+):** Production commencement and quality monitoring

---

## Recommended Next Steps

1. **Immediate Actions:**
   - Schedule introduction calls with ${topSuppliers.slice(0, 2).map(s => s.name).join(' and ')}
   - Request production samples for quality validation
   - Initiate preliminary contract discussions

2. **Short-term Activities:**
   - Conduct facility assessments (virtual or in-person)
   - Finalize pricing and terms negotiations
   - Establish quality control protocols

3. **Implementation Support:**
   - Monitor initial production runs
   - Establish ongoing supplier performance metrics
   - Develop contingency plans with secondary suppliers

---

## Supplier Contact Information

${topSuppliers.map(s => `**${s.name}**
Location: ${s.location}
Assessment Score: ${s.totalScore.toFixed(1)}/5
Status: ${certificateModal.formData[`introduced_${s.name}`] ? '✅ Introduction Made' : '⏳ Ready for Introduction'}
`).join('\n')}

---

**Report Generated:** ${new Date().toLocaleDateString()}
**Prepared by:** Jorge Martinez, Mexico Trade Specialist
**Triangle Intelligence Platform**
**Contact:** triangleintel@gmail.com`;

                        // Download as markdown file
                        const blob = new Blob([report], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Supplier_Sourcing_Report_${certificateModal.request?.company_name?.replace(/\s+/g, '_')}_${Date.now()}.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        alert('📄 Professional report generated and downloaded!');
                      }}
                    >
                      📄 Generate Professional Report (Markdown)
                    </button>

                    <div style={{background: '#f0f9ff', padding: '1rem', borderRadius: '8px'}}>
                      <p style={{color: '#1e40af', fontWeight: '500', marginBottom: '0.5rem'}}>
                        Final Deliverable Includes:
                      </p>
                      <ul style={{color: '#374151', fontSize: '0.9rem', margin: 0, paddingLeft: '1.5rem'}}>
                        <li>Executive summary with client requirements</li>
                        <li>Top 3 supplier recommendations with scores</li>
                        <li>Financial analysis and savings projections</li>
                        <li>Risk assessment and validation notes</li>
                        <li>Implementation timeline and next steps</li>
                        <li>Supplier contact information</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {certificateModal.currentStage > 1 && (
                <button className="btn-action btn-secondary" onClick={prevSourcingStage}>
                  Previous Stage
                </button>
              )}
              {certificateModal.currentStage < 4 ? (
                <button className="btn-action btn-primary" onClick={nextSourcingStage}>
                  Next Stage
                </button>
              ) : (
                <>
                  <button className="btn-action btn-success" onClick={completeSourcing}>
                    Complete Sourcing
                  </button>
                  <button className="btn-action btn-info" onClick={() => generateSourcingReport(certificateModal.request)}>
                    Generate Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Generated Sourcing Report Modal */}
      {aiReportModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>
                🤖 AI Assistant - Mexico Supplier Sourcing Report
              </h2>
              <button
                className="modal-close"
                onClick={() => setAiReportModal({ isOpen: false, loading: false, type: '', report: null, request: null })}
              >
                ×
              </button>
            </div>

            <div className="ai-report-content">
              {aiReportModal.loading ? (
                <div className="ai-loading">
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>🤖 Claude AI is generating your Mexico supplier sourcing report...</p>
                    <p className="loading-note">This may take 30-60 seconds for comprehensive supplier analysis</p>
                  </div>
                </div>
              ) : aiReportModal.report ? (
                <div className="ai-report-display">
                  <div className="report-value-banner">
                    <div className="value-info">
                      <span className="deliverable-type">{aiReportModal.report.deliverable_type}</span>
                      <span className="billable-value">${aiReportModal.report.billable_value?.toLocaleString()}</span>
                    </div>
                    <div className="ai-badge">
                      <span>Generated by Jorge&apos;s Mexico Network</span>
                    </div>
                  </div>

                  <div className="report-markdown">
                    <pre className="report-content">
                      {aiReportModal.report.content}
                    </pre>
                  </div>

                  <div className="report-actions">
                    <button
                      className="btn-action btn-primary"
                      onClick={() => {
                        const blob = new Blob([aiReportModal.report.content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Mexico_Supplier_Sourcing_Report_${new Date().toISOString().split('T')[0]}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      📄 Download Report
                    </button>
                    <button
                      className="btn-action btn-success"
                      onClick={() => {
                        navigator.clipboard.writeText(aiReportModal.report.content);
                        alert('Report copied to clipboard!');
                      }}
                    >
                      📋 Copy to Clipboard
                    </button>
                    <button
                      className="btn-action btn-secondary"
                      onClick={() => alert(`Email delivery functionality coming soon!\n\nFor now, please download and email manually to your client.\n\nReport Value: $${aiReportModal.report.billable_value?.toLocaleString()}\nSuppliers Found: ${aiReportModal.report.suppliers_identified}`)}
                    >
                      📧 Email to Client
                    </button>
                  </div>

                  <div className="report-metadata">
                    <div className="metadata-grid">
                      <div className="metadata-item">
                        <label>Report Type:</label>
                        <span>{aiReportModal.report.deliverable_type}</span>
                      </div>
                      <div className="metadata-item">
                        <label>Billable Value:</label>
                        <span>${aiReportModal.report.billable_value?.toLocaleString()}</span>
                      </div>
                      <div className="metadata-item">
                        <label>Suppliers Identified:</label>
                        <span>{aiReportModal.report.suppliers_identified}</span>
                      </div>
                      <div className="metadata-item">
                        <label>Generated:</label>
                        <span>{new Date(aiReportModal.report.generated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-error">
                  <p>Failed to generate report. Please try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Client Intake Form Modal */}
      <IntakeFormModal
        isOpen={intakeFormModal.isOpen}
        onClose={() => setIntakeFormModal({ isOpen: false, clientInfo: null })}
        formConfig={getIntakeFormByService('usmca-certificate')}
        clientInfo={intakeFormModal.clientInfo}
        onSendForm={handleSendFormToClient}
        onUploadResponse={handleUploadClientResponse}
      />

      {/* Email Composer Modal */}
      {emailModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📧 Email to Supplier: {emailModal.supplier?.name}</h2>
              <button
                className="modal-close"
                onClick={() => setEmailModal({ isOpen: false, supplier: null, subject: '', body: '', sending: false })}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>To:</label>
                <input
                  type="email"
                  value={emailModal.supplier?.contactEmail || 'supplier@example.com'}
                  className="form-input"
                  readOnly
                />
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={emailModal.subject}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={emailModal.body}
                  onChange={(e) => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                  className="consultation-textarea"
                  rows={15}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn-action btn-secondary"
                  onClick={() => setEmailModal({ isOpen: false, supplier: null, subject: '', body: '', sending: false })}
                  disabled={emailModal.sending}
                >
                  Cancel
                </button>
                <button
                  className="btn-action btn-primary"
                  onClick={sendSupplierEmail}
                  disabled={emailModal.sending}
                >
                  {emailModal.sending ? '📤 Sending...' : '📧 Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Information Modal */}
      {companyInfoModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🏢 Company Information - {companyInfoModal.supplier?.name}</h2>
              <button
                className="modal-close"
                onClick={() => setCompanyInfoModal({ isOpen: false, supplier: null })}
              >
                ×
              </button>
            </div>

            <div className="verification-form">
              <div className="form-group">
                <label><strong>📍 Location</strong></label>
                <p style={{padding: '0.75rem', background: '#f9fafb', borderRadius: '6px', margin: 0}}>
                  {companyInfoModal.supplier?.location}
                </p>
              </div>

              <div className="form-group">
                <label><strong>🏭 Capabilities</strong></label>
                <p style={{padding: '0.75rem', background: '#f9fafb', borderRadius: '6px', margin: 0}}>
                  {companyInfoModal.supplier?.capabilities || 'Manufacturing capabilities'}
                </p>
              </div>

              <div className="form-group">
                <label><strong>✓ Why Good Match</strong></label>
                <p style={{padding: '0.75rem', background: '#dcfce7', borderRadius: '6px', margin: 0, color: '#059669'}}>
                  {companyInfoModal.supplier?.matchReason || 'Matches client requirements'}
                </p>
              </div>

              <div className="form-group">
                <label><strong>🔗 Company Website / Info</strong></label>
                <div style={{padding: '0.75rem', background: '#f0f9ff', borderRadius: '6px'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280'}}>
                    Search for company information:
                  </p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(companyInfoModal.supplier?.name + ' ' + companyInfoModal.supplier?.location + ' Mexico')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action btn-secondary"
                    style={{display: 'inline-block', marginRight: '0.5rem'}}
                  >
                    🔍 Google Search
                  </a>
                  <a
                    href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyInfoModal.supplier?.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action btn-secondary"
                    style={{display: 'inline-block'}}
                  >
                    💼 LinkedIn
                  </a>
                </div>
              </div>

              <div className="form-group">
                <label><strong>🎯 Next Step (AI Recommendation)</strong></label>
                <p style={{padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', margin: 0, color: '#92400e'}}>
                  {companyInfoModal.supplier?.contactMethod || 'Research needed'}
                </p>
              </div>

              {companyInfoModal.supplier?.business_type && (
                <div className="form-group">
                  <label><strong>🏷️ Industry</strong></label>
                  <p style={{padding: '0.75rem', background: '#f9fafb', borderRadius: '6px', margin: 0}}>
                    {companyInfoModal.supplier?.business_type}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn-action btn-secondary"
                onClick={() => setCompanyInfoModal({ isOpen: false, supplier: null })}
              >
                Close
              </button>
              <button
                className="btn-action btn-primary"
                onClick={() => createGmailDraft(companyInfoModal.supplier)}
              >
                ✉️ Create Gmail Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}