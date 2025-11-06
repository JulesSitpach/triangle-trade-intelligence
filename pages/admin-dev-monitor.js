/**
 * ADMIN DEV MONITORING DASHBOARD
 * Comprehensive view of system health, sales, analytics, and dev issues
 * Accessible only to admin users
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import TriangleLayout from '../components/TriangleLayout';

export default function AdminDevMonitor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('issues'); // issues, sales, analytics, system

  // Data states
  const [devIssues, setDevIssues] = useState([]);
  const [salesMetrics, setSalesMetrics] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [componentFilter, setComponentFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('all'); // all, resolved, unresolved - changed default to 'all' to show issues

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

      // Load sales metrics
      const salesRes = await fetch('/api/admin/sales-metrics');
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSalesMetrics(salesData.data?.metrics);
      } else {
        console.error('Failed to load sales metrics:', salesRes.status);
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

                        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                          <button onClick={loadDashboardData} className="btn-secondary">
                            🔄 Refresh
                          </button>
                        </div>
                      </div>

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
                                backgroundColor: issue.resolved ? '#F9FAFB' : '#FFFFFF',
                                borderLeft: `4px solid ${
                                  issue.severity === 'critical' ? '#DC2626' :
                                  issue.severity === 'high' ? '#EA580C' :
                                  issue.severity === 'medium' ? '#F59E0B' : '#6B7280'
                                }`
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
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
                  {activeTab === 'sales' && (
                    <div>
                      {salesMetrics ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                          <div style={{
                            padding: '20px',
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: '8px'
                          }}>
                            <h3 style={{ fontSize: '16px', color: '#16A34A', marginBottom: '10px' }}>💰 Total Revenue</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803D' }}>
                              ${(salesMetrics.total_revenue / 100).toFixed(2)}
                            </p>
                          </div>

                          <div style={{
                            padding: '20px',
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '8px'
                          }}>
                            <h3 style={{ fontSize: '16px', color: '#2563EB', marginBottom: '10px' }}>👥 Active Subscriptions</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E40AF' }}>
                              {salesMetrics.active_subscriptions}
                            </p>
                          </div>

                          <div style={{
                            padding: '20px',
                            backgroundColor: '#FEF3C7',
                            border: '1px solid #FDE68A',
                            borderRadius: '8px'
                          }}>
                            <h3 style={{ fontSize: '16px', color: '#D97706', marginBottom: '10px' }}>📈 MRR</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#B45309' }}>
                              ${(salesMetrics.mrr / 100).toFixed(2)}
                            </p>
                          </div>

                          <div style={{
                            padding: '20px',
                            backgroundColor: '#F5F3FF',
                            border: '1px solid #DDD6FE',
                            borderRadius: '8px'
                          }}>
                            <h3 style={{ fontSize: '16px', color: '#7C3AED', marginBottom: '10px' }}>📊 Conversion Rate</h3>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6D28D9' }}>
                              {(salesMetrics.conversion_rate * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p>No sales data available</p>
                      )}
                    </div>
                  )}

                  {/* ANALYTICS TAB */}
                  {activeTab === 'analytics' && (
                    <div>
                      {analyticsData ? (
                        <div>
                          <h3 className="content-card-title">User Activity (Last 30 Days)</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                            <div style={{ padding: '15px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                              <p style={{ fontSize: '14px', color: '#6B7280' }}>Total Analyses</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{analyticsData.total_analyses}</p>
                            </div>
                            <div style={{ padding: '15px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                              <p style={{ fontSize: '14px', color: '#6B7280' }}>Active Users</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{analyticsData.active_users}</p>
                            </div>
                            <div style={{ padding: '15px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                              <p style={{ fontSize: '14px', color: '#6B7280' }}>Avg. Analysis Time</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{analyticsData.avg_completion_time}min</p>
                            </div>
                          </div>

                          <h3 className="content-card-title">Tier Distribution</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                            {Object.entries(analyticsData.tier_distribution || {}).map(([tier, count]) => (
                              <div key={tier} style={{
                                padding: '12px',
                                backgroundColor: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                textAlign: 'center'
                              }}>
                                <p style={{ fontWeight: 'bold', fontSize: '20px' }}>{count}</p>
                                <p style={{ fontSize: '14px', color: '#6B7280' }}>{tier}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p>No analytics data available</p>
                      )}
                    </div>
                  )}

                  {/* SYSTEM HEALTH TAB */}
                  {activeTab === 'system' && (
                    <div>
                      {systemHealth ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                            <div style={{
                              padding: '20px',
                              backgroundColor: systemHealth.database_healthy ? '#F0FDF4' : '#FEE2E2',
                              border: `1px solid ${systemHealth.database_healthy ? '#BBF7D0' : '#FECACA'}`,
                              borderRadius: '8px'
                            }}>
                              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
                                {systemHealth.database_healthy ? '✅' : '❌'} Database
                              </h3>
                              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                {systemHealth.database_healthy ? 'Healthy' : 'Issues Detected'}
                              </p>
                            </div>

                            <div style={{
                              padding: '20px',
                              backgroundColor: systemHealth.ai_healthy ? '#F0FDF4' : '#FEE2E2',
                              border: `1px solid ${systemHealth.ai_healthy ? '#BBF7D0' : '#FECACA'}`,
                              borderRadius: '8px'
                            }}>
                              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
                                {systemHealth.ai_healthy ? '✅' : '❌'} AI Services
                              </h3>
                              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                {systemHealth.ai_healthy ? 'Online' : 'Degraded'}
                              </p>
                            </div>

                            <div style={{
                              padding: '20px',
                              backgroundColor: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: '8px'
                            }}>
                              <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>⚡ Avg Response Time</h3>
                              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                {systemHealth.avg_response_time}ms
                              </p>
                            </div>
                          </div>

                          <h3 className="content-card-title">Recent Error Rate</h3>
                          <div style={{
                            padding: '20px',
                            backgroundColor: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px'
                          }}>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: systemHealth.error_rate > 5 ? '#DC2626' : '#16A34A' }}>
                              {systemHealth.error_rate.toFixed(2)}%
                            </p>
                            <p style={{ fontSize: '14px', color: '#6B7280' }}>
                              {systemHealth.error_rate > 5 ? 'Above normal threshold' : 'Within acceptable range'}
                            </p>
                          </div>
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
