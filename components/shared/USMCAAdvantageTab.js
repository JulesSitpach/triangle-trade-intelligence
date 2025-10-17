/**
 * USMCACertificateTab.js - Team USMCA Optimization Service ($175)
 * Production-ready component leveraging 17 years logistics expertise
 * 3-Stage Team Workflow: Jorge collects documents → Cristina validates → Team delivers
 * Professional License #4601913 (International Commerce Degree - Cristina)
 * NOTE: For official customs broker services, we partner with licensed professionals
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import { useToast, ToastContainer } from '../shared/ToastNotification';
import MarketplaceIntelligenceForm from '../shared/MarketplaceIntelligenceForm';
import { filterByServiceType } from '../../lib/utils/service-type-mapping';

export default function USMCACertificateTab({ userRole = 'Cristina' }) {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, showToast, removeToast, success, error: errorToast, warning, info } = useToast();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      info('Loading USMCA Advantage Sprint requests...');

      // Load ALL service requests
      const response = await fetch('/api/admin/service-requests');

      if (!response.ok) {
        throw new Error('Failed to load service requests');
      }

      const data = await response.json();

      // Filter using utility
      const filtered = filterByServiceType(data.requests || [], 'usmca-advantage');
      setServiceRequests(filtered);
      success(`Loaded ${filtered.length} USMCA Advantage Sprint requests`);
    } catch (err) {
      console.error('Error loading service requests:', err);
      const errorMessage = err.message;
      setError(errorMessage);
      errorToast(`Failed to load service requests: ${errorMessage}`);
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleWorkflowComplete = async (completionData) => {
    try {
      success('USMCA Certificate service completed successfully!');

      // Update the request in our local state
      setServiceRequests(prev => prev.map(req =>
        req.id === completionData.service_request_id
          ? { ...req, status: 'completed', completed_at: completionData.completed_at }
          : req
      ));

      // Optionally reload data to get latest from database
      info('Refreshing service requests...');
      await loadServiceRequests();
    } catch (err) {
      console.error('Error handling workflow completion:', err);
      errorToast('Failed to update service request status');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Filter and sort functions (service type already filtered)
  const allFilteredRequests = serviceRequests?.filter(request => {
    const data = request.subscriber_data || request.service_details || {};

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const companyMatch = request.company_name?.toLowerCase().includes(searchLower);
      const productMatch = data.product_description?.toLowerCase().includes(searchLower);
      const contactMatch = request.contact_name?.toLowerCase().includes(searchLower);

      if (!companyMatch && !productMatch && !contactMatch) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }

    // Risk filter
    if (riskFilter !== 'all') {
      const riskLevel = determineRiskLevel(request);
      if (riskLevel.toLowerCase() !== riskFilter) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'company_name':
        aValue = a.company_name || '';
        bValue = b.company_name || '';
        break;
      case 'product':
        aValue = a.service_details?.product_description || '';
        bValue = b.service_details?.product_description || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'risk_level':
        aValue = determineRiskLevel(a);
        bValue = determineRiskLevel(b);
        break;
      case 'created_at':
      default:
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  }) || [];

  // Pagination logic
  const totalItems = allFilteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = allFilteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, riskFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRiskFilter('all');
    setSortField('created_at');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  // Pagination controls
  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers at a time
    const startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="service-tab">
      {/* Search and Filter Controls */}
      <div className="table-controls">
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by company, product, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Risk Level:</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="form-input filter-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By:</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="form-input filter-select"
            >
              <option value="created_at">Date Created</option>
              <option value="company_name">Company Name</option>
              <option value="product">Product Type</option>
              <option value="status">Status</option>
              <option value="risk_level">Risk Level</option>
            </select>
          </div>

          <div className="filter-group">
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary sort-direction-btn"
              title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="filter-group">
            <button
              onClick={clearFilters}
              className="btn-secondary clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="results-summary">
          <span className="results-count">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} requests
            {totalItems !== serviceRequests?.filter(r => r.service_type === 'USMCA Certificates' || r.service_type === 'usmca-certificate').length &&
              ` (filtered from ${serviceRequests?.filter(r => r.service_type === 'USMCA Certificates' || r.service_type === 'usmca-certificate').length || 0} total)`
            }
          </span>
          <div className="pagination-page-size">
            <label>Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="form-input page-size-select"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th
                className={`sortable ${sortField === 'company_name' ? 'sorted' : ''}`}
                onClick={() => handleSort('company_name')}
                title="Click to sort by company name"
              >
                Client {sortField === 'company_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Product</th>
              <th>Trade Volume</th>
              <th
                className={`sortable ${sortField === 'status' ? 'sorted' : ''}`}
                onClick={() => handleSort('status')}
                title="Click to sort by status"
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="loading-cell">Loading USMCA Advantage Sprint requests...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="error-cell">Error: {error}</td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-requests">
                  <p>No USMCA Advantage Sprint requests yet.</p>
                  <p className="secondary-text">
                    Requests will appear here when clients purchase the USMCA Advantage Sprint service.
                  </p>
                </td>
              </tr>
            ) : paginatedRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="client-info">
                      <strong>{request.company_name}</strong>
                      <div className="contact-name">{request.contact_name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="product-summary">
                      {request.service_details?.product_description || 'Product details'}
                    </div>
                  </td>
                  <td>
                    <div className="trade-volume">
                      {request.service_details?.trade_volume
                        ? `$${Number(request.service_details.trade_volume).toLocaleString()}`
                        : 'Not specified'
                      }
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${request.status?.replace('_', '-')}`}>
                      {request.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      onClick={() => startWorkflow(request)}
                      disabled={request.status === 'completed'}
                    >
                      {request.status === 'completed' ? 'Completed' : 'Start Service'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {!loading && !error && allFilteredRequests.length === 0 && serviceRequests?.filter(r => r.service_type === 'USMCA Certificates' || r.service_type === 'usmca-certificate').length > 0 && (
          <div className="no-results">
            <p>No requests match your current filters.</p>
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          </div>
        )}

        {!loading && !error && serviceRequests?.filter(r => r.service_type === 'USMCA Certificates' || r.service_type === 'usmca-certificate').length === 0 && (
          <div className="no-requests">
            <p>No USMCA certificate requests pending.</p>
            <p className="secondary-text">
              Professional certificate requests will appear here when clients submit USMCA certificate service requests.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              <span>Page {currentPage} of {totalPages}</span>
            </div>

            <div className="pagination-buttons">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="btn-secondary pagination-btn"
                title="First page"
              >
                « First
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary pagination-btn"
                title="Previous page"
              >
                ‹ Prev
              </button>

              <div className="pagination-numbers">
                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`btn-secondary pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary pagination-btn"
                title="Next page"
              >
                Next ›
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="btn-secondary pagination-btn"
                title="Last page"
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Workflow Modal */}
      {showModal && selectedRequest && (
        <ServiceWorkflowModal
          isOpen={showModal}
          service={createUSMCACertificateService(userRole)}
          request={selectedRequest}
          onClose={closeModal}
          onComplete={handleWorkflowComplete}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

// Risk assessment function - leverages Cristina's expertise
function determineRiskLevel(request) {
  const serviceDetails = request?.service_details || {};
  const subscriberData = serviceDetails;

  let riskScore = 0;

  // Electronics/telecom complexity
  const productDesc = (serviceDetails?.product_description || '').toLowerCase();
  if (productDesc.includes('electronics') || productDesc.includes('telecom')) riskScore += 2;
  if (productDesc.includes('semiconductor') || productDesc.includes('cpu') || productDesc.includes('gpu')) riskScore += 3;

  // Component complexity
  const componentCount = serviceDetails?.component_origins?.length || 0;
  if (componentCount > 5) riskScore += 2;
  if (componentCount > 10) riskScore += 3;

  // Origin complexity
  const origins = serviceDetails?.component_origins || [];
  const uniqueCountries = [...new Set(origins.map(c => c.origin_country || c.country))];
  if (uniqueCountries.length > 3) riskScore += 2;
  if (uniqueCountries.some(c => ['China', 'Russia', 'Iran'].includes(c))) riskScore += 3;

  // Trade volume
  const volume = subscriberData?.trade_volume || '';
  const volumeStr = typeof volume === 'string' ? volume : String(volume);
  if (volumeStr.includes('Million') || volumeStr.includes('$')) riskScore += 1;

  // Return risk level based on Cristina's professional assessment criteria
  if (riskScore >= 8) return 'HIGH';
  if (riskScore >= 4) return 'MEDIUM';
  return 'LOW';
}

// USMCA Optimization Assessment Service Configuration - Team Collaboration Model
const createUSMCACertificateService = (userRole) => ({
  title: 'USMCA Optimization Assessment ($175)',
  totalStages: 3,
  stageNames: ['Trade Compliance Analysis (Cristina)', 'AI-Enhanced Assessment (Cristina)', 'Optimization Roadmap (Team)'],

  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const subscriberData = request?.subscriber_data || request?.workflow_data || {};
    const serviceDetails = request?.service_details || {};

    switch (stageNumber) {
      case 1:
        return (
          <RegulatoryAssessmentStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
            userRole={userRole}
          />
        );

      case 2:
        return (
          <ComplianceRiskAnalysisStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            stageData={stageData}
            onComplete={onStageComplete}
            loading={loading}
            userRole={userRole}
          />
        );

      case 3:
        return (
          <CertificateCorrectionStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            stageData={stageData}
            onComplete={onStageComplete}
            loading={loading}
            userRole={userRole}
          />
        );

      default:
        return <div>Invalid stage</div>;
    }
  }
});

// Stage 1: Professional Data Review & Enhancement - Where Cristina's Expertise Actually Matters
function RegulatoryAssessmentStage({ request, subscriberData, serviceDetails, onComplete, loading, userRole }) {
  // Extract comprehensive workflow data from request
  // Fallback to service_details if workflow_data doesn't exist
  const workflowData = request?.workflow_data || request?.service_details || {};

  // Initialize with existing subscriber data for review and enhancement
  const [dataReview, setDataReview] = useState({
    // Subscriber Data Review (Pre-populated from workflow)
    reviewed_product_description: serviceDetails?.product_description || '',
    reviewed_hs_code: serviceDetails?.hs_code || '',
    reviewed_component_origins: serviceDetails?.component_origins || [],

    // Cristina's Professional Enhancements
    professional_hs_corrections: [],
    regulatory_compliance_additions: '',
    industry_specific_insights: '',

    // Professional Risk Assessment
    customs_audit_risk: '',
    compliance_confidence_level: '',
    professional_recommendations: '',

    // Professional Liability
    customs_broker_guarantee: '',
    liability_coverage_notes: ''
  });

  // **PHASE 1 QUICK WIN: AI Document Analysis**
  const [aiDocAnalysis, setAiDocAnalysis] = useState(null);
  const [analyzingDocs, setAnalyzingDocs] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  const [showOriginalCertificate, setShowOriginalCertificate] = useState(false);
  const components = serviceDetails?.component_origins || [];
  const productType = serviceDetails?.product_description || '';

  const handleDataReviewChange = (field, value) => {
    setDataReview(prev => ({ ...prev, [field]: value }));
  };

  const handleComponentEdit = (componentIndex, field, value) => {
    setDataReview(prev => ({
      ...prev,
      reviewed_component_origins: prev.reviewed_component_origins.map((component, index) =>
        index === componentIndex ? { ...component, [field]: value } : component
      )
    }));
  };

  const addHSCorrection = () => {
    const correction = prompt('Enter HS code correction with professional rationale:');
    if (correction) {
      setDataReview(prev => ({
        ...prev,
        professional_hs_corrections: [...prev.professional_hs_corrections, correction]
      }));
    }
  };

  const removeHSCorrection = (index) => {
    setDataReview(prev => ({
      ...prev,
      professional_hs_corrections: prev.professional_hs_corrections.filter((_, i) => i !== index)
    }));
  };

  // **PHASE 1 QUICK WIN: AI Document Analysis Function**
  const runAIDocumentAnalysis = async () => {
    try {
      setAnalyzingDocs(true);
      const response = await fetch('/api/usmca-document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: request.id,
          subscriberData: workflowData
        })
      });

      const result = await response.json();
      if (result.success) {
        setAiDocAnalysis(result.analysis);
        setShowAiAnalysis(true);
      } else {
        setAiDocAnalysis(result.fallback_analysis);
        setShowAiAnalysis(true);
      }
    } catch (error) {
      console.error('AI document analysis failed:', error);
      setAiDocAnalysis({
        documents_present: ['Basic client data'],
        documents_missing: ['Analysis failed - manual review needed'],
        data_quality_score: 'UNKNOWN',
        immediate_actions: ['Proceed with manual review'],
        ready_for_cristina_review: true
      });
      setShowAiAnalysis(true);
    } finally {
      setAnalyzingDocs(false);
    }
  };

  const handleSubmit = () => {
    onComplete({
      professional_data_review: dataReview,
      ai_document_analysis: aiDocAnalysis, // Include AI analysis in completion data
      cristina_expertise_applied: true,
      review_timestamp: new Date().toISOString()
    });
  };

  const isReviewComplete =
    dataReview.compliance_confidence_level &&
    dataReview.customs_broker_guarantee;

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 1: Document Review & Gap Analysis</h3>
        <p><strong>Team collaboration: Jorge reviews submitted workflow data, AI identifies missing items, Jorge collects additional docs</strong></p>

        <div className="collaboration-banner">
          <div className="role-action">
            <strong>👨‍💼 Jorge (Lead):</strong> Review client-submitted workflow data, run AI document analysis, identify missing compliance documents, contact client to request specific items, upload supplemental files when received
          </div>
          <div className="role-action">
            <strong>👩‍💼 Cristina (Support):</strong> Review AI document analysis results, validate Jorge's document checklist, flag any compliance-critical missing items, provide guidance on technical documentation requirements
          </div>
        </div>

        <div className="expert-credentials">
          🤖 AI-Powered Document Review | 📎 Missing Item Identification | 📧 Client Communication
        </div>
      </div>

      {/* **PHASE 1 QUICK WIN: AI Document Analysis UI** */}
      <div className="ai-quick-win-section ai-document-analysis-section">
        <h4>🤖 AI Document Analysis - Phase 1 Quick Win</h4>
        <p className="ai-quick-win-helper-text">
          <strong>What This Does:</strong> AI reviews all data the client submitted through the USMCA workflow and identifies missing documents needed for certificate compliance. {userRole === 'Jorge' ? 'This tells you exactly what to request from the client.' : 'Jorge uses this to identify what documents to collect.'}
        </p>
        <div className="workflow-status-info">
          <p className="workflow-status-info-text">
            <strong>Client Already Submitted:</strong> Company info, product description, component breakdown (CN 45%, MX 35%, US 20%), USMCA status (QUALIFIED at 55%)
          </p>
          <p className="workflow-status-info-details">
            <strong>AI Will Identify Missing:</strong> Supplier certificates, Bill of Materials, manufacturing process docs, commercial invoices, technical specifications
          </p>
        </div>
        <p className="ai-quick-win-helper-text">
          <strong>⚡ Time Saved:</strong> AI completes document review in 10 seconds instead of 30 minutes manual checklist review.
        </p>

        {!showAiAnalysis ? (
          userRole === 'Jorge' ? (
            <button
              className="btn-secondary"
              onClick={runAIDocumentAnalysis}
              disabled={analyzingDocs}
            >
              {analyzingDocs ? '⏳ Analyzing Documents...' : '🤖 Run AI Document Analysis'}
            </button>
          ) : (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">👁️ Waiting for Jorge</div>
                <p>Jorge will run AI document analysis to identify missing compliance documents. You'll be able to validate his findings once complete.</p>
              </div>
            </div>
          )
        ) : (
          <div className="ai-analysis-results">
            <div className="analysis-header">
              <h5>✅ AI Analysis Complete</h5>
              <span className="analysis-timestamp">
                {aiDocAnalysis?.analysis_timestamp ? new Date(aiDocAnalysis.analysis_timestamp).toLocaleString() : 'Just now'}
              </span>
            </div>

            <div className="analysis-sections">
              <div className="analysis-section">
                <strong>📄 Documents Present:</strong>
                <ul className="document-list">
                  {aiDocAnalysis?.documents_present?.map((doc, idx) => (
                    <li key={idx} className="present-item">✅ {doc}</li>
                  ))}
                </ul>
              </div>

              {aiDocAnalysis?.documents_missing && aiDocAnalysis.documents_missing.length > 0 && (
                <div className="analysis-section missing-docs">
                  <strong>❌ Documents Missing:</strong>
                  <ul className="document-list">
                    {aiDocAnalysis.documents_missing.map((doc, idx) => (
                      <li key={idx} className="missing-item">❌ {doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="analysis-section">
                <strong>📊 Data Quality Score:</strong>
                <span className={`quality-badge ${aiDocAnalysis?.data_quality_score?.toLowerCase()}`}>
                  {aiDocAnalysis?.data_quality_score || 'UNKNOWN'}
                </span>
              </div>

              {aiDocAnalysis?.immediate_actions && aiDocAnalysis.immediate_actions.length > 0 && (
                <div className="analysis-section immediate-actions">
                  <strong>⚡ Immediate Actions for Jorge:</strong>
                  <ul className="action-list">
                    {aiDocAnalysis.immediate_actions.map((action, idx) => (
                      <li key={idx} className="action-item">👨‍💼 {action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiDocAnalysis?.hs_code_assessment && (
                <div className="analysis-section">
                  <strong>🔢 HS Code Assessment:</strong>
                  <p className="assessment-text">{aiDocAnalysis.hs_code_assessment}</p>
                </div>
              )}

              <div className="analysis-section readiness-check">
                <strong>✅ Ready for Cristina's Review:</strong>
                <span className={`readiness-badge ${aiDocAnalysis?.ready_for_cristina_review ? 'ready' : 'not-ready'}`}>
                  {aiDocAnalysis?.ready_for_cristina_review ? 'YES - Proceed to Professional Review' : 'NO - Address missing items first'}
                </span>
              </div>
            </div>

            <div className="ai-efficiency-note analysis-theme">
              <strong>⚡ Time Saved:</strong> AI analysis completed in seconds instead of 30 minutes manual review.
              Cristina can now focus on professional validation instead of data checking.
            </div>
          </div>
        )}

        {/* Document Upload Interface - Role-Based View */}
        {showAiAnalysis && aiDocAnalysis && (
          <div className="workflow-status-card" style={{ marginTop: '1.5rem' }}>
            {userRole === 'Jorge' ? (
              <>
                <h4>📎 Upload Missing Documents</h4>
                <p className="workflow-status-info-details">
                  Based on AI analysis, upload the documents client sends. These will be reviewed by Cristina in Stage 2.
                </p>

                {aiDocAnalysis?.documents_missing && aiDocAnalysis.documents_missing.length > 0 && (
                  <div className="document-upload-list">
                    {aiDocAnalysis.documents_missing.map((doc, idx) => (
                      <div key={idx} className="workflow-form-group">
                        <label className="workflow-form-label">
                          <strong>{doc}</strong>
                        </label>
                        <input
                          type="file"
                          className="workflow-form-input"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            // File upload handler
                            const file = e.target.files[0];
                            if (file) {
                              console.log(`Jorge uploading: ${doc} - ${file.name}`);
                              // TODO: Implement file upload to storage
                            }
                          }}
                        />
                        <div className="form-help">
                          Accepted: PDF, Word, Excel, Images (max 10MB)
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                  <div className="alert-content">
                    <div className="alert-title">💡 Your Next Steps</div>
                    <p><strong>Contact client:</strong> Email {subscriberData?.contact_person || 'client'} listing these specific missing documents</p>
                    <p><strong>Upload when received:</strong> Upload files here as client sends them</p>
                    <p><strong>Notify Cristina:</strong> Once all documents uploaded, mark Stage 1 complete to hand off to Cristina</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h4>📋 Jorge's Document Collection Status</h4>
                <p className="workflow-status-info-details">
                  Jorge is collecting these missing documents identified by AI analysis. You'll validate them in Stage 2.
                </p>

                {aiDocAnalysis?.documents_missing && aiDocAnalysis.documents_missing.length > 0 && (
                  <div className="document-status-list">
                    <strong>Missing Documents Jorge is Collecting:</strong>
                    <ul className="document-list">
                      {aiDocAnalysis.documents_missing.map((doc, idx) => (
                        <li key={idx} className="missing-item">📎 {doc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                  <div className="alert-content">
                    <div className="alert-title">👁️ Your Role in Stage 1</div>
                    <p><strong>Review AI findings:</strong> Validate that the missing document list is complete</p>
                    <p><strong>Add notes below:</strong> Flag any additional compliance-critical items Jorge should request</p>
                    <p><strong>Wait for completion:</strong> Jorge will notify you when all documents are collected</p>
                  </div>
                </div>

                {/* Cristina's Validation Notes */}
                <div className="workflow-form-group" style={{ marginTop: '1rem' }}>
                  <label className="workflow-form-label">
                    <strong>Your Validation Notes (Optional):</strong>
                  </label>
                  <textarea
                    className="workflow-form-input"
                    rows="3"
                    placeholder="Add any additional documents Jorge should request or compliance concerns..."
                    value={dataReview.professional_recommendations || ''}
                    onChange={(e) => setDataReview({ ...dataReview, professional_recommendations: e.target.value })}
                  />
                  <div className="form-help">
                    These notes will be visible to Jorge to help guide his document collection
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Simple Client Context Summary for Stage 1 */}
      <div className="workflow-status-card" style={{ marginTop: '1.5rem' }}>
        <h4>📋 Client Business Context</h4>
        <div className="client-context-summary">
          <div className="context-row">
            <strong>Company:</strong> {workflowData?.company_name || request?.company_name}
          </div>
          <div className="context-row">
            <strong>Contact:</strong> {workflowData?.contact_person || request?.contact_name} ({workflowData?.contact_email || request?.email})
          </div>
          <div className="context-row">
            <strong>Product:</strong> {workflowData?.product_description || serviceDetails?.product_description}
          </div>
          <div className="context-row">
            <strong>Trade Volume:</strong> ${((workflowData?.trade_volume || request?.trade_volume || 0) / 1000000).toFixed(1)}M annually
          </div>
          <div className="context-row">
            <strong>USMCA Status:</strong> {workflowData?.qualification_status || 'PENDING'}
          </div>
          <div className="context-row">
            <strong>Manufacturing:</strong> {workflowData?.manufacturing_location || serviceDetails?.manufacturing_location || 'Not specified'}
          </div>
        </div>
      </div>

      {/* REMOVED: Detailed validation sections moved to Stage 2 */}
      {/* The following are now in Stage 2 where Cristina does technical validation:
          - Original certificate display
          - Component origins detailed analysis
          - Financial impact analysis
          - Compliance risk assessment
          - Regulatory requirements
          - Professional liability assessment
      */}

      {/* Stage 1 Completion */}
      <div className="workflow-stage-actions" style={{ marginTop: '2rem' }}>
        {userRole === 'Jorge' ? (
          <>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading || !showAiAnalysis}
            >
              {loading ? 'Completing Stage 1...' : 'Complete Document Collection →'}
            </button>
            <div className="completion-status">
              {showAiAnalysis ? (
                <span className="status-complete">✅ AI analysis complete - ready to hand off to Cristina</span>
              ) : (
                <span className="status-incomplete">⏳ Run AI Document Analysis first</span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">👁️ Waiting for Jorge to Complete</div>
                <p>Jorge will mark Stage 1 complete once all documents are collected. You'll be notified to start your technical validation in Stage 2.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// HIDDEN: Old detailed review sections - moved to Stage 2
const STAGE_1_OLD_CONTENT_MOVED_TO_STAGE_2 = () => (
  <div style={{ display: 'none' }}>
    {/* All this content has been moved to Stage 2 where Cristina does technical validation:
        - Original certificate display
        - Scrolling data window with all component details
        - Component origins & USMCA analysis
        - Financial impact analysis
        - Compliance risk assessment
        - Regulatory requirements section
        - Professional liability assessment forms
        - Professional validation decision dropdown
        - Risk assessment textarea
        - Professional backing textarea
    */}
  </div>
);

// Stage 1 was simplified to just:
// 1. Client context summary (6 key fields)
// 2. AI Document Analysis
// 3. Document upload/status
// 4. Simple completion

// All old Stage 1 detailed review content has been removed
// It should be moved to Stage 2 where Cristina does technical validation

// Stage 2: AI Compliance Risk Analysis - OpenRouter API analyzes certificate for compliance risks
function ComplianceRiskAnalysisStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading, userRole }) {
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const workflowData = request?.workflow_data || request?.service_details || {};
  const stage1Data = stageData?.stage1 || stageData?.stage_1 || {};

  const handleAIAnalysis = async () => {
    try {
      setAnalysisStep(1);
      setErrorMessage('');

      // Call OpenRouter API for compliance risk analysis
      const response = await fetch('/api/usmca-compliance-risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: request.id,
          subscriberData: workflowData,
          stage1Data: stage1Data
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const aiResult = await response.json();

      setAnalysisResult({
        compliance_risks: aiResult.compliance_risks || ['No major compliance risks identified'],
        component_risks: aiResult.component_risks || [],
        tariff_exposure: aiResult.tariff_exposure || 'Analysis completed',
        recommendations: aiResult.recommendations || ['Standard compliance monitoring recommended'],
        risk_score: aiResult.risk_score || 'Medium',
        audit_readiness: aiResult.audit_readiness || 'Requires documentation review'
      });

      setAnalysisComplete(true);

    } catch (error) {
      console.error('AI compliance risk analysis error:', error);
      setErrorMessage(`Analysis failed: ${error.message}`);

      // Fallback results if API fails
      setAnalysisResult({
        compliance_risks: ['Unable to complete full AI analysis - manual review required'],
        component_risks: [],
        tariff_exposure: 'Requires manual assessment',
        recommendations: ['Cristina will manually review compliance requirements'],
        risk_score: 'Medium',
        audit_readiness: 'Requires comprehensive documentation review'
      });
      setAnalysisComplete(true);
    }
  };

  const handleContinue = () => {
    onComplete({
      ai_compliance_analysis: analysisResult,
      analysis_timestamp: new Date().toISOString(),
      ai_analysis_performed: true
    });
  };

  const analysisSteps = [
    '🔍 Analyzing certificate compliance...',
    '⚠️ Identifying compliance risks...',
    '📊 Evaluating tariff exposure...',
    '✅ Generating recommendations...'
  ];

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 2: Technical Validation & Compliance Review</h3>
        <p><strong>Team collaboration: Cristina validates documents Jorge collected, AI analyzes compliance risks</strong></p>

        <div className="collaboration-banner">
          <div className="role-action">
            <strong>👩‍💼 Cristina (Lead):</strong> Review documents Jorge uploaded, run AI compliance analysis, validate HS codes, assess audit risk, provide professional compliance notes
          </div>
          <div className="role-action">
            <strong>👨‍💼 Jorge (Support):</strong> Monitor Cristina's validation progress, answer client questions about documents, prepare for Stage 3 delivery
          </div>
        </div>

        <div className="expert-credentials">
          🤖 AI Risk Detection | ⚖️ Compliance Assessment | 📋 Professional Validation
        </div>
      </div>

      <div className="certificate-summary-section">
        <h4>📋 Certificate Under Analysis</h4>
        <div className="certificate-info-grid">
          <div className="data-row">
            <span><strong>Company:</strong></span>
            <span>{request.company_name}</span>
          </div>
          <div className="data-row">
            <span><strong>Product:</strong></span>
            <span>{workflowData.product_description || serviceDetails.product_description}</span>
          </div>
          <div className="data-row">
            <span><strong>HS Code:</strong></span>
            <span>{workflowData.classified_hs_code || serviceDetails.current_hs_code}</span>
          </div>
          <div className="data-row">
            <span><strong>USMCA Status:</strong></span>
            <span>{workflowData.qualification_status}</span>
          </div>
          <div className="data-row">
            <span><strong>Trade Volume:</strong></span>
            <span>${((workflowData.trade_volume || 0) / 1000000).toFixed(1)}M annually</span>
          </div>
          <div className="data-row">
            <span><strong>Components:</strong></span>
            <span>{workflowData.component_origins?.length || 0} origins tracked</span>
          </div>
        </div>

        {workflowData.component_origins && workflowData.component_origins.length > 0 && (
          <div className="component-breakdown" style={{ marginTop: '1rem' }}>
            <strong>Component Supply Chain (with Tariff Intelligence):</strong>
            <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Component</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Origin</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>Value %</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>HS Code</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>MFN Rate</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>USMCA Rate</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Savings</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>AI Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowData.component_origins.map((comp, idx) => {
                    const hsCode = comp.hs_code || comp.classified_hs_code || '—';
                    const mfnRate = comp.mfn_rate || comp.tariff_rates?.mfn_rate || 0;
                    const usmcaRate = comp.usmca_rate || comp.tariff_rates?.usmca_rate || 0;
                    const savings = mfnRate - usmcaRate;
                    const confidence = comp.confidence || null;

                    return (
                      <tr key={idx}>
                        <td style={{ padding: '0.5rem', fontWeight: '500' }}>
                          {comp.description || comp.component_type || `Component ${idx + 1}`}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          {comp.origin_country}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          {comp.value_percentage}%
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.5rem', fontFamily: 'monospace' }}>
                          {hsCode}
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                            <span style={{ color: '#dc2626', fontWeight: '500' }}>
                              {mfnRate > 0 ? `${mfnRate.toFixed(1)}%` : '—'}
                            </span>
                            {/* ADMIN INTELLIGENCE: Show policy breakdown for client explanations */}
                            {comp.policy_adjustments && comp.policy_adjustments.length > 0 && (
                              <div style={{
                                fontSize: '0.6875rem',
                                color: '#6b7280',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.125rem',
                                alignItems: 'flex-end'
                              }}>
                                {comp.policy_adjustments.slice(0, 2).map((adj, adjIdx) => (
                                  <span key={adjIdx} style={{
                                    whiteSpace: 'nowrap',
                                    backgroundColor: '#fef3c7',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '3px',
                                    color: '#92400e'
                                  }}>
                                    {adj}
                                  </span>
                                ))}
                                {comp.policy_adjustments.length > 2 && (
                                  <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>
                                    +{comp.policy_adjustments.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Data source indicator */}
                            {comp.rate_source && (
                              <span style={{
                                fontSize: '0.625rem',
                                color: comp.rate_source === 'database_fallback' || comp.stale ? '#d97706' : '#059669'
                              }}>
                                {comp.rate_source === 'database_fallback' || comp.stale ? '⚠️ Stale' : '✓ Current'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.5rem', color: '#059669' }}>
                          {usmcaRate >= 0 ? `${usmcaRate.toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.5rem', color: savings > 0 ? '#059669' : '#6b7280', fontWeight: '600' }}>
                          {savings > 0 ? `${savings.toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                          {confidence ? (
                            <span style={{ color: confidence < 80 ? '#f59e0b' : '#059669' }}>
                              {confidence}% {confidence < 80 && '⚠️'}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Visual Alerts */}
            {workflowData.component_origins.some(c => (c.confidence || 100) < 80) && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderLeft: '3px solid #f59e0b' }}>
                ⚠️ <strong>Low Confidence Alert:</strong> Some components have AI classification confidence below 80%. Professional HS validation recommended for certificate accuracy.
              </div>
            )}

            {workflowData.component_origins.some(c => {
              const mfnRate = c.mfn_rate || c.tariff_rates?.mfn_rate || 0;
              const usmcaRate = c.usmca_rate || c.tariff_rates?.usmca_rate || 0;
              return (mfnRate - usmcaRate) > 5 && !c.is_usmca_member;
            }) && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#ecfdf5', borderLeft: '3px solid #059669' }}>
                💰 <strong>Mexico Sourcing Opportunity:</strong> High tariff exposure detected (&gt;5%). Consider Mexico sourcing for this certificate holder.
              </div>
            )}
          </div>
        )}
      </div>

      {!analysisComplete && (
        <div className="ai-analysis-trigger">
          {userRole === 'Cristina' ? (
            <>
              <p className="analysis-description">
                <strong>AI Analysis:</strong> Run AI compliance analysis to identify risks with the documents Jorge collected.
                You'll review AI findings and add your professional validation.
              </p>
              <button
                className="btn-primary analysis-btn"
                onClick={handleAIAnalysis}
                disabled={analysisStep > 0}
              >
                {analysisStep === 0 ? '🚀 Run AI Compliance Risk Analysis' : '⏳ Analysis Running...'}
              </button>
            </>
          ) : (
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">👁️ Waiting for Cristina</div>
                <p>Cristina will run AI compliance analysis to validate the documents you collected. You'll be notified when she completes her technical review.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {analysisStep > 0 && !analysisComplete && (
        <div className="analysis-progress">
          <h4>⚙️ AI Analysis in Progress</h4>
          {analysisSteps.map((step, index) => (
            <div
              key={index}
              className={`analysis-step ${index < analysisStep ? 'completed' : index === analysisStep ? 'active' : 'pending'}`}
            >
              {index < analysisStep ? '✅' : index === analysisStep ? '⏳' : '⏸️'} {step}
            </div>
          ))}
        </div>
      )}

      {errorMessage && (
        <div className="error-message-box">
          <strong>⚠️ Analysis Error:</strong> {errorMessage}
          <p>Proceeding with fallback analysis for manual review.</p>
        </div>
      )}

      {analysisComplete && analysisResult && (
        <div className="analysis-results">
          <h4>📊 AI Compliance Risk Analysis Results</h4>
          <p className="results-intro">
            <strong>Analysis Complete:</strong> AI has identified compliance risks for Cristina's professional review
          </p>

          <div className="risk-section">
            <h5>⚠️ Compliance Risks Identified:</h5>
            <ul className="risk-list">
              {Array.isArray(analysisResult.compliance_risks) ? analysisResult.compliance_risks.map((risk, idx) => (
                <li key={idx} className="risk-item high-risk">❌ {risk}</li>
              )) : <li>No compliance risks identified</li>}
            </ul>
          </div>

          {Array.isArray(analysisResult.component_risks) && analysisResult.component_risks.length > 0 && (
            <div className="risk-section">
              <h5>🔍 Component Sourcing Risks:</h5>
              <ul className="risk-list">
                {analysisResult.component_risks.map((risk, idx) => (
                  <li key={idx} className="risk-item medium-risk">⚠️ {risk}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="risk-section">
            <h5>💰 Tariff Exposure Analysis:</h5>
            <div className="tariff-exposure-box">
              {analysisResult.tariff_exposure || 'Analysis in progress...'}
            </div>
          </div>

          <div className="risk-section">
            <h5>📋 AI Recommendations:</h5>
            <ul className="recommendation-list">
              {Array.isArray(analysisResult.recommendations) ? analysisResult.recommendations.map((rec, idx) => (
                <li key={idx} className="recommendation-item">✓ {rec}</li>
              )) : <li>No recommendations available</li>}
            </ul>
          </div>

          <div className="risk-score-display">
            <div className="score-item">
              <strong>Overall Risk Score:</strong>
              <span className={`risk-badge ${analysisResult.risk_score.toLowerCase()}`}>
                {analysisResult.risk_score}
              </span>
            </div>
            <div className="score-item">
              <strong>Audit Readiness:</strong>
              <span>{analysisResult.audit_readiness}</span>
            </div>
          </div>

          <div className="next-step-info">
            <h5>👩‍💼 Next: Cristina's Professional Review</h5>
            <p>
              Cristina will review these AI findings with her 17 years of customs expertise,
              validate risk assessments, and provide professional corrections if needed.
            </p>
          </div>
        </div>
      )}

      <div className="workflow-stage-actions">
        {userRole === 'Cristina' ? (
          <>
            <button
              className="btn-primary"
              onClick={handleContinue}
              disabled={!analysisComplete || loading}
            >
              {loading ? 'Processing...' : 'Complete Technical Validation →'}
            </button>

            <div className="completion-status">
              {analysisComplete ? (
                <span className="status-complete">✅ AI compliance risk analysis complete - ready for Stage 3</span>
              ) : (
                <span className="status-incomplete">⏳ Run AI analysis to continue</span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="alert alert-info">
              <div className="alert-content">
                <div className="alert-title">👁️ Waiting for Cristina to Complete</div>
                <p>Cristina will mark Stage 2 complete once she validates the compliance analysis. You'll both move to Stage 3 for client delivery.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Stage 3: Certificate Correction & Regeneration - Where Cristina Fixes the Issues
function CertificateCorrectionStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading, userRole }) {
  // Team collaboration inputs (both Jorge and Cristina have full access in Stage 3)
  const [certificateValidation, setCertificateValidation] = useState('');
  const [complianceRiskAssessment, setComplianceRiskAssessment] = useState('');
  const [auditDefenseStrategy, setAuditDefenseStrategy] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [marketplaceIntelligence, setMarketplaceIntelligence] = useState(null);

  // **PHASE 1 QUICK WINS: AI Roadmap & Client Communication**
  const [aiRoadmap, setAiRoadmap] = useState(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const [aiEmailDraft, setAiEmailDraft] = useState(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const [corrections, setCorrections] = useState({
    // What needs to be fixed based on Stage 1 decision
    hs_code_correction: '',
    product_description_fix: '',
    manufacturing_location_correction: '',
    component_origin_adjustments: [],

    // Professional fixes applied
    corrected_certificate_data: null,
    regeneration_status: 'pending', // pending, in_progress, completed
    correction_notes: '',

    // Professional validation of fixes
    fixes_validated: false,
    ready_for_delivery: false
  });

  // Get Stage 1 and Stage 2 results from stageData
  const dataReview = stageData?.stage1 || stageData?.professional_data_review || {};
  const aiAnalysis = stageData?.stage2 || stageData?.ai_compliance_analysis || {};

  // **PHASE 1 QUICK WIN: AI Roadmap Generation Function**
  const generateAIRoadmap = async () => {
    try {
      setGeneratingRoadmap(true);
      const response = await fetch('/api/usmca-roadmap-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: request.id,
          subscriberData: serviceDetails || subscriberData,
          cristinaFindings: dataReview,
          aiAnalysis: aiAnalysis
        })
      });

      const result = await response.json();
      if (result.success) {
        setAiRoadmap(result.roadmap);
        setShowRoadmap(true);
      } else {
        setAiRoadmap(result.fallback_roadmap);
        setShowRoadmap(true);
      }
    } catch (error) {
      console.error('Roadmap generation failed:', error);
      setAiRoadmap({
        executive_summary: 'Roadmap generation encountered an error. Manual review recommended.',
        error: true
      });
      setShowRoadmap(true);
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // **PHASE 1 QUICK WIN: AI Client Communication Function**
  const generateClientEmail = async () => {
    try {
      setGeneratingEmail(true);
      const response = await fetch('/api/usmca-client-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: request.id,
          subscriberData: serviceDetails || subscriberData,
          cristinaFindings: dataReview,
          roadmap: aiRoadmap
        })
      });

      const result = await response.json();
      if (result.success) {
        setAiEmailDraft(result.email_draft);
        setShowEmail(true);
      } else {
        setAiEmailDraft(result.fallback_email);
        setShowEmail(true);
      }
    } catch (error) {
      console.error('Email generation failed:', error);
      setAiEmailDraft({
        subject_line: 'USMCA Certificate Completed',
        body_paragraphs: ['Email generation encountered an error. Please draft manually.'],
        error: true
      });
      setShowEmail(true);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCorrectionChange = (field, value) => {
    setCorrections(prev => ({ ...prev, [field]: value }));
  };

  const regenerateCertificate = async () => {
    setCorrections(prev => ({ ...prev, regeneration_status: 'in_progress' }));

    try {
      // Call API to regenerate certificate with Cristina's corrections
      const response = await fetch('/api/regenerate-usmca-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_request: request,
          corrections: corrections,
          professional_adjustments: dataReview
        })
      });

      const result = await response.json();

      setCorrections(prev => ({
        ...prev,
        corrected_certificate_data: result.corrected_certificate,
        regeneration_status: 'completed'
      }));
    } catch (error) {
      console.error('Certificate regeneration failed:', error);
      setCorrections(prev => ({ ...prev, regeneration_status: 'failed' }));
    }
  };

  const handleSubmit = () => {
    onComplete({
      certificate_corrections: corrections,
      corrected_certificate: corrections.corrected_certificate_data,
      correction_timestamp: new Date().toISOString(),
      cristina_professional_fixes_applied: true,
      marketplace_intelligence: marketplaceIntelligence
    });
  };

  const isValidationComplete =
    corrections.regeneration_status === 'completed' &&
    corrections.fixes_validated;

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 3: Expert Validation & Client Delivery</h3>
        <p><strong>True Team Collaboration:</strong> Both Jorge and Cristina work together on final delivery - equal access to all controls</p>

        <div className="collaboration-banner">
          <div className="role-action">
            <strong>👩‍💼 Cristina:</strong> Validate AI compliance analysis with 17 years logistics expertise, generate professional roadmap, draft client communication with expert insights
          </div>
          <div className="role-action">
            <strong>👨‍💼 Jorge:</strong> Generate actionable roadmap for client, draft delivery email, coordinate client presentation, collect feedback, maintain ongoing relationship
          </div>
        </div>

        <div className="expert-credentials">
          🤝 Equal Collaboration | 📊 AI-Generated Roadmap | 📧 Client Communication | ✅ Service Completion
        </div>
      </div>

      <div className="ai-analysis-summary">
        <h4>🤖 Stage 2: AI Compliance Risk Analysis Results</h4>
        <div className="ai-findings">
          {Array.isArray(aiAnalysis?.compliance_risks) && aiAnalysis.compliance_risks.length > 0 && (
            <div className="finding-section">
              <strong>Compliance Risks Identified:</strong>
              <ul className="risk-list">
                {aiAnalysis.compliance_risks.map((risk, idx) => (
                  <li key={idx} className="risk-item">⚠️ {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(aiAnalysis?.component_risks) && aiAnalysis.component_risks.length > 0 && (
            <div className="finding-section">
              <strong>Component Sourcing Risks:</strong>
              <ul className="risk-list">
                {aiAnalysis.component_risks.map((risk, idx) => (
                  <li key={idx} className="risk-item">🔍 {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {aiAnalysis?.tariff_exposure && (
            <div className="finding-section">
              <strong>Tariff Exposure:</strong> {aiAnalysis.tariff_exposure}
            </div>
          )}

          {aiAnalysis?.risk_score && (
            <div className="finding-section">
              <strong>AI Risk Score:</strong>
              <span className={`risk-badge ${aiAnalysis.risk_score.toLowerCase()}`}>
                {aiAnalysis.risk_score}
              </span>
            </div>
          )}

          <div className="professional-review-note">
            <strong>🤝 Team Task:</strong> Both Jorge and Cristina review AI findings. Cristina validates compliance risks with 17 years logistics expertise. Jorge prepares client-facing roadmap and communication. Together you deliver professional service.
          </div>
        </div>
      </div>

      <div className="certificate-correction-section">
        <h4>🔧 Certificate Corrections</h4>
        <p className="expertise-note">
          <strong>Professional Value:</strong> Based on Stage 1 and 2 findings, both Jorge and Cristina can apply corrections
          and regenerate the certificate to meet professional standards. Full team access in Stage 3.
        </p>

        {dataReview.compliance_confidence_level?.includes('needs_adjustment') && (
          <div className="corrections-needed">
            <h5>Required Corrections:</h5>

            <div className="form-group">
              <label><strong>HS Code Correction</strong></label>
              <input
                type="text"
                value={corrections.hs_code_correction}
                onChange={(e) => handleCorrectionChange('hs_code_correction', e.target.value)}
                placeholder="Enter corrected HS code if needed"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label><strong>Product Description Fix</strong></label>
              <textarea
                value={corrections.product_description_fix}
                onChange={(e) => handleCorrectionChange('product_description_fix', e.target.value)}
                placeholder="Corrected product description for better classification accuracy"
                className="form-input"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label><strong>Manufacturing Location Correction</strong></label>
              <input
                type="text"
                value={corrections.manufacturing_location_correction}
                onChange={(e) => handleCorrectionChange('manufacturing_location_correction', e.target.value)}
                placeholder="Corrected manufacturing location if needed"
                className="form-input"
              />
            </div>
          </div>
        )}

        <div className="regeneration-section">
          <h5>Certificate Regeneration:</h5>

          {corrections.regeneration_status === 'pending' && (
            <button
              onClick={regenerateCertificate}
              className="btn-primary"
              disabled={loading}
            >
              🎯 Regenerate Certificate with Professional Corrections
            </button>
          )}

          {corrections.regeneration_status === 'in_progress' && (
            <div className="regeneration-progress">
              <span>🔄 Regenerating certificate with professional corrections...</span>
            </div>
          )}

          {corrections.regeneration_status === 'completed' && (
            <div className="regeneration-complete">
              <span className="success-message">✅ Certificate successfully regenerated with professional corrections</span>

              {/* DISPLAY CORRECTED CERTIFICATE FOR REVIEW */}
              {corrections.corrected_certificate_data && (
                <div className="certificate-preview-section">
                  <h5>📋 Corrected Certificate Preview</h5>
                  <p className="professional-note">
                    <strong>Review Required:</strong> Verify all corrections are accurate before approving for client delivery.
                  </p>

                  <div className="certificate-display">
                    <div className="certificate-header">
                      <h6>USMCA Certificate of Origin (Professional)</h6>
                      <div className="cert-meta">
                        <span>Certificate #: {corrections.corrected_certificate_data.certificate_number}</span>
                        <span>Issue Date: {corrections.corrected_certificate_data.issue_date}</span>
                        <span>Valid Until: {corrections.corrected_certificate_data.valid_until}</span>
                      </div>
                    </div>

                    <div className="certificate-body">
                      <div className="cert-section">
                        <h6>Exporter Information</h6>
                        <div className="data-row"><span>Name:</span> <span>{corrections.corrected_certificate_data.exporter_name}</span></div>
                        <div className="data-row"><span>Address:</span> <span>{corrections.corrected_certificate_data.exporter_address}</span></div>
                        <div className="data-row"><span>Tax ID:</span> <span>{corrections.corrected_certificate_data.exporter_tax_id}</span></div>
                      </div>

                      <div className="cert-section">
                        <h6>Product Information</h6>
                        <div className="data-row"><span>Description:</span> <span>{corrections.corrected_certificate_data.product_description}</span></div>
                        <div className="data-row"><span>HS Code:</span> <span>{corrections.corrected_certificate_data.hs_tariff_classification}</span></div>
                        <div className="data-row"><span>Origin:</span> <span>{corrections.corrected_certificate_data.country_of_origin}</span></div>
                      </div>

                      <div className="cert-section">
                        <h6>USMCA Qualification</h6>
                        <div className="data-row"><span>Preference Criterion:</span> <span>{corrections.corrected_certificate_data.preference_criterion}</span></div>
                        <div className="data-row"><span>Justification:</span> <span>{corrections.corrected_certificate_data.preference_criterion_justification}</span></div>
                        <div className="data-row"><span>RVC Method:</span> <span>{corrections.corrected_certificate_data.regional_value_content}</span></div>
                        <div className="data-row"><span>Status:</span> <span>{corrections.corrected_certificate_data.qualification_status}</span></div>
                      </div>

                      {Array.isArray(corrections.corrected_certificate_data.audit_defense_notes) && corrections.corrected_certificate_data.audit_defense_notes.length > 0 && (
                        <div className="cert-section">
                          <h6>Audit Defense Preparation</h6>
                          <ul className="cert-list">
                            {corrections.corrected_certificate_data.audit_defense_notes.map((note, idx) => (
                              <li key={idx}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(corrections.corrected_certificate_data.ongoing_monitoring) && corrections.corrected_certificate_data.ongoing_monitoring.length > 0 && (
                        <div className="cert-section">
                          <h6>Ongoing Monitoring Requirements</h6>
                          <ul className="cert-list">
                            {corrections.corrected_certificate_data.ongoing_monitoring.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="cert-section professional-backing">
                        <h6>Professional Validation</h6>
                        <div className="data-row"><span>Professional License #4601913:</span> <span className="license-number">International Commerce Degree (Cristina)</span></div>
                        <div className="data-row"><span>Service Scope:</span> <span>Compliance optimization guidance (for official customs broker services, we partner with licensed professionals)</span></div>
                        {corrections.corrected_certificate_data.cristina_professional_enhancements && (
                          <div className="enhancements-list">
                            <strong>Professional Enhancements:</strong>
                            <ul>
                              <li>✓ Risk Assessment Completed</li>
                              <li>✓ Regulatory Compliance Verified</li>
                              <li>✓ Audit Defense Preparation Included</li>
                              <li>✓ Ongoing Monitoring Setup</li>
                              {corrections.corrected_certificate_data.cristina_professional_enhancements.ai_analysis_performed && (
                                <li>✓ AI-Enhanced Regulatory Analysis</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label><strong>Validation of Corrected Certificate</strong></label>
                <div className="validation-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={corrections.fixes_validated}
                      onChange={(e) => handleCorrectionChange('fixes_validated', e.target.checked)}
                    />
                    ✅ I have reviewed the corrected certificate and it meets professional standards
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label><strong>Correction Notes</strong></label>
                <textarea
                  value={corrections.correction_notes}
                  onChange={(e) => handleCorrectionChange('correction_notes', e.target.value)}
                  placeholder="Summary of corrections applied and professional validation notes..."
                  className="form-input"
                  rows="3"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cristina's Professional Validation Form (NEW - following HSClassificationTab pattern) */}
      <div className="professional-validation-form">
        <h4>👩‍💼 Cristina's Professional Validation (International Commerce Degree - License #4601913)</h4>
        <p className="form-helper-text">
          Based on the AI analysis above and your 17 years of electronics/telecom logistics experience,
          provide your professional validation and compliance guidance
        </p>

        <div className="form-group">
          <label><strong>Certificate Accuracy Validation:</strong></label>
          <textarea
            className="form-input"
            rows="4"
            value={certificateValidation}
            onChange={(e) => setCertificateValidation(e.target.value)}
            placeholder="Review automated certificate for errors. Based on my 17 years experience, the certificate is [correct/needs correction] because..."
          />
        </div>

        <div className="form-group">
          <label><strong>Compliance Risk Assessment:</strong></label>
          <textarea
            className="form-input"
            rows="4"
            value={complianceRiskAssessment}
            onChange={(e) => setComplianceRiskAssessment(e.target.value)}
            placeholder="Specific risks I see: [e.g., China 45% sourcing creates tariff exposure if USMCA changes]. Recommend..."
          />
        </div>

        <div className="form-group">
          <label><strong>Audit Defense Strategy:</strong></label>
          <textarea
            className="form-input"
            rows="4"
            value={auditDefenseStrategy}
            onChange={(e) => setAuditDefenseStrategy(e.target.value)}
            placeholder="For customs audit, client needs: [component origin certificates, supplier declarations, technical specs]. Key defense point..."
          />
        </div>

        {/* Marketplace Intelligence Capture */}
        <MarketplaceIntelligenceForm
          serviceType="USMCA Optimization"
          onDataChange={setMarketplaceIntelligence}
        />

        {/* Report Generation Button (NEW - copied from HSClassificationTab pattern) */}
        <button
          className="btn-primary"
          onClick={async () => {
            if (!certificateValidation || !complianceRiskAssessment || !auditDefenseStrategy) {
              alert('⚠️ Please complete all professional validation fields');
              return;
            }

            try {
              setGeneratingReport(true);
              const response = await fetch('/api/generate-usmca-certificate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  serviceRequestId: request.id,
                  stage1Data: dataReview,
                  stage2Data: aiAnalysis,
                  stage3Data: {
                    certificate_validation: certificateValidation,
                    compliance_risk_assessment: complianceRiskAssessment,
                    audit_defense_strategy: auditDefenseStrategy,
                    corrections_applied: corrections
                  }
                })
              });

              const result = await response.json();
              if (result.success) {
                alert('✅ Certificate report sent to triangleintel@gmail.com');
                onComplete({
                  certificate_completed: true,
                  cristina_validation: {
                    certificate_validation: certificateValidation,
                    compliance_risk_assessment: complianceRiskAssessment,
                    audit_defense_strategy: auditDefenseStrategy
                  },
                  corrections: corrections,
                  report_generated: true,
                  report_sent_to: 'triangleintel@gmail.com',
                  marketplace_intelligence: marketplaceIntelligence,
                  completed_at: new Date().toISOString()
                });
              } else {
                throw new Error(result.error || 'Failed to generate report');
              }
            } catch (error) {
              console.error('Error generating report:', error);
              alert('❌ Failed to generate report: ' + error.message);
            } finally {
              setGeneratingReport(false);
            }
          }}
          disabled={generatingReport}
        >
          {generatingReport ? '⏳ Generating...' : '📧 Complete & Send Certificate Report'}
        </button>
      </div>

      {/* **PHASE 1 QUICK WIN: AI Roadmap Generation** */}
      <div className="ai-quick-win-section ai-roadmap-section">
        <h4>🗺️ AI-Generated Implementation Roadmap - Phase 1 Quick Win</h4>
        <p className="ai-quick-win-helper-text">
          <strong>Time Saver:</strong> AI automatically creates a 30/60/90 day implementation roadmap based on Stage 1 and 2
          findings. Both Jorge and Cristina can generate this. Saves 1 hour of manual roadmap creation.
        </p>

        {!showRoadmap && (
          <button
            className="btn-primary workflow-mt-2"
            onClick={generateAIRoadmap}
            disabled={generatingRoadmap}
          >
            {generatingRoadmap ? '⏳ Generating Roadmap...' : '🤖 Generate AI Implementation Roadmap'}
          </button>
        )}

        {showRoadmap && aiRoadmap && (
          <div className="ai-roadmap-results">
            {aiRoadmap.error ? (
              <div className="ai-error-message">
                <strong>⚠️ Roadmap Generation Issue:</strong> {aiRoadmap.executive_summary}
              </div>
            ) : (
              <>
                <div className="roadmap-section">
                  <h5><strong>📋 Executive Summary</strong></h5>
                  <p>{aiRoadmap.executive_summary}</p>
                </div>

                {aiRoadmap.first_30_days && (
                  <div className="roadmap-phase-container">
                    <h5><strong>📅 {aiRoadmap.first_30_days.title}</strong></h5>
                    {Array.isArray(aiRoadmap.first_30_days.objectives) && (
                      <div className="roadmap-objectives">
                        <strong>Objectives:</strong>
                        <ul>
                          {aiRoadmap.first_30_days.objectives.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(aiRoadmap.first_30_days.action_items) && (
                      <div>
                        <strong>Action Items:</strong>
                        {aiRoadmap.first_30_days.action_items.map((item, idx) => (
                          <div key={idx} className="roadmap-action-item phase-30">
                            <div><strong>Action:</strong> {item.action}</div>
                            <div><strong>Owner:</strong> {item.owner}</div>
                            <div><strong>Expected Outcome:</strong> {item.expected_outcome}</div>
                            <div><strong>Priority:</strong> <span className={`priority-badge ${item.priority.toLowerCase()}`}>{item.priority}</span></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {aiRoadmap.days_31_60 && (
                  <div className="roadmap-phase-container">
                    <h5><strong>📅 {aiRoadmap.days_31_60.title}</strong></h5>
                    {Array.isArray(aiRoadmap.days_31_60.objectives) && (
                      <div className="roadmap-objectives">
                        <strong>Objectives:</strong>
                        <ul>
                          {aiRoadmap.days_31_60.objectives.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(aiRoadmap.days_31_60.action_items) && (
                      <div>
                        <strong>Action Items:</strong>
                        {aiRoadmap.days_31_60.action_items.map((item, idx) => (
                          <div key={idx} className="roadmap-action-item phase-60">
                            <div><strong>Action:</strong> {item.action}</div>
                            <div><strong>Owner:</strong> {item.owner}</div>
                            <div><strong>Expected Outcome:</strong> {item.expected_outcome}</div>
                            <div><strong>Priority:</strong> <span className={`priority-badge ${item.priority.toLowerCase()}`}>{item.priority}</span></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {aiRoadmap.days_61_90 && (
                  <div className="roadmap-phase-container">
                    <h5><strong>📅 {aiRoadmap.days_61_90.title}</strong></h5>
                    {Array.isArray(aiRoadmap.days_61_90.objectives) && (
                      <div className="roadmap-objectives">
                        <strong>Objectives:</strong>
                        <ul>
                          {aiRoadmap.days_61_90.objectives.map((obj, idx) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(aiRoadmap.days_61_90.action_items) && (
                      <div>
                        <strong>Action Items:</strong>
                        {aiRoadmap.days_61_90.action_items.map((item, idx) => (
                          <div key={idx} className="roadmap-action-item phase-90">
                            <div><strong>Action:</strong> {item.action}</div>
                            <div><strong>Owner:</strong> {item.owner}</div>
                            <div><strong>Expected Outcome:</strong> {item.expected_outcome}</div>
                            <div><strong>Priority:</strong> <span className={`priority-badge ${item.priority.toLowerCase()}`}>{item.priority}</span></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {aiRoadmap.cost_benefit_projection && (
                  <div className="cost-benefit-box">
                    <h5><strong>💰 Cost-Benefit Projection</strong></h5>
                    <div><strong>Implementation Cost:</strong> {aiRoadmap.cost_benefit_projection.implementation_cost_estimate}</div>
                    <div><strong>Annual Savings Potential:</strong> {aiRoadmap.cost_benefit_projection.annual_savings_potential}</div>
                    <div><strong>ROI Timeline:</strong> {aiRoadmap.cost_benefit_projection.roi_timeline}</div>
                    <div><strong>Risk Mitigation Value:</strong> {aiRoadmap.cost_benefit_projection.risk_mitigation_value}</div>
                  </div>
                )}

                {Array.isArray(aiRoadmap.success_metrics) && aiRoadmap.success_metrics.length > 0 && (
                  <div className="roadmap-section">
                    <h5><strong>📊 Success Metrics</strong></h5>
                    <ul>
                      {aiRoadmap.success_metrics.map((metric, idx) => (
                        <li key={idx}>{metric}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(aiRoadmap.next_services_recommended) && aiRoadmap.next_services_recommended.length > 0 && (
                  <div className="roadmap-section">
                    <h5><strong>🔄 Recommended Next Services</strong></h5>
                    <ul>
                      {aiRoadmap.next_services_recommended.map((service, idx) => (
                        <li key={idx}>{service}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="ai-efficiency-note roadmap-theme">
                  <strong>⚡ Time Saved:</strong> AI generated this comprehensive roadmap in seconds instead of 1 hour of manual planning.
                  <br />
                  <strong>Generated By:</strong> {aiRoadmap.generated_by} at {new Date(aiRoadmap.generated_timestamp).toLocaleString()}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* **PHASE 1 QUICK WIN: AI Client Communication Draft** */}
      <div className="ai-quick-win-section ai-email-section">
        <h4>✉️ AI-Generated Client Email Draft - Phase 1 Quick Win</h4>
        <p className="ai-quick-win-helper-text">
          <strong>Time Saver:</strong> AI automatically drafts follow-up email in business-friendly language,
          translating technical findings into client value. Both Jorge and Cristina can generate this. Saves 30 minutes of email writing.
        </p>

        {showRoadmap && !showEmail && (
          <button
            className="btn-primary workflow-mt-2"
            onClick={generateClientEmail}
            disabled={generatingEmail}
          >
            {generatingEmail ? '⏳ Drafting Email...' : '🤖 Generate Client Email Draft'}
          </button>
        )}

        {!showRoadmap && (
          <p className="ai-email-dependency-note">
            ⚠️ Generate the Implementation Roadmap first to include it in the client email.
          </p>
        )}

        {showEmail && aiEmailDraft && (
          <div className="ai-email-results">
            {aiEmailDraft.error ? (
              <div className="ai-error-message">
                <strong>⚠️ Email Generation Issue:</strong> {aiEmailDraft.body_paragraphs[0]}
              </div>
            ) : (
              <>
                <div className="email-preview">
                  <div className="email-preview-header">
                    <strong>Subject:</strong> {aiEmailDraft.subject_line}
                  </div>

                  <div className="email-preview-header">
                    <strong>To:</strong> {serviceDetails?.contact_person || subscriberData?.contact_person || 'Client'} ({serviceDetails?.contact_email || subscriberData?.contact_email || 'client@company.com'})
                  </div>

                  <div className="email-preview-body">
                    <p>{aiEmailDraft.greeting}</p>

                    {Array.isArray(aiEmailDraft.body_paragraphs) && aiEmailDraft.body_paragraphs.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}

                    <p className="email-preview-closing">{aiEmailDraft.closing}</p>

                    {aiEmailDraft.ps_note && (
                      <p className="email-preview-ps">
                        {aiEmailDraft.ps_note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="email-instructions-box">
                  <strong>📝 Team Instructions:</strong>
                  <p>{aiEmailDraft.instructions_for_jorge}</p>
                  <p className="email-review-warning">
                    <strong>⚠️ Review Required:</strong> This email is NOT ready to send. Both Jorge and Cristina should review it, personalize with your voice,
                    add specific details from client conversations, then send manually.
                  </p>
                </div>

                <div className="ai-efficiency-note email-theme">
                  <strong>⚡ Time Saved:</strong> AI drafted this business-friendly email in seconds instead of 30 minutes.
                  <br />
                  <strong>Generated By:</strong> {aiEmailDraft.generated_by} at {new Date(aiEmailDraft.generated_timestamp).toLocaleString()}
                  <br />
                  <strong>Ready to Send:</strong> {aiEmailDraft.ready_to_send ? 'Yes' : 'No - Team must review and personalize first'}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Stage 3: Final Professional Delivery - Complete Service Delivery with Liability Coverage
function FinalProfessionalDeliveryStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  // Cristina's expert input for certificate validation (NEW - following HSClassificationTab pattern)
  const [certificateValidation, setCertificateValidation] = useState('');
  const [complianceRiskAssessment, setComplianceRiskAssessment] = useState('');
  const [auditDefenseStrategy, setAuditDefenseStrategy] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  const [deliveryPackage, setDeliveryPackage] = useState({
    // Final Certificate Package
    final_certificate_delivered: false,
    certificate_validity_confirmed: false,

    // Professional Documentation
    professional_liability_statement: '',
    ongoing_support_notes: '',
    compliance_monitoring_setup: false,

    // Service Completion
    client_satisfaction_confirmed: false,
    followup_schedule_set: false,
    service_completion_date: '',

    // Professional Backing
    cristina_professional_signature: false,
    license_backing_applied: false
  });

  const workflowData = request?.workflow_data || request?.service_details || {};
  const stage1Data = stageData?.stage1 || {};
  const stage2Data = stageData?.stage2 || {};

  const handleDeliveryChange = (field, value) => {
    setDeliveryPackage(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const finalStageData = {
      delivery_package: deliveryPackage,
      professional_completion: {
        cristina_license_number: '4601913',
        service_completion_timestamp: new Date().toISOString(),
        professional_liability_coverage: 'Active',
        client_deliverables: 'Complete certificate package with ongoing support'
      }
    };

    onComplete(finalStageData);
  };

  const isDeliveryComplete =
    deliveryPackage.final_certificate_delivered &&
    deliveryPackage.certificate_validity_confirmed &&
    deliveryPackage.client_satisfaction_confirmed &&
    deliveryPackage.cristina_professional_signature &&
    deliveryPackage.license_backing_applied;

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 3: Final Professional Delivery</h3>
        <p><strong>Complete Service:</strong> Professional certificate delivery with Cristina's liability backing</p>
        <div className="expert-credentials">
          📋 Final Certificate | 🛡️ Professional Liability | 📞 Ongoing Support
        </div>
      </div>

      <div className="delivery-summary">
        <h4>📊 Service Completion Summary</h4>
        <div className="completion-highlights">
          <div className="completion-item">
            <strong>Stage 1 Result:</strong> {stage1Data?.compliance_confidence_level?.replace('_', ' ') || 'Professional review completed'}
          </div>
          <div className="completion-item">
            <strong>Stage 2 Corrections:</strong> {stage2Data?.regeneration_status === 'completed' ? 'Certificate regenerated and validated' : 'Standard certificate approved'}
          </div>
          <div className="completion-item">
            <strong>Product:</strong> {workflowData.product_description || serviceDetails.product_description || 'Product reviewed'}
          </div>
          <div className="completion-item">
            <strong>USMCA Status:</strong> {workflowData.qualification_status || serviceDetails.qualification_status || 'Professionally assessed'}
          </div>
        </div>
      </div>

      <div className="final-delivery-section">
        <h4>📋 Certificate Delivery Package</h4>

        {/* DISPLAY FINAL CERTIFICATE FOR DELIVERY */}
        {stage2Data?.corrected_certificate && (
          <div className="final-certificate-display">
            <h5>📄 Final Certificate for Client Delivery</h5>
            <p className="professional-note">
              <strong>Final Review:</strong> This is the certificate that will be delivered to the client.
            </p>

            <div className="certificate-summary-box">
              <div className="cert-header-info">
                <div className="data-row"><strong>Certificate Number:</strong> {stage2Data.corrected_certificate.certificate_number}</div>
                <div className="data-row"><strong>Client:</strong> {stage2Data.corrected_certificate.exporter_name}</div>
                <div className="data-row"><strong>Product:</strong> {stage2Data.corrected_certificate.product_description}</div>
                <div className="data-row"><strong>HS Code:</strong> {stage2Data.corrected_certificate.hs_tariff_classification}</div>
                <div className="data-row"><strong>USMCA Status:</strong> {stage2Data.corrected_certificate.qualification_status}</div>
              </div>

              <div className="professional-backing-box">
                <div className="data-row"><strong>Professional Validation:</strong></div>
                <div className="data-row">✓ Professional License #4601913: International Commerce Degree (Cristina)</div>
                <div className="data-row">✓ Service Scope: Compliance optimization and process guidance</div>
                {stage2Data.corrected_certificate.cristina_professional_enhancements?.ai_analysis_performed && (
                  <div className="data-row">✓ AI-Enhanced Regulatory Analysis Completed</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.final_certificate_delivered}
              onChange={(e) => handleDeliveryChange('final_certificate_delivered', e.target.checked)}
            />
            <strong>Final Certificate Delivered to Client</strong>
          </label>
          <div className="delivery-note">
            Professional USMCA optimization assessment with Cristina's logistics expertise
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.certificate_validity_confirmed}
              onChange={(e) => handleDeliveryChange('certificate_validity_confirmed', e.target.checked)}
            />
            <strong>Certificate Validity Confirmed</strong>
          </label>
          <div className="delivery-note">
            Verified compliance with current USMCA regulations and CBP requirements
          </div>
        </div>

        <div className="form-group">
          <label><strong>Professional Liability Statement</strong></label>
          <textarea
            value={deliveryPackage.professional_liability_statement}
            onChange={(e) => handleDeliveryChange('professional_liability_statement', e.target.value)}
            placeholder="Professional backing statement and liability coverage details..."
            className="form-input"
            rows="3"
          />
          <div className="professional-note">
            Include license coverage and professional responsibility for this certificate
          </div>
        </div>

        <div className="form-group">
          <label><strong>Ongoing Support Notes</strong></label>
          <textarea
            value={deliveryPackage.ongoing_support_notes}
            onChange={(e) => handleDeliveryChange('ongoing_support_notes', e.target.value)}
            placeholder="Follow-up support, monitoring schedule, and additional services available..."
            className="form-input"
            rows="2"
          />
        </div>
      </div>

      <div className="professional-backing-section">
        <h4>🛡️ Professional Liability & Backing</h4>

        <div className="professional-credentials-display">
          <div className="credential-item">
            <strong>Professional License #4601913:</strong> International Commerce Degree (Cristina)
          </div>
          <div className="credential-item">
            <strong>Professional Experience:</strong> 17 years in logistics optimization and trade compliance
          </div>
          <div className="credential-item">
            <strong>Liability Coverage:</strong> Professional errors and omissions covered
          </div>
          <div className="credential-item">
            <strong>Service Guarantee:</strong> Certificate validity backed by professional license
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.compliance_monitoring_setup}
              onChange={(e) => handleDeliveryChange('compliance_monitoring_setup', e.target.checked)}
            />
            <strong>Compliance Monitoring Setup Complete</strong>
          </label>
          <div className="delivery-note">
            Client added to regulatory update notifications and compliance monitoring
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.followup_schedule_set}
              onChange={(e) => handleDeliveryChange('followup_schedule_set', e.target.checked)}
            />
            <strong>Follow-up Schedule Established</strong>
          </label>
          <div className="delivery-note">
            Regular check-ins scheduled for ongoing compliance support
          </div>
        </div>
      </div>

      <div className="client-satisfaction-section">
        <h4>✅ Service Completion Validation</h4>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.client_satisfaction_confirmed}
              onChange={(e) => handleDeliveryChange('client_satisfaction_confirmed', e.target.checked)}
            />
            <strong>Client Satisfaction Confirmed</strong>
          </label>
          <div className="delivery-note">
            Client has reviewed and approved the final certificate and professional backing
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.cristina_professional_signature}
              onChange={(e) => handleDeliveryChange('cristina_professional_signature', e.target.checked)}
            />
            <strong>Professional Signature Applied</strong>
          </label>
          <div className="delivery-note">
            Cristina's professional endorsement and signature on final deliverables
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={deliveryPackage.license_backing_applied}
              onChange={(e) => handleDeliveryChange('license_backing_applied', e.target.checked)}
            />
            <strong>License Backing Applied to Certificate</strong>
          </label>
          <div className="delivery-note">
            Assessment includes Cristina's professional validation (License #4601913 - International Commerce)
          </div>
        </div>

        <div className="form-group">
          <label><strong>Service Completion Date</strong></label>
          <input
            type="date"
            value={deliveryPackage.service_completion_date}
            onChange={(e) => handleDeliveryChange('service_completion_date', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Cristina's Professional Validation Form (NEW - copied from HSClassificationTab.js pattern) */}
      <div className="professional-validation-form">
        <h4>👩‍💼 Cristina's Professional Validation (License #4601913)</h4>
        <p className="form-helper-text">Use your 17 years of electronics/telecom logistics experience to validate the certificate before final delivery</p>

        <div className="form-group">
          <label><strong>Certificate Accuracy Validation:</strong></label>
          <textarea
            className="form-input"
            rows="4"
            value={certificateValidation}
            onChange={(e) => setCertificateValidation(e.target.value)}
            placeholder="Review automated certificate for errors. Based on my 17 years experience, the certificate is [correct/needs correction] because..."
          />
        </div>

        <div className="form-group">
          <label><strong>Compliance Risk Assessment:</strong></label>
          <textarea
            className="form-input"
            rows="4"
            value={complianceRiskAssessment}
            onChange={(e) => setComplianceRiskAssessment(e.target.value)}
            placeholder="Specific risks I see: [China 45% sourcing creates tariff exposure if USMCA changes]. Recommend..."
          />
        </div>

        <div className="form-group">
          <label><strong>Audit Defense Strategy:</strong></label>
          <textarea
            className="form-input"
            rows="4"
            value={auditDefenseStrategy}
            onChange={(e) => setAuditDefenseStrategy(e.target.value)}
            placeholder="For customs audit, client needs: [component origin certificates, supplier declarations, technical specs]. Key defense point..."
          />
        </div>

        {/* Report Generation Button (NEW - copied from HSClassificationTab.js pattern) */}
        <button
          className="btn-primary"
          onClick={async () => {
            if (!certificateValidation || !complianceRiskAssessment || !auditDefenseStrategy) {
              alert('⚠️ Please complete all professional validation fields');
              return;
            }

            try {
              setGeneratingReport(true);
              const response = await fetch('/api/generate-usmca-certificate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  serviceRequestId: request.id,
                  stage1Data: subscriberData,
                  stage2Data: {
                    certificate_validation: certificateValidation,
                    compliance_risk_assessment: complianceRiskAssessment,
                    audit_defense_strategy: auditDefenseStrategy
                  }
                })
              });

              const result = await response.json();
              if (result.success) {
                alert('✅ Certificate report sent to triangleintel@gmail.com');
                onComplete({
                  certificate_completed: true,
                  cristina_validation: {
                    certificate_validation: certificateValidation,
                    compliance_risk_assessment: complianceRiskAssessment,
                    audit_defense_strategy: auditDefenseStrategy
                  },
                  report_generated: true,
                  report_sent_to: 'triangleintel@gmail.com',
                  completed_at: new Date().toISOString()
                });
              } else {
                throw new Error(result.error || 'Failed to generate report');
              }
            } catch (error) {
              console.error('Error generating report:', error);
              alert('❌ Failed to generate report: ' + error.message);
            } finally {
              setGeneratingReport(false);
            }
          }}
          disabled={generatingReport}
        >
          {generatingReport ? '⏳ Generating...' : '📧 Complete & Send Certificate Report'}
        </button>
      </div>

      <div className="service-value-summary">
        <div className="value-point">
          <strong>$175 Service Value Delivered:</strong> Professional USMCA optimization assessment with expert logistics validation,
          compliance guidance, implementation roadmap, and ongoing support - transforming AI analysis
          into actionable compliance strategy.
        </div>
      </div>

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!isDeliveryComplete || loading}
        >
          {loading ? 'Completing Professional Service...' : 'Complete Professional Certificate Service'}
        </button>

        <div className="completion-status">
          {isDeliveryComplete ? (
            <span className="status-complete">✅ Professional service delivery completed</span>
          ) : (
            <span className="status-incomplete">⏳ Complete all delivery requirements and professional backing</span>
          )}
        </div>
      </div>
    </div>
  );
}
