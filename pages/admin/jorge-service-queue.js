/**
 * Jorge's Focused Service Queue Dashboard
 * ONLY what Jorge needs to complete his Mexico trade service requests
 * No sales pipeline, no analytics bloat - just service delivery
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';

export default function JorgeServiceQueue() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');

  // Essential data only - no bloat
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [rssFeeds, setRssFeeds] = useState([]);
  const [feedsLoading, setFeedsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.push('/login');
      return;
    }
    loadServiceQueue();
  }, [authLoading, user, isAdmin]);

  const loadServiceQueue = async () => {
    try {
      setLoading(true);
      console.log('🇲🇽 Loading Jorge\'s service queue...');

      // Single API call - optimized
      const response = await fetch('/api/admin/service-requests?assigned_to=Jorge');

      if (response.ok) {
        const data = await response.json();
        setServiceRequests(data.requests || []);

        console.log(`Jorge has ${data.requests.length} service requests`);
      }
    } catch (error) {
      console.error('Error loading service queue:', error);
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      setSupplierLoading(true);
      console.log('🏭 Loading suppliers database...');

      const response = await fetch('/api/admin/suppliers');

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
        console.log(`Loaded ${data.suppliers?.length || 0} suppliers`);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    } finally {
      setSupplierLoading(false);
    }
  };

  const loadRssFeeds = async () => {
    try {
      setFeedsLoading(true);
      const response = await fetch('/api/admin/rss-feeds');
      if (response.ok) {
        const data = await response.json();
        setRssFeeds(data.feeds || []);
      }
    } catch (error) {
      console.error('Error loading RSS feeds:', error);
      setRssFeeds([]);
    } finally {
      setFeedsLoading(false);
    }
  };

  // Load suppliers when switching to supplier vetting tab
  useEffect(() => {
    if (activeTab === 'supplier-vetting') {
      loadSuppliers();
    } else if (activeTab === 'supplier-intel') {
      loadRssFeeds();
    }
  }, [activeTab]);

  const getServiceIcon = (serviceType) => {
    switch(serviceType) {
      case 'supplier-vetting': return '🏭';
      case 'market-entry': return '🇲🇽';
      case 'partnership-intelligence': return '📊';
      default: return '📋';
    }
  };

  const getTimelineUrgency = (timeline) => {
    switch(timeline) {
      case 'immediate': return { text: '🔥 ASAP', class: 'badge-danger' };
      case 'short': return { text: '⚡ 1 month', class: 'badge-warning' };
      case 'medium': return { text: '📅 2-3 months', class: 'badge-info' };
      case 'long': return { text: '📆 6+ months', class: 'badge-secondary' };
      default: return { text: '❓ TBD', class: 'badge-secondary' };
    }
  };

  const getNextAction = (serviceType, status) => {
    if (status === 'consultation_scheduled') {
      return '📞 Schedule 15-min call';
    }

    switch(serviceType) {
      case 'supplier-vetting':
        return '📋 Start document collection';
      case 'market-entry':
        return '🔍 Begin market research';
      case 'partnership-intelligence':
        return '📊 Set up briefing schedule';
      default:
        return '📞 Contact client';
    }
  };

  const getRequestSummary = (serviceDetails, serviceType) => {
    const description = serviceDetails?.project_description ||
                       serviceDetails?.product_description ||
                       serviceDetails?.partnership_types ||
                       'No details provided';

    // Truncate to 60 characters for table display
    return description.length > 60 ? description.substring(0, 60) + '...' : description;
  };

  // Report generation function
  const generateServiceReport = async (request) => {
    try {
      const reportData = {
        request_id: request.id,
        service_type: request.service_type,
        company_name: request.company_name,
        contact_name: request.contact_name,
        email: request.email,
        phone: request.phone,
        industry: request.industry,
        status: request.status,
        created_at: request.created_at,
        service_details: request.service_details,
        timeline: request.timeline,
        priority: request.priority
      };

      // Create formatted report based on service type
      let reportContent = '';

      if (request.service_type === 'supplier-vetting') {
        reportContent = `
# Supplier Vetting Report - ${request.company_name}

**Service:** Supplier Vetting ($950)
**Client:** ${request.company_name}
**Contact:** ${request.contact_name} (${request.email})
**Industry:** ${request.industry}
**Request Date:** ${new Date(request.created_at).toLocaleDateString()}
**Status:** ${request.status}

## Project Requirements
${request.service_details?.project_description || 'No specific requirements provided'}

## Next Steps for Jorge:
1. 📋 Collect initial supplier documents
2. 🔍 Conduct legal and financial verification
3. 🏭 Assess production capabilities
4. 📊 Generate comprehensive supplier profile
5. 🤝 Facilitate introduction if approved

## Timeline: ${request.timeline}
## Priority: ${request.priority}
        `;
      } else if (request.service_type === 'market-entry') {
        reportContent = `
# Market Entry Strategy Report - ${request.company_name}

**Service:** Market Entry Strategy ($400/hour, 4hr minimum)
**Client:** ${request.company_name}
**Contact:** ${request.contact_name} (${request.email})
**Industry:** ${request.industry}
**Request Date:** ${new Date(request.created_at).toLocaleDateString()}
**Status:** ${request.status}

## Market Entry Requirements
${request.service_details?.project_description || 'No specific requirements provided'}

## Jorge's Analysis Steps:
1. 📋 Client intake and portfolio review
2. 🇲🇽 Mexico market research and competitive analysis
3. 📊 Regulatory requirements mapping
4. 🛠️ Strategy development and implementation roadmap

## Timeline: ${request.timeline}
## Priority: ${request.priority}
        `;
      } else {
        reportContent = `
# Service Request Report - ${request.company_name}

**Service:** ${request.service_type}
**Client:** ${request.company_name}
**Contact:** ${request.contact_name} (${request.email})
**Industry:** ${request.industry}
**Request Date:** ${new Date(request.created_at).toLocaleDateString()}
**Status:** ${request.status}

## Requirements
${request.service_details?.project_description || 'No specific requirements provided'}

## Timeline: ${request.timeline}
## Priority: ${request.priority}
        `;
      }

      // Create downloadable report
      const blob = new Blob([reportContent], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${request.service_type}-report-${request.company_name.replace(/\s+/g, '-')}-${request.id}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Update request status
      await updateRequestStatus(request.id, 'research_in_progress');
      loadServiceQueue(); // Refresh the data

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <AdminNavigation user={user} />
        <div className="content-card">
          <div className="card-header text-center">
            <div className="text-body">Loading Jorge's service queue...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Jorge's Service Queue - Triangle Intelligence</title>
        <meta name="description" content="Jorge's focused Mexico trade service request queue" />
      </Head>

      <div className="admin-dashboard">
        <AdminNavigation user={user} />

        {/* Header */}
        <div className="admin-header">
          <h1 className="admin-title">🇲🇽 Jorge's Service Queue</h1>
          <p className="admin-subtitle">Mexico Trade Specialist - Service Request Management</p>
        </div>

        {/* Tab Navigation - Service-Specific Tabs */}
        <div className="tab-navigation">
          <button
            className={`admin-btn jorge ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            📋 Service Queue ({serviceRequests.length})
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'supplier-vetting' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplier-vetting')}
          >
            🏭 Supplier Vetting
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'market-entry' ? 'active' : ''}`}
            onClick={() => setActiveTab('market-entry')}
          >
            🇲🇽 Market Entry
          </button>
          <button
            className={`admin-btn jorge ${activeTab === 'supplier-intel' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplier-intel')}
          >
            📊 Supplier Intel
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'queue' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📋 Active Service Requests</h2>
              <p className="card-description">Current requests requiring Jorge's attention</p>
            </div>

            <div className="p-20">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>What</th>
                    <th>Company</th>
                    <th>They Need</th>
                    <th>Timeline</th>
                    <th>Contact</th>
                    <th>Next Step</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-20">
                        <div className="text-muted">No service requests in queue</div>
                        <p className="text-body">New requests from mexico-trade-services will appear here</p>
                      </td>
                    </tr>
                  ) : (
                    serviceRequests.map((request) => {
                      const timeline = getTimelineUrgency(request.timeline);
                      const nextAction = getNextAction(request.service_type, request.status);
                      const requestSummary = getRequestSummary(request.service_details, request.service_type);

                      return (
                        <tr key={request.id}>
                          <td>
                            <div className="admin-actions">
                              <span>{getServiceIcon(request.service_type)}</span>
                              <div>
                                <div className="company-name">
                                  {request.service_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                <div className="text-body">
                                  {request.service_type === 'supplier-vetting' ? 'Due diligence & intro' :
                                   request.service_type === 'market-entry' ? 'Strategy & roadmap' :
                                   request.service_type === 'partnership-intelligence' ? 'Monthly briefings' : 'Service request'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="company-name">{request.company_name}</div>
                              <div className="text-body">{request.industry}</div>
                            </div>
                          </td>
                          <td>
                            <div className="text-body" title={requestSummary}>
                              {requestSummary}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${timeline.class}`}>
                              {timeline.text}
                            </span>
                          </td>
                          <td>
                            <div>
                              <div className="company-name">{request.contact_name}</div>
                              <div className="text-body">
                                <a href={`mailto:${request.email}`} className="text-jorge">
                                  {request.email}
                                </a>
                              </div>
                              {request.phone && (
                                <div className="text-body">
                                  <a href={`tel:${request.phone}`} className="text-jorge">
                                    {request.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-btn primary"
                                onClick={() => {
                                  // Jorge's specific workflow action
                                  if (request.status === 'consultation_scheduled') {
                                    window.open(`https://calendly.com/jorge-trade-specialist`, '_blank');
                                  } else {
                                    generateServiceReport(request);
                                  }
                                }}
                              >
                                {request.status === 'consultation_scheduled' ? '📞 Schedule Call' : '📋 Generate Report'}
                              </button>
                              <button
                                className="btn-small"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowReportModal(true);
                                }}
                                title="View full details"
                              >
                                👁️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'supplier-vetting' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🏭 Supplier Vetting Service ($950)</h2>
              <p className="card-description">Legal verification, site assessment, and facilitated introduction (8-10 suppliers/month capacity)</p>

              <div className="admin-actions">
                <button
                  className="admin-btn primary"
                  onClick={() => loadSuppliers()}
                  disabled={supplierLoading}
                >
                  {supplierLoading ? '🔄 Loading...' : '🔄 Refresh Suppliers'}
                </button>
                <button
                  className="btn-small"
                  onClick={() => {
                    const supplierReport = `# Jorge's Supplier Database Report\n\nTotal Suppliers: ${suppliers.length}\nActive Vetting Projects: ${serviceRequests.filter(r => r.service_type === 'supplier-vetting').length}\n\nDate: ${new Date().toLocaleDateString()}\n\n## Supplier Summary\n${suppliers.map(s => `- ${s.company_name} (${s.industry})`).join('\n')}`;
                    const blob = new Blob([supplierReport], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `supplier-database-report-${new Date().toISOString().split('T')[0]}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  📊 Export Database Report
                </button>
              </div>
            </div>

            <div className="revenue-cards">
              {/* Active Supplier Vetting Projects */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">📋 Active Vetting Projects ({serviceRequests.filter(r => r.service_type === 'supplier-vetting').length})</h3>
                </div>
                <div className="p-20">
                  {serviceRequests.filter(r => r.service_type === 'supplier-vetting').length === 0 ? (
                    <div className="text-muted">No active supplier vetting projects</div>
                  ) : (
                    serviceRequests.filter(r => r.service_type === 'supplier-vetting').map(request => (
                      <div key={request.id} className="card">
                        <div className="admin-actions">
                          <div>
                            <div className="company-name">{request.company_name}</div>
                            <div className="text-body">{request.industry}</div>
                            <div className="text-body">Contact: {request.contact_name}</div>
                          </div>
                          <button
                            className="btn-small"
                            onClick={() => generateServiceReport(request)}
                          >
                            📋 Generate Vetting Report
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Supplier Database */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🏢 Mexico Supplier Database ({suppliers.length})</h3>
                </div>
                <div className="p-20">
                  {supplierLoading ? (
                    <div className="text-muted">Loading suppliers...</div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-muted">No suppliers in database yet</div>
                  ) : (
                    <div className="p-20">
                      {suppliers.slice(0, 5).map((supplier, index) => (
                        <div key={supplier.id || index} className="card">
                          <div className="admin-actions">
                            <div>
                              <div className="company-name">{supplier.company_name || supplier.name || 'Unnamed Supplier'}</div>
                              <div className="text-body">{supplier.industry || 'Industry not specified'}</div>
                              <div className="text-body">{supplier.location || supplier.city || 'Location not specified'}</div>
                              {supplier.verification_status && (
                                <span className={`badge ${supplier.verification_status === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                                  {supplier.verification_status}
                                </span>
                              )}
                            </div>
                            <div className="admin-actions">
                              <button
                                className="btn-small"
                                onClick={() => {
                                  const supplierReport = `# Supplier Profile: ${supplier.company_name || supplier.name}\n\n**Industry:** ${supplier.industry}\n**Location:** ${supplier.location || supplier.city}\n**Status:** ${supplier.verification_status || 'Pending'}\n\n## Contact Information\n${supplier.contact_info || 'Contact details to be collected'}\n\n## Verification Notes\n${supplier.notes || 'No additional notes'}\n\nReport generated: ${new Date().toLocaleDateString()}`;
                                  const blob = new Blob([supplierReport], { type: 'text/markdown' });
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `supplier-${(supplier.company_name || supplier.name || 'supplier').replace(/\s+/g, '-')}-profile.md`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  window.URL.revokeObjectURL(url);
                                }}
                              >
                                📄 Profile
                              </button>
                              <button
                                className="btn-small"
                                onClick={() => {
                                  if (supplier.email) {
                                    window.location.href = `mailto:${supplier.email}?subject=Supplier Verification Follow-up&body=Hello ${supplier.company_name || supplier.name},%0D%0A%0D%0AI hope this email finds you well. I'm following up on our supplier verification process.%0D%0A%0D%0ABest regards,%0D%0AJorge`;
                                  } else {
                                    alert('No email available for this supplier');
                                  }
                                }}
                              >
                                📧 Contact
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {suppliers.length > 5 && (
                        <div className="text-muted text-center">
                          Showing 5 of {suppliers.length} suppliers. Use Export Report for full list.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier Vetting Workflow */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🛠️ Workflow Steps</h3>
                </div>
                <div className="p-20">
                  <div className="p-20">
                    <div className="card">
                      <h4 className="company-name">1. Initial Document Collection</h4>
                      <ul className="text-body">
                        <li>• Business registration documents</li>
                        <li>• Tax certificates and compliance records</li>
                        <li>• Financial statements (last 2 years)</li>
                        <li>• Production capacity documentation</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="company-name">2. Legal & Financial Verification</h4>
                      <ul className="text-body">
                        <li>• Verify business registration status</li>
                        <li>• Check credit rating and payment history</li>
                        <li>• Review legal disputes or violations</li>
                        <li>• Validate banking and financial standing</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="company-name">3. Production Assessment</h4>
                      <ul className="text-body">
                        <li>• Quality certifications (ISO, etc.)</li>
                        <li>• Production capacity and scalability</li>
                        <li>• Supply chain reliability</li>
                        <li>• Equipment and technology assessment</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="company-name">4. Final Report Generation</h4>
                      <ul className="text-body">
                        <li>• Comprehensive supplier profile</li>
                        <li>• Risk assessment and recommendations</li>
                        <li>• Due diligence summary</li>
                        <li>• Introduction facilitation if approved</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market-entry' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">🇲🇽 Market Entry Strategy ($400/hour, 4hr min)</h2>
              <p className="card-description">Industry overview, supplier recommendations, and regulatory roadmap based on local expertise</p>

              <div className="admin-actions">
                <button
                  className="btn-small"
                  onClick={() => {
                    const marketEntryProjects = serviceRequests.filter(r => r.service_type === 'market-entry');
                    const totalHours = marketEntryProjects.length * 4; // Minimum 4 hours per project
                    const revenue = totalHours * 400;
                    const report = `# Jorge's Market Entry Consultation Report\n\nActive Projects: ${marketEntryProjects.length}\nTotal Hours (4hr min each): ${totalHours}\nRevenue: $${revenue.toLocaleString()}\n\nDate: ${new Date().toLocaleDateString()}\n\n## Active Market Entry Projects\n${marketEntryProjects.map(p => `- ${p.company_name} (${p.industry})`).join('\n')}`;
                    const blob = new Blob([report], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `market-entry-consultation-report-${new Date().toISOString().split('T')[0]}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  📊 Generate Consultation Report
                </button>
              </div>
            </div>

            <div className="revenue-cards">
              {/* Active Market Entry Projects */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">📋 Active Projects ({serviceRequests.filter(r => r.service_type === 'market-entry').length})</h3>
                </div>
                <div className="p-20">
                  {serviceRequests.filter(r => r.service_type === 'market-entry').length === 0 ? (
                    <div className="text-muted">No active market entry projects</div>
                  ) : (
                    serviceRequests.filter(r => r.service_type === 'market-entry').map(request => (
                      <div key={request.id} className="card">
                        <div className="admin-actions">
                          <div>
                            <div className="company-name">{request.company_name}</div>
                            <div className="text-body">{request.industry}</div>
                            <div className="text-body">Contact: {request.contact_name}</div>
                          </div>
                          <button
                            className="btn-small"
                            onClick={() => generateServiceReport(request)}
                          >
                            📋 Generate Strategy Report
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Market Entry Workflow */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🛠️ Workflow Steps</h3>
                </div>
                <div className="p-20">
                  <div className="p-20">
                    <div className="card">
                      <h4 className="company-name">1. Client Intake & Analysis</h4>
                      <ul className="text-body">
                        <li>• Product/service portfolio review</li>
                        <li>• Target market identification</li>
                        <li>• Investment budget assessment</li>
                        <li>• Timeline and expectations alignment</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="company-name">2. Mexico Market Research</h4>
                      <ul className="text-body">
                        <li>• Competitive landscape analysis</li>
                        <li>• Regulatory requirements mapping</li>
                        <li>• Distribution channel identification</li>
                        <li>• Cultural and business practice insights</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="company-name">3. Strategy Development</h4>
                      <ul className="text-body">
                        <li>• Market entry strategy options</li>
                        <li>• Partnership and distribution models</li>
                        <li>• Risk mitigation strategies</li>
                        <li>• Compliance and legal structure</li>
                      </ul>
                    </div>
                    <div className="card">
                      <h4 className="company-name">4. Implementation Roadmap</h4>
                      <ul className="text-body">
                        <li>• Phase-by-phase implementation plan</li>
                        <li>• Resource requirements and timeline</li>
                        <li>• Key milestones and success metrics</li>
                        <li>• Ongoing support recommendations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'supplier-intel' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">📊 Mexico Supplier Intelligence ($500/month)</h2>
              <p className="card-description">Monthly supplier landscape updates, regulatory changes, and new supplier discovery through networking</p>

              <div className="admin-actions">
                <button
                  className="admin-btn primary"
                  onClick={() => loadRssFeeds()}
                  disabled={feedsLoading}
                >
                  {feedsLoading ? '🔄 Loading...' : '🔄 Refresh Intelligence'}
                </button>
                <button
                  className="btn-small"
                  onClick={() => {
                    const intelProjects = serviceRequests.filter(r => r.service_type === 'partnership-intelligence' || r.service_type === 'supplier-intel');
                    const monthlyRevenue = intelProjects.length * 500;
                    const report = `# Jorge's Supplier Intelligence Report\n\nActive Intelligence Subscriptions: ${intelProjects.length}\nMonthly Revenue: $${monthlyRevenue.toLocaleString()}\nRSS Sources: ${rssFeeds.length}\n\nDate: ${new Date().toLocaleDateString()}\n\n## Intelligence Sources\n${rssFeeds.map(f => `- ${f.title || f.name}: ${f.description || 'Trade monitoring'}`).join('\n')}\n\n## Active Clients\n${intelProjects.map(p => `- ${p.company_name} (${p.industry})`).join('\n')}`;
                    const blob = new Blob([report], { type: 'text/markdown' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `supplier-intelligence-report-${new Date().toISOString().split('T')[0]}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  📊 Generate Intelligence Report
                </button>
              </div>
            </div>

            <div className="revenue-cards">
              {/* Client Pipeline Overview */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">👥 Active Clients</h3>
                  <span className="badge badge-success">{serviceRequests.filter(r => r.service_type === 'supplier-intelligence').length} active</span>
                </div>
                <div className="p-20">
                  {serviceRequests.filter(r => r.service_type === 'supplier-intelligence').length === 0 ? (
                    <div className="text-muted text-center">
                      <div>No active clients</div>
                      <button className="btn-small">+ Add Client</button>
                    </div>
                  ) : (
                    <div>
                      {serviceRequests.filter(r => r.service_type === 'supplier-intelligence').map(request => (
                        <div key={request.id} className="admin-row">
                          <div className="company-name">{request.company_name}</div>
                          <div className="text-body">{request.industry}</div>
                          <div className="text-success">Next report due: Dec 15</div>
                          <div className="admin-actions">
                            <button className="btn-small">📊 View</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Research Pipeline */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🔍 Supplier Discovery</h3>
                  <span className="badge badge-warning">23 new suppliers</span>
                </div>
                <div className="p-20">
                  <div className="admin-row">
                    <div>
                      <div className="company-name">🔥 AutoTech Suppliers MX</div>
                      <div className="text-body">Monterrey • Automotive Parts</div>
                    </div>
                    <button className="btn-small">Verify</button>
                  </div>
                  <div className="admin-row">
                    <div>
                      <div className="company-name">⚡ ElectroMex Components</div>
                      <div className="text-body">Mexico City • Electronics</div>
                    </div>
                    <button className="btn-small">Profile</button>
                  </div>
                  <div className="admin-row">
                    <div>
                      <div className="company-name">📅 MetalWorks Tijuana</div>
                      <div className="text-body">Tijuana • Metal Fabrication</div>
                    </div>
                    <button className="btn-small">Contact</button>
                  </div>
                  <button className="btn-small">+ Add Supplier</button>
                </div>
              </div>

              {/* This Month's Tasks */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">✅ December Tasks</h3>
                  <span className="badge badge-info">5 of 8 complete</span>
                </div>
                <div className="p-20">
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked disabled />
                      <span className="text-muted">Global Trade Partners report</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked disabled />
                      <span className="text-muted">TechStart Solutions briefing</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" />
                      <span>ABC Manufacturing analysis</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" />
                      <span className="text-danger">🔥 ElectroMex partnership review</span>
                    </label>
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" />
                      <span>Industry trend analysis</span>
                    </label>
                  </div>
                  <button className="btn-small">+ Add Task</button>
                </div>
              </div>
            </div>

            {/* Action Dashboard */}
            <div className="revenue-cards">
              {/* Quick Actions & Tools */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">🚀 Quick Actions</h3>
                </div>
                <div className="p-20">
                  <div className="admin-actions">
                    <button className="btn-small">📝 Start Research</button>
                    <button className="btn-small">📊 Generate Report</button>
                    <button className="btn-small">📞 Schedule Call</button>
                    <button className="btn-small">📋 Create Template</button>
                  </div>

                  <div>
                    <h4 className="card-title">📚 Resource Library</h4>
                    <div>
                      <a href="#" className="text-jorge">🏢 Mexico Company Database</a>
                      <a href="#" className="text-jorge">📈 Market Research Sources</a>
                      <a href="#" className="text-jorge">📧 Email Templates</a>
                      <a href="#" className="text-jorge">📊 Report Templates</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance & Analytics */}
              <div className="card">
                <div className="card-header">
                  <h3 className="content-card-title">📈 Performance Dashboard</h3>
                </div>
                <div className="p-20">
                  <div className="revenue-cards">
                    <div className="revenue-card">
                      <div className="revenue-amount">47</div>
                      <div className="revenue-label">Opportunities Identified</div>
                      <div className="text-success">+12 this month</div>
                    </div>
                    <div className="revenue-card">
                      <div className="revenue-amount">23</div>
                      <div className="revenue-label">High-Priority Matches</div>
                      <div className="text-success">+8 this month</div>
                    </div>
                    <div className="revenue-card">
                      <div className="revenue-amount">94%</div>
                      <div className="revenue-label">On-Time Delivery</div>
                      <div className="text-success">+2% improvement</div>
                    </div>
                    <div className="revenue-card">
                      <div className="revenue-amount">$1,200</div>
                      <div className="revenue-label">Monthly Revenue</div>
                      <div className="text-success">4 active clients</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="card-title">📅 Upcoming Deadlines</h4>
                    <div className="admin-row">
                      <span>Global Trade Partners Report</span>
                      <span className="text-danger">Dec 15 (2 days)</span>
                    </div>
                    <div className="admin-row">
                      <span>TechStart Briefing Call</span>
                      <span className="text-warning">Dec 18 (5 days)</span>
                    </div>
                    <div className="admin-row">
                      <span>Monthly Industry Analysis</span>
                      <span className="text-muted">Dec 31 (18 days)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {showReportModal && selectedRequest && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 className="card-title">📋 Service Request Details</h2>
                <button
                  className="btn-small"
                  onClick={() => setShowReportModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="p-20">
                <div className="revenue-cards">
                  <div className="card">
                    <h3 className="company-name">{selectedRequest.company_name}</h3>
                    <p className="text-body"><strong>Service:</strong> {selectedRequest.service_type}</p>
                    <p className="text-body"><strong>Industry:</strong> {selectedRequest.industry}</p>
                    <p className="text-body"><strong>Contact:</strong> {selectedRequest.contact_name}</p>
                    <p className="text-body"><strong>Email:</strong> <a href={`mailto:${selectedRequest.email}`}>{selectedRequest.email}</a></p>
                    {selectedRequest.phone && (
                      <p className="text-body"><strong>Phone:</strong> <a href={`tel:${selectedRequest.phone}`}>{selectedRequest.phone}</a></p>
                    )}
                    <p className="text-body"><strong>Timeline:</strong> {selectedRequest.timeline}</p>
                    <p className="text-body"><strong>Priority:</strong> {selectedRequest.priority}</p>
                    <p className="text-body"><strong>Status:</strong> {selectedRequest.status}</p>
                  </div>
                  <div className="card">
                    <h4 className="card-title">Project Details</h4>
                    <p className="text-body">
                      {selectedRequest.service_details?.project_description ||
                       selectedRequest.service_details?.product_description ||
                       'No detailed description provided'}
                    </p>
                    {selectedRequest.service_details?.target_regions && (
                      <p className="text-body"><strong>Target Regions:</strong> {selectedRequest.service_details.target_regions}</p>
                    )}
                    {selectedRequest.service_details?.investment_budget && (
                      <p className="text-body"><strong>Budget:</strong> {selectedRequest.service_details.investment_budget}</p>
                    )}
                  </div>
                </div>
                <div className="admin-actions">
                  <button
                    className="admin-btn primary"
                    onClick={() => {
                      generateServiceReport(selectedRequest);
                      setShowReportModal(false);
                    }}
                  >
                    📋 Generate Report
                  </button>
                  <button
                    className="btn-small"
                    onClick={() => setShowReportModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}