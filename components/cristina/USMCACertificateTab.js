/**
 * USMCACertificateTab.js - Cristina's Professional USMCA Certificate Service
 * Production-ready component leveraging 17 years customs broker expertise
 * 3-Stage Professional Workflow: Regulatory Assessment → Expert Validation → Professional Certification
 * Licensed customs broker (License #4601913) professional validation
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import { useToast, ToastContainer } from '../shared/ToastNotification';

export default function USMCACertificateTab() {
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
      info('Loading USMCA certificate requests...');

      const response = await fetch('/api/admin/service-requests?assigned_to=Cristina&service_type=USMCA Certificates');

      if (!response.ok) {
        throw new Error('Failed to load service requests');
      }

      const data = await response.json();
      setServiceRequests(data.requests || []);
      success(`Loaded ${data.requests?.length || 0} USMCA certificate requests`);
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

  // Filter and sort functions
  const allFilteredRequests = serviceRequests?.filter(request => {
    // Filter by service type
    if (!(request.service_type === 'USMCA Certificates' || request.service_type === 'usmca-certificate')) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const companyMatch = request.company_name?.toLowerCase().includes(searchLower);
      const productMatch = request.service_details?.product_description?.toLowerCase().includes(searchLower);
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
      <div className="service-header">
        <h3>📜 Professional USMCA Certificates ($250)</h3>
        <p><strong>Professional Value:</strong> Component-by-component HS analysis + industry expertise + professional guarantee + ongoing support</p>
        <div className="service-value-proposition">
          <div className="value-point">🎯 <strong>Professional Analysis:</strong> Licensed customs broker reviews each component individually</div>
          <div className="value-point">🏭 <strong>Industry Expertise:</strong> 17 years electronics/telecom experience identifies hidden risks</div>
          <div className="value-point">⚖️ <strong>Professional Guarantee:</strong> Backed by customs broker license & liability insurance</div>
          <div className="value-point">📞 <strong>Ongoing Support:</strong> 90-day consultation for implementation & CBP questions</div>
          <div className="value-point">📋 <strong>Complete Package:</strong> Certificate + analysis + templates + training materials</div>
        </div>
        <div className="service-credentials">
          <span className="broker-license">Licensed Customs Broker #4601913</span>
          <span className="experience">17 Years Electronics/Telecom Trade Experience</span>
        </div>
      </div>

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
              <th
                className={`sortable ${sortField === 'product' ? 'sorted' : ''}`}
                onClick={() => handleSort('product')}
                title="Click to sort by product type"
              >
                Product Type {sortField === 'product' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>HS Classification</th>
              <th
                className={`sortable ${sortField === 'risk_level' ? 'sorted' : ''}`}
                onClick={() => handleSort('risk_level')}
                title="Click to sort by risk level"
              >
                Risk Level {sortField === 'risk_level' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
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
                <td colSpan="6" className="loading-cell">Loading service requests...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="error-cell">Error: {error}</td>
              </tr>
            ) : paginatedRequests.map((request) => {
              // Determine risk level based on product and components
              const riskLevel = determineRiskLevel(request);

              return (
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
                      <div className="component-count">
                        {request.service_details?.component_count || request.service_details?.component_origins?.length || 0} components
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="hs-code-status">
                      {request.service_details?.current_hs_code || 'Needs Classification'}
                      {!request.service_details?.current_hs_code && (
                        <div className="classification-needed">⚠️ Classification Required</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`risk-badge ${riskLevel.toLowerCase()}`}>
                      {riskLevel}
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
                      {request.status === 'completed' ? 'Completed' : 'Start Professional Review'}
                    </button>
                  </td>
                </tr>
              );
            })}
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
          service={usmcaCertificateService}
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
  const uniqueCountries = [...new Set(origins.map(c => c.country))];
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

// Professional USMCA Certificate Service Configuration - Real Professional Value
const usmcaCertificateService = {
  title: 'Professional USMCA Certificate with Expert Analysis & Ongoing Support',
  totalStages: 3,
  stageNames: ['Professional Certificate Validation', 'Certificate Correction & Regeneration', 'Final Professional Delivery'],

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
          />
        );

      case 2:
        return (
          <CertificateCorrectionStage
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
          <FinalProfessionalDeliveryStage
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

// Stage 1: Professional Data Review & Enhancement - Where Cristina's Expertise Actually Matters
function RegulatoryAssessmentStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
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

  const handleSubmit = () => {
    onComplete({
      professional_data_review: dataReview,
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
        <h3>Stage 1: Professional Certificate Validation</h3>
        <p><strong>Quality control and professional backing for existing certificate</strong></p>
        <div className="expert-credentials">
          ✅ Spot Check Certificate | ⚖️ Professional Liability Assessment | 🛡️ Risk Validation
        </div>
      </div>

      <div className="certificate-validation-section">
        <h4>📋 Client Data Review</h4>

        <div className="certificate-actions">
          <button
            className="btn-secondary certificate-toggle-btn"
            onClick={() => setShowOriginalCertificate(!showOriginalCertificate)}
          >
            📄 {showOriginalCertificate ? 'Hide' : 'View'} Client's Original Certificate
          </button>
          <span className="helper-text">
            Review what the client received from AI before professional validation
          </span>
        </div>

        {showOriginalCertificate && workflowData?.certificate && (
          <div className="original-certificate-display">
            <h5>🏛️ Client's Original USMCA Certificate</h5>
            <div className="certificate-content">
              <div className="cert-section">
                <h6>Certificate Information</h6>
                <div className="data-row"><span>Certificate Number:</span> <span>{workflowData.certificate.certificate_number || workflowData.certificate.id}</span></div>
                <div className="data-row"><span>Issue Date:</span> <span>{workflowData.certificate.blanket_start || new Date().toLocaleDateString()}</span></div>
                <div className="data-row"><span>Valid Until:</span> <span>{workflowData.certificate.blanket_end || 'One year from issue'}</span></div>
              </div>

              <div className="cert-section">
                <h6>Exporter Information</h6>
                <div className="data-row"><span>Company Name:</span> <span>{workflowData.certificate.exporter_name || workflowData.company_name}</span></div>
                <div className="data-row"><span>Address:</span> <span>{workflowData.certificate.exporter_address || workflowData.company_address}</span></div>
                <div className="data-row"><span>Tax ID:</span> <span>{workflowData.certificate.exporter_tax_id || workflowData.tax_id}</span></div>
              </div>

              <div className="cert-section">
                <h6>Product Information</h6>
                <div className="data-row"><span>Description:</span> <span>{workflowData.certificate.product_description || workflowData.product_description}</span></div>
                <div className="data-row"><span>HS Code:</span> <span>{workflowData.certificate.hs_tariff_classification || workflowData.classified_hs_code}</span></div>
                <div className="data-row"><span>Country of Origin:</span> <span>{workflowData.certificate.country_of_origin || workflowData.manufacturing_location}</span></div>
                <div className="data-row"><span>Preference Criterion:</span> <span>{workflowData.certificate.preference_criterion || workflowData.preference_criterion}</span></div>
              </div>

              <div className="cert-section">
                <h6>USMCA Qualification</h6>
                <div className="data-row"><span>Regional Value Content:</span> <span>{workflowData.north_american_content}%</span></div>
                <div className="data-row"><span>Qualification Status:</span> <span>{workflowData.qualification_status}</span></div>
                <div className="data-row"><span>Tariff Savings:</span> <span>${workflowData.annual_tariff_savings?.toLocaleString()}/year</span></div>
              </div>
            </div>
          </div>
        )}

        <div className="scrolling-data-window">
          <div className="client-header">
            <span>Client: {request?.company_name}</span>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Company:</span> <span>{workflowData?.company_name || request?.company_name}</span></div>
            <div className="data-row"><span>Contact:</span> <span>{workflowData?.contact_person || request?.contact_name}</span></div>
            <div className="data-row"><span>Email:</span> <span>{workflowData?.contact_email || request?.email}</span></div>
            <div className="data-row"><span>Phone:</span> <span>{workflowData?.contact_phone || request?.phone}</span></div>
            <div className="data-row"><span>Business Type:</span> <span>{workflowData?.business_type || request?.industry}</span></div>
            <div className="data-row"><span>Address:</span> <span>{workflowData?.company_address || 'Not provided'}</span></div>
            <div className="data-row"><span>Tax ID:</span> <span>{workflowData?.tax_id || 'Not provided'}</span></div>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Product:</span> <span>{workflowData?.product_description || serviceDetails?.product_description || 'Not specified'}</span></div>
            <div className="data-row"><span>HS Code:</span> <span>{workflowData?.classified_hs_code || serviceDetails?.current_hs_code || 'Not classified'}</span></div>
            <div className="data-row"><span>Classification Method:</span> <span>{workflowData?.classification_method || 'Not specified'}</span></div>
            <div className="data-row"><span>HS Description:</span> <span>{workflowData?.hs_code_description || 'Not available'}</span></div>
            <div className="data-row"><span>Confidence Score:</span> <span>{workflowData?.hs_code_confidence || 0}%</span></div>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Trade Volume:</span> <span>${((workflowData?.trade_volume || request?.trade_volume || 0) / 1000000).toFixed(1)}M annually</span></div>
            <div className="data-row"><span>Supplier Country:</span> <span>{workflowData?.supplier_country || 'Not specified'}</span></div>
            <div className="data-row"><span>Manufacturing:</span> <span>{workflowData?.manufacturing_location || serviceDetails?.manufacturing_location || 'Not specified'}</span></div>
            <div className="data-row"><span>Destination:</span> <span>{workflowData?.destination_country || 'Not specified'}</span></div>
          </div>

          <div className="data-section">
            <h6>Component Origins & USMCA Analysis</h6>
            {workflowData?.component_origins?.length > 0 ? (
              workflowData.component_origins.map((comp, idx) => (
                <div key={idx} className="component-detail">
                  <div className="data-row">
                    <span><strong>{comp.origin_country}:</strong></span>
                    <span>{comp.value_percentage}% - {comp.description}</span>
                  </div>
                  <div className="data-row">
                    <span>HS Code:</span>
                    <span>{comp.hs_code}</span>
                  </div>
                  <div className="data-row">
                    <span>USMCA Qualified:</span>
                    <span>{comp.usmca_qualification?.qualifies ? '✅ YES' : '❌ NO'}</span>
                  </div>
                  {comp.usmca_qualification?.reason && (
                    <div className="data-row">
                      <span>Reason:</span>
                      <span>{comp.usmca_qualification.reason}</span>
                    </div>
                  )}
                  {comp.cost_analysis?.annual_duty_cost > 0 && (
                    <div className="data-row">
                      <span>Annual Duty Cost:</span>
                      <span>${comp.cost_analysis.annual_duty_cost.toLocaleString()}</span>
                    </div>
                  )}
                  {idx < workflowData.component_origins.length - 1 && <hr />}
                </div>
              ))
            ) : (
              <div className="data-row"><span>Components:</span> <span>No detailed breakdown available</span></div>
            )}

            {workflowData?.qualification_analysis && (
              <div className="qualification-summary">
                <div className="data-row">
                  <span><strong>USMCA Status:</strong></span>
                  <span>{workflowData.qualification_analysis.current_status}</span>
                </div>
                {workflowData.qualification_analysis.risk_factors?.length > 0 && (
                  <div className="data-row">
                    <span><strong>Risk Factors:</strong></span>
                    <span>{workflowData.qualification_analysis.risk_factors[0]}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Financial Impact Analysis - CRITICAL FOR PROFESSIONAL VALUE */}
          <div className="data-section financial-impact-section">
            <h6>💰 Financial Impact Analysis</h6>
            <div className="financial-highlight">
              <div className="data-row">
                <span><strong>Annual Tariff Cost:</strong></span>
                <span className="financial-amount">
                  ${(workflowData?.annual_tariff_cost || workflowData?.cost_analysis?.annual_tariff_cost || 0).toLocaleString()}
                </span>
              </div>
              <div className="data-row">
                <span><strong>Potential USMCA Savings:</strong></span>
                <span className="financial-savings">
                  ${(workflowData?.potential_usmca_savings || workflowData?.cost_analysis?.potential_savings || 0).toLocaleString()} annually
                </span>
              </div>
              <div className="data-row">
                <span><strong>ROI on Certificate ($250):</strong></span>
                <span className="roi-highlight">
                  {((workflowData?.potential_usmca_savings || 0) / 250).toFixed(0)}x return on investment
                </span>
              </div>
            </div>
            <p className="professional-note">
              💡 <strong>Professional Value:</strong> Cristina's validation ensures these savings are realized compliantly.
            </p>
          </div>

          {/* Risk Assessment - CRITICAL FOR PROFESSIONAL REVIEW */}
          <div className="data-section risk-assessment-section">
            <h6>⚠️ Compliance Risk Assessment</h6>

            {(workflowData?.compliance_gaps?.length > 0 || workflowData?.risk_analysis?.compliance_gaps?.length > 0) && (
              <div className="risk-category">
                <div className="data-row"><strong>Compliance Gaps Identified:</strong></div>
                <ul className="risk-list">
                  {(workflowData?.compliance_gaps || workflowData?.risk_analysis?.compliance_gaps || []).map((gap, idx) => (
                    <li key={idx} className="risk-item gap-item">❌ {gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {(workflowData?.vulnerability_factors?.length > 0 || workflowData?.risk_analysis?.vulnerability_factors?.length > 0) && (
              <div className="risk-category">
                <div className="data-row"><strong>Vulnerability Factors:</strong></div>
                <ul className="risk-list">
                  {(workflowData?.vulnerability_factors || workflowData?.risk_analysis?.vulnerability_factors || []).map((factor, idx) => (
                    <li key={idx} className="risk-item vulnerability-item">⚠️ {factor}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="professional-note">
              ⚖️ <strong>Professional Assessment Required:</strong> Cristina reviews each gap and vulnerability with 17 years customs experience.
            </p>
          </div>

          {/* Regulatory Context */}
          <div className="data-section regulatory-section">
            <h6>📋 Regulatory Requirements</h6>

            {(workflowData?.regulatory_requirements?.length > 0 || workflowData?.compliance_requirements?.length > 0) && (
              <ul className="regulatory-list">
                {(workflowData?.regulatory_requirements || workflowData?.compliance_requirements || []).map((req, idx) => (
                  <li key={idx} className="regulatory-item">✓ {req}</li>
                ))}
              </ul>
            )}

            <div className="data-row">
              <span><strong>Import Frequency:</strong></span>
              <span>{workflowData?.import_frequency || workflowData?.trade_details?.import_frequency || 'Not specified'}</span>
            </div>
            <div className="data-row">
              <span><strong>Product Category:</strong></span>
              <span>{workflowData?.product_category || workflowData?.classification?.product_category || 'Electronics/Telecom'}</span>
            </div>
            {workflowData?.target_markets && (
              <div className="data-row">
                <span><strong>Target Markets:</strong></span>
                <span>{Array.isArray(workflowData.target_markets) ? workflowData.target_markets.join(', ') : workflowData.target_markets}</span>
              </div>
            )}

            <p className="professional-note">
              📜 <strong>License Backing:</strong> Certificate backed by Customs Broker License #4601913 and professional liability insurance.
            </p>
          </div>
        </div>
      </div>

      <div className="professional-validation-section">
        <h4>⚖️ Professional Liability Assessment</h4>
        <p className="expertise-note">
          <strong>Quality Control Focus:</strong> Can Cristina put her professional customs broker reputation
          behind this certificate? Risk assessment for $2-5M annual trade volume client.
        </p>

        <div className="form-group">
          <label><strong>Professional Validation Decision</strong></label>
          <select
            value={dataReview.compliance_confidence_level}
            onChange={(e) => handleDataReviewChange('compliance_confidence_level', e.target.value)}
            className="form-input professional-input validation-decision"
            required
          >
            <option value="">Select validation decision</option>
            <option value="approved_high_confidence">✅ APPROVED - High confidence, ready for professional backing</option>
            <option value="approved_standard">✅ APPROVED - Standard confidence, typical risk level</option>
            <option value="approved_with_monitoring">⚠️ APPROVED WITH MONITORING - Requires periodic review</option>
            <option value="needs_adjustment">❌ NEEDS ADJUSTMENT - Cannot stake professional reputation</option>
          </select>
        </div>

        <div className="form-group">
          <label><strong>Risk Assessment & Professional Notes</strong></label>
          <textarea
            value={dataReview.professional_recommendations}
            onChange={(e) => handleDataReviewChange('professional_recommendations', e.target.value)}
            placeholder="Professional risk assessment: Given this client's $2-5M trade volume, I identify the following risks... Compliance gaps that could bite later... Regulatory issues to watch... My professional recommendations..."
            className="form-input professional-input"
            rows="5"
          />
          <div className="enhancement-note">
            🎯 Focus on risks, compliance gaps, and regulatory issues specific to this client's trade profile
          </div>
        </div>

        <div className="form-group">
          <label><strong>Professional Backing & Liability Coverage</strong></label>
          <textarea
            value={dataReview.customs_broker_guarantee}
            onChange={(e) => handleDataReviewChange('customs_broker_guarantee', e.target.value)}
            placeholder="I, Cristina [Last Name], Licensed Customs Broker #4601913, provide professional backing for this certificate with the following liability coverage and conditions..."
            className="form-input professional-input"
            rows="3"
            required
          />
          <div className="enhancement-note">
            🛡️ Professional guarantee with specific liability coverage terms
          </div>
        </div>
      </div>

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!isReviewComplete || loading}
        >
          {loading ? 'Processing Professional Review...' : 'Complete Professional Data Review →'}
        </button>

        <div className="completion-status">
          {isReviewComplete ? (
            <span className="status-complete">✅ Professional data review complete</span>
          ) : (
            <span className="status-incomplete">⏳ Complete required professional assessments</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Add CSS styles for data review interface
const styles = `
.client-data-display {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin: 15px 0;
}

.data-source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.data-badge {
  background: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.client-info {
  color: #6c757d;
  font-weight: 500;
}

.data-review-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin: 15px 0;
  overflow: hidden;
}

.original-data-section {
  background: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
}

.original-data-section h5 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

.ai-classification-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hs-code {
  background: #17a2b8;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
}

.classification-note {
  color: #6c757d;
  font-size: 12px;
}

.component-origins-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-display-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 10px;
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.origin-details {
  display: flex;
  gap: 10px;
  align-items: center;
}

.country-flag {
  font-size: 12px;
  color: #495057;
}

.percentage-badge {
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.professional-enhancement-section {
  padding: 15px;
}

.professional-enhancement-section h5 {
  margin: 0 0 10px 0;
  color: #dc3545;
  font-size: 14px;
  font-weight: 600;
}

.professional-input {
  border: 2px solid #dc3545 !important;
  background: #fff5f5;
}

.professional-input:focus {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1) !important;
}

.enhancement-note {
  font-size: 11px;
  color: #dc3545;
  font-style: italic;
  margin-top: 5px;
}

.professional-assessment-row {
  margin: 10px 0;
  padding: 10px;
  background: #fff5f5;
  border-radius: 4px;
}

.component-reference {
  margin-bottom: 5px;
  color: #495057;
  font-size: 13px;
}

.service-value-proposition {
  margin: 15px 0;
}

.value-point {
  margin: 8px 0;
  padding: 10px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  font-size: 14px;
}

.certificate-summary-card {
  background: white;
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 20px;
  margin: 15px 0;
}

.certificate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.certificate-header h5 {
  margin: 0;
  color: #28a745;
}

.certificate-status {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.status-badge.generated {
  background: #28a745;
  color: white;
}

.confidence-badge {
  background: #17a2b8;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.certificate-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.detail-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.detail-item strong {
  display: block;
  color: #495057;
  font-size: 12px;
  margin-bottom: 5px;
}

.qualification-status.qualified {
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.component-summary {
  font-size: 13px;
  color: #6c757d;
  font-style: italic;
}

.validation-decision {
  font-weight: bold;
  font-size: 14px;
}

.validation-decision option {
  padding: 8px;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  if (!document.head.querySelector('style[data-cristina-styles]')) {
    styleSheet.setAttribute('data-cristina-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}

// Stage 2: Certificate Correction & Regeneration - Where Cristina Fixes the Issues
function CertificateCorrectionStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
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

  // Get Stage 1 results from stageData, fallback to sample data for demonstration
  const dataReview = stageData?.professional_data_review || {
    compliance_confidence_level: 'approved_with_monitoring',
    professional_recommendations: 'High China dependency (45%) requires documentation review and supplier diversification planning. Certificate technically complies but has strategic risk.',
    customs_broker_guarantee: 'conditional_backing',
    regulatory_compliance_additions: 'Additional supplier documentation needed for China components to strengthen audit defense.'
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
      cristina_professional_fixes_applied: true
    });
  };

  const isValidationComplete =
    corrections.regeneration_status === 'completed' &&
    corrections.fixes_validated;

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 2: Certificate Correction & Regeneration</h3>
        <p><strong>Fix the Issues:</strong> Cristina applies corrections and regenerates the certificate</p>
        <div className="expert-credentials">
          🔧 Apply Fixes | 🎯 Regenerate Certificate | ✅ Professional Validation
        </div>
      </div>

      <div className="validation-summary">
        <h4>📋 Stage 1 Validation Results</h4>
        <div className="validation-highlights">
          <div className="validation-item">
            <strong>Decision:</strong> {dataReview.compliance_confidence_level?.replace('_', ' ') || 'Not assessed'}
          </div>
          <div className="validation-item">
            <strong>Professional Notes:</strong> {dataReview.professional_recommendations || 'No notes provided'}
          </div>
          <div className="validation-item">
            <strong>Action Required:</strong>
            {(() => {
              const level = dataReview.compliance_confidence_level;
              if (level?.includes('approved_high_confidence')) {
                return 'Professional endorsement and final quality check';
              } else if (level?.includes('approved_standard')) {
                return 'Standard professional validation and backing';
              } else if (level?.includes('approved_with_monitoring')) {
                return 'Risk mitigation planning and enhanced documentation';
              } else if (level?.includes('needs_adjustment')) {
                return 'Certificate corrections and compliance improvements required';
              } else {
                return 'Professional assessment and corrective action plan needed';
              }
            })()}
          </div>
        </div>
      </div>

      <div className="certificate-correction-section">
        <h4>🔧 Certificate Corrections</h4>
        <p className="expertise-note">
          <strong>Professional Value:</strong> Based on Stage 1 findings, Cristina applies specific corrections
          and regenerates the certificate to meet professional standards.
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

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!isValidationComplete || loading}
        >
          {loading ? 'Processing Certificate Correction...' : 'Complete Certificate Correction →'}
        </button>

        <div className="completion-status">
          {isValidationComplete ? (
            <span className="status-complete">✅ Certificate correction completed</span>
          ) : (
            <span className="status-incomplete">⏳ Complete certificate regeneration and validation</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Stage 3: Final Professional Delivery - Complete Service Delivery with Liability Coverage
function FinalProfessionalDeliveryStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
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
            Professional USMCA certificate with Cristina's customs broker validation
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
            <strong>Licensed Customs Broker:</strong> License #4601913 (Active)
          </div>
          <div className="credential-item">
            <strong>Professional Experience:</strong> 17 years in customs compliance
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
            Certificate is now professionally backed by customs broker license #4601913
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

      <div className="service-value-summary">
        <div className="value-point">
          <strong>$250 Service Value Delivered:</strong> Professional USMCA certificate with customs broker backing,
          liability coverage, ongoing support, and regulatory monitoring - transforming AI-generated
          certificate into professionally guaranteed compliance documentation.
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
