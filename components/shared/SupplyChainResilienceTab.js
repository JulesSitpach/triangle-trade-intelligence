/**
 * SupplyChainResilienceTab.js - Supply Chain Resilience Service
 * $450 resilience audit where Jorge leads alternative supplier sourcing, Cristina supports risk assessment
 *
 * COLLABORATION MODEL:
 * - Jorge (Lead): Source and vet alternative Mexico suppliers, validate capabilities, negotiate terms
 * - Cristina (Support): Identify supply chain risks, validate USMCA compliance, assess quality standards
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import ToastNotification from '../shared/ToastNotification';
import MarketplaceIntelligenceForm from '../shared/MarketplaceIntelligenceForm';

export default function SupplyChainResilienceTab({ requests: propRequests, onRequestUpdate }) {
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
      const resilienceRequests = propRequests.filter(
        req => req.service_type === 'supply_chain_resilience' || req.service_type === 'supply-chain-resilience'
      );
      setServiceRequests(resilienceRequests);
      setLoading(false);
    } else {
      loadServiceRequests();
    }
  }, [propRequests]);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/service-requests?service_type=supply_chain_resilience');
      const data = await response.json();

      if (data.success) {
        setServiceRequests(data.requests || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading Supply Chain Resilience requests:', error);
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
    showToast('success', 'Supply Chain Resilience completed successfully!');
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
    return <div className="loading-spinner">Loading Supply Chain Resilience requests...</div>;
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
                <td colSpan="5" className="loading-cell">Loading Supply Chain Resilience requests...</td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-requests">
                  <p>No Supply Chain Resilience requests found.</p>
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
                     request.status === 'in_progress' ? 'Continue Service' : 'Start Resilience Audit'}
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
          serviceConfig={supplyChainResilienceService}
          request={selectedRequest}
          onComplete={handleServiceComplete}
        />
      )}
    </div>
  );
}

// Service workflow configuration
const supplyChainResilienceService = {
  title: 'Supply Chain Resilience - Alternative Supplier Sourcing',
  totalStages: 3,
  stageNames: ['Risk Assessment (Cristina)', 'Alternative Sourcing (Jorge)', 'Resilience Plan (Jorge + Cristina)'],
  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const subscriberData = request.subscriber_data || {};
    const serviceDetails = {
      serviceType: 'Supply Chain Resilience',
      price: request.price || 450,
      leadRole: 'Jorge',
      supportRole: 'Cristina'
    };

    switch (stageNumber) {
      case 1:
        return (
          <RiskAssessmentStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
          />
        );
      case 2:
        return (
          <AlternativeSupplierSourcingStage
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
          <ResiliencePlanStage
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

// Stage 1: Risk Assessment - Cristina identifies supply chain vulnerabilities
function RiskAssessmentStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [riskAnalysis, setRiskAnalysis] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({ risk_analysis: riskAnalysis, stage: 1 });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 1: Risk Assessment & Vulnerability Analysis</h3>
        <p>Cristina identifies supply chain vulnerabilities and risks</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Identify supply chain vulnerabilities, assess single-point-of-failure risks, analyze geopolitical and regulatory risks, evaluate USMCA compliance risks</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Gathered client concerns and priorities, identified critical components that need backup sources</p>
      </div>

      {/* Client Data Review */}
      <div className="client-data-section">
        <h4>Current Supply Chain Context:</h4>

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
            <strong>Manufacturing/Sourcing:</strong>
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

      {/* Risk Assessment Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👩‍💼 Cristina's Supply Chain Risk Assessment:</strong></label>
          <p className="form-helper-text">
            Identify: Single-point-of-failure risks, geographic concentration risks, geopolitical and trade policy risks,
            USMCA compliance vulnerabilities, quality and reliability risks, cost volatility risks, lead time and logistics risks,
            prioritize risks by severity and likelihood
          </p>
          <textarea
            value={riskAnalysis}
            onChange={(e) => setRiskAnalysis(e.target.value)}
            placeholder="Document comprehensive risk assessment..."
            rows={12}
            required
            className="form-textarea"
          />
        </div>

        <div className="risk-assessment-checklist">
          <h4>Risk Assessment Areas:</h4>
          <ul>
            <li>✓ Single-source dependency vulnerabilities</li>
            <li>✓ Geographic concentration risks</li>
            <li>✓ Geopolitical and trade policy risks (tariffs, sanctions)</li>
            <li>✓ USMCA qualification maintenance risks</li>
            <li>✓ Quality and reliability track record</li>
            <li>✓ Cost volatility and currency risks</li>
            <li>✓ Lead time and logistics challenges</li>
            <li>✓ Supplier financial stability</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Complete Assessment → Begin Supplier Sourcing'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 2: Alternative Supplier Sourcing - Jorge sources and vets Mexico suppliers
function AlternativeSupplierSourcingStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [supplierResearch, setSupplierResearch] = useState('');
  const [vettingResults, setVettingResults] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      supplier_research: supplierResearch,
      vetting_results: vettingResults,
      stage: 2
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 2: Alternative Supplier Sourcing & Vetting</h3>
        <p>Jorge sources and vets Mexico-based alternative suppliers</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👨‍💼 Jorge (Lead):</strong> Source Mexico-based alternatives, contact and vet suppliers, validate production capabilities, negotiate trial terms, assess cultural fit</p>
        <p><strong>👩‍💼 Cristina (Support):</strong> Verify USMCA compliance of alternatives, review quality certifications, assess technical specifications compatibility</p>
      </div>

      {/* Previous Stage Summary */}
      {stageData.stage_1 && (
        <div className="previous-stage-summary">
          <h4>Stage 1 Risk Assessment Summary:</h4>
          <div className="summary-content">
            <strong>Identified Risks:</strong>
            <p>{stageData.stage_1.risk_analysis}</p>
          </div>
        </div>
      )}

      {/* Supplier Sourcing Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👨‍💼 Jorge: Mexico Supplier Research & Outreach</strong></label>
          <p className="form-helper-text">
            Document: Suppliers identified (names and locations), initial contact and conversations, capabilities assessment,
            production capacity evaluation, pricing and terms discussion, cultural fit and communication assessment
          </p>
          <textarea
            value={supplierResearch}
            onChange={(e) => setSupplierResearch(e.target.value)}
            placeholder="Document your supplier research and outreach..."
            rows={8}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>👨‍💼 Jorge & 👩‍💼 Cristina: Supplier Vetting Results</strong></label>
          <p className="form-helper-text">
            For each viable supplier: Production capabilities verified, USMCA compliance status (Cristina),
            quality certifications reviewed (Cristina), pricing competitiveness, lead times and logistics,
            trial/sample terms negotiated, recommendation score (1-5 stars)
          </p>
          <textarea
            value={vettingResults}
            onChange={(e) => setVettingResults(e.target.value)}
            placeholder="Document detailed vetting results for each supplier..."
            rows={10}
            required
            className="form-textarea"
          />
        </div>

        <div className="vetting-checklist">
          <h4>Supplier Vetting Checklist (per supplier):</h4>
          <ul>
            <li>✓ Production capacity meets requirements</li>
            <li>✓ Quality certifications verified (ISO, industry-specific)</li>
            <li>✓ USMCA compliance validated</li>
            <li>✓ Pricing competitive and sustainable</li>
            <li>✓ Lead times acceptable</li>
            <li>✓ Financial stability assessed</li>
            <li>✓ References checked</li>
            <li>✓ Trial/sample terms negotiated</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Complete Vetting → Create Resilience Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 3: Resilience Plan & Validation - Comprehensive resilience strategy
function ResiliencePlanStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [resiliencePlan, setResiliencePlan] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [marketplaceIntelligence, setMarketplaceIntelligence] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      resilience_plan: resiliencePlan,
      delivery_notes: deliveryNotes,
      marketplace_intelligence: marketplaceIntelligence,
      stage: 3,
      status: 'completed'
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 3: Resilience Plan & Implementation Strategy</h3>
        <p>Create comprehensive supply chain resilience strategy</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👨‍💼 Jorge (Lead):</strong> Create supplier diversification roadmap, prioritize implementation steps, develop transition plan</p>
        <p><strong>👩‍💼 Cristina (Support):</strong> Validate compliance requirements for all alternatives, review risk mitigation effectiveness</p>
      </div>

      {/* Service Summary */}
      <div className="service-summary">
        <h4>Complete Resilience Audit Summary:</h4>

        {stageData.stage_1 && (
          <div className="summary-section">
            <strong>Stage 1 - Risk Assessment:</strong>
            <p>{stageData.stage_1.risk_analysis}</p>
          </div>
        )}

        {stageData.stage_2 && (
          <div className="summary-section">
            <strong>Stage 2 - Supplier Sourcing & Vetting:</strong>
            <p><strong>Research:</strong> {stageData.stage_2.supplier_research}</p>
            <p><strong>Vetting Results:</strong> {stageData.stage_2.vetting_results}</p>
          </div>
        )}
      </div>

      {/* Resilience Plan Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>Comprehensive Resilience Plan:</strong></label>
          <p className="form-helper-text">
            Create: Risk mitigation strategy for each identified vulnerability, supplier diversification roadmap,
            recommended supplier mix (primary + backup), transition plan and timeline, trial implementation steps,
            ongoing monitoring and evaluation plan, cost-benefit analysis, USMCA compliance validation
          </p>
          <textarea
            value={resiliencePlan}
            onChange={(e) => setResiliencePlan(e.target.value)}
            placeholder="Document comprehensive resilience plan..."
            rows={12}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>Delivery & Client Response:</strong></label>
          <p className="form-helper-text">
            How was plan delivered? Client reaction and priorities? Agreed implementation steps? Next services discussed?
          </p>
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="Document delivery and client feedback..."
            rows={5}
            required
            className="form-textarea"
          />
        </div>

        {/* Marketplace Intelligence Capture */}
        <MarketplaceIntelligenceForm
          serviceType="Supply Chain Resilience"
          onDataChange={setMarketplaceIntelligence}
        />

        <div className="completion-checklist">
          <h4>Resilience Strategy Deliverables:</h4>
          <ul>
            <li>✓ Comprehensive supply chain risk assessment</li>
            <li>✓ Vetted alternative Mexico supplier list (3-5 suppliers)</li>
            <li>✓ Supplier comparison and recommendations</li>
            <li>✓ Risk mitigation strategies for each vulnerability</li>
            <li>✓ Supplier diversification roadmap</li>
            <li>✓ Implementation timeline and transition plan</li>
            <li>✓ Cost-benefit analysis</li>
            <li>✓ USMCA compliance validation</li>
            <li>✓ Ongoing monitoring recommendations</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Completing Service...' : '✓ Complete Service & Deliver Resilience Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
