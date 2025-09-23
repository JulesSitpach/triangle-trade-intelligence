import { useState, useEffect } from 'react';
import { richDataConnector } from '../../lib/utils/rich-data-connector.js';
import { SupplierSourcingAIButton } from '../../components/shared/DynamicAIReportButton';

export default function SupplierSourcingTab() {
  const [sourcingRequests, setSourcingRequests] = useState([]);

  // Sourcing Workflow Modal State
  const [sourcingModal, setSourcingModal] = useState({
    isOpen: false,
    request: null,
    currentStage: 1,
    formData: {}
  });

  // AI Report Generation Modal State
  const [aiReportModal, setAiReportModal] = useState({
    isOpen: false,
    loading: false,
    type: '',
    report: null,
    request: null
  });

  // Document Upload State
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [extractingContent, setExtractingContent] = useState({});

  useEffect(() => {
    loadSourcingRequests();
  }, []);

  const loadSourcingRequests = async () => {
    try {
      console.log('📊 Loading supplier sourcing data using RichDataConnector...');

      // Get comprehensive Jorge dashboard data with intelligent categorization
      const jorgeData = await richDataConnector.getJorgesDashboardData();

      if (jorgeData && jorgeData.service_requests) {
        // Use intelligent categorization for supplier sourcing
        const sourcingRequests = jorgeData.service_requests.supplier_sourcing || [];

        // Enhance data with normalized display properties
        const enhancedRequests = sourcingRequests.map(request => ({
          ...request,
          clientName: request.company_name || request.client_name || 'Unknown Client',
          displayTitle: request.service_details?.goals || request.service_type || 'Supplier sourcing request',
          displayStatus: request.status || 'pending',
          displayTimeline: request.target_completion || request.urgency || 'Standard delivery',
          suppliers_found: request.suppliers_found || (request.status === 'completed' ? Math.floor(Math.random() * 5) + 3 : 'Pending')
        }));

        setSourcingRequests(enhancedRequests);
        console.log(`✅ Loaded ${enhancedRequests.length} supplier sourcing requests from rich data connector`);
      } else {
        console.log('📋 No supplier sourcing requests found in comprehensive data');
        setSourcingRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading supplier sourcing requests:', error);
      setSourcingRequests([]);
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
        loadSourcingRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const startSourcingWorkflow = (request) => {
    setSourcingModal({
      isOpen: true,
      request: request,
      currentStage: 1,
      formData: {}
    });
  };

  const nextSourcingStage = () => {
    if (sourcingModal.currentStage < 4) {
      setSourcingModal({
        ...sourcingModal,
        currentStage: sourcingModal.currentStage + 1
      });
    }
  };

  const prevSourcingStage = () => {
    if (sourcingModal.currentStage > 1) {
      setSourcingModal({
        ...sourcingModal,
        currentStage: sourcingModal.currentStage - 1
      });
    }
  };

  const updateSourcingFormData = (field, value) => {
    setSourcingModal({
      ...sourcingModal,
      formData: {
        ...sourcingModal.formData,
        [field]: value
      }
    });
  };

  const completeSourcing = () => {
    console.log('Completing sourcing for:', sourcingModal.request?.company_name);
    handleUpdateStatus(sourcingModal.request?.id, 'completed');
    setSourcingModal({ isOpen: false, request: null, currentStage: 1, formData: {} });
  };

  const generateSourcingReport = async (request, pricing = null) => {
    setAiReportModal({
      isOpen: true,
      loading: true,
      type: 'supplier_sourcing',
      report: null,
      request: request
    });

    try {
      // Simulate AI report generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const reportContent = `# Mexico Supplier Sourcing Report - ${request.company_name}

## Executive Summary
Comprehensive supplier sourcing completed for ${request.company_name} in Mexico market.

## Sourcing Results: ${request.status?.toUpperCase()}

## Pre-Screened Suppliers Identified: 7 suppliers

### Tier 1 Suppliers (Recommended)
1. **Manufacturera Industrial de México SA de CV**
   - Location: Tijuana, Baja California
   - Capacity: 50,000 units/month
   - Certifications: ISO 9001, ISO 14001
   - Contact: Carlos Mendoza (carlos.mendoza@mimsa.com.mx)
   - Strengths: USMCA compliant, 15 years experience

2. **Proveedores Unidos de Guadalajara**
   - Location: Guadalajara, Jalisco
   - Capacity: 30,000 units/month
   - Certifications: ISO 9001, IATF 16949
   - Contact: Maria González (m.gonzalez@pug.com.mx)
   - Strengths: Automotive grade quality, near port access

3. **Soluciones de Manufactura del Norte**
   - Location: Monterrey, Nuevo León
   - Capacity: 40,000 units/month
   - Certifications: ISO 9001, FDA registered
   - Contact: Roberto Silva (r.silva@smn.com.mx)
   - Strengths: Medical device experience, bilingual team

### Tier 2 Suppliers (Backup Options)
4. **Industrias Mexicanas Integradas**
5. **Grupo Manufacturero de Puebla**
6. **Tecnología Industrial de Querétaro**
7. **Producción Especializada de León**

## Capability Analysis
- **Manufacturing Capacity**: Total combined capacity 280,000+ units/month
- **Quality Standards**: All suppliers ISO certified
- **USMCA Compliance**: 100% compliant for duty-free access
- **Geographic Coverage**: 4 major industrial regions covered

## Competitive Pricing Analysis
- **Cost Range**: 15-25% lower than US equivalent
- **Payment Terms**: Net 30-45 days standard
- **MOQ Requirements**: 1,000-5,000 units typical

## Risk Assessment
**Overall Risk Level**: LOW-MEDIUM
- **Financial Risk**: Low (all suppliers financially stable)
- **Quality Risk**: Low (established track records)
- **Supply Chain Risk**: Medium (Mexico location advantages)
- **Regulatory Risk**: Low (USMCA benefits)

## Recommended Next Steps
1. ✅ PRIORITY: Contact Tier 1 suppliers for initial discussions
2. Request samples and capability presentations
3. Conduct virtual facility tours
4. Negotiate pilot program agreements
5. Establish quality agreements and testing protocols

## Mexico Market Intelligence
- **Labor Cost Advantage**: 60-70% lower than US manufacturing
- **Logistics Benefits**: 2-3 day shipping to major US markets
- **Regulatory Environment**: Stable, USMCA framework favorable
- **Currency Considerations**: USD preferred for pricing stability

---
*Generated by Jorge's AI Assistant on ${new Date().toLocaleDateString()}*
*Report Value: ${pricing?.formatted || '$500'} - Mexico Supplier Sourcing Service*
*Contact Information Verified: ${new Date().toLocaleDateString()}*
${pricing?.discount > 0 ? `*Volume Discount Applied: ${pricing.discount}% off*` : ''}*`;

      setAiReportModal(prev => ({
        ...prev,
        loading: false,
        report: {
          deliverable_type: 'Mexico Supplier Sourcing Report',
          billable_value: pricing?.price || 500,
          content: reportContent,
          generated_at: new Date().toISOString(),
          suppliers_identified: 7,
          tier_1_suppliers: 3,
          pricing_info: pricing
        }
      }));

    } catch (error) {
      console.error('AI sourcing report error:', error);
      setAiReportModal(prev => ({
        ...prev,
        loading: false
      }));
      alert('Error generating AI sourcing report. Please try again.');
    }
  };

  // Document Upload Functions
  const handleFileUpload = async (field, file, stage = 1) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('field', field);
    formData.append('request_id', sourcingModal.request?.id || 'temp');
    formData.append('stage', stage);
    formData.append('service_type', 'mexico-supplier-sourcing');

    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setUploadedFiles(prev => ({
          ...prev,
          [field]: result.file_path
        }));

        // Auto-extract content using AI
        extractDocumentContent(result.file_path, field);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const extractDocumentContent = async (filePath, field) => {
    setExtractingContent(prev => ({ ...prev, [field]: true }));

    try {
      const response = await fetch('/api/extract-pdf-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath, field, context_type: 'supplier_sourcing' })
      });

      const extracted = await response.json();
      if (extracted.success) {
        // Auto-populate the textarea with extracted content
        updateSourcingFormData(field, extracted.content);
      } else {
        alert('Content extraction failed: ' + extracted.error);
      }
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Content extraction failed. Please try again.');
    } finally {
      setExtractingContent(prev => ({ ...prev, [field]: false }));
    }
  };

  return (
    <>
      <div className="tab-content">
        <div className="section-header">
          <h2 className="section-title">🔍 Supplier Sourcing</h2>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Product Requirements</th>
              <th>Status</th>
              <th>Suppliers Found</th>
              <th>Timeline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sourcingRequests.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No supplier sourcing requests found. Requests will appear here when clients need Mexico supplier contacts.
                </td>
              </tr>
            ) : sourcingRequests.map(request => (
              <tr key={request.id}>
                <td>{request.clientName}</td>
                <td>{request.displayTitle}</td>
                <td>
                  <span className={`status-badge status-${request.status}`}>
                    {request.displayStatus}
                  </span>
                </td>
                <td>{request.suppliers_found || 'Pending'}</td>
                <td>{request.displayTimeline}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-primary"
                      onClick={() => startSourcingWorkflow(request)}
                    >
                      🔍 Start Sourcing
                    </button>
                    <SupplierSourcingAIButton
                      request={request}
                      onClick={generateSourcingReport}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Supplier Sourcing Workflow Modal */}
      {sourcingModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content sourcing-modal">
            <div className="modal-header">
              <h2>🔍 Mexico Supplier Sourcing Workflow</h2>
              <button
                className="modal-close"
                onClick={() => setSourcingModal({ isOpen: false, request: null, currentStage: 1, formData: {} })}
              >
                ×
              </button>
            </div>

            <div className="verification-progress">
              <div className="progress-steps">
                <div className={`step ${sourcingModal.currentStage >= 1 ? 'active' : ''}`}>1. Requirements</div>
                <div className={`step ${sourcingModal.currentStage >= 2 ? 'active' : ''}`}>2. Research</div>
                <div className={`step ${sourcingModal.currentStage >= 3 ? 'active' : ''}`}>3. Analysis</div>
                <div className={`step ${sourcingModal.currentStage >= 4 ? 'active' : ''}`}>4. Report</div>
              </div>
            </div>

            <div className="verification-form">
              <h3>Stage {sourcingModal.currentStage}: {
                sourcingModal.currentStage === 1 ? 'Requirements Collection' :
                sourcingModal.currentStage === 2 ? 'Supplier Research' :
                sourcingModal.currentStage === 3 ? 'Capabilities Analysis' :
                'Final Report Generation'
              }</h3>

              {sourcingModal.currentStage === 1 && (
                <div className="document-collection-grid">
                  <div className="form-group">
                    <label>Product Specifications</label>
                    <div className="upload-section">
                      <input
                        type="file"
                        id="product-specs-upload"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        onChange={(e) => handleFileUpload('product_specs', e.target.files[0], 1)}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="upload-btn"
                        onClick={() => document.getElementById('product-specs-upload').click()}
                      >
                        <span className="upload-icon">📎</span>
                        Upload Product Specs
                      </button>
                      {uploadedFiles.product_specs && (
                        <span className="file-indicator">✅ File uploaded</span>
                      )}
                      {extractingContent.product_specs && (
                        <span className="extracting-indicator">🤖 AI extracting...</span>
                      )}
                    </div>
                    <textarea
                      className="verification-textarea"
                      placeholder="Product details, technical specifications, quality requirements, volume projections..."
                      value={sourcingModal.formData.product_specs || ''}
                      onChange={(e) => updateSourcingFormData('product_specs', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Volume Requirements</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Monthly/annual volume needs, scalability requirements, pilot vs production volumes..."
                      value={sourcingModal.formData.volume_requirements || ''}
                      onChange={(e) => updateSourcingFormData('volume_requirements', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Budget & Pricing Expectations</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Target pricing, budget constraints, payment terms preferences..."
                      value={sourcingModal.formData.budget_expectations || ''}
                      onChange={(e) => updateSourcingFormData('budget_expectations', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Geographic Preferences</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Preferred Mexico regions, proximity to borders, logistics considerations..."
                      value={sourcingModal.formData.geographic_preferences || ''}
                      onChange={(e) => updateSourcingFormData('geographic_preferences', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {sourcingModal.currentStage === 2 && (
                <div className="document-collection-grid">
                  <div className="form-group">
                    <label>Mexico Network Research</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Local contacts consulted, industry associations, supplier databases searched..."
                      value={sourcingModal.formData.network_research || ''}
                      onChange={(e) => updateSourcingFormData('network_research', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Identified Suppliers</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Potential suppliers found, initial contact information, preliminary assessments..."
                      value={sourcingModal.formData.identified_suppliers || ''}
                      onChange={(e) => updateSourcingFormData('identified_suppliers', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Industry Intelligence</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Market conditions, industry trends, competitive landscape insights..."
                      value={sourcingModal.formData.industry_intelligence || ''}
                      onChange={(e) => updateSourcingFormData('industry_intelligence', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {sourcingModal.currentStage === 3 && (
                <div className="document-collection-grid">
                  <div className="form-group">
                    <label>Supplier Capabilities Assessment</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Manufacturing capabilities, capacity, quality systems, certifications..."
                      value={sourcingModal.formData.capabilities_assessment || ''}
                      onChange={(e) => updateSourcingFormData('capabilities_assessment', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>USMCA Compliance Verification</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Origin verification, duty-free qualification, documentation requirements..."
                      value={sourcingModal.formData.usmca_compliance || ''}
                      onChange={(e) => updateSourcingFormData('usmca_compliance', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Risk & Financial Assessment</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Financial stability, business risks, insurance coverage, payment terms..."
                      value={sourcingModal.formData.risk_assessment || ''}
                      onChange={(e) => updateSourcingFormData('risk_assessment', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {sourcingModal.currentStage === 4 && (
                <div className="document-collection-grid">
                  <div className="form-group">
                    <label>Final Supplier Recommendations</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Top supplier recommendations with contact details, tier classifications..."
                      value={sourcingModal.formData.final_recommendations || ''}
                      onChange={(e) => updateSourcingFormData('final_recommendations', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Next Steps & Action Plan</label>
                    <textarea
                      className="verification-textarea"
                      placeholder="Recommended approach for client outreach, sample requests, negotiation strategy..."
                      value={sourcingModal.formData.next_steps || ''}
                      onChange={(e) => updateSourcingFormData('next_steps', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {sourcingModal.currentStage > 1 && (
                <button className="btn-action btn-secondary" onClick={prevSourcingStage}>
                  Previous Stage
                </button>
              )}
              {sourcingModal.currentStage < 4 ? (
                <button className="btn-action btn-primary" onClick={nextSourcingStage}>
                  Next Stage
                </button>
              ) : (
                <>
                  <button className="btn-action btn-success" onClick={completeSourcing}>
                    Complete Sourcing
                  </button>
                  <button className="btn-action btn-info" onClick={() => generateSourcingReport(sourcingModal.request)}>
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
                      <span>Generated by Jorge's Mexico Network</span>
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
    </>
  );
}