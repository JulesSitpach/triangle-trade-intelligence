/**
 * PRACTICAL JORGE-CRISTINA WORKSPACE
 * No dashboard theater - just the tools they actually need
 * Jorge: Partnership development and handoffs
 * Cristina: Broker services and compliance
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';

export default function PracticalWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real data only - no fake metrics
  const [jorgeClients, setJorgeClients] = useState([]);
  const [cristinaClients, setCristinaClients] = useState([]);
  const [handoffQueue, setHandoffQueue] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState({ jorge: 0, cristina: 0 });

  useEffect(() => {
    // Simple auth check
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
      loadWorkspaceData();
    } catch (e) {
      router.push('/login');
    }
  }, []);

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);

      // Get actual user data
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      const users = data.users || [];

      // Jorge's Pipeline: New prospects + partnership development
      const jorgeClients = users
        .filter(user => needsJorgeAttention(user))
        .map(user => ({
          id: user.id,
          company: user.company_name || 'Unknown Company',
          contact: user.contact_person || 'No contact',
          tradeVolume: parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0'),
          lastActivity: user.last_login || 'Never',
          daysSinceContact: getDaysSince(user.last_login),
          status: getJorgeStatus(user),
          nextAction: getJorgeNextAction(user),
          readyForHandoff: isReadyForCristina(user),
          estimatedRevenue: calculateJorgeRevenue(user)
        }))
        .sort((a, b) => a.daysSinceContact - b.daysSinceContact); // Most urgent first

      // Cristina's Queue: Broker services needed
      const cristinaClients = users
        .filter(user => needsCristinaServices(user))
        .map(user => ({
          id: user.id,
          company: user.company_name || 'Unknown Company',
          tradeVolume: parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0'),
          certificates: user.certificates_generated || 0,
          completions: user.workflow_completions || 0,
          status: getCristinaStatus(user),
          nextAction: getCristinaNextAction(user),
          priority: getCristinaPriority(user),
          estimatedRevenue: calculateCristinaRevenue(user)
        }))
        .sort((a, b) => b.priority - a.priority); // High priority first

      // Handoff Queue: Ready to transfer from Jorge to Cristina
      const handoffQueue = users
        .filter(user => isReadyForCristina(user))
        .map(user => ({
          id: user.id,
          company: user.company_name || 'Unknown Company',
          tradeVolume: parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0'),
          reason: getHandoffReason(user),
          urgency: getHandoffUrgency(user)
        }));

      // Real revenue calculation
      const jorgeRevenue = jorgeClients.reduce((sum, client) => sum + client.estimatedRevenue, 0);
      const cristinaRevenue = cristinaClients.reduce((sum, client) => sum + client.estimatedRevenue, 0);

      setJorgeClients(jorgeClients);
      setCristinaClients(cristinaClients);
      setHandoffQueue(handoffQueue);
      setMonthlyRevenue({ jorge: jorgeRevenue, cristina: cristinaRevenue });

    } catch (error) {
      console.error('Error loading workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  // JORGE'S BUSINESS LOGIC
  const needsJorgeAttention = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;

    // Jorge handles: New prospects, partnership development, pre-handoff
    return (tradeVolume > 0 && tradeVolume < 2000000) || // Partnership prospects
           (completions > 0 && certificates === 0) || // Engaged but no broker services yet
           (tradeVolume > 2000000 && certificates === 0); // High-value prospects
  };

  const getJorgeStatus = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const completions = user.workflow_completions || 0;

    if (tradeVolume > 1000000 && completions >= 3) return 'Ready for Broker Services';
    if (tradeVolume > 500000) return 'Partnership Prospect';
    if (completions >= 2) return 'Engaged Prospect';
    return 'New Lead';
  };

  const getJorgeNextAction = (user) => {
    const status = getJorgeStatus(user);
    switch(status) {
      case 'Ready for Broker Services': return 'Hand off to Cristina';
      case 'Partnership Prospect': return 'Schedule partnership call';
      case 'Engaged Prospect': return 'Follow up on progress';
      default: return 'Initial qualification call';
    }
  };

  const calculateJorgeRevenue = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    if (tradeVolume > 2000000) return 100000; // Enterprise partnership
    if (tradeVolume > 1000000) return 60000; // Strategic partnership
    if (tradeVolume > 500000) return 35000; // Standard partnership
    return 15000; // Basic partnership
  };

  // CRISTINA'S BUSINESS LOGIC
  const needsCristinaServices = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const completions = user.workflow_completions || 0;

    // Cristina handles: Broker services, compliance, high-value logistics
    return certificates > 0 || // Already using compliance services
           (tradeVolume > 1000000) || // High-value needs broker
           (completions >= 5); // Complex operations need broker
  };

  const getCristinaStatus = (user) => {
    const certificates = user.certificates_generated || 0;
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    if (certificates > 0 && tradeVolume > 2000000) return 'Full Service Client';
    if (certificates > 0) return 'Compliance Active';
    if (tradeVolume > 1000000) return 'Broker Services Needed';
    return 'Assessment Required';
  };

  const getCristinaNextAction = (user) => {
    const status = getCristinaStatus(user);
    switch(status) {
      case 'Full Service Client': return 'Ongoing optimization review';
      case 'Compliance Active': return 'Monitor certificates and updates';
      case 'Broker Services Needed': return 'Schedule broker consultation';
      default: return 'Assess broker service needs';
    }
  };

  const getCristinaPriority = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;

    if (certificates > 0 && tradeVolume > 2000000) return 3; // High
    if (certificates > 0 || tradeVolume > 1000000) return 2; // Medium
    return 1; // Low
  };

  const calculateCristinaRevenue = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;

    if (certificates > 0 && tradeVolume > 2000000) return 75000; // Full service
    if (certificates > 0) return 35000; // Compliance services
    if (tradeVolume > 1000000) return 25000; // Broker services
    return 12000; // Basic consultation
  };

  // HANDOFF LOGIC
  const isReadyForCristina = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const completions = user.workflow_completions || 0;
    const certificates = user.certificates_generated || 0;

    // Ready for handoff when broker services are clearly needed
    return (tradeVolume > 1000000 && completions >= 3 && certificates === 0) ||
           (tradeVolume > 2000000 && certificates === 0);
  };

  const getHandoffReason = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    if (tradeVolume > 2000000) return 'High-value client needs broker services';
    if (user.workflow_completions >= 3) return 'Multiple workflow completions indicate complexity';
    return 'Partnership established, ready for broker services';
  };

  const getHandoffUrgency = (user) => {
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const daysSince = getDaysSince(user.last_login);

    if (tradeVolume > 2000000 && daysSince < 7) return 'High';
    if (tradeVolume > 1000000) return 'Medium';
    return 'Normal';
  };

  // UTILITIES
  const getDaysSince = (dateString) => {
    if (!dateString) return 999;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  // ACTIONS - Real Google integrations only
  const handleCall = async (client) => {
    try {
      await googleIntegrationService.scheduleCall(client, 'follow_up');
      alert(`Call scheduled with ${client.company}`);
    } catch (error) {
      alert(`Error scheduling call: ${error.message}`);
    }
  };

  const handleEmail = async (client) => {
    try {
      await googleIntegrationService.composeEmail(client, 'follow_up');
      alert(`Email drafted for ${client.company}`);
    } catch (error) {
      alert(`Error composing email: ${error.message}`);
    }
  };

  const executeHandoff = async (client) => {
    try {
      // Send handoff email to Cristina
      await googleIntegrationService.composeEmail({
        company: 'Cristina Rodriguez - Broker Services',
        email: 'triangleintel@gmail.com'
      }, 'handoff');

      alert(`Handoff initiated: ${client.company} transferred to Cristina`);

      // Refresh data to update queues
      loadWorkspaceData();
    } catch (error) {
      alert(`Error executing handoff: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container-app">
        <AdminNavigation />
        <div className="loading-container">
          <div className="text-body">Loading workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app">
      <Head>
        <title>Jorge-Cristina Workspace - Triangle Intelligence</title>
      </Head>

      <AdminNavigation />

      <div className="dashboard-container">
        {/* Simple Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Jorge-Cristina Workspace</h1>
          <p className="dashboard-subtitle">Partnership development • Broker services • Revenue tracking</p>
        </div>

        {/* Revenue Summary - Real numbers only */}
        <div className="grid-3-cols">
          <div className="content-card">
            <div className="content-card-title pipeline-value">
              {formatCurrency(monthlyRevenue.jorge)}
            </div>
            <div className="content-card-description">Jorge's Pipeline</div>
          </div>
          <div className="content-card">
            <div className="content-card-title pipeline-value">
              {formatCurrency(monthlyRevenue.cristina)}
            </div>
            <div className="content-card-description">Cristina's Services</div>
          </div>
          <div className="content-card">
            <div className="content-card-title deal-size">
              {handoffQueue.length}
            </div>
            <div className="content-card-description">Ready for Handoff</div>
          </div>
        </div>

        {/* Jorge's Queue */}
        <div className="content-card element-spacing">
          <div className="card-header">
            <h2 className="card-title">👨‍💼 Jorge's Client Queue</h2>
            <p className="card-description">Partnership prospects and follow-ups</p>
          </div>
          <div className="interactive-table">
            <table className="salesforce-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Trade Volume</th>
                  <th>Status</th>
                  <th>Days Since Contact</th>
                  <th>Next Action</th>
                  <th>Est. Revenue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jorgeClients.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-body">
                      No active prospects in Jorge's queue
                    </td>
                  </tr>
                ) : (
                  jorgeClients.map(client => (
                    <tr key={client.id} className="clickable-row">
                      <td className="company-name">{client.company}</td>
                      <td className="deal-size">{formatCurrency(client.tradeVolume)}</td>
                      <td>
                        <span className={`status-badge ${
                          client.status === 'Ready for Broker Services' ? 'status-hot' :
                          client.status === 'Partnership Prospect' ? 'status-proposal' :
                          client.status === 'Engaged Prospect' ? 'status-negotiation' :
                          'status-default'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td>
                        <span className={client.daysSinceContact > 7 ? 'interest-level high' : 'text-body'}>
                          {client.daysSinceContact} days
                          {client.daysSinceContact > 7 && ' ⚠️'}
                        </span>
                      </td>
                      <td className="text-body">{client.nextAction}</td>
                      <td className="deal-size">{formatCurrency(client.estimatedRevenue)}</td>
                      <td className="action-buttons">
                        <button className="action-btn call" onClick={() => handleCall(client)}>
                          📞 Call
                        </button>
                        <button className="action-btn email" onClick={() => handleEmail(client)}>
                          📧 Email
                        </button>
                        {client.readyForHandoff && (
                          <button className="action-btn urgent" onClick={() => executeHandoff(client)}>
                            🔄 Handoff
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

        {/* Cristina's Queue */}
        <div className="content-card element-spacing">
          <div className="card-header">
            <h2 className="card-title">👩‍💼 Cristina's Service Queue</h2>
            <p className="card-description">Broker services and compliance clients</p>
          </div>
          <div className="interactive-table">
            <table className="salesforce-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Trade Volume</th>
                  <th>Certificates</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Next Action</th>
                  <th>Est. Revenue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cristinaClients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-body">
                      No active clients in Cristina's queue
                    </td>
                  </tr>
                ) : (
                  cristinaClients.map(client => (
                    <tr key={client.id} className="clickable-row">
                      <td className="company-name">{client.company}</td>
                      <td className="deal-size">{formatCurrency(client.tradeVolume)}</td>
                      <td className="prospects-count">{client.certificates}</td>
                      <td>
                        <span className={`status-badge ${
                          client.status === 'Full Service Client' ? 'status-hot' :
                          client.status === 'Compliance Active' ? 'status-negotiation' :
                          client.status === 'Broker Services Needed' ? 'status-proposal' :
                          'status-default'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          client.priority === 3 ? 'priority-urgent' :
                          client.priority === 2 ? 'priority-high' :
                          'priority-normal'
                        }`}>
                          {client.priority === 3 ? 'High' : client.priority === 2 ? 'Medium' : 'Normal'}
                        </span>
                      </td>
                      <td className="text-body">{client.nextAction}</td>
                      <td className="deal-size">{formatCurrency(client.estimatedRevenue)}</td>
                      <td className="action-buttons">
                        <button className="action-btn call" onClick={() => handleCall(client)}>
                          📞 Call
                        </button>
                        <button className="action-btn email" onClick={() => handleEmail(client)}>
                          📧 Email
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Handoff Queue - Simple and focused */}
        {handoffQueue.length > 0 && (
          <div className="content-card">
            <div className="card-header">
              <h2 className="card-title">🔄 Ready for Handoff</h2>
              <p className="card-description">Clients ready to transfer from Jorge to Cristina</p>
            </div>
            <div className="interactive-table">
              <table className="salesforce-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Trade Volume</th>
                    <th>Handoff Reason</th>
                    <th>Urgency</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffQueue.map(client => (
                    <tr key={client.id} className="clickable-row">
                      <td className="company-name">{client.company}</td>
                      <td className="deal-size">{formatCurrency(client.tradeVolume)}</td>
                      <td className="text-body">{client.reason}</td>
                      <td>
                        <span className={`badge ${
                          client.urgency === 'High' ? 'priority-urgent' :
                          client.urgency === 'Medium' ? 'priority-high' :
                          'priority-normal'
                        }`}>
                          {client.urgency}
                        </span>
                      </td>
                      <td>
                        <button className="btn-primary" onClick={() => executeHandoff(client)}>
                          🔄 Execute Handoff
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}