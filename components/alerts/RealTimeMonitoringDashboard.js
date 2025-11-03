/**
 * Real-Time Monitoring Dashboard - COMPACT VERSION
 * Shows monitoring activity without wasting vertical space
 * Removed: Large data sources box, verbose email settings, redundant alerts list
 * Note: Alerts now display ONLY in the Component Tariff Intelligence table below
 */

import React, { useState, useEffect } from 'react';

export default function RealTimeMonitoringDashboard({ userProfile }) {
  const [monitoringData, setMonitoringData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  useEffect(() => {
    if (userProfile?.componentOrigins) {
      fetchRealTimeData();
    } else {
      // No component data - stop loading
      setIsLoading(false);
    }
  }, [userProfile]);

  const fetchRealTimeData = async () => {
    setIsLoading(true);
    try {
      // ✅ FETCH REAL RSS MONITORING STATS FROM DATABASE
      const statsResponse = await fetch('/api/rss-monitoring-stats', {
        credentials: 'include'
      });

      if (!statsResponse.ok) {
        throw new Error(`HTTP ${statsResponse.status}: ${statsResponse.statusText}`);
      }

      const data = await statsResponse.json();

      // Set real monitoring data
      setMonitoringData(data);

      console.log('✅ Loaded real RSS monitoring stats:', data);
    } catch (error) {
      console.error('❌ Failed to load RSS monitoring stats:', error);

      // Show error state instead of fake data
      setMonitoringData(null);
      setCensusAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="alert alert-info">
        <div className="alert-content">
          <div className="alert-title">🔄 Loading real-time monitoring data...</div>
        </div>
      </div>
    );
  }

  if (!monitoringData) {
    // Show message if no workflow data available
    if (!userProfile?.componentOrigins || userProfile.componentOrigins.length === 0) {
      return (
        <div className="form-section">
          <h2 className="form-section-title">📡 Real-Time Monitoring Activity</h2>
          <div className="alert alert-warning">
            <div className="alert-content">
              <div className="alert-title">Complete Your USMCA Analysis First</div>
              <div className="text-body">
                To start real-time monitoring with government data, complete the USMCA workflow with your components. We'll then track import volumes, policy changes, and supply chain risks specific to your HS codes.
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Format timestamp to show how recent
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const scanTime = new Date(timestamp);
    const diffMs = now - scanTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const urgencyColors = {
    high: '#dc2626',
    medium: '#f59e0b',
    low: '#10b981'
  };

  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              📡 Real-Time Policy Monitoring
            </h2>
            <span style={{
              background: '#dc2626',
              color: 'white',
              padding: '0.35rem 0.85rem',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
            }}>
              🔴 LIVE
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
            Last Update
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669' }}>
            {monitoringData.lastScan ? getTimeAgo(monitoringData.lastScan) : 'Pending'}
          </div>
        </div>
      </div>

      {/* Add CSS animation for pulse effect */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .7;
          }
        }
      `}</style>

      <div className="status-grid" style={{ marginTop: '1rem' }}>
        <div className="status-card">
          <div className="status-label">Last Scan</div>
          <div className="status-value" style={{ color: '#059669' }}>
            {monitoringData.lastScan ? getTimeAgo(monitoringData.lastScan) : 'Pending'}
          </div>
          <p className="form-help">
            {monitoringData.lastScan ? new Date(monitoringData.lastScan).toLocaleString() : 'No scans yet'}
          </p>
        </div>

        <div className="status-card">
          <div className="status-label">HS Codes Monitored</div>
          <div className="status-value">{monitoringData.htsCodesMonitored || 0}</div>
          <p className="form-help">Your component HS codes</p>
        </div>

        <div className="status-card">
          <div className="status-label">Data Sources</div>
          <div className="status-value">{monitoringData.dataSourcesChecked?.length || 0}</div>
          <p className="form-help">
            {monitoringData.dataSourcesChecked?.length > 0
              ? monitoringData.dataSourcesChecked.join(', ')
              : 'Configuring sources...'}
          </p>
        </div>

        <div className="status-card">
          <div className="status-label">Alerts This Month</div>
          <div className="status-value">{monitoringData.alertsGenerated || 0}</div>
          <p className="form-help">
            From {(monitoringData.thisMonth?.totalScans || 0).toLocaleString()} scans
          </p>
        </div>
      </div>


      {/* Compact Email Settings - Collapsible */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
        <button
          onClick={() => setShowEmailSettings(!showEmailSettings)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '0.875rem',
            color: '#3b82f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📧 Email Notification Settings {showEmailSettings ? '▼' : '▶'}
        </button>

        {showEmailSettings && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', paddingLeft: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={true} style={{ marginRight: '0.5rem' }} />
              <span>Email me when import volume changes detected</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked={true} style={{ marginRight: '0.5rem' }} />
              <span>Email me when supply concentration risks identified</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
