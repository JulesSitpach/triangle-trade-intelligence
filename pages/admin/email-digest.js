/**
 * Admin Email Digest Manager
 * /admin/email-digest
 *
 * Manual curation interface for sending weekly digests and HS code alerts
 *
 * YOUR WORKFLOW:
 * 1. Every Monday morning (30 min):
 *    - Check customs.gov, trade.gov for USMCA changes
 *    - Fill in 2-4 sections with what changed this week
 *    - Preview email, click "Send to All Subscribers"
 *
 * 2. Daily HS code monitoring (15 min):
 *    - Check customs.gov for tariff changes
 *    - If HS code affected, fill in alert form
 *    - Click "Send Alert" - goes only to affected users
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminNavigation from '../../components/AdminNavigation';

export default function EmailDigestAdmin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly', 'alert', 'codes', or 'crisis'

  // Weekly digest state
  const [subject, setSubject] = useState('');
  const [sections, setSections] = useState([
    { title: '', content: '', action: '' }
  ]);

  // HS code alert state
  const [hsCode, setHsCode] = useState('');
  const [alertSubject, setAlertSubject] = useState('');
  const [changeType, setChangeType] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('');
  const [action, setAction] = useState('');

  // Crisis feed state
  const [crisisAlerts, setCrisisAlerts] = useState([]);
  const [loadingCrisis, setLoadingCrisis] = useState(false);

  // UI state
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(false);
  const [activeHSCodes, setActiveHSCodes] = useState([]);

  useEffect(() => {
    checkAuth();
    loadActiveHSCodes();
    loadCrisisAlerts();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();

      if (!data.authenticated || !data.user?.isAdmin) {
        window.location.href = '/login';
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/login';
    }
  };

  const loadActiveHSCodes = async () => {
    try {
      const response = await fetch('/api/admin/active-hs-codes');
      const data = await response.json();
      if (data.success) {
        setActiveHSCodes(data.hsCodes);
      }
    } catch (error) {
      console.error('Failed to load HS codes:', error);
    }
  };

  const loadCrisisAlerts = async () => {
    try {
      setLoadingCrisis(true);
      const response = await fetch('/api/admin/crisis-alerts-queue');
      const data = await response.json();
      if (data.success) {
        setCrisisAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to load crisis alerts:', error);
    } finally {
      setLoadingCrisis(false);
    }
  };

  const approveCrisisAlert = async (alertId, alertData) => {
    if (!confirm('Send this crisis alert to subscribers?')) return;

    try {
      const response = await fetch('/api/admin/approve-crisis-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alertId, alertData, action: 'approve' })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ type: 'success', message: `Crisis alert sent to ${data.recipientCount} subscribers` });
        loadCrisisAlerts(); // Reload alerts
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setResult({ type: 'error', message: error.message });
    }
  };

  const dismissCrisisAlert = async (alertId) => {
    if (!confirm('Dismiss this alert?')) return;

    try {
      const response = await fetch('/api/admin/approve-crisis-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alertId, action: 'dismiss' })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ type: 'success', message: 'Alert dismissed' });
        loadCrisisAlerts(); // Reload alerts
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setResult({ type: 'error', message: error.message });
    }
  };

  const addSection = () => {
    setSections([...sections, { title: '', content: '', action: '' }]);
  };

  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const sendWeeklyDigest = async () => {
    if (!subject || sections.length === 0) {
      alert('Please add subject and at least one section');
      return;
    }

    if (!confirm(`Send weekly digest to all Professional+ subscribers?\n\nSubject: ${subject}\nSections: ${sections.length}`)) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-weekly-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, sections })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          message: `✅ Weekly digest sent to ${data.sent} subscribers!`
        });
        // Clear form
        setSubject('');
        setSections([{ title: '', content: '', action: '' }]);
      } else {
        setResult({
          type: 'error',
          message: `❌ Error: ${data.error}`
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `❌ Failed to send: ${error.message}`
      });
    } finally {
      setSending(false);
    }
  };

  const sendHSAlert = async () => {
    if (!hsCode || !alertSubject || !description) {
      alert('Please fill in HS code, subject, and description');
      return;
    }

    const affectedCount = activeHSCodes.find(c => c.hs_code === hsCode)?.user_count || 0;

    if (!confirm(`Send alert for HS code ${hsCode} to ${affectedCount} affected users?\n\nSubject: ${alertSubject}`)) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-hs-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          hsCode,
          subject: alertSubject,
          changeType,
          description,
          impact,
          action
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          type: 'success',
          message: `✅ Alert sent to ${data.sent} affected users!`
        });
        // Clear form
        setHsCode('');
        setAlertSubject('');
        setChangeType('');
        setDescription('');
        setImpact('');
        setAction('');
      } else {
        setResult({
          type: 'error',
          message: `❌ Error: ${data.error}`
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `❌ Failed to send: ${error.message}`
      });
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return <div className="main-content"><div className="container-app">Loading...</div></div>;
  }

  return (
    <>
      <Head>
        <title>Email Digest Manager - Admin</title>
      </Head>

      <AdminNavigation />

      <div className="main-content">
        <div className="container-app">
          <div className="section-header">
            <h1 className="section-header-title">📧 Email Monitoring System</h1>
            <p className="section-header-subtitle">Manual curation for SMB subscribers</p>
          </div>

          {result && (
            <div className={`alert ${result.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              <p>{result.message}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab ${activeTab === 'weekly' ? 'active' : ''}`}
              onClick={() => setActiveTab('weekly')}
            >
              📅 Weekly Digest (30 min/week)
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'alert' ? 'active' : ''}`}
              onClick={() => setActiveTab('alert')}
            >
              🚨 HS Code Alert (daily check)
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'codes' ? 'active' : ''}`}
              onClick={() => setActiveTab('codes')}
            >
              📊 Active HS Codes ({activeHSCodes.length})
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'crisis' ? 'active' : ''}`}
              onClick={() => setActiveTab('crisis')}
            >
              🔥 Crisis Feed Review ({crisisAlerts.length})
            </button>
          </div>

          {/* Weekly Digest Tab */}
          {activeTab === 'weekly' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Weekly USMCA Policy Digest</h2>
                <p className="text-body">
                  Every Monday: Check customs.gov + trade.gov, summarize changes (30 min)
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Email Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. USMCA Update: New Tariff Changes + Steel Import Rules"
                />
              </div>

              <h3 className="section-header-title">Content Sections</h3>
              <p className="text-body">Add 2-4 sections covering this week's changes</p>

              {sections.map((section, index) => (
                <div key={index} className="card" style={{marginBottom: '20px'}}>
                  <div className="card-header">
                    <h4>Section {index + 1}</h4>
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(index)}
                        className="btn-secondary"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Section Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={section.title}
                      onChange={(e) => updateSection(index, 'title', e.target.value)}
                      placeholder="e.g. New Steel Import Tariffs"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Content</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      value={section.content}
                      onChange={(e) => updateSection(index, 'content', e.target.value)}
                      placeholder="Explain what changed and why it matters..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Action Needed (optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={section.action}
                      onChange={(e) => updateSection(index, 'action', e.target.value)}
                      placeholder="e.g. Review your steel imports before March 1"
                    />
                  </div>
                </div>
              ))}

              <button onClick={addSection} className="btn-secondary" style={{marginBottom: '20px'}}>
                + Add Another Section
              </button>

              <div className="hero-button-group">
                <button
                  onClick={sendWeeklyDigest}
                  disabled={sending}
                  className="btn-primary"
                >
                  {sending ? 'Sending...' : '📧 Send to All Subscribers'}
                </button>
                <button onClick={() => setPreview(!preview)} className="btn-secondary">
                  {preview ? 'Hide Preview' : 'Preview Email'}
                </button>
              </div>

              {preview && (
                <div className="card" style={{marginTop: '20px', padding: '20px', background: '#f9fafb'}}>
                  <h3>Email Preview</h3>
                  <div style={{border: '2px solid #e5e7eb', padding: '20px', background: 'white'}}>
                    <div style={{background: '#134169', color: 'white', padding: '20px', marginBottom: '20px'}}>
                      <h2>{subject}</h2>
                      <p>Weekly USMCA Policy Digest</p>
                    </div>
                    {sections.map((section, i) => (
                      <div key={i} style={{marginBottom: '20px', padding: '15px', background: '#f9fafb', borderLeft: '4px solid #134169'}}>
                        <h4 style={{color: '#134169'}}>{section.title}</h4>
                        <p>{section.content}</p>
                        {section.action && <p style={{fontWeight: 'bold', color: '#dc2626'}}>⚠️ Action: {section.action}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HS Code Alert Tab */}
          {activeTab === 'alert' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🚨 HS Code Specific Alert</h2>
                <p className="text-body">
                  Daily: Check customs.gov for tariff changes (15 min). Send targeted alert to affected users only.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">HS Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  placeholder="e.g. 8517.62.00.00"
                />
                {hsCode && activeHSCodes.find(c => c.hs_code === hsCode) && (
                  <p className="text-body" style={{marginTop: '5px'}}>
                    ✓ {activeHSCodes.find(c => c.hs_code === hsCode).user_count} users will be notified
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Alert Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={alertSubject}
                  onChange={(e) => setAlertSubject(e.target.value)}
                  placeholder="e.g. Tariff Rate Increase"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Change Type</label>
                <select
                  className="form-input"
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                >
                  <option value="">Select change type...</option>
                  <option value="Tariff Rate Increase">Tariff Rate Increase</option>
                  <option value="Tariff Rate Decrease">Tariff Rate Decrease</option>
                  <option value="New Documentation Required">New Documentation Required</option>
                  <option value="USMCA Rule Change">USMCA Rule Change</option>
                  <option value="Compliance Deadline">Compliance Deadline</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">What Changed</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the tariff or policy change..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Impact on Their Business</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  placeholder="Explain how this affects their imports/exports..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Action Required (optional)</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="e.g. Update certificates before March 1, 2025"
                />
              </div>

              <button
                onClick={sendHSAlert}
                disabled={sending}
                className="btn-primary"
              >
                {sending ? 'Sending...' : '🚨 Send Alert to Affected Users'}
              </button>
            </div>
          )}

          {/* Active HS Codes Tab */}
          {activeTab === 'codes' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📊 Active HS Codes to Monitor</h2>
                <p className="text-body">
                  These are the HS codes from user workflows. Check customs.gov daily for changes to these codes.
                </p>
              </div>

              {activeHSCodes.length === 0 ? (
                <p className="text-body">No HS codes in system yet. Users will add them as they run USMCA workflows.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>HS Code</th>
                      <th>Users Affected</th>
                      <th>Example Companies</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeHSCodes.map((item) => (
                      <tr key={item.hs_code}>
                        <td><strong>{item.hs_code}</strong></td>
                        <td>{item.user_count} users</td>
                        <td>{item.company_examples.join(', ')}</td>
                        <td>
                          <button
                            onClick={() => {
                              setActiveTab('alert');
                              setHsCode(item.hs_code);
                            }}
                            className="btn-secondary"
                          >
                            Send Alert
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Crisis Feed Review Tab */}
          {activeTab === 'crisis' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🔥 Crisis Feed Review</h2>
                <p className="text-body">
                  Automated crisis-alert-service detects trade crises. You review and approve before sending to subscribers.
                </p>
                <button onClick={loadCrisisAlerts} className="btn-secondary">
                  Refresh Alerts
                </button>
              </div>

              {loadingCrisis ? (
                <p className="text-body">Loading crisis alerts...</p>
              ) : crisisAlerts.length === 0 ? (
                <p className="text-body">✅ No pending crisis alerts. The system will queue alerts here when trade crises are detected.</p>
              ) : (
                <div>
                  {crisisAlerts.map((queuedItem) => {
                    const alert = queuedItem.alert;
                    const severityColors = {
                      high: '#dc2626',
                      medium: '#f59e0b',
                      low: '#3b82f6'
                    };

                    return (
                      <div key={alert.id} className="card" style={{marginBottom: '20px', borderLeft: `4px solid ${severityColors[alert.crisisLevel]}`}}>
                        <div className="card-header">
                          <h3 className="card-title" style={{color: severityColors[alert.crisisLevel]}}>
                            {alert.crisisLevel.toUpperCase()} Priority: {alert.title}
                          </h3>
                          <p className="text-body" style={{fontSize: '0.9rem', color: '#6b7280'}}>
                            Queued: {new Date(queuedItem.queuedAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Description:</label>
                          <p className="text-body">{alert.description}</p>
                        </div>

                        {alert.affectedProducts && alert.affectedProducts.length > 0 && (
                          <div className="form-group">
                            <label className="form-label">Affected Products:</label>
                            <ul style={{marginLeft: '20px'}}>
                              {alert.affectedProducts.map((product, idx) => (
                                <li key={idx}>{product}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {alert.financialImpact && (
                          <div className="form-group">
                            <label className="form-label">Financial Impact:</label>
                            <p className="text-body">{alert.financialImpact}</p>
                          </div>
                        )}

                        {alert.recommendations && alert.recommendations.length > 0 && (
                          <div className="form-group">
                            <label className="form-label">Recommended Actions:</label>
                            <ol style={{marginLeft: '20px'}}>
                              {alert.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div className="form-group">
                          <label className="form-label">Will be sent to:</label>
                          <p className="text-body">
                            {alert.crisisLevel === 'high'
                              ? 'All subscribers (Professional, Business, Professional Plus)'
                              : 'Business and Professional Plus tiers only'}
                          </p>
                        </div>

                        <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                          <button
                            onClick={() => approveCrisisAlert(alert.id, alert)}
                            className="btn-primary"
                          >
                            ✅ Approve & Send to Subscribers
                          </button>
                          <button
                            onClick={() => dismissCrisisAlert(alert.id)}
                            className="btn-secondary"
                          >
                            ❌ Dismiss (False Positive)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quick Instructions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📖 How to Use This System</h3>
            </div>
            <div className="element-spacing">
              <div className="content-card">
                <h4 className="content-card-title">Weekly Digest (Every Monday, 30 min)</h4>
                <ol style={{marginLeft: '20px'}}>
                  <li>Visit customs.gov, trade.gov, USMCA news</li>
                  <li>Summarize 2-4 key changes in simple language</li>
                  <li>Fill in sections above, add action items if needed</li>
                  <li>Preview, then send to all Professional+ subscribers</li>
                </ol>
              </div>

              <div className="content-card">
                <h4 className="content-card-title">Daily HS Code Monitoring (15 min/day)</h4>
                <ol style={{marginLeft: '20px'}}>
                  <li>Check "Active HS Codes" tab to see which codes to monitor</li>
                  <li>Visit customs.gov tariff database</li>
                  <li>If tariff changed for any active HS code, fill in alert form</li>
                  <li>Send alert - only affected users receive it</li>
                </ol>
              </div>

              <div className="content-card">
                <h4 className="content-card-title">SendGrid Setup (One-Time)</h4>
                <ol style={{marginLeft: '20px'}}>
                  <li>Create free SendGrid account (2,000 emails/month free)</li>
                  <li>Get API key from SendGrid dashboard</li>
                  <li>Add to .env.local: SENDGRID_API_KEY=your_key_here</li>
                  <li>Verify sender email: updates@triangleintelligence.com</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
