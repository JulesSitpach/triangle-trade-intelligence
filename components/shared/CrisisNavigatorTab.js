/**
 * CrisisNavigatorTab.js - Crisis Navigator Retainer Service
 * $200/month ongoing support where Cristina leads technical crisis response, Jorge manages client communication
 *
 * COLLABORATION MODEL:
 * - Cristina (Lead): Technical troubleshooting, regulatory crisis response, compliance issue resolution
 * - Jorge (Support): Client communication and reassurance, expectation management, relationship maintenance
 */

import { useState, useEffect } from 'react';
import ServiceWorkflowModal from '../shared/ServiceWorkflowModal';
import ToastNotification from '../shared/ToastNotification';
import MarketplaceIntelligenceForm from '../shared/MarketplaceIntelligenceForm';
import { filterByServiceType } from '../../lib/utils/service-type-mapping';
import AIResearchAssistant from '../admin/AIResearchAssistant';

export default function CrisisNavigatorTab({ requests: propRequests, onRequestUpdate }) {
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
      const crisisRequests = filterByServiceType(propRequests, 'crisis-navigator');
      setServiceRequests(crisisRequests);
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
        const filtered = filterByServiceType(data.requests || [], 'crisis-navigator');
        setServiceRequests(filtered);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading Crisis Navigator requests:', error);
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
    showToast('success', 'Crisis Navigator incident resolved successfully!');
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
                         data.product_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.crisis_type?.toLowerCase().includes(searchTerm.toLowerCase());
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
    } else if (sortBy === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityOrder[a.crisis_severity] || 4) - (severityOrder[b.crisis_severity] || 4);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <div className="loading-spinner">Loading Crisis Navigator incidents...</div>;
  }

  return (
    <div className="service-tab-container">
      {toast && <ToastNotification type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Search and Filter Controls */}
      <div className="service-controls">
        <input
          type="text"
          placeholder="Search by company, product, or crisis type..."
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
          <option value="severity">Sort by Severity</option>
          <option value="company">Sort by Company</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedRequests.length)} of {sortedRequests.length} incidents</span>
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
              <th>Crisis Type</th>
              <th>Severity</th>
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
                <td colSpan="5" className="loading-cell">Loading Crisis Navigator incidents...</td>
              </tr>
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-requests">
                  <p>No active crisis incidents.</p>
                  <p className="secondary-text">
                    Crisis incidents will appear here when retainer clients need support.
                  </p>
                </td>
              </tr>
            ) : paginatedRequests.map((request) => {
              const data = request.subscriber_data || request.service_details || {};
              const contactName = request.contact_name || data.contact_name || 'Contact not provided';

              return (
                <tr key={request.id}>
                  <td>
                    <div className="client-info">
                      <strong>{request.client_company || 'Unknown Company'}</strong>
                      <div className="contact-name">{contactName}</div>
                    </div>
                  </td>
                  <td>
                    <div className="crisis-type">
                      {request.crisis_type || 'Not specified'}
                    </div>
                  </td>
                <td>
                  <span className={`severity-badge severity-${request.crisis_severity || 'medium'}`}>
                    {request.crisis_severity?.toUpperCase() || 'ASSESSING'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${request.status?.replace('_', '-')}`}>
                    {request.status?.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleStartService(request)}
                      disabled={request.status === 'completed'}
                    >
                      {request.status === 'completed' ? 'Resolved' :
                       request.status === 'in_progress' ? 'Continue Response' : 'Begin Crisis Response'}
                    </button>
                    <AIResearchAssistant serviceRequest={request} />
                  </div>
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
            <span>Page {currentPage} of {totalPages} ({sortedRequests.length} total incidents)</span>
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
          serviceConfig={crisisNavigatorService}
          request={selectedRequest}
          onComplete={handleServiceComplete}
        />
      )}
    </div>
  );
}

// Service workflow configuration
const crisisNavigatorService = {
  title: 'Crisis Navigator - Emergency Response',
  totalStages: 3,
  stageNames: ['Crisis Triage (Cristina)', 'Technical Resolution (Cristina)', 'Follow-up Plan (Jorge + Cristina)'],
  renderStage: (stageNumber, request, stageData, onStageComplete, loading) => {
    const subscriberData = request.subscriber_data || {};
    const serviceDetails = {
      serviceType: 'Crisis Navigator',
      price: request.price || 200,
      leadRole: 'Cristina',
      supportRole: 'Jorge'
    };

    switch (stageNumber) {
      case 1:
        return (
          <CrisisTriageStage
            request={request}
            subscriberData={subscriberData}
            serviceDetails={serviceDetails}
            onComplete={onStageComplete}
            loading={loading}
          />
        );
      case 2:
        return (
          <TechnicalResolutionStage
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
          <DocumentationFollowupStage
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

// Stage 1: Crisis Intake & Triage - Assess severity and immediate actions
function CrisisTriageStage({ request, subscriberData, serviceDetails, onComplete, loading }) {
  const [triageAssessment, setTriageAssessment] = useState('');
  const [immediateActions, setImmediateActions] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      triage_assessment: triageAssessment,
      immediate_actions: immediateActions,
      stage: 1
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 1: Crisis Intake & Triage</h3>
        <p>Assess crisis severity, scope, and immediate actions required</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Assess technical severity, identify immediate risks, determine regulatory compliance implications</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Contact client for crisis details, manage expectations, communicate initial response timeline</p>
      </div>

      {/* Crisis Details */}
      <div className="crisis-details-section">
        <h4>Crisis Incident Details:</h4>

        <div className="data-grid">
          <div className="data-item">
            <strong>Company:</strong>
            <span>{request.client_company}</span>
          </div>
          <div className="data-item">
            <strong>Crisis Type:</strong>
            <span className="crisis-type">{request.crisis_type || 'Not specified'}</span>
          </div>
          <div className="data-item">
            <strong>Severity Level:</strong>
            <span className={`severity-indicator severity-${request.crisis_severity}`}>
              {request.crisis_severity?.toUpperCase() || 'ASSESSING'}
            </span>
          </div>
          <div className="data-item">
            <strong>Product Affected:</strong>
            <span>{subscriberData.product_description}</span>
          </div>
          <div className="data-item">
            <strong>Business Impact:</strong>
            <span>{request.business_impact || 'Under assessment'}</span>
          </div>
          <div className="data-item">
            <strong>Time Reported:</strong>
            <span>{new Date(request.created_at).toLocaleString()}</span>
          </div>
        </div>

        {request.crisis_description && (
          <div className="crisis-description">
            <strong>Client-Reported Crisis Description:</strong>
            <p>{request.crisis_description}</p>
          </div>
        )}

        <div className="client-context">
          <strong>Client Business Context:</strong>
          <ul>
            <li>Trade Volume: ${subscriberData.trade_volume}</li>
            <li>USMCA Status: {subscriberData.qualification_status}</li>
            <li>Manufacturing: {subscriberData.manufacturing_location}</li>
          </ul>
        </div>

        {subscriberData.component_origins && subscriberData.component_origins.length > 0 && (
          <div className="component-breakdown">
            <strong>Affected Supply Chain (with Tariff Intelligence):</strong>
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
                        <td style={{ textAlign: 'center', padding: '0.5rem', fontFamily: 'monospace' }}>
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

            {/* Visual Alerts */}
            {subscriberData.component_origins.some(c => (c.confidence || 100) < 80) && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#fef3c7', borderLeft: '3px solid #f59e0b' }}>
                ⚠️ <strong>Low Confidence Alert:</strong> Some components have AI classification confidence below 80%. May be relevant to crisis resolution.
              </div>
            )}

            {subscriberData.component_origins.some(c => {
              const mfnRate = c.mfn_rate || c.tariff_rates?.mfn_rate || 0;
              const usmcaRate = c.usmca_rate || c.tariff_rates?.usmca_rate || 0;
              return (mfnRate - usmcaRate) > 5 && !c.is_usmca_member;
            }) && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#ecfdf5', borderLeft: '3px solid #059669' }}>
                💰 <strong>Context:</strong> High tariff exposure detected on some components. May be relevant to crisis impact assessment.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Triage Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👩‍💼 Cristina's Technical Triage Assessment:</strong></label>
          <p className="form-helper-text">
            Assess: True severity level (critical/high/medium/low), technical scope of crisis, regulatory/compliance risks,
            potential business impact, resources needed for resolution, estimated resolution timeline
          </p>
          <textarea
            value={triageAssessment}
            onChange={(e) => setTriageAssessment(e.target.value)}
            placeholder="Document your technical assessment of the crisis..."
            rows={8}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>Immediate Actions Taken (Both):</strong></label>
          <p className="form-helper-text">
            👩‍💼 Cristina: What technical actions did you take immediately?
            👨‍💼 Jorge: How did you communicate with client? What expectations were set?
          </p>
          <textarea
            value={immediateActions}
            onChange={(e) => setImmediateActions(e.target.value)}
            placeholder="Document immediate actions taken by both team members..."
            rows={6}
            required
            className="form-textarea"
          />
        </div>

        <div className="triage-checklist">
          <h4>Triage Assessment Checklist:</h4>
          <ul>
            <li>✓ Crisis severity accurately assessed</li>
            <li>✓ Technical scope identified</li>
            <li>✓ Regulatory/compliance implications reviewed</li>
            <li>✓ Client contacted and expectations managed (Jorge)</li>
            <li>✓ Immediate actions documented</li>
            <li>✓ Resolution timeline estimated</li>
            <li>✓ Resources/expertise required identified</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Complete Triage → Begin Technical Resolution'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 2: Technical Resolution - Cristina leads technical troubleshooting
function TechnicalResolutionStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [technicalSolution, setTechnicalSolution] = useState('');
  const [clientUpdates, setClientUpdates] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      technical_solution: technicalSolution,
      client_updates: clientUpdates,
      stage: 2
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 2: Technical Resolution</h3>
        <p>Cristina leads technical troubleshooting and solution implementation</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Troubleshoot technical issues, implement solutions, verify compliance requirements met, test resolution</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Keep client informed with regular updates, manage escalations, coordinate any external resources needed</p>
      </div>

      {/* Previous Stage Summary */}
      {stageData.stage_1 && (
        <div className="previous-stage-summary">
          <h4>Stage 1 Triage Summary:</h4>
          <div className="summary-content">
            <strong>Triage Assessment:</strong>
            <p>{stageData.stage_1.triage_assessment}</p>
            <strong>Immediate Actions:</strong>
            <p>{stageData.stage_1.immediate_actions}</p>
          </div>
        </div>
      )}

      {/* Technical Resolution Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👩‍💼 Cristina: Technical Solution & Implementation:</strong></label>
          <p className="form-helper-text">
            Document: Root cause analysis, solution implemented, technical steps taken, compliance requirements addressed,
            testing/verification performed, any workarounds or temporary measures, resolution effectiveness
          </p>
          <textarea
            value={technicalSolution}
            onChange={(e) => setTechnicalSolution(e.target.value)}
            placeholder="Document your technical solution and implementation..."
            rows={10}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>👨‍💼 Jorge: Client Communication & Updates:</strong></label>
          <p className="form-helper-text">
            Document: How frequently did you update client? What information was shared? How did client respond?
            Any escalations or additional concerns raised? Client satisfaction with response?
          </p>
          <textarea
            value={clientUpdates}
            onChange={(e) => setClientUpdates(e.target.value)}
            placeholder="Document all client communications during resolution..."
            rows={6}
            required
            className="form-textarea"
          />
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Resolution Complete → Document & Follow-up'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stage 3: Documentation & Follow-up - Document resolution and prevent recurrence
function DocumentationFollowupStage({ request, subscriberData, serviceDetails, stageData, onComplete, loading }) {
  const [resolutionDocumentation, setResolutionDocumentation] = useState('');
  const [preventionPlan, setPreventionPlan] = useState('');
  const [clientFeedback, setClientFeedback] = useState('');
  const [marketplaceIntelligence, setMarketplaceIntelligence] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onComplete({
      resolution_documentation: resolutionDocumentation,
      prevention_plan: preventionPlan,
      client_feedback: clientFeedback,
      marketplace_intelligence: marketplaceIntelligence,
      stage: 3,
      status: 'completed'
    });
  };

  return (
    <div className="workflow-stage">
      <div className="stage-header">
        <h3>Stage 3: Documentation & Follow-up</h3>
        <p>Document resolution and create prevention plan for future</p>
      </div>

      <div className="collaboration-banner">
        <p><strong>👩‍💼 Cristina (Lead):</strong> Document technical resolution, create prevention recommendations, update knowledge base</p>
        <p><strong>👨‍💼 Jorge (Support):</strong> Confirm resolution with client, collect feedback, discuss ongoing support needs</p>
      </div>

      {/* Complete Crisis Response Summary */}
      <div className="service-summary">
        <h4>Complete Crisis Response Summary:</h4>

        {stageData.stage_1 && (
          <div className="summary-section">
            <strong>Stage 1 - Triage:</strong>
            <p><strong>Assessment:</strong> {stageData.stage_1.triage_assessment}</p>
            <p><strong>Immediate Actions:</strong> {stageData.stage_1.immediate_actions}</p>
          </div>
        )}

        {stageData.stage_2 && (
          <div className="summary-section">
            <strong>Stage 2 - Technical Resolution:</strong>
            <p><strong>Solution:</strong> {stageData.stage_2.technical_solution}</p>
            <p><strong>Client Updates:</strong> {stageData.stage_2.client_updates}</p>
          </div>
        )}
      </div>

      {/* Documentation Form */}
      <form onSubmit={handleSubmit} className="stage-form">
        <div className="form-group">
          <label><strong>👩‍💼 Cristina: Complete Resolution Documentation:</strong></label>
          <p className="form-helper-text">
            Create comprehensive documentation: Crisis summary, root cause, solution implemented, steps taken,
            resolution timeline, lessons learned, knowledge base entry
          </p>
          <textarea
            value={resolutionDocumentation}
            onChange={(e) => setResolutionDocumentation(e.target.value)}
            placeholder="Document complete crisis resolution for knowledge base..."
            rows={8}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>👩‍💼 Cristina: Prevention & Monitoring Plan:</strong></label>
          <p className="form-helper-text">
            Recommendations to prevent recurrence: Proactive monitoring, process improvements, documentation updates,
            training needs, system changes
          </p>
          <textarea
            value={preventionPlan}
            onChange={(e) => setPreventionPlan(e.target.value)}
            placeholder="Document prevention recommendations..."
            rows={6}
            required
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label><strong>👨‍💼 Jorge: Client Feedback & Satisfaction:</strong></label>
          <p className="form-helper-text">
            Client's feedback on resolution: Response time satisfaction, solution effectiveness, communication quality,
            any remaining concerns, ongoing support needs discussed
          </p>
          <textarea
            value={clientFeedback}
            onChange={(e) => setClientFeedback(e.target.value)}
            placeholder="Document client feedback and satisfaction..."
            rows={5}
            required
            className="form-textarea"
          />
        </div>

        {/* Marketplace Intelligence Capture */}
        <MarketplaceIntelligenceForm
          serviceType="Crisis Navigator"
          onDataChange={setMarketplaceIntelligence}
        />

        <div className="completion-checklist">
          <h4>Crisis Response Deliverables:</h4>
          <ul>
            <li>✓ Crisis triaged and severity assessed accurately</li>
            <li>✓ Technical solution implemented and tested</li>
            <li>✓ Client kept informed throughout process</li>
            <li>✓ Complete resolution documentation created</li>
            <li>✓ Prevention plan developed</li>
            <li>✓ Knowledge base updated</li>
            <li>✓ Client satisfaction confirmed</li>
            <li>✓ Ongoing monitoring recommendations provided</li>
          </ul>
        </div>

        <div className="stage-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Completing Response...' : '✓ Mark Crisis Resolved'}
          </button>
        </div>
      </form>
    </div>
  );
}
