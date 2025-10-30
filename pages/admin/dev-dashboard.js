import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSimpleAuth } from '../../lib/contexts/SimpleAuthContext';
import TriangleLayout from '../../components/TriangleLayout';
import PolicyRatesTab from '../../components/admin/PolicyRatesTab';

export default function AdminDevDashboard() {
  const router = useRouter();
  const { user, loading } = useSimpleAuth();
  const [activeTab, setActiveTab] = useState('policy-rates');

  // Check admin access
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/admin/dev-dashboard');
    } else if (!loading && user && !user.isAdmin) {
      console.error('❌ Access denied: User is not admin');
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="main-content">
        <div className="container-app">
          <div className="hero-badge">Access denied</div>
        </div>
      </div>
    );
  }

  return (
    <TriangleLayout>
      <Head>
        <title>Admin Dev Dashboard - Triangle Intelligence</title>
      </Head>

      <div className="main-content">
        <div className="container-app">
          {/* Header */}
          <div className="dashboard-actions">
            <div className="dashboard-actions-left">
              <h1 className="form-section-title">Admin Dev Dashboard</h1>
              <p style={{ marginTop: '8px', color: '#666' }}>
                Monitor and manage platform data
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tabs-container" style={{
            borderBottom: '2px solid #e5e7eb',
            marginTop: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setActiveTab('policy-rates')}
                className={activeTab === 'policy-rates' ? 'tab-active' : 'tab-inactive'}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: activeTab === 'policy-rates' ? '600' : '400',
                  color: activeTab === 'policy-rates' ? '#1e40af' : '#6b7280',
                  borderBottom: activeTab === 'policy-rates' ? '2px solid #1e40af' : 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Policy Rates
              </button>

              <button
                onClick={() => setActiveTab('system-stats')}
                className={activeTab === 'system-stats' ? 'tab-active' : 'tab-inactive'}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: activeTab === 'system-stats' ? '600' : '400',
                  color: activeTab === 'system-stats' ? '#1e40af' : '#6b7280',
                  borderBottom: activeTab === 'system-stats' ? '2px solid #1e40af' : 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                System Stats
              </button>

              <button
                onClick={() => setActiveTab('dev-issues')}
                className={activeTab === 'dev-issues' ? 'tab-active' : 'tab-inactive'}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: activeTab === 'dev-issues' ? '600' : '400',
                  color: activeTab === 'dev-issues' ? '#1e40af' : '#6b7280',
                  borderBottom: activeTab === 'dev-issues' ? '2px solid #1e40af' : 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Dev Issues
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'policy-rates' && <PolicyRatesTab />}

            {activeTab === 'system-stats' && (
              <div className="form-section">
                <h3 className="form-section-title">System Statistics</h3>
                <p style={{ color: '#666' }}>Coming soon...</p>
              </div>
            )}

            {activeTab === 'dev-issues' && (
              <div className="form-section">
                <h3 className="form-section-title">Development Issues</h3>
                <p style={{ color: '#666' }}>Coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TriangleLayout>
  );
}
