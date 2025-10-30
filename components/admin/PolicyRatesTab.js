import { useState, useEffect } from 'react';

export default function PolicyRatesTab() {
  const [policyRates, setPolicyRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, stale: 0, fresh: 0 });
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showSingleUpdate, setShowSingleUpdate] = useState(false);
  const [bulkUpdateForm, setBulkUpdateForm] = useState({
    policy_type: 'section_301',
    from_rate: '',
    to_rate: '',
    country_filter: 'CN'
  });
  const [singleUpdateForm, setSingleUpdateForm] = useState({
    hs_code: '',
    section_301: '',
    section_232: '',
    ieepa_reciprocal: '',
    expiration_days: 7
  });

  useEffect(() => {
    fetchPolicyRates();
  }, []);

  const fetchPolicyRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/policy-rates/list');
      const data = await response.json();

      if (response.ok) {
        setPolicyRates(data.rates || []);
        setStats(data.stats || { total: 0, stale: 0, fresh: 0 });
      } else {
        console.error('Failed to fetch policy rates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching policy rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    if (!confirm(`Update all ${bulkUpdateForm.policy_type} rates from ${bulkUpdateForm.from_rate}% → ${bulkUpdateForm.to_rate}% for ${bulkUpdateForm.country_filter} products?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/policy-rates/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkUpdateForm)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Updated ${data.updated_count} HS codes`);
        setShowBulkUpdate(false);
        fetchPolicyRates();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('❌ Failed to update rates');
    }
  };

  const handleSingleUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/policy-rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleUpdateForm)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Updated HS ${singleUpdateForm.hs_code}`);
        setShowSingleUpdate(false);
        setSingleUpdateForm({
          hs_code: '',
          section_301: '',
          section_232: '',
          ieepa_reciprocal: '',
          expiration_days: 7
        });
        fetchPolicyRates();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Single update error:', error);
      alert('❌ Failed to update rate');
    }
  };

  if (loading) {
    return (
      <div className="form-section">
        <div className="hero-badge">Loading policy rates...</div>
      </div>
    );
  }

  return (
    <div className="form-section">
      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="stat-card" style={{
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            Total Policy Rates
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#111827' }}>
            {stats.total}
          </div>
        </div>

        <div className="stat-card" style={{
          padding: '20px',
          background: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '8px' }}>
            Stale Rates (Need Update)
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#dc2626' }}>
            {stats.stale}
          </div>
        </div>

        <div className="stat-card" style={{
          padding: '20px',
          background: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ fontSize: '14px', color: '#166534', marginBottom: '8px' }}>
            Fresh Rates
          </div>
          <div style={{ fontSize: '32px', fontWeight: '600', color: '#16a34a' }}>
            {stats.fresh}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setShowBulkUpdate(!showBulkUpdate)}
          className="btn-primary"
          style={{ padding: '12px 24px' }}
        >
          {showBulkUpdate ? 'Hide' : 'Bulk Update'}
        </button>

        <button
          onClick={() => setShowSingleUpdate(!showSingleUpdate)}
          className="btn-secondary"
          style={{
            padding: '12px 24px',
            background: '#fff',
            border: '1px solid #d1d5db',
            color: '#374151'
          }}
        >
          {showSingleUpdate ? 'Hide' : 'Single HS Code Update'}
        </button>

        <button
          onClick={fetchPolicyRates}
          className="btn-secondary"
          style={{
            padding: '12px 24px',
            background: '#fff',
            border: '1px solid #d1d5db',
            color: '#374151'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Bulk Update Form */}
      {showBulkUpdate && (
        <div style={{
          padding: '24px',
          background: '#fffbeb',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 className="form-section-title" style={{ marginBottom: '16px' }}>
            Bulk Update Policy Rates
          </h3>

          <form onSubmit={handleBulkUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Policy Type</label>
                <select
                  className="form-select"
                  value={bulkUpdateForm.policy_type}
                  onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, policy_type: e.target.value })}
                  required
                >
                  <option value="section_301">Section 301 (China)</option>
                  <option value="section_232">Section 232 (Steel/Aluminum)</option>
                  <option value="ieepa_reciprocal">IEEPA Reciprocal</option>
                </select>
              </div>

              <div>
                <label className="form-label">Country Filter</label>
                <select
                  className="form-select"
                  value={bulkUpdateForm.country_filter}
                  onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, country_filter: e.target.value })}
                  required
                >
                  <option value="CN">China (CN)</option>
                  <option value="ALL">All Countries</option>
                </select>
              </div>

              <div>
                <label className="form-label">Current Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="25"
                  step="0.01"
                  value={bulkUpdateForm.from_rate}
                  onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, from_rate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">New Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="30"
                  step="0.01"
                  value={bulkUpdateForm.to_rate}
                  onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, to_rate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary">
                Apply Bulk Update
              </button>
              <button
                type="button"
                onClick={() => setShowBulkUpdate(false)}
                className="btn-secondary"
                style={{
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Single Update Form */}
      {showSingleUpdate && (
        <div style={{
          padding: '24px',
          background: '#f0f9ff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 className="form-section-title" style={{ marginBottom: '16px' }}>
            Update Single HS Code
          </h3>

          <form onSubmit={handleSingleUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">HS Code (8 digits)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="85423100"
                  pattern="[0-9]{8}"
                  value={singleUpdateForm.hs_code}
                  onChange={(e) => setSingleUpdateForm({ ...singleUpdateForm, hs_code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Expiration (days)</label>
                <select
                  className="form-select"
                  value={singleUpdateForm.expiration_days}
                  onChange={(e) => setSingleUpdateForm({ ...singleUpdateForm, expiration_days: parseInt(e.target.value) })}
                >
                  <option value="3">3 days (IEEPA)</option>
                  <option value="7">7 days (Section 301)</option>
                  <option value="30">30 days (Section 232)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Section 301 Rate (decimal)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.25 (for 25%)"
                  step="0.01"
                  min="0"
                  max="1"
                  value={singleUpdateForm.section_301}
                  onChange={(e) => setSingleUpdateForm({ ...singleUpdateForm, section_301: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Section 232 Rate (decimal)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.10 (for 10%)"
                  step="0.01"
                  min="0"
                  max="1"
                  value={singleUpdateForm.section_232}
                  onChange={(e) => setSingleUpdateForm({ ...singleUpdateForm, section_232: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">IEEPA Reciprocal Rate (decimal)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.15 (for 15%)"
                  step="0.01"
                  min="0"
                  max="1"
                  value={singleUpdateForm.ieepa_reciprocal}
                  onChange={(e) => setSingleUpdateForm({ ...singleUpdateForm, ieepa_reciprocal: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary">
                Update HS Code
              </button>
              <button
                type="button"
                onClick={() => setShowSingleUpdate(false)}
                className="btn-secondary"
                style={{
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policy Rates Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>HS Code</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Section 301</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Section 232</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>IEEPA</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Verified</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Expires</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {policyRates.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                  No policy rates found. Policy rates are created when AI discovers Section 301/232 tariffs.
                </td>
              </tr>
            )}

            {policyRates.map((rate) => (
              <tr key={rate.id} style={{
                borderBottom: '1px solid #e5e7eb',
                background: rate.is_stale ? '#fef2f2' : '#fff'
              }}>
                <td style={{ padding: '12px', fontFamily: 'monospace' }}>{rate.hs_code}</td>
                <td style={{ padding: '12px' }}>
                  {rate.section_301 > 0 ? `${(rate.section_301 * 100).toFixed(1)}%` : '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {rate.section_232 > 0 ? `${(rate.section_232 * 100).toFixed(1)}%` : '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {rate.ieepa_reciprocal > 0 ? `${(rate.ieepa_reciprocal * 100).toFixed(1)}%` : '-'}
                </td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                  {rate.verified_date}
                </td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                  {new Date(rate.expires_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px' }}>
                  {rate.is_stale ? (
                    <span style={{
                      padding: '4px 8px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      STALE
                    </span>
                  ) : (
                    <span style={{
                      padding: '4px 8px',
                      background: '#dcfce7',
                      color: '#166534',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      FRESH
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
