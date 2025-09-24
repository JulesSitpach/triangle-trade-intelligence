import { useState, useEffect } from 'react';

export default function ServiceQueueTab() {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uniqueStatuses, setUniqueStatuses] = useState([]);
  const [uniqueServiceTypes, setUniqueServiceTypes] = useState([]);

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

  // Email Drafts State
  const [emailDrafts, setEmailDrafts] = useState([]);
  const [draftModal, setDraftModal] = useState({
    isOpen: false,
    draft: null,
    contactEmail: '',
    contactName: ''
  });

  useEffect(() => {
    loadServiceRequests();
    loadEmailDrafts();
  }, []);

  const loadEmailDrafts = async () => {
    try {
      const response = await fetch('/api/admin/email-drafts');
      const data = await response.json();
      if (data.success) {
        setEmailDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error('Error loading email drafts:', error);
    }
  };

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/admin/service-requests?assigned_to=Jorge');
      const data = await response.json();
      if (data.success) {
        const requests = data.requests || [];
        setServiceRequests(requests);

        const statuses = [...new Set(requests.map(r => r.status).filter(Boolean))];
        setUniqueStatuses(statuses);

        const serviceTypes = [...new Set(requests.map(r => r.service_type).filter(Boolean))];
        setUniqueServiceTypes(serviceTypes);
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

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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

  const filteredServiceRequests = serviceRequests.filter(request => {
    const matchesServiceType = serviceTypeFilter === 'all' || request.service_type === serviceTypeFilter;
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesServiceType && matchesStatus;
  });

  return (
    <div className="tab-content">
      {/* Email Drafts Section */}
      {emailDrafts.length > 0 && (
        <div className="section-header" style={{marginBottom: '2rem'}}>
          <h2 className="section-title">✉️ Email Drafts Ready to Send</h2>
          <p style={{color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem'}}>
            {emailDrafts.length} draft email{emailDrafts.length > 1 ? 's' : ''} waiting for contact information
          </p>

          <div style={{marginTop: '1rem', display: 'grid', gap: '1rem'}}>
            {emailDrafts.map(draft => (
              <div key={draft.id} className="card" style={{padding: '1rem', background: '#fef3c7'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                  <div style={{flex: 1}}>
                    <h3 style={{margin: '0 0 0.5rem 0', color: '#92400e'}}>{draft.email_subject}</h3>
                    <p style={{margin: '0 0 0.5rem 0', color: '#78350f', fontSize: '0.9rem'}}>
                      📋 {draft.form_type} • Request ID: {draft.request_id}
                    </p>
                    <p style={{margin: 0, color: '#78350f', fontSize: '0.85rem'}}>
                      Created: {new Date(draft.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="btn-action btn-primary"
                    onClick={() => setDraftModal({ isOpen: true, draft, contactEmail: '', contactName: '' })}
                  >
                    📧 Find Contact & Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">📋 Today's Service Queue</h2>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <div style={{fontSize: '0.9rem', color: '#6b7280'}}>
            <strong>{filteredServiceRequests.length}</strong> requests pending
            {filteredServiceRequests.filter(r => r.status === 'Stage 1: Form Completed').length > 0 && (
              <span style={{marginLeft: '1rem', color: '#059669'}}>
                • <strong>{filteredServiceRequests.filter(r => r.status === 'Stage 1: Form Completed').length}</strong> ready to process
              </span>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Services</option>
            {uniqueServiceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
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
            <tr key={request.id} className={request.status === 'Stage 1: Form Completed' ? 'highlight-row' : ''}>
              <td>
                <strong>{request.company_name}</strong>
                {request.status === 'Stage 1: Form Completed' && (
                  <div style={{fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem'}}>
                    🔔 Form completed - ready for processing
                  </div>
                )}
              </td>
              <td>{request.service_type}</td>
              <td>
                <span className={`status-badge status-${request.status}`}>
                  {request.status}
                </span>
              </td>
              <td>{request.timeline || '-'}</td>
              <td>
                <button
                  className="btn-action btn-primary"
                  onClick={() => {
                    const serviceTab = request.service_type === 'Supplier Sourcing' ? 'supplier-sourcing' :
                                      request.service_type === 'Manufacturing Feasibility' ? 'manufacturing-feasibility' :
                                      'market-entry';
                    window.location.href = `#${serviceTab}`;
                  }}
                >
                  {request.status === 'Stage 1: Form Completed' ? '🚀 Start Processing' : '👁️ View in Service Tab'}
                </button>
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
              <div className="detail-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem'}}>
                <div className="detail-item">
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem'}}>Service Type</label>
                  <span>{serviceModal.request?.service_type}</span>
                </div>
                <div className="detail-item">
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem'}}>Current Status</label>
                  <span className={`status-badge status-${serviceModal.request?.status}`}>
                    {serviceModal.request?.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem'}}>Timeline</label>
                  <span>{serviceModal.request?.timeline}</span>
                </div>
                <div className="detail-item">
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '0.5rem'}}>Priority</label>
                  <span className={`priority-badge priority-${serviceModal.request?.priority || 'medium'}`}>
                    {serviceModal.request?.priority || 'medium'}
                  </span>
                </div>
              </div>

              {serviceModal.request?.status === 'Stage 1: Form Completed' && serviceModal.request?.intake_form_data && (
                <div className="service-notes">
                  <h3>📋 Client's Completed Intake Form</h3>
                  <div style={{padding: '1rem', background: '#ecfdf5', borderRadius: '8px', marginBottom: '1rem'}}>
                    <p style={{color: '#059669', marginBottom: '0.5rem'}}>✅ Form received from client</p>
                    <p style={{color: '#6b7280', fontSize: '0.9rem'}}>Review the client's responses before proceeding to Stage 2.</p>
                  </div>
                  <textarea
                    className="service-textarea"
                    value={JSON.stringify(serviceModal.request?.intake_form_data, null, 2)}
                    readOnly
                    rows="10"
                    style={{fontFamily: 'monospace', fontSize: '0.85rem', background: '#f9fafb'}}
                  />
                </div>
              )}

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
                <div className="action-buttons" style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
                  {serviceModal.request?.status === 'Stage 1: Form Completed' && (
                    <button
                      className="btn-action btn-primary"
                      onClick={() => {
                        setServiceModal({ isOpen: false, request: null, currentStage: 1, formData: {} });
                        window.location.href = '#supplier-sourcing';
                      }}
                    >
                      🚀 Go to Supplier Sourcing
                    </button>
                  )}
                  <button
                    className="btn-action btn-secondary"
                    onClick={() => {
                      setServiceModal({ isOpen: false, request: null, currentStage: 1, formData: {} });
                      openCommunication(serviceModal.request);
                    }}
                  >
                    💬 Contact Client
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

            <div className="verification-form">
              <div className="report-generation">
                <p><strong>📤 Email Composition</strong></p>
                <div style={{display: 'flex', gap: '2rem', marginBottom: '1rem'}}>
                  <div><strong>From:</strong> Jorge Martinez (triangleintel@gmail.com)</div>
                  <div><strong>To:</strong> Client Email Below</div>
                </div>
              </div>

              <div className="form-group">
                <label><strong>📧 TO: Client Email Address</strong></label>
                <input
                  type="email"
                  placeholder="client@company.com"
                  id="clientEmail"
                  defaultValue={communicationModal.request?.email || ''}
                  style={{border: '2px solid #2563eb', backgroundColor: '#f0f9ff'}}
                />
              </div>

              <div className="form-group">
                <label>📋 Message Type</label>
                <select
                  value={communicationModal.messageType}
                  onChange={(e) => setCommunicationModal({
                    ...communicationModal,
                    messageType: e.target.value
                  })}
                >
                  <option value="update">📈 Progress Update</option>
                  <option value="request">❓ Information Request</option>
                  <option value="completion">✅ Service Completion</option>
                  <option value="delay">⏰ Delay Notification</option>
                </select>
              </div>

              <div className="form-group">
                <label>✍️ Message Content</label>
                <textarea
                  placeholder="Enter your professional message to the client..."
                  rows="8"
                  id="clientMessage"
                />
              </div>

              <div className="stage-content">
                <h3>⚡ Quick Templates</h3>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-primary"
                    onClick={() => {
                      document.getElementById('clientMessage').value = `Dear ${communicationModal.request?.company_name} team,

I hope this message finds you well. I wanted to provide you with an update on your ${communicationModal.request?.service_type} service.

Your project is progressing well and we're currently on schedule. Our team has completed the initial assessment phase and we will be moving forward with the next steps shortly.

I will keep you updated with our progress and reach out if we need any additional information from your side.

Best regards,
Jorge Martinez
Triangle Intelligence - Latin America Partnerships`;
                    }}
                  >
                    📈 Progress Update
                  </button>
                  <button
                    className="btn-action btn-secondary"
                    onClick={() => {
                      document.getElementById('clientMessage').value = `Dear ${communicationModal.request?.company_name} team,

Thank you for working with Triangle Intelligence on your ${communicationModal.request?.service_type} service.

To ensure we provide you with the most accurate and comprehensive results, we need some additional information from your side:

• [Specify required information]
• [Additional details needed]
• [Documentation required]

Please reply to this email with the requested information at your earliest convenience. This will help us maintain our timeline and deliver exceptional results.

Thank you for your cooperation.

Best regards,
Jorge Martinez
Triangle Intelligence - Latin America Partnerships`;
                    }}
                  >
                    ❓ Info Request
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-action btn-secondary"
                onClick={() => setCommunicationModal({ isOpen: false, request: null, messageType: 'update' })}
              >
                Cancel
              </button>
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
                📤 Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Draft Modal */}
      {draftModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📧 Complete & Send Email Draft</h2>
              <button
                className="modal-close"
                onClick={() => setDraftModal({ isOpen: false, draft: null, contactEmail: '', contactName: '' })}
              >
                ×
              </button>
            </div>

            <div className="verification-form">
              <div className="report-generation" style={{marginBottom: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px'}}>
                <p style={{margin: '0 0 0.5rem 0', color: '#92400e'}}><strong>📋 {draftModal.draft?.form_type}</strong></p>
                <p style={{margin: 0, color: '#78350f', fontSize: '0.9rem'}}>Request ID: {draftModal.draft?.request_id}</p>
              </div>

              <div className="form-group">
                <label><strong>👤 Contact Name</strong></label>
                <input
                  type="text"
                  placeholder="e.g., Maria Rodriguez"
                  value={draftModal.contactName}
                  onChange={(e) => setDraftModal({...draftModal, contactName: e.target.value})}
                  style={{border: '2px solid #2563eb'}}
                />
                <p style={{fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem'}}>
                  Search for the decision maker before sending
                </p>
              </div>

              <div className="form-group">
                <label><strong>📧 Contact Email</strong></label>
                <input
                  type="email"
                  placeholder="maria.rodriguez@company.com"
                  value={draftModal.contactEmail}
                  onChange={(e) => setDraftModal({...draftModal, contactEmail: e.target.value})}
                  style={{border: '2px solid #2563eb', backgroundColor: '#f0f9ff'}}
                />
              </div>

              <div className="form-group">
                <label><strong>✉️ Email Subject</strong></label>
                <input
                  type="text"
                  value={draftModal.draft?.email_subject || ''}
                  readOnly
                  style={{background: '#f9fafb'}}
                />
              </div>

              <div className="form-group">
                <label><strong>📝 Email Body Preview</strong></label>
                <div
                  style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ __html: draftModal.draft?.email_body }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-action btn-secondary"
                onClick={() => setDraftModal({ isOpen: false, draft: null, contactEmail: '', contactName: '' })}
              >
                Cancel
              </button>
              <button
                className="btn-action btn-primary"
                onClick={async () => {
                  if (!draftModal.contactEmail.trim() || !draftModal.contactName.trim()) {
                    alert('Please enter contact name and email');
                    return;
                  }

                  try {
                    // Send email using nodemailer endpoint
                    const emailResponse = await fetch('/api/send-draft-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: draftModal.contactEmail,
                        subject: draftModal.draft.email_subject,
                        html: draftModal.draft.email_body,
                        contactName: draftModal.contactName
                      })
                    });

                    if (emailResponse.ok) {
                      // Delete draft after sending
                      await fetch('/api/admin/email-drafts', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: draftModal.draft.id })
                      });

                      alert('✅ Email sent successfully to ' + draftModal.contactEmail);
                      setDraftModal({ isOpen: false, draft: null, contactEmail: '', contactName: '' });
                      loadEmailDrafts();
                    } else {
                      alert('Failed to send email');
                    }
                  } catch (error) {
                    console.error('Error sending email:', error);
                    alert('Failed to send email: ' + error.message);
                  }
                }}
              >
                📤 Send Email Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}