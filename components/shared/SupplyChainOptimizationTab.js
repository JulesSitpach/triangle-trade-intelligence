/**
 * SupplyChainOptimizationTab.js - Supply Chain Optimization Service
 * $275 supply chain audit where Cristina leads technical analysis, Jorge develops client report
 *
 * COLLABORATION MODEL:
 * - Cristina (Lead): Supply chain audit, gap identification, technical recommendations
 * - Jorge (Support): Client report development, ROI analysis, implementation roadmap
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import ToastNotification from '../shared/ToastNotification';
import MarketplaceIntelligenceForm from '../shared/MarketplaceIntelligenceForm';

export default function SupplyChainOptimizationTab({ requests: propRequests, onRequestUpdate }) {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (propRequests) {
      const optimizationRequests = propRequests.filter(
        req => req.service_type === 'supply_chain_optimization' || req.service_type === 'supply-chain-optimization'
      );
      setServiceRequests(optimizationRequests);
      setLoading(false);
    } else {
      loadServiceRequests();
    }
  }, [propRequests]);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/service-requests?service_type=supply_chain_optimization');
      const data = await response.json();

      if (data.success) {
        setServiceRequests(data.requests || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading Supply Chain Optimization requests:', error);
      showToast('error', 'Failed to load service requests');
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleStartService = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleServiceComplete = async () => {
    showToast('success', 'Supply Chain Optimization completed successfully!');
    setIsModalOpen(false);
    setSelectedRequest(null);
    if (onRequestUpdate) {
      await onRequestUpdate(selectedRequest.id, { status: 'completed' });
    } else {
      await loadServiceRequests();
    }
  };

  // Filter and sort logic
  const filteredRequests = serviceRequests.filter(request => {
    const matchesSearch = request.client_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.subscriber_data?.product_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'company') {
      return a.client_company.localeCompare(b.client_company);
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="loading-spinner">Loading Supply Chain Optimization requests...</div>;
  }

  return (
    <div className="service-tab-container">
      {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Search and Filter Controls */}
      <div className="service-controls">
        <input
          type="text"
          placeholder="Search by company or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          <option value="created_at">Sort by Date</option>
          <option value="company">Sort by Company</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedRequests.length)} of {sortedRequests.length} requests</span>
        {(searchTerm || filterStatus !== 'all') && (
          <span className="filter-indicator">(filtered)</span>
        )}
      </div>

      {/* Service Requests Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th
                className={`sortable ${sortBy === 'company' ? 'sorted' : ''}`}
                onClick={() => setSortBy('company')}
                title="Click to sort by company name"
              >
                Client {sortBy === 'company' && (sortedRequests[0]?.client_company > sortedRequests[sortedRequests.length - 1]?.client_company ? '↓' : '↑')}
              </th>
              <th>Product</th>
              <th>Trade Volume</th>
              <th
                className={`sortable ${sortBy === 'status' ? 'sorted' : ''}`}
                onClick={() => setSortBy('status')}
                title="Click to sort by status"
              >
                Status {sortBy === 'status' && (sortedRequests[0]?.status > sortedRequests[sortedRequests.length - 1]?.status ? '↓' : '↑')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="loading-cell">Loading Supply Chain Optimization requests...</td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-requests">
                  <p>No Supply Chain Optimization requests found.</p>
                  <p className="secondary-text">
                    Requests will appear here when clients purchase this service.
                  </p>
                </td>
              </tr>
            ) : paginatedRequests.map((request) => (
              <tr key={request.id}>
                <td>
                  <div className="client-info">
                    <strong>{request.client_company || 'Unknown Company'}</strong>
                    <div className="contact-name">{request.contact_name}</div>
                  </div>
                </td>
                <td>
                  <div className="product-summary">
                    {request.subscriber_data?.product_description || 'Not specified'}
                  </div>
                </td>
                <td>
                  <div className="trade-volume">
                    {request.subscriber_data?.trade_volume
                      ? `$${Number(request.subscriber_data.trade_volume).toLocaleString()}`
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
                    onClick={() => handleStartService(request)}
                    disabled={request.status === 'completed'}
                  >
                    {request.status === 'completed' ? 'Completed' :
                     request.status === 'in_progress' ? 'Continue Service' : 'Start Optimization'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages} ({sortedRequests.length} total requests)</span>
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="btn-secondary pagination-btn"
              title="First page"
            >
              ««
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-secondary pagination-btn"
              title="Previous page"
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`btn-secondary pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary pagination-btn"
              title="Next page"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="btn-secondary pagination-btn"
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* Service Workflow Modal */}
      {isModalOpen && selectedRequest && (
        <ServiceWorkflowModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          serviceConfig={supplyChainOptimizationService}
          request={selectedRequest}
          onComplete={handleServiceComplete}
        />
      )}
    </div>
  );
}

