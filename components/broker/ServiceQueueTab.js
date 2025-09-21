/**
 * Cristina's Service Queue Tab - Broker Dashboard
 * Shows service requests with professional table and actions
 */

import { useState, useEffect } from 'react';

export default function ServiceQueueTab({ setSelectedRecord, setDetailPanelOpen }) {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadServiceRequests();
  }, []);

  const loadServiceRequests = async () => {
    try {
      const response = await fetch('/api/admin/service-requests');
      const data = await response.json();
      if (data.success && data.requests) {
        setServiceRequests(data.requests);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
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
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRecord({
      type: 'service_request',
      data: request
    });
    setDetailPanelOpen(true);
  };

  const filteredRequests = serviceRequests.filter(req =>
    statusFilter === 'all' || req.status === statusFilter
  );

  if (loading) {
    return <div className="loading-message">Loading service queue...</div>;
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Service Queue</h2>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="consultation_scheduled">Consultation Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="client_review">Client Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Service Type</th>
            <th>Request Date</th>
            <th>Status</th>
            <th>Urgency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map(request => (
            <tr key={request.id}>
              <td>{request.company_name}</td>
              <td className="service-type">{request.service_type?.replace(/-/g, ' ')}</td>
              <td>{new Date(request.created_at).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge status-${request.status}`}>
                  {request.status?.replace(/_/g, ' ')}
                </span>
              </td>
              <td>
                <span className={`priority-badge priority-${request.priority}`}>
                  {request.priority}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-info"
                    onClick={() => handleViewDetails(request)}
                  >
                    View
                  </button>
                  <button
                    className="btn-action btn-primary"
                    onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                  >
                    Start Work
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

      {filteredRequests.length === 0 && (
        <div className="empty-state">
          <p>No service requests found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}