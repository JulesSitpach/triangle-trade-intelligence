/**
 * ADMIN DEV MONITORING DASHBOARD
 * Comprehensive view of system health, sales, analytics, and dev issues
 * Accessible only to admin users
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import TriangleLayout from '../components/TriangleLayout';
import SalesTabContent from '../components/admin/SalesTabContent';
import AnalyticsTabContent from '../components/admin/AnalyticsTabContent';

export default function AdminDevMonitor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('issues'); // issues, sales, analytics, system

  // Data states
  const [devIssues, setDevIssues] = useState([]);
  const [salesData, setSalesData] = useState(null); // Full sales dashboard data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  // Sales dashboard states
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [salesFilters, setSalesFilters] = useState({
    stage: 'all',
    country: 'all',
    industry: 'all'
  });

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [componentFilter, setComponentFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('all'); // all, resolved, unresolved - changed default to 'all' to show issues

  // Bulk selection
  const [selectedIssues, setSelectedIssues] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Check admin access
  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.success || !data.user?.isAdmin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
        await loadDashboardData();
      } catch (error) {
        console.error('Failed to check admin access:', error);
        router.push('/dashboard');
      }
    }

    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load dashboard data
  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load dev issues
      const issuesRes = await fetch('/api/admin/dev-issues');
      console.log('Dev issues response status:', issuesRes.status);
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        console.log('Dev issues data:', issuesData);
        console.log('Issues array:', issuesData.data?.issues);
        console.log('Issues array length:', issuesData.data?.issues?.length);
        setDevIssues(issuesData.data?.issues || []);
      } else {
        const errorText = await issuesRes.text();
        console.error('Failed to load dev issues:', issuesRes.status, errorText);
      }

      // Load full sales dashboard data
      const salesRes = await fetch('/api/admin/sales-data');
      if (salesRes.ok) {
        const salesDataResponse = await salesRes.json();
        setSalesData(salesDataResponse.data);
      } else {
        console.error('Failed to load sales data:', salesRes.status);
      }

      // Load analytics
      const analyticsRes = await fetch('/api/admin/analytics-overview');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalyticsData(analyticsData.data?.analytics);
      } else {
        console.error('Failed to load analytics:', analyticsRes.status);
      }

      // Load system health
      const healthRes = await fetch('/api/admin/system-health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData.data?.health);
      } else {
        console.error('Failed to load system health:', healthRes.status);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Mark issue as resolved
  async function markResolved(issueId) {
    try {
      await fetch(`/api/admin/dev-issues/${issueId}/resolve`, {
        method: 'POST'
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to mark issue as resolved:', error);
    }
  }

  // Toggle individual issue selection
  function toggleIssueSelection(issueId) {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
    setSelectAll(newSelected.size === filteredIssues.length);
  }

  // Toggle select all
  function toggleSelectAll() {
    if (selectAll) {
      setSelectedIssues(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredIssues.map(i => i.id));
      setSelectedIssues(allIds);
      setSelectAll(true);
    }
  }

  // Bulk resolve selected issues
  async function bulkResolveSelected() {
    if (selectedIssues.size === 0) return;

    try {
      const resolvePromises = Array.from(selectedIssues).map(issueId =>
        fetch(`/api/admin/dev-issues/${issueId}/resolve`, { method: 'POST' })
      );
      await Promise.all(resolvePromises);
      setSelectedIssues(new Set());
      setSelectAll(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to bulk resolve issues:', error);
    }
  }

  // Clear all resolved issues (delete from database)
  async function clearResolvedIssues() {
    const resolvedCount = devIssues.filter(i => i.resolved).length;

    if (resolvedCount === 0) {
      alert('No resolved issues to clear');
      return;
    }

    const confirmed = confirm(
      `Delete ${resolvedCount} resolved issue${resolvedCount > 1 ? 's' : ''} from the database?\n\n` +
      `This action cannot be undone. The issues will be permanently deleted.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/clear-resolved-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Successfully deleted ${result.deleted_count} resolved issues`);
        await loadDashboardData();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to clear resolved issues:', error);
      alert('❌ Failed to clear resolved issues. Check console for details.');
    }
  }

  // Filter issues
  const filteredIssues = devIssues.filter(issue => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (componentFilter !== 'all' && issue.component !== componentFilter) return false;
    if (resolvedFilter === 'resolved' && !issue.resolved) return false;
    if (resolvedFilter === 'unresolved' && issue.resolved) return false;
    return true;
  });

  // Get unique components for filter
  const uniqueComponents = [...new Set(devIssues.map(issue => issue.component))];

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Dev Monitor | Triangle Intelligence</title>
      </Head>

      <TriangleLayout>
        <div className="main-content">
          <div className="container-app">
            <div className="content-card">
              <h1 className="card-title">🔧 Admin Development Monitor</h1>
              <p className="text-body" style={{ marginBottom: '30px' }}>
                Comprehensive view of system health, sales metrics, user analytics, and development issues
              </p>

              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px',
                borderBottom: '2px solid #E5E7EB',
                paddingBottom: '10px'
              }}>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={activeTab === 'issues' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '8px 20px' }}
                >
                  🐛 Dev Issues ({devIssues.filter(i => !i.resolved).length})
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '8px 20px' }}
                >
                  💰 Sales
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '8px 20px' }}
                >
                  📊 Analytics
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className={activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '8px 20px' }}
                >
                  ⚙️ System Health
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <p>Loading dashboard data...</p>
                </div>
              ) : (
                <>
                  {/* DEV ISSUES TAB */}
                  {activeTab === 'issues' && (
                    <div>
                      {/* Filters */}
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <div>
                          <label className="form-label">Severity</label>
                          <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="form-input"
                            style={{ width: '150px' }}
                          >
                            <option value="all">All</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Component</label>
                          <select
                            value={componentFilter}
                            onChange={(e) => setComponentFilter(e.target.value)}
                            className="form-input"
                            style={{ width: '150px' }}
                          >
                            <option value="all">All</option>
                            {uniqueComponents.map(comp => (
                              <option key={comp} value={comp}>{comp}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Status</label>
                          <select
                            value={resolvedFilter}
                            onChange={(e) => setResolvedFilter(e.target.value)}
                            className="form-input"
                            style={{ width: '150px' }}
                          >
                            <option value="all">All ({devIssues.length})</option>
                            <option value="unresolved">Unresolved ({devIssues.filter(i => !i.resolved).length})</option>
                            <option value="resolved">Resolved ({devIssues.filter(i => i.resolved).length})</option>
                          </select>
                        </div>

                        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
                          {selectedIssues.size > 0 && (
                            <button
                              onClick={bulkResolveSelected}
                              className="btn-primary"
                              style={{ padding: '8px 15px' }}
                            >
                              ✓ Resolve Selected ({selectedIssues.size})
                            </button>
                          )}
                          {devIssues.filter(i => i.resolved).length > 0 && (
                            <button
                              onClick={clearResolvedIssues}
                              className="btn-secondary"
                              style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white' }}
                            >
                              🧹 Clear Resolved ({devIssues.filter(i => i.resolved).length})
                            </button>
                          )}
                          <button onClick={loadDashboardData} className="btn-secondary">
                            🔄 Refresh
                          </button>
                        </div>
                      </div>

                      {/* Bulk Actions */}
                      {filteredIssues.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '15px',
                          alignItems: 'center',
                          padding: '10px',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          marginBottom: '15px'
                        }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={toggleSelectAll}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 'bold' }}>
                              Select All ({filteredIssues.length})
                            </span>
                          </label>
                          {selectedIssues.size > 0 && (
                            <span style={{ color: '#6B7280' }}>
                              {selectedIssues.size} issue{selectedIssues.size !== 1 ? 's' : ''} selected
                            </span>
                          )}
                        </div>
                      )}

                      {/* Issues List */}
                      {filteredIssues.length === 0 ? (
                        <div style={{
                          padding: '40px',
                          textAlign: 'center',
                          backgroundColor: '#F0FDF4',
                          borderRadius: '8px'
                        }}>
                          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#16A34A' }}>
                            ✅ No issues matching filters!
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {filteredIssues.map(issue => (
                            <div
                              key={issue.id}
                              style={{
                                padding: '15px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                backgroundColor: selectedIssues.has(issue.id) ? '#EFF6FF' : (issue.resolved ? '#F9FAFB' : '#FFFFFF'),
                                borderLeft: `4px solid ${
                                  issue.severity === 'critical' ? '#DC2626' :
                                  issue.severity === 'high' ? '#EA580C' :
                                  issue.severity === 'medium' ? '#F59E0B' : '#6B7280'
                                }`
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedIssues.has(issue.id)}
                                    onChange={() => toggleIssueSelection(issue.id)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '5px' }}
                                  />
                                  <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                                    <span style={{
                                      padding: '2px 8px',
                                      backgroundColor: issue.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                                      color: issue.severity === 'critical' ? '#DC2626' : '#B45309',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}>
                                      {issue.severity.toUpperCase()}
                                    </span>
                                    <span style={{
                                      padding: '2px 8px',
                                      backgroundColor: '#E0E7FF',
                                      color: '#4338CA',
                                      borderRadius: '4px',
                                      fontSize: '12px'
                                    }}>
                                      {issue.component}
                                    </span>
                                    <span style={{
                                      padding: '2px 8px',
                                      backgroundColor: '#F3F4F6',
                                      color: '#6B7280',
                                      borderRadius: '4px',
                                      fontSize: '12px'
                                    }}>
                                      {issue.issue_type}
                                    </span>
                                    {issue.occurrence_count > 1 && (
                                      <span style={{
                                        padding: '2px 8px',
                                        backgroundColor: '#FEE2E2',
                                        color: '#DC2626',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                      }}>
                                        ×{issue.occurrence_count}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{issue.message}</p>
                                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '10px' }}>
                                    {new Date(issue.created_at).toLocaleString()}
                                  </p>
                                  {issue.context_data && (
                                    <details style={{ fontSize: '14px', color: '#6B7280' }}>
                                      <summary style={{ cursor: 'pointer' }}>View Context Data</summary>
                                      <pre style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        backgroundColor: '#F3F4F6',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        overflow: 'auto'
                                      }}>
                                        {JSON.stringify(issue.context_data, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                  </div>
                                </div>
                                <div>
                                  {!issue.resolved && (
                                    <button
                                      onClick={() => markResolved(issue.id)}
                                      className="btn-secondary"
                                      style={{ padding: '5px 15px', fontSize: '14px' }}
                                    >
                                      ✓ Mark Resolved
                                    </button>
                                  )}
                                  {issue.resolved && (
                                    <span style={{ color: '#16A34A', fontWeight: 'bold' }}>✅ Resolved</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SALES TAB */}
                  {activeTab === 'sales' && <SalesTabContent />}

                  {/* ANALYTICS TAB */}
                  {activeTab === 'analytics' && <AnalyticsTabContent />}

                  {/* SYSTEM HEALTH TAB */}
                  {activeTab === 'system' && (
                    <div>
                      {systemHealth ? (
                        <div>
                          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
                            Operational health dashboard - actionable metrics for troubleshooting
                          </p>

                          {/* CRITICAL TIER */}
                          <h3 className="content-card-title">Critical Status</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                            <div style={{
                              padding: '20px',
                              backgroundColor: systemHealth.database_healthy ? '#F0FDF4' : '#FEE2E2',
                              border: `2px solid ${systemHealth.database_healthy ? '#BBF7D0' : '#FECACA'}`,
                              borderRadius: '8px'
                            }}>
                              <h3 style={{ fontSize: '14px', marginBottom: '5px', color: '#6B7280' }}>Database</h3>
                              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                {systemHealth.database_healthy ? '✅ Healthy' : '❌ Down'}
                              </p>
                            </div>

                            <div style={{
                              padding: '20px',
                              backgroundColor: systemHealth.ai_healthy ? '#F0FDF4' : '#FEE2E2',
                              border: `2px solid ${systemHealth.ai_healthy ? '#BBF7D0' : '#FECACA'}`,
                              borderRadius: '8px'
                            }}>
                              <h3 style={{ fontSize: '14px', marginBottom: '5px', color: '#6B7280' }}>AI Services</h3>
                              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                {systemHealth.ai_healthy ? '✅ Online' : '❌ Degraded'}
                              </p>
                            </div>

                            <div style={{
                              padding: '20px',
                              backgroundColor: '#EFF6FF',
                              border: '2px solid #BFDBFE',
                              borderRadius: '8px'
                            }}>
                              <h3 style={{ fontSize: '14px', marginBottom: '5px', color: '#6B7280' }}>Avg Response Time</h3>
                              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E40AF' }}>
                                {systemHealth.avg_response_time}ms
                              </p>
                            </div>

                            <div style={{
                              padding: '20px',
                              backgroundColor: systemHealth.error_rate > 5 ? '#FEE2E2' : '#F0FDF4',
                              border: `2px solid ${systemHealth.error_rate > 5 ? '#FECACA' : '#BBF7D0'}`,
                              borderRadius: '8px'
                            }}>
                              <h3 style={{ fontSize: '14px', marginBottom: '5px', color: '#6B7280' }}>Error Rate (24h)</h3>
                              <p style={{ fontSize: '24px', fontWeight: 'bold', color: systemHealth.error_rate > 5 ? '#DC2626' : '#16A34A' }}>
                                {systemHealth.error_rate.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* OPERATIONAL ALERTS */}
                          <h3 className="content-card-title">Operational Alerts</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                            {/* OpenRouter Quota */}
                            <div style={{
                              padding: '15px',
                              backgroundColor: systemHealth.openrouter_quota?.healthy ? 'white' : '#FEF3C7',
                              border: `1px solid ${systemHealth.openrouter_quota?.healthy ? '#E5E7EB' : '#FDE68A'}`,
                              borderRadius: '8px'
                            }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>OpenRouter API Quota</h4>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: systemHealth.openrouter_quota?.healthy ? '#16A34A' : '#D97706' }}>
                                {systemHealth.openrouter_quota?.estimated_percent}% used
                              </p>
                              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                                {systemHealth.openrouter_quota?.estimated_usage} calls / 1000 limit
                              </p>
                              {systemHealth.openrouter_quota?.warning && (
                                <p style={{ fontSize: '12px', color: '#D97706', marginTop: '5px', fontWeight: 'bold' }}>
                                  ⚠️ {systemHealth.openrouter_quota.warning}
                                </p>
                              )}
                            </div>

                            {/* Certificate Generation */}
                            <div style={{
                              padding: '15px',
                              backgroundColor: systemHealth.certificate_generation?.healthy ? 'white' : '#FEE2E2',
                              border: `1px solid ${systemHealth.certificate_generation?.healthy ? '#E5E7EB' : '#FECACA'}`,
                              borderRadius: '8px'
                            }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Certificate Generation</h4>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: systemHealth.certificate_generation?.healthy ? '#16A34A' : '#DC2626' }}>
                                {systemHealth.certificate_generation?.failures_last_hour} failures
                              </p>
                              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                                Last hour
                              </p>
                            </div>

                            {/* Authentication */}
                            <div style={{
                              padding: '15px',
                              backgroundColor: systemHealth.authentication?.healthy ? 'white' : '#FEE2E2',
                              border: `1px solid ${systemHealth.authentication?.healthy ? '#E5E7EB' : '#FECACA'}`,
                              borderRadius: '8px'
                            }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Authentication</h4>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: systemHealth.authentication?.healthy ? '#16A34A' : '#DC2626' }}>
                                {systemHealth.authentication?.failures_last_24h} failures
                              </p>
                              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                                Last 24 hours
                              </p>
                            </div>

                            {/* AI Classifications */}
                            <div style={{
                              padding: '15px',
                              backgroundColor: systemHealth.ai_classifications?.healthy ? 'white' : '#FEF3C7',
                              border: `1px solid ${systemHealth.ai_classifications?.healthy ? '#E5E7EB' : '#FDE68A'}`,
                              borderRadius: '8px'
                            }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>AI Classifications</h4>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: systemHealth.ai_classifications?.healthy ? '#16A34A' : '#D97706' }}>
                                {systemHealth.ai_classifications?.failed_last_24h} failures
                              </p>
                              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                                Last 24 hours
                              </p>
                            </div>

                            {/* Workflow Sessions */}
                            <div style={{
                              padding: '15px',
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Workflow Sessions</h4>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3B82F6' }}>
                                {systemHealth.workflow_sessions?.active_last_hour} active
                              </p>
                              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '5px' }}>
                                {systemHealth.workflow_sessions?.timed_out} timed out
                              </p>
                            </div>

                            {/* Tariff Data Freshness */}
                            <div style={{
                              padding: '15px',
                              backgroundColor: systemHealth.tariff_data_freshness?.stale ? '#FEF3C7' : 'white',
                              border: `1px solid ${systemHealth.tariff_data_freshness?.stale ? '#FDE68A' : '#E5E7EB'}`,
                              borderRadius: '8px'
                            }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Tariff Data Freshness</h4>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: systemHealth.tariff_data_freshness?.stale ? '#D97706' : '#16A34A' }}>
                                {systemHealth.tariff_data_freshness?.age_hours ? `${systemHealth.tariff_data_freshness.age_hours}h old` : 'N/A'}
                              </p>
                              {systemHealth.tariff_data_freshness?.warning && (
                                <p style={{ fontSize: '12px', color: '#D97706', marginTop: '5px', fontWeight: 'bold' }}>
                                  ⚠️ {systemHealth.tariff_data_freshness.warning}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Cache Performance */}
                          <h3 className="content-card-title">Cache Performance (Cost Indicator)</h3>
                          <div style={{
                            padding: '20px',
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            marginBottom: '30px'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                              <div>
                                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Cache Hit Rate</p>
                                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#16A34A' }}>
                                  {systemHealth.cache_performance?.hit_rate}%
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>AI Lookups (24h)</p>
                                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#3B82F6' }}>
                                  {systemHealth.cache_performance?.ai_lookups}
                                </p>
                              </div>
                              <div>
                                <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>Cost Indicator</p>
                                <p style={{
                                  fontSize: '28px',
                                  fontWeight: 'bold',
                                  color: systemHealth.cache_performance?.cost_indicator === 'HIGH' ? '#DC2626' :
                                         systemHealth.cache_performance?.cost_indicator === 'MEDIUM' ? '#F59E0B' : '#16A34A'
                                }}>
                                  {systemHealth.cache_performance?.cost_indicator}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Top Errors */}
                          {systemHealth.top_errors && systemHealth.top_errors.length > 0 && (
                            <>
                              <h3 className="content-card-title">Top Errors (Last 24h)</h3>
                              <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Endpoint</th>
                                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Error</th>
                                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Severity</th>
                                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Count</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {systemHealth.top_errors.map((error, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{error.endpoint}</td>
                                        <td style={{ padding: '12px', maxWidth: '300px' }}>{error.error}</td>
                                        <td style={{ padding: '12px' }}>
                                          <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            backgroundColor: error.severity === 'critical' ? '#FEE2E2' : '#FEF3C7',
                                            color: error.severity === 'critical' ? '#DC2626' : '#D97706'
                                          }}>
                                            {error.severity.toUpperCase()}
                                          </span>
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>×{error.count}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}

                          {/* Slowest Endpoints */}
                          {systemHealth.slowest_endpoints && systemHealth.slowest_endpoints.length > 0 && (
                            <>
                              <h3 className="content-card-title">Slowest Endpoints (Last 24h)</h3>
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>HS Code</th>
                                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Response Time</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {systemHealth.slowest_endpoints.map((endpoint, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                        <td style={{ padding: '12px' }}>{endpoint.type}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{endpoint.hs_code || 'N/A'}</td>
                                        <td style={{ padding: '12px', color: endpoint.response_time_seconds > 10 ? '#DC2626' : '#6B7280' }}>
                                          {endpoint.response_time_seconds}s
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <p>No system health data available</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </TriangleLayout>
    </>
  );
}
