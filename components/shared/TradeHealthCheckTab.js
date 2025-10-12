/**
 * TradeHealthCheckTab.js - Collaborative Lead Magnet Service
 * $99 paid qualifier that builds relationship before upselling to full services
 *
 * COLLABORATION MODEL:
 * - Jorge: Business assessment, client relationship, ROI recommendations
 * - Cristina: Compliance review, technical audit, regulatory evaluation
 *
 * Both work together on every Trade Health Check to provide comprehensive assessment
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from './ServiceWorkflowModal';
import { useToast, ToastContainer } from './ToastNotification';
import JorgeClientIntakeStage from './stages/JorgeClientIntakeStage';
import CristinaDocumentReviewStage from './stages/CristinaDocumentReviewStage';
import AIAnalysisValidationStage from './stages/AIAnalysisValidationStage';
import ReportGenerationStage from './stages/ReportGenerationStage';

export default function TradeHealthCheckTab({ requests: propRequests, onRequestUpdate, currentUser = 'Jorge' }) {
  const [serviceRequests, setServiceRequests] = useState(propRequests || []);
  const [loading, setLoading] = useState(!propRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, showToast, removeToast, success, error: errorToast, warning, info } = useToast();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!propRequests) {
      loadServiceRequests();
    }
  }, [propRequests]);

  useEffect(() => {
    if (propRequests) {
      setServiceRequests(propRequests);
    }
  }, [propRequests]);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      info('Loading Trade Health Check requests...');

      const response = await fetch('/api/admin/service-requests?service_type=Trade Health Check');

      if (!response.ok) {
        throw new Error('Failed to load service requests');
      }

      const data = await response.json();
      setServiceRequests(data.requests || []);
      success(`Loaded ${data.requests?.length || 0} Trade Health Check requests`);
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

  const startWorkflow = (request, mode = 'active') => {
    setSelectedRequest({ ...request, viewMode: mode });
    setShowModal(true);
  };

  // Helper function to determine button state
  const getButtonState = (request) => {
    if (request.status === 'completed') {
      return { label: 'Completed', className: 'btn-completed', mode: 'readonly', disabled: true };
    }

    // If no one has started yet
    if (!request.started_by) {
      return { label: 'Start Health Check', className: 'btn-active', mode: 'active', disabled: false };
    }

    // If this user is assigned to current stage
    if (request.current_assigned_to === currentUser) {
      return { label: 'Continue Health Check', className: 'btn-active', mode: 'active', disabled: false };
    }

    // Waiting for other team member
    return { label: 'View Progress', className: 'btn-readonly', mode: 'readonly', disabled: false };
  };

  const handleWorkflowComplete = async (completionData) => {
    try {
      setServiceRequests(prev => prev.map(req =>
        req.id === completionData.service_request_id
          ? { ...req, status: 'completed', completed_at: completionData.completed_at }
          : req
      ));

      if (onRequestUpdate) {
        await onRequestUpdate(completionData.service_request_id, { status: 'completed' });
      }

      await loadServiceRequests();
    } catch (err) {
      console.error('Error handling workflow completion:', err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Filter and sort logic
  const allFilteredRequests = serviceRequests?.filter(request => {
    const matchesService = request.service_type === 'Trade Health Check' || request.service_type === 'trade_health_check';

    const matchesSearch = !searchTerm ||
      request.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.service_details?.product_description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;

    return matchesService && matchesSearch && matchesStatus;
  })?.sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'company_name':
        aValue = a.company_name?.toLowerCase() || '';
        bValue = b.company_name?.toLowerCase() || '';
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

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
    setSortField('created_at');
    setSortDirection('desc');
    setCurrentPage(1);
  };

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

  return (
    <div className="service-tab">
      {/* Search and Filter Controls */}
      <div className="table-controls">
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by company, contact, or product..."
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
          {(searchTerm || statusFilter !== 'all') && (
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
                <td colSpan="5" className="loading-cell">Loading Trade Health Check requests...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="error-cell">Error: {error}</td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-requests">
                  <p>No Trade Health Check requests yet.</p>
                  <p className="secondary-text">
                    Requests will appear here when clients purchase the $99 Trade Health Check service.
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
                  {(() => {
                    const buttonState = getButtonState(request);
                    return (
                      <button
                        className={buttonState.className}
                        onClick={() => startWorkflow(request, buttonState.mode)}
                        disabled={buttonState.disabled}
                        title={buttonState.mode === 'readonly' ? `Waiting for ${request.current_assigned_to || 'team member'}` : ''}
                      >
                        {buttonState.label}
                      </button>
                    );
                  })()}
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
          service={tradeHealthCheckService}
          request={selectedRequest}
          onClose={closeModal}
          onComplete={handleWorkflowComplete}
          currentUser={currentUser}
          viewMode={selectedRequest.viewMode || 'active'}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

// Trade Health Check Service Configuration
const tradeHealthCheckService = {
  title: 'Trade Health Check Assessment',
  totalStages: 4,
  stageNames: [
    'Stage 1: Client Intake',
    'Stage 2: Doc Review',
    'Stage 3: AI Analysis',
    'Stage 4: Report'
  ],
  stageAssignments: {
    1: 'Jorge',      // Stage 1: Client Onboarding & Setup (25 min)
    2: 'Cristina',   // Stage 2: Document Review & Technical Assessment (10 min)
    3: 'Jorge',      // Stage 3: AI Analysis (Either can trigger, both validate - 30 min)
    4: 'Jorge'       // Stage 4: Report Generation (Both review, Jorge sends - 15 min)
  },

  // Note: Stage 3 and 4 are collaborative - both team members have view access
  // Stage assignment indicates who can progress the stage, but both can view/validate

  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const serviceDetails = request?.service_details || {};
    const subscriberData = serviceDetails;

    switch (stageNumber) {
      case 1:
        return (
          <JorgeClientIntakeStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
          />
        );

      case 2:
        return (
          <CristinaDocumentReviewStage
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
          <AIAnalysisValidationStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            stageData={stageData}
            onComplete={onStageComplete}
            loading={loading}
          />
        );

      case 4:
        return (
          <ReportGenerationStage
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
