/**
 * System Status Dashboard
 * Real-time monitoring of platform health and connectivity
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../components/TriangleLayout';

const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const XCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const Database = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const Server = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

export default function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/system-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (statusText) => {
    if (statusText?.includes('✅')) return <CheckCircle className="icon-success" />;
    if (statusText?.includes('⚠️')) return <AlertCircle className="icon-warning" />;
    if (statusText?.includes('❌')) return <XCircle className="icon-danger" />;
    return null;
  };

  const getHealthColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    if (score >= 50) return '#ef4444';
    return '#6b7280';
  };

  if (isLoading) {
    return (
      <TriangleLayout>
        <div className="dashboard-container">
          <h1 className="dashboard-title">System Status Dashboard</h1>
          <div className="loading-message">Loading system status...</div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">System Status Dashboard</h1>
          <div className="dashboard-subtitle">
            Real-time monitoring of platform health
            {lastUpdate && (
              <span className="last-update">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Overall Status */}
        <div className="status-hero" style={{ borderColor: getHealthColor(status?.health_score || 0) }}>
          <div className="status-hero-content">
            <div className="health-score" style={{ color: getHealthColor(status?.health_score || 0) }}>
              {status?.health_score || 0}%
            </div>
            <div className="status-info">
              <h2 className="status-label">{status?.overall_status}</h2>
              <p className="status-message">{status?.message}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Environment Status */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Environment</h3>
            </div>
            <div className="status-list">
              <div className="status-item">
                <span>Node Environment:</span>
                <span className="status-value">{status?.environment?.node_env}</span>
              </div>
              <div className="status-item">
                <span>Supabase URL:</span>
                <span className="status-value">{status?.environment?.supabase_url}</span>
              </div>
              <div className="status-item">
                <span>Service Key:</span>
                <span className="status-value">{status?.environment?.service_key}</span>
              </div>
              <div className="status-item">
                <span>Anthropic AI:</span>
                <span className="status-value">{status?.environment?.anthropic_key}</span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Database Tables</h3>
            </div>
            <div className="status-list">
              {Object.entries(status?.database?.tables || {}).map(([table, info]) => (
                <div key={table} className="status-item">
                  <span className="table-name">
                    {table}
                    {info.critical && <span className="badge-critical">Critical</span>}
                  </span>
                  <span className="status-value">
                    {info.status} {info.records !== undefined && `(${info.records.toLocaleString()} records)`}
                  </span>
                </div>
              ))}
            </div>
            <div className="card-footer">
              <span>Total Records: {status?.database?.total_records?.toLocaleString()}</span>
              <span>Tables: {status?.database?.tables_connected}</span>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">API Endpoints</h3>
            </div>
            <div className="status-list">
              {Object.entries(status?.apis || {}).map(([api, info]) => (
                <div key={api} className="status-item">
                  <span className="api-endpoint">{info.endpoint}</span>
                  <span className="status-value">{info.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Notes */}
          {status?.operational_notes && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Operational Notes</h3>
              </div>
              <ul className="notes-list">
                {status.operational_notes.map((note, index) => (
                  <li key={index} className="note-item">{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues & Recommendations */}
          {(status?.issues?.length > 0 || status?.recommendations?.length > 0) && (
            <div className="dashboard-card">
              <div className="card-header">
                <h3 className="card-title">Issues & Recommendations</h3>
              </div>
              {status?.issues?.length > 0 && (
                <div className="issues-section">
                  <h4 className="section-label">Issues:</h4>
                  <ul className="issues-list">
                    {status.issues.map((issue, index) => (
                      <li key={index} className="issue-item">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {status?.recommendations?.length > 0 && (
                <div className="recommendations-section">
                  <h4 className="section-label">Recommendations:</h4>
                  <ul className="recommendations-list">
                    {status.recommendations.map((rec, index) => (
                      <li key={index} className="recommendation-item">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-footer">
          <button 
            onClick={fetchStatus}
            className="btn-secondary"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </TriangleLayout>
  );
}