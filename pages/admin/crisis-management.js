/**
 * CRISIS MANAGEMENT ADMIN DASHBOARD
 * Monitor and manage tariff crises, RSS feeds, and automated response systems
 */

import React, { useState, useEffect } from 'react';
import TriangleLayout from '../../components/TriangleLayout';

const AlertTriangle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const Activity = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
  </svg>
);

const Rss = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 11a9 9 0 0 1 9 9"/>
    <path d="M4 4a16 16 0 0 1 16 16"/>
    <circle cx="5" cy="19" r="1"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const Bell = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const PlayCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="10,8 16,12 10,16 10,8"/>
  </svg>
);

const PauseCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="10" y1="15" x2="10" y2="9"/>
    <line x1="14" y1="15" x2="14" y2="9"/>
  </svg>
);

const RefreshCw = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10"/>
    <polyline points="1,20 1,14 7,14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);

export default function CrisisManagement() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [crisisStatus, setCrisisStatus] = useState({});
  const [rssFeeds, setRssFeeds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCrisisData();
  }, []);

  const loadCrisisData = async () => {
    try {
      // Load real crisis data from APIs
      const [rssStatusResponse, crisisAlertsResponse] = await Promise.all([
        fetch('/api/smart-rss-status'),
        fetch('/api/crisis-alerts?action=get_active_alerts')
      ]);
      
      const rssStatus = await rssStatusResponse.json();
      const alertsData = await crisisAlertsResponse.json();
      
      // Get additional data from RSS feeds API for accurate counts
      let rssMetrics = { total_alerts: 0, automated_responses: 0, notifications_sent: 0 };
      try {
        const rssResponse = await fetch('/api/admin/rss-feeds');
        if (rssResponse.ok) {
          const rssData = await rssResponse.json();
          rssMetrics = {
            total_alerts: rssData.summary?.total_alerts || 0,
            automated_responses: rssData.rss_feeds?.filter(f => f.automated_response_triggered).length || 0,
            notifications_sent: rssData.rss_feeds?.reduce((sum, f) => sum + (f.user_notifications_sent || 0), 0) || 0
          };
        }
      } catch (error) {
        console.log('RSS metrics unavailable:', error.message);
      }

      setCrisisStatus({
        current_mode: rssStatus.monitoring?.currentMode || 'baseline',
        monitoring_active: rssStatus.monitoring?.crisisMode || false,
        last_update: rssStatus.timestamp || null,
        feeds_monitored: rssStatus.monitoring?.feedsMonitored || 0,
        alerts_triggered: rssMetrics.total_alerts,
        automated_responses: rssMetrics.automated_responses,
        user_notifications_sent: rssMetrics.notifications_sent
      });

      // Load RSS feeds from API
      try {
        const feedsResponse = await fetch('/api/admin/rss-feeds');
        if (feedsResponse.ok) {
          const feedsData = await feedsResponse.json();
          setRssFeeds(feedsData.rss_feeds || []);
        } else {
          console.log('No /api/admin/rss-feeds API - showing empty state');
          setRssFeeds([]);
        }
      } catch (error) {
        console.log('RSS feeds API not available:', error.message);
        setRssFeeds([]);
      }

      // Load alerts from crisis-alerts API (already exists)
      try {
        // alertsData was already parsed above
        if (alertsData.success && alertsData.generated_alerts) {
          setAlerts(alertsData.generated_alerts || []);
        } else {
          setAlerts(alertsData.alerts || []);
        }
      } catch (error) {
        console.log('Crisis alerts API error:', error.message);
        setAlerts([]);
      }

      // Load automated responses from API
      try {
        const responsesResponse = await fetch('/api/admin/crisis-responses');
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json();
          setResponses(responsesData.responses || []);
        } else {
          console.log('No /api/admin/crisis-responses API - showing empty state');
          setResponses([]);
        }
      } catch (error) {
        console.log('Crisis responses API not available:', error.message);
        setResponses([]);
      }

    } catch (error) {
      console.error('Failed to load crisis data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      const newStatus = !crisisStatus.monitoring_active;
      // Try to toggle monitoring via API
      try {
        const response = await fetch('/api/admin/crisis-monitoring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: newStatus })
        });
        
        if (response.ok) {
          setCrisisStatus(prev => ({ ...prev, monitoring_active: newStatus }));
        } else {
          throw new Error('Failed to toggle monitoring via API');
        }
      } catch (apiError) {
        console.log('Crisis monitoring toggle API not available:', apiError.message);
        alert('Crisis monitoring control API not implemented yet.');
      }
      
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    }
  };

  const triggerManualCheck = async () => {
    try {
      // TODO: API call to trigger manual RSS check
      console.log('Triggering manual RSS check');
      
      setRssFeeds(prev => prev.map(feed => ({
        ...feed,
        last_check: new Date().toISOString(),
        status: 'checking'
      })));
      
      setTimeout(() => {
        setRssFeeds(prev => prev.map(feed => ({
          ...feed,
          status: 'active'
        })));
      }, 2000);
      
    } catch (error) {
      console.error('Failed to trigger manual check:', error);
    }
  };

  if (isLoading) {
    return (
      <TriangleLayout>
        <div className="main-content">
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p className="text-muted">Loading crisis management system...</p>
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
              Crisis Management
            </h1>
            <p className="page-subtitle">
              Monitor tariff crises and manage automated response systems
            </p>
          </div>
          
          <div className="hero-button-group">
            <div className={`alert ${crisisStatus.monitoring_active ? 'alert-info' : 'alert-warning'}`}>
              <Activity className="icon-sm" />
              <span>{crisisStatus.monitoring_active ? 'Monitoring Active' : 'Monitoring Paused'}</span>
            </div>
            
            <button 
              onClick={toggleMonitoring}
              className={crisisStatus.monitoring_active ? 'btn-secondary' : 'btn-primary'}
            >
              {crisisStatus.monitoring_active ? (
                <>
                  <PauseCircle className="icon-sm" />
                  <span>Pause Monitoring</span>
                </>
              ) : (
                <>
                  <PlayCircle className="icon-sm" />
                  <span>Resume Monitoring</span>
                </>
              )}
            </button>
            
            <button 
              onClick={triggerManualCheck}
              className="btn-primary"
            >
              <RefreshCw className="icon-sm" />
              <span>Manual Check</span>
            </button>
          </div>
        </div>

        {/* Crisis Status Overview */}
        <div className="grid-4-cols element-spacing">
          <div className="content-card success">
            <div className="content-card-icon">
              <Shield className="icon-md" />
            </div>
            <div className="calculator-metric-value success">{crisisStatus.current_mode}</div>
            <div className="calculator-metric-title">Current Mode</div>
          </div>
          
          <div className="content-card analysis">
            <div className="content-card-icon">
              <Rss className="icon-md" />
            </div>
            <div className={crisisStatus.feeds_monitored === 0 ? "text-muted" : "calculator-metric-value info"}>
              {crisisStatus.feeds_monitored === 0 ? "No Data" : crisisStatus.feeds_monitored}
            </div>
            <div className="calculator-metric-title">RSS Feeds</div>
            {crisisStatus.feeds_monitored === 0 && (
              <p className="text-muted">API needed</p>
            )}
          </div>
          
          <div className="content-card classification">
            <div className="content-card-icon">
              <AlertTriangle className="icon-md" />
            </div>
            <div className={crisisStatus.alerts_triggered === 0 ? "text-muted" : "calculator-metric-value warning"}>
              {crisisStatus.alerts_triggered === 0 ? "No Data" : crisisStatus.alerts_triggered}
            </div>
            <div className="calculator-metric-title">Alerts Triggered</div>
            {crisisStatus.alerts_triggered === 0 && (
              <p className="text-muted">API needed</p>
            )}
          </div>
          
          <div className="content-card compliance">
            <div className="content-card-icon">
              <Bell className="icon-md" />
            </div>
            <div className={crisisStatus.user_notifications_sent === 0 ? "text-muted" : "calculator-metric-value primary"}>
              {crisisStatus.user_notifications_sent === 0 ? "No Data" : crisisStatus.user_notifications_sent}
            </div>
            <div className="calculator-metric-title">Notifications Sent</div>
            {crisisStatus.user_notifications_sent === 0 && (
              <p className="text-muted">API needed</p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="section-spacing">
          <nav className="nav-menu">
            <button
              onClick={() => setActiveTab('monitoring')}
              className={activeTab === 'monitoring' ? 'nav-menu-link' : 'btn-secondary'}
            >
              RSS Monitoring ({rssFeeds.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={activeTab === 'alerts' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Crisis Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={activeTab === 'responses' ? 'nav-menu-link' : 'btn-secondary'}
            >
              Automated Responses ({responses.length})
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'monitoring' && (
          <RssMonitoring feeds={rssFeeds} />
        )}

        {activeTab === 'alerts' && (
          <CrisisAlerts alerts={alerts} />
        )}

        {activeTab === 'responses' && (
          <AutomatedResponses responses={responses} />
        )}
      </div>
    </TriangleLayout>
  );
}

function RssMonitoring({ feeds }) {
  return (
    <div className="element-spacing">
      {feeds.map(feed => (
        <div key={feed.id} className="content-card">
          <div className="card-header">
            <div className="flex-1">
              <div className="hero-button-group">
                <h3 className="content-card-title">
                  {feed.name}
                </h3>
                <span className={`status-${feed.status === 'active' ? 'success' : 'warning'}`}>
                  {feed.status === 'active' ? (
                    <>
                      <CheckCircle className="icon-sm" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="icon-sm" />
                      <span>Checking</span>
                    </>
                  )}
                </span>
                <span className={`status-${feed.priority === 'high' ? 'warning' : 'info'}`}>
                  {feed.priority} priority
                </span>
              </div>
              <p className="text-muted element-spacing">
                {feed.url}
              </p>
              <div className="grid-2-cols">
                <div className="text-body">
                  <span>Last Check: </span>
                  <span className="text-muted">
                    {new Date(feed.last_check).toLocaleString()}
                  </span>
                </div>
                <div className="text-body">
                  <span>Items Found: </span>
                  <span className="calculator-metric-value primary">{feed.items_found}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-button-group">
            <button className="btn-primary">
              <RefreshCw className="icon-sm" />
              <span>Check Now</span>
            </button>
            <button className="btn-secondary">
              <span>View Items</span>
            </button>
            <button className="btn-secondary">
              <span>Edit Settings</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CrisisAlerts({ alerts }) {
  return (
    <div className="element-spacing">
      {alerts.map(alert => (
        <div key={alert.id} className="content-card">
          <div className="card-header">
            <div className="flex-1">
              <div className="hero-button-group">
                <h3 className="content-card-title">
                  {alert.title}
                </h3>
                <span className={`status-${alert.severity === 'high' ? 'error' : 'warning'}`}>
                  <AlertTriangle className="icon-sm" />
                  <span>{alert.severity} severity</span>
                </span>
                {alert.automated_response && (
                  <span className="status-success">
                    <CheckCircle className="icon-sm" />
                    <span>Auto-responded</span>
                  </span>
                )}
              </div>
              <p className="text-body element-spacing">
                {alert.description}
              </p>
              <div className="grid-3-cols">
                <div className="text-body">
                  <span>Type: </span>
                  <span className="status-info">{alert.type}</span>
                </div>
                <div className="text-body">
                  <span>Affected HS Codes: </span>
                  <span className="calculator-metric-value primary">{alert.affected_hs_codes.join(', ')}</span>
                </div>
                <div className="text-body">
                  <span>Notifications: </span>
                  <span className="calculator-metric-value success">{alert.notifications_sent}</span>
                </div>
              </div>
              <div className="text-muted">
                Created: {new Date(alert.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="hero-button-group">
            <button className="btn-primary">
              <Bell className="icon-sm" />
              <span>Send Manual Alert</span>
            </button>
            <button className="btn-secondary">
              <span>View Responses</span>
            </button>
            <button className="btn-secondary">
              <span>Alert Details</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AutomatedResponses({ responses }) {
  return (
    <div className="element-spacing">
      {responses.map(response => (
        <div key={response.id} className="content-card">
          <div className="card-header">
            <div className="flex-1">
              <div className="hero-button-group">
                <h3 className="content-card-title">
                  {response.action}
                </h3>
                <span className="status-success">
                  <CheckCircle className="icon-sm" />
                  <span>{response.status}</span>
                </span>
              </div>
              <p className="text-body element-spacing">
                {response.details}
              </p>
              <div className="grid-2-cols">
                <div className="text-body">
                  <span>Response Type: </span>
                  <span className="status-info">{response.type}</span>
                </div>
                <div className="text-body">
                  <span>Executed: </span>
                  <span className="text-muted">
                    {new Date(response.executed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-button-group">
            <button className="btn-secondary">
              <span>View Logs</span>
            </button>
            <button className="btn-secondary">
              <span>Duplicate Action</span>
            </button>
          </div>
        </div>
      ))}
      
      <div className="alert alert-info">
        <div className="alert-icon">
          <Activity className="icon-md" />
        </div>
        <div className="alert-content">
          <div className="alert-title">Automated Response System</div>
          The crisis management system automatically triggers responses based on detected policy changes and tariff updates. All responses are logged and can be reviewed here.
        </div>
      </div>
    </div>
  );
}