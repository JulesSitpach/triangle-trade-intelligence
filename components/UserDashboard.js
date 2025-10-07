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

  const handleDownloadCertificate = async (workflow) => {
    try {
      console.log('📄 Downloading certificate...');

      // If no stored certificate data, generate it from workflow data
      let certificateData = workflow.certificate_data;

      if (!certificateData) {
        console.log('⚠️ No stored certificate - generating from workflow data...');
        const workflowData = workflow.workflow_data || {};

        certificateData = {
          certificate_number: `USMCA-${Date.now()}`,
          exporter: {
            name: workflow.company_name || workflowData.company?.name || 'Company',
            address: workflowData.company?.company_address || workflowData.company?.address || '',
            tax_id: workflowData.company?.tax_id || '',
            phone: workflowData.company?.contact_phone || workflowData.company?.phone || '',
            email: workflowData.company?.contact_email || workflowData.company?.email || ''
          },
          product: {
            hs_code: workflow.hs_code || workflowData.product?.hs_code || '',
            description: workflow.product_description || workflowData.product?.description || '',
            preference_criterion: 'B'
          },
          usmca_analysis: {
            qualified: workflow.qualification_status === 'QUALIFIED',
            regional_content: workflow.regional_content_percentage || 0,
            rule: 'Regional Value Content',
            threshold: workflow.required_threshold || 60
          },
          authorization: {
            signatory_name: workflowData.company?.contact_person || workflow.company_name || 'Authorized Signatory',
            signatory_title: 'Exporter',
            signatory_date: new Date().toISOString()
          },
          blanket_period: {
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
          },
          country_of_origin: workflow.manufacturing_location || 'MX'
        };
      }

      // Import the PDF generator
      const { generateUSMCACertificatePDF } = await import('../lib/utils/usmca-certificate-pdf-generator.js');

      // Generate PDF from certificate data
      const pdfBlob = await generateUSMCACertificatePDF(certificateData);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `USMCA_Certificate_${certificateData.certificate_number || Date.now()}.pdf`;
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
        <div className="dashboard-container">
          <div className="hero-badge">Loading your dashboard...</div>
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

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user?.email?.split('@')[0] || 'User'}</p>
        </div>

        {/* MY WORKFLOWS */}
        <div className="form-section">
          <div className="dashboard-actions">
            <div className="dashboard-actions-left">
              <h2 className="form-section-title">My Certificates</h2>
            </div>
            <div className="dashboard-actions-right">
              {workflows.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm(`Delete ALL certificates?\n\nThis will permanently remove ${workflows.length} certificate${workflows.length > 1 ? 's' : ''} from your account.\n\nThis action cannot be undone.`)) {
                      try {
                        console.log(`🗑️ Deleting ${workflows.length} certificates...`);

                        const deletePromises = workflows.map(async (w) => {
                          const response = await fetch(`/api/delete-workflow?id=${w.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                          });

                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(`Failed to delete workflow ${w.id}: ${error.error || 'Unknown error'}`);
                          }

                          console.log(`✅ Deleted workflow: ${w.id}`);
                          return response.json();
                        });

                        await Promise.all(deletePromises);
                        console.log(`✅ All ${workflows.length} certificates deleted successfully`);
                        alert(`✅ All ${workflows.length} certificates deleted`);

                        // Force hard reload without cache
                        window.location.reload(true);
                      } catch (error) {
                        console.error('Bulk delete error:', error);
                        alert(`❌ Error deleting certificates: ${error.message}`);
                      }
                    }
                  }}
                  className="btn-secondary text-danger"
                >
                  🗑️ Clear All
                </button>
              )}
              <Link href="/usmca-workflow?reset=true" className="btn-primary">
                + New Analysis
              </Link>
            </div>
          </div>

          {workflows.length === 0 ? (
            <p className="text-body">No certificates yet. Run your first USMCA analysis to generate a certificate.</p>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select certificate:</label>
                <select
                  className="form-select"
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
                    <div className={`service-request-card ${selectedWorkflow.qualification_status === 'QUALIFIED' ? 'border-left-green' : 'border-left-red'}`}>
                      <div className="text-bold">{selectedWorkflow.product_description}</div>
                      <div className="text-body">
                        Status: <strong className={selectedWorkflow.qualification_status === 'QUALIFIED' ? 'text-green' : 'text-red'}>
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
                      {/* QUALIFIED: Download Certificate only */}
                      {selectedWorkflow.qualification_status === 'QUALIFIED' && (
                        <button
                          onClick={() => handleDownloadCertificate(selectedWorkflow)}
                          className="btn-primary"
                        >
                          📥 Download Certificate
                        </button>
                      )}

                      {/* NOT QUALIFIED: [View Analysis] [Get Help to Qualify] */}
                      {selectedWorkflow.qualification_status !== 'QUALIFIED' && (
                        <>
                          <Link
                            href={`/usmca-workflow?view_results=${selectedWorkflow.id}`}
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
                        </>
                      )}

                      {/* Delete Certificate Button */}
                      <button
                        onClick={async () => {
                          // Check if we have a valid ID
                          if (!selectedWorkflow.id) {
                            alert('❌ Cannot delete: This certificate has no ID. It may be corrupted.');
                            console.error('❌ Invalid workflow - no ID:', selectedWorkflow);
                            return;
                          }

                          if (confirm(`Delete this certificate?\n\n"${selectedWorkflow.product_description}"\n\nThis will permanently remove it from your account.`)) {
                            try {
                              console.log(`🗑️ Deleting workflow:`, {
                                id: selectedWorkflow.id,
                                product: selectedWorkflow.product_description,
                                status: selectedWorkflow.qualification_status,
                                source: selectedWorkflow.source
                              });

                              const response = await fetch(`/api/delete-workflow?id=${selectedWorkflow.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                              });

                              if (response.ok) {
                                const result = await response.json();
                                console.log(`✅ Workflow deleted:`, result);
                                alert('✅ Certificate deleted successfully');

                                // Force hard reload without cache
                                window.location.reload(true);
                              } else {
                                const error = await response.json();
                                console.error('❌ Delete failed:', error);
                                alert(`❌ Failed to delete certificate:\n${error.error || 'Unknown error'}\n\nCheck console for details.`);
                              }
                            } catch (error) {
                              console.error('❌ Delete error:', error);
                              alert(`❌ Error deleting certificate:\n${error.message}\n\nCheck console for details.`);
                            }
                          }
                        }}
                        className="btn-secondary text-danger"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
        </div>

        {/* TRADE ALERTS */}
        <div className="form-section">
          <div className="dashboard-actions">
            <div className="dashboard-actions-left">
              <h2 className="form-section-title">Trade Alerts</h2>
            </div>
            <div className="dashboard-actions-right">
              {alerts.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm(`Delete ALL alerts?\n\nThis will permanently remove ${alerts.length} alert${alerts.length > 1 ? 's' : ''} from your account.\n\nThis action cannot be undone.`)) {
                      try {
                        console.log(`🗑️ Deleting ${alerts.length} alerts...`);

                        const deletePromises = alerts.map(async (a) => {
                          const response = await fetch(`/api/delete-alert?id=${a.id}`, {
                            method: 'DELETE',
                            credentials: 'include'
                          });

                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(`Failed to delete alert ${a.id}: ${error.error || 'Unknown error'}`);
                          }

                          console.log(`✅ Deleted alert: ${a.id}`);
                          return response.json();
                        });

                        await Promise.all(deletePromises);
                        console.log(`✅ All ${alerts.length} alerts deleted successfully`);
                        alert(`✅ All ${alerts.length} alerts deleted`);

                        // Force hard reload without cache
                        window.location.reload(true);
                      } catch (error) {
                        console.error('Bulk delete error:', error);
                        alert(`❌ Error deleting alerts: ${error.message}`);
                      }
                    }
                  }}
                  className="btn-secondary text-danger"
                >
                  🗑️ Clear All Alerts
                </button>
              )}
            </div>
          </div>

          {alerts.length === 0 ? (
            <p className="text-body">No alerts yet. Run a vulnerability analysis to monitor supply chain risks.</p>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select alert:</label>
                <select
                  className="form-select"
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
                    <div className={`service-request-card ${
                      selectedAlert.overall_risk_level === 'HIGH' ? 'border-left-red' :
                      selectedAlert.overall_risk_level === 'MODERATE' ? 'border-left-amber' : 'border-left-green'
                    }`}>
                      <div className="text-bold">{selectedAlert.product_description || selectedAlert.company_name}</div>
                      <div className="text-body">
                        Risk Level: <strong className={
                          selectedAlert.overall_risk_level === 'HIGH' ? 'text-red' :
                          selectedAlert.overall_risk_level === 'MODERATE' ? 'text-amber' : 'text-green'
                        }>
                          {selectedAlert.overall_risk_level}
                        </strong>
                      </div>
                      <div className="text-body">
                        Impact: Risk Score {selectedAlert.risk_score}/100 • {selectedAlert.alert_count} alerts detected
                      </div>
                      {selectedAlert.primary_vulnerabilities && selectedAlert.primary_vulnerabilities.length > 0 && (
                        <div className="text-body">
                          <strong>Key Risks:</strong>
                          <ul className="list-simple">
                            {selectedAlert.primary_vulnerabilities.slice(0, 3).map((v, i) => (
                              <li key={i}>{v.description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedAlert.recommendations?.immediate_actions && selectedAlert.recommendations.immediate_actions.length > 0 && (
                        <div className="text-body">
                          <strong>Recommended Actions:</strong>
                          <ul className="list-simple">
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

                      {/* Delete Alert Button */}
                      <button
                        onClick={async () => {
                          if (confirm(`Delete this alert?\n\n"${selectedAlert.product_description || selectedAlert.company_name}"\n\nThis will permanently remove it from your account.`)) {
                            try {
                              const response = await fetch(`/api/delete-alert?id=${selectedAlert.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                              });

                              if (response.ok) {
                                alert('✅ Alert deleted successfully');
                                window.location.reload(); // Refresh to update the list
                              } else {
                                alert('❌ Failed to delete alert');
                              }
                            } catch (error) {
                              console.error('Delete error:', error);
                              alert('❌ Error deleting alert');
                            }
                          }
                        }}
                        className="btn-secondary text-danger"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
        </div>

        {/* USAGE TRACKER */}
        <div className="form-section">
          <h2 className="form-section-title">Monthly Usage</h2>
            <p className="text-body">
              <strong>{usageStats.used} of {usageStats.is_unlimited ? 'unlimited' : usageStats.limit}</strong> analyses used this month
            </p>

            {!usageStats.is_unlimited && (
              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    usageStats.percentage >= 100 ? 'progress-danger' :
                    usageStats.percentage >= 80 ? 'progress-warning' : 'progress-success'
                  }`}
                  style={{ width: `${Math.min(usageStats.percentage || 0, 100)}%` }}
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
    </TriangleLayout>
  );
}
