/**
 * Universal Service Workflow Tab
 * Configurable component that works for any 4-stage service delivery
 * Used across Jorge's and Cristina's dashboards
 */

import { useState, useEffect } from 'react';
import ServiceProcessingModal from './ServiceProcessingModal';
import ServiceReportWizard from './ServiceReportWizard';

export default function ServiceWorkflowTab({
  serviceConfig,
  teamMember = 'jorge',
  onServiceUpdate
}) {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Service Processing Modal State
  const [processingModal, setProcessingModal] = useState({
    isOpen: false,
    request: null,
    currentStage: 1,
    formData: {}
  });

  // Report Generation Wizard State
  const [reportWizard, setReportWizard] = useState({
    isOpen: false,
    request: null,
    currentStep: 1,
    reportData: {}
  });

  // Client Communication Modal State
  const [communicationModal, setCommunicationModal] = useState({
    isOpen: false,
    request: null,
    messageType: 'update'
  });

  useEffect(() => {
    loadServiceRequests();
  }, [serviceConfig.type]);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/service-requests');
      const data = await response.json();

      if (data.success && data.requests) {
        // Filter requests for this specific service type
        const filteredRequests = data.requests.filter(req =>
          req.service_type === serviceConfig.type
        );
        setServiceRequests(filteredRequests);
      }
    } catch (error) {
      console.error(`Error loading ${serviceConfig.name} requests:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: newStatus })
      });

      if (response.ok) {
        loadServiceRequests();
        if (onServiceUpdate) onServiceUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openProcessingModal = (request) => {
    setProcessingModal({
      isOpen: true,
      request,
      currentStage: getCurrentStage(request.status),
      formData: request.processing_data || {}
    });
  };

  const openReportWizard = (request) => {
    setReportWizard({
      isOpen: true,
      request,
      currentStep: 1,
      reportData: request.report_data || {}
    });
  };

  const getCurrentStage = (status) => {
    const stageMap = {
      'pending': 1,
      'in-progress': 2,
      'processing': 2,
      'analysis': 2,
      'review': 3,
      'generation': 3,
      'completed': 4,
      'delivered': 4
    };
    return stageMap[status] || 1;
  };

  const getStageProgress = (request) => {
    const currentStage = getCurrentStage(request.status);
    return `Stage ${currentStage}/4`;
  };

  const filteredRequests = statusFilter === 'all'
    ? serviceRequests
    : serviceRequests.filter(req => req.status === statusFilter);

  if (loading) {
    return (
      <div className="tab-loading">
        <div className="loading-spinner">Loading {serviceConfig.name} requests...</div>
      </div>
    );
  }

  return (
    <div className="tab-content-wrapper">
      {/* Service Header */}
      <div className="card-header">
        <div>
          <h3 className="card-title">{serviceConfig.icon} {serviceConfig.name}</h3>
          <p className="card-subtitle">{serviceConfig.description}</p>
        </div>
        <div className="flex gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-btn secondary"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Service Metrics */}
      <div className="dashboard-metrics">
        <div className="metric-card">
          <h3 className="metric-title">Active Requests</h3>
          <div className="metric-value">
            {serviceRequests.filter(r => !['completed', 'delivered'].includes(r.status)).length}
          </div>
        </div>
        <div className="metric-card">
          <h3 className="metric-title">Monthly Capacity</h3>
          <div className="metric-value">
            {serviceRequests.length}/{serviceConfig.monthlyCapacity}
          </div>
        </div>
        <div className="metric-card">
          <h3 className="metric-title">Revenue</h3>
          <div className="metric-value">
            ${(serviceRequests.length * serviceConfig.price).toLocaleString()}
          </div>
        </div>
        <div className="metric-card">
          <h3 className="metric-title">Avg. Completion</h3>
          <div className="metric-value">{serviceConfig.avgCompletion}</div>
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="admin-card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Service Request</th>
                <th>Progress</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? filteredRequests.map((request, index) => (
                <tr key={request.id || index} className="admin-row">
                  <td>
                    <div className="client-info">
                      <div className="client-name">{request.client_name || 'Client Request'}</div>
                      <div className="client-details">{request.client_email || 'Service request'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="client-info">
                      <div className="client-name">{request.service_description || serviceConfig.name}</div>
                      <div className="client-details">{request.request_details || 'Standard service delivery'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="status-progress">
                      <span className={`status-indicator ${getStatusClass(request.status)}`}>
                        {getStageProgress(request)}
                      </span>
                      <div className="text-small">{request.status || 'Pending'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-indicator ${getPriorityClass(request.priority)}`}>
                      {request.priority || 'Standard'}
                    </span>
                  </td>
                  <td className="timeline-cell">
                    <div className="timeline-date">
                      {request.due_date ? new Date(request.due_date).toLocaleDateString() : 'TBD'}
                    </div>
                  </td>
                  <td className="action-buttons">
                    <button
                      className="admin-btn secondary"
                      onClick={() => openProcessingModal(request)}
                    >
                      Process
                    </button>
                    <button
                      className="admin-btn primary"
                      onClick={() => openReportWizard(request)}
                    >
                      Report
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    <div className="client-info">
                      <div className="client-name">No {serviceConfig.name} requests found</div>
                      <div className="client-details">Requests will appear here when clients submit service requests</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partnership Intelligence Preview - Special Feature */}
      {serviceConfig.hasIntelligencePreview && (
        <div className="admin-card">
          <div className="card-header">
            <h3 className="card-title">Live Intelligence Preview</h3>
            <p className="card-subtitle">Current intelligence data available for monthly reports</p>
          </div>

          <div className="intelligence-grid">
            {serviceConfig.intelligenceAreas.map(area => (
              <div key={area.id} className="intelligence-card">
                <div className="intelligence-header">
                  <span className="intelligence-icon">{area.icon}</span>
                  <div>
                    <h4 className="intelligence-title">{area.name}</h4>
                    <p className="intelligence-description">{area.description}</p>
                  </div>
                </div>
                <div className="intelligence-content">
                  {area.id === 'opportunities' && (
                    <div className="intelligence-summary">
                      <div className="metric-small">9 Core Partnership Sectors</div>
                      <div className="sample-items">
                        <div>• Agri-business & Food Security</div>
                        <div>• Responsible Mining Practices</div>
                        <div>• Cultural & Creative Industries</div>
                      </div>
                    </div>
                  )}
                  {area.id === 'executives' && (
                    <div className="intelligence-summary">
                      <div className="metric-small">Key Executives Tracked</div>
                      <div className="sample-items">
                        <div>• François Poirier (TC Energy) - $3.9B</div>
                        <div>• Keith Creel (CPKC) - Rail Network</div>
                        <div>• Scott Thomson (Scotiabank)</div>
                      </div>
                    </div>
                  )}
                  {area.id === 'rail' && (
                    <div className="intelligence-summary">
                      <div className="metric-small">Direct Rail Routes</div>
                      <div className="sample-items">
                        <div>• Vancouver → Mexico City (5-7 days)</div>
                        <div>• Calgary → Monterrey (4-6 days)</div>
                        <div>• Toronto → Guadalajara</div>
                      </div>
                    </div>
                  )}
                  {area.id === 'minerals' && (
                    <div className="intelligence-summary">
                      <div className="metric-small">Critical Materials</div>
                      <div className="sample-items">
                        <div>• Lithium (HS 2805.19) - Battery grade</div>
                        <div>• Copper (HS 7403.11) - Refined</div>
                        <div>• Nickel (HS 7502.10) - Class I</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="intelligence-footer">
            <p className="text-body">Intelligence data updated from official sources: Canada-Mexico Action Plan 2025-2028 & Trade Commissioner Service</p>
          </div>
        </div>
      )}

      {/* Service Processing Modal */}
      {processingModal.isOpen && (
        <ServiceProcessingModal
          isOpen={processingModal.isOpen}
          onClose={() => setProcessingModal({ ...processingModal, isOpen: false })}
          request={processingModal.request}
          serviceConfig={serviceConfig}
          currentStage={processingModal.currentStage}
          formData={processingModal.formData}
          onUpdate={loadServiceRequests}
        />
      )}

      {/* Report Generation Wizard */}
      {reportWizard.isOpen && (
        <ServiceReportWizard
          isOpen={reportWizard.isOpen}
          onClose={() => setReportWizard({ ...reportWizard, isOpen: false })}
          request={reportWizard.request}
          serviceConfig={serviceConfig}
          currentStep={reportWizard.currentStep}
          reportData={reportWizard.reportData}
          onComplete={loadServiceRequests}
        />
      )}
    </div>
  );
}

// Helper functions
function getStatusClass(status) {
  const statusClasses = {
    'pending': 'status-pending',
    'in-progress': 'status-in-progress',
    'processing': 'status-in-progress',
    'analysis': 'status-in-progress',
    'review': 'status-warning',
    'generation': 'status-warning',
    'completed': 'status-completed',
    'delivered': 'status-success'
  };
  return statusClasses[status] || 'status-pending';
}

function getPriorityClass(priority) {
  const priorityClasses = {
    'urgent': 'status-urgent',
    'high': 'status-warning',
    'standard': 'status-completed',
    'low': 'status-pending'
  };
  return priorityClasses[priority] || 'status-completed';
}