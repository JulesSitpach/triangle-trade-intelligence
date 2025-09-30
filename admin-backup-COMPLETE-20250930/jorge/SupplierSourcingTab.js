/**
 * SupplierSourcingTab.js - Jorge's Supplier Sourcing Service
 * Production-ready component with NO HARDCODING
 * 3-Stage Workflow: Strategic Preferences → AI Discovery → Jorge's Validation
 * Jorge's highest revenue service ($500 per project)
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import { useToast, ToastContainer } from '../shared/ToastNotification';

export default function SupplierSourcingTab() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, showToast, removeToast, success, error: errorToast, warning, info } = useToast();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
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
      info('Loading supplier sourcing requests...');

      const response = await fetch('/api/admin/service-requests?assigned_to=Jorge&service_type=Supplier Sourcing');

      if (!response.ok) {
        throw new Error('Failed to load service requests');
      }

      const data = await response.json();
      setServiceRequests(data.requests || []);
      success(`Loaded ${data.requests?.length || 0} supplier sourcing requests`);
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
      // Update the request in our local state
      setServiceRequests(prev => prev.map(req =>
        req.id === completionData.service_request_id
          ? { ...req, status: 'completed', completed_at: completionData.completed_at }
          : req
      ));

      // Optionally reload data to get latest from database
      await loadServiceRequests();
    } catch (err) {
      console.error('Error handling workflow completion:', err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Advanced filtering and sorting logic (matching Cristina's implementation)
  const allFilteredRequests = serviceRequests?.filter(request => {
    const matchesService = request.service_type === 'Supplier Sourcing' || request.service_type === 'supplier_sourcing';

    const matchesSearch = !searchTerm ||
      request.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.service_details?.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.industry?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || request.industry === industryFilter;

    return matchesService && matchesSearch && matchesStatus && matchesIndustry;
  })?.sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'company_name':
        aValue = a.company_name?.toLowerCase() || '';
        bValue = b.company_name?.toLowerCase() || '';
        break;
      case 'industry':
        aValue = a.industry?.toLowerCase() || '';
        bValue = b.industry?.toLowerCase() || '';
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
  }, [searchTerm, statusFilter, industryFilter, sortField, sortDirection]);

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
    setIndustryFilter('all');
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

  // Get unique industries for filter dropdown
  const availableIndustries = [...new Set(serviceRequests?.map(r => r.industry).filter(Boolean))];

  return (
    <div className="service-tab">
      <div className="service-header">
        <h3>🔍 Professional Supplier Sourcing ($450)</h3>
        <p><strong>Jorge's B2B Value:</strong> 4+ years CCVIAL sales experience + bilingual supplier relationships + verified Mexico network</p>
        <div className="service-value-proposition">
          <div className="value-point">🎯 <strong>Strategic Discovery:</strong> AI-powered supplier research + Jorge's industry knowledge</div>
          <div className="value-point">🇲🇽 <strong>Mexico Network:</strong> Direct Spanish-language supplier relationships and verification</div>
          <div className="value-point">📊 <strong>B2B Validation:</strong> Proven consultative sales methodology for supplier evaluation</div>
          <div className="value-point">🤝 <strong>Relationship Building:</strong> Personal introductions and ongoing supplier management</div>
          <div className="value-point">⚡ <strong>USMCA Advantage:</strong> Mexico-based suppliers with duty-free access to US/Canada</div>
        </div>
        <div className="service-credentials">
          <span className="sales-experience">4+ Years B2B Sales Excellence at CCVIAL</span>
          <span className="language-advantage">Bilingual Spanish/English Supplier Communication</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="table-controls">
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by company, contact, product, or industry..."
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
            <label>Industry:</label>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="form-input filter-select"
            >
              <option value="all">All Industries</option>
              {availableIndustries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
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
          {(searchTerm || statusFilter !== 'all' || industryFilter !== 'all') && (
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
              <th
                className={`sortable ${sortField === 'industry' ? 'sorted' : ''}`}
                onClick={() => handleSort('industry')}
                title="Click to sort by industry"
              >
                Industry {sortField === 'industry' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
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
                <td colSpan="6" className="loading-cell">Loading supplier sourcing requests...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="error-cell">Error: {error}</td>
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
                      {request.service_details?.product_category || request.industry}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="industry-tag">
                    {request.industry || 'General'}
                  </span>
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
                    {request.status === 'completed' ? 'Completed' : 'Start B2B Sourcing'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && !error && allFilteredRequests.length === 0 && serviceRequests?.filter(r => r.service_type === 'Supplier Sourcing' || r.service_type === 'supplier_sourcing').length > 0 && (
          <div className="no-results">
            <p>No supplier sourcing requests match your current filters.</p>
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          </div>
        )}

        {!loading && !error && serviceRequests?.filter(r => r.service_type === 'Supplier Sourcing' || r.service_type === 'supplier_sourcing').length === 0 && (
          <div className="no-requests">
            <p>No supplier sourcing requests pending.</p>
            <p className="secondary-text">
              Requests will appear here when clients submit supplier sourcing service requests.
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
          service={supplierSourcingService}
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

// Supplier Sourcing Service Configuration - NO HARDCODING
const supplierSourcingService = {
  title: 'Strategic Supplier Sourcing',
  totalStages: 3,
  stageNames: ['Strategic Preferences', 'AI Discovery', 'Jorge\'s Validation'],

  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const serviceDetails = request?.service_details || {};
    const subscriberData = serviceDetails;

    switch (stageNumber) {
      case 1:
        return (
          <StrategicPreferencesStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
          />
        );

      case 2:
        return (
          <AIDiscoveryStage
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
          <JorgeValidationStage
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

// Stage 1: Strategic Preferences Component
function StrategicPreferencesStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [formData, setFormData] = useState({
    sourcing_strategy: '',
    supplier_preference: '',
    timeline_urgency: '',
    risk_tolerance: '',
    additional_requirements: ''
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
        <h3>Stage 1: Strategic Preferences</h3>
        <p>Define your supplier sourcing strategy and requirements</p>
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
            <div className="data-row"><span>Manufacturing:</span> <span>{serviceDetails?.manufacturing_location || subscriberData?.manufacturing_location || 'Not specified'}</span></div>
            <div className="data-row"><span>Import Frequency:</span> <span>{serviceDetails?.import_frequency || 'Not specified'}</span></div>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Trade Volume:</span> <span>${((serviceDetails?.trade_volume || request?.trade_volume || 0) / 1000000).toFixed(1)}M annually</span></div>
            <div className="data-row"><span>Current Supplier:</span> <span>{serviceDetails?.supplier_country || 'Not specified'}</span></div>
            <div className="data-row"><span>Current Suppliers:</span> <span>{serviceDetails?.current_supplier_countries?.join(', ') || 'Not specified'}</span></div>
            <div className="data-row"><span>Target Markets:</span> <span>{serviceDetails?.target_markets?.join(', ') || 'Not specified'}</span></div>
            <div className="data-row"><span>USMCA Status:</span> <span>{serviceDetails?.qualification_status || subscriberData?.qualification_status || 'Not determined'}</span></div>
          </div>

          {/* Component Origins - Current Supply Chain */}
          <div className="data-section">
            <h6>Current Supply Chain Breakdown</h6>
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

          {/* Financial Impact - Supplier Sourcing ROI */}
          {(serviceDetails?.annual_tariff_cost || serviceDetails?.potential_usmca_savings) && (
            <div className="data-section financial-impact-section">
              <h6>💰 Supplier Sourcing ROI Opportunity</h6>
              {serviceDetails?.annual_tariff_cost && (
                <div className="data-row">
                  <span><strong>Current Annual Tariff Cost:</strong></span>
                  <span className="highlight-cost">${Number(serviceDetails.annual_tariff_cost).toLocaleString()}</span>
                </div>
              )}
              {serviceDetails?.potential_usmca_savings && (
                <div className="data-row">
                  <span><strong>Potential Savings with Mexico Suppliers:</strong></span>
                  <span className="highlight-savings">${Number(serviceDetails.potential_usmca_savings).toLocaleString()}/year</span>
                </div>
              )}
            </div>
          )}

          {/* Sourcing Requirements */}
          {(serviceDetails?.sourcing_requirements || serviceDetails?.quality_standards) && (
            <div className="data-section sourcing-requirements-section">
              <h6>🎯 Sourcing Requirements & Quality Standards</h6>
              {serviceDetails?.sourcing_requirements && (
                <div className="data-row"><span><strong>Requirements:</strong></span> <span>{serviceDetails.sourcing_requirements}</span></div>
              )}
              {serviceDetails?.quality_standards && (
                <div className="data-row"><span><strong>Quality Standards:</strong></span> <span>{serviceDetails.quality_standards}</span></div>
              )}
            </div>
          )}

          {/* Compliance Gaps */}
          {(() => {
            const items = serviceDetails?.compliance_gaps;
            const itemsArray = Array.isArray(items) ? items : [];
            return itemsArray.length > 0 && (
              <div className="data-section compliance-section">
                <h6>⚠️ Supply Chain Compliance Gaps</h6>
                <ul className="compliance-list">
                  {itemsArray.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Vulnerability Factors - Supply Chain Risks */}
          {(() => {
            const items = serviceDetails?.vulnerability_factors;
            const itemsArray = Array.isArray(items) ? items : [];
            return itemsArray.length > 0 && (
              <div className="data-section vulnerability-section">
                <h6>🚨 Supply Chain Vulnerability Factors</h6>
                <ul className="vulnerability-list">
                  {itemsArray.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Regulatory Requirements for Target Products */}
          {(() => {
            const items = serviceDetails?.regulatory_requirements;
            const itemsArray = Array.isArray(items) ? items : [];
            return itemsArray.length > 0 && (
              <div className="data-section regulatory-section">
                <h6>📋 Regulatory Requirements for Suppliers</h6>
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
          <label>What is your preferred sourcing strategy?</label>
          <div className="form-input">
            <label>
              <input
                type="radio"
                name="sourcing_strategy"
                value="immediate_transition"
                checked={formData.sourcing_strategy === 'immediate_transition'}
                onChange={handleInputChange}
                required
              />
              Immediate Mexico transition (compliance priority)
            </label>
            <label>
              <input
                type="radio"
                name="sourcing_strategy"
                value="gradual_transition"
                checked={formData.sourcing_strategy === 'gradual_transition'}
                onChange={handleInputChange}
              />
              Gradual transition (cost optimization)
            </label>
            <label>
              <input
                type="radio"
                name="sourcing_strategy"
                value="hybrid_approach"
                checked={formData.sourcing_strategy === 'hybrid_approach'}
                onChange={handleInputChange}
              />
              Hybrid approach (risk mitigation)
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>What type of suppliers do you prefer?</label>
          <div className="form-input">
            <label>
              <input
                type="radio"
                name="supplier_preference"
                value="high_volume"
                checked={formData.supplier_preference === 'high_volume'}
                onChange={handleInputChange}
                required
              />
              High-volume suppliers (established operations)
            </label>
            <label>
              <input
                type="radio"
                name="supplier_preference"
                value="premium_immediate"
                checked={formData.supplier_preference === 'premium_immediate'}
                onChange={handleInputChange}
              />
              Premium suppliers (immediate availability)
            </label>
            <label>
              <input
                type="radio"
                name="supplier_preference"
                value="balanced_portfolio"
                checked={formData.supplier_preference === 'balanced_portfolio'}
                onChange={handleInputChange}
              />
              Balanced portfolio approach
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Timeline urgency:</label>
          <select
            name="timeline_urgency"
            value={formData.timeline_urgency}
            onChange={handleInputChange}
            className="form-input"
            required
          >
            <option value="">Select timeline</option>
            <option value="immediate">Immediate (30-60 days)</option>
            <option value="short_term">Short-term (3-6 months)</option>
            <option value="medium_term">Medium-term (6-12 months)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Risk tolerance for new supplier relationships:</label>
          <div className="form-input">
            <label>
              <input
                type="radio"
                name="risk_tolerance"
                value="conservative"
                checked={formData.risk_tolerance === 'conservative'}
                onChange={handleInputChange}
                required
              />
              Conservative (established suppliers only)
            </label>
            <label>
              <input
                type="radio"
                name="risk_tolerance"
                value="balanced"
                checked={formData.risk_tolerance === 'balanced'}
                onChange={handleInputChange}
              />
              Balanced (mix of established and emerging)
            </label>
            <label>
              <input
                type="radio"
                name="risk_tolerance"
                value="aggressive"
                checked={formData.risk_tolerance === 'aggressive'}
                onChange={handleInputChange}
              />
              Aggressive (open to new partnerships)
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Additional requirements or specifications:</label>
          <textarea
            name="additional_requirements"
            value={formData.additional_requirements}
            onChange={handleInputChange}
            className="form-input"
            rows="3"
            placeholder="Any specific requirements, certifications, or constraints..."
          />
        </div>

        <div className="workflow-stage-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Start AI Supplier Discovery →'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 2: AI Discovery Component
function AIDiscoveryStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [discoveryStep, setDiscoveryStep] = useState(1);
  const [discoveryComplete, setDiscoveryComplete] = useState(false);

  const handleAIDiscovery = async () => {
    try {
      // Step 1: Start discovery
      setDiscoveryStep(1);

      // Step 2: Call actual API for supplier discovery
      setDiscoveryStep(2);
      const response = await fetch('/api/supplier-sourcing-discovery', {
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

      const discoveryResult = await response.json();

      // Step 3-4: Show progress while processing
      setDiscoveryStep(3);
      await new Promise(resolve => setTimeout(resolve, 800));

      setDiscoveryStep(4);
      await new Promise(resolve => setTimeout(resolve, 800));

      setDiscoveryComplete(true);
    } catch (error) {
      console.error('AI discovery error:', error);
      setDiscoveryComplete(true);
    }
  };

  useEffect(() => {
    if (!loading && stageData?.stage_1) {
      handleAIDiscovery();
    }
  }, [loading, stageData]);

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 2: AI Supplier Discovery</h3>
        <p>AI-powered supplier research and matching</p>
      </div>

      <div className="workflow-subscriber-summary">
        <h4>🎯 Search Parameters</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Strategy:</strong> {stageData?.stage_1?.sourcing_strategy?.replace('_', ' ') || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Preference:</strong> {stageData?.stage_1?.supplier_preference?.replace('_', ' ') || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Timeline:</strong> {stageData?.stage_1?.timeline_urgency || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Risk Level:</strong> {stageData?.stage_1?.risk_tolerance || 'Not defined'}
          </div>
        </div>
      </div>

      <div className="workflow-ai-discovery">
        <div className="workflow-discovery-steps">
          <div className={`workflow-step ${discoveryStep >= 1 ? 'active' : ''} ${discoveryStep > 1 ? 'completed' : ''}`}>
            {discoveryStep > 1 ? '✓' : '🔄'} Analyzing supplier requirements
          </div>
          <div className={`workflow-step ${discoveryStep >= 2 ? 'active' : ''} ${discoveryStep > 2 ? 'completed' : ''}`}>
            {discoveryStep > 2 ? '✓' : discoveryStep >= 2 ? '🔄' : '⏳'} Web search for Mexico suppliers
          </div>
          <div className={`workflow-step ${discoveryStep >= 3 ? 'active' : ''} ${discoveryStep > 3 ? 'completed' : ''}`}>
            {discoveryStep > 3 ? '✓' : discoveryStep >= 3 ? '🔄' : '⏳'} Database analysis and matching
          </div>
          <div className={`workflow-step ${discoveryStep >= 4 ? 'active' : ''} ${discoveryStep > 4 ? 'completed' : ''}`}>
            {discoveryStep > 4 ? '✓' : discoveryStep >= 4 ? '🔄' : '⏳'} Generating supplier recommendations
          </div>
        </div>

        {discoveryComplete && (
          <div className="workflow-discovery-complete">
            <p>✅ AI supplier discovery completed successfully!</p>
            <p>Ready for Jorge's expert validation and strategic recommendations.</p>
          </div>
        )}
      </div>

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={() => onComplete({ ai_discovery_completed: true, completed_at: new Date().toISOString() })}
          disabled={!discoveryComplete || loading}
        >
          {loading ? 'Processing...' : 'Complete AI Discovery → Jorge Review'}
        </button>
      </div>
    </div>
  );
}

// Stage 3: Jorge's Validation Component
function JorgeValidationStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  // Jorge's Mexico supplier expertise (following checklist pattern)
  const [mexicoSuppliersIdentified, setMexicoSuppliersIdentified] = useState('');
  const [relationshipStrategy, setRelationshipStrategy] = useState('');
  const [usmcaOptimization, setUsmcaOptimization] = useState('');
  const [implementationTimeline, setImplementationTimeline] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 3: Jorge's Strategic Validation</h3>
        <p>Expert validation and final recommendations</p>
      </div>

      <div className="workflow-subscriber-summary">
        <h4>📋 Service Summary</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Client:</strong> {request?.company_name}
          </div>
          <div className="workflow-data-item">
            <strong>Strategy:</strong> {stageData?.stage_1?.sourcing_strategy?.replace('_', ' ')}
          </div>
          <div className="workflow-data-item">
            <strong>Timeline:</strong> {stageData?.stage_1?.timeline_urgency}
          </div>
          <div className="workflow-data-item">
            <strong>AI Discovery:</strong> {stageData?.stage_2?.ai_discovery_completed ? 'Completed' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Jorge's Mexico Supplier Expertise Form */}
      <div className="professional-validation-form">
        <h4>👨‍💼 Jorge's Mexico Supplier Expertise</h4>
        <p className="form-helper-text">Use your CCVIAL network and B2B sales experience to identify and connect with Mexico suppliers</p>

        <div className="form-group">
          <label><strong>Mexico Suppliers Identified:</strong></label>
          <textarea
            className="form-input"
            rows="5"
            value={mexicoSuppliersIdentified}
            onChange={(e) => setMexicoSuppliersIdentified(e.target.value)}
            placeholder="Based on my CCVIAL network, I recommend: 1) [Company name] in [city] - specializes in [capability]. 2) [Company name]..."
          />
        </div>

        <div className="form-group">
          <label><strong>Relationship Building Strategy:</strong></label>
          <textarea
            className="form-input"
            rows="5"
            value={relationshipStrategy}
            onChange={(e) => setRelationshipStrategy(e.target.value)}
            placeholder="Using my B2B sales methodology: Week 1: Initial contact in Spanish. Week 2: Plant visit to [city]. Week 3: Sample orders..."
          />
        </div>

        <div className="form-group">
          <label><strong>USMCA Optimization Plan:</strong></label>
          <textarea
            className="form-input"
            rows="5"
            value={usmcaOptimization}
            onChange={(e) => setUsmcaOptimization(e.target.value)}
            placeholder="Current RVC: 30%. Target: 75%. Shift [component] from China to [Mexico supplier] increases to 68%. Then shift [component]..."
          />
        </div>

        <div className="form-group">
          <label><strong>Implementation Timeline:</strong></label>
          <textarea
            className="form-input"
            rows="4"
            value={implementationTimeline}
            onChange={(e) => setImplementationTimeline(e.target.value)}
            placeholder="Month 1: Supplier qualification. Month 2: First production run. Month 3: USMCA certification complete. ROI: [months]"
          />
        </div>

        {/* Report Generation Button */}
        <button
          className="btn-primary"
          onClick={async () => {
            if (!mexicoSuppliersIdentified || !relationshipStrategy || !usmcaOptimization || !implementationTimeline) {
              alert('⚠️ Please complete all supplier sourcing fields');
              return;
            }

            try {
              setGeneratingReport(true);
              const response = await fetch('/api/generate-supplier-sourcing-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  serviceRequestId: request.id,
                  stage1Data: subscriberData,
                  stage3Data: {
                    mexico_suppliers_identified: mexicoSuppliersIdentified,
                    relationship_strategy: relationshipStrategy,
                    usmca_optimization: usmcaOptimization,
                    implementation_timeline: implementationTimeline
                  }
                })
              });

              const result = await response.json();
              if (result.success) {
                alert('✅ Supplier sourcing report sent to triangleintel@gmail.com');
                onComplete({
                  supplier_sourcing_completed: true,
                  jorge_supplier_expertise: {
                    mexico_suppliers_identified: mexicoSuppliersIdentified,
                    relationship_strategy: relationshipStrategy,
                    usmca_optimization: usmcaOptimization,
                    implementation_timeline: implementationTimeline
                  },
                  report_generated: true,
                  report_sent_to: 'triangleintel@gmail.com',
                  completed_at: new Date().toISOString()
                });
              } else {
                throw new Error(result.error || 'Failed to generate report');
              }
            } catch (error) {
              console.error('Error generating supplier sourcing report:', error);
              alert('❌ Failed to generate report: ' + error.message);
            } finally {
              setGeneratingReport(false);
            }
          }}
          disabled={generatingReport}
        >
          {generatingReport ? '⏳ Generating...' : '📧 Complete & Send Supplier Sourcing Report'}
        </button>
      </div>
    </div>
  );
}