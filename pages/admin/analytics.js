/**
 * ANALYTICS ADMIN DASHBOARD
 * Platform usage metrics, performance monitoring, and business intelligence
 */

import React, { useState, useEffect } from 'react';
import AdminNavigation from '../../components/AdminNavigation';
import { requireAdminAuth } from '../../lib/auth/serverAuth';

const TrendingUp = ({ className }) => (
  <span className={className}>[trending-up]</span>
);

const BarChart = ({ className }) => (
  <span className={className}>[bar-chart]</span>
);

const Activity = ({ className }) => (
  <span className={className}>[activity]</span>
);

const DollarSign = ({ className }) => (
  <span className={className}>[dollar]</span>
);

const Users = ({ className }) => (
  <span className={className}>[users]</span>
);

const FileText = ({ className }) => (
  <span className={className}>[document]</span>
);

const Clock = ({ className }) => (
  <span className={className}>[clock]</span>
);

export default function Analytics({ session }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [userActivity, setUserActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      // Load real system status and trust metrics
      let performanceData = {};
      let trustData = {};
      
      try {
        const systemResponse = await fetch('/api/system-status');
        if (systemResponse.ok) {
          const systemStatus = await systemResponse.json();
          performanceData = {
            platform: {
              health_score: systemStatus.health_score,
              status: systemStatus.overall_status
            },
            database: {
              connected: systemStatus.database?.connected,
              total_records: systemStatus.database?.total_records
            }
          };
        }
      } catch (error) {
        console.log('System status not available:', error.message);
      }

      try {
        const trustResponse = await fetch('/api/trust/trust-metrics');
        if (trustResponse.ok) {
          trustData = await trustResponse.json();
        }
      } catch (error) {
        console.log('Trust metrics not available:', error.message);
        trustData = {};
      }
      
      // Try to load analytics APIs - show 0 or "No Data" if APIs don't exist
      let workflowData = {};
      let userData = {};
      let revenueData = {};
      let activityData = [];
      
      try {
        const workflowResponse = await fetch('/api/admin/workflow-analytics');
        if (workflowResponse.ok) {
          workflowData = await workflowResponse.json();
        } else {
          console.log('No /api/admin/workflow-analytics API - showing empty state');
          workflowData = {
            total_workflows: 0,
            workflow_completions: 0,
            completion_rate: 0,
            certificates_generated: 0
          };
        }
      } catch (error) {
        console.log('Workflow analytics API not available:', error.message);
        workflowData = {
          total_workflows: 0,
          workflow_completions: 0,
          completion_rate: 0,
          certificates_generated: 0
        };
      }

      try {
        const userResponse = await fetch('/api/admin/user-analytics');
        if (userResponse.ok) {
          userData = await userResponse.json();
        } else {
          console.log('No /api/admin/user-analytics API - showing empty state');
          userData = {
            total_users: 0,
            active_users: 0,
            new_users_this_month: 0,
            customer_satisfaction: 0
          };
        }
      } catch (error) {
        console.log('User analytics API not available:', error.message);
        userData = {
          total_users: 0,
          active_users: 0,
          new_users_this_month: 0,
          customer_satisfaction: 0
        };
      }

      try {
        const revenueResponse = await fetch('/api/admin/revenue-analytics');
        if (revenueResponse.ok) {
          revenueData = await revenueResponse.json();
        } else {
          console.log('No /api/admin/revenue-analytics API - showing empty state');
          revenueData = {
            total_revenue: 0,
            avg_revenue_per_user: 0,
            total_savings_generated: 0
          };
        }
      } catch (error) {
        console.log('Revenue analytics API not available:', error.message);
        revenueData = {
          total_revenue: 0,
          avg_revenue_per_user: 0,
          total_savings_generated: 0
        };
      }

      try {
        const activityResponse = await fetch('/api/admin/daily-activity');
        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          activityData = activityResult.daily_activity || [];
        } else {
          console.log('No /api/admin/daily-activity API - showing empty state');
          activityData = [];
        }
      } catch (error) {
        console.log('Daily activity API not available:', error.message);
        activityData = [];
      }
      
      // Use real database and performance data where available
      setMetrics({
        total_workflows: workflowData.total_workflows || 0,
        workflow_completions: workflowData.workflow_completions || 0,
        completion_rate: workflowData.completion_rate || 0,
        certificates_generated: workflowData.certificates_generated || 0,
        total_users: userData.total_users || 0,
        active_users: userData.active_users || 0,
        new_users_this_month: userData.new_users_this_month || 0,
        total_revenue: revenueData.total_revenue || 0,
        avg_revenue_per_user: revenueData.avg_revenue_per_user || 0,
        customer_satisfaction: userData.customer_satisfaction || 0,
        platform_uptime: trustData.public_metrics?.performance?.uptime_percentage * 100 || 0,
        database_queries: performanceData.database?.queries || 0,
        api_response_time: performanceData.database?.avgQueryTime || 0,
        total_savings_generated: revenueData.total_savings_generated || 0
      });

      // Try to load performance APIs - show 0 if APIs don't exist
      let performanceMetrics = {};
      
      try {
        const perfResponse = await fetch('/api/admin/performance-analytics');
        if (perfResponse.ok) {
          performanceMetrics = await perfResponse.json();
        } else {
          console.log('No /api/admin/performance-analytics API - showing empty state');
          performanceMetrics = {
            avg_workflow_time: 0,
            api_success_rate: 0,
            page_load_speed: 0,
            error_rate: 0
          };
        }
      } catch (error) {
        console.log('Performance analytics API not available:', error.message);
        performanceMetrics = {
          avg_workflow_time: 0,
          api_success_rate: 0,
          page_load_speed: 0,
          error_rate: 0
        };
      }

      setPerformanceData({
        avg_workflow_time: performanceMetrics.avg_workflow_time || 0,
        classification_accuracy: trustData.public_metrics?.performance?.accuracy_rate * 100 || 0,
        api_success_rate: performanceMetrics.api_success_rate || 0,
        page_load_speed: performanceMetrics.page_load_speed || 0,
        error_rate: performanceMetrics.error_rate || 0,
        database_performance: performanceData.enterprise?.readiness || 0
      });

      setUserActivity(activityData);

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
      <AdminNavigation />
        <div className="main-content">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p className="text-muted">Loading analytics dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavigation />
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="content-card">
            <h1 className="page-title">
              Platform Analytics
            </h1>
            <p className="page-subtitle">
              Usage metrics, performance monitoring, and business intelligence
            </p>
          </div>
          
          <div className="hero-button-group">
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="form-select"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
            
            <button className="btn-primary">
              <FileText className="icon-sm" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid-4-cols element-spacing">
          <div className="content-card success">
            <div className="content-card-icon">
              <TrendingUp className="icon-md" />
            </div>
            <div className={metrics.total_workflows === 0 ? "text-muted" : "calculator-metric-value success"}>
              {metrics.total_workflows === 0 ? "No Data" : metrics.total_workflows?.toLocaleString()}
            </div>
            <div className="calculator-metric-title">Total Workflows</div>
            <p className="text-muted">
              {metrics.completion_rate === 0 ? "API needed for completion tracking" : `${metrics.completion_rate}% completion rate`}
            </p>
          </div>
          
          <div className="content-card analysis">
            <div className="content-card-icon">
              <Users className="icon-md" />
            </div>
            <div className={metrics.active_users === 0 ? "text-muted" : "calculator-metric-value info"}>
              {metrics.active_users === 0 ? "No Data" : metrics.active_users}
            </div>
            <div className="calculator-metric-title">Active Users</div>
            <p className="text-muted">
              {metrics.new_users_this_month === 0 ? "User analytics API needed" : `+${metrics.new_users_this_month} this month`}
            </p>
          </div>
          
          <div className="content-card classification">
            <div className="content-card-icon">
              <DollarSign className="icon-md" />
            </div>
            <div className={metrics.total_revenue === 0 ? "text-muted" : "calculator-metric-value primary"}>
              {metrics.total_revenue === 0 ? "No Data" : `$${metrics.total_revenue?.toLocaleString()}`}
            </div>
            <div className="calculator-metric-title">Monthly Revenue</div>
            <p className="text-muted">
              {metrics.avg_revenue_per_user === 0 ? "Revenue API needed" : `$${metrics.avg_revenue_per_user} per user`}
            </p>
          </div>
          
          <div className="content-card compliance">
            <div className="content-card-icon">
              <FileText className="icon-md" />
            </div>
            <div className={metrics.certificates_generated === 0 ? "text-muted" : "calculator-metric-value warning"}>
              {metrics.certificates_generated === 0 ? "No Data" : metrics.certificates_generated}
            </div>
            <div className="calculator-metric-title">Certificates Generated</div>
            <p className="text-muted">
              {metrics.total_savings_generated === 0 ? "Savings tracking API needed" : `$${(metrics.total_savings_generated / 1000000).toFixed(1)}M savings`}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="section-spacing">
          <nav className="nav-menu">
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={activeTab === 'performance' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={activeTab === 'activity' ? 'nav-menu-link' : 'btn-secondary'}
            >
              User Activity
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <OverviewTab metrics={metrics} />
        )}

        {activeTab === 'performance' && (
          <PerformanceTab performanceData={performanceData} />
        )}

        {activeTab === 'activity' && (
          <ActivityTab userActivity={userActivity} />
        )}
      </div>
    </>
  );
}

