/**
 * Sales Tab Content Component
 * Full sales funnel dashboard with prospects, charts, and filters
 */

import { useState, useEffect } from 'react';

export default function SalesTabContent() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProspectForm, setShowProspectForm] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [filters, setFilters] = useState({
    stage: 'all',
    country: 'all',
    industry: 'all'
  });
  const [filteredProspects, setFilteredProspects] = useState([]);

  useEffect(() => {
    fetchSalesData();

    // Load Chart.js if not already loaded
    if (!window.Chart && !chartLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = () => setChartLoaded(true);
      document.head.appendChild(script);
    } else if (window.Chart) {
      setChartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (salesData?.prospects) {
      applyFilters();
    }
  }, [salesData, filters]);

  useEffect(() => {
    if (chartLoaded && salesData) {
      renderFunnelChart();
    }
  }, [chartLoaded, salesData]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);

      // Fetch using cookie-based authentication (triangle_session cookie sent automatically)
      const response = await fetch('/api/admin/sales-data', {
        credentials: 'include' // Ensure cookies are sent
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Sales API error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch sales data: ${response.status}`);
      }

      const result = await response.json();
      console.log('Sales data loaded successfully:', result);
      setSalesData(result.data);
    } catch (err) {
      console.error('Sales data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

































  const applyFilters = () => {
    let filtered = [...salesData.prospects];

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
    const ctx = document.getElementById('salesFunnelChart');
    if (!ctx || !window.Chart) return;

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
            salesData.funnel.initial_contact,
            salesData.funnel.demo_scheduled,
            salesData.funnel.demo_completed,
            salesData.funnel.trial_active,
            salesData.funnel.negotiating,
            salesData.funnel.won,
            salesData.funnel.lost
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
      const response = await fetch('/api/admin/prospects', {
        method: 'PUT',
        credentials: 'include', // Use cookie-based auth
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: prospectId, stage: newStage })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prospect stage');
      }

      fetchSalesData(); // Refresh data
    } catch (err) {
      alert('Error updating stage: ' + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading sales data...</div>;
  }

  if (!salesData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>No sales data available</div>;
  }

  const { funnel, revenue, prospects } = salesData;
  const totalProspects = Object.values(funnel).reduce((sum, count) => sum + count, 0);
  const conversionRate = totalProspects > 0 ? ((funnel.won / totalProspects) * 100).toFixed(1) : 0;

  const countries = ['all', ...new Set(prospects.map(p => p.country).filter(Boolean))];
  const industries = ['all', ...new Set(prospects.map(p => p.industry).filter(Boolean))];

  return (
    <div>
      {/* Add Prospect Button */}
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button
          onClick={() => setShowProspectForm(!showProspectForm)}
          className="btn-primary"
          style={{ padding: '10px 20px' }}
        >
          {showProspectForm ? '× Cancel' : '+ Add Prospect'}
        </button>
      </div>

      {/* Inline Prospect Form */}
      {showProspectForm && (
        <ProspectFormInline
          onClose={() => setShowProspectForm(false)}
          onSuccess={() => {
            setShowProspectForm(false);
            fetchSalesData();
          }}
        />
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '8px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#16A34A', marginBottom: '10px' }}>Total Prospects</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803D' }}>{totalProspects}</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '8px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#2563EB', marginBottom: '10px' }}>Won Deals</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1E40AF' }}>{funnel.won}</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #FDE68A',
          borderRadius: '8px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#D97706', marginBottom: '10px' }}>Conversion Rate</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#B45309' }}>{conversionRate}%</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#F5F3FF',
          border: '1px solid #DDD6FE',
          borderRadius: '8px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#7C3AED', marginBottom: '10px' }}>MRR</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6D28D9' }}>${revenue.mrr.toLocaleString()}</p>
        </div>
      </div>

      {/* Funnel Chart */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        marginBottom: '30px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Sales Funnel Visualization</h3>
        <div style={{ height: '300px', position: 'relative' }}>
          <canvas id="salesFunnelChart"></canvas>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Prospects</h3>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>Stage:</label>
            <select
              className="form-input"
              value={filters.stage}
              onChange={(e) => setFilters({...filters, stage: e.target.value})}
              style={{ width: '150px' }}
            >
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

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>Country:</label>
            <select
              className="form-input"
              value={filters.country}
              onChange={(e) => setFilters({...filters, country: e.target.value})}
              style={{ width: '150px' }}
            >
              {countries.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Countries' : c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>Industry:</label>
            <select
              className="form-input"
              value={filters.industry}
              onChange={(e) => setFilters({...filters, industry: e.target.value})}
              style={{ width: '150px' }}
            >
              {industries.map(i => (
                <option key={i} value={i}>{i === 'all' ? 'All Industries' : i}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prospects Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Company</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Stage</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Move To</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Deal Value</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map(prospect => (
                <tr key={prospect.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px' }}>{prospect.name}</td>
                  <td style={{ padding: '12px' }}>{prospect.company || '-'}</td>
                  <td style={{ padding: '12px' }}>{prospect.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: prospect.stage === 'won' ? '#C6F6D5' :
                                     prospect.stage === 'lost' ? '#FED7D7' :
                                     prospect.stage === 'trial_active' ? '#C6F6D5' : '#BEE3F8',
                      color: prospect.stage === 'won' ? '#22543D' :
                             prospect.stage === 'lost' ? '#742A2A' :
                             prospect.stage === 'trial_active' ? '#22543D' : '#2C5282'
                    }}>
                      {prospect.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select
                      className="form-input"
                      value={prospect.stage}
                      onChange={(e) => handleStageChange(prospect.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '13px' }}
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
                  <td style={{ padding: '12px' }}>
                    ${prospect.deal_value ? prospect.deal_value.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>{prospect.last_contact_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Prospect Form Modal Component
function ProspectFormInline({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    stage: 'initial_contact',
    deal_value: '',
    expected_close_date: '',
    country: '',
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
      const response = await fetch('/api/admin/prospects', {
        method: 'POST',
        credentials: 'include', // Use cookie-based auth
        headers: {
          'Content-Type': 'application/json'
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
    <div
      style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '2px solid #3B82F6',
        marginBottom: '30px'
      }}
    >
      <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1F2937' }}>
        Add New Prospect
      </h3>

      <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              backgroundColor: '#FED7D7',
              color: '#742A2A',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '15px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label className="form-label">Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label className="form-label">Company</label>
              <input
                type="text"
                name="company"
                className="form-input"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label className="form-label">Stage</label>
              <select name="stage" className="form-input" value={formData.stage} onChange={handleChange}>
                <option value="initial_contact">Initial Contact</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="demo_completed">Demo Completed</option>
                <option value="trial_active">Trial Active</option>
                <option value="negotiating">Negotiating</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="form-label">Deal Value ($)</label>
              <input
                type="number"
                name="deal_value"
                className="form-input"
                value={formData.deal_value}
                onChange={handleChange}
                placeholder="12000"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label className="form-label">Industry</label>
              <select name="industry" className="form-input" value={formData.industry} onChange={handleChange}>
                <option value="">Select industry</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Automotive">Automotive</option>
                <option value="Chemicals">Chemicals</option>
                <option value="Electronics">Electronics</option>
                <option value="Machinery">Machinery</option>
                <option value="Metals">Metals</option>
                <option value="Textiles">Textiles</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Country</label>
              <select name="country" className="form-input" value={formData.country} onChange={handleChange}>
                <option value="">Select country</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-input"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Add any additional notes..."
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Prospect'}
            </button>
          </div>
        </form>
    </div>
  );
}
