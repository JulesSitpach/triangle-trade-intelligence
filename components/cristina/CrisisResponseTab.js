/**
 * CrisisResponseTab.js - Cristina's Crisis Response Service
 * Production-ready component with NO HARDCODING
 * 3-Stage Workflow: Crisis Description → AI Analysis → Action Plan
 * Emergency response planning for trade disruptions
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import { useToast } from '../shared/ToastNotification';

export default function CrisisResponseTab() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
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

      const response = await fetch('/api/admin/service-requests?assigned_to=Cristina&service_type=Crisis Response');

      if (!response.ok) {
        throw new Error('Failed to load service requests');
      }

      const data = await response.json();
      setServiceRequests(data.requests || []);
      showToast('Crisis response requests loaded successfully', 'success');
    } catch (err) {
      console.error('Error loading service requests:', err);
      setError(err.message);
      setServiceRequests([]);
      showToast('Failed to load crisis response requests', 'error');
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
      showToast('Crisis response action plan completed successfully', 'success');
    } catch (err) {
      console.error('Error handling workflow completion:', err);
      showToast('Error completing crisis response workflow', 'error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  // Get crisis urgency level based on request data
  const getCrisisUrgency = (request) => {
    const tradeVolume = request.subscriber_data?.trade_volume || request.service_details?.trade_volume || 0;
    const currentImpact = request.service_details?.current_impact || '';
    const timeline = request.service_details?.timeline || '';

    // Critical urgency for high-volume traders or severe impacts
    if (tradeVolume > 5000000 || currentImpact.toLowerCase().includes('stopped') || timeline.toLowerCase().includes('immediate')) {
      return 'Critical';
    }

    // High urgency for medium-volume traders or significant impacts
    if (tradeVolume > 1000000 || currentImpact.toLowerCase().includes('delay') || timeline.toLowerCase().includes('urgent')) {
      return 'High';
    }

    // Medium urgency for moderate impacts
    if (currentImpact.toLowerCase().includes('impact') || timeline.toLowerCase().includes('week')) {
      return 'Medium';
    }

    // Standard urgency for others
    return 'Standard';
  };

  // Filter and sort logic
  const filteredRequests = serviceRequests
    .filter(request => {
      const serviceType = request.service_type || '';
      return serviceType === 'Crisis Response' || serviceType === 'crisis_response';
    })
    .filter(request => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesCompany = request.company_name?.toLowerCase().includes(searchLower);
        const matchesContact = request.contact_name?.toLowerCase().includes(searchLower);
        const matchesProduct = request.service_details?.product_description?.toLowerCase().includes(searchLower);
        const matchesIndustry = request.industry?.toLowerCase().includes(searchLower);
        const matchesCrisis = request.service_details?.crisis_type?.toLowerCase().includes(searchLower);

        if (!matchesCompany && !matchesContact && !matchesProduct && !matchesIndustry && !matchesCrisis) {
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

      if (urgencyFilter !== 'all') {
        const urgency = getCrisisUrgency(request);
        if (urgency !== urgencyFilter) {
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
        case 'urgency':
          aValue = getCrisisUrgency(a);
          bValue = getCrisisUrgency(b);
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
  }, [searchTerm, statusFilter, industryFilter, urgencyFilter]);

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
        <h3>🚨 Crisis Response ($500)</h3>
        <p>3-stage workflow: Crisis Description → AI Analysis → Action Plan</p>
      </div>

      {/* Professional Value Proposition */}
      <div className="service-value-proposition">
        <h4>🏆 Cristina's Crisis Management Expertise</h4>
        <div className="value-points">
          <div className="value-point">
            <strong>📜 Licensed Customs Broker #4601913:</strong> Professional crisis response with regulatory compliance expertise
          </div>
          <div className="value-point">
            <strong>🚚 17 Years Logistics Management:</strong> Electronics/telecom supply chain crisis experience with proven solutions
          </div>
          <div className="value-point">
            <strong>⚡ 24-48 Hour Response:</strong> Emergency action plans with immediate implementation timeline
          </div>
          <div className="value-point">
            <strong>🎣 Prevention Strategy:</strong> Post-crisis analysis with prevention measures to avoid future disruptions
          </div>
        </div>
        <div className="expert-credentials">
          <span className="professional-note">Licensed Professional Service - Emergency Response Specialist</span>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="search-filter-controls">
        <div className="search-row">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search by company, contact, product, industry, or crisis type..."
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
            <label>Urgency:</label>
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="filter-select">
              <option value="all">All Urgency Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
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
              <th>Crisis Type</th>
              <th onClick={() => handleSort('industry')} className="sortable">
                Industry {getSortIcon('industry')}
              </th>
              <th onClick={() => handleSort('urgency')} className="sortable">
                Urgency Level {getSortIcon('urgency')}
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
              const urgency = getCrisisUrgency(request);
              return (
                <tr key={request.id}>
                  <td>
                    <div className="client-info">
                      <strong>{request.company_name}</strong>
                      <div className="contact-name">{request.contact_name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="crisis-summary">
                      {request.service_details?.crisis_type || request.service_details?.product_description || 'Crisis details'}
                    </div>
                  </td>
                  <td>{request.industry || request.service_details?.industry || 'Industry'}</td>
                  <td>
                    <span className={`urgency-badge ${urgency.toLowerCase()}`}>
                      {urgency}
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
                      {request.status === 'completed' ? 'Completed' : 'Start Crisis Response'}
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
                <p>No crisis response requests pending.</p>
                <p className="secondary-text">
                  Requests will appear here when clients submit crisis response service requests.
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
          service={crisisResponseService}
          request={selectedRequest}
          onClose={closeModal}
          onComplete={handleWorkflowComplete}
        />
      )}
    </div>
  );
}

