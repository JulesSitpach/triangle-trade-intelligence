/**
 * Developer Operations Dashboard - Production-Quality Implementation
 * Complete UI + API + Database integration following Triangle Intelligence standards
 * Salesforce-style tables, functional Google Apps integration, real system monitoring
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminNavigation from '../../components/AdminNavigation';
import Head from 'next/head';
import googleIntegrationService from '../../lib/services/google-integration-service';
import SimpleDetailPanel from '../../components/admin/SimpleDetailPanel';

export default function DeveloperDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('system-health');
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState([]);

  // Detail panel state - Following established pattern
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Database-driven data states - Real system monitoring
  const [systemHealth, setSystemHealth] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [errorTracking, setErrorTracking] = useState([]);
  const [devMetrics, setDevMetrics] = useState({});
  const [systemConfig, setSystemConfig] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});

  // Filtering states
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

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
      loadDeveloperDashboardData();
    } catch (e) {
      router.push('/login');
    }
  }, []);

  const loadDeveloperDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🛠️ Loading Developer Operations Dashboard with real system monitoring...');

      // Load data from multiple system monitoring APIs in parallel
      const [devResponse, performanceResponse, errorResponse, configResponse, analyticsResponse] = await Promise.all([
        fetch('/api/admin/dev-analytics'),
        fetch('/api/admin/performance-analytics'),
        fetch('/api/admin/error-tracking'),
        fetch('/api/admin/system-config'),
        fetch('/api/admin/system-analytics')
      ]);

      // Process Developer Analytics Data
      if (devResponse.ok) {
        const data = await devResponse.json();
        setDevMetrics(data);

        // Create system health monitoring from real metrics ONLY
        const healthItems = [];

        // Map real API data to system health items
        if (data.database && data.database.table_counts) {
          healthItems.push({
            id: 'database',
            service: 'PostgreSQL Database',
            status: data.database.error ? 'error' : 'operational',
            uptime: calculateDatabaseUptime(data.database),
            responseTime: data.database.avg_query_time || 'Unknown',
            lastCheck: data.timestamp || new Date().toISOString(),
            severity: determineHealthSeverity(data.database),
            details: data.database
          });
        }

        if (data.performance && data.performance.api_response_time) {
          healthItems.push({
            id: 'api',
            service: 'Next.js API Routes',
            status: 'operational',
            uptime: data.performance.uptime_formatted || 'Unknown',
            responseTime: data.performance.api_response_time,
            lastCheck: data.timestamp || new Date().toISOString(),
            severity: determineHealthSeverity(data.performance),
            details: data.performance
          });
        }

        // Add system information from real data
        if (data.performance && data.performance.environment) {
          healthItems.push({
            id: 'system',
            service: 'System Resources',
            status: 'operational',
            uptime: data.performance.uptime_formatted || 'Unknown',
            responseTime: data.performance.memory_usage || 'Unknown',
            lastCheck: data.timestamp || new Date().toISOString(),
            severity: 'low',
            details: data.performance
          });
        }
        setSystemHealth(healthItems);

        // Create performance metrics from real data ONLY
        const perfMetrics = [];

        // Add API response time metrics from real data
        if (data.performance && data.performance.api_response_time) {
          const responseTimeMs = parseInt(data.performance.api_response_time);
          perfMetrics.push({
            id: 'api-response',
            metric: 'API Response Time',
            current: data.performance.api_response_time,
            target: '<400ms',
            trend: responseTimeMs < 400 ? 'good' : 'warning',
            severity: responseTimeMs < 400 ? 'low' : 'medium',
            lastMeasured: data.timestamp || new Date().toISOString()
          });
        }

        // Add memory usage metrics from real data
        if (data.performance && data.performance.memory_usage) {
          const memoryMB = parseInt(data.performance.memory_usage);
          perfMetrics.push({
            id: 'memory-usage',
            metric: 'Memory Usage',
            current: data.performance.memory_usage,
            target: '<512MB',
            trend: memoryMB < 512 ? 'good' : 'warning',
            severity: memoryMB < 512 ? 'low' : 'medium',
            lastMeasured: data.timestamp || new Date().toISOString()
          });
        }

        // Add database connection metrics from real data
        if (data.database && data.database.connection_pool_used !== undefined) {
          const poolUsed = data.database.connection_pool_used;
          const poolTotal = data.database.connection_pool_total;
          perfMetrics.push({
            id: 'db-connections',
            metric: 'Database Connections',
            current: `${poolUsed}/${poolTotal}`,
            target: `<${Math.floor(poolTotal * 0.75)}/${poolTotal}`,
            trend: (poolUsed / poolTotal) < 0.75 ? 'good' : 'warning',
            severity: (poolUsed / poolTotal) < 0.75 ? 'low' : 'medium',
            lastMeasured: data.timestamp || new Date().toISOString()
          });
        }

        // Add file system metrics if available
        if (data.filesystem && data.filesystem.total_files) {
          perfMetrics.push({
            id: 'codebase-size',
            metric: 'Codebase Size',
            current: `${data.filesystem.total_files} files`,
            target: 'Monitoring',
            trend: 'stable',
            severity: 'low',
            lastMeasured: data.timestamp || new Date().toISOString()
          });
        }
        setPerformanceMetrics(perfMetrics);
      }

      // Process Error Tracking Data
      if (errorResponse.ok) {
        const errorData = await errorResponse.json();

        // Map error tracking data to table format
        const errorItems = (errorData.recent_errors || []).map(error => ({
          id: error.id,
          type: error.type,
          severity: error.severity,
          message: error.message,
          timestamp: error.timestamp,
          resolved: error.resolved,
          details: error.details,
          // For detail panel compatibility
          service: error.type,
          companyName: error.type,
          status: error.resolved ? 'resolved' : 'active',
          lastOccurrence: error.timestamp
        }));

        setErrorTracking(errorItems);
      } else {
        // If error tracking API fails, set empty array (no hardcoded data)
        setErrorTracking([]);
      }

      // Process System Configuration Data
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setSystemConfig(configData);
        console.log('📋 Loaded system configuration data');
      } else {
        setSystemConfig({});
      }

      // Process System Analytics Data
      if (analyticsResponse.ok) {
        const analyticsResponseData = await analyticsResponse.json();
        setAnalyticsData(analyticsResponseData);
        console.log('📊 Loaded system analytics data');
      } else {
        setAnalyticsData({});
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load developer dashboard:', error);
      setLoading(false);
    }
  };

  // Helper functions for data processing
  const determineHealthSeverity = (metrics) => {
    if (!metrics) return 'medium';
    if (metrics.error) return 'high';
    const responseTime = parseFloat(metrics.api_response_time || metrics.avg_query_time || '0');
    if (responseTime > 1000) return 'high';
    if (responseTime > 500) return 'medium';
    return 'low';
  };

  const calculateDatabaseUptime = (dbMetrics) => {
    if (!dbMetrics) return 'Unknown';
    if (dbMetrics.error) return 'Error';

    // Calculate uptime based on successful table queries
    const tableCount = Object.keys(dbMetrics.table_counts || {}).length;
    const successfulQueries = Object.values(dbMetrics.table_counts || {}).filter(count => count > 0).length;

    if (tableCount === 0) return 'Unknown';
    const uptimePercentage = (successfulQueries / tableCount) * 100;
    return `${uptimePercentage.toFixed(1)}%`;
  };

  // Row selection handlers - Jorge's pattern
  const handleRowSelect = (recordId) => {
    setSelectedRows(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleSelectAll = (records) => {
    const allIds = records.map(r => r.id);
    setSelectedRows(selectedRows.length === allIds.length ? [] : allIds);
  };

  // Detail panel handlers
  const openDetailPanel = (record) => {
    // Transform developer record to match SimpleDetailPanel format
    const transformedRecord = {
      id: record.id,
      company: record.service || record.metric || record.type || 'System Component',
      companyName: record.service || record.metric || record.type || 'System Component',
      email: `system-alerts@triangleintelligence.com`,
      industry: determineRecordCategory(record),
      recordType: 'developer-operations',
      status: record.status || record.severity || 'Unknown',
      priority: record.severity || 'medium',
      source: 'System Monitoring',
      nextAction: generateNextAction(record),
      lastActivity: record.lastCheck || record.lastMeasured || record.lastOccurrence || new Date().toISOString(),
      notes: generateSystemNotes(record),
      rawData: record // Keep original data for reference
    };

    setSelectedRecord(transformedRecord);
    setDetailPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setDetailPanelOpen(false);
    setSelectedRecord(null);
  };

  // Helper functions for detail panel data transformation
  const determineRecordCategory = (record) => {
    if (record.service) {
      // System Health records
      if (record.service.includes('Database')) return 'Database Operations';
      if (record.service.includes('API')) return 'API Infrastructure';
      if (record.service.includes('Supabase')) return 'Cloud Services';
      if (record.service.includes('Frontend')) return 'Frontend Systems';
      return 'System Infrastructure';
    } else if (record.metric) {
      // Performance Metrics records
      if (record.metric.includes('Load Time')) return 'Frontend Performance';
      if (record.metric.includes('API Response')) return 'API Performance';
      if (record.metric.includes('Memory')) return 'System Resources';
      if (record.metric.includes('Database')) return 'Database Performance';
      return 'Performance Monitoring';
    } else if (record.type) {
      // Error Tracking records
      if (record.type.includes('Database')) return 'Database Errors';
      if (record.type.includes('API')) return 'API Errors';
      if (record.type.includes('Frontend')) return 'Frontend Errors';
      return 'System Errors';
    }
    return 'System Monitoring';
  };

  const generateNextAction = (record) => {
    if (record.service) {
      // System Health actions
      if (record.status === 'degraded') return 'Run system diagnostics';
      if (record.status === 'down') return 'Immediate investigation required';
      if (record.severity === 'high') return 'Review system performance';
      return 'Monitor system status';
    } else if (record.metric) {
      // Performance Metrics actions
      if (record.trend === 'declining') return 'Investigate performance degradation';
      if (record.severity === 'high') return 'Optimize system performance';
      return 'Continue performance monitoring';
    } else if (record.type) {
      // Error Tracking actions
      if (record.severity === 'high') return 'Immediate error investigation';
      if (record.count > 10) return 'Review error patterns';
      return 'Monitor error trends';
    }
    return 'Review system status';
  };

  const generateSystemNotes = (record) => {
    const notes = [];

    if (record.service) {
      notes.push(`Service: ${record.service}`);
      notes.push(`Status: ${record.status}`);
      notes.push(`Uptime: ${record.uptime}`);
      notes.push(`Response Time: ${record.responseTime}`);
      notes.push(`Last Check: ${new Date(record.lastCheck).toLocaleString()}`);
      if (record.details) {
        notes.push(`Details: ${JSON.stringify(record.details, null, 2)}`);
      }
    } else if (record.metric) {
      notes.push(`Metric: ${record.metric}`);
      notes.push(`Current Value: ${record.current}`);
      notes.push(`Target: ${record.target}`);
      notes.push(`Trend: ${record.trend}`);
      notes.push(`Last Measured: ${new Date(record.lastMeasured).toLocaleString()}`);
    } else if (record.type) {
      notes.push(`Error Type: ${record.type}`);
      notes.push(`Message: ${record.message}`);
      notes.push(`Occurrence Count: ${record.count || 1}`);
      notes.push(`Last Occurrence: ${new Date(record.lastOccurrence || new Date()).toLocaleString()}`);
    }

    return notes.join('\n');
  };

  // Google Apps integration
  const openGoogleApps = async (appType, context = {}) => {
    try {
      const result = await googleIntegrationService.openApp(appType, {
        ...context,
        user: user?.name || 'Developer',
        dashboard: 'developer-operations'
      });

      if (result.success) {
        console.log(`✅ Opened ${appType} successfully`);
      }
    } catch (error) {
      console.error(`Failed to open ${appType}:`, error);
    }
  };

  // System Configuration action handlers
  const handleConfigEdit = async (setting) => {
    try {
      console.log(`⚙️ Editing configuration setting: ${setting.key}`);

      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_setting',
          setting_key: setting.key,
          current_value: setting.value,
          category: setting.category
        })
      });

      if (response.ok) {
        alert(`Configuration editor opened for ${setting.key}`);
        loadDeveloperDashboardData(); // Reload data
      }
    } catch (error) {
      console.error('Error opening config editor:', error);
      alert('Error opening configuration editor. Please try again.');
    }
  };

  // Analytics action handlers
  const handleAnalyticsExport = async (metric) => {
    try {
      console.log(`📊 Exporting analytics data for: ${metric.name}`);

      const response = await fetch('/api/admin/system-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_metric',
          metric_name: metric.name,
          category: metric.category,
          export_format: 'csv'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${metric.name}_analytics.csv`;
        a.click();
        alert(`Analytics data exported for ${metric.name}`);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Error exporting analytics data. Please try again.');
    }
  };

  // Filtering functions
  const getFilteredSystemHealth = () => {
    return systemHealth.filter(item => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && !item.service.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
      return true;
    });
  };

  const getFilteredPerformanceMetrics = () => {
    return performanceMetrics.filter(metric => {
      if (severityFilter !== 'all' && metric.severity !== severityFilter) return false;
      return true;
    });
  };

  const getFilteredErrorTracking = () => {
    return errorTracking.filter(error => {
      if (severityFilter !== 'all' && error.severity !== severityFilter) return false;
      return true;
    });
  };

  // Bulk actions for system management
  const handleBulkAction = async (action) => {
    if (selectedRows.length === 0) return;

    try {
      console.log(`🔄 Executing bulk action: ${action} on ${selectedRows.length} items`);

      const response = await fetch('/api/admin/dev-bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          items: selectedRows.map(id => ({ id })),
          operator: user?.name || 'Developer'
        })
      });

      if (response.ok) {
        console.log(`✅ Bulk action ${action} completed successfully`);
        setSelectedRows([]);
        loadDeveloperDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error(`Failed to execute bulk action ${action}:`, error);
    }
  };

  // Performance Analysis Handlers
  const handlePerformanceAnalysis = async (metric) => {
    try {
      console.log(`🔍 Starting performance analysis for: ${metric.metric}`);

      // Create detailed analysis data
      const analysisData = {
        metric: metric.metric,
        currentValue: metric.current,
        targetValue: metric.target,
        trend: metric.trend,
        timestamp: new Date().toISOString(),
        analysisType: 'performance_deep_dive',
        systemContext: {
          memoryUsage: devMetrics.performance?.memory_usage || 'Unknown',
          apiResponseTime: devMetrics.performance?.api_response_time || 'Unknown',
          databasePerformance: devMetrics.database?.avg_query_time || 'Unknown'
        },
        recommendations: generatePerformanceRecommendations(metric)
      };

      // Open detailed analysis in Google Docs
      await googleIntegrationService.openApp('docs', {
        title: `Performance Analysis: ${metric.metric} - ${new Date().toLocaleDateString()}`,
        template: 'performance-analysis',
        data: analysisData
      });

      // Also open monitoring sheet for tracking
      await googleIntegrationService.openApp('sheets', {
        title: `${metric.metric} Monitoring Dashboard`,
        template: 'performance-monitoring',
        data: {
          metric: metric.metric,
          currentData: metric,
          historicalTracking: true
        }
      });

      console.log(`✅ Performance analysis tools opened for ${metric.metric}`);
    } catch (error) {
      console.error(`Failed to analyze ${metric.metric}:`, error);
      alert(`Error opening performance analysis tools for ${metric.metric}. Please try again.`);
    }
  };

  const generatePerformanceRecommendations = (metric) => {
    const recommendations = [];

    switch (metric.id) {
      case 'page-load':
        if (parseFloat(metric.current) > 2.5) {
          recommendations.push('Optimize bundle size and implement code splitting');
          recommendations.push('Enable browser caching for static assets');
          recommendations.push('Consider implementing service worker for offline caching');
        }
        break;
      case 'api-response':
        if (parseFloat(metric.current) > 300) {
          recommendations.push('Review database query optimization');
          recommendations.push('Implement Redis caching for frequent queries');
          recommendations.push('Consider API response compression');
        }
        break;
      case 'memory-usage':
        const memoryValue = parseFloat(metric.current);
        if (memoryValue > 400) {
          recommendations.push('Investigate memory leaks in React components');
          recommendations.push('Optimize large data structures and cleanup intervals');
          recommendations.push('Consider implementing pagination for large datasets');
        }
        break;
      case 'db-connections':
        const connections = parseInt(metric.current.split('/')[0]);
        if (connections > 12) {
          recommendations.push('Review connection pooling configuration');
          recommendations.push('Implement connection cleanup in API routes');
          recommendations.push('Consider database connection optimization');
        }
        break;
      default:
        recommendations.push('Monitor metric trends and establish baseline performance');
    }

    return recommendations;
  };

  // Error Investigation Handlers
  const handleErrorInvestigation = async (error) => {
    try {
      console.log(`🔍 Starting error investigation for: ${error.type}`);

      // Create detailed investigation data
      const investigationData = {
        errorType: error.type,
        errorMessage: error.message,
        severity: error.severity,
        occurrenceCount: error.count || 1,
        lastOccurrence: error.lastOccurrence,
        timestamp: new Date().toISOString(),
        investigationType: 'error_debugging',
        systemContext: {
          systemHealth: systemHealth.map(s => ({
            service: s.service,
            status: s.status,
            responseTime: s.responseTime
          })),
          performanceMetrics: performanceMetrics.map(m => ({
            metric: m.metric,
            current: m.current,
            trend: m.trend
          }))
        },
        debuggingSteps: generateDebuggingSteps(error),
        potentialCauses: generatePotentialCauses(error)
      };

      // Open error investigation document
      await googleIntegrationService.openApp('docs', {
        title: `Error Investigation: ${error.type} - ${new Date().toLocaleDateString()}`,
        template: 'error-investigation',
        data: investigationData
      });

      // Open error tracking sheet
      await googleIntegrationService.openApp('sheets', {
        title: `Error Tracking Dashboard`,
        template: 'error-tracking',
        data: {
          errorType: error.type,
          errorData: error,
          trackingEnabled: true
        }
      });

      console.log(`✅ Error investigation tools opened for ${error.type}`);
    } catch (investigationError) {
      console.error(`Failed to investigate ${error.type}:`, investigationError);
      alert(`Error opening investigation tools for ${error.type}. Please try again.`);
    }
  };

  const generateDebuggingSteps = (error) => {
    const steps = [];

    switch (error.type?.toLowerCase()) {
      case 'database error':
      case 'connection timeout':
        steps.push('1. Check database connection status and logs');
        steps.push('2. Verify connection pool configuration');
        steps.push('3. Review recent database migrations');
        steps.push('4. Check for long-running queries');
        steps.push('5. Monitor database resource usage');
        break;
      case 'api error':
      case 'server error':
        steps.push('1. Check API endpoint logs and response codes');
        steps.push('2. Verify request validation and error handling');
        steps.push('3. Review recent API changes and deployments');
        steps.push('4. Check server resource usage and scaling');
        steps.push('5. Test API endpoints with various payloads');
        break;
      case 'frontend error':
      case 'javascript error':
        steps.push('1. Check browser console for detailed stack trace');
        steps.push('2. Verify component state management and props');
        steps.push('3. Review recent frontend code changes');
        steps.push('4. Test across different browsers and devices');
        steps.push('5. Check for memory leaks and performance issues');
        break;
      default:
        steps.push('1. Gather detailed error logs and stack traces');
        steps.push('2. Identify error reproduction steps');
        steps.push('3. Check system resources and dependencies');
        steps.push('4. Review recent code changes and deployments');
        steps.push('5. Implement additional logging and monitoring');
    }

    return steps;
  };

  const generatePotentialCauses = (error) => {
    const causes = [];

    switch (error.severity?.toLowerCase()) {
      case 'high':
        causes.push('System resource exhaustion (memory, CPU, disk)');
        causes.push('Critical service dependency failure');
        causes.push('Database connection pool saturation');
        causes.push('Network connectivity issues');
        break;
      case 'medium':
        causes.push('API rate limiting or throttling');
        causes.push('Invalid data format or validation errors');
        causes.push('Authentication or authorization failures');
        causes.push('Third-party service degradation');
        break;
      case 'low':
        causes.push('User input validation issues');
        causes.push('Minor configuration mismatches');
        causes.push('Temporary network fluctuations');
        causes.push('Cache invalidation or stale data');
        break;
      default:
        causes.push('Code logic errors or edge cases');
        causes.push('Environmental configuration issues');
        causes.push('Dependency version conflicts');
        causes.push('Unexpected user behavior patterns');
    }

    return causes;
  };

  if (loading) {
    return (
      <>
        <AdminNavigation user={user} />
        <div className="main-content">
          <div className="container-app">
            <div className="admin-header">
              <div className="text-center">Loading Developer Operations Dashboard...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Developer Operations Dashboard - Triangle Intelligence</title>
        <meta name="description" content="Real-time system monitoring and development operations management" />
      </Head>

      <AdminNavigation user={user} />

      <div className="main-content">
        <div className="container-app">

          {/* Professional Admin Header - Standardized */}
          <div className="admin-header">
            <h1 className="admin-title">🛠️ Developer Operations Dashboard</h1>
            <p className="admin-subtitle">
              Real-time system monitoring, performance analytics, and development operations management
            </p>
            <div className="credentials-badge">
              <span>Development Operations Team</span>
              <span className="license-number">DEV-OPS-2024</span>
            </div>
          </div>

          {/* Maintenance Scheduling */}
          <div className="admin-card">
            <h3 className="card-title">🔗 System Maintenance</h3>
            <div className="google-workspace">
              <button
                className="google-btn calendar"
                onClick={() => openGoogleApps('calendar', {
                  title: 'Maintenance Schedule',
                  type: 'maintenance'
                })}
              >
                🗓️ Schedule Maintenance
              </button>
            </div>
          </div>

          {/* Navigation - Standardized to match collaboration hub */}
          <div className="admin-card">
            <button
              className={`admin-btn ${activeTab === 'system-health' ? 'active' : ''}`}
              onClick={() => setActiveTab('system-health')}
            >
              🔍 System Health
            </button>
            <button
              className={`admin-btn ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              ⚡ Performance Metrics
            </button>
            <button
              className={`admin-btn ${activeTab === 'error-tracking' ? 'active' : ''}`}
              onClick={() => setActiveTab('error-tracking')}
            >
              🚨 Error Tracking
            </button>
            <button
              className={`admin-btn ${activeTab === 'system-config' ? 'active' : ''}`}
              onClick={() => setActiveTab('system-config')}
            >
              ⚙️ System Config
            </button>
            <button
              className={`admin-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analytics
            </button>
          </div>

          {/* System Health Tab */}
          {activeTab === 'system-health' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">🔍 System Health Monitoring</h2>
                <div className="filter-controls">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="operational">Operational</option>
                    <option value="degraded">Degraded</option>
                    <option value="down">Down</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedRows.length > 0 && (
                <div className="bulk-actions">
                  <span className="bulk-selected">
                    {selectedRows.length} service{selectedRows.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => handleBulkAction('restart_service')}
                  >
                    🔄 Restart Services
                  </button>
                  <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => handleBulkAction('run_diagnostics')}
                  >
                    🔧 Run Diagnostics
                  </button>
                  <button
                    className="admin-btn admin-btn-outline"
                    onClick={() => handleBulkAction('clear_cache')}
                  >
                    🗑️ Clear Cache
                  </button>
                </div>
              )}

              {/* System Health Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedRows.length === getFilteredSystemHealth().length && getFilteredSystemHealth().length > 0}
                          onChange={() => handleSelectAll(getFilteredSystemHealth())}
                        />
                      </th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Uptime</th>
                      <th>Response Time</th>
                      <th>Severity</th>
                      <th>Last Check</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredSystemHealth().length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center p-20 text-muted">
                          No system health data available. Run system diagnostics to populate monitoring data.
                        </td>
                      </tr>
                    ) : (
                      getFilteredSystemHealth().map((service) => (
                        <tr
                          key={service.id}
                          className="cursor-pointer"
                          onClick={() => openDetailPanel(service)}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(service.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleRowSelect(service.id);
                              }}
                            />
                          </td>
                          <td className="company-name">{service.service}</td>
                          <td>
                            <span className={`status-indicator status-${service.status.toLowerCase()}`}>
                              {service.status}
                            </span>
                          </td>
                          <td className="text-success">{service.uptime}</td>
                          <td>{service.responseTime}</td>
                          <td>
                            <span className={`priority-indicator priority-${service.severity}`}>
                              {service.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-muted font-xs">
                            {new Date(service.lastCheck).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="admin-btn admin-btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBulkAction('run_diagnostics');
                              }}
                            >
                              🔧 Diagnose
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Metrics Tab */}
          {activeTab === 'performance' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">⚡ Performance Metrics</h2>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Metric</th>
                      <th>Current Value</th>
                      <th>Target</th>
                      <th>Trend</th>
                      <th>Severity</th>
                      <th>Last Measured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPerformanceMetrics().length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center p-20 text-muted">
                          No performance metrics available. Run performance analysis to collect data.
                        </td>
                      </tr>
                    ) : (
                      getFilteredPerformanceMetrics().map((metric) => (
                        <tr
                          key={metric.id}
                          className="cursor-pointer"
                          onClick={() => openDetailPanel(metric)}
                        >
                          <td className="company-name">{metric.metric}</td>
                          <td className="text-jorge">{metric.current}</td>
                          <td>{metric.target}</td>
                          <td>
                            <span className={`trend-indicator trend-${metric.trend}`}>
                              {metric.trend === 'improving' ? '📈' : metric.trend === 'declining' ? '📉' : '➡️'} {metric.trend}
                            </span>
                          </td>
                          <td>
                            <span className={`priority-indicator priority-${metric.severity}`}>
                              {metric.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-muted font-xs">
                            {new Date(metric.lastMeasured).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="admin-btn admin-btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePerformanceAnalysis(metric);
                              }}
                            >
                              📊 Analyze
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Tracking Tab */}
          {activeTab === 'error-tracking' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">🚨 Error Tracking</h2>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Error Type</th>
                      <th>Message</th>
                      <th>Severity</th>
                      <th>Count</th>
                      <th>Last Occurrence</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredErrorTracking().length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-20 text-muted">
                          No errors detected. System is running smoothly.
                        </td>
                      </tr>
                    ) : (
                      getFilteredErrorTracking().map((error, index) => (
                        <tr
                          key={index}
                          className="cursor-pointer"
                          onClick={() => openDetailPanel(error)}
                        >
                          <td className="company-name">{error.type}</td>
                          <td>{error.message}</td>
                          <td>
                            <span className={`priority-indicator priority-${error.severity}`}>
                              {error.severity?.toUpperCase()}
                            </span>
                          </td>
                          <td>{error.count || 1}</td>
                          <td className="text-muted font-xs">
                            {new Date(error.lastOccurrence || new Date()).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="admin-btn admin-btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleErrorInvestigation(error);
                              }}
                            >
                              🔍 Investigate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Configuration Tab */}
          {activeTab === 'system-config' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">⚙️ System Configuration</h2>
                <div className="text-body">Database-driven system settings and environment configuration</div>
              </div>

              {/* Configuration Summary - Only show if we have real data */}
              {systemConfig.environment && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="metric-card">
                    <div className="metric-label">Environment</div>
                    <div className="metric-value">{systemConfig.environment}</div>
                  </div>
                  {systemConfig.db_connections && (
                    <div className="metric-card">
                      <div className="metric-label">Database Connections</div>
                      <div className="metric-value">{systemConfig.db_connections}</div>
                    </div>
                  )}
                  {systemConfig.active_endpoints && (
                    <div className="metric-card">
                      <div className="metric-label">API Endpoints</div>
                      <div className="metric-value">{systemConfig.active_endpoints}</div>
                    </div>
                  )}
                  {systemConfig.version && (
                    <div className="metric-card">
                      <div className="metric-label">Config Version</div>
                      <div className="metric-value">{systemConfig.version}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Configuration Settings Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Setting Key</th>
                      <th>Current Value</th>
                      <th>Category</th>
                      <th>Last Modified</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(systemConfig.settings || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-20 text-muted">
                          No configuration settings found. Settings will appear here automatically.
                        </td>
                      </tr>
                    ) : (
                      (systemConfig.settings || []).map((setting, index) => (
                        <tr
                          key={index}
                          className="cursor-pointer"
                          onClick={() => openDetailPanel({...setting, recordType: 'system_config'})}
                        >
                          <td className="setting-key">{setting.key}</td>
                          <td className="setting-value">{setting.value}</td>
                          <td>{setting.category}</td>
                          <td className="text-muted font-xs">
                            {setting.last_modified ? new Date(setting.last_modified).toLocaleString() : 'Unknown'}
                          </td>
                          <td>
                            <span className={`badge ${setting.is_active ? 'badge-success' : 'badge-warning'}`}>
                              {setting.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="action-btn primary"
                              onClick={() => handleConfigEdit(setting)}
                              title="Edit configuration"
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="admin-card">
              <div className="card-header">
                <h2 className="card-title">📊 System Analytics</h2>
                <div className="text-body">Real-time system usage and performance analytics from database</div>
              </div>

              {/* Analytics Summary - Only show if we have real data */}
              {analyticsData.total_requests && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="metric-card">
                    <div className="metric-label">Total Requests</div>
                    <div className="metric-value">{analyticsData.total_requests}</div>
                  </div>
                  {analyticsData.avg_response_time && (
                    <div className="metric-card">
                      <div className="metric-label">Avg Response Time</div>
                      <div className="metric-value">{analyticsData.avg_response_time}</div>
                    </div>
                  )}
                  {analyticsData.error_rate && (
                    <div className="metric-card">
                      <div className="metric-label">Error Rate</div>
                      <div className="metric-value">{analyticsData.error_rate}</div>
                    </div>
                  )}
                  {analyticsData.active_users && (
                    <div className="metric-card">
                      <div className="metric-label">Active Users</div>
                      <div className="metric-value">{analyticsData.active_users}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Data Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead className="admin-table-header">
                    <tr>
                      <th>Metric</th>
                      <th>Current Value</th>
                      <th>24h Change</th>
                      <th>Trend</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analyticsData.metrics || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center p-20 text-muted">
                          No analytics data found. Metrics will appear here automatically.
                        </td>
                      </tr>
                    ) : (
                      (analyticsData.metrics || []).map((metric, index) => (
                        <tr
                          key={index}
                          className="cursor-pointer"
                          onClick={() => openDetailPanel({...metric, recordType: 'analytics_metric'})}
                        >
                          <td className="metric-name">{metric.name}</td>
                          <td className="metric-current">{metric.current_value}</td>
                          <td className={`metric-change ${metric.change_direction === 'up' ? 'text-success' : metric.change_direction === 'down' ? 'text-danger' : ''}`}>
                            {metric.change_24h || 'No change'}
                          </td>
                          <td>
                            <span className={`badge ${metric.trend === 'improving' ? 'badge-success' : metric.trend === 'declining' ? 'badge-danger' : 'badge-secondary'}`}>
                              {metric.trend?.toUpperCase() || 'STABLE'}
                            </span>
                          </td>
                          <td>{metric.category}</td>
                          <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="action-btn primary"
                              onClick={() => handleAnalyticsExport(metric)}
                              title="Export metric data"
                            >
                              📊 Export
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Detail Panel - Following Jorge's Pattern */}
      <SimpleDetailPanel
        isOpen={detailPanelOpen}
        onClose={closeDetailPanel}
        record={selectedRecord}
        title={selectedRecord?.companyName || 'System Details'}
        type={selectedRecord?.recordType || 'developer-operations'}
      />
    </>
  );
}