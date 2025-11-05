import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import TriangleLayout from './TriangleLayout';
import { SUBSCRIPTION_TIERS } from '../config/subscription-limits';
import { logDevIssue, DevIssue } from '../lib/utils/logDevIssue.js';

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
      await DevIssue.apiError('user_dashboard', '/api/dashboard-data', error, {
        userId: user?.id
      });
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

        // Track missing fields for dev issue logging
        const missingFields = [];
        if (!workflow.company_name && !workflowData.company?.name) missingFields.push('company_name');
        if (!workflowData.company?.company_address && !workflowData.company?.address) missingFields.push('company_address');
        if (!workflowData.company?.tax_id) missingFields.push('tax_id');
        if (!workflowData.company?.contact_phone && !workflowData.company?.phone) missingFields.push('contact_phone');
        if (!workflowData.company?.contact_email && !workflowData.company?.email) missingFields.push('contact_email');
        if (!workflow.hs_code && !workflowData.product?.hs_code) missingFields.push('hs_code');
        if (!workflow.product_description && !workflowData.product?.description) missingFields.push('product_description');
        if (!workflowData.company?.contact_person && !workflow.company_name) missingFields.push('contact_person');
        if (!workflow.manufacturing_location) missingFields.push('manufacturing_location');

        if (missingFields.length > 0) {
          console.error('🚨 DEV ISSUE: Missing workflow data in dashboard certificate generation', {
            workflow_id: workflow.id,
            missing_fields: missingFields,
            workflow_has_workflow_data: !!workflow.workflow_data
          });

          // Log using DevIssue helper
          await DevIssue.missingData('dashboard_certificate_generator', 'certificate_workflow_fields', {
            workflow_id: workflow.id,
            missing_fields: missingFields,
            workflow_structure: {
              has_workflow_data: !!workflow.workflow_data,
              has_company: !!workflowData.company,
              has_product: !!workflowData.product
            }
          });
        }

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
      await DevIssue.apiError('user_dashboard', 'certificate-download', error, {
        workflowId: workflow.id,
        productDescription: workflow.product_description
      });
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

  // Check if trial has expired
  const isTrialExpired = user?.trial_expired === true;
  const subscriptionTier = user?.subscription_tier || 'Trial';

  // Calculate days remaining for active trial
  const daysRemaining = user?.trial_ends_at && !isTrialExpired
    ? Math.ceil((new Date(user.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isActiveTrial = subscriptionTier === 'Trial' && !isTrialExpired && daysRemaining !== null;

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

        {/* ACTIVE TRIAL COUNTDOWN BANNER */}
        {isActiveTrial && (
          <div className="form-section" style={{ backgroundColor: '#E3F2FD', border: '2px solid #2196F3', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 className="form-section-title" style={{ color: '#1565C0', marginTop: '0' }}>
              🎉 Free Trial Active - {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''} Remaining
            </h2>
            <p className="text-body" style={{ fontSize: '16px', marginBottom: '15px' }}>
              {daysRemaining <= 2 ? (
                <>Your trial ends soon! Upgrade now to keep unlimited access to USMCA analyses, alerts, and certificate downloads.</>
              ) : (
                <>You have {daysRemaining} days to explore Triangle Trade Intelligence. Try the USMCA workflow and see your potential tariff savings!</>
              )}
            </p>
            <div className="action-buttons">
              {dashboardData?.usage_stats?.limit_reached ? (
                <Link href="/pricing" className="btn-primary" style={{ marginRight: '10px' }}>
                  🔒 Upgrade for More Analyses
                </Link>
              ) : (
                <Link href="/usmca-workflow" className="btn-primary" style={{ marginRight: '10px' }}>
                  📊 Try USMCA Workflow
                </Link>
              )}
              <Link href="/pricing" className="btn-secondary">
                👀 View Plans
              </Link>
            </div>
            <p className="text-body" style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
              Trial expires {user?.trial_ends_at && new Date(user.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}

        {/* TRIAL EXPIRED BANNER */}
        {isTrialExpired && (
          <div className="form-section" style={{ backgroundColor: '#FFF3E0', border: '2px solid #FF9800', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 className="form-section-title" style={{ color: '#E65100', marginTop: '0' }}>
              ⏰ Your 7-Day Free Trial Expired
              {user?.trial_ends_at && ` on ${new Date(user.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            </h2>
            <p className="text-body" style={{ fontSize: '16px', marginBottom: '15px' }}>
              Your trial period has ended. Upgrade now to continue creating USMCA analyses, viewing alerts, and downloading certificates.
            </p>
            <div className="action-buttons">
              <Link href="/pricing" className="btn-primary" style={{ fontSize: '18px', padding: '12px 30px' }}>
                🚀 Upgrade to Starter ($99/month)
              </Link>
            </div>
            <p className="text-body" style={{ fontSize: '14px', marginTop: '10px', color: '#666' }}>
              ✅ Keep all your existing data • ✅ Same login credentials • ✅ Instant access after upgrade
            </p>
          </div>
        )}

        {/* USAGE TRACKER */}
        <div className="form-section">
          <h2 className="form-section-title">Usage</h2>
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
                <Link href="/account/subscription" className="btn-primary">
                  Upgrade for More Analyses
                </Link>
              </div>
            )}
        </div>

        {/* MY WORKFLOWS */}
        <div className="form-section">
          <div className="dashboard-actions">
            <div className="dashboard-actions-left">
              <h2 className="form-section-title">My Certificates</h2>
            </div>
            <div className="dashboard-actions-right">
              {!isTrialExpired && workflows.length > 0 && (
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
                  className="btn-delete-small"
                >
                  🗑️ Clear All
                </button>
              )}
              {isTrialExpired ? (
                <Link href="/pricing" className="btn-primary">
                  🚀 Upgrade to Create Certificates
                </Link>
              ) : (
                <Link
                  href="/usmca-workflow?reset=true&force_new=true"
                  className="btn-primary"
                >
                  + New Analysis
                </Link>
              )}
            </div>
          </div>

          {isTrialExpired ? (
            <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p className="text-body" style={{ fontSize: '16px', marginBottom: '15px' }}>
                🔒 <strong>Workflows disabled - Trial expired</strong>
              </p>
              <p className="text-body">
                Upgrade to view your past analyses and create new USMCA certifications.
              </p>
              <div className="action-buttons" style={{ marginTop: '20px' }}>
                <Link href="/pricing" className="btn-primary">
                  View Pricing Plans
                </Link>
              </div>
            </div>
          ) : workflows.length === 0 ? (
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

                    <div className="action-buttons">
                      {/* QUALIFIED: Download Certificate + View Results */}
                      {selectedWorkflow.qualification_status === 'QUALIFIED' && (
                        <>
                          <button
                            onClick={() => router.push(`/usmca-workflow?view_results=${selectedWorkflow.id}`)}
                            className="btn-secondary"
                          >
                            View Results
                          </button>
                          <button
                            onClick={() => !isTrialExpired && handleDownloadCertificate(selectedWorkflow)}
                            className="btn-primary"
                            disabled={isTrialExpired}
                            style={isTrialExpired ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            title={isTrialExpired ? 'Upgrade to download certificates' : ''}
                          >
                            Download Certificate {isTrialExpired && '(Upgrade Required)'}
                          </button>
                        </>
                      )}

                      {/* NOT QUALIFIED: View Analysis */}
                      {selectedWorkflow.qualification_status !== 'QUALIFIED' && (
                        <button
                          onClick={() => !isTrialExpired && router.push(`/usmca-workflow?view_results=${selectedWorkflow.id}`)}
                          className="btn-primary"
                          disabled={isTrialExpired}
                          style={isTrialExpired ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          View Analysis {isTrialExpired && '(Upgrade Required)'}
                        </button>
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
                        className="btn-delete"
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
              {isTrialExpired ? (
                <Link href="/pricing" className="btn-primary">
                  🚀 Upgrade to View Alerts
                </Link>
              ) : alerts.length > 0 && (
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
                  className="btn-delete-small"
                >
                  🗑️ Clear All Alerts
                </button>
              )}
            </div>
          </div>

          {isTrialExpired ? (
            <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p className="text-body" style={{ fontSize: '16px', marginBottom: '15px' }}>
                🔒 <strong>Alerts disabled - Trial expired</strong>
              </p>
              <p className="text-body">
                Upgrade to view and manage trade alerts for supply chain risk monitoring.
              </p>
              <div className="action-buttons" style={{ marginTop: '20px' }}>
                <Link href="/pricing" className="btn-primary">
                  View Pricing Plans
                </Link>
              </div>
            </div>
          ) : alerts.length === 0 ? (
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

                    <div className="action-buttons">
                      <button
                        onClick={() => !isTrialExpired && handleViewAlert(selectedAlert.id)}
                        className="btn-primary"
                        disabled={isTrialExpired}
                        style={isTrialExpired ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        View Full Alert {isTrialExpired && '(Upgrade Required)'}
                      </button>

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
                        className="btn-delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
        </div>

      </div>
    </TriangleLayout>
  );
}
