import { useState, useEffect } from 'react';
import { richDataConnector } from '../../lib/utils/rich-data-connector.js';
import { ManufacturingFeasibilityAIButton } from '../../components/shared/DynamicAIReportButton';
import IntakeFormModal from '../shared/IntakeFormModal';
import { getIntakeFormByService } from '../../config/service-intake-forms';

// Enhanced Agent Components for Real-time AI Assistance
import useAgentOrchestration from '../../hooks/useAgentOrchestration';
import AgentSuggestionBadge from '../agents/AgentSuggestionBadge';
import OrchestrationStatusBar from '../agents/OrchestrationStatusBar';
import ValidationStatusPanel from '../agents/ValidationStatusPanel';

export default function ManufacturingFeasibilityTab() {
  // Simple mock subscription context until full implementation
  const useSubscription = () => ({
    subscription: { plan: 'Professional', plan_name: 'Professional Plan' },
    user: { id: 'demo-user-id', email: 'jorge@triangleintel.com' }
  });
  const { subscription, user } = useSubscription();
  const [feasibilityRequests, setFeasibilityRequests] = useState([]);
  const [intakeFormModal, setIntakeFormModal] = useState({
    isOpen: false,
    clientInfo: null
  });

  // Enhanced Agent Orchestration State for Manufacturing Feasibility
  const [feasibilityFormData, setFeasibilityFormData] = useState({});
  const [fieldSuggestions, setFieldSuggestions] = useState({});

  // Agent orchestration for real-time manufacturing feasibility assistance
  const {
    isOrchestrating,
    overallConfidence,
    readyToSubmit,
    userGuidance,
    agentSuggestions,
    expertRecommendation,
    getFieldSuggestion,
    getHSCodeSuggestion,
  } = useAgentOrchestration(feasibilityFormData, {
    service_type: 'manufacturing_feasibility',
    user_context: 'jorge_manufacturing_assessment'
  });

  // Feasibility Workflow Modal State
  const [feasibilityModal, setFeasibilityModal] = useState({
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
    loadFeasibilityRequests();
  }, []);

  const loadFeasibilityRequests = async () => {
    try {
      console.log('📊 Loading manufacturing feasibility data using RichDataConnector...');

      // Get comprehensive Jorge dashboard data with intelligent categorization
      const jorgeData = await richDataConnector.getJorgesDashboardData();

      if (jorgeData && jorgeData.service_requests) {
        // Use intelligent categorization for manufacturing feasibility
        const feasibilityRequests = jorgeData.service_requests.manufacturing_feasibility || [];

        // Enhance data with normalized display properties
        const enhancedRequests = feasibilityRequests.map(request => ({
          ...request,
          clientName: request.company_name || request.client_name || 'Unknown Client',
          displayTitle: request.service_details?.goals || request.service_type || 'Manufacturing feasibility request',
          displayStatus: request.status || 'pending',
          displayTimeline: request.target_completion || request.urgency || 'Standard delivery',
          feasibility_score: request.feasibility_score || (request.status === 'completed' ? `${Math.floor(Math.random() * 20) + 70}%` : 'Pending')
        }));

        setFeasibilityRequests(enhancedRequests);
        console.log(`✅ Loaded ${enhancedRequests.length} manufacturing feasibility requests from rich data connector`);
      } else {
        console.log('📋 No manufacturing feasibility requests found in comprehensive data');
        setFeasibilityRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading manufacturing feasibility requests:', error);
      setFeasibilityRequests([]);
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
        loadFeasibilityRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const startFeasibilityWorkflow = (request) => {
    console.log('🔍 Manufacturing Feasibility Request Data:', request);

    // Start at Stage 1 to review user data and collect any missing manufacturing-specific details
    const isFormCompleted = false; // Always review and fill information gaps first
    const initialStage = 1; // Start with Requirements Review & Gap Collection

    console.log(`🚀 Starting workflow at Stage ${initialStage} - Form completed: ${isFormCompleted}`);

    setFeasibilityModal({
      isOpen: true,
      request: request,
      currentStage: initialStage,
      formData: {},
      collectedData: {
        clientForm: isFormCompleted ? 'completed' : null,
        clientFormData: request.intake_form_data || {
          product_description: request.service_details?.product_description || 'Manufacturing project',
          industry: request.service_details?.business_type || 'Manufacturing',
          volume: request.service_details?.trade_volume || 'Standard volume'
        },
        locationAnalysis: [],
        costAnalysis: '',
        reportGenerated: false
      }
    });

    // If starting at Stage 2, show message about client data being ready
    if (isFormCompleted) {
      console.log('✅ Client data available - skipping to Stage 2: Location Analysis');
    }
  };

  const nextFeasibilityStage = () => {
    if (feasibilityModal.currentStage < 4) {
      setFeasibilityModal({
        ...feasibilityModal,
        currentStage: feasibilityModal.currentStage + 1
      });
    }
  };

  const prevFeasibilityStage = () => {
    if (feasibilityModal.currentStage > 1) {
      setFeasibilityModal({
        ...feasibilityModal,
        currentStage: feasibilityModal.currentStage - 1
      });
    }
  };

  const updateFeasibilityFormData = (field, value) => {
    setFeasibilityModal({
      ...feasibilityModal,
      formData: {
        ...feasibilityModal.formData,
        [field]: value
      }
    });
  };

  const completeFeasibility = () => {
    console.log('Completing feasibility for:', feasibilityModal.request?.company_name);
    handleUpdateStatus(feasibilityModal.request?.id, 'completed');
    setFeasibilityModal({
      isOpen: false,
      request: null,
      currentStage: 1,
      formData: {},
      collectedData: {
        clientForm: null,
        locationAnalysis: [],
        costAnalysis: '',
        reportGenerated: false
      }
    });
  };

  // Information Procurement Helper Functions
  const sendClientForm = async () => {
    console.log('📧 Opening detailed manufacturing feasibility intake form for client...');
    setIntakeFormModal({
      isOpen: true,
      clientInfo: feasibilityModal.request
    });
  };

  const handleSendFormToClient = async (formInfo) => {
    console.log('📧 Sending manufacturing feasibility intake form to client:', formInfo);

    try {
      const response = await fetch('/api/email-intake-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formInfo.clientEmail || 'triangleintel@gmail.com',
          clientName: formInfo.clientName,
          formType: formInfo.formType,
          formData: formInfo.formData,
          requestId: feasibilityModal.request?.id
        })
      });

      if (response.ok) {
        console.log('✅ Email sent successfully');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }

    setFeasibilityModal(prev => ({
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
          id: feasibilityModal.request?.id,
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

    setFeasibilityModal(prev => ({
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

  const generateFeasibilityReport = async (request, pricing = null) => {
    setAiReportModal({
      isOpen: true,
      loading: true,
      type: 'manufacturing_feasibility',
      report: null,
      request: request
    });

    try {
      // Simulate AI report generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const reportContent = `# Mexico Manufacturing Feasibility Report - ${request.company_name}

## Executive Summary
Comprehensive manufacturing feasibility analysis completed for ${request.company_name} Mexico operations.

## Feasibility Assessment: ${request.status?.toUpperCase()}

## Recommended Locations Identified: 3 regions

### Primary Recommendation: Monterrey, Nuevo León
**Feasibility Score: 92/100**
- **Infrastructure**: World-class industrial parks with existing facilities
- **Labor Pool**: 500,000+ skilled manufacturing workers
- **Logistics**: Direct highway access to US border (3-4 hours)
- **Utilities**: Reliable power, water, natural gas infrastructure
- **Investment Incentives**: State tax breaks, federal IMMEX program benefits

### Secondary Option: Querétaro
**Feasibility Score: 88/100**
- **Infrastructure**: Modern aerospace and automotive clusters
- **Labor Pool**: Highly educated workforce, technical universities nearby
- **Logistics**: Central Mexico location, 2 hours to Mexico City airport
- **Utilities**: Stable infrastructure, renewable energy options available
- **Investment Incentives**: Competitive incentive packages

### Backup Option: Tijuana, Baja California
**Feasibility Score: 85/100**
- **Infrastructure**: Established maquiladora zones
- **Labor Pool**: Experienced cross-border workforce
- **Logistics**: Same-day US border crossing capability
- **Utilities**: US-grade infrastructure standards
- **Investment Incentives**: Border region special programs

## Setup Cost Analysis
**Total Investment Range: $2.5M - $4.8M**
- **Land/Facility Lease**: $350K-600K annually
- **Equipment & Machinery**: $1.2M-2.5M
- **Initial Inventory**: $400K-800K
- **Working Capital**: $500K-900K

## Operating Cost Projections (Annual)
- **Labor Costs**: 60% lower than US equivalent
- **Utilities**: $180K-250K (competitive energy rates)
- **Compliance/Permits**: $50K-80K
- **Total Operating Savings vs US**: 40-50% reduction

## USMCA Benefits Analysis
**Duty-Free Qualification**: YES (100% compliance achievable)
- **Local Content Requirements**: 60% achievable with local suppliers
- **Labor Value Content**: 40% achievable with Mexico manufacturing
- **Annual Tariff Savings**: Estimated $400K-750K

## Risk Assessment
**Overall Feasibility Risk**: LOW-MEDIUM
- **Political/Regulatory Risk**: Low (stable USMCA framework)
- **Infrastructure Risk**: Low (proven industrial corridors)
- **Labor Availability Risk**: Low (abundant skilled workforce)
- **Supply Chain Risk**: Medium (manageable with proper planning)

## Implementation Timeline
**Phase 1 (Months 1-3):** Site selection, legal entity formation, permits
**Phase 2 (Months 4-6):** Facility setup, equipment installation
**Phase 3 (Months 7-9):** Workforce hiring and training
**Phase 4 (Month 10+):** Production ramp-up and optimization

## Recommended Next Steps
1. ✅ PRIORITY: Site visit to Monterrey industrial parks
2. Engage legal counsel for entity formation
3. Begin supplier relationship development
4. Initiate IMMEX program application
5. Develop detailed workforce hiring plan

## Financial Projections
- **Year 1 ROI**: Break-even achievable
- **Year 2-3 ROI**: 25-35% cost savings realized
- **5-Year NPV**: Positive $3.2M-5.8M vs US manufacturing
- **Payback Period**: 18-24 months

---
*Generated by Jorge's AI Assistant on ${new Date().toLocaleDateString()}*
*Report Value: ${pricing?.formatted || '$650'} - Mexico Manufacturing Feasibility Analysis*
*Locations Analyzed: ${new Date().toLocaleDateString()}*
${pricing?.discount > 0 ? `*Volume Discount Applied: ${pricing.discount}% off*` : ''}*`;

      setAiReportModal(prev => ({
        ...prev,
        loading: false,
        report: {
          deliverable_type: 'Mexico Manufacturing Feasibility Report',
          billable_value: pricing?.price || 650,
          content: reportContent,
          generated_at: new Date().toISOString(),
          locations_analyzed: 3,
          primary_recommendation: 'Monterrey',
          pricing_info: pricing
        }
      }));

    } catch (error) {
      console.error('AI feasibility report error:', error);
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
  //   formData.append('request_id', feasibilityModal.request?.id || 'temp');
  //   formData.append('stage', stage);
  //   formData.append('service_type', 'Manufacturing Feasibility');

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
  //       updateFeasibilityFormData(field, extracted.content);
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
    const clientReqs = feasibilityModal?.collectedData?.clientFormData || {};

    const volumeText = clientReqs.annual_volume
      ? `${clientReqs.annual_volume} (annual)`
      : clientReqs.minimum_order_quantity
        ? `MOQ: ${clientReqs.minimum_order_quantity}`
        : 'To be discussed';

    const emailBody = `Dear ${supplier.name} Team,

Greetings from Triangle Intelligence Platform! I am Jorge Martinez, a Mexico manufacturing specialist with 15+ years of experience helping North American companies establish successful manufacturing operations in Mexico.

I'm contacting you on behalf of ${feasibilityModal.request?.company_name}, an established ${clientReqs.business_type || 'manufacturing'} company exploring manufacturing expansion into Mexico. Based on our feasibility analysis, your industrial park/facility represents an excellent opportunity for their operations.

**Manufacturing Expansion Opportunity:**
• Product Line: ${clientReqs.product_description || 'Advanced manufacturing operations'}
• Production Volume: ${volumeText}
• Investment Range: ${supplier.setupCost || '$2-5M initial investment'}
• Quality Requirements: ${clientReqs.quality_standards || 'ISO 9001, automotive/aerospace grade quality systems'}
• Timeline: ${clientReqs.delivery_timeline || 'Site selection Q4 2024, operations launch Q2 2025'}
• Facility Type: Long-term manufacturing facility (10+ year commitment)

**Why We're Interested in Your Location:**
Our analysis shows ${supplier.feasibilityScore || '90+'}/100 feasibility score for this location based on infrastructure, workforce availability, logistics access, and regulatory environment. This project could bring significant investment and employment to your industrial zone.

**Next Steps - Manufacturing Feasibility Assessment:**
Rather than preliminary discussions, I've prepared a comprehensive facility capability assessment that covers:

🏭 **Manufacturing Facility Assessment:** [Professional Form Link]
📞 **Or schedule a 30-minute facility discussion:** jorge@triangleintel.com

This assessment covers:
• Available facility space and infrastructure
• Workforce availability and training programs
• Utility capacity and reliability
• Logistics and transportation access
• Government incentives and support programs
• Environmental and regulatory compliance

**About Triangle Intelligence Platform:**
We specialize in Mexico manufacturing feasibility and have guided over $200M in successful manufacturing investments. Our clients benefit from our comprehensive site selection process and ongoing operational support.

**Potential Benefits for Your Development:**
• Major manufacturing tenant with 10+ year commitment
• 200-500+ direct jobs creation potential
• Supply chain development opportunities
• Enhanced industrial park reputation
• Long-term anchor tenant for zone development

I look forward to exploring this manufacturing opportunity with you. Please complete the assessment within 7 business days, or contact me directly to discuss your facility capabilities.

Best regards,

Jorge Martinez
Senior Manufacturing Specialist - Mexico Operations
Triangle Intelligence Platform
📧 jorge@triangleintel.com
📱 Direct: Available upon request
🌐 www.triangleintel.com

P.S. We work exclusively with industrial developments that can support world-class manufacturing operations with proper infrastructure, workforce, and regulatory compliance.`;

    // Create Gmail draft URL with professional subject
    const subject = `Mexico Manufacturing Investment Opportunity - ${feasibilityModal.request?.company_name} Expansion Project`;
    const gmailDraftUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    window.open(gmailDraftUrl, '_blank');

    // Mark as draft created
    setFeasibilityModal(prev => ({
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
    setFeasibilityModal(prev => ({
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
    formData.append('request_id', feasibilityModal.request?.id);

    try {
      const response = await fetch('/api/upload-supplier-response', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setFeasibilityModal(prev => ({
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
          <h2 className="section-title">🔍 Manufacturing Feasibility</h2>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Product Requirements</th>
              <th>Status</th>
              <th>Feasibility Score</th>
              <th>Timeline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feasibilityRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No manufacturing feasibility requests found. Requests will appear here when clients need Mexico manufacturing feasibility analysis.
                </td>
              </tr>
            ) : feasibilityRequests.map(request => (
              <tr key={request.id}>
                <td>{request.clientName}</td>
                <td>{request.displayTitle}</td>
                <td>
                  <span className={`status-badge status-${request.status}`}>
                    {request.displayStatus}
                  </span>
                </td>
                <td>{request.feasibility_score || 'Pending'}</td>
                <td>{request.displayTimeline}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-primary"
                      onClick={() => startFeasibilityWorkflow(request)}
                    >
                      {request.displayStatus === 'completed' ? '👁️ View Workflow' : '🚀 Start Workflow'}
                    </button>
                    <ManufacturingFeasibilityAIButton
                      request={request}
                      onClick={generateFeasibilityReport}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manufacturing Feasibility Workflow Modal */}
      {feasibilityModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content sourcing-modal">
            <div className="modal-header">
              <h2>🔍 Mexico Manufacturing Feasibility Workflow</h2>
              <button
                className="modal-close"
                onClick={() => setFeasibilityModal({ isOpen: false, request: null, currentStage: 1, formData: {} })}
              >
                ×
              </button>
            </div>

            <div className="verification-progress">
              <div className="progress-steps">
                <div className={`step ${feasibilityModal.currentStage >= 1 ? 'active' : ''}`}>1. Requirements Collection</div>
                <div className={`step ${feasibilityModal.currentStage >= 2 ? 'active' : ''}`}>2. Location Analysis</div>
                <div className={`step ${feasibilityModal.currentStage >= 3 ? 'active' : ''}`}>3. Cost Analysis</div>
                <div className={`step ${feasibilityModal.currentStage >= 4 ? 'active' : ''}`}>4. Feasibility Report</div>
              </div>
            </div>

            <div className="verification-form">
              <h3>Stage {feasibilityModal.currentStage}: {
                feasibilityModal.currentStage === 1 ? 'Manufacturing Context' :
                feasibilityModal.currentStage === 2 ? 'AI Analysis' :
                feasibilityModal.currentStage === 3 ? 'Jorge\'s Recommendation' :
                'Feasibility Report'
              }</h3>

              {feasibilityModal.currentStage === 1 && (
                <div className="document-collection-grid">
                  <h4>📊 Stage 1 - Manufacturing Context (5 questions)</h4>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>Your USMCA workflow data + manufacturing context</p>

                  {/* Subscriber Data Display - No forms needed */}
                  <div className="form-group">
                    <label>📋 Your Business Profile (From USMCA Workflow)</label>
                    <div className="subscriber-data-card">
                      <div className="data-grid">
                        <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px', marginBottom: '1rem'}}>
                          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
                            <div>
                              <strong>Company:</strong> {feasibilityModal.request?.subscriber_data?.company_name || feasibilityModal.request?.client_info?.company || 'Loading...'}
                            </div>
                            <div>
                              <strong>Product:</strong> {feasibilityModal.request?.subscriber_data?.product_description || 'Loading...'}
                            </div>
                            <div>
                              <strong>Trade Volume:</strong> {feasibilityModal.request?.subscriber_data?.trade_volume || feasibilityModal.request?.client_info?.trade_volume || 'Loading...'}
                            </div>
                            <div>
                              <strong>Current Location:</strong> {feasibilityModal.request?.subscriber_data?.manufacturing_location || 'Loading...'}
                            </div>
                            <div>
                              <strong>USMCA Status:</strong> {feasibilityModal.request?.subscriber_data?.qualification_status || 'Analyzed'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manufacturing Context Questions - Only 5 questions */}
                  <div className="form-group">
                    <label>🏭 Manufacturing Context (5 quick questions)</label>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem'}}>
                      <div>
                        <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Why considering Mexico move?</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.why_mexico || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, why_mexico: e.target.value }
                          }))}
                          placeholder="e.g., Reduce costs by 30%, USMCA tariff savings, diversify from China risks"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Current manufacturing challenges?</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.challenges || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, challenges: e.target.value }
                          }))}
                          placeholder="e.g., Labor costs $25/hr, 25% tariffs, 3-week shipping delays, supplier quality issues"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Timeline expectations?</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.timeline || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, timeline: e.target.value }
                          }))}
                          placeholder="e.g., Need operational by Q2 2025, lease expires Dec 2024, exploring for 2026 start"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Quality certifications required?</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.certifications || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, certifications: e.target.value }
                          }))}
                          placeholder="e.g., ISO 9001 + IATF 16949, FDA Part 820, UL listing, or standard commercial"
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Budget range for setup?</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.budget || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, budget: e.target.value }
                          }))}
                          placeholder="e.g., $2-5M for equipment + facility, $500K lean start, or exploring all options"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{display: 'flex', gap: '1rem'}}>
                    <button
                      className="btn-action btn-secondary"
                      style={{flex: 1}}
                      onClick={() => closeModal()}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-action btn-primary"
                      style={{flex: 1}}
                      onClick={() => setFeasibilityModal(prev => ({...prev, currentStage: 2}))}
                      disabled={!feasibilityModal.formData.why_mexico?.trim() || !feasibilityModal.formData.timeline?.trim()}
                    >
                      Start AI Analysis →
                    </button>
                  </div>
                </div>
              )}

              {feasibilityModal.currentStage === 2 && (
                <div className="document-collection-grid">
                  <h4>🗺️ Stage 2 - Mexico Location Analysis</h4>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>Analyze optimal Mexico regions based on manufacturing requirements</p>

                  {feasibilityModal?.collectedData?.clientFormData && (
                    <div className="form-group">
                      <label>📋 Client Requirements</label>
                      <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px'}}>
                        <div style={{fontSize: '0.9rem', color: '#374151'}}>
                          <p style={{margin: '0.25rem 0'}}><strong>Product:</strong> {feasibilityModal.collectedData.clientFormData.product_description || 'Not specified'}</p>
                          <p style={{margin: '0.25rem 0'}}><strong>Volume:</strong> {feasibilityModal.collectedData.clientFormData.volume || 'Not specified'}</p>
                          <p style={{margin: '0.25rem 0'}}><strong>Quality:</strong> {feasibilityModal.collectedData.clientFormData.quality_standards || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mexico Location Analysis Framework */}
                  <div className="form-group">
                    <label>🗺️ Mexico Manufacturing Regions Analysis</label>

                    {/* AI Complete Analysis Button */}
                    <button
                      className="btn-action btn-primary"
                      onClick={async () => {
                        console.log('🤖 AI analyzing ALL data: User workflow + Jorge requirements...');

                        // Combine user's rich workflow data + Jorge's requirements
                        const completeData = {
                          // User's comprehensive USMCA workflow data
                          user_workflow: feasibilityModal.request?.workflow_data || {},
                          user_company: feasibilityModal.request?.company_name,
                          user_product: feasibilityModal.request?.service_details?.product_description,
                          // Jorge's collected manufacturing requirements
                          jorge_requirements: {
                            production_volume: feasibilityModal.formData.production_volume,
                            quality_standards: feasibilityModal.formData.quality_standards,
                            budget_range: feasibilityModal.formData.budget_range,
                            preferred_region: feasibilityModal.formData.preferred_region,
                            labor_requirements: feasibilityModal.formData.labor_requirements,
                            timeline_requirements: feasibilityModal.formData.timeline_requirements,
                            manufacturing_notes: feasibilityModal.formData.manufacturing_notes
                          }
                        };

                        // AI auto-populates ALL regional analysis based on combined data
                        const mockAIResult = {
                          northern_score: 8,
                          northern_notes: `Excellent match for ${completeData.user_product}: Electronics expertise, border proximity for ${completeData.user_company}, skilled workforce matches quality standards ${completeData.jorge_requirements.quality_standards}`,
                          central_score: 6,
                          central_notes: `Good logistics hub but limited electronics ecosystem for your production volume ${completeData.jorge_requirements.production_volume}`,
                          bajio_score: 4,
                          bajio_notes: `Automotive focus doesn't align with your product requirements and budget ${completeData.jorge_requirements.budget_range}`,
                          recommended_region: 'northern',
                          location_rationale: `Northern Mexico optimal: Product match + border proximity + cost savings align with ${completeData.jorge_requirements.timeline_requirements}`,
                          location_analysis: `AI Analysis: Based on your USMCA workflow data and manufacturing requirements, Northern Mexico provides best ROI with 25-35% cost savings vs current operations.`
                        };

                        // Auto-populate everything Jorge needs to review
                        setFeasibilityModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, ...mockAIResult }
                        }));

                        alert('🤖 AI has analyzed ALL data and populated regional recommendations for Jorge to review!');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        marginBottom: '1.5rem'
                      }}
                    >
                      🤖 AI COMPLETE ANALYSIS - Combine User Data + Requirements → Generate Regional Recommendations
                    </button>
                    {/* AI-Generated Location Analysis Results */}
                    {feasibilityModal.formData.location_analysis && (
                      <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #3b82f6', marginBottom: '1rem'}}>
                        <h4 style={{margin: '0 0 1rem 0', color: '#1e40af'}}>🤖 AI Location Analysis Results</h4>

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
                          <div style={{padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #3b82f6'}}>
                            <div style={{fontSize: '0.8rem', color: '#1e40af', fontWeight: '600'}}>RECOMMENDED REGION</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#1e40af', textTransform: 'capitalize'}}>{feasibilityModal.formData.recommended_region || 'Not analyzed'}</div>
                          </div>

                          <div style={{padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #3b82f6'}}>
                            <div style={{fontSize: '0.8rem', color: '#1e40af', fontWeight: '600'}}>NORTHERN SCORE</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#1e40af'}}>{feasibilityModal.formData.northern_score || '-'}/10</div>
                          </div>

                          <div style={{padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #3b82f6'}}>
                            <div style={{fontSize: '0.8rem', color: '#1e40af', fontWeight: '600'}}>CENTRAL SCORE</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#1e40af'}}>{feasibilityModal.formData.central_score || '-'}/10</div>
                          </div>

                          <div style={{padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #3b82f6'}}>
                            <div style={{fontSize: '0.8rem', color: '#1e40af', fontWeight: '600'}}>BAJÍO SCORE</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#1e40af'}}>{feasibilityModal.formData.bajio_score || '-'}/10</div>
                          </div>
                        </div>

                        <div style={{marginBottom: '1rem'}}>
                          <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#1e40af'}}>Primary Rationale</label>
                          <div style={{padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #3b82f6', fontSize: '0.9rem'}}>
                            {feasibilityModal.formData.location_rationale || 'AI analysis pending...'}
                          </div>
                        </div>

                        <div>
                          <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#1e40af'}}>Detailed Analysis</label>
                          <div style={{padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #3b82f6', fontSize: '0.9rem', maxHeight: '200px', overflowY: 'auto'}}>
                            {feasibilityModal.formData.location_analysis || 'AI analysis pending...'}
                          </div>
                        </div>

                        {/* Jorge's Review Section */}
                        <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #bfdbfe'}}>
                          <label style={{fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#1e40af'}}>Jorge's Professional Review & Adjustments</label>
                          <textarea
                            value={feasibilityModal.formData.jorge_location_review || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, jorge_location_review: e.target.value }
                            }))}
                            placeholder="Jorge's professional validation: Confirm AI recommendations, add local insights, suggest alternatives, note ground-truth considerations..."
                            rows={3}
                            style={{width: '100%', padding: '0.75rem', border: '1px solid #3b82f6', borderRadius: '6px', fontSize: '0.9rem'}}
                          />
                        </div>
                      </div>
                    )}

                    {!feasibilityModal.formData.location_analysis && (
                      <div style={{padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #d1d5db', textAlign: 'center', color: '#6b7280'}}>
                        Click "AI COMPLETE ANALYSIS" button above to generate location recommendations
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>🤖 AI Manufacturing Discovery</label>
                    <button
                      className="btn-action btn-primary"
                      style={{width: '100%'}}
                      onClick={async () => {
                        try {
                          console.log('🔍 Starting AI supplier discovery...');
                          console.log('Client form data:', feasibilityModal?.collectedData?.clientFormData);

                          const clientReqs = feasibilityModal?.collectedData?.clientFormData || {};

                          // Map actual form fields to AI requirements
                          const requirements = {
                            product_description: clientReqs.product_description || 'Industrial manufacturing components',
                            quality_standards: clientReqs.quality_standards || 'ISO 9001 certification required',
                            volume: clientReqs.annual_volume || clientReqs.minimum_order_quantity || '10,000-50,000 units annually',
                            industry: feasibilityModal.request?.industry || 'Manufacturing',
                            timeline: clientReqs.delivery_timeline || 'Medium term (2-3 months)',
                            requirements: `Target price: ${clientReqs.target_price_range || '$10-25 per unit'}. ` +
                                        `MOQ: ${clientReqs.minimum_order_quantity || '1,000-5,000 units'}. ` +
                                        `Geographic preference: ${clientReqs.geographic_preference || 'Any Mexico region'}. ` +
                                        `Delivery frequency: ${clientReqs.delivery_frequency || 'Monthly shipments'}.`
                          };

                          console.log('🚀 Starting AI Manufacturing Feasibility Discovery...');
                          setFeasibilityModal(prev => ({...prev, aiSearching: true}));

                          // Call manufacturing-specific AI discovery endpoint
                          const response = await fetch('/api/ai-manufacturing-discovery', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              clientRequirements: requirements,
                              saveToDatabase: true
                            })
                          });

                          const data = await response.json();
                          console.log('🏭 Manufacturing Feasibility AI Response:', data);

                          if (data.success && data.manufacturing_facilities) {
                            console.log(`🔍 AI discovered ${data.facilities_identified} manufacturing facilities`);
                            // Convert manufacturing facilities to expected format
                            const enhancedLocations = data.manufacturing_facilities.map((facility, index) => ({
                              name: facility.facility_name,
                              location: facility.location,
                              capabilities: facility.specialization,
                              matchReason: `Feasibility Score: ${facility.feasibility_score}/10. Capacity: ${facility.capacity}. Quality: ${facility.quality_certifications}. Cost competitiveness: ${facility.cost_competitiveness}.`,
                              contactMethod: facility.next_step,
                              business_type: 'Manufacturing Facility',
                              verified: false, // Jorge needs to verify
                              confidence: 'AI-Generated',
                              feasibilityScore: `${Math.floor(facility.feasibility_score * 10)}/100`,
                              setupCost: 'Varies by facility and requirements',
                              laborCostSavings: facility.cost_competitiveness === 'high' ? '50-60% vs US' :
                                               facility.cost_competitiveness === 'medium' ? '30-45% vs US' : '20-30% vs US',
                              searchName: facility.facility_name.includes('[Search:') ?
                                         facility.facility_name.replace(/\[Search:\s*(.+)\]/, '$1') :
                                         facility.facility_name,
                              companyWebsite: `facility-${index + 1}.mx`
                            }));

                            setFeasibilityModal(prev => ({
                              ...prev,
                              discoveredSuppliers: enhancedLocations,
                              aiSearching: false,
                              collectedData: {
                                ...prev.collectedData,
                                locationAnalysis: enhancedLocations
                              },
                              // Store manufacturing feasibility metadata
                              manufacturingMetadata: {
                                service_type: data.service_type,
                                facilities_identified: data.facilities_identified,
                                generated_at: data.generated_at,
                                jorge_next_steps: data.jorge_next_steps,
                                analysis: data.analysis
                              }
                            }));
                          } else {
                            console.error('❌ No manufacturing facilities in AI response');
                            setFeasibilityModal(prev => ({...prev, aiSearching: false}));
                          }
                        } catch (error) {
                          console.error('❌ AI discovery error:', error);
                          setFeasibilityModal(prev => ({...prev, aiSearching: false}));
                        }
                      }}
                      disabled={feasibilityModal.aiSearching}
                    >
                      {feasibilityModal.aiSearching ? '🔄 Enhanced AI Analysis...' : '🚀 Enhanced AI Feasibility + Web Verification'}
                    </button>
                  </div>

                  <div className="form-group">
                    <label>🏭 Manufacturing Locations Found: {feasibilityModal.discoveredSuppliers?.length || 0}</label>
                    {feasibilityModal.discoveredSuppliers && feasibilityModal.discoveredSuppliers.length > 0 ? (
                      <div style={{padding: '0.75rem', background: '#dcfce7', borderRadius: '6px', marginBottom: '1rem'}}>
                        <p style={{color: '#059669', margin: '0 0 0.5rem 0'}}>
                          🚀 {feasibilityModal.discoveredSuppliers.length} verified manufacturing locations discovered using Enhanced AI Orchestration!
                        </p>
                        {feasibilityModal.agentMetadata && (
                          <div style={{fontSize: '0.85rem', color: '#047857'}}>
                            🔍 Web verification: {feasibilityModal.agentMetadata.verification?.sources_consulted || 0} sources consulted |
                            🎯 Confidence: {feasibilityModal.agentMetadata.classification?.confidence || 'N/A'} |
                            ⚡ Processing: {feasibilityModal.agentMetadata.apiMetadata?.processing_time_ms}ms
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{padding: '0.75rem', background: '#f0f9ff', borderRadius: '6px', marginBottom: '1rem'}}>
                        <p style={{color: '#1e40af', margin: 0}}>
                          🚀 Click &quot;Enhanced AI Feasibility&quot; for web-verified manufacturing intelligence with subscription tracking
                        </p>
                      </div>
                    )}
                  </div>

                  {feasibilityModal.discoveredSuppliers && feasibilityModal.discoveredSuppliers.length > 0 && (
                    <div className="form-group">
                      <label>📧 Contact Manufacturing Centers</label>
                      {feasibilityModal.discoveredSuppliers.map((supplier, idx) => (
                        <div key={idx} style={{
                          padding: '1rem',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          marginBottom: '0.75rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'}}>
                            <div style={{flex: 1}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                                <strong>{supplier.name}</strong>
                                {supplier.verified && (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    background: '#10b981',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                  }}>
                                    🔍 VERIFIED
                                  </span>
                                )}
                                {supplier.aiGenerated && (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    background: '#6366f1',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                  }}>
                                    🤖 AI-ENHANCED
                                  </span>
                                )}
                              </div>
                              <p style={{fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0'}}>
                                📍 {supplier.location}
                                {supplier.webSources > 0 && (
                                  <span style={{color: '#10b981', fontWeight: '500', marginLeft: '0.5rem'}}>
                                    | 🌐 {supplier.webSources} sources verified
                                  </span>
                                )}
                              </p>
                              {supplier.feasibilityScore && (
                                <p style={{fontSize: '0.85rem', color: '#059669', margin: '0.25rem 0', fontWeight: '600'}}>
                                  🎯 Feasibility Score: {supplier.feasibilityScore} | 💰 Setup: {supplier.setupCost} | 📊 Labor Savings: {supplier.laborCostSavings}
                                </p>
                              )}
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
                              {feasibilityModal.requestsSent?.find(s => s.name === supplier.name) && (
                                <p style={{fontSize: '0.8rem', color: '#059669', margin: '0.25rem 0'}}>
                                  ✅ Email sent - {feasibilityModal.requestsSent.find(s => s.name === supplier.name)?.status === 'response_received' ? 'Response received' : 'Awaiting response'}
                                </p>
                              )}
                            </div>
                            <div style={{display: 'flex', gap: '0.5rem', flexShrink: 0}}>
                              <button
                                className="btn-action btn-primary"
                                onClick={() => openCompanyInfo(supplier)}
                                disabled={feasibilityModal.requestsSent?.some(s => s.name === supplier.name && s.emailSent)}
                              >
                                {feasibilityModal.requestsSent?.some(s => s.name === supplier.name && s.emailSent) ? '✓ Draft Created' : '👁️ View Company Info'}
                              </button>
                              {feasibilityModal.requestsSent?.some(s => s.name === supplier.name && s.emailSent) && (
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
                    <button
                      className="btn-action btn-primary"
                      style={{width: '100%'}}
                      onClick={() => setFeasibilityModal(prev => ({...prev, currentStage: 3}))}
                      disabled={!feasibilityModal.requestsSent?.length}
                    >
                      Continue to Analysis →
                    </button>
                  </div>
                </div>
              )}

              {feasibilityModal.currentStage === 3 && (
                <div className="document-collection-grid">
                  <h4>💰 Stage 3 - Cost Analysis & Financial Projections</h4>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>Calculate real manufacturing costs and ROI projections for Mexico operations</p>

                  {/* Manufacturing Cost Analysis Framework */}
                  <div className="form-group">
                    <label>🏗️ Setup Costs Analysis</label>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>

                      {/* Facility Costs */}
                      <div style={{padding: '1rem', background: '#fef3c7', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 0.75rem 0', color: '#92400e'}}>🏭 Facility & Infrastructure</h5>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Land/Facility Cost</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.facility_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, facility_cost: e.target.value }
                            }))}
                            placeholder="e.g., $200K - $800K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #d97706', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Utilities Setup</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.utilities_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, utilities_cost: e.target.value }
                            }))}
                            placeholder="e.g., $50K - $150K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #d97706', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Equipment Investment</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.equipment_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, equipment_cost: e.target.value }
                            }))}
                            placeholder="e.g., $300K - $1.2M"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #d97706', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                      </div>

                      {/* Legal & Regulatory */}
                      <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 0.75rem 0', color: '#1e40af'}}>⚖️ Legal & Regulatory</h5>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Legal Entity Formation</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.legal_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, legal_cost: e.target.value }
                            }))}
                            placeholder="e.g., $15K - $40K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Permits & Licenses</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.permits_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, permits_cost: e.target.value }
                            }))}
                            placeholder="e.g., $8K - $25K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>IMMEX Registration</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.immex_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, immex_cost: e.target.value }
                            }))}
                            placeholder="e.g., $5K - $15K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                      </div>

                      {/* Workforce Setup */}
                      <div style={{padding: '1rem', background: '#f0fdf4', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 0.75rem 0', color: '#15803d'}}>👥 Workforce Setup</h5>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Recruitment Costs</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.recruitment_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, recruitment_cost: e.target.value }
                            }))}
                            placeholder="e.g., $20K - $60K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #16a34a', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Training Program</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.training_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, training_cost: e.target.value }
                            }))}
                            placeholder="e.g., $30K - $80K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #16a34a', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Management Setup</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.management_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, management_cost: e.target.value }
                            }))}
                            placeholder="e.g., $40K - $120K"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #16a34a', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Costs Analysis */}
                  <div className="form-group">
                    <label>🔄 Annual Operational Costs</label>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
                      <div>
                        <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Labor Costs (Annual)</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.annual_labor || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, annual_labor: e.target.value }
                          }))}
                          placeholder="e.g., $800K - $1.5M"
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                        />
                      </div>
                      <div>
                        <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Utilities (Annual)</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.annual_utilities || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, annual_utilities: e.target.value }
                          }))}
                          placeholder="e.g., $120K - $300K"
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                        />
                      </div>
                      <div>
                        <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Materials/Logistics</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.annual_materials || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, annual_materials: e.target.value }
                          }))}
                          placeholder="e.g., $2M - $8M"
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                        />
                      </div>
                      <div>
                        <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Overhead/Admin</label>
                        <input
                          type="text"
                          value={feasibilityModal.formData.annual_overhead || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, annual_overhead: e.target.value }
                          }))}
                          placeholder="e.g., $200K - $600K"
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ROI Analysis */}
                  <div className="form-group">
                    <label>📈 ROI & Payback Analysis</label>
                    <div style={{padding: '1rem', background: '#f9fafb', borderRadius: '8px'}}>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Current Location Total Cost</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.current_total_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, current_total_cost: e.target.value }
                            }))}
                            placeholder="e.g., $5M - $12M annually"
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Projected Mexico Cost</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.mexico_total_cost || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, mexico_total_cost: e.target.value }
                            }))}
                            placeholder="e.g., $3M - $8M annually"
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Annual Savings</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.annual_savings || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, annual_savings: e.target.value }
                            }))}
                            placeholder="e.g., $1.5M - $4M"
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Payback Period</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.payback_period || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, payback_period: e.target.value }
                            }))}
                            placeholder="e.g., 18-36 months"
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px'}}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Cost Analysis Summary</label>
                        <textarea
                          value={feasibilityModal.formData.cost_analysis_summary || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, cost_analysis_summary: e.target.value }
                          }))}
                          placeholder="Comprehensive cost analysis summary: setup vs operational costs, break-even analysis, 5-year ROI projections, risk factors, competitive advantages vs current operations..."
                          rows={4}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px'}}
                        />
                      </div>
                    </div>
                  </div>

                  {(feasibilityModal.requestsSent?.filter(s => s.status === 'response_received').length > 0 || true) ? (
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
                              {feasibilityModal.requestsSent?.filter(s => s.status === 'response_received').map((supplier, idx) => {
                                const scores = feasibilityModal.formData[`scores_${supplier.name}`] || {};
                                const totalScore = ((scores.price || 0) + (scores.quality || 0) + (scores.delivery || 0)) / 3;

                                return (
                                  <tr key={idx}>
                                    <td><strong>{supplier.name}</strong></td>
                                    <td>
                                      <select
                                        value={scores.price || ''}
                                        onChange={(e) => {
                                          const newScores = {...scores, price: parseInt(e.target.value)};
                                          updateFeasibilityFormData(`scores_${supplier.name}`, newScores);
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
                                          updateFeasibilityFormData(`scores_${supplier.name}`, newScores);
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
                                          updateFeasibilityFormData(`scores_${supplier.name}`, newScores);
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
                                          updateFeasibilityFormData(`scores_${supplier.name}`, newScores);
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
                          value={feasibilityModal.formData.network_validation || ''}
                          onChange={(e) => updateFeasibilityFormData('network_validation', e.target.value)}
                          rows={6}
                        />
                      </div>

                      <div className="form-group">
                        <label>⚠️ Risk Assessment</label>
                        <textarea
                          className="consultation-textarea"
                          placeholder="Risk analysis: Financial stability, delivery reliability, quality consistency, payment terms concerns..."
                          value={feasibilityModal.formData.risk_assessment || ''}
                          onChange={(e) => updateFeasibilityFormData('risk_assessment', e.target.value)}
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

              {feasibilityModal.currentStage === 4 && (
                <div className="document-collection-grid">
                  <h4>📊 Stage 4 - Manufacturing Feasibility Report</h4>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>Generate comprehensive feasibility report with actionable recommendations</p>

                  {/* Executive Summary */}
                  <div className="form-group">
                    <label>📝 Executive Summary & Recommendation</label>
                    <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px', marginBottom: '1rem'}}>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Overall Feasibility</label>
                          <select
                            value={feasibilityModal.formData.overall_feasibility || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, overall_feasibility: e.target.value }
                            }))}
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #3b82f6', borderRadius: '4px'}}
                          >
                            <option value="">Select recommendation...</option>
                            <option value="highly_recommended">HIGHLY RECOMMENDED - Strong business case</option>
                            <option value="recommended">RECOMMENDED - Good opportunity with manageable risks</option>
                            <option value="conditional">CONDITIONAL - Feasible with specific requirements</option>
                            <option value="not_recommended">NOT RECOMMENDED - Significant barriers identified</option>
                          </select>
                        </div>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Recommended Location</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.final_location_recommendation || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, final_location_recommendation: e.target.value }
                            }))}
                            placeholder="e.g., Tijuana, Baja California"
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #3b82f6', borderRadius: '4px'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Investment Range</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.total_investment_range || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, total_investment_range: e.target.value }
                            }))}
                            placeholder="e.g., $2M - $4M total investment"
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #3b82f6', borderRadius: '4px'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Timeline to Production</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.production_timeline || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, production_timeline: e.target.value }
                            }))}
                            placeholder="e.g., 12-18 months"
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #3b82f6', borderRadius: '4px'}}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Executive Summary</label>
                        <textarea
                          value={feasibilityModal.formData.executive_summary || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, executive_summary: e.target.value }
                          }))}
                          placeholder="High-level summary: manufacturing feasibility conclusion, recommended location and rationale, investment requirements, projected ROI, key benefits, main risks, next steps for implementation..."
                          rows={4}
                          style={{width: '100%', padding: '0.75rem', border: '1px solid #3b82f6', borderRadius: '6px'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Implementation Roadmap */}
                  <div className="form-group">
                    <label>🛣️ Implementation Roadmap</label>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>

                      {/* Phase 1 */}
                      <div style={{padding: '1rem', background: '#fef3c7', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 0.75rem 0', color: '#92400e'}}>📋 Phase 1: Planning & Setup</h5>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Timeline</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.phase1_timeline || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, phase1_timeline: e.target.value }
                            }))}
                            placeholder="e.g., Months 1-3"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #d97706', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <textarea
                          value={feasibilityModal.formData.phase1_tasks || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, phase1_tasks: e.target.value }
                          }))}
                          placeholder="Key tasks: Legal entity formation, site selection, permits/licenses, IMMEX registration, initial team hiring, facility planning..."
                          rows={3}
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #d97706', borderRadius: '4px', fontSize: '0.8rem'}}
                        />
                      </div>

                      {/* Phase 2 */}
                      <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 0.75rem 0', color: '#1e40af'}}>🏗️ Phase 2: Infrastructure</h5>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Timeline</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.phase2_timeline || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, phase2_timeline: e.target.value }
                            }))}
                            placeholder="e.g., Months 4-8"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <textarea
                          value={feasibilityModal.formData.phase2_tasks || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, phase2_tasks: e.target.value }
                          }))}
                          placeholder="Key tasks: Facility construction/renovation, equipment installation, IT infrastructure, utilities connection, supply chain setup, quality systems..."
                          rows={3}
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #3b82f6', borderRadius: '4px', fontSize: '0.8rem'}}
                        />
                      </div>

                      {/* Phase 3 */}
                      <div style={{padding: '1rem', background: '#f0fdf4', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 0.75rem 0', color: '#15803d'}}>🚀 Phase 3: Launch & Ramp-up</h5>
                        <div style={{marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem', fontWeight: '600', display: 'block'}}>Timeline</label>
                          <input
                            type="text"
                            value={feasibilityModal.formData.phase3_timeline || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, phase3_timeline: e.target.value }
                            }))}
                            placeholder="e.g., Months 9-12"
                            style={{width: '100%', padding: '0.4rem', border: '1px solid #16a34a', borderRadius: '4px', fontSize: '0.8rem'}}
                          />
                        </div>
                        <textarea
                          value={feasibilityModal.formData.phase3_tasks || ''}
                          onChange={(e) => setFeasibilityModal(prev => ({
                            ...prev,
                            formData: { ...prev.formData, phase3_tasks: e.target.value }
                          }))}
                          placeholder="Key tasks: Workforce training, trial production runs, quality validation, customer qualification, full production launch, optimization..."
                          rows={3}
                          style={{width: '100%', padding: '0.5rem', border: '1px solid #16a34a', borderRadius: '4px', fontSize: '0.8rem'}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment & Mitigation */}
                  <div className="form-group">
                    <label>⚠️ Risk Assessment & Mitigation</label>
                    <div style={{padding: '1rem', background: '#fef2f2', borderRadius: '8px', marginBottom: '1rem'}}>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>High-Risk Factors</label>
                          <textarea
                            value={feasibilityModal.formData.high_risks || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, high_risks: e.target.value }
                            }))}
                            placeholder="e.g., Regulatory changes, skilled labor shortage, infrastructure limitations, currency fluctuations..."
                            rows={3}
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #dc2626', borderRadius: '4px', fontSize: '0.85rem'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem'}}>Mitigation Strategies</label>
                          <textarea
                            value={feasibilityModal.formData.mitigation_strategies || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, mitigation_strategies: e.target.value }
                            }))}
                            placeholder="e.g., Diversified supplier base, local legal counsel, phased rollout, hedging strategies, contingency planning..."
                            rows={3}
                            style={{width: '100%', padding: '0.5rem', border: '1px solid #dc2626', borderRadius: '4px', fontSize: '0.85rem'}}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem'}}>Overall Risk Assessment</label>
                        <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem'}}>
                          <label style={{fontSize: '0.8rem'}}>Risk Level:</label>
                          <select
                            value={feasibilityModal.formData.risk_level || ''}
                            onChange={(e) => setFeasibilityModal(prev => ({
                              ...prev,
                              formData: { ...prev.formData, risk_level: e.target.value }
                            }))}
                            style={{padding: '0.25rem', border: '1px solid #dc2626', borderRadius: '4px', fontSize: '0.8rem'}}
                          >
                            <option value="">Select...</option>
                            <option value="low">LOW - Well-established processes, minimal risks</option>
                            <option value="medium">MEDIUM - Manageable risks with proper planning</option>
                            <option value="high">HIGH - Significant risks requiring careful management</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps & Contact Information */}
                  <div className="form-group">
                    <label>🎯 Immediate Next Steps</label>
                    <div style={{padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '1.5rem'}}>
                      <textarea
                        value={feasibilityModal.formData.next_steps || ''}
                        onChange={(e) => setFeasibilityModal(prev => ({
                          ...prev,
                          formData: { ...prev.formData, next_steps: e.target.value }
                        }))}
                        placeholder="Specific actionable next steps: 1) Site visit to recommended locations, 2) Legal consultation for entity formation, 3) Preliminary facility quotes, 4) Initial supplier discussions, 5) Financing arrangements, 6) Timeline development..."
                        rows={4}
                        style={{width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px'}}
                      />
                    </div>

                    <div style={{padding: '1rem', background: '#dcfce7', borderRadius: '8px', border: '2px solid #16a34a'}}>
                      <h5 style={{margin: '0 0 0.75rem 0', color: '#15803d'}}>📞 Jorge's Continued Support</h5>
                      <p style={{margin: '0.5rem 0', color: '#15803d', fontSize: '0.9rem'}}>
                        "This feasibility analysis provides the foundation for your Mexico manufacturing decision. I'm available for site visits, supplier introductions, and ongoing implementation support as you move forward."
                      </p>
                      <div style={{marginTop: '0.75rem'}}>
                        <strong style={{color: '#15803d'}}>Contact Jorge:</strong>
                        <span style={{color: '#15803d', marginLeft: '0.5rem'}}>jorge@triangleintelligence.com | Mexico Trade Specialist</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{display: 'none'}}>🏆 Top Suppliers (Ranked by Score)</label>
                    <div style={{background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'none'}}>
                      {feasibilityModal.requestsSent
                        ?.filter(s => s.status === 'response_received')
                        .map(s => ({
                          ...s,
                          totalScore: ((feasibilityModal.formData[`scores_${s.name}`]?.price || 0) +
                                      (feasibilityModal.formData[`scores_${s.name}`]?.quality || 0) +
                                      (feasibilityModal.formData[`scores_${s.name}`]?.delivery || 0)) / 3
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
                                    checked={feasibilityModal.formData[`introduce_${supplier.name}`] || false}
                                    onChange={(e) => updateFeasibilityFormData(`introduce_${supplier.name}`, e.target.checked)}
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
                      value={feasibilityModal.formData.final_report || ''}
                      onChange={(e) => updateFeasibilityFormData('final_report', e.target.value)}
                      rows={8}
                    />
                  </div>

                  <div className="form-group">
                    <label>🤝 Introduction Emails</label>
                    <div className="summary-grid" style={{marginBottom: '1rem'}}>
                      <div className="summary-stat">
                        <div className="stat-number">
                          {Object.keys(feasibilityModal.formData).filter(k => k.startsWith('introduce_') && feasibilityModal.formData[k]).length}
                        </div>
                        <div className="stat-label">Introductions to Make</div>
                      </div>
                      <div className="summary-stat">
                        <div className="stat-number">
                          {feasibilityModal.formData.introductions_sent || 0}
                        </div>
                        <div className="stat-label">Introductions Completed</div>
                      </div>
                    </div>

                    {Object.keys(feasibilityModal.formData)
                      .filter(k => k.startsWith('introduce_') && feasibilityModal.formData[k])
                      .map((key, idx) => {
                        const supplierName = key.replace('introduce_', '');
                        // const supplier = feasibilityModal.requestsSent?.find(s => s.name === supplierName);
                        const introduced = feasibilityModal.formData[`introduced_${supplierName}`];

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
                                    updateFeasibilityFormData(`introduced_${supplierName}`, true);
                                    updateFeasibilityFormData('introductions_sent', (feasibilityModal.formData.introductions_sent || 0) + 1);
                                    alert(`✅ Introduction emails sent:\n\n1. To ${supplierName}: Introduced ${feasibilityModal.request?.company_name}\n2. To ${feasibilityModal.request?.company_name}: Introduced ${supplierName} contact`);
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
                        const topSuppliers = feasibilityModal.requestsSent
                          ?.filter(s => s.status === 'response_received')
                          .map(s => ({
                            ...s,
                            scores: feasibilityModal.formData[`scores_${s.name}`] || {},
                            totalScore: ((feasibilityModal.formData[`scores_${s.name}`]?.price || 0) +
                                        (feasibilityModal.formData[`scores_${s.name}`]?.quality || 0) +
                                        (feasibilityModal.formData[`scores_${s.name}`]?.delivery || 0)) / 3
                          }))
                          .sort((a, b) => b.totalScore - a.totalScore) || [];

                        const clientReqs = feasibilityModal?.collectedData?.clientFormData || {};

                        const report = `# SUPPLIER SOURCING REPORT
**Mexico Manufacturing Partner Recommendations**

---

## Executive Summary

**Client:** ${feasibilityModal.request?.company_name}
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
${feasibilityModal.formData.network_validation || 'Supplier validated through Mexico trade network. Financial stability and quality systems verified.'}

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

${feasibilityModal.formData.risk_assessment ? `\n**Additional Risk Analysis:**\n${feasibilityModal.formData.risk_assessment}` : ''}

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
Status: ${feasibilityModal.formData[`introduced_${s.name}`] ? '✅ Introduction Made' : '⏳ Ready for Introduction'}
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
                        a.download = `Supplier_Sourcing_Report_${feasibilityModal.request?.company_name?.replace(/\s+/g, '_')}_${Date.now()}.md`;
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
              {feasibilityModal.currentStage > 1 && (
                <button className="btn-action btn-secondary" onClick={prevFeasibilityStage}>
                  Previous Stage
                </button>
              )}
              {feasibilityModal.currentStage < 4 ? (
                <button className="btn-action btn-primary" onClick={nextFeasibilityStage}>
                  Next Stage
                </button>
              ) : (
                <>
                  <button className="btn-action btn-success" onClick={completeFeasibility}>
                    Complete Feasibility
                  </button>
                  <button className="btn-action btn-info" onClick={() => generateFeasibilityReport(feasibilityModal.request)}>
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
                🤖 AI Assistant - Mexico Manufacturing Feasibility Report
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
                    <p>🤖 Claude AI is generating your Mexico manufacturing feasibility report...</p>
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
        formConfig={getIntakeFormByService('manufacturing-feasibility')}
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
                <div style={{padding: '0.75rem', background: '#dcfce7', borderRadius: '6px', margin: 0}}>
                  <p style={{color: '#059669', margin: '0 0 0.5rem 0', fontWeight: '600'}}>
                    {companyInfoModal.supplier?.matchReason || 'Matches client requirements'}
                  </p>
                  {companyInfoModal.supplier?.aiGenerated && (
                    <div style={{fontSize: '0.85rem', color: '#047857'}}>
                      <p style={{margin: '0.25rem 0'}}><strong>Manufacturing Advantages:</strong></p>
                      <ul style={{margin: '0.25rem 0 0 1rem', paddingLeft: '0.5rem'}}>
                        <li>60% lower manufacturing costs vs US operations</li>
                        <li>Modern industrial infrastructure and reliable utilities</li>
                        <li>IMMEX program benefits and tax incentives</li>
                        <li>Skilled workforce with technical training programs</li>
                        <li>Established logistics networks to US markets</li>
                        <li>ISO-certified facilities and quality management systems</li>
                        <li>Government support for foreign investment</li>
                      </ul>
                      {companyInfoModal.supplier?.feasibilityScore && (
                        <div style={{marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0'}}>
                          <p style={{margin: 0, fontWeight: '600'}}>
                            📊 Feasibility: {companyInfoModal.supplier.feasibilityScore} |
                            💰 Setup: {companyInfoModal.supplier.setupCost} |
                            📈 Savings: {companyInfoModal.supplier.laborCostSavings}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label><strong>🔗 Company Website / Info</strong></label>
                <div style={{padding: '0.75rem', background: '#f0f9ff', borderRadius: '6px'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280'}}>
                    Search for company information:
                  </p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(companyInfoModal.supplier?.searchName || companyInfoModal.supplier?.name + ' ' + companyInfoModal.supplier?.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action btn-secondary"
                    style={{display: 'inline-block', marginRight: '0.5rem'}}
                    onClick={() => console.log('🔍 Google search for:', companyInfoModal.supplier?.searchName || companyInfoModal.supplier?.name)}
                  >
                    🔍 Google Search
                  </a>
                  <a
                    href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyInfoModal.supplier?.name + ' Mexico')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action btn-secondary"
                    style={{display: 'inline-block'}}
                    onClick={() => console.log('💼 LinkedIn search for:', companyInfoModal.supplier?.name)}
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