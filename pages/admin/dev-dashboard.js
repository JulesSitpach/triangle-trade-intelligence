/**
 * DEVELOPER DASHBOARD
 * Project health monitoring, development analytics, and system performance
 * For monitoring actual development metrics and platform health
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminNavigation from '../../components/AdminNavigation';

export default function DevDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [devMetrics, setDevMetrics] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('triangle_user_session') || localStorage.getItem('current_user');

    if (stored) {
      try {
        const userData = JSON.parse(stored);
        if (!userData.isAdmin) {
          router.push('/dashboard');
          return;
        }
        setUser(userData);
        loadDevMetrics();
      } catch (e) {
        router.push('/login');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    setLoading(false);
  }, []);

  const loadDevMetrics = async () => {
    try {
      const response = await fetch('/api/admin/dev-analytics');
      const data = await response.json();
      setDevMetrics(data);
    } catch (error) {
      console.error('Error loading dev metrics:', error);
    }
  };

  if (loading) {
    return (
      <>
        <AdminNavigation user={user} />
        <div className="main-content">
          <div className="hero-badge">Loading Developer Dashboard...</div>
        </div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Developer Dashboard - Triangle Intelligence</title>
        <meta name="description" content="Development analytics and project health monitoring" />
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">

          {/* Developer Dashboard Header */}
          <div className="section-header">
            <h1 className="section-header-title">🛠️ Developer Dashboard</h1>
            <p className="section-header-description">
              Project health monitoring, development analytics, and system performance metrics
            </p>
          </div>

          {/* System Health Overview */}
          <div className="content-card">
            <h2 className="content-card-title">🔍 System Health Overview</h2>
            <div className="grid-4-cols">
              <div className="metric-card">
                <div className="metric-value text-success">{devMetrics?.performance?.uptime_formatted || 'Loading...'}</div>
                <div className="metric-label">Uptime</div>
              </div>
              <div className="metric-card">
                <div className="metric-value text-primary">{devMetrics?.performance?.api_response_time || 'Loading...'}</div>
                <div className="metric-label">API Response</div>
              </div>
              <div className="metric-card">
                <div className="metric-value text-info">{devMetrics?.performance?.memory_usage || 'Loading...'}</div>
                <div className="metric-label">Memory Usage</div>
              </div>
              <div className="metric-card">
                <div className="metric-value text-warning">{devMetrics?.database?.connection_pool_used || '0'}/{devMetrics?.database?.connection_pool_total || '20'}</div>
                <div className="metric-label">DB Connections</div>
              </div>
            </div>
          </div>

          {/* Development Analytics */}
          <div className="grid-2-cols">

            {/* Code Metrics */}
            <div className="content-card">
              <h3 className="content-card-title">📊 Code Metrics</h3>
              <div className="metrics-list">
                <div className="metric-row">
                  <span className="metric-label">Total Files</span>
                  <span className="metric-value">{devMetrics?.filesystem?.total_files || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Lines of Code</span>
                  <span className="metric-value">{devMetrics?.filesystem?.lines_of_code || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Components</span>
                  <span className="metric-value">{devMetrics?.filesystem?.components || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">API Endpoints</span>
                  <span className="metric-value">{devMetrics?.filesystem?.api_endpoints || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Pages</span>
                  <span className="metric-value">{devMetrics?.filesystem?.pages || 'Loading...'}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="content-card">
              <h3 className="content-card-title">⚡ Performance Metrics</h3>
              <div className="metrics-list">
                <div className="metric-row">
                  <span className="metric-label">API Response Time</span>
                  <span className="metric-value text-success">{devMetrics?.performance?.api_response_time || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Memory Total</span>
                  <span className="metric-value">{devMetrics?.performance?.memory_total || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Node Version</span>
                  <span className="metric-value">{devMetrics?.performance?.node_version || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Environment</span>
                  <span className="metric-value">{devMetrics?.performance?.environment || 'Loading...'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Project Size</span>
                  <span className="metric-value text-info">{devMetrics?.filesystem?.project_size || 'Loading...'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Health */}
          <div className="content-card">
            <h2 className="content-card-title">🗄️ Database Health</h2>
            <div className="grid-3-cols">
              <div className="content-card">
                <h4 className="content-card-title">Table Statistics</h4>
                <div className="metrics-list">
                  <div className="metric-row">
                    <span className="metric-label">hs_master_rebuild</span>
                    <span className="metric-value text-success">{devMetrics?.database?.table_counts?.hs_master_rebuild || 'Loading...'} records</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">user_profiles</span>
                    <span className="metric-value">{devMetrics?.database?.table_counts?.user_profiles || 'Loading...'} records</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">workflow_completions</span>
                    <span className="metric-value">{devMetrics?.database?.table_counts?.workflow_completions || 'Loading...'} records</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">tariff_rates</span>
                    <span className="metric-value">{devMetrics?.database?.table_counts?.tariff_rates || 'Loading...'} records</span>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h4 className="content-card-title">Query Performance</h4>
                <div className="metrics-list">
                  <div className="metric-row">
                    <span className="metric-label">Avg Query Time</span>
                    <span className="metric-value text-success">{devMetrics?.database?.avg_query_time || 'Loading...'}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Slow Queries</span>
                    <span className="metric-value text-warning">{devMetrics?.database?.slow_queries || 'Loading...'}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Total Tables</span>
                    <span className="metric-value">{devMetrics?.database?.total_tables || 'Loading...'}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Cache Hit Rate</span>
                    <span className="metric-value text-success">{devMetrics?.database?.cache_hit_rate || 'Loading...'}</span>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h4 className="content-card-title">Storage</h4>
                <div className="metrics-list">
                  <div className="metric-row">
                    <span className="metric-label">Database Size</span>
                    <span className="metric-value">{devMetrics?.database?.database_size || 'Loading...'}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Git Repository</span>
                    <span className="metric-value">{devMetrics?.development?.git?.current_branch || 'Loading...'}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Dependencies</span>
                    <span className="metric-value">{devMetrics?.development?.package?.dependencies_count || 'Loading...'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Development Activity */}
          <div className="content-card">
            <h2 className="content-card-title">📈 Recent Development Activity</h2>
            <div className="grid-2-cols">

              <div className="content-card">
                <h4 className="content-card-title">🔧 Recent Changes</h4>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-time">2 hours ago</div>
                    <div className="activity-description">Enterprise admin suite completed</div>
                    <div className="activity-impact text-success">+26 files, +5,973 lines</div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-time">4 hours ago</div>
                    <div className="activity-description">Navigation consistency fixes</div>
                    <div className="activity-impact text-info">13 files updated</div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-time">1 day ago</div>
                    <div className="activity-description">Dynamic trade risk alerts system</div>
                    <div className="activity-impact text-success">+15 files</div>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <h4 className="content-card-title">🚨 Issues & Monitoring</h4>
                <div className="issues-list">
                  <div className="issue-item priority-low">
                    <div className="issue-title">CSS protection violations in archived files</div>
                    <div className="issue-description">Archive files contain style violations - not affecting production</div>
                  </div>
                  <div className="issue-item priority-medium">
                    <div className="issue-title">Empty database tables in development</div>
                    <div className="issue-description">user_profiles and workflow_completions using sample data</div>
                  </div>
                  <div className="issue-item priority-high">
                    <div className="issue-title">Missing /404 custom page</div>
                    <div className="issue-description">Auto-optimization disabled due to custom /_error page</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Development Tools */}
          <div className="content-card">
            <h2 className="content-card-title">🛠️ Development Tools</h2>
            <div className="grid-4-cols">
              <button className="hero-secondary-button" onClick={() => window.open('/system-status', '_blank')}>
                📊 System Status
              </button>
              <button className="hero-secondary-button" onClick={loadDevMetrics}>
                🔄 Refresh Metrics
              </button>
              <button className="hero-secondary-button" onClick={() => window.open('/__tests__', '_blank')}>
                🧪 Run Tests
              </button>
              <button className="hero-secondary-button" onClick={() => console.log('Dev tools opened')}>
                🔍 Performance Profiler
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}