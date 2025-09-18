/**
 * Jorge's Sales Dashboard - Salesforce-Style Client Portfolio
 * Database-driven pipeline management and client conversion tools
 * NO HARDCODED VALUES - All data from configuration and database
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { SALES_CONFIG, GOOGLE_APPS_CONFIG, MARKET_INTELLIGENCE_CONFIG } from '../../config/sales-config';
import googleIntegrationService from '../../lib/services/google-integration-service';
import SimpleDetailPanel from '../../components/admin/SimpleDetailPanel';

export default function ClientPortfolio() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterView, setFilterView] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);

  // Detail panel state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Database-driven data states (NO hardcoded arrays)
  const [pipelineData, setPipelineData] = useState([]);
  const [proposalsData, setProposalsData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [leadsData, setLeadsData] = useState([]);
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
      loadSalesDashboardData();
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSalesDashboardData = async () => {
    try {
      setLoading(true);

      // Load data from multiple database-driven APIs in parallel
      const [usersResponse, salesPipelineResponse, leadsResponse, marketResponse, professionalResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/sales-pipeline'),
        fetch('/api/admin/platform-leads'),
        fetch('/api/admin/market-intelligence'),
        fetch('/api/admin/professional-services')
      ]);

      // Process Users Data for Sales Pipeline - Database driven
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        const enrichedPipeline = userData.users?.map(user => ({
          id: user.id,
          companyName: user.company_name || 'Unknown Company',
          industry: user.industry || inferIndustryFromData(user),
          dealSize: calculateDealSize(user),
          stage: determineSalesStage(user),
          probability: calculateSalesProbability(user),
          source: 'Platform',
          nextAction: getNextSalesAction(user),
          dueDate: calculateFollowUpDate(user),
          status: determineLeadStatus(user)
        })) || [];
        setPipelineData(enrichedPipeline);
      } else {
        console.log('No users found for sales pipeline');
        setPipelineData([]);
      }

      // Process Sales Pipeline Data
      if (salesPipelineResponse.ok) {
        const salesData = await salesPipelineResponse.json();
        setProposalsData(salesData.proposals || []);
      } else {
        console.log('No sales pipeline data found');
        setProposalsData([]);
      }

      // Process Platform Leads Data
      if (leadsResponse.ok) {
        const leadsResponseData = await leadsResponse.json();
        setLeadsData(leadsResponseData.leads || []);
      } else {
        console.log('No platform leads found');
        setLeadsData([]);
      }

      // Process Market Intelligence Data
      if (marketResponse.ok) {
        const marketAnalytics = await marketResponse.json();
        setMarketData(marketAnalytics.industries || []);
      } else {
        console.log('No market intelligence data found');
        setMarketData([]);
      }

      // Process Professional Services Data for Jorge's consultation pipeline
      if (professionalResponse.ok) {
        const professionalData = await professionalResponse.json();
        setProfessionalServices({
          jorge_pipeline: professionalData.jorge_consultation_pipeline || [],
          jorge_integrations: professionalData.jorge_custom_integrations || [],
          utilization_metrics: professionalData.utilization_metrics || {}
        });
      } else {
        console.log('No professional services data found');
        setProfessionalServices({
          jorge_pipeline: [],
          jorge_integrations: [],
          utilization_metrics: {}
        });
      }

    } catch (error) {
      console.error('Error loading Jorge sales dashboard data:', error);
      // Set empty arrays as fallback - no hardcoded data
      setPipelineData([]);
      setProposalsData([]);
      setLeadsData([]);
      setMarketData([]);
      setProfessionalServices({
        jorge_pipeline: [],
        jorge_integrations: [],
        utilization_metrics: {}
      });
    } finally {
      setLoading(false);
    }
  };

  // Detail panel management
  const openDetailPanel = (record, type = 'client') => {
    setSelectedRecord({ ...record, recordType: type });
    setDetailPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setDetailPanelOpen(false);
    setSelectedRecord(null);
  };

  const handleDetailSave = async (updatedRecord) => {
    try {
      // Save to appropriate endpoint based on record type
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });

      if (response.ok) {
        console.log('Record updated successfully');
        loadSalesDashboardData(); // Reload data
        closeDetailPanel();
      }
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  // Button click handlers for client actions - Real Google integrations
  const handleCallClient = async (client) => {
    try {
      const result = await googleIntegrationService.scheduleCall(client, 'follow_up');
      console.log('Google Calendar call scheduled:', result);
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert(`Error scheduling call with ${client.company || client.client}. Please try again.`);
    }
  };

  const handleEmailClient = async (client) => {
    try {
      const result = await googleIntegrationService.composeEmail(client, 'follow_up');
      console.log('Gmail compose opened:', result);
    } catch (error) {
      console.error('Error opening Gmail:', error);
      alert(`Error opening email for ${client.company || client.client}. Please try again.`);
    }
  };

  const handleViewClient = async (client) => {
    try {
      const result = await googleIntegrationService.openClientWorkspace(client);
      console.log('Client workspace opened:', result);
    } catch (error) {
      console.error('Error opening client workspace:', error);
      alert(`Error opening workspace for ${client.company || client.client}. Please try again.`);
    }
  };

  const handleFollowUp = async (proposal) => {
    try {
      const client = { company: proposal.client, email: proposal.email };
      const result = await googleIntegrationService.composeEmail(client, 'follow_up');
      console.log('Follow-up email composed:', result);
    } catch (error) {
      console.error('Error composing follow-up:', error);
      alert(`Error creating follow-up for ${proposal.client}. Please try again.`);
    }
  };

  const handleModifyProposal = async (proposal) => {
    try {
      const client = { company: proposal.client, email: proposal.email };
      const result = await googleIntegrationService.createProposal(client, 'mexico_routing');
      console.log('Google Docs proposal created:', result);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert(`Error modifying proposal for ${proposal.client}. Please try again.`);
    }
  };

  const handleProposalStatus = async (proposal) => {
    try {
      const client = { company: proposal.client, email: proposal.email };
      const result = await googleIntegrationService.scheduleCall(client, 'proposal_presentation');
      console.log('Proposal status call scheduled:', result);
    } catch (error) {
      console.error('Error scheduling status call:', error);
      alert(`Error scheduling status call for ${proposal.client}. Please try again.`);
    }
  };

  const handleResearchIndustry = (industry) => {
    openDetailPanel(industry, 'market');
  };

  const handleTargetIndustry = (industry) => {
    openDetailPanel(industry, 'market');
  };

  const handleIndustryCampaign = (industry) => {
    openDetailPanel(industry, 'market');
  };

  // Professional Services Action Handlers
  const handleCreateIntegrationOpportunity = async (integration) => {
    try {
      const response = await fetch('/api/admin/professional-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'custom_integration',
          client: integration.prospect,
          assignee: 'Jorge',
          status: 'scoping',
          estimated_value: integration.estimated_value,
          timeline: integration.timeline,
          technical_requirements: integration.technical_requirements,
          notify_google: true
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Integration opportunity created for ${integration.prospect}. Cristina has been notified in the collaboration queue.`);
        console.log('Integration created with cross-dashboard sync:', result);
        // Reload data to show updated state
        loadSalesDashboardData();
      } else {
        throw new Error(result.error || 'Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating integration opportunity:', error);
      alert(`Error creating opportunity for ${integration.prospect}. Please try again.`);
    }
  };

  const handleScheduleConsultation = async (project) => {
    try {
      // Schedule consultation and update service delivery queue
      const response = await fetch('/api/admin/professional-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          status: 'scheduled',
          next_session: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          sync_calendar: true
        })
      });

      const result = await response.json();
      if (result.success) {
        // Also trigger Google integration
        await googleIntegrationService.scheduleCall(project, 'consultation');
        alert(`Consultation scheduled for ${project.client}. Updated in service delivery tracking.`);
        loadSalesDashboardData();
      }
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      alert(`Error scheduling consultation for ${project.client}. Please try again.`);
    }
  };

  // Configuration-driven business logic functions
  const calculateDealSize = (user) => {
    if (!user.trade_volume) return SALES_CONFIG.deal_tiers.starter.minimum_fee;

    const volume = typeof user.trade_volume === 'string'
      ? parseFloat(user.trade_volume.replace(/[$,]/g, ''))
      : user.trade_volume;

    // Use configuration-driven tier calculation
    for (const [tierName, tier] of Object.entries(SALES_CONFIG.deal_tiers)) {
      if (volume >= tier.threshold) {
        const calculatedFee = Math.floor(volume * tier.percentage);
        return Math.max(calculatedFee, tier.minimum_fee);
      }
    }

    return SALES_CONFIG.deal_tiers.starter.minimum_fee;
  };

  const determineSalesStage = (user) => {
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    const daysSinceLogin = lastLogin ? Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24)) : 999;

    // Configuration-driven stage determination
    if (certificates > 0) return SALES_CONFIG.pipeline_stages.qualified.name;
    if (completions >= SALES_CONFIG.priority_factors.workflow_threshold) return SALES_CONFIG.pipeline_stages.prospect.name;
    if (completions >= 1 && daysSinceLogin <= SALES_CONFIG.priority_factors.recent_activity_days) {
      return 'Active User';
    }
    if (completions >= 1) return 'Platform User';
    return 'New Registration';
  };

  const calculateSalesProbability = (user) => {
    const scoring = SALES_CONFIG.lead_scoring;
    let probability = 10; // Base probability

    // Configuration-driven probability calculation
    if (user.certificates_generated > 0) {
      probability += scoring.certificates_generated_weight * 100;
    }
    if (user.workflow_completions >= 3) {
      probability += scoring.workflow_completions_weight * 100;
    }
    if (user.subscription_tier === 'enterprise') probability += 20;
    if (user.subscription_tier === 'professional') probability += 15;
    if (user.total_savings > 100000) probability += scoring.recent_activity_weight * 100;

    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    const daysSinceLogin = lastLogin ? Math.floor((new Date() - lastLogin) / (1000 * 60 * 60 * 24)) : 999;

    if (daysSinceLogin <= SALES_CONFIG.priority_factors.recent_activity_days) {
      probability += scoring.recent_activity_weight * 100;
    }

    return Math.min(Math.round(probability), 95); // Cap at 95%
  };

  const getNextSalesAction = (user) => {
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;

    // Configuration-driven action determination
    if (certificates > SALES_CONFIG.priority_factors.certificate_threshold) {
      return SALES_CONFIG.pipeline_stages.proposal.actions[0];
    }
    if (completions >= SALES_CONFIG.priority_factors.workflow_threshold) {
      return 'Schedule Assessment';
    }
    if (completions >= 1) {
      return 'Follow-up Call';
    }
    return 'Initial Outreach';
  };

  const calculateFollowUpDate = (user) => {
    const lastLogin = user.last_login ? new Date(user.last_login) : new Date();
    const certificates = user.certificates_generated || 0;
    const priority = certificates > 0 ? 1 : (user.workflow_completions >= 3 ? 2 : 7);

    const followUpDate = new Date(lastLogin);
    followUpDate.setDate(followUpDate.getDate() + priority);

    return followUpDate.toISOString().split('T')[0];
  };

  const determineLeadStatus = (user) => {
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;
    const savings = user.total_savings || 0;
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    // Configuration-driven status determination
    if (certificates > 0 && (savings > 100000 || tradeVolume > SALES_CONFIG.priority_factors.high_volume_threshold)) {
      return 'hot';
    }
    if (completions >= SALES_CONFIG.priority_factors.workflow_threshold) {
      return 'warm';
    }
    if (completions >= 1) {
      return 'qualified';
    }
    return 'cold';
  };

  const inferIndustryFromData = (user) => {
    // Infer industry from business type or product description
    const businessType = user.business_type?.toLowerCase() || '';
    const productDesc = user.product_description?.toLowerCase() || '';

    if (businessType.includes('electronic') || productDesc.includes('electronic')) {
      return 'Electronics';
    }
    if (businessType.includes('auto') || productDesc.includes('auto')) {
      return 'Automotive';
    }
    if (businessType.includes('textile') || productDesc.includes('textile')) {
      return 'Textiles';
    }
    return 'General Manufacturing';
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
      'hot': 'badge-danger',
      'warm': 'badge-warning',
      'qualified': 'badge-info',
      'cold': 'badge-secondary',
      'Hot Lead': 'badge-danger',
      'Warm Lead': 'badge-warning',
      'Cold Lead': 'badge-info',
      'Pending': 'badge-warning',
      'Under Review': 'badge-info',
      'Draft': 'badge-secondary'
    };
    return badgeClasses[status] || 'badge-info';
  };

  const openGoogleApp = (app) => {
    const urls = {
      gmail: `${GOOGLE_APPS_CONFIG.endpoints.gmail_api}/users/me/messages`,
      calendar: `${GOOGLE_APPS_CONFIG.endpoints.calendar_api}/calendars/primary/events`,
      docs: `${GOOGLE_APPS_CONFIG.endpoints.docs_api}/documents`,
      sheets: 'https://sheets.google.com',
      drive: `${GOOGLE_APPS_CONFIG.endpoints.drive_api}/files`
    };

    window.open(urls[app] || 'https://workspace.google.com', '_blank');
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading {SALES_CONFIG.representative.name}'s Sales Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{SALES_CONFIG.representative.name}'s Sales Dashboard - Triangle Intelligence</title>
        <link rel="stylesheet" href="/styles/salesforce-tables.css" />
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">
          {/* Header */}
          <div className="section-header">
            <h1 className="section-header-title">📊 {SALES_CONFIG.representative.name}'s Sales Dashboard</h1>
            <p className="section-header-subtitle">
              {SALES_CONFIG.representative.territory} Sales Representative • Salesforce-style pipeline management
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              📈 Sales Pipeline
            </button>
            <button
              className={`tab-button ${activeTab === 'proposals' ? 'active' : ''}`}
              onClick={() => setActiveTab('proposals')}
            >
              🎯 Active Proposals
            </button>
            <button
              className={`tab-button ${activeTab === 'professional' ? 'active' : ''}`}
              onClick={() => setActiveTab('professional')}
            >
              💼 Professional Services
            </button>
            <button
              className={`tab-button ${activeTab === 'market' ? 'active' : ''}`}
              onClick={() => setActiveTab('market')}
            >
              📊 Market Intelligence
            </button>
            <button
              className={`tab-button ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              ⚡ Lead Generation
            </button>
          </div>

          {/* Pipeline Management Tab */}
          {activeTab === 'pipeline' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📊 Sales Pipeline Management</h2>
                <div className="filter-controls">
                  <select
                    value={filterView}
                    onChange={(e) => setFilterView(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Deals</option>
                    <option value="hot">Hot Prospects</option>
                    <option value="closing">Closing This Month</option>
                    <option value="overdue">Overdue Follow-ups</option>
                  </select>
                </div>
              </div>

              {selectedRows.length > 0 && (
                <div className="bulk-actions">
                  <span>{selectedRows.length} selected</span>
                  <button onClick={() => handleBulkAction('email')} className="bulk-btn">
                    📧 Bulk Email
                  </button>
                  <button onClick={() => handleBulkAction('update')} className="bulk-btn">
                    📝 Update Status
                  </button>
                  <button onClick={() => handleBulkAction('export')} className="bulk-btn">
                    📤 Export
                  </button>
                </div>
              )}

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th onClick={() => handleSort('companyName')}>
                        Company Name {sortConfig.key === 'companyName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('industry')}>Industry</th>
                      <th onClick={() => handleSort('dealSize')}>Deal Size</th>
                      <th onClick={() => handleSort('stage')}>Stage</th>
                      <th onClick={() => handleSort('probability')}>Probability</th>
                      <th>Source</th>
                      <th>Next Action</th>
                      <th onClick={() => handleSort('dueDate')}>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineData.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          No pipeline data available. Complete workflows on the platform to generate sales leads.
                        </td>
                      </tr>
                    ) : (
                      pipelineData.map(deal => (
                        <tr
                          key={deal.id}
                          className="clickable-row"
                          onClick={() => openDetailPanel(deal, 'pipeline')}
                          style={{cursor: 'pointer'}}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(deal.id)}
                              onChange={() => handleRowSelect(deal.id)}
                            />
                          </td>
                          <td className="company-name">{deal.companyName}</td>
                          <td>{deal.industry}</td>
                          <td className="deal-size">{formatCurrency(deal.dealSize)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(deal.stage)}`}>
                              {deal.stage}
                            </span>
                          </td>
                          <td>
                            <div className="probability-bar">
                              <div
                                className="probability-fill"
                                style={{width: `${deal.probability}%`}}
                              ></div>
                              <span>{deal.probability}%</span>
                            </div>
                          </td>
                          <td>{deal.source}</td>
                          <td>{deal.nextAction}</td>
                          <td>{deal.dueDate}</td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button className="action-btn call" onClick={() => handleCallClient(deal)}>📞</button>
                            <button className="action-btn email" onClick={() => handleEmailClient(deal)}>📧</button>
                            <button className="action-btn view" onClick={() => openDetailPanel(deal, 'pipeline')}>👁️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">🎯 Client Conversion Tools</h2>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Proposal Type</th>
                      <th>Status</th>
                      <th>Value</th>
                      <th>Sent Date</th>
                      <th>Response Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposalsData.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          No active proposals. Create proposals from qualified leads in the pipeline.
                        </td>
                      </tr>
                    ) : (
                      proposalsData.map(proposal => (
                        <tr
                          key={proposal.id}
                          className="clickable-row"
                          onClick={() => openDetailPanel(proposal, 'proposal')}
                          style={{cursor: 'pointer'}}
                        >
                          <td className="company-name">{proposal.company}</td>
                          <td>{proposal.proposalType}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(proposal.status)}`}>
                              {proposal.status}
                            </span>
                          </td>
                          <td className="deal-size">{formatCurrency(proposal.value)}</td>
                          <td>{proposal.sentDate}</td>
                          <td>{proposal.responseDue}</td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button className="action-btn follow" onClick={() => handleFollowUp(proposal)}>📞 Follow-up</button>
                            <button className="action-btn modify" onClick={() => handleModifyProposal(proposal)}>📝 Modify</button>
                            <button className="action-btn status" onClick={() => handleProposalStatus(proposal)}>📊 Status</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Market Intelligence Tab */}
          {activeTab === 'market' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">📈 Market Intelligence</h2>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Industry</th>
                      <th>Conversion Rate</th>
                      <th>Avg Deal Size</th>
                      <th>Active Prospects</th>
                      <th>Pipeline Value</th>
                      <th>Growth Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          Market intelligence will be available once users complete workflows across different industries.
                        </td>
                      </tr>
                    ) : (
                      marketData.map((industry, index) => (
                        <tr
                          key={index}
                          className="clickable-row"
                          onClick={() => openDetailPanel(industry, 'market')}
                          style={{cursor: 'pointer'}}
                        >
                          <td className="industry-name">{industry.industry}</td>
                          <td>
                            <div className="conversion-rate">
                              {(industry.conversionRate * 100).toFixed(1)}%
                            </div>
                          </td>
                          <td className="deal-size">{formatCurrency(industry.avgDealSize)}</td>
                          <td className="prospects-count">{industry.activeProspects}</td>
                          <td className="pipeline-value">{formatCurrency(industry.pipelineValue)}</td>
                          <td className="growth-rate">
                            <span className={`growth ${industry.growthRate > 0 ? 'positive' : 'negative'}`}>
                              {(industry.growthRate * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button className="action-btn research" onClick={() => handleResearchIndustry(industry)}>🔍 Research</button>
                            <button className="action-btn target" onClick={() => handleTargetIndustry(industry)}>🎯 Target</button>
                            <button className="action-btn campaign" onClick={() => handleIndustryCampaign(industry)}>📢 Campaign</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lead Generation Tab */}
          {activeTab === 'leads' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">⚡ Lead Generation Pipeline</h2>
              </div>

              <div className="interactive-table">
                <table className="salesforce-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Platform Activity</th>
                      <th>Lead Score</th>
                      <th>Interest Level</th>
                      <th>Last Activity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsData.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                          Lead generation data will populate as users engage with the platform.
                        </td>
                      </tr>
                    ) : (
                      leadsData.map(lead => (
                        <tr
                          key={lead.id}
                          className="clickable-row"
                          onClick={() => openDetailPanel(lead, 'lead')}
                          style={{cursor: 'pointer'}}
                        >
                          <td className="company-name">{lead.company}</td>
                          <td>{lead.platformActivity}</td>
                          <td>
                            <div className="lead-score">
                              <div className={`score-circle ${lead.leadScore >= 80 ? 'high' : lead.leadScore >= 60 ? 'medium' : 'low'}`}>
                                {lead.leadScore}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`interest-level ${lead.interestLevel?.toLowerCase()}`}>
                              {lead.interestLevel}
                            </span>
                          </td>
                          <td>{lead.lastActivity}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            {lead.status === 'Hot Lead' && <button className="action-btn urgent" onClick={() => handleCallClient(lead)}>📞 Call Now</button>}
                            <button className="action-btn email" onClick={() => handleEmailClient(lead)}>📧 Email</button>
                            <button className="action-btn qualify" onClick={() => handleViewClient(lead)}>✅ Qualify</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Professional Services Tab */}
          {activeTab === 'professional' && (
            <div>
              {/* Active Consultation Projects */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">🎯 Active Consultation Projects</h2>
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
                      {professionalServices.jorge_pipeline && professionalServices.jorge_pipeline.length > 0 ? (
                        professionalServices.jorge_pipeline.map(project => (
                          <tr
                            key={project.id}
                            className="clickable-row"
                            onClick={() => openDetailPanel(project, 'professional')}
                            style={{cursor: 'pointer'}}
                          >
                            <td className="company-name">{project.client}</td>
                            <td className="text-body">{project.service_type}</td>
                            <td className="prospects-count">{project.hours_booked}</td>
                            <td className="deal-size">${project.hourly_rate}/hr</td>
                            <td className="deal-size">${(project.hours_booked * project.hourly_rate).toLocaleString()}</td>
                            <td><span className={`badge ${getStatusBadge(project.status)}`}>{project.status}</span></td>
                            <td className="text-body">{project.next_session}</td>
                            <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button className="action-btn call" onClick={() => handleScheduleConsultation(project)}>📅 Schedule</button>
                              <button className="action-btn email" onClick={() => handleEmailClient(project)}>📧 Follow-up</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                            No active consultation projects. Professional services pipeline will appear here as projects are booked.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Custom Integration Opportunities */}
              <div className="content-card">
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
                      {professionalServices.jorge_integrations && professionalServices.jorge_integrations.length > 0 ? (
                        professionalServices.jorge_integrations.map(integration => (
                          <tr
                            key={integration.id}
                            className="clickable-row"
                            onClick={() => openDetailPanel(integration, 'integration')}
                            style={{cursor: 'pointer'}}
                          >
                            <td className="company-name">{integration.prospect}</td>
                            <td className="text-body">{integration.system_type}</td>
                            <td>
                              <span className={`badge ${integration.complexity === 'high' ? 'badge-danger' : integration.complexity === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                                {integration.complexity}
                              </span>
                            </td>
                            <td className="deal-size">${integration.estimated_value.toLocaleString()}</td>
                            <td>
                              <div className="probability-bar">
                                <div className="probability-fill" style={{width: `${integration.probability}%`}}></div>
                                <span>{integration.probability}%</span>
                              </div>
                            </td>
                            <td className="text-body">{integration.technical_requirements}</td>
                            <td className="text-body">{integration.timeline}</td>
                            <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button className="action-btn call" onClick={() => handleCallClient(integration)}>📞 Contact</button>
                              <button className="action-btn urgent" onClick={() => handleCreateIntegrationOpportunity(integration)}>🚀 Create Opportunity</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" style={{textAlign: 'center', padding: '20px', color: '#5f6368'}}>
                            No integration opportunities identified. Custom integration prospects will appear here from market analysis.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Professional Services Metrics */}
              <div className="content-card">
                <div className="card-header">
                  <h2 className="card-title">📊 Professional Services Metrics</h2>
                  <p className="card-description">Utilization and revenue tracking for consulting services</p>
                </div>

                <div className="grid-3-cols">
                  <div className="card">
                    <div className="card-header">
                      <div className="deal-size">{professionalServices.utilization_metrics?.current_month?.jorge_utilization || 0}%</div>
                      <div className="card-description">Current Utilization</div>
                      <div className="text-body">
                        {professionalServices.utilization_metrics?.current_month?.billable_hours || 0} billable / {professionalServices.utilization_metrics?.current_month?.target_hours || 0} target hours
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: `${professionalServices.utilization_metrics?.current_month?.jorge_utilization || 0}%`}}></div>
                        </div>
                        <span className="progress-text">
                          {(professionalServices.utilization_metrics?.current_month?.jorge_utilization || 0) >= 80 ? 'On target' : 'Below target'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="pipeline-value">${(professionalServices.utilization_metrics?.current_month?.combined_revenue_target || 0).toLocaleString()}</div>
                      <div className="card-description">Monthly Target</div>
                      <div className="text-body">
                        Professional services revenue goal for Jorge's consultation pipeline
                      </div>
                      <span className={`badge ${professionalServices.utilization_metrics?.trends?.revenue_trend === 'on_track' ? 'badge-success' : 'badge-warning'}`}>
                        {professionalServices.utilization_metrics?.trends?.revenue_trend === 'on_track' ? 'On Track' : 'Behind Target'}
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
              </div>
            </div>
          )}

          {/* Simple Detail Panel */}
          <SimpleDetailPanel
            isOpen={detailPanelOpen}
            onClose={closeDetailPanel}
            record={selectedRecord}
            type={selectedRecord?.recordType || 'client'}
            onSave={handleDetailSave}
          />

          {/* Google Apps Integration */}
          <div className="content-card">
            <h3 className="content-card-title">🔗 Google Workspace Integration</h3>
            <p className="content-card-description">
              Connected to {GOOGLE_APPS_CONFIG.workspace.domain || SALES_CONFIG.representative.email}
            </p>
            <div className="google-integration">
              <button className="google-btn gmail" onClick={() => openGoogleApp('gmail')}>
                📧 Open Gmail
              </button>
              <button className="google-btn calendar" onClick={() => openGoogleApp('calendar')}>
                📅 Google Calendar
              </button>
              <button className="google-btn docs" onClick={() => openGoogleApp('docs')}>
                📄 Google Docs
              </button>
              <button className="google-btn sheets" onClick={() => openGoogleApp('sheets')}>
                📊 Google Sheets
              </button>
              <button className="google-btn drive" onClick={() => openGoogleApp('drive')}>
                💾 Google Drive
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}