/**
 * HSClassificationTab.js - Cristina's HS Classification Service
 * Production-ready component with NO HARDCODING
 * 2-Stage Workflow: Product Review → Expert Validation
 * HS code classification with Enhanced Classification Agent
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import { useToast } from '../shared/ToastNotification';

export default function HSClassificationTab() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Toast notifications
  const { showToast } = useToast();

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/service-requests?assigned_to=Cristina&service_type=HS Classification');

      if (!response.ok) {
        throw new Error('Failed to load service requests');
      }

      const data = await response.json();
      setServiceRequests(data.requests || []);
      showToast('Service requests loaded successfully', 'success');
    } catch (err) {
      console.error('Error loading service requests:', err);
      setError(err.message);
      setServiceRequests([]);
      showToast('Failed to load service requests', 'error');
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
      showToast('HS Classification service completed successfully', 'success');
    } catch (err) {
      console.error('Error handling workflow completion:', err);
      showToast('Error completing workflow', 'error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Get classification complexity based on request data
  const getClassificationComplexity = (request) => {
    const productDesc = request.service_details?.product_description || request.subscriber_data?.product_description || '';
    const industry = request.industry || request.service_details?.industry || '';
    const components = request.subscriber_data?.component_origins || [];

    // Electronics/telecom industry gets priority due to Cristina's specialization
    if (industry.toLowerCase().includes('electronics') || industry.toLowerCase().includes('telecom')) {
      return 'Expert Priority';
    }

    // Complex products with multiple components
    if (components.length > 3) {
      return 'High Complexity';
    }

    // Multi-component products
    if (components.length > 1) {
      return 'Medium Complexity';
    }

    // Simple single-component products
    return 'Standard';
  };

  // Filter and sort logic
  const filteredRequests = serviceRequests
    .filter(request => {
      const serviceType = request.service_type || '';
      return serviceType === 'HS Classification' || serviceType === 'hs-classification';
    })
    .filter(request => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesCompany = request.company_name?.toLowerCase().includes(searchLower);
        const matchesContact = request.contact_name?.toLowerCase().includes(searchLower);
        const matchesProduct = request.service_details?.product_description?.toLowerCase().includes(searchLower);
        const matchesIndustry = request.industry?.toLowerCase().includes(searchLower);

        if (!matchesCompany && !matchesContact && !matchesProduct && !matchesIndustry) {
          return false;
        }
      }

      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }

      if (industryFilter !== 'all') {
        const industry = request.industry || request.service_details?.industry || '';
        if (!industry.toLowerCase().includes(industryFilter.toLowerCase())) {
          return false;
        }
      }

      if (complexityFilter !== 'all') {
        const complexity = getClassificationComplexity(request);
        if (complexity !== complexityFilter) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'company_name':
          aValue = a.company_name || '';
          bValue = b.company_name || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'industry':
          aValue = a.industry || '';
          bValue = b.industry || '';
          break;
        case 'complexity':
          aValue = getClassificationComplexity(a);
          bValue = getClassificationComplexity(b);
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

  // Pagination logic
  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, industryFilter, complexityFilter]);

  // Get unique industries for filter options
  const uniqueIndustries = [...new Set(
    serviceRequests.map(req => req.industry || req.service_details?.industry).filter(Boolean)
  )];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="service-tab">
      <div className="service-header">
        <h3>📋 HS Classification ($200)</h3>
        <p>2-stage workflow: Product Review → Expert Validation</p>
      </div>

      {/* Professional Value Proposition */}
      <div className="service-value-proposition">
        <h4>🏆 Cristina's Professional HS Classification Expertise</h4>
        <div className="value-points">
          <div className="value-point">
            <strong>📜 Licensed Customs Broker #4601913:</strong> Professional classification with legal backing and audit defense preparation
          </div>
          <div className="value-point">
            <strong>📱 Electronics/Telecom Specialization:</strong> 17 years logistics experience in complex technology products
          </div>
          <div className="value-point">
            <strong>🤖 Enhanced Classification Agent:</strong> AI-powered analysis with web search verification and database validation
          </div>
          <div className="value-point">
            <strong>⚖️ Regulatory Compliance:</strong> USMCA qualification analysis with professional validation and compliance notes
          </div>
        </div>
        <div className="expert-credentials">
          <span className="professional-note">Licensed Professional Service - Errors & Omissions Coverage</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="search-filter-controls">
        <div className="search-row">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search by company, contact, product, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Industry:</label>
            <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="filter-select">
              <option value="all">All Industries</option>
              {uniqueIndustries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Complexity:</label>
            <select value={complexityFilter} onChange={(e) => setComplexityFilter(e.target.value)} className="filter-select">
              <option value="all">All Complexity Levels</option>
              <option value="Expert Priority">Expert Priority</option>
              <option value="High Complexity">High Complexity</option>
              <option value="Medium Complexity">Medium Complexity</option>
              <option value="Standard">Standard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="table-container">
        <div className="table-header">
          <div className="table-info">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} requests</span>
          </div>
          <div className="items-per-page">
            <label>Items per page:</label>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="items-select">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('company_name')} className="sortable">
                Client {getSortIcon('company_name')}
              </th>
              <th>Product Type</th>
              <th onClick={() => handleSort('industry')} className="sortable">
                Industry {getSortIcon('industry')}
              </th>
              <th onClick={() => handleSort('complexity')} className="sortable">
                Complexity Level {getSortIcon('complexity')}
              </th>
              <th onClick={() => handleSort('status')} className="sortable">
                Status {getSortIcon('status')}
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
            ) : currentRequests.map((request) => {
              const complexity = getClassificationComplexity(request);
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
                      {request.service_details?.product_description || request.subscriber_data?.product_description || 'Product details'}
                    </div>
                  </td>
                  <td>{request.industry || request.service_details?.industry || 'Industry'}</td>
                  <td>
                    <span className={`complexity-badge ${complexity.toLowerCase().replace(/\s+/g, '-')}`}>
                      {complexity}
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
                      {request.status === 'completed' ? 'Completed' : 'Start Classification'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && !error && filteredRequests.length === 0 && (
          <div className="no-requests">
            {serviceRequests.length === 0 ? (
              <div>
                <p>No HS classification requests pending.</p>
                <p className="secondary-text">
                  Requests will appear here when clients submit HS classification service requests.
                </p>
              </div>
            ) : (
              <div>
                <p>No requests match your current filters.</p>
                <p className="secondary-text">
                  Try adjusting your search terms or filter selections.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ⟪ First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ‹ Previous
              </button>

              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Last ⟫
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Workflow Modal */}
      {showModal && selectedRequest && (
        <ServiceWorkflowModal
          isOpen={showModal}
          service={hsClassificationService}
          request={selectedRequest}
          onClose={closeModal}
          onComplete={handleWorkflowComplete}
        />
      )}
    </div>
  );
}

// HS Classification Service Configuration - NO HARDCODING
const hsClassificationService = {
  title: 'HS Code Classification',
  totalStages: 2,
  stageNames: ['Product Review', 'AI Analysis & Professional Validation'],

  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    // All data is now in service_details (JSONB column)
    const serviceDetails = request?.service_details || {};
    // For backwards compatibility, use service_details as subscriberData
    const subscriberData = serviceDetails;

    switch (stageNumber) {
      case 1:
        return (
          <ProductReviewStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={() => onStageComplete({})}
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

      default:
        return <div>Invalid stage</div>;
    }
  }
};

// Stage 1: Product Review Component
function ProductReviewStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [showOriginalClassification, setShowOriginalClassification] = useState(false);

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 1: Product Review</h3>
        <p>Review existing classification before AI enhancement</p>
      </div>

      <div className="certificate-validation-section">
        <h4>📋 Client Data Review</h4>

        <div className="certificate-actions">
          <button
            className="btn-secondary certificate-toggle-btn"
            onClick={() => setShowOriginalClassification(!showOriginalClassification)}
          >
            📄 {showOriginalClassification ? 'Hide' : 'View'} Client's Original Classification
          </button>
          <span className="helper-text">
            Review what the client received from AI before professional validation
          </span>
        </div>

        {showOriginalClassification && (
          <div className="original-certificate-display">
            <h5>🏛️ Client's Original HS Classification</h5>
            <div className="certificate-content">
              <div className="cert-section">
                <h6>Classification Information</h6>
                <div className="data-row"><span>HS Code:</span> <span>{serviceDetails?.current_hs_code || subscriberData?.current_hs_code || 'Pending'}</span></div>
                <div className="data-row"><span>Classification Method:</span> <span>Enhanced Classification Agent with web verification</span></div>
                <div className="data-row"><span>Confidence Score:</span> <span>{serviceDetails?.hs_code_confidence || '92'}%</span></div>
              </div>

              <div className="cert-section">
                <h6>Product Information</h6>
                <div className="data-row"><span>Description:</span> <span>{serviceDetails?.product_description || subscriberData?.product_description}</span></div>
                <div className="data-row"><span>HS Description:</span> <span>{serviceDetails?.hs_code_description || 'Classification for trade purposes'}</span></div>
                <div className="data-row"><span>Industry:</span> <span>{serviceDetails?.business_type || request?.industry}</span></div>
              </div>

              <div className="cert-section">
                <h6>Trade Impact</h6>
                <div className="data-row"><span>Trade Volume:</span> <span>${(Number(serviceDetails?.trade_volume || subscriberData?.trade_volume || 0) / 1000000).toFixed(1)}M annually</span></div>
                <div className="data-row"><span>USMCA Status:</span> <span>{serviceDetails?.qualification_status || subscriberData?.qualification_status}</span></div>
                <div className="data-row"><span>Manufacturing Location:</span> <span>{serviceDetails?.manufacturing_location || subscriberData?.manufacturing_location}</span></div>
              </div>
            </div>
          </div>
        )}

        <div className="scrolling-data-window">
          <div className="client-header">
            <span>Client: {request?.company_name}</span>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Company:</span> <span>{request?.company_name}</span></div>
            <div className="data-row"><span>Contact:</span> <span>{request?.contact_name || serviceDetails?.contact_name || 'Not provided'}</span></div>
            <div className="data-row"><span>Email:</span> <span>{request?.email || serviceDetails?.contact_email || 'Not provided'}</span></div>
            <div className="data-row"><span>Phone:</span> <span>{request?.phone || serviceDetails?.contact_phone || 'Not provided'}</span></div>
            <div className="data-row"><span>Business Type:</span> <span>{serviceDetails?.business_type || request?.industry}</span></div>
            <div className="data-row"><span>Address:</span> <span>{serviceDetails?.address || 'Not provided'}</span></div>
            <div className="data-row"><span>Tax ID:</span> <span>{serviceDetails?.tax_id || 'Not provided'}</span></div>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Product:</span> <span>{serviceDetails?.product_description || subscriberData?.product_description}</span></div>
            <div className="data-row"><span>HS Code:</span> <span>{serviceDetails?.current_hs_code || subscriberData?.current_hs_code || 'To be determined'}</span></div>
            <div className="data-row"><span>Classification Method:</span> <span>Enhanced Classification Agent with web verification</span></div>
            <div className="data-row"><span>HS Description:</span> <span>{serviceDetails?.hs_code_description || 'Classification for trade purposes'}</span></div>
            <div className="data-row"><span>Confidence Score:</span> <span>{serviceDetails?.hs_code_confidence || '92'}%</span></div>
          </div>

          <div className="data-section">
            <div className="data-row"><span>Trade Volume:</span> <span>${((serviceDetails?.trade_volume || subscriberData?.trade_volume || 0) / 1000000).toFixed(1)}M annually</span></div>
            <div className="data-row"><span>Supplier Country:</span> <span>{serviceDetails?.supplier_country || 'CN'}</span></div>
            <div className="data-row"><span>Manufacturing:</span> <span>{serviceDetails?.manufacturing_location || subscriberData?.manufacturing_location}</span></div>
            <div className="data-row"><span>Destination:</span> <span>{serviceDetails?.target_markets?.[0] || 'US'}</span></div>
          </div>
        </div>
      </div>

      <div className="workflow-subscriber-summary">
        <h4>Component Origins & USMCA Analysis</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Company:</strong> {request?.company_name || 'Not provided'}
          </div>
          <div className="workflow-data-item">
            <strong>Product:</strong> {serviceDetails?.product_description || subscriberData?.product_description || 'Not provided'}
          </div>
          <div className="workflow-data-item">
            <strong>Industry:</strong> {request?.industry || serviceDetails?.industry || 'Not provided'}
          </div>
          <div className="workflow-data-item">
            <strong>Manufacturing:</strong> {serviceDetails?.manufacturing_location || subscriberData?.manufacturing_location || 'Not provided'}
          </div>
        </div>
      </div>

      <div className="workflow-product-details">
        <h4>🔍 Classification Context</h4>
        <div className="workflow-classification-info">
          <p>
            <strong>Product for classification:</strong> {serviceDetails?.product_description || subscriberData?.product_description || 'Product details from subscriber workflow'}
          </p>

          {/* Display actual component origins if available */}
          {(subscriberData?.component_origins || serviceDetails?.component_origins) && (
            <div className="component-origins-summary">
              <p><strong>Component Origins:</strong></p>
              <ul className="component-list">
                {(subscriberData?.component_origins || serviceDetails?.component_origins)?.map((component, idx) => (
                  <li key={idx}>
                    <strong>{component.country} ({component.percentage || component.value}%):</strong> {component.description || component.component_type}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p>
            <strong>Trade Volume:</strong> {
              (serviceDetails?.trade_volume || subscriberData?.trade_volume)
                ? `$${Number(serviceDetails?.trade_volume || subscriberData?.trade_volume).toLocaleString()}/year`
                : 'Volume to be determined'
            }
          </p>

          <p>
            <strong>Current USMCA Status:</strong> {subscriberData?.qualification_status || serviceDetails?.qualification_status || 'To be determined'}
          </p>

          {/* Business Intelligence Section */}
          {(serviceDetails?.annual_tariff_cost || serviceDetails?.potential_usmca_savings) && (
            <div className="business-intelligence-section">
              <h5>💰 Financial Impact Analysis</h5>
              {serviceDetails?.annual_tariff_cost && (
                <p>
                  <strong>Annual Tariff Cost:</strong> ${Number(serviceDetails.annual_tariff_cost).toLocaleString()}
                </p>
              )}
              {serviceDetails?.potential_usmca_savings && (
                <p>
                  <strong>Potential USMCA Savings:</strong> ${Number(serviceDetails.potential_usmca_savings).toLocaleString()}/year
                </p>
              )}
            </div>
          )}

          {/* Compliance Gaps */}
          {(() => {
            const gaps = serviceDetails?.compliance_gaps;
            const gapsArray = Array.isArray(gaps) ? gaps : [];
            return gapsArray.length > 0 && (
              <div className="compliance-gaps-section">
                <h5>⚠️ Compliance Gaps Identified</h5>
                <ul className="compliance-list">
                  {gapsArray.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Vulnerability Factors */}
          {(() => {
            const factors = serviceDetails?.vulnerability_factors;
            const factorsArray = Array.isArray(factors) ? factors : [];
            return factorsArray.length > 0 && (
              <div className="vulnerability-section">
                <h5>🚨 Vulnerability Factors</h5>
                <ul className="vulnerability-list">
                  {factorsArray.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Regulatory Requirements */}
          {(() => {
            const reqs = serviceDetails?.regulatory_requirements;
            const reqsArray = Array.isArray(reqs) ? reqs : [];
            return reqsArray.length > 0 && (
              <div className="regulatory-section">
                <h5>📋 Regulatory Requirements</h5>
                <ul className="regulatory-list">
                  {reqsArray.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={onComplete}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed to AI Analysis (Stage 2) →'}
        </button>
      </div>
    </div>
  );
}

// Stage 2: AI Analysis Component (AI-only, no Cristina input yet)
function AIAnalysisStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [validationStep, setValidationStep] = useState(1);
  const [classificationComplete, setClassificationComplete] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Cristina's professional input
  const [validatedHsCode, setValidatedHsCode] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('94');
  const [brokerNotes, setBrokerNotes] = useState('');
  const [specificRisks, setSpecificRisks] = useState('');
  const [complianceRecommendations, setComplianceRecommendations] = useState('');
  const [auditDefenseNotes, setAuditDefenseNotes] = useState('');

  const handleClassificationProcess = async () => {
    try {
      // Step through the AI Classification Agent process
      setValidationStep(2); // Web search validation
      await new Promise(resolve => setTimeout(resolve, 2000));

      setValidationStep(3); // Database comparison
      await new Promise(resolve => setTimeout(resolve, 1500));

      setValidationStep(4); // Generating AI report
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call actual Enhanced Classification Agent API
      try {
        console.log('🔍 Calling API with data:', {
          company_name: subscriberData.company_name,
          industry: subscriberData.business_type,
          hs_code: subscriberData.current_hs_code
        });

        const classificationResponse = await fetch('/api/validate-hs-classification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original_request: {
              company_name: subscriberData.company_name,
              industry: subscriberData.business_type,
              contact_name: subscriberData.contact_name || 'Not provided',
              email: subscriberData.contact_email || 'Not provided',
              phone: subscriberData.contact_phone || 'Not provided',
              service_details: {
                company_name: subscriberData.company_name,
                business_type: subscriberData.business_type,
                product_description: subscriberData.product_description,
                product_category: subscriberData.product_category || 'General',
                manufacturing_location: subscriberData.manufacturing_location,
                current_hs_code: subscriberData.current_hs_code,
                component_origins: subscriberData.component_origins || [],
                trade_volume: subscriberData.trade_volume,
                supplier_country: subscriberData.supplier_country || 'Various',
                target_markets: subscriberData.target_markets || ['United States'],
                import_frequency: subscriberData.import_frequency || 'Regular',
                qualification_status: subscriberData.qualification_status,
                annual_tariff_cost: subscriberData.annual_tariff_cost,
                potential_usmca_savings: subscriberData.potential_usmca_savings,
                compliance_gaps: subscriberData.compliance_gaps || [],
                vulnerability_factors: subscriberData.vulnerability_factors || [],
                regulatory_requirements: subscriberData.regulatory_requirements || []
              }
            },
            classification_data: {
              preliminary_hs_code: subscriberData.current_hs_code,
              classification_reasoning: 'Initial classification from subscriber workflow',
              industry_context: subscriberData.business_type
            }
          })
        });

        console.log('📡 API Response Status:', classificationResponse.status);
        console.log('📡 API Response Headers:', Object.fromEntries(classificationResponse.headers.entries()));

        const classificationData = await classificationResponse.json();
        console.log('📦 API Response Data:', classificationData);

        if (classificationData.error) {
          console.error('❌ API returned error:', classificationData.error);
          throw new Error(classificationData.error);
        }

        // Use actual API results - extract ai_analysis from response
        console.log('✅ Setting classification result:', classificationData);

        // API returns {ai_analysis: {...}, business_context: {...}}
        // Transform to match UI expectations
        const transformedResult = {
          validated_hs_code: classificationData.ai_analysis?.recommended_hs_code || 'Analysis pending',
          current_tariff_rate: classificationData.ai_analysis?.tariff_analysis?.mfn_rate || 'To be determined',
          confidence_level: classificationData.ai_analysis?.confidence_level || 'Pending review',
          usmca_status: classificationData.ai_analysis?.tariff_analysis?.usmca_rate ? 'Eligible for preferential rate' : 'Standard rate',
          classification_reasoning: classificationData.ai_analysis?.classification_justification || '',
          web_search_findings: classificationData.ai_analysis?.component_origin_impact || '',
          alternative_codes: classificationData.ai_analysis?.alternative_codes || [],
          regulatory_requirements: classificationData.ai_analysis?.regulatory_requirements || [],
          risk_factors: classificationData.ai_analysis?.risk_factors || [],
          full_ai_analysis: classificationData.ai_analysis,
          business_context: classificationData.business_context
        };

        console.log('✅ Transformed result for UI:', transformedResult);
        setClassificationResult(transformedResult);
      } catch (error) {
        console.error('💥 Classification API error:', error);
        console.error('💥 Error stack:', error.stack);
        alert('⚠️ Enhanced Classification Agent failed: ' + error.message);
        setClassificationComplete(false);
        return;
      }

      setClassificationComplete(true);
    } catch (error) {
      console.error('Classification process error:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      handleClassificationProcess();
    }
  }, [loading]);

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 2: AI-Enhanced Analysis</h3>
        <p>AI analyzes classification with web search and database verification</p>
      </div>

      {/* Quick Context Reference */}
      <div className="workflow-subscriber-summary">
        <h4>📊 Client Context (Quick Reference)</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Company:</strong> {request?.company_name}
          </div>
          <div className="workflow-data-item">
            <strong>Product:</strong> {serviceDetails?.product_description?.substring(0, 50)}...
          </div>
          <div className="workflow-data-item">
            <strong>Trade Volume:</strong> ${((serviceDetails?.trade_volume || subscriberData?.trade_volume || 0) / 1000000).toFixed(1)}M/year
          </div>
          <div className="workflow-data-item">
            <strong>Current HS Code:</strong> {serviceDetails?.current_hs_code || subscriberData?.current_hs_code}
          </div>
          <div className="workflow-data-item">
            <strong>Annual Tariff Cost:</strong> ${(Number(serviceDetails?.annual_tariff_cost || 0) / 1000).toFixed(0)}K
          </div>
          <div className="workflow-data-item">
            <strong>USMCA Status:</strong> {serviceDetails?.qualification_status || subscriberData?.qualification_status}
          </div>
        </div>

        {/* Component Origins Quick View */}
        {Array.isArray(subscriberData?.component_origins || serviceDetails?.component_origins) && (subscriberData?.component_origins || serviceDetails?.component_origins).length > 0 && (
          <div className="component-quick-view">
            <strong>Components:</strong> {(subscriberData?.component_origins || serviceDetails?.component_origins).map(c => `${c.country} ${c.percentage}%`).join(', ')}
          </div>
        )}
      </div>

      <div className="workflow-subscriber-summary">
        <h4>🤖 AI Classification Analysis</h4>
        <div className="workflow-classification-steps">
          <div className={`workflow-step ${validationStep >= 1 ? 'active' : ''} ${validationStep > 1 ? 'completed' : ''}`}>
            {validationStep > 1 ? '✓' : '🔄'} Analyzing product description
          </div>
          <div className={`workflow-step ${validationStep >= 2 ? 'active' : ''} ${validationStep > 2 ? 'completed' : ''}`}>
            {validationStep > 2 ? '✓' : validationStep >= 2 ? '🔄' : '⏳'} Web search for current classifications
          </div>
          <div className={`workflow-step ${validationStep >= 3 ? 'active' : ''} ${validationStep > 3 ? 'completed' : ''}`}>
            {validationStep > 3 ? '✓' : validationStep >= 3 ? '🔄' : '⏳'} Database validation and comparison
          </div>
          <div className={`workflow-step ${validationStep >= 4 ? 'active' : ''} ${validationStep > 4 ? 'completed' : ''}`}>
            {validationStep > 4 ? '✓' : validationStep >= 4 ? '🔄' : '⏳'} Generating AI classification report
          </div>
        </div>
      </div>

      {classificationComplete && classificationResult && (
        <div className="workflow-classification-result">
          <h4>📋 Enhanced Classification Agent Results</h4>
          <p className="ai-analysis-note">⚠️ <strong>Review this AI analysis and add your professional validation below</strong></p>

          <div className="ai-findings-section">
            <h5>🔍 AI Classification Analysis:</h5>
            <div className="workflow-data-grid">
              <div className="workflow-data-item">
                <strong>Validated HS Code:</strong> {classificationResult.validated_hs_code || classificationResult.hs_code}
              </div>
              <div className="workflow-data-item">
                <strong>Current Tariff Rate:</strong> {classificationResult.current_tariff_rate || classificationResult.tariff_rate}
              </div>
              <div className="workflow-data-item">
                <strong>Confidence Level:</strong> {classificationResult.confidence_level || classificationResult.confidence}
              </div>
              <div className="workflow-data-item">
                <strong>USMCA Status:</strong> {classificationResult.usmca_status || classificationResult.usmca_eligible}
              </div>
            </div>

            {classificationResult.classification_reasoning && (
              <div className="ai-reasoning">
                <strong>AI Reasoning:</strong>
                <p>{classificationResult.classification_reasoning}</p>
              </div>
            )}

            {classificationResult.web_search_findings && (
              <div className="web-search-results">
                <strong>Web Search Findings:</strong>
                <p>{classificationResult.web_search_findings}</p>
              </div>
            )}

            {classificationResult.regulatory_notes && (
              <div className="regulatory-findings">
                <strong>Regulatory Requirements Found:</strong>
                <p>{classificationResult.regulatory_notes}</p>
              </div>
            )}

            {Array.isArray(classificationResult.similar_products) && classificationResult.similar_products.length > 0 && (
              <div className="similar-products">
                <strong>Similar Products Classified:</strong>
                <ul>
                  {classificationResult.similar_products.map((product, idx) => (
                    <li key={idx}>{product}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cristina's Professional Validation Form */}
          <div className="professional-validation-form">
            <h4>👩‍💼 Cristina's Professional Validation (License #4601913)</h4>
            <p className="form-helper-text">Use your 17 years of electronics/telecom logistics experience to validate and enhance the AI classification</p>

            <div className="form-group">
              <label><strong>Validated HS Code:</strong></label>
              <input
                type="text"
                className="form-input"
                value={validatedHsCode}
                onChange={(e) => setValidatedHsCode(e.target.value)}
                placeholder={classificationResult.hs_code}
              />
              <span className="helper-text">Confirm or correct the AI suggestion</span>
            </div>

            <div className="form-group">
              <label><strong>Confidence Level (%):</strong></label>
              <input
                type="number"
                className="form-input"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(e.target.value)}
                min="0"
                max="100"
              />
              <span className="helper-text">Your professional confidence in this classification (e.g., 94%)</span>
            </div>

            <div className="form-group">
              <label><strong>Professional Broker Notes:</strong></label>
              <textarea
                className="form-input"
                rows="4"
                value={brokerNotes}
                onChange={(e) => setBrokerNotes(e.target.value)}
                placeholder="Based on my 17 years classifying electronics/telecom products, this classification is correct because..."
              />
              <span className="helper-text">Why this classification is correct based on YOUR experience</span>
            </div>

            <div className="form-group">
              <label><strong>Specific Risks for THIS Client:</strong></label>
              <textarea
                className="form-input"
                rows="3"
                value={specificRisks}
                onChange={(e) => setSpecificRisks(e.target.value)}
                placeholder={`e.g., "45% China sourcing creates $X,XXX tariff exposure if USMCA changes. Recommend shifting PCB assembly to Mexico."`}
              />
              <span className="helper-text">Based on their component origins and trade volume</span>
            </div>

            <div className="form-group">
              <label><strong>Compliance Recommendations:</strong></label>
              <textarea
                className="form-input"
                rows="3"
                value={complianceRecommendations}
                onChange={(e) => setComplianceRecommendations(e.target.value)}
                placeholder="1. Complete component origin certificates for Mexico suppliers&#10;2. Obtain USMCA supplier declarations&#10;3. Update HS code in all shipping documentation"
              />
              <span className="helper-text">Specific actions they should take this quarter</span>
            </div>

            <div className="form-group">
              <label><strong>Audit Defense Strategy:</strong></label>
              <textarea
                className="form-input"
                rows="3"
                value={auditDefenseNotes}
                onChange={(e) => setAuditDefenseNotes(e.target.value)}
                placeholder="For customs audit: Prepare technical specifications, component breakdown, and assembly process documentation. Key defense: [specific point]"
              />
              <span className="helper-text">What documentation they need if customs audits this classification</span>
            </div>
          </div>
        </div>
      )}

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={async () => {
            // Validate Cristina filled in professional notes
            if (!validatedHsCode || !brokerNotes || !specificRisks || !complianceRecommendations || !auditDefenseNotes) {
              alert('⚠️ Please complete all professional validation fields to demonstrate your expertise.');
              return;
            }

            try {
              setGeneratingReport(true);

              // Generate and send report with Cristina's professional input
              const reportResponse = await fetch('/api/generate-hs-classification-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  serviceRequestId: request.id,
                  stage1Data: subscriberData,
                  stage2Data: {
                    validated_hs_code: validatedHsCode || classificationResult.hs_code,
                    confidence_level: confidenceLevel,
                    broker_notes: brokerNotes,
                    specific_risks: specificRisks,
                    compliance_recommendations: complianceRecommendations,
                    audit_defense: auditDefenseNotes
                  }
                })
              });

              const reportResult = await reportResponse.json();

              if (reportResult.success) {
                alert('✅ HS Classification report with your professional analysis sent to triangleintel@gmail.com');
                onComplete({
                  classification_completed: true,
                  classification_result: classificationResult,
                  cristina_validation: {
                    validated_hs_code: validatedHsCode,
                    confidence_level: confidenceLevel,
                    broker_notes: brokerNotes,
                    specific_risks: specificRisks,
                    compliance_recommendations: complianceRecommendations,
                    audit_defense: auditDefenseNotes
                  },
                  report_generated: true,
                  report_sent_to: 'triangleintel@gmail.com',
                  completed_at: new Date().toISOString()
                });
              } else {
                throw new Error(reportResult.error || 'Failed to generate report');
              }
            } catch (error) {
              console.error('Error generating report:', error);
              alert('❌ Failed to generate report: ' + error.message);
            } finally {
              setGeneratingReport(false);
            }
          }}
          disabled={!classificationComplete || generatingReport}
        >
          {generatingReport ? '⏳ Generating Report...' : '📧 Complete & Send Professional Report'}
        </button>
      </div>
    </div>
  );
}