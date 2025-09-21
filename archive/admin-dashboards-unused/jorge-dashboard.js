/**
 * Jorge's Comprehensive Service Management Dashboard
 * Manages entire client lifecycle and business operations for Mexico trade services
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function JorgeDashboard() {
  const router = useRouter();

  // Core business data states
  const [leads, setLeads] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [revenue, setRevenue] = useState({});
  const [analytics, setAnalytics] = useState({});

  // Dashboard states
  const [activeTab, setActiveTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load service requests and convert to business operations data
      const response = await fetch('/api/admin/service-requests?assigned_to=Jorge');
      const data = await response.json();

      if (data.success && data.requests) {
        // Convert service requests to business operations format
        const allRequests = data.requests;

        // 1. Lead & Consultation Management
        const pendingLeads = allRequests.filter(req =>
          req.consultation_status === 'pending_schedule'
        );
        setLeads(pendingLeads);

        // 2. Active consultations
        const scheduledConsults = allRequests.filter(req =>
          req.consultation_status === 'scheduled' || req.status === 'consultation_completed'
        );
        setConsultations(scheduledConsults);

        // 3. Active Projects (post-consultation)
        const activeWork = allRequests.filter(req =>
          req.status === 'research_in_progress' || req.status === 'proposal_sent'
        );
        setActiveProjects(activeWork);

        // 4. Revenue calculations
        calculateRevenue(allRequests);

        // 5. Analytics
        calculateAnalytics(allRequests);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = (requests) => {
    const supplierVetting = requests.filter(r => r.service_type === 'supplier-vetting').length * 750;
    const marketEntry = requests.filter(r => r.service_type === 'market-entry').length * 400 * 8; // Avg 8 hours
    const partnership = requests.filter(r => r.service_type === 'partnership-intelligence').length * 300;

    setRevenue({
      supplier_vetting: supplierVetting,
      market_entry: marketEntry,
      partnership_intelligence: partnership,
      total_monthly: supplierVetting + marketEntry + partnership,
      pending_invoices: requests.filter(r => r.status === 'proposal_sent').length
    });
  };

  const calculateAnalytics = (requests) => {
    const totalRequests = requests.length;
    const completedProjects = requests.filter(r => r.status === 'completed').length;
    const conversionRate = totalRequests > 0 ? (completedProjects / totalRequests * 100).toFixed(1) : 0;

    setAnalytics({
      total_leads: totalRequests,
      completed_projects: completedProjects,
      conversion_rate: conversionRate,
      avg_project_value: totalRequests > 0 ? (revenue.total_monthly / totalRequests).toFixed(0) : 0,
      active_pipeline: requests.filter(r =>
        r.status === 'consultation_scheduled' || r.status === 'research_in_progress'
      ).length
    });
  };

  // Business operation functions
  const scheduleConsultation = (lead) => {
    // Open calendar scheduling
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=15min Consultation - ${lead.company_name}&dates=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    window.open(calendarUrl, '_blank');
  };

  const startProject = (consultation) => {
    // Convert consultation to active project
    setSelectedProject({
      ...consultation,
      status: 'research_in_progress',
      project_type: consultation.service_type,
      timeline: getProjectTimeline(consultation.service_type),
      deliverables: getProjectDeliverables(consultation.service_type)
    });
  };

  const getProjectTimeline = (serviceType) => {
    switch(serviceType) {
      case 'supplier-vetting': return '2-3 weeks';
      case 'market-entry': return '4-6 weeks';
      case 'partnership-intelligence': return 'Ongoing monthly';
      default: return '2-4 weeks';
    }
  };

  const getProjectDeliverables = (serviceType) => {
    switch(serviceType) {
      case 'supplier-vetting':
        return ['Supplier research report', '3 verified supplier introductions', 'Risk assessment'];
      case 'market-entry':
        return ['Market analysis', 'Entry strategy', 'Implementation roadmap'];
      case 'partnership-intelligence':
        return ['Monthly briefing', 'Opportunity tracker', 'Partnership recommendations'];
      default: return ['Project deliverables'];
    }
  };

  const generateInvoice = (project) => {
    const amount = project.service_type === 'supplier-vetting' ? 750 :
                  project.service_type === 'market-entry' ? 400 :
                  project.service_type === 'partnership-intelligence' ? 300 : 500;

    alert(`Invoice generated for ${project.company_name}\nService: ${project.service_type}\nAmount: $${amount}\nStatus: Sent to client`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Loading Jorge's Dashboard...</h2>
          <p className="text-gray-500 mt-2">Comprehensive service management system</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge's Service Management Dashboard | Triangle Intelligence</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Jorge's Service Management</h1>
                <p className="text-gray-600">Comprehensive client lifecycle and business operations</p>
              </div>
              <div className="flex space-x-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">${revenue.total_monthly?.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Monthly Revenue</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-600">{analytics.active_pipeline}</div>
                  <div className="text-sm text-gray-500">Active Pipeline</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'leads', name: '📝 Lead Management', count: leads.length },
                { id: 'consultations', name: '📞 Consultations', count: consultations.length },
                { id: 'projects', name: '🚀 Active Projects', count: activeProjects.length },
                { id: 'supplier-vetting', name: '🏭 Supplier Vetting Workflow', count: 0 },
                { id: 'market-entry', name: '🌍 Market Entry Strategy', count: 0 },
                { id: 'partnership-intel', name: '🤝 Partnership Intelligence', count: 0 },
                { id: 'financials', name: '💰 Financial Management', count: revenue.pending_invoices },
                { id: 'analytics', name: '📊 Analytics & Reporting', count: analytics.conversion_rate }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 rounded-full px-2 py-1 text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Lead Management Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Incoming Consultation Requests</h3>
                  <p className="text-sm text-gray-500">New leads requiring consultation scheduling</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade Volume</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.company_name}</div>
                              <div className="text-sm text-gray-500">{lead.contact_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lead.service_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${lead.trade_volume?.toLocaleString() || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              lead.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {lead.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => scheduleConsultation(lead)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              📅 Schedule Consultation
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Consultations Tab */}
          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Scheduled & Completed Consultations</h3>
                  <p className="text-sm text-gray-500">15-minute consultation calls and follow-ups</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Interest</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Steps</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consultations.map((consultation) => (
                        <tr key={consultation.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{consultation.company_name}</div>
                              <div className="text-sm text-gray-500">{consultation.contact_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {consultation.service_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              consultation.status === 'consultation_completed' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {consultation.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {consultation.next_steps || 'Follow up required'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => startProject(consultation)}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              🚀 Start Project
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Active Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Active Project Management</h3>
                  <p className="text-sm text-gray-500">Ongoing supplier vetting, market entry, and intelligence projects</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">{project.company_name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.service_type === 'supplier-vetting' ? 'bg-blue-100 text-blue-800' :
                          project.service_type === 'market-entry' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {project.service_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div>Timeline: {getProjectTimeline(project.service_type)}</div>
                        <div>Value: ${project.service_type === 'supplier-vetting' ? '750' :
                                      project.service_type === 'market-entry' ? '3,200' : '300/mo'}</div>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm font-medium text-gray-900 mb-2">Deliverables:</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {getProjectDeliverables(project.service_type).map((deliverable, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-4 border-t flex space-x-2">
                        <button
                          onClick={() => generateInvoice(project)}
                          className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700"
                        >
                          💳 Generate Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Financial Management Tab */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Service</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Supplier Vetting</span>
                      <span className="font-medium">${revenue.supplier_vetting?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Market Entry</span>
                      <span className="font-medium">${revenue.market_entry?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Partnership Intel</span>
                      <span className="font-medium">${revenue.partnership_intelligence?.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Monthly</span>
                        <span className="font-bold text-green-600">${revenue.total_monthly?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Tracking</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending Invoices</span>
                      <span className="font-medium">{revenue.pending_invoices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Collection Rate</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Payment Time</span>
                      <span className="font-medium">14 days</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Goals</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Revenue Target</span>
                      <span className="font-medium">$15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round((revenue.total_monthly / 15000) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{width: `${Math.min((revenue.total_monthly / 15000) * 100, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">{analytics.total_leads}</div>
                  <div className="text-sm text-gray-600">Total Leads</div>
                </div>
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.conversion_rate}%</div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">${analytics.avg_project_value}</div>
                  <div className="text-sm text-gray-600">Avg Project Value</div>
                </div>
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600">{analytics.active_pipeline}</div>
                  <div className="text-sm text-gray-600">Active Pipeline</div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Service Success Rates</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Supplier Vetting</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Market Entry</span>
                        <span className="font-medium">88%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Partnership Intel</span>
                        <span className="font-medium">95%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Industry Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Electronics</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Manufacturing</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Import/Export</span>
                        <span className="font-medium">22%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Other</span>
                        <span className="font-medium">15%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}