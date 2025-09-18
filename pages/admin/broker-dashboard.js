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
import TableWorkspace from '../../components/admin/TableWorkspace';

export default function BrokerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'desc' });
  const [filterView, setFilterView] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);

  // Workspace states for inline editing
  const [openWorkspaces, setOpenWorkspaces] = useState({});
  const [workspaceData, setWorkspaceData] = useState({});

  // Operational work queue states
  const [workQueue, setWorkQueue] = useState([]);
  const [activeShipments, setActiveShipments] = useState([]);
  const [complianceMonitoring, setComplianceMonitoring] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [professionalServices, setProfessionalServices] = useState({});

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
      const [operationsResponse, shipmentsResponse, complianceResponse, professionalResponse] = await Promise.all([
        fetch('/api/admin/broker-operations'),
        fetch('/api/admin/broker-services'),
        fetch('/api/admin/compliance-pipeline'),
        fetch('/api/admin/professional-services')
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

      // Process professional services data for Cristina's service delivery
      if (professionalResponse.ok) {
        const professionalData = await professionalResponse.json();
        setProfessionalServices({
          cristina_delivery: professionalData.cristina_service_delivery || [],
          consultation_revenue: professionalData.cristina_consultation_revenue || [],
          utilization_metrics: professionalData.utilization_metrics || {}
        });
      } else {
        setProfessionalServices({
          cristina_delivery: [],
          consultation_revenue: [],
          utilization_metrics: {}
        });
      }

    } catch (error) {
      console.error('Error loading broker work queue:', error);
      setWorkQueue([]);
      setActiveShipments([]);
      setComplianceMonitoring([]);
      setProfessionalServices({
        cristina_delivery: [],
        consultation_revenue: [],
        utilization_metrics: {}
      });
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

  // Workspace management functions
  const toggleWorkspace = (tableType, recordId) => {
    const workspaceKey = `${tableType}_${recordId}`;
    setOpenWorkspaces(prev => ({
      ...prev,
      [workspaceKey]: !prev[workspaceKey]
    }));
  };

  const handleWorkspaceSave = async (tableType, formData) => {
    try {
      // Save data to appropriate API endpoint
      let endpoint = '';
      switch (tableType) {
        case 'work_queue':
          endpoint = '/api/admin/broker-operations';
          break;
        case 'shipments':
          endpoint = '/api/admin/broker-services';
          break;
        case 'compliance':
          endpoint = '/api/admin/compliance-pipeline';
          break;
        case 'revenue':
          endpoint = '/api/admin/professional-services';
          break;
        default:
          throw new Error('Unknown table type');
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        console.log(`${tableType} data saved successfully`);
        loadBrokerWorkQueue(); // Reload data
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error(`Error saving ${tableType} data:`, error);
      alert(`Error saving data. Please try again.`);
    }
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

  const handleWorkAction = (action, itemId, itemData) => {
    console.log(`${action} action on item ${itemId}`);
    toggleWorkspace('work_queue', itemId);
    setWorkspaceData({
      ...itemData,
      action: action,
      email: 'broker@triangleintelligence.com'
    });
  };

  // Professional Services Action Handlers for Cristina
  const handleUpdateServiceDelivery = async (delivery, newStatus) => {
    try {
      const response = await fetch('/api/admin/professional-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: delivery.id,
          status: newStatus,
          completion_percentage: newStatus === 'completed' ? 100 : delivery.completion_percentage + 20,
          updated_by: 'Cristina',
          sync_with_jorge: true
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Service delivery updated for ${delivery.client}. Jorge's pipeline has been synchronized.`);
        console.log('Service delivery updated with cross-dashboard sync:', result);
        // Reload data to show updated state
        loadBrokerWorkQueue();
      } else {
        throw new Error(result.error || 'Failed to update service delivery');
      }
    } catch (error) {
      console.error('Error updating service delivery:', error);
      alert(`Error updating service for ${delivery.client}. Please try again.`);
    }
  };

  const handleLogBillableHours = async (projectId, hours, description) => {
    try {
      const response = await fetch('/api/admin/professional-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'billable_hours',
          project_id: projectId,
          hours_logged: hours,
          description: description,
          assignee: 'Cristina',
          billable_amount: hours * 150, // Standard rate
          notify_revenue_tracking: true
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Billable hours logged: ${hours} hours. Revenue tracking updated.`);
        loadBrokerWorkQueue();
      }
    } catch (error) {
      console.error('Error logging billable hours:', error);
      alert('Error logging billable hours. Please try again.');
    }
  };

  // Professional Services Revenue Handlers
  const handleRevenueDetails = async (monthData) => {
    try {
      toggleWorkspace('revenue', monthData.month);
      setWorkspaceData({
        ...monthData,
        action: 'revenue_details',
        email: 'cristina@triangleintelligence.com'
      });
    } catch (error) {
      console.error('Error showing revenue details:', error);
      alert('Error loading revenue details. Please try again.');
    }
  };

  const handleGenerateInvoice = async (monthData) => {
    try {
      const totalRevenue = (monthData.consultation_hours * monthData.hourly_rate) +
                          (monthData.implementation_projects * 5000) +
                          (monthData.audit_projects * 3000);

      toggleWorkspace('revenue', monthData.month);
      setWorkspaceData({
        ...monthData,
        action: 'generate_invoice',
        total_revenue: totalRevenue,
        email: 'billing@triangleintelligence.com'
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
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
            <button
              className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
              onClick={() => setActiveTab('revenue')}
            >
              💰 Revenue & Financial
            </button>
            <button
              className={`tab-button ${activeTab === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivery')}
            >
              🎯 Service Delivery
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
                              onClick={() => handleWorkAction('Process', item.id, item)}
                            >
                              ⚡ Process
                            </button>
                            <button
                              className="action-btn call"
                              onClick={() => handleWorkAction('Call', item.id, item)}
                            >
                              📞 Call
                            </button>
                            {item.priority === 'HIGH' && (
                              <button
                                className="action-btn rush"
                                onClick={() => handleWorkAction('Rush', item.id, item)}
                              >
                                🚨 Rush
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                    {workQueue.map(item => (
                      <TableWorkspace
                        key={`work_queue_workspace_${item.id}`}
                        title="Work Queue Item"
                        recordId={item.id}
                        recordData={workspaceData}
                        isOpen={openWorkspaces[`work_queue_${item.id}`]}
                        onToggle={() => toggleWorkspace('work_queue', item.id)}
                        onSave={(data) => handleWorkspaceSave('work_queue', data)}
                        sections={[
                          {
                            id: 'processing_details',
                            title: 'Processing Details',
                            icon: '⚡',
                            fields: [
                              { name: 'client', label: 'Client Name', type: 'text', placeholder: 'Enter client name' },
                              { name: 'shipmentId', label: 'Shipment ID', type: 'text', placeholder: 'Enter shipment ID' },
                              { name: 'hsCode', label: 'HS Code', type: 'text', placeholder: 'Enter HS code' },
                              { name: 'priority', label: 'Priority', type: 'select', options: [
                                { value: 'LOW', label: 'Low' },
                                { value: 'MEDIUM', label: 'Medium' },
                                { value: 'HIGH', label: 'High' }
                              ]},
                              { name: 'type', label: 'Work Type', type: 'select', options: [
                                { value: 'Export Documentation', label: 'Export Documentation' },
                                { value: 'Import Clearance', label: 'Import Clearance' },
                                { value: 'Transit Monitoring', label: 'Transit Monitoring' },
                                { value: 'Certificate Processing', label: 'Certificate Processing' }
                              ]},
                              { name: 'email', label: 'Contact Email', type: 'email' }
                            ],
                            actions: [
                              { id: 'gmail', type: 'gmail', icon: '📧', label: 'Email Client' },
                              { id: 'call', icon: '📞', label: 'Schedule Call' }
                            ]
                          },
                          {
                            id: 'customs_status',
                            title: 'Customs Status',
                            icon: '📋',
                            fields: [
                              { name: 'status', label: 'Processing Status', type: 'select', options: [
                                { value: 'Pending', label: 'Pending' },
                                { value: 'In Process', label: 'In Process' },
                                { value: 'Review Required', label: 'Review Required' },
                                { value: 'Completed', label: 'Completed' }
                              ]},
                              { name: 'deadline', label: 'Deadline', type: 'date' },
                              { name: 'notes', label: 'Broker Notes', type: 'textarea', placeholder: 'Add processing notes...' },
                              { name: 'value', label: 'Shipment Value ($)', type: 'number' }
                            ]
                          }
                        ]}
                      />
                    ))}
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

          {/* Revenue & Financial Overview Tab */}
          {activeTab === 'revenue' && (
            <div>
              {/* Monthly Revenue Overview */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">💰 Monthly Revenue Overview</h2>
                  <p className="card-description">Service performance and financial tracking for Cristina's customs brokerage operations</p>
                </div>

                <div className="interactive-table">
                  <table className="salesforce-table">
                    <thead>
                      <tr>
                        <th>Service Type</th>
                        <th>Clients</th>
                        <th>Completed</th>
                        <th>Revenue</th>
                        <th>Avg Value</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="company-name">Customs Clearances</td>
                        <td className="prospects-count">8</td>
                        <td className="prospects-count">6</td>
                        <td className="deal-size">$12,500</td>
                        <td className="deal-size">$2,083</td>
                        <td><span className="badge badge-success">On Track</span></td>
                        <td className="action-buttons">
                          <button className="action-btn call">📋 Invoice</button>
                          <button className="action-btn view">📊 Report</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="company-name">HS Code Classifications</td>
                        <td className="prospects-count">15</td>
                        <td className="prospects-count">15</td>
                        <td className="deal-size">$8,750</td>
                        <td className="deal-size">$583</td>
                        <td><span className="badge badge-success">Complete</span></td>
                        <td className="action-buttons">
                          <button className="action-btn email">💳 Bill</button>
                          <button className="action-btn view">📁 Archive</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="company-name">USMCA Certificates</td>
                        <td className="prospects-count">4</td>
                        <td className="prospects-count">3</td>
                        <td className="deal-size">$6,000</td>
                        <td className="deal-size">$2,000</td>
                        <td><span className="badge badge-warning">1 Pending</span></td>
                        <td className="action-buttons">
                          <button className="action-btn urgent">⚡ Follow-up</button>
                          <button className="action-btn call">✅ Complete</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="company-name">Logistics Assessments</td>
                        <td className="prospects-count">3</td>
                        <td className="prospects-count">2</td>
                        <td className="deal-size">$4,500</td>
                        <td className="deal-size">$2,250</td>
                        <td><span className="badge badge-info">In Progress</span></td>
                        <td className="action-buttons">
                          <button className="action-btn view">🔄 Update</button>
                          <button className="action-btn call">📅 Schedule</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="company-name">Emergency Rush Services</td>
                        <td className="prospects-count">2</td>
                        <td className="prospects-count">2</td>
                        <td className="deal-size">$350</td>
                        <td className="deal-size">$175</td>
                        <td><span className="badge badge-success">Complete</span></td>
                        <td className="action-buttons">
                          <button className="action-btn email">📋 Invoice</button>
                          <button className="action-btn view">❌ Close</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Client Billing Status */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">💳 Client Billing Status</h2>
                  <p className="card-description">Outstanding invoices and payment tracking</p>
                </div>

                <div className="interactive-table">
                  <table className="salesforce-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Services Used</th>
                        <th>Amount Due</th>
                        <th>Days Outstanding</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan="6" className="text-center" style={{padding: '40px', color: '#666'}}>
                          <div style={{fontSize: '48px', marginBottom: '16px'}}>💳</div>
                          <div style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>No Outstanding Invoices</div>
                          <div style={{fontSize: '14px'}}>All client billing is current</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Performance Metrics */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">📊 Monthly Performance Metrics</h2>
                  <p className="card-description">Financial and operational performance tracking</p>
                </div>

                <div className="grid-3-cols">
                  <div className="card">
                    <div className="card-header">
                      <div className="deal-size">$32,100</div>
                      <div className="card-description">Total Revenue</div>
                      <div className="text-body">vs $28,750 last month | Target: $35,000</div>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '92%'}}></div>
                        </div>
                        <span className="progress-text">92% to goal</span>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="pipeline-value">2.3 days</div>
                      <div className="card-description">Average Processing Time</div>
                      <div className="text-body">vs 2.8 days last month | Target: 2.0 days</div>
                      <span className="badge badge-success">Improving</span>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="company-name">4.8/5.0</div>
                      <div className="card-description">Client Satisfaction</div>
                      <div className="text-body">vs 4.6/5.0 last month | Target: 4.5/5.0</div>
                      <span className="badge badge-success">Exceeding</span>
                    </div>
                  </div>
                </div>

                {/* Revenue Breakdown Chart */}
                <div className="revenue-breakdown">
                  <h3 className="content-card-title">💼 Revenue by Service Type</h3>
                  <div className="revenue-bars">
                    <div className="revenue-item">
                      <div className="revenue-label">Customs Clearances</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: '39%', background: '#2563eb'}}></div>
                        <div className="revenue-amount">$12,500 (39%)</div>
                      </div>
                    </div>
                    <div className="revenue-item">
                      <div className="revenue-label">HS Classifications</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: '27%', background: '#16a34a'}}></div>
                        <div className="revenue-amount">$8,750 (27%)</div>
                      </div>
                    </div>
                    <div className="revenue-item">
                      <div className="revenue-label">USMCA Certificates</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: '19%', background: '#7c3aed'}}></div>
                        <div className="revenue-amount">$6,000 (19%)</div>
                      </div>
                    </div>
                    <div className="revenue-item">
                      <div className="revenue-label">Logistics Assessments</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: '14%', background: '#dc2626'}}></div>
                        <div className="revenue-amount">$4,500 (14%)</div>
                      </div>
                    </div>
                    <div className="revenue-item">
                      <div className="revenue-label">Rush Services</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: '1%', background: '#f59e0b'}}></div>
                        <div className="revenue-amount">$350 (1%)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Delivery Tab */}
          {activeTab === 'delivery' && (
            <div>
              {/* Professional Services Workload */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">🎯 Professional Services Workload</h2>
                  <p className="card-description">Cristina's service delivery tracking for consultation and implementation projects</p>
                </div>

                <div className="interactive-table">
                  <table className="salesforce-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Service</th>
                        <th>Deliverable</th>
                        <th>Hours Est.</th>
                        <th>Completion</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professionalServices.cristina_delivery && professionalServices.cristina_delivery.length > 0 ? (
                        professionalServices.cristina_delivery.map(delivery => (
                          <tr key={delivery.id}>
                            <td className="company-name">{delivery.client}</td>
                            <td className="text-body">{delivery.service}</td>
                            <td className="text-body">{delivery.deliverable}</td>
                            <td className="prospects-count">{delivery.hours_estimated}</td>
                            <td>
                              <div className="progress-container">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{width: `${delivery.completion_percentage}%`}}></div>
                                </div>
                                <span className="progress-text">{delivery.completion_percentage}%</span>
                              </div>
                            </td>
                            <td className="text-body">{delivery.due_date}</td>
                            <td><span className={`badge ${getStatusBadge(delivery.status)}`}>{delivery.status}</span></td>
                            <td className="action-buttons">
                              <button className="action-btn view" onClick={() => handleUpdateServiceDelivery(delivery, 'in_progress')}>📋 Update</button>
                              <button className="action-btn call" onClick={() => handleLogBillableHours(delivery.id, 4, 'Service delivery work')}>⏰ Log Hours</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                            No professional services projects active. Projects will appear here as they are assigned to Cristina.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consultation Revenue Tracking */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">💼 Consultation Revenue Tracking</h2>
                  <p className="card-description">Monthly billable hours and consultation income</p>
                </div>

                <div className="interactive-table">
                  <table className="salesforce-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Consultation Hours</th>
                        <th>Hourly Rate</th>
                        <th>Implementation Projects</th>
                        <th>Audit Projects</th>
                        <th>Utilization %</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professionalServices.consultation_revenue && professionalServices.consultation_revenue.length > 0 ? (
                        professionalServices.consultation_revenue.map((month, index) => (
                          <tr key={index}>
                            <td className="text-body">{month.month}</td>
                            <td className="prospects-count">{month.consultation_hours}</td>
                            <td className="deal-size">${month.hourly_rate}</td>
                            <td className="prospects-count">{month.implementation_projects}</td>
                            <td className="prospects-count">{month.audit_projects}</td>
                            <td>
                              <span className={`badge ${month.utilization_percentage >= 80 ? 'badge-success' : month.utilization_percentage >= 70 ? 'badge-info' : 'badge-warning'}`}>
                                {month.utilization_percentage}%
                              </span>
                            </td>
                            <td className="action-buttons">
                              <button className="action-btn view" onClick={() => handleRevenueDetails(month)}>📊 Details</button>
                              <button className="action-btn email" onClick={() => handleGenerateInvoice(month)}>📋 Invoice</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                            No consultation revenue data available. Monthly tracking will appear here as billable hours are logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Utilization Metrics */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">📈 Utilization Metrics</h2>
                  <p className="card-description">Professional services performance and capacity tracking</p>
                </div>

                <div className="grid-3-cols">
                  <div className="card">
                    <div className="card-header">
                      <div className="deal-size">{professionalServices.utilization_metrics?.current_month?.cristina_utilization || 0}%</div>
                      <div className="card-description">Current Utilization</div>
                      <div className="text-body">
                        {professionalServices.utilization_metrics?.current_month?.billable_hours || 0} billable / {professionalServices.utilization_metrics?.current_month?.target_hours || 0} target hours
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${professionalServices.utilization_metrics?.current_month?.cristina_utilization || 0}%`}}></div>
                        </div>
                        <span className="progress-text">
                          {(professionalServices.utilization_metrics?.current_month?.cristina_utilization || 0) >= 80 ? 'On target' : 'Below target'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="pipeline-value">${formatCurrency(professionalServices.utilization_metrics?.current_month?.actual_revenue || 0)}</div>
                      <div className="card-description">Actual Revenue</div>
                      <div className="text-body">
                        vs ${formatCurrency(professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 0)} target | {Math.round(((professionalServices.utilization_metrics?.current_month?.actual_revenue || 0) / (professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 1)) * 100)}% achieved
                      </div>
                      <span className={`badge ${((professionalServices.utilization_metrics?.current_month?.actual_revenue || 0) / (professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 1)) >= 0.8 ? 'badge-success' : 'badge-warning'}`}>
                        {((professionalServices.utilization_metrics?.current_month?.actual_revenue || 0) / (professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 1)) >= 0.8 ? 'On Target' : 'Behind Target'}
                      </span>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="company-name">{professionalServices.utilization_metrics?.trends?.efficiency_score || 0}%</div>
                      <div className="card-description">Efficiency Score</div>
                      <div className="text-body">Project delivery vs timeline</div>
                      <span className={`badge ${(professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 90 ? 'badge-success' : (professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 80 ? 'badge-info' : 'badge-warning'}`}>
                        {(professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 90 ? 'Excellent' : (professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 80 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Services Trend */}
                <div className="revenue-breakdown">
                  <h3 className="content-card-title">📊 Professional Services Trends</h3>
                  <div className="revenue-bars">
                    <div className="revenue-item">
                      <div className="revenue-label">Consultation Hours</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: `${professionalServices.utilization_metrics?.current_month?.cristina_utilization || 0}%`, background: '#2563eb'}}></div>
                        <div className="revenue-amount">
                          {professionalServices.utilization_metrics?.trends?.utilization_trend === 'increasing' ? 'Increasing' : 'Stable'} {professionalServices.utilization_metrics?.current_month?.cristina_utilization || 0}%
                        </div>
                      </div>
                    </div>
                    <div className="revenue-item">
                      <div className="revenue-label">Revenue Performance</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: `${Math.round(((professionalServices.utilization_metrics?.current_month?.actual_revenue || 0) / (professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 1)) * 100)}%`, background: '#16a34a'}}></div>
                        <div className="revenue-amount">
                          {professionalServices.utilization_metrics?.trends?.revenue_trend === 'on_track' ? 'On Track' : 'Behind'} {Math.round(((professionalServices.utilization_metrics?.current_month?.actual_revenue || 0) / (professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 1)) * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="revenue-item">
                      <div className="revenue-label">Project Efficiency</div>
                      <div className="revenue-bar-container">
                        <div className="revenue-bar" style={{width: `${professionalServices.utilization_metrics?.trends?.efficiency_score || 0}%`, background: '#7c3aed'}}></div>
                        <div className="revenue-amount">
                          {(professionalServices.utilization_metrics?.trends?.efficiency_score || 0) >= 90 ? 'Excellent' : 'Good'} {professionalServices.utilization_metrics?.trends?.efficiency_score || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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