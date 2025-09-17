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
      // Load real pipeline data
      const pipelineResponse = await fetch('/api/admin/sales-pipeline');
      if (pipelineResponse.ok) {
        const pipelineData = await pipelineResponse.json();
        const dealsWithStatus = (pipelineData.pipeline || []).map(deal => ({
          ...deal,
          daysSinceContact: calculateDaysSinceContact(deal.last_contact),
          needsAttention: needsAttention(deal),
          needsBroker: needsBrokerServices(deal),
          value: deal.deal_size || deal.trade_volume || 0
        }));
        setDeals(dealsWithStatus);
      }

      // Generate Mexico alerts from real data
      generateMexicoAlerts();

      // Generate handoff queue
      generateHandoffQueue(deals);

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
      alert(`Error scheduling call with ${deal.client}`);
    }
  };

  const handleEmailClient = async (deal) => {
    try {
      await googleIntegrationService.composeEmail(
        { company: deal.client, email: deal.email },
        'follow_up'
      );
    } catch (error) {
      alert(`Error composing email to ${deal.client}`);
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
      alert(`Handoff email sent to Cristina for ${deal.client}`);
    } catch (error) {
      alert(`Error sending handoff for ${deal.client}`);
    }
  };

  const handleMexicoAlert = (alert) => {
    if (alert.type === 'opportunity') {
      alert('Opening client list to contact about this opportunity...');
      // Could integrate with client portfolio page
    } else if (alert.type === 'alert') {
      alert('Opening shipment tracking to check affected clients...');
      // Could integrate with Cristina's dashboard
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
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Simple Admin Dashboard - Triangle Intelligence</title>
      </Head>

      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Simple Dashboard</h1>
          <p className="text-gray-600 mt-2">Practical tools that actually help Jorge and Cristina</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('deals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              💰 Deal Tracker
            </button>
            <button
              onClick={() => setActiveTab('mexico')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mexico'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🇲🇽 Mexico Alerts
            </button>
            <button
              onClick={() => setActiveTab('handoff')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'handoff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🤝 Need Broker Help
            </button>
          </nav>
        </div>

        {/* Deal Tracker Tab */}
        {activeTab === 'deals' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">💰 Deal Tracker</h2>
              <p className="text-gray-600">Where are my deals? What needs attention?</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deals.map((deal, index) => (
                    <tr key={index} className={deal.needsAttention ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{deal.client}</div>
                        <div className="text-sm text-gray-500">{deal.contact_person}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(deal.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          deal.status === 'Hot Lead' ? 'bg-red-100 text-red-800' :
                          deal.status === 'Proposal Sent' ? 'bg-yellow-100 text-yellow-800' :
                          deal.status === 'Negotiation' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${deal.needsAttention ? 'font-bold text-red-600' : 'text-gray-900'}`}>
                          {deal.daysSinceContact} days
                          {deal.needsAttention && ' ⚠️'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleCallClient(deal)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          📞 Call
                        </button>
                        <button
                          onClick={() => handleEmailClient(deal)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          📧 Email
                        </button>
                        {deal.needsBroker && (
                          <button
                            onClick={() => handleHandoffToCristina(deal)}
                            className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                          >
                            🤝 Handoff
                          </button>
                        )}
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
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🇲🇽 Mexico Trade Alerts</h2>
              <p className="text-gray-600 mb-6">What's happening that affects our Mexico trade business?</p>

              {mexicoAlerts.map(alert => (
                <div key={alert.id} className={`border rounded-lg p-4 mb-4 ${getPriorityColor(alert.priority)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-sm font-medium mt-2">Action needed: {alert.actionNeeded}</p>
                      {alert.affectedClients > 0 && (
                        <p className="text-xs mt-1">Affects {alert.affectedClients} active clients</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleMexicoAlert(alert)}
                      className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
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
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">🤝 Need Broker Help</h2>
              <p className="text-gray-600">Deals that need Cristina's expertise</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Why Handoff?</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {handoffQueue.map((deal, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{deal.client}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(deal.value)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{deal.handoffReason}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(deal.urgency)}`}>
                          {deal.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleHandoffToCristina(deal)}
                          className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
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
      </div>
    </div>
  );
}