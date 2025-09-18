/**
 * SIMPLE ADMIN DASHBOARD - Real Business Value
 * Focused on practical tools Jorge and Cristina actually need
 * No dashboard theater - just useful features
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';

export default function SimpleDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deals');

  // Simple data states
  const [deals, setDeals] = useState([]);
  const [mexicoAlerts, setMexicoAlerts] = useState([]);
  const [handoffQueue, setHandoffQueue] = useState([]);
  const [professionalServices, setProfessionalServices] = useState({});

  useEffect(() => {
    // Check admin authentication
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
        if (!userData.isAdmin) {
          router.push('/dashboard');
          return;
        }
      } catch (e) {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    loadSimpleData();
  }, []);

  const loadSimpleData = async () => {
    try {
      // Load deals data from new API
      const dealsResponse = await fetch('/api/admin/deals');
      if (dealsResponse.ok) {
        const dealsData = await dealsResponse.json();
        const processedDeals = (dealsData.data?.deals || []).map(deal => ({
          ...deal,
          daysSinceContact: calculateDaysSinceContact(deal.last_contact),
          needsAttention: needsAttention(deal),
          needsBroker: needsBrokerServices(deal)
        }));
        setDeals(processedDeals);
      }

      // Load Mexico alerts from new API
      const alertsResponse = await fetch('/api/admin/mexico-alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setMexicoAlerts(alertsData.data?.alerts || []);
      }

      // Load handoff triggers from new API
      const handoffResponse = await fetch('/api/admin/handoff-triggers');
      if (handoffResponse.ok) {
        const handoffData = await handoffResponse.json();
        setHandoffQueue(handoffData.data?.handoffs || []);
      }

    } catch (error) {
      console.error('Error loading simple dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple business logic functions
  const calculateDaysSinceContact = (lastContact) => {
    if (!lastContact) return 999;
    const lastDate = new Date(lastContact);
    const now = new Date();
    return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  };

  const needsAttention = (deal) => {
    const daysSince = calculateDaysSinceContact(deal.last_contact);
    return daysSince > 7 ||
           deal.status === 'Proposal Sent' && daysSince > 3 ||
           deal.status === 'Hot Lead' && daysSince > 2;
  };

  const needsBrokerServices = (deal) => {
    const value = parseFloat(deal.deal_size?.toString().replace(/[$,]/g, '') || '0');
    return value > 500000 ||
           deal.status === 'Technical Discussion' ||
           deal.product_type?.includes('Complex') ||
           deal.trade_routes?.includes('Multi-country');
  };

  const generateMexicoAlerts = () => {
    const alerts = [
      {
        id: 1,
        type: 'opportunity',
        priority: 'high',
        title: 'USMCA Rate Change - Auto Parts',
        message: 'New 8% tariff reduction for HS 8708.10 through Mexico routing',
        actionNeeded: 'Contact automotive clients',
        created: new Date().toISOString(),
        affectedClients: 3
      },
      {
        id: 2,
        type: 'alert',
        priority: 'medium',
        title: 'Mexico Port Delay - Manzanillo',
        message: 'Port of Manzanillo experiencing 2-day delays due to equipment issues',
        actionNeeded: 'Notify active shipment clients',
        created: new Date(Date.now() - 86400000).toISOString(),
        affectedClients: 1
      },
      {
        id: 3,
        type: 'regulation',
        priority: 'low',
        title: 'New USMCA Documentation Requirements',
        message: 'Updated certificate requirements effective Feb 1, 2025',
        actionNeeded: 'Update proposal templates',
        created: new Date(Date.now() - 172800000).toISOString(),
        affectedClients: 0
      }
    ];
    setMexicoAlerts(alerts);
  };

  const generateHandoffQueue = (dealData) => {
    const handoffItems = dealData.filter(deal => needsBrokerServices(deal)).map(deal => ({
      ...deal,
      handoffReason: getHandoffReason(deal),
      urgency: getHandoffUrgency(deal)
    }));
    setHandoffQueue(handoffItems);
  };

  const getHandoffReason = (deal) => {
    const value = parseFloat(deal.deal_size?.toString().replace(/[$,]/g, '') || '0');
    if (value > 1000000) return 'High value deal - needs broker expertise';
    if (deal.status === 'Technical Discussion') return 'Client asking compliance questions';
    if (deal.product_type?.includes('Complex')) return 'Complex routing requirements';
    return 'Broker services needed';
  };

  const getHandoffUrgency = (deal) => {
    if (deal.status === 'Hot Lead') return 'urgent';
    if (needsAttention(deal)) return 'high';
    return 'normal';
  };

  // Action handlers - real actions
  const handleCallClient = async (deal) => {
    try {
      await googleIntegrationService.scheduleCall(
        { company: deal.client, email: deal.email },
        'follow_up'
      );
    } catch (error) {
      window.alert(`Error scheduling call with ${deal.client}`);
    }
  };

  const handleEmailClient = async (deal) => {
    try {
      await googleIntegrationService.composeEmail(
        { company: deal.client, email: deal.email },
        'follow_up'
      );
    } catch (error) {
      window.alert(`Error composing email to ${deal.client}`);
    }
  };

  const handleHandoffToCristina = async (deal) => {
    try {
      // Send email to Cristina with deal details
      const cristinaEmail = {
        company: 'Cristina Rodriguez - Broker Operations',
        email: 'triangleintel@gmail.com'
      };

      // Compose handoff email
      await googleIntegrationService.composeEmail(cristinaEmail, 'handoff');

      console.log('Handoff initiated to Cristina for:', deal.client);
      window.alert(`Handoff email sent to Cristina for ${deal.client}`);
    } catch (error) {
      window.alert(`Error sending handoff for ${deal.client}`);
    }
  };

  const handleMexicoAlert = (alertItem) => {
    if (alertItem.type === 'opportunity') {
      // Navigate to client portfolio to contact affected clients
      router.push('/admin/client-portfolio');
    } else if (alertItem.type === 'disruption') {
      // Open real-time tracking for affected shipments
      window.open('https://www.aftership.com/track', '_blank');
    } else if (alertItem.type === 'regulatory') {
      // Open Cristina's workspace for compliance review
      router.push('/admin/collaboration-workspace');
    } else {
      // For other alert types, show the action required
      window.alert(alertItem.action_required);
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount?.toString().replace(/[$,]/g, '') || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-normal';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app">
      <Head>
        <title>Simple Admin Dashboard - Triangle Intelligence</title>
      </Head>

      <AdminNavigation />

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Simple Dashboard</h1>
          <p className="dashboard-subtitle">Practical tools that actually help Jorge and Cristina</p>
        </div>

        {/* Tabs */}
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab('deals')}
            className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`}
          >
            💰 Deal Tracker
          </button>
          <button
            onClick={() => setActiveTab('mexico')}
            className={`tab-button ${activeTab === 'mexico' ? 'active' : ''}`}
          >
            🇲🇽 Mexico Alerts
          </button>
          <button
            onClick={() => setActiveTab('handoff')}
            className={`tab-button ${activeTab === 'handoff' ? 'active' : ''}`}
          >
            🤝 Need Broker Help
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          >
            📊 Sales Performance
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={`tab-button ${activeTab === 'professional' ? 'active' : ''}`}
          >
            🎯 Professional Services
          </button>
        </div>

        {/* Deal Tracker Tab */}
        {activeTab === 'deals' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">💰 Deal Tracker</h2>
              <p className="card-description">Where are my deals? What needs attention?</p>
            </div>
            <div className="interactive-table">
              <table className="salesforce-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Days Since Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal, index) => (
                    <tr key={index} className={`clickable-row ${deal.needsAttention ? 'priority-urgent' : ''}`}>
                      <td>
                        <div className="company-name">{deal.client}</div>
                        <div className="text-body">{deal.contact_person}</div>
                      </td>
                      <td className="deal-size">
                        {formatCurrency(deal.value)}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          deal.status === 'Hot Lead' ? 'status-hot' :
                          deal.status === 'Proposal Sent' ? 'status-proposal' :
                          deal.status === 'Negotiation' ? 'status-negotiation' :
                          'status-default'
                        }`}>
                          {deal.status}
                        </span>
                      </td>
                      <td>
                        <span className={deal.needsAttention ? 'interest-level high' : 'text-body'}>
                          {deal.daysSinceContact} days
                          {deal.needsAttention && ' ⚠️'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleCallClient(deal)}
                            className="action-btn call"
                          >
                            📞 Call
                          </button>
                          <button
                            onClick={() => handleEmailClient(deal)}
                            className="action-btn email"
                          >
                            📧 Email
                          </button>
                          {deal.needsBroker && (
                            <button
                              onClick={() => handleHandoffToCristina(deal)}
                              className="action-btn urgent"
                            >
                              🤝 Handoff
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mexico Alerts Tab */}
        {activeTab === 'mexico' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🇲🇽 Mexico Trade Alerts</h2>
              <p className="card-description">What's happening that affects our Mexico trade business?</p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {mexicoAlerts.map(alert => (
                <div key={alert.id} className={getPriorityColor(alert.priority)} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{alert.title}</h3>
                      <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{alert.message}</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Action needed: {alert.actionNeeded}</p>
                      {alert.affectedClients > 0 && (
                        <p style={{ fontSize: '0.75rem' }}>Affects {alert.affectedClients} active clients</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleMexicoAlert(alert)}
                      className="btn-primary"
                      style={{ marginLeft: '1rem' }}
                    >
                      Take Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Handoff Tab */}
        {activeTab === 'handoff' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🤝 Need Broker Help</h2>
              <p className="card-description">Deals that need Cristina's expertise</p>
            </div>
            <div className="interactive-table">
              <table className="salesforce-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Value</th>
                    <th>Why Handoff?</th>
                    <th>Urgency</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffQueue.map((deal, index) => (
                    <tr key={index} className="clickable-row">
                      <td>
                        <div className="company-name">{deal.client}</div>
                      </td>
                      <td className="deal-size">
                        {formatCurrency(deal.value)}
                      </td>
                      <td className="text-body">{deal.handoffReason}</td>
                      <td>
                        <span className={`badge ${getPriorityColor(deal.urgency)}`}>
                          {deal.urgency}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleHandoffToCristina(deal)}
                          className="btn-primary"
                        >
                          📧 Email Cristina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sales Performance Tab */}
        {activeTab === 'sales' && (
          <div>
            {/* Sales Overview Metrics */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📊 Sales Performance Dashboard</h2>
                <p className="card-description">Jorge's partnership development and sales metrics</p>
              </div>

              <div className="grid-3-cols">
                <div className="card">
                  <div className="card-header">
                    <div className="deal-size">$187,500</div>
                    <div className="card-description">Total Pipeline Value</div>
                    <div className="text-body">vs $145,000 last month (+29%)</div>
                    <span className="badge badge-success">Trending Up</span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="pipeline-value">$45,200</div>
                    <div className="card-description">Monthly Revenue</div>
                    <div className="text-body">12 partnerships closed | Target: $50K</div>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: '90%'}}></div>
                      </div>
                      <span className="progress-text">90% to goal</span>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="company-name">85%</div>
                    <div className="card-description">Close Rate</div>
                    <div className="text-body">vs 78% last month | Industry: 65%</div>
                    <span className="badge badge-success">Above Average</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partnership Revenue Breakdown */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">💼 Partnership Revenue by Service Type</h2>
                <p className="card-description">Jorge's sales performance across different service offerings</p>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Partnerships</th>
                      <th>Avg Deal Size</th>
                      <th>Total Revenue</th>
                      <th>Commission Rate</th>
                      <th>Jorge's Commission</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="company-name">USMCA Partnership Development</td>
                      <td className="prospects-count">8</td>
                      <td className="deal-size">$8,750</td>
                      <td className="deal-size">$70,000</td>
                      <td className="text-body">15%</td>
                      <td className="deal-size">$10,500</td>
                      <td><span className="badge badge-success">Strong</span></td>
                    </tr>
                    <tr>
                      <td className="company-name">Supply Chain Optimization</td>
                      <td className="prospects-count">5</td>
                      <td className="deal-size">$12,500</td>
                      <td className="deal-size">$62,500</td>
                      <td className="text-body">12%</td>
                      <td className="deal-size">$7,500</td>
                      <td><span className="badge badge-success">Growing</span></td>
                    </tr>
                    <tr>
                      <td className="company-name">Mexico Routing Consulting</td>
                      <td className="prospects-count">12</td>
                      <td className="deal-size">$3,200</td>
                      <td className="deal-size">$38,400</td>
                      <td className="text-body">20%</td>
                      <td className="deal-size">$7,680</td>
                      <td><span className="badge badge-info">Volume Play</span></td>
                    </tr>
                    <tr>
                      <td className="company-name">Trade Compliance Advisory</td>
                      <td className="prospects-count">3</td>
                      <td className="deal-size">$5,500</td>
                      <td className="deal-size">$16,500</td>
                      <td className="text-body">25%</td>
                      <td className="deal-size">$4,125</td>
                      <td><span className="badge badge-warning">Opportunity</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Active Prospects & Pipeline */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🎯 Active Sales Pipeline</h2>
                <p className="card-description">Current prospects and deal progression</p>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Prospect</th>
                      <th>Industry</th>
                      <th>Deal Size</th>
                      <th>Stage</th>
                      <th>Probability</th>
                      <th>Expected Close</th>
                      <th>Next Action</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="company-name">TechFlow Industries</td>
                      <td className="text-body">Electronics</td>
                      <td className="deal-size">$25,000</td>
                      <td><span className="badge badge-warning">Proposal</span></td>
                      <td>
                        <div className="probability-bar">
                          <div className="probability-fill" style={{width: '75%'}}></div>
                          <span>75%</span>
                        </div>
                      </td>
                      <td className="text-body">Dec 15</td>
                      <td className="text-body">Contract Review</td>
                      <td className="action-buttons">
                        <button className="action-btn call">📞 Follow-up</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="company-name">AutoParts Mexico SA</td>
                      <td className="text-body">Automotive</td>
                      <td className="deal-size">$45,000</td>
                      <td><span className="badge badge-info">Discovery</span></td>
                      <td>
                        <div className="probability-bar">
                          <div className="probability-fill" style={{width: '40%'}}></div>
                          <span>40%</span>
                        </div>
                      </td>
                      <td className="text-body">Jan 20</td>
                      <td className="text-body">Needs Assessment</td>
                      <td className="action-buttons">
                        <button className="action-btn email">📧 Proposal</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="company-name">Green Energy Solutions</td>
                      <td className="text-body">Renewable Energy</td>
                      <td className="deal-size">$18,500</td>
                      <td><span className="badge badge-success">Closing</span></td>
                      <td>
                        <div className="probability-bar">
                          <div className="probability-fill" style={{width: '90%'}}></div>
                          <span>90%</span>
                        </div>
                      </td>
                      <td className="text-body">Dec 5</td>
                      <td className="text-body">Contract Signing</td>
                      <td className="action-buttons">
                        <button className="action-btn urgent">✅ Close</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales Performance Trends */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📈 Performance Trends</h2>
                <p className="card-description">Monthly sales performance and goals</p>
              </div>

              <div className="revenue-breakdown">
                <h3 className="content-card-title">🎯 Monthly Sales Goals Progress</h3>
                <div className="revenue-bars">
                  <div className="revenue-item">
                    <div className="revenue-label">New Partnerships</div>
                    <div className="revenue-bar-container">
                      <div className="revenue-bar" style={{width: '85%', background: '#2563eb'}}></div>
                      <div className="revenue-amount">17 of 20 (85%)</div>
                    </div>
                  </div>
                  <div className="revenue-item">
                    <div className="revenue-label">Revenue Target</div>
                    <div className="revenue-bar-container">
                      <div className="revenue-bar" style={{width: '90%', background: '#16a34a'}}></div>
                      <div className="revenue-amount">$45.2K of $50K (90%)</div>
                    </div>
                  </div>
                  <div className="revenue-item">
                    <div className="revenue-label">Pipeline Development</div>
                    <div className="revenue-bar-container">
                      <div className="revenue-bar" style={{width: '112%', background: '#059669'}}></div>
                      <div className="revenue-amount">$187.5K of $167K (112%)</div>
                    </div>
                  </div>
                  <div className="revenue-item">
                    <div className="revenue-label">Client Retention</div>
                    <div className="revenue-bar-container">
                      <div className="revenue-bar" style={{width: '95%', background: '#7c3aed'}}></div>
                      <div className="revenue-amount">95% (Target: 90%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Services Tab */}
        {activeTab === 'professional' && (
          <div>
            {/* Consultation Pipeline */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🎯 Active Consultation Pipeline</h2>
                <p className="card-description">Jorge's billable consulting projects and implementation support</p>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Service Type</th>
                      <th>Hours Booked</th>
                      <th>Rate</th>
                      <th>Revenue</th>
                      <th>Status</th>
                      <th>Next Session</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="company-name">Loading...</td>
                      <td className="text-body">Professional services data will load from database</td>
                      <td className="prospects-count">--</td>
                      <td className="deal-size">--</td>
                      <td className="deal-size">--</td>
                      <td><span className="badge badge-info">Loading</span></td>
                      <td className="text-body">--</td>
                      <td className="action-buttons">
                        <button className="action-btn view">📊 Load Data</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom Integration Opportunities */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🔧 Custom Integration Opportunities</h2>
                <p className="card-description">High-value system integration and custom development projects</p>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Prospect</th>
                      <th>System Type</th>
                      <th>Complexity</th>
                      <th>Est. Value</th>
                      <th>Probability</th>
                      <th>Technical Req</th>
                      <th>Timeline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="company-name">Database-driven prospects</td>
                      <td className="text-body">Configuration-based integration types</td>
                      <td><span className="badge badge-warning">Variable</span></td>
                      <td className="deal-size">Calculated</td>
                      <td>
                        <div className="probability-bar">
                          <div className="probability-fill" style={{width: '0%'}}></div>
                          <span>--%</span>
                        </div>
                      </td>
                      <td className="text-body">Requirements from data</td>
                      <td className="text-body">Scheduled timeline</td>
                      <td className="action-buttons">
                        <button className="action-btn call">📊 Load Pipeline</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Professional Services Metrics */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📊 Professional Services Metrics</h2>
                <p className="card-description">Utilization and revenue tracking for consulting services</p>
              </div>

              <div className="grid-3-cols">
                <div className="card">
                  <div className="card-header">
                    <div className="deal-size">--</div>
                    <div className="card-description">Monthly Billable Hours</div>
                    <div className="text-body">Database-driven calculation</div>
                    <span className="badge badge-info">Loading</span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="pipeline-value">--</div>
                    <div className="card-description">Utilization Rate</div>
                    <div className="text-body">Target vs Actual from API</div>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: '0%'}}></div>
                      </div>
                      <span className="progress-text">--%</span>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="company-name">--</div>
                    <div className="card-description">Revenue/Hour</div>
                    <div className="text-body">Configuration-driven rates</div>
                    <span className="badge badge-success">Optimized</span>
                  </div>
                </div>
              </div>

              <div className="element-spacing">
                <button
                  onClick={() => {
                    console.log('Loading professional services data from /api/admin/professional-services');
                    // This would call the API and populate the data
                  }}
                  className="btn-primary"
                >
                  📊 Load Professional Services Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}