// Service workflow configuration
const supplyChainOptimizationService = {
  title: 'Supply Chain Optimization - Comprehensive Audit',
  totalStages: 3,
  stageNames: ['Supply Chain Audit (Cristina)', 'Gap Analysis (Cristina + Jorge)', 'Report Delivery (Jorge + Cristina)'],
  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const subscriberData = request.subscriber_data || {};
    const serviceDetails = {
      serviceType: 'Supply Chain Optimization',
      price: request.price || 275,
      leadRole: 'Cristina',
      supportRole: 'Jorge'
    };

    switch (stageNumber) {
      case 1:
        return (
          <SupplyChainAuditStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
          />
        );
      case 2:
        return (
          <GapAnalysisStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            stageData={stageData}
            onComplete={onStageComplete}
            loading={loading}
          />
        );
      case 3:
        return (
          <ReportDeliveryStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            stageData={stageData}
            onComplete={onStageComplete}
            loading={loading}
          />
        );
      default:
        return <div>Invalid stage</div>;
    }
  }
};

// Stage 1: Supply Chain Audit - Cristina reviews entire supply chain
function SupplyChainAuditStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [auditFindings, setAuditFindings] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({ audit_findings: auditFindings, stage: 1 });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 1: Supply Chain Audit</h3>
        <p>Cristina conducts comprehensive supply chain structure review</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Audit supply chain structure, identify bottlenecks, analyze compliance requirements, find cost reduction opportunities</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Gathered additional context from client, identified key priorities and pain points</p>
      </div>

      {/* Client Data Review */}
      <div className="client-data-section">
        <h4>Client Supply Chain Context:</h4>

        <div className="data-grid">
          <div className="data-item">
            <strong>Company:</strong>
            <span>{request.client_company}</span>
          </div>
          <div className="data-item">
            <strong>Product:</strong>
            <span>{subscriberData.product_description}</span>
          </div>
          <div className="data-item">
            <strong>Manufacturing Location:</strong>
            <span>{subscriberData.manufacturing_location}</span>
          </div>
          <div className="data-item">
            <strong>Annual Trade Volume:</strong>
            <span>${subscriberData.trade_volume}</span>
          </div>
          <div className="data-item">
            <strong>Business Type:</strong>
            <span>{subscriberData.business_type}</span>
          </div>
          <div className="data-item">
            <strong>USMCA Status:</strong>
            <span className={subscriberData.qualification_status === 'QUALIFIED' ? 'text-success' : 'text-warning'}>
              {subscriberData.qualification_status}
            </span>
          </div>
        </div>

        {subscriberData.component_origins && subscriberData.component_origins.length > 0 && (
          <div className="component-breakdown">
            <strong>Current Component Sourcing:</strong>
            <ul>
              {subscriberData.component_origins.map((comp, idx) => (
                <li key={idx}>
                  {comp.value_percentage}% from {comp.origin_country} - {comp.description || comp.component_type}
                </li>
              ))}
            </ul>
          </div>
        )}

        {subscriberData.vulnerability_factors && subscriberData.vulnerability_factors.length > 0 && (
          <div className="risk-factors">
            <strong>Known Vulnerability Factors:</strong>
            <ul>
              {subscriberData.vulnerability_factors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Audit Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👩‍💼 Cristina's Supply Chain Audit Findings:</strong></label>
          <p className="form-helper-text">
            Document: Current supply chain structure analysis, identified bottlenecks, compliance gaps, cost inefficiencies,
            sourcing risks, quality concerns, logistics issues, USMCA optimization opportunities
          </p>
          <textarea
            value={auditFindings}
            onChange={(e) => setAuditFindings(e.target.value)}
            placeholder="Document your comprehensive supply chain audit findings..."
            rows={10}
            required
            className="form-textarea"
          />
        </div>

        <div className="audit-checklist">
          <h4>Audit Areas to Cover:</h4>
          <ul>
            <li>✓ Component sourcing efficiency and costs</li>
            <li>✓ Manufacturing location optimization</li>
            <li>✓ USMCA qualification opportunities</li>
            <li>✓ Logistics and transportation efficiency</li>
            <li>✓ Compliance and regulatory requirements</li>
            <li>✓ Quality control and risk factors</li>
            <li>✓ Cost reduction opportunities</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Complete Audit → Proceed to Gap Analysis'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 2: Gap Analysis & Recommendations - Cristina analyzes gaps, Jorge develops ROI recommendations
function GapAnalysisStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [gapAnalysis, setGapAnalysis] = useState('');
  const [roiRecommendations, setRoiRecommendations] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      gap_analysis: gapAnalysis,
      roi_recommendations: roiRecommendations,
      stage: 2
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 2: Gap Analysis & Recommendations</h3>
        <p>Cristina identifies gaps, Jorge develops ROI-based recommendations</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Identify specific gaps, prioritize issues by severity, recommend technical solutions</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Calculate ROI for each recommendation, prioritize by business impact, create implementation roadmap</p>
      </div>

      {/* Previous Stage Summary */}
      {stageData.stage_1 && (
        <div className="previous-stage-summary">
          <h4>Stage 1 Audit Summary:</h4>
          <div className="summary-content">
            <strong>Audit Findings:</strong>
            <p>{stageData.stage_1.audit_findings}</p>
          </div>
        </div>
      )}

      {/* Gap Analysis Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👩‍💼 Cristina: Gap Analysis & Technical Solutions</strong></label>
          <p className="form-helper-text">
            List specific gaps identified, prioritize by severity (critical/high/medium/low),
            recommend technical solutions for each gap, estimate implementation complexity
          </p>
          <textarea
            value={gapAnalysis}
            onChange={(e) => setGapAnalysis(e.target.value)}
            placeholder="Document identified gaps and technical recommendations..."
            rows={8}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>👨‍💼 Jorge: ROI Analysis & Implementation Priority</strong></label>
          <p className="form-helper-text">
            For each recommendation: Calculate potential cost savings/revenue impact, estimate implementation cost and timeline,
            prioritize by ROI, create actionable implementation roadmap
          </p>
          <textarea
            value={roiRecommendations}
            onChange={(e) => setRoiRecommendations(e.target.value)}
            placeholder="Document ROI analysis and prioritized recommendations..."
            rows={8}
            required
            className="form-textarea"
          />
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Complete Analysis → Generate Final Report'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 3: Report Generation & Delivery - Final report compilation and delivery
function ReportDeliveryStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [marketplaceIntelligence, setMarketplaceIntelligence] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      executive_summary: executiveSummary,
      delivery_notes: deliveryNotes,
      marketplace_intelligence: marketplaceIntelligence,
      stage: 3,
      status: 'completed'
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 3: Report Generation & Delivery</h3>
        <p>Compile comprehensive report and deliver to client</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Compile technical findings, verify all gaps documented, ensure recommendations are actionable</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Create executive summary, present findings to client, discuss implementation priorities, collect feedback</p>
      </div>

      {/* Service Summary */}
      <div className="service-summary">
        <h4>Complete Service Summary:</h4>

        {stageData.stage_1 && (
          <div className="summary-section">
            <strong>Stage 1 - Supply Chain Audit:</strong>
            <p>{stageData.stage_1.audit_findings}</p>
          </div>
        )}

        {stageData.stage_2 && (
          <div className="summary-section">
            <strong>Stage 2 - Gap Analysis:</strong>
            <p><strong>Cristina's Gap Analysis:</strong> {stageData.stage_2.gap_analysis}</p>
            <p><strong>Jorge's ROI Recommendations:</strong> {stageData.stage_2.roi_recommendations}</p>
          </div>
        )}
      </div>

      {/* Report Delivery Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👨‍💼 Jorge: Executive Summary for Client</strong></label>
          <p className="form-helper-text">
            Create client-friendly executive summary: Key findings (3-5 bullets), Top 3 priority recommendations,
            Expected ROI and timeline, Next steps for implementation
          </p>
          <textarea
            value={executiveSummary}
            onChange={(e) => setExecutiveSummary(e.target.value)}
            placeholder="Write executive summary for client..."
            rows={6}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>Delivery & Client Response:</strong></label>
          <p className="form-helper-text">
            How was report delivered? Client feedback and questions? Agreed next steps? Additional services discussed?
          </p>
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="Document delivery and client response..."
            rows={5}
            required
            className="form-textarea"
          />
        </div>

        {/* Marketplace Intelligence Capture */}
        <MarketplaceIntelligenceForm
          serviceType="Supply Chain Optimization"
          onDataChange={setMarketplaceIntelligence}
        />

        <div className="completion-checklist">
          <h4>Report Deliverables Checklist:</h4>
          <ul>
            <li>✓ Comprehensive supply chain audit findings</li>
            <li>✓ Prioritized gap analysis with severity ratings</li>
            <li>✓ ROI-based implementation recommendations</li>
            <li>✓ Timeline and cost estimates for each recommendation</li>
            <li>✓ Executive summary for client presentation</li>
            <li>✓ Next service recommendations (if applicable)</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Completing Service...' : '✓ Complete Service & Deliver Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
