import { useState, useEffect } from 'react';

export default function ServiceQueueTab() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');

  // Service Details Modal State
  const [serviceModal, setServiceModal] = useState({
    isOpen: false,
    request: null,
    currentStage: 1,
    formData: {}
  });

  // Client Communication Modal State
  const [communicationModal, setCommunicationModal] = useState({
    isOpen: false,
    request: null,
    messageType: 'update'
  });

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/admin/service-requests');
      const data = await response.json();
      if (data.success) {
        setServiceRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
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
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openServiceDetails = (request) => {
    setServiceModal({
      isOpen: true,
      request: request,
      currentStage: 1,
      formData: {}
    });
  };

  const openCommunication = (request) => {
    setCommunicationModal({
      isOpen: true,
      request: request,
      messageType: 'update'
    });
  };

  const sendClientUpdate = async (email, message, type) => {
    try {
      const subject = getEmailSubject(type, communicationModal.request?.company_name);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: subject,
          message: message,
          template_type: 'service_update',
          client_name: communicationModal.request?.company_name,
          service_type: communicationModal.request?.service_type
        })
      });

      const result = await response.json();

      if (result.success) {
        setCommunicationModal({ isOpen: false, request: null, messageType: 'update' });
        alert('✅ Email sent successfully to ' + email);
      } else {
        alert('❌ Email failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending client update:', error);
      alert('❌ Email error: ' + error.message);
    }
  };

  const getEmailSubject = (type, companyName) => {
    switch(type) {
      case 'update': return `Service Update - ${companyName}`;
      case 'request': return `Information Request - ${companyName}`;
      case 'completion': return `Service Completed - ${companyName}`;
      case 'delay': return `Service Update - ${companyName}`;
      default: return `Message from Jorge Martinez - ${companyName}`;
    }
  };

  const filteredServiceRequests = serviceRequests.filter(request =>
    serviceTypeFilter === 'all' || request.service_type === serviceTypeFilter
  );

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Service Queue</h2>
        <div className="filter-controls">
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Service Types</option>
            <option value="supplier-vetting">Supplier Verification</option>
            <option value="market-entry">Market Entry</option>
            <option value="partnership-intelligence">Intelligence</option>
          </select>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Service Type</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredServiceRequests.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-state">
                No service requests found. Requests will appear here when clients submit service requests.
              </td>
            </tr>
          ) : filteredServiceRequests.map(request => (
            <tr key={request.id}>
              <td>{request.company_name}</td>
              <td>{request.service_type}</td>
              <td>
                <span className={`status-badge status-${request.status}`}>
                  {request.status}
                </span>
              </td>
              <td>{request.timeline || '-'}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-primary"
                    onClick={() => openServiceDetails(request)}
                  >
                    Details
                  </button>
                  <button
                    className="btn-action btn-info"
                    onClick={() => openCommunication(request)}
                  >
                    Update Client
                  </button>
                  <button
                    className="btn-action btn-success"
                    onClick={() => handleUpdateStatus(request.id, 'completed')}
                  >
                    Complete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Service Details Modal */}
      {serviceModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Service Request Details - {serviceModal.request?.company_name}</h2>
              <button
                className="modal-close"
                onClick={() => setServiceModal({ isOpen: false, request: null, currentStage: 1, formData: {} })}
              >
                ×
              </button>
            </div>

            <div className="service-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Service Type</label>
                  <span>{serviceModal.request?.service_type}</span>
                </div>
                <div className="detail-item">
                  <label>Current Status</label>
                  <span className={`status-badge status-${serviceModal.request?.status}`}>
                    {serviceModal.request?.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Timeline</label>
                  <span>{serviceModal.request?.timeline}</span>
                </div>
                <div className="detail-item">
                  <label>Priority</label>
                  <span className={`priority-badge priority-${serviceModal.request?.priority || 'medium'}`}>
                    {serviceModal.request?.priority || 'medium'}
                  </span>
                </div>
              </div>

              <div className="service-notes">
                <h3>Service Notes</h3>
                <textarea
                  className="service-textarea"
                  placeholder="Add notes about service progress, client communications, next steps..."
                  rows="4"
                />
              </div>

              <div className="service-actions">
                <h3>Quick Actions</h3>
                <div className="action-grid">
                  <button
                    className="btn-action btn-primary"
                    onClick={() => handleUpdateStatus(serviceModal.request?.id, 'in_progress')}
                  >
                    Start Service
                  </button>
                  <button
                    className="btn-action btn-warning"
                    onClick={() => handleUpdateStatus(serviceModal.request?.id, 'on_hold')}
                  >
                    Put on Hold
                  </button>
                  <button
                    className="btn-action btn-info"
                    onClick={() => {
                      setServiceModal({ isOpen: false, request: null, currentStage: 1, formData: {} });
                      openCommunication(serviceModal.request);
                    }}
                  >
                    Contact Client
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-action btn-secondary"
                onClick={() => setServiceModal({ isOpen: false, request: null, currentStage: 1, formData: {} })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Communication Modal */}
      {communicationModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Client Communication - {communicationModal.request?.company_name}</h2>
              <button
                className="modal-close"
                onClick={() => setCommunicationModal({ isOpen: false, request: null, messageType: 'update' })}
              >
                ×
              </button>
            </div>

            <div className="communication-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="client@company.com"
                  id="clientEmail"
                  defaultValue={communicationModal.request?.email || ''}
                />
              </div>

              <div className="form-group">
                <label>Message Type</label>
                <select
                  className="form-select"
                  value={communicationModal.messageType}
                  onChange={(e) => setCommunicationModal({
                    ...communicationModal,
                    messageType: e.target.value
                  })}
                >
                  <option value="update">Progress Update</option>
                  <option value="request">Information Request</option>
                  <option value="completion">Service Completion</option>
                  <option value="delay">Delay Notification</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message Content</label>
                <textarea
                  className="communication-textarea"
                  placeholder="Enter your message to the client..."
                  rows="6"
                  id="clientMessage"
                />
              </div>

              <div className="template-options">
                <h4>Quick Templates</h4>
                <div className="template-buttons">
                  <button
                    className="btn-template"
                    onClick={() => {
                      document.getElementById('clientMessage').value = `Hi ${communicationModal.request?.company_name}, your ${communicationModal.request?.service_type} service is progressing well. We're currently on schedule and will update you with results soon.`;
                    }}
                  >
                    Progress Update
                  </button>
                  <button
                    className="btn-template"
                    onClick={() => {
                      document.getElementById('clientMessage').value = `Hi ${communicationModal.request?.company_name}, we need some additional information to complete your ${communicationModal.request?.service_type} service. Please reply with the requested details.`;
                    }}
                  >
                    Info Request
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-action btn-primary"
                onClick={() => {
                  const email = document.getElementById('clientEmail').value;
                  const message = document.getElementById('clientMessage').value;
                  if (email.trim() && message.trim()) {
                    sendClientUpdate(email, message, communicationModal.messageType);
                  } else {
                    alert('Please enter both email address and message');
                  }
                }}
              >
                Send Message
              </button>
              <button
                className="btn-action btn-secondary"
                onClick={() => setCommunicationModal({ isOpen: false, request: null, messageType: 'update' })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}