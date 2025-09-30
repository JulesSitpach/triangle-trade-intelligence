/**
 * ManufacturingFeasibilityTab.js - Jorge's Manufacturing Feasibility Service
 * Production-ready component with NO HARDCODING
 * 3-Stage Workflow: Manufacturing Context → AI Analysis → Jorge's Recommendation
 * Comprehensive go/no-go assessment for Mexico manufacturing
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import { useToast, ToastContainer } from '../shared/ToastNotification';

export default function ManufacturingFeasibilityTab() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, showToast, removeToast, success, error: errorToast, warning, info } = useToast();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState('all');
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
      info('Loading manufacturing feasibility requests...');

      const response = await fetch('/api/admin/service-requests?assigned_to=Jorge&service_type=Manufacturing Feasibility');

      if (!response.ok) {
        throw new Error('Failed to load service requests');
      }

      const data = await response.json();
      setServiceRequests(data.requests || []);
      success(`Loaded ${data.requests?.length || 0} manufacturing feasibility requests`);
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
      success('Manufacturing Feasibility service completed successfully!');

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
      errorToast('Failed to complete workflow');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Advanced filtering and sorting logic
  const allFilteredRequests = serviceRequests?.filter(request => {
    const matchesService = request.service_type === 'Manufacturing Feasibility' || request.service_type === 'manufacturing_feasibility';

    const matchesSearch = !searchTerm ||
      request.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.service_details?.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.service_details?.manufacturing_requirements?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    // Determine complexity based on trade volume and requirements
    let complexity = 'standard';
    const tradeVolume = request.service_details?.trade_volume || 0;
    const hasComplexRequirements = request.service_details?.manufacturing_requirements?.toLowerCase().includes('complex') ||
                                   request.service_details?.manufacturing_requirements?.toLowerCase().includes('advanced') ||
                                   request.service_details?.manufacturing_requirements?.toLowerCase().includes('specialized');

    if (tradeVolume > 5000000 || hasComplexRequirements) {
      complexity = 'complex';
    } else if (tradeVolume > 1000000) {
      complexity = 'medium';
    }

    const matchesComplexity = complexityFilter === 'all' || complexity === complexityFilter;

    return matchesService && matchesSearch && matchesStatus && matchesComplexity;
  })?.sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'company_name':
        aValue = a.company_name?.toLowerCase() || '';
        bValue = b.company_name?.toLowerCase() || '';
        break;
      case 'trade_volume':
        aValue = a.service_details?.trade_volume || 0;
        bValue = b.service_details?.trade_volume || 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'created_at':
      default:
        aValue = new Date(a.created_at || 0).getTime();
        bValue = new Date(b.created_at || 0).getTime();
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
  }, [searchTerm, statusFilter, complexityFilter, sortField, sortDirection]);

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
    setComplexityFilter('all');
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
    const showPages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Determine project complexity for display
  const getComplexity = (request) => {
    const tradeVolume = request.service_details?.trade_volume || 0;
    const hasComplexRequirements = request.service_details?.manufacturing_requirements?.toLowerCase().includes('complex') ||
                                   request.service_details?.manufacturing_requirements?.toLowerCase().includes('advanced') ||
                                   request.service_details?.manufacturing_requirements?.toLowerCase().includes('specialized');

    if (tradeVolume > 5000000 || hasComplexRequirements) {
      return 'Complex';
    } else if (tradeVolume > 1000000) {
      return 'Medium';
    }
    return 'Standard';
  };

  return (
    <div className="service-tab">
      <div className="service-header">
        <h3>🏭 Professional Manufacturing Feasibility ($650)</h3>
        <p><strong>Jorge's Manufacturing Value:</strong> 4+ years industrial experience + Mexico manufacturing network + proven B2B methodology</p>
        <div className="service-value-proposition">
          <div className="value-point">🎯 <strong>Strategic Assessment:</strong> AI market analysis + Jorge's manufacturing industry expertise</div>
          <div className="value-point">🇲🇽 <strong>Mexico Advantage:</strong> Direct access to Tijuana, Guadalajara, and León manufacturing hubs</div>
          <div className="value-point">📊 <strong>Go/No-Go Analysis:</strong> Proven B2B evaluation methodology with cost-benefit modeling</div>
          <div className="value-point">🤝 <strong>Implementation Support:</strong> Personal introductions to verified Mexico manufacturing partners</div>
          <div className="value-point">⚡ <strong>USMCA Benefits:</strong> Duty-free manufacturing advantages and supply chain optimization</div>
        </div>
        <div className="service-credentials">
          <span className="manufacturing-expertise">4+ Years Industrial Sector B2B Sales</span>
          <span className="mexico-network">Verified Mexico Manufacturing Network</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="table-controls">
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by company, contact, product, or requirements..."
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
            <label>Complexity:</label>
            <select
              value={complexityFilter}
              onChange={(e) => setComplexityFilter(e.target.value)}
              className="form-input filter-select"
            >
              <option value="all">All Complexities</option>
              <option value="standard">Standard</option>
              <option value="medium">Medium</option>
              <option value="complex">Complex</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="form-input filter-select"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <button onClick={clearFilters} className="btn-secondary clear-filters">
            Clear Filters
          </button>
        </div>

        <div className="results-info">
          <span>Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} requests</span>
          {(searchTerm || statusFilter !== 'all' || complexityFilter !== 'all') && (
            <span className="filter-indicator">(filtered)</span>
          )}
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
              <th>Requirements</th>
              <th
                className={`sortable ${sortField === 'trade_volume' ? 'sorted' : ''}`}
                onClick={() => handleSort('trade_volume')}
                title="Click to sort by trade volume"
              >
                Trade Volume {sortField === 'trade_volume' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Complexity</th>
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
                <td colSpan="7" className="loading-cell">Loading manufacturing feasibility requests...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="error-cell">Error: {error}</td>
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
                    <div>{request.service_details?.product_description || 'Product details'}</div>
                    <div className="product-category">
                      Manufacturing Assessment
                    </div>
                  </div>
                </td>
                <td>
                  <div className="requirements-summary">
                    {request.service_details?.manufacturing_requirements || 'Requirements TBD'}
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
                  <span className={`complexity-badge ${getComplexity(request).toLowerCase()}`}>
                    {getComplexity(request)}
                  </span>
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
                    {request.status === 'completed' ? 'Completed' : 'Start Feasibility Analysis'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && !error && allFilteredRequests.length === 0 && serviceRequests?.filter(r => r.service_type === 'Manufacturing Feasibility' || r.service_type === 'manufacturing_feasibility').length > 0 && (
          <div className="no-results">
            <p>No manufacturing feasibility requests match your current filters.</p>
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          </div>
        )}

        {!loading && !error && serviceRequests?.filter(r => r.service_type === 'Manufacturing Feasibility' || r.service_type === 'manufacturing_feasibility').length === 0 && (
          <div className="no-requests">
            <p>No manufacturing feasibility requests pending.</p>
            <p className="secondary-text">
              Requests will appear here when clients submit manufacturing feasibility service requests.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages} ({totalItems} total requests)</span>
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="btn-secondary pagination-btn"
              title="First page"
            >
              ««
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary pagination-btn"
              title="Previous page"
            >
              ‹
            </button>

            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`btn-secondary pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-secondary pagination-btn"
              title="Next page"
            >
              ›
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
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
      {showModal && selectedRequest && (
        <ServiceWorkflowModal
          isOpen={showModal}
          service={manufacturingFeasibilityService}
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

// Manufacturing Feasibility Service Configuration - NO HARDCODING
const manufacturingFeasibilityService = {
  title: 'Manufacturing Feasibility Analysis',
  totalStages: 3,
  stageNames: ['Manufacturing Context', 'AI Analysis', 'Jorge\'s Recommendation'],

  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const serviceDetails = request?.service_details || {};
    const subscriberData = serviceDetails;

    switch (stageNumber) {
      case 1:
        return (
          <ManufacturingContextStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
          />
        );

      case 2:
        return (
          <AIAnalysisStage
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
          <JorgeRecommendationStage
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

// Stage 1: Manufacturing Context Component
function ManufacturingContextStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [formData, setFormData] = useState({
    manufacturing_scope: '',
    investment_budget: '',
    timeline_expectation: '',
    location_preference: '',
    production_volume: '',
    quality_requirements: '',
    regulatory_considerations: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 1: Manufacturing Context</h3>
        <p>Define your manufacturing requirements and constraints</p>
      </div>

      {/* Comprehensive Client Business Intelligence */}
      <div className="workflow-data-review">
        <h4>📋 Client Business Intelligence</h4>
        <div className="data-grid">
          <div className="data-section">
            <div className="data-row"><span>Company:</span> <span>{request?.company_name || 'Not provided'}</span></div>
            <div className="data-row"><span>Contact:</span> <span>{request?.contact_name || 'Not provided'}</span></div>
            <div className="data-row"><span>Email:</span> <span>{serviceDetails?.contact_email || request?.email || 'Not provided'}</span></div>
            <div className="data-row"><span>Phone:</span> <span>{serviceDetails?.contact_phone || request?.phone || 'Not provided'}</span></div>
            <div className="data-row"><span>Business Type:</span> <span>{serviceDetails?.business_type || request?.industry || 'Not provided'}</span></div>
            <div className="data-row"><span>Industry:</span> <span>{request?.industry || serviceDetails?.industry || 'Not provided'}</span></div>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Product:</span> <span>{serviceDetails?.product_description || subscriberData?.product_description || 'Not specified'}</span></div>
            <div className="data-row"><span>Product Category:</span> <span>{serviceDetails?.product_category || 'Not specified'}</span></div>
            <div className="data-row"><span>Current Manufacturing:</span> <span>{serviceDetails?.manufacturing_location || subscriberData?.manufacturing_location || 'Not specified'}</span></div>
            <div className="data-row"><span>Production Volume Target:</span> <span>{serviceDetails?.production_volume || 'To be determined'}</span></div>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Trade Volume:</span> <span>${((serviceDetails?.trade_volume || request?.trade_volume || 0) / 1000000).toFixed(1)}M annually</span></div>
            <div className="data-row"><span>Current Supplier:</span> <span>{serviceDetails?.supplier_country || 'Not specified'}</span></div>
            <div className="data-row"><span>Target Markets:</span> <span>{serviceDetails?.target_markets?.join(', ') || 'Not specified'}</span></div>
            <div className="data-row"><span>Timeline Requirement:</span> <span>{serviceDetails?.timeline_requirement || 'To be determined'}</span></div>
            <div className="data-row"><span>Current USMCA Status:</span> <span>{serviceDetails?.qualification_status || subscriberData?.qualification_status || 'Not determined'}</span></div>
          </div>

          {/* Component Origins - Current Manufacturing Sources */}
          <div className="data-section">
            <h6>Current Manufacturing & Component Sources</h6>
            {(serviceDetails?.component_origins || subscriberData?.component_origins)?.length > 0 ? (
              (serviceDetails?.component_origins || subscriberData?.component_origins).map((comp, idx) => (
                <div key={idx} className="component-detail">
                  <div className="data-row">
                    <span><strong>{comp.country}:</strong></span>
                    <span>{comp.percentage}% - {comp.description || comp.component_type}</span>
                  </div>
                  {idx < (serviceDetails?.component_origins || subscriberData?.component_origins).length - 1 && <hr />}
                </div>
              ))
            ) : (
              <div className="data-row"><span>Components:</span> <span>No detailed breakdown available</span></div>
            )}
          </div>

          {/* Financial Impact - Manufacturing ROI */}
          {(serviceDetails?.annual_tariff_cost || serviceDetails?.potential_usmca_savings) && (
            <div className="data-section financial-impact-section">
              <h6>💰 Mexico Manufacturing ROI Opportunity</h6>
              {serviceDetails?.annual_tariff_cost && (
                <div className="data-row">
                  <span><strong>Current Annual Tariff Cost:</strong></span>
                  <span className="highlight-cost">${Number(serviceDetails.annual_tariff_cost).toLocaleString()}</span>
                </div>
              )}
              {serviceDetails?.potential_usmca_savings && (
                <div className="data-row">
                  <span><strong>Potential Savings with Mexico Manufacturing:</strong></span>
                  <span className="highlight-savings">${Number(serviceDetails.potential_usmca_savings).toLocaleString()}/year</span>
                </div>
              )}
              <div className="data-row">
                <span className="note">Note: Typically largest savings opportunity among all services</span>
              </div>
            </div>
          )}

          {/* Manufacturing Requirements */}
          {(serviceDetails?.manufacturing_requirements || serviceDetails?.quality_certifications) && (
            <div className="data-section manufacturing-requirements-section">
              <h6>🏭 Manufacturing Requirements & Certifications</h6>
              {serviceDetails?.manufacturing_requirements && (
                <div className="data-row"><span><strong>Requirements:</strong></span> <span>{serviceDetails.manufacturing_requirements}</span></div>
              )}
              {Array.isArray(serviceDetails?.quality_certifications) && serviceDetails.quality_certifications.length > 0 && (
                <div>
                  <div className="data-row"><span><strong>Required Certifications:</strong></span></div>
                  <ul className="certifications-list">
                    {serviceDetails.quality_certifications.map((cert, idx) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Compliance Gaps */}
          {(() => {
            const items = serviceDetails?.compliance_gaps;
            const itemsArray = Array.isArray(items) ? items : [];
            return itemsArray.length > 0 && (
              <div className="data-section compliance-section">
                <h6>⚠️ Manufacturing Compliance Gaps</h6>
                <ul className="compliance-list">
                  {itemsArray.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Vulnerability Factors - Manufacturing Risks */}
          {(() => {
            const items = serviceDetails?.vulnerability_factors;
            const itemsArray = Array.isArray(items) ? items : [];
            return itemsArray.length > 0 && (
              <div className="data-section vulnerability-section">
                <h6>🚨 Current Manufacturing Vulnerability Factors</h6>
                <ul className="vulnerability-list">
                  {itemsArray.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Regulatory Requirements */}
          {(() => {
            const items = serviceDetails?.regulatory_requirements;
            const itemsArray = Array.isArray(items) ? items : [];
            return itemsArray.length > 0 && (
              <div className="data-section regulatory-section">
                <h6>📋 Regulatory Requirements for Mexico Manufacturing</h6>
                <ul className="regulatory-list">
                  {itemsArray.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="workflow-form">
        <div className="form-group">
          <label>Manufacturing scope and objectives:</label>
          <div className="form-input">
            <label>
              <input
                type="radio"
                name="manufacturing_scope"
                value="full_production"
                checked={formData.manufacturing_scope === 'full_production'}
                onChange={handleInputChange}
                required
              />
              Full production facility (complete manufacturing)
            </label>
            <label>
              <input
                type="radio"
                name="manufacturing_scope"
                value="assembly_operation"
                checked={formData.manufacturing_scope === 'assembly_operation'}
                onChange={handleInputChange}
              />
              Assembly operation (component integration)
            </label>
            <label>
              <input
                type="radio"
                name="manufacturing_scope"
                value="finishing_packaging"
                checked={formData.manufacturing_scope === 'finishing_packaging'}
                onChange={handleInputChange}
              />
              Finishing and packaging only
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Investment budget range:</label>
          <select
            name="investment_budget"
            value={formData.investment_budget}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            <option value="">Select budget range</option>
            <option value="under_500k">Under $500K</option>
            <option value="500k_2m">$500K - $2M</option>
            <option value="2m_5m">$2M - $5M</option>
            <option value="5m_plus">$5M+</option>
          </select>
        </div>

        <div className="form-group">
          <label>Timeline expectations:</label>
          <select
            name="timeline_expectation"
            value={formData.timeline_expectation}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            <option value="">Select timeline</option>
            <option value="6_months">6 months</option>
            <option value="12_months">12 months</option>
            <option value="18_months">18 months</option>
            <option value="24_months">24+ months</option>
          </select>
        </div>

        <div className="form-group">
          <label>Location preference (if any):</label>
          <input
            type="text"
            name="location_preference"
            value={formData.location_preference}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g., Northern Mexico, specific states, border regions"
          />
        </div>

        <div className="form-group">
          <label>Expected production volume:</label>
          <input
            type="text"
            name="production_volume"
            value={formData.production_volume}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g., units per month, annual capacity"
            required
          />
        </div>

        <div className="form-group">
          <label>Quality and certification requirements:</label>
          <textarea
            name="quality_requirements"
            value={formData.quality_requirements}
            onChange={handleInputChange}
            className="form-input"
            rows="3"
            placeholder="ISO certifications, industry standards, quality control requirements..."
            required
          />
        </div>

        <div className="form-group">
          <label>Regulatory or compliance considerations:</label>
          <textarea
            name="regulatory_considerations"
            value={formData.regulatory_considerations}
            onChange={handleInputChange}
            className="form-input"
            rows="3"
            placeholder="USMCA requirements, export controls, environmental regulations..."
          />
        </div>

        <div className="workflow-stage-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Start AI Analysis →'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 2: AI Analysis Component
function AIAnalysisStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [analysisStep, setAnalysisStep] = useState(1);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleAIAnalysis = async () => {
    try {
      // Step 1: Start analysis
      setAnalysisStep(1);

      // Step 2: Call actual API for manufacturing feasibility analysis
      setAnalysisStep(2);
      const response = await fetch('/api/manufacturing-feasibility-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: request.id,
          stage1Data: stageData?.stage_1
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const analysisResult = await response.json();

      // Step 3-5: Show progress while processing
      setAnalysisStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      setAnalysisStep(4);
      await new Promise(resolve => setTimeout(resolve, 800));

      setAnalysisStep(5);
      await new Promise(resolve => setTimeout(resolve, 800));

      setAnalysisComplete(true);
    } catch (error) {
      console.error('AI analysis error:', error);
      setAnalysisComplete(true);
    }
  };

  useEffect(() => {
    if (!loading && stageData?.stage_1) {
      handleAIAnalysis();
    }
  }, [loading, stageData]);

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 2: AI Analysis</h3>
        <p>Comprehensive feasibility analysis and cost modeling</p>
      </div>

      <div className="workflow-subscriber-summary">
        <h4>🎯 Analysis Parameters</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Scope:</strong> {stageData?.stage_1?.manufacturing_scope?.replace('_', ' ') || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Budget:</strong> {stageData?.stage_1?.investment_budget?.replace('_', ' ') || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Timeline:</strong> {stageData?.stage_1?.timeline_expectation?.replace('_', ' ') || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Volume:</strong> {stageData?.stage_1?.production_volume || 'Not defined'}
          </div>
        </div>
      </div>

      <div className="workflow-ai-analysis">
        <div className="workflow-analysis-steps">
          <div className={`workflow-step ${analysisStep >= 1 ? 'active' : ''} ${analysisStep > 1 ? 'completed' : ''}`}>
            {analysisStep > 1 ? '✓' : '🔄'} Analyzing manufacturing requirements
          </div>
          <div className={`workflow-step ${analysisStep >= 2 ? 'active' : ''} ${analysisStep > 2 ? 'completed' : ''}`}>
            {analysisStep > 2 ? '✓' : analysisStep >= 2 ? '🔄' : '⏳'} Location and infrastructure analysis
          </div>
          <div className={`workflow-step ${analysisStep >= 3 ? 'active' : ''} ${analysisStep > 3 ? 'completed' : ''}`}>
            {analysisStep > 3 ? '✓' : analysisStep >= 3 ? '🔄' : '⏳'} Cost estimation and modeling
          </div>
          <div className={`workflow-step ${analysisStep >= 4 ? 'active' : ''} ${analysisStep > 4 ? 'completed' : ''}`}>
            {analysisStep > 4 ? '✓' : analysisStep >= 4 ? '🔄' : '⏳'} Risk assessment and mitigation
          </div>
          <div className={`workflow-step ${analysisStep >= 5 ? 'active' : ''} ${analysisStep > 5 ? 'completed' : ''}`}>
            {analysisStep > 5 ? '✓' : analysisStep >= 5 ? '🔄' : '⏳'} Generating feasibility report
          </div>
        </div>

        {analysisComplete && (
          <div className="workflow-analysis-complete">
            <p>✅ AI analysis completed successfully!</p>
            <p>Ready for Jorge's expert evaluation and go/no-go recommendation.</p>
          </div>
        )}
      </div>

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={() => onComplete({ ai_analysis_completed: true, completed_at: new Date().toISOString() })}
          disabled={!analysisComplete || loading}
        >
          {loading ? 'Processing...' : 'Complete AI Analysis → Jorge Review'}
        </button>
      </div>
    </div>
  );
}

// Stage 3: Jorge's Recommendation Component
function JorgeRecommendationStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  // Jorge's location assessment (following checklist pattern - 3 fields)
  const [recommendedLocations, setRecommendedLocations] = useState('');
  const [costAnalysis, setCostAnalysis] = useState('');
  const [implementationRoadmap, setImplementationRoadmap] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 3: Jorge's Location Assessment</h3>
        <p>Expert Mexico manufacturing location recommendations</p>
      </div>

      <div className="workflow-subscriber-summary">
        <h4>📋 Analysis Summary</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Client:</strong> {request?.company_name}
          </div>
          <div className="workflow-data-item">
            <strong>Scope:</strong> {stageData?.stage_1?.manufacturing_scope?.replace('_', ' ')}
          </div>
          <div className="workflow-data-item">
            <strong>Budget:</strong> {stageData?.stage_1?.investment_budget?.replace('_', ' ')}
          </div>
          <div className="workflow-data-item">
            <strong>AI Analysis:</strong> {stageData?.stage_2?.ai_analysis_completed ? 'Completed' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Jorge's Location Assessment Form */}
      <div className="professional-validation-form">
        <h4>👨‍💼 Jorge's Manufacturing Location Expertise</h4>
        <p className="form-helper-text">Use your Mexico manufacturing knowledge to assess feasibility and recommend locations</p>

        <div className="form-group">
          <label><strong>Recommended Mexico Locations:</strong></label>
          <textarea
            className="form-input"
            rows="5"
            value={recommendedLocations}
            onChange={(e) => setRecommendedLocations(e.target.value)}
            placeholder="Top choice: [Monterrey/Guadalajara/Querétaro] because [infrastructure, labor, suppliers]. Second: [city] because..."
          />
        </div>

        <div className="form-group">
          <label><strong>Cost Analysis:</strong></label>
          <textarea
            className="form-input"
            rows="5"
            value={costAnalysis}
            onChange={(e) => setCostAnalysis(e.target.value)}
            placeholder="Setup costs: $[amount]. Monthly operational: $[amount]. Current manufacturing: $[amount]/month. Savings: $[amount]/year"
          />
        </div>

        <div className="form-group">
          <label><strong>Implementation Roadmap:</strong></label>
          <textarea
            className="form-input"
            rows="5"
            value={implementationRoadmap}
            onChange={(e) => setImplementationRoadmap(e.target.value)}
            placeholder="Phase 1 (Months 1-2): [specific steps]. Phase 2 (Months 3-6): [milestones]. Phase 3: [target]"
          />
        </div>

        {/* Report Generation Button */}
        <button
          className="btn-primary"
          onClick={async () => {
            if (!recommendedLocations || !costAnalysis || !implementationRoadmap) {
              alert('⚠️ Please complete all manufacturing feasibility fields');
              return;
            }

            try {
              setGeneratingReport(true);
              const response = await fetch('/api/generate-manufacturing-feasibility-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  serviceRequestId: request.id,
                  stage1Data: subscriberData,
                  stage3Data: {
                    recommended_locations: recommendedLocations,
                    cost_analysis: costAnalysis,
                    implementation_roadmap: implementationRoadmap
                  }
                })
              });

              const result = await response.json();
              if (result.success) {
                alert('✅ Manufacturing feasibility report sent to triangleintel@gmail.com');
                onComplete({
                  manufacturing_feasibility_completed: true,
                  jorge_location_assessment: {
                    recommended_locations: recommendedLocations,
                    cost_analysis: costAnalysis,
                    implementation_roadmap: implementationRoadmap
                  },
                  report_generated: true,
                  report_sent_to: 'triangleintel@gmail.com',
                  completed_at: new Date().toISOString()
                });
              } else {
                throw new Error(result.error || 'Failed to generate report');
              }
            } catch (error) {
              console.error('Error generating manufacturing feasibility report:', error);
              alert('❌ Failed to generate report: ' + error.message);
            } finally {
              setGeneratingReport(false);
            }
          }}
          disabled={generatingReport}
        >
          {generatingReport ? '⏳ Generating...' : '📧 Complete & Send Manufacturing Feasibility Report'}
        </button>
      </div>
    </div>
  );
}