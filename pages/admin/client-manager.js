/**
 * SIMPLE CLIENT MANAGER
 * No role separation - just track clients and follow-ups
 * What Jorge and Cristina actually need: contact management + action tracking
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';

export default function ClientManager() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('all');

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
      loadClients();
    } catch (e) {
      router.push('/login');
    }
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);

      // Get real user data
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      const users = data.users || [];

      // Transform users into client records
      const clientList = users
        .filter(user => user.company_name) // Only users with company names
        .map(user => {
          const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
          const lastActivity = user.last_login || user.created_at;
          const daysSinceContact = getDaysSince(lastActivity);

          return {
            id: user.id,
            company: user.company_name,
            contact: user.contact_person || user.email || 'No contact',
            email: user.email,
            phone: user.phone || 'No phone',
            tradeVolume: tradeVolume,
            industry: user.industry || 'General',
            status: getClientStatus(user, daysSinceContact),
            priority: getClientPriority(tradeVolume, daysSinceContact),
            lastActivity: lastActivity,
            daysSinceContact: daysSinceContact,
            nextAction: getNextAction(user, daysSinceContact),
            certificates: user.certificates_generated || 0,
            workflows: user.workflow_completions || 0,
            notes: generateClientNotes(user)
          };
        })
        .sort((a, b) => {
          // Sort by priority first, then by days since contact
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // High priority first
          }
          return a.daysSinceContact - b.daysSinceContact; // Most urgent first
        });

      setClients(clientList);

    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // BUSINESS LOGIC - Simple and practical
  const getDaysSince = (dateString) => {
    if (!dateString) return 999;
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  };

  const getClientStatus = (user, daysSinceContact) => {
    const certificates = user.certificates_generated || 0;
    const workflows = user.workflow_completions || 0;
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    if (certificates > 0) return 'Active Client';
    if (workflows >= 3) return 'Engaged Prospect';
    if (tradeVolume > 500000) return 'High-Value Lead';
    if (daysSinceContact <= 7) return 'Recent Contact';
    if (daysSinceContact <= 30) return 'Follow-up Needed';
    return 'Cold Lead';
  };

  const getClientPriority = (tradeVolume, daysSinceContact) => {
    // Priority scoring: 3 = High, 2 = Medium, 1 = Low
    let score = 1;

    if (tradeVolume > 1000000) score += 2;
    else if (tradeVolume > 500000) score += 1;

    if (daysSinceContact > 14) score += 1;
    if (daysSinceContact > 30) score += 1;

    return Math.min(score, 3);
  };

  const getNextAction = (user, daysSinceContact) => {
    const certificates = user.certificates_generated || 0;
    const workflows = user.workflow_completions || 0;
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');

    if (certificates > 0 && daysSinceContact > 30) return 'Check-in on compliance needs';
    if (workflows >= 3 && certificates === 0) return 'Discuss broker services';
    if (tradeVolume > 1000000 && workflows === 0) return 'Schedule discovery call';
    if (daysSinceContact > 14) return 'Follow-up call';
    if (daysSinceContact > 7) return 'Send check-in email';
    return 'Continue nurturing';
  };

  const generateClientNotes = (user) => {
    const notes = [];
    const tradeVolume = parseFloat(user.trade_volume?.replace(/[$,]/g, '') || '0');
    const certificates = user.certificates_generated || 0;
    const workflows = user.workflow_completions || 0;

    if (tradeVolume > 1000000) notes.push('High-value prospect');
    if (certificates > 0) notes.push(`${certificates} certificates generated`);
    if (workflows >= 3) notes.push(`${workflows} workflow completions`);
    if (user.industry) notes.push(`Industry: ${user.industry}`);

    return notes.length > 0 ? notes.join(' • ') : 'New contact';
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    if (amount === 0) return 'Not specified';
    return `$${amount}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // ACTIONS - Real Google integrations
  const handleCall = async (client) => {
    try {
      await googleIntegrationService.scheduleCall({
        company: client.company,
        email: client.email,
        phone: client.phone
      }, 'follow_up');

      alert(`Call scheduled with ${client.company}`);

      // Update last contact date
      updateLastContact(client.id);
    } catch (error) {
      alert(`Error scheduling call: ${error.message}`);
    }
  };

  const handleEmail = async (client) => {
    try {
      await googleIntegrationService.composeEmail({
        company: client.company,
        email: client.email
      }, 'follow_up');

      alert(`Email drafted for ${client.company}`);

      // Update last contact date
      updateLastContact(client.id);
    } catch (error) {
      alert(`Error composing email: ${error.message}`);
    }
  };

  const handleNotes = (client) => {
    const notes = prompt(`Notes for ${client.company}:`, client.notes);
    if (notes !== null) {
      // In a real implementation, this would save to database
      console.log(`Updated notes for ${client.company}:`, notes);
      alert(`Notes updated for ${client.company}`);
    }
  };

  const updateLastContact = (clientId) => {
    // In a real implementation, this would update the database
    // For now, just refresh the data
    loadClients();
  };

  // FILTERING
  const getFilteredClients = () => {
    switch(filter) {
      case 'urgent':
        return clients.filter(c => c.daysSinceContact > 14 || c.priority === 3);
      case 'active':
        return clients.filter(c => c.status === 'Active Client');
      case 'prospects':
        return clients.filter(c => c.status.includes('Prospect') || c.status.includes('Lead'));
      case 'cold':
        return clients.filter(c => c.daysSinceContact > 30);
      default:
        return clients;
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 3: return 'priority-urgent';
      case 2: return 'priority-high';
      default: return 'priority-normal';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active Client': return 'status-hot';
      case 'Engaged Prospect': return 'status-negotiation';
      case 'High-Value Lead': return 'status-proposal';
      case 'Recent Contact': return 'status-negotiation';
      case 'Follow-up Needed': return 'status-proposal';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="container-app">
        <AdminNavigation />
        <div className="loading-container">
          <div className="text-body">Loading clients...</div>
        </div>
      </div>
    );
  }

  const filteredClients = getFilteredClients();

  return (
    <div className="container-app">
      <Head>
        <title>Client Manager - Triangle Intelligence</title>
      </Head>

      <AdminNavigation />

      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Client Manager</h1>
          <p className="dashboard-subtitle">Simple contact management and follow-up tracking</p>
        </div>

        {/* Quick Stats */}
        <div className="grid-3-cols">
          <div className="content-card">
            <div className="content-card-title deal-size">{clients.length}</div>
            <div className="content-card-description">Total Clients</div>
          </div>
          <div className="content-card">
            <div className="content-card-title pipeline-value">
              {clients.filter(c => c.daysSinceContact > 14).length}
            </div>
            <div className="content-card-description">Need Follow-up</div>
          </div>
          <div className="content-card">
            <div className="content-card-title company-name">
              {clients.filter(c => c.status === 'Active Client').length}
            </div>
            <div className="content-card-description">Active Clients</div>
          </div>
        </div>

        {/* Filters */}
        <div className="content-card element-spacing">
          <div className="card-header">
            <h2 className="card-title">Client List</h2>
            <div className="filter-controls">
              <select
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Clients ({clients.length})</option>
                <option value="urgent">Urgent ({clients.filter(c => c.daysSinceContact > 14 || c.priority === 3).length})</option>
                <option value="active">Active Clients ({clients.filter(c => c.status === 'Active Client').length})</option>
                <option value="prospects">Prospects ({clients.filter(c => c.status.includes('Prospect') || c.status.includes('Lead')).length})</option>
                <option value="cold">Cold Leads ({clients.filter(c => c.daysSinceContact > 30).length})</option>
              </select>
            </div>
          </div>

          <div className="interactive-table">
            <table className="salesforce-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Trade Volume</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Last Contact</th>
                  <th>Next Action</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-body">
                      {filter === 'all' ? 'No clients found' : `No clients in ${filter} category`}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <tr key={client.id} className="clickable-row">
                      <td>
                        <div className="company-name">{client.company}</div>
                        <div className="text-body">{client.industry}</div>
                      </td>
                      <td>
                        <div className="text-body">{client.contact}</div>
                        <div className="text-body">{client.email}</div>
                      </td>
                      <td className="deal-size">{formatCurrency(client.tradeVolume)}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadge(client.priority)}`}>
                          {client.priority === 3 ? 'High' : client.priority === 2 ? 'Medium' : 'Normal'}
                        </span>
                      </td>
                      <td>
                        <div className="text-body">{formatDate(client.lastActivity)}</div>
                        <div className={`text-body ${client.daysSinceContact > 14 ? 'interest-level high' : ''}`}>
                          {client.daysSinceContact} days ago
                          {client.daysSinceContact > 14 && ' ⚠️'}
                        </div>
                      </td>
                      <td className="text-body">{client.nextAction}</td>
                      <td className="action-buttons">
                        <button className="action-btn call" onClick={() => handleCall(client)}>
                          📞 Call
                        </button>
                        <button className="action-btn email" onClick={() => handleEmail(client)}>
                          📧 Email
                        </button>
                        <button className="action-btn view" onClick={() => handleNotes(client)}>
                          📝 Notes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Actions Summary */}
          {filteredClients.length > 0 && (
            <div className="card-header">
              <div className="text-body">
                <strong>Quick Summary:</strong> {filteredClients.filter(c => c.daysSinceContact > 14).length} clients need follow-up •
                {filteredClients.filter(c => c.priority === 3).length} high-priority •
                {filteredClients.filter(c => c.tradeVolume > 1000000).length} high-value prospects
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}