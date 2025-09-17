/**
 * Cristina's Broker Dashboard - Operational Work Queue System
 * Licensed Customs Broker #4601913 - ServiceNow/Zendesk style workflow management
 * Focus: Getting customs/logistics work done efficiently, not sales conversion
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { BROKER_CONFIG, SHIPMENT_CONFIG, ANALYTICS_CONFIG } from '../../config/broker-config';

export default function BrokerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'desc' });
  const [filterView, setFilterView] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);

  // Operational work queue states
  const [workQueue, setWorkQueue] = useState([]);
  const [activeShipments, setActiveShipments] = useState([]);
  const [complianceMonitoring, setComplianceMonitoring] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  useEffect(() => {
    // Check admin authentication
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(stored);
      if (!userData.isAdmin) {
        router.push('/dashboard');
        return;
      }
      setUser(userData);
      loadBrokerWorkQueue();
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBrokerWorkQueue = async () => {
    try {
      setLoading(true);

      // Load operational data from APIs
      const [operationsResponse, shipmentsResponse, complianceResponse] = await Promise.all([
        fetch('/api/admin/broker-operations'),
        fetch('/api/admin/broker-services'),
        fetch('/api/admin/compliance-pipeline')
      ]);

      // Process broker operations into work queue
      if (operationsResponse.ok) {
        const operationsData = await operationsResponse.json();
        const workQueueItems = operationsData.operations?.map(operation => ({
          id: operation.id,
          priority: determinePriority(operation),
          client: operation.company,
          shipmentId: generateShipmentId(operation),
          hsCode: extractHSCode(operation),
          type: determineWorkType(operation),
          deadline: calculateDeadline(operation),
          status: mapToWorkStatus(operation.status),
          customsStatus: operation.customsStatus,
          notes: operation.brokerNotes,
          value: operation.shipmentValue,
          source: operation.source || 'platform'
        })) || [];
        setWorkQueue(workQueueItems);
      } else {
        setWorkQueue([]);
      }

      // Process active shipments for tracking board
      if (shipmentsResponse.ok) {
        const shipmentsData = await shipmentsResponse.json();
        const shipmentsBoard = shipmentsData.services?.map(service => ({
          id: service.id,
          shipmentId: generateShipmentId(service),
          client: service.company,
          origin: inferOrigin(service),
          destination: inferDestination(service),
          border: determineBorderCrossing(service),
          status: service.status,
          eta: service.completionDate,
          issues: determineIssues(service),
          trackingNumber: service.trackingNumber
        })) || [];
        setActiveShipments(shipmentsBoard);
      } else {
        setActiveShipments([]);
      }

      // Process compliance monitoring
      if (complianceResponse.ok) {
        const complianceData = await complianceResponse.json();
        const complianceItems = complianceData.pipeline?.map(item => ({
          id: item.id,
          client: item.company,
          requirement: mapToRequirement(item.requestType),
          type: getComplianceType(item.requestType),
          dueDate: calculateComplianceDeadline(item),
          daysLeft: calculateDaysLeft(item),
          status: item.status,
          estimatedValue: item.estimatedValue
        })) || [];
        setComplianceMonitoring(complianceItems);
      } else {
        setComplianceMonitoring([]);
      }

    } catch (error) {
      console.error('Error loading broker work queue:', error);
      setWorkQueue([]);
      setActiveShipments([]);
      setComplianceMonitoring([]);
    } finally {
      setLoading(false);
    }
  };

  // Work queue business logic functions
  const determinePriority = (operation) => {
    const value = operation.shipmentValue || 0;
    const status = operation.status;
    const customsStatus = operation.customsStatus;

    if (customsStatus === 'Review Required' || status === 'Customs Review') return 'HIGH';
    if (value > 500000 || customsStatus === 'Pending') return 'MEDIUM';
    return 'LOW';
  };

  const generateShipmentId = (operation) => {
    const prefix = operation.company?.substring(0, 2).toUpperCase() || 'XX';
    const year = new Date().getFullYear();
    const id = operation.id?.toString().padStart(3, '0') || '000';
    return `${prefix}-${year}-${id}`;
  };

  const extractHSCode = (operation) => {
    // Extract HS code from product type or generate based on shipment type
    const shipmentType = operation.shipmentType || '';

    if (shipmentType.includes('Electronics')) return '8544.42.90';
    if (shipmentType.includes('Automotive')) return '8708.30.50';
    if (shipmentType.includes('Wire')) return '8544.60.00';
    if (shipmentType.includes('Textiles')) return '6109.10.00';
    return '9999.99.99'; // Generic code
  };

  const determineWorkType = (operation) => {
    const status = operation.status;
    const customsStatus = operation.customsStatus;

    if (status === 'Ready for Shipment') return 'Export Documentation';
    if (status === 'In Transit') return 'Transit Monitoring';
    if (status === 'Customs Review') return 'Import Clearance';
    if (customsStatus === 'Pre-cleared') return 'Certificate Processing';
    return 'General Processing';
  };

  const calculateDeadline = (operation) => {
    const expectedClearance = operation.expectedClearance;
    if (expectedClearance) return expectedClearance;

    const today = new Date();
    const priority = determinePriority(operation);

    const daysToAdd = priority === 'HIGH' ? 1 : priority === 'MEDIUM' ? 3 : 7;
    const deadline = new Date(today);
    deadline.setDate(today.getDate() + daysToAdd);

    return deadline.toISOString().split('T')[0];
  };

  const mapToWorkStatus = (operationStatus) => {
    const statusMap = {
      'Ready for Shipment': 'Pending',
      'In Transit': 'In Process',
      'Customs Review': 'Review Required',
      'Delivered': 'Completed'
    };
    return statusMap[operationStatus] || 'Pending';
  };

  const inferOrigin = (service) => {
    const serviceType = service.serviceType || '';
    if (serviceType.includes('USMCA')) return 'Mexico City';
    if (serviceType.includes('Logistics')) return 'Guadalajara';
    return 'Monterrey';
  };

  const inferDestination = (service) => {
    const serviceType = service.serviceType || '';
    if (serviceType.includes('Emergency')) return 'Border Location';
    if (serviceType.includes('Audit')) return 'Corporate Office';
    return 'Distribution Center';
  };

  const determineBorderCrossing = (service) => {
    const crossings = ['Laredo', 'Tijuana', 'Nogales', 'El Paso', 'Brownsville'];
    return crossings[Math.floor(Math.random() * crossings.length)];
  };

  const determineIssues = (service) => {
    const status = service.status;
    if (status === 'In Progress') return 'None';
    if (status === 'Quoted') return 'Pending Approval';
    return 'Documentation';
  };

  const mapToRequirement = (requestType) => {
    const requirementMap = {
      'Full USMCA Certification': 'USMCA Certificate',
      'Certificate Validation': 'Certificate Renewal',
      'Compliance Assessment': 'Compliance Audit',
      'Documentation Review': 'Document Filing'
    };
    return requirementMap[requestType] || 'General Requirement';
  };

  const getComplianceType = (requestType) => {
    if (requestType.includes('USMCA')) return 'Certificate';
    if (requestType.includes('Compliance')) return 'Audit';
    if (requestType.includes('Emergency')) return 'Emergency';
    return 'Standard';
  };

  const calculateComplianceDeadline = (item) => {
    const today = new Date();
    const timeline = item.timeline || '2-4 weeks';

    let daysToAdd = 14; // Default
    if (timeline.includes('24-48 hours')) daysToAdd = 2;
    else if (timeline.includes('3-5 business days')) daysToAdd = 5;
    else if (timeline.includes('1-2 weeks')) daysToAdd = 14;

    const deadline = new Date(today);
    deadline.setDate(today.getDate() + daysToAdd);
    return deadline.toISOString().split('T')[0];
  };

  const calculateDaysLeft = (item) => {
    const deadline = calculateComplianceDeadline(item);
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return 'priority-low';
    }
  };

  const getStatusBadge = (status) => {
    const badgeMap = {
      'Pending': 'badge-warning',
      'In Process': 'badge-info',
      'Review Required': 'badge-danger',
      'Completed': 'badge-success',
      'Draft': 'badge-secondary'
    };
    return badgeMap[status] || 'badge-info';
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  };

  const handleWorkAction = (action, itemId) => {
    console.log(`${action} action on item ${itemId}`);
    alert(`${action} initiated for item ${itemId}`);
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk ${action} on items:`, selectedItems);
    alert(`Bulk ${action} executed on ${selectedItems.length} items`);
    setSelectedItems([]);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading {BROKER_CONFIG.license.name}'s Work Queue...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{BROKER_CONFIG.license.name}'s Broker Operations - Licensed #{BROKER_CONFIG.license.number}</title>
        <link rel="stylesheet" href="/styles/salesforce-tables.css" />
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">
          {/* Header */}
          <div className="section-header">
            <h1 className="section-header-title">📋 {BROKER_CONFIG.license.name}'s Broker Operations</h1>
            <p className="section-header-subtitle">
              Licensed Customs Broker #{BROKER_CONFIG.license.number} • Operational Work Queue Management
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'queue' ? 'active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              📋 Work Queue
            </button>
            <button
              className={`tab-button ${activeTab === 'shipments' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipments')}
            >
              🚛 Active Shipments
            </button>
            <button
              className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`}
              onClick={() => setActiveTab('compliance')}
            >
              ⚖️ Compliance Monitoring
            </button>
          </div>

          {/* Work Queue Tab */}
          {activeTab === 'queue' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📋 Customs Brokerage Queue</h2>
                <div className="filter-controls">
                  <select
                    value={filterView}
                    onChange={(e) => setFilterView(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Items</option>
                    <option value="high">High Priority</option>
                    <option value="pending">Pending Work</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="bulk-actions">
                  <span>{selectedItems.length} selected</span>
                  <button onClick={() => handleBulkAction('Process')} className="bulk-btn">
                    ⚡ Bulk Process
                  </button>
                  <button onClick={() => handleBulkAction('Assign')} className="bulk-btn">
                    👤 Assign
                  </button>
                  <button onClick={() => handleBulkAction('Update')} className="bulk-btn">
                    📝 Update Status
                  </button>
                </div>
              )}

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th>Priority</th>
                      <th>Client</th>
                      <th>Shipment ID</th>
                      <th>HS Code</th>
                      <th>Type</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workQueue.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          No items in work queue. Shipments will appear here as they require customs processing.
                        </td>
                      </tr>
                    ) : (
                      workQueue.map(item => (
                        <tr key={item.id} className="clickable-row">
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => {
                                setSelectedItems(prev =>
                                  prev.includes(item.id)
                                    ? prev.filter(id => id !== item.id)
                                    : [...prev, item.id]
                                );
                              }}
                            />
                          </td>
                          <td>
                            <span className={`badge ${item.priority === 'HIGH' ? 'badge-danger' : item.priority === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                              {item.priority === 'HIGH' ? '🔴' : item.priority === 'MEDIUM' ? '🟡' : '🟢'} {item.priority}
                            </span>
                          </td>
                          <td className="client-name">{item.client}</td>
                          <td className="shipment-id">{item.shipmentId}</td>
                          <td className="hs-code">{item.hsCode}</td>
                          <td>{item.type}</td>
                          <td className={`deadline ${item.priority === 'HIGH' ? 'urgent' : ''}`}>
                            {item.deadline}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <button
                              className="action-btn process"
                              onClick={() => handleWorkAction('Process', item.id)}
                            >
                              ⚡ Process
                            </button>
                            <button
                              className="action-btn call"
                              onClick={() => handleWorkAction('Call', item.id)}
                            >
                              📞 Call
                            </button>
                            {item.priority === 'HIGH' && (
                              <button
                                className="action-btn rush"
                                onClick={() => handleWorkAction('Rush', item.id)}
                              >
                                🚨 Rush
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Shipments Tab */}
          {activeTab === 'shipments' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">🚛 Active Shipments Tracking Board</h2>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Shipment</th>
                      <th>Client</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Border</th>
                      <th>Status</th>
                      <th>ETA</th>
                      <th>Issues</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeShipments.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          No active shipments. Shipments will appear here during transit and customs processing.
                        </td>
                      </tr>
                    ) : (
                      activeShipments.map(shipment => (
                        <tr key={shipment.id} className="clickable-row">
                          <td className="shipment-id">{shipment.shipmentId}</td>
                          <td className="client-name">{shipment.client}</td>
                          <td>{shipment.origin}</td>
                          <td>{shipment.destination}</td>
                          <td className="border-crossing">{shipment.border}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(shipment.status)}`}>
                              {shipment.status}
                            </span>
                          </td>
                          <td className="eta">{shipment.eta}</td>
                          <td className={`issues ${shipment.issues !== 'None' ? 'has-issues' : ''}`}>
                            {shipment.issues}
                          </td>
                          <td className="action-buttons">
                            <button
                              className="action-btn track"
                              onClick={() => handleWorkAction('Track', shipment.id)}
                            >
                              📍 Track
                            </button>
                            <button
                              className="action-btn update"
                              onClick={() => handleWorkAction('Update', shipment.id)}
                            >
                              📝 Update
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compliance Monitoring Tab */}
          {activeTab === 'compliance' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">⚖️ Compliance Monitoring & Deadlines</h2>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Requirement</th>
                      <th>Type</th>
                      <th>Due Date</th>
                      <th>Days Left</th>
                      <th>Status</th>
                      <th>Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceMonitoring.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          No compliance items to monitor. Regulatory requirements will appear here as deadlines approach.
                        </td>
                      </tr>
                    ) : (
                      complianceMonitoring.map(item => (
                        <tr key={item.id} className="clickable-row">
                          <td className="client-name">{item.client}</td>
                          <td>{item.requirement}</td>
                          <td>
                            <span className={`badge ${item.type === 'Certificate' ? 'badge-info' : item.type === 'Emergency' ? 'badge-danger' : 'badge-secondary'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="due-date">{item.dueDate}</td>
                          <td>
                            <span className={`badge ${item.daysLeft <= 7 ? 'badge-danger' : item.daysLeft <= 14 ? 'badge-warning' : 'badge-success'}`}>
                              {item.daysLeft} days
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="compliance-value">{formatCurrency(item.estimatedValue)}</td>
                          <td className="action-buttons">
                            <button
                              className="action-btn prepare"
                              onClick={() => handleWorkAction('Prepare', item.id)}
                            >
                              📋 Prepare
                            </button>
                            <button
                              className="action-btn submit"
                              onClick={() => handleWorkAction('Submit', item.id)}
                            >
                              📤 Submit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Professional Credentials */}
          <div className="content-card">
            <h3 className="content-card-title">🎖️ Licensed Customs Broker Credentials</h3>
            <div className="credentials-footer">
              <div className="credential-item">
                <strong>License #{BROKER_CONFIG.license.number}</strong>
                <span>Federal Customs Broker</span>
              </div>
              <div className="credential-item">
                <strong>{BROKER_CONFIG.license.country} Operations</strong>
                <span>USMCA Specialist</span>
              </div>
              <div className="credential-item">
                <strong>15+ Years Experience</strong>
                <span>Triangle Routing Expert</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}