function OverviewTab({ metrics }) {
  return (
    <div className="element-spacing">
      <div className="grid-2-cols">
        <div className="content-card">
          <div className="card-header">
            <h3 className="content-card-title">Business Metrics</h3>
            {metrics.total_users === 0 && (
              <p className="text-muted">Requires /api/admin/user-analytics API</p>
            )}
          </div>
          <div className="grid-2-cols">
            <div className="text-body">
              <span>Total Users:</span>
              <span className={metrics.total_users === 0 ? "text-muted" : "calculator-metric-value info"}>
                {metrics.total_users === 0 ? "No Data" : metrics.total_users}
              </span>
            </div>
            <div className="text-body">
              <span>Customer Satisfaction:</span>
              <span className={metrics.customer_satisfaction === 0 ? "text-muted" : "status-success"}>
                {metrics.customer_satisfaction === 0 ? "No Data" : `⭐ ${metrics.customer_satisfaction}/5.0`}
              </span>
            </div>
            <div className="text-body">
              <span>Platform Uptime:</span>
              <span className={metrics.platform_uptime === 0 ? "text-muted" : "status-success"}>
                {metrics.platform_uptime === 0 ? "No Data" : `${metrics.platform_uptime.toFixed(2)}%`}
              </span>
            </div>
            <div className="text-body">
              <span>Database Queries:</span>
              <span className={metrics.database_queries === 0 ? "text-muted" : "calculator-metric-value primary"}>
                {metrics.database_queries === 0 ? "No Data" : metrics.database_queries?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h3 className="content-card-title">Workflow Analytics</h3>
            {metrics.total_workflows === 0 && (
              <p className="text-muted">Requires /api/admin/workflow-analytics API</p>
            )}
          </div>
          <div className="grid-2-cols">
            <div className="text-body">
              <span>Completed Workflows:</span>
              <span className={metrics.workflow_completions === 0 ? "text-muted" : "calculator-metric-value success"}>
                {metrics.workflow_completions === 0 ? "No Data" : metrics.workflow_completions}
              </span>
            </div>
            <div className="text-body">
              <span>Completion Rate:</span>
              <span className={metrics.completion_rate === 0 ? "text-muted" : "status-success"}>
                {metrics.completion_rate === 0 ? "No Data" : `${metrics.completion_rate}%`}
              </span>
            </div>
            <div className="text-body">
              <span>Certificates Generated:</span>
              <span className={metrics.certificates_generated === 0 ? "text-muted" : "calculator-metric-value warning"}>
                {metrics.certificates_generated === 0 ? "No Data" : metrics.certificates_generated}
              </span>
            </div>
            <div className="text-body">
              <span>API Response Time:</span>
              <span className={metrics.api_response_time === 0 ? "text-muted" : "status-info"}>
                {metrics.api_response_time === 0 ? "No Data" : `${metrics.api_response_time}ms`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">Revenue & Impact</h3>
          {metrics.total_revenue === 0 && (
            <p className="text-muted">Requires /api/admin/revenue-analytics API</p>
          )}
        </div>
        <div className="grid-3-cols">
          <div className="content-card success">
            <div className={metrics.total_savings_generated === 0 ? "text-muted" : "calculator-metric-value success"}>
              {metrics.total_savings_generated === 0 ? "No Data" : `$${(metrics.total_savings_generated / 1000000).toFixed(1)}M`}
            </div>
            <div className="calculator-metric-title">Total Savings Generated</div>
          </div>
          <div className="content-card analysis">
            <div className={metrics.total_revenue === 0 ? "text-muted" : "calculator-metric-value info"}>
              {metrics.total_revenue === 0 ? "No Data" : `$${metrics.total_revenue?.toLocaleString()}`}
            </div>
            <div className="calculator-metric-title">Monthly Recurring Revenue</div>
          </div>
          <div className="content-card classification">
            <div className={metrics.avg_revenue_per_user === 0 ? "text-muted" : "calculator-metric-value primary"}>
              {metrics.avg_revenue_per_user === 0 ? "No Data" : `$${metrics.avg_revenue_per_user}`}
            </div>
            <div className="calculator-metric-title">Average Revenue Per User</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({ performanceData }) {
  const hasPerformanceData = performanceData.avg_workflow_time > 0 || performanceData.api_success_rate > 0;
  
  return (
    <div className="element-spacing">
      {!hasPerformanceData && (
        <div className="alert alert-warning">
          <div className="alert-content">
            <div className="alert-title">Performance Analytics Needed</div>
            <p className="text-muted">
              Performance monitoring requires the /api/admin/performance-analytics endpoint to be implemented.
              This will show workflow timing, API success rates, and system performance metrics.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid-3-cols">
        <div className="content-card analysis">
          <div className="content-card-icon">
            <Clock className="icon-md" />
          </div>
          <div className={performanceData.avg_workflow_time === 0 ? "text-muted" : "calculator-metric-value info"}>
            {performanceData.avg_workflow_time === 0 ? "No Data" : `${performanceData.avg_workflow_time}min`}
          </div>
          <div className="calculator-metric-title">Avg Workflow Time</div>
          <div className={performanceData.avg_workflow_time === 0 ? "text-muted" : "status-success"}>
            {performanceData.avg_workflow_time === 0 ? "API Needed" : "Excellent"}
          </div>
        </div>
        
        <div className="content-card classification">
          <div className="content-card-icon">
            <TrendingUp className="icon-md" />
          </div>
          <div className={performanceData.classification_accuracy === 0 ? "text-muted" : "calculator-metric-value success"}>
            {performanceData.classification_accuracy === 0 ? "No Data" : `${performanceData.classification_accuracy.toFixed(1)}%`}
          </div>
          <div className="calculator-metric-title">Classification Accuracy</div>
          <div className={performanceData.classification_accuracy === 0 ? "text-muted" : "status-success"}>
            {performanceData.classification_accuracy === 0 ? "API Needed" : "High Performance"}
          </div>
        </div>
        
        <div className="content-card compliance">
          <div className="content-card-icon">
            <Activity className="icon-md" />
          </div>
          <div className={performanceData.api_success_rate === 0 ? "text-muted" : "calculator-metric-value primary"}>
            {performanceData.api_success_rate === 0 ? "No Data" : `${performanceData.api_success_rate}%`}
          </div>
          <div className="calculator-metric-title">API Success Rate</div>
          <div className={performanceData.api_success_rate === 0 ? "text-muted" : "status-success"}>
            {performanceData.api_success_rate === 0 ? "API Needed" : "Optimal"}
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">System Performance Metrics</h3>
          {!hasPerformanceData && (
            <p className="text-muted">Requires /api/admin/performance-analytics API</p>
          )}
        </div>
        <div className="grid-3-cols">
          <div className="text-body">
            <span>Page Load Speed:</span>
            <span className={performanceData.page_load_speed === 0 ? "text-muted" : "status-success"}>
              {performanceData.page_load_speed === 0 ? "No Data" : `${performanceData.page_load_speed}s`}
            </span>
          </div>
          <div className="text-body">
            <span>Error Rate:</span>
            <span className={performanceData.error_rate === 0 ? "text-muted" : "status-success"}>
              {performanceData.error_rate === 0 ? "No Data" : `${performanceData.error_rate}%`}
            </span>
          </div>
          <div className="text-body">
            <span>Database Performance:</span>
            <span className={performanceData.database_performance === 0 ? "text-muted" : "status-success"}>
              {performanceData.database_performance === 0 ? "No Data" : `${performanceData.database_performance}%`}
            </span>
          </div>
        </div>
        
        <div className={hasPerformanceData ? "alert alert-info" : "alert alert-warning"}>
          <div className="alert-content">
            <div className="alert-title">
              {hasPerformanceData ? "Performance Status" : "Performance Monitoring Required"}
            </div>
            {hasPerformanceData ? 
              "Performance metrics are now connected to real API endpoints for accurate monitoring." :
              "Implement performance analytics APIs to monitor system health, response times, and success rates."
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ userActivity }) {
  if (!userActivity || userActivity.length === 0) {
    return (
      <div className="element-spacing">
        <div className="content-card">
          <div className="card-header">
            <h3 className="content-card-title">Recent Activity Trends</h3>
            <p className="text-muted">Daily platform usage analytics</p>
          </div>
          
          <div className="text-center element-spacing">
            <div className="alert alert-warning">
              <div className="alert-content">
                <div className="alert-title">No Activity Data Available</div>
                <p className="text-muted">
                  Daily activity tracking requires the /api/admin/daily-activity endpoint to be implemented.
                  This will show real-time workflow, user, and certificate generation metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="alert alert-info">
          <div className="alert-icon">
            <BarChart className="icon-md" />
          </div>
          <div className="alert-content">
            <div className="alert-title">Activity Analytics Needed</div>
            Implement daily activity tracking API to monitor platform usage trends, peak times, and conversion rates.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="element-spacing">
      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">Recent Activity Trends</h3>
          <p className="text-muted">Daily platform usage over the last {userActivity.length} days</p>
        </div>
        
        <div className="element-spacing">
          {userActivity.map((day, index) => (
            <div key={day.date} className="content-card analysis">
              <div className="card-header">
                <div className="content-card">
                  <h4 className="text-body">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </h4>
                </div>
              </div>
              
              <div className="grid-3-cols">
                <div className="text-center">
                  <div className="calculator-metric-value info">{day.workflows}</div>
                  <div className="calculator-metric-title">Workflows</div>
                </div>
                <div className="text-center">
                  <div className="calculator-metric-value primary">{day.users}</div>
                  <div className="calculator-metric-title">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="calculator-metric-value success">{day.certificates}</div>
                  <div className="calculator-metric-title">Certificates</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="alert alert-info">
        <div className="alert-icon">
          <BarChart className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Activity Insights</div>
          Daily activity data is now connected to real API endpoints for accurate platform usage tracking.
        </div>
      </div>
    </div>
  );
}

// Server-side authentication protection
export async function getServerSideProps(context) {
  return requireAdminAuth(context);
}