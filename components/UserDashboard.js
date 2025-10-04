import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import TriangleLayout from './TriangleLayout';

export default function UserDashboard({ user, profile }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard-data`);
      const data = await response.json();

      if (response.ok) {
        setDashboardData(data);
        // Auto-select first workflow and alert
        if (data.workflows?.length > 0) {
          setSelectedWorkflow(data.workflows[0]);
        }
        if (data.alerts?.length > 0) {
          setSelectedAlert(data.alerts[0]);
        }
      } else {
        setDashboardData({
          workflows: [],
          alerts: [],
          usage_stats: { used: 0, limit: 5, remaining: 5, percentage: 0, limit_reached: false }
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        workflows: [],
        alerts: [],
        usage_stats: { used: 0, limit: 5, remaining: 5, percentage: 0, limit_reached: false }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TriangleLayout user={user}>
        <div className="main-content">
          <div className="container-app">
            <div className="hero-badge">Loading your dashboard...</div>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  const usageStats = dashboardData?.usage_stats || { used: 0, limit: 5, percentage: 0 };
  const workflows = dashboardData?.workflows || [];
  const alerts = dashboardData?.alerts || [];

  return (
    <TriangleLayout user={user}>
      <Head>
        <title>Dashboard - Triangle Trade Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">

          <div className="section-header">
            <h1 className="section-title">Dashboard</h1>
            <p className="section-description">Welcome back, {user?.email?.split('@')[0] || 'User'}</p>
          </div>

          {/* MY WORKFLOWS */}
          <div className="content-card">
            <div className="header-actions">
              <h3 className="content-card-title">My Workflows</h3>
              <Link href="/usmca-workflow" className="btn-primary">
                + New Analysis
              </Link>
            </div>

            {workflows.length === 0 ? (
              <p className="text-body">No workflows yet. Run your first USMCA analysis to get started.</p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select workflow:</label>
                  <select
                    className="form-input"
                    value={selectedWorkflow?.id || ''}
                    onChange={(e) => {
                      const workflow = workflows.find(w => w.id === e.target.value);
                      setSelectedWorkflow(workflow);
                    }}
                  >
                    {workflows.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.product_description} - {w.qualification_status} - {new Date(w.completed_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedWorkflow && (
                  <>
                    <div className="service-request-card" style={{
                      borderLeft: `4px solid ${selectedWorkflow.qualification_status === 'QUALIFIED' ? '#10b981' : '#ef4444'}`
                    }}>
                      <div className="text-bold">{selectedWorkflow.product_description}</div>
                      <div className="text-body">
                        Status: <strong style={{color: selectedWorkflow.qualification_status === 'QUALIFIED' ? '#10b981' : '#ef4444'}}>
                          {selectedWorkflow.qualification_status === 'QUALIFIED' ? '✓ QUALIFIED' : '✗ NOT QUALIFIED'}
                        </strong>
                      </div>
                      <div className="text-body">
                        USMCA Content: <strong>{selectedWorkflow.regional_content_percentage}%</strong> (Threshold: {selectedWorkflow.required_threshold || 60}%)
                      </div>
                      {selectedWorkflow.hs_code && (
                        <div className="text-body">HS Code: {selectedWorkflow.hs_code}</div>
                      )}
                      {selectedWorkflow.estimated_annual_savings && (
                        <div className="text-body">
                          Annual Savings: <strong>${selectedWorkflow.estimated_annual_savings.toLocaleString()}</strong>
                        </div>
                      )}
                      {selectedWorkflow.component_origins && selectedWorkflow.component_origins.length > 0 && (
                        <div className="text-body">
                          Components: {selectedWorkflow.component_origins.map((c, i) =>
                            `${c.origin_country || c.country}: ${c.value_percentage || c.percentage}%`
                          ).join(' | ')}
                        </div>
                      )}
                    </div>

                    <div className="hero-buttons">
                      {selectedWorkflow.qualification_status === 'QUALIFIED' && (
                        <>
                          <Link href="/usmca-certificate-completion" className="btn-primary">
                            Generate Certificate
                          </Link>
                          {selectedWorkflow.certificate_pdf_url && (
                            <a href={selectedWorkflow.certificate_pdf_url} download className="btn-secondary">
                              Download
                            </a>
                          )}
                        </>
                      )}
                      <Link href="/trade-risk-alternatives" className="btn-secondary">
                        View Full Analysis
                      </Link>
                      <Link
                        href={selectedWorkflow.qualification_status === 'QUALIFIED'
                          ? '/services/logistics-support'
                          : '/services/request?service=supplier-sourcing'}
                        className="btn-primary"
                      >
                        Request Service
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* TRADE ALERTS */}
          <div className="content-card">
            <h3 className="content-card-title">Trade Alerts</h3>

            {alerts.length === 0 ? (
              <p className="text-body">No alerts yet. Run a vulnerability analysis to monitor supply chain risks.</p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select alert:</label>
                  <select
                    className="form-input"
                    value={selectedAlert?.id || ''}
                    onChange={(e) => {
                      const alert = alerts.find(a => a.id === e.target.value);
                      setSelectedAlert(alert);
                    }}
                  >
                    {alerts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.product_description || a.company_name} - {a.overall_risk_level} - {new Date(a.analyzed_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAlert && (
                  <>
                    <div className="service-request-card" style={{
                      borderLeft: `4px solid ${
                        selectedAlert.overall_risk_level === 'HIGH' ? '#ef4444' :
                        selectedAlert.overall_risk_level === 'MODERATE' ? '#f59e0b' : '#10b981'
                      }`
                    }}>
                      <div className="text-bold">{selectedAlert.product_description || selectedAlert.company_name}</div>
                      <div className="text-body">
                        Risk Level: <strong style={{
                          color: selectedAlert.overall_risk_level === 'HIGH' ? '#ef4444' :
                                 selectedAlert.overall_risk_level === 'MODERATE' ? '#f59e0b' : '#10b981'
                        }}>
                          {selectedAlert.overall_risk_level}
                        </strong>
                      </div>
                      <div className="text-body">
                        Impact: Risk Score {selectedAlert.risk_score}/100 • {selectedAlert.alert_count} alerts detected
                      </div>
                      {selectedAlert.primary_vulnerabilities && selectedAlert.primary_vulnerabilities.length > 0 && (
                        <div className="text-body">
                          <strong>Key Risks:</strong>
                          <ul style={{marginTop: '0.5rem', paddingLeft: '1.5rem'}}>
                            {selectedAlert.primary_vulnerabilities.slice(0, 3).map((v, i) => (
                              <li key={i}>{v.description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedAlert.recommendations?.immediate_actions && selectedAlert.recommendations.immediate_actions.length > 0 && (
                        <div className="text-body">
                          <strong>Recommended Actions:</strong>
                          <ul style={{marginTop: '0.5rem', paddingLeft: '1.5rem'}}>
                            {selectedAlert.recommendations.immediate_actions.slice(0, 3).map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="hero-buttons">
                      <Link
                        href={`/trade-risk-alternatives?analysis_id=${selectedAlert.id}`}
                        className="btn-secondary"
                      >
                        View Full Alert
                      </Link>
                      <Link
                        href="/services/request?service=crisis-response"
                        className="btn-primary"
                      >
                        Get Professional Help
                      </Link>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* USAGE TRACKER */}
          <div className="content-card">
            <h3 className="content-card-title">Monthly Usage</h3>
            <p className="text-body">
              <strong>{usageStats.used} of {usageStats.limit === 999 ? 'unlimited' : usageStats.limit}</strong> analyses used this month
            </p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(usageStats.percentage || 0, 100)}%`,
                  backgroundColor: usageStats.percentage >= 100 ? '#ef4444' : usageStats.percentage >= 80 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>

            {usageStats.limit_reached && (
              <div className="hero-buttons">
                <Link href="/pricing" className="btn-primary">
                  Upgrade for More Analyses
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </TriangleLayout>
  );
}
