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
      {/* Compact horizontal status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: '#111827' }}>
            📡 Real-Time Policy Monitoring
          </h2>
          <span style={{
            background: '#dc2626',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.5px',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            boxShadow: '0 0 8px rgba(220, 38, 38, 0.4)'
          }}>
            🔴 LIVE
          </span>
        </div>

        {/* Compact inline stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <div>
            <span style={{ fontWeight: 600, color: '#111827' }}>{monitoringData.lastScan ? getTimeAgo(monitoringData.lastScan) : 'Pending'}</span>
            <span style={{ marginLeft: '0.25rem' }}>last scan</span>
          </div>
          <div style={{ width: '1px', height: '1rem', background: '#e5e7eb' }}></div>
          <div>
            <span style={{ fontWeight: 600, color: '#111827' }}>{monitoringData.htsCodesMonitored || 0}</span>
            <span style={{ marginLeft: '0.25rem' }}>HS codes</span>
          </div>
          <div style={{ width: '1px', height: '1rem', background: '#e5e7eb' }}></div>
          <div>
            <span style={{ fontWeight: 600, color: '#111827' }}>{monitoringData.dataSourcesChecked?.length || 0}</span>
            <span style={{ marginLeft: '0.25rem' }}>sources</span>
          </div>
          <div style={{ width: '1px', height: '1rem', background: '#e5e7eb' }}></div>
          <div>
            <span style={{ fontWeight: 600, color: '#111827' }}>{monitoringData.alertsGenerated || 0}</span>
            <span style={{ marginLeft: '0.25rem' }}>alerts</span>
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
    </div>
  );
}
