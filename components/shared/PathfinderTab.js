/**
 * PathfinderTab.js - Pathfinder Market Entry Service
 * $350 market entry package where Jorge leads market research, Cristina supports supply chain design
 *
 * COLLABORATION MODEL:
 * - Jorge (Lead): Market research, entry strategy, partner identification, negotiation support
 * - Cristina (Support): Supply chain design for Mexico operations, landed cost calculations, logistics planning
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import ToastNotification from '../shared/ToastNotification';
import MarketplaceIntelligenceForm from '../shared/MarketplaceIntelligenceForm';
import { filterByServiceType } from '../../lib/utils/service-type-mapping';

export default function PathfinderTab({ requests: propRequests, onRequestUpdate }) {
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
      // Filter using utility
      const pathfinderRequests = filterByServiceType(propRequests, 'pathfinder');
      setServiceRequests(pathfinderRequests);
      setLoading(false);
    } else {
      loadServiceRequests();
    }
  }, [propRequests]);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      // Load ALL service requests
      const response = await fetch('/api/admin/service-requests');
      const data = await response.json();

      if (data.success) {
        // Filter using utility
        const filtered = filterByServiceType(data.requests || [], 'pathfinder');
        setServiceRequests(filtered);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading Pathfinder requests:', error);
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
    showToast('success', 'Pathfinder Market Entry completed successfully!');
    setIsModalOpen(false);
    setSelectedRequest(null);
    if (onRequestUpdate) {
      await onRequestUpdate(selectedRequest.id, { status: 'completed' });
    } else {
      await loadServiceRequests();
    }
  };

  // Filter and sort logic (service type already filtered)
  const filteredRequests = serviceRequests.filter(request => {
    const data = request.subscriber_data || request.service_details || {};
    const matchesSearch = request.client_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         data.product_description?.toLowerCase().includes(searchTerm.toLowerCase());
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
    return <div className="loading-spinner">Loading Pathfinder Market Entry requests...</div>;
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
                <td colSpan="5" className="loading-cell">Loading Pathfinder Market Entry requests...</td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-requests">
                  <p>No Pathfinder Market Entry requests found.</p>
                  <p className="secondary-text">
                    Requests will appear here when clients purchase this service.
                  </p>
                </td>
              </tr>
            ) : paginatedRequests.map((request) => {
              const data = request.subscriber_data || request.service_details || {};
              const contactName = request.contact_name || data.contact_name || 'Contact not provided';
              const productDescription = data.product_description || 'Product details not provided';
              const tradeVolume = data.trade_volume ? `$${Number(data.trade_volume).toLocaleString()}` : 'Not specified';

              return (
                <tr key={request.id}>
                  <td>
                    <div className="client-info">
                      <strong>{request.client_company || 'Unknown Company'}</strong>
                      <div className="contact-name">{contactName}</div>
                    </div>
                  </td>
                  <td>
                    <div className="product-summary">
                      {productDescription}
                    </div>
                  </td>
                  <td>
                    <div className="trade-volume">
                      {tradeVolume}
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
                     request.status === 'in_progress' ? 'Continue Service' : 'Start Market Entry'}
                  </button>
                </td>
              </tr>
            );
            })}
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
          serviceConfig={pathfinderService}
          request={selectedRequest}
          onComplete={handleServiceComplete}
        />
      )}
    </div>
  );
}

// Service workflow configuration
const pathfinderService = {
  title: 'Pathfinder Market Entry - Mexico Strategy',
  totalStages: 3,
  stageNames: ['Market Research (Jorge)', 'Supply Chain Design (Cristina)', 'Implementation Plan (Jorge + Cristina)'],
  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const subscriberData = request.subscriber_data || {};
    const serviceDetails = {
      serviceType: 'Pathfinder Market Entry',
      price: request.price || 350,
      leadRole: 'Jorge',
      supportRole: 'Cristina'
    };

    switch (stageNumber) {
      case 1:
        return (
          <MarketResearchStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
          />
        );
      case 2:
        return (
          <SupplyChainDesignStage
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
          <ImplementationStrategyStage
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

// Stage 1: Market Research & Analysis - Jorge researches Mexico market
function MarketResearchStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [marketAnalysis, setMarketAnalysis] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({ market_analysis: marketAnalysis, stage: 1 });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 1: Market Research & Analysis</h3>
        <p>Jorge conducts comprehensive Mexico market research and opportunity analysis</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👨‍💼 Jorge (Lead):</strong> Research Mexico market dynamics, identify opportunities and competitors, assess entry barriers, evaluate potential partners, analyze cultural considerations</p>
        <p><strong>👩‍💼 Cristina (Support):</strong> Identified logistics and compliance requirements that will factor into strategy</p>
      </div>

      {/* Client Data Review */}
      <div className="client-data-section">
        <h4>Client Business Context:</h4>

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
            <strong>Business Type:</strong>
            <span>{subscriberData.business_type}</span>
          </div>
          <div className="data-item">
            <strong>Annual Trade Volume:</strong>
            <span>${subscriberData.trade_volume}</span>
          </div>
          <div className="data-item">
            <strong>Current Operations:</strong>
            <span>{subscriberData.manufacturing_location}</span>
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
            <strong>Current Supply Chain (with Tariff Intelligence):</strong>
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
                  {subscriberData.component_origins.map((comp, idx) => {
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
                        <td style={{ textAlign: 'center', padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {hsCode}
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.5rem', color: '#dc2626' }}>
                          {mfnRate > 0 ? `${mfnRate.toFixed(1)}%` : '—'}
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
            {subscriberData.component_origins.some(c => {
              const confidence = c.confidence || 100;
              return confidence < 80;
            }) && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderLeft: '3px solid #f59e0b', fontSize: '0.875rem' }}>
                ⚠️ <strong>Low Confidence Alert:</strong> Some components have AI classification confidence below 80%. Professional HS validation recommended.
              </div>
            )}
            {subscriberData.component_origins.some(c => {
              const mfnRate = c.mfn_rate || c.tariff_rates?.mfn_rate || 0;
              const usmcaRate = c.usmca_rate || c.tariff_rates?.usmca_rate || 0;
              return (mfnRate - usmcaRate) > 5 && !c.is_usmca_member;
            }) && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#ecfdf5', borderLeft: '3px solid #059669', fontSize: '0.875rem' }}>
                💰 <strong>Mexico Sourcing Opportunity:</strong> High tariff exposure detected (>5%). Sourcing from Mexico could save significant costs.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Market Research Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👨‍💼 Jorge's Mexico Market Analysis:</strong></label>
          <p className="form-helper-text">
            Cover: Market size and growth trends, key competitors and their positioning, entry barriers and challenges,
            potential partners (distributors, manufacturers, logistics providers), cultural and business practice considerations,
            pricing dynamics and margin expectations, regulatory and compliance landscape
          </p>
          <textarea
            value={marketAnalysis}
            onChange={(e) => setMarketAnalysis(e.target.value)}
            placeholder="Document your comprehensive Mexico market research..."
            rows={12}
            required
            className="form-textarea"
          />
        </div>

        <div className="research-checklist">
          <h4>Market Research Areas:</h4>
          <ul>
            <li>✓ Market size, growth trends, and demand drivers</li>
            <li>✓ Competitive landscape and positioning opportunities</li>
            <li>✓ Distribution channels and partner ecosystem</li>
            <li>✓ Entry barriers and mitigation strategies</li>
            <li>✓ Cultural business practices and negotiation norms</li>
            <li>✓ Regulatory requirements and compliance</li>
            <li>✓ Pricing strategy and margin expectations</li>
            <li>✓ Risk factors and contingency planning</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Complete Research → Proceed to Supply Chain Design'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 2: Supply Chain & Cost Design - Cristina designs supply chain for Mexico
function SupplyChainDesignStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [supplyChainDesign, setSupplyChainDesign] = useState('');
  const [costAnalysis, setCostAnalysis] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      supply_chain_design: supplyChainDesign,
      cost_analysis: costAnalysis,
      stage: 2
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 2: Supply Chain & Cost Design</h3>
        <p>Cristina designs Mexico supply chain and calculates landed costs</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Design supply chain for Mexico operations, calculate landed costs, identify logistics providers, assess compliance requirements</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Shared partner insights from research, validated cost assumptions with market contacts</p>
      </div>

      {/* Previous Stage Summary */}
      {stageData.stage_1 && (
        <div className="previous-stage-summary">
          <h4>Stage 1 Market Research Summary:</h4>
          <div className="summary-content">
            <strong>Market Analysis:</strong>
            <p>{stageData.stage_1.market_analysis}</p>
          </div>
        </div>
      )}

      {/* Supply Chain Design Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👩‍💼 Cristina: Supply Chain Design for Mexico</strong></label>
          <p className="form-helper-text">
            Design: Sourcing strategy (local vs import), manufacturing/assembly approach, logistics and transportation plan,
            warehouse and distribution strategy, customs and compliance process, quality control procedures
          </p>
          <textarea
            value={supplyChainDesign}
            onChange={(e) => setSupplyChainDesign(e.target.value)}
            placeholder="Document your supply chain design for Mexico operations..."
            rows={8}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>👩‍💼 Cristina: Landed Cost Analysis</strong></label>
          <p className="form-helper-text">
            Calculate: Component/material costs, manufacturing costs, transportation and logistics costs, customs duties and fees,
            warehouse and handling costs, total landed cost per unit, comparison to current costs
          </p>
          <textarea
            value={costAnalysis}
            onChange={(e) => setCostAnalysis(e.target.value)}
            placeholder="Document your detailed cost analysis..."
            rows={8}
            required
            className="form-textarea"
          />
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Complete Design → Create Implementation Strategy'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 3: Implementation Strategy & Delivery - Comprehensive market entry plan
function ImplementationStrategyStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [implementationPlan, setImplementationPlan] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [marketplaceIntelligence, setMarketplaceIntelligence] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      implementation_plan: implementationPlan,
      delivery_notes: deliveryNotes,
      marketplace_intelligence: marketplaceIntelligence,
      stage: 3,
      status: 'completed'
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 3: Implementation Strategy & Delivery</h3>
        <p>Create comprehensive market entry implementation plan</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👨‍💼 Jorge (Lead):</strong> Create implementation timeline, prioritize action steps, prepare partner introduction plan, develop negotiation strategy</p>
        <p><strong>👩‍💼 Cristina (Support):</strong> Provide logistics implementation checklist, verify compliance requirements documented</p>
      </div>

      {/* Service Summary */}
      <div className="service-summary">
        <h4>Complete Market Entry Strategy:</h4>

        {stageData.stage_1 && (
          <div className="summary-section">
            <strong>Stage 1 - Market Research:</strong>
            <p>{stageData.stage_1.market_analysis}</p>
          </div>
        )}

        {stageData.stage_2 && (
          <div className="summary-section">
            <strong>Stage 2 - Supply Chain Design:</strong>
            <p><strong>Supply Chain:</strong> {stageData.stage_2.supply_chain_design}</p>
            <p><strong>Cost Analysis:</strong> {stageData.stage_2.cost_analysis}</p>
          </div>
        )}
      </div>

      {/* Implementation Plan Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👨‍💼 Jorge: Implementation Plan & Timeline</strong></label>
          <p className="form-helper-text">
            Create: Phased implementation timeline (30/60/90 days), prioritized action steps for each phase,
            partner introduction and negotiation plan, key milestones and success metrics, risk mitigation strategies,
            resource requirements, recommended next services
          </p>
          <textarea
            value={implementationPlan}
            onChange={(e) => setImplementationPlan(e.target.value)}
            placeholder="Document comprehensive implementation plan..."
            rows={10}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>Delivery & Client Response:</strong></label>
          <p className="form-helper-text">
            How was strategy delivered? Client reaction and questions? Agreed next steps? Additional support needed?
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
          serviceType="Pathfinder Market Entry"
          onDataChange={setMarketplaceIntelligence}
        />

        <div className="completion-checklist">
          <h4>Market Entry Strategy Deliverables:</h4>
          <ul>
            <li>✓ Comprehensive Mexico market analysis</li>
            <li>✓ Competitive landscape and opportunities</li>
            <li>✓ Potential partner recommendations</li>
            <li>✓ Supply chain design for Mexico operations</li>
            <li>✓ Complete landed cost analysis</li>
            <li>✓ Phased implementation timeline (30/60/90 days)</li>
            <li>✓ Risk assessment and mitigation strategies</li>
            <li>✓ Next steps and ongoing support recommendations</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Completing Service...' : '✓ Complete Service & Deliver Strategy'}
          </button>
        </div>
      </form>
    </div>
  );
}
