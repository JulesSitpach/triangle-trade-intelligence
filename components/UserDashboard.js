import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import TriangleLayout from './TriangleLayout';

export default function UserDashboard({ user }) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleGenerateCertificate = async (workflow) => {
    try {
      console.log('🔄 Auto-generating certificate from workflow data...');

      // Build certificate data from workflow
      const workflowData = workflow.workflow_data || {};
      const certificateData = {
        exporter: {
          name: workflow.company_name || workflowData.company_name || 'Company',
          address: workflowData.company_address || '',
          tax_id: workflowData.tax_id || '',
          phone: workflowData.contact_phone || '',
          email: workflowData.contact_email || ''
        },
        product: {
          hs_code: workflow.hs_code || '',
          description: workflow.product_description || '',
          preference_criterion: 'B'
        },
        usmca_analysis: {
          qualified: workflow.qualification_status === 'QUALIFIED',
          regional_content: workflow.regional_content_percentage || 0,
          rule: 'Regional Value Content',
          threshold: workflow.required_threshold || 60
        },
        authorization: {
          signatory_name: workflow.company_name || 'Authorized Signatory',
          signatory_title: 'Exporter',
          signatory_date: new Date().toISOString()
        },
        blanket_period: {
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
        }
      };

      // Import PDF generator
      const { generateUSMCACertificatePDF } = await import('../lib/utils/usmca-certificate-pdf-generator.js');

      // Generate and download PDF
      await generateUSMCACertificatePDF(certificateData);

      // Save to database
      try {
        const saveResponse = await fetch('/api/workflow-session/update-certificate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            product_description: workflow.product_description,
            hs_code: workflow.hs_code,
            certificate_data: certificateData,
            certificate_generated: true
          })
        });

        if (saveResponse.ok) {
          console.log('✅ Certificate saved to database');
          // Refresh dashboard to show updated certificate status
          fetchUserData();
        }
      } catch (saveError) {
        console.warn('⚠️ Failed to save certificate:', saveError);
      }

      console.log('✅ Certificate generated and downloaded');
    } catch (error) {
      console.error('❌ Error generating certificate:', error);
      alert('Failed to generate certificate. Please try again.');
    }
  };

  const handleDownloadCertificate = async (workflow) => {
    try {
      if (!workflow.certificate_data) {
        alert('No certificate data available. Please generate a certificate first.');
        return;
      }

      console.log('📄 Downloading certificate from database...');

      // Import the PDF generator
      const { generateUSMCACertificatePDF } = await import('../lib/utils/usmca-certificate-pdf-generator.js');

      // Generate PDF from database certificate data
      const pdfBlob = await generateUSMCACertificatePDF(workflow.certificate_data);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `USMCA_Certificate_${workflow.certificate_data.certificate_number || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Certificate downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handleViewAlert = (alertId) => {
    // Use router.push instead of Link to properly handle navigation to the same route with different query params
    router.push(`/trade-risk-alternatives?analysis_id=${alertId}`);
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
              <h3 className="content-card-title">My Certificates</h3>
              <Link href="/usmca-workflow" className="btn-primary">
                + New Analysis
              </Link>
            </div>

            {workflows.length === 0 ? (
              <p className="text-body">No certificates yet. Run your first USMCA analysis to generate a certificate.</p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select certificate:</label>
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
                        USMCA Content: <strong>{selectedWorkflow.regional_content_percentage || 'N/A'}%</strong> (Threshold: {selectedWorkflow.required_threshold || 60}%)
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
                          Components: {selectedWorkflow.component_origins.map((c) =>
                            `${c.origin_country || c.country}: ${c.value_percentage || c.percentage}%`
                          ).join(' | ')}
                        </div>
                      )}
                    </div>

                    <div className="hero-buttons">
                      {/* QUALIFIED: [Download Certificate] [Request Service] */}
                      {selectedWorkflow.qualification_status === 'QUALIFIED' && (
                        <>
                          <button
                            onClick={() => selectedWorkflow.certificate_data
                              ? handleDownloadCertificate(selectedWorkflow)
                              : handleGenerateCertificate(selectedWorkflow)
                            }
                            className="btn-primary"
                          >
                            📥 Download Certificate
                          </button>

                          <Link
                            href="/services/logistics-support"
                            className="btn-secondary"
                          >
                            🎯 Request Professional Service
                          </Link>
                        </>
                      )}

                      {/* NOT QUALIFIED: [View Analysis] [Get Help to Qualify] [Request Service] */}
                      {selectedWorkflow.qualification_status !== 'QUALIFIED' && (
                        <>
                          <Link
                            href={{
                              pathname: '/trade-risk-alternatives',
                              query: { analysis_id: selectedWorkflow.id }
                            }}
                            className="btn-secondary"
                          >
                            📊 View Analysis
                          </Link>

                          <Link
                            href="/services/logistics-support"
                            className="btn-primary"
                          >
                            🇲🇽 Get Help to Qualify
                          </Link>

                          <Link
                            href="/services/logistics-support"
                            className="btn-secondary"
                          >
                            🎯 Request Professional Service
                          </Link>
                        </>
                      )}
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
                      <button
                        onClick={() => handleViewAlert(selectedAlert.id)}
                        className="btn-secondary"
                      >
                        View Full Alert
                      </button>
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
              <strong>{usageStats.used} of {usageStats.is_unlimited ? 'unlimited' : usageStats.limit}</strong> analyses used this month
            </p>

            {!usageStats.is_unlimited && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(usageStats.percentage || 0, 100)}%`,
                    backgroundColor: usageStats.percentage >= 100 ? '#ef4444' : usageStats.percentage >= 80 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            )}

            {usageStats.limit_reached && !usageStats.is_unlimited && (
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
