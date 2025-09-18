/**
 * REVENUE COORDINATION HUB
 * Jorge & Cristina's collaboration dashboard focused on maximizing revenue through coordinated delivery
 * Prevents revenue leakage by ensuring smooth handoffs and complete service delivery
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';

export default function RevenueCoordination() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('handoffs');

  // Revenue coordination data states
  const [activeHandoffs, setActiveHandoffs] = useState([]);
  const [crossSellOpportunities, setCrossSellOpportunities] = useState([]);
  const [jointProjects, setJointProjects] = useState([]);
  const [revenueMetrics, setRevenueMetrics] = useState({});

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
      loadRevenueCoordinationData();
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRevenueCoordinationData = async () => {
    try {
      setLoading(true);

      // Load Jorge's sales data and Cristina's operations in parallel
      const [usersResponse, salesResponse, operationsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/sales-pipeline'),
        fetch('/api/admin/broker-operations')
      ]);

      // Process data to identify revenue coordination opportunities
      const userData = usersResponse.ok ? await usersResponse.json() : { users: [] };
      const salesData = salesResponse.ok ? await salesResponse.json() : { proposals: [] };
      const operationsData = operationsResponse.ok ? await operationsResponse.json() : { operations: [] };

      // Generate revenue handoff tracking
      const handoffs = generateRevenueHandoffs(userData.users, salesData.proposals, operationsData.operations);
      setActiveHandoffs(handoffs);

      // Identify cross-selling opportunities
      const crossSell = identifyCrossSellOpportunities(userData.users, salesData.proposals, operationsData.operations);
      setCrossSellOpportunities(crossSell);

      // Track joint projects
      const jointWork = trackJointProjects(salesData.proposals, operationsData.operations);
      setJointProjects(jointWork);

      // Calculate revenue metrics
      const metrics = calculateRevenueMetrics(handoffs, crossSell, jointWork);
      setRevenueMetrics(metrics);

    } catch (error) {
      console.error('Error loading revenue coordination data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue coordination business logic
  const generateRevenueHandoffs = (users, proposals, operations) => {
    const handoffs = [];

    // Jorge's closed deals that need customs work
    proposals?.forEach(proposal => {
      if (proposal.status === 'Accepted' || proposal.status === 'Closed Won') {
        const needsCustoms = requiresCustomsWork(proposal);
        if (needsCustoms) {
          handoffs.push({
            id: `handoff-${proposal.id}`,
            type: 'Sales to Customs',
            client: proposal.company || proposal.client,
            jorgeWork: proposal.proposalType,
            jorgeValue: proposal.value,
            cristinaWork: needsCustoms.workType,
            estimatedCristinaValue: needsCustoms.estimatedValue,
            totalValue: (proposal.value || 0) + needsCustoms.estimatedValue,
            status: 'Pending Handoff',
            timeline: needsCustoms.timeline,
            priority: calculateHandoffPriority(proposal, needsCustoms),
            handoffDate: proposal.closedDate || new Date().toISOString().split('T')[0]
          });
        }
      }
    });

    // Cristina's clients that could use Jorge's services
    operations?.forEach(operation => {
      const needsPartnerships = requiresPartnershipWork(operation);
      if (needsPartnerships) {
        handoffs.push({
          id: `handoff-${operation.id}`,
          type: 'Customs to Sales',
          client: operation.company,
          cristinaWork: operation.type,
          cristinaValue: operation.value,
          jorgeWork: needsPartnerships.workType,
          estimatedJorgeValue: needsPartnerships.estimatedValue,
          totalValue: (operation.value || 0) + needsPartnerships.estimatedValue,
          status: 'Upsell Opportunity',
          timeline: needsPartnerships.timeline,
          priority: calculateHandoffPriority(operation, needsPartnerships),
          handoffDate: operation.createdDate || new Date().toISOString().split('T')[0]
        });
      }
    });

    return handoffs.sort((a, b) => b.priority - a.priority);
  };

  const requiresCustomsWork = (proposal) => {
    const proposalType = proposal.proposalType?.toLowerCase() || '';
    const client = proposal.company?.toLowerCase() || '';

    // Logic to determine if Jorge's sale needs customs work
    if (proposalType.includes('usmca') || proposalType.includes('certificate')) {
      return {
        workType: 'USMCA Certificate Processing',
        estimatedValue: 2500,
        timeline: '5-7 business days'
      };
    }

    if (proposalType.includes('routing') || proposalType.includes('mexico')) {
      return {
        workType: 'Customs Documentation & Routing',
        estimatedValue: 4000,
        timeline: '10-14 business days'
      };
    }

    if (proposal.value > 50000) {
      return {
        workType: 'Enterprise Customs Compliance',
        estimatedValue: 7500,
        timeline: '2-3 weeks'
      };
    }

    return null;
  };

  const requiresPartnershipWork = (operation) => {
    const operationType = operation.type?.toLowerCase() || '';
    const value = operation.value || 0;

    // Logic to determine if Cristina's client needs partnership services
    if (value > 100000) {
      return {
        workType: 'Supply Chain Partnership Development',
        estimatedValue: 15000,
        timeline: '4-6 weeks'
      };
    }

    if (operationType.includes('export') || operationType.includes('import')) {
      return {
        workType: 'Trade Route Optimization',
        estimatedValue: 5000,
        timeline: '2-3 weeks'
      };
    }

    return null;
  };

  const identifyCrossSellOpportunities = (users, proposals, operations) => {
    // Logic to identify clients who could benefit from both services
    return [];
  };

  const trackJointProjects = (proposals, operations) => {
    // Logic to identify projects requiring both Jorge and Cristina
    return [];
  };

  const calculateRevenueMetrics = (handoffs, crossSell, jointWork) => {
    const totalPotentialRevenue = handoffs.reduce((sum, h) => sum + (h.totalValue || 0), 0);
    const completedHandoffs = handoffs.filter(h => h.status === 'Completed').length;
    const pendingHandoffs = handoffs.filter(h => h.status === 'Pending Handoff').length;

    return {
      totalPotentialRevenue,
      completedHandoffs,
      pendingHandoffs,
      averageHandoffValue: handoffs.length > 0 ? totalPotentialRevenue / handoffs.length : 0,
      revenueAtRisk: handoffs.filter(h => h.priority >= 3).reduce((sum, h) => sum + (h.totalValue || 0), 0)
    };
  };

  const calculateHandoffPriority = (item, additionalWork) => {
    let priority = 1;

    const value = item.value || 0;
    if (value > 100000) priority += 2;
    else if (value > 50000) priority += 1;

    if (additionalWork.estimatedValue > 10000) priority += 1;

    return Math.min(priority, 5);
  };

  // Action handlers
  const handleInitiateHandoff = async (handoff) => {
    try {
      if (handoff.type === 'Sales to Customs') {
        // Jorge is handing off to Cristina
        await googleIntegrationService.composeEmail(
          {
            company: 'Cristina Rodriguez - Customs Broker',
            email: 'triangleintel@gmail.com'
          },
          'handoff'
        );
        alert(`Handoff initiated to Cristina for ${handoff.client}`);
      } else {
        // Cristina is suggesting upsell to Jorge
        await googleIntegrationService.composeEmail(
          {
            company: 'Jorge Ochoa - Sales Development',
            email: 'triangleintel@gmail.com'
          },
          'upsell_opportunity'
        );
        alert(`Upsell opportunity shared with Jorge for ${handoff.client}`);
      }
    } catch (error) {
      alert(`Error initiating handoff: ${error.message}`);
    }
  };

  const handleCompleteHandoff = (handoffId) => {
    setActiveHandoffs(prev =>
      prev.map(h =>
        h.id === handoffId
          ? { ...h, status: 'Completed', completedDate: new Date().toISOString().split('T')[0] }
          : h
      )
    );
    alert('Handoff marked as completed');
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount || 0}`;
  };

  const getPriorityColor = (priority) => {
    if (priority >= 4) return 'priority-urgent';
    if (priority >= 3) return 'priority-high';
    if (priority >= 2) return 'priority-medium';
    return 'priority-normal';
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return 'status-hot';
      case 'In Progress': return 'status-negotiation';
      case 'Pending Handoff': return 'status-proposal';
      case 'Upsell Opportunity': return 'status-default';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="container-app">
        <AdminNavigation />
        <div className="loading-container">
          <div className="text-body">Loading revenue coordination data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app">
      <Head>
        <title>Revenue Coordination Hub - Triangle Intelligence</title>
      </Head>

      <AdminNavigation />

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">🤝 Revenue Coordination Hub</h1>
          <p className="dashboard-subtitle">Jorge & Cristina's collaboration center - maximizing revenue through coordinated delivery</p>
        </div>

        {/* Revenue Metrics Overview */}
        <div className="grid-3-cols">
          <div className="card">
            <div className="card-header">
              <div className="deal-size">{formatCurrency(revenueMetrics.totalPotentialRevenue)}</div>
              <div className="card-description">Total Potential Revenue</div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="pipeline-value">{revenueMetrics.pendingHandoffs}</div>
              <div className="card-description">Pending Handoffs</div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="company-name">{revenueMetrics.completedHandoffs}</div>
              <div className="card-description">Completed This Month</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab('handoffs')}
            className={`tab-button ${activeTab === 'handoffs' ? 'active' : ''}`}
          >
            🔄 Active Handoffs
          </button>
          <button
            onClick={() => setActiveTab('crosssell')}
            className={`tab-button ${activeTab === 'crosssell' ? 'active' : ''}`}
          >
            💰 Cross-Sell Pipeline
          </button>
          <button
            onClick={() => setActiveTab('joint')}
            className={`tab-button ${activeTab === 'joint' ? 'active' : ''}`}
          >
            🤝 Joint Projects
          </button>
        </div>

        {/* Active Handoffs Tab */}
        {activeTab === 'handoffs' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🔄 Revenue Handoff Tracking</h2>
              <p className="card-description">Coordinating handoffs between Jorge's sales and Cristina's delivery</p>
            </div>

            <div className="interactive-table">
              <table className="salesforce-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Handoff Type</th>
                    <th>Jorge's Work</th>
                    <th>Cristina's Work</th>
                    <th>Total Value</th>
                    <th>Timeline</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeHandoffs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-body">
                        No active handoffs. Revenue coordination opportunities will appear as Jorge closes deals requiring customs work and Cristina identifies upsell opportunities.
                      </td>
                    </tr>
                  ) : (
                    activeHandoffs.map(handoff => (
                      <tr key={handoff.id} className={`clickable-row ${getPriorityColor(handoff.priority)}`}>
                        <td>
                          <div className="company-name">{handoff.client}</div>
                        </td>
                        <td>
                          <span className={`badge ${handoff.type === 'Sales to Customs' ? 'badge-info' : 'badge-warning'}`}>
                            {handoff.type}
                          </span>
                        </td>
                        <td>
                          <div className="text-body">{handoff.jorgeWork}</div>
                          <div className="deal-size">{formatCurrency(handoff.jorgeValue)}</div>
                        </td>
                        <td>
                          <div className="text-body">{handoff.cristinaWork}</div>
                          <div className="deal-size">{formatCurrency(handoff.estimatedCristinaValue || handoff.cristinaValue)}</div>
                        </td>
                        <td className="deal-size">{formatCurrency(handoff.totalValue)}</td>
                        <td className="text-body">{handoff.timeline}</td>
                        <td>
                          <span className={`badge priority-${handoff.priority >= 4 ? 'urgent' : handoff.priority >= 3 ? 'high' : 'normal'}`}>
                            Priority {handoff.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadge(handoff.status)}`}>
                            {handoff.status}
                          </span>
                        </td>
                        <td className="action-buttons">
                          {handoff.status === 'Pending Handoff' && (
                            <button
                              className="action-btn email"
                              onClick={() => handleInitiateHandoff(handoff)}
                            >
                              📧 Initiate
                            </button>
                          )}
                          {handoff.status === 'In Progress' && (
                            <button
                              className="action-btn call"
                              onClick={() => handleCompleteHandoff(handoff.id)}
                            >
                              ✅ Complete
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

        {/* Cross-Sell Tab */}
        {activeTab === 'crosssell' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">💰 Cross-Sell Pipeline</h2>
              <p className="card-description">Opportunities to expand service delivery with existing clients</p>
            </div>
            <div className="text-body element-spacing">
              Cross-selling opportunities will appear as the system identifies clients who could benefit from both partnership development and customs services.
            </div>
          </div>
        )}

        {/* Joint Projects Tab */}
        {activeTab === 'joint' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🤝 Joint Projects</h2>
              <p className="card-description">Enterprise deals requiring both Jorge's and Cristina's expertise</p>
            </div>
            <div className="text-body element-spacing">
              Joint projects will be tracked here for complex deals requiring coordinated sales and customs expertise.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}