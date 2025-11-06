/**
 * Admin Dashboard - ENHANCED
 * Features: Prospect forms, stage progression, charts, filters
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('sales');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (!data.profile?.is_admin) {
        alert('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }

      setIsAdmin(true);
    } catch (err) {
      console.error('Admin access check failed:', err);
      router.push('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/sales-data', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
      setError(null);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="loading-container">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading dashboard: {error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Triangle Intelligence</title>
      </Head>

      {/* Chart.js CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"
        onLoad={() => setChartLoaded(true)}
      />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="subtitle">Sales tracking, user management, and activity monitoring</p>
          </div>
          {activeTab === 'sales' && (
            <button
              className="btn-primary"
              onClick={() => setShowProspectForm(true)}
            >
              + Add Prospect
            </button>
          )}
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales Funnel
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'sales' && (
            <SalesTab
              data={dashboardData}
              onRefresh={fetchDashboardData}
              chartLoaded={chartLoaded}
            />
          )}
          {activeTab === 'users' && <UsersTab data={dashboardData} />}
          {activeTab === 'activity' && <ActivityTab data={dashboardData} />}
        </div>

        {/* Prospect Form Modal */}
        {showProspectForm && (
          <ProspectFormModal
            onClose={() => setShowProspectForm(false)}
            onSuccess={() => {
              setShowProspectForm(false);
              fetchDashboardData();
            }}
          />
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #718096;
          font-size: 1rem;
        }

        .tab-navigation {
          display: flex;
          gap: 1rem;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 2rem;
        }

        .tab-button {
          padding: 1rem 2rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 1rem;
          font-weight: 600;
          color: #718096;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #2d3748;
          border-bottom-color: #cbd5e0;
        }

        .tab-button.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        .tab-content {
          min-height: 600px;
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary:hover {
          background-color: #1d4ed8;
        }
      `}</style>
    </>
  );
}

// Prospect Form Modal
function ProspectFormModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    stage: 'initial_contact',
    deal_value: '',
    expected_close_date: '',
    country: 'US',
    industry: '',
    lead_source: 'manual',
    assigned_to: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create prospect');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Prospect</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="prospect-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stage</label>
              <select name="stage" value={formData.stage} onChange={handleChange}>
                <option value="initial_contact">Initial Contact</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="demo_completed">Demo Completed</option>
                <option value="trial_active">Trial Active</option>
                <option value="negotiating">Negotiating</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deal Value ($)</label>
              <input
                type="number"
                name="deal_value"
                value={formData.deal_value}
                onChange={handleChange}
                placeholder="12000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expected Close Date</label>
              <input
                type="date"
                name="expected_close_date"
                value={formData.expected_close_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <select name="country" value={formData.country} onChange={handleChange}>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Electronics, Automotive"
              />
            </div>
            <div className="form-group">
              <label>Lead Source</label>
              <select name="lead_source" value={formData.lead_source} onChange={handleChange}>
                <option value="manual">Manual Entry</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="outbound">Outbound</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Assigned To</label>
            <input
              type="text"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              placeholder="Sales rep name"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Prospect'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 0.5rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          color: #718096;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 2rem;
          height: 2rem;
        }

        .close-button:hover {
          color: #2d3748;
        }

        .prospect-form {
          padding: 1.5rem;
        }

        .error-message {
          background-color: #fed7d7;
          color: #742a2a;
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4a5568;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #1d4ed8;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background-color: white;
          color: #4a5568;
          border: 1px solid #cbd5e0;
          border-radius: 0.375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background-color: #f7fafc;
          border-color: #a0aec0;
        }
      `}</style>
    </div>
  );
}