// Crisis Response Service Configuration - NO HARDCODING
const crisisResponseService = {
  title: 'Crisis Response Management',
  totalStages: 3,
  stageNames: ['Crisis Description', 'AI Analysis', 'Action Plan'],

  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const serviceDetails = request?.service_details || {};
    const subscriberData = serviceDetails;

    switch (stageNumber) {
      case 1:
        return (
          <CrisisDescriptionStage
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
          <ActionPlanStage
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

// Stage 1: Crisis Description Component
function CrisisDescriptionStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [formData, setFormData] = useState({
    crisis_type: '',
    timeline: '',
    current_impact: '',
    immediate_concerns: ''
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
        <h3>Stage 1: Crisis Description</h3>
        <p>Describe the crisis situation for targeted analysis</p>
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
            <div className="data-row"><span>Supplier Country:</span> <span>{serviceDetails?.supplier_country || 'Not specified'}</span></div>
            <div className="data-row"><span>Target Markets:</span> <span>{serviceDetails?.target_markets?.join(', ') || 'Not specified'}</span></div>
            <div className="data-row"><span>USMCA Status:</span> <span>{serviceDetails?.qualification_status || subscriberData?.qualification_status || 'Not determined'}</span></div>
          </div>

          {/* Component Origins Analysis */}
          <div className="data-section">
            <h6>Component Origins & Supply Chain Concentration Risk</h6>
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

          {/* Financial Impact Analysis */}
          {(serviceDetails?.annual_tariff_cost || serviceDetails?.potential_usmca_savings) && (
            <div className="data-section financial-impact-section">
              <h6>💰 Financial Impact Analysis</h6>
              {serviceDetails?.annual_tariff_cost && (
                <div className="data-row">
                  <span><strong>Annual Tariff Cost:</strong></span>
                  <span className="highlight-cost">${Number(serviceDetails.annual_tariff_cost).toLocaleString()}</span>
                </div>
              )}
              {serviceDetails?.potential_usmca_savings && (
                <div className="data-row">
                  <span><strong>Potential USMCA Savings:</strong></span>
                  <span className="highlight-savings">${Number(serviceDetails.potential_usmca_savings).toLocaleString()}/year</span>
                </div>
              )}
            </div>
          )}

          {/* Crisis-Specific Context */}
          {(serviceDetails?.crisis_type || serviceDetails?.crisis_timeline || serviceDetails?.business_impact) && (
            <div className="data-section crisis-context-section">
              <h6>🚨 Crisis Context from Subscriber</h6>
              {serviceDetails?.crisis_type && (
                <div className="data-row"><span><strong>Crisis Type:</strong></span> <span>{serviceDetails.crisis_type}</span></div>
              )}
              {serviceDetails?.crisis_timeline && (
                <div className="data-row"><span><strong>Timeline:</strong></span> <span>{serviceDetails.crisis_timeline}</span></div>
              )}
              {serviceDetails?.business_impact && (
                <div className="data-row"><span><strong>Business Impact:</strong></span> <span>{serviceDetails.business_impact}</span></div>
              )}
            </div>
          )}

          {/* Compliance Gaps */}
          {serviceDetails?.compliance_gaps && serviceDetails.compliance_gaps.length > 0 && (
            <div className="data-section compliance-section">
              <h6>⚠️ Compliance Gaps Identified</h6>
              <ul className="compliance-list">
                {serviceDetails.compliance_gaps.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vulnerability Factors - Critical for Crisis Response */}
          {serviceDetails?.vulnerability_factors && serviceDetails.vulnerability_factors.length > 0 && (
            <div className="data-section vulnerability-section">
              <h6>🚨 Vulnerability Factors (Critical for Crisis Assessment)</h6>
              <ul className="vulnerability-list">
                {serviceDetails.vulnerability_factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory Requirements */}
          {serviceDetails?.regulatory_requirements && serviceDetails.regulatory_requirements.length > 0 && (
            <div className="data-section regulatory-section">
              <h6>📋 Regulatory Requirements</h6>
              <ul className="regulatory-list">
                {serviceDetails.regulatory_requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="workflow-form">
        <div className="workflow-crisis-questions">
          <h4>🚨 Crisis Details (4 questions)</h4>

          <div className="form-group">
            <label>What crisis occurred?</label>
            <input
              type="text"
              name="crisis_type"
              value={formData.crisis_type}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Sudden tariff increase, supply chain disruption, trade war escalation"
              required
            />
          </div>

          <div className="form-group">
            <label>When did it happen?</label>
            <input
              type="text"
              name="timeline"
              value={formData.timeline}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Yesterday morning, Last week, This month"
              required
            />
          </div>

          <div className="form-group">
            <label>Current impact on operations?</label>
            <textarea
              name="current_impact"
              value={formData.current_impact}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="e.g., 50% cost increase, shipments delayed 2 weeks, can't access key suppliers"
              required
            />
          </div>

          <div className="form-group">
            <label>Immediate concerns?</label>
            <textarea
              name="immediate_concerns"
              value={formData.immediate_concerns}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="e.g., Customer contracts at risk, cash flow impact, need alternative routes by Friday"
              required
            />
          </div>
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
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAIAnalysis = async () => {
    try {
      // Simulate AI crisis analysis process
      setAnalysisStep(2); // Impact assessment
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalysisStep(3); // Resolution timeline
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalysisStep(4); // Action identification
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalysisStep(5); // Risk mitigation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate analysis results
      setAnalysisResult({
        impact_level: 'High severity crisis requiring immediate action',
        timeline: 'Recommend 24-48 hour response window',
        action_count: 'Multiple immediate steps identified',
        risk_factors: 'Trade disruption impact analysis completed'
      });

      setAnalysisComplete(true);
    } catch (error) {
      console.error('AI analysis error:', error);
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
        <p>AI analyzing crisis impact based on trade profile and situation</p>
      </div>

      <div className="workflow-subscriber-summary">
        <h4>🚨 Crisis Context</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Crisis Type:</strong> {stageData?.stage_1?.crisis_type || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Timeline:</strong> {stageData?.stage_1?.timeline || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Current Impact:</strong> {stageData?.stage_1?.current_impact || 'Not defined'}
          </div>
          <div className="workflow-data-item">
            <strong>Concerns:</strong> {stageData?.stage_1?.immediate_concerns || 'Not defined'}
          </div>
        </div>
      </div>

      <div className="workflow-ai-analysis">
        <div className="workflow-analysis-steps">
          <div className={`workflow-step ${analysisStep >= 1 ? 'active' : ''} ${analysisStep > 1 ? 'completed' : ''}`}>
            {analysisStep > 1 ? '✓' : '🔄'} Analyzing crisis situation
          </div>
          <div className={`workflow-step ${analysisStep >= 2 ? 'active' : ''} ${analysisStep > 2 ? 'completed' : ''}`}>
            {analysisStep > 2 ? '✓' : analysisStep >= 2 ? '🔄' : '⏳'} Assessing business impact
          </div>
          <div className={`workflow-step ${analysisStep >= 3 ? 'active' : ''} ${analysisStep > 3 ? 'completed' : ''}`}>
            {analysisStep > 3 ? '✓' : analysisStep >= 3 ? '🔄' : '⏳'} Calculating resolution timeline
          </div>
          <div className={`workflow-step ${analysisStep >= 4 ? 'active' : ''} ${analysisStep > 4 ? 'completed' : ''}`}>
            {analysisStep > 4 ? '✓' : analysisStep >= 4 ? '🔄' : '⏳'} Identifying immediate actions
          </div>
          <div className={`workflow-step ${analysisStep >= 5 ? 'active' : ''} ${analysisStep > 5 ? 'completed' : ''}`}>
            {analysisStep > 5 ? '✓' : analysisStep >= 5 ? '🔄' : '⏳'} Developing risk mitigation
          </div>
        </div>

        {analysisComplete && analysisResult && (
          <div className="workflow-analysis-result">
            <h4>🤖 AI Analysis Complete</h4>
            <div className="workflow-data-grid">
              <div className="workflow-data-item">
                <strong>Impact Assessment:</strong> {analysisResult.impact_level}
              </div>
              <div className="workflow-data-item">
                <strong>Resolution Timeline:</strong> {analysisResult.timeline}
              </div>
              <div className="workflow-data-item">
                <strong>Recommended Actions:</strong> {analysisResult.action_count}
              </div>
              <div className="workflow-data-item">
                <strong>Risk Analysis:</strong> {analysisResult.risk_factors}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="workflow-stage-actions">
        <button
          className="btn-primary"
          onClick={() => onComplete({
            ai_analysis_completed: true,
            analysis_result: analysisResult,
            completed_at: new Date().toISOString()
          })}
          disabled={!analysisComplete || loading}
        >
          {loading ? 'Processing...' : 'Continue to Action Plan →'}
        </button>
      </div>
    </div>
  );
}

// Stage 3: Action Plan Component
function ActionPlanStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [formData, setFormData] = useState({
    immediate_actions: '',
    short_term_plan: '',
    prevention_measures: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete({
      ...formData,
      service_completed: true,
      completed_at: new Date().toISOString()
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="workflow-stage">
      <div className="workflow-stage-header">
        <h3>Stage 3: Action Plan</h3>
        <p>Cristina creates specific action plan with timeline and prevention measures</p>
      </div>

      <div className="workflow-subscriber-summary">
        <h4>📊 AI Analysis Summary</h4>
        <div className="workflow-data-grid">
          <div className="workflow-data-item">
            <strong>Client:</strong> {request?.company_name}
          </div>
          <div className="workflow-data-item">
            <strong>Crisis:</strong> {stageData?.stage_1?.crisis_type}
          </div>
          <div className="workflow-data-item">
            <strong>Impact:</strong> {stageData?.stage_2?.analysis_result?.impact_level || 'Analysis completed'}
          </div>
          <div className="workflow-data-item">
            <strong>Timeline:</strong> {stageData?.stage_2?.analysis_result?.timeline || 'Immediate response needed'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="workflow-form">
        <div className="workflow-action-plan">
          <h4>📋 Cristina's Action Plan</h4>

          <div className="form-group">
            <label>Immediate Actions (24 hours):</label>
            <textarea
              name="immediate_actions"
              value={formData.immediate_actions}
              onChange={handleInputChange}
              className="form-input"
              rows="4"
              placeholder="e.g., 1) Contact alternative suppliers, 2) File emergency exemption request, 3) Notify key customers"
              required
            />
          </div>

          <div className="form-group">
            <label>Short-term Resolution (1-2 weeks):</label>
            <textarea
              name="short_term_plan"
              value={formData.short_term_plan}
              onChange={handleInputChange}
              className="form-input"
              rows="4"
              placeholder="e.g., Negotiate new supplier contracts, adjust pricing with customers, file trade remedy petitions"
              required
            />
          </div>

          <div className="form-group">
            <label>Prevention Measures:</label>
            <textarea
              name="prevention_measures"
              value={formData.prevention_measures}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="e.g., Diversify supplier base, monitor trade alerts, establish contingency contracts"
              required
            />
          </div>
        </div>

        <div className="workflow-stage-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Completing Service...' : 'Complete & Generate Action Plan PDF'}
          </button>
        </div>
      </form>
    </div>
  );
}