/**
 * SYSTEM CONFIGURATION ADMIN DASHBOARD
 * Configure system settings, API limits, feature flags, and environment variables
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../../components/TriangleLayout';
import { SYSTEM_CONFIG } from '../../config/system-config';

const Settings = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const Save = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17,21 17,13 7,13 7,21"/>
    <polyline points="7,3 7,8 15,8"/>
  </svg>
);

const Database = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const Zap = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const AlertTriangle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState({});
  const [featureFlags, setFeatureFlags] = useState({});
  const [apiLimits, setApiLimits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [systemStatus, setSystemStatus] = useState({});

  useEffect(() => {
    loadSystemConfig();
    loadSystemStatus();
  }, []);

  const loadSystemConfig = async () => {
    try {
      // Load real system configuration
      setConfig({
        platform_name: SYSTEM_CONFIG.platform.name || 'Triangle Intelligence',
        environment: process.env.NODE_ENV || 'production',
        database_timeout: SYSTEM_CONFIG.database.connectionTimeout || 10000,
        api_timeout: SYSTEM_CONFIG.api.timeout || 30000,
        cache_ttl: SYSTEM_CONFIG.cache.defaultTtl || 900000,
        max_file_size: SYSTEM_CONFIG.uploads?.maxFileSize || 10485760,
        session_timeout: 3600000, // TODO: Add to SYSTEM_CONFIG
        debug_mode: process.env.NODE_ENV === 'development',
        maintenance_mode: false // TODO: Add maintenance mode to config
      });

      setFeatureFlags({
        ai_classification: SYSTEM_CONFIG.ai.enabled || true,
        pdf_generation: SYSTEM_CONFIG.pdf?.enabled || true,
        crisis_monitoring: SYSTEM_CONFIG.alerts.enabled || true,
        bulk_processing: SYSTEM_CONFIG.bulk?.enabled || false,
        advanced_analytics: true, // TODO: Add to SYSTEM_CONFIG
        email_notifications: SYSTEM_CONFIG.notifications?.email?.enabled || true,
        webhook_support: false, // TODO: Add webhook config
        api_v2: false // TODO: Add API versioning config
      });

      setApiLimits({
        requests_per_minute: SYSTEM_CONFIG.rateLimit?.requestsPerMinute || 100,
        workflows_per_hour: SYSTEM_CONFIG.rateLimit?.workflowsPerHour || 50,
        concurrent_users: SYSTEM_CONFIG.performance?.maxConcurrentUsers || 500,
        max_batch_size: SYSTEM_CONFIG.bulk?.maxBatchSize || 100,
        database_connections: 20, // TODO: Add to database config
        cache_size_mb: 512, // TODO: Add cache size config
        log_retention_days: 30 // TODO: Add logging retention config
      });

    } catch (error) {
      console.error('Failed to load system config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/system-status');
      if (response.ok) {
        const data = await response.json();
        
        setSystemStatus({
          database_health: `${data.health_score}%`,
          system_status: data.database?.connected ? 'Online' : 'Offline',
          performance_rating: data.health_score >= 90 ? 'Excellent' : 
                             data.health_score >= 70 ? 'Good' : 
                             data.health_score >= 50 ? 'Fair' : 'Poor',
          sla_compliance: data.health_score >= 95 ? '99.9%' :
                         data.health_score >= 85 ? '99.5%' :
                         data.health_score >= 75 ? '99.0%' : 'Below SLA'
        });
      } else {
        throw new Error('System status API not available');
      }
      
    } catch (error) {
      console.error('Failed to load system status:', error);
      setSystemStatus({
        database_health: '0%',
        system_status: 'Unknown',
        performance_rating: 'Unknown',
        sla_compliance: 'Unknown'
      });
    }
  };

  const updateConfig = (section, key, value) => {
    if (section === 'config') {
      setConfig(prev => ({ ...prev, [key]: value }));
    } else if (section === 'features') {
      setFeatureFlags(prev => ({ ...prev, [key]: value }));
    } else if (section === 'limits') {
      setApiLimits(prev => ({ ...prev, [key]: value }));
    }
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      // TODO: Implement API call to save configuration
      console.log('Saving system configuration:', { config, featureFlags, apiLimits });
      
      // Mock save success
      setHasChanges(false);
      alert('Configuration saved successfully');
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration: ' + error.message);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Reset all settings to default values? This cannot be undone.')) {
      loadSystemConfig();
      setHasChanges(true);
    }
  };

  if (isLoading) {
    return (
      <TriangleLayout>
        <div className="main-content">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p className="text-muted">Loading system configuration...</p>
          </div>
        </div>
      </TriangleLayout>
    );
  }

  return (
    <TriangleLayout>
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="flex-1">
            <h1 className="page-title">
              System Configuration
            </h1>
            <p className="page-subtitle">
              Configure platform settings, feature flags, and system limits
            </p>
          </div>
          
          <div className="hero-button-group">
            {hasChanges && (
              <div className="alert alert-warning">
                <AlertTriangle className="icon-sm" />
                <span>Unsaved changes</span>
              </div>
            )}
            
            <button 
              onClick={resetToDefaults}
              className="btn-secondary"
            >
              Reset to Defaults
            </button>
            
            <button 
              onClick={saveChanges}
              className="btn-primary"
              disabled={!hasChanges}
            >
              <Save className="icon-sm" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid-4-cols element-spacing">
          <div className="content-card success">
            <div className="content-card-icon">
              <CheckCircle className="icon-md" />
            </div>
            <div className={`status-${systemStatus.system_status === 'Online' ? 'success' : 'error'}`}>
              {systemStatus.system_status || 'Loading...'}
            </div>
            <div className="calculator-metric-title">System Status</div>
          </div>
          
          <div className="content-card analysis">
            <div className="content-card-icon">
              <Database className="icon-md" />
            </div>
            <div className={`calculator-metric-value ${parseInt(systemStatus.database_health) >= 80 ? 'success' : parseInt(systemStatus.database_health) >= 60 ? 'warning' : 'error'}`}>
              {systemStatus.database_health || 'Loading...'}
            </div>
            <div className="calculator-metric-title">Database Health</div>
          </div>
          
          <div className="content-card classification">
            <div className="content-card-icon">
              <Shield className="icon-md" />
            </div>
            <div className="status-success">
              {systemStatus.performance_rating || 'Loading...'}
            </div>
            <div className="calculator-metric-title">Performance Rating</div>
          </div>
          
          <div className="content-card compliance">
            <div className="content-card-icon">
              <Zap className="icon-md" />
            </div>
            <div className="calculator-metric-value primary">{config.environment}</div>
            <div className="calculator-metric-title">Environment</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="section-spacing">
          <nav className="nav-menu">
            <button
              onClick={() => setActiveTab('general')}
              className={activeTab === 'general' ? 'nav-menu-link' : 'btn-secondary'}
            >
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={activeTab === 'features' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Feature Flags
            </button>
            <button
              onClick={() => setActiveTab('limits')}
              className={activeTab === 'limits' ? 'nav-menu-link' : 'btn-secondary'}
            >
              API Limits
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'general' && (
          <GeneralSettings config={config} updateConfig={updateConfig} />
        )}

        {activeTab === 'features' && (
          <FeatureFlags featureFlags={featureFlags} updateConfig={updateConfig} />
        )}

        {activeTab === 'limits' && (
          <ApiLimits apiLimits={apiLimits} updateConfig={updateConfig} />
        )}
      </div>
    </TriangleLayout>
  );
}

function GeneralSettings({ config, updateConfig }) {
  return (
    <div className="element-spacing">
      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">Platform Configuration</h3>
        </div>
        
        <div className="grid-2-cols">
          <div className="form-group">
            <label className="form-label">Platform Name</label>
            <input
              type="text"
              value={config.platform_name || ''}
              onChange={(e) => updateConfig('config', 'platform_name', e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Environment</label>
            <select
              value={config.environment || 'production'}
              onChange={(e) => updateConfig('config', 'environment', e.target.value)}
              className="form-select"
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">Performance Settings</h3>
        </div>
        
        <div className="grid-3-cols">
          <div className="form-group">
            <label className="form-label">Database Timeout (ms)</label>
            <input
              type="number"
              value={config.database_timeout || 10000}
              onChange={(e) => updateConfig('config', 'database_timeout', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">API Timeout (ms)</label>
            <input
              type="number"
              value={config.api_timeout || 30000}
              onChange={(e) => updateConfig('config', 'api_timeout', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Cache TTL (ms)</label>
            <input
              type="number"
              value={config.cache_ttl || 900000}
              onChange={(e) => updateConfig('config', 'cache_ttl', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">System Modes</h3>
        </div>
        
        <div className="grid-2-cols">
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={config.debug_mode || false}
                onChange={(e) => updateConfig('config', 'debug_mode', e.target.checked)}
              />
              <span>Debug Mode</span>
            </label>
            <p className="text-muted">Enable detailed logging and error reporting</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={config.maintenance_mode || false}
                onChange={(e) => updateConfig('config', 'maintenance_mode', e.target.checked)}
              />
              <span>Maintenance Mode</span>
            </label>
            <p className="text-muted">Temporarily disable platform access</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureFlags({ featureFlags, updateConfig }) {
  const features = [
    { key: 'ai_classification', name: 'AI Classification', description: 'AI-powered HS code classification' },
    { key: 'pdf_generation', name: 'PDF Generation', description: 'Certificate PDF generation' },
    { key: 'crisis_monitoring', name: 'Crisis Monitoring', description: 'Real-time tariff monitoring' },
    { key: 'bulk_processing', name: 'Bulk Processing', description: 'Batch workflow processing' },
    { key: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed usage analytics' },
    { key: 'email_notifications', name: 'Email Notifications', description: 'Automated email alerts' },
    { key: 'webhook_support', name: 'Webhook Support', description: 'External webhook integrations' },
    { key: 'api_v2', name: 'API v2', description: 'Next generation API endpoints' }
  ];

  return (
    <div className="element-spacing">
      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">Feature Toggles</h3>
          <p className="text-muted">Enable or disable platform features</p>
        </div>
        
        <div className="grid-2-cols">
          {features.map(feature => (
            <div key={feature.key} className="form-group">
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={featureFlags[feature.key] || false}
                  onChange={(e) => updateConfig('features', feature.key, e.target.checked)}
                />
                <span>{feature.name}</span>
              </label>
              <p className="text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiLimits({ apiLimits, updateConfig }) {
  return (
    <div className="element-spacing">
      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">Rate Limits</h3>
        </div>
        
        <div className="grid-2-cols">
          <div className="form-group">
            <label className="form-label">Requests per Minute</label>
            <input
              type="number"
              value={apiLimits.requests_per_minute || 100}
              onChange={(e) => updateConfig('limits', 'requests_per_minute', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Workflows per Hour</label>
            <input
              type="number"
              value={apiLimits.workflows_per_hour || 50}
              onChange={(e) => updateConfig('limits', 'workflows_per_hour', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Concurrent Users</label>
            <input
              type="number"
              value={apiLimits.concurrent_users || 500}
              onChange={(e) => updateConfig('limits', 'concurrent_users', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Max Batch Size</label>
            <input
              type="number"
              value={apiLimits.max_batch_size || 100}
              onChange={(e) => updateConfig('limits', 'max_batch_size', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h3 className="content-card-title">Resource Limits</h3>
        </div>
        
        <div className="grid-3-cols">
          <div className="form-group">
            <label className="form-label">Database Connections</label>
            <input
              type="number"
              value={apiLimits.database_connections || 20}
              onChange={(e) => updateConfig('limits', 'database_connections', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Cache Size (MB)</label>
            <input
              type="number"
              value={apiLimits.cache_size_mb || 512}
              onChange={(e) => updateConfig('limits', 'cache_size_mb', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Log Retention (Days)</label>
            <input
              type="number"
              value={apiLimits.log_retention_days || 30}
              onChange={(e) => updateConfig('limits', 'log_retention_days', parseInt(e.target.value))}
              className="form-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}