// Sales Funnel Tab (Enhanced)
function SalesTab({ data, onRefresh, chartLoaded }) {
  const [filters, setFilters] = useState({
    stage: 'all',
    country: 'all',
    industry: 'all'
  });
  const [filteredProspects, setFilteredProspects] = useState([]);

  useEffect(() => {
    if (data?.prospects) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters]);

  useEffect(() => {
    if (chartLoaded && data) {
      renderFunnelChart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartLoaded, data]);

  const applyFilters = () => {
    let filtered = [...data.prospects];

    if (filters.stage !== 'all') {
      filtered = filtered.filter(p => p.stage === filters.stage);
    }
    if (filters.country !== 'all') {
      filtered = filtered.filter(p => p.country === filters.country);
    }
    if (filters.industry !== 'all') {
      filtered = filtered.filter(p => p.industry === filters.industry);
    }

    setFilteredProspects(filtered);
  };

  const renderFunnelChart = () => {
    const ctx = document.getElementById('funnelChart');
    if (!ctx || !window.Chart) return;

    // Destroy existing chart
    const existingChart = window.Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Initial', 'Demo Scheduled', 'Demo Done', 'Trial', 'Negotiating', 'Won', 'Lost'],
        datasets: [{
          label: 'Prospects',
          data: [
            data.funnel.initial_contact,
            data.funnel.demo_scheduled,
            data.funnel.demo_completed,
            data.funnel.trial_active,
            data.funnel.negotiating,
            data.funnel.won,
            data.funnel.lost
          ],
          backgroundColor: [
            '#94a3b8',
            '#60a5fa',
            '#3b82f6',
            '#10b981',
            '#fbbf24',
            '#22c55e',
            '#ef4444'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  };

  const handleStageChange = async (prospectId, newStage) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/prospects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: prospectId, stage: newStage })
      });

      if (!response.ok) {
        throw new Error('Failed to update prospect stage');
      }

      onRefresh();
    } catch (err) {
      alert('Error updating stage: ' + err.message);
    }
  };

  if (!data) return <p>Loading sales data...</p>;

  const { funnel, revenue } = data;
  const totalProspects = Object.values(funnel).reduce((sum, count) => sum + count, 0);
  const conversionRate = totalProspects > 0 ? ((funnel.won / totalProspects) * 100).toFixed(1) : 0;

  // Get unique values for filters
  const countries = ['all', ...new Set(data.prospects.map(p => p.country).filter(Boolean))];
  const industries = ['all', ...new Set(data.prospects.map(p => p.industry).filter(Boolean))];

  return (
    <div className="sales-tab">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Prospects</h3>
          <p className="kpi-value">{totalProspects}</p>
        </div>
        <div className="kpi-card">
          <h3>Won Deals</h3>
          <p className="kpi-value">{funnel.won}</p>
        </div>
        <div className="kpi-card">
          <h3>Conversion Rate</h3>
          <p className="kpi-value">{conversionRate}%</p>
        </div>
        <div className="kpi-card">
          <h3>Monthly Recurring Revenue</h3>
          <p className="kpi-value">${revenue.mrr.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="section">
        <h2>Sales Funnel Visualization</h2>
        <div style={{ height: '300px', position: 'relative' }}>
          <canvas id="funnelChart"></canvas>
        </div>
      </div>

      {/* Filters */}
      <div className="section">
        <h2>Prospects</h2>
        <div className="filters">
          <div className="filter-group">
            <label>Stage:</label>
            <select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})}>
              <option value="all">All Stages</option>
              <option value="initial_contact">Initial Contact</option>
              <option value="demo_scheduled">Demo Scheduled</option>
              <option value="demo_completed">Demo Completed</option>
              <option value="trial_active">Trial Active</option>
              <option value="negotiating">Negotiating</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Country:</label>
            <select value={filters.country} onChange={(e) => setFilters({...filters, country: e.target.value})}>
              {countries.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Countries' : c}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Industry:</label>
            <select value={filters.industry} onChange={(e) => setFilters({...filters, industry: e.target.value})}>
              {industries.map(i => (
                <option key={i} value={i}>{i === 'all' ? 'All Industries' : i}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prospects Table */}
        <div className="table-container">
          <table className="prospects-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Stage</th>
                <th>Actions</th>
                <th>Deal Value</th>
                <th>Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map(prospect => (
                <tr key={prospect.id}>
                  <td>{prospect.name}</td>
                  <td>{prospect.company || '-'}</td>
                  <td>{prospect.email}</td>
                  <td>
                    <span className={`badge badge-${prospect.stage}`}>
                      {prospect.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <select
                      className="stage-selector"
                      value={prospect.stage}
                      onChange={(e) => handleStageChange(prospect.id, e.target.value)}
                    >
                      <option value="initial_contact">Initial Contact</option>
                      <option value="demo_scheduled">Demo Scheduled</option>
                      <option value="demo_completed">Demo Completed</option>
                      <option value="trial_active">Trial Active</option>
                      <option value="negotiating">Negotiating</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                  <td>${prospect.deal_value ? prospect.deal_value.toLocaleString() : '-'}</td>
                  <td>{prospect.last_contact_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .sales-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .kpi-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .kpi-card h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
        }

        .section {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 1rem;
        }

        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4a5568;
        }

        .filter-group select {
          padding: 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .prospects-table {
          width: 100%;
          border-collapse: collapse;
        }

        .prospects-table th,
        .prospects-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .prospects-table th {
          font-weight: 600;
          color: #4a5568;
          background-color: #f7fafc;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .badge-initial_contact {
          background-color: #e2e8f0;
          color: #2d3748;
        }

        .badge-demo_scheduled,
        .badge-demo_completed {
          background-color: #bee3f8;
          color: #2c5282;
        }

        .badge-trial_active {
          background-color: #c6f6d5;
          color: #22543d;
        }

        .badge-negotiating {
          background-color: #fefcbf;
          color: #744210;
        }

        .badge-won {
          background-color: #c6f6d5;
          color: #22543d;
        }

        .badge-lost {
          background-color: #fed7d7;
          color: #742a2a;
        }

        .stage-selector {
          padding: 0.25rem 0.5rem;
          border: 1px solid #cbd5e0;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .stage-selector:focus {
          outline: none;
          border-color: #2563eb;
        }
      `}</style>
    </div>
  );
}

// Users Tab (unchanged)
function UsersTab({ data }) {
  if (!data) return <p>Loading user data...</p>;

  const { users, recentUsers } = data;

  return (
    <div className="users-tab">
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Users</h3>
          <p className="kpi-value">{users.total}</p>
        </div>
        <div className="kpi-card">
          <h3>Trial Users</h3>
          <p className="kpi-value">{users.trial}</p>
        </div>
        <div className="kpi-card">
          <h3>Paid Users</h3>
          <p className="kpi-value">{users.starter + users.professional + users.premium}</p>
        </div>
        <div className="kpi-card">
          <h3>Active Status</h3>
          <p className="kpi-value">{users.active}</p>
        </div>
      </div>

      <div className="section">
        <h2>Subscription Breakdown</h2>
        <div className="tier-grid">
          <div className="tier-card">
            <h3>Starter</h3>
            <p className="tier-count">{users.starter} users</p>
            <p className="tier-price">$99/mo</p>
          </div>
          <div className="tier-card">
            <h3>Professional</h3>
            <p className="tier-count">{users.professional} users</p>
            <p className="tier-price">$299/mo</p>
          </div>
          <div className="tier-card">
            <h3>Premium</h3>
            <p className="tier-count">{users.premium} users</p>
            <p className="tier-price">$799/mo</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Recent Users</h2>
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Analyses</th>
                <th>Workflows</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name || '-'}</td>
                  <td>{user.company_name || '-'}</td>
                  <td>
                    <span className={`badge badge-tier-${user.subscription_tier.toLowerCase()}`}>
                      {user.subscription_tier}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-status-${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.analyses_this_month}</td>
                  <td>{user.workflow_completions}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .users-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .kpi-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .kpi-card h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
        }

        .section {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 1rem;
        }

        .tier-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .tier-card {
          background: #f7fafc;
          padding: 1.5rem;
          border-radius: 0.375rem;
          border: 2px solid #e2e8f0;
        }

        .tier-card h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .tier-count {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 0.25rem;
        }

        .tier-price {
          font-size: 0.875rem;
          color: #718096;
        }

        .table-container {
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .users-table th,
        .users-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .users-table th {
          font-weight: 600;
          color: #4a5568;
          background-color: #f7fafc;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .badge-tier-trial {
          background-color: #e2e8f0;
          color: #2d3748;
        }

        .badge-tier-starter {
          background-color: #bee3f8;
          color: #2c5282;
        }

        .badge-tier-professional {
          background-color: #c6f6d5;
          color: #22543d;
        }

        .badge-tier-premium {
          background-color: #fef5e7;
          color: #78350f;
        }

        .badge-status-active {
          background-color: #c6f6d5;
          color: #22543d;
        }

        .badge-status-trial {
          background-color: #bee3f8;
          color: #2c5282;
        }

        .badge-status-trial_expired {
          background-color: #fed7d7;
          color: #742a2a;
        }
      `}</style>
    </div>
  );
}

// Activity Tab (unchanged)
function ActivityTab({ data }) {
  if (!data) return <p>Loading activity data...</p>;

  const { activity, recentWorkflows } = data;

  return (
    <div className="activity-tab">
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Workflows (30 days)</h3>
          <p className="kpi-value">{activity.workflows_30d}</p>
        </div>
        <div className="kpi-card">
          <h3>Workflows (7 days)</h3>
          <p className="kpi-value">{activity.workflows_7d}</p>
        </div>
        <div className="kpi-card">
          <h3>Qualified (30 days)</h3>
          <p className="kpi-value">{activity.qualified_30d}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Savings (30 days)</h3>
          <p className="kpi-value">${activity.total_savings_30d.toLocaleString()}</p>
        </div>
      </div>

      <div className="section">
        <h2>Recent Workflow Completions</h2>
        <div className="table-container">
          <table className="workflows-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Status</th>
                <th>Estimated Savings</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {recentWorkflows.map(workflow => (
                <tr key={workflow.id}>
                  <td>{workflow.company_name || 'Unknown'}</td>
                  <td>
                    <span className={`badge badge-${workflow.qualification_status?.toLowerCase()}`}>
                      {workflow.qualification_status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    ${workflow.estimated_annual_savings
                      ? parseFloat(workflow.estimated_annual_savings).toLocaleString()
                      : '0'}
                  </td>
                  <td>{new Date(workflow.completed_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .activity-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .kpi-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .kpi-card h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
        }

        .section {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 1rem;
        }

        .table-container {
          overflow-x: auto;
        }

        .workflows-table {
          width: 100%;
          border-collapse: collapse;
        }

        .workflows-table th,
        .workflows-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .workflows-table th {
          font-weight: 600;
          color: #4a5568;
          background-color: #f7fafc;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .badge-qualified {
          background-color: #c6f6d5;
          color: #22543d;
        }

        .badge-not_qualified {
          background-color: #fed7d7;
          color: #742a2a;
        }

        .badge-pending {
          background-color: #e2e8f0;
          color: #2d3748;
        }
      `}</style>
    </div>
  );
}
