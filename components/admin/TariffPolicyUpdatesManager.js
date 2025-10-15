/**
 * TariffPolicyUpdatesManager.js - Admin UI for managing tariff policy updates from RSS feeds
 * CSS COMPLIANT - Using existing classes only, NO inline styles
 *
 * Purpose: Allow admins to mark RSS feed items as "Policy Updates" that will automatically
 * update AI prompts with current 2025 tariff policy context (China +100%, port fees, etc.)
 *
 * Workflow:
 * 1. RSS feeds detect policy announcements (USTR, USITC, Commerce, FT)
 * 2. Admin reviews high-score RSS items in this interface
 * 3. Admin marks relevant items as "Policy Update"
 * 4. Admin fills in policy details (type, countries, adjustment, prompt text)
 * 5. Policy update saved to tariff_policy_updates table
 * 6. AI classification automatically reads from this table for current rates
 */

import { useState, useEffect } from 'react';
import ToastNotification, { useToast, ToastContainer } from '../shared/ToastNotification';

export default function TariffPolicyUpdatesManager() {
  // State management
  const [activeTab, setActiveTab] = useState('pending_items'); // pending_items | active_policies
  const [rssItems, setRssItems] = useState([]);
  const [activePolicies, setActivePolicies] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  // Policy form state
  const [policyForm, setPolicyForm] = useState({
    title: '',
    description: '',
    effective_date: '',
    policy_type: 'section_301',
    affected_countries: [],
    affected_hs_codes: [],
    tariff_adjustment: '',
    adjustment_percentage: '',
    prompt_text: '',
    priority: 5,
    admin_notes: ''
  });

  // Load RSS items with high crisis scores (potential policy updates)
  useEffect(() => {
    if (activeTab === 'pending_items') {
      loadHighScoreRSSItems();
    } else {
      loadActivePolicies();
    }
  }, [activeTab]);

  const loadHighScoreRSSItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/rss-policy-candidates');
      const data = await response.json();

      if (data.success) {
        setRssItems(data.items || []);
      } else {
        showToast(data.message || 'Failed to load RSS items', 'error');
      }
    } catch (error) {
      console.error('Error loading RSS items:', error);
      showToast('Error loading RSS items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadActivePolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tariff-policy-updates');
      const data = await response.json();

      if (data.success) {
        setActivePolicies(data.policies || []);
      } else {
        showToast(data.message || 'Failed to load policies', 'error');
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      showToast('Error loading policies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPolicy = (item) => {
    setSelectedItem(item);

    // Pre-fill form with RSS item data
    setPolicyForm({
      title: item.title || '',
      description: item.description || '',
      effective_date: new Date().toISOString().split('T')[0],
      policy_type: detectPolicyType(item),
      affected_countries: detectCountries(item),
      affected_hs_codes: [],
      tariff_adjustment: '',
      adjustment_percentage: '',
      prompt_text: generatePromptText(item),
      priority: 5,
      admin_notes: `Source: ${item.feed_name} - ${item.pub_date}`
    });

    setShowPolicyForm(true);
  };

  const detectPolicyType = (item) => {
    const text = (item.title + ' ' + item.description).toLowerCase();

    if (text.includes('section 301') || text.includes('section301')) return 'section_301';
    if (text.includes('port fee') || text.includes('vessel fee')) return 'port_fees';
    if (text.includes('bilateral') || text.includes('trade agreement')) return 'bilateral_deal';
    if (text.includes('investigation') || text.includes('inquiry')) return 'investigation';
    if (text.includes('antidumping') || text.includes('anti-dumping')) return 'antidumping';
    if (text.includes('countervailing')) return 'countervailing';
    if (text.includes('hts') || text.includes('hs code') || text.includes('classification')) return 'hts_classification';
    if (text.includes('usmca') || text.includes('nafta')) return 'usmca_ruling';

    return 'other';
  };

  const detectCountries = (item) => {
    const text = (item.title + ' ' + item.description).toLowerCase();
    const countries = [];

    if (text.includes('china') || text.includes('chinese')) countries.push('CN');
    if (text.includes('mexico') || text.includes('mexican')) countries.push('MX');
    if (text.includes('canada') || text.includes('canadian')) countries.push('CA');
    if (text.includes('vietnam') || text.includes('vietnamese')) countries.push('VN');
    if (text.includes('thailand')) countries.push('TH');
    if (text.includes('korea') || text.includes('korean')) countries.push('KR');
    if (text.includes('japan') || text.includes('japanese')) countries.push('JP');
    if (text.includes('germany') || text.includes('german')) countries.push('DE');
    if (text.includes('france') || text.includes('french')) countries.push('FR');
    if (text.includes('italy') || text.includes('italian')) countries.push('IT');

    return countries;
  };

  const generatePromptText = (item) => {
    const type = detectPolicyType(item);
    const countries = detectCountries(item);

    return `${item.title}: ${item.description.substring(0, 200)}... (Source: ${item.feed_name}, ${item.pub_date})`;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPolicyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountriesChange = (e) => {
    const value = e.target.value;
    const countries = value.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
    setPolicyForm(prev => ({
      ...prev,
      affected_countries: countries
    }));
  };

  const handleHSCodesChange = (e) => {
    const value = e.target.value;
    const codes = value.split(',').map(c => c.trim()).filter(c => c);
    setPolicyForm(prev => ({
      ...prev,
      affected_hs_codes: codes
    }));
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/tariff-policy-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...policyForm,
          source_rss_item_id: selectedItem?.id,
          source_url: selectedItem?.link,
          source_feed_name: selectedItem?.feed_name,
          status: 'pending' // Pending admin approval
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Policy update created successfully! Review and approve to activate.', 'success');
        setShowPolicyForm(false);
        setSelectedItem(null);
        loadHighScoreRSSItems(); // Refresh list
      } else {
        showToast(data.message || 'Failed to create policy update', 'error');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      showToast('Error creating policy update', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePolicy = async (policyId) => {
    if (!confirm('Approve this policy update? It will be included in AI prompts immediately.')) return;

    try {
      const response = await fetch(`/api/admin/tariff-policy-updates/${policyId}/approve`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Policy approved and activated!', 'success');
        loadActivePolicies();
      } else {
        showToast(data.message || 'Failed to approve policy', 'error');
      }
    } catch (error) {
      console.error('Error approving policy:', error);
      showToast('Error approving policy', 'error');
    }
  };

  const handleDeactivatePolicy = async (policyId) => {
    if (!confirm('Deactivate this policy? It will be removed from AI prompts.')) return;

    try {
      const response = await fetch(`/api/admin/tariff-policy-updates/${policyId}/deactivate`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Policy deactivated', 'success');
        loadActivePolicies();
      } else {
        showToast(data.message || 'Failed to deactivate policy', 'error');
      }
    } catch (error) {
      console.error('Error deactivating policy:', error);
      showToast('Error deactivating policy', 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">🎯 Tariff Policy Updates Manager</h2>
        <p className="card-description">
          Manage tariff policy updates from RSS feeds → AI prompts integration
        </p>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === 'pending_items' ? 'dashboard-tab-active' : 'dashboard-tab'}
          onClick={() => setActiveTab('pending_items')}
        >
          📰 RSS Items ({rssItems.length})
        </button>
        <button
          className={activeTab === 'active_policies' ? 'dashboard-tab-active' : 'dashboard-tab'}
          onClick={() => setActiveTab('active_policies')}
        >
          ✅ Active Policies ({activePolicies.filter(p => p.is_active).length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center">
          <p className="text-body">Loading...</p>
        </div>
      )}

      {/* Pending RSS Items Tab */}
      {!loading && activeTab === 'pending_items' && (
        <div className="dashboard-content">
          <div className="dashboard-actions">
            <div className="dashboard-actions-left">
              <h3 className="form-section-title">High-Score RSS Items</h3>
            </div>
            <div className="dashboard-actions-right">
              <button className="btn-secondary" onClick={loadHighScoreRSSItems}>
                🔄 Refresh
              </button>
            </div>
          </div>
          <p className="form-section-description">
            RSS items with crisis_score ≥ 7 that may indicate tariff policy changes
          </p>

          {rssItems.length === 0 ? (
            <p className="text-body">No high-score RSS items found. Check back after next RSS poll.</p>
          ) : (
            <div className="component-table-container">
              <table className="component-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Title</th>
                    <th>Score</th>
                    <th>Keywords</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rssItems.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.pub_date).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-info">{item.feed_name}</span>
                      </td>
                      <td>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="nav-link">
                          {item.title}
                        </a>
                        <p className="text-small">{item.description?.substring(0, 150)}...</p>
                      </td>
                      <td>
                        <span className={`badge ${item.crisis_score >= 8 ? 'badge-critical' : 'badge-high'}`}>
                          {item.crisis_score}
                        </span>
                      </td>
                      <td className="text-small">
                        {item.crisis_keywords_detected?.slice(0, 3).join(', ') || 'N/A'}
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          onClick={() => handleMarkAsPolicy(item)}
                        >
                          📝 Mark as Policy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Active Policies Tab */}
      {!loading && activeTab === 'active_policies' && (
        <div className="dashboard-content">
          <div className="dashboard-actions">
            <div className="dashboard-actions-left">
              <h3 className="form-section-title">Active Tariff Policies</h3>
            </div>
            <div className="dashboard-actions-right">
              <button className="btn-secondary" onClick={loadActivePolicies}>
                🔄 Refresh
              </button>
            </div>
          </div>
          <p className="form-section-description">
            These policies are currently included in AI classification prompts
          </p>

          {activePolicies.length === 0 ? (
            <p className="text-body">No active policies. Create one from RSS items.</p>
          ) : (
            <div className="component-table-container">
              <table className="component-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Countries</th>
                    <th>Adjustment</th>
                    <th>Status</th>
                    <th>Effective</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activePolicies.map(policy => (
                    <tr key={policy.id}>
                      <td>
                        <span className={`badge ${policy.priority <= 3 ? 'badge-critical' : 'badge-high'}`}>
                          {policy.priority}
                        </span>
                      </td>
                      <td>
                        <strong>{policy.title}</strong>
                        <p className="text-small">{policy.tariff_adjustment}</p>
                      </td>
                      <td className="text-small">{policy.policy_type}</td>
                      <td className="text-small">{policy.affected_countries?.join(', ') || 'N/A'}</td>
                      <td>
                        {policy.adjustment_percentage ? `${policy.adjustment_percentage}%` : 'N/A'}
                      </td>
                      <td>
                        {policy.status === 'approved' && policy.is_active ? (
                          <span className="badge badge-success">Active</span>
                        ) : policy.status === 'pending' ? (
                          <span className="badge badge-warning">Pending</span>
                        ) : (
                          <span className="badge badge-neutral">Inactive</span>
                        )}
                      </td>
                      <td className="text-small">
                        {policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {policy.status === 'pending' && (
                          <button
                            className="btn-primary"
                            onClick={() => handleApprovePolicy(policy.id)}
                          >
                            ✅ Approve
                          </button>
                        )}
                        {policy.status === 'approved' && policy.is_active && (
                          <button
                            className="btn-secondary"
                            onClick={() => handleDeactivatePolicy(policy.id)}
                          >
                            ⏸️ Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Policy Form Modal */}
      {showPolicyForm && (
        <div className="modal-overlay" onClick={() => setShowPolicyForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📝 Create Policy Update</h2>
              <button className="modal-close" onClick={() => setShowPolicyForm(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitPolicy}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={policyForm.title}
                  onChange={handleFormChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={policyForm.description}
                  onChange={handleFormChange}
                  className="form-input"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Effective Date</label>
                  <input
                    type="date"
                    name="effective_date"
                    value={policyForm.effective_date}
                    onChange={handleFormChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Policy Type *</label>
                  <select
                    name="policy_type"
                    value={policyForm.policy_type}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  >
                    <option value="section_301">Section 301</option>
                    <option value="port_fees">Port Fees</option>
                    <option value="bilateral_deal">Bilateral Deal</option>
                    <option value="investigation">Investigation</option>
                    <option value="antidumping">Antidumping</option>
                    <option value="countervailing">Countervailing</option>
                    <option value="hts_classification">HTS Classification</option>
                    <option value="usmca_ruling">USMCA Ruling</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Affected Countries (comma-separated codes: CN, MX, CA)</label>
                <input
                  type="text"
                  value={policyForm.affected_countries.join(', ')}
                  onChange={handleCountriesChange}
                  className="form-input"
                  placeholder="CN, MX, VN"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Affected HS Codes (comma-separated: 8537.10, 8542.31)</label>
                <input
                  type="text"
                  value={policyForm.affected_hs_codes.join(', ')}
                  onChange={handleHSCodesChange}
                  className="form-input"
                  placeholder="8537.10, 8542.31"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tariff Adjustment (human-readable) *</label>
                  <input
                    type="text"
                    name="tariff_adjustment"
                    value={policyForm.tariff_adjustment}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="China +100%"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Percentage (numeric)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="adjustment_percentage"
                    value={policyForm.adjustment_percentage}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="100.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">AI Prompt Text *</label>
                <textarea
                  name="prompt_text"
                  value={policyForm.prompt_text}
                  onChange={handleFormChange}
                  className="form-input"
                  rows="4"
                  required
                  placeholder="This text will be injected into AI classification prompts..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority (1=highest, 10=lowest)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  name="priority"
                  value={policyForm.priority}
                  onChange={handleFormChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin Notes</label>
                <textarea
                  name="admin_notes"
                  value={policyForm.admin_notes}
                  onChange={handleFormChange}
                  className="form-input"
                  rows="2"
                />
              </div>

              <div className="workflow-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : '✅ Create Policy Update'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPolicyForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
