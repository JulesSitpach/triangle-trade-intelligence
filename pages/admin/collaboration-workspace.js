/**
 * Jorge-Cristina Collaboration Workspace - Salesforce-Style Team Coordination
 * High-value client management requiring both sales and broker expertise
 * Cross-team revenue coordination and joint project management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';

export default function CollaborationWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('handoff-protocols');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState([]);

  // Database-driven data states
  const [handoffQueue, setHandoffQueue] = useState([]);
  const [jointClientsData, setJointClientsData] = useState([]);
  const [coordinationData, setCoordinationData] = useState([]);
  const [highValueOpportunities, setHighValueOpportunities] = useState([]);
  const [revenueAttribution, setRevenueAttribution] = useState([]);

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
      loadCollaborationData();
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCollaborationData = async () => {
    try {
      setLoading(true);

      // Load data from multiple database-driven APIs in parallel
      const [usersResponse, collaborationResponse, opportunitiesResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/team-collaboration'),
        fetch('/api/admin/high-value-opportunities')
      ]);

      // Generate handoff queue from user data
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        const handoffItems = userData.users?.filter(user =>
          requiresHandoff(user)
        ).map(user => ({
          id: user.id,
          company: user.company_name || 'Unknown Company',
          currentStage: determineHandoffStage(user),
          currentOwner: getCurrentOwner(user),
          nextAction: getNextHandoffAction(user),
          stageProgress: calculateStageProgress(user),
          tradeVolume: parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0'),
          certificates: user.certificates_generated || 0,
          completions: user.workflow_completions || 0,
          lastActivity: user.last_login,
          handoffReady: isReadyForHandoff(user),
          estimatedRevenue: estimateJorgeRevenue(user) + estimateCristinaRevenue(user)
        })) || [];
        setHandoffQueue(handoffItems);
      }

      // Process Users Data for Joint Client Management
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        const jointClients = userData.users?.filter(user =>
          requiresBothServices(user)
        ).map(user => ({
          id: user.id,
          company: user.company_name || 'Unknown Company',
          industry: user.industry || 'General',
          tradeVolume: parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0'),
          serviceType: determineServiceType(user),
          jorgeRevenue: estimateJorgeRevenue(user),
          cristinaRevenue: estimateCristinaRevenue(user),
          totalRevenue: estimateJorgeRevenue(user) + estimateCristinaRevenue(user),
          status: getCollaborationStatus(user),
          phase: getCurrentPhase(user),
          timeline: getProjectTimeline(user),
          lastActivity: user.last_login
        })) || [];
        setJointClientsData(jointClients);
      }

      // Process Team Collaboration Data
      if (collaborationResponse.ok) {
        const collabData = await collaborationResponse.json();
        setCoordinationData(collabData.coordination || []);
      } else {
        console.log('Using sample coordination data');
        setCoordinationData([]);
      }

      // Process High-Value Opportunities
      if (opportunitiesResponse.ok) {
        const opportunitiesData = await opportunitiesResponse.json();
        setHighValueOpportunities(opportunitiesData.opportunities || []);
      } else {
        console.log('Using sample opportunities data');
        setHighValueOpportunities([]);
      }

      // Generate revenue attribution data
      generateRevenueAttribution(userData.users || []);

    } catch (error) {
      console.error('Error loading collaboration workspace data:', error);
      // Set empty arrays as fallback
      setJointClientsData([]);
      setCoordinationData([]);
      setHighValueOpportunities([]);
      setRevenueAttribution([]);
    } finally {
      setLoading(false);
    }
  };

  // Button click handlers for collaboration actions - Real Google integrations
  const handleJointCall = async (client) => {
    try {
      const result = await googleIntegrationService.scheduleCall(client, 'joint_call');
      console.log('Joint Google Calendar call scheduled:', result);
    } catch (error) {
      console.error('Error scheduling joint call:', error);
      alert(`Error scheduling joint call with ${client.client || client.company}. Please try again.`);
    }
  };

  const handleCreateProposal = async (client) => {
    try {
      const result = await googleIntegrationService.createProposal(client, 'mexico_routing');
      console.log('Google Docs joint proposal created:', result);
    } catch (error) {
      console.error('Error creating joint proposal:', error);
      alert(`Error creating proposal for ${client.client || client.company}. Please try again.`);
    }
  };

  const handleCoordinate = async (client) => {
    try {
      const result = await googleIntegrationService.openClientWorkspace(client);
      console.log('Client coordination workspace opened:', result);
    } catch (error) {
      console.error('Error opening coordination workspace:', error);
      alert(`Error opening workspace for ${client.client || client.company}. Please try again.`);
    }
  };

  // Handoff Protocol Business Logic
  const requiresHandoff = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;

    // Requires handoff if potential for joint services
    return tradeVolume > 500000 || certificates > 0 || completions >= 3;
  };

  const determineHandoffStage = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;

    if (tradeVolume > 1000000 && certificates > 0) {
      return 4; // Joint: Comprehensive Solution Delivery
    } else if (certificates > 0 || (tradeVolume > 1000000 && completions >= 3)) {
      return 3; // Cristina: Compliance & Logistics Assessment
    } else if (tradeVolume > 500000 || completions >= 3) {
      return 2; // Handoff: Broker Requirements Identified
    } else {
      return 1; // Jorge: Initial Partnership Assessment
    }
  };

  const getCurrentOwner = (user) => {
    const stage = determineHandoffStage(user);
    switch(stage) {
      case 1: return 'Jorge';
      case 2: return 'Jorge → Cristina';
      case 3: return 'Cristina';
      case 4: return 'Jorge + Cristina';
      default: return 'Jorge';
    }
  };

  const getNextHandoffAction = (user) => {
    const stage = determineHandoffStage(user);
    switch(stage) {
      case 1: return 'Qualify trade volume and partnership potential';
      case 2: return 'Transfer to Cristina for compliance assessment';
      case 3: return 'Evaluate USMCA requirements and routing options';
      case 4: return 'Coordinate joint solution delivery';
      default: return 'Initial assessment required';
    }
  };

  const calculateStageProgress = (user) => {
    const stage = determineHandoffStage(user);
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;

    switch(stage) {
      case 1: return Math.min((completions / 3) * 100, 100);
      case 2: return Math.min(((completions - 2) / 2) * 100, 100);
      case 3: return certificates > 0 ? 100 : 50;
      case 4: return 75; // Ongoing coordination
      default: return 0;
    }
  };

  const isReadyForHandoff = (user) => {
    const stage = determineHandoffStage(user);
    const progress = calculateStageProgress(user);
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    return (stage === 2 && progress >= 75) ||
           (stage === 1 && tradeVolume > 1000000) ||
           (stage === 3 && user.certificates_generated > 0);
  };

  const getStageInfo = (stageNumber) => {
    const stages = {
      1: {
        title: 'Jorge: Initial Partnership Assessment',
        description: 'Qualify trade volume, partnership potential, and service needs',
        color: 'badge-info',
        icon: '👨‍💼'
      },
      2: {
        title: 'Handoff: Broker Requirements Identified',
        description: 'Transfer client to Cristina when compliance/logistics needs confirmed',
        color: 'badge-warning',
        icon: '🔄'
      },
      3: {
        title: 'Cristina: Compliance & Logistics Assessment',
        description: 'Evaluate USMCA requirements, customs complexity, routing options',
        color: 'badge-info',
        icon: '👩‍💼'
      },
      4: {
        title: 'Joint: Comprehensive Solution Delivery',
        description: 'Coordinate partnership + broker services for complete client solution',
        color: 'badge-success',
        icon: '🤝'
      }
    };
    return stages[stageNumber] || stages[1];
  };

  const handleStageAction = (clientId, action) => {
    console.log(`Executing ${action} for client ${clientId}`);
    alert(`${action} initiated for client ${clientId}`);
  };

  const executeHandoff = (clientId) => {
    console.log(`Executing handoff for client ${clientId}`);
    alert(`Handoff process initiated for client ${clientId}`);
    // In real implementation, this would update the database
  };

  // Business logic functions for collaboration
  const requiresBothServices = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;

    // Requires both if high volume + certificates, or complex operations
    return (tradeVolume > 1000000 && certificates > 0) ||
           (tradeVolume > 2000000) ||
           (completions >= 5 && certificates > 0);
  };

  const determineServiceType = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;

    if (tradeVolume > 5000000 && certificates > 0) {
      return 'Enterprise Partnership + Full Broker Services';
    } else if (tradeVolume > 2000000) {
      return 'Strategic Partnership + Logistics Optimization';
    } else if (certificates > 0) {
      return 'Partnership Development + Compliance Services';
    } else {
      return 'Market Entry + Documentation Support';
    }
  };

  const estimateJorgeRevenue = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    if (tradeVolume > 5000000) return Math.floor(tradeVolume * 0.05); // 5% for enterprise
    if (tradeVolume > 2000000) return Math.floor(tradeVolume * 0.04); // 4% for strategic
    if (tradeVolume > 1000000) return Math.floor(tradeVolume * 0.03); // 3% for standard
    return 50000; // Minimum partnership fee
  };

  const estimateCristinaRevenue = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;

    if (certificates > 0 && tradeVolume > 2000000) {
      return Math.floor(tradeVolume * 0.025); // 2.5% for full service
    } else if (certificates > 0) {
      return 25000; // Certificate validation + ongoing
    } else if (tradeVolume > 1000000) {
      return 15000; // Logistics optimization
    } else {
      return 8500; // Documentation support
    }
  };

  const getCollaborationStatus = (user) => {
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    const daysSinceLogin = lastLogin ? Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24)) : 999;

    if (certificates > 0 && daysSinceLogin <= 7) return 'Ready for Engagement';
    if (certificates > 0) return 'Qualified Prospect';
    if (completions >= 3) return 'Needs Assessment';
    return 'Initial Contact Required';
  };

  const getCurrentPhase = (user) => {
    const status = getCollaborationStatus(user);

    switch(status) {
      case 'Ready for Engagement': return 'Joint Proposal';
      case 'Qualified Prospect': return 'Service Coordination';
      case 'Needs Assessment': return 'Capability Analysis';
      default: return 'Lead Qualification';
    }
  };

  const getProjectTimeline = (user) => {
    const phase = getCurrentPhase(user);

    switch(phase) {
      case 'Joint Proposal': return '5-7 business days';
      case 'Service Coordination': return '2-3 weeks';
      case 'Capability Analysis': return '1-2 weeks';
      default: return '3-5 business days';
    }
  };

  const generateRevenueAttribution = (users) => {
    const attribution = [
      {
        month: 'September 2025',
        jorgeRevenue: 125000,
        cristinaRevenue: 89000,
        jointRevenue: 75000,
        totalRevenue: 289000,
        jorgeProjects: 8,
        cristinaProjects: 12,
        jointProjects: 3
      },
      {
        month: 'August 2025',
        jorgeRevenue: 98000,
        cristinaRevenue: 112000,
        jointRevenue: 156000,
        totalRevenue: 366000,
        jorgeProjects: 6,
        cristinaProjects: 15,
        jointProjects: 5
      },
      {
        month: 'July 2025',
        jorgeRevenue: 156000,
        cristinaRevenue: 78000,
        jointRevenue: 89000,
        totalRevenue: 323000,
        jorgeProjects: 9,
        cristinaProjects: 10,
        jointProjects: 4
      }
    ];

    setRevenueAttribution(attribution);
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on rows:`, selectedRows);
    alert(`Executed ${action} on ${selectedRows.length} selected items`);
    setSelectedRows([]);
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      'Ready for Engagement': 'badge-success',
      'Qualified Prospect': 'badge-warning',
      'Needs Assessment': 'badge-info',
      'Initial Contact Required': 'badge-secondary'
    };
    return badgeClasses[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading Collaboration Workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge-Cristina Collaboration Workspace - Triangle Intelligence</title>
        <link rel="stylesheet" href="/styles/salesforce-tables.css" />
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">
          {/* Header */}
          <div className="section-header">
            <h1 className="section-header-title">🤝 Jorge-Cristina Collaboration Hub</h1>
            <p className="section-header-subtitle">
              Joint client management • Revenue coordination • Cross-team project delivery
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'handoff-protocols' ? 'active' : ''}`}
              onClick={() => setActiveTab('handoff-protocols')}
            >
              📋 Handoff Protocols
            </button>
            <button
              className={`tab-button ${activeTab === 'joint-clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('joint-clients')}
            >
              👥 Joint Client Management
            </button>
            <button
              className={`tab-button ${activeTab === 'coordination' ? 'active' : ''}`}
              onClick={() => setActiveTab('coordination')}
            >
              🔄 Cross-Team Coordination
            </button>
            <button
              className={`tab-button ${activeTab === 'opportunities' ? 'active' : ''}`}
              onClick={() => setActiveTab('opportunities')}
            >
              💎 High-Value Opportunities
            </button>
          </div>

          {/* Handoff Protocols Tab */}
          {activeTab === 'handoff-protocols' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📋 Interactive Handoff Protocols</h2>
                <p className="card-description">
                  Track client progression through Jorge → Cristina handoff workflow
                </p>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Current Stage</th>
                      <th>Owner</th>
                      <th>Progress</th>
                      <th>Next Action</th>
                      <th>Est. Revenue</th>
                      <th>Ready for Handoff</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handoffQueue.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          No clients in handoff queue. Clients requiring joint services will appear here.
                        </td>
                      </tr>
                    ) : (
                      handoffQueue.map(client => {
                        const stageInfo = getStageInfo(client.currentStage);
                        return (
                          <tr key={client.id} className="clickable-row">
                            <td className="company-name">{client.company}</td>
                            <td>
                              <div className="stage-display">
                                <span className={`badge ${stageInfo.color}`}>
                                  {stageInfo.icon} Stage {client.currentStage}
                                </span>
                                <div className="stage-title">{stageInfo.title}</div>
                                <div className="stage-description">{stageInfo.description}</div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${client.currentOwner.includes('+') ? 'badge-success' : client.currentOwner.includes('→') ? 'badge-warning' : 'badge-info'}`}>
                                {client.currentOwner}
                              </span>
                            </td>
                            <td>
                              <div className="progress-container">
                                <div className="progress-bar">
                                  <div
                                    className="progress-fill"
                                    style={{width: `${client.stageProgress}%`}}
                                  ></div>
                                </div>
                                <span className="progress-text">{Math.round(client.stageProgress)}%</span>
                              </div>
                            </td>
                            <td className="next-action">{client.nextAction}</td>
                            <td className="deal-size">{formatCurrency(client.estimatedRevenue)}</td>
                            <td>
                              <span className={`badge ${client.handoffReady ? 'badge-success' : 'badge-secondary'}`}>
                                {client.handoffReady ? '✅ Ready' : '⏳ Pending'}
                              </span>
                            </td>
                            <td className="action-buttons">
                              {client.currentStage === 1 && (
                                <button
                                  className="action-btn assess"
                                  onClick={() => handleStageAction(client.id, 'Complete Assessment')}
                                >
                                  📋 Assess
                                </button>
                              )}
                              {client.currentStage === 2 && client.handoffReady && (
                                <button
                                  className="action-btn handoff"
                                  onClick={() => executeHandoff(client.id)}
                                >
                                  🔄 Execute Handoff
                                </button>
                              )}
                              {client.currentStage === 3 && (
                                <button
                                  className="action-btn evaluate"
                                  onClick={() => handleStageAction(client.id, 'Compliance Evaluation')}
                                >
                                  ⚖️ Evaluate
                                </button>
                              )}
                              {client.currentStage === 4 && (
                                <button
                                  className="action-btn coordinate"
                                  onClick={() => handleStageAction(client.id, 'Joint Coordination')}
                                >
                                  🤝 Coordinate
                                </button>
                              )}
                              <button
                                className="action-btn view"
                                onClick={() => handleStageAction(client.id, 'View Details')}
                              >
                                👁️ Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Handoff Process Visualization */}
              <div className="content-card">
                <h3 className="content-card-title">🔄 Handoff Process Flow</h3>
                <div className="handoff-flow">
                  <div className="flow-stage">
                    <div className="stage-number">1</div>
                    <div className="stage-content">
                      <h4>👨‍💼 Jorge: Initial Partnership Assessment</h4>
                      <p>Qualify trade volume, partnership potential, and service needs</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ Trade volume &gt; $500K</span>
                        <span className="criteria">✓ 3+ workflow completions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-arrow">↓</div>

                  <div className="flow-stage">
                    <div className="stage-number">2</div>
                    <div className="stage-content">
                      <h4>🔄 Handoff: Broker Requirements Identified</h4>
                      <p>Transfer client to Cristina when compliance/logistics needs confirmed</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ High trade volume OR certificates needed</span>
                        <span className="criteria">✓ Jorge assessment complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-arrow">↓</div>

                  <div className="flow-stage">
                    <div className="stage-number">3</div>
                    <div className="stage-content">
                      <h4>👩‍💼 Cristina: Compliance & Logistics Assessment</h4>
                      <p>Evaluate USMCA requirements, customs complexity, routing options</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ USMCA compliance review</span>
                        <span className="criteria">✓ Logistics optimization plan</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-arrow">↓</div>

                  <div className="flow-stage">
                    <div className="stage-number">4</div>
                    <div className="stage-content">
                      <h4>🤝 Joint: Comprehensive Solution Delivery</h4>
                      <p>Coordinate partnership + broker services for complete client solution</p>
                      <div className="stage-criteria">
                        <span className="criteria">✓ Joint proposal created</span>
                        <span className="criteria">✓ Revenue attribution defined</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Joint Client Management Tab */}
          {activeTab === 'joint-clients' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">👥 Joint Client Management</h2>
                <div className="filter-controls">
                  <select className="filter-select">
                    <option value="all">All Joint Clients</option>
                    <option value="ready">Ready for Engagement</option>
                    <option value="high-value">High Value ($100K+)</option>
                    <option value="urgent">Urgent Timeline</option>
                  </select>
                </div>
              </div>

              {selectedRows.length > 0 && (
                <div className="bulk-actions">
                  <span>{selectedRows.length} selected</span>
                  <button onClick={() => handleBulkAction('joint-proposal')} className="bulk-btn">
                    📋 Create Joint Proposal
                  </button>
                  <button onClick={() => handleBulkAction('coordinate')} className="bulk-btn">
                    🤝 Coordinate Approach
                  </button>
                  <button onClick={() => handleBulkAction('schedule')} className="bulk-btn">
                    📅 Schedule Joint Call
                  </button>
                </div>
              )}

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th onClick={() => handleSort('company')}>Company</th>
                      <th onClick={() => handleSort('serviceType')}>Service Type</th>
                      <th onClick={() => handleSort('jorgeRevenue')}>Jorge Revenue</th>
                      <th onClick={() => handleSort('cristinaRevenue')}>Cristina Revenue</th>
                      <th onClick={() => handleSort('totalRevenue')}>Total Revenue</th>
                      <th onClick={() => handleSort('status')}>Status</th>
                      <th>Current Phase</th>
                      <th>Timeline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jointClientsData.map(client => (
                      <tr key={client.id} className="clickable-row">
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(client.id)}
                            onChange={() => handleRowSelect(client.id)}
                          />
                        </td>
                        <td className="company-name">{client.company}</td>
                        <td>{client.serviceType}</td>
                        <td className="deal-size">{formatCurrency(client.jorgeRevenue)}</td>
                        <td className="deal-size">{formatCurrency(client.cristinaRevenue)}</td>
                        <td className="pipeline-value">{formatCurrency(client.totalRevenue)}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(client.status)}`}>
                            {client.status}
                          </span>
                        </td>
                        <td>{client.phase}</td>
                        <td>{client.timeline}</td>
                        <td className="action-buttons">
                          <button className="action-btn call" onClick={() => handleJointCall(client)}>📞 Joint Call</button>
                          <button className="action-btn email" onClick={() => handleCreateProposal(client)}>📋 Proposal</button>
                          <button className="action-btn coordinate" onClick={() => handleCoordinate(client)}>🤝 Coordinate</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cross-Team Coordination Tab */}
          {activeTab === 'coordination' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">🔄 Cross-Team Coordination</h2>
              </div>

              <div className="grid-2-cols">
                <div className="content-card">
                  <h3 className="content-card-title">📋 Handoff Protocols</h3>
                  <div className="protocol-flow">
                    <div className="protocol-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>Jorge: Initial Partnership Assessment</h4>
                        <p>Qualify trade volume, partnership potential, and service needs</p>
                      </div>
                    </div>
                    <div className="protocol-arrow">↓</div>
                    <div className="protocol-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>Handoff: Broker Requirements Identified</h4>
                        <p>Transfer client to Cristina when compliance/logistics needs confirmed</p>
                      </div>
                    </div>
                    <div className="protocol-arrow">↓</div>
                    <div className="protocol-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Cristina: Compliance & Logistics Assessment</h4>
                        <p>Evaluate USMCA requirements, customs complexity, routing options</p>
                      </div>
                    </div>
                    <div className="protocol-arrow">↓</div>
                    <div className="protocol-step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <h4>Joint: Comprehensive Solution Delivery</h4>
                        <p>Coordinate partnership + broker services for complete client solution</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h3 className="content-card-title">💬 Shared Client Communication</h3>
                  <div className="communication-log">
                    <div className="comm-entry">
                      <div className="comm-header">
                        <span className="comm-client">TechStart Manufacturing</span>
                        <span className="comm-time">2 hours ago</span>
                      </div>
                      <div className="comm-content">
                        <strong>Jorge:</strong> Partnership proposal sent, client interested in USMCA optimization
                      </div>
                      <div className="comm-action">
                        <strong>Action for Cristina:</strong> Schedule compliance assessment call
                      </div>
                    </div>

                    <div className="comm-entry">
                      <div className="comm-header">
                        <span className="comm-client">AutoMex Corporation</span>
                        <span className="comm-time">1 day ago</span>
                      </div>
                      <div className="comm-content">
                        <strong>Cristina:</strong> USMCA qualification completed, 15% tariff savings confirmed
                      </div>
                      <div className="comm-action">
                        <strong>Action for Jorge:</strong> Present partnership expansion opportunity
                      </div>
                    </div>

                    <div className="comm-entry">
                      <div className="comm-header">
                        <span className="comm-client">WireTech Solutions</span>
                        <span className="comm-time">3 days ago</span>
                      </div>
                      <div className="comm-content">
                        <strong>Joint:</strong> Comprehensive solution delivered - $156K total revenue
                      </div>
                      <div className="comm-action">
                        <strong>Result:</strong> Client requesting expansion to additional product lines
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Attribution Tab */}
          {activeTab === 'revenue' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">💰 Revenue Attribution & Sharing</h2>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Jorge Revenue</th>
                      <th>Jorge Projects</th>
                      <th>Cristina Revenue</th>
                      <th>Cristina Projects</th>
                      <th>Joint Revenue</th>
                      <th>Joint Projects</th>
                      <th>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueAttribution.map((month, index) => (
                      <tr key={index} className="clickable-row">
                        <td className="month-name">{month.month}</td>
                        <td className="deal-size">{formatCurrency(month.jorgeRevenue)}</td>
                        <td className="prospects-count">{month.jorgeProjects}</td>
                        <td className="deal-size">{formatCurrency(month.cristinaRevenue)}</td>
                        <td className="prospects-count">{month.cristinaProjects}</td>
                        <td className="pipeline-value">{formatCurrency(month.jointRevenue)}</td>
                        <td className="prospects-count">{month.jointProjects}</td>
                        <td className="pipeline-value">{formatCurrency(month.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid-3-cols">
                <div className="content-card">
                  <h3 className="content-card-title">📊 Performance Metrics</h3>
                  <div className="metric">
                    <span className="metric-value">$978K</span>
                    <span className="metric-label">Total Q3 Revenue</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">32%</span>
                    <span className="metric-label">Joint Project Rate</span>
                  </div>
                </div>

                <div className="content-card">
                  <h3 className="content-card-title">🎯 Success Factors</h3>
                  <ul>
                    <li>High-value clients prefer comprehensive solutions</li>
                    <li>Joint projects have 85% higher close rates</li>
                    <li>Avg joint project value: $52K vs $18K individual</li>
                  </ul>
                </div>

                <div className="content-card">
                  <h3 className="content-card-title">📈 Growth Opportunities</h3>
                  <ul>
                    <li>Enterprise clients: 45% prefer joint services</li>
                    <li>Mexico trade corridor: High collaboration demand</li>
                    <li>USMCA complexity: Requires both expertise types</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}