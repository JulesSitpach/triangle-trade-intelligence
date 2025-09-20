/**
 * USMCA Transition & Latin America Strategy Workspace
 * Dual Strategy Management: Current USMCA benefits + Future Latin America partnerships
 * Critical Function: Help clients maximize 6-month USMCA window while building post-USMCA routes
 * Jorge + Cristina coordination for seamless client transitions
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';
import SimpleDetailPanel from '../../components/admin/SimpleDetailPanel';
import TeamChatWidget from '../../components/admin/TeamChatWidget';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function CollaborationWorkspace() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dual-strategy-management');
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState([]);

  // Detail panel state - Following Jorge's pattern exactly
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Dual Strategy Management States - NO hardcoded arrays
  const [usmcaTransitionClients, setUsmcaTransitionClients] = useState([]);
  const [latinAmericaOpportunities, setLatinAmericaOpportunities] = useState([]);
  const [urgentTransitions, setUrgentTransitions] = useState([]);
  const [strategyMetrics, setStrategyMetrics] = useState({});
  const [clientTransitionPipeline, setClientTransitionPipeline] = useState([]);

  // USMCA Maximization tab states
  const [usmcaWindowTracking, setUsmcaWindowTracking] = useState(null);
  const [urgentCertificates, setUrgentCertificates] = useState([]);
  const [expiringBenefits, setExpiringBenefits] = useState([]);
  const [lastChanceClients, setLastChanceClients] = useState([]);
  const [transitionTimeframe, setTransitionTimeframe] = useState('6months');

  // Latin America Future Strategy tab states
  const [latinAmericaData, setLatinAmericaData] = useState({
    mexico_canada_routes: [],
    mexico_latin_partnerships: [],
    post_usmca_opportunities: [],
    alternative_trade_routes: []
  });

  // Collaboration items state - missing declarations
  const [collaborationItems, setCollaborationItems] = useState([]);
  const [jointProjects, setJointProjects] = useState([]);
  const [revenueOpportunities, setRevenueOpportunities] = useState([]);
  const [teamMetrics, setTeamMetrics] = useState({});
  const [usmcaCertificates, setUsmcaCertificates] = useState([]);
  const [triangleRoutes, setTriangleRoutes] = useState([]);
  const [tariffAnalysis, setTariffAnalysis] = useState([]);

  // Client Transition Coordination
  const [transitionCoordination, setTransitionCoordination] = useState({
    jorge_handoffs: [],
    cristina_preparations: [],
    joint_client_meetings: [],
    strategy_sessions: []
  });

  // Filtering states
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  useEffect(() => {
    // Use new auth system instead of localStorage checks
    if (authLoading) {
      // Still loading auth state
      return;
    }

    if (!user) {
      // Not logged in
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      // Not an admin
      console.log('User is not admin, redirecting to login');
      router.push('/login');
      return;
    }

    // User is authenticated and admin - load data
    console.log('Admin user authenticated, loading dashboard data');
    loadCollaborationDashboardData();
  }, [user, isAdmin, authLoading, router]);

  // Load partnership data when tab changes
  useEffect(() => {
    if (activeTab === 'canada-mexico-partnership' && user) {
      loadPartnershipData();
    }
  }, [activeTab, user]);

  const loadCollaborationDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🤝 Loading collaboration dashboard with complete integration...');

      // Load data from multiple database-driven APIs in parallel - Jorge's pattern
      const [collaborationResponse, brokerResponse, salesResponse, mexicoResponse] = await Promise.all([
        fetch('/api/admin/collaboration-mcp'),
        fetch('/api/admin/broker-operations'),
        fetch('/api/admin/sales-pipeline'),
        fetch(`/api/admin/mexico-trade-analytics?timeframe=${mexicoTimeframe}`)
      ]);

      // Process Collaboration Queue Data
      if (collaborationResponse.ok) {
        const collabData = await collaborationResponse.json();
        setCollaborationItems(collabData.collaboration_items || []);
        console.log(`Loaded ${collabData.collaboration_items?.length || 0} collaboration items`);
      } else {
        console.log('Collaboration API unavailable, using fallback');
        setCollaborationItems([]);
      }

      // Process Broker Operations for Joint Projects
      if (brokerResponse.ok) {
        const brokerData = await brokerResponse.json();
        // Filter high-value operations that need sales coordination
        const jointOps = (brokerData.operations || []).filter(op =>
          op.shipmentValue > 200000 || op.customsStatus === 'Review Required'
        ).map(op => ({
          id: op.id,
          company: op.company,
          type: 'broker_escalation',
          value: op.shipmentValue,
          status: op.status,
          assignedTo: 'Both',
          priority: op.shipmentValue > 500000 ? 'high' : 'medium',
          description: `High-value shipment requiring sales coordination: ${op.shipmentType}`,
          source: 'broker_operations'
        }));
        setJointProjects(jointOps);
        console.log(`Created ${jointOps.length} joint projects from broker operations`);
      }

      // Process Sales Pipeline for Revenue Opportunities
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        // Filter deals that need customs/logistics support
        const revenueOps = (salesData.pipeline || []).filter(deal =>
          deal.stage === 'proposal' || deal.stage === 'negotiation'
        ).map(deal => ({
          id: deal.id,
          company: deal.company,
          type: 'sales_support',
          value: deal.deal_size,
          stage: deal.stage,
          assignedTo: 'Jorge',
          needsCustomsSupport: deal.deal_size > 100000,
          priority: deal.deal_size > 500000 ? 'high' : 'medium',
          description: `Sales opportunity requiring customs/logistics input`,
          source: 'sales_pipeline'
        }));
        setRevenueOpportunities(revenueOps);
        console.log(`Created ${revenueOps.length} revenue opportunities`);
      }

      // Process Mexico Trade Analytics for Intelligence Tab
      if (mexicoResponse.ok) {
        const mexicoData = await mexicoResponse.json();
        setMexicoAnalytics(mexicoData.analytics || {});
        setUsmcaCertificates(mexicoData.usmca_certificates || []);
        setTriangleRoutes(mexicoData.triangle_routes || []);
        setTariffAnalysis(mexicoData.tariff_analysis || []);
        console.log(`Loaded ${mexicoData.usmca_certificates?.length || 0} USMCA certificates`);
      } else {
        console.log('Mexico Trade API unavailable');
        setMexicoAnalytics({});
        setUsmcaCertificates([]);
        setTriangleRoutes([]);
        setTariffAnalysis([]);
      }

      // Calculate Team Metrics
      const metrics = {
        total_collaborations: collaborationItems.length,
        joint_projects: jointProjects.length,
        revenue_opportunities: revenueOpportunities.length,
        total_value: [...jointProjects, ...revenueOpportunities].reduce((sum, item) => sum + (item.value || 0), 0)
      };
      setTeamMetrics(metrics);

    } catch (error) {
      console.error('Error loading collaboration data:', error);
      // Set empty arrays as fallback - no hardcoded mock data
      setCollaborationItems([]);
      setJointProjects([]);
      setRevenueOpportunities([]);
      setTeamMetrics({});

      // Load Canada-Mexico Partnership Data if on that tab
      if (activeTab === 'canada-mexico-partnership') {
        await loadPartnershipData();
      }

    } finally {
      setLoading(false);
    }
  };

  const loadPartnershipData = async () => {
    try {
      console.log('🍁🇲🇽 Loading partnership data...');

      const [oppResponse, execResponse, railResponse, mineralsResponse] = await Promise.all([
        fetch('/api/admin/canada-mexico-opportunities'),
        fetch('/api/admin/executive-partnerships'),
        fetch('/api/admin/cpkc-rail-opportunities-db'),
        fetch('/api/admin/critical-minerals-trade-db')
      ]);

      let opportunities = [], executives = [], railRoutes = [], minerals = [];

      if (oppResponse.ok) {
        const data = await oppResponse.json();
        opportunities = data.opportunities || [];
      }

      if (execResponse.ok) {
        const data = await execResponse.json();
        executives = data.executives || [];
      }

      if (railResponse.ok) {
        const data = await railResponse.json();
        railRoutes = data.rail_routes || [];
      }

      if (mineralsResponse.ok) {
        const data = await mineralsResponse.json();
        minerals = data.minerals || [];
      }

      setPartnershipData({ opportunities, executives, railRoutes, minerals });

    } catch (error) {
      console.error('Partnership data loading error:', error);
    }
  };

  // Functional action buttons following Jorge's pattern exactly
  const handleCallClient = async (item) => {
    try {
      const client = { company: item.company, id: item.id };
      const result = await googleIntegrationService.scheduleCall(client, 'collaboration_follow_up');
      console.log('Google Calendar call scheduled:', result);
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert(`Error scheduling call with ${item.company}. Please try again.`);
    }
  };

  const handleEmailClient = async (item) => {
    try {
      const client = { company: item.company, id: item.id };
      const result = await googleIntegrationService.composeEmail(client, 'collaboration_update');
      console.log('Gmail compose opened:', result);
    } catch (error) {
      console.error('Error opening Gmail:', error);
      alert(`Error opening email for ${item.company}. Please try again.`);
    }
  };

  const handleEscalateToJorge = async (item) => {
    try {
      const response = await fetch('/api/admin/collaboration-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'escalation',
          priority: 'high',
          title: `Partnership Opportunity: ${item.company}`,
          description: `Escalated by team - High-value opportunity requiring Jorge's sales expertise`,
          requested_by: 'System',
          assigned_to: 'Jorge',
          related_client_id: item.id,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        alert(`Successfully escalated ${item.company} to Jorge for partnership development`);
        loadCollaborationDashboardData(); // Reload data
      }
    } catch (error) {
      console.error('Error escalating to Jorge:', error);
      alert('Error escalating to Jorge. Please try again.');
    }
  };

  const handleRequestCristinaSupport = async (item) => {
    try {
      const response = await fetch('/api/admin/collaboration-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'customs_support',
          priority: 'medium',
          title: `Customs Support Needed: ${item.company}`,
          description: `Sales deal requires customs/logistics expertise from Cristina`,
          requested_by: 'Jorge',
          assigned_to: 'Cristina',
          related_client_id: item.id,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        alert(`Successfully requested Cristina's support for ${item.company}`);
        loadCollaborationDashboardData(); // Reload data
      }
    } catch (error) {
      console.error('Error requesting Cristina support:', error);
      alert('Error requesting support. Please try again.');
    }
  };

  // Detail panel functions following Jorge's pattern exactly
  const openDetailPanel = (record) => {
    // Transform collaboration record to match SimpleDetailPanel format
    const transformedRecord = {
      ...record,
      companyName: record.company || record.title || 'Collaboration Item',
      recordType: 'collaboration',
      industry: 'Team Collaboration',
      email: record.email || `contact@collaboration.com`,
      source: 'Collaboration Queue',
      probability: record.priority === 'high' ? 95 : record.priority === 'medium' ? 75 : 50,
      dueDate: record.due_date || record.deadline
    };
    setSelectedRecord(transformedRecord);
    setDetailPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setSelectedRecord(null);
    setDetailPanelOpen(false);
  };

  const handleDetailSave = (updatedRecord) => {
    console.log('Saving collaboration record updates:', updatedRecord);
    // Here you would normally save to database
    closeDetailPanel();
  };

  const handleUpdateRecord = async (updatedRecord) => {
    try {
      const response = await fetch('/api/admin/collaboration-mcp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });

      if (response.ok) {
        console.log('Record updated successfully');
        loadCollaborationDashboardData(); // Reload data
        closeDetailPanel();
      }
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  // Filtering functions
  const getFilteredCollaborationItems = () => {
    let filtered = collaborationItems;

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(item => item.assigned_to === assigneeFilter);
    }

    return filtered;
  };

  // Mexico Intelligence action handlers
  const handleRenewCertificate = async (cert) => {
    try {
      const response = await fetch('/api/admin/mexico-trade-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renew_certificate',
          certificate_id: cert.id,
          certificate_number: cert.certificate_number,
          importer_company: cert.importer_company
        })
      });

      if (response.ok) {
        alert(`Successfully initiated renewal for certificate ${cert.certificate_number}`);
        loadCollaborationDashboardData(); // Reload data
      }
    } catch (error) {
      console.error('Error renewing certificate:', error);
      alert('Error renewing certificate. Please try again.');
    }
  };

  const handleCreateRoute = async (route) => {
    try {
      const response = await fetch('/api/admin/mexico-trade-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_routing_plan',
          route_id: route.id,
          route_name: route.route_name,
          origin_country: route.origin_country,
          destination_country: route.destination_country
        })
      });

      if (response.ok) {
        alert(`Successfully created routing plan for ${route.route_name}`);
        loadCollaborationDashboardData(); // Reload data
      }
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Error creating routing plan. Please try again.');
    }
  };

  // Helper functions following Jorge's pattern
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    if (typeof amount === 'string') return amount;

    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'badge-warning',
      'active': 'badge-info',
      'completed': 'badge-success',
      'blocked': 'badge-danger'
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'urgent': 'badge-danger',
      'high': 'badge-warning',
      'medium': 'badge-info',
      'low': 'badge-secondary'
    };
    return priorityMap[priority?.toLowerCase()] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="admin-header text-center">Loading collaboration workspace with complete integration...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>USMCA Transition Strategy - Triangle Intelligence</title>
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">
          {/* Standardized Header */}
          <div className="admin-header">
            <h1 className="admin-title">🚨 USMCA Transition & Latin America Strategy</h1>
            <p className="admin-subtitle">
              Critical 6-Month Window • Maximize Current USMCA Benefits • Build Future Latin America Partnerships
            </p>
            <div className="credentials-badge urgent">
              <span>URGENT: Trump May Dissolve USMCA</span>
              <span className="license-number">COLLAB-2024</span>
            </div>
          </div>


          {/* Tab Navigation */}
          <div className="admin-nav-tabs">
            <button
              className={`admin-btn joint ${activeTab === 'dual-strategy-management' ? 'active urgent' : ''}`}
              onClick={() => setActiveTab('dual-strategy-management')}
            >
              🚨 Dual Strategy Management
            </button>
            <button
              className={`admin-btn joint ${activeTab === 'usmca-window-maximization' ? 'active' : ''}`}
              onClick={() => setActiveTab('usmca-window-maximization')}
            >
              ⏰ USMCA Window (6 months left)
            </button>
            <button
              className={`admin-btn joint ${activeTab === 'client-transition-pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('client-transition-pipeline')}
            >
              🔄 Client Transition Pipeline
            </button>
            <button
              className={`admin-btn joint ${activeTab === 'latin-america-future' ? 'active' : ''}`}
              onClick={() => setActiveTab('latin-america-future')}
            >
              🌎 Latin America Future Strategy
            </button>
            <button
              className={`admin-btn joint ${activeTab === 'jorge-cristina-coordination' ? 'active' : ''}`}
              onClick={() => setActiveTab('jorge-cristina-coordination')}
            >
              👥 Jorge ↔ Cristina Coordination
            </button>
          </div>

          {/* Collaboration Queue Tab */}
          {activeTab === 'overview' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">📋 Active Collaboration Queue</h2>
                <div className="text-body">
                  Showing {getFilteredCollaborationItems().length} of {collaborationItems.length} collaboration items
                  {priorityFilter !== 'all' && ` • Priority: ${priorityFilter}`}
                  {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
                  {assigneeFilter !== 'all' && ` • Assignee: ${assigneeFilter}`}
                </div>
                <div className="filter-controls">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Assignees</option>
                    <option value="Jorge">Jorge</option>
                    <option value="Cristina">Cristina</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Priority</th>
                      <th>Title</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredCollaborationItems().length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-20 text-muted">
                          {collaborationItems.length === 0
                            ? 'No collaboration items found. Items will populate from Jorge and Cristina interactions.'
                            : 'No items match current filters.'}
                        </td>
                      </tr>
                    ) : (
                      getFilteredCollaborationItems().map(item => (
                        <tr
                          key={item.id}
                          className="admin-row clickable"
                          onClick={() => openDetailPanel(item)}
                          className="cursor-pointer"
                        >
                          <td>
                            <span className={`badge ${getPriorityBadge(item.priority)}`}>
                              {item.priority?.toUpperCase() || 'MEDIUM'}
                            </span>
                          </td>
                          <td className="company-name">
                            {item.title || 'Untitled Collaboration'}
                            <div className="text-muted font-xs">
                              {item.description?.substring(0, 60)}...
                            </div>
                          </td>
                          <td>
                            <span>{item.assigned_to || 'Unassigned'}</span>
                            <div className="font-xs">
                              From: {item.requested_by || 'System'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(item.status)}`}>
                              {item.status || 'pending'}
                            </span>
                          </td>
                          <td>{item.due_date || 'Not set'}</td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="action-btn call"
                              onClick={() => handleCallClient(item)}
                              title="Schedule call via Google Calendar"
                            >
                              📞 Call
                            </button>
                            <button
                              className="action-btn email"
                              onClick={() => handleEmailClient(item)}
                              title="Send email via Gmail"
                            >
                              ✉️ Email
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => openDetailPanel(item)}
                              title="View details"
                            >
                              👁️ Details
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

          {/* Joint Projects Tab */}
          {activeTab === 'joint-projects' && (
            <div className="admin-card">
              <h2 className="card-title">🤝 High-Value Joint Projects</h2>
              <div className="text-body">Operations requiring both sales and customs expertise</div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Company</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jointProjects.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-20 text-muted">
                          No joint projects found. High-value broker operations will appear here automatically.
                        </td>
                      </tr>
                    ) : (
                      jointProjects.map(project => (
                        <tr
                          key={project.id}
                          className="admin-row clickable"
                          onClick={() => openDetailPanel(project)}
                          className="cursor-pointer"
                        >
                          <td className="company-name">{project.company}</td>
                          <td>{project.type.replace('_', ' ')}</td>
                          <td className="deal-size">{formatCurrency(project.value)}</td>
                          <td>
                            <span className={`badge ${getPriorityBadge(project.priority)}`}>
                              {project.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="action-btn urgent"
                              onClick={() => handleEscalateToJorge(project)}
                              title="Escalate to Jorge for partnership development"
                            >
                              📈 Escalate to Jorge
                            </button>
                            <button
                              className="action-btn call"
                              onClick={() => handleCallClient(project)}
                              title="Schedule team call"
                            >
                              📞 Team Call
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

          {/* Revenue Opportunities Tab */}
          {activeTab === 'revenue-ops' && (
            <div className="admin-card">
              <h2 className="card-title">💰 Revenue Opportunities Requiring Support</h2>
              <div className="text-body">Sales deals that need customs/logistics expertise</div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Company</th>
                      <th>Deal Value</th>
                      <th>Stage</th>
                      <th>Needs Customs Support</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueOpportunities.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-20 text-muted">
                          No revenue opportunities found. Sales pipeline deals will appear here automatically.
                        </td>
                      </tr>
                    ) : (
                      revenueOpportunities.map(opportunity => (
                        <tr
                          key={opportunity.id}
                          className="admin-row clickable"
                          onClick={() => openDetailPanel(opportunity)}
                          className="cursor-pointer"
                        >
                          <td className="company-name">{opportunity.company}</td>
                          <td className="deal-size">{formatCurrency(opportunity.value)}</td>
                          <td>{opportunity.stage}</td>
                          <td>
                            <span className={opportunity.needsCustomsSupport ? 'badge-success' : 'badge-secondary'}>
                              {opportunity.needsCustomsSupport ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getPriorityBadge(opportunity.priority)}`}>
                              {opportunity.priority?.toUpperCase()}
                            </span>
                          </td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            {opportunity.needsCustomsSupport && (
                              <button
                                className="action-btn urgent"
                                onClick={() => handleRequestCristinaSupport(opportunity)}
                                title="Request Cristina's customs support"
                              >
                                🚢 Request Cristina Support
                              </button>
                            )}
                            <button
                              className="action-btn email"
                              onClick={() => handleEmailClient(opportunity)}
                              title="Email client about support"
                            >
                              ✉️ Email Client
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

          {/* Mexico Intelligence Tab */}
          {activeTab === 'mexico-intelligence' && (
            <div className="admin-card">
              <h2 className="card-title">🇲🇽 Mexico Trade Intelligence</h2>
              <div className="text-body">Real-time USMCA triangle routing opportunities and Mexico trade analytics</div>

              {/* Mexico Analytics Summary - Only show if we have real data */}
              {(usmcaCertificates.length > 0 || triangleRoutes.length > 0 || mexicoAnalytics.avg_tariff_savings) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {usmcaCertificates.length > 0 && (
                    <div className="metric-card">
                      <div className="metric-label">Active Certificates</div>
                      <div className="metric-value">{usmcaCertificates.length}</div>
                    </div>
                  )}
                  {triangleRoutes.length > 0 && (
                    <div className="metric-card">
                      <div className="metric-label">Triangle Routes</div>
                      <div className="metric-value">{triangleRoutes.length}</div>
                    </div>
                  )}
                  {mexicoAnalytics.avg_tariff_savings && (
                    <div className="metric-card">
                      <div className="metric-label">Avg Tariff Savings</div>
                      <div className="metric-value">{mexicoAnalytics.avg_tariff_savings}</div>
                    </div>
                  )}
                  {mexicoAnalytics.total_trade_value && (
                    <div className="metric-card">
                      <div className="metric-label">Total Value</div>
                      <div className="metric-value">{formatCurrency(mexicoAnalytics.total_trade_value)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* USMCA Certificates Table */}
              <div className="mb-6">
                <h3 className="card-subtitle">📋 Active USMCA Certificates</h3>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead className="admin-table-header">
                      <tr>
                        <th>Certificate ID</th>
                        <th>Importer Company</th>
                        <th>Product Category</th>
                        <th>Tariff Savings</th>
                        <th>Status</th>
                        <th>Expires</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usmcaCertificates.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center p-20 text-muted">
                            No USMCA certificates found. Active certificates will appear here automatically.
                          </td>
                        </tr>
                      ) : (
                        usmcaCertificates.map(cert => (
                          <tr
                            key={cert.id}
                            className="admin-row clickable"
                            onClick={() => openDetailPanel({...cert, recordType: 'usmca_certificate'})}
                          >
                            <td className="certificate-id">{cert.certificate_number}</td>
                            <td className="company-name">{cert.importer_company}</td>
                            <td>{cert.product_category}</td>
                            <td className="tariff-savings text-success">
                              {formatCurrency(cert.estimated_savings)}
                            </td>
                            <td>
                              <span className={`badge ${cert.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                {cert.status?.toUpperCase()}
                              </span>
                            </td>
                            <td>{new Date(cert.expiry_date).toLocaleDateString()}</td>
                            <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="action-btn primary"
                                onClick={() => handleRenewCertificate(cert)}
                                title="Renew certificate"
                              >
                                🔄 Renew
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Triangle Routing Opportunities */}
              <div className="mb-6">
                <h3 className="card-subtitle">🔺 Triangle Routing Opportunities</h3>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead className="admin-table-header">
                      <tr>
                        <th>Route</th>
                        <th>Origin Country</th>
                        <th>Destination</th>
                        <th>Potential Savings</th>
                        <th>Volume</th>
                        <th>Priority</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {triangleRoutes.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center p-20 text-muted">
                            No triangle routing opportunities found. Routes will appear here automatically.
                          </td>
                        </tr>
                      ) : (
                        triangleRoutes.map(route => (
                          <tr
                            key={route.id}
                            className="admin-row clickable"
                            onClick={() => openDetailPanel({...route, recordType: 'triangle_route'})}
                          >
                            <td className="route-name">{route.route_name}</td>
                            <td>{route.origin_country}</td>
                            <td>{route.destination_country}</td>
                            <td className="potential-savings text-success">
                              {formatCurrency(route.estimated_savings)}
                            </td>
                            <td>{route.annual_volume_usd ? formatCurrency(route.annual_volume_usd) : 'Unknown'}</td>
                            <td>
                              <span className={`badge ${getPriorityBadge(route.priority)}`}>
                                {route.priority?.toUpperCase()}
                              </span>
                            </td>
                            <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="action-btn primary"
                                onClick={() => handleCreateRoute(route)}
                                title="Create routing plan"
                              >
                                🚢 Create Route
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Canada-Mexico Partnership Tab */}
          {activeTab === 'canada-mexico-partnership' && (
            <div className="admin-card">
              <div className="card-header">
                <h3>🍁🇲🇽 Canada-Mexico Strategic Partnership Opportunities</h3>
                <p>Track opportunities from the new bilateral agreement</p>
              </div>


              {/* Real Partnership Opportunities Table */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>🎯 Active Partnership Opportunities</h3>
                </div>

                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>Sector</th>
                        <th>Value</th>
                        <th>Status</th>
                        <th>Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnershipData.opportunities.length > 0 ? partnershipData.opportunities.slice(0, 5).map((opp) => (
                        <tr key={opp.id} className="admin-row">
                          <td>
                            <div className="client-info">
                              <div className="client-name">{opp.title}</div>
                              <div className="client-details">{opp.canadian_lead} + {opp.mexican_partner}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-indicator ${
                              opp.sector === 'energy' ? 'status-pending' :
                              opp.sector === 'rail' ? 'status-in-progress' :
                              'status-completed'
                            }`}>
                              {opp.sector}
                            </span>
                          </td>
                          <td className="amount-cell">
                            ${opp.estimated_value_usd ? (opp.estimated_value_usd / 1000000000).toFixed(1) + 'B' : 'TBD'}
                          </td>
                          <td>
                            <span className={`status-indicator ${
                              opp.status === 'active' ? 'status-in-progress' :
                              opp.status === 'planning' ? 'status-pending' :
                              'status-on-hold'
                            }`}>
                              {opp.status}
                            </span>
                          </td>
                          <td className="timeline-cell">
                            <div className="timeline-date">
                              {opp.timeline_start ? new Date(opp.timeline_start).getFullYear() : 'TBD'}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <div className="client-info">
                              <div className="client-name">Loading partnership data...</div>
                              <div className="client-details">Database queries in progress</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Canadian Executives in Mexico */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>👥 Key Canadian Executives</h3>
                </div>

                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Executive</th>
                        <th>Company</th>
                        <th>Mexico Project</th>
                        <th>Investment</th>
                        <th>Partnership Potential</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnershipData.executives.length > 0 ? partnershipData.executives.slice(0, 4).map((exec) => (
                        <tr key={exec.id} className="admin-row">
                          <td>
                            <div className="client-info">
                              <div className="client-name">{exec.executive_name}</div>
                              <div className="client-details">{exec.title}</div>
                            </div>
                          </td>
                          <td>
                            <div className="client-info">
                              <div className="client-name">{exec.company}</div>
                              <div className="client-details">{exec.company_location}</div>
                            </div>
                          </td>
                          <td>
                            <div className="client-details">{exec.primary_project}</div>
                          </td>
                          <td className="amount-cell">
                            ${exec.investment_value_usd ? (exec.investment_value_usd / 1000000000).toFixed(1) + 'B' : 'TBD'}
                          </td>
                          <td>
                            <span className={`status-indicator ${
                              exec.partnership_potential === 'critical' ? 'status-review-required' :
                              exec.partnership_potential === 'high' ? 'status-in-progress' :
                              'status-pending'
                            }`}>
                              {exec.partnership_potential}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <div className="client-info">
                              <div className="client-name">Loading executive data...</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Critical Minerals with HS Codes */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>⚡ Critical Minerals Trade</h3>
                </div>

                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mineral</th>
                        <th>HS Code</th>
                        <th>Canada Status</th>
                        <th>Mexico Demand</th>
                        <th>2024 Trade Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnershipData.minerals.length > 0 ? partnershipData.minerals.slice(0, 5).map((mineral) => (
                        <tr key={mineral.id} className="admin-row">
                          <td>
                            <div className="client-info">
                              <div className="client-name">{mineral.mineral_name}</div>
                              <div className="client-details">{mineral.mineral_category}</div>
                            </div>
                          </td>
                          <td className="client-details">{mineral.hs_code}</td>
                          <td>
                            <span className={`status-indicator ${
                              mineral.canada_production_status === 'world_leader' ? 'status-completed' :
                              mineral.canada_production_status === 'high' ? 'status-in-progress' :
                              'status-pending'
                            }`}>
                              {mineral.canada_production_status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className={`status-indicator ${
                              mineral.mexico_demand_status === 'growing' ? 'status-in-progress' :
                              mineral.mexico_demand_status === 'high' ? 'status-completed' :
                              'status-pending'
                            }`}>
                              {mineral.mexico_demand_status}
                            </span>
                          </td>
                          <td className="amount-cell">
                            ${mineral.canada_mexico_trade_2024_usd ? (mineral.canada_mexico_trade_2024_usd / 1000000).toFixed(0) + 'M' : 'TBD'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <div className="client-info">
                              <div className="client-name">Loading minerals data...</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CPKC Rail Routes */}
              <div className="admin-card">
                <div className="card-header">
                  <h3>🚂 CPKC Rail Opportunities</h3>
                </div>

                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Route</th>
                        <th>Origin → Destination</th>
                        <th>Transit Time</th>
                        <th>Cost Savings</th>
                        <th>2024 Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnershipData.railRoutes.length > 0 ? partnershipData.railRoutes.slice(0, 4).map((route) => (
                        <tr key={route.id} className="admin-row">
                          <td>
                            <div className="client-info">
                              <div className="client-name">{route.name}</div>
                              <div className="client-details">{route.status}</div>
                            </div>
                          </td>
                          <td>
                            <div className="client-details">{route.origin} → {route.destination}</div>
                          </td>
                          <td className="client-details">{route.transit_days}</td>
                          <td>
                            <span className="status-indicator status-completed">
                              {route.triangle_routing?.cost_savings || 'TBD'}
                            </span>
                          </td>
                          <td className="amount-cell">{route.volume_2024}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            <div className="client-info">
                              <div className="client-name">Loading rail routes...</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Simple Detail Panel - matches Jorge's dashboard */}
          <SimpleDetailPanel
            isOpen={detailPanelOpen}
            onClose={closeDetailPanel}
            record={selectedRecord}
            type={selectedRecord?.recordType || 'collaboration'}
            onSave={handleDetailSave}
          />

        </div>

        {/* Team Chat Widget - Enhanced with Partnership Intelligence */}
        <TeamChatWidget
          dashboardContext="partnership"
          userName={user?.username || 'admin'}
          language="english"
          minimized={true}
        />
      </div>
    </>
  );
}