/**
 * Cristina's Shipment Tracking Tab - Broker Dashboard
 * Shows shipment tracking and customs clearance status
 */

import { useState, useEffect } from 'react';

export default function ShipmentTrackingTab({ setSelectedRecord, setDetailPanelOpen }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadShipmentData();
  }, []);

  const loadShipmentData = async () => {
    try {
      const response = await fetch('/api/admin/shipment-tracking');
      const data = await response.json();
      if (data.shipments) {
        setShipments(data.shipments);
      }
    } catch (error) {
      console.error('Error loading shipment data:', error);
      // Use sample data if API fails
      setShipments([
        {
          id: 'SH001',
          tracking_number: '1Z999AA1234567890',
          client_name: 'ABC Electronics Corp',
          carrier: 'UPS',
          origin: 'Shenzhen, China',
          destination: 'Los Angeles, CA',
          shipment_status: 'in_transit',
          customs_status: 'cleared',
          last_update: new Date().toISOString(),
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          issues_alerts: null,
          value: 25000,
          weight: '150 kg'
        },
        {
          id: 'SH002',
          tracking_number: 'FDX123456789',
          client_name: 'Tech Manufacturing Inc',
          carrier: 'FedEx',
          origin: 'Toronto, Canada',
          destination: 'Mexico City, Mexico',
          shipment_status: 'delivered',
          customs_status: 'cleared',
          last_update: new Date().toISOString(),
          estimated_delivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          issues_alerts: null,
          value: 18500,
          weight: '89 kg'
        },
        {
          id: 'SH003',
          tracking_number: 'DHL987654321',
          client_name: 'Global Textiles Ltd',
          carrier: 'DHL',
          origin: 'Montreal, Canada',
          destination: 'Houston, TX',
          shipment_status: 'customs_delay',
          customs_status: 'pending',
          last_update: new Date().toISOString(),
          estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          issues_alerts: 'Documentation required for textile classification',
          value: 12000,
          weight: '245 kg'
        },
        {
          id: 'SH004',
          tracking_number: 'TNT555666777',
          client_name: 'Industrial Steel Co',
          carrier: 'TNT',
          origin: 'Mexico City, Mexico',
          destination: 'Vancouver, Canada',
          shipment_status: 'exception',
          customs_status: 'issues',
          last_update: new Date().toISOString(),
          estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          issues_alerts: 'USMCA certificate verification failed - requires resubmission',
          value: 45000,
          weight: '2500 kg'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (shipmentId, newStatus) => {
    try {
      const response = await fetch('/api/admin/shipment-tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shipmentId, shipment_status: newStatus })
      });
      if (response.ok) {
        loadShipmentData();
      }
    } catch (error) {
      console.error('Error updating shipment status:', error);
    }
  };

  const handleResolveIssue = async (shipmentId) => {
    try {
      const response = await fetch('/api/admin/shipment-tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: shipmentId,
          customs_status: 'cleared',
          issues_alerts: null
        })
      });
      if (response.ok) {
        loadShipmentData();
      }
    } catch (error) {
      console.error('Error resolving shipment issue:', error);
    }
  };

  const handleContactCarrier = (shipment) => {
    // This would integrate with carrier APIs or messaging system
    console.log('Contacting carrier for shipment:', shipment.tracking_number);
  };

  const handleViewDetails = (shipment) => {
    setSelectedRecord({
      type: 'shipment',
      data: shipment
    });
    setDetailPanelOpen(true);
  };

  const getShipmentStatusBadge = (status) => {
    const statusMap = {
      'in_transit': { class: 'status-info', text: '🚚 In Transit' },
      'delivered': { class: 'status-success', text: '✅ Delivered' },
      'customs_delay': { class: 'status-warning', text: '⏳ Customs Delay' },
      'exception': { class: 'status-error', text: '⚠️ Exception' },
      'pending_pickup': { class: 'status-pending', text: '📦 Pending Pickup' }
    };

    const statusInfo = statusMap[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getCustomsStatusBadge = (status) => {
    const statusMap = {
      'cleared': { class: 'status-success', text: '✅ Cleared' },
      'pending': { class: 'status-warning', text: '⏳ Pending' },
      'issues': { class: 'status-error', text: '❌ Issues' },
      'examination': { class: 'status-info', text: '🔍 Examination' }
    };

    const statusInfo = statusMap[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const filteredShipments = shipments.filter(shipment =>
    statusFilter === 'all' || shipment.shipment_status === statusFilter
  );

  if (loading) {
    return <div className="loading-message">Loading shipment data...</div>;
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Shipment Tracking</h2>
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending_pickup">Pending Pickup</option>
            <option value="in_transit">In Transit</option>
            <option value="customs_delay">Customs Delay</option>
            <option value="exception">Exception</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Tracking Number</th>
            <th>Client</th>
            <th>Route</th>
            <th>Shipment Status</th>
            <th>Customs Status</th>
            <th>Est. Delivery</th>
            <th>Issues/Alerts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredShipments.map(shipment => (
            <tr key={shipment.id}>
              <td className="tracking-number">
                <div>
                  <strong>{shipment.tracking_number}</strong>
                  <small className="carrier-info">{shipment.carrier}</small>
                </div>
              </td>
              <td>{shipment.client_name}</td>
              <td className="route-info">
                <div className="origin-destination">
                  <span className="origin">{shipment.origin}</span>
                  <span className="arrow">→</span>
                  <span className="destination">{shipment.destination}</span>
                </div>
              </td>
              <td>{getShipmentStatusBadge(shipment.shipment_status)}</td>
              <td>{getCustomsStatusBadge(shipment.customs_status)}</td>
              <td className="delivery-date">
                {new Date(shipment.estimated_delivery).toLocaleDateString()}
              </td>
              <td className="issues-column">
                {shipment.issues_alerts ? (
                  <div className="alert-message">
                    <span className="alert-icon">⚠️</span>
                    {shipment.issues_alerts}
                  </div>
                ) : (
                  <span className="no-issues">None</span>
                )}
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-info"
                    onClick={() => handleViewDetails(shipment)}
                  >
                    View
                  </button>
                  <button
                    className="btn-action btn-secondary"
                    onClick={() => handleContactCarrier(shipment)}
                  >
                    Contact
                  </button>
                  {shipment.issues_alerts && (
                    <button
                      className="btn-action btn-primary"
                      onClick={() => handleResolveIssue(shipment.id)}
                    >
                      Resolve
                    </button>
                  )}
                  {shipment.shipment_status === 'customs_delay' && (
                    <button
                      className="btn-action btn-warning"
                      onClick={() => handleUpdateStatus(shipment.id, 'in_transit')}
                    >
                      Expedite
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredShipments.length === 0 && (
        <div className="empty-state">
          <p>No shipments